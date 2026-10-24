"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { LoaderCircle, Upload, X } from "lucide-react";
import { validateImageMimeType } from "@/lib/image/format";
import { compressInWorker } from "@/lib/image/compress-client";
import { targetSizeInBytes, type CompressionOptions } from "@/lib/image/compression-search";
import CompressSettings, { type CompressForm } from "./CompressSettings";
import CompressionResultCard, { type CompressionItem, type DisplayCompressionResult } from "./CompressionResultCard";

export default function CompressTool() {
  const [items, setItems] = useState<CompressionItem[]>([]);
  const [results, setResults] = useState<Record<number, DisplayCompressionResult>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [settings, setSettings] = useState<CompressForm>({ mode: "automatic", quality: 80, target: "200", unit: "KB" });
  const [loading, setLoading] = useState(false), [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState("");
  const generation = useRef(0), controller = useRef<AbortController | null>(null), urls = useRef(new Set<string>());
  const busy = loading || processing;
  const target = targetSizeInBytes(settings.target, settings.unit);
  const invalidTarget = settings.mode === "target" && target === null;
  const supported = items.filter((item) => item.url && !item.error);
  useEffect(() => () => { generation.current++; controller.current?.abort(); for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear(); }, []);
  function makeUrl(blob: Blob) { const url = URL.createObjectURL(blob); urls.current.add(url); return url; }
  function revokeResultUrls() { for (const result of Object.values(results)) { URL.revokeObjectURL(result.url); urls.current.delete(result.url); } }
  function cancel() { generation.current++; controller.current?.abort(); controller.current = null; if (loading) { for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear(); } setLoading(false); setProcessing(false); setNotice("Cancelled. Completed results remain available; original files are unchanged."); }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []); event.target.value = "";
    if (!files.length) return;
    const run = ++generation.current; controller.current?.abort();
    for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear();
    setItems([]); setResults({}); setErrors({}); setLoading(true); setNotice("Reading image details…");
    const next: CompressionItem[] = [];
    try {
      for (let id = 0; id < files.length; id++) {
        const file = files[id];
        try {
          validateImageMimeType(file.type);
          const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
          const size = { width: bitmap.width, height: bitmap.height }; bitmap.close();
          if (run !== generation.current) return;
          if (!size.width || !size.height) throw new Error("This image has invalid dimensions.");
          next.push({ id, file, ...size, url: makeUrl(file) });
        } catch (error) { next.push({ id, file, error: error instanceof Error ? error.message : "Could not open this image." }); }
        if (run !== generation.current) return;
      }
      setItems(next); setNotice(`${next.length} ${next.length === 1 ? "image loaded" : "images loaded"}. Choose settings, then compress.`);
    } finally { if (run === generation.current) setLoading(false); }
  }
  async function compress() {
    if (busy || !supported.length || invalidTarget) return;
    const run = ++generation.current, abort = new AbortController(); controller.current = abort;
    revokeResultUrls(); setResults({}); setErrors({}); setProcessing(true);
    const options: CompressionOptions = { mode: settings.mode, quality: settings.quality, targetBytes: target ?? undefined };
    let completed = 0;
    try {
      for (const item of supported) {
        if (abort.signal.aborted || run !== generation.current) return;
        setNotice(`Compressing ${item.file.name} (${completed + 1}/${supported.length})…`);
        try {
          const result = await compressInWorker(item.file, options, abort.signal, (progress) => {
            if (run === generation.current) setNotice(`Compressing ${item.file.name} · Attempt ${progress.attempt}, quality ${progress.quality}% (${completed + 1}/${supported.length})`);
          });
          if (run !== generation.current) return;
          const display = { ...result, url: makeUrl(result.blob) };
          setResults((current) => ({ ...current, [item.id]: display }));
        } catch (error) {
          if (abort.signal.aborted || run !== generation.current) return;
          setErrors((current) => ({ ...current, [item.id]: error instanceof Error ? error.message : "Could not compress this image." }));
        }
        completed++;
      }
      if (run === generation.current) setNotice("Processing finished. Review the actual sizes and previews below.");
    } finally { if (run === generation.current) { controller.current = null; setProcessing(false); } }
  }
  function changeSettings(value: CompressForm) { setSettings(value); if (Object.keys(results).length) setNotice("Settings changed. Results shown are from the previous run; compress again to apply new settings."); }
  return <div className="space-y-6">
    <label className={`relative flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line bg-white px-6 py-8 text-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${busy ? "opacity-60" : "cursor-pointer hover:border-primary"}`}><span className="flex size-12 items-center justify-center rounded-2xl bg-soft text-primary"><Upload size={24} aria-hidden="true" /></span><span className="font-semibold">{loading ? "Reading images…" : items.length ? "Choose other images" : "Select images"}</span><span className="text-sm text-muted">JPEG, PNG, or WebP · Select one or more · No server upload</span><input aria-label="Upload images to compress" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={upload} className="sr-only" /></label>
    <p role="status" aria-live="polite" className="break-words text-center text-sm text-primary">{notice}</p>
    {busy && <button type="button" onClick={cancel} className="rotation-button mx-auto"><X size={17} aria-hidden="true" />Cancel</button>}
    {items.length > 0 && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
      <div className="min-w-0 space-y-6 rounded-3xl border border-line bg-white p-5 sm:p-6 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6"><CompressSettings value={settings} disabled={busy} hasPng={items.some((item) => item.file.type === "image/png")} onChange={changeSettings} /><button type="button" onClick={compress} disabled={busy || invalidTarget || !supported.length} className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{processing && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}{processing ? "Compressing…" : "Compress Images"}</button><p className="text-xs leading-5 text-muted">Images process one at a time in a background worker. Cancel stops the active worker immediately. Completed downloads stay available.</p></div>
      <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1" aria-label="Image compression results">{items.map((item) => <CompressionResultCard key={item.id} item={item} result={results[item.id]} error={errors[item.id]} />)}</div>
    </div>}
  </div>;
}
