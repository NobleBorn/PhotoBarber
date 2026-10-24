"use client";

import Image from "next/image";
import { downloadImage } from "@/lib/image/download";
import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { resizeImage, validateResizeMimeType } from "@/lib/image/resize";
import { matchingReduction, proportionalInputs, readDimensions, reducedDimensions, toPixelInputs, type Dimension, type PixelInputs, type Reduction } from "@/lib/image/resize-dimensions";
import ResizeSettings, { type ResizeMode } from "./ResizeSettings";

type UploadedImage = { file: File; url: string; width: number; height: number };

export default function ResizeTool() {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [inputs, setInputs] = useState<PixelInputs>({ width: "", height: "" });
  const [mode, setMode] = useState<ResizeMode>("pixels");
  const [keepRatio, setKeepRatio] = useState(true);
  const [reduction, setReduction] = useState<Reduction | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const lastEdited = useRef<Dimension>("width");
  const uploadRequest = useRef(0);
  const dimensions = readDimensions(inputs);
  const needsReduction = mode === "percentage" && reduction === null;
  const busy = loading || uploading;

  useEffect(() => {
    return () => { if (image) URL.revokeObjectURL(image.url); };
  }, [image]);

  useEffect(() => () => { uploadRequest.current += 1; }, []);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;
    const request = ++uploadRequest.current;
    setUploading(true);
    setError("");
    setFeedback("");
    try {
      validateResizeMimeType(selectedFile.type);
      const bitmap = await createImageBitmap(selectedFile);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      if (request !== uploadRequest.current) return;
      if (size.width <= 0 || size.height <= 0) throw new Error("Invalid image size");
      setImage({ file: selectedFile, url: URL.createObjectURL(selectedFile), ...size });
      setInputs(toPixelInputs(size));
      setMode("pixels");
      setKeepRatio(true);
      setReduction(null);
      lastEdited.current = "width";
    } catch (err) {
      if (request === uploadRequest.current) setError(err instanceof Error ? err.message : "Could not open this image. Select a supported JPG, PNG, or WebP file.");
    } finally {
      if (request === uploadRequest.current) setUploading(false);
    }
  }

  function clearFeedback() {
    setError("");
    setFeedback("");
  }

  function updateDimension(axis: Dimension, value: string) {
    clearFeedback();
    lastEdited.current = axis;
    setInputs((current) => {
      const next = { ...current, [axis]: value };
      return keepRatio && image ? proportionalInputs(next, axis, image) : next;
    });
  }

  function changeMode(next: ResizeMode) {
    clearFeedback();
    if (next === "percentage" && image) setReduction(matchingReduction(inputs, image));
    setMode(next);
  }

  function changeKeepRatio(checked: boolean) {
    clearFeedback();
    setKeepRatio(checked);
    if (checked && image) setInputs((current) => proportionalInputs(current, lastEdited.current, image));
  }

  function changeReduction(value: Reduction) {
    if (!image) return;
    clearFeedback();
    setReduction(value);
    setInputs(toPixelInputs(reducedDimensions(image, value)));
    setKeepRatio(true);
  }

  async function handleResize() {
    if (!image || busy) return;
    if (!dimensions || needsReduction) {
      setError(needsReduction ? "Choose a percentage reduction first." : "Enter positive whole-number dimensions before resizing.");
      return;
    }
    setLoading(true);
    clearFeedback();
    try {
      const blob = await resizeImage(image.file, dimensions);
      downloadImage(blob, image.file.name);
      setFeedback(`Your ${dimensions.width} × ${dimensions.height} px image is ready. Download started with its original filename and format.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed. Try smaller dimensions if your browser runs out of memory.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy={busy}>
      <label className={`relative flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line bg-white px-6 py-8 text-center transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${busy ? "opacity-60" : "cursor-pointer hover:border-primary"}`}>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-soft text-primary"><Upload size={24} aria-hidden="true" /></span>
        <span className="font-semibold">{uploading ? "Opening image…" : image ? "Choose another image" : "Select an image"}</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} disabled={busy} className="sr-only" />
      </label>
      {image && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 rounded-3xl border border-line bg-white p-5 sm:p-6">
            <div className="overflow-hidden rounded-2xl bg-surface p-4"><Image src={image.url} alt={`Preview of ${image.file.name}`} width={image.width} height={image.height} unoptimized className="mx-auto h-auto max-h-80 w-auto max-w-full object-contain" /></div>
            <p className="mt-4 truncate text-center text-sm text-muted">{image.file.name}</p>
            <p className="mt-1 text-center text-xs text-muted">Original: {image.width} × {image.height} px</p>
          </div>
          <div className="min-w-0 space-y-6 rounded-3xl border border-line bg-white p-5 sm:p-6">
            <ResizeSettings mode={mode} inputs={inputs} keepRatio={keepRatio} reduction={reduction} disabled={busy} onModeChange={changeMode} onDimensionChange={updateDimension} onKeepRatioChange={changeKeepRatio} onReductionChange={changeReduction} />
            <p className="rounded-xl bg-surface p-4 text-sm text-primary" role="status">{dimensions ? `${needsReduction ? "Current pixel settings" : "Output"}: ${dimensions.width} × ${dimensions.height} px` : "Enter valid dimensions to continue."}</p>
            <button type="button" onClick={handleResize} disabled={busy || !dimensions || needsReduction} className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{loading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}{loading ? "Processing…" : "Resize & Download"}</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="rounded-xl border border-error/20 bg-white p-4 text-sm text-error">{error}</p>}
      <p role="status" className="text-center text-sm text-primary">{feedback}</p>
    </div>
  );
}
