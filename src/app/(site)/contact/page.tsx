import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";
import { ContactForm } from "@/components/forms/contact-form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const sp = await searchParams;
  const topic = typeof sp.topic === "string" ? sp.topic : "other";
  return (
    <ProsePage eyebrow="Contact" title="Contact us" intro={<>Questions about buying, selling, dealerships or trust &amp; safety — send us a message.{siteConfig.contactEmail && <> You can also email <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.</>}</>}>
      <ContactForm defaultTopic={topic} />
    </ProsePage>
  );
}
