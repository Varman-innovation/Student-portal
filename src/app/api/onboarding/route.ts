import { NextResponse } from "next/server";
import { z } from "zod";
import { onboardingFields, type StudentProfile } from "@/lib/domain";
import { getStudentSession } from "@/lib/session";
import { store } from "@/lib/store";

const bodySchema = z.object({ step: z.union([z.literal(1), z.literal(2)]), profile: z.record(z.string(), z.string().optional()) });

export async function PUT(request: Request) {
  const studentId = await getStudentSession();
  if (!studentId) return NextResponse.json({ error: "Please verify your mobile number" }, { status: 401 });
  try {
    const body = bodySchema.parse(await request.json());
    const fields = onboardingFields.filter((field) => field.step === body.step);
    for (const field of fields) {
      if (field.required && !String(body.profile[field.key] ?? "").trim()) return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
      if (field.options && body.profile[field.key] && !field.options.includes(String(body.profile[field.key]))) return NextResponse.json({ error: `Choose a valid ${field.label.toLowerCase()}` }, { status: 400 });
    }
    const allowed = Object.fromEntries(onboardingFields.map((field) => [field.key, body.profile[field.key]]).filter(([, value]) => value !== undefined)) as StudentProfile;
    const student = await store.saveOnboarding(studentId, body.step, allowed);
    return NextResponse.json({ student });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Unable to save onboarding" }, { status: 400 });
  }
}
