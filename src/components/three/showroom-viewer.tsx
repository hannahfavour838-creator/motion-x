"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/format";
import type { Vehicle3DAsset } from "@/lib/types";
import { deviceTier, prefersReducedMotion, supportsWebGL } from "@/lib/webgl";
import { VIEWS, type ShowroomHandle, type ViewName } from "./showroom-views";

const ShowroomCanvas = dynamic(() => import("./showroom-canvas"), { ssr: false });

type Mode = "pending" | "3d" | "unsupported" | "error";

const ctl = "flex h-10 min-w-10 items-center justify-center border border-line-strong bg-obsidian/70 px-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white backdrop-blur transition-colors hover:border-white focus-visible:border-white";

export function ShowroomViewer({ asset }: { asset: Vehicle3DAsset }) {
  const frame = useRef<HTMLDivElement>(null);
  const handle = useRef<ShowroomHandle | null>(null);
  const [mode, setMode] = useState<Mode>("pending");
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<ViewName>("front34");
  const [paintId, setPaintId] = useState(asset.paintOptions[0]?.id ?? null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const paint = asset.paintOptions.find((p) => p.id === paintId) ?? null;

  useEffect(() => {
    const tier = deviceTier();
    /* eslint-disable react-hooks/set-state-in-effect -- browser capability detection */
    setReduced(prefersReducedMotion());
    setQuality(tier === 2 ? "high" : "low");
    setMode(supportsWebGL() ? "3d" : "unsupported");
    /* eslint-enable react-hooks/set-state-in-effect */
    track("showroom_open", { asset: asset.slug });
  }, [asset.slug]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frame.current?.requestFullscreen();
    } catch {
      /* fullscreen not permitted */
    }
  }, []);

  const goto = (v: ViewName) => {
    setView(v);
    setAutoRotate(false);
    handle.current?.setView(v);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const h = handle.current;
    if (!h) return;
    const map: Record<string, () => void> = {
      ArrowLeft: () => h.orbit(0.15, 0),
      ArrowRight: () => h.orbit(-0.15, 0),
      ArrowUp: () => h.orbit(0, -0.08),
      ArrowDown: () => h.orbit(0, 0.08),
      "+": () => h.zoom(0.85),
      "=": () => h.zoom(0.85),
      "-": () => h.zoom(1.18),
      r: () => h.reset(),
      R: () => h.reset(),
      f: () => void toggleFullscreen(),
      F: () => void toggleFullscreen(),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      setAutoRotate(false);
      fn();
    }
  };

  return (
    <div className="space-y-5">
      <div
        ref={frame}
        tabIndex={0}
        role="application"
        aria-roledescription="3D vehicle viewer"
        aria-label={`${asset.name}. Use arrow keys to rotate, plus and minus to zoom, R to reset, F for fullscreen.`}
        onKeyDown={onKeyDown}
        className={cn("relative overflow-hidden border border-line bg-obsidian outline-none focus-visible:border-electric", fullscreen ? "h-screen" : "aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/8.5]")}
      >
        {(mode !== "3d" || !loaded) && asset.posterUrl && (
          <Image src={asset.posterUrl} alt={`Studio render of the ${asset.name}`} fill priority sizes="100vw" className={cn("object-cover transition-opacity duration-700", mode === "3d" && "opacity-40")} />
        )}
        {mode === "3d" && (
          <div className={cn("absolute inset-0 transition-opacity duration-1000", loaded ? "opacity-100" : "opacity-0")}>
            <ShowroomCanvas
              url={asset.url}
              paint={paint}
              quality={quality}
              reducedMotion={reduced}
              autoRotate={autoRotate}
              handleRef={handle}
              onProgress={setProgress}
              onLoaded={() => setLoaded(true)}
              onError={() => setMode("error")}
              onInteract={() => setAutoRotate(false)}
            />
          </div>
        )}

        {mode === "3d" && !loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
            <span className="relative block h-px w-40 overflow-hidden bg-line-strong">
              <span className="absolute inset-y-0 left-0 bg-electric transition-[width]" style={{ width: `${Math.max(5, progress)}%` }} />
            </span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-silver">Loading 3D model {Math.round(progress)}%{asset.fileBytes ? ` · ${(asset.fileBytes / 1048576).toFixed(1)} MB` : ""}</span>
          </div>
        )}
        {(mode === "unsupported" || mode === "error") && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian to-transparent p-6 pt-20">
            <p className="max-w-md text-sm text-silver" role="status">
              {mode === "unsupported"
                ? "Your browser or device doesn't support WebGL, so the interactive 3D view isn't available. You're seeing a studio render of the same model."
                : "The 3D model couldn't be displayed on this device. You're seeing a studio render of the same model instead."}
            </p>
          </div>
        )}

        {mode === "3d" && loaded && (
          <>
            <div className="absolute left-3 top-3 flex flex-wrap gap-2 sm:left-5 sm:top-5" role="group" aria-label="Viewing angle">
              {(Object.keys(VIEWS) as ViewName[]).map((v) => (
                <button key={v} type="button" onClick={() => goto(v)} aria-pressed={view === v} className={cn(ctl, view === v && "border-white bg-white text-obsidian hover:bg-white")}>
                  {VIEWS[v].label}
                </button>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2 sm:bottom-5 sm:right-5" role="group" aria-label="Camera controls">
              <button type="button" className={ctl} onClick={() => { setAutoRotate(false); handle.current?.zoom(0.85); }} aria-label="Zoom in">+</button>
              <button type="button" className={ctl} onClick={() => { setAutoRotate(false); handle.current?.zoom(1.18); }} aria-label="Zoom out">−</button>
              <button type="button" className={ctl} onClick={() => setAutoRotate((a) => !a)} aria-pressed={autoRotate}>{autoRotate ? "Stop" : "Rotate"}</button>
              <button type="button" className={ctl} onClick={() => { setView("front34"); handle.current?.reset(); }}>Reset</button>
              <button type="button" className={ctl} onClick={() => void toggleFullscreen()} aria-pressed={fullscreen}>{fullscreen ? "Exit" : "Fullscreen"}</button>
            </div>
            <p className="pointer-events-none absolute bottom-5 left-5 hidden font-mono text-[0.58rem] uppercase tracking-[0.18em] text-dim md:block">
              Drag to orbit · Scroll or pinch to zoom · Keys: ← → ↑ ↓ + − R F
            </p>
          </>
        )}
      </div>

      {asset.paintOptions.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">Paint finish <span className="normal-case tracking-normal text-dim">— finishes supported by this model; not a statement of any vehicle&apos;s availability</span></legend>
          <div className="flex flex-wrap gap-2">
            {asset.paintOptions.map((p) => (
              <label key={p.id} className={cn("flex cursor-pointer items-center gap-3 border px-3 py-2 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-electric", paintId === p.id ? "border-white text-white" : "border-line text-muted hover:text-white")}>
                <input type="radio" name="paint" value={p.id} checked={paintId === p.id} onChange={() => setPaintId(p.id)} className="sr-only" disabled={mode !== "3d"} />
                <span className="h-5 w-5 rounded-full ring-1 ring-white/20" style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${p.color} 45%, #000 120%)` }} aria-hidden="true" />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
