import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { CurrencySwitcher } from "@/components/vehicles/currency-switcher";

const columns = [
  {
    title: "Discover",
    links: [
      { href: "/cars", label: "All vehicles" },
      { href: "/collections", label: "Collections" },
      { href: "/showroom", label: "3D showroom" },
      { href: "/dealers/directory", label: "Dealer directory" },
      { href: "/compare", label: "Compare" },
    ],
  },
  {
    title: "Sell",
    links: [
      { href: "/sell", label: "Sell a vehicle" },
      { href: "/dealers", label: "For dealers" },
      { href: "/sign-up?type=dealer", label: "Dealer registration" },
      { href: "/trust", label: "Verification & review" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About MOTION X" },
      { href: "/help", label: "Help centre" },
      { href: "/contact", label: "Contact" },
      { href: "/credits", label: "Credits & licences" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/cookies", label: "Cookie preferences" },
    ],
  },
];

const socialLabels: Record<string, string> = { instagram: "Instagram", x: "X", linkedin: "LinkedIn", youtube: "YouTube" };

export function SiteFooter() {
  const socials = Object.entries(siteConfig.social).filter(([, url]) => Boolean(url));
  return (
    <footer className="relative border-t border-line bg-obsidian">
      <div className="container-x py-16 md:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-8 max-w-sm font-display text-2xl uppercase leading-tight text-white">
              The world is <br /> your showroom.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              A global automotive discovery platform connecting buyers, private sellers and professional dealerships.
              MOTION X is independent and not affiliated with any vehicle manufacturer.
            </p>
            {socials.length > 0 && (
              <ul className="mt-8 flex gap-5">
                {socials.map(([key, url]) => (
                  <li key={key}>
                    <a href={url} rel="noopener noreferrer" target="_blank" className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted hover:text-white">
                      {socialLabels[key]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow mb-5">{col.title}</h2>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-silver/85 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-6 border-t border-line pt-8 text-xs text-dim md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} MOTION X. Vehicle names and marks belong to their respective owners.</p>
          <CurrencySwitcher />
        </div>
      </div>
    </footer>
  );
}
