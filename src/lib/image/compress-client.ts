import type { CompressionOptions, CompressionProgress } from "./compression-search";
import type { CompressionResult } from "./compress";
import type { CompressionRequest, CompressionResponse } from "./compression-protocol";
export function compressInWorker(file: File, options: CompressionOptions, signal: AbortSignal, progress: (value: CompressionProgress) => void): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Compression cancelled.", "AbortError")); return; }
    if (typeof Worker === "undefined") { reject(new Error("This browser cannot run background compression. Try an up-to-date browser.")); return; }
    let worker: Worker;
    try { worker = new Worker(new URL("../../workers/image.worker.ts", import.meta.url), { type: "module" }); }
    catch { reject(new Error("Could not start the compression worker. Reload the page or try another browser.")); return; }
    const cleanup = () => { signal.removeEventListener("abort", abort); worker.terminate(); };
    const abort = () => { cleanup(); reject(new DOMException("Compression cancelled.", "AbortError")); };
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<CompressionResponse>) => {
      if (event.data.type === "progress") progress(event.data.progress);
      else { cleanup(); if (event.data.type === "result") resolve(event.data.result); else reject(new Error(event.data.message)); }
    };
    worker.onerror = () => { cleanup(); reject(new Error("The compression worker stopped unexpectedly. Your browser may be out of memory; try one image at a time.")); };
    worker.onmessageerror = () => { cleanup(); reject(new Error("Could not read the compression result.")); };
    const request: CompressionRequest = { file, options };
    try { worker.postMessage(request); } catch { cleanup(); reject(new Error("Could not send this image to the worker. Your browser may be out of memory.")); }
  });
}
