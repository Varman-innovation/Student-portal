import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { store } from "@/lib/store";
import { nextStudentPath } from "@/lib/domain";

export async function GET() {
  const studentId = await getStudentSession();
  if (!studentId) return NextResponse.json({ student: null }, { status: 401 });
  const student = await store.getStudent(studentId);
  if (!student) return NextResponse.json({ student: null }, { status: 401 });
  return NextResponse.json({ student, nextPath: nextStudentPath(student) });
}
