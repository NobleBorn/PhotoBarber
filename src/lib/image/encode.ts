import { encodeCanvas } from "./format.ts";
import { inspectImage } from "./detect-format.ts";
/** Shared verified encoder; optional codecs must pass signature validation too. */
export async function encodeImageCanvas(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  const blob = await encodeCanvas(canvas, mimeType, quality);
  if (mimeType === "image/avif") {
    let valid = false;
    try { valid = inspectImage(await blob.arrayBuffer()).format === "avif"; } catch { /* Reject mislabeled codec output. */ }
    if (!valid) throw new Error("The browser did not return a valid AVIF image. Choose JPG, PNG, or WebP instead.");
  }
  return blob;
}
