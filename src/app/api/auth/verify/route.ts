import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/security";
import { setStudentSession } from "@/lib/session";
import { store } from "@/lib/store";
import { nextStudentPath } from "@/lib/domain";

const bodySchema = z.object({ studentId: z.string().uuid(), code: z.string().regex(/^\d{4,6}$/) });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    if (!env.allowDemoOtp) return NextResponse.json({ error: "Demo verification is disabled" }, { status: 503 });
    if (!safeEqual(body.code, env.DEMO_OTP_CODE)) return NextResponse.json({ error: "Incorrect verification code" }, { status: 401 });
    const student = await store.verifyStudent(body.studentId);
    await setStudentSession(student.id);
    return NextResponse.json({ ok: true, nextPath: nextStudentPath(student) });
  } catch (reason) {
    const message = reason instanceof z.ZodError ? "Enter the complete verification code" : reason instanceof Error ? reason.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
