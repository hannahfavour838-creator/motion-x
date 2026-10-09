import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/misc";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Sell your car",
  description: "List your vehicle on MOTION X, reach buyers across international markets and manage enquiries in one place.",
  alternates: { canonical: "/sell" },
};

const steps = [
  ["Create an account", "Choose a private seller or dealership account. It takes a minute."],
  ["Add your vehicle", "Enter the specification, location and your asking price in your own currency."],
  ["Submit the listing", "Upload up to 24 photographs and submit when you're ready."],
  ["Complete the review", "Our team checks new listings before they go live — usually quickly."],
  ["Receive enquiries", "Buyers contact you through MOTION X. Your email and phone stay private."],
  ["Manage until sold", "Update the price, pause, or mark the vehicle as sold whenever you need to."],
];

const faqs = [
  ["What does it cost?", "This version of MOTION X has no payment system and charges nothing to list. If fees are ever introduced, they will be published clearly before they apply to you."],
  ["Who can see my contact details?", "Nobody, unless you reply to them. Buyers send enquiries through MOTION X; you choose how to respond."],
  ["Why is my listing reviewed?", "Review helps keep the marketplace trustworthy. We check that listings are complete and genuine. Review is not a mechanical inspection."],
  ["Can buyers in other countries contact me?", "Yes. Make clear in your description whether you can help with export, and remind buyers that taxes, duties and compliance rules vary by destination."],
];

export default function SellPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden pb-20 pt-36 md:pb-32 md:pt-48">
        <div className="absolute inset-0 -z-10">
          <Image src="/renders/collection-performance.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/75 to-obsidian/20" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-obsidian to-transparent" />
        </div>
        <div className="container-x">
          <Eyebrow>For sellers</Eyebrow>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.6rem,6.5vw,6.5rem)] font-light uppercase leading-[0.92]">
            <span className="text-metal">Your cars deserve<br />a global stage.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-silver">
            Publish your vehicle once and make it discoverable to buyers across international markets, with a listing
            that does justice to the car — and enquiries you can manage in one place.
          </p>
          <div className="mt-10 flex flex-col gap-3 xs:flex-row">
            <ButtonLink href="/sell/start" size="lg" iconRight={<ArrowRight />}>List your car</ButtonLink>
            <ButtonLink href="/dealers" size="lg" variant="secondary">I&apos;m a dealership</ButtonLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="border-t border-line py-24 md:py-32">
        <div className="container-x">
          <Reveal><SectionHeading eyebrow="How it works" title={<span id="how">Six steps<br />to sold.</span>} /></Reveal>
          <ol className="mt-14 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(([t, b], i) => (
              <Reveal as="li" key={t} delay={(i % 3) * 80} className="bg-obsidian p-8">
                <span className="font-display text-5xl font-light text-electric/80">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 font-display text-lg uppercase tracking-wide">{t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{b}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="faq" className="border-t border-line py-24 md:py-32">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Questions" title={<span id="faq">Good to know.</span>} />
          <dl className="divide-y divide-line border-y border-line">
            {faqs.map(([q, a]) => (
              <div key={q} className="py-6">
                <dt className="font-display text-base uppercase tracking-wide text-white">{q}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line py-24 text-center">
        <div className="container-x">
          <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-light uppercase">Ready when you are.</h2>
          <div className="mt-10 flex justify-center"><ButtonLink href="/sell/start" size="lg" iconRight={<ArrowRight />}>Start your listing</ButtonLink></div>
        </div>
      </section>
    </>
  );
}
