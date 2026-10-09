"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/format";
import type { VehicleImage } from "@/lib/types";

export function Gallery({ images, title }: { images: VehicleImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const count = images.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  useEffect(() => {
    if (!full) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [full, go]);

  if (!count) {
    return (
      <div className="flex aspect-[3/2] items-center justify-center border border-line bg-ink font-mono text-xs uppercase tracking-[0.2em] text-dim">
        Photographs coming soon
      </div>
    );
  }

  const current = images[index];
  return (
    <div>
      <div
        className="group relative aspect-[3/2] overflow-hidden bg-ink"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} photographs`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt || `${title} — photo ${index + 1}`}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="object-cover animate-[mx-fade-up_0.5s_var(--ease-cinematic)]"
        />
        {current.illustrative && (
          <p className="absolute bottom-3 left-4 rounded-xs bg-obsidian/70 px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Illustrative render — not a photograph of this vehicle
          </p>
        )}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-obsidian/60 text-white backdrop-blur transition-opacity hover:bg-obsidian md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-obsidian/60 text-white backdrop-blur transition-opacity hover:bg-obsidian md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="rounded-xs bg-obsidian/70 px-2 py-1 font-mono text-[0.62rem] text-silver backdrop-blur" aria-live="polite">
            {index + 1} / {count}
          </span>
          <button type="button" onClick={() => setFull(true)} aria-label="View fullscreen" className="flex h-8 w-8 items-center justify-center rounded-xs bg-obsidian/70 text-white backdrop-blur hover:bg-obsidian">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        </div>
      </div>

      {count > 1 && (
        <ul className="mt-px grid grid-cols-4 gap-px sm:grid-cols-6" aria-label="Choose photo">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn("relative block aspect-[3/2] w-full overflow-hidden bg-ink transition-opacity", i === index ? "opacity-100 ring-1 ring-inset ring-white" : "opacity-55 hover:opacity-100")}
              >
                <Image src={img.url} alt="" fill sizes="160px" className="object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {full && (
        <div role="dialog" aria-modal="true" aria-label={`${title} — fullscreen gallery`} className="fixed inset-0 z-[90] flex flex-col bg-obsidian/97">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="font-mono text-xs text-silver">{index + 1} / {count}</p>
            <button type="button" autoFocus onClick={() => setFull(false)} className="p-2 text-white" aria-label="Close fullscreen gallery">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="relative flex-1">
            <Image src={current.url} alt={current.alt || title} fill sizes="100vw" className="object-contain" />
          </div>
          {count > 1 && (
            <div className="flex justify-center gap-4 py-5">
              <button type="button" onClick={() => go(-1)} className="font-mono text-xs uppercase tracking-[0.18em] text-silver hover:text-white">← Previous</button>
              <button type="button" onClick={() => go(1)} className="font-mono text-xs uppercase tracking-[0.18em] text-silver hover:text-white">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
