import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const image = { name: "creator.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) };
const profile = { displayName: "Creator E2E", avatarUrl: "https://media.invalid/avatar.jpg", coverUrl: "https://media.invalid/cover.jpg", media: ["https://media.invalid/one.jpg", "https://media.invalid/two.jpg"], bio: "Creator biography", languages: ["English"], categories: ["Music"], city: "Pune", country: "India" };

async function fixture(page: Page, decisions: Array<"PASS" | "BLOCK" | "UNAVAILABLE"> = ["PASS"]) {
  const requests: Array<{ method: string; path: string; body: unknown }> = []; let serial = 0;
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    const raw = request.postData(); const type = await request.headerValue("content-type"); const body = type?.includes("application/json") && raw ? JSON.parse(raw) : raw;
    requests.push({ method: request.method(), path: url.pathname, body });
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "CREATOR", entryRoute: "/creator/profile", userId: "creator-e2e", creatorStatus: "approved" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "creator-e2e", role: "creator", status: "active", creatorStatus: "approved" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/creator/profile") return route.fulfill({ json: profile });
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") { serial += 1; const decision = decisions.shift() ?? "PASS"; return route.fulfill({ json: decision === "PASS" ? { decision, attemptReference: `attempt-${serial}`, admissionReference: `imauth_creator_${serial}`, assetReference: `asset-${serial}`, expiresAt: new Date(Date.now() + 3600_000).toISOString(), message: "Approved" } : { decision, attemptReference: `attempt-${serial}`, assetReference: `asset-${serial}`, message: decision === "BLOCK" ? "Blocked" : "Unavailable" } }); }
    if (request.method() === "POST" && url.pathname.includes("/release")) return route.fulfill({ json: { outcome: "PENDING", message: "Queued" } });
    if (request.method() === "PATCH" && url.pathname === "/api/v1/creator/profile") return route.fulfill({ json: { message: "Creator profile updated", profile } });
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "creator-profile-e2e-token"));
  return requests;
}

test("existing Creator Profile media renders and non-media PATCH preserves media claims", async ({ page }) => {
  const requests = await fixture(page); await page.goto(`${e2eOrigin}/creator/profile`);
  await expect(page.getByText("Creator E2E")).toBeVisible(); await expect(page.locator('img[src="https://media.invalid/avatar.jpg"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => requests.find(request => request.method === "PATCH")?.body).toBeTruthy();
  const body = requests.find(request => request.method === "PATCH")?.body as Record<string, unknown>;
  expect(body.media).toEqual([{ kind: "UNCHANGED", reference: "https://media.invalid/one.jpg" }, { kind: "UNCHANGED", reference: "https://media.invalid/two.jpg" }]);
  expect(body.avatar).toEqual({ kind: "UNCHANGED", reference: "https://media.invalid/avatar.jpg" }); expect(body.cover).toEqual({ kind: "UNCHANGED", reference: "https://media.invalid/cover.jpg" });
  expect(body).not.toHaveProperty("avatarUrl"); expect(body).not.toHaveProperty("coverUrl");
});

test("Creator Profile admissions use creator surfaces and PATCH only serializes PASS media", async ({ page }) => {
  const requests = await fixture(page, ["PASS", "PASS", "PASS"]); await page.goto(`${e2eOrigin}/creator/profile`); await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.locator("#avatarUpload").setInputFiles(image); await page.locator("#coverUpload").setInputFiles(image); await page.locator('input[type="file"]').last().setInputFiles(image);
  await page.getByRole("button", { name: "Save Changes" }).click(); await expect.poll(() => requests.filter(request => request.method === "PATCH")).toHaveLength(1);
  const surfaces = requests.filter(request => request.path === "/api/v1/image-moderation/admissions").map(request => String(request.body));
  expect(surfaces.join(" ")).toContain("CREATOR_PROFILE_AVATAR"); expect(surfaces.join(" ")).toContain("CREATOR_PROFILE_COVER"); expect(surfaces.join(" ")).toContain("CREATOR_PROFILE_MEDIA");
  const body = requests.find(request => request.method === "PATCH")?.body as Record<string, unknown>;
  expect(body.avatar).toEqual({ kind: "ADMISSION", admissionReference: "imauth_creator_1" }); expect(body.cover).toEqual({ kind: "ADMISSION", admissionReference: "imauth_creator_2" });
  expect(JSON.stringify(body)).not.toContain("blob:");
});

test("BLOCK and UNAVAILABLE admissions cannot become Creator Profile PATCH authority", async ({ page }) => {
  const requests = await fixture(page, ["BLOCK", "UNAVAILABLE"]); await page.goto(`${e2eOrigin}/creator/profile`); await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.locator("#avatarUpload").setInputFiles(image); await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => requests.filter(request => request.method === "PATCH")).toHaveLength(0);
  expect(requests.filter(request => request.path.includes("cloudinary"))).toHaveLength(0);
});
