import { z } from "zod";

const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^\+?[1-9]\d{7,14}$/.test(value), "Enter a valid phone number");

export const adminRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254, "Email address is too long"),
  phoneNumber: phoneNumberSchema,
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must be 128 characters or fewer")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/\d/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character")
});

export type AdminRegistrationInput = z.infer<typeof adminRegistrationSchema>;

