"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";

export default function HomePage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        if (data.nextPath) router.replace(data.nextPath);
      }
    });
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
        body: JSON.stringify({ mobile, source: params.get("source") ?? undefined, campaign: params.get("campaign") ?? undefined })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to continue");
      sessionStorage.setItem("login_challenge", JSON.stringify(data));
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
          <div className="eyebrow">Student Opportunity Portal</div>
          <h1>Build what comes next.</h1>
          <p>Share your journey, find the next entrepreneurship masterclass, and take the first step from idea to execution.</p>
          <div className="hero-points">
            <span className="hero-pill">2-minute onboarding</span>
            <span className="hero-pill">Live expert sessions</span>
            <span className="hero-pill">Built for students</span>
          </div>
        </div>
        <div className="login-panel">
          <div className="glass-card">
            <div className="eyebrow">Get started</div>
            <h2>Enter your mobile number</h2>
            <p className="subcopy">We’ll verify your number, then help you reserve the nearest available webinar.</p>
            <div className="demo-note"><ShieldCheck size={15} style={{ display: "inline", verticalAlign: "-3px", marginRight: 7 }} />MVP demo verification code: <strong>0000</strong></div>
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="mobile">Mobile number <span className="required">*</span></label>
                <div className="input-wrap">
                  <span className="prefix">+91</span>
                  <input id="mobile" className="input" inputMode="numeric" autoComplete="tel" placeholder="98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={14} required />
                </div>
              </div>
              {error ? <p className="error" role="alert">{error}</p> : null}
              <button className="primary-btn full-btn" disabled={loading}>{loading ? "Preparing…" : <>Continue <ArrowRight size={18} /></>}</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
