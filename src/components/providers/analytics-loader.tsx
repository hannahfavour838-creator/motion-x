"use client";

import { useEffect } from "react";
import { analyticsOptedOut } from "@/lib/analytics";

/** Loads the cookieless analytics script unless the visitor opted out on /cookies. */
export function AnalyticsLoader({ domain, src }: { domain: string; src: string }) {
  useEffect(() => {
    if (analyticsOptedOut() || document.getElementById("mx-analytics")) return;
    const s = document.createElement("script");
    s.id = "mx-analytics";
    s.defer = true;
    s.dataset.domain = domain;
    s.src = src;
    document.head.appendChild(s);
  }, [domain, src]);
  return null;
}
