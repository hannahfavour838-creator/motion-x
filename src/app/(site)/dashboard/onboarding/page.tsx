import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { DealerProfileForm } from "@/components/dashboard/profile-forms";
import { requireSeller } from "@/lib/auth";

export const metadata = { title: "Set up your dealership" };

export default async function OnboardingPage() {
  const user = await requireSeller("/dashboard/onboarding");
  if (user.hasDealerProfile) redirect("/dashboard/profile");
  return (
    <>
      <PageHeader
        eyebrow="Dealer onboarding · 1 of 2"
        title="Your storefront"
        description="Tell buyers who you are. After this you can add inventory and apply for business verification."
      />
      <DealerProfileForm dealer={null} onboarding />
    </>
  );
}
