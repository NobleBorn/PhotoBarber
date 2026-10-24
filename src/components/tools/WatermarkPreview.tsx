import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import { renderWatermark, type MarkSize, type WatermarkOptions } from "@/lib/image/watermark";
import { normalizeAngle } from "@/lib/image/rotate";

type Props = { source: ImageBitmap; logo?: ImageBitmap; options: WatermarkOptions; disabled: boolean; onChange: (options: WatermarkOptions) => void; onSize: (size: MarkSize) => void; onError: (error: string) => void };
type Action = "move" | "rotate" | "nw" | "ne" | "sw" | "se";
const corners = ["nw", "ne", "sw", "se"] as const;

export default function WatermarkPreview({ source, logo, options, disabled, onChange, onSize, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null), stageRef = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<MarkSize>({ width: 1, height: 1 });
  const gesture = useRef<{ id: number; action: Action; x: number; y: number; options: WatermarkOptions; size: MarkSize } | null>(null);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!canvasRef.current || !stageRef.current) return;
        try {
          const scale = Math.min(1, stageRef.current.clientWidth / source.width);
          const size = renderWatermark(canvasRef.current, source, options, logo, scale);
          setMark((old) => old.width === size.width && old.height === size.height ? old : size);
          onSize(size);
        } catch (error) { onError(error instanceof Error ? error.message : "Could not draw the preview."); }
      });
    };
    const observer = new ResizeObserver(draw);
    if (stageRef.current) observer.observe(stageRef.current);
    draw();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [source, logo, options, onSize, onError]);
  function point(event: PointerEvent) {
    const rect = stageRef.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * source.width / rect.width, y: (event.clientY - rect.top) * source.height / rect.height };
  }
  function start(event: PointerEvent<HTMLElement>, action: Action) {
    if (disabled || event.button !== 0) return;
    event.stopPropagation(); event.preventDefault();
    const p = point(event);
    gesture.current = { id: event.pointerId, action, ...p, options: { ...options }, size: mark };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLElement>) {
    const initial = gesture.current;
    if (!initial || event.pointerId !== initial.id || disabled) return;
    const p = point(event), original = initial.options;
    if (initial.action === "move") onChange({ ...original, x: Math.max(0, Math.min(source.width, original.x + p.x - initial.x)), y: Math.max(0, Math.min(source.height, original.y + p.y - initial.y)) });
    else if (initial.action === "rotate") {
      const startAngle = Math.atan2(initial.y - original.y, initial.x - original.x);
      onChange({ ...original, angle: normalizeAngle(original.angle + (Math.atan2(p.y - original.y, p.x - original.x) - startAngle) * 180 / Math.PI) });
    } else {
      const rad = -original.angle * Math.PI / 180;
      const dx = p.x - initial.x, dy = p.y - initial.y;
      const localX = dx * Math.cos(rad) - dy * Math.sin(rad), localY = dx * Math.sin(rad) + dy * Math.cos(rad);
      const cx = initial.size.width / 2 * (initial.action.includes("w") ? -1 : 1), cy = initial.size.height / 2 * (initial.action.includes("n") ? -1 : 1);
      const factor = Math.max(0.01, 1 + (localX * cx + localY * cy) / (cx * cx + cy * cy));
      onChange({ ...original, fontSize: Math.max(1, original.fontSize * factor), logoWidth: Math.max(1, original.logoWidth * factor) });
    }
  }
  function end(event: PointerEvent<HTMLElement>) { if (gesture.current?.id === event.pointerId) gesture.current = null; }
  function keyboard(event: KeyboardEvent<HTMLElement>, action: Action) {
    if (disabled || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const amount = event.shiftKey ? 10 : 1;
    if (action === "move") onChange({ ...options, x: Math.max(0, Math.min(source.width, options.x + (event.key === "ArrowRight" ? amount : event.key === "ArrowLeft" ? -amount : 0))), y: Math.max(0, Math.min(source.height, options.y + (event.key === "ArrowDown" ? amount : event.key === "ArrowUp" ? -amount : 0))) });
    else if (action === "rotate") onChange({ ...options, angle: normalizeAngle(options.angle + (["ArrowRight", "ArrowUp"].includes(event.key) ? amount : -amount)) });
    else { const factor = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1.05 : 1 / 1.05; onChange({ ...options, fontSize: Math.max(1, options.fontSize * factor), logoWidth: Math.max(1, options.logoWidth * factor) }); }
  }
  return <div className="min-w-0 rounded-3xl border border-line bg-white p-4 sm:p-6 lg:sticky lg:top-6">
    <div className="overflow-hidden rounded-2xl bg-surface p-4">
      <div ref={stageRef} className="transparency-grid relative mx-auto w-full" style={{ maxWidth: Math.min(source.width, source.width / source.height * 600), aspectRatio: `${source.width}/${source.height}` }}>
        <canvas ref={canvasRef} role="img" aria-label="Live watermark preview" className="block h-full w-full" />
        {options.enabled && (options.kind === "text" || logo) && <div role="group" tabIndex={disabled ? -1 : 0} aria-label="Move watermark with arrow keys" onPointerDown={(event) => start(event, "move")} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onKeyDown={(event) => keyboard(event, "move")} className="absolute touch-none border border-white outline outline-1 outline-primary" style={{ left: `${options.x / source.width * 100}%`, top: `${options.y / source.height * 100}%`, width: `${mark.width / source.width * 100}%`, height: `${mark.height / source.height * 100}%`, transform: `translate(-50%, -50%) rotate(${options.angle}deg)`, cursor: disabled ? "default" : "move" }}>
          {corners.map((corner) => <button type="button" key={corner} aria-label={`Resize watermark ${corner}`} disabled={disabled} onPointerDown={(event) => start(event, corner)} onKeyDown={(event) => keyboard(event, corner)} className="absolute size-6 touch-none rounded border border-white bg-primary" style={{ left: corner.includes("w") ? 0 : "100%", top: corner.includes("n") ? 0 : "100%", transform: "translate(-50%,-50%)" }} />)}
          <button type="button" aria-label="Rotate watermark handle" disabled={disabled} onPointerDown={(event) => start(event, "rotate")} onKeyDown={(event) => keyboard(event, "rotate")} className="absolute -top-8 left-1/2 size-6 -translate-x-1/2 touch-none rounded-full border-2 border-white bg-primary" />
        </div>}
      </div>
    </div>
    <p className="mt-4 text-center text-xs leading-5 text-muted">Drag to move. Corners resize proportionally; the round handle rotates. Arrow keys adjust focused controls; Shift moves by 10 pixels. Position and size use original image pixels.</p>
  </div>;
}
