import { NextResponse } from 'next/server';

import { getRegistrationDatabase } from '@/db';
import {
  normalizeRegistration,
  validateRegistration,
  type RegistrationPayload,
} from '@/lib/registration';

const upstreamUrl = 'https://varman-student-portal.netlify.app/api/auth/verify';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RegistrationPayload> & {
      studentId?: string | number;
      code?: string | number;
    };
    const registration = normalizeRegistration(body);
    const validationError = validateRegistration(registration);
    const studentId = String(body.studentId ?? '').trim();
    const code = String(body.code ?? '')
      .replace(/\D/g, '')
      .slice(0, 4);

    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 });
    if (!studentId || code.length !== 4)
      return NextResponse.json(
        { error: 'Enter the 4-digit verification code.' },
        { status: 400 },
      );

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ studentId, code }),
    });
    const upstreamResult = await upstream
      .json()
      .catch(() => ({ error: 'Verification failed. Please try again.' }));
    if (!upstream.ok)
      return NextResponse.json(upstreamResult, { status: upstream.status });

    const database = getRegistrationDatabase();
    try {
      await database
        .prepare(`
        INSERT INTO webinar_registrations
          (first_name, email, phone, upstream_student_id, source, campaign, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          registration.firstName,
          registration.email,
          registration.phone,
          studentId,
          registration.source ?? null,
          registration.campaign ?? null,
          new Date().toISOString(),
        )
        .run();
      return NextResponse.json({ registered: true });
    } catch (databaseError) {
      if (
        databaseError instanceof Error &&
        /unique|constraint/i.test(databaseError.message)
      ) {
        return NextResponse.json({ registered: true, duplicate: true });
      }
      throw databaseError;
    }
  } catch {
    return NextResponse.json(
      { error: 'Registration could not be completed. Please try again.' },
      { status: 500 },
    );
  }
}
