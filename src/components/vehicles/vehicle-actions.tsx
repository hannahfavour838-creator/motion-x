"use client";

import { useRouter } from "next/navigation";
import { useCompare, useFavourites, useSession } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/format";

export function SaveButton({ vehicleId, className, variant = "icon" }: { vehicleId: string; className?: string; variant?: "icon" | "full" }) {
  const { ids, toggle } = useFavourites();
  const { configured } = useSession();
  const toast = useToast();
  const router = useRouter();
  const saved = ids.has(vehicleId);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggle(vehicleId);
    if (result === "auth") {
      toast("Sign in to save vehicles to your account.", "info");
      router.push(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
    } else if (result === "unavailable") {
      toast(configured ? "Saving is unavailable right now." : "Saving requires accounts, which are not configured in this preview.", "info");
    } else if (result === "error") {
      toast("We couldn't update your saved vehicles. Please try again.", "error");
    } else {
      toast(result === "added" ? "Saved to your garage." : "Removed from your saved vehicles.", "success");
    }
  };

  const heart = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
    </svg>
  );

  if (variant === "full") {
    return (
      <button type="button" onClick={onClick} aria-pressed={saved} className={cn("inline-flex h-11 items-center justify-center gap-2.5 border border-line-strong px-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] transition-colors hover:border-white", saved ? "text-electric" : "text-white", className)}>
        {heart}
        {saved ? "Saved" : "Save vehicle"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved vehicles" : "Save vehicle"}
      className={cn("flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-obsidian/60 backdrop-blur transition-colors hover:border-white/40", saved ? "text-electric" : "text-white", className)}
    >
      {heart}
    </button>
  );
}

export function CompareButton({ vehicleId, className, variant = "icon" }: { vehicleId: string; className?: string; variant?: "icon" | "full" }) {
  const { ids, toggle } = useCompare();
  const toast = useToast();
  const active = ids.includes(vehicleId);
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = toggle(vehicleId);
    if (r === "full") toast("You can compare up to 4 vehicles. Remove one first.", "info");
  };
  const icon = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 4v16M16 4v16M4 8h4M16 16h4" />
    </svg>
  );
  if (variant === "full") {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={cn("inline-flex h-11 items-center justify-center gap-2.5 border border-line-strong px-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] transition-colors hover:border-white", active ? "text-electric" : "text-white", className)}>
        {icon}
        {active ? "In comparison" : "Compare"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Remove from comparison" : "Add to comparison"}
      className={cn("flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-obsidian/60 backdrop-blur transition-colors hover:border-white/40", active ? "text-electric" : "text-white", className)}
    >
      {icon}
    </button>
  );
}
