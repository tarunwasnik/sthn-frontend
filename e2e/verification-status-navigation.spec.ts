import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
type Status = "pending_verification" | "verified" | "rejected";

async function fixture(page: Page, role: "user" | "creator" = "user", theme: "light" | "dark" = "light") {
  let status: Status = "pending_verification";
  let failProfile = false;
  let profileReads = 0;
  let applicationStatus = "submitted";
  await page.route("**/*", async (route) => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: role === "user" ? "USER" : "CREATOR", entryRoute: `/dashboard/${role}`, userId: "status-fixture" } });
    if (url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "status-fixture", role, status: "active", creatorStatus: role === "creator" ? "approved" : "none" } });
    if (url.pathname === "/api/v1/profile/me") { profileReads += 1; if (failProfile) return route.fulfill({ status: 503, json: {} }); return route.fulfill({ json: { username: "Fixture", profileStatus: status, rejectionReason: status === "rejected" ? "Update your profile" : "", avatar: "https://media.invalid/a.jpg" } }); }
    if (url.pathname === "/api/v1/bookings/user") return route.fulfill({ json: { bookings: [] } });
    if (url.pathname === "/api/v1/creator-applications/me") return route.fulfill({ json: { application: { status: applicationStatus } } });
    if (url.pathname === "/api/v1/creator/dashboard") return route.fulfill({ json: { creatorProfile: { displayName: "Fixture", status: "active" }, stats: {}, recentActivity: [] } });
    if (url.pathname === "/api/v1/creator/services") return route.fulfill({ json: { services: [] } });
    if (url.pathname === "/api/v1/creator/bookings") return route.fulfill({ json: { bookings: [] } });
    if (url.pathname === "/api/v1/creator/bookings/pending-count") return route.fulfill({ json: { pendingRequestCount: 0 } });
    if (url.pathname === "/api/public/home") return route.fulfill({ json: { stats: { totalCreators: 0, totalBookings: 0, totalUsers: 0 }, featuredCreators: [] } });
    return route.abort();
  });
  await page.addInitScript((selectedTheme) => { localStorage.setItem("accessToken", "status-fixture-token"); localStorage.setItem("sthn.theme-preference", selectedTheme); }, theme);
  return { setStatus: (next: Status) => { status = next; }, setFailure: (value: boolean) => { failProfile = value; }, reads: () => profileReads, setApplicationStatus: (value: string) => { applicationStatus = value; } };
}

for (const next of ["verified", "rejected"] as const) test(`pending User updates to ${next} on focus without a reload`, async ({ page }) => {
  const api = await fixture(page);
  await page.goto(`${e2eOrigin}/dashboard/user`);
  await expect(page.getByText("Pending Verification", { exact: true })).toBeVisible();
  api.setFailure(true);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Pending Verification", { exact: true })).toBeVisible();
  await expect.poll(api.reads).toBeGreaterThan(2);
  api.setFailure(false); api.setStatus(next);
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByText(next === "verified" ? "Verified" : "Rejected", { exact: true })).toBeVisible();
  await expect(page.getByText("Become a Creator", { exact: true })).toHaveCount(next === "verified" ? 1 : 0);
  await expect(page).toHaveURL(/\/dashboard\/user$/);
});

test("Creator application status revalidates on focus without navigation", async ({ page }) => {
  const api = await fixture(page);
  await page.goto(`${e2eOrigin}/creator-application`);
  await expect(page.getByRole("heading", { name: "Application under review" })).toBeVisible();
  api.setApplicationStatus("approved");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("heading", { name: "Creator application approved" })).toBeVisible();
  await expect(page).toHaveURL(/\/creator-application$/);
});

test("Creator application status in User settings refreshes without redirect", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const api = await fixture(page);
  await page.goto(`${e2eOrigin}/dashboard/user/settings/creator`);
  const detail = page.getByRole("main", { name: "Creator account" });
  await expect(detail.getByText("submitted", { exact: true })).toBeVisible();
  api.setApplicationStatus("rejected");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(detail.getByText("rejected", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/user\/settings\/creator$/);
});

test("pending User polls until approval and stops polling after a terminal status", async ({ page }) => {
  await page.clock.install();
  const api = await fixture(page);
  await page.goto(`${e2eOrigin}/dashboard/user`);
  await expect(page.getByText("Pending Verification", { exact: true })).toBeVisible();
  api.setStatus("verified");
  await page.clock.fastForward(15_000);
  await expect(page.getByText("Verified", { exact: true })).toBeVisible();
  const terminalReads = api.reads();
  await page.clock.fastForward(60_000);
  expect(api.reads()).toBe(terminalReads);
});

for (const role of ["user", "creator"] as const) for (const theme of ["light", "dark"] as const) test(`${role} mobile navigation is opaque and scrollable in ${theme}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 650 });
  await fixture(page, role, theme);
  await page.goto(`${e2eOrigin}/dashboard/${role}`);
  const nav = page.locator("nav.fixed");
  await expect(nav).toBeVisible();
  expect(await nav.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  const main = page.locator("main").first();
  const geometry = await main.evaluate((element) => { element.scrollTop = element.scrollHeight; const style = getComputedStyle(element); return { padding: parseFloat(style.paddingBottom), scrollTop: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }; });
  expect(geometry.padding).toBeGreaterThanOrEqual(100);
  expect(geometry.scrollHeight - geometry.clientHeight - geometry.scrollTop).toBeLessThanOrEqual(1);
  const contentBottom = await main.evaluate((element) => element.lastElementChild?.getBoundingClientRect().bottom ?? 0);
  const navTop = await nav.evaluate((element) => element.getBoundingClientRect().top);
  expect(contentBottom).toBeLessThanOrEqual(navTop);
});

test("public home has no sidebar while desktop User navigation remains visible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await fixture(page);
  await page.goto(e2eOrigin);
  await expect(page.locator("aside")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Join Now" })).toBeVisible();
  await page.goto(`${e2eOrigin}/dashboard/user`);
  await expect(page.locator("aside")).toBeVisible();
});
