export const allowedPhotoTypes = ["image/jpeg", "image/png"] as const;
export const maxOriginalPhotoBytes = 5 * 1024 * 1024;
export const maxStoredPhotoBytes = 1.5 * 1024 * 1024;
export const photoMaxDimension = 900;

export function detectPhotoType(bytes: Uint8Array): (typeof allowedPhotoTypes)[number] | null {
  const isPng =
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (isPng) return "image/png";

  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return isJpeg ? "image/jpeg" : null;
}
