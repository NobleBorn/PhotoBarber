import Image from "next/image";
import type { ReactNode } from "react";
type Props = { src: string; alt: string; width: number; height: number; caption: ReactNode };
export default function ImagePreview({ src, alt, width, height, caption }: Props) {
  return <figure className="min-w-0"><div className="transparency-grid flex min-h-40 items-center justify-center overflow-hidden rounded-2xl p-2"><Image src={src} alt={alt} width={width} height={height} unoptimized className="h-auto max-h-80 w-auto max-w-full object-contain" /></div><figcaption className="mt-3 break-words text-center text-xs leading-5 text-muted">{caption}</figcaption></figure>;
}
