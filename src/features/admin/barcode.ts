// SPDX-License-Identifier: EUPL-1.2

// Not in TypeScript's DOM types yet; Chrome on Android and recent Safari ship it.
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type BarcodeDetectorClass = new (options: { formats: string[] }) => BarcodeDetectorLike;

export const barcodeDetector = () =>
  (globalThis as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;

export const canScanQr = () => Boolean(barcodeDetector()) && 'mediaDevices' in navigator;
