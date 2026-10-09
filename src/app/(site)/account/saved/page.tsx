import { PageHeader } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { requireUser } from "@/lib/auth";
import { getSavedVehicles } from "@/lib/data/account";

export const metadata = { title: "Saved vehicles" };

export default async function SavedPage() {
  const user = await requireUser("/account/saved");
  const saved = await getSavedVehicles(user.id);
  return (
    <>
      <PageHeader title="Saved vehicles" description="Vehicles you've saved. Remove one with the heart icon." />
      {saved.length === 0 ? (
        <EmptyState title="Nothing saved yet" action={<ButtonLink href="/cars">Discover cars</ButtonLink>}>Tap the heart on any vehicle to keep it here.</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((v) => <li key={v.id} className="bg-obsidian"><VehicleCard vehicle={v} /></li>)}
        </ul>
      )}
    </>
  );
}
