export type RegistrationPayload = {
  firstName: string;
  lastName: string;
  email: string;
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
    lastName: String(input.lastName ?? '')
      .trim()
      .slice(0, 80),
    email: String(input.email ?? '')
      .trim()
      .toLowerCase()
      .slice(0, 180),
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
  if (!data.firstName || !data.lastName)
    return 'Enter your first and last name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return 'Enter a valid email address.';
  if (!/^[6-9]\d{9}$/.test(data.phone))
    return 'Enter a valid 10-digit Indian mobile number.';
  return null;
}
