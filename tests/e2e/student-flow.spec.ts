import { expect, test } from "@playwright/test";

test("new student completes the full conversion journey", async ({ page }, testInfo) => {
  await page.goto("/?source=whatsapp&campaign=september_batch");
  const mobile = testInfo.retry
    ? (testInfo.project.name === "mobile-chrome" ? "9876543212" : "9876543213")
    : (testInfo.project.name === "mobile-chrome" ? "9876543210" : "9876543211");
  await page.getByLabel("Mobile number").fill(mobile);
  await page.getByRole("button", { name: /get my code/i }).click();
  await expect(page).toHaveURL(/\/verify/);

  for (const [index, digit] of ["0", "0", "0", "0"].entries()) await page.getByLabel(`OTP digit ${index + 1}`).fill(digit);
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByLabel("Full name").fill("Raghu Kumar");
  await page.getByLabel("College or institution").fill("Varman College of Technology");
  await page.getByLabel("Preferred language").selectOption("Tamil");
  await page.getByRole("button", { name: /^continue$/i }).click();

  await page.getByLabel("Degree").selectOption("B.Tech / B.E");
  await page.getByLabel("Year of study").selectOption("3rd Year");
  await page.getByLabel("What would you most like help with?").selectOption("Building an MVP");
  await page.getByRole("button", { name: /confirm my seat/i }).click();
  await expect(page).toHaveURL(/\/webinar/);

  await expect(page.getByText("Entrepreneurship Masterclass").first()).toBeVisible();
  await expect(page.getByText("Registration confirmed", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /add to calendar/i })).toBeVisible();

  const repeat = await page.evaluate(async () => {
    const match = location.pathname;
    void match;
    const response = await fetch("/api/webinars/next");
    const next = await response.json();
    const registration = await fetch(`/api/webinars/${next.webinar.id}/register`, { method: "POST" });
    return registration.status;
  });
  expect(repeat).toBe(200);

  const joinStatus = await page.evaluate(async () => {
    const response = await fetch("/api/webinars/next");
    const next = await response.json();
    return (await fetch(`/api/webinars/${next.webinar.id}/join`, { method: "POST" })).status;
  });
  expect(joinStatus).toBe(409);
});

test("invalid mobile and incorrect OTP are rejected", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Mobile number").fill("1234567890");
  await page.getByRole("button", { name: /get my code/i }).click();
  await expect(page.locator(".error")).toContainText("valid");

  await page.getByLabel("Mobile number").fill(testInfo.project.name === "mobile-chrome" ? "9765432109" : "9765432108");
  await page.getByRole("button", { name: /get my code/i }).click();
  for (const [index, digit] of ["1", "2", "3", "4"].entries()) await page.getByLabel(`OTP digit ${index + 1}`).fill(digit);
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.locator(".error")).toContainText("Incorrect");
});

test("onboarding validates required fields and resumes at step two", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Mobile number").fill(testInfo.project.name === "mobile-chrome" ? "9654321098" : "9654321097");
  await page.getByRole("button", { name: /get my code/i }).click();
  for (let index = 0; index < 4; index++) await page.getByLabel(`OTP digit ${index + 1}`).fill("0");
  await page.getByRole("button", { name: /^continue$/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.locator(".error")).toContainText("Full name");

  await page.getByLabel("Full name").fill("Meena S");
  await page.getByLabel("College or institution").fill("Varman Arts College");
  await page.getByLabel("Preferred language").selectOption("English");
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.getByText("Your goals", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Degree")).toBeVisible();
});
