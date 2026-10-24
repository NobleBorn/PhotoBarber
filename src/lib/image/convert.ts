import { encodeImageCanvas } from "./encode.ts";
export const conversionFormats = [
  { id: "jpg", label: "JPG", mime: "image/jpeg" },
  { id: "png", label: "PNG", mime: "image/png" },
  { id: "webp", label: "WebP", mime: "image/webp" },
  { id: "avif", label: "AVIF", mime: "image/avif" },
] as const;
export type ConversionFormat = (typeof conversionFormats)[number]["id"];
export type ConversionOptions = { format: ConversionFormat; quality: number; background: string };
export type ConversionResult = { blob: Blob; filename: string; width: number; height: number; mimeType: string };
export function convertedFilename(original: string, format: ConversionFormat): string {
  if (!conversionFormats.some((item) => item.id === format)) throw new Error("Choose a supported output format.");
  const index = original.lastIndexOf(".");
  const base = index > 0 ? original.slice(0, index) : original;
  return `${base || "image"}.${format}`;
}
export async function availableConversionFormats(): Promise<ConversionFormat[]> {
  const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1;
  try {
    const supported: ConversionFormat[] = [];
    for (const format of conversionFormats) {
      try { const blob = await encodeImageCanvas(canvas, format.mime, format.id === "png" ? undefined : 0.8);
        if (format.id === "avif") {
          const decoded = await createImageBitmap(blob);
          try { if (decoded.width !== 1 || decoded.height !== 1) continue; } finally { decoded.close(); }
        }
        if (blob.type === format.mime) supported.push(format.id); }
      catch { /* A failed codec probe must not advertise that format. */ }
    }
    return supported;
  } finally { canvas.width = 0; canvas.height = 0; }
}
export async function convertImage(source: ImageBitmap, filename: string, options: ConversionOptions): Promise<ConversionResult> {
  const format = conversionFormats.find((item) => item.id === options.format);
  if (!format) throw new Error("Choose a supported output format.");
  if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) throw new Error("Quality must be between 1% and 100%.");
  if (!/^#[0-9a-f]{6}$/i.test(options.background)) throw new Error("Choose a valid JPEG background color.");
  if (![source.width, source.height].every((value) => Number.isSafeInteger(value) && value > 0)) throw new Error("Invalid image dimensions.");
  const canvas = document.createElement("canvas");
  try {
    canvas.width = source.width; canvas.height = source.height;
    if (canvas.width !== source.width || canvas.height !== source.height) throw new Error("These dimensions exceed your browser’s Canvas support.");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Cannot allocate an image canvas. Close unused tabs and try again.");
    if (format.id === "jpg") { context.fillStyle = options.background; context.fillRect(0, 0, source.width, source.height); }
    context.drawImage(source, 0, 0);
    const blob = await encodeImageCanvas(canvas, format.mime, format.id === "png" ? undefined : options.quality / 100);
    return { blob, filename: convertedFilename(filename, format.id), width: source.width, height: source.height, mimeType: blob.type };
  } finally { canvas.width = 0; canvas.height = 0; }
}
