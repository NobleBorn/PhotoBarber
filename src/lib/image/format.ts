const supportedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateImageMimeType(type: string): void {
  if (!supportedMimeTypes.has(type)) {
    throw new Error("Unsupported or unknown image format. Select a PNG, JPEG, or WebP image with a recognized MIME type.");
  }
}

export function encodeCanvas(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  if (!supportedMimeTypes.has(type) && type !== "image/avif") throw new Error("Unsupported output format.");
  if (quality !== undefined && (!Number.isFinite(quality) || quality < 0 || quality > 1)) throw new Error("Choose a valid encoding quality.");
  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) reject(new Error("Image encoding failed. Try smaller dimensions or another image."));
      else if (result.type !== type) reject(new Error("Your browser cannot export this image in the requested format. No converted file was downloaded."));
      else resolve(result);
    }, type, quality);
  });
}
