import { env } from 'cloudflare:workers';

export function getRegistrationDatabase() {
  if (!env.DB) throw new Error('Registration database is unavailable.');
  return env.DB;
}
