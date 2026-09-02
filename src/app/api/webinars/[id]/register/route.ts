import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { store } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const studentId = await getStudentSession();
  if (!studentId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const student = await store.getStudent(studentId);
  if (!student?.onboarding_completed_at) return NextResponse.json({ error: "Complete onboarding first" }, { status: 428 });
  try {
    const { id } = await context.params;
    const registration = await store.register(studentId, id);
    return NextResponse.json({ registration });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Registration failed" }, { status: 400 });
  }
}
