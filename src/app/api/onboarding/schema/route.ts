import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ version: 1, fields: await store.getOnboardingFields() });
}
