import { expect, test } from "@playwright/test";

test("admin login rejects incorrect credentials and shows the funnel", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Admin email or ID").fill("admin");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.locator(".error")).toContainText("Invalid");

  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Funnel overview" })).toBeVisible();
  await expect(page.getByText("OTP verified")).toBeVisible();
});

test("admin can create a scheduled webinar", async ({ page }, testInfo) => {
  await page.goto("/admin/login");
  await page.getByLabel("Admin email or ID").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.getByRole("button", { name: /webinars/i }).click();
  const title = testInfo.project.name === "mobile-chrome" ? "Mobile Founder Readiness Lab" : "Desktop Founder Readiness Lab";
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("A practical founder readiness session.");
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const localValue = new Date(future.getTime() - future.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  await page.getByLabel("Start date & time").fill(localValue);
  await page.getByLabel("Meeting URL").fill("https://meet.google.com/");
  await page.getByRole("button", { name: /create scheduled webinar/i }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole("button", { name: `Edit ${title}` }).click();
  const updatedTitle = `${title} — Updated`;
  await page.getByLabel("Title").fill(updatedTitle);
  await page.getByRole("button", { name: /save webinar changes/i }).click();
  await expect(page.getByText(updatedTitle)).toBeVisible();

  await page.getByRole("button", { name: `Cancel ${updatedTitle}` }).click();
  await expect(page.getByRole("row").filter({ hasText: updatedTitle })).toContainText("cancelled");
});

test("admin can create a database-backed admin account and use it to sign in", async ({ page }, testInfo) => {
  await page.goto("/admin/login");
  await page.getByLabel("Admin email or ID").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/register");
  const email = `new-admin-${testInfo.project.name}-${crypto.randomUUID()}@example.com`;
  const password = "SecureAdmin!42";
  await page.getByLabel(/Full name/).fill("New Varman Admin");
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/Phone number/).fill("+91 98765 43210");
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole("button", { name: "Register admin" }).click();

  await expect(page.getByRole("heading", { name: "New Varman Admin can now sign in" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.request.post("/api/admin/logout");
  await page.goto("/admin/login");
  await page.getByLabel("Admin email or ID").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Funnel overview" })).toBeVisible();
});
