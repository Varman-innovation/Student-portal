import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeIndianMobile } from "@/lib/domain";
import { store } from "@/lib/store";

const bodySchema = z.object({ mobile: z.string().min(10).max(20), source: z.string().max(80).optional(), campaign: z.string().max(100).optional() });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const mobile = normalizeIndianMobile(body.mobile);
    const student = await store.startLogin(mobile, { source: body.source, campaign: body.campaign });
    return NextResponse.json({ studentId: student.id, mobile: `+91 ••••• ${mobile.slice(-4)}`, expiresIn: 300 });
  } catch (reason) {
    const message = reason instanceof z.ZodError ? "Enter a valid mobile number" : reason instanceof Error ? reason.message : "Unable to request verification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
