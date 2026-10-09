import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/dashboard/profile-forms";
import { ResetPasswordForm } from "@/components/forms/auth-forms";
import { requireUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/data/account";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/account/settings");
  const { profile, phone } = await getMyProfile(user.id);
  return (
    <>
      <PageHeader title="Settings" description={<>Signed in as <span className="text-white">{user.email}</span>.</>} />
      <section aria-labelledby="profile-h" className="space-y-6">
        <h2 id="profile-h" className="font-display text-xl uppercase">Profile</h2>
        <ProfileForm profile={profile} phone={phone} />
      </section>
      <section aria-labelledby="pw-h" className="mt-16 max-w-md space-y-6">
        <h2 id="pw-h" className="font-display text-xl uppercase">Change password</h2>
        <ResetPasswordForm />
      </section>
      <section aria-labelledby="privacy-h" className="mt-16 border-t border-line pt-10">
        <h2 id="privacy-h" className="font-display text-xl uppercase">Privacy &amp; your data</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Your email address and phone number are never shown publicly. To export or permanently delete your account and associated data,
          <Link href="/contact?topic=trust" className="mx-1 text-white underline underline-offset-4">contact us</Link>
          from this email address and we will process the request. See the <Link href="/privacy" className="text-white underline underline-offset-4">privacy policy</Link>.
        </p>
      </section>
    </>
  );
}
