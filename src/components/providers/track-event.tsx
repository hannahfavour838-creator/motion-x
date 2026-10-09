"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Fires a privacy-safe analytics event once per mount / props change. */
export function TrackEvent({ event, props }: { event: AnalyticsEvent; props?: Record<string, string | number | boolean> }) {
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on serialised props
  }, [event, key]);
  return null;
}
