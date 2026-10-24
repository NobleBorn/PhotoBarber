"use client";
import { useEffect, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import { Download, RotateCcw } from "lucide-react";
import { buildPayload, initialFields, validateColors, type QRFields, type QRType } from "@/lib/qr/payload";
import { initialStyle, renderQR, type QRStyle } from "@/lib/qr/render";
import { downloadImage } from "@/lib/image/download";
const inputClass = "min-h-11 w-full rounded-xl border border-line bg-white p-3";
export default function QRCodeTool() {
  const [fields, setFields] = useState<QRFields>(initialFields), [style, setStyle] = useState<QRStyle>(initialStyle);
  const [error, setError] = useState(""), [ready, setReady] = useState(false), [exporting, setExporting] = useState(false);
  const preview = useRef<HTMLDivElement>(null), code = useRef<QRCodeStyling | null>(null);
  const current = useRef(0);
  function changeFields(next: Partial<QRFields>) { setReady(false); setFields((old) => ({ ...old, ...next })); }
  function changeStyle(next: Partial<QRStyle>) { setReady(false); setStyle((old) => ({ ...old, ...next })); }
  useEffect(() => {
    const version = ++current.current;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const payload = buildPayload(fields); validateColors(style.foreground, style.background);
        const next = await renderQR(payload, style);
        if (!active || version !== current.current) return;
        preview.current?.replaceChildren(); if (preview.current) next.append(preview.current);
        code.current = next; setError(""); setReady(true);
      } catch (err) {
        if (!active) return;
        code.current = null; preview.current?.replaceChildren(); setReady(false);
        setError(err instanceof Error && !/overflow|too long/i.test(err.message) ? err.message : "This content exceeds QR capacity at the selected correction level. Shorten it or choose a lower level.");
      }
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [fields, style]);
  async function download(extension: "png" | "svg") {
    if (!code.current || !ready) return;
    setExporting(true);
    try { const blob = await code.current.getRawData(extension); if (!(blob instanceof Blob)) throw new Error("The browser could not export this QR code."); downloadImage(blob, `photobarber-qr.${extension}`); }
    catch (err) { setError(err instanceof Error ? err.message : "Export failed. Try a smaller output size."); }
    finally { setExporting(false); }
  }
  function reset() { setReady(false); setError(""); setFields({ ...initialFields }); setStyle({ ...initialStyle }); }
  return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
    <section aria-label="QR code preview" className="min-w-0 rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-6">
      <h2 className="mb-5 text-lg font-semibold">Live preview</h2>
      <div role="img" aria-label={ready ? "Generated QR code. Download and test with your scanner." : "QR preview updating or unavailable"} className={`mx-auto aspect-square max-w-md overflow-hidden rounded-xl [&_svg]:h-full [&_svg]:w-full ${ready ? "" : "opacity-30"}`} ref={preview} />
      <p role="status" className="mt-4 text-sm text-muted">{ready ? `${style.size} × ${style.size} px · Error correction ${style.correction}` : "Update the fields to generate a valid code."}</p>
      <div className="mt-5 flex flex-wrap gap-3">{(["png", "svg"] as const).map((ext) => <button key={ext} disabled={!ready || exporting} onClick={() => download(ext)} className="button-primary disabled:opacity-50"><Download size={17} aria-hidden="true" />{exporting ? "Exporting…" : `Download ${ext.toUpperCase()}`}</button>)}</div>
      <p className="mt-5 text-sm leading-6 text-muted">Keep the blank border intact. Low contrast and excessive customization can make codes unreadable. Long content needs a larger output size. Always test the downloaded code on multiple devices before sharing or printing. Wi-Fi credentials are stored visibly in the QR code; share carefully.</p>
    </section>
    <section aria-label="QR settings" className="min-w-0 space-y-5 rounded-3xl border border-line bg-white p-5 sm:p-6">
      <label className="block space-y-2 text-sm font-medium"><span>QR type</span><select aria-label="QR type" className={inputClass} value={fields.type} onChange={(e) => changeFields({ type: e.target.value as QRType, value: "" })}>{["url", "text", "wifi", "email", "phone"].map((type) => <option key={type} value={type}>{({ url: "URL", text: "Plain text", wifi: "Wi-Fi", email: "Email", phone: "Phone" })[type]}</option>)}</select></label>
      {fields.type !== "wifi" && <label className="block space-y-2 text-sm font-medium"><span>{({ url: "Website URL", text: "Text", email: "Email address", phone: "Phone number" })[fields.type]}</span><textarea rows={fields.type === "text" ? 4 : 2} className={inputClass} value={fields.value} onChange={(e) => changeFields({ value: e.target.value })} spellCheck={false} /></label>}
      {fields.type === "wifi" && <>
        <label className="block space-y-2 text-sm font-medium"><span>Network name (SSID)</span><input className={inputClass} value={fields.ssid} onChange={(e) => changeFields({ ssid: e.target.value })} /></label>
        <label className="block space-y-2 text-sm font-medium"><span>Encryption</span><select aria-label="Encryption" className={inputClass} value={fields.encryption} onChange={(e) => changeFields({ encryption: e.target.value as QRFields["encryption"] })}><option value="WPA">WPA / WPA2 / WPA3 personal</option><option value="WEP">WEP</option><option value="nopass">None (open network)</option></select></label>
        {fields.encryption !== "nopass" && <label className="block space-y-2 text-sm font-medium"><span>Wi-Fi password</span><input type="password" autoComplete="off" className={inputClass} value={fields.password} onChange={(e) => changeFields({ password: e.target.value })} /></label>}
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={fields.hidden} onChange={(e) => changeFields({ hidden: e.target.checked })} className="size-4 accent-primary" />Hidden network</label>
      </>}
      {fields.type === "email" && <>{(["subject", "body"] as const).map((key) => <label key={key} className="block space-y-2 text-sm font-medium"><span>{key === "subject" ? "Subject (optional)" : "Body (optional)"}</span><textarea className={inputClass} value={fields[key]} onChange={(e) => changeFields({ [key]: e.target.value })} /></label>)}</>}
      <fieldset className="space-y-4 border-t border-line pt-5"><legend className="font-semibold">Appearance</legend>
        <div className="grid grid-cols-2 gap-4">{(["foreground", "background"] as const).map((key) => <label key={key} className="space-y-2 text-sm"><span className="block capitalize">{key}</span><input aria-label={key === "foreground" ? "Foreground" : "Background"} type="color" className="h-11 w-full rounded-lg border border-line bg-white p-1" value={style[key]} onChange={(e) => changeStyle({ [key]: e.target.value })} /></label>)}</div>
        <label className="block space-y-2 text-sm"><span>Dot pattern</span><select aria-label="Dot pattern" className={inputClass} value={style.dots} onChange={(e) => changeStyle({ dots: e.target.value as QRStyle["dots"] })}>{["square", "rounded", "dots", "classy", "classy-rounded", "extra-rounded"].map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="block space-y-2 text-sm"><span>Corner style</span><select aria-label="Corner style" className={inputClass} value={style.corners} onChange={(e) => changeStyle({ corners: e.target.value as QRStyle["corners"] })}>{["square", "dot", "extra-rounded"].map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="block space-y-2 text-sm"><span>Output size</span><select aria-label="Output size" className={inputClass} value={style.size} onChange={(e) => changeStyle({ size: Number(e.target.value) })}>{[256, 512, 1024].map((size) => <option key={size} value={size}>{size} px</option>)}</select></label>
        <label className="block space-y-2 text-sm"><span>Error correction</span><select aria-label="Error correction" className={inputClass} value={style.correction} onChange={(e) => changeStyle({ correction: e.target.value as QRStyle["correction"] })}>{["L", "M", "Q", "H"].map((v) => <option key={v}>{v}</option>)}</select></label>
      </fieldset>
      <button onClick={reset} className="rotation-button flex items-center gap-2"><RotateCcw size={16} aria-hidden="true" />Reset</button>
      {error && <p role="alert" className="rounded-xl border border-error/20 p-3 text-sm text-error">{error}</p>}
      <p className="text-xs leading-5 text-muted">Everything stays in this browser. No data is uploaded or stored.</p>
    </section>
  </div>;
}
