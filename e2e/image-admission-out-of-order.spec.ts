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
  await expect(page.getByText("Image approved. Save the draft before face verification.")).toBeVisible();
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

test("gallery keeps its order, ignores a removed delayed PASS, and serializes only current admissions", async ({ page }) => {
  const fixture = await installDeferredFixture(page, profile("incomplete"));
  await page.goto(`${e2eOrigin}/onboarding`);
  await page.locator('input[type="file"][multiple]').setInputFiles([image("gallery-a.jpg"), image("gallery-b.jpg")]);
  await expect.poll(() => fixture.pendingCount).toBe(2);
  const firstPreview = fixture.audit.created[0]; const secondPreview = fixture.audit.created[1];
  const aRequest = [0, 1].find(index => fixture.requestBody(index)?.includes("gallery-a.jpg"));
  const bRequest = [0, 1].find(index => fixture.requestBody(index)?.includes("gallery-b.jpg"));
  if (aRequest === undefined || bRequest === undefined) throw new Error("Gallery request filenames were not observed.");
  fixture.release(bRequest, "PASS");
  await expect(page.getByText("Image approved. Save the draft before face verification.")).toBeVisible();
  await page.locator(`img[src="${firstPreview}"]`).locator("..").getByRole("button", { name: "✕" }).click();
  expect(fixture.audit.revoked).toContain(firstPreview);
  expect(fixture.audit.revoked).not.toContain(secondPreview);
  fixture.release(aRequest, "PASS");
  await expect(page.getByText(`Approved ${aRequest}`)).toHaveCount(0);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect.poll(() => fixture.draftBodies).toHaveLength(1);
  const draft = fixture.draftBodies[0] as { profilePhotos?: unknown[] };
  expect(draft.profilePhotos).toEqual([
    { kind: "UNCHANGED", reference: "https://media.invalid/race-one.jpg" },
    { kind: "UNCHANGED", reference: "https://media.invalid/race-two.jpg" },
    { kind: "ADMISSION", admissionReference: `admission-${bRequest}` },
  ]);
  expect(JSON.stringify(draft)).not.toContain(`admission-${aRequest}`);
  await unmountCurrentRoute(page, "/profile");
  await expect.poll(() => fixture.audit.revoked).toContain(secondPreview);
});
