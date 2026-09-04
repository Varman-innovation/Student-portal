"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, Clock3, RefreshCcw } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { StudentFooter } from "@/components/student-footer";

type PublicWebinar = {
  title: string;
  starts_at: string;
  duration_minutes: number;
};

type Challenge = {
  studentId: string;
  mobile: string;
  rawMobile?: string;
  pilotCode?: string;
};

function formatEventDate(webinar: PublicWebinar | null) {
  if (!webinar) return "New live session opening soon";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(webinar.starts_at));
}

export default function HomePage() {
  const router = useRouter();

  // Registration
  const [mobile, setMobile] = useState("");

  // OTP
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  // Common
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [webinar, setWebinar] = useState<PublicWebinar | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(async (response) => {
      if (response.ok) {
        const data = await response.json();

        if (data.nextPath) {
          router.replace(data.nextPath);
        }
      }
    });

    fetch("/api/webinars/public/next")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setWebinar(data?.webinar ?? null))
      .catch(() => undefined);

    // If an existing challenge is available, show OTP step.
    const raw = sessionStorage.getItem("login_challenge");

    if (raw) {
      try {
        const savedChallenge = JSON.parse(raw);

        if (savedChallenge?.studentId) {
          setChallenge(savedChallenge);
          setMobile(savedChallenge.rawMobile ?? "");
          setStep("otp");
        }
      } catch {
        sessionStorage.removeItem("login_challenge");
      }
    }
  }, [router]);

  // =========================
  // MOBILE REGISTRATION
  // =========================

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setNotice("");
    setLoading(true);

    try {
      const params = new URLSearchParams(window.location.search);

      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          mobile,
          source:
            params.get("utm_source") ??
            params.get("source") ??
            undefined,
          campaign:
            params.get("utm_campaign") ??
            params.get("campaign") ??
            undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to send your verification code"
        );
      }

      const nextChallenge = {
        ...data,
        rawMobile: mobile,
      };

      sessionStorage.setItem(
        "login_challenge",
        JSON.stringify(nextChallenge)
      );

      setChallenge(nextChallenge);
      setDigits(["", "", "", ""]);
      setStep("otp");

      // Focus first OTP input after UI changes
      requestAnimationFrame(() => {
        inputs.current[0]?.focus();
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to continue"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // OTP INPUT
  // =========================

  function change(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);

    const next = [...digits];
    next[index] = digit;

    setDigits(next);

    if (digit && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  }

  function keyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Backspace" &&
      !digits[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
  }

  function paste(event: React.ClipboardEvent) {
    const code = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (code.length === 4) {
      event.preventDefault();

      setDigits(code.split(""));

      inputs.current[3]?.focus();
    }
  }

  // =========================
  // VERIFY OTP
  // =========================

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();

    if (!challenge) return;

    setError("");
    setNotice("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          studentId: challenge.studentId,
          code: digits.join(""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }

      sessionStorage.removeItem("login_challenge");

      router.replace(data.nextPath);
    } catch {
      setError("Unable to verify the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // RESEND OTP
  // =========================

  async function resend() {
    if (!challenge?.rawMobile) {
      changeNumber();
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          mobile: challenge.rawMobile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to resend the code"
        );
      }

      const nextChallenge = {
        ...data,
        rawMobile: challenge.rawMobile,
      };

      sessionStorage.setItem(
        "login_challenge",
        JSON.stringify(nextChallenge)
      );

      setChallenge(nextChallenge);
      setDigits(["", "", "", ""]);
      setNotice("A new verification code is ready.");

      requestAnimationFrame(() => {
        inputs.current[0]?.focus();
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to resend the code"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // CHANGE MOBILE NUMBER
  // =========================

  function changeNumber() {
    setStep("mobile");
    setChallenge(null);
    setDigits(["", "", "", ""]);
    setError("");
    setNotice("");

    sessionStorage.removeItem("login_challenge");
  }

  return (
    <main>
      <BrandHeader />

      <section className="hero-shell">
        <div className="hero-copy">
          <div className="eyebrow">
            Free live student masterclass
          </div>

          <h1>Build your startup idea.</h1>

          <p>
            Validate it, shape your MVP, and leave with a clear
            next step—in 60 minutes.
          </p>

          <div
            className="hero-points"
            aria-label="Masterclass highlights"
          >
            <span className="hero-pill">
              <Check size={15} /> Live
            </span>

            <span className="hero-pill">
              <Check size={15} /> Practical
            </span>

            <span className="hero-pill">
              <Check size={15} /> Free
            </span>
          </div>

          <div className="event-strip">
            <CalendarDays size={21} />

            <div>
              <strong>
                {webinar?.title ??
                  "Student Entrepreneurship Masterclass"}
              </strong>

              <span>{formatEventDate(webinar)}</span>
            </div>

            <div>
              <Clock3 size={17} />{" "}
              {webinar?.duration_minutes ?? 60} minutes
            </div>
          </div>
        </div>

        <div className="login-panel">
          <div className="glass-card">

            {/* =====================================
                STEP 1 - MOBILE NUMBER
            ===================================== */}

            {step === "mobile" && (
              <>
                <div className="eyebrow">
                  Free student seat
                </div>

                <h2>Register</h2>

                <p className="subcopy">
                  Enter your mobile number to continue.
                </p>

                <form onSubmit={submit}>
                  <div className="field">
                    <label htmlFor="mobile">
                      Mobile number{" "}
                      <span className="required">*</span>
                    </label>

                    <div className="input-wrap">
                      <span className="prefix">+91</span>

                      <input
                        id="mobile"
                        className="input"
                        inputMode="numeric"
                        autoComplete="tel"
                        aria-describedby="mobile-help"
                        placeholder="98765 43210"
                        value={mobile}
                        onChange={(event) =>
                          setMobile(event.target.value)
                        }
                        maxLength={14}
                        required
                      />
                    </div>

                    <span
                      id="mobile-help"
                      className="field-help"
                    >
                      For verification and session updates.
                    </span>
                  </div>

                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    className="primary-btn full-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      "Sending…"
                    ) : (
                      <>
                        Get my code{" "}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <p className="consent-copy">
                    By continuing, you accept the{" "}
                    <a href="/terms">Terms</a> and{" "}
                    <a href="/privacy">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </form>
              </>
            )}

            {/* =====================================
                STEP 2 - OTP VERIFICATION
            ===================================== */}

            {step === "otp" && (
              <>
                <div className="eyebrow">
                  Verify number
                </div>

                <h2>Enter the code</h2>

                <p className="subcopy">
                  Sent to{" "}
                  <strong>
                    {challenge?.mobile ?? "your mobile"}
                  </strong>{" "}
                  ·{" "}
                  <button
                    type="button"
                    onClick={changeNumber}
                    style={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      color: "inherit",
                      textDecoration: "underline",
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    Change
                  </button>
                </p>

                {challenge?.pilotCode && (
                  <div className="demo-note">
                    Access code:{" "}
                    <strong>{challenge.pilotCode}</strong>
                  </div>
                )}

                <form onSubmit={verifyOtp}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(4, 1fr)",
                      gap: 10,
                    }}
                    onPaste={paste}
                  >
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          inputs.current[index] =
                            element;
                        }}
                        aria-label={`OTP digit ${
                          index + 1
                        }`}
                        className="input"
                        style={{
                          height: 64,
                          textAlign: "center",
                          fontSize: 26,
                          fontWeight: 750,
                          border:
                            "1px solid var(--line)",
                          borderRadius: 14,
                          background: "white",
                        }}
                        inputMode="numeric"
                        autoComplete={
                          index === 0
                            ? "one-time-code"
                            : "off"
                        }
                        value={digit}
                        onChange={(event) =>
                          change(
                            index,
                            event.target.value
                          )
                        }
                        onKeyDown={(event) =>
                          keyDown(index, event)
                        }
                      />
                    ))}
                  </div>

                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}

                  {notice && (
                    <p
                      className="success"
                      role="status"
                    >
                      {notice}
                    </p>
                  )}

                  <button
                    className="primary-btn full-btn"
                    disabled={
                      loading ||
                      digits.some(
                        (digit) => !digit
                      )
                    }
                  >
                    {loading ? (
                      "Verifying…"
                    ) : (
                      <>
                        Continue{" "}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn full-btn"
                    style={{ marginTop: 12 }}
                    onClick={resend}
                    disabled={loading}
                  >
                    <RefreshCcw size={16} /> Resend code
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <StudentFooter />
    </main>
  );
}
