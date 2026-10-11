import { expect, test, type Page, type Route } from "@playwright/test";

import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const image = (name: string) => ({ name, mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });
const expiresAt = () => new Date(Date.now() + 60 * 60_000).toISOString();
const base = (status: "incomplete" | "verified") => ({ username: `Race ${status}`, realName: "Race E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999", country: "India", city: "Pune", languages: ["English"], bio: "Race fixture.", interests: ["testing"], profileStatus: status, avatar: "https://media.invalid/race-avatar.jpg", cover: "https://media.invalid/race-cover.jpg", profilePhotos: ["https://media.invalid/race-one.jpg", "https://media.invalid/race-two.jpg"] });
type Decision = "PASS" | "BLOCK" | "UNAVAILABLE";

const installPreviewAudit = async (page: Page) => {
  await page.addInitScript(() => {
    const created: string[] = []; const revoked: string[] = [];
    const create = URL.createObjectURL.bind(URL); const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (value: Blob | MediaSource) => { const url = create(value); created.push(url); return url; };
    URL.revokeObjectURL = (url: string) => { revoked.push(url); revoke(url); };
    Object.defineProperty(window, "__r5c7bPreviewAudit", { value: { created, revoked } });
  });
};

const previewAudit = (page: Page) => page.evaluate(() => (window as unknown as { __r5c7bPreviewAudit: { created: string[]; revoked: string[] } }).__r5c7bPreviewAudit);

const installDeferredAdmission = async (page: Page, profile: Record<string, unknown>) => {
  let release: ((decision: Decision) => void) | null = null;
  let admissionCount = 0; let patchCount = 0; let draftCount = 0;
  const releaseRequests: Array<{ path: string; body: unknown }> = [];
  const observedBodies: string[] = [];
  await installPreviewAudit(page);
  await page.addInitScript(() => localStorage.setItem("accessToken", "removal-race-e2e-token"));
  await page.route("**/*", async (route: Route) => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/onboarding", userId: "removal-race-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "removal-race-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") return route.fulfill({ json: profile });
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") {
      admissionCount += 1; observedBodies.push(request.postData() ?? "");
      const decision = await new Promise<Decision>(resolve => { release = resolve; });
      if (decision === "PASS") return route.fulfill({ json: { decision, message: "Approved", attemptReference: "race-attempt", admissionReference: "stale-race-admission", assetReference: "race-asset", expiresAt: expiresAt() } });
      return route.fulfill({ json: { decision, message: decision === "BLOCK" ? "Delayed block" : "Delayed unavailable", attemptReference: "race-attempt", assetReference: "race-asset" } });
    }
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/temporary-assets/race-asset/release") {
      releaseRequests.push({ path: url.pathname, body: request.postDataJSON() });
      return route.fulfill({ json: { outcome: "DELETED", message: "Temporary image release completed." } });
    }
    if (request.method() === "PATCH" && url.pathname === "/api/v1/profile/me") { patchCount += 1; return route.fulfill({ status: 400, json: { message: "Removed media must not be patched." } }); }
    if (request.method() === "PUT" && url.pathname === "/api/v1/profile/me/draft") { draftCount += 1; return route.fulfill({ status: 400, json: { message: "Removed media must not be drafted." } }); }
    if (request.method() === "POST" && url.pathname === "/api/v1/text-moderation") return route.fulfill({ json: { decision: "ALLOW", message: "Approved", fingerprint: "race-text", admissionToken: "race-text-token" } });
    return route.abort();
  });
  return {
    get admissionCount() { return admissionCount; }, get patchCount() { return patchCount; }, get draftCount() { return draftCount; }, observedBodies, releaseRequests,
    release: (decision: Decision) => { if (!release) throw new Error("Admission was not pending."); const current = release; release = null; current(decision); },
  };
};

const slot = (page: Page, label: "Avatar" | "Cover") => page.getByText(label, { exact: true }).locator("..");

test("onboarding avatar removal invalidates a delayed PASS and revokes its preview", async ({ page }) => {
  const fixture = await installDeferredAdmission(page, base("incomplete"));
  await page.goto(`${e2eOrigin}/onboarding`);
  await page.locator('input[type="file"]').nth(0).setInputFiles(image("avatar-a.jpg"));
  await expect.poll(() => fixture.admissionCount).toBe(1);
  const avatar = slot(page, "Avatar");
  await avatar.getByRole("button", { name: "✕" }).click();
  const removed = await previewAudit(page); expect(removed.created).toHaveLength(1); expect(removed.revoked).toContain(removed.created[0]);
  fixture.release("PASS");
  await expect.poll(() => fixture.releaseRequests).toHaveLength(1);
  expect(fixture.releaseRequests[0]).toEqual({ path: "/api/v1/image-moderation/temporary-assets/race-asset/release", body: { surface: "USER_PROFILE_AVATAR" } });
  await expect(page.getByText("Image approved. Save the draft before face verification.")).toHaveCount(0);
  await expect(avatar.locator("img")).toHaveCount(0);
  expect((await previewAudit(page)).created).toEqual(removed.created);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect(page.getByText("Avatar and cover are required.")).toBeVisible();
  expect(fixture.draftCount).toBe(0); expect(fixture.observedBodies[0]).toContain("USER_PROFILE_AVATAR");
});

test("onboarding cover removal ignores a delayed BLOCK without restoring its preview", async ({ page }) => {
  const fixture = await installDeferredAdmission(page, base("incomplete"));
  await page.goto(`${e2eOrigin}/onboarding`);
  await page.locator('input[type="file"]').nth(1).setInputFiles(image("cover-a.jpg"));
  await expect.poll(() => fixture.admissionCount).toBe(1);
  const cover = slot(page, "Cover");
  await cover.getByRole("button", { name: "✕" }).click();
  const removed = await previewAudit(page); expect(removed.revoked).toContain(removed.created[0]);
  fixture.release("BLOCK");
  await expect.poll(() => fixture.releaseRequests).toHaveLength(1);
  expect(fixture.releaseRequests[0]?.body).toEqual({ surface: "USER_PROFILE_COVER" });
  await expect(page.getByText("Delayed block")).toHaveCount(0);
  await expect(cover.locator("img")).toHaveCount(0);
  expect((await previewAudit(page)).created).toEqual(removed.created);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect(page.getByText("Avatar and cover are required.")).toBeVisible();
  expect(fixture.draftCount).toBe(0);
});

test("profile editor avatar removal invalidates delayed UNAVAILABLE and prevents PATCH authority", async ({ page }) => {
  const fixture = await installDeferredAdmission(page, base("verified"));
  await page.goto(`${e2eOrigin}/profile`);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.locator('input[type="file"]').nth(0).setInputFiles(image("avatar-a.jpg"));
  await expect.poll(() => fixture.admissionCount).toBe(1);
  const avatar = slot(page, "Avatar");
  await avatar.getByRole("button", { name: "✕" }).click();
  const removed = await previewAudit(page); expect(removed.revoked).toContain(removed.created[0]);
  fixture.release("UNAVAILABLE");
  await expect.poll(() => fixture.releaseRequests).toHaveLength(1);
  expect(fixture.releaseRequests[0]?.body).toEqual({ surface: "USER_PROFILE_AVATAR" });
  await expect(page.getByText("Delayed unavailable")).toHaveCount(0);
  await expect(avatar.locator("img")).toHaveCount(0);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Avatar and cover are required.")).toBeVisible();
  expect(fixture.patchCount).toBe(0); expect((await previewAudit(page)).created).toEqual(removed.created);
});

test("profile editor cover removal invalidates delayed PASS and prevents PATCH authority", async ({ page }) => {
  const fixture = await installDeferredAdmission(page, base("verified"));
  await page.goto(`${e2eOrigin}/profile`);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.locator('input[type="file"]').nth(1).setInputFiles(image("cover-a.jpg"));
  await expect.poll(() => fixture.admissionCount).toBe(1);
  const cover = slot(page, "Cover");
  await cover.getByRole("button", { name: "✕" }).click();
  const removed = await previewAudit(page); expect(removed.revoked).toContain(removed.created[0]);
  fixture.release("PASS");
  await expect.poll(() => fixture.releaseRequests).toHaveLength(1);
  expect(fixture.releaseRequests[0]?.body).toEqual({ surface: "USER_PROFILE_COVER" });
  await expect(page.getByText("Image approved and ready to save.")).toHaveCount(0);
  await expect(cover.locator("img")).toHaveCount(0);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Avatar and cover are required.")).toBeVisible();
  expect(fixture.patchCount).toBe(0); expect((await previewAudit(page)).created).toEqual(removed.created);
});
