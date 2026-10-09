"use client";

import { useState } from "react";

/** Honeypot + timing fields used by public forms to deter automated spam. */
export function BotFields() {
  const [startedAt] = useState(() => Date.now());
  return (
    <>
      <input type="hidden" name="started_at" value={startedAt} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
    </>
  );
}
