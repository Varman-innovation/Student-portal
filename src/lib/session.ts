import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const key = new TextEncoder().encode(env.SESSION_SECRET);
const studentCookie = "vil_student_session";
const adminCookie = "vil_admin_session";

type SessionPayload = { sub: string; role: "student" | "admin" };

async function createToken(payload: SessionPayload, expiresIn: string) {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

async function readToken(name: string, role: SessionPayload["role"]) {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (payload.role !== role || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/"
};

export async function setStudentSession(studentId: string) {
  const token = await createToken({ sub: studentId, role: "student" }, "30d");
  (await cookies()).set(studentCookie, token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
}

export async function getStudentSession() {
  return readToken(studentCookie, "student");
}

export async function clearStudentSession() {
  (await cookies()).delete(studentCookie);
}

export async function setAdminSession(username: string) {
  const token = await createToken({ sub: username, role: "admin" }, "12h");
  (await cookies()).set(adminCookie, token, { ...cookieOptions, maxAge: 60 * 60 * 12 });
}

export async function getAdminSession() {
  return readToken(adminCookie, "admin");
}

export async function clearAdminSession() {
  (await cookies()).delete(adminCookie);
}
