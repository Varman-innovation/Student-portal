"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";

type Challenge = { studentId: string; mobile: string };

export default function VerifyPage() {
  const router = useRouter();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("login_challenge");
    if (!raw) return router.replace("/");
    const frame = requestAnimationFrame(() => {
      setChallenge(JSON.parse(raw));
      inputs.current[0]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [router]);

  function change(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 3) inputs.current[index + 1]?.focus();
  }

  function keyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  function paste(event: React.ClipboardEvent) {
    const code = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (code.length === 4) {
      event.preventDefault();
      setDigits(code.split(""));
      inputs.current[3]?.focus();
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setError("");
    setLoading(true);
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId: challenge.studentId, code: digits.join("") })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "Verification failed");
    sessionStorage.removeItem("login_challenge");
    router.replace(data.nextPath);
  }

  return (
    <main>
      <BrandHeader />
      <section className="app-page" style={{ display: "grid", placeItems: "center" }}>
        <div className="glass-card" style={{ boxShadow: "var(--shadow)" }}>
          <div className="eyebrow">Mobile verification</div>
          <h2>Enter your 4-digit code</h2>
          <p className="subcopy">We sent a verification code to <strong>{challenge?.mobile ?? "your mobile"}</strong>.</p>
          <div className="demo-note">For this MVP, use <strong>0000</strong>. WhatsApp OTP will replace this adapter later.</div>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} onPaste={paste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { inputs.current[index] = element; }}
                  aria-label={`OTP digit ${index + 1}`}
                  className="input"
                  style={{ height: 64, textAlign: "center", fontSize: 26, fontWeight: 750, border: "1px solid var(--line)", borderRadius: 14, background: "white" }}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  value={digit}
                  onChange={(e) => change(index, e.target.value)}
                  onKeyDown={(e) => keyDown(index, e)}
                />
              ))}
            </div>
            {error ? <p className="error" role="alert">{error}</p> : null}
            <button className="primary-btn full-btn" disabled={loading || digits.some((digit) => !digit)}>{loading ? "Verifying…" : <>Verify & continue <ArrowRight size={18} /></>}</button>
            <button type="button" className="secondary-btn full-btn" style={{ marginTop: 12 }} onClick={() => setDigits(["", "", "", ""])}><RotateCcw size={16} /> Clear code</button>
          </form>
        </div>
      </section>
    </main>
  );
}
