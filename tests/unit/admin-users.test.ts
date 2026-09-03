import { describe, expect, it } from "vitest";
import { adminRegistrationSchema } from "@/lib/admin-validation";
import { hashPassword, verifyPassword } from "@/lib/security";

describe("admin registration validation", () => {
  const valid = {
    fullName: "Asha Raman",
    email: "ASHA@example.com",
    phoneNumber: "+91 98765 43210",
    password: "StrongPass!42"
  };

  it("normalizes valid admin details", () => {
    const result = adminRegistrationSchema.parse(valid);
    expect(result.email).toBe("asha@example.com");
    expect(result.phoneNumber).toBe("+919876543210");
  });

  it.each([
    [{ ...valid, fullName: "" }, "Full name"],
    [{ ...valid, email: "not-an-email" }, "email"],
    [{ ...valid, phoneNumber: "123" }, "phone"],
    [{ ...valid, password: "weak" }, "Password"]
  ])("rejects invalid input", (input, message) => {
    const result = adminRegistrationSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message.toLowerCase()).toContain(message.toLowerCase());
  });
});

describe("admin password hashing", () => {
  it("stores a salted hash and verifies the matching password", async () => {
    const password = "StrongPass!42";
    const first = await hashPassword(password);
    const second = await hashPassword(password);

    expect(first).not.toContain(password);
    expect(first).not.toBe(second);
    await expect(verifyPassword(password, first)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass!42", first)).resolves.toBe(false);
  });
});

