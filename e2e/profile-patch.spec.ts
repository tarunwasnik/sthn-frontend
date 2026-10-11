import { expect, test, type Page } from "@playwright/test";

import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const image = (name: string) => ({ name, mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });
const expiresAt = () => new Date(Date.now() + 60 * 60_000).toISOString();
const allowText = { decision: "ALLOW", message: "Text approved", fingerprint: "patch-text-fingerprint", admissionToken: "patch-text-admission" };

const profile = (status: "incomplete" | "verified" | "pending_verification" | "rejected") => ({
  username: `Patch ${status}`, realName: "Patch E2E", bio: "Existing profile text.", interests: ["testing"], dateOfBirth: "1990-01-01T00:00:00.000Z", country: "India", city: "Pune", languages: ["English"], profileStatus: status,
  avatar: "https://media.invalid/patch-avatar.jpg", cover: "https://media.invalid/patch-cover.jpg", profilePhotos: ["https://media.invalid/patch-one.jpg", "https://media.invalid/patch-two.jpg"],
  verification: { stage: status === "pending_verification" ? "PROCESSING" : status === "rejected" ? "REJECTED" : "NOT_SUBMITTED", submittedAt: null },
});

const installProfileRoute = async (
  page: Page,
  initial: Record<string, unknown>,
  options: Readonly<{ admission?: { decision: "PASS"; reference: string } | { decision: "BLOCK" | "UNAVAILABLE"; message: string }; text?: "ALLOW" | "BLOCK" }>,
  onPatch?: (body: Record<string, unknown>) => { status?: number; json: unknown },
) => {
  let textRequests = 0;
  let patchRequests = 0;
  let admissionRequests = 0;
  await page.addInitScript(() => localStorage.setItem("accessToken", "profile-patch-e2e-token"));
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/profile", userId: "profile-patch-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "profile-patch-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") return route.fulfill({ json: initial });
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") {
      admissionRequests += 1;
      const result = options.admission;
      if (!result) return route.fulfill({ status: 400, json: { message: "This test did not authorize an image admission." } });
      if (result.decision === "PASS") return route.fulfill({ json: { decision: "PASS", message: "Approved", attemptReference: "patch-attempt", admissionReference: result.reference, assetReference: "patch-asset", expiresAt: expiresAt() } });
      return route.fulfill({ json: { decision: result.decision, message: result.message, attemptReference: "patch-attempt", assetReference: "patch-asset" } });
    }
    if (request.method() === "POST" && url.pathname === "/api/v1/text-moderation") {
      textRequests += 1;
      return route.fulfill({ json: options.text === "BLOCK"
        ? { decision: "BLOCK", message: "Profile text was blocked.", fingerprint: "patch-text-fingerprint", target: { field: "bio" } }
        : allowText });
    }
    if (request.method() === "PATCH" && url.pathname === "/api/v1/profile/me") {
      patchRequests += 1;
      const result = onPatch?.(request.postDataJSON());
      return route.fulfill(result ?? { status: 400, json: { message: "Unexpected PATCH request." } });
    }
    return route.abort();
  });
  return { get textRequests() { return textRequests; }, get patchRequests() { return patchRequests; }, get admissionRequests() { return admissionRequests; } };
};

test("incomplete editor PATCHes an admitted avatar and Text AI-approved changed text while omitting unchanged media", async ({ page }) => {
  test.setTimeout(60_000);
  const initial = profile("incomplete");
  let observed: Record<string, unknown> | null = null;
  const fixture = await installProfileRoute(page, initial, { admission: { decision: "PASS", reference: "incomplete-avatar-admission" }, text: "ALLOW" }, body => {
    observed = body;
    const expected = { avatar: { kind: "ADMISSION", admissionReference: "incomplete-avatar-admission" }, bio: "Changed incomplete profile text.", textModerationAdmission: allowText.admissionToken };
    if (JSON.stringify(body) !== JSON.stringify(expected)) return { status: 400, json: { message: "Incomplete PATCH body did not match the admission contract." } };
    return { json: { profile: { ...initial, avatar: "https://media.invalid/persisted-incomplete-replacement.jpg", bio: expected.bio } } };
  });

  await page.goto(`${e2eOrigin}/profile`);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.locator('textarea').fill("Changed incomplete profile text.");
  await expect.poll(() => fixture.textRequests).toBeGreaterThan(0);
  await page.locator('input[type="file"]').nth(0).setInputFiles(image("incomplete-avatar.jpg"));
  await expect(page.getByText("Image approved and ready to save.")).toBeVisible();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => observed).not.toBeNull();
  expect(fixture.admissionRequests).toBe(1); expect(fixture.textRequests).toBeGreaterThan(0); expect(fixture.patchRequests).toBe(1);
  await expect(page.getByText("Changed incomplete profile text.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit Profile" })).toBeVisible();
});

test("verified editor PATCHes an admitted cover and a supported field without requesting Text AI for unchanged text", async ({ page }) => {
  const initial = profile("verified");
  let observed: Record<string, unknown> | null = null;
  const fixture = await installProfileRoute(page, initial, { admission: { decision: "PASS", reference: "verified-cover-admission" } }, body => {
    observed = body;
    const expected = { cover: { kind: "ADMISSION", admissionReference: "verified-cover-admission" }, city: "Mumbai" };
    if (JSON.stringify(body) !== JSON.stringify(expected)) return { status: 400, json: { message: "Verified PATCH body did not preserve unchanged media/text." } };
    return { json: { profile: { ...initial, city: "Mumbai", cover: "https://media.invalid/persisted-verified-cover.jpg" } } };
  });

  await page.goto(`${e2eOrigin}/profile`);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.getByText("City", { exact: true }).locator("..").locator("input").fill("Mumbai");
  await page.locator('input[type="file"]').nth(1).setInputFiles(image("verified-cover.jpg"));
  await expect(page.getByText("Image approved and ready to save.")).toBeVisible();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => observed).not.toBeNull();
  expect(fixture.admissionRequests).toBe(1); expect(fixture.textRequests).toBe(0); expect(fixture.patchRequests).toBe(1);
  await expect(page.getByText("Mumbai", { exact: true })).toBeVisible();
  await expect(page.getByText("verified", { exact: true })).toBeVisible();
});

test("blocked media and blocked Text AI never produce a PATCH request", async ({ page }) => {
  const initial = profile("verified");
  const fixture = await installProfileRoute(page, initial, { admission: { decision: "BLOCK", message: "Image is not eligible." }, text: "BLOCK" });
  await page.goto(`${e2eOrigin}/profile`);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.locator('input[type="file"]').nth(0).setInputFiles(image("blocked-avatar.jpg"));
  await expect(page.getByText("Image is not eligible.")).toBeVisible();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Image moderation must approve every selected image before it can be saved.")).toBeVisible();
  expect(fixture.patchRequests).toBe(0);

  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.locator('textarea').fill("Blocked replacement text.");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Profile text was blocked.").first()).toBeVisible();
  expect(fixture.textRequests).toBeGreaterThan(0); expect(fixture.patchRequests).toBe(0);
});

test("unavailable image moderation cannot be serialized into a PATCH claim", async ({ page }) => {
  const fixture = await installProfileRoute(page, profile("verified"), { admission: { decision: "UNAVAILABLE", message: "Image moderation is temporarily unavailable." } });
  await page.goto(`${e2eOrigin}/profile`);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.locator('input[type="file"]').nth(1).setInputFiles(image("unavailable-cover.jpg"));
  await expect(page.getByText("Image moderation is temporarily unavailable.")).toBeVisible();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Image moderation must approve every selected image before it can be saved.")).toBeVisible();
  expect(fixture.admissionRequests).toBe(1); expect(fixture.patchRequests).toBe(0);
});

test("pending and rejected profiles do not expose this PATCH editor", async ({ page }) => {
  for (const status of ["pending_verification", "rejected"] as const) {
    const initial = profile(status);
    const fixture = await installProfileRoute(page, initial, {}, undefined);
    await page.goto(`${e2eOrigin}/profile`);
    await expect(page.getByRole("button", { name: "Edit Profile" })).toHaveCount(0);
    if (status === "pending_verification") await expect(page.getByText("Verification in progress")).toBeVisible();
    else await expect(page.getByText("Verification needs resubmission")).toBeVisible();
    expect(fixture.patchRequests).toBe(0);
    await page.unroute("**/*");
  }
});
