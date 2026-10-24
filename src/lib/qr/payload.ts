export type QRType = "url" | "text" | "wifi" | "email" | "phone";
export type QRFields = { type: QRType; value: string; ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass"; hidden: boolean; subject: string; body: string };
export const initialFields: QRFields = { type: "url", value: "https://photobarber.com", ssid: "", password: "", encryption: "WPA", hidden: false, subject: "", body: "" };
export function escapeWifi(value: string): string { return value.replace(/[\\;,:"']/g, "\\$&"); }
export function buildPayload(fields: QRFields): string {
  const value = fields.value.trim();
  switch (fields.type) {
    case "url": {
      try { const url = new URL(value); if (!["https:", "http:"].includes(url.protocol)) throw new Error(); }
      catch { throw new Error("Enter a complete HTTP or HTTPS URL, including https://."); }
      return value;
    }
    case "text": if (!value) throw new Error("Enter some text."); return fields.value;
    case "wifi":
      if (!fields.ssid.trim()) throw new Error("Enter the Wi-Fi network name.");
      if (fields.encryption !== "nopass" && !fields.password) throw new Error("Enter the network password, or select no encryption.");
      return `WIFI:T:${fields.encryption};S:${escapeWifi(fields.ssid)};P:${fields.encryption === "nopass" ? "" : escapeWifi(fields.password)};H:${fields.hidden};;`;
    case "email": {
      if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value)) throw new Error("Enter a valid email address.");
      const query = [fields.subject && `subject=${encodeURIComponent(fields.subject)}`, fields.body && `body=${encodeURIComponent(fields.body)}`].filter(Boolean).join("&");
      return `mailto:${value.split("@").map(encodeURIComponent).join("@")}${query ? `?${query}` : ""}`;
    }
    case "phone": {
      const phone = value.replace(/[\s().-]/g, "");
      if (!/^\+?\d+$/.test(phone)) throw new Error("Enter a phone number using digits and an optional leading +.");
      return `tel:${phone}`;
    }
  }
}
function luminance(hex: string): number {
  const rgb = hex.slice(1).match(/../g)!.map((v) => parseInt(v, 16) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
export function validateColors(foreground: string, background: string): void {
  const front = luminance(foreground), back = luminance(background);
  if (front >= back || (back + .05) / (front + .05) < 4.5) throw new Error("Choose a dark foreground and light background with at least 4.5:1 contrast.");
}
