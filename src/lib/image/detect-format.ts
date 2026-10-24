export type InputImageFormat = "jpg" | "png" | "webp" | "heic" | "heif" | "avif" | "gif" | "bmp" | "tiff";
export type DetectedImage = { format: InputImageFormat; mimeType: string; label: string; frameCount?: number; imageItemCount?: number; multiFrame: boolean; warnings: string[] };
const text = (bytes: Uint8Array, start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
function visibleBmffImages(bytes: Uint8Array, view: DataView): number | undefined {
  let count = 0;
  function walk(start: number, end: number, level: number) {
    if (level > 4) return;
    for (let at = start; at + 8 <= end;) {
      const size = view.getUint32(at), name = text(bytes, at + 4, 4);
      if (size < 8 || size > end - at) break;
      const payload = at + 8, finish = at + size;
      if (name === "meta" && size >= 12) walk(payload + 4, finish, level + 1);
      else if (name === "iinf" && size >= 14) walk(payload + 4 + (bytes[payload] === 0 ? 2 : 4), finish, level + 1);
      else if (name === "infe" && size >= 20) {
        const version = bytes[payload], hidden = Boolean(bytes[payload + 3] & 1);
        const typeAt = payload + (version === 2 ? 8 : 10);
        if ((version === 2 || version === 3) && typeAt + 4 <= finish && !hidden && ["hvc1", "av01", "grid", "jpeg"].includes(text(bytes, typeAt, 4))) count++;
      }
      at = finish;
    }
  }
  walk(0, bytes.length, 0); return count || undefined;
}
export function inspectImage(buffer: ArrayBuffer): DetectedImage {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  const result = (format: InputImageFormat, mimeType: string, label: string, frameCount?: number, multiFrame = false, warnings: string[] = []): DetectedImage => ({ format, mimeType, label, frameCount, multiFrame: multiFrame || (frameCount ?? 1) > 1, warnings });
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return result("jpg", "image/jpeg", "JPEG", 1);
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)) {
    let frames = 1, animated = false;
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = view.getUint32(offset); if (size > bytes.length - offset - 12) break;
      if (text(bytes, offset + 4, 4) === "acTL" && size >= 8) { frames = view.getUint32(offset + 8); animated = true; }
      offset += size + 12;
    }
    return result("png", "image/png", "PNG", frames, animated);
  }
  if (bytes.length >= 12 && text(bytes, 0, 4) === "RIFF" && text(bytes, 8, 4) === "WEBP") {
    let frames = 0, animated = false;
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const size = view.getUint32(offset + 4, true); if (size > bytes.length - offset - 8) break;
      const name = text(bytes, offset, 4); if (name === "ANIM") animated = true; if (name === "ANMF") frames++;
      offset += 8 + size + size % 2;
    }
    return result("webp", "image/webp", "WebP", frames || 1, animated);
  }
  if (bytes.length >= 13 && ["GIF87a", "GIF89a"].includes(text(bytes, 0, 6))) {
    let offset = 13 + ((bytes[10] & 128) ? 3 * (2 ** ((bytes[10] & 7) + 1)) : 0), frames = 0;
    const skipBlocks = () => { while (offset < bytes.length) { const size = bytes[offset++]; if (!size) break; offset += size; } };
    while (offset < bytes.length) {
      const marker = bytes[offset++];
      if (marker === 0x3b) break;
      if (marker === 0x21) { offset++; skipBlocks(); }
      else if (marker === 0x2c && offset + 9 <= bytes.length) { frames++; const packed = bytes[offset + 8]; offset += 9; if (packed & 128) offset += 3 * (2 ** ((packed & 7) + 1)); offset++; skipBlocks(); }
      else break;
    }
    return result("gif", "image/gif", "GIF", Math.max(1, frames));
  }
  if (bytes.length >= 26 && text(bytes, 0, 2) === "BM") return result("bmp", "image/bmp", "BMP", 1);
  if (bytes.length >= 8 && ((text(bytes, 0, 2) === "II" && (bytes[2] === 42 || bytes[2] === 43) && bytes[3] === 0) || (text(bytes, 0, 2) === "MM" && bytes[2] === 0 && (bytes[3] === 42 || bytes[3] === 43)))) {
    if (bytes[2] === 43 || bytes[3] === 43) throw new Error("BigTIFF is not supported. Export a standard TIFF or another supported image format first.");
    return result("tiff", "image/tiff", "TIFF");
  }
  // ISO BMFF: classify the ftyp brands, never the filename or supplied MIME type.
  for (let offset = 0; offset + 8 <= bytes.length;) {
    const size = view.getUint32(offset), name = text(bytes, offset + 4, 4);
    if (size < 8 || size > bytes.length - offset) break;
    if (name === "ftyp" && size >= 16) {
      const brands = [text(bytes, offset + 8, 4)]; for (let i = offset + 16; i + 4 <= offset + size; i += 4) brands.push(text(bytes, i, 4));
      const items = visibleBmffImages(bytes, view);
      const sequence = (items ?? 1) > 1 || brands.some((brand) => ["avis", "msf1", "hevc", "hevx"].includes(brand));
      if (brands.some((brand) => ["avif", "avis"].includes(brand))) return { ...result("avif", "image/avif", "AVIF", undefined, sequence, ["This image container can contain multiple image items. Only its first decoded image is converted."]), imageItemCount: items };
      if (brands.some((brand) => ["heic", "heix", "hevc", "hevx", "heim", "heis"].includes(brand))) return { ...result("heic", "image/heic", "HEIC", undefined, sequence, ["HEIC containers may include additional image items. Only the first decoded image is converted."]), imageItemCount: items };
      if (brands.some((brand) => ["mif1", "msf1"].includes(brand))) return { ...result("heif", "image/heif", "HEIF", undefined, sequence, ["HEIF containers may include additional image items. Only the first decoded image is converted."]), imageItemCount: items };
    }
    offset += size;
  }
  throw new Error("Unsupported or unrecognized image contents. Choose JPG, PNG, WebP, HEIC/HEIF, AVIF, GIF, BMP, or standard TIFF.");
}
