"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Sparkles,
  RefreshCcw,
  ShieldCheck,
  X
} from "lucide-react";

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
  if (!webinar) return "Live session opening soon";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short"
  }).format(new Date(webinar.starts_at));
}

export default function HomePage() {
  const router = useRouter();

  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const [mobile, setMobile] = useState("");
  const [webinar, setWebinar] = useState<PublicWebinar | null>(null);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [digits, setDigits] = useState(["", "", "", ""]);

  const [step, setStep] = useState<"mobile" | "otp">("mobile");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then(async (response) => {
        if (!response.ok) return;

        const data = await response.json();

        if (data.nextPath) {
          router.replace(data.nextPath);
        }
      })
      .catch(() => undefined);

    fetch("/api/webinars/public/next")
      .then((response) =>
        response.ok ? response.json() : null
      )
      .then((data) => {
        setWebinar(data?.webinar ?? null);
      })
      .catch(() => undefined);

    const savedChallenge = sessionStorage.getItem("login_challenge");

    if (savedChallenge) {
      try {
        const parsed = JSON.parse(savedChallenge);

        setChallenge(parsed);
        setMobile(parsed.rawMobile ?? "");
        setStep("otp");

        requestAnimationFrame(() => {
          inputs.current[0]?.focus();
        });
      } catch {
        sessionStorage.removeItem("login_challenge");
      }
    }
  }, [router]);

  // -----------------------------
  // MOBILE NUMBER SUBMIT
  // -----------------------------

  async function submitMobile(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setNotice("");
    setLoading(true);

    try {
      const params = new URLSearchParams(window.location.search);

      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: {
          "content-type": "application/json"
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
            undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to send your verification code"
        );
      }

      const nextChallenge = {
        ...data,
        rawMobile: mobile
      };

      sessionStorage.setItem(
        "login_challenge",
        JSON.stringify(nextChallenge)
      );

      setChallenge(nextChallenge);
      setDigits(["", "", "", ""]);
      setStep("otp");

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

  // -----------------------------
  // OTP INPUT
  // -----------------------------

  function changeDigit(index: number, value: string) {
    const digit = value
      .replace(/\D/g, "")
      .slice(-1);

    const next = [...digits];

    next[index] = digit;

    setDigits(next);

    if (digit && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
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

  function handlePaste(event: React.ClipboardEvent) {
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

  // -----------------------------
  // VERIFY OTP
  // -----------------------------

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
          "content-type": "application/json"
        },
        body: JSON.stringify({
          studentId: challenge.studentId,
          code: digits.join("")
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Verification failed"
        );
      }

      sessionStorage.removeItem("login_challenge");

      router.replace(data.nextPath);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // RESEND OTP
  // -----------------------------

  async function resendOtp() {
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
          "content-type": "application/json"
        },
        body: JSON.stringify({
          mobile: challenge.rawMobile
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to resend the code"
        );
      }

      const nextChallenge = {
        ...data,
        rawMobile: challenge.rawMobile
      };

      sessionStorage.setItem(
        "login_challenge",
        JSON.stringify(nextChallenge)
      );

      setChallenge(nextChallenge);
      setDigits(["", "", "", ""]);
      setNotice("New code sent.");

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

  // -----------------------------
  // CHANGE NUMBER
  // -----------------------------

  function changeNumber() {
    sessionStorage.removeItem("login_challenge");

    setChallenge(null);
    setDigits(["", "", "", ""]);
    setError("");
    setNotice("");
    setStep("mobile");

    requestAnimationFrame(() => {
      document.getElementById("mobile")?.focus();
    });
  }

  return (
    <main className="webinar-page">
      <BrandHeader />

      {/* =========================
          HERO
      ========================== */}

      <section className="webinar-hero">
        <div className="webinar-container">

          {/* LEFT CONTENT */}

          <div className="webinar-content">

            <div className="webinar-badge">
              <span className="live-dot" />
              FREE LIVE WEBINAR
            </div>

            <h1 className="webinar-title">
              Build.
              <br />
              Launch.
              <br />
              <span>Grow.</span>
            </h1>

            <p className="webinar-description">
              Turn your idea into something real with
              startup thinking, AI and practical guidance.
            </p>

            <div className="webinar-points">

              <div>
                <Check size={17} />
                <span>Startup mindset</span>
              </div>

              <div>
                <Check size={17} />
                <span>AI-powered ideas</span>
              </div>

              <div>
                <Check size={17} />
                <span>Real-world growth</span>
              </div>

            </div>

            {/* EVENT INFO */}

            <div className="webinar-event">

              <div className="event-icon">
                <CalendarDays size={20} />
              </div>

              <div className="event-info">
                <strong>
                  {webinar?.title ??
                    "Startup & AI Masterclass"}
                </strong>

                <span>
                  {formatEventDate(webinar)}
                </span>
              </div>

              <div className="event-duration">
                <Clock3 size={15} />
                {webinar?.duration_minutes ?? 60} min
              </div>

            </div>

            {/* DESKTOP CTA */}

            <div className="desktop-register-hint">
              <Sparkles size={16} />
              Reserve your free seat →
            </div>

          </div>

          {/* =========================
              REGISTER CARD
          ========================== */}

          <div className="webinar-register-area">

            {step === "mobile" ? (

              <div className="webinar-card">

                <div className="card-top">

                  <div className="card-icon">
                    <Sparkles size={20} />
                  </div>

                  <span className="card-label">
                    STEP 1 OF 2
                  </span>

                </div>

                <h2>
                  Join the webinar.
                </h2>

                <p className="card-description">
                  Register free and get instant access.
                </p>

                <form onSubmit={submitMobile}>

                  <div className="field">

                    <label htmlFor="mobile">
                      Mobile number
                    </label>

                    <div className="input-wrap webinar-input-wrap">

                      <span className="prefix">
                        +91
                      </span>

                      <input
                        id="mobile"
                        className="input"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="98765 43210"
                        value={mobile}
                        onChange={(event) =>
                          setMobile(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10)
                          )
                        }
                        maxLength={10}
                        required
                      />

                    </div>

                  </div>

                  {error ? (
                    <p
                      className="error"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className="webinar-primary-btn"
                    disabled={
                      loading ||
                      mobile.replace(/\D/g, "").length !== 10
                    }
                  >
                    {loading ? (
                      "Sending..."
                    ) : (
                      <>
                        Get Free Access
                        <ArrowRight size={19} />
                      </>
                    )}
                  </button>

                </form>

                <div className="card-trust">

                  <ShieldCheck size={15} />

                  <span>
                    Free registration · Secure verification
                  </span>

                </div>

              </div>

            ) : (

              <div className="webinar-card">

                <div className="card-top">

                  <div className="card-icon">
                    <ShieldCheck size={20} />
                  </div>

                  <span className="card-label">
                    STEP 2 OF 2
                  </span>

                </div>

                <h2>
                  Verify your number.
                </h2>

                <p className="card-description">
                  Enter the 4-digit code sent to
                  <strong>
                    {" "}
                    {challenge?.mobile ?? mobile}
                  </strong>
                  .
                </p>

                {challenge?.pilotCode ? (
                  <div className="demo-note">
                    Access code:{" "}
                    <strong>{challenge.pilotCode}</strong>
                  </div>
                ) : null}

                <form onSubmit={verifyOtp}>

                  <div
                    className="otp-grid"
                    onPaste={handlePaste}
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
                        className="otp-input"
                        inputMode="numeric"
                        autoComplete={
                          index === 0
                            ? "one-time-code"
                            : "off"
                        }
                        value={digit}
                        onChange={(event) =>
                          changeDigit(
                            index,
                            event.target.value
                          )
                        }
                        onKeyDown={(event) =>
                          handleKeyDown(
                            index,
                            event
                          )
                        }
                      />
                    ))}

                  </div>

                  {error ? (
                    <p
                      className="error"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  {notice ? (
                    <p
                      className="success"
                      role="status"
                    >
                      {notice}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className="webinar-primary-btn"
                    disabled={
                      loading ||
                      digits.some(
                        (digit) => !digit
                      )
                    }
                  >
                    {loading ? (
                      "Verifying..."
                    ) : (
                      <>
                        Continue
                        <ArrowRight size={19} />
                      </>
                    )}
                  </button>

                  <div className="otp-actions">

                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={loading}
                      className="otp-link"
                    >
                      <RefreshCcw size={15} />
                      Resend code
                    </button>

                    <button
                      type="button"
                      onClick={changeNumber}
                      disabled={loading}
                      className="otp-link"
                    >
                      <X size={15} />
                      Change number
                    </button>

                  </div>

                </form>

              </div>

            )}

          </div>

        </div>
      </section>

      {/* =========================
          THREE STEPS
      ========================== */}

      <section className="webinar-steps-section">

        <div className="webinar-container">

          <div className="section-heading">

            <span>YOUR JOURNEY</span>

            <h2>
              From idea to action.
            </h2>

          </div>

          <div className="webinar-steps">

            <div className="step-card">

              <div className="step-number">
                01
              </div>

              <h3>Discover</h3>

              <p>
                Find the right idea and opportunity.
              </p>

            </div>

            <div className="step-card">

              <div className="step-number">
                02
              </div>

              <h3>Build</h3>

              <p>
                Use AI and practical tools to create.
              </p>

            </div>

            <div className="step-card">

              <div className="step-number">
                03
              </div>

              <h3>Launch</h3>

              <p>
                Turn your learning into your next move.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          TOPICS
      ========================== */}

      <section className="webinar-topics-section">

        <div className="webinar-container">

          <div className="topics-content">

            <div className="section-heading">

              <span>WHAT YOU'LL EXPLORE</span>

              <h2>
                Learn. Build. Move forward.
              </h2>

            </div>

            <div className="topic-list">

              <div className="topic-item">
                <span>01</span>
                Startup Thinking
              </div>

              <div className="topic-item">
                <span>02</span>
                AI for Building
              </div>

              <div className="topic-item">
                <span>03</span>
                Idea Validation
              </div>

              <div className="topic-item">
                <span>04</span>
                Career & Growth
              </div>

            </div>

          </div>

          <div className="bottom-cta">

            <div>

              <span>
                FREE LIVE WEBINAR
              </span>

              <h2>
                Your next step starts here.
              </h2>

            </div>

            <button
              className="bottom-cta-btn"
              onClick={() => {
                document
                  .getElementById("mobile")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                  });
              }}
            >
              Reserve My Seat
              <ArrowRight size={18} />
            </button>

          </div>

        </div>

      </section>

      <StudentFooter />

    </main>
  );
}
