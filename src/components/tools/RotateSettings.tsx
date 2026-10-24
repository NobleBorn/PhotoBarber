import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from "lucide-react";
import type { RotationOptions } from "@/lib/image/rotate";

type Props = {
  options: RotationOptions;
  angleInput: string;
  invalidAngle: boolean;
  disabled: boolean;
  jpeg: boolean;
  onAngleChange: (value: string) => void;
  onTurn: (degrees: number) => void;
  onOptionsChange: (options: RotationOptions) => void;
  onReset: () => void;
};

export default function RotateSettings({ options, angleInput, invalidAngle, disabled, jpeg, onAngleChange, onTurn, onOptionsChange, onReset }: Props) {
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-5 disabled:opacity-60">
      <legend className="mb-4 text-lg font-semibold">Rotate settings</legend>
      <div className="grid gap-2">
        <button type="button" onClick={() => onTurn(-90)} className="rotation-button"><RotateCcw size={18} aria-hidden="true" />Rotate Left 90°</button>
        <button type="button" onClick={() => onTurn(90)} className="rotation-button"><RotateCw size={18} aria-hidden="true" />Rotate Right 90°</button>
        <button type="button" onClick={() => onTurn(180)} className="rotation-button"><RotateCw size={18} aria-hidden="true" />Rotate 180°</button>
      </div>
      <div className="space-y-3">
        <label htmlFor="rotation-angle" className="block text-sm font-medium">Custom angle (°)</label>
        <input id="rotation-angle" type="number" min={-180} max={180} step="any" value={angleInput} onChange={(event) => onAngleChange(event.target.value)} aria-invalid={invalidAngle} aria-describedby="rotation-angle-help" className="min-h-11 w-full rounded-xl border border-line bg-white p-3 aria-invalid:border-error" />
        <input type="range" min={-180} max={180} step={0.1} value={options.angle} onChange={(event) => onAngleChange(event.target.value)} aria-label="Rotation angle" aria-valuetext={`${options.angle} degrees`} className="min-h-11 w-full accent-primary" />
        <p id="rotation-angle-help" className={`text-xs leading-5 ${invalidAngle ? "text-error" : "text-muted"}`}>{invalidAngle ? "Enter a number from −180° to 180°." : "Positive angles turn clockwise; negative angles turn counterclockwise."}</p>
      </div>
      <div className="grid gap-2">
        <button type="button" aria-pressed={options.flipHorizontal} onClick={() => onOptionsChange({ ...options, flipHorizontal: !options.flipHorizontal })} className="rotation-button aria-pressed:border-primary aria-pressed:bg-soft aria-pressed:text-primary"><FlipHorizontal2 size={18} aria-hidden="true" />Flip horizontally</button>
        <button type="button" aria-pressed={options.flipVertical} onClick={() => onOptionsChange({ ...options, flipVertical: !options.flipVertical })} className="rotation-button aria-pressed:border-primary aria-pressed:bg-soft aria-pressed:text-primary"><FlipVertical2 size={18} aria-hidden="true" />Flip vertically</button>
        <p className="text-xs leading-5 text-muted">Flips mirror the original image before rotation.</p>
      </div>
      {jpeg && <div><label htmlFor="rotation-background" className="mb-2 block text-sm font-medium">JPEG background color</label><div className="flex items-center gap-3"><input id="rotation-background" type="color" value={options.background} onChange={(event) => onOptionsChange({ ...options, background: event.target.value })} className="h-11 w-16 cursor-pointer rounded-lg border border-line bg-white p-1" /><span className="text-sm text-muted">{options.background.toUpperCase()}</span></div><p className="mt-2 text-xs leading-5 text-muted">Fills uncovered corners and transparent pixels when exporting JPEG.</p></div>}
      <button type="button" onClick={onReset} className="rotation-button justify-center">Reset</button>
    </fieldset>
  );
}
