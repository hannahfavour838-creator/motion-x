"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * Accessible modal built on the native <dialog> element: focus is moved into
 * the dialog, the page behind becomes inert, and Escape closes it.
 */
export function Modal({
  open, onClose, title, description, children, className, size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement;
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        document.documentElement.style.overflow = "";
        (opener.current as HTMLElement | null)?.focus?.();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto max-h-[92dvh] w-[calc(100%-2rem)] overflow-y-auto border border-line-strong bg-ink p-0 text-white backdrop:bg-black/75 backdrop:backdrop-blur-sm open:animate-[mx-fade-up_0.35s_var(--ease-cinematic)]",
        size === "md" ? "max-w-lg" : "max-w-2xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-6 border-b border-line px-6 py-5">
        <div>
          <h2 id={titleId} className="font-display text-lg uppercase tracking-wide">{title}</h2>
          {description && <div className="mt-1.5 text-sm text-muted">{description}</div>}
        </div>
        <button type="button" onClick={onClose} className="-mr-2 -mt-1 p-2 text-muted transition-colors hover:text-white" aria-label="Close dialog">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="px-6 py-6">{children}</div>
    </dialog>
  );
}
