import { cn } from "@/lib/format";

/**
 * MOTION X graphic mark: two crossing blades. The second blade is severed at
 * the crossing and its lower half is displaced forward — motion frozen in a
 * single frame. Original geometry; not derived from any automotive emblem.
 */
export function LogoMark({ className, title = "MOTION X" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-7 w-7", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: false })}
    >
      <defs>
        <linearGradient id="mx-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#c6cbd3" />
          <stop offset="1" stopColor="#7d8591" />
        </linearGradient>
      </defs>
      <polygon points="6,34 12,34 34,6 28,6" fill="url(#mx-silver)" />
      <polygon points="6,6 12,6 19.07,15 13.07,15" fill="url(#mx-silver)" />
      <polygon points="22.93,25 28.93,25 36,34 30,34" fill="#5c8dff" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-6 w-6 shrink-0" title="" />
      {!compact && (
        <span className="font-display text-[0.95rem] font-semibold tracking-[0.22em] text-white" aria-hidden="true">
          MOTION<span className="text-silver"> X</span>
        </span>
      )}
      <span className="sr-only">MOTION X</span>
    </span>
  );
}
