import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";
import { store } from "@/lib/store";

const webinarSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(3).max(1000),
  starts_at: z.string().datetime(),
  duration_minutes: z.number().int().min(15).max(480),
  meeting_url: z.string().url(),
  timezone: z.string().default("Asia/Kolkata"),
  status: z.enum(["draft", "scheduled", "live", "completed", "cancelled"]).default("scheduled"),
  capacity: z.number().int().positive().optional()
});

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ webinars: await store.webinars() });
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = webinarSchema.parse(await request.json());
    if (new Date(body.starts_at).getTime() <= Date.now()) return NextResponse.json({ error: "Webinar must start in the future" }, { status: 400 });
    const webinar = await store.createWebinar(body);
    return NextResponse.json({ webinar }, { status: 201 });
  } catch (reason) {
    const error = reason instanceof z.ZodError ? reason.issues[0]?.message : reason instanceof Error ? reason.message : "Unable to create webinar";
    return NextResponse.json({ error }, { status: 400 });
  }
}
