import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { VerificationForm } from "@/components/dashboard/profile-forms";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireSeller } from "@/lib/auth";
import { getMyVerificationRequests } from "@/lib/data/account";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Verification" };

export default async function VerificationPage() {
  const user = await requireSeller("/dashboard/verification");
  const requests = await getMyVerificationRequests(user.id);
  const supabase = await createClient();
  const { data: dealer } = await supabase.from("dealer_profiles").select("business_verified_at").eq("id", user.id).maybeSingle();
  const pending = (k: string) => requests.some((r) => r.kind === k && r.status === "pending");
  const isDealer = user.accountType === "dealer";

  return (
    <>
      <PageHeader
        title="Verification"
        description={<>Verification confirms who you are. It does not certify any vehicle. <Link href="/trust" className="underline underline-offset-4">How verification works</Link>.</>}
      />
      <div className="grid gap-px bg-line md:grid-cols-2">
        <div className="bg-obsidian p-6">
          <p className="eyebrow">Identity</p>
          <p className="mt-3 text-lg text-white">{user.identityVerified ? "Verified" : pending("identity") ? "Under review" : "Not verified"}</p>
          <p className="mt-2 text-sm text-muted">Shows an “Identity verified” badge on your listings once approved.</p>
        </div>
        {isDealer && (
          <div className="bg-obsidian p-6">
            <p className="eyebrow">Business</p>
            <p className="mt-3 text-lg text-white">{dealer?.business_verified_at ? "Verified" : pending("business") ? "Under review" : "Not verified"}</p>
            <p className="mt-2 text-sm text-muted">Shows a “Business verified” badge on your storefront and listings.</p>
          </div>
        )}
      </div>

      {isDealer && user.hasDealerProfile && !dealer?.business_verified_at && !pending("business") && (
        <section className="mt-12">
          <h2 className="mb-6 font-display text-xl uppercase">Apply for business verification</h2>
          <VerificationForm kind="business" />
        </section>
      )}
      {!user.identityVerified && !pending("identity") && (
        <section className="mt-12">
          <h2 className="mb-6 font-display text-xl uppercase">Apply for identity verification</h2>
          <VerificationForm kind="identity" />
        </section>
      )}

      {requests.length > 0 && (
        <section className="mt-12">
          <h2 className="eyebrow mb-4">Your requests</h2>
          <ul className="divide-y divide-line border border-line text-sm">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="capitalize text-white">{r.kind} verification <span className="text-xs text-dim">· {formatDate(r.created_at)}</span>{r.reviewer_note && <span className="block text-xs normal-case text-muted">{r.reviewer_note}</span>}</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
