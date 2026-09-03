import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { store } from "@/lib/store";

function icalDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcal(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const studentId = await getStudentSession();
  if (!studentId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await context.params;
  const next = await store.getNextWebinar(studentId);
  if (!next.webinar || next.webinar.id !== id || !next.registration) {
    return NextResponse.json({ error: "A confirmed registration is required" }, { status: 403 });
  }
  const starts = new Date(next.webinar.starts_at);
  const ends = new Date(starts.getTime() + next.webinar.duration_minutes * 60 * 1000);
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Varman Innovation Labs//Student Masterclass//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${next.registration.id}@varmaninnovationlabs.com`, `DTSTAMP:${icalDate(new Date())}`,
    `DTSTART:${icalDate(starts)}`, `DTEND:${icalDate(ends)}`, `SUMMARY:${escapeIcal(next.webinar.title)}`,
    `DESCRIPTION:${escapeIcal(`${next.webinar.description}\n\nOpen your Varman student portal 10 minutes before the session to join.`)}`,
    "END:VEVENT", "END:VCALENDAR", ""
  ].join("\r\n");
  return new NextResponse(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": "attachment; filename=varman-masterclass.ics",
      "cache-control": "private, no-store"
    }
  });
}
