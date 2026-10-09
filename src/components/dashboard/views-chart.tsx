"use client";

import { useState } from "react";

/**
 * Daily listing views — single series, so no legend (the title names it).
 * Bars are anchored to the baseline with rounded data-ends, a per-bar hover
 * tooltip, and an accessible table fallback.
 */
export function ViewsChart({ data }: { data: { day: string; views: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.views));
  const total = data.reduce((s, d) => s + d.views, 0);
  const W = 600, H = 160, gap = 2;
  const bw = W / Math.max(1, data.length) - gap;
  const fmt = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <figure className="border border-line bg-ink p-5">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="eyebrow">Listing views · last {data.length} days</span>
        <span className="font-display text-2xl font-light tabular-nums text-white">{total.toLocaleString("en")}</span>
      </figcaption>
      <div className="relative mt-5">
        <svg viewBox={`0 0 ${W} ${H + 20}`} className="h-44 w-full" role="img" aria-label={`Daily listing views, ${total} in total`} onMouseLeave={() => setHover(null)}>
          <line x1="0" x2={W} y1={H} y2={H} stroke="rgb(198 203 211 / 0.18)" strokeWidth="1" />
          {data.map((d, i) => {
            const h = d.views === 0 ? 0 : Math.max(3, (d.views / max) * (H - 12));
            const x = i * (bw + gap);
            const r = Math.min(4, bw / 2, h);
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1}>
                <rect x={x} y={0} width={bw + gap} height={H} fill="transparent" />
                {h > 0 && (
                  <path
                    d={`M${x},${H} L${x},${H - h + r} Q${x},${H - h} ${x + r},${H - h} L${x + bw - r},${H - h} Q${x + bw},${H - h} ${x + bw},${H - h + r} L${x + bw},${H} Z`}
                    fill={hover === i ? "#8fb0ff" : "#5c8dff"}
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                )}
              </g>
            );
          })}
          <text x="0" y={H + 15} className="fill-[#6b727d] font-mono text-[10px]">{data[0] ? fmt(data[0].day) : ""}</text>
          <text x={W} y={H + 15} textAnchor="end" className="fill-[#6b727d] font-mono text-[10px]">{data.at(-1) ? fmt(data.at(-1)!.day) : ""}</text>
        </svg>
        {hover !== null && data[hover] && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-line-strong bg-obsidian px-3 py-2 text-xs"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            <span className="text-muted">{fmt(data[hover].day)}</span>
            <span className="ml-3 font-mono text-white">{data[hover].views} views</span>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>Daily listing views</caption>
        <thead><tr><th>Date</th><th>Views</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.views}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
