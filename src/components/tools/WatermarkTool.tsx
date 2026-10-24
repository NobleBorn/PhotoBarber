"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { downloadImage } from "@/lib/image/download";
import { decodeWatermarkImage, defaultWatermark, positionWatermark, watermarkImage, type MarkSize, type WatermarkOptions } from "@/lib/image/watermark";
import WatermarkPreview from "./WatermarkPreview";
import WatermarkSettings, { type NumericWatermarkField } from "./WatermarkSettings";

type UploadedImage = { bitmap: ImageBitmap; file: File };
export default function WatermarkTool() {
  const [image, setImage] = useState<UploadedImage | null>(null), [logo, setLogo] = useState<ImageBitmap | undefined>();
  const [options, setOptions] = useState<WatermarkOptions>(defaultWatermark({ width: 1000, height: 1000 }));
  const [drafts, setDrafts] = useState<Partial<Record<NumericWatermarkField, string>>>({});
  const [loading, setLoading] = useState(false), [processing, setProcessing] = useState(false);
  const [error, setError] = useState(""), [feedback, setFeedback] = useState("");
  const sourceRequest = useRef(0), logoRequest = useRef(0), markSize = useRef<MarkSize>({ width: 1, height: 1 });
  const busy = loading || processing;
  const markReady = !options.enabled || (options.kind === "text" ? Boolean(options.text.trim()) : Boolean(logo));
  const reportSize = useCallback((size: MarkSize) => { markSize.current = size; }, []);
  const reportError = useCallback((message: string) => setError(message), []);
  useEffect(() => () => { image?.bitmap.close(); }, [image]);
  useEffect(() => () => { logo?.close(); }, [logo]);
  useEffect(() => () => { sourceRequest.current++; logoRequest.current++; }, []);
  function clearFeedback() { setError(""); setFeedback(""); }
  function change(next: WatermarkOptions) { setOptions(next); setDrafts({}); clearFeedback(); }
  async function upload(event: ChangeEvent<HTMLInputElement>, isLogo: boolean) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const requestRef = isLogo ? logoRequest : sourceRequest, id = ++requestRef.current;
    setLoading(true); clearFeedback();
    try {
      const bitmap = await decodeWatermarkImage(file);
      if (id !== requestRef.current) { bitmap.close(); return; }
      if (!bitmap.width || !bitmap.height) { bitmap.close(); throw new Error("This image has invalid dimensions."); }
      if (isLogo) {
        setLogo(bitmap);
        setOptions((old) => ({ ...old, kind: "image", enabled: true, logoWidth: image ? Math.max(1, Math.min(image.bitmap.width * 0.3, image.bitmap.height * 0.3 * bitmap.width / bitmap.height)) : old.logoWidth }));
      } else {
        logoRequest.current++;
        setImage({ bitmap, file }); setLogo(undefined); setOptions(defaultWatermark(bitmap));
      }
      setDrafts({});
    } catch (err) { if (id === requestRef.current) setError(err instanceof Error ? err.message : "Could not open this image."); }
    finally { if (id === requestRef.current) setLoading(false); }
  }
  function numberChange(field: NumericWatermarkField, raw: string) {
    const value = raw.trim() === "" ? NaN : Number(raw), min = field === "angle" ? -180 : field === "fontSize" || field === "logoWidth" ? 1 : 0;
    if (!Number.isFinite(value) || value < min || (field === "angle" && value > 180)) { setDrafts((old) => ({ ...old, [field]: raw })); return; }
    setOptions((old) => ({ ...old, [field]: value }));
    setDrafts((old) => { const next = { ...old }; delete next[field]; return next; }); clearFeedback();
  }
  function reset() { if (image) change(defaultWatermark(image.bitmap)); }
  function quickPosition(column: number, row: number) {
    if (image) change({ ...options, ...positionWatermark(image.bitmap, markSize.current, options.angle, column, row), enabled: true });
  }
  async function download() {
    if (!image || busy || !markReady || Object.keys(drafts).length) return;
    setProcessing(true); clearFeedback();
    try { const blob = await watermarkImage(image.bitmap, options, image.file.type, logo); downloadImage(blob, image.file.name); setFeedback("Download started with your original filename, format, and image dimensions."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not export the watermarked image."); }
    finally { setProcessing(false); }
  }
  const previewOptions = markReady ? options : { ...options, enabled: false };
  return <div className="space-y-6" aria-busy={busy}>
    <label className={`relative flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line bg-white px-6 py-8 text-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${busy ? "opacity-60" : "cursor-pointer hover:border-primary"}`}><span className="flex size-12 items-center justify-center rounded-2xl bg-soft text-primary"><Upload size={24} aria-hidden="true" /></span><span className="font-semibold">{loading ? "Opening image…" : image ? "Choose another image" : "Select an image"}</span><span className="text-sm text-muted">PNG, JPEG, or WebP · Your image stays on your device</span><input aria-label="Upload source image" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => upload(event, false)} className="sr-only" /></label>
    {image && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <WatermarkPreview source={image.bitmap} logo={logo} options={previewOptions} disabled={busy} onChange={change} onSize={reportSize} onError={reportError} />
      <div className="min-w-0 space-y-6 rounded-3xl border border-line bg-white p-5 sm:p-6">
        <WatermarkSettings options={options} drafts={drafts} disabled={busy} hasLogo={Boolean(logo)} onChange={change} onNumber={numberChange} onLogo={(event) => upload(event, true)} onPosition={quickPosition} onReset={reset} onRemove={() => change({ ...options, enabled: false })} />
        <p role="status" className="rounded-xl bg-surface p-4 text-sm text-primary">Output: {image.bitmap.width} × {image.bitmap.height} px{!options.enabled ? " · No watermark" : !markReady ? " · Add text or upload a logo" : ""}</p>
        <button type="button" onClick={download} disabled={busy || !markReady || Boolean(Object.keys(drafts).length)} className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{processing ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}{processing ? "Processing…" : "Download Image"}</button>
      </div>
    </div>}
    {error && <p role="alert" className="rounded-xl border border-error/20 bg-white p-4 text-sm text-error">{error}</p>}
    <p role="status" className="text-center text-sm text-primary">{feedback}</p>
  </div>;
}
