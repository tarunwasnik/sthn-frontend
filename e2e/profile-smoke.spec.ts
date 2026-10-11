import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";
const profileMedia = {
  avatar: "https://media.invalid/avatar.jpg",
  cover: "https://media.invalid/cover.jpg",
  profilePhotos: ["https://media.invalid/photo-1.jpg", "https://media.invalid/photo-2.jpg"],
};

type ProfileStatus = "incomplete" | "verified";

async function installIsolatedApi(page: Page, status: ProfileStatus) {
  const blocked: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) {
      blocked.push(request.url());
      return route.abort();
    }

    const payloads: Record<string, unknown> = {
      "/api/auth/entry": { entryType: "USER", entryRoute: status === "incomplete" ? "/onboarding" : "/profile", userId: "e2e-user", creatorStatus: "none" },
      "/api/auth/me": { id: "e2e-user", role: "user", status: "active", creatorStatus: "none" },
      "/api/v1/profile/me": {
        username: "E2E User", realName: "E2E User", bio: "Isolated browser fixture.", interests: ["testing"],
        dateOfBirth: "1990-01-01T00:00:00.000Z", country: "India", city: "Pune", languages: ["English"],
        profileStatus: status, verification: { stage: "NOT_SUBMITTED", submittedAt: null }, ...profileMedia,
      },
    };
    const body = payloads[url.pathname];
    if (request.method() !== "GET" || body === undefined) {
      blocked.push(`${request.method()} ${request.url()}`);
      return route.abort();
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "e2e-isolated-token"));
  return blocked;
}

test("isolated authenticated incomplete user reaches the real onboarding route", async ({ page }) => {
  const blocked = await installIsolatedApi(page, "incomplete");
  await page.goto(`${e2eOrigin}/onboarding`);
  await expect(page.getByPlaceholder("Username")).toHaveValue("E2E User");
  await expect(page.getByPlaceholder("Bio")).toHaveValue("Isolated browser fixture.");
  expect(blocked).toEqual(expect.arrayContaining(["GET http://127.0.0.1:9/api/v1/chat/conversations"]));
});

test("isolated authenticated verified user reaches the real profile route", async ({ page }) => {
  const blocked = await installIsolatedApi(page, "verified");
  await page.goto(`${e2eOrigin}/profile`);
  await expect(page.getByRole("button", { name: "Edit Profile" })).toBeVisible();
  await expect(page.getByText("verified", { exact: true })).toBeVisible();
  expect(blocked).toEqual(expect.arrayContaining(["GET http://127.0.0.1:9/api/v1/chat/conversations"]));
});

test("unexpected API traffic is blocked rather than reaching a service", async ({ page }) => {
  const blocked = await installIsolatedApi(page, "verified");
  await page.goto(`${e2eOrigin}/profile`);
  await expect(page.evaluate(() => fetch("https://example.test/unexpected"))).rejects.toThrow("Failed to fetch");
  await expect.poll(() => blocked).toContain("https://example.test/unexpected");
});
