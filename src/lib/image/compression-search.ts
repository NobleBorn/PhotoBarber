export type CompressionMode = "automatic" | "manual" | "target";
export type CompressionOptions = { mode: CompressionMode; quality: number; targetBytes?: number };
export type CompressionProgress = { attempt: number; quality: number };
export type CompressionChoice = { blob: Blob; usedOriginal: boolean; quality?: number; attempts: number; targetMet?: boolean };
export function validateCompressionOptions(options: CompressionOptions): void {
  if (!["automatic", "manual", "target"].includes(options.mode)) throw new Error("Choose a supported compression mode.");
  if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) throw new Error("Quality must be between 1% and 100%.");
  if (options.mode === "target" && (!Number.isSafeInteger(options.targetBytes) || options.targetBytes! < 1)) throw new Error("Enter a positive target file size.");
}
export async function chooseCompression(original: Blob, options: CompressionOptions, encode: (quality: number) => Promise<Blob>, onProgress: (progress: CompressionProgress) => void = () => {}): Promise<CompressionChoice> {
  validateCompressionOptions(options);
  let smallest = original, chosenQuality: number | undefined, attempts = 0;
  let under: { blob: Blob; quality: number } | undefined;
  async function tryQuality(quality: number) {
    onProgress({ attempt: ++attempts, quality });
    const blob = await encode(quality);
    if (blob.type !== original.type) throw new Error("Your browser returned a different image format. No converted image was saved.");
    if (blob.size < smallest.size) { smallest = blob; chosenQuality = quality; }
    if (options.mode === "target" && blob.size <= options.targetBytes! && (!under || quality > under.quality)) under = { blob, quality };
    return blob;
  }
  if (options.mode === "target") {
    if (original.size <= options.targetBytes!) return { blob: original, usedOriginal: true, attempts: 0, targetMet: true };
    if ((await tryQuality(100)).size > options.targetBytes!) {
      let low = 1, high = 99;
      // Always sample the lowest setting, including encoders with non-monotonic sizes.
      await tryQuality(1);
      low = 2;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if ((await tryQuality(middle)).size <= options.targetBytes!) low = middle + 1;
        else high = middle - 1;
      }
    }
    if (under && under.blob.size < original.size) return { blob: under.blob, quality: under.quality, attempts, targetMet: true, usedOriginal: false };
  } else {
    const quality = options.mode === "manual" ? options.quality : original.type === "image/png" ? 100 : original.type === "image/webp" ? 80 : 82;
    await tryQuality(quality);
  }
  return { blob: smallest, quality: chosenQuality, attempts, usedOriginal: smallest === original, targetMet: options.mode === "target" ? smallest.size <= options.targetBytes! : undefined };
}
export function targetSizeInBytes(raw: string, unit: "KB" | "MB"): number | null {
  const value = raw.trim() === "" ? NaN : Number(raw), bytes = Math.floor(value * (unit === "KB" ? 1024 : 1024 * 1024));
  return Number.isFinite(value) && value > 0 && Number.isSafeInteger(bytes) && bytes > 0 ? bytes : null;
}
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
