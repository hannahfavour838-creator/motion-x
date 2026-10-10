"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isDemoVehicleId } from "@/lib/demo-mode";
import { getBrowserClient } from "@/lib/supabase/client";
import { ToastProvider } from "@/components/ui/toast";
import type { ExchangeRates } from "@/lib/types";

// ── Session (lightweight, for chrome only — never used for authorisation) ──
export interface ClientSession {
  id: string;
  displayName: string;
  accountType: "buyer" | "private_seller" | "dealer";
  isAdmin: boolean;
}

interface SessionState {
  session: ClientSession | null;
  loading: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState>({ session: null, loading: false, configured: false, refresh: async () => {} });

function SessionProvider({ children }: { children: ReactNode }) {
  const supabase = getBrowserClient();
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setSession(null);
      setLoading(false);
      return;
    }
    const [{ data: profile }, { data: isAdmin }] = await Promise.all([
      supabase.from("profiles").select("display_name, account_type").eq("id", data.user.id).maybeSingle(),
      supabase.rpc("is_admin"),
    ]);
    setSession({
      id: data.user.id,
      displayName: profile?.display_name ?? data.user.email?.split("@")[0] ?? "Member",
      accountType: (profile?.account_type as ClientSession["accountType"]) ?? "buyer",
      isAdmin: Boolean(isAdmin),
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session load from an external system
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, refresh]);

  return (
    <SessionContext.Provider value={{ session, loading, configured: Boolean(supabase), refresh }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

// ── Favourites ─────────────────────────────────────────────────────────────
interface FavouritesState {
  ids: Set<string>;
  toggle: (vehicleId: string) => Promise<"added" | "removed" | "auth" | "error" | "unavailable" | "demo">;
}
const FavouritesContext = createContext<FavouritesState>({ ids: new Set(), toggle: async () => "unavailable" });

function FavouritesProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const supabase = getBrowserClient();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!supabase || !session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when signed out
      setIds(new Set());
      return;
    }
    let cancelled = false;
    supabase.from("favourites").select("vehicle_id").then(({ data }) => {
      if (!cancelled) setIds(new Set((data ?? []).map((r) => r.vehicle_id as string)));
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, session]);

  const toggle = useCallback<FavouritesState["toggle"]>(async (vehicleId) => {
    if (!supabase) return "unavailable";
    if (isDemoVehicleId(vehicleId)) return "demo"; // fictional listing — nothing to save in the database
    if (!session) return "auth";
    const has = ids.has(vehicleId);
    setIds((prev) => {
      const next = new Set(prev);
      if (has) next.delete(vehicleId); else next.add(vehicleId);
      return next;
    });
    const { error } = has
      ? await supabase.from("favourites").delete().eq("user_id", session.id).eq("vehicle_id", vehicleId)
      : await supabase.from("favourites").insert({ user_id: session.id, vehicle_id: vehicleId });
    if (error) {
      setIds((prev) => {
        const next = new Set(prev);
        if (has) next.add(vehicleId); else next.delete(vehicleId);
        return next;
      });
      return "error";
    }
    return has ? "removed" : "added";
  }, [supabase, session, ids]);

  return <FavouritesContext.Provider value={{ ids, toggle }}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  return useContext(FavouritesContext);
}

// ── Compare (stored in this browser) ──────────────────────────────────────
export const COMPARE_MAX = 4;
const COMPARE_KEY = "mx-compare";
interface CompareState {
  ids: string[];
  toggle: (id: string) => "added" | "removed" | "full";
  clear: () => void;
}
const CompareContext = createContext<CompareState>({ ids: [], toggle: () => "full", clear: () => {} });

function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage
      if (Array.isArray(raw)) setIds(raw.filter((x) => typeof x === "string").slice(0, COMPARE_MAX));
    } catch {
      /* storage unavailable */
    }
  }, []);
  const persist = (next: string[]) => {
    setIds(next);
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };
  const toggle = (id: string) => {
    if (ids.includes(id)) {
      persist(ids.filter((x) => x !== id));
      return "removed" as const;
    }
    if (ids.length >= COMPARE_MAX) return "full" as const;
    persist([...ids, id]);
    return "added" as const;
  };
  return <CompareContext.Provider value={{ ids, toggle, clear: () => persist([]) }}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  return useContext(CompareContext);
}

// ── Display currency preferences ──────────────────────────────────────────
interface PrefsState {
  rates: ExchangeRates | null;
  rateAttribution: string | null;
  displayCurrency: string | null;
  setDisplayCurrency: (c: string | null) => void;
  displayCurrencies: string[];
}
const PrefsContext = createContext<PrefsState>({ rates: null, rateAttribution: null, displayCurrency: null, setDisplayCurrency: () => {}, displayCurrencies: [] });

function PrefsProvider({ children, rates, rateAttribution, displayCurrencies }: { children: ReactNode; rates: ExchangeRates | null; rateAttribution: string | null; displayCurrencies: string[] }) {
  const [displayCurrency, setCur] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mx-currency");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage
      if (saved && displayCurrencies.includes(saved)) setCur(saved);
    } catch {
      /* ignore */
    }
  }, [displayCurrencies]);
  const setDisplayCurrency = (c: string | null) => {
    setCur(c);
    try {
      if (c) localStorage.setItem("mx-currency", c); else localStorage.removeItem("mx-currency");
    } catch {
      /* ignore */
    }
  };
  return (
    <PrefsContext.Provider value={{ rates, rateAttribution, displayCurrency: rates ? displayCurrency : null, setDisplayCurrency, displayCurrencies: rates ? displayCurrencies : [] }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  return useContext(PrefsContext);
}

export function AppProviders({ children, rates, rateAttribution, displayCurrencies }: { children: ReactNode; rates: ExchangeRates | null; rateAttribution: string | null; displayCurrencies: string[] }) {
  const memoCurrencies = useMemo(() => displayCurrencies, [displayCurrencies]);
  return (
    <ToastProvider>
      <PrefsProvider rates={rates} rateAttribution={rateAttribution} displayCurrencies={memoCurrencies}>
        <SessionProvider>
          <FavouritesProvider>
            <CompareProvider>{children}</CompareProvider>
          </FavouritesProvider>
        </SessionProvider>
      </PrefsProvider>
    </ToastProvider>
  );
}
