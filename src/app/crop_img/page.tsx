import type { Metadata } from "next";
import CropTool from "@/components/tools/CropTool";

export const metadata: Metadata = {
  title: "Crop Image Online",
  description: "Crop PNG, JPEG, and WebP images privately in your browser with precise pixel controls and an interactive crop selection.",
};

export default function CropImagePage() {
  return (
    <main className="min-h-screen px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-center text-4xl font-bold tracking-tight">Crop Image</h1>
        <p className="mx-auto mb-10 max-w-2xl text-center leading-7 text-muted">Find your perfect frame. Drag to select, or enter exact pixel dimensions.</p>
        <CropTool />
      </div>
    </main>
  );
}
