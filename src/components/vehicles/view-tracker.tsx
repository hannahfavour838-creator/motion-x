"use client";

import { useEffect } from "react";
import { recordView } from "@/app/actions/public";
import { track } from "@/lib/analytics";

/** Records one listing view per browser session (for seller performance stats). */
export function ViewTracker({ vehicleId }: { vehicleId: string }) {
  useEffect(() => {
    const key = `mx-viewed:${vehicleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable — still count once per mount */
    }
    track("listing_view");
    void recordView(vehicleId);
  }, [vehicleId]);
  return null;
}
