import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";
import { listShowroomAssets } from "@/lib/data/assets";

export const metadata: Metadata = { title: "Credits & licences", alternates: { canonical: "/credits" } };

export default async function CreditsPage() {
  const assets = await listShowroomAssets();
  return (
    <ProsePage eyebrow="Credits" title="Credits & licences">
      <section>
        <h2>3D models</h2>
        <ul>
          {assets.map((a) => (
            <li key={a.id}><strong>{a.name}</strong> — {a.credit} Licence: {a.licenseUrl ? <a href={a.licenseUrl} target="_blank" rel="noopener noreferrer">{a.license}</a> : a.license}.</li>
          ))}
        </ul>
        <p>Modifications for MOTION X: logo surfaces removed, textures recompressed to WebP, geometry compressed with meshopt, and studio materials applied at runtime.</p>
      </section>
      <section>
        <h2>Illustrative renders</h2>
        <p>Images on demonstration listings and collection banners are generic illustrative renders produced by MOTION X&apos;s own procedural studio renderer. They are not photographs and do not depict any specific manufacturer&apos;s vehicle.</p>
      </section>
      <section>
        <h2>Typefaces & software</h2>
        <p>Geist and Geist Mono (SIL Open Font License), Archivo (SIL Open Font License). Built with Next.js, React, Three.js, React Three Fiber, drei, GSAP and Supabase.</p>
      </section>
      <section>
        <h2>Trademarks</h2>
        <p>Vehicle makes and model names are trademarks of their respective owners and are used only to describe listed vehicles. MOTION X is not affiliated with, or endorsed by, any manufacturer.</p>
      </section>
    </ProsePage>
  );
}
