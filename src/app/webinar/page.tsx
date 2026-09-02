"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, LogOut, Radio } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import type { Registration, Webinar } from "@/lib/domain";

type WebinarData = { webinar: Webinar | null; registration: Registration | null };

export default function WebinarPage() {
  const router = useRouter();
  const [data, setData] = useState<WebinarData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/webinars/next").then(async (response) => {
      if (response.status === 401) return router.replace("/");
      if (response.status === 428) return router.replace("/onboarding");
      setData(await response.json());
    });
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

  if (!data) return <main><BrandHeader /><section className="app-page"><div className="app-container">Finding your next webinar…</div></section></main>;

  if (!data.webinar) return (
    <main><BrandHeader /><section className="app-page"><div className="app-container"><div className="content-card empty-state"><CalendarDays size={46} color="var(--navy)" style={{ margin: "0 auto 18px" }} /><h2>No upcoming webinar yet</h2><p className="subcopy">New sessions are being scheduled. Please check back shortly.</p><button className="secondary-btn" onClick={logout}><LogOut size={17} /> Log out</button></div></div></section></main>
  );

  const starts = new Date(data.webinar.starts_at);
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: data.webinar.timezone }).format(starts);
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: data.webinar.timezone }).format(starts);

  return (
    <main>
      <BrandHeader />
      <section className="app-page">
        <div className="app-container">
          <div className="page-head"><div><div className="eyebrow">Next available webinar</div><h1 className="page-title">Your session is ready.</h1><p>Reserve your place and return here when it’s time to join.</p></div><button className="secondary-btn" onClick={logout}><LogOut size={17} /> Log out</button></div>
          <div className="webinar-layout">
            <section className="webinar-visual">
              <span className="date-chip"><Radio size={15} /> Live masterclass</span>
              <h1>{data.webinar.title}</h1>
              <p>{data.webinar.description}</p>
            </section>
            <section className="content-card registration-card">
              {data.registration ? <span className="status-badge"><CheckCircle2 size={14} /> Registered</span> : <span className="eyebrow">Reserve your seat</span>}
              <p className="subcopy" style={{ marginBottom: 4 }}><CalendarDays size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8 }} />{date}</p>
              <div className="time-display">{time}</div>
              <p className="subcopy"><Clock3 size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8 }} />{data.webinar.duration_minutes} minutes · {data.webinar.timezone}</p>
              {error ? <p className="error" role="alert">{error}</p> : null}
              {data.registration ? (
                <button className="primary-btn full-btn" onClick={join} disabled={loading}>{loading ? "Opening…" : <>Join webinar <ArrowUpRight size={18} /></>}</button>
              ) : (
                <button className="primary-btn full-btn" onClick={register} disabled={loading}>{loading ? "Registering…" : <>Register for webinar <ArrowUpRight size={18} /></>}</button>
              )}
              <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.5, marginTop: 16 }}>Your join click is recorded before the meeting opens. Attendance is tracked separately in a future phase.</p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
