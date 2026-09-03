import { NextResponse } from "next/server";
import { z } from "zod";
import { adminStore } from "@/lib/admin-store";
import { env } from "@/lib/env";
import { safeEqual, verifyPassword } from "@/lib/security";
import { setAdminSession } from "@/lib/session";

const bodySchema = z.object({ username: z.string(), password: z.string() });

type Attempt = { count: number; resetsAt: number };
const rateLimitGlobal = globalThis as typeof globalThis & { __vilAdminAttempts?: Map<string, Attempt> };
const attempts = rateLimitGlobal.__vilAdminAttempts ?? new Map<string, Attempt>();
rateLimitGlobal.__vilAdminAttempts = attempts;

export async function POST(request: Request) {
  try {
    if (!env.adminConfigured) return NextResponse.json({ error: "Admin access is not configured" }, { status: 503 });
    const key = request.headers.get("x-nf-client-connection-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const current = attempts.get(key);
    if (current && current.resetsAt > Date.now() && current.count >= 5) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }
    const body = bodySchema.parse(await request.json());
    const environmentAdmin = safeEqual(body.username, env.ADMIN_USERNAME) && safeEqual(body.password, env.ADMIN_PASSWORD);
    let databaseAdmin = null;
    if (!environmentAdmin && body.username.includes("@")) {
      databaseAdmin = await adminStore.findByEmail(body.username.trim().toLowerCase());
    }
    const authenticated = environmentAdmin || Boolean(databaseAdmin && await verifyPassword(body.password, databaseAdmin.password_hash));
    if (!authenticated) {
      const active = current && current.resetsAt > Date.now() ? current : { count: 0, resetsAt: Date.now() + 15 * 60 * 1000 };
      attempts.set(key, { ...active, count: active.count + 1 });
      return NextResponse.json({ error: "Invalid admin ID or password" }, { status: 401 });
    }
    attempts.delete(key);
    await setAdminSession(databaseAdmin?.id ?? body.username);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid login request" }, { status: 400 });
  }
}
