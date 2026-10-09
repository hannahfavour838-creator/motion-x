import Image from "next/image";
import type { ReactNode } from "react";
import { FormMessage } from "@/components/ui/form";
import { isSupabaseConfigured } from "@/lib/env";

export function AuthShell({ eyebrow, title, children, footer }: { eyebrow: string; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const configured = isSupabaseConfigured();
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/renders/showroom-side.webp" alt="" fill sizes="55vw" className="object-cover object-[35%_center] opacity-80" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-obsidian/30 to-obsidian" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-obsidian to-transparent" />
        <p className="absolute bottom-14 left-14 max-w-sm font-display text-3xl uppercase leading-tight text-white">
          The world is<br />your showroom.
        </p>
      </div>
      <div className="flex items-center px-5 pb-16 pt-28 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-light uppercase leading-none">{title}</h1>
          {!configured && (
            <div className="mt-8">
              <FormMessage tone="info">
                Accounts are powered by Supabase Auth, which is not configured in this preview. Add your Supabase
                credentials (see README) to enable sign-up and sign-in.
              </FormMessage>
            </div>
          )}
          <div className="mt-10">{children}</div>
          {footer && <div className="mt-10 border-t border-line pt-6 text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
