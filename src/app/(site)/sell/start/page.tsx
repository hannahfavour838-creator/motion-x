import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { becomeSeller } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/misc";
import { getSessionUser, isSeller } from "@/lib/auth";

// Session-dependent: always render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Start selling", robots: { index: false } };

export default async function SellStartPage() {
  const user = await getSessionUser();
  if (user && isSeller(user)) redirect("/dashboard/listings/new");
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <Breadcrumbs items={[{ href: "/sell", label: "Sell" }, { label: "Start" }]} />
      <h1 className="mt-8 font-display text-[clamp(2.2rem,5vw,4rem)] font-light uppercase">How are you selling?</h1>
      {user ? (
        <div className="mt-12 grid gap-px bg-line md:grid-cols-2">
          <form action={async () => { "use server"; await becomeSeller(); }} className="flex flex-col justify-between gap-8 bg-obsidian p-8">
            <div>
              <p className="eyebrow">Private seller</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">Switch your account to a private seller account to list your own vehicle. Your saved vehicles and enquiries stay with you.</p>
            </div>
            <Button type="submit" size="lg">Switch & list a vehicle</Button>
          </form>
          <div className="flex flex-col justify-between gap-8 bg-obsidian p-8">
            <div>
              <p className="eyebrow">Dealership</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">Create a dealership storefront with your business details, then add inventory and apply for business verification.</p>
            </div>
            <Link href="/dashboard/onboarding" className="inline-flex h-14 items-center justify-center border border-line-strong font-mono text-[0.72rem] uppercase tracking-[0.16em] text-white hover:border-white">Set up a dealership</Link>
          </div>
        </div>
      ) : (
        <div className="mt-12 grid gap-px bg-line md:grid-cols-2">
          {[
            ["Private seller", "Selling your own vehicle. Free account, listings reviewed before going live.", "/sign-up?type=seller", "Create seller account"],
            ["Dealership", "Selling professionally. Storefront, inventory tools and business verification.", "/sign-up?type=dealer", "Register dealership"],
          ].map(([t, b, href, cta]) => (
            <div key={t} className="flex flex-col justify-between gap-8 bg-obsidian p-8">
              <div>
                <p className="eyebrow">{t}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted">{b}</p>
              </div>
              <Link href={href} className="inline-flex h-14 items-center justify-center bg-white font-mono text-[0.72rem] uppercase tracking-[0.16em] text-obsidian hover:bg-silver">{cta}</Link>
            </div>
          ))}
          <p className="col-span-full bg-obsidian p-6 text-sm text-muted">Already have an account? <Link href="/sign-in?next=/sell/start" className="text-white underline underline-offset-4">Sign in</Link></p>
        </div>
      )}
    </div>
  );
}
