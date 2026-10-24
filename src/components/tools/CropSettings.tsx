import { aspectPresets, type AspectPreset, type CropField, type CropRegion } from "@/lib/image/crop-geometry";

type Props = {
  crop: CropRegion;
  drafts: Partial<Record<CropField, string>>;
  preset: AspectPreset;
  disabled: boolean;
  onFieldChange: (field: CropField, value: string) => void;
  onPresetChange: (preset: AspectPreset) => void;
  onReset: () => void;
};

const fields = [ ["width", "Width"], ["height", "Height"], ["x", "Position X"], ["y", "Position Y"] ] as const;

export default function CropSettings({ crop, drafts, preset, disabled, onFieldChange, onPresetChange, onReset }: Props) {
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-5 disabled:opacity-60">
      <legend className="mb-4 text-lg font-semibold">Crop settings</legend>
      <div>
        <label htmlFor="crop-aspect" className="mb-2 block text-sm font-medium">Aspect ratio</label>
        <select id="crop-aspect" value={preset} onChange={(event) => onPresetChange(event.target.value as AspectPreset)} className="min-h-11 w-full rounded-xl border border-line bg-white p-3 text-sm">{aspectPresets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(([field, label]) => {
          const invalid = drafts[field] !== undefined;
          return <div key={field}><label htmlFor={`crop-${field}`} className="mb-2 block text-sm font-medium">{label} (px)</label><input id={`crop-${field}`} type="number" min={field === "x" || field === "y" ? 0 : 1} step={1} value={drafts[field] ?? crop[field]} onChange={(event) => onFieldChange(field, event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? `crop-${field}-error` : "crop-coordinates-help"} className="min-h-11 w-full rounded-xl border border-line bg-white p-3 aria-invalid:border-error" />{invalid && <p id={`crop-${field}-error`} className="mt-2 text-xs text-error">Enter a whole number {field === "x" || field === "y" ? "of 0 or more" : "greater than 0"}.</p>}</div>;
        })}
      </div>
      <button type="button" onClick={onReset} className="min-h-11 w-full rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-surface">Center selection</button>
    </fieldset>
  );
}
