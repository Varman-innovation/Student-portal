import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminSession } from "@/lib/session";
import { store } from "@/lib/store";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const [funnel, students, webinars] = await Promise.all([store.funnel(), store.students(), store.webinars()]);
  return <AdminDashboard initialFunnel={funnel} initialStudents={students} initialWebinars={webinars} demoMode={env.demoMode} />;
}
