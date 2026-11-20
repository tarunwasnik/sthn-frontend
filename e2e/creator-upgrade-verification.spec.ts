import { expect, test } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";
import { createFaceVerificationSessionFixture } from "./fixtures/faceVerificationSession";

for (const viewport of [{ width: 390, height: 844 }, { width: 1360, height: 800 }]) for (const fails of [false, true]) {
  test(`Creator submission ${fails ? "failure" : "success"} at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    const capture = createFaceVerificationSessionFixture({ sessionReference: `CREATOR_UPGRADE_${viewport.width}`, expectedStart: undefined });
    const draft = { draftVersion: 1, applicationJourney: "user_upgrade", displayName: "Creator E2E", interests: ["Music"], country: "India", city: "Pune", currency: "INR", publicBio: "Creator profile", languages: ["English"], avatarUrl: "https://media.invalid/avatar.jpg", coverUrl: "https://media.invalid/cover.jpg", media: ["https://media.invalid/one.jpg", "https://media.invalid/two.jpg"], status: "draft" };
    let submitted = false;
    let submissions = 0;
    await page.route("**/*", async (route) => {
      const req = route.request(); const url = new URL(req.url());
      if (url.origin === e2eOrigin) return route.continue();
      if (url.origin !== "http://127.0.0.1:9") return route.abort();
      if (url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/creator-application", userId: "user-test", creatorStatus: "none" } });
      if (url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "user-test", role: "user", status: "active", creatorStatus: "none" } });
      if (url.pathname === "/api/v1/profile/me") return route.fulfill({ json: { profileStatus: "verified" } });
      if (url.pathname === "/api/v1/creator-applications/me") return route.fulfill({ json: { application: submitted ? { ...draft, status: "submitted" } : draft } });
      if (req.method() === "PUT" && url.pathname === "/api/v1/creator-applications/me/upgrade-draft") return route.fulfill({ json: { applicationJourney: "user_upgrade", draft: { ...draft, draftVersion: 2 }, identity: null } });
      if (url.pathname === "/api/v1/creator-applications/me/upgrade-verification-status") return route.fulfill({ json: { status: { applicationStatus: submitted ? "submitted" : "draft", verificationRevision: 1, lifecycle: submitted ? "PROCESSING" : "DRAFT", capture: null, request: null, job: submitted ? { status: "RUNNING" } : null, inference: null, adminReviewRequired: false } } });
      if (req.method() === "POST" && url.pathname === "/api/v1/creator-applications/me/upgrade-face-verification/session") return route.fulfill(capture.start(undefined));
      const match = url.pathname.match(/\/captures\/(\d+)$/);
      if (req.method() === "POST" && match) return route.fulfill(capture.capture({ request: req, requestedSessionReference: url.pathname.split("/")[7]!, index: Number(match[1]) }));
      if (req.method() === "POST" && url.pathname === "/api/v1/creator-applications") { submissions++; if (fails) return route.fulfill({ status: 500, json: { message: "Submission failed" } }); submitted = true; return route.fulfill({ status: 201, json: { verification: { reference: "CREATOR_TEST", status: "PENDING" } } }); }
      return route.abort();
    });
    await page.addInitScript(() => localStorage.setItem("accessToken", "isolated-test-token"));
    await page.goto(`${e2eOrigin}/creator-application`);
    await expect(page.getByLabel("Interests")).toHaveValue("Music");
    await page.getByRole("button", { name: "Face Verification" }).click();
    await page.getByRole("button", { name: "Open camera" }).click();
    await expect.poll(() => capture.captureIndexes, { timeout: 30_000 }).toEqual([0, 1, 2, 3, 4]);
    await page.getByRole("button", { name: "Submit Creator Application" }).click();
    if (fails) {
      await expect(page.getByText("Submission failed")).toBeVisible();
      await expect(page).toHaveURL(/\/creator-application$/);
      await expect(page.getByText("Creator application submitted successfully.")).toHaveCount(0);
    } else {
      await expect(page).toHaveURL(/\/dashboard\/user$/);
      await expect(page.getByText("Creator application submitted successfully.")).toHaveCount(1);
      await page.goto(`${e2eOrigin}/creator-application`);
      await expect(page.getByRole("heading", { name: "Application under review" })).toBeVisible();
      await expect(page.getByText("Verification status: PROCESSING (running).")).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: "Application under review" })).toBeVisible();
      await expect(page).toHaveURL(/\/creator-application$/);
    }
    expect(submissions).toBe(1);
    capture.assertCompleted();
  });
}
