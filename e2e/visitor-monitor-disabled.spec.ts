import { expect, test } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

test("default-off monitor leaves visitor storage and requests untouched on the Admin page", async ({ page }) => {
  const requests: Array<{ path: string; authorization?: string; visitor?: string }> = [];
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "isolated-admin-token");
    localStorage.setItem("sthn_visitor_monitor_id", "existing-fixture-id");
    const storage = Storage.prototype;
    const get = storage.getItem; const set = storage.setItem;
    const accesses: string[] = [];
    (window as unknown as { monitorStorageAccesses: string[] }).monitorStorageAccesses = accesses;
    storage.getItem = function (key) { if (key === "sthn_visitor_monitor_id") accesses.push("read"); return get.call(this, key); };
    storage.setItem = function (key, value) { if (key === "sthn_visitor_monitor_id") accesses.push("write"); return set.call(this, key, value); };
  });
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin !== "http://127.0.0.1:9") return route.abort();
    requests.push({ path: url.pathname, authorization: request.headers().authorization, visitor: request.headers()["x-visitor-id"] });
    if (url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "admin-fixture", role: "admin", status: "active" } });
    if (url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "ADMIN", entryRoute: "/admin/entry", userId: "admin-fixture" } });
    if (url.pathname === "/api/admin/operations/bootstrap") return route.fulfill({ json: {} });
    return route.abort();
  });
  await page.goto(`${e2eOrigin}/admin/operations/visitor-monitor`);
  await expect(page.getByText("Visitor Monitor is disabled in this frontend.")).toBeVisible();
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.getByText("Visitor Monitor is disabled in this frontend.")).toBeVisible();
  expect(requests.some(request => request.path === "/api/auth/me" && request.authorization === "Bearer isolated-admin-token")).toBe(true);
  expect(requests.every(request => !request.path.startsWith("/api/v1/visitor-monitor") && !request.visitor)).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { monitorStorageAccesses: string[] }).monitorStorageAccesses)).toEqual([]);
});
