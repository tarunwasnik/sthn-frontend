import { expect, test, type Page } from "@playwright/test";
import { e2eOrigin } from "./fixtures/origin";
import { createFaceVerificationSessionFixture } from "./fixtures/faceVerificationSession";

const apiOrigin = "http://127.0.0.1:9";
const avatar = "https://media.invalid/rejected-avatar.jpg";
const profile = { username: "Rejected E2E", realName: "Rejected E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999", country: "India", city: "Pune", languages: ["English"], bio: "Rejected fixture.", interests: ["testing"], profileStatus: "rejected", rejectionReason: "Please correct your profile.", avatar, cover: "https://media.invalid/cover.jpg", profilePhotos: ["https://media.invalid/one.jpg", "https://media.invalid/two.jpg"] };
const image = (name: string) => ({ name, mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });
const expiresAt = () => new Date(Date.now() + 60 * 60_000).toISOString();

type SessionFixture = ReturnType<typeof createFaceVerificationSessionFixture>;

const installRejectedFixture = async (page: Page, sessions: readonly SessionFixture[], admissionReferences: readonly string[]) => {
  const sessionStarts: unknown[] = [];
  const admissionRequests: string[] = [];
  const cancelReferences: string[] = [];
  const sessionByReference = new Map(sessions.map((session) => [session.session().sessionReference, session]));
  let nextSession = 0;
  let nextAdmission = 0;
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue(); if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/onboarding", userId: "rejected-admission-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "rejected-admission-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") return route.fulfill({ json: profile });
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") {
      const body = request.postData() ?? "";
      admissionRequests.push(body);
      const admissionReference = admissionReferences[nextAdmission++];
      if (!admissionReference) return route.fulfill({ status: 409, json: { message: "No further avatar admission is available." } });
      return route.fulfill({ json: { decision: "PASS", attemptReference: `attempt-${nextAdmission}`, admissionReference, assetReference: `asset-${nextAdmission}`, expiresAt: expiresAt(), message: "Approved" } });
    }
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/face-verification/session") {
      sessionStarts.push(request.postDataJSON());
      const session = sessions[nextSession++];
      return route.fulfill(session ? session.start(sessionStarts.at(-1)) : { status: 409, json: { message: "Completed face verification session is no longer eligible" } });
    }
    const cancel = url.pathname.match(/\/session\/([^/]+)\/cancel$/);
    if (request.method() === "POST" && cancel) {
      cancelReferences.push(cancel[1]);
      const session = sessionByReference.get(cancel[1]);
      return route.fulfill(session
        ? session.cancel(cancel[1])
        : { status: 404, json: { message: "Face verification session not found" } });
    }
    const capture = url.pathname.match(/\/session\/([^/]+)\/captures\/(\d+)$/);
    if (request.method() === "POST" && capture) {
      const session = sessionByReference.get(capture[1]);
      return route.fulfill(session
        ? session.capture({ request, requestedSessionReference: capture[1], index: Number(capture[2]) })
        : { status: 404, json: { message: "Face verification session was not found." } });
    }
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "rejected-admission-e2e-token"));
  return { admissionRequests, cancelReferences, sessionStarts };
};

test("rejected unchanged avatar completes five candidate-bound captures", async ({ page }) => {
  const session = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_E2E", expectedStart: { candidateAvatar: { kind: "UNCHANGED", reference: avatar } } });
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === e2eOrigin) return route.continue(); if (url.origin !== apiOrigin) return route.abort();
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") return route.fulfill({ json: { entryType: "USER", entryRoute: "/onboarding", userId: "rejected-e2e", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "rejected-e2e", role: "user", status: "active", creatorStatus: "none" } });
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") return route.fulfill({ json: profile });
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/face-verification/session") return route.fulfill(session.start(request.postDataJSON()));
    const capture = url.pathname.match(/\/captures\/(\d+)$/); if (request.method() === "POST" && capture) return route.fulfill(session.capture({ request, requestedSessionReference: url.pathname.split("/")[6]!, index: Number(capture[1]) }));
    return route.abort();
  });
  await page.addInitScript(() => localStorage.setItem("accessToken", "rejected-e2e-token"));
  await page.goto(`${e2eOrigin}/onboarding`);
  await expect(page.getByText("Resubmit Your Profile for Verification")).toBeVisible();
  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => session.captureIndexes).toEqual([0, 1, 2, 3, 4]);
  await expect(page.getByRole("button", { name: "Submit Profile" })).toBeVisible({ timeout: 5_000 });
  session.assertCompleted();
});

test("rejected candidate session is cancelled without accepting a capture", async ({ page }) => {
  test.setTimeout(60_000);
  const cancelled = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_CANCEL_E2E", expectedStart: { candidateAvatar: { kind: "UNCHANGED", reference: avatar } } });
  const fresh = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_RECAPTURE_E2E", expectedStart: { candidateAvatar: { kind: "UNCHANGED", reference: avatar } } });
  const harness = await installRejectedFixture(page, [cancelled, fresh], []);
  await page.goto(`${e2eOrigin}/onboarding`);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel face verification" }).click();
  await expect(page.getByText("Resubmit Your Profile for Verification")).toBeVisible();
  cancelled.assertCancelled();
  expect(harness.cancelReferences).toEqual(["FACE_REJECTED_CANCEL_E2E"]);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => fresh.captureIndexes).toEqual([0, 1, 2, 3, 4]);
  fresh.assertCompleted();
  expect(harness.sessionStarts).toHaveLength(2);
});

test("backend-confirmed non-capturable session shows recovery and recaptures with a new reference", async ({ page }) => {
  test.setTimeout(60_000);
  const terminal = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_TERMINAL_E2E", expectedStart: { candidateAvatar: { kind: "UNCHANGED", reference: avatar } }, terminalCaptureIndex: 0 });
  const fresh = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_TERMINAL_RECAPTURE_E2E", expectedStart: { candidateAvatar: { kind: "UNCHANGED", reference: avatar } } });
  const harness = await installRejectedFixture(page, [terminal, fresh], []);
  await page.goto(`${e2eOrigin}/onboarding`);
  await expect(page.getByText("Resubmit Your Profile for Verification")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Real name" })).toHaveValue("Rejected E2E");
  await expect(page.locator("img")).toHaveCount(4);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByRole("alert")).toHaveText("Face verification session is not accepting captures", { timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Start a new session" })).toBeVisible();
  await expect(page.getByText("Capture successful")).toHaveCount(0);
  terminal.assertTerminalCapture(0);
  expect(harness.cancelReferences).toEqual([]);

  await page.getByRole("button", { name: "Start a new session" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => fresh.captureIndexes).toEqual([0, 1, 2, 3, 4]);
  await expect(page.getByRole("button", { name: "Submit Profile" })).toBeVisible({ timeout: 5_000 });
  fresh.assertCompleted();
  expect(harness.sessionStarts).toHaveLength(2);
  expect(harness.sessionStarts).toEqual([
    { candidateAvatar: { kind: "UNCHANGED", reference: avatar } },
    { candidateAvatar: { kind: "UNCHANGED", reference: avatar } },
  ]);
  await expect(page.getByRole("textbox", { name: "Real name" })).toHaveValue("Rejected E2E");
  await expect(page.locator("img")).toHaveCount(4);
});

test("rejected approved avatar admission completes candidate-bound face verification", async ({ page }) => {
  const admissionReference = "admission-rejected-avatar-a";
  const session = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_ADMISSION_A_E2E", expectedStart: { candidateAvatar: { kind: "ADMISSION", admissionReference } } });
  const harness = await installRejectedFixture(page, [session], [admissionReference]);
  await page.goto(`${e2eOrigin}/onboarding`);
  await expect(page.getByText("Resubmit Your Profile for Verification")).toBeVisible();
  await expect(page.locator("img")).toHaveCount(4);
  await page.locator('input[type="file"]').nth(0).setInputFiles(image("rejected-avatar-a.jpg"));
  await expect(page.getByText("Image approved. Save the draft before face verification.")).toBeVisible();
  expect(harness.admissionRequests).toHaveLength(1);
  expect(harness.admissionRequests[0]).toContain("USER_PROFILE_AVATAR");
  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => session.captureIndexes).toEqual([0, 1, 2, 3, 4]);
  await expect(page.getByRole("button", { name: "Submit Profile" })).toBeVisible({ timeout: 5_000 });
  expect(harness.sessionStarts).toEqual([{ candidateAvatar: { kind: "ADMISSION", admissionReference } }]);
  session.assertCompleted();
});

test("replacing a completed rejected admission candidate requires a fresh candidate-bound session", async ({ page }) => {
  test.setTimeout(90_000);
  const admissionA = "admission-rejected-avatar-a";
  const admissionB = "admission-rejected-avatar-b";
  const sessionA = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_ADMISSION_A_E2E", expectedStart: { candidateAvatar: { kind: "ADMISSION", admissionReference: admissionA } } });
  const sessionB = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_ADMISSION_B_E2E", expectedStart: { candidateAvatar: { kind: "ADMISSION", admissionReference: admissionB } } });
  const harness = await installRejectedFixture(page, [sessionA, sessionB], [admissionA, admissionB]);
  await page.goto(`${e2eOrigin}/onboarding`);
  await page.locator('input[type="file"]').nth(0).setInputFiles(image("rejected-avatar-a.jpg"));
  await expect(page.getByText("Image approved. Save the draft before face verification.")).toBeVisible();
  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Submit Profile" })).toBeVisible({ timeout: 5_000 });
  sessionA.assertCompleted();

  await page.locator('input[type="file"]').nth(0).setInputFiles(image("rejected-avatar-b.jpg"));
  await expect(page.getByText("Image approved. Save the draft before face verification.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Face Verification" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit Profile" })).toHaveCount(0);

  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => sessionB.captureIndexes).toEqual([0, 1, 2, 3, 4]);
  await expect(page.getByRole("button", { name: "Submit Profile" })).toBeVisible({ timeout: 5_000 });
  expect(harness.admissionRequests).toHaveLength(2);
  expect(harness.admissionRequests.every((body) => body.includes("USER_PROFILE_AVATAR"))).toBe(true);
  expect(harness.sessionStarts).toEqual([
    { candidateAvatar: { kind: "ADMISSION", admissionReference: admissionA } },
    { candidateAvatar: { kind: "ADMISSION", admissionReference: admissionB } },
  ]);
  sessionA.assertCompleted();
  sessionB.assertCompleted();
});
