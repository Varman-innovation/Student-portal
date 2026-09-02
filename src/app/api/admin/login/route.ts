import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/security";
import { setAdminSession } from "@/lib/session";

const bodySchema = z.object({ username: z.string(), password: z.string() });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    if (!safeEqual(body.username, env.ADMIN_USERNAME) || !safeEqual(body.password, env.ADMIN_PASSWORD)) return NextResponse.json({ error: "Invalid admin ID or password" }, { status: 401 });
    await setAdminSession(body.username);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid login request" }, { status: 400 });
  }
}
