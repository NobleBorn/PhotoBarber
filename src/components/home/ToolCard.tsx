import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/lib/tools/catalog";

export default function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-soft text-primary"><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2"><h3 className="text-base font-semibold tracking-tight">{tool.title}</h3>{tool.href && <ArrowUpRight size={16} className="mt-1 shrink-0 text-primary" aria-hidden="true" />}</div>
        <p className="mt-1.5 text-sm leading-5 text-muted">{tool.description}</p>
        {!tool.href && <span className="mt-3 inline-block rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">Coming soon</span>}
      </div>
    </>
  );

  return tool.href ? (
    <Link href={tool.href} className="tool-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">{content}</Link>
  ) : <article className="tool-card">{content}</article>;
}
