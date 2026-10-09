import Link from "next/link";
import { cn } from "@/lib/format";

/** Link-based pagination: works without JavaScript and is crawlable. */
export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const visible = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const list = [...visible].sort((a, b) => a - b);
  const item = "flex h-10 min-w-10 items-center justify-center border px-3 font-mono text-xs transition-colors";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(item, "border-line text-silver hover:border-white")}>← Prev</Link>
      ) : (
        <span className={cn(item, "border-line/50 text-dim")} aria-disabled="true">← Prev</span>
      )}
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - list[i - 1] > 1 && <span className="text-dim" aria-hidden="true">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "border-white bg-white text-obsidian" : "border-line text-silver hover:border-white")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(item, "border-line text-silver hover:border-white")}>Next →</Link>
      ) : (
        <span className={cn(item, "border-line/50 text-dim")} aria-disabled="true">Next →</span>
      )}
    </nav>
  );
}
