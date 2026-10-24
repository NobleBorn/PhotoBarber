import { categories, type CategoryId, type Tool } from "@/lib/tools/catalog";
import ToolCard from "./ToolCard";

type Props = { tools: Tool[]; category?: CategoryId };

export default function ToolsGrid({ tools, category }: Props) {
  const group = categories.find((item) => item.id === category);
  return (
    <section aria-labelledby={group ? `${category}-heading` : undefined} aria-label={group ? undefined : "All tools"} className="scroll-mt-8">
      {group && <div className="mb-5 flex items-center justify-between gap-4">
        <div className="border-l-[3px] border-primary pl-4"><h2 id={`${category}-heading`} className="text-xl font-semibold tracking-tight sm:text-2xl">{group.title}</h2><p className="mt-1 text-sm text-muted">{group.description}</p></div>
        <span className="shrink-0 rounded-full border border-line bg-white px-3 py-1 text-xs text-muted">{tools.length} {tools.length === 1 ? "tool" : "tools"}</span>
      </div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div>
    </section>
  );
}
