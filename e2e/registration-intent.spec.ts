import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

const apiOrigin = "http://127.0.0.1:9";

const registerRequest = async (page: Page) => {
  const requests: Array<Record<string, unknown>> = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "POST" && url.pathname === "/api/auth/register") {
      requests.push(JSON.parse(request.postData() ?? "{}") as Record<string, unknown>);
      return route.fulfill({ status: 201, json: { token: "registration-intent-test-token", role: "user", status: "pending_profile" } });
    }
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "ONBOARDING", entryRoute: "/onboarding", userId: "registration-intent-test" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "registration-intent-test", role: "user", status: "pending_profile", creatorStatus: "none" } });
    return route.abort();
  });
  return requests;
};

const submit = async (page: Page, email: string) => {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Registration Intent Secure!1");
  await page.getByLabel("Confirm password").fill("Registration Intent Secure!1");
  await page.getByRole("button", { name: "Register" }).click();
};

test("registration exposes only the User journey even with an old Creator intent URL", async ({ page }) => {
  await page.goto(`${e2eOrigin}/register?intent=creator`);
  await expect(page.getByRole("radio", { name: /Creator/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
});

test("registration ignores an old Creator intent and submits only User credentials", async ({ page }) => {
  const requests = await registerRequest(page);
  await page.goto(`${e2eOrigin}/register?intent=creator`);
  await submit(page, "final-user@test.local");
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).not.toHaveProperty("creatorOnboardingIntent");
});
