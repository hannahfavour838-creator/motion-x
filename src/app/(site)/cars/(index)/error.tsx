"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/misc";

export default function CarsError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="container-x pb-24 pt-36">
      <ErrorState
        title="We couldn't load vehicles"
        action={
          <div className="flex gap-3">
            <Button onClick={() => retry()}>Try again</Button>
            <ButtonLink href="/" variant="secondary">Back home</ButtonLink>
          </div>
        }
      >
        The marketplace is temporarily unavailable. Your filters are kept in the address bar, so you can retry without losing them.
      </ErrorState>
    </div>
  );
}
