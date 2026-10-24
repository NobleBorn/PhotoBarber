export type ImageSize = { width: number; height: number };
export type CropRegion = ImageSize & { x: number; y: number };
export type CropField = keyof CropRegion;
export const aspectPresets = [
  { label: "Freeform", value: "free", ratio: undefined },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "4:3", value: "4:3", ratio: 4 / 3 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
  { label: "4:5", value: "4:5", ratio: 4 / 5 },
] as const;
export type AspectPreset = (typeof aspectPresets)[number]["value"];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function constrainCrop(crop: CropRegion, image: ImageSize, ratio?: number, axis: "width" | "height" = "width"): CropRegion {
  let width = clamp(Math.round(crop.width), 1, image.width);
  let height = clamp(Math.round(crop.height), 1, image.height);
  if (ratio) {
    const desiredWidth = axis === "height" ? height * ratio : width;
    const fittedWidth = Math.min(desiredWidth, image.width, image.height * ratio);
    width = Math.max(1, Math.round(fittedWidth));
    height = Math.max(1, Math.min(image.height, Math.round(fittedWidth / ratio)));
  }
  return { width, height, x: clamp(Math.round(crop.x), 0, image.width - width), y: clamp(Math.round(crop.y), 0, image.height - height) };
}

export function centeredCrop(image: ImageSize, ratio?: number): CropRegion {
  const fitted = constrainCrop({ x: 0, y: 0, width: Math.round(image.width * 0.8), height: Math.round(image.height * 0.8) }, image, ratio);
  return { ...fitted, x: Math.round((image.width - fitted.width) / 2), y: Math.round((image.height - fitted.height) / 2) };
}

export function toPercentCrop(crop: CropRegion, image: ImageSize) {
  return { unit: "%" as const, x: crop.x / image.width * 100, y: crop.y / image.height * 100, width: crop.width / image.width * 100, height: crop.height / image.height * 100 };
}

export function fromPercentCrop(crop: CropRegion, image: ImageSize): CropRegion {
  return constrainCrop({ x: crop.x * image.width / 100, y: crop.y * image.height / 100, width: crop.width * image.width / 100, height: crop.height * image.height / 100 }, image);
}

export function isValidCrop(crop: CropRegion, image: ImageSize): boolean {
  return Object.values(crop).every(Number.isSafeInteger) && crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0 && crop.x + crop.width <= image.width && crop.y + crop.height <= image.height;
}
