import { inspectImage, type DetectedImage } from "./detect-format.ts";
import type { DecodeRequest, DecodeResponse } from "./decode-protocol.ts";
export type DecodedImage = DetectedImage & { bitmap: ImageBitmap };
function checkAbort(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException("Image decoding cancelled.", "AbortError"); }
function decodeWithWorker(blob: Blob, format: DecodeRequest["format"], signal?: AbortSignal): Promise<Extract<DecodeResponse, { type: "result" }>> {
  return new Promise((resolve, reject) => {
    checkAbort(signal);
    if (typeof Worker === "undefined") { reject(new Error("This format needs Web Worker decoding. Try an up-to-date browser.")); return; }
    const worker = new Worker(new URL("../../workers/decode.worker.ts", import.meta.url), { type: "module" });
    let settled = false;
    const cleanup = () => { settled = true; signal?.removeEventListener("abort", abort); worker.terminate(); };
    const abort = () => { if (settled) return; cleanup(); reject(new DOMException("Image decoding cancelled.", "AbortError")); };
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<DecodeResponse>) => { if (settled) { if (event.data.type === "result") event.data.bitmap.close(); return; } cleanup(); if (event.data.type === "result") resolve(event.data); else reject(new Error(event.data.message)); };
    worker.onerror = () => { cleanup(); reject(new Error("The image decoder stopped. The codec may be unsupported, blocked, or out of memory. Try another image or browser.")); };
    worker.onmessageerror = () => { cleanup(); reject(new Error("Could not read the decoded image.")); };
    try { worker.postMessage({ blob, format } satisfies DecodeRequest); } catch { cleanup(); reject(new Error("Could not allocate decoder memory for this image.")); }
  });
}
/** Detects contents and returns an oriented still bitmap. The caller must close bitmap when finished. */
export async function decodeImage(file: Blob, signal?: AbortSignal): Promise<DecodedImage> {
  checkAbort(signal);
  const info = inspectImage(await file.arrayBuffer()); checkAbort(signal);
  const blob = file.slice(0, file.size, info.mimeType);
  let bitmap: ImageBitmap | undefined;
  try {
    if (info.format === "tiff") {
      const decoded = await decodeWithWorker(blob, "tiff", signal); bitmap = decoded.bitmap;
      info.frameCount = decoded.frameCount; info.multiFrame = (decoded.frameCount ?? 1) > 1; info.warnings.push(...decoded.warnings);
    } else {
      try { bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" }); }
      catch (error) {
        checkAbort(signal);
        if (error instanceof RangeError) throw error;
        if (error instanceof Error && /memory|allocation/i.test(error.message)) throw new Error("The browser could not allocate memory for this image. Close unused tabs and try again.");
        if (info.format !== "heic" && info.format !== "heif") throw new Error(`This browser cannot decode this ${info.label} image. The file may be damaged or its codec unavailable.`);
        const decoded = await decodeWithWorker(blob, info.format, signal); bitmap = decoded.bitmap; info.warnings.push(...decoded.warnings);
      }
    }
    checkAbort(signal);
    if (!bitmap.width || !bitmap.height) throw new Error("The decoded image has invalid dimensions.");
    if (info.multiFrame && ["heic", "heif", "avif"].includes(info.format)) {
      info.warnings = info.warnings.filter((warning) => !warning.includes("containers may") && !warning.includes("container can"));
      info.warnings.unshift("Multiple image items or an image sequence were detected. These can include auxiliary images; only the first decoded image will be converted.");
    } else if (info.multiFrame) info.warnings.unshift(`${info.frameCount ? `${info.frameCount} frames or pages` : "An image sequence"} detected. Only the first decoded frame/page will be converted.`);
    return { ...info, bitmap };
  } catch (error) { bitmap?.close(); throw error; }
}
export async function decodedPreview(bitmap: ImageBitmap): Promise<Blob> {
  const canvas = document.createElement("canvas");
  try {
    const scale = Math.min(1, 1200 / bitmap.width, 1200 / bitmap.height);
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("Could not allocate preview memory.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not draw the decoded preview.")), "image/png"));
  } finally { canvas.width = 0; canvas.height = 0; }
}
