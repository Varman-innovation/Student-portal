"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { StudentFooter } from "@/components/student-footer";
import type { OnboardingField, Student, StudentProfile } from "@/lib/domain";

export default function OnboardingPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [fields, setFields] = useState<OnboardingField[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [profile, setProfile] = useState<StudentProfile>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/session").then((r) => r.json()), fetch("/api/onboarding/schema").then((r) => r.json())])
      .then(([session, schema]) => {
        if (!session.student) return router.replace("/");
        if (session.student.onboarding_completed_at) return router.replace("/webinar");
        setStudent(session.student);
        setProfile({ ...session.student.profile, phone: session.student.mobile });
        setStep(session.student.onboarding_step === 2 ? 2 : 1);
        setFields(schema.fields);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const currentFields = useMemo(() => fields.filter((field) => field.step === step), [fields, step]);

  async function save() {
    setError("");
    for (const field of currentFields) {
      if (field.required && !String(profile[field.key] ?? "").trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step, profile })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save your details");
      if (step === 1) {
        setStudent(data.student);
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/webinar");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your details");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main><BrandHeader /><section className="app-page"><div className="app-container">Loading your profile…</div></section></main>;

  return (
    <main>
      <BrandHeader />
      <section className="app-page">
        <div className="app-container">
          <div className="page-head">
            <div>
              <div className="eyebrow">Step {step} of 2</div>
              <h1 className="page-title">Complete your profile</h1>
              <p>Help us tailor the live session.</p>
            </div>
            <div className="stepper" aria-label={`Step ${step} of 2`}>
              <span className={`step-dot ${step >= 1 ? "active" : ""}`}>1</span><span className="step-line" /><span className={`step-dot ${step === 2 ? "active" : ""}`}>2</span>
            </div>
          </div>
          <section className="form-card">
            <div className="verified-contact"><CheckCircle2 size={18} /> Verified mobile <strong>{student?.mobile.replace(/(\+91)(\d{2})\d{4}(\d{4})/, "$1 $2••••$3")}</strong></div>
            <h2>{step === 1 ? "About you" : "Your goals"}</h2>
            <p className="subcopy" style={{ marginTop: 8 }}>{step === 1 ? "For your registration." : "Choose what fits you best."}</p>
            <div className="form-grid">
              {currentFields.map((field) => (
                <div className="field" key={field.key}>
                  <label htmlFor={field.key}>{field.label} {field.required ? <span className="required">*</span> : null}</label>
                  {field.type === "select" ? (
                    <div className="input-wrap"><select id={field.key} className="select" value={profile[field.key] ?? ""} onChange={(e) => setProfile((current) => ({ ...current, [field.key]: e.target.value }))}><option value="">Select {field.label.toLowerCase()}</option>{field.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select></div>
                  ) : field.type === "phone" ? (
                    <div className="input-wrap"><span className="prefix">IND (+91)</span><input id={field.key} className="input" value={(profile.phone ?? "").replace("+91", "")} readOnly /></div>
                  ) : (
                    <div className="input-wrap"><input id={field.key} className="input" value={profile[field.key] ?? ""} placeholder={field.placeholder} onChange={(e) => setProfile((current) => ({ ...current, [field.key]: e.target.value }))} /></div>
                  )}
                </div>
              ))}
            </div>
            {error ? <p className="error" role="alert">{error}</p> : null}
            <div className="form-actions">
              {step === 2 ? <button type="button" className="secondary-btn" onClick={() => setStep(1)}><ArrowLeft size={18} /> Back</button> : <span />}
              <button type="button" className="primary-btn" onClick={save} disabled={saving}>{saving ? "Saving…" : step === 1 ? <>Continue <ArrowRight size={18} /></> : <>Confirm my seat <ArrowRight size={18} /></>}</button>
            </div>
          </section>
        </div>
      </section>
      <StudentFooter />
    </main>
  );
}
