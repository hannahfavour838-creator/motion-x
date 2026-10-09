import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/misc";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "For dealers",
  description: "Dealer storefronts, inventory management, enquiry handling and business verification on MOTION X.",
  alternates: { canonical: "/dealers" },
};

const tools = [
  ["Storefront", "A public dealership page with your logo, description, location, contact options and live inventory."],
  ["Inventory management", "Create, edit, pause and mark vehicles sold. Upload up to 24 photographs per vehicle with progress feedback."],
  ["Enquiry inbox", "Every buyer message in one place, with status tracking and replies for signed-in buyers."],
  ["WhatsApp enquiries", "Add a business WhatsApp number to show a WhatsApp button on your listings."],
  ["Listing performance", "Views, 30-day views, saves and enquiries for each vehicle — counted from real activity."],
  ["Business verification", "Apply for a “Business verified” badge, reviewed by the MOTION X team against your registration details."],
  ["Inspection requests", "Let buyers request an independent pre-purchase inspection and manage requests in your dashboard."],
  ["3D showroom", "Licensed 3D models can be attached to listings by our team, opening them in the interactive studio."],
];

export default function DealersPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden pb-20 pt-36 md:pb-28 md:pt-48">
        <div className="absolute inset-0 -z-10">
          <Image src="/renders/collection-luxury.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/75 to-obsidian/10" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-obsidian to-transparent" />
        </div>
        <div className="container-x">
          <Eyebrow>For dealerships</Eyebrow>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.6rem,6.5vw,6.5rem)] font-light uppercase leading-[0.92]">
            <span className="text-metal">Your inventory.<br />A world of opportunity.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-silver">
            Bring your vehicles online, connect with interested buyers, and manage your listings through one sophisticated platform.
          </p>
          <div className="mt-10 flex flex-col gap-3 xs:flex-row">
            <ButtonLink href="/sign-up?type=dealer" size="lg" iconRight={<ArrowRight />}>Register your dealership</ButtonLink>
            <ButtonLink href="/dealers/directory" size="lg" variant="secondary">Dealer directory</ButtonLink>
          </div>
        </div>
      </section>
      <section aria-labelledby="tools" className="border-t border-line py-24 md:py-32">
        <div className="container-x">
          <Reveal><SectionHeading eyebrow="Dealer tools" title={<span id="tools">Everything included<br />today.</span>}>These are the tools available in the current platform — nothing listed here is a future promise.</SectionHeading></Reveal>
          <ul className="mt-14 grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
            {tools.map(([t, b], i) => (
              <Reveal as="li" key={t} delay={(i % 4) * 70} className="bg-obsidian p-7">
                <span className="font-mono text-[0.65rem] text-electric">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-base uppercase tracking-wide">{t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{b}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
      <section aria-labelledby="onboard" className="border-t border-line py-24 md:py-32">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <SectionHeading eyebrow="Onboarding" title={<span id="onboard">Live in<br />three steps.</span>} />
          <ol className="space-y-px bg-line">
            {[
              ["Register", "Create a dealership account with your business name and email."],
              ["Build your storefront", "Add your logo, location, website and public contact details."],
              ["Publish inventory & verify", "Add vehicles for review and apply for business verification."],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-6 bg-obsidian p-6">
                <span className="font-display text-3xl font-light text-electric/80">{i + 1}</span>
                <div><h3 className="font-display uppercase tracking-wide">{t}</h3><p className="mt-2 text-sm text-muted">{b}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
