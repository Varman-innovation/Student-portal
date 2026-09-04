-- Run in a new Supabase project's SQL editor.
-- The application accesses these tables only through a server-side service-role key.

create extension if not exists pgcrypto;

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null unique check (email = lower(email)),
  phone_number text not null check (phone_number ~ '^\+?[1-9][0-9]{7,14}$'),
  password_hash text not null check (password_hash like 'scrypt$%'),
  created_at timestamptz not null default now()
);

create index if not exists admins_created_at_idx on public.admins (created_at desc);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  mobile text not null unique check (mobile ~ '^\+91[6-9][0-9]{9}$'),
  profile jsonb not null default '{}'::jsonb,
  source text,
  campaign text,
  onboarding_step smallint not null default 1 check (onboarding_step between 1 and 2),
  verified_at timestamptz,
  onboarding_started_at timestamptz,
  onboarding_completed_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists students_created_at_idx on public.students (created_at desc);
create index if not exists students_funnel_idx on public.students (verified_at, onboarding_completed_at);

create table if not exists public.onboarding_questions (
  id uuid primary key default gen_random_uuid(),
  form_version integer not null default 1,
  key text not null,
  label text not null,
  field_type text not null check (field_type in ('text', 'select', 'phone')),
  step smallint not null check (step between 1 and 2),
  position smallint not null,
  required boolean not null default true,
  options jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (form_version, key),
  unique (form_version, step, position)
);

create table if not exists public.webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 480),
  timezone text not null default 'Asia/Kolkata',
  meeting_url text not null check (meeting_url ~ '^https://'),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'completed', 'cancelled')),
  capacity integer check (capacity is null or capacity > 0),
  created_at timestamptz not null default now()
);

create index if not exists webinars_next_idx on public.webinars (status, starts_at);

create table if not exists public.webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  webinar_id uuid not null references public.webinars(id) on delete restrict,
  registered_at timestamptz not null default now(),
  join_clicked_at timestamptz,
  unique (student_id, webinar_id)
);

create index if not exists registrations_webinar_idx on public.webinar_registrations (webinar_id, registered_at);
create index if not exists registrations_student_idx on public.webinar_registrations (student_id, registered_at desc);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  event_type text not null,
  webinar_id uuid references public.webinars(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_student_timeline_idx on public.events (student_id, created_at desc);
create index if not exists events_type_time_idx on public.events (event_type, created_at desc);

alter table public.students enable row level security;
alter table public.admins enable row level security;
alter table public.onboarding_questions enable row level security;
alter table public.webinars enable row level security;
alter table public.webinar_registrations enable row level security;
alter table public.events enable row level security;

-- No anon/authenticated policies are intentionally created. The browser cannot access data directly.
revoke all on public.students, public.onboarding_questions, public.webinars, public.webinar_registrations, public.events from anon, authenticated;
revoke all on public.admins from anon, authenticated;

create or replace function public.register_for_webinar(p_student_id uuid, p_webinar_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.webinars%rowtype;
  registration public.webinar_registrations%rowtype;
  inserted boolean := false;
begin
  select * into target from public.webinars where id = p_webinar_id for update;
  if not found or target.status not in ('scheduled', 'live') then
    raise exception 'Webinar is not available';
  end if;
  if target.capacity is not null and (select count(*) from public.webinar_registrations where webinar_id = p_webinar_id) >= target.capacity then
    raise exception 'Webinar capacity has been reached';
  end if;

  insert into public.webinar_registrations (student_id, webinar_id)
  values (p_student_id, p_webinar_id)
  on conflict (student_id, webinar_id) do nothing
  returning * into registration;

  if found then
    inserted := true;
  else
    select * into registration from public.webinar_registrations where student_id = p_student_id and webinar_id = p_webinar_id;
  end if;

  if inserted then
    insert into public.events (student_id, event_type, webinar_id) values (p_student_id, 'webinar_registered', p_webinar_id);
  end if;
  return to_jsonb(registration);
end;
$$;

create or replace function public.record_webinar_join(p_student_id uuid, p_webinar_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  registration public.webinar_registrations%rowtype;
  target public.webinars%rowtype;
begin
  select * into target from public.webinars where id = p_webinar_id and status in ('scheduled', 'live');
  if not found then raise exception 'Webinar is not available'; end if;

  update public.webinar_registrations
  set join_clicked_at = coalesce(join_clicked_at, now())
  where student_id = p_student_id and webinar_id = p_webinar_id
  returning * into registration;
  if not found then raise exception 'Register before joining the webinar'; end if;

  insert into public.events (student_id, event_type, webinar_id) values (p_student_id, 'webinar_join_clicked', p_webinar_id);
  return jsonb_build_object('registration', to_jsonb(registration), 'meeting_url', target.meeting_url);
end;
$$;

revoke all on function public.register_for_webinar(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_webinar_join(uuid, uuid) from public, anon, authenticated;
grant execute on function public.register_for_webinar(uuid, uuid) to service_role;
grant execute on function public.record_webinar_join(uuid, uuid) to service_role;

insert into public.onboarding_questions (form_version, key, label, field_type, step, position, required, options)
values
  (1, 'full_name', 'Full name', 'text', 1, 1, true, '[]'),
  (1, 'college_name', 'College or institution', 'text', 1, 2, true, '[]'),
  (1, 'language', 'Preferred language', 'select', 1, 3, true, '["Tamil","English","Telugu","Kannada","Malayalam","Hindi","Other"]'),
  (1, 'degree', 'Degree (optional)', 'select', 2, 1, false, '["B.Tech / B.E","B.Sc","B.Com","BBA","BA","Diploma","MBA","M.Tech","Other"]'),
  (1, 'year_of_study', 'Year of study', 'select', 2, 2, true, '["1st Year","2nd Year","3rd Year","4th Year","5th Year","Graduated","Other"]'),
  (1, 'primary_interest', 'What would you most like help with?', 'select', 2, 3, true, '["Finding a startup idea","Validating my idea","Building an MVP","Finding a team","Launching and getting users","Exploring entrepreneurship"]')
on conflict (form_version, key) do update set label = excluded.label, field_type = excluded.field_type, step = excluded.step, position = excluded.position, required = excluded.required, options = excluded.options, enabled = true;

insert into public.webinars (title, description, starts_at, duration_minutes, timezone, meeting_url, status)
select 'Entrepreneurship Masterclass', 'A practical introduction to turning an idea into a scalable venture.', now() + interval '2 hours', 60, 'Asia/Kolkata', 'https://meet.google.com/', 'scheduled'
where not exists (select 1 from public.webinars);
