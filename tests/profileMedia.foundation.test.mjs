import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const moduleFromSource = async (path, replacements = []) => {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  for (const [from, to] of replacements) source = source.replace(from, to);
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
};

const media = await moduleFromSource("../src/features/profileMedia/profileMedia.ts");

const file = (name = "profile.jpg") => new File(["image"], name, { type: "image/jpeg" });
const pass = { decision: "PASS", attemptReference: "imat_1", admissionReference: "imauth_1", assetReference: "ima_1", expiresAt: "2030-01-01T00:00:00.000Z", message: "approved" };
const block = { decision: "BLOCK", attemptReference: "imat_2", assetReference: "ima_2", message: "blocked" };
const unavailable = { decision: "UNAVAILABLE", attemptReference: "imat_3", assetReference: "ima_3", message: "unavailable" };

test("profile-media claims distinguish existing and approved media", () => {
  assert.deepEqual(media.toProfileMediaClaim({ state: "EXISTING", surface: "USER_PROFILE_AVATAR", reference: "https://stored/avatar" }), { kind: "UNCHANGED", reference: "https://stored/avatar" });
  const approved = { state: "APPROVED", surface: "USER_PROFILE_AVATAR", sourceFile: file(), previewUrl: "blob:approved", ownsPreviewUrl: false, admissionReference: "imauth_1", expiresAt: pass.expiresAt };
  assert.deepEqual(media.toProfileMediaClaim(approved, Date.parse("2029-01-01T00:00:00.000Z")), { kind: "ADMISSION", admissionReference: "imauth_1" });
});

test("profile-media admission states never serialize before approval or after expiry", () => {
  const pending = { clientId: "pending-avatar", operationId: 7, state: "UPLOADING", surface: "USER_PROFILE_AVATAR", sourceFile: file(), previewUrl: "blob:pending", ownsPreviewUrl: false };
  const blocked = media.resolveProfileMediaAdmission(pending, block);
  const unavailableResult = media.resolveProfileMediaAdmission(pending, unavailable);
  assert.equal(blocked.state, "BLOCKED");
  assert.equal(unavailableResult.state, "UNAVAILABLE");
  assert.throws(() => media.toProfileMediaClaim(pending), media.ProfileMediaClaimError);
  assert.throws(() => media.toProfileMediaClaim(blocked), media.ProfileMediaClaimError);
  assert.throws(() => media.toProfileMediaClaim(unavailableResult), media.ProfileMediaClaimError);
  assert.throws(() => media.toProfileMediaClaim(media.failProfileMediaSelection(pending, "network failed")), media.ProfileMediaClaimError);
  const expired = media.resolveProfileMediaAdmission(pending, pass);
  assert.equal(expired.clientId, pending.clientId);
  assert.equal(expired.operationId, pending.operationId);
  assert.throws(() => media.toProfileMediaClaim(expired, Date.parse("2031-01-01T00:00:00.000Z")), media.ProfileMediaClaimError);
});

test("gallery order, replacement, removal, and PATCH omission are deterministic", () => {
  const one = { state: "EXISTING", surface: "USER_PROFILE_PHOTO", reference: "https://stored/one" };
  const two = { state: "EXISTING", surface: "USER_PROFILE_PHOTO", reference: "https://stored/two" };
  const replacement = { state: "APPROVED", surface: "USER_PROFILE_PHOTO", sourceFile: file(), previewUrl: "blob:new", ownsPreviewUrl: false, admissionReference: "imauth_new", expiresAt: pass.expiresAt };
  const gallery = media.replaceProfileGalleryMedia([one, two], 0, replacement);
  assert.deepEqual(media.toProfileMediaRequest({ profilePhotos: gallery }, Date.parse("2029-01-01T00:00:00.000Z")).profilePhotos, [{ kind: "ADMISSION", admissionReference: "imauth_new" }, { kind: "UNCHANGED", reference: "https://stored/two" }]);
  assert.throws(() => media.removeProfileGalleryMedia([one, two], 0), media.ProfileMediaClaimError);
  assert.deepEqual(media.toProfileMediaRequest({}), {});
});

test("gallery operation identity ignores stale completion after removal, replacement, retry, or reorder", () => {
  const pendingA = { clientId: "a", operationId: 1, state: "UPLOADING", surface: "USER_PROFILE_PHOTO", sourceFile: file("a.jpg"), previewUrl: "blob:a", ownsPreviewUrl: false };
  const pendingB = { clientId: "b", operationId: 1, state: "UPLOADING", surface: "USER_PROFILE_PHOTO", sourceFile: file("b.jpg"), previewUrl: "blob:b", ownsPreviewUrl: false };
  const passA = media.resolveProfileMediaAdmission(pendingA, pass);
  const blockA = media.resolveProfileMediaAdmission(pendingA, block);

  assert.deepEqual(media.updateProfileMediaOperation([pendingB], pendingA, passA), [pendingB]);
  assert.deepEqual(media.updateProfileMediaOperation([pendingB, pendingA], pendingA, passA), [pendingB, passA]);
  const retryA = media.retryProfileMediaSelection(media.failProfileMediaSelection(pendingA, "network"));
  assert.equal(retryA.operationId, 2);
  assert.deepEqual(media.updateProfileMediaOperation([retryA], pendingA, passA), [retryA]);
  assert.deepEqual(media.updateProfileMediaOperation([retryA], pendingA, blockA), [retryA]);
});

test("replacement preserves gallery identity while invalidating its older operation", () => {
  const previous = { clientId: "slot-a", operationId: 3, state: "APPROVED", surface: "USER_PROFILE_PHOTO", sourceFile: file("old.jpg"), previewUrl: "blob:old", ownsPreviewUrl: false, admissionReference: "imauth_old", expiresAt: pass.expiresAt };
  const replacement = media.replaceProfileMediaSelection(previous, file("new.jpg"));
  assert.equal(replacement.clientId, "slot-a");
  assert.equal(replacement.operationId, 4);
  assert.deepEqual(media.updateProfileMediaOperation([replacement], previous, previous), [replacement]);
});

test("persisted draft media replaces consumed admissions with authoritative UNCHANGED references", () => {
  const restored = media.restorePersistedProfileMedia({
    avatar: "https://stored/avatar-authoritative",
    cover: "https://stored/cover-authoritative",
    profilePhotos: ["https://stored/one", "https://stored/two"],
  });
  assert.deepEqual(media.toProfileMediaRequest(restored), {
    avatar: { kind: "UNCHANGED", reference: "https://stored/avatar-authoritative" },
    cover: { kind: "UNCHANGED", reference: "https://stored/cover-authoritative" },
    profilePhotos: [
      { kind: "UNCHANGED", reference: "https://stored/one" },
      { kind: "UNCHANGED", reference: "https://stored/two" },
    ],
  });
});

test("profile editing omits unchanged media and sends a complete ordered gallery when it changes", () => {
  const restored = media.restorePersistedProfileMedia({
    avatar: "https://stored/avatar",
    cover: "https://stored/cover",
    profilePhotos: ["https://stored/one", "https://stored/two"],
  });
  assert.deepEqual(media.toProfileMediaRequest({}), {});
  const approvedAvatar = {
    state: "APPROVED", surface: "USER_PROFILE_AVATAR", sourceFile: file("avatar.jpg"), previewUrl: "blob:avatar", ownsPreviewUrl: false,
    admissionReference: "imauth_avatar", expiresAt: pass.expiresAt,
  };
  const approvedPhoto = {
    state: "APPROVED", surface: "USER_PROFILE_PHOTO", sourceFile: file("photo.jpg"), previewUrl: "blob:photo", ownsPreviewUrl: false,
    admissionReference: "imauth_photo", expiresAt: pass.expiresAt,
  };
  assert.deepEqual(media.toProfileMediaRequest({ avatar: approvedAvatar }, Date.parse("2029-01-01T00:00:00.000Z")), {
    avatar: { kind: "ADMISSION", admissionReference: "imauth_avatar" },
  });
  assert.deepEqual(media.toProfileMediaRequest({ profilePhotos: [approvedPhoto, restored.profilePhotos[1]] }, Date.parse("2029-01-01T00:00:00.000Z")).profilePhotos, [
    { kind: "ADMISSION", admissionReference: "imauth_photo" },
    { kind: "UNCHANGED", reference: "https://stored/two" },
  ]);
});

test("owned blob previews are revoked while persisted references are never revoked", () => {
  const original = URL.revokeObjectURL;
  const revoked = [];
  URL.revokeObjectURL = (url) => { revoked.push(url); };
  try {
    media.disposeProfileMediaPreview({ state: "APPROVED", surface: "USER_PROFILE_AVATAR", sourceFile: file(), previewUrl: "blob:owned", ownsPreviewUrl: true, admissionReference: "imauth_1", expiresAt: pass.expiresAt });
    media.disposeProfileMediaPreview({ state: "EXISTING", surface: "USER_PROFILE_AVATAR", reference: "https://stored/avatar" });
  } finally {
    URL.revokeObjectURL = original;
  }
  assert.deepEqual(revoked, ["blob:owned"]);
});

test("admission API posts authenticated-client multipart data and preserves decision shapes", async () => {
  let captured;
  globalThis.__api = { post: async (path, form, config) => { captured = { path, form, config }; return { data: pass }; } };
  const admissionApi = await moduleFromSource("../src/api/imageModeration.ts", [
    ['import axios from "axios";', 'const axios = { isAxiosError: (value) => Boolean(value?.isAxiosError) };'],
    ['import api from "./axios";', 'const api = globalThis.__api;'],
  ]);
  const result = await admissionApi.submitUserProfileImageAdmission(file(), "USER_PROFILE_AVATAR");
  assert.deepEqual(result, pass);
  assert.equal(captured.path, "/v1/image-moderation/admissions");
  assert.equal(captured.form.get("surface"), "USER_PROFILE_AVATAR");
  assert.equal(captured.form.get("file").name, "profile.jpg");
});
