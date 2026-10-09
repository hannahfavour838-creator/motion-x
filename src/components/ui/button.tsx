import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "electric";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xs font-medium uppercase tracking-[0.16em] transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-[var(--ease-cinematic)] disabled:pointer-events-none disabled:opacity-45 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-white text-obsidian hover:bg-silver active:translate-y-px",
  secondary: "border border-line-strong text-white hover:border-white/70 hover:bg-white/[0.04]",
  ghost: "text-silver hover:text-white hover:bg-white/[0.04]",
  danger: "border border-danger/50 text-danger hover:bg-danger/10",
  electric: "bg-electric text-white hover:bg-[#749dff] shadow-[0_0_0_1px_rgb(92_141_255/0.4),0_10px_40px_-12px_rgb(92_141_255/0.7)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.66rem]",
  md: "h-11 px-6 text-[0.7rem]",
  lg: "h-14 px-8 text-[0.74rem]",
};

export function buttonClasses({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant, size, className, children, loading, icon, iconRight, disabled, ...props
}: ComponentProps<"button"> & CommonProps & { loading?: boolean }) {
  return (
    <button className={buttonClasses({ variant, size, className })} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Spinner className="h-3.5 w-3.5" /> : icon}
      {children}
      {iconRight}
    </button>
  );
}

export function ButtonLink({
  variant, size, className, children, icon, iconRight, ...props
}: ComponentProps<typeof Link> & CommonProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5", className)} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}
