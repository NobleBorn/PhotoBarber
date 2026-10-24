declare module "upng-js" {
  type PngImage = { width: number; height: number; depth: number; frames: unknown[]; tabs: Record<string, unknown> };
  const UPNG: {
    decode(buffer: ArrayBuffer): PngImage;
    toRGBA8(image: PngImage): ArrayBuffer[];
    encode(buffers: ArrayBuffer[], width: number, height: number, colors: number): ArrayBuffer;
    quantize(buffers: ArrayBuffer[], colors: number): { bufs: ArrayBuffer[] };
  };
  export default UPNG;
}
