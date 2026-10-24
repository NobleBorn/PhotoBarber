import Link from "next/link";
import { Scissors } from "lucide-react";

export default function Brand() {
  return (
    <Link href="/" aria-label="PhotoBarber home" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white"><Scissors size={21} aria-hidden="true" /></span>
      PhotoBarber
    </Link>
  );
}
