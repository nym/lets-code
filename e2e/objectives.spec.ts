import { test, expect } from "@playwright/test";

test("GET /objectives renders page heading and form", async ({ page }) => {
  await page.goto("/objectives");

  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator('input[name="title"]').first()).toBeVisible();
  await expect(page.locator('textarea[name="description"]').first()).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test("submitting the form with a title creates an objective", async ({
  page,
}) => {
  await page.goto("/objectives");

  await page.fill('input[name="title"]', "Run 5k every morning");
  await page.click('button[type="submit"]');

  // The new card should appear in the list
  await expect(page.getByText("Run 5k every morning")).toBeVisible();
});

test("submitting without a title shows an inline error", async ({ page }) => {
  await page.goto("/objectives");

  await page.click('button[type="submit"]');

  // Client-side validation should show an error
  const error = page.getByRole('alert');
  await expect(error).toBeVisible();
});

test("description textarea grows when text is typed", async ({ page }) => {
  await page.goto("/objectives");

  const textarea = page.locator('textarea[name="description"]');

  const initialHeight = await textarea.evaluate(
    (el) => (el as HTMLElement).offsetHeight
  );

  // Type enough text to cause expansion
  const longText = "This is a long description.\n".repeat(8);
  await textarea.fill(longText);

  const expandedHeight = await textarea.evaluate(
    (el) => (el as HTMLElement).offsetHeight
  );

  expect(expandedHeight).toBeGreaterThan(initialHeight);
});

test("theme toggle changes dark mode", async ({ page }) => {
  await page.goto("/objectives");

  const toggleButton = page.getByRole('button', { name: /theme/i });
  await expect(toggleButton).toBeVisible();

  // Get current class state
  const isDarkBefore = await page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  );

  await toggleButton.click();

  const isDarkAfter = await page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  );

  // State should have toggled
  expect(isDarkAfter).toBe(!isDarkBefore);
});

test("delete button appears on objective cards", async ({ page }) => {
  await page.goto("/objectives");

  await page.fill('input[name="title"]', "To be deleted");
  await page.click('button[type="submit"]');

  const card = page.locator("li").filter({ hasText: "To be deleted" }).first();
  await expect(card.getByRole("button", { name: "Delete objective" })).toBeVisible();
});

test("clicking delete once shows a confirmation prompt", async ({ page }) => {
  await page.goto("/objectives");

  await page.fill('input[name="title"]', "Confirm delete test");
  await page.click('button[type="submit"]');

  const card = page.locator("li").filter({ hasText: "Confirm delete test" }).first();
  await card.getByRole("button", { name: "Delete objective" }).click();

  await expect(card.getByText("Delete?")).toBeVisible();
});

test("confirming delete removes the card from the list", async ({ page }) => {
  await page.goto("/objectives");

  await page.fill('input[name="title"]', "Delete me");
  await page.click('button[type="submit"]');

  const card = page.locator("li").filter({ hasText: "Delete me" }).first();
  const deleteButton = card.getByRole("button", { name: "Delete objective" });
  await deleteButton.click();
  await expect(card.getByText("Delete?")).toBeVisible();
  await deleteButton.click();

  await expect(page.getByText("Delete me")).not.toBeVisible();
});

test("clicking mark as complete checks the checkbox", async ({ page }) => {
  await page.goto("/objectives");

  await page.fill('input[name="title"]', "Complete me");
  await page.click('button[type="submit"]');

  const card = page.locator("li").filter({ hasText: "Complete me" }).first();
  await card.getByRole("button", { name: "Mark as complete" }).click();

  await expect(card.getByRole("button", { name: "Completed" })).toBeVisible();
});

test("completed objective shows greyed text after the flash", async ({ page }) => {
  await page.goto("/objectives");

  await page.fill('input[name="title"]', "Already done");
  await page.click('button[type="submit"]');

  const card = page.locator("li").filter({ hasText: "Already done" }).first();
  await card.getByRole("button", { name: "Mark as complete" }).click();

  // Poll for the grey class — appears after the 3-second flash ends and the
  // loader revalidation returns. Polling is more reliable than a fixed wait.
  await expect(card.getByText("Already done")).toHaveAttribute(
    "class",
    /text-gray-400/,
    { timeout: 8000 }
  );
});

test("completed state persists after page reload", async ({ page }) => {
  await page.goto("/objectives");

  await page.fill('input[name="title"]', "Persisted completion");
  await page.click('button[type="submit"]');

  // Scope to the specific card so parallel tests inserting newer objectives
  // don't cause .first() to target the wrong card.
  const card = page.locator("li").filter({ hasText: "Persisted completion" }).first();
  await card.getByRole("button", { name: "Mark as complete" }).click();
  await expect(card.getByRole("button", { name: "Completed" })).toBeVisible();

  await page.reload();

  await expect(
    page.locator("li").filter({ hasText: "Persisted completion" }).first()
      .getByRole("button", { name: "Completed" })
  ).toBeVisible();
});

test("multiple objectives render as a grid of cards", async ({ page }) => {
  await page.goto("/objectives");

  // Create two objectives — visibility is asserted inside the loop so there's
  // no need for a post-loop re-check (which would fail if parallel tests push
  // items past the 10-item page limit).
  for (const title of ["Morning yoga", "Evening reading"]) {
    await page.fill('input[name="title"]', title);
    await page.click('button[type="submit"]');
    await expect(page.getByText(title).first()).toBeVisible();
    await page.fill('input[name="title"]', "");
  }
});
