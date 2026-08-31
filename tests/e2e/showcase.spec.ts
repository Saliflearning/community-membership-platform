import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("showcase is read-only, responsive, and protected by security headers", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/?lang=en");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["strict-transport-security"]).toContain("max-age=63072000");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Secure digital membership");
  await expect(page.getByText("Portfolio demo mode", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Demo mode - submission disabled" })).toBeDisabled();

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
  expect(errors).toEqual([]);

  if (process.env.CAPTURE_ASSETS === "1") {
    mkdirSync("docs/assets", { recursive: true });
    const file = testInfo.project.name.startsWith("mobile") ? "home-mobile.png" : "home-desktop.png";
    await page.screenshot({ path: `docs/assets/${file}`, fullPage: true });
    if (testInfo.project.name.startsWith("desktop")) {
      await page.screenshot({
        path: "docs/assets/social-preview.png",
        clip: { x: 0, y: 0, width: 1280, height: 640 }
      });
    }
  }
});

test("public writes fail closed in showcase mode", async ({ request }) => {
  const response = await request.post("/api/registrations", { multipart: {} });
  expect(response.status()).toBe(503);
  await expect(response.json()).resolves.toEqual({
    error: "Submissions are disabled in portfolio demo mode."
  });
});

test("invalid public verification reveals no member details", async ({ request }) => {
  const response = await request.get("/api/verify/not-a-valid-token");
  expect(response.status()).toBe(404);
  await expect(response.json()).resolves.toEqual({ status: "invalid" });
});

test("public and authentication routes render without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const route of ["/", "/portal?lang=en", "/admin/login?lang=en", "/privacy?lang=en", "/terms?lang=en"]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
  }

  expect(errors).toEqual([]);
});
