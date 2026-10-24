import { Crop, Droplet, FileType, Maximize2, Minimize2, QrCode, RotateCw, SlidersHorizontal, type LucideIcon } from "lucide-react";

export const categories = [
  { id: "editing", title: "Editing & Resizing", description: "A better fit. A fresh perspective.", icon: SlidersHorizontal },
  { id: "compression", title: "Compression Tools", description: "Make space without losing the bigger picture.", icon: Minimize2 },
  { id: "converters", title: "Format Converters", description: "Find the right format for your next step.", icon: FileType },
  { id: "generators", title: "Generators", description: "Create something ready to share.", icon: QrCode },
] as const;

export type CategoryId = (typeof categories)[number]["id"];
export type CategoryFilter = CategoryId | "all";
export type Tool = {
  id: string;
  category: CategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
};

export const tools: Tool[] = [
  { id: "qr-code", category: "generators", title: "QR Code Generator", description: "Create QR codes for links, Wi-Fi, and more.", icon: QrCode, href: "/qr-code-generator" },
  { id: "resize", category: "editing", title: "Resize Image", description: "Change image dimensions to your perfect fit.", icon: Maximize2, href: "/resize_img" },
  { id: "crop", category: "editing", title: "Crop Image", description: "Trim the edges. Focus on what matters.", icon: Crop, href: "/crop_img" },
  { id: "rotate", category: "editing", title: "Rotate Image", description: "Give your photos a new perspective.", icon: RotateCw, href: "/rotate_img" },
  { id: "watermark", category: "editing", title: "Watermark Image", description: "Add your name, logo, or a personal touch.", icon: Droplet, href: "/watermark_img" },
  { id: "compress", category: "compression", title: "Compress Image", description: "Lighter images for sharing and saving.", icon: Minimize2, href: "/compress_img" },
  { id: "convert", category: "converters", title: "Convert Image", description: "Switch between JPG, PNG, and WebP.", icon: FileType, href: "/convert_img" },
];

export function isCategoryFilter(value: unknown): value is CategoryFilter {
  return value === "all" || categories.some((category) => category.id === value);
}
