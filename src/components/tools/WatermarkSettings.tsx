import { watermarkFonts, type WatermarkOptions } from "@/lib/image/watermark";
import type { ChangeEvent } from "react";

export type NumericWatermarkField = "fontSize" | "logoWidth" | "x" | "y" | "angle";
type Props = {
  options: WatermarkOptions; drafts: Partial<Record<NumericWatermarkField, string>>; disabled: boolean; hasLogo: boolean;
  onChange: (options: WatermarkOptions) => void; onNumber: (field: NumericWatermarkField, value: string) => void;
  onLogo: (event: ChangeEvent<HTMLInputElement>) => void; onPosition: (column: number, row: number) => void;
  onReset: () => void; onRemove: () => void;
};
const positions = ["Top left", "Top center", "Top right", "Middle left", "Center", "Middle right", "Bottom left", "Bottom center", "Bottom right"];

export default function WatermarkSettings({ options, drafts, disabled, hasLogo, onChange, onNumber, onLogo, onPosition, onReset, onRemove }: Props) {
  function numberField(field: NumericWatermarkField, label: string, min: number, max?: number) {
    return <div><label htmlFor={`watermark-${field}`} className="mb-2 block text-sm font-medium">{label}</label><input id={`watermark-${field}`} type="number" min={min} max={max} step="any" value={drafts[field] ?? Number(options[field].toFixed(2))} onChange={(event) => onNumber(field, event.target.value)} aria-invalid={drafts[field] !== undefined} aria-describedby={drafts[field] !== undefined ? `watermark-${field}-error` : undefined} className="min-h-11 w-full rounded-xl border border-line bg-white p-3 aria-invalid:border-error" />{drafts[field] !== undefined && <p id={`watermark-${field}-error`} className="mt-1 text-xs text-error">Enter a number from {min}{max !== undefined ? ` to ${max}` : " or greater"}.</p>}</div>;
  }
  return <fieldset disabled={disabled} className="min-w-0 space-y-5 disabled:opacity-60">
    <legend className="mb-4 text-lg font-semibold">Watermark settings</legend>
    <div role="group" aria-label="Watermark type" className="grid grid-cols-2 gap-2">{(["text", "image"] as const).map((kind) => <button key={kind} type="button" aria-pressed={options.kind === kind} onClick={() => onChange({ ...options, kind, enabled: true })} className="rotation-button justify-center aria-pressed:border-primary aria-pressed:bg-soft">{kind === "text" ? "Text" : "Image / logo"}</button>)}</div>
    {options.kind === "text" ? <>
      <div><label htmlFor="watermark-text" className="mb-2 block text-sm font-medium">Watermark text</label><textarea id="watermark-text" rows={2} value={options.text} onChange={(event) => onChange({ ...options, text: event.target.value, enabled: true })} className="w-full rounded-xl border border-line p-3" />{options.enabled && !options.text.trim() && <p className="mt-1 text-xs text-error">Enter text or remove the watermark.</p>}</div>
      <div><label htmlFor="watermark-font" className="mb-2 block text-sm font-medium">Font family</label><select id="watermark-font" value={options.fontFamily} onChange={(event) => onChange({ ...options, fontFamily: event.target.value })} className="min-h-11 w-full rounded-xl border border-line bg-white p-3">{watermarkFonts.map((font) => <option key={font}>{font}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">{numberField("fontSize", "Font size (px)", 1)}<div><label htmlFor="watermark-color" className="mb-2 block text-sm font-medium">Text color</label><input id="watermark-color" type="color" value={options.color} onChange={(event) => onChange({ ...options, color: event.target.value })} className="h-12 w-full rounded-xl border border-line bg-white p-1" /></div></div>
      <div className="flex flex-wrap gap-5"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={options.bold} onChange={(event) => onChange({ ...options, bold: event.target.checked })} className="accent-primary" />Bold</label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={options.italic} onChange={(event) => onChange({ ...options, italic: event.target.checked })} className="accent-primary" />Italic</label></div>
    </> : <>
      <label className="block rounded-xl border border-dashed border-line p-4 text-sm focus-within:ring-2 focus-within:ring-primary"><span className="mb-2 block font-medium">{hasLogo ? "Replace logo" : "Upload logo"}</span><input aria-label="Upload watermark logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogo} className="block w-full min-w-0 text-xs" /><span className="mt-2 block text-xs text-muted">PNG, JPEG, or WebP. Transparent logos are supported.</span></label>
      {numberField("logoWidth", "Logo width (px)", 1)}<p className="text-xs text-muted">Logo height scales proportionally.</p>
    </>}
    <div><label htmlFor="watermark-opacity" className="block text-sm font-medium">Opacity: {Math.round(options.opacity * 100)}%</label><input id="watermark-opacity" type="range" min={0} max={100} value={Math.round(options.opacity * 100)} onChange={(event) => onChange({ ...options, opacity: Number(event.target.value) / 100 })} className="min-h-11 w-full accent-primary" /></div>
    {numberField("angle", "Rotation (°)", -180, 180)}
    <div className="grid grid-cols-2 gap-3">{numberField("x", "Center X (px)", 0)}{numberField("y", "Center Y (px)", 0)}</div>
    <fieldset><legend className="mb-2 text-sm font-medium">Quick position</legend><div className="grid grid-cols-3 gap-2">{positions.map((label, index) => <button key={label} type="button" aria-label={`Position ${label.toLowerCase()}`} title={label} onClick={() => onPosition(index % 3, Math.floor(index / 3))} className="rotation-button justify-center px-2 text-xs">{label}</button>)}</div></fieldset>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={options.tiled} onChange={(event) => onChange({ ...options, tiled: event.target.checked })} className="accent-primary" />Repeat / tile watermark</label>
    <p className="text-xs leading-5 text-muted">In tiled mode, dragging moves the repeated pattern. Watermarks extending beyond the image edges are clipped.</p>
    <div className="grid gap-2"><button type="button" onClick={onReset} className="rotation-button justify-center">Reset watermark</button><button type="button" onClick={onRemove} className="rotation-button justify-center">Remove watermark</button></div>
  </fieldset>;
}
