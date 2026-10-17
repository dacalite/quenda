// SPDX-License-Identifier: EUPL-1.2

/**
 * Scales a photo down and re-encodes it as JPEG, so a phone picture of several megabytes becomes a
 * light image that loads fast and, in the demo, fits in the browser's storage.
 */
export async function resizeImage(file: Blob, maxWidth = 960): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The image could not be encoded'));
      },
      'image/jpeg',
      0.78,
    );
  });
}
