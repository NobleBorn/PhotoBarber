
import type { Metadata } from "next";
import ResizeTool from "@/components/tools/ResizeTool";

export const metadata: Metadata = {
  title: "Resize Image Online",
  description: "Resize your images for free in your browser.",
};

export default function ResizeImagePage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-center text-4xl font-bold">
          Resize Image
        </h1>

        <p className="mb-10 text-center text-muted">
          Resize JPG, PNG, or WebP images by pixels or percentage, privately in your browser.
        </p>

        <ResizeTool />
      </div>
    </main>
  );
}
