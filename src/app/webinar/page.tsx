"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarPlus, CalendarDays, CheckCircle2, Clock3, LogOut, Radio } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { StudentFooter } from "@/components/student-footer";
import { webinarPhase, type Registration, type Webinar } from "@/lib/domain";

type WebinarData = { webinar: Webinar | null; registration: Registration | null };

export default function WebinarPage() {
  const router = useRouter();
  const [data, setData] = useState<WebinarData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    fetch("/api/webinars/next").then(async (response) => {
      if (response.status === 401) return router.replace("/");
      if (response.status === 428) return router.replace("/onboarding");
      setData(await response.json());
    });
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, [router]);

  async function register() {
    if (!data?.webinar) return;
    setLoading(true);
    setError("");
    const response = await fetch(`/api/webinars/${data.webinar.id}/register`, { method: "POST" });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) return setError(body.error ?? "Registration failed");
    setData((current) => current ? { ...current, registration: body.registration } : current);
  }

  async function join() {
    if (!data?.webinar) return;
    setLoading(true);
    setError("");
    const response = await fetch(`/api/webinars/${data.webinar.id}/join`, { method: "POST" });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) return setError(body.error ?? "Unable to open webinar");
    setData((current) => current ? { ...current, registration: body.registration } : current);
    window.open(body.meetingUrl, "_blank", "noopener,noreferrer");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  if (!data) return <main><BrandHeader /><section className="app-page"><div className="app-container">Confirming your registration…</div></section></main>;

  if (!data.webinar) return (
    <main><BrandHeader /><section className="app-page"><div className="app-container"><div className="content-card empty-state"><CalendarDays size={46} color="var(--navy)" style={{ margin: "0 auto 18px" }} /><h2>You’re on the list</h2><p className="subcopy">We’ll share the next session soon.</p><button className="secondary-btn" onClick={logout}><LogOut size={17} /> Log out</button></div></div></section><StudentFooter /></main>
  );

  const starts = new Date(data.webinar.starts_at);
  const phase = webinarPhase(data.webinar, now);
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: data.webinar.timezone }).format(starts);
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: data.webinar.timezone, timeZoneName: "short" }).format(starts);

  return (
    <main>
      <BrandHeader />
      <section className="app-page">
        <div className="app-container">
          <div className="page-head">
            <div><div className="eyebrow">{data.registration ? "Seat confirmed" : "Final step"}</div><h1 className="page-title">{data.registration ? "You’re registered" : "Reserve your seat"}</h1><p>{data.registration ? "Add it to your calendar. Return 10 minutes before it starts." : "Confirm your free place."}</p></div>
            <button className="secondary-btn" onClick={logout}><LogOut size={17} /> Log out</button>
          </div>
          <div className="webinar-layout">
            <section className="webinar-visual">
              <span className="date-chip"><Radio size={15} /> Live masterclass</span>
              <h1>{data.webinar.title}</h1>
              <p>{data.webinar.description}</p>
            </section>
            <section className="content-card registration-card">
              {data.registration ? <span className="status-badge"><CheckCircle2 size={14} /> Registration confirmed</span> : <span className="eyebrow">Free student seat</span>}
              <p className="subcopy" style={{ marginBottom: 4 }}><CalendarDays size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8 }} />{date}</p>
              <div className="time-display">{time}</div>
              <p className="subcopy"><Clock3 size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8 }} />{data.webinar.duration_minutes} minutes</p>
              {error ? <p className="error" role="alert">{error}</p> : null}
              {!data.registration ? (
                <button className="primary-btn full-btn" onClick={register} disabled={loading}>{loading ? "Reserving…" : <>Reserve my free seat <ArrowUpRight size={18} /></>}</button>
              ) : phase === "joinable" ? (
                <button className="primary-btn full-btn" onClick={join} disabled={loading}>{loading ? "Opening…" : <>Join live masterclass <ArrowUpRight size={18} /></>}</button>
              ) : phase === "upcoming" ? (
                <a className="primary-btn full-btn" href={`/api/webinars/${data.webinar.id}/calendar`}><CalendarPlus size={18} /> Add to calendar</a>
              ) : (
                <p className="ended-note">This live session has ended. Your registration remains saved.</p>
              )}
              {data.registration && phase === "upcoming" ? <p className="session-note">Join opens 10 minutes before start.</p> : null}
            </section>
          </div>
        </div>
      </section>
      <StudentFooter />
    </main>
  );
}
