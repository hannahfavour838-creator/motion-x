import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/misc";

/** Editorial layout for informational and legal pages. */
export function ProsePage({ eyebrow, title, intro, children, updated }: { eyebrow: string; title: string; intro?: ReactNode; children: ReactNode; updated?: string }) {
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: eyebrow }]} />
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <h1 className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-light uppercase leading-[0.95]">{title}</h1>
          {updated && <p className="mt-6 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-dim">Last updated {updated}</p>}
        </div>
        <div className="max-w-2xl">
          {intro && <div className="mb-10 text-lg leading-relaxed text-silver">{intro}</div>}
          <div className="space-y-10 text-[0.95rem] leading-relaxed text-muted [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p+p]:mt-4 [&_strong]:font-medium [&_strong]:text-silver [&_ul]:space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
