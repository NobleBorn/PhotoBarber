export type DecodeRequest = { blob: Blob; format: "heic" | "heif" | "tiff" };
export type DecodeResponse = { type: "result"; bitmap: ImageBitmap; frameCount?: number; warnings: string[] } | { type: "error"; message: string };
