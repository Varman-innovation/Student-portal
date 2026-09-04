"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldPlus } from "lucide-react";

type FieldName = "fullName" | "email" | "phoneNumber" | "password";
type FieldErrors = Partial<Record<FieldName, string[]>>;
type CreatedAdmin = { id: string; full_name: string; email: string; phone_number: string; created_at: string };

export function AdminRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createdAdmin, setCreatedAdmin] = useState<CreatedAdmin | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          email: form.get("email"),
          phoneNumber: form.get("phoneNumber"),
          password: form.get("password")
        })
      });
      const body = await response.json().catch(() => ({ error: "The server returned an invalid response" }));
      if (!response.ok) {
        setError(body.error ?? "Unable to create the admin");
        setFieldErrors(body.details ?? {});
        return;
      }
      setCreatedAdmin(body.admin);
      event.currentTarget.reset();
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (createdAdmin) {
    return (
      <section className="admin-register-card admin-success-card" aria-live="polite">
        <CheckCircle2 size={42} aria-hidden="true" />
        <div>
          <div className="eyebrow">Admin created</div>
          <h1>{createdAdmin.full_name} can now sign in</h1>
          <p className="subcopy">The account was stored securely. The password was never returned by the API.</p>
        </div>
        <dl className="admin-created-details">
          <div><dt>Email</dt><dd>{createdAdmin.email}</dd></div>
          <div><dt>Phone</dt><dd>{createdAdmin.phone_number}</dd></div>
        </dl>
        <button className="primary-btn full-btn" type="button" onClick={() => setCreatedAdmin(null)}>Create another admin</button>
        <Link className="secondary-btn full-btn" href="/admin">Return to dashboard</Link>
      </section>
    );
  }

  return (
    <section className="admin-register-card">
      <div className="admin-register-heading">
        <div className="register-icon"><ShieldPlus size={24} aria-hidden="true" /></div>
        <div>
          <div className="eyebrow">Team access</div>
          <h1>Create an admin</h1>
        </div>
      </div>
      <p className="subcopy">Add an authorised team member to the Varman admin portal.</p>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="fullName">Full name <span className="required">*</span></label>
          <div className="input-wrap"><input id="fullName" name="fullName" className="input" autoComplete="name" minLength={2} maxLength={100} required aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined} /></div>
          {fieldErrors.fullName ? <p className="error field-error" id="fullName-error">{fieldErrors.fullName[0]}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="email">Email <span className="required">*</span></label>
          <div className="input-wrap"><input id="email" name="email" className="input" type="email" autoComplete="email" maxLength={254} required aria-describedby={fieldErrors.email ? "email-error" : undefined} /></div>
          {fieldErrors.email ? <p className="error field-error" id="email-error">{fieldErrors.email[0]}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="phoneNumber">Phone number <span className="required">*</span></label>
          <div className="input-wrap"><input id="phoneNumber" name="phoneNumber" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" required aria-describedby={fieldErrors.phoneNumber ? "phoneNumber-error" : "phoneNumber-help"} /></div>
          {fieldErrors.phoneNumber ? <p className="error field-error" id="phoneNumber-error">{fieldErrors.phoneNumber[0]}</p> : <p className="field-help" id="phoneNumber-help">Include the country code when outside India.</p>}
        </div>
        <div className="field">
          <label htmlFor="password">Password <span className="required">*</span></label>
          <div className="input-wrap"><input id="password" name="password" className="input" type="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby={fieldErrors.password ? "password-error" : "password-help"} /></div>
          {fieldErrors.password ? <p className="error field-error" id="password-error">{fieldErrors.password[0]}</p> : <p className="field-help" id="password-help">Use 12+ characters with uppercase, lowercase, a number, and a special character.</p>}
        </div>

        {error ? <p className="form-alert error" role="alert">{error}</p> : null}
        <button className="primary-btn full-btn" disabled={loading}>{loading ? "Creating admin…" : "Register admin"}</button>
      </form>
    </section>
  );
}

export function AdminRegistrationBackLink() {
  return <Link href="/admin" className="admin-back-link"><ArrowLeft size={16} aria-hidden="true" /> Back to dashboard</Link>;
}

