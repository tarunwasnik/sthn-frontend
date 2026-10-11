import type { FaceVerificationInferenceProvider, FaceVerificationInferenceResult } from "../../src/components/faceVerification/faceVerificationInference.provider";

const landmarks = Array.from({ length: 3 }, (_, index) => ({ x: index === 0 ? 0.35 : index === 1 ? 0.65 : 0.5, y: index === 2 ? 0.7 : 0.35, z: 0 }));
const resultFor = (normalX = 0, normalY = 0, blink = 0): FaceVerificationInferenceResult => ({
  faceLandmarks: [landmarks], facialTransformationMatrixes: [{ rows: 4, columns: 4, data: [1, 0, 0, 0, 0, 1, 0, 0, normalX, normalY, 1, 0, 0, 0, 0, 1] }],
  faceBlendshapes: [{ categories: [{ categoryName: "eyeBlinkLeft", score: blink }, { categoryName: "eyeBlinkRight", score: blink }] }],
}) as FaceVerificationInferenceResult;

/** E2E-only: supplies valid neutral measurements; the overlay still owns all qualification and capture transitions. */
export const initializeFaceVerificationInference = async (): Promise<FaceVerificationInferenceProvider> => {
  let startedAt: number | null = null;
  return {
  detectForVideo: (_video, timestampMs): FaceVerificationInferenceResult => {
    startedAt ??= timestampMs; const elapsed = timestampMs - startedAt;
    if (elapsed < 600) return resultFor();
    const phase = Math.floor((elapsed - 600) / 1_500);
    const within = (elapsed - 600) % 1_500;
    if (phase === 0) return resultFor();
    if (phase === 1) return resultFor(0.5);
    if (phase === 2) return resultFor(-0.5);
    if (phase === 3) return resultFor(0, 0.5);
    return resultFor(0, 0, within < 350 ? 0 : within < 700 ? 0.8 : 0);
  },
  dispose: () => undefined,
  };
};
