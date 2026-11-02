import type { Point } from "./gestureEngine";

export interface HandResult {
  landmarks: Point[][];
  handedness: { score: number; categoryName: string }[][];
}
export interface HandTracker {
  detectForVideo(video: HTMLVideoElement, timestamp: number): HandResult;
  close(): void;
}
// Narrow typed boundary for the pinned ESM distribution; no package is loaded
// by the public site. Only model/runtime downloads leave the browser.
interface VisionModule {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> };
  HandLandmarker: {
    createFromOptions(
      files: unknown,
      options: {
        baseOptions: { modelAssetPath: string; delegate: "CPU" };
        runningMode: "VIDEO";
        numHands: number;
        minHandDetectionConfidence: number;
        minHandPresenceConfidence: number;
        minTrackingConfidence: number;
      }
    ): Promise<HandTracker>;
  };
}
export async function createHandTracker(
  options: { numHands?: 1 | 2 } = {}
): Promise<HandTracker> {
  const root = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21";
  const url = `${root}/vision_bundle.mjs`;
  const vision: VisionModule = await import(/* @vite-ignore */ url);
  const files = await vision.FilesetResolver.forVisionTasks(`${root}/wasm`);
  return vision.HandLandmarker.createFromOptions(files, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "VIDEO",
    numHands: options.numHands ?? 1,
    minHandDetectionConfidence: 0.75,
    minHandPresenceConfidence: 0.75,
    minTrackingConfidence: 0.75,
  });
}
