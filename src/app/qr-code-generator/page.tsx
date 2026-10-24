import type { Metadata } from "next";
import QRCodeTool from "@/components/tools/QRCodeTool";
export const metadata: Metadata = { title: "QR Code Generator", description: "Create and customize QR codes for URLs, text, Wi-Fi, email, and phone numbers locally. Download PNG or SVG." };
export default function QRCodePage() {
  return <main className="min-h-screen px-5 py-12 sm:px-6 sm:py-16"><div className="mx-auto max-w-6xl"><h1 className="mb-4 text-center text-4xl font-bold tracking-tight">QR Code Generator</h1><p className="mx-auto mb-10 max-w-2xl text-center leading-7 text-muted">Make a connection. Create a QR code, give it your style, and download it privately.</p><QRCodeTool /></div></main>;
}
