"use client";

import { useState } from "react";
import { Grid2X2 } from "lucide-react";
import { categories, tools, type CategoryFilter } from "@/lib/tools/catalog";
import ToolsGrid from "./ToolsGrid";

export default function ToolDirectory({ initialCategory = "all" }: { initialCategory?: CategoryFilter }) {
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const visibleTools = tools.filter((tool) => category === "all" || tool.category === category);

  return (
    <div>
      <div id="tools" className="scroll-mt-6 border-y border-line bg-white/40">
        <div className="site-container">
          <div role="group" aria-label="Filter tools by category" className="flex gap-2 overflow-x-auto px-1 py-5 xl:justify-center">
            {[{ id: "all", title: "All Tools", icon: Grid2X2 }, ...categories].map(({ id, title, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={category === id} aria-controls="tool-results" onClick={() => setCategory(id as CategoryFilter)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${category === id ? "border-primary bg-primary text-white shadow-sm" : "border-line bg-white text-muted hover:border-primary/40 hover:text-primary"}`}><Icon size={16} aria-hidden="true" />{title}</button>
            ))}
          </div>
        </div>
      </div>
      <div id="tool-results" className="site-container py-8 sm:py-10">
        <ToolsGrid tools={visibleTools} category={category === "all" ? undefined : category} />
      </div>
    </div>
  );
}
