import { compressImage } from "../lib/image/compress";
import type { CompressionRequest, CompressionResponse } from "../lib/image/compression-protocol";
const scope = globalThis as unknown as { onmessage: (event: MessageEvent<CompressionRequest>) => void; postMessage: (value: CompressionResponse) => void };
scope.onmessage = async (event) => {
  try {
    const result = await compressImage(event.data.file, event.data.options, (progress) => scope.postMessage({ type: "progress", progress }));
    scope.postMessage({ type: "result", result });
  } catch (error) {
    scope.postMessage({ type: "error", message: error instanceof RangeError ? "Your browser ran out of image-processing memory. Close other tabs or try one image at a time." : error instanceof Error ? error.message : "Compression failed. Try another image or close unused tabs." });
  }
};
