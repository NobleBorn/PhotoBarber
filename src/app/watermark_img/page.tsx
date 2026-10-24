import type { Metadata } from "next";
import WatermarkTool from "@/components/tools/WatermarkTool";
export const metadata: Metadata = { title: "Watermark Image Online", description: "Add text or logo watermarks to PNG, JPEG, and WebP images privately in your browser, with positioning, rotation, opacity, and tiling." };
export default function WatermarkImagePage() {
  return <main className="min-h-screen px-5 py-12 sm:px-6 sm:py-16"><div className="mx-auto max-w-6xl"><h1 className="mb-4 text-center text-4xl font-bold tracking-tight">Watermark Image</h1><p className="mx-auto mb-10 max-w-2xl text-center leading-7 text-muted">Make your mark. Add your name or logo, and place it just where you want it. Your images stay on your device.</p><WatermarkTool /></div></main>;
}
