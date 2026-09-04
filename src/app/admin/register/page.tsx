import { redirect } from "next/navigation";
import { AdminRegistrationBackLink, AdminRegistrationForm } from "@/components/admin-registration-form";
import { getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationPage() {
  if (!(await getAdminSession())) redirect("/admin/login");

  return (
    <main className="admin-register-page">
      <div className="admin-register-shell">
        <AdminRegistrationBackLink />
        <AdminRegistrationForm />
      </div>
    </main>
  );
}

