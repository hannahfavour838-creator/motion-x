import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/format";

const control =
  "w-full rounded-xs border border-line bg-charcoal/70 px-4 text-[0.95rem] text-white placeholder:text-dim transition-colors duration-200 hover:border-line-strong focus:border-electric focus:bg-charcoal focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-danger/70 disabled:opacity-50";

export function Label({ className, children, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("mb-2 block font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted", className)} {...props}>
      {children}
    </label>
  );
}

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Accessible field wrapper: wires label, hint and error to the control. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-electric" aria-hidden="true">*</span>}
      </Label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && <p id={hintId} className="mt-2 text-xs leading-relaxed text-dim">{hint}</p>}
      {error && (
        <p id={errId} className="mt-2 flex items-center gap-1.5 text-xs text-danger" role="alert">
          <span aria-hidden="true">!</span> {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-32 resize-y py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "h-12 cursor-pointer appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3 text-sm text-silver", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-xs border border-line-strong bg-charcoal transition-colors checked:border-electric checked:bg-electric checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22><path d=%22M5 12l5 5 9-10%22/></svg>')] checked:bg-center checked:bg-no-repeat"
        {...props}
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}

export function FormMessage({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const tones = {
    error: "border-danger/40 bg-danger/[0.06] text-danger",
    success: "border-success/40 bg-success/[0.06] text-success",
    info: "border-electric/30 bg-electric/[0.06] text-silver",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xs border px-4 py-3 text-sm leading-relaxed", tones[tone])}>
      {children}
    </div>
  );
}
