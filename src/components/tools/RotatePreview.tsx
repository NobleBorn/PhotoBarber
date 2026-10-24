import { useEffect, useRef } from "react";
import { drawRotatedImage, rotationDimensions, type RotationOptions } from "@/lib/image/rotate";

type Props = { source: ImageBitmap; filename: string; mimeType: string; options: RotationOptions; onError: (message: string) => void };

export default function RotatePreview({ source, filename, mimeType, options, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        try {
          const output = rotationDimensions(source, options.angle);
          // Bound only the preview buffer, never the source image or export size.
          const scale = Math.min(1, Math.max(1, container.clientWidth) / output.width, 600 / output.height);
          drawRotatedImage(canvas, source, options, mimeType, scale);
        } catch (error) { onError(error instanceof Error ? error.message : "Could not draw the preview."); }
      });
    };
    const observer = new ResizeObserver(draw);
    if (containerRef.current) observer.observe(containerRef.current);
    draw();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [source, options, mimeType, onError]);
  return (
    <div className="min-w-0 rounded-3xl border border-line bg-white p-4 sm:p-6">
      <div ref={containerRef} className="transparency-grid flex min-h-48 items-center justify-center overflow-hidden rounded-2xl">
        <canvas ref={canvasRef} role="img" aria-label={`Live rotation preview of ${filename}`} className="block h-auto max-w-full" />
      </div>
      <p className="mt-4 truncate text-center text-sm text-muted">{filename}</p>
      <p className="mt-1 text-center text-xs text-muted">Original: {source.width} × {source.height} px</p>
      <p className="mt-4 text-center text-xs leading-5 text-muted">Preview fits your screen. Downloads use full resolution.{mimeType !== "image/jpeg" && " Checkerboard areas stay transparent."}</p>
    </div>
  );
}
