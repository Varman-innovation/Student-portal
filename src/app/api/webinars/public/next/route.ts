import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const webinar = await store.getPublicNextWebinar();
    return NextResponse.json({ webinar });
  } catch {
    return NextResponse.json({ error: "Unable to load the next masterclass" }, { status: 500 });
  }
}
