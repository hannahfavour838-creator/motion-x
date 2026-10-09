"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/form";

export function CookiePreferences() {
  const [optedOut, setOptedOut] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser cookie
    setOptedOut(document.cookie.split("; ").includes("mx_analytics=off"));
  }, []);
  const set = (off: boolean) => {
    document.cookie = off ? "mx_analytics=off; path=/; max-age=31536000; samesite=lax" : "mx_analytics=; path=/; max-age=0; samesite=lax";
    setOptedOut(off);
  };
  return (
    <div className="mt-4">
      <Checkbox checked={!optedOut} onChange={(e) => set(!e.target.checked)} label="Allow anonymous analytics on this device" />
      <p className="mt-2 text-xs text-dim" role="status">{optedOut ? "Analytics are off for this device." : "Analytics are on for this device."}</p>
    </div>
  );
}
