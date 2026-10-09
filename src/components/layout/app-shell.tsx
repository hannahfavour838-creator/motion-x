"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/format";

export interface NavItem {
  href: string;
  label: string;
  badge?: number;
  exact?: boolean;
}

export function AppShell({ title, subtitle, nav, children, footer }: { title: string; subtitle?: string; nav: NavItem[]; children: ReactNode; footer?: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="container-x pb-24 pt-24 md:pt-28">
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <aside>
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">{subtitle}</p>
            <p className="mt-2 truncate font-display text-lg uppercase tracking-wide text-white">{title}</p>
            <nav aria-label="Section" className="mt-6 -mx-5 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:px-0">
              <ul className="flex gap-1 lg:flex-col">
                {nav.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href} className="shrink-0">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between gap-4 whitespace-nowrap border-l-2 px-3 py-2.5 text-sm transition-colors lg:px-4",
                          active ? "border-electric bg-white/[0.04] text-white" : "border-transparent text-muted hover:text-white",
                        )}
                      >
                        {item.label}
                        {item.badge ? <span className="rounded-full bg-electric px-1.5 font-mono text-[0.6rem] leading-5 text-white">{item.badge}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="mt-6 hidden border-t border-line pt-6 lg:block">
              {footer}
              <form action={signOut}>
                <button type="submit" className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted hover:text-white">Sign out</button>
              </form>
            </div>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-10 flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-light uppercase leading-none md:text-4xl">{title}</h1>
        {description && <div className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
