"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/misc";

export default function SiteError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="container-x pb-24 pt-36">
      <ErrorState title="This page couldn't load" action={<div className="flex gap-3"><Button onClick={() => retry()}>Try again</Button><ButtonLink href="/" variant="secondary">Home</ButtonLink></div>}>
        A temporary problem stopped this page from loading. Please try again.
      </ErrorState>
    </div>
  );
}
