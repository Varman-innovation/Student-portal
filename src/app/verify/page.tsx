"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { StudentFooter } from "@/components/student-footer";

type Challenge = { studentId: string; mobile: string; rawMobile?: string; pilotCode?: string };

export default function VerifyPage() {
  const router = useRouter();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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

  async function resend() {
    if (!challenge?.rawMobile) return router.push("/");
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile: challenge.rawMobile })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to resend the code");
      const next = { ...data, rawMobile: challenge.rawMobile };
      sessionStorage.setItem("login_challenge", JSON.stringify(next));
      setChallenge(next);
      setDigits(["", "", "", ""]);
      setNotice("A new verification code is ready.");
      inputs.current[0]?.focus();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to resend the code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <BrandHeader />
      <section className="app-page" style={{ display: "grid", placeItems: "center" }}>
        <div className="glass-card" style={{ boxShadow: "var(--shadow)" }}>
          <div className="eyebrow">Verify number</div>
          <h2>Enter the code</h2>
          <p className="subcopy">Sent to <strong>{challenge?.mobile ?? "your mobile"}</strong> · <Link href="/">Change</Link></p>
          {challenge?.pilotCode ? <div className="demo-note">Access code: <strong>{challenge.pilotCode}</strong></div> : null}
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
            {notice ? <p className="success" role="status">{notice}</p> : null}
            <button className="primary-btn full-btn" disabled={loading || digits.some((digit) => !digit)}>{loading ? "Verifying…" : <>Continue <ArrowRight size={18} /></>}</button>
            <button type="button" className="secondary-btn full-btn" style={{ marginTop: 12 }} onClick={resend} disabled={loading}><RefreshCcw size={16} /> Resend code</button>
          </form>
        </div>
      </section>
      <StudentFooter />
    </main>
  );
}
