import { reductions, parseDimension, type Dimension, type PixelInputs, type Reduction } from "@/lib/image/resize-dimensions";

export type ResizeMode = "pixels" | "percentage";

type Props = {
  mode: ResizeMode;
  inputs: PixelInputs;
  keepRatio: boolean;
  reduction: Reduction | null;
  disabled: boolean;
  onModeChange: (mode: ResizeMode) => void;
  onDimensionChange: (axis: Dimension, value: string) => void;
  onKeepRatioChange: (checked: boolean) => void;
  onReductionChange: (reduction: Reduction) => void;
};

export default function ResizeSettings({ mode, inputs, keepRatio, reduction, disabled, onModeChange, onDimensionChange, onKeepRatioChange, onReductionChange }: Props) {
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-6 disabled:opacity-60">
      <legend className="mb-4 text-lg font-semibold">Resize settings</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Resize mode">
        {([ ["pixels", "Pixels (px)"], ["percentage", "Percentage (%)"] ] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => onModeChange(value)} className={`min-h-11 flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${mode === value ? "border-primary bg-primary text-white" : "border-line bg-white hover:bg-surface"}`}>{label}</button>
        ))}
      </div>
      {mode === "pixels" ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {(["width", "height"] as const).map((axis) => {
              const invalid = parseDimension(inputs[axis]) === null;
              return (
                <div key={axis}>
                  <label htmlFor={`resize-${axis}`} className="mb-2 block text-sm font-medium">{axis === "width" ? "Width" : "Height"} (px)</label>
                  <input id={`resize-${axis}`} type="number" min="1" step="1" value={inputs[axis]} onChange={(event) => onDimensionChange(axis, event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? `resize-${axis}-error` : undefined} className="min-h-11 w-full rounded-xl border border-line bg-white p-3 text-base aria-invalid:border-error" />
                  {invalid && <p id={`resize-${axis}-error`} className="mt-2 text-xs text-error">Enter a positive whole number of pixels.</p>}
                </div>
              );
            })}
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={keepRatio} onChange={(event) => onKeepRatioChange(event.target.checked)} className="size-4 accent-primary" />Keep aspect ratio</label>
        </>
      ) : (
        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium">Reduce from the original size</legend>
          <div className="grid gap-2">
            {reductions.map((value) => <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm ${reduction === value ? "border-primary bg-soft/40 text-primary" : "border-line bg-white hover:bg-surface"}`}><input type="radio" name="resize-reduction" value={value} checked={reduction === value} onChange={() => onReductionChange(value)} className="accent-primary" />{value}% smaller</label>)}
          </div>
          <p className="text-xs leading-5 text-muted">Aspect ratio is always preserved, rounded to the nearest pixel (minimum 1 px).{reduction === null && " Your pixel settings are unchanged. Choose a reduction to apply it."}</p>
        </fieldset>
      )}
    </fieldset>
  );
}
