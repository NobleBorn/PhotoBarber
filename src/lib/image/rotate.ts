import { encodeCanvas, validateImageMimeType } from "./format.ts";

export type RotationOptions = { angle: number; flipHorizontal: boolean; flipVertical: boolean; background: string };
export const defaultRotation: RotationOptions = { angle: 0, flipHorizontal: false, flipVertical: false, background: "#ffffff" };
export type ImageDimensions = { width: number; height: number };

export function normalizeAngle(angle: number): number {
  return ((angle + 180) % 360 + 360) % 360 - 180;
}

export function rotationDimensions(image: ImageDimensions, angle: number): ImageDimensions {
  if (!Number.isFinite(angle) || angle < -180 || angle > 180) throw new Error("Enter an angle between −180° and 180°.");
  if (![image.width, image.height].every((value) => Number.isSafeInteger(value) && value > 0)) throw new Error("Invalid image dimensions.");
  const radians = angle * Math.PI / 180;
  // Eliminate trigonometric noise at quarter turns so they never add a blank pixel.
  const cos = Math.abs(Math.cos(radians)) < 1e-12 ? 0 : Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians)) < 1e-12 ? 0 : Math.abs(Math.sin(radians));
  return { width: Math.ceil(image.width * cos + image.height * sin), height: Math.ceil(image.width * sin + image.height * cos) };
}

export async function decodeRotationImage(file: File): Promise<ImageBitmap> {
  validateImageMimeType(file.type);
  // Apply camera orientation once; preview and export share this decoded source.
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

export function drawRotatedImage(canvas: HTMLCanvasElement, source: ImageBitmap, options: RotationOptions, mimeType: string, scale = 1): ImageDimensions {
  validateImageMimeType(mimeType);
  if (!/^#[0-9a-f]{6}$/i.test(options.background)) throw new Error("Choose a valid background color.");
  if (!Number.isFinite(scale) || scale <= 0 || scale > 1) throw new Error("Invalid preview scale.");
  const output = rotationDimensions(source, options.angle);
  const width = Math.max(1, Math.ceil(output.width * scale));
  const height = Math.max(1, Math.ceil(output.height * scale));
  canvas.width = width;
  canvas.height = height;
  if (canvas.width !== width || canvas.height !== height) throw new Error("Output dimensions exceed your browser’s Canvas support.");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Cannot initialize image canvas.");
  if (mimeType === "image/jpeg") {
    context.fillStyle = options.background;
    context.fillRect(0, 0, width, height);
  }
  context.save();
  try {
    context.translate(width / 2, height / 2);
    context.scale(scale, scale);
    context.rotate(options.angle * Math.PI / 180);
    // Flips operate on the original image axes, then rotation is applied.
    context.scale(options.flipHorizontal ? -1 : 1, options.flipVertical ? -1 : 1);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, -source.width / 2, -source.height / 2);
  } finally { context.restore(); }
  return output;
}

export async function rotateImage(source: ImageBitmap, options: RotationOptions, mimeType: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  try {
    drawRotatedImage(canvas, source, options, mimeType);
    return await encodeCanvas(canvas, mimeType);
  } finally {
    // Release the temporary output buffer; the original bitmap remains reusable.
    canvas.width = 0;
    canvas.height = 0;
  }
}
