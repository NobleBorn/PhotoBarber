import type QRCodeStyling from "qr-code-styling";
import type { DotType, CornerSquareType, ErrorCorrectionLevel } from "qr-code-styling";
export type QRStyle = { size: number; foreground: string; background: string; dots: DotType; corners: CornerSquareType; correction: ErrorCorrectionLevel };
export const initialStyle: QRStyle = { size: 512, foreground: "#164d3b", background: "#ffffff", dots: "square", corners: "square", correction: "M" };
export async function renderQR(payload: string, style: QRStyle): Promise<QRCodeStyling> {
  const { default: QR } = await import("qr-code-styling");
  // The encoder expects byte-valued characters; supply UTF-8 bytes for Unicode payloads.
  const code = new QR({ width: style.size, height: style.size, type: "svg", data: Array.from(new TextEncoder().encode(payload), (byte) => String.fromCharCode(byte)).join(""), margin: Math.ceil(style.size * .18), qrOptions: { errorCorrectionLevel: style.correction, mode: "Byte" }, dotsOptions: { roundSize: false, color: style.foreground, type: style.dots }, cornersSquareOptions: { color: style.foreground, type: style.corners }, cornersDotOptions: { color: style.foreground, type: style.corners === "dot" ? "dot" : "square" }, backgroundOptions: { color: style.background } });
  await code.getRawData("svg");
  return code;
}
