import type { Metadata } from "next";
import RotateTool from "@/components/tools/RotateTool";

export const metadata: Metadata = {
  title: "Rotate Image Online",
  description: "Rotate and flip PNG, JPEG, and WebP images privately in your browser. Preview custom angles and download in the original format.",
};

export default function RotateImagePage() {
  return <main className="min-h-screen px-5 py-12 sm:px-6 sm:py-16"><div className="mx-auto max-w-6xl"><h1 className="mb-4 text-center text-4xl font-bold tracking-tight">Rotate Image</h1><p className="mx-auto mb-10 max-w-2xl text-center leading-7 text-muted">Find a new perspective. Rotate, flip, and fine-tune your image without clipping the edges.</p><RotateTool /></div></main>;
}
