import { expect, test, type Page } from "@playwright/test";

import { e2eOrigin } from "./fixtures/origin";
import { createFaceVerificationSessionFixture } from "./fixtures/faceVerificationSession";

const apiOrigin = "http://127.0.0.1:9";
const image = (name: string) => ({ name, mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });
const expiry = () => new Date(Date.now() + 60 * 60_000).toISOString();
const textAdmission = { decision: "ALLOW", message: "Text approved", fingerprint: "e2e-text-fingerprint", admissionToken: "text-admission-e2e" };

const pending = (profile: Record<string, unknown>) => ({ ...profile, profileStatus: "pending_verification", verification: { stage: "PROCESSING", submittedAt: "2026-10-11T00:00:00.000Z" } });
const authenticated = (id: string) => ({ entryType: "USER", entryRoute: "/onboarding", userId: id, creatorStatus: "none" });

const installAuth = async (page: Page, userId: string, getProfile: () => Record<string, unknown>) => {
  await page.addInitScript((token) => localStorage.setItem("accessToken", token), `${userId}-token`);
  return async (route: Parameters<Parameters<Page["route"]>[1]>[0]): Promise<boolean> => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === e2eOrigin) { await route.continue(); return true; }
    if (url.origin !== apiOrigin) { await route.abort(); return true; }
    if (request.method() === "GET" && url.pathname === "/api/auth/entry") { await route.fulfill({ json: authenticated(userId) }); return true; }
    if (request.method() === "GET" && url.pathname === "/api/auth/me") { await route.fulfill({ json: { id: userId, role: "user", status: "active", creatorStatus: "none" } }); return true; }
    if (request.method() === "GET" && url.pathname === "/api/v1/profile/me") { await route.fulfill({ json: getProfile() }); return true; }
    if (request.method() === "POST" && url.pathname === "/api/v1/text-moderation") { await route.fulfill({ json: textAdmission }); return true; }
    return false;
  };
};

const fillInitialFields = async (page: Page) => {
  await page.getByPlaceholder("Username").fill("Initial E2E");
  await page.getByPlaceholder("Real name").fill("Initial E2E");
  await page.locator('input[type="date"]').fill("1990-01-01");
  await page.getByPlaceholder("Mobile number").fill("9999999999");
  await page.getByPlaceholder("Country").fill("India");
  await page.getByPlaceholder("City").fill("Pune");
  await page.getByPlaceholder("Languages, separated by commas").fill("English");
  await page.getByPlaceholder("Bio").fill("Initial submission fixture.");
  await page.getByPlaceholder("Photography, Music...").fill("testing");
};

test("initial onboarding submits draft-authoritative media after five persisted-avatar captures", async ({ page }) => {
  test.setTimeout(90_000);
  const draftProfile = {
    username: "initial e2e", realName: "Initial E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999", country: "India", city: "Pune", languages: ["English"], bio: "Initial submission fixture.", interests: ["testing"], profileStatus: "incomplete",
    avatar: "https://media.invalid/persisted-avatar.jpg", cover: "https://media.invalid/persisted-cover.jpg", profilePhotos: ["https://media.invalid/persisted-one.jpg", "https://media.invalid/persisted-two.jpg"],
  };
  const session = createFaceVerificationSessionFixture({ sessionReference: "FACE_INITIAL_SUBMIT_E2E", expectedStart: { avatar: draftProfile.avatar } });
  const admissionReferences = ["initial-avatar-admission", "initial-cover-admission", "initial-photo-one-admission", "initial-photo-two-admission"];
  const admissionBodies: string[] = []; const drafts: unknown[] = []; const submissions: unknown[] = [];
  let submitted = false;
  const authRoute = await installAuth(page, "initial-submit-e2e", () => submitted ? pending(draftProfile) : { username: "", realName: null, dateOfBirth: null, mobileCountryCode: "+91", mobileNumber: null, country: null, city: null, languages: [], bio: "", interests: [], profileStatus: "incomplete", avatar: "", cover: "", profilePhotos: [] });
  let admissionIndex = 0;
  await page.route("**/*", async route => {
    if (await authRoute(route)) return;
    const request = route.request(); const url = new URL(request.url());
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") {
      admissionBodies.push(request.postData() ?? "");
      const admissionReference = admissionReferences[admissionIndex++];
      return route.fulfill({ json: { decision: "PASS", message: "Approved", attemptReference: `attempt-${admissionIndex}`, admissionReference, assetReference: `asset-${admissionIndex}`, expiresAt: expiry() } });
    }
    if (request.method() === "PUT" && url.pathname === "/api/v1/profile/me/draft") {
      const body = request.postDataJSON(); drafts.push(body);
      const expected = {
        avatar: { kind: "ADMISSION", admissionReference: admissionReferences[0] }, cover: { kind: "ADMISSION", admissionReference: admissionReferences[1] },
        profilePhotos: [{ kind: "ADMISSION", admissionReference: admissionReferences[2] }, { kind: "ADMISSION", admissionReference: admissionReferences[3] }],
      };
      if (JSON.stringify({ avatar: body.avatar, cover: body.cover, profilePhotos: body.profilePhotos }) !== JSON.stringify(expected)) return route.fulfill({ status: 400, json: { message: "Draft claims were not authoritative admissions." } });
      return route.fulfill({ json: { profile: draftProfile } });
    }
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/face-verification/session") return route.fulfill(session.start(request.postDataJSON()));
    const capture = url.pathname.match(/\/session\/([^/]+)\/captures\/(\d+)$/);
    if (request.method() === "POST" && capture) return route.fulfill(session.capture({ request, requestedSessionReference: capture[1], index: Number(capture[2]) }));
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/me") {
      const body = request.postDataJSON(); submissions.push(body); session.assertCompleted();
      const expected = { avatar: { kind: "UNCHANGED", reference: draftProfile.avatar }, cover: { kind: "UNCHANGED", reference: draftProfile.cover }, profilePhotos: draftProfile.profilePhotos.map(reference => ({ kind: "UNCHANGED", reference })) };
      if (JSON.stringify({ avatar: body.avatar, cover: body.cover, profilePhotos: body.profilePhotos }) !== JSON.stringify(expected) || body.textModerationAdmission !== textAdmission.admissionToken || "sessionReference" in body || "avatar" in body && typeof body.avatar === "string") return route.fulfill({ status: 400, json: { message: "Initial submission did not preserve authoritative media/session contract." } });
      submitted = true;
      return route.fulfill({ json: { message: "Profile saved successfully", profileStatus: "pending_verification", profile: pending(draftProfile) } });
    }
    return route.abort();
  });

  await page.goto(`${e2eOrigin}/onboarding`);
  await fillInitialFields(page);
  const files = page.locator('input[type="file"]');
  await files.nth(0).setInputFiles(image("avatar.jpg"));
  await files.nth(1).setInputFiles(image("cover.jpg"));
  await files.nth(2).setInputFiles([image("one.jpg"), image("two.jpg")]);
  await expect.poll(() => admissionBodies).toHaveLength(4);
  expect(admissionBodies[0]).toContain("USER_PROFILE_AVATAR"); expect(admissionBodies[1]).toContain("USER_PROFILE_COVER");
  expect(admissionBodies.slice(2).every(body => body.includes("USER_PROFILE_PHOTO"))).toBe(true);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await expect.poll(() => drafts).toHaveLength(1);
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Submit Profile" }).click();
  await expect.poll(() => submissions).toHaveLength(1);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("Verification in progress")).toBeVisible();
  session.assertCompleted();
});

test("rejected correction submits an admission avatar with unchanged authoritative cover and gallery", async ({ page }) => {
  test.setTimeout(75_000);
  const existing = {
    username: "Rejected Submit E2E", realName: "Rejected Submit E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999", country: "India", city: "Pune", languages: ["English"], bio: "Rejected submission fixture.", interests: ["testing"], profileStatus: "rejected", rejectionReason: "Correct the avatar.",
    avatar: "https://media.invalid/rejected-old-avatar.jpg", cover: "https://media.invalid/rejected-cover.jpg", profilePhotos: ["https://media.invalid/rejected-one.jpg", "https://media.invalid/rejected-two.jpg"],
  };
  const admissionReference = "rejected-new-avatar-admission";
  const session = createFaceVerificationSessionFixture({ sessionReference: "FACE_REJECTED_SUBMIT_E2E", expectedStart: { candidateAvatar: { kind: "ADMISSION", admissionReference } } });
  const submissions: unknown[] = []; let submitted = false;
  const authRoute = await installAuth(page, "rejected-submit-e2e", () => submitted ? pending({ ...existing, avatar: "https://media.invalid/rejected-new-avatar.jpg" }) : existing);
  await page.route("**/*", async route => {
    if (await authRoute(route)) return;
    const request = route.request(); const url = new URL(request.url());
    if (request.method() === "POST" && url.pathname === "/api/v1/image-moderation/admissions") return route.fulfill({ json: { decision: "PASS", message: "Approved", attemptReference: "rejected-avatar-attempt", admissionReference, assetReference: "rejected-avatar-asset", expiresAt: expiry() } });
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/face-verification/session") return route.fulfill(session.start(request.postDataJSON()));
    const capture = url.pathname.match(/\/session\/([^/]+)\/captures\/(\d+)$/);
    if (request.method() === "POST" && capture) return route.fulfill(session.capture({ request, requestedSessionReference: capture[1], index: Number(capture[2]) }));
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/me") {
      const body = request.postDataJSON(); submissions.push(body); session.assertCompleted();
      const expected = { avatar: { kind: "ADMISSION", admissionReference }, cover: { kind: "UNCHANGED", reference: existing.cover }, profilePhotos: existing.profilePhotos.map(reference => ({ kind: "UNCHANGED", reference })) };
      if (JSON.stringify({ avatar: body.avatar, cover: body.cover, profilePhotos: body.profilePhotos }) !== JSON.stringify(expected) || body.textModerationAdmission !== textAdmission.admissionToken || "sessionReference" in body) return route.fulfill({ status: 400, json: { message: "Rejected submission claims/session contract was invalid." } });
      submitted = true;
      return route.fulfill({ json: { message: "Profile saved successfully", profileStatus: "pending_verification", profile: pending(existing) } });
    }
    return route.abort();
  });

  await page.goto(`${e2eOrigin}/onboarding`);
  await expect(page.getByText("Resubmit Your Profile for Verification")).toBeVisible();
  await page.locator('input[type="file"]').nth(0).setInputFiles(image("replacement-avatar.jpg"));
  await expect(page.getByText("Image approved. Save the draft before face verification.")).toBeVisible();
  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Submit Profile" }).click();
  await expect.poll(() => submissions).toHaveLength(1);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("Verification in progress")).toBeVisible();
  session.assertCompleted();
});

test("completed-session ineligibility clears stale readiness and permits fresh rejected resubmission", async ({ page }) => {
  test.setTimeout(120_000);
  const profile = {
    username: "Rejected Recovery E2E", realName: "Rejected Recovery E2E", dateOfBirth: "1990-01-01T00:00:00.000Z", mobileCountryCode: "+91", mobileNumber: "9999999999", country: "India", city: "Pune", languages: ["English"], bio: "Recovery fixture.", interests: ["testing"], profileStatus: "rejected", rejectionReason: "Try again.",
    avatar: "https://media.invalid/recovery-avatar.jpg", cover: "https://media.invalid/recovery-cover.jpg", profilePhotos: ["https://media.invalid/recovery-one.jpg", "https://media.invalid/recovery-two.jpg"],
  };
  const candidate = { candidateAvatar: { kind: "UNCHANGED" as const, reference: profile.avatar } };
  const stale = createFaceVerificationSessionFixture({ sessionReference: "FACE_STALE_SUBMIT_E2E", expectedStart: candidate });
  const fresh = createFaceVerificationSessionFixture({ sessionReference: "FACE_FRESH_SUBMIT_E2E", expectedStart: candidate });
  const sessions = [stale, fresh]; let sessionIndex = 0; let submissionAttempts = 0; let submitted = false;
  const authRoute = await installAuth(page, "rejected-recovery-e2e", () => submitted ? pending(profile) : profile);
  await page.route("**/*", async route => {
    if (await authRoute(route)) return;
    const request = route.request(); const url = new URL(request.url());
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/face-verification/session") {
      const session = sessions[sessionIndex++]; return route.fulfill(session ? session.start(request.postDataJSON()) : { status: 409, json: { message: "Completed face verification session is no longer eligible" } });
    }
    const capture = url.pathname.match(/\/session\/([^/]+)\/captures\/(\d+)$/);
    if (request.method() === "POST" && capture) {
      const session = sessions.find(item => item.session().sessionReference === capture[1]);
      return route.fulfill(session ? session.capture({ request, requestedSessionReference: capture[1], index: Number(capture[2]) }) : { status: 404, json: { message: "Face verification session not found" } });
    }
    if (request.method() === "POST" && url.pathname === "/api/v1/profile/me") {
      const body = request.postDataJSON(); submissionAttempts += 1;
      const expectedMedia = { avatar: { kind: "UNCHANGED", reference: profile.avatar }, cover: { kind: "UNCHANGED", reference: profile.cover }, profilePhotos: profile.profilePhotos.map(reference => ({ kind: "UNCHANGED", reference })) };
      if (JSON.stringify({ avatar: body.avatar, cover: body.cover, profilePhotos: body.profilePhotos }) !== JSON.stringify(expectedMedia) || body.textModerationAdmission !== textAdmission.admissionToken) return route.fulfill({ status: 400, json: { message: "Recovery submission media contract was invalid." } });
      if (submissionAttempts === 1) { stale.assertCompleted(); return route.fulfill({ status: 409, json: { message: "Completed face verification session is no longer eligible" } }); }
      fresh.assertCompleted(); submitted = true;
      return route.fulfill({ json: { message: "Profile saved successfully", profileStatus: "pending_verification", profile: pending(profile) } });
    }
    return route.abort();
  });

  await page.goto(`${e2eOrigin}/onboarding`);
  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Submit Profile" }).click();
  await expect(page.getByText("Your face verification is no longer current. Start a new session and complete all five captures before submitting.")).toBeVisible();
  expect(submissionAttempts).toBe(1);
  await expect(page.getByRole("button", { name: "Submit Profile" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Real name" })).toHaveValue("Rejected Recovery E2E");
  await expect(page.locator("img")).toHaveCount(4);

  await page.getByRole("button", { name: "Face Verification" }).click();
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Capture successful")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Submit Profile" }).click();
  await expect.poll(() => submissionAttempts).toBe(2);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("Verification in progress")).toBeVisible();
  stale.assertCompleted(); fresh.assertCompleted();
});
