import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/misc";
import { ContactHandled } from "@/components/admin/admin-controls";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Contact messages" };

export default async function MessagesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <PageHeader title="Contact messages" description="Messages sent through the contact form." />
      {!data?.length ? <EmptyState title="No messages" /> : (
        <ul className="space-y-3">
          {data.map((m) => (
            <li key={m.id} className="border border-line p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <p className="text-sm text-white">{m.name} · <a href={`mailto:${m.email}`} className="underline underline-offset-2">{m.email}</a> <span className="text-xs capitalize text-dim">· {m.topic} · {formatRelative(m.created_at)}</span></p>
                <StatusBadge status={m.status === "new" ? "new" : "closed"} />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted">{m.message}</p>
              {m.status === "new" && <div className="mt-4"><ContactHandled id={m.id} /></div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
