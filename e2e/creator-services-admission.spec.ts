import { expect, test, type Page, type Route } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const image = { name: "service.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) };
const existingReference = "https://media.invalid/service-existing.jpg";
type Decision = "PASS" | "BLOCK" | "UNAVAILABLE";
type FixtureOptions = Readonly<{ deferFirstAdmission?: boolean; releaseStatus?: number }>;

async function fixture(page: Page, decisions: Decision[] = ["PASS"], initialMedia: string[] = [existingReference], options: FixtureOptions = {}) {
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  let serial = 0;
  let deferredAdmission: { route: Route; decision: Decision; serial: number } | null = null;
  let resumeDeferredAdmission: (() => void) | null = null;
  let services = [{ _id: "service-e2e", title: "Existing service", description: "Existing description", durationMinutes: 60, price: 1200, currency: "INR", isActive: true, media: initialMedia }];
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    const raw = request.postData(); const contentType = await request.headerValue("content-type");
    const body = contentType?.includes("application/json") && raw ? JSON.parse(raw) : raw ?? null;
    requests.push({ method: request.method(), path: url.pathname, body });
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "CREATOR", entryRoute: "/dashboard/creator/services", userId: "creator-services-e2e", creatorStatus: "approved" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "creator-services-e2e", role: "creator", status: "active", creatorStatus: "approved" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/creator/services") return route.fulfill({ json: { services } });
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") {
      serial += 1; const decision = decisions.shift() ?? "PASS";
      if (options.deferFirstAdmission && serial === 1) {
        deferredAdmission = { route, decision, serial };
        await new Promise<void>((resolve) => { resumeDeferredAdmission = resolve; });
        return;
      }
      return route.fulfill({ json: decision === "PASS"
        ? { decision, attemptReference: `attempt-${serial}`, admissionReference: `imauth_service_${serial}`, assetReference: `asset-${serial}`, expiresAt: new Date(Date.now() + 3600_000).toISOString(), message: "Approved" }
        : { decision, attemptReference: `attempt-${serial}`, assetReference: `asset-${serial}`, message: decision === "BLOCK" ? "Blocked" : "Unavailable" } });
    }
    if (request.method() === "POST" && url.pathname.includes("/temporary-assets/") && url.pathname.endsWith("/release")) return route.fulfill({ status: options.releaseStatus ?? 200, json: { outcome: "PENDING", message: "Queued" } });
    if (request.method() === "POST" && url.pathname === "/api/v1/creator/services") {
      const requestBody = body as Record<string, unknown>; const service = { _id: "service-created", title: requestBody.title, description: requestBody.description, durationMinutes: requestBody.durationMinutes, price: requestBody.price, currency: "INR", isActive: true, media: ["https://media.invalid/service-created.jpg"] };
      services = [service as typeof services[number], ...services]; return route.fulfill({ status: 201, json: { message: "Service created successfully", service } });
    }
    if (request.method() === "PATCH" && url.pathname === "/api/v1/creator/services/service-e2e") return route.fulfill({ json: { message: "Service updated successfully", service: services[0] } });
    if (request.method() === "DELETE" && url.pathname === "/api/v1/creator/services/service-e2e") { services = []; return route.fulfill({ json: { message: "Service and media deleted successfully" } }); }
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "creator-services-e2e-token"));
  return {
    requests,
    releaseDeferredAdmission: async () => {
      if (!deferredAdmission) throw new Error("No deferred admission is pending");
      const { route, decision, serial: deferredSerial } = deferredAdmission; deferredAdmission = null;
      await route.fulfill({ json: decision === "PASS"
        ? { decision, attemptReference: `attempt-${deferredSerial}`, admissionReference: `imauth_service_${deferredSerial}`, assetReference: `asset-${deferredSerial}`, expiresAt: new Date(Date.now() + 3600_000).toISOString(), message: "Approved" }
        : { decision, attemptReference: `attempt-${deferredSerial}`, assetReference: `asset-${deferredSerial}`, message: decision === "BLOCK" ? "Blocked" : "Unavailable" } });
      resumeDeferredAdmission?.(); resumeDeferredAdmission = null;
    },
  };
}

async function fillCreateForm(page: Page) {
  await page.getByPlaceholder("Service Title").fill("Admission-backed service");
  await page.getByPlaceholder("Service Description").fill("Moderated service media is required.");
  await page.getByPlaceholder("Service Price").fill("1250");
}

test("Creator Services cannot create a service until one image is approved", async ({ page }) => {
  const { requests } = await fixture(page); await page.goto(`${e2eOrigin}/dashboard/creator/services`); await fillCreateForm(page);
  await expect(page.getByRole("button", { name: "+ Add Service" })).toBeDisabled();
  expect(requests.filter((request) => request.method === "POST" && request.path === "/api/v1/creator/services")).toHaveLength(0);
});

test("Creator Services creates with CREATOR_SERVICE_MEDIA admission claims and never raw URLs", async ({ page }) => {
  const { requests } = await fixture(page); await page.goto(`${e2eOrigin}/dashboard/creator/services`);
  await expect(page.getByText("Existing service").last()).toBeVisible(); await expect(page.locator(`img[src="${existingReference}"]`)).toHaveCount(2);
  await fillCreateForm(page); const upload = page.locator('input[type="file"]').first(); await expect(upload).toHaveJSProperty("multiple", false); await upload.setInputFiles(image);
  await expect(page.getByText("Image approved.")).toBeVisible(); await page.getByRole("button", { name: "+ Add Service" }).click();
  await expect.poll(() => requests.find(request => request.method === "POST" && request.path === "/api/v1/creator/services")?.body).toBeTruthy();
  const admission = requests.find(request => request.path === "/api/v1/image-moderation/admissions"); expect(String(admission?.body)).toContain("CREATOR_SERVICE_MEDIA");
  const request = requests.find(entry => entry.method === "POST" && entry.path === "/api/v1/creator/services")?.body as Record<string, unknown>;
  expect(request.media).toEqual([{ kind: "ADMISSION", admissionReference: "imauth_service_1" }]); expect(JSON.stringify(request)).not.toContain("blob:"); expect(JSON.stringify(request)).not.toContain("cloudinary");
});

test("Creator Services blocks BLOCK and UNAVAILABLE media from create authority", async ({ page }) => {
  const { requests } = await fixture(page, ["BLOCK", "UNAVAILABLE"]); await page.goto(`${e2eOrigin}/dashboard/creator/services`); await fillCreateForm(page);
  const upload = page.locator('input[type="file"]').first(); await upload.setInputFiles(image); await expect(page.getByText("Blocked")).toBeVisible(); await expect(page.getByRole("button", { name: "+ Add Service" })).toBeDisabled();
  await expect.poll(() => requests.filter(request => request.method === "POST" && request.path === "/api/v1/creator/services")).toHaveLength(0);
  await upload.setInputFiles(image); await expect(page.getByText("Unavailable")).toBeVisible();
  expect(requests.filter(request => request.path.includes("cloudinary"))).toHaveLength(0);
});

test("Creator Services ordinary edits and toggles omit media while preserving the authoritative image", async ({ page }) => {
  const { requests } = await fixture(page); await page.goto(`${e2eOrigin}/dashboard/creator/services`); await page.getByRole("button", { name: "Edit" }).first().click();
  await page.locator('input[type="text"]').last().fill("Edited service"); await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => requests.filter(request => request.method === "PATCH")).toHaveLength(1);
  const edit = requests.find(request => request.method === "PATCH")?.body as Record<string, unknown>; expect(edit.media).toBeUndefined();
  await page.getByRole("button", { name: "Disable" }).first().click(); await expect.poll(() => requests.filter(request => request.method === "PATCH")).toHaveLength(2);
  const toggle = requests.filter(request => request.method === "PATCH")[1].body as Record<string, unknown>; expect(toggle.media).toBeUndefined();
  await page.getByRole("button", { name: "Delete" }).first().click(); await expect.poll(() => requests.filter(request => request.method === "DELETE")).toHaveLength(1);
});

test("Creator Services submits exactly one admitted replacement and never a raw media URL", async ({ page }) => {
  const { requests } = await fixture(page); await page.goto(`${e2eOrigin}/dashboard/creator/services`);
  await page.getByRole("button", { name: "Edit" }).first().click();
  const upload = page.locator('input[type="file"]').last(); await expect(upload).toHaveJSProperty("multiple", false); await upload.setInputFiles(image);
  await expect(page.getByText("Image approved.")).toBeVisible();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => requests.filter((request) => request.method === "PATCH")).toHaveLength(1);
  const update = requests.find((request) => request.method === "PATCH")?.body as Record<string, unknown>;
  expect(update.media).toEqual([{ kind: "ADMISSION", admissionReference: "imauth_service_1" }]);
  expect(JSON.stringify(update)).not.toContain("blob:"); expect(JSON.stringify(update)).not.toContain(existingReference);
});

test("Creator Services keeps authoritative media when a replacement is blocked", async ({ page }) => {
  const { requests } = await fixture(page, ["BLOCK"]); await page.goto(`${e2eOrigin}/dashboard/creator/services`);
  await page.getByRole("button", { name: "Edit" }).first().click();
  await page.locator('input[type="file"]').last().setInputFiles(image);
  await expect(page.getByText("Blocked")).toBeVisible();
  await expect(page.getByText("Your current service image remains authoritative until this replacement is saved.")).toBeVisible();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => requests.filter((request) => request.method === "PATCH")).toHaveLength(0);
});

test("Creator Services lets a zero-image legacy service acquire one approved image", async ({ page }) => {
  const { requests } = await fixture(page, ["PASS"], []); await page.goto(`${e2eOrigin}/dashboard/creator/services`);
  await page.getByRole("button", { name: "Edit" }).first().click();
  await page.locator('input[type="file"]').last().setInputFiles(image);
  await expect(page.getByText("Image approved.")).toBeVisible(); await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => requests.filter((request) => request.method === "PATCH")).toHaveLength(1);
  const update = requests.find((request) => request.method === "PATCH")?.body as Record<string, unknown>;
  expect(update.media).toEqual([{ kind: "ADMISSION", admissionReference: "imauth_service_1" }]);
});

test("Creator Services preserves legacy multi-image media and disables media modification", async ({ page }) => {
  const legacy = ["https://media.invalid/legacy-one.jpg", "https://media.invalid/legacy-two.jpg"];
  const { requests } = await fixture(page, ["PASS"], legacy); await page.goto(`${e2eOrigin}/dashboard/creator/services`);
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.getByText("This legacy service has multiple images. Its media is preserved and must be migrated before it can be changed.")).toBeVisible();
  await expect(page.locator('input[type="file"]').last()).toBeDisabled();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => requests.filter((request) => request.method === "PATCH")).toHaveLength(1);
  const update = requests.find((request) => request.method === "PATCH")?.body as Record<string, unknown>;
  expect(update.media).toBeUndefined();
  expect(JSON.stringify(update)).not.toContain(legacy[0]); expect(JSON.stringify(update)).not.toContain(legacy[1]);
});

test("Creator Services ignores a stale replacement result and releases only its discarded temporary asset", async ({ page }) => {
  const { requests, releaseDeferredAdmission } = await fixture(page, ["BLOCK", "PASS"], [existingReference], { deferFirstAdmission: true });
  await page.goto(`${e2eOrigin}/dashboard/creator/services`); await page.getByRole("button", { name: "Edit" }).first().click();
  const upload = page.locator('input[type="file"]').last(); await upload.setInputFiles({ ...image, name: "first.jpg" });
  await expect.poll(() => requests.filter((request) => request.path === "/api/v1/image-moderation/admissions")).toHaveLength(1);
  await upload.setInputFiles({ ...image, name: "second.jpg" });
  await expect(page.getByText("Image approved.")).toBeVisible();
  await releaseDeferredAdmission();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => requests.filter((request) => request.method === "PATCH")).toHaveLength(1);
  const update = requests.find((request) => request.method === "PATCH")?.body as Record<string, unknown>;
  expect(update.media).toEqual([{ kind: "ADMISSION", admissionReference: "imauth_service_2" }]);
  expect(requests.filter((request) => request.path.includes("temporary-assets/asset-1/release"))).toHaveLength(1);
});

test("Creator Services reports pending cleanup when a discarded temporary asset cannot be released", async ({ page }) => {
  await fixture(page, ["BLOCK"], [existingReference], { releaseStatus: 500 }); await page.goto(`${e2eOrigin}/dashboard/creator/services`);
  await page.getByRole("button", { name: "Edit" }).first().click(); await page.locator('input[type="file"]').last().setInputFiles(image);
  await expect(page.getByText("Blocked")).toBeVisible(); await page.getByRole("button", { name: "✕" }).click();
  await expect(page.getByText("The image was removed, but secure cleanup is pending and will be retried safely.")).toBeVisible();
});
