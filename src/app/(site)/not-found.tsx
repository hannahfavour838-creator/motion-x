import { ArrowRight, ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[80svh] flex-col justify-center pb-24 pt-36">
      <p className="eyebrow">404</p>
      <h1 className="mt-6 font-display text-[clamp(2.4rem,7vw,6rem)] font-light uppercase leading-[0.92]"><span className="text-metal">Off the map.</span></h1>
      <p className="mt-6 max-w-md text-muted">This page doesn&apos;t exist, or the listing is no longer available.</p>
      <div className="mt-10 flex flex-col gap-3 xs:flex-row">
        <ButtonLink href="/cars" iconRight={<ArrowRight />}>Discover cars</ButtonLink>
        <ButtonLink href="/" variant="secondary">Home</ButtonLink>
      </div>
    </div>
  );
}
