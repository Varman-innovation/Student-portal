import { describe, expect, it } from "vitest";
import { nextStudentPath, normalizeIndianMobile, onboardingFields, percent, type Student } from "@/lib/domain";

const baseStudent: Student = {
  id: "d2cbaf9d-cfe9-4529-94b6-389a5bf9740e",
  mobile: "+919876543210",
  created_at: new Date().toISOString(),
  last_activity_at: new Date().toISOString(),
  onboarding_step: 1,
  profile: {}
};

describe("Indian mobile normalization", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["91-9876543210", "+919876543210"]
  ])("normalizes %s", (input, expected) => expect(normalizeIndianMobile(input)).toBe(expected));

  it.each(["123", "5876543210", "98765432100", "+441234567890"])("rejects %s", (input) => {
    expect(() => normalizeIndianMobile(input)).toThrow(/valid 10-digit/);
  });
});

describe("onboarding configuration", () => {
  it("contains exactly two ordered stages with required screenshot fields", () => {
    expect(new Set(onboardingFields.map((field) => field.step))).toEqual(new Set([1, 2]));
    expect(onboardingFields.map((field) => field.key)).toEqual(["full_name", "region", "language", "phone", "degree", "branch", "year_of_study"]);
    expect(onboardingFields.every((field) => field.required)).toBe(true);
    expect(onboardingFields.find((field) => field.key === "phone")?.readOnly).toBe(true);
  });
});

describe("flow routing", () => {
  it("routes unverified students to verification", () => expect(nextStudentPath(baseStudent)).toBe("/verify"));
  it("routes verified students to onboarding", () => expect(nextStudentPath({ ...baseStudent, verified_at: new Date().toISOString() })).toBe("/onboarding"));
  it("routes completed students to webinar", () => expect(nextStudentPath({ ...baseStudent, verified_at: new Date().toISOString(), onboarding_completed_at: new Date().toISOString() })).toBe("/webinar"));
});

describe("funnel percentages", () => {
  it("returns zero for an empty denominator", () => expect(percent(10, 0)).toBe(0));
  it("rounds to one decimal", () => expect(percent(79, 103)).toBe(76.7));
});
