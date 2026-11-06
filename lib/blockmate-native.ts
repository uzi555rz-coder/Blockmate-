import { requireOptionalNativeModule } from "expo-modules-core";

export type BlockMateNativeStatus = {
  serviceEnabled: boolean;
  minecraftForeground: boolean;
  packageName?: string;
  displayWidth: number;
  displayHeight: number;
  referenceWidth: number;
  referenceHeight: number;
  armed: boolean;
  lastStatus: string;
};

export type BlockMateScreenCaptureStatus = {
  capturing: boolean;
  lastStatus: string;
  lastCapturePath?: string | null;
  width: number;
  height: number;
};

type BlockMateNativeModule = {
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<void>;
  getStatus(): Promise<BlockMateNativeStatus>;
  arm(): Promise<BlockMateNativeStatus>;
  stop(): Promise<BlockMateNativeStatus>;
  tapReference(x: number, y: number): Promise<BlockMateNativeStatus>;
  swipeReference(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number,
  ): Promise<BlockMateNativeStatus>;
  requestScreenCapture(): Promise<BlockMateScreenCaptureStatus>;
  getScreenCaptureStatus(): Promise<BlockMateScreenCaptureStatus>;
  stopScreenCapture(): Promise<BlockMateScreenCaptureStatus>;
};

const nativeModule = requireOptionalNativeModule<BlockMateNativeModule>("BlockMateNative");

export const BLOCKMATE_REFERENCE_DISPLAY = {
  width: 2400,
  height: 1080,
} as const;

export function isNativeBridgeAvailable() {
  return nativeModule !== null;
}

export async function getAccessibilityStatus() {
  if (!nativeModule) return false;
  return nativeModule.isAccessibilityEnabled();
}

export async function openAccessibilitySettings() {
  if (!nativeModule) {
    throw new Error("BlockMate native bridge is only available in an Android development or release build.");
  }
  return nativeModule.openAccessibilitySettings();
}

export async function getBridgeStatus(): Promise<BlockMateNativeStatus> {
  if (!nativeModule) {
    return {
      serviceEnabled: false,
      minecraftForeground: false,
      displayWidth: 0,
      displayHeight: 0,
      referenceWidth: BLOCKMATE_REFERENCE_DISPLAY.width,
      referenceHeight: BLOCKMATE_REFERENCE_DISPLAY.height,
      armed: false,
      lastStatus: "native_bridge_unavailable",
    };
  }
  return nativeModule.getStatus();
}

export async function armBridge() {
  if (!nativeModule) throw new Error("Native bridge unavailable");
  return nativeModule.arm();
}

export async function stopBridge() {
  if (!nativeModule) return getBridgeStatus();
  return nativeModule.stop();
}

export async function tapReference(x: number, y: number) {
  if (!nativeModule) throw new Error("Native bridge unavailable");
  return nativeModule.tapReference(x, y);
}

export async function swipeReference(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  durationMs = 500,
) {
  if (!nativeModule) throw new Error("Native bridge unavailable");
  return nativeModule.swipeReference(startX, startY, endX, endY, durationMs);
}

export async function requestScreenCapture() {
  if (!nativeModule) throw new Error("Screen capture is available only in the Android APK.");
  return nativeModule.requestScreenCapture();
}

export async function getScreenCaptureStatus(): Promise<BlockMateScreenCaptureStatus> {
  if (!nativeModule) return { capturing: false, lastStatus: "native_bridge_unavailable", width: 0, height: 0 };
  return nativeModule.getScreenCaptureStatus();
}

export async function stopScreenCapture() {
  if (!nativeModule) return getScreenCaptureStatus();
  return nativeModule.stopScreenCapture();
}
