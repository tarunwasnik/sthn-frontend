import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const now = () => new Date(Date.now() + 60 * 60_000).toISOString();
const profile = { username: "Image E2E", realName: "Image E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999", country: "India", city: "Pune", languages: ["English"], bio: "Browser fixture.", interests: ["testing"], profileStatus: "incomplete", avatar: "https://media.invalid/a.jpg", cover: "https://media.invalid/c.jpg", profilePhotos: ["https://media.invalid/1.jpg", "https://media.invalid/2.jpg"] };

async function fixture(page: Page, decisions: Array<"PASS" | "BLOCK" | "UNAVAILABLE">) {
  const requests: Array<{ url: string; body: string }> = [];
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/onboarding", userId: "image-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "image-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") return route.fulfill({ json: profile });
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") {
      requests.push({ url: url.pathname, body: request.postData() ?? "" }); const decision = decisions.shift() ?? "PASS";
      return route.fulfill({ json: decision === "PASS" ? { decision, attemptReference: "attempt-e2e", admissionReference: `admission-${requests.length}`, assetReference: "asset-e2e", expiresAt: now(), message: "Approved" } : { decision, attemptReference: "attempt-e2e", assetReference: "asset-e2e", message: decision === "BLOCK" ? "Image is not allowed" : "Moderation unavailable" } });
    }
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "isolated-e2e-token"));
  return requests;
}

const image = { name: "fixture.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) };

test("admission PASS is rendered as approved and uses multipart profile surface", async ({ page }) => {
  const requests = await fixture(page, ["PASS"]); await page.goto(`${e2eOrigin}/onboarding`);
  await page.locator('input[type="file"]').nth(0).setInputFiles(image);
  await expect(page.getByText("Image approved. Save the draft before face verification.")).toBeVisible();
  expect(requests).toHaveLength(1); expect(requests[0].body).toContain("USER_PROFILE_AVATAR");
});

test("admission BLOCK is visible and cannot be used as a valid profile image", async ({ page }) => {
  await fixture(page, ["BLOCK"]); await page.goto(`${e2eOrigin}/onboarding`);
  await page.locator('input[type="file"]').nth(0).setInputFiles(image);
  await expect(page.getByText("Image is not allowed")).toBeVisible();
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect(page.getByText("Image moderation must approve every selected image before it can be saved.")).toBeVisible();
});

test("admission UNAVAILABLE is visible and exposes retry", async ({ page }) => {
  await fixture(page, ["UNAVAILABLE"]); await page.goto(`${e2eOrigin}/onboarding`);
  await page.locator('input[type="file"]').nth(0).setInputFiles(image);
  await expect(page.getByText("Moderation unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry avatar" })).toBeVisible();
});
