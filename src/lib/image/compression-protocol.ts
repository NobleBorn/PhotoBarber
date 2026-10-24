import type { CompressionOptions, CompressionProgress } from "./compression-search.ts";
import type { CompressionResult } from "./compress.ts";
export type CompressionRequest = { file: File; options: CompressionOptions };
export type CompressionResponse = { type: "progress"; progress: CompressionProgress } | { type: "result"; result: CompressionResult } | { type: "error"; message: string };
