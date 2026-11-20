import { expect, test } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const submittedDraft = {
  draftVersion: 2,
  displayName: "Pending Creator",
  primaryCategory: "Photography",
  country: "India",
  city: "Pune",
  currency: "INR",
  services: ["Portraits"],
  publicBio: "Pending review.",
  languages: ["English"],
  avatarUrl: "https://media.invalid/pending-avatar.jpg",
  coverUrl: "https://media.invalid/pending-cover.jpg",
  media: ["https://media.invalid/pending-one.jpg", "https://media.invalid/pending-two.jpg"],
  status: "submitted",
};

for (const accountStatus of ["none", "pending"] as const) test(`a submitted direct Creator with account status ${accountStatus} can navigate and refresh`, async ({ page }) => {
  if (accountStatus === "pending") await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "CREATOR_PENDING", entryRoute: "/dashboard/creator", userId: "pending-creator-e2e", creatorStatus: "pending" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "pending-creator-e2e", email: "creator@example.test", role: "user", status: "pending_profile", creatorStatus: accountStatus } });
    if (request.method() === "GET" && url.pathname === "/api/v1/account-preferences/me") return route.fulfill({ json: { preferences: { displayTimeZone: null } } });
    if (request.method() === "GET" && url.pathname === "/api/v1/creator-applications/me/draft") return route.fulfill({ json: { applicationJourney: "direct_creator", draft: submittedDraft, identity: { realName: "Pending Creator", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999" } } });
    if (request.method() === "GET" && url.pathname === "/api/v1/creator-applications/me/verification-status") return route.fulfill({ json: { status: { applicationStatus: "submitted", verificationRevision: 2, lifecycle: "PROCESSING", capture: null, request: { status: "PROCESSING", reference: "CREATOR_PENDING_E2E" }, job: { status: "RUNNING", attemptCount: 1 }, inference: null, adminReviewRequired: false } } });
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "pending-creator-dashboard-e2e-token"));

  await page.goto(`${e2eOrigin}/creator-application`);
  await expect(page.getByRole("heading", { name: "Application under review" })).toBeVisible();
  await page.getByRole("button", { name: "Back to dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard\/creator$/);
  await expect(page.getByText("Creator application in review")).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard\/creator$/);
  await expect(page.getByText("Creator application in review")).toBeVisible();
  await expect(page.getByText(/Services, availability, bookings, payouts/)).toBeVisible();
  await page.getByRole("button", { name: "View application" }).click();
  await expect(page.getByRole("heading", { name: "Application under review" })).toBeVisible();
  await page.goto(`${e2eOrigin}/dashboard/creator/services`);
  await expect(page.getByText("This workspace will be available after your Creator application is approved.")).toBeVisible();
  await expect(page.getByRole("button", { name: /create service/i })).toHaveCount(0);
  await page.goto(`${e2eOrigin}/dashboard/creator/availability`);
  await expect(page.getByText("This workspace will be available after your Creator application is approved.")).toBeVisible();
  await page.goto(`${e2eOrigin}/dashboard/creator/requests`);
  await expect(page.getByText("This workspace will be available after your Creator application is approved.")).toBeVisible();
  await page.goto(`${e2eOrigin}/dashboard/creator/settings/management`);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.goto(`${e2eOrigin}/dashboard/creator/settings/account`);
  await expect(page.getByText("creator@example.test").nth(accountStatus === "pending" ? 0 : 1)).toBeVisible();
  await page.goto(`${e2eOrigin}/dashboard/creator/browse`);
  await expect(page.getByRole("heading", { name: "Browse Creators" })).toBeVisible();
});

test("a previously submitted direct Creator can log in to the restricted dashboard", async ({ page }) => {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "POST" && url.pathname === "/api/auth/login") return route.fulfill({ json: { token: "pending-login-test-token" } });
    if (request.method() === "POST" && url.pathname === "/api/v1/security/sessions/current/logout") return route.fulfill({ json: {} });
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "CREATOR_PENDING", entryRoute: "/dashboard/creator", userId: "pending-login-e2e" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "pending-login-e2e", role: "user", status: "pending_profile", creatorStatus: "none" } });
    return route.abort();
  });
  await page.goto(`${e2eOrigin}/login`);
  await page.getByLabel("Email").fill("applicant@example.test");
  await page.getByLabel("Password").fill("isolated-test-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard\/creator$/);
  await expect(page.getByText("Creator application in review")).toBeVisible();
  await page.goto(`${e2eOrigin}/dashboard/creator/settings/management`);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/(?:login)?$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("accessToken"))).toBeNull();
});
