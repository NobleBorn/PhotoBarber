import ImagePreview from "./ImagePreview";
import { Download } from "lucide-react";
import { formatFileSize } from "@/lib/image/compression-search";
import { downloadImage } from "@/lib/image/download";
import type { CompressionResult } from "@/lib/image/compress";
export type CompressionItem = { id: number; file: File; url?: string; width?: number; height?: number; error?: string };
export type DisplayCompressionResult = CompressionResult & { url: string };
export default function CompressionResultCard({ item, result, error }: { item: CompressionItem; result?: DisplayCompressionResult; error?: string }) {
  const saved = result ? Math.max(0, (1 - result.blob.size / item.file.size) * 100) : 0;
  return <article className="min-w-0 space-y-4 rounded-3xl border border-line bg-white p-4 sm:p-6">
    <div><h2 className="break-all text-lg font-semibold">{item.file.name}</h2><p className="mt-1 text-xs leading-5 text-muted">{item.file.type.replace("image/", "").toUpperCase() || "Unknown format"}{item.width && item.height ? ` · ${item.width} × ${item.height} px` : ""} · {formatFileSize(item.file.size)} ({item.file.size.toLocaleString()} bytes)</p></div>
    {item.url && item.width && item.height && <div className="grid gap-4 sm:grid-cols-2">
      <ImagePreview src={item.url} alt={`Original ${item.file.name}`} width={item.width} height={item.height} caption={`Original · ${formatFileSize(item.file.size)}`} />
      {result ? <ImagePreview src={result.url} alt={`Compressed ${item.file.name}`} width={item.width} height={item.height} caption={`${result.usedOriginal ? "Original retained" : "Compressed"} · ${formatFileSize(result.blob.size)}`} /> : <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">Your compressed preview will appear here.</div>}
    </div>}
    {result && <>
      <p className="rounded-xl bg-surface p-4 text-sm text-primary">{result.blob.size.toLocaleString()} bytes · {saved.toFixed(1)}% saved{result.quality !== undefined ? ` · Quality ${result.quality}%` : ""}{result.targetMet === true ? " · Target met" : ""}</p>
      {result.usedOriginal && !result.note && <p className="text-sm leading-6 text-muted">The original is already smaller than, or equal to, the optimized result, or already meets the target. It is offered unchanged.</p>}
      {result.targetMet === false && <p className="rounded-xl border border-line p-4 text-sm leading-6 text-muted">The target could not be reached with the tested compression settings at these dimensions and format. The smallest result found is offered. A smaller target may require resizing or changing format.</p>}
      {result.note && <p className="text-sm leading-6 text-muted">{result.note}</p>}
      <button type="button" onClick={() => downloadImage(result.blob, item.file.name)} className="button-primary justify-center"><Download size={17} aria-hidden="true" />{result.usedOriginal ? "Download Original" : "Download Compressed"}</button>
    </>}
    {(item.error || error) && <p role="alert" className="rounded-xl border border-error/20 p-4 text-sm text-error">{item.error || error}</p>}
  </article>;
}
