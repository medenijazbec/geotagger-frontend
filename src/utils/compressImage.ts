// src/utils/compressImage.ts
import imageCompression, { Options } from "browser-image-compression";

/**
 * Compress an image down to ≈ maxSize MB (or smaller) while
 * keeping a sensible resolution ceiling.
 */
export async function compressImage(file: File, maxSizeMB = 1): Promise<File> {
  const opts: Options = {
    maxSizeMB,
    maxWidthOrHeight: 1920, //keep ultra-large photos in check
    useWebWorker: true,
    alwaysKeepResolution: false,
  };

  // ↓ Promise<Blob | File>
  const compressed = await imageCompression(file, opts);

  // Already a File?  Great — return it.
  if (compressed instanceof File) return compressed;

  // Otherwise it's a Blob – re-wrap so FormData.append() behaves.
  const blob = compressed as Blob;
  return new File([blob], file.name, { type: blob.type });
}
