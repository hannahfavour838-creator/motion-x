import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge, EmptyState } from "@/components/ui/misc";
import { AccountControls } from "@/components/admin/admin-controls";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Accounts" };

export default async function SellersAdmin({ searchParams }: PageProps<"/admin/sellers">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60).replace(/[%,()]/g, "") : "";
  const type = sp.type === "buyer" ? "buyer" : sp.type === "dealer" ? "dealer" : sp.type === "private_seller" ? "private_seller" : null;
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id, display_name, account_type, status, suspended_reason, identity_verified_at, is_demo, created_at, dealer:dealer_profiles(business_name, slug, business_verified_at)").order("created_at", { ascending: false }).limit(100);
  if (type) query = query.eq("account_type", type); else query = query.in("account_type", ["private_seller", "dealer"]);
  if (q) query = query.ilike("display_name", `%${q}%`);
  const { data } = await query;
  return (
    <>
      <PageHeader title="Accounts" description="Suspending an account hides all of its listings immediately (enforced by the database)." />
      <form className="mb-6 flex flex-wrap gap-2" action="/admin/sellers">
        <label htmlFor="sq" className="sr-only">Search by name</label>
        <input id="sq" name="q" defaultValue={q} placeholder="Search name" className="h-9 w-56 border border-line bg-charcoal px-3 text-sm focus:border-electric focus:outline-none" />
        <select name="type" defaultValue={type ?? ""} className="h-9 border border-line bg-charcoal px-2 text-sm" aria-label="Account type">
          <option value="">All sellers</option>
          <option value="dealer">Dealers</option>
          <option value="private_seller">Private sellers</option>
          <option value="buyer">Buyers</option>
        </select>
        <button className="h-9 border border-line-strong px-4 font-mono text-[0.62rem] uppercase tracking-[0.14em]">Filter</button>
      </form>
      {!data?.length ? <EmptyState title="No accounts found" /> : (
        <ul className="divide-y divide-line border border-line">
          {data.map((p) => {
            const d = Array.isArray(p.dealer) ? p.dealer[0] : p.dealer;
            return (
              <li key={p.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-white">
                    {d?.slug ? <Link href={`/dealers/${d.slug}`} className="hover:text-electric">{d.business_name}</Link> : p.display_name}
                    <span className="ml-2 text-xs capitalize text-dim">{p.account_type.replace("_", " ")} · joined {formatDate(p.created_at)}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusBadge status={p.status} />
                    {p.identity_verified_at && <Badge tone="electric">Identity verified</Badge>}
                    {d?.business_verified_at && <Badge tone="electric">Business verified</Badge>}
                    {p.is_demo && <Badge tone="warning">Demo</Badge>}
                  </div>
                  {p.suspended_reason && <p className="mt-2 text-xs text-danger">Suspended: {p.suspended_reason}</p>}
                </div>
                <AccountControls id={p.id} status={p.status} identityVerified={Boolean(p.identity_verified_at)} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
