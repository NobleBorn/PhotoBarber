"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { availableConversionFormats, conversionFormats, convertImage, type ConversionFormat, type ConversionOptions, type ConversionResult } from "@/lib/image/convert";
import { decodeImage, decodedPreview, type DecodedImage } from "@/lib/image/decode";
import { downloadImage } from "@/lib/image/download";
import { formatFileSize } from "@/lib/image/compression-search";
import ImagePreview from "./ImagePreview";
import ConvertSettings from "./ConvertSettings";

type SourceImage = DecodedImage & { file: File; url: string };
type DisplayResult = ConversionResult & { url: string };
const defaults: ConversionOptions = { format: "jpg", quality: 90, background: "#ffffff" };
export default function ConvertTool() {
  const [image, setImage] = useState<SourceImage | null>(null), [result, setResult] = useState<DisplayResult | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({ ...defaults });
  const [supported, setSupported] = useState<ConversionFormat[]>([]), [checking, setChecking] = useState(true);
  const [uploading, setUploading] = useState(false), [processing, setProcessing] = useState(false);
  const [error, setError] = useState(""), [feedback, setFeedback] = useState("");
  const request = useRef(0), uploadAbort = useRef<AbortController | null>(null);
  const busy = uploading || processing;
  useEffect(() => {
    let active = true;
    availableConversionFormats().then((formats) => {
      if (!active) return;
      setSupported(formats); setChecking(false);
      if (formats.length) setOptions((old) => ({ ...old, format: formats.includes(old.format) ? old.format : formats[0] }));
      else setError("This browser could not verify an image encoder. Try an up-to-date browser.");
    }).catch(() => { if (active) { setChecking(false); setError("Could not check the browser’s image encoders."); } });
    return () => { active = false; };
  }, []);
  useEffect(() => () => { if (image) { image.bitmap.close(); URL.revokeObjectURL(image.url); } }, [image]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { request.current++; uploadAbort.current?.abort(); }, []);
  function clearFeedback() { setError(""); setFeedback(""); }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const id = ++request.current; uploadAbort.current?.abort();
    const abort = new AbortController(); uploadAbort.current = abort;
    setUploading(true); clearFeedback(); setFeedback("Detecting format and decoding locally. HEIC/HEIF and TIFF may take longer…");
    let decoded: DecodedImage | undefined, committed = false;
    try {
      decoded = await decodeImage(file, abort.signal);
      if (id !== request.current) return;
      const preview = await decodedPreview(decoded.bitmap);
      if (id !== request.current) return;
      const url = URL.createObjectURL(preview);
      setImage({ ...decoded, file, url }); committed = true; setResult(null); setFeedback("");
    } catch (err) { if (id === request.current) setError(err instanceof RangeError ? "The image decoder ran out of memory. Close unused tabs and try again." : err instanceof Error ? err.message : "Could not decode this image. Its codec may be unsupported or the file damaged."); }
    finally { if (!committed) decoded?.bitmap.close(); if (id === request.current) { setUploading(false); uploadAbort.current = null; } }
  }
  function cancelUpload() { request.current++; uploadAbort.current?.abort(); uploadAbort.current = null; setUploading(false); setFeedback("Decoding cancelled. Your original file is unchanged."); }
  function change(next: ConversionOptions) { setOptions(next); setResult(null); clearFeedback(); }
  async function convert() {
    if (!image || busy || !supported.includes(options.format)) return;
    const id = request.current; setProcessing(true); clearFeedback(); setResult(null);
    try {
      const converted = await convertImage(image.bitmap, image.file.name, options);
      if (id !== request.current) return;
      setResult({ ...converted, url: URL.createObjectURL(converted.blob) }); setFeedback("Conversion ready. Compare the previews and actual sizes before downloading.");
    } catch (err) { if (id === request.current) setError(err instanceof Error ? err.message : "Conversion failed. Your browser may be out of memory; close unused tabs and try again."); }
    finally { if (id === request.current) setProcessing(false); }
  }
  const destination = conversionFormats.find((format) => format.mime === result?.mimeType)?.label;
  return <div className="space-y-6" aria-busy={busy}>
    <label className={`relative flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line bg-white px-6 py-8 text-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${busy ? "opacity-60" : "cursor-pointer hover:border-primary"}`}><span className="flex size-12 items-center justify-center rounded-2xl bg-soft text-primary"><Upload size={24} aria-hidden="true" /></span><span className="font-semibold">{uploading ? "Opening image…" : image ? "Choose another image" : "Select an image"}</span><span className="text-sm text-muted">JPG, PNG, WebP, HEIC/HEIF, AVIF, GIF, BMP, TIFF · Local decoding</span><input aria-label="Upload image to convert" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/gif,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.gif,.bmp,.tif,.tiff" disabled={busy} onChange={upload} className="sr-only" /></label>
    {uploading && <button type="button" onClick={cancelUpload} className="rotation-button mx-auto">Cancel decoding</button>}
    {image && image.warnings.length > 0 && <div role="status" className="space-y-2 rounded-xl border border-line bg-white p-4 text-sm leading-6 text-muted">{image.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>}
    {checking && <p role="status" className="text-center text-sm text-muted">Checking browser output formats…</p>}
    {image && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
      <div className="min-w-0 space-y-6 rounded-3xl border border-line bg-white p-5 sm:p-6 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6"><ConvertSettings options={options} supported={supported} disabled={busy || checking} inputType={image.mimeType} onChange={change} /><button type="button" onClick={convert} disabled={busy || checking || !supported.includes(options.format)} className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{processing && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}{processing ? "Converting…" : "Convert Image"}</button></div>
      <div className="min-w-0 space-y-5 rounded-3xl border border-line bg-white p-4 sm:p-6 lg:col-start-1 lg:row-start-1"><h2 className="break-all text-lg font-semibold">{image.file.name}</h2><div className="grid gap-5 sm:grid-cols-2"><ImagePreview src={image.url} alt={`Original ${image.file.name}`} width={image.bitmap.width} height={image.bitmap.height} caption={<>Original · {image.label}<br />{image.bitmap.width} × {image.bitmap.height} px · {formatFileSize(image.file.size)}<br />{image.file.size.toLocaleString()} bytes</>} />{result ? <ImagePreview src={result.url} alt={`Converted ${result.filename}`} width={result.width} height={result.height} caption={<>Converted · {destination}<br />{result.width} × {result.height} px · {formatFileSize(result.blob.size)}<br />{result.blob.size.toLocaleString()} bytes</>} /> : <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">Choose a format and convert to see the result.</div>}</div>{result && <><p className="break-all rounded-xl bg-surface p-4 text-sm text-primary">Ready: {result.filename}</p><button type="button" onClick={() => downloadImage(result.blob, result.filename)} className="button-primary"><Download size={17} aria-hidden="true" />Download Converted</button></>}</div>
    </div>}
    {error && <p role="alert" className="rounded-xl border border-error/20 p-4 text-sm text-error">{error}</p>}<p role="status" className="text-center text-sm text-primary">{feedback}</p>
  </div>;
}
