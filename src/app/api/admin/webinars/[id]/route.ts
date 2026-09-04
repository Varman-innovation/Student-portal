import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";
import { store } from "@/lib/store";

const updateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(3).max(1000).optional(),
  starts_at: z.string().datetime().optional(),
  duration_minutes: z.number().int().min(15).max(480).optional(),
  meeting_url: z.string().url().optional(),
  timezone: z.string().optional(),
  status: z.enum(["draft", "scheduled", "live", "completed", "cancelled"]).optional(),
  capacity: z.number().int().positive().optional()
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = updateSchema.parse(await request.json());
    if (body.starts_at && new Date(body.starts_at).getTime() <= Date.now() && body.status !== "completed" && body.status !== "cancelled") return NextResponse.json({ error: "Webinar must start in the future" }, { status: 400 });
    const { id } = await context.params;
    return NextResponse.json({ webinar: await store.updateWebinar(id, body) });
  } catch (reason) {
    const error = reason instanceof z.ZodError ? reason.issues[0]?.message : reason instanceof Error ? reason.message : "Unable to update webinar";
    return NextResponse.json({ error }, { status: 400 });
  }
}
