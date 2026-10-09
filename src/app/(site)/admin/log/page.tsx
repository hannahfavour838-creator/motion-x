import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Moderation log" };

export default async function LogPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("moderation_actions").select("*, actor:profiles!moderation_actions_actor_id_fkey(display_name)").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <PageHeader title="Moderation log" description="An append-only record of listing status changes and administrative actions." />
      {!data?.length ? <EmptyState title="Nothing recorded yet" /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-dim">
              <tr><th className="py-2 pr-4 font-normal">When</th><th className="py-2 pr-4 font-normal">Actor</th><th className="py-2 pr-4 font-normal">Action</th><th className="py-2 pr-4 font-normal">Target</th><th className="py-2 font-normal">Note</th></tr>
            </thead>
            <tbody>
              {data.map((a) => {
                const actor = Array.isArray(a.actor) ? a.actor[0] : a.actor;
                return (
                  <tr key={a.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-xs text-dim">{formatDate(a.created_at, "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2.5 pr-4 text-silver">{actor?.display_name ?? "System"}</td>
                    <td className="py-2.5 pr-4 text-white">{a.action.replace(/_/g, " ")}{a.to_status && <span className="text-muted"> {a.from_status ? `${a.from_status} → ` : ""}{a.to_status}</span>}</td>
                    <td className="py-2.5 pr-4">{a.target_type === "vehicle" ? <Link href={`/admin/listings/${a.target_id}`} className="text-silver underline underline-offset-2">listing</Link> : <span className="text-muted">{a.target_type}</span>}</td>
                    <td className="py-2.5 text-xs text-muted">{a.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
