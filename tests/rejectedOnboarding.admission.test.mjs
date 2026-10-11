import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const moduleFromSource = async (path, replacements = []) => {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  source = source.replace('import axios from "axios";', 'const axios = globalThis.__faceAxios ?? { isAxiosError: () => false };');
  for (const [from, to] of replacements) source = source.replace(from, to);
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
};

test("candidate-aware session start sends the authoritative rejected-avatar claim", async () => {
  let request;
  globalThis.__faceApi = {
    post: async (path, payload) => {
      request = { path, payload };
      return { data: { session: { sessionReference: "fvs_1" } } };
    },
  };

  const faceVerification = await moduleFromSource("../src/api/faceVerification.ts", [
    ['import api from "./axios";', "const api = globalThis.__faceApi;"],
  ]);

  await faceVerification.startFaceVerificationSession({
    candidateAvatar: { kind: "ADMISSION", admissionReference: "imauth_avatar_1" },
  });

  assert.deepEqual(request, {
    path: "/v1/profile/face-verification/session",
    payload: { candidateAvatar: { kind: "ADMISSION", admissionReference: "imauth_avatar_1" } },
  });
});

test("rejected onboarding delegates media authority to claims and candidate-aware face verification", async () => {
  const source = await readFile(new URL("../src/pages/Onboarding.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /uploadToCloudinary|UPLOAD_PRESET|cloudinary/i);
  assert.match(source, /restorePersistedProfileMedia\(data\)/);
  assert.match(source, /toProfileMediaRequest\(\{ avatar: incompleteAvatar, cover: incompleteCover, profilePhotos: incompleteGallery \}\)/);
  assert.match(source, /kind: "UNCHANGED" as const, reference: incompleteAvatar\.reference/);
  assert.match(source, /kind: "ADMISSION" as const, admissionReference: incompleteAvatar\.admissionReference/);
  assert.match(source, /candidateAvatar=\{rejectedFaceCandidate\}/);
  assert.match(source, /setCompletedFaceVerification\(null\)/);
});
