import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";

type SessionFixture = { entry: { entryType: "USER" | "CREATOR_PENDING" | "CREATOR"; entryRoute: string; userId: string; creatorStatus?: "none" | "pending" | "approved" }; me: { role: "user" | "creator"; status: string; creatorStatus: "none" | "pending" | "approved" } };

const installHomeFixture = async (page: Page, session?: SessionFixture) => {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/public/home") return route.fulfill({ json: { stats: { totalCreators: 0, totalBookings: 0, totalUsers: 0 }, featuredCreators: [] } });
    if (session && request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: session.entry });
    if (session && request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: session.entry.userId, ...session.me } });
    return route.abort();
  });
  if (session) await page.addInitScript(() => localStorage.setItem("accessToken", "home-routing-test-token"));
};

const becomeCreator = (page: Page) => page.getByRole("button", { name: "Become a Creator" }).click();

test("a logged-out homepage visitor is sent to User registration", async ({ page }) => {
  await installHomeFixture(page);
  await page.goto(e2eOrigin);
  await becomeCreator(page);
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("radio", { name: /Creator/ })).toHaveCount(0);
});

test("authenticated User and pending applicant retain the Creator application recovery path", async ({ page }) => {
  await installHomeFixture(page, { entry: { entryType: "USER", entryRoute: "/dashboard/user", userId: "user-home", creatorStatus: "none" }, me: { role: "user", status: "active", creatorStatus: "none" } });
  await page.goto(e2eOrigin);
  await becomeCreator(page);
  await expect(page).toHaveURL(/\/creator-application$/);

  await installHomeFixture(page, { entry: { entryType: "CREATOR_PENDING", entryRoute: "/creator-application", userId: "pending-home", creatorStatus: "pending" }, me: { role: "user", status: "pending_profile", creatorStatus: "pending" } });
  await page.goto(e2eOrigin);
  await becomeCreator(page);
  await expect(page).toHaveURL(/\/creator-application$/);
});

test("an active Creator is sent to the Creator dashboard", async ({ page }) => {
  await installHomeFixture(page, { entry: { entryType: "CREATOR", entryRoute: "/dashboard/creator", userId: "creator-home", creatorStatus: "approved" }, me: { role: "creator", status: "active", creatorStatus: "approved" } });
  await page.goto(e2eOrigin);
  await becomeCreator(page);
  await expect(page).toHaveURL(/\/dashboard\/creator$/);
});
