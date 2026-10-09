"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

type Tone = "success" | "error" | "info";
interface ToastItem { id: number; message: string; tone: Tone }

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const push = useCallback((message: string, tone: Tone = "info") => {
    const id = ++counter.current;
    setItems((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 5200);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 border bg-ink/95 px-4 py-3.5 text-sm shadow-2xl backdrop-blur animate-[mx-fade-up_0.35s_var(--ease-cinematic)]",
              t.tone === "success" && "border-success/40",
              t.tone === "error" && "border-danger/40",
              t.tone === "info" && "border-line-strong",
            )}
          >
            <span aria-hidden="true" className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", t.tone === "success" ? "bg-success" : t.tone === "error" ? "bg-danger" : "bg-electric")} />
            <span className="leading-relaxed text-silver">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
