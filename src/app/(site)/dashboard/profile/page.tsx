import { PageHeader } from "@/components/layout/app-shell";
import { DealerProfileForm, ProfileForm } from "@/components/dashboard/profile-forms";
import { requireSeller } from "@/lib/auth";
import { getMyProfile } from "@/lib/data/account";

export const metadata = { title: "Public profile" };

export default async function ProfilePage() {
  const user = await requireSeller("/dashboard/profile");
  const { profile, phone, dealer } = await getMyProfile(user.id);
  if (user.accountType === "dealer") {
    return (
      <>
        <PageHeader title="Storefront" description="Your public dealership page: business details, contact options and live inventory." />
        <DealerProfileForm dealer={dealer} />
      </>
    );
  }
  return (
    <>
      <PageHeader title="Public profile" description="Private sellers are shown by display name and city only. Your phone number and email are never published." />
      <ProfileForm profile={profile} phone={phone} />
    </>
  );
}
