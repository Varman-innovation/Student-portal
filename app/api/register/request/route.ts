import { NextResponse } from 'next/server';

import {
  normalizeRegistration,
  validateRegistration,
  type RegistrationPayload,
} from '@/lib/registration';

const upstreamUrl =
  'https://varman-student-portal.netlify.app/api/auth/request';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RegistrationPayload>;
    const registration = normalizeRegistration(body);
    const validationError = validateRegistration(registration);
    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 });

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mobile: registration.phone,
        source: registration.source,
        campaign: registration.campaign,
      }),
    });
    const result = await upstream
      .json()
      .catch(() => ({ error: 'Unable to send your verification code.' }));
    return NextResponse.json(result, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: 'Unable to send your verification code. Please try again.' },
      { status: 502 },
    );
  }
}
