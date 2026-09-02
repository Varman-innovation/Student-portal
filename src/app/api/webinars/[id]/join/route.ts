import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { store } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const studentId = await getStudentSession();
  if (!studentId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const { id } = await context.params;
    const result = await store.recordJoin(studentId, id);
    return NextResponse.json({ meetingUrl: result.meetingUrl, registration: result.registration });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Unable to join" }, { status: 400 });
  }
}
