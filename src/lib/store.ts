import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { onboardingFields, type ActivityEvent, type Funnel, type OnboardingField, type Registration, type Student, type StudentProfile, type Webinar } from "@/lib/domain";

type Store = {
  getOnboardingFields(): Promise<OnboardingField[]>;
  startLogin(mobile: string, attribution?: { source?: string; campaign?: string }): Promise<Student>;
  verifyStudent(studentId: string): Promise<Student>;
  getStudent(studentId: string): Promise<Student | null>;
  saveOnboarding(studentId: string, step: 1 | 2, profile: StudentProfile): Promise<Student>;
  getNextWebinar(studentId: string): Promise<{ webinar: Webinar | null; registration: Registration | null }>;
  register(studentId: string, webinarId: string): Promise<Registration>;
  recordJoin(studentId: string, webinarId: string): Promise<{ meetingUrl: string; registration: Registration }>;
  funnel(): Promise<Funnel>;
  students(): Promise<Student[]>;
  studentEvents(studentId: string): Promise<ActivityEvent[]>;
  webinars(): Promise<Webinar[]>;
  createWebinar(input: Omit<Webinar, "id" | "created_at">): Promise<Webinar>;
  updateWebinar(id: string, input: Partial<Webinar>): Promise<Webinar>;
};

type DemoState = {
  students: Map<string, Student>;
  registrations: Map<string, Registration>;
  events: ActivityEvent[];
  webinars: Map<string, Webinar>;
};

const demoGlobal = globalThis as typeof globalThis & { __vilDemoState?: DemoState };
const demoState = demoGlobal.__vilDemoState ?? {
  students: new Map<string, Student>(),
  registrations: new Map<string, Registration>(),
  events: [],
  webinars: new Map<string, Webinar>()
};
demoGlobal.__vilDemoState = demoState;

const demoStudents = demoState.students;
const demoRegistrations = demoState.registrations;
const demoEvents = demoState.events;
const demoWebinars = demoState.webinars;

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function addEvent(studentId: string, event_type: ActivityEvent["event_type"], webinarId?: string, metadata?: Record<string, unknown>) {
  demoEvents.push({ id: id(), student_id: studentId, event_type, webinar_id: webinarId, metadata, created_at: now() });
}

function seedDemoWebinar() {
  if (demoWebinars.size) return;
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 2);
  const webinar: Webinar = {
    id: id(),
    title: "Entrepreneurship Masterclass",
    description: "A practical introduction to turning an idea into a scalable venture.",
    starts_at: start.toISOString(),
    duration_minutes: 60,
    timezone: "Asia/Kolkata",
    meeting_url: env.DEFAULT_MEETING_URL,
    status: "scheduled",
    created_at: now()
  };
  demoWebinars.set(webinar.id, webinar);
}

const demoStore: Store = {
  async getOnboardingFields() {
    return structuredClone(onboardingFields);
  },
  async startLogin(mobile, attribution) {
    let student = [...demoStudents.values()].find((item) => item.mobile === mobile);
    if (!student) {
      student = {
        id: id(),
        mobile,
        profile: { phone: mobile },
        onboarding_step: 1,
        created_at: now(),
        last_activity_at: now(),
        source: attribution?.source,
        campaign: attribution?.campaign
      };
      demoStudents.set(student.id, student);
      addEvent(student.id, "student_created", undefined, attribution);
    }
    student.last_activity_at = now();
    addEvent(student.id, "otp_requested");
    return structuredClone(student);
  },
  async verifyStudent(studentId) {
    const student = demoStudents.get(studentId);
    if (!student) throw new Error("Student not found");
    if (!student.verified_at) {
      student.verified_at = now();
      addEvent(studentId, "otp_verified");
    }
    student.last_activity_at = now();
    return structuredClone(student);
  },
  async getStudent(studentId) {
    const student = demoStudents.get(studentId);
    return student ? structuredClone(student) : null;
  },
  async saveOnboarding(studentId, step, profile) {
    const student = demoStudents.get(studentId);
    if (!student) throw new Error("Student not found");
    if (!student.onboarding_started_at) {
      student.onboarding_started_at = now();
      addEvent(studentId, "onboarding_started");
    }
    student.profile = { ...student.profile, ...profile, phone: student.mobile };
    student.onboarding_step = step === 1 ? 2 : 2;
    student.last_activity_at = now();
    addEvent(studentId, "onboarding_step_completed", undefined, { step });
    if (step === 2 && !student.onboarding_completed_at) {
      student.onboarding_completed_at = now();
      addEvent(studentId, "onboarding_completed");
    }
    return structuredClone(student);
  },
  async getNextWebinar(studentId) {
    seedDemoWebinar();
    const webinar = [...demoWebinars.values()]
      .filter((item) => ["scheduled", "live"].includes(item.status) && new Date(item.starts_at).getTime() > Date.now() - 60 * 60 * 1000)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null;
    if (webinar) addEvent(studentId, "webinar_viewed", webinar.id);
    const registration = webinar ? demoRegistrations.get(`${studentId}:${webinar.id}`) ?? null : null;
    return { webinar: webinar ? structuredClone(webinar) : null, registration: registration ? structuredClone(registration) : null };
  },
  async register(studentId, webinarId) {
    const webinar = demoWebinars.get(webinarId);
    if (!webinar || webinar.status === "cancelled") throw new Error("Webinar is not available");
    const key = `${studentId}:${webinarId}`;
    let registration = demoRegistrations.get(key);
    if (!registration) {
      registration = { id: id(), student_id: studentId, webinar_id: webinarId, registered_at: now() };
      demoRegistrations.set(key, registration);
      addEvent(studentId, "webinar_registered", webinarId);
    }
    return structuredClone(registration);
  },
  async recordJoin(studentId, webinarId) {
    const webinar = demoWebinars.get(webinarId);
    const registration = demoRegistrations.get(`${studentId}:${webinarId}`);
    if (!webinar || !registration) throw new Error("Register before joining the webinar");
    if (!registration.join_clicked_at) registration.join_clicked_at = now();
    addEvent(studentId, "webinar_join_clicked", webinarId);
    return { meetingUrl: webinar.meeting_url, registration: structuredClone(registration) };
  },
  async funnel() {
    const students = [...demoStudents.values()];
    return {
      students: students.length,
      verified: students.filter((s) => s.verified_at).length,
      onboarding_completed: students.filter((s) => s.onboarding_completed_at).length,
      registered: new Set([...demoRegistrations.values()].map((r) => r.student_id)).size,
      join_clicked: new Set([...demoRegistrations.values()].filter((r) => r.join_clicked_at).map((r) => r.student_id)).size
    };
  },
  async students() {
    return [...demoStudents.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((item) => structuredClone(item));
  },
  async studentEvents(studentId) {
    return demoEvents.filter((event) => event.student_id === studentId).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((item) => structuredClone(item));
  },
  async webinars() {
    seedDemoWebinar();
    return [...demoWebinars.values()].sort((a, b) => a.starts_at.localeCompare(b.starts_at)).map((item) => structuredClone(item));
  },
  async createWebinar(input) {
    const webinar = { ...input, id: id(), created_at: now() };
    demoWebinars.set(webinar.id, webinar);
    return structuredClone(webinar);
  },
  async updateWebinar(webinarId, input) {
    const webinar = demoWebinars.get(webinarId);
    if (!webinar) throw new Error("Webinar not found");
    const updated = { ...webinar, ...input, id: webinar.id };
    demoWebinars.set(webinarId, updated);
    return structuredClone(updated);
  }
};

function supabaseClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function supabaseStore(client: SupabaseClient): Store {
  async function event(studentId: string, event_type: ActivityEvent["event_type"], webinarId?: string, metadata?: Record<string, unknown>) {
    const { error } = await client.from("events").insert({ student_id: studentId, event_type, webinar_id: webinarId, metadata: metadata ?? {} });
    if (error) throw error;
  }
  return {
    async getOnboardingFields() {
      const result = await client.from("onboarding_questions").select("key,label,field_type,step,required,options").eq("form_version", 1).eq("enabled", true).order("step").order("position");
      if (result.error) throw result.error;
      return result.data.map((row) => ({
        key: row.key as OnboardingField["key"],
        label: row.label,
        type: row.field_type as OnboardingField["type"],
        step: row.step as 1 | 2,
        required: row.required,
        options: Array.isArray(row.options) ? row.options as string[] : undefined,
        readOnly: row.field_type === "phone"
      }));
    },
    async startLogin(mobile, attribution) {
      const existing = await client.from("students").select("*").eq("mobile", mobile).maybeSingle();
      if (existing.error) throw existing.error;
      let student = existing.data as Student | null;
      if (!student) {
        const created = await client.from("students").insert({ mobile, profile: { phone: mobile }, source: attribution?.source, campaign: attribution?.campaign }).select("*").single();
        if (created.error) throw created.error;
        student = created.data as Student;
        await event(student.id, "student_created", undefined, attribution);
      }
      await client.from("students").update({ last_activity_at: now() }).eq("id", student.id);
      await event(student.id, "otp_requested");
      return student;
    },
    async verifyStudent(studentId) {
      const existing = await client.from("students").select("*").eq("id", studentId).single();
      if (existing.error) throw existing.error;
      if (!existing.data.verified_at) {
        const updated = await client.from("students").update({ verified_at: now(), last_activity_at: now() }).eq("id", studentId).select("*").single();
        if (updated.error) throw updated.error;
        await event(studentId, "otp_verified");
        return updated.data as Student;
      }
      return existing.data as Student;
    },
    async getStudent(studentId) {
      const result = await client.from("students").select("*").eq("id", studentId).maybeSingle();
      if (result.error) throw result.error;
      return result.data as Student | null;
    },
    async saveOnboarding(studentId, step, profile) {
      const current = await client.from("students").select("*").eq("id", studentId).single();
      if (current.error) throw current.error;
      const wasStarted = Boolean(current.data.onboarding_started_at);
      const wasCompleted = Boolean(current.data.onboarding_completed_at);
      const update = {
        profile: { ...(current.data.profile ?? {}), ...profile, phone: current.data.mobile },
        onboarding_started_at: current.data.onboarding_started_at ?? now(),
        onboarding_step: 2,
        onboarding_completed_at: step === 2 ? current.data.onboarding_completed_at ?? now() : null,
        last_activity_at: now()
      };
      const saved = await client.from("students").update(update).eq("id", studentId).select("*").single();
      if (saved.error) throw saved.error;
      if (!wasStarted) await event(studentId, "onboarding_started");
      await event(studentId, "onboarding_step_completed", undefined, { step });
      if (step === 2 && !wasCompleted) await event(studentId, "onboarding_completed");
      return saved.data as Student;
    },
    async getNextWebinar(studentId) {
      const result = await client.from("webinars").select("*").in("status", ["scheduled", "live"]).gte("starts_at", new Date(Date.now() - 3600000).toISOString()).order("starts_at").limit(1).maybeSingle();
      if (result.error) throw result.error;
      const webinar = result.data as Webinar | null;
      if (!webinar) return { webinar: null, registration: null };
      await event(studentId, "webinar_viewed", webinar.id);
      const registration = await client.from("webinar_registrations").select("*").eq("student_id", studentId).eq("webinar_id", webinar.id).maybeSingle();
      if (registration.error) throw registration.error;
      return { webinar, registration: registration.data as Registration | null };
    },
    async register(studentId, webinarId) {
      const result = await client.rpc("register_for_webinar", { p_student_id: studentId, p_webinar_id: webinarId });
      if (result.error) throw result.error;
      return result.data as Registration;
    },
    async recordJoin(studentId, webinarId) {
      const result = await client.rpc("record_webinar_join", { p_student_id: studentId, p_webinar_id: webinarId });
      if (result.error) throw result.error;
      const row = result.data as { registration: Registration; meeting_url: string };
      return { meetingUrl: row.meeting_url, registration: row.registration };
    },
    async funnel() {
      const [students, verified, completed, registered, joined] = await Promise.all([
        client.from("students").select("id", { count: "exact", head: true }),
        client.from("students").select("id", { count: "exact", head: true }).not("verified_at", "is", null),
        client.from("students").select("id", { count: "exact", head: true }).not("onboarding_completed_at", "is", null),
        client.from("webinar_registrations").select("student_id", { count: "exact", head: true }),
        client.from("webinar_registrations").select("student_id", { count: "exact", head: true }).not("join_clicked_at", "is", null)
      ]);
      return { students: students.count ?? 0, verified: verified.count ?? 0, onboarding_completed: completed.count ?? 0, registered: registered.count ?? 0, join_clicked: joined.count ?? 0 };
    },
    async students() {
      const result = await client.from("students").select("*").order("created_at", { ascending: false }).limit(500);
      if (result.error) throw result.error;
      return result.data as Student[];
    },
    async studentEvents(studentId) {
      const result = await client.from("events").select("*").eq("student_id", studentId).order("created_at", { ascending: false }).limit(200);
      if (result.error) throw result.error;
      return result.data as ActivityEvent[];
    },
    async webinars() {
      const result = await client.from("webinars").select("*").order("starts_at");
      if (result.error) throw result.error;
      return result.data as Webinar[];
    },
    async createWebinar(input) {
      const result = await client.from("webinars").insert(input).select("*").single();
      if (result.error) throw result.error;
      return result.data as Webinar;
    },
    async updateWebinar(webinarId, input) {
      const result = await client.from("webinars").update(input).eq("id", webinarId).select("*").single();
      if (result.error) throw result.error;
      return result.data as Webinar;
    }
  };
}

export const store: Store = env.demoMode ? demoStore : supabaseStore(supabaseClient());
