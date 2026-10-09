"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { useSession } from "@/components/providers/app-providers";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/format";

export function SiteHeader() {
  const pathname = usePathname();
  const { session, loading } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const overHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- respond to route change
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isSeller = session && session.accountType !== "buyer";
  const accountHref = session?.isAdmin ? "/admin" : isSeller ? "/dashboard" : "/account";
  const accountLabel = session?.isAdmin ? "Admin" : isSeller ? "Dashboard" : "Account";
  const listHref = isSeller ? "/dashboard/listings/new" : "/sell/start";
  const solid = scrolled || !overHero || open;

  return (
    <>
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
        solid ? "border-b border-line bg-obsidian/80 backdrop-blur-xl" : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-6 md:h-20">
        <Link href="/" className="relative z-10 -m-2 p-2" aria-label="MOTION X — home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] transition-colors duration-300",
                      active ? "text-white" : "text-silver/80 hover:text-white",
                    )}
                  >
                    {item.label}
                    <span className={cn("absolute -bottom-0.5 left-0 h-px bg-electric transition-all duration-500", active ? "w-full" : "w-0")} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          {loading ? (
            <span className="h-4 w-14" aria-hidden="true" />
          ) : session ? (
            <Link href={accountHref} className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-silver/80 transition-colors hover:text-white">
              {accountLabel}
            </Link>
          ) : (
            <Link href="/sign-in" className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-silver/80 transition-colors hover:text-white">
              Sign In
            </Link>
          )}
          <Link
            href={listHref}
            className="inline-flex h-10 items-center border border-line-strong px-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-obsidian"
          >
            List Your Car
          </Link>
        </div>

        <button
          ref={menuButton}
          type="button"
          className="relative z-10 -mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-6">
            <span className={cn("absolute left-0 h-px w-6 bg-white transition-transform duration-300", open ? "top-1.5 rotate-45" : "top-0")} />
            <span className={cn("absolute left-0 h-px bg-white transition-all duration-300", open ? "top-1.5 w-6 -rotate-45" : "top-3 w-4")} />
          </span>
        </button>
      </div>

    </header>
      {/* Rendered outside <header>: its backdrop-filter would otherwise become the containing block for this fixed overlay. */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto border-t border-line bg-obsidian md:top-20 lg:hidden"
      >
        <nav aria-label="Mobile" className="container-x flex min-h-full flex-col py-8">
          <ul className="flex flex-col">
            {mainNav.map((item, i) => (
              <li key={item.href} className="border-b border-line">
                <Link
                  ref={i === 0 ? firstLink : undefined}
                  href={item.href}
                  className="flex items-center justify-between py-5 font-display text-2xl uppercase tracking-wide text-white"
                >
                  {item.label}
                  <span className="font-mono text-xs text-dim">0{i + 1}</span>
                </Link>
              </li>
            ))}
            <li className="border-b border-line">
              <Link href={session ? accountHref : "/sign-in"} className="flex items-center justify-between py-5 font-display text-2xl uppercase tracking-wide text-white">
                {session ? accountLabel : "Sign In"}
                <span className="font-mono text-xs text-dim">0{mainNav.length + 1}</span>
              </Link>
            </li>
          </ul>
          <div className="mt-auto pt-10">
            <Link href={listHref} className="flex h-14 items-center justify-center bg-white font-mono text-xs uppercase tracking-[0.2em] text-obsidian">
              List Your Car
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
