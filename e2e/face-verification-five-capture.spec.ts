import { expect, test } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";
import { createFaceVerificationSessionFixture } from "./fixtures/faceVerificationSession";

const apiOrigin = "http://127.0.0.1:9";
const profile = { username: "Face E2E", realName: "Face E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999", country: "India", city: "Pune", languages: ["English"], bio: "Face fixture.", interests: ["testing"], profileStatus: "incomplete", avatar: "https://media.invalid/avatar.jpg", cover: "https://media.invalid/cover.jpg", profilePhotos: ["https://media.invalid/one.jpg", "https://media.invalid/two.jpg"] };

test("real onboarding overlay completes five server-issued captures sequentially", async ({ page }) => {
  test.setTimeout(60_000);
  const session = createFaceVerificationSessionFixture({ sessionReference: "FACE_SESSION_E2E", expectedStart: { avatar: profile.avatar } });
  let draftSaved = false;
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue(); if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/onboarding", userId: "face-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "face-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") return route.fulfill({ json: profile });
    if (request.method() === "PUT" && url.pathname === "/api/v1/profile/me/draft") { draftSaved = true; return route.fulfill({ json: { profile } }); }
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/face-verification/session") return route.fulfill(session.start(request.postDataJSON()));
    const match = url.pathname.match(/\/captures\/(\d+)$/);
    if (request.method() === "POST" && match) {
      return route.fulfill(session.capture({ request, requestedSessionReference: url.pathname.split("/")[6]!, index: Number(match[1]) }));
    }
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "face-e2e-token"));
  await page.goto(`${e2eOrigin}/onboarding`);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect.poll(() => draftSaved).toBe(true);
  await expect(page.getByRole("button", { name: "Open camera" })).toBeVisible();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Look straight at the camera")).toBeVisible();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => session.captureIndexes).toEqual([0, 1, 2, 3, 4]);
  await expect(page.getByRole("button", { name: "Submit Profile" })).toBeVisible({ timeout: 5_000 });
  session.assertCompleted();
});
