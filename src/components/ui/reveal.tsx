"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * Fades content up as it enters the viewport. Content is fully visible in the
 * server HTML (no-JS, crawlers); it is only hidden after hydration when it is
 * still below the fold. Disabled for reduced motion.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "section" }) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);
  const Tag = as as "div";
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // already on screen — leave it alone
    setState("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={state === "shown" ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        state !== "static" && "transition-[opacity,transform] duration-[1.1s] ease-[var(--ease-cinematic)]",
        state === "hidden" && "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
