import { encodeCanvas, validateImageMimeType } from "./format.ts";

export { validateImageMimeType as validateResizeMimeType } from "./format.ts";

export interface ResizeOptions {
  width: number;
  height: number;
}

export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<Blob> {
  const { width, height } = options;
  validateImageMimeType(file.type);

  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Invalid image dimensions");
  }

  const image = await createImageBitmap(file);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    if (canvas.width !== width || canvas.height !== height) {
      throw new Error("Requested dimensions are not supported");
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Cannot initialize image canvas");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await encodeCanvas(canvas, file.type);

    return blob;
  } finally {
    image.close();
  }
}
