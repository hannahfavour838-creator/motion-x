import { PageHeader } from "@/components/layout/app-shell";
import { ListingForm } from "@/components/dashboard/listing-form";
import { requireSeller } from "@/lib/auth";

export const metadata = { title: "New listing" };

export default async function NewListingPage() {
  const user = await requireSeller("/dashboard/listings/new");
  return (
    <>
      <PageHeader
        eyebrow="Step 1 of 3 · Details"
        title="List a vehicle"
        description="Add the details first. Next you'll upload photographs, then submit the listing for review. Nothing is public until it is approved."
      />
      <ListingForm defaultCountry={user.countryCode} />
    </>
  );
}
