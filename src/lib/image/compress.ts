import UPNG from "upng-js";
import { validateImageMimeType } from "./format.ts";
import { chooseCompression, validateCompressionOptions, type CompressionChoice, type CompressionOptions, type CompressionProgress } from "./compression-search.ts";

export type CompressionResult = CompressionChoice & { width: number; height: number; note?: string };
export function encodePng(rgba: ArrayBuffer, width: number, height: number, quality: number): Blob {
  let pixels = rgba;
  if (quality < 100) {
    const colors = Math.max(2, Math.round(2 + (quality - 1) / 98 * 254));
    pixels = UPNG.quantize([rgba], colors).bufs[0];
    const original = new Uint8Array(rgba), reduced = new Uint8Array(pixels);
    // Palette quantization may adjust alpha; restore every original alpha byte exactly.
    for (let i = 3; i < reduced.length; i += 4) reduced[i] = original[i];
  }
  const buffer = UPNG.encode([pixels], width, height, 0);
  const header = new DataView(buffer);
  if (header.getUint32(0) !== 0x89504e47 || header.getUint32(16) !== width || header.getUint32(20) !== height) throw new Error("The PNG optimizer returned an invalid image.");
  return new Blob([buffer], { type: "image/png" });
}
function hasChunk(buffer: ArrayBuffer, chunk: string, png: boolean): boolean {
  const view = new DataView(buffer), bytes = new Uint8Array(buffer);
  for (let offset = png ? 8 : 12; offset + 8 <= bytes.length;) {
    // PNG puts length before type; RIFF puts its FourCC before length.
    const nameOffset = png ? offset + 4 : offset;
    const name = String.fromCharCode(...bytes.subarray(nameOffset, nameOffset + 4));
    if (name === chunk) return true;
    const size = png ? view.getUint32(offset) : view.getUint32(offset + 4, true);
    if (!Number.isFinite(size) || size > bytes.length - offset - 8) return false;
    offset += png ? 12 + size : 8 + size + size % 2;
  }
  return false;
}
export async function validateCompressionFile(file: File): Promise<void> {
  validateImageMimeType(file.type);
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
  const jpeg = bytes[0] === 255 && bytes[1] === 216;
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0,4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8,12)) === "WEBP";
  if (!(file.type === "image/png" ? png : file.type === "image/jpeg" ? jpeg : webp)) throw new Error("The image contents do not match its declared format. Choose an unmodified PNG, JPEG, or WebP file.");
}
export async function compressImage(file: File, options: CompressionOptions, progress: (value: CompressionProgress) => void = () => {}): Promise<CompressionResult> {
  await validateCompressionFile(file); validateCompressionOptions(options);
  if (file.type === "image/png") {
    const buffer = await file.arrayBuffer(), image = UPNG.decode(buffer);
    const retained = image.depth === 16 || hasChunk(buffer, "acTL", true) || hasChunk(buffer, "eXIf", true) || ["iCCP", "cHRM", "gAMA"].some((chunk) => hasChunk(buffer, chunk, true));
    if (retained) return { blob: file, width: image.width, height: image.height, attempts: 0, usedOriginal: true, targetMet: options.mode === "target" ? file.size <= options.targetBytes! : undefined, note: "Original kept to preserve PNG animation, 16-bit color, color profiles, or orientation metadata. This optimizer supports static PNG images up to 8 bits per channel." };
    const rgba = UPNG.toRGBA8(image)[0];
    if (!rgba || rgba.byteLength !== image.width * image.height * 4) throw new Error("Could not decode this PNG image.");
    return { ...await chooseCompression(file, options, async (quality) => encodePng(rgba, image.width, image.height, quality), progress), width: image.width, height: image.height };
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  let canvas: OffscreenCanvas | undefined;
  try {
    const width = bitmap.width, height = bitmap.height;
    if (file.type === "image/webp" && hasChunk(await file.arrayBuffer(), "ANIM", false)) return { blob: file, width, height, usedOriginal: true, attempts: 0, targetMet: options.mode === "target" ? file.size <= options.targetBytes! : undefined, note: "Original kept to preserve animated WebP frames. Static images can be compressed." };
    if (typeof OffscreenCanvas === "undefined") throw new Error("Your browser does not support background image encoding. Try an up-to-date browser.");
    canvas = new OffscreenCanvas(width, height);
    if (canvas.width !== width || canvas.height !== height) throw new Error("Image dimensions exceed your browser’s Canvas support.");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Cannot allocate image canvas. Close unused tabs and try again.");
    context.drawImage(bitmap, 0, 0);
    return { ...await chooseCompression(file, options, (quality) => canvas!.convertToBlob({ type: file.type, quality: quality / 100 }), progress), width, height };
  } finally { bitmap.close(); if (canvas) { canvas.width = 0; canvas.height = 0; } }
}
