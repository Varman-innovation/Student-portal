import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const parsed = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DEMO_MODE: z.string().optional(),
    ALLOW_DEMO_OTP: z.string().optional(),
    DEMO_OTP_CODE: z.string().regex(/^\d{4,6}$/).default("0000"),
    ADMIN_USERNAME: z.string().min(3).default("admin"),
    ADMIN_PASSWORD: z.string().min(6).default("admin123"),
    SESSION_SECRET: z.string().min(16).default("local-development-secret-change-me"),
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    DEFAULT_MEETING_URL: z.string().url().default("https://meet.google.com/")
  })
  .parse(process.env);

export const env = {
  ...parsed,
  demoMode: parsed.DEMO_MODE === "true" || !parsed.NEXT_PUBLIC_SUPABASE_URL || !parsed.SUPABASE_SERVICE_ROLE_KEY,
  allowDemoOtp: parsed.ALLOW_DEMO_OTP === "true" || parsed.NODE_ENV !== "production",
  adminConfigured: parsed.NODE_ENV !== "production" || Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET)
};
