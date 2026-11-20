import { expect, test } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";
import { createFaceVerificationSessionFixture } from "./fixtures/faceVerificationSession";

const apiOrigin = "http://127.0.0.1:9";
const avatar = "https://media.invalid/creator-avatar.jpg";
const draft = {
  draftVersion: 1,
  displayName: "Creator E2E",
  primaryCategory: "Photography",
  country: "India",
  city: "Pune",
  currency: "INR",
  services: ["Portraits"],
  publicBio: "I create documentary portraits.",
  languages: ["English"],
  avatarUrl: avatar,
  coverUrl: "https://media.invalid/creator-cover.jpg",
  media: ["https://media.invalid/creator-one.jpg", "https://media.invalid/creator-two.jpg"],
  status: "draft",
};

test("direct Creator uses the shared five-capture flow after its valid draft is saved", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const session = createFaceVerificationSessionFixture({
    sessionReference: "CREATOR_FACE_SESSION_E2E",
    // Creator capture derives its trusted avatar from the persisted draft;
    // unlike User onboarding, it must not accept a client-selected avatar.
    expectedStart: undefined,
  });
  let draftWrites = 0;
  let submitted = false;

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "CREATOR", entryRoute: "/creator-application", userId: "creator-ux-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "creator-ux-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/creator-applications/me/draft") {
      return route.fulfill({ json: { applicationJourney: "direct_creator", draft, identity: { realName: "Creator E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999" } } });
    }
    if (request.method() === "PUT" && url.pathname === "/api/v1/creator-applications/me/draft") {
      draftWrites += 1;
      return route.fulfill({ json: { applicationJourney: "direct_creator", draft: { ...draft, draftVersion: 2 }, identity: { realName: "Creator E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999" } } });
    }
    if (request.method() === "GET" && url.pathname === "/api/v1/creator-applications/me/verification-status") {
      return route.fulfill({ json: { status: { applicationStatus: "draft", verificationRevision: 1, lifecycle: "DRAFT", capture: null, request: null, job: null, inference: null, adminReviewRequired: false } } });
    }
    if (request.method() === "POST" && url.pathname === "/api/v1/creator-applications/me/face-verification/session") return route.fulfill(session.start(undefined));
    const capture = url.pathname.match(/\/captures\/(\d+)$/);
    if (request.method() === "POST" && capture) return route.fulfill(session.capture({ request, requestedSessionReference: url.pathname.split("/")[7]!, index: Number(capture[1]) }));
    if (request.method() === "POST" && url.pathname === "/api/v1/creator-applications/me/verification-submission") {
      submitted = true;
      return route.fulfill({ status: 201, json: { verification: { reference: "CREATOR_REQUEST_E2E", status: "QUEUED" } } });
    }
    return route.abort();
  });

  await page.addInitScript(() => localStorage.setItem("accessToken", "creator-verification-ux-e2e-token"));
  await page.goto(`${e2eOrigin}/creator-application`);
  await expect(page.getByRole("button", { name: "Face Verification" })).toBeVisible();
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect.poll(() => draftWrites).toBe(1);
  await expect(page.getByRole("button", { name: "Open camera" })).toBeVisible();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => session.captureIndexes).toEqual([0, 1, 2, 3, 4]);
  await expect(page.getByRole("button", { name: "Submit Creator Application" })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Submit Creator Application" }).click();
  await expect.poll(() => submitted).toBe(true);
  session.assertCompleted();
});

test("verified User upgrades enter the same draft-backed Face Verification step", async ({ page }) => {
  let draftWrites = 0;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/creator-application", userId: "creator-upgrade-ux-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "creator-upgrade-ux-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/creator-applications/me/draft") return route.fulfill({ json: { applicationJourney: "user_upgrade", draft, identity: null } });
    if (request.method() === "PUT" && url.pathname === "/api/v1/creator-applications/me/draft") {
      draftWrites += 1;
      return route.fulfill({ json: { applicationJourney: "user_upgrade", draft: { ...draft, draftVersion: 2 }, identity: null } });
    }
    if (request.method() === "GET" && url.pathname === "/api/v1/creator-applications/me/verification-status") return route.fulfill({ json: { status: { applicationStatus: "draft", verificationRevision: 1, lifecycle: "DRAFT", capture: null, request: null, job: null, inference: null, adminReviewRequired: false } } });
    return route.abort();
  });

  await page.addInitScript(() => localStorage.setItem("accessToken", "creator-upgrade-verification-ux-e2e-token"));
  await page.goto(`${e2eOrigin}/creator-application`);
  await expect(page.getByPlaceholder("Legal name (private)")).toHaveCount(0);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect.poll(() => draftWrites).toBe(1);
  await expect(page.getByRole("button", { name: "Open camera" })).toBeVisible();
});
