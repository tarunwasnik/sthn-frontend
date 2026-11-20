import { expect, test } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

for (const authProvider of ["local", "google"] as const) {
  test(`${authProvider} account exposes correct controls and authoritative sign-in timestamps`, async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.addInitScript(() => localStorage.setItem("accessToken", "isolated-settings-token"));
    const createdAt = "2025-01-02T03:04:05.000Z";
    let sessions = [
      { id: "current", current: true, createdAt, lastSeenAt: "2026-06-07T08:09:10.000Z", expiresAt: "2030-01-01T00:00:00.000Z" },
      { id: "other", current: false, createdAt: "2025-02-03T04:05:06.000Z", lastSeenAt: "2026-07-08T09:10:11.000Z", expiresAt: "2030-01-01T00:00:00.000Z" },
    ];
    const passwordChanges: unknown[] = []; const revocations: string[] = [];
    let logouts = 0;
    await page.route("**/*", async route => {
      const request = route.request(); const url = new URL(request.url());
      if (url.origin === e2eOrigin) return route.continue();
      if (url.origin !== "http://127.0.0.1:9") return route.abort();
      if (request.method() === "GET") {
        if (url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/dashboard/user", userId: "settings-fixture", creatorStatus: "none" } });
        if (url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "settings-fixture", email: "fixture@example.invalid", role: "user", status: "active", creatorStatus: "none", authProvider } });
        if (url.pathname === "/api/v1/profile/me") return route.fulfill({ json: { username: "Settings Fixture", profileStatus: "verified" } });
        if (url.pathname === "/api/v1/account-preferences/me") return route.fulfill({ json: { preferences: { displayTimeZone: null } } });
        if (url.pathname === "/api/v1/security/sessions") return route.fulfill({ json: { sessions } });
      }
      if (request.method() === "PATCH" && url.pathname === "/api/v1/security/password") {
        passwordChanges.push(request.postDataJSON());
        return route.fulfill({ json: { changed: true } });
      }
      if (request.method() === "DELETE" && url.pathname === "/api/v1/security/sessions/other") {
        revocations.push("other"); sessions = sessions.filter(session => session.current);
        return route.fulfill({ json: { revoked: true } });
      }
      if (request.method() === "POST" && url.pathname === "/api/v1/security/sessions/current/logout") {
        logouts += 1; return route.fulfill({ json: { loggedOut: true } });
      }
      return route.abort();
    });
    await page.goto(`${e2eOrigin}/dashboard/user/settings/security`);
    const security = page.getByRole("main", { name: "Password & security" });
    await expect(security.getByText(authProvider === "local" ? "Email and password" : "Google", { exact: true })).toBeVisible();
    const signedIn = await page.evaluate(value => new Date(value).toLocaleString(), createdAt);
    await expect(security.getByText(`Signed in ${signedIn}`, { exact: true })).toBeVisible();
    await expect(security.getByText(/Last active/)).toHaveCount(0);
    await expect(security.getByText("Current session", { exact: true })).toBeVisible();
    if (authProvider === "local") {
      // Existing responsive sections duplicate input IDs; scope to the visible desktop section.
      await security.locator('input[id="current-password"]').fill("Original Secure!1 passphrase");
      await security.locator('input[id="new-password"]').fill("Different Secure!2 passphrase");
      await security.locator('input[id="confirm-new-password"]').fill("Different Secure!2 passphrase");
      await security.getByRole("button", { name: "Change password", exact: true }).click();
      await expect.poll(() => passwordChanges).toEqual([{ currentPassword: "Original Secure!1 passphrase", newPassword: "Different Secure!2 passphrase" }]);
    } else {
      await expect(security.getByText("Password changes are managed through your Google account.")).toBeVisible();
      await expect(security.getByRole("button", { name: "Change password", exact: true })).toHaveCount(0);
      await expect(security.locator('input[type="password"]')).toHaveCount(0);
      expect(passwordChanges).toEqual([]);
    }
    await security.getByRole("button", { name: "Revoke", exact: true }).click();
    await expect.poll(() => revocations).toEqual(["other"]);
    await expect(security.getByRole("button", { name: "Revoke", exact: true })).toHaveCount(0);
    await expect(security.getByText("Current session", { exact: true })).toBeVisible();
    await page.goto(`${e2eOrigin}/dashboard/user/settings/management`);
    await page.getByRole("main", { name: "Account management" }).getByRole("button", { name: "Sign out", exact: true }).click();
    await expect.poll(() => logouts).toBe(1);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("accessToken"))).toBeNull();
  });
}
