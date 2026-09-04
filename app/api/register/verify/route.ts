import { NextResponse } from 'next/server';

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

    return NextResponse.json({ registered: true });
  } catch {
    return NextResponse.json(
      { error: 'Registration could not be completed. Please try again.' },
      { status: 500 },
    );
  }
}
