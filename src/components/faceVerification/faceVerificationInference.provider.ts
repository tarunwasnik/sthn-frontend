import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export type FaceVerificationInferenceResult = FaceLandmarkerResult;

export interface FaceVerificationInferenceProvider {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): FaceVerificationInferenceResult;
  dispose(): void;
}

const modelUrl = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";
const wasmUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

export const initializeFaceVerificationInference = async (): Promise<FaceVerificationInferenceProvider> => {
  const files = await FilesetResolver.forVisionTasks(wasmUrl);
  const landmarker = await FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: modelUrl }, runningMode: "VIDEO", numFaces: 2,
    outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true,
  });
  return { detectForVideo: (video, timestampMs) => landmarker.detectForVideo(video, timestampMs), dispose: () => landmarker.close() };
};
