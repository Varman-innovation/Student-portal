"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, CalendarPlus, ExternalLink, LayoutDashboard, LogOut, Pencil, RefreshCcw, ShieldPlus, Users, XCircle } from "lucide-react";
import type { Funnel, Student, Webinar } from "@/lib/domain";
import { percent } from "@/lib/domain";

type Props = { initialFunnel: Funnel; initialStudents: Student[]; initialWebinars: Webinar[]; demoMode: boolean };

export function AdminDashboard({ initialFunnel, initialStudents, initialWebinars, demoMode }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"dashboard" | "students" | "webinars">("dashboard");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Webinar | null>(null);
  const [error, setError] = useState("");

  const metrics = [
    { label: "Students", value: initialFunnel.students, rate: "Lead cohort" },
    { label: "OTP verified", value: initialFunnel.verified, rate: `${percent(initialFunnel.verified, initialFunnel.students)}% of students` },
    { label: "Onboarding", value: initialFunnel.onboarding_completed, rate: `${percent(initialFunnel.onboarding_completed, initialFunnel.verified)}% of verified` },
    { label: "Registered", value: initialFunnel.registered, rate: `${percent(initialFunnel.registered, initialFunnel.onboarding_completed)}% of onboarded` },
    { label: "Join clicked", value: initialFunnel.join_clicked, rate: `${percent(initialFunnel.join_clicked, initialFunnel.registered)}% of registered` }
  ];

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  async function saveWebinar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreating(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(editing ? `/api/admin/webinars/${editing.id}` : "/api/admin/webinars", {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        starts_at: new Date(String(form.get("starts_at"))).toISOString(),
        duration_minutes: Number(form.get("duration_minutes")),
        meeting_url: form.get("meeting_url"),
        status: editing?.status ?? "scheduled",
        timezone: "Asia/Kolkata"
      })
    });
    const body = await response.json();
    setCreating(false);
    if (!response.ok) return setError(body.error ?? "Unable to save webinar");
    setEditing(null);
    router.refresh();
    (event.target as HTMLFormElement).reset();
  }

  async function cancelWebinar(webinar: Webinar) {
    setError("");
    const response = await fetch(`/api/admin/webinars/${webinar.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
    const body = await response.json();
    if (!response.ok) return setError(body.error ?? "Unable to cancel webinar");
    router.refresh();
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="wordmark">VARMAN<small>INNOVATION LABS</small></div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}><LayoutDashboard size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 9 }} />Dashboard</button>
          <button className={tab === "students" ? "active" : ""} onClick={() => setTab("students")}><Users size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 9 }} />Students</button>
          <button className={tab === "webinars" ? "active" : ""} onClick={() => setTab("webinars")}><BarChart3 size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 9 }} />Webinars</button>
          <Link href="/admin/register"><ShieldPlus size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 9 }} />Add admin</Link>
        </nav>
        <div style={{ marginTop: "auto" }} className="admin-nav"><button onClick={logout}><LogOut size={17} style={{ display: "inline", verticalAlign: "-3px", marginRight: 9 }} />Log out</button></div>
      </aside>
      <section className="admin-main">
        <div className="page-head"><div><div className="eyebrow">Conversion workspace</div><h1 className="page-title">{tab === "dashboard" ? "Funnel overview" : tab === "students" ? "Student records" : "Webinar management"}</h1><p>{demoMode ? "Pilot workspace data" : "Live registration data"}</p></div><button className="secondary-btn" onClick={() => router.refresh()}><RefreshCcw size={16} /> Refresh</button></div>

        {tab === "dashboard" ? <>
          <div className="metric-grid">{metrics.map((metric) => <div className="metric" key={metric.label}><div className="metric-label">{metric.label}</div><div className="metric-value">{metric.value.toLocaleString("en-IN")}</div><div className="metric-rate">{metric.rate}</div></div>)}</div>
          <section className="content-card"><h2>Recent students</h2><p className="subcopy">Latest leads and their current progress.</p><StudentTable students={initialStudents.slice(0, 8)} /></section>
        </> : null}

        {tab === "students" ? <section className="content-card"><h2>All students</h2><p className="subcopy">Mobile, onboarding, registration, and activity status.</p><StudentTable students={initialStudents} /></section> : null}

        {tab === "webinars" ? <div className="admin-webinar-grid">
          <section className="content-card">
            <CalendarPlus size={25} color="var(--navy)" style={{ marginBottom: 12 }} /><h2>{editing ? "Edit webinar" : "Create webinar"}</h2><p className="subcopy">Times are interpreted from your browser and stored in UTC.</p>
            <form onSubmit={saveWebinar} key={editing?.id ?? "new"}>
              <div className="field"><label htmlFor="title">Title</label><div className="input-wrap"><input id="title" name="title" className="input" defaultValue={editing?.title} required /></div></div>
              <div className="field"><label htmlFor="description">Description</label><div className="input-wrap"><input id="description" name="description" className="input" defaultValue={editing?.description} required /></div></div>
              <div className="field"><label htmlFor="starts_at">Start date & time</label><div className="input-wrap"><input id="starts_at" name="starts_at" className="input" type="datetime-local" defaultValue={editing ? new Date(new Date(editing.starts_at).getTime() - new Date(editing.starts_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined} required /></div></div>
              <div className="field"><label htmlFor="duration_minutes">Duration</label><div className="input-wrap"><input id="duration_minutes" name="duration_minutes" className="input" type="number" min="15" max="480" defaultValue={editing?.duration_minutes ?? 60} required /></div></div>
              <div className="field"><label htmlFor="meeting_url">Meeting URL</label><div className="input-wrap"><input id="meeting_url" name="meeting_url" className="input" type="url" placeholder="https://meet.google.com/..." defaultValue={editing?.meeting_url} required /></div></div>
              {error ? <p className="error">{error}</p> : null}<button className="primary-btn full-btn" disabled={creating}>{creating ? "Saving…" : editing ? "Save webinar changes" : "Create scheduled webinar"}</button>
              {editing ? <button type="button" className="secondary-btn full-btn" style={{ marginTop: 10 }} onClick={() => setEditing(null)}>Cancel editing</button> : null}
            </form>
          </section>
          <section className="content-card"><h2>Scheduled sessions</h2><p className="subcopy">{initialWebinars.length} webinar{initialWebinars.length === 1 ? "" : "s"} in the system.</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Webinar</th><th>Start</th><th>Status</th><th>Actions</th></tr></thead><tbody>{initialWebinars.map((webinar) => <tr key={webinar.id}><td><strong>{webinar.title}</strong><div style={{ color: "var(--muted)", fontSize: 12 }}>{webinar.duration_minutes} minutes</div></td><td>{new Date(webinar.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td><td><span className="tiny-badge">{webinar.status}</span></td><td><div style={{ display: "flex", gap: 10 }}><button className="icon-btn" aria-label={`Edit ${webinar.title}`} onClick={() => setEditing(webinar)}><Pencil size={16} /></button>{webinar.status !== "cancelled" ? <button className="icon-btn danger-icon" aria-label={`Cancel ${webinar.title}`} onClick={() => cancelWebinar(webinar)}><XCircle size={16} /></button> : null}<a className="icon-btn" href={webinar.meeting_url} target="_blank" rel="noreferrer" aria-label={`Open ${webinar.title}`}><ExternalLink size={16} /></a></div></td></tr>)}</tbody></table></div></section>
        </div> : null}
      </section>
    </main>
  );
}

function StudentTable({ students }: { students: Student[] }) {
  if (!students.length) return <div className="empty-state">No student activity yet. Complete the student flow to populate the dashboard.</div>;
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Mobile</th><th>Source</th><th>Verified</th><th>Onboarding</th><th>Created</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><strong>{student.profile.full_name || "Profile pending"}</strong><div style={{ color: "var(--muted)", fontSize: 12 }}>{student.profile.degree || "—"}</div></td><td>{student.mobile.replace(/(\+91\d{2})\d{5}(\d{3})/, "$1•••••$2")}</td><td>{student.source || "Direct"}</td><td><span className="tiny-badge">{student.verified_at ? "Yes" : "No"}</span></td><td><span className="tiny-badge">{student.onboarding_completed_at ? "Complete" : `Step ${student.onboarding_step}`}</span></td><td>{new Date(student.created_at).toLocaleDateString("en-IN")}</td></tr>)}</tbody></table></div>;
}
