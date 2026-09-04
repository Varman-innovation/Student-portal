import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { store } from "@/lib/store";

export async function GET() {
  const studentId = await getStudentSession();
  if (!studentId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const student = await store.getStudent(studentId);
  if (!student?.onboarding_completed_at) return NextResponse.json({ error: "Complete onboarding first" }, { status: 428 });
  const data = await store.getNextWebinar(studentId);
  if (data.webinar) data.webinar = { ...data.webinar, meeting_url: "" };
  return NextResponse.json(data);
}
