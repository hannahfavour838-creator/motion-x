import { getImageProps } from "next/image";

/**
 * Art-directed still of the studio car. It is the Largest Contentful Paint
 * element, the backdrop while the 3D studio loads, and the permanent fallback
 * when WebGL is unavailable. It is a render of the same 3D model.
 */
export function HeroPoster({ className }: { className?: string }) {
  const common = { alt: "", sizes: "100vw", priority: true } as const;
  const { props: { srcSet: desktop } } = getImageProps({ ...common, width: 2400, height: 1350, quality: 85, src: "/renders/hero-fallback.webp" });
  const { props: { srcSet: mobile, ...rest } } = getImageProps({ ...common, width: 1080, height: 1500, quality: 75, src: "/renders/hero-fallback-mobile.webp" });
  return (
    <picture className={className}>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <source media="(max-width: 767px)" srcSet={mobile} />
      <img {...rest} alt="" className="h-full w-full object-cover" fetchPriority="high" />
    </picture>
  );
}
