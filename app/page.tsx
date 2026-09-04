'use client';

import type { SubmitEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Compass,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  Menu,
  RefreshCcw,
  Rocket,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FormFields = {
  firstName: string;

  phone: string;
};
type Challenge = {
  studentId: string | number;
  mobile?: string;
  pilotCode?: string;
};

const initialFields: FormFields = {
  firstName: '',

  phone: '',
};

const whyAttend = [
  {
    icon: Compass,
    title: 'Understand Your Options',
    text: 'See the directions students can take after Class 12.',
  },
  {
    icon: Bot,
    title: 'Discover Modern Careers',
    text: 'Explore opportunities shaped by technology, AI and entrepreneurship.',
  },
  {
    icon: Wrench,
    title: 'Learn by Building',
    text: 'Understand how projects can turn knowledge into practical experience.',
  },
  {
    icon: Lightbulb,
    title: 'Get Direction',
    text: 'Leave with a clearer way to evaluate your next step.',
  },
];

const paths = [
  { icon: Bot, label: 'Technology & AI', tone: 'lime' },
  { icon: Rocket, label: 'Entrepreneurship', tone: 'blue' },
  { icon: BriefcaseBusiness, label: 'Business', tone: 'coral' },
  { icon: Wrench, label: 'Startup Building', tone: 'violet' },
  { icon: GraduationCap, label: 'Higher Education', tone: 'yellow' },
  { icon: Sparkles, label: 'Industry Skills', tone: 'mint' },
];

const mentors = [
  {
    name: 'Anuj Patel',
    role: 'Deputy Vice President – Large Corporate Lending',
    company: 'HDFC Bank',
    image: '/mentor-anuj.webp',
  },
  {
    name: 'Chenthil Kumar',
    role: 'Senior Software Engineer',
    company: 'Microsoft',
    image: '/mentor-chenthil.webp',
  },
  {
    name: 'Ayappan Perumal',
    role: 'Senior Advisory Software Engineer',
    company: 'IBM',
    image: '/mentor-ayappan.webp',
  },
];

function scrollToRegistration() {
  document
    .querySelector('#register')
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function Home() {
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [step, setStep] = useState<'details' | 'otp' | 'success'>('details');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const phoneDigits = useMemo(
    () => fields.phone.replace(/\D/g, '').slice(-10),
    [fields.phone],
  );

  function updateField(key: keyof FormFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function validateDetails() {
    if (!fields.firstName.trim()) return 'Enter your name.';

    if (!/^[6-9]\d{9}$/.test(phoneDigits))
      return 'Enter a valid 10-digit Indian mobile number.';
    return '';
  }

  async function requestCode(event?: SubmitEvent<HTMLFormElement>) {
    event?.preventDefault();
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return false;
    }

    setError('');
    setNotice('');
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch('/api/register/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          phone: phoneDigits,
          source: params.get('utm_source') ?? params.get('source') ?? undefined,
          campaign:
            params.get('utm_campaign') ?? params.get('campaign') ?? undefined,
        }),
      });
      const result = (await response.json()) as Challenge & { error?: string };
      if (!response.ok)
        throw new Error(
          result.error ?? 'Unable to send your verification code.',
        );
      setChallenge(result);
      setStep('otp');
      setOtp('');
      requestAnimationFrame(() => otpRef.current?.focus());
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to continue. Please try again.',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || otp.length !== 4)
      return setError('Enter the 4-digit verification code.');

    setError('');
    setNotice('');
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch('/api/register/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          studentId: challenge.studentId,
          code: otp,
          ...fields,
          phone: phoneDigits,
          source: params.get('utm_source') ?? params.get('source') ?? undefined,
          campaign:
            params.get('utm_campaign') ?? params.get('campaign') ?? undefined,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        duplicate?: boolean;
      };
      if (!response.ok)
        throw new Error(
          result.error ?? 'Verification failed. Please try again.',
        );
      setDuplicate(Boolean(result.duplicate));
      setStep('success');
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : 'Unable to verify the code. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  function changeNumber() {
    setStep('details');
    setChallenge(null);
    setOtp('');
    setError('');
    setNotice('');
  }

  async function resendCode() {
    const sent = await requestCode();
    if (sent) setNotice('A new verification code has been sent.');
  }

  return (
    <main
      id="top"
      className="min-h-screen overflow-x-hidden bg-background text-foreground"
    >
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a
            href="#top"
            aria-label="VIIV career webinar home"
            className="flex items-center gap-3"
          >
            <Image
              src="/viiv-crest.png"
              alt="VIIV"
              width={2000}
              height={2000}
              className="h-14 w-14 object-contain"
              priority
            />
          </a>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 md:flex"
          >
            <a href="#webinar" className="nav-link">
              Webinar
            </a>
            <a href="#why-attend" className="nav-link">
              Why Attend
            </a>
            <a href="#career-paths" className="nav-link">
              Career Paths
            </a>
            <a href="#register" className="nav-link">
              Register
            </a>
            <Button
              onClick={scrollToRegistration}
              className="h-11 rounded-full bg-accent px-5 font-extrabold text-ink shadow-none hover:bg-accent-strong"
            >
              Register for Webinar
            </Button>
          </nav>

          <details className="group relative md:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full border border-white/15 bg-white/10 text-white [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5 group-open:hidden" aria-hidden="true" />
              <X
                className="hidden h-5 w-5 group-open:block"
                aria-hidden="true"
              />
              <span className="sr-only">Open menu</span>
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute right-0 top-14 w-64 rounded-2xl border border-white/10 bg-ink p-3 shadow-2xl"
            >
              {['Webinar', 'Why Attend', 'Career Paths', 'Register'].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    className="block rounded-xl px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                  >
                    {item}
                  </a>
                ),
              )}
            </nav>
          </details>
        </div>
      </header>

      <section
        id="webinar"
        className="relative isolate overflow-hidden border-b border-white/10 bg-ink text-white"
      >
        <Image
          src="/varman-campus.webp"
          alt="Varman Innovation Labs campus in Navalur, Chennai"
          fill
          sizes="100vw"
          className="-z-30 object-cover"
          priority
        />
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(9,25,43,.97)_0%,rgba(9,25,43,.91)_46%,rgba(9,25,43,.72)_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(246,185,59,.20),transparent_36%)]" />
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.08fr_.82fr] lg:items-start lg:gap-16 lg:px-12 lg:py-20">
          <div className="lg:pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur">
              <span
                className="h-2 w-2 rounded-full bg-accent"
                aria-hidden="true"
              />
              Free career guidance webinar
            </div>
            <h1 className="mt-6 max-w-4xl text-[clamp(3.15rem,7.3vw,7.2rem)] font-black leading-[0.87] tracking-[-0.072em] text-white">
              What&apos;s Next <span className="text-accent">After 12th?</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-white/70 sm:text-xl sm:leading-8">
              Explore career paths, modern degrees, entrepreneurship, AI and
              practical opportunities — and understand which direction could be
              right for you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={scrollToRegistration}
                className="h-14 rounded-full bg-accent px-7 text-base font-extrabold text-ink hover:bg-accent-strong"
              >
                Register for the Webinar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <a
                href="#career-paths"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 text-base font-extrabold text-white backdrop-blur transition hover:bg-white/15"
              >
                Explore Career Paths <ArrowDown className="ml-2 h-4 w-4" />
              </a>
            </div>

            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white/75 backdrop-blur">
              <span
                className="h-2 w-2 rounded-full bg-accent"
                aria-hidden="true"
              />
              Varman × VIIV · Chennai
            </div>
          </div>

          <aside
            id="register"
            className="scroll-mt-28 rounded-[2rem] bg-ink p-2 shadow-[0_30px_90px_rgba(13,22,42,.24)] sm:p-3 lg:sticky lg:top-28"
          >
            <div className="rounded-[1.55rem] border border-white/10 bg-[#121d35] p-6 text-white sm:p-8">
              {step === 'details' && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink">
                      Free seat
                    </span>
                    <span className="text-xs font-semibold text-white/50">
                      Step 1 of 2
                    </span>
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                    Reserve Your Free Webinar Seat
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Enter your details, then verify your mobile number to
                    complete registration.
                  </p>
                  <form
                    onSubmit={requestCode}
                    noValidate
                    className="mt-6 space-y-4"
                  >
                    <div>
                      <Field label="Name" htmlFor="first-name">
                        <Input
                          id="first-name"
                          name="firstName"
                          autoComplete="given-name"
                          value={fields.firstName}
                          onChange={(e) =>
                            updateField('firstName', e.target.value)
                          }
                          className="form-input"
                          required
                        />
                      </Field>
                    </div>

                    <Field label="Phone Number" htmlFor="phone">
                      <div className="flex overflow-hidden rounded-xl border border-white/15 bg-white">
                        <span className="grid h-12 place-items-center border-r border-ink/10 px-3 text-sm font-bold text-ink/60">
                          +91
                        </span>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="Mobile No"
                          maxLength={14}
                          value={fields.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          className="h-12 rounded-none border-0 bg-white px-3 text-base text-ink shadow-none focus-visible:ring-0"
                          required
                        />
                      </div>
                    </Field>
                    {error && (
                      <p
                        role="alert"
                        className="rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-semibold text-red-100"
                      >
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-14 w-full rounded-xl bg-accent px-5 text-base font-black text-ink hover:bg-accent-strong focus-visible:ring-accent"
                    >
                      {loading ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />{' '}
                          Sending code…
                        </>
                      ) : (
                        <>
                          Register Now{' '}
                          <ArrowRight className="ml-auto h-5 w-5" />
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs leading-5 text-white/45">
                      By continuing, you accept the{' '}
                      <a
                        className="underline underline-offset-2 hover:text-white"
                        href="https://varman-student-portal.netlify.app/terms"
                      >
                        Terms
                      </a>{' '}
                      and{' '}
                      <a
                        className="underline underline-offset-2 hover:text-white"
                        href="https://varman-student-portal.netlify.app/privacy"
                      >
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </form>
                </>
              )}

              {step === 'otp' && challenge && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink">
                      Verify number
                    </span>
                    <span className="text-xs font-semibold text-white/50">
                      Step 2 of 2
                    </span>
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                    Enter your code
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    We sent a 4-digit code to +91 {phoneDigits}.{' '}
                    <button
                      type="button"
                      onClick={changeNumber}
                      className="font-bold text-white underline underline-offset-4"
                    >
                      Change
                    </button>
                  </p>
                  {challenge.pilotCode && (
                    <p className="mt-4 rounded-xl bg-accent/15 px-4 py-3 text-sm text-accent">
                      Preview code: <strong>{challenge.pilotCode}</strong>
                    </p>
                  )}
                  <form onSubmit={verifyCode} className="mt-6 space-y-4">
                    <label
                      htmlFor="otp"
                      className="text-sm font-bold text-white/85"
                    >
                      Verification code
                    </label>
                    <Input
                      ref={otpRef}
                      id="otp"
                      aria-describedby="otp-help"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={4}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      className="h-16 rounded-xl border-white/15 bg-white text-center text-2xl font-black tracking-[0.55em] text-ink"
                      required
                    />
                    <p id="otp-help" className="text-xs text-white/45">
                      Enter all four digits from the message.
                    </p>
                    {error && (
                      <p
                        role="alert"
                        className="rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-semibold text-red-100"
                      >
                        {error}
                      </p>
                    )}
                    {notice && (
                      <output className="block rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
                        {notice}
                      </output>
                    )}
                    <Button
                      type="submit"
                      disabled={loading || otp.length !== 4}
                      className="h-14 w-full rounded-xl bg-accent px-5 text-base font-black text-ink hover:bg-accent-strong"
                    >
                      {loading ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />{' '}
                          Verifying…
                        </>
                      ) : (
                        <>
                          Complete Registration{' '}
                          <ArrowRight className="ml-auto h-5 w-5" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={resendCode}
                      disabled={loading}
                      variant="outline"
                      className="h-12 w-full rounded-xl border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      <RefreshCcw className="h-4 w-4" /> Resend code
                    </Button>
                  </form>
                </>
              )}

              {step === 'success' && (
                <output className="block py-4 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent text-ink">
                    <Check className="h-8 w-8" />
                  </div>
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-accent">
                    Registration complete
                  </p>
                  <h2 className="mt-2 text-4xl font-black tracking-[-0.045em]">
                    {duplicate
                      ? "You're already registered!"
                      : "You're registered!"}
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/60">
                    Webinar and session details will be shared through the
                    mobile number you provided.
                  </p>
                </output>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section id="why-attend" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <p className="eyebrow">Why attend</p>
            <h2 className="section-title">
              One hour. Better questions. Clearer next steps.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyAttend.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="group rounded-3xl border border-ink/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-accent-deep/40 hover:shadow-xl sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/35 text-accent-deep">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-xs font-black text-ink/25">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-black tracking-[-0.025em] text-ink">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink/58">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="career-paths"
        className="scroll-mt-24 bg-ink py-20 text-white sm:py-28"
      >
        <div className="mx-auto grid max-w-[90rem] gap-12 px-5 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:items-end lg:px-12">
          <div>
            <p className="eyebrow text-accent">What comes next</p>
            <h2 className="section-title text-white">
              What Can You Explore After 12th?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/58">
              There isn&apos;t one correct path. The webinar helps you compare
              possibilities and understand what each direction asks of you.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {paths.map(({ icon: Icon, label, tone }) => (
              <div key={label} className="path-card" data-tone={tone}>
                <span className="path-icon">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-extrabold">{label}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-white/35" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
          <div className="grid overflow-hidden rounded-[2rem] border border-ink/10 bg-white lg:grid-cols-[.86fr_1.14fr]">
            <div className="bg-accent p-7 text-ink sm:p-10 lg:p-12">
              <p className="text-xs font-black uppercase tracking-[0.18em]">
                The VIIV connection
              </p>
              <h2 className="mt-4 text-4xl font-black leading-[.98] tracking-[-0.05em] sm:text-5xl">
                A Different Way to Think About Your Future
              </h2>
              <a
                href="https://www.viivindia.com/"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-sm font-black underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
              >
                Learn More About VIIV <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-lg leading-8 text-ink/70">
                VIIV is built around a simple idea: students should learn by
                doing, not wait until graduation to begin creating. At its
                Chennai campus, the institute combines venture building, AI
                tools, real-world projects and guidance from founders and
                industry practitioners. Students work on products, customers and
                practical challenges while developing the ability to think,
                execute and communicate like builders. Its approach pairs
                entrepreneurial learning with a recognised online BBA pathway,
                helping students build a portfolio of evidence alongside their
                degree.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  'Venture building',
                  'AI',
                  'Real-world projects',
                  'Mentorship',
                  'Practical execution',
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-ink/12 bg-muted px-3 py-2 text-xs font-extrabold text-ink/70"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">People behind the learning</p>
              <h2 className="section-title">
                Learn From Industry Practitioners
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-ink/55">
              A small glimpse of VIIV&apos;s wider mentor network across
              business and technology.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <article
                key={mentor.name}
                className="flex items-center gap-4 rounded-3xl border border-ink/10 bg-background p-4 sm:p-5"
              >
                <Image
                  src={mentor.image}
                  alt={`Portrait of ${mentor.name}`}
                  width={320}
                  height={436}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover grayscale transition hover:grayscale-0"
                />
                <div>
                  <h3 className="font-black text-ink">{mentor.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-ink/55">
                    {mentor.role}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-accent-deep">
                    {mentor.company}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-12">
          <div>
            <p className="eyebrow">Beyond the classroom</p>
            <h2 className="section-title">
              Build Skills. Build Experience. Build Your Future.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Practical learning',
              'Real-world projects',
              'Venture building',
              'Mentorship',
              'Portfolio development',
              'Career and venture pathways',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-4 text-sm font-extrabold text-ink shadow-sm"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-ink">
                  <Check className="h-4 w-4" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-28 sm:px-8 sm:pb-20 lg:px-12">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-8 overflow-hidden rounded-[2.25rem] bg-ink px-7 py-10 text-white sm:px-10 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
              Your next step can start here
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-[.98] tracking-[-0.05em] sm:text-6xl">
              Not Sure What to Do After 12th?
            </h2>
            <p className="mt-4 text-base text-white/55 sm:text-lg">
              Join the free webinar and get clarity on your next step.
            </p>
          </div>
          <Button
            onClick={scrollToRegistration}
            className="h-14 shrink-0 rounded-full bg-accent px-7 text-base font-black text-ink hover:bg-accent-strong"
          >
            Register for the Free Webinar{' '}
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-ink/10 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-5 text-sm text-ink/55 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/viiv-crest.png"
              alt="VIIV"
              width={2000}
              height={2000}
              className="h-12 w-12 object-contain"
            />
            <span className="font-black tracking-[-0.03em] text-ink">VIIV</span>
          </div>
          <p>Career guidance webinar for students and parents.</p>
          <a
            href="https://www.viivindia.com/"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-ink hover:underline"
          >
            VIIV official website
          </a>
        </div>
      </footer>

      {step !== 'success' && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(13,22,42,.12)] backdrop-blur-xl sm:hidden">
          <Button
            onClick={scrollToRegistration}
            className="h-13 w-full rounded-xl bg-accent px-5 text-sm font-black text-ink hover:bg-accent-strong"
          >
            Register for Webinar <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-bold text-white/85"
      >
        {label}{' '}
        <span className="text-accent" aria-hidden="true">
          *
        </span>
      </label>
      {children}
    </div>
  );
}
