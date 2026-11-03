import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const image = { name: "creator-avatar.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) };
const expiry = () => new Date(Date.now() + 60 * 60_000).toISOString();

async function installCreatorApplicationFixture(page: Page) {
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  let admissionCount = 0;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    const rawBody = request.postData();
    const contentType = await request.headerValue("content-type");
    const body = contentType?.includes("application/json") && rawBody
      ? JSON.parse(rawBody) as unknown
      : rawBody ?? null;
    requests.push({ method: request.method(), path: url.pathname, body });
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/creator-application", userId: "creator-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "creator-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") return route.fulfill({ json: { profileStatus: "verified" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/creator-applications/me") return route.fulfill({ json: { application: null } });
    if (request.method() === "POST" && url.pathname === "/api/v1/text-moderation") return route.abort();
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") {
      admissionCount += 1;
      return route.fulfill({ json: { decision: "PASS", attemptReference: `attempt-${admissionCount}`, admissionReference: `creator-admission-${admissionCount}`, assetReference: `creator-asset-${admissionCount}`, expiresAt: expiry(), message: "Image approved." } });
    }
    if (request.method() === "POST" && url.pathname === "/api/v1/creator-applications") return route.fulfill({ status: 201, json: { message: "Creator application submitted", application: { status: "submitted" } } });
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "creator-application-e2e-token"));
  return requests;
}

test("creator application submits only admission-backed media and creator application surfaces", async ({ page }) => {
  const requests = await installCreatorApplicationFixture(page);
  await page.goto(`${e2eOrigin}/creator-application`);
  await page.getByPlaceholder("Display Name").fill("Creator E2E");
  await page.getByPlaceholder("Primary Category").fill("Photography");
  await page.getByPlaceholder("Country").fill("India");
  await page.getByPlaceholder("City").fill("Pune");
  await page.getByPlaceholder("Services").fill("Portraits");
  await page.getByPlaceholder("Languages").fill("English");
  await page.getByPlaceholder("Public Bio").fill("I create documentary portraits.");
  await page.getByPlaceholder("Select Currency").fill("INR");
  await page.getByRole("button", { name: /INR/ }).first().click();
  await page.locator('input[type="file"]').nth(0).setInputFiles(image);
  await expect(page.getByText("Image approved.")).toBeVisible();
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect.poll(() => requests.find((entry) => entry.method === "POST" && entry.path === "/api/v1/creator-applications")?.body).toBeTruthy();
  const admissionRequest = requests.find((entry) => entry.path === "/api/v1/image-moderation/admissions");
  expect(String(admissionRequest?.body)).toContain("CREATOR_APPLICATION_AVATAR");
  const submission = requests.find((entry) => entry.method === "POST" && entry.path === "/api/v1/creator-applications")?.body as Record<string, unknown>;
  expect(submission.avatar).toEqual({ kind: "ADMISSION", admissionReference: "creator-admission-1" });
  expect(submission).not.toHaveProperty("avatarUrl");
  expect(submission).not.toHaveProperty("coverUrl");
  expect(submission).not.toHaveProperty("textModerationAdmission");
  expect(requests.filter((entry) => entry.path === "/api/v1/text-moderation")).toHaveLength(0);
});
