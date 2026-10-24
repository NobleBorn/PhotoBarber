"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { cropImage } from "@/lib/image/crop";
import { downloadImage } from "@/lib/image/download";
import { validateImageMimeType } from "@/lib/image/format";
import { aspectPresets, centeredCrop, constrainCrop, type AspectPreset, type CropField, type CropRegion } from "@/lib/image/crop-geometry";
import CropPreview from "./CropPreview";
import CropSettings from "./CropSettings";

type UploadedImage = { file: File; url: string; width: number; height: number };

export default function CropTool() {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [crop, setCrop] = useState<CropRegion | null>(null);
  const [preset, setPreset] = useState<AspectPreset>("free");
  const [drafts, setDrafts] = useState<Partial<Record<CropField, string>>>({});
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const requestId = useRef(0);
  const busy = uploading || processing;
  const aspect = aspectPresets.find((item) => item.value === preset)?.ratio;
  const invalid = Object.keys(drafts).length > 0;

  useEffect(() => () => { if (image) URL.revokeObjectURL(image.url); }, [image]);
  useEffect(() => () => { requestId.current += 1; }, []);

  function clearFeedback() { setError(""); setFeedback(""); }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const request = ++requestId.current;
    setUploading(true);
    clearFeedback();
    try {
      validateImageMimeType(file.type);
      const bitmap = await createImageBitmap(file);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      if (request !== requestId.current) return;
      if (!size.width || !size.height) throw new Error("This image has invalid dimensions.");
      setImage({ file, url: URL.createObjectURL(file), ...size });
      setCrop(centeredCrop(size));
      setPreset("free");
      setDrafts({});
    } catch (err) {
      if (request === requestId.current) setError(err instanceof Error ? err.message : "Could not open this image. Select a PNG, JPEG, or WebP image.");
    } finally {
      if (request === requestId.current) setUploading(false);
    }
  }

  function updateSelection(next: CropRegion) {
    if (!image || busy) return;
    clearFeedback();
    setCrop(constrainCrop(next, image));
    setDrafts({});
  }

  function changeField(field: CropField, raw: string) {
    if (!image || !crop) return;
    clearFeedback();
    const value = raw.trim() === "" ? NaN : Number(raw);
    const minimum = field === "x" || field === "y" ? 0 : 1;
    if (!Number.isSafeInteger(value) || value < minimum) {
      setDrafts((current) => ({ ...current, [field]: raw }));
      return;
    }
    setDrafts((current) => { const next = { ...current }; delete next[field]; return next; });
    setCrop(constrainCrop({ ...crop, [field]: value }, image, aspect, field === "height" ? "height" : "width"));
  }

  function changePreset(value: AspectPreset) {
    if (!image || !crop) return;
    clearFeedback();
    const ratio = aspectPresets.find((item) => item.value === value)?.ratio;
    setPreset(value);
    setCrop(constrainCrop(crop, image, ratio));
    setDrafts({});
  }

  function centerSelection() {
    if (!image) return;
    clearFeedback();
    setCrop(centeredCrop(image, aspect));
    setDrafts({});
  }

  async function handleCrop() {
    if (!image || !crop || busy || invalid) return;
    setProcessing(true);
    clearFeedback();
    try {
      const blob = await cropImage(image.file, crop);
      downloadImage(blob, image.file.name);
      setFeedback(`Your ${crop.width} × ${crop.height} px crop is ready. Download started with the original filename and format.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop this image. Try another selection or image.");
    } finally { setProcessing(false); }
  }

  return (
    <div className="space-y-6" aria-busy={busy}>
      <label className={`relative flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line bg-white px-6 py-8 text-center transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${busy ? "opacity-60" : "cursor-pointer hover:border-primary"}`}>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-soft text-primary"><Upload size={24} aria-hidden="true" /></span>
        <span className="font-semibold">{uploading ? "Opening image…" : image ? "Choose another image" : "Select an image"}</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} disabled={busy} className="sr-only" />
      </label>
      {image && crop && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <CropPreview key={image.url} image={image} crop={crop} aspect={aspect} disabled={busy} onChange={updateSelection} onError={() => setError("Could not display this image. Choose another PNG, JPEG, or WebP file.")} />
        <div className="min-w-0 space-y-6 rounded-3xl border border-line bg-white p-5 sm:p-6">
          <CropSettings crop={crop} drafts={drafts} preset={preset} disabled={busy} onFieldChange={changeField} onPresetChange={changePreset} onReset={centerSelection} />
          <p className="rounded-xl bg-surface p-4 text-sm text-primary" role="status">{invalid ? "Correct the crop inputs before downloading." : `Output: ${crop.width} × ${crop.height} px`}</p>
          <button type="button" onClick={handleCrop} disabled={busy || invalid} className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{processing ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}{processing ? "Cropping…" : "Crop & Download"}</button>
        </div>
      </div>}
      {error && <p role="alert" className="rounded-xl border border-error/20 bg-white p-4 text-sm text-error">{error}</p>}
      <p role="status" className="text-center text-sm text-primary">{feedback}</p>
    </div>
  );
}
