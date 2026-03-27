import type { APIResponse } from "@playwright/test";
import { test, expect } from "@playwright/test";
import parseCSP from "content-security-policy-parser";

function getCSP(response: APIResponse) {
  return Object.fromEntries(
    parseCSP(response.headers()["content-security-policy"]),
  );
}

test("GET /", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Objective Swift");
  await expect(page.getByRole("link", { name: "View Demo" })).toBeVisible();
});

test.describe("Security headers", () => {
  test("returns required security headers", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers).toMatchObject({
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
    });
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("returns strict Content-Security-Policy", async ({ request }) => {
    const response = await request.get("/");
    const csp = getCSP(response);

    expect(csp).toMatchObject({
      "base-uri": ["'self'"],
      "connect-src": ["'self'"],
      "default-src": ["'self'"],
      "font-src": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "img-src": ["'self'"],
      "object-src": ["'none'"],
      "script-src-attr": ["'none'"],
      "style-src": ["'self'"],
    });
  });

  test("generates unique nonce per request", async ({ request }) => {
    const first = getCSP(await request.get("/"));
    const second = getCSP(await request.get("/"));

    expect(first["script-src"]).not.toEqual(second["script-src"]);
  });

  test("sets CSRF cookie on first visit", async ({ page, context }) => {
    await page.goto("/");

    const cookies = await context.cookies();
    const csrfCookie = cookies.find((c) => c.name === "__csrf");

    expect(csrfCookie).toBeDefined();
    expect(csrfCookie?.sameSite).toBe("Strict");
    expect(csrfCookie?.httpOnly).toBe(false);
  });
});

test.describe("CSRF protection", () => {
  test("rejects JSON POST without CSRF token", async ({ request }) => {
    const response = await request.post("/", {
      headers: { "Content-Type": "application/json" },
      data: { test: "data" },
    });

    expect(response.status()).toBe(403);
  });
});
