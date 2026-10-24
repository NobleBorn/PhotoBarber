"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { downloadImage } from "@/lib/image/download";
import { decodeRotationImage, defaultRotation, normalizeAngle, rotateImage, rotationDimensions, type RotationOptions } from "@/lib/image/rotate";
import RotatePreview from "./RotatePreview";
import RotateSettings from "./RotateSettings";

type UploadedImage = { file: File; bitmap: ImageBitmap };

export default function RotateTool() {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [options, setOptions] = useState<RotationOptions>({ ...defaultRotation });
  const [angleInput, setAngleInput] = useState("0");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const requestId = useRef(0);
  const busy = uploading || processing;
  const parsedAngle = angleInput.trim() === "" ? NaN : Number(angleInput);
  const invalidAngle = !Number.isFinite(parsedAngle) || parsedAngle < -180 || parsedAngle > 180;
  const output = image ? rotationDimensions(image.bitmap, options.angle) : null;
  const reportPreviewError = useCallback((message: string) => setError(message), []);

  useEffect(() => () => { image?.bitmap.close(); }, [image]);
  useEffect(() => () => { requestId.current++; }, []);

  function clearFeedback() { setError(""); setFeedback(""); }
  function reset() { setOptions({ ...defaultRotation }); setAngleInput("0"); clearFeedback(); }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const request = ++requestId.current;
    setUploading(true);
    clearFeedback();
    try {
      const bitmap = await decodeRotationImage(file);
      if (request !== requestId.current) { bitmap.close(); return; }
      if (!bitmap.width || !bitmap.height) { bitmap.close(); throw new Error("This image has invalid dimensions."); }
      setImage({ file, bitmap });
      reset();
    } catch (err) {
      if (request === requestId.current) setError(err instanceof Error ? err.message : "Could not open this image. Choose a PNG, JPEG, or WebP file.");
    } finally { if (request === requestId.current) setUploading(false); }
  }

  function changeAngle(raw: string) {
    setAngleInput(raw);
    clearFeedback();
    const value = raw.trim() === "" ? NaN : Number(raw);
    if (Number.isFinite(value) && value >= -180 && value <= 180) setOptions((current) => ({ ...current, angle: value }));
  }

  function turn(degrees: number) {
    const angle = normalizeAngle(options.angle + degrees);
    setOptions((current) => ({ ...current, angle }));
    setAngleInput(String(angle));
    clearFeedback();
  }

  function changeOptions(next: RotationOptions) { setOptions(next); clearFeedback(); }

  async function handleDownload() {
    if (!image || busy || invalidAngle || !output) return;
    setProcessing(true);
    clearFeedback();
    try {
      const blob = await rotateImage(image.bitmap, options, image.file.type);
      downloadImage(blob, image.file.name);
      setFeedback(`Your ${output.width} × ${output.height} px image is ready. Download started with the original filename and format.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not transform this image. Try another image or angle.");
    } finally { setProcessing(false); }
  }

  return (
    <div className="space-y-6" aria-busy={busy}>
      <label className={`relative flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line bg-white px-6 py-8 text-center transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${busy ? "opacity-60" : "cursor-pointer hover:border-primary"}`}>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-soft text-primary"><Upload size={24} aria-hidden="true" /></span>
        <span className="font-semibold">{uploading ? "Opening image…" : image ? "Choose another image" : "Select an image"}</span>
        <span className="text-sm text-muted">PNG, JPEG, or WebP · Your image stays on your device</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} disabled={busy} className="sr-only" />
      </label>
      {image && output && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <RotatePreview source={image.bitmap} filename={image.file.name} mimeType={image.file.type} options={options} onError={reportPreviewError} />
        <div className="min-w-0 space-y-6 rounded-3xl border border-line bg-white p-5 sm:p-6">
          <RotateSettings options={options} angleInput={angleInput} invalidAngle={invalidAngle} disabled={busy} jpeg={image.file.type === "image/jpeg"} onAngleChange={changeAngle} onTurn={turn} onOptionsChange={changeOptions} onReset={reset} />
          <p role="status" className="rounded-xl bg-surface p-4 text-sm text-primary">{invalidAngle ? "Correct the angle before downloading." : `Output: ${output.width} × ${output.height} px`}</p>
          <button type="button" onClick={handleDownload} disabled={busy || invalidAngle} className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{processing ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}{processing ? "Processing…" : "Download Image"}</button>
        </div>
      </div>}
      {error && <p role="alert" className="rounded-xl border border-error/20 bg-white p-4 text-sm text-error">{error}</p>}
      <p role="status" className="text-center text-sm text-primary">{feedback}</p>
    </div>
  );
}
