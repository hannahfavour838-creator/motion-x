import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Eyebrow({ children, className, index }: { children: ReactNode; className?: string; index?: string }) {
  return (
    <p className={cn("eyebrow flex items-center gap-3", className)}>
      {index && <span className="text-electric">{index}</span>}
      {index && <span aria-hidden="true" className="h-px w-8 bg-line-strong" />}
      <span>{children}</span>
    </p>
  );
}

type BadgeTone = "neutral" | "electric" | "success" | "warning" | "danger" | "outline";

export function Badge({ children, tone = "neutral", className, icon }: { children: ReactNode; tone?: BadgeTone; className?: string; icon?: ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-white/[0.06] text-silver",
    electric: "bg-electric/12 text-[#9db8ff] ring-1 ring-inset ring-electric/30",
    success: "bg-success/10 text-success ring-1 ring-inset ring-success/25",
    warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
    danger: "bg-danger/10 text-danger ring-1 ring-inset ring-danger/25",
    outline: "text-silver ring-1 ring-inset ring-line-strong",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-xs px-2 py-1 font-mono text-[0.62rem] uppercase leading-none tracking-[0.14em]", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function EmptyState({ title, children, action, icon }: { title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line px-6 py-16 text-center">
      {icon ?? (
        <svg viewBox="0 0 48 48" className="mb-6 h-10 w-10 text-dim" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <circle cx="24" cy="24" r="17" />
          <path d="M13 31l22-14M17 17l6 4" />
        </svg>
      )}
      <h3 className="font-display text-lg font-medium uppercase tracking-wide">{title}</h3>
      {children && <div className="mt-3 max-w-md text-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", children, action }: { title?: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-col items-center border border-danger/30 bg-danger/[0.03] px-6 py-14 text-center">
      <p className="eyebrow mb-4 text-danger">Error</p>
      <h3 className="font-display text-lg uppercase">{title}</h3>
      {children && <div className="mt-3 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-dim">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-white">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-silver">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeading({ eyebrow, index, title, children, className, align = "left" }: {
  eyebrow?: string; index?: string; title: ReactNode; children?: ReactNode; className?: string; align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow index={index} className={cn("mb-6", align === "center" && "justify-center")}>{eyebrow}</Eyebrow>}
      <h2 className="font-display text-[clamp(2rem,5vw,4.25rem)] font-normal uppercase leading-[0.95] text-white">{title}</h2>
      {children && <div className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="border border-line bg-ink p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-4 font-display text-3xl font-light tabular-nums text-white">{value}</p>
      {hint && <p className="mt-2 text-xs text-dim">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xs", className)} aria-hidden="true" />;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}
