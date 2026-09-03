import { NextResponse } from "next/server";
import { z } from "zod";
import { adminStore, AdminAlreadyExistsError } from "@/lib/admin-store";
import { adminRegistrationSchema } from "@/lib/admin-validation";
import { hashPassword } from "@/lib/security";
import { getAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Admin authentication is required" }, { status: 401 });
  }

  try {
    const parsed = adminRegistrationSchema.safeParse(await request.json());
    if (!parsed.success) {
      const details = z.flattenError(parsed.error).fieldErrors;
      const firstMessage = parsed.error.issues[0]?.message ?? "Invalid admin details";
      return NextResponse.json({ error: firstMessage, details }, { status: 400 });
    }

    const { password, ...details } = parsed.data;
    const passwordHash = await hashPassword(password);
    const admin = await adminStore.create({ ...details, passwordHash });
    return NextResponse.json({ success: true, admin }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
    console.error("Admin creation failed", error);
    return NextResponse.json({ error: "Unable to create the admin right now" }, { status: 500 });
  }
}

