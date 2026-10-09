"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/format";
import { deviceTier, prefersReducedMotion, supportsWebGL } from "@/lib/webgl";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Mode = "pending" | "3d" | "static";

export function Hero({ poster }: { poster: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const [mode, setMode] = useState<Mode>("pending");
  const [tier, setTier] = useState<0 | 1 | 2>(2);
  const [reduced, setReduced] = useState(false);
  const [compact, setCompact] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [active, setActive] = useState(true);
  const [skipSignal, setSkipSignal] = useState(0);
  const [failed, setFailed] = useState(false);

  // Decide on the client whether the 3D studio can run on this device.
  useEffect(() => {
    const t = deviceTier();
    const r = prefersReducedMotion();
    const mq = window.matchMedia("(max-width: 767px), (orientation: portrait) and (max-width: 1023px)");
    /* eslint-disable react-hooks/set-state-in-effect -- capability detection must run in the browser */
    setTier(t);
    setReduced(r);
    setCompact(mq.matches);
    setMode(supportsWebGL() && t > 0 ? "3d" : "static");
    /* eslint-enable react-hooks/set-state-in-effect */
    const onChange = () => setCompact(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Pause rendering when the hero is off-screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Copy reveal + scroll-linked camera progress (no pinning, no scroll hijacking).
  useIsoLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reducedNow = prefersReducedMotion();
    const ctx = gsap.context(() => {
      if (!reducedNow) {
        gsap.from("[data-reveal]", { yPercent: 110, opacity: 0, duration: 1.25, ease: "expo.out", stagger: 0.09, delay: 0.15 });
        gsap.from("[data-fade]", { opacity: 0, y: 16, duration: 1, ease: "power2.out", stagger: 0.08, delay: 0.7 });
        gsap.to(copy.current, {
          yPercent: -12,
          opacity: 0.0,
          ease: "none",
          scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: 0.4 },
        });
      }
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          scrollRef.current = self.progress;
        },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  const onProgress = useCallback((p: number) => setProgress(p), []);
  const onReady = useCallback(() => setReady(true), []);
  const onIntroDone = useCallback(() => setIntroDone(true), []);
  const onError = useCallback(() => {
    setFailed(true);
    setMode("static");
  }, []);

  const showLoader = mode === "3d" && !ready && !failed;
  const showSkip = mode === "3d" && ready && !introDone && !reduced;

  return (
    <section
      ref={section}
      aria-labelledby="hero-title"
      className="relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden bg-obsidian"
    >
      {/* Poster: visible immediately; the live studio fades in over it. */}
      <div className={cn("absolute inset-0 -z-20 transition-opacity duration-[1.6s]", mode === "3d" && ready ? "opacity-0" : "opacity-100")}>
        {poster}
      </div>

      {mode === "3d" && (
        <div data-hero-canvas className={cn("absolute inset-0 -z-10 transition-opacity duration-[1.6s] ease-[var(--ease-cinematic)]", ready ? "opacity-100" : "opacity-0")}>
          <HeroScene
            tier={tier}
            reducedMotion={reduced}
            compact={compact}
            active={active}
            skipSignal={skipSignal}
            scrollRef={scrollRef}
            onProgress={onProgress}
            onReady={onReady}
            onIntroDone={onIntroDone}
            onError={onError}
          />
        </div>
      )}

      {/* Atmospheric haze from the overhead softbox */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5] bg-[radial-gradient(ellipse_60%_55%_at_64%_0%,rgba(150,170,210,0.13),transparent_70%)] mix-blend-screen" />
      {/* Legibility gradients */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-obsidian/85 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-obsidian via-obsidian/70 to-transparent md:h-[48%]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-obsidian/70 to-transparent md:block" />

      <div ref={copy} className="container-x relative flex h-full flex-col justify-between pb-10 pt-28 md:justify-end md:pb-16 md:pt-32">
        <div className="max-w-[min(100%,74rem)]">
          <p className="eyebrow mb-6 overflow-hidden md:mb-8">
            <span data-reveal className="inline-flex items-center gap-3">
              <span className="h-px w-8 bg-electric" aria-hidden="true" />
              The next era of automotive discovery
            </span>
          </p>
          <h1 id="hero-title" className="font-display font-light uppercase leading-[0.9] tracking-[-0.02em] text-white">
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-reveal className="text-metal block text-[clamp(2.6rem,5.7vw,6.9rem)]">The world</span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-reveal className="text-metal block text-[clamp(2.6rem,5.7vw,6.9rem)]">is your showroom.</span>
            </span>
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <p data-fade className="text-[0.95rem] leading-relaxed text-silver md:text-base">
              Discover extraordinary automobiles. Explore immersive digital showrooms. Connect with sellers across the globe.
            </p>
            <div data-fade className="mt-7 flex flex-col gap-3 xs:flex-row">
              <ButtonLink href="/cars" size="lg" iconRight={<ArrowRight />}>Explore cars</ButtonLink>
              <ButtonLink href="/sell" size="lg" variant="secondary">Sell your car</ButtonLink>
            </div>
          </div>

          <div data-fade className="hidden items-end gap-10 md:flex">
            <Link href="/showroom/concept-car" className="group text-right">
              <span className="eyebrow block">Studio car</span>
              <span className="mt-2 block font-display text-sm uppercase tracking-wider text-white transition-colors group-hover:text-electric">
                Concept coupé · Explore in 3D →
              </span>
            </Link>
            <a href="#discover" className="group flex flex-col items-center gap-3" aria-label="Scroll to discover">
              <span className="eyebrow [writing-mode:vertical-rl]">Scroll</span>
              <span className="relative block h-14 w-px overflow-hidden bg-line-strong">
                <span className="absolute inset-x-0 top-0 h-1/3 bg-white motion-safe:animate-[mx-scroll-cue_2.2s_var(--ease-precise)_infinite]" />
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Loading indicator — never blocks the page */}
      {showLoader && (
        <div className="absolute bottom-6 right-5 z-10 flex items-center gap-3 md:bottom-auto md:right-10 md:top-28" role="status" aria-live="polite">
          <span className="relative block h-px w-20 overflow-hidden bg-line-strong">
            <span className="absolute inset-y-0 left-0 bg-electric transition-[width] duration-300" style={{ width: `${Math.max(6, progress)}%` }} />
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted">Preparing studio {Math.round(progress)}%</span>
        </div>
      )}
      {showSkip && (
        <button
          type="button"
          onClick={() => setSkipSignal((n) => n + 1)}
          className="absolute right-5 top-24 z-10 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted transition-colors hover:text-white md:right-10 md:top-28"
        >
          Skip intro
        </button>
      )}
      {failed && (
        <p className="absolute right-5 top-24 z-10 hidden max-w-[16rem] text-right font-mono md:block text-[0.58rem] uppercase leading-relaxed tracking-[0.16em] text-dim md:right-10 md:top-28">
          Interactive 3D is unavailable on this device — showing a studio render.
        </p>
      )}
    </section>
  );
}
