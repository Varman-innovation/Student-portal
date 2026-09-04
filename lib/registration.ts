export type RegistrationPayload = {
  firstName: string;

  phone: string;
  source?: string;
  campaign?: string;
};

export function normalizeRegistration(
  input: Partial<RegistrationPayload>,
): RegistrationPayload {
  return {
    firstName: String(input.firstName ?? '')
      .trim()
      .slice(0, 80),

    phone: String(input.phone ?? '')
      .replace(/\D/g, '')
      .slice(-10),
    source: input.source
      ? String(input.source).trim().slice(0, 100)
      : undefined,
    campaign: input.campaign
      ? String(input.campaign).trim().slice(0, 100)
      : undefined,
  };
}

export function validateRegistration(data: RegistrationPayload) {
  if (!data.firstName) return 'Enter your name.';

  if (!/^[6-9]\d{9}$/.test(data.phone))
    return 'Enter a valid 10-digit Indian mobile number.';
  return null;
}
