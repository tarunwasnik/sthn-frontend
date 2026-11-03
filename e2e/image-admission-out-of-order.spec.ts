import { expect, test, type Page, type Route } from "@playwright/test";

import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const image = (name: string) => ({ name, mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });
const expiresAt = () => new Date(Date.now() + 60 * 60_000).toISOString();
const profile = (status: "incomplete" | "verified") => ({
  username: `Out of order ${status}`, realName: "Race E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999", country: "India", city: "Pune", languages: ["English"], bio: "Race fixture.", interests: ["testing"], profileStatus: status,
  avatar: "https://media.invalid/race-avatar.jpg", cover: "https://media.invalid/race-cover.jpg", profilePhotos: ["https://media.invalid/race-one.jpg", "https://media.invalid/race-two.jpg"],
});
type Decision = "PASS" | "BLOCK" | "UNAVAILABLE";
type PendingAdmission = Readonly<{ resolve: (decision: Decision) => void; body: string }>;

const installPreviewAudit = async (page: Page) => {
  const created: string[] = []; const revoked: string[] = [];
  await page.exposeBinding("__r5c7bRecordPreview", (_source, event: "create" | "revoke", url: string) => {
    (event === "create" ? created : revoked).push(url);
  });
  await page.addInitScript(() => {
    const auditKey = "__r5c7bPreviewAudit";
    const existing = (() => { try { return JSON.parse(window.name) as Record<string, unknown>; } catch { return {}; } })();
    if (!existing[auditKey]) window.name = JSON.stringify({ [auditKey]: { created: [] as string[], revoked: [] as string[] } });
    const record = (event: "create" | "revoke", url: string) => {
      const value = JSON.parse(window.name) as Record<string, { created: string[]; revoked: string[] }>;
      value[auditKey][event === "create" ? "created" : "revoked"].push(url);
      window.name = JSON.stringify(value);
    };
    const create = URL.createObjectURL.bind(URL); const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (value: Blob | MediaSource) => { const url = create(value); record("create", url); void window.__r5c7bRecordPreview("create", url); return url; };
    URL.revokeObjectURL = (url: string) => { record("revoke", url); void window.__r5c7bRecordPreview("revoke", url); revoke(url); };
  });
  return { created, revoked };
};

declare global { interface Window { __r5c7bRecordPreview(event: "create" | "revoke", url: string): Promise<void>; } }

const slot = (page: Page, label: "Avatar" | "Cover") => page.getByText(label, { exact: true }).locator("..");

async function installDeferredFixture(page: Page, initial: Record<string, unknown>) {
  const pending: PendingAdmission[] = [];
  const patchBodies: Record<string, unknown>[] = []; const draftBodies: Record<string, unknown>[] = [];
  const audit = await installPreviewAudit(page);
  await page.addInitScript(() => localStorage.setItem("accessToken", "out-of-order-race-e2e-token"));
  await page.route("**/*", async (route: Route) => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/onboarding", userId: "out-of-order-race-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "out-of-order-race-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") return route.fulfill({ json: initial });
    if (request.method() === "POST" && url.pathname === "/api/v1/text-moderation") return route.fulfill({ json: { decision: "ALLOW", message: "Approved", fingerprint: "race-text", admissionToken: "race-text-token" } });
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") {
      const index = pending.length; const body = request.postData() ?? "";
      const decision = await new Promise<Decision>(resolve => pending.push({ resolve, body }));
      if (decision === "PASS") return route.fulfill({ json: { decision, message: `Approved ${index}`, attemptReference: `attempt-${index}`, admissionReference: `admission-${index}`, assetReference: `asset-${index}`, expiresAt: expiresAt() } });
      return route.fulfill({ json: { decision, message: decision === "BLOCK" ? `Blocked ${index}` : `Unavailable ${index}`, attemptReference: `attempt-${index}`, assetReference: `asset-${index}` } });
    }
    if (request.method() === "POST" && /^\/api\/v1\/image-moderation\/temporary-assets\/asset-\d+\/release$/.test(url.pathname)) return route.fulfill({ json: { outcome: "DELETED", message: "Temporary image release completed." } });
    if (request.method() === "PATCH" && url.pathname === "/api/v1/profile/me") { const body = request.postDataJSON(); patchBodies.push(body); return route.fulfill({ json: { profile: { ...initial, avatar: "https://media.invalid/persisted-avatar.jpg" } } }); }
    if (request.method() === "PUT" && url.pathname === "/api/v1/profile/me/draft") { const body = request.postDataJSON(); draftBodies.push(body); return route.fulfill({ status: 400, json: { message: "Draft fixture stops after payload assertion." } }); }
    return route.abort();
  });
  return {
    audit, patchBodies, draftBodies,
    get pendingCount() { return pending.length; },
    requestBody: (index: number) => pending[index]?.body,
    release: (index: number, decision: Decision) => { const request = pending[index]; if (!request) throw new Error(`Admission ${index} was not pending.`); request.resolve(decision); },
  };
}

const unmountCurrentRoute = (page: Page, path: string) => page.evaluate((nextPath) => {
  window.history.pushState({}, "", nextPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
}, path);

for (const staleDecision of ["BLOCK", "UNAVAILABLE"] as const) {
  test(`profile editor keeps the newer approved avatar when stale avatar admission resolves ${staleDecision}`, async ({ page }) => {
    const fixture = await installDeferredFixture(page, profile("verified"));
    await page.goto(`${e2eOrigin}/profile`);
    await page.getByRole("button", { name: "Edit Profile" }).click();
    const avatar = slot(page, "Avatar");
    const input = avatar.locator('input[type="file"]');
    await input.setInputFiles(image("avatar-a.jpg"));
    await expect.poll(() => fixture.pendingCount).toBe(1);
    const firstPreview = fixture.audit.created[0];
    await input.setInputFiles(image("avatar-b.jpg"));
    await expect.poll(() => fixture.pendingCount).toBe(2);
    const secondPreview = fixture.audit.created[1];
    expect(fixture.audit.revoked).toContain(firstPreview);
    expect(fixture.audit.revoked).not.toContain(secondPreview);
    fixture.release(1, "PASS");
    await expect(page.getByText("Image approved and ready to save.")).toBeVisible();
    fixture.release(0, staleDecision);
    await expect(page.getByText(staleDecision === "BLOCK" ? "Blocked 0" : "Unavailable 0")).toHaveCount(0);
    await expect(page.getByText("Image approved and ready to save.")).toBeVisible();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect.poll(() => fixture.patchBodies).toHaveLength(1);
    expect(fixture.patchBodies[0]).toEqual({ avatar: { kind: "ADMISSION", admissionReference: "admission-1" } });
    expect(fixture.requestBody(0)).toContain("USER_PROFILE_AVATAR"); expect(fixture.requestBody(1)).toContain("USER_PROFILE_AVATAR");
    await unmountCurrentRoute(page, "/onboarding");
    await expect.poll(() => fixture.audit.revoked).toContain(secondPreview);
  });
}

test("current blocked avatar cannot be authorized by an older PASS", async ({ page }) => {
  const fixture = await installDeferredFixture(page, profile("verified"));
  await page.goto(`${e2eOrigin}/profile`);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  const input = slot(page, "Avatar").locator('input[type="file"]');
  await input.setInputFiles(image("avatar-a.jpg")); await expect.poll(() => fixture.pendingCount).toBe(1);
  await input.setInputFiles(image("avatar-b.jpg")); await expect.poll(() => fixture.pendingCount).toBe(2);
  fixture.release(1, "BLOCK"); await expect(page.getByText("Blocked 1")).toBeVisible();
  fixture.release(0, "PASS");
  await expect(page.getByText("Blocked 1")).toBeVisible();
  await expect(page.getByText("Image approved and ready to save.")).toHaveCount(0);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Image moderation must approve every selected image before it can be saved.")).toBeVisible();
  expect(fixture.patchBodies).toHaveLength(0);
});

test("onboarding keeps the newer approved cover when a stale cover BLOCK resolves later", async ({ page }) => {
  const fixture = await installDeferredFixture(page, profile("incomplete"));
  await page.goto(`${e2eOrigin}/onboarding`);
  const input = slot(page, "Cover").locator('input[type="file"]');
  await input.setInputFiles(image("cover-a.jpg")); await expect.poll(() => fixture.pendingCount).toBe(1);
  const firstPreview = fixture.audit.created[0];
  await input.setInputFiles(image("cover-b.jpg")); await expect.poll(() => fixture.pendingCount).toBe(2);
  const secondPreview = fixture.audit.created[1];
  fixture.release(1, "PASS");
  await expect(page.getByText("Image approved. Save the draft before face verification.").first()).toBeVisible();
  fixture.release(0, "BLOCK");
  await expect(page.getByText("Blocked 0")).toHaveCount(0);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect.poll(() => fixture.draftBodies).toHaveLength(1);
  expect(fixture.draftBodies[0]).toMatchObject({ cover: { kind: "ADMISSION", admissionReference: "admission-1" } });
  expect(fixture.audit.revoked).toContain(firstPreview);
  expect(fixture.audit.revoked).not.toContain(secondPreview);
  await unmountCurrentRoute(page, "/profile");
  await expect.poll(() => fixture.audit.revoked).toContain(secondPreview);
});

test("onboarding presents avatar, cover, and gallery before profile fields without horizontal overflow", async ({ page }) => {
  const fixture = await installDeferredFixture(page, profile("incomplete"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${e2eOrigin}/onboarding`);
  const avatarBox = await page.getByText("Avatar", { exact: true }).boundingBox();
  const coverBox = await page.getByText("Cover", { exact: true }).boundingBox();
  const galleryBox = await page.getByText("Profile Photos (2–6 required)", { exact: true }).boundingBox();
  const usernameBox = await page.getByPlaceholder("Username").boundingBox();
  const realNameBox = await page.getByPlaceholder("Real name").boundingBox();
  const countryBox = await page.getByPlaceholder("Country").boundingBox();
  expect(avatarBox?.y).toBeLessThan(coverBox?.y ?? 0);
  expect(coverBox?.y).toBeLessThan(galleryBox?.y ?? 0);
  expect(galleryBox?.y).toBeLessThan(usernameBox?.y ?? 0);
  expect(usernameBox?.y).toBeLessThan(realNameBox?.y ?? 0);
  expect(realNameBox?.y).toBeLessThan(countryBox?.y ?? 0);
  await expect(page.getByText("Avatar", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Cover", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Profile Photos (2–6 required)", { exact: true })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(fixture.pendingCount).toBe(0);
});

test("gallery admits single selections concurrently, ignores a removed delayed PASS, and serializes only current admissions", async ({ page }) => {
  const fixture = await installDeferredFixture(page, profile("incomplete"));
  await page.goto(`${e2eOrigin}/onboarding`);
  const galleryInput = page.getByLabel("Add one gallery photo");
  expect(await galleryInput.getAttribute("multiple")).toBeNull();
  await galleryInput.setInputFiles(image("gallery-a.jpg"));
  await expect.poll(() => fixture.pendingCount).toBe(1);
  const firstPreview = fixture.audit.created[0];
  await expect(galleryInput).toBeEnabled();
  await galleryInput.setInputFiles(image("gallery-b.jpg"));
  await galleryInput.setInputFiles(image("gallery-c.jpg"));
  await expect.poll(() => fixture.pendingCount).toBe(3);
  const secondPreview = fixture.audit.created[1];
  const thirdPreview = fixture.audit.created[2];
  await expect(galleryInput).toBeEnabled();
  await page.locator(`img[src="${firstPreview}"]`).locator("..").getByRole("button", { name: "✕" }).click();
  expect(fixture.audit.revoked).toContain(firstPreview);
  fixture.release(2, "PASS");
  await expect(page.locator(`img[src="${thirdPreview}"]`)).toBeVisible();
  fixture.release(1, "PASS");
  await expect(page.locator(`img[src="${secondPreview}"]`)).toBeVisible();
  fixture.release(0, "PASS");
  await expect(page.getByText("Approved 0")).toHaveCount(0);
  await expect(page.getByText("Image approved. Save the draft before face verification.").first()).toBeVisible();
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect.poll(() => fixture.draftBodies).toHaveLength(1);
  const draft = fixture.draftBodies[0] as { profilePhotos?: unknown[] };
  expect(draft.profilePhotos).toEqual([
    { kind: "UNCHANGED", reference: "https://media.invalid/race-one.jpg" },
    { kind: "UNCHANGED", reference: "https://media.invalid/race-two.jpg" },
    { kind: "ADMISSION", admissionReference: "admission-1" },
    { kind: "ADMISSION", admissionReference: "admission-2" },
  ]);
  expect(JSON.stringify(draft)).not.toContain("admission-0");
  await unmountCurrentRoute(page, "/profile");
  await expect.poll(() => fixture.audit.revoked).toContain(secondPreview);
});

test("gallery reserves at most six current slots while each admission remains independent", async ({ page }) => {
  const fixture = await installDeferredFixture(page, profile("incomplete"));
  await page.goto(`${e2eOrigin}/onboarding`);
  const galleryInput = page.getByLabel("Add one gallery photo");
  for (const name of ["gallery-a.jpg", "gallery-b.jpg", "gallery-c.jpg", "gallery-d.jpg"]) {
    await galleryInput.setInputFiles(image(name));
  }
  await expect.poll(() => fixture.pendingCount).toBe(4);
  await expect(galleryInput).toBeDisabled();
  fixture.release(3, "UNAVAILABLE");
  fixture.release(2, "PASS");
  fixture.release(1, "BLOCK");
  fixture.release(0, "PASS");
  await expect(page.getByText("Unavailable 3")).toBeVisible();
  await expect(page.getByText("Blocked 1")).toBeVisible();
  await expect(page.getByText("Image approved. Save the draft before face verification.").first()).toBeVisible();
});

test("profile editor permits independent gallery admissions while an earlier selection is pending", async ({ page }) => {
  const fixture = await installDeferredFixture(page, profile("verified"));
  await page.goto(`${e2eOrigin}/profile`);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  const galleryInput = page.getByLabel("Add one gallery photo");
  await galleryInput.setInputFiles(image("editor-gallery-a.jpg"));
  await expect.poll(() => fixture.pendingCount).toBe(1);
  await expect(galleryInput).toBeEnabled();
  await galleryInput.setInputFiles(image("editor-gallery-b.jpg"));
  await expect.poll(() => fixture.pendingCount).toBe(2);
  fixture.release(1, "PASS");
  fixture.release(0, "BLOCK");
  await expect(page.getByText("Blocked 0")).toBeVisible();
  await expect(page.getByText("Image approved and ready to save.")).toBeVisible();
});
