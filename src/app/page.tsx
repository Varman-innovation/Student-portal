"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, Clock3 } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { StudentFooter } from "@/components/student-footer";

type PublicWebinar = { title: string; starts_at: string; duration_minutes: number };

function formatEventDate(webinar: PublicWebinar | null) {
  if (!webinar) return "New live session opening soon";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
    timeZone: "Asia/Kolkata", timeZoneName: "short"
  }).format(new Date(webinar.starts_at));
}

export default function HomePage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [webinar, setWebinar] = useState<PublicWebinar | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        if (data.nextPath) router.replace(data.nextPath);
      }
    });
    fetch("/api/webinars/public/next")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setWebinar(data?.webinar ?? null))
      .catch(() => undefined);
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mobile,
          source: params.get("utm_source") ?? params.get("source") ?? undefined,
          campaign: params.get("utm_campaign") ?? params.get("campaign") ?? undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to send your verification code");
      sessionStorage.setItem("login_challenge", JSON.stringify({ ...data, rawMobile: mobile }));
      router.push("/verify");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <BrandHeader />
      <section className="hero-shell">
        <div className="hero-copy">
          <div className="eyebrow">Free live student masterclass</div>
          <h1>Build your startup idea.</h1>
          <p>Validate it, shape your MVP, and leave with a clear next step—in 60 minutes.</p>
          <div className="hero-points" aria-label="Masterclass highlights">
            <span className="hero-pill"><Check size={15} /> Live</span>
            <span className="hero-pill"><Check size={15} /> Practical</span>
            <span className="hero-pill"><Check size={15} /> Free</span>
          </div>
          <div className="event-strip">
            <CalendarDays size={21} />
            <div><strong>{webinar?.title ?? "Student Entrepreneurship Masterclass"}</strong><span>{formatEventDate(webinar)}</span></div>
            <div><Clock3 size={17} /> {webinar?.duration_minutes ?? 60} minutes</div>
          </div>
        </div>
        <div className="login-panel">
          <div className="glass-card">
            <div className="eyebrow">Free student seat</div>
            <h2>Register</h2>
            <p className="subcopy">Enter your mobile number to continue.</p>
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="mobile">Mobile number <span className="required">*</span></label>
                <div className="input-wrap">
                  <span className="prefix">+91</span>
                  <input id="mobile" className="input" inputMode="numeric" autoComplete="tel" aria-describedby="mobile-help" placeholder="98765 43210" value={mobile} onChange={(event) => setMobile(event.target.value)} maxLength={14} required />
                </div>
                <span id="mobile-help" className="field-help">For verification and session updates.</span>
              </div>
              {error ? <p className="error" role="alert">{error}</p> : null}
              <button className="primary-btn full-btn" disabled={loading}>{loading ? "Sending…" : <>Get my code <ArrowRight size={18} /></>}</button>
              <p className="consent-copy">By continuing, you accept the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
            </form>
          </div>
        </div>
      </section>
      <StudentFooter />
    </main>
  );
}
