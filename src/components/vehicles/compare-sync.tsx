"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCompare } from "@/components/providers/app-providers";

/** If the page was opened without ?ids=, load this browser's saved comparison. Shared links are left untouched. */
export function CompareSync({ urlIds }: { urlIds: string[] }) {
  const { ids } = useCompare();
  const router = useRouter();
  useEffect(() => {
    if (urlIds.length === 0 && ids.length > 0) router.replace(`/compare?ids=${ids.join(",")}`);
  }, [ids, urlIds, router]);
  return null;
}

export function RemoveFromCompare({ id, urlIds }: { id: string; urlIds: string[] }) {
  const { ids, toggle } = useCompare();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (ids.includes(id)) toggle(id);
        const rest = urlIds.filter((x) => x !== id);
        router.replace(rest.length ? `/compare?ids=${rest.join(",")}` : "/compare");
      }}
      className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted hover:text-white"
    >
      Remove
    </button>
  );
}
