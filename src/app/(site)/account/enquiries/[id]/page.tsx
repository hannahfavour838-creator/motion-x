import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { Breadcrumbs } from "@/components/ui/misc";
import { EnquiryThread } from "@/components/dashboard/enquiry-thread";
import { requireUser } from "@/lib/auth";
import { getEnquiryThread } from "@/lib/data/account";

export const metadata = { title: "Enquiry" };

export default async function BuyerEnquiryPage({ params }: PageProps<"/account/enquiries/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/enquiries/${id}`);
  const thread = await getEnquiryThread(id);
  if (!thread || thread.enquiry.buyer_id !== user.id) notFound();
  const v = thread.enquiry.vehicle;
  return (
    <>
      <Breadcrumbs items={[{ href: "/account/enquiries", label: "My enquiries" }, { label: v ? `${v.make} ${v.model}` : "Enquiry" }]} />
      <div className="mt-6"><PageHeader title={v ? `${v.year} ${v.make} ${v.model}` : "Enquiry"} /></div>
      <EnquiryThread enquiry={thread.enquiry} messages={thread.messages} viewerId={user.id} role="buyer" />
    </>
  );
}
