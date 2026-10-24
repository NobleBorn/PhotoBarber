"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { tools } from "@/lib/tools/catalog";
import Brand from "./Brand";

export default function Navbar() {
  const menu = useRef<HTMLDetailsElement>(null);
  function closeMenu() { if (menu.current) menu.current.open = false; }
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) closeMenu();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        closeMenu(); menu.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  return (
    <header className="relative z-20 border-b border-line bg-white/80">
      <div className="site-container flex min-h-20 flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap">
        <Brand />
        <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-2 text-sm font-medium sm:gap-5">
          <Link onClick={closeMenu} href="/" className="rounded-lg px-2 py-3 text-muted transition hover:text-primary">Home</Link>
          <details ref={menu} className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 text-primary transition hover:bg-surface group-open:bg-surface [&::-webkit-details-marker]:hidden"><Menu size={20} aria-hidden="true" />Tools</summary>
            <div className="absolute right-0 top-full mt-3 max-h-[calc(100dvh-7rem)] w-64 max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-2xl border border-line bg-white p-3 shadow-lg">
              {tools.filter((tool) => tool.href).map(({ id, title, href, icon: Icon }) => (
                <Link onClick={closeMenu} key={id} href={href!} className="flex items-center gap-3 rounded-lg p-3 text-sm text-muted transition hover:bg-surface hover:text-primary"><Icon size={17} aria-hidden="true" />{title}</Link>
              ))}
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
