import { expect, test } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";

for (const width of [390, 1360]) for (const missing of [false, true]) test(`Admin compares protected Creator captures at ${width}px (missing: ${missing})`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  const paths: string[] = [];
  const challenges = ["LOOK_UP", "LOOK_DOWN", "TURN_RIGHT", "NEUTRAL", "BLINK"];
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aXkAAAAASUVORK5CYII=", "base64");
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === e2eOrigin) return route.continue();
    if (url.origin === "https://media.invalid") return route.fulfill({ contentType: "image/png", body: image });
    if (url.origin !== "http://127.0.0.1:9") return route.abort();
    if (url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "admin-fixture", role: "admin", status: "active" } });
    if (url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "ADMIN", entryRoute: "/admin/entry", userId: "admin-fixture" } });
    if (url.pathname === "/api/admin/operations/bootstrap") return route.fulfill({ json: {} });
    if (url.pathname === "/api/v1/admin/creator-applications") return route.fulfill({ json: { applications: [{ _id: "application-fixture", displayName: "Fixture Creator", userId: { _id: "fixture", email: "fixture@example.invalid" }, status: "submitted", applicationJourney: "user_upgrade", avatarUrl: "https://media.invalid/avatar.png", coverUrl: "https://media.invalid/cover.png", media: ["https://media.invalid/gallery-1.png", "https://media.invalid/gallery-2.png", "https://media.invalid/gallery-3.png", "https://media.invalid/gallery-4.png"], country: "India", city: "Pune", currency: "INR", publicBio: "Bio", services: [], languages: [], createdAt: "2026-01-01T00:00:00Z" }] } });
    if (url.pathname === "/api/v1/admin/creator-verification") return route.fulfill({ json: { cases: [{ verificationReference: "TEST", requestStatus: "ADMIN_REVIEW_REQUIRED", verificationRevision: 1, application: { id: "application-fixture", status: "submitted" }, job: null }] } });
    if (url.pathname === "/api/v1/admin/creator-verification/TEST") return route.fulfill({ json: { verification: { request: { reference: "TEST", status: "ADMIN_REVIEW_REQUIRED", policy: null }, job: null, lifecycle: { lifecycle: "COMPLETED", resultFormat: "NONE" }, inference: null, session: {}, captures: challenges.map((challenge, i) => ({ challengeIndex: i, challenge, viewPath: `/api/v1/admin/creator-verification/TEST/captures/${i}` })).reverse() } } });
    if (url.pathname.includes("/captures/")) {
      paths.push(url.pathname);
      if (!url.pathname.startsWith("/api/v1/admin/")) return route.fulfill({ status: 404, json: { message: "Not found" } });
      expect(route.request().headers().authorization).toBe("Bearer isolated-admin-token");
      if (missing && url.pathname.endsWith("/2")) return route.fulfill({ status: 404, json: { message: "Evidence unavailable" } });
      return route.fulfill({ contentType: "image/png", body: Buffer.concat([image, Buffer.from([Number(url.pathname.split("/").at(-1))])]) });
    }
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "isolated-admin-token"));
  await page.goto(`${e2eOrigin}/admin/operations/creator-applications`);
  await page.getByText("fixture@example.invalid").first().click();
  const comparison = page.getByRole("region", { name: "Identity image comparison" });
  for (let i = 0; i < 5; i++) {
    await expect(comparison.getByText(`Capture ${i + 1} · ${challenges[i]}`, { exact: true })).toBeVisible();
    if (!missing || i !== 2) {
      const capture = comparison.getByAltText(`Capture ${i + 1} · ${challenges[i]}`, { exact: true });
      await expect(capture).toBeVisible();
      expect(await capture.evaluate(async (element) => { const bytes = new Uint8Array(await (await fetch((element as HTMLImageElement).src)).arrayBuffer()); return bytes[bytes.length - 1]; })).toBe(i);
    }
  }
  await expect.poll(() => paths.length).toBe(5);
  expect(paths.sort()).toEqual(challenges.map((_, i) => `/api/v1/admin/creator-verification/TEST/captures/${i}`).sort());
  if (missing) await expect(comparison.getByText("Capture unavailable")).toBeVisible();
  await comparison.getByRole("button", { name: "Enlarge Creator avatar" }).click();
  await expect(comparison.getByAltText("Enlarged Creator avatar")).toBeVisible();
  await comparison.getByRole("button", { name: "Enlarge Creator cover" }).click();
  await expect(comparison.getByAltText("Enlarged Creator cover")).toBeVisible();
  await comparison.getByRole("button", { name: "Enlarge Capture 1 · LOOK_UP" }).click();
  await expect(comparison.getByAltText("Enlarged Capture 1 · LOOK_UP")).toBeVisible();
  expect(await comparison.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(paths).toHaveLength(5);
  const gallery = page.locator('[aria-label="Media Gallery"]');
  const thumbnails = gallery.getByRole("button");
  await expect(thumbnails).toHaveCount(4);
  const positions = await thumbnails.evaluateAll((buttons) => buttons.map((button) => { const box = button.getBoundingClientRect(); return { top: box.top, width: box.width, height: box.height }; }));
  expect(positions[0].top).toBe(positions[1].top);
  if (width === 390) expect(positions[2].top).toBeGreaterThan(positions[0].top);
  else expect(positions[3].top).toBe(positions[0].top);
  for (const position of positions) { expect(position.width).toBeLessThan(200); expect(position.width).toBeCloseTo(position.height, 0); }
  await gallery.getByRole("button", { name: "View gallery image 2" }).click();
  await expect(page.getByAltText("Gallery image 2")).toHaveAttribute("src", "https://media.invalid/gallery-2.png");
  await page.getByRole("button", { name: "Close image preview" }).click();
  await expect(page.getByAltText("Gallery image 2")).toHaveCount(0);
});
