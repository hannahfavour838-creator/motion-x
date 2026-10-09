"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/components/providers/app-providers";

export function CompareTray() {
  const { ids, clear } = useCompare();
  const pathname = usePathname();
  if (!ids.length || pathname.startsWith("/compare")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-obsidian/90 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <p className="text-sm text-silver">
          <span className="font-mono text-electric">{ids.length}</span> of 4 vehicles selected for comparison
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={clear} className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted hover:text-white">
            Clear
          </button>
          <Link href={`/compare?ids=${ids.join(",")}`} className="inline-flex h-10 items-center bg-white px-5 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-obsidian hover:bg-silver">
            Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
