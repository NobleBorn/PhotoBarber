import type { Metadata } from "next";
import ConvertTool from "@/components/tools/ConvertTool";
export const metadata: Metadata = { title: "Convert Image Online", description: "Decode JPG, PNG, WebP, HEIC/HEIF, AVIF, GIF, BMP, and TIFF locally; convert to verified browser output formats privately in your browser. Preserve dimensions, choose quality, and compare actual output sizes." };
export default function ConvertImagePage() {
  return <main className="min-h-screen px-5 py-12 sm:px-6 sm:py-16"><div className="mx-auto max-w-6xl"><h1 className="mb-4 text-center text-4xl font-bold tracking-tight">Convert Image</h1><p className="mx-auto mb-10 max-w-2xl text-center leading-7 text-muted">A fresh format for your next step. Convert locally, keep your dimensions, and preview the result.</p><ConvertTool /></div></main>;
}
