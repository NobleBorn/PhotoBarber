import type { ResizeOptions } from "./resize";

export const reductions = [25, 50, 75] as const;
export type Reduction = (typeof reductions)[number];
export type Dimension = "width" | "height";
export type PixelInputs = Record<Dimension, string>;

export function parseDimension(value: string): number | null {
  const number = value.trim() === "" ? NaN : Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function readDimensions(inputs: PixelInputs): ResizeOptions | null {
  const width = parseDimension(inputs.width);
  const height = parseDimension(inputs.height);
  return width !== null && height !== null ? { width, height } : null;
}

export function toPixelInputs(size: ResizeOptions): PixelInputs {
  return { width: String(size.width), height: String(size.height) };
}

export function proportionalInputs(inputs: PixelInputs, axis: Dimension, original: ResizeOptions): PixelInputs {
  const value = parseDimension(inputs[axis]);
  if (value === null) return inputs;
  const other = axis === "width" ? "height" : "width";
  const scaled = Math.max(1, Math.round(value * (original[other] / original[axis])));
  return { ...inputs, [other]: String(scaled) };
}

export function reducedDimensions(original: ResizeOptions, reduction: Reduction): ResizeOptions {
  const scale = (100 - reduction) / 100;
  return {
    width: Math.max(1, Math.round(original.width * scale)),
    height: Math.max(1, Math.round(original.height * scale)),
  };
}

export function matchingReduction(inputs: PixelInputs, original: ResizeOptions): Reduction | null {
  const size = readDimensions(inputs);
  return reductions.find((reduction) => {
    const candidate = reducedDimensions(original, reduction);
    return candidate.width === size?.width && candidate.height === size?.height;
  }) ?? null;
}
