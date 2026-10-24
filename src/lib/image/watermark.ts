import { encodeCanvas, validateImageMimeType } from "./format.ts";

export const watermarkFonts = ["Arial", "Georgia", "Verdana", "monospace"] as const;
export type WatermarkOptions = {
  kind: "text" | "image"; text: string; fontFamily: string; fontSize: number; color: string;
  bold: boolean; italic: boolean; opacity: number; angle: number; x: number; y: number;
  logoWidth: number; tiled: boolean; enabled: boolean;
};
export type MarkSize = { width: number; height: number };
export function defaultWatermark(image: MarkSize): WatermarkOptions {
  return { kind: "text", text: "© Your name", fontFamily: "Arial", fontSize: Math.max(1, Math.min(image.width, image.height) * 0.06), color: "#ffffff", bold: false, italic: false, opacity: 0.65, angle: 0, x: image.width / 2, y: image.height / 2, logoWidth: Math.max(1, image.width / 4), tiled: false, enabled: true };
}
export async function decodeWatermarkImage(file: File): Promise<ImageBitmap> {
  validateImageMimeType(file.type);
  return createImageBitmap(file, { imageOrientation: "from-image" });
}
export function watermarkFont(options: WatermarkOptions): string {
  return `${options.italic ? "italic " : ""}${options.bold ? "bold " : ""}${options.fontSize}px ${options.fontFamily}`;
}
export function validateWatermark(options: WatermarkOptions, logo?: ImageBitmap): void {
  if (![options.x, options.y, options.fontSize, options.logoWidth, options.opacity, options.angle].every(Number.isFinite) || options.fontSize < 1 || options.logoWidth < 1 || options.opacity < 0 || options.opacity > 1 || options.angle < -180 || options.angle > 180) throw new Error("Check the watermark size, position, opacity, and rotation.");
  if (!/^#[0-9a-f]{6}$/i.test(options.color) || !watermarkFonts.some((font) => font === options.fontFamily)) throw new Error("Choose a supported font and color.");
  if (options.enabled && options.kind === "text" && !options.text.trim()) throw new Error("Enter watermark text or remove the watermark.");
  if (options.enabled && options.kind === "image" && !logo) throw new Error("Upload a logo first.");
}
export function measureWatermark(context: CanvasRenderingContext2D, options: WatermarkOptions, logo?: ImageBitmap): MarkSize {
  if (options.kind === "image") return { width: options.logoWidth, height: logo ? options.logoWidth * logo.height / logo.width : options.logoWidth };
  context.save();
  context.font = watermarkFont(options);
  const lines = options.text.split("\n");
  const width = Math.max(1, ...lines.map((line) => { const metrics = context.measureText(line); return Math.max(metrics.width, (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || 0)); }));
  context.restore();
  return { width: width + options.fontSize * 0.3, height: lines.length * options.fontSize * 1.3 };
}
export function rotatedMarkSize(size: MarkSize, angle: number): MarkSize {
  const rad = angle * Math.PI / 180;
  return { width: Math.abs(size.width * Math.cos(rad)) + Math.abs(size.height * Math.sin(rad)), height: Math.abs(size.width * Math.sin(rad)) + Math.abs(size.height * Math.cos(rad)) };
}
export function positionWatermark(image: MarkSize, mark: MarkSize, angle: number, column: number, row: number) {
  const bounds = rotatedMarkSize(mark, angle);
  const margin = Math.min(image.width, image.height) * 0.03;
  const axis = (length: number, extent: number, index: number) => index === 1 || extent + margin * 2 >= length ? length / 2 : index === 0 ? extent / 2 + margin : length - extent / 2 - margin;
  return { x: axis(image.width, bounds.width, column), y: axis(image.height, bounds.height, row) };
}
function drawMark(context: CanvasRenderingContext2D, options: WatermarkOptions, size: MarkSize, logo?: ImageBitmap) {
  context.save();
  try {
    context.translate(options.x, options.y);
    context.rotate(options.angle * Math.PI / 180);
    context.globalAlpha = options.opacity;
    if (options.kind === "image" && logo) context.drawImage(logo, -size.width / 2, -size.height / 2, size.width, size.height);
    else {
      context.font = watermarkFont(options); context.fillStyle = options.color; context.textAlign = "center"; context.textBaseline = "alphabetic";
      options.text.split("\n").forEach((line, index) => context.fillText(line, 0, -size.height / 2 + options.fontSize + index * options.fontSize * 1.3));
    }
  } finally { context.restore(); }
}
export function renderWatermark(canvas: HTMLCanvasElement, source: ImageBitmap, options: WatermarkOptions, logo?: ImageBitmap, scale = 1): MarkSize {
  validateWatermark(options, logo);
  if (!Number.isFinite(scale) || scale <= 0 || scale > 1) throw new Error("Invalid preview scale.");
  const width = Math.max(1, Math.round(source.width * scale)), height = Math.max(1, Math.round(source.height * scale));
  canvas.width = width; canvas.height = height;
  if (canvas.width !== width || canvas.height !== height) throw new Error("This image exceeds your browser’s Canvas support.");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Cannot initialize image canvas.");
  const size = measureWatermark(context, options, logo);
  context.save();
  try {
    context.scale(width / source.width, height / source.height);
    context.drawImage(source, 0, 0);
    if (!options.enabled) return size;
    if (!options.tiled) drawMark(context, options, size, logo);
    else {
      const bounds = rotatedMarkSize(size, options.angle);
      const gap = Math.max(1, Math.min(source.width, source.height) * 0.06);
      const tileWidth = Math.max(1, Math.ceil(bounds.width + gap)), tileHeight = Math.max(1, Math.ceil(bounds.height + gap));
      // Rasterize the repeat cell at preview resolution; the pattern transform maps it back to image coordinates.
      const tile = document.createElement("canvas");
      try {
        tile.width = Math.max(1, Math.ceil(tileWidth * scale)); tile.height = Math.max(1, Math.ceil(tileHeight * scale));
        const tileContext = tile.getContext("2d");
        if (!tileContext) throw new Error("Cannot draw tiled watermarks.");
        tileContext.scale(tile.width / tileWidth, tile.height / tileHeight);
        drawMark(tileContext, { ...options, x: tileWidth / 2, y: tileHeight / 2 }, size, logo);
        const pattern = context.createPattern(tile, "repeat");
        if (!pattern) throw new Error("Cannot draw tiled watermarks.");
        pattern.setTransform(new DOMMatrix().translate(options.x - tileWidth / 2, options.y - tileHeight / 2).scale(tileWidth / tile.width, tileHeight / tile.height));
        context.fillStyle = pattern; context.fillRect(0, 0, source.width, source.height);
      } finally { tile.width = 0; tile.height = 0; }
    }
  } finally { context.restore(); }
  return size;
}
export async function watermarkImage(source: ImageBitmap, options: WatermarkOptions, mimeType: string, logo?: ImageBitmap): Promise<Blob> {
  validateImageMimeType(mimeType);
  const canvas = document.createElement("canvas");
  try { renderWatermark(canvas, source, options, logo); return await encodeCanvas(canvas, mimeType); }
  finally { canvas.width = 0; canvas.height = 0; }
}
