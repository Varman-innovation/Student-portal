"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) return setError(body.error ?? "Login failed");
    router.replace("/admin");
  }

  return (
    <main className="admin-login">
      <div className="glass-card">
        <div className="wordmark" style={{ marginBottom: 42 }}>VARMAN<small>INNOVATION LABS</small></div>
        <div className="eyebrow"><LockKeyhole size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 7 }} />Admin portal</div>
        <h2>Welcome back</h2>
        <p className="subcopy">Authorised Varman team members can manage live sessions and review the registration funnel.</p>
        <form onSubmit={submit}>
          <div className="field"><label htmlFor="username">Admin email or ID</label><div className="input-wrap"><input id="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></div></div>
          <div className="field"><label htmlFor="password">Password</label><div className="input-wrap"><input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div></div>
          {error ? <p className="error" role="alert">{error}</p> : null}
          <button className="primary-btn full-btn" disabled={loading}>{loading ? "Signing in…" : <>Sign in <ArrowRight size={18} /></>}</button>
        </form>
      </div>
    </main>
  );
}
