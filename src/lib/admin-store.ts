import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { AdminRegistrationInput } from "@/lib/admin-validation";

export type PublicAdmin = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  created_at: string;
};

type AdminRecord = PublicAdmin & { password_hash: string };

type AdminStore = {
  create(input: Omit<AdminRegistrationInput, "password"> & { passwordHash: string }): Promise<PublicAdmin>;
  findByEmail(email: string): Promise<AdminRecord | null>;
};

export class AdminAlreadyExistsError extends Error {
  constructor() {
    super("An admin with this email already exists");
    this.name = "AdminAlreadyExistsError";
  }
}

const demoGlobal = globalThis as typeof globalThis & { __vilDemoAdmins?: Map<string, AdminRecord> };
const demoAdmins = demoGlobal.__vilDemoAdmins ?? new Map<string, AdminRecord>();
demoGlobal.__vilDemoAdmins = demoAdmins;

const demoAdminStore: AdminStore = {
  async create(input) {
    if (demoAdmins.has(input.email)) throw new AdminAlreadyExistsError();
    const record: AdminRecord = {
      id: crypto.randomUUID(),
      full_name: input.fullName,
      email: input.email,
      phone_number: input.phoneNumber,
      password_hash: input.passwordHash,
      created_at: new Date().toISOString()
    };
    demoAdmins.set(record.email, record);
    const { password_hash: _passwordHash, ...admin } = record;
    void _passwordHash;
    return structuredClone(admin);
  },
  async findByEmail(email) {
    const admin = demoAdmins.get(email.toLowerCase());
    return admin ? structuredClone(admin) : null;
  }
};

function supabaseClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function supabaseAdminStore(client: SupabaseClient): AdminStore {
  return {
    async create(input) {
      const result = await client
        .from("admins")
        .insert({ full_name: input.fullName, email: input.email, phone_number: input.phoneNumber, password_hash: input.passwordHash })
        .select("id,full_name,email,phone_number,created_at")
        .single();
      if (result.error?.code === "23505") throw new AdminAlreadyExistsError();
      if (result.error) throw result.error;
      return result.data as PublicAdmin;
    },
    async findByEmail(email) {
      const result = await client
        .from("admins")
        .select("id,full_name,email,phone_number,password_hash,created_at")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (result.error) throw result.error;
      return result.data as AdminRecord | null;
    }
  };
}

export const adminStore: AdminStore = env.demoMode ? demoAdminStore : supabaseAdminStore(supabaseClient());

