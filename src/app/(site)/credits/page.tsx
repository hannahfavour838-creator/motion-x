import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";
import { listShowroomAssets } from "@/lib/data/assets";
import { allDemoPhotoCredits } from "@/lib/demo/inventory";

export const metadata: Metadata = { title: "Credits & licences", alternates: { canonical: "/credits" } };

export default async function CreditsPage() {
  const assets = await listShowroomAssets();
  const photos = allDemoPhotoCredits();
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
        <h2>Photographs on demonstration listings</h2>
        <p>
          Demonstration listings are fictional. Each is illustrated by a representative photograph of the same make, model and generation from{" "}
          <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>, used under the licence shown. The
          photographs do not show the vehicles described. Listing colours and trims were chosen to match the photographs.
        </p>
        <p>
          Modifications for MOTION X: resized, cropped or extended to a 3:2 frame with a blurred backdrop, registration plates obscured, and converted to
          WebP. Adapted versions of CC BY-SA photographs are shared under the same licence as the original. Collection banners reuse the photographs
          credited below.
        </p>
        <ul>
          {photos.map(({ vehicle, photo }) => (
            <li key={vehicle.id}>
              <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong> (demonstration listing) —{" "}
              <a href={photo.credit.sourceUrl} target="_blank" rel="noopener noreferrer">{photo.credit.title}</a> by {photo.credit.author}.{" "}
              Licence:{" "}
              {photo.credit.licenceUrl ? (
                <a href={photo.credit.licenceUrl} target="_blank" rel="noopener noreferrer license">{photo.credit.licence}</a>
              ) : (
                photo.credit.licence
              )}
              .
            </li>
          ))}
        </ul>
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
