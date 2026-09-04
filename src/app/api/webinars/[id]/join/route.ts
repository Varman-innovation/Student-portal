import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { store } from "@/lib/store";
import { webinarPhase } from "@/lib/domain";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const studentId = await getStudentSession();
  if (!studentId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const { id } = await context.params;
    const next = await store.getNextWebinar(studentId);
    if (!next.webinar || next.webinar.id !== id || !next.registration) {
      return NextResponse.json({ error: "A confirmed registration is required" }, { status: 403 });
    }
    const phase = webinarPhase(next.webinar);
    if (phase === "upcoming") return NextResponse.json({ error: "The join link opens 10 minutes before the session" }, { status: 409 });
    if (phase === "ended") return NextResponse.json({ error: "This live session has ended" }, { status: 410 });
    const result = await store.recordJoin(studentId, id);
    return NextResponse.json({ meetingUrl: result.meetingUrl, registration: result.registration });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Unable to join" }, { status: 400 });
  }
}
