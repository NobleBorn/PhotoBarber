import type { DecodeRequest, DecodeResponse } from "../lib/image/decode-protocol";
import { tiffOrientationMatrix } from "../lib/image/tiff-orientation";
const scope = globalThis as unknown as { onmessage: (event: MessageEvent<DecodeRequest>) => void; postMessage: (value: DecodeResponse, transfer?: Transferable[]) => void };
scope.onmessage = async ({ data }) => {
  let bitmap: ImageBitmap | undefined;
  try {
    let frameCount: number | undefined;
    const warnings: string[] = [];
    if (data.format === "tiff") {
      const { default: UTIF } = await import("utif");
      const buffer = await data.blob.arrayBuffer();
      const ifds = UTIF.decode(buffer), pages = ifds.filter((page) => page.t256?.[0] && page.t257?.[0]);
      const page = pages[0]; if (!page) throw new Error("No readable image page was found in this TIFF.");
      frameCount = pages.length;
      if (![1,3,4,5,6,7,8,32773,32809].includes(page.t259?.[0] ?? 1) || ![0,1,2,3,5].includes(page.t262?.[0] ?? 2) || (page.t284?.[0] ?? 1) !== 1) throw new Error("This TIFF compression, color layout, or planar layout is not supported. Try exporting it as PNG first.");
      UTIF.decodeImage(buffer, page, ifds);
      const width = page.width!, height = page.height!;
      if (![width,height].every((size) => Number.isSafeInteger(size) && size > 0)) throw new Error("Invalid TIFF dimensions.");
      const rgba = UTIF.toRGBA8(page);
      if (rgba.length !== width * height * 4) throw new Error("This TIFF could not be decoded correctly.");
      const raw = await createImageBitmap(new ImageData(new Uint8ClampedArray(rgba), width, height));
      const oriented = tiffOrientationMatrix(width, height, page.t274?.[0] ?? 1);
      let canvas: OffscreenCanvas | undefined;
      try {
        canvas = new OffscreenCanvas(oriented.width, oriented.height);
        const context = canvas.getContext("2d"); if (!context) throw new Error("Could not allocate TIFF preview memory.");
        context.setTransform(...oriented.matrix); context.drawImage(raw, 0, 0);
        bitmap = canvas.transferToImageBitmap();
      } finally { raw.close(); if (canvas) { canvas.width = 0; canvas.height = 0; } }
      warnings.push("TIFF is decoded to 8-bit RGBA for Canvas export; high bit depth and embedded color profiles may not be retained.");
    } else {
      // heic-to/next lazily creates its own libheif worker and exposes raw decoded pixels.
      const { heicTo } = await import("heic-to/next");
      bitmap = await heicTo({ blob: data.blob, type: "bitmap", options: { imageOrientation: "from-image" } });
      warnings.push("HEIC/HEIF is decoded to standard-range pixels. HDR and embedded metadata may not be retained.");
    }
    scope.postMessage({ type: "result", bitmap, frameCount, warnings }, [bitmap]); bitmap = undefined;
  } catch (error) {
    bitmap?.close();
    scope.postMessage({ type: "error", message: error instanceof RangeError ? "The decoder ran out of memory. Close unused tabs and try again." : error instanceof Error ? error.message : String(error || "This image codec could not decode the file.") });
  }
};
