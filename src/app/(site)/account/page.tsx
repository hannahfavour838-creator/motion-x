import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/misc";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { isSeller, requireUser } from "@/lib/auth";
import { getEnquiries, getSavedVehicles } from "@/lib/data/account";

export const metadata = { title: "Overview" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [saved, enquiries] = await Promise.all([getSavedVehicles(user.id), getEnquiries("buyer", user.id)]);
  const replies = enquiries.filter((e) => e.status === "replied").length;
  return (
    <>
      <PageHeader eyebrow="Welcome" title={user.displayName} actions={<ButtonLink href="/cars" iconRight={<ArrowRight />}>Discover cars</ButtonLink>} />
      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
        <StatCard label="Saved vehicles" value={saved.length} />
        <StatCard label="Enquiries sent" value={enquiries.length} />
        <StatCard label="Seller replies" value={replies} />
      </div>
      {saved.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="eyebrow">Recently saved</h2>
            <Link href="/account/saved" className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-silver hover:text-white">All saved →</Link>
          </div>
          <ul className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
            {saved.slice(0, 3).map((v) => <li key={v.id} className="bg-obsidian"><VehicleCard vehicle={v} /></li>)}
          </ul>
        </section>
      )}
      {!isSeller(user) && (
        <section className="mt-12 flex flex-col gap-4 border border-line bg-ink p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-lg uppercase">Selling a car?</p>
            <p className="mt-1 text-sm text-muted">Switch to a seller account to list vehicles. You keep your saved vehicles and enquiries.</p>
          </div>
          <ButtonLink href="/sell/start" variant="secondary">Start selling</ButtonLink>
        </section>
      )}
    </>
  );
}
