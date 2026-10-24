import type { Metadata } from "next";
import CompressTool from "@/components/tools/CompressTool";
export const metadata: Metadata = { title: "Compress Image Online", description: "Compress JPEG, PNG, and WebP images privately in your browser. Automatic, manual quality, and target-size compression without resizing or format conversion." };
export default function CompressImagePage() {
  return <main className="min-h-screen px-5 py-12 sm:px-6 sm:py-16"><div className="mx-auto max-w-6xl"><h1 className="mb-4 text-center text-4xl font-bold tracking-tight">Compress Image</h1><p className="mx-auto mb-10 max-w-2xl text-center leading-7 text-muted">Lighter files. Same dimensions. Compare the results and keep the version that works for you.</p><CompressTool /></div></main>;
}
