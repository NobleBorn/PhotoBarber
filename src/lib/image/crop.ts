import { encodeCanvas, validateImageMimeType } from "./format.ts";
import { isValidCrop, type CropRegion } from "./crop-geometry.ts";

export async function cropImage(file: File, crop: CropRegion): Promise<Blob> {
  validateImageMimeType(file.type);
  const image = await createImageBitmap(file);
  try {
    if (!isValidCrop(crop, image)) throw new Error("Choose positive whole-pixel dimensions within the image boundaries.");
    const canvas = document.createElement("canvas");
    canvas.width = crop.width;
    canvas.height = crop.height;
    if (canvas.width !== crop.width || canvas.height !== crop.height) throw new Error("These crop dimensions are not supported by your browser.");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Cannot initialize image canvas.");
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    return await encodeCanvas(canvas, file.type);
  } finally {
    image.close();
  }
}
