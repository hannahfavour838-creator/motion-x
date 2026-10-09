import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { Breadcrumbs } from "@/components/ui/misc";
import { AutoMarkRead, EnquiryStatusControls } from "@/components/dashboard/enquiry-components";
import { EnquiryThread } from "@/components/dashboard/enquiry-thread";
import { requireSeller } from "@/lib/auth";
import { getEnquiryThread } from "@/lib/data/account";

export const metadata = { title: "Enquiry" };

export default async function EnquiryPage({ params }: PageProps<"/dashboard/enquiries/[id]">) {
  const { id } = await params;
  const user = await requireSeller(`/dashboard/enquiries/${id}`);
  const thread = await getEnquiryThread(id);
  if (!thread || thread.enquiry.seller_id !== user.id) notFound();
  return (
    <>
      <Breadcrumbs items={[{ href: "/dashboard/enquiries", label: "Enquiries" }, { label: thread.enquiry.name }]} />
      <div className="mt-6">
        <PageHeader title={`From ${thread.enquiry.name}`} actions={<EnquiryStatusControls id={id} status={thread.enquiry.status} />} />
      </div>
      <AutoMarkRead id={id} status={thread.enquiry.status} />
      <EnquiryThread enquiry={thread.enquiry} messages={thread.messages} viewerId={user.id} role="seller" />
    </>
  );
}
