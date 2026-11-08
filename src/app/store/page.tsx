"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  SkinCard,
  SkinCardSkeleton,
  type DailyItem,
} from "@/components/store/SkinCard";
import { CountdownTimer } from "@/components/store/CountdownTimer";
import { StoreTabs, type TabId } from "@/components/store/StoreTabs";
import { BundleView } from "@/components/store/BundleView";
import { AccessoriesView } from "@/components/store/AccessoriesView";
import { NightMarketView } from "@/components/store/NightMarketView";
import {
  fetchStorefront,
  mapAccessories,
  mapBundles,
  mapDailyOffers,
  mapNightMarket,
  type AccessorySlice,
  type BundleSlice,
  type NightSlice,
} from "@/lib/riot/storefront";
import { getSkinInfo } from "@/lib/valapi/content";
import { useCountdown } from "@/hooks/useCountdown";
import { useSession } from "@/lib/session";

interface StoreData {
  daily: { items: DailyItem[]; remainingSeconds: number };
  bundles: BundleSlice[];
  accessories: AccessorySlice | null;
  night: NightSlice | null;
}

type StoreState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: StoreData };

const VALID_TABS: TabId[] = ["daily", "bundle", "accessories", "night"];

function tabFromUrl(): TabId {
  if (typeof window === "undefined") return "daily";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "daily";
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-line bg-surface p-6 text-sm leading-relaxed text-ink-muted">
      {children}
    </p>
  );
}

export default function StorePage() {
  const router = useRouter();
  const { session, logout } = useSession();
  const [state, setState] = useState<StoreState>({ status: "loading" });
  const [tab, setTab] = useState<TabId>(tabFromUrl);

  useEffect(() => {
    if (!session) router.replace("/");
  }, [session, router]);

  // tab state lives in the URL: back/forward buttons and refreshes keep it
  useEffect(() => {
    const sync = () => setTab(tabFromUrl());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const changeTab = useCallback((next: TabId) => {
    setTab(next);
    window.history.pushState(null, "", `?tab=${next}`);
  }, []);

  const run = useCallback(async () => {
    if (!session) return;
    setState({ status: "loading" });
    try {
      // one storefront fetch per session — no polling, no background refresh
      const sf = await fetchStorefront(session);
      const panel = mapDailyOffers(sf);
      const items = await Promise.all(
        panel.offers.map(async (offer) => {
          const info = await getSkinInfo(offer.offerId).catch(() => null);
          return {
            ...offer,
            name: info?.level.displayName ?? "Unknown item",
            art: info?.level.displayIcon ?? null,
            tierName: info?.tier?.displayName ?? null,
          } satisfies DailyItem;
        }),
      );
      const data: StoreData = {
        daily: { items, remainingSeconds: panel.remainingSeconds },
        bundles: mapBundles(sf),
        accessories: mapAccessories(sf),
        night: mapNightMarket(sf),
      };
      setState({ status: "ready", data });
      // temporary diagnostic: which sections did Riot send? (see terminal)
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        void invoke("debug_log", {
          message: `storefront sections — daily:${panel.offers.length} offers, bundles:${data.bundles.length}, accessories:${data.accessories ? data.accessories.items.length : "absent"}, night:${data.night ? data.night.items.length : "absent"}, top-level keys: ${Object.keys(sf).join(",")}`,
        });
      } catch {
        /* not running inside Tauri */
      }
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Storefront fetch failed.",
      });
    }
  }, [session]);

  useEffect(() => {
    void run();
  }, [run]);

  const countdown = useCountdown(
    state.status === "ready" ? state.data.daily.remainingSeconds : null,
  );

  if (!session) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-(--z-sticky) flex h-16 items-center justify-between border-b border-line bg-bg px-4">
        <Wordmark />
        <Button variant="ghost" onClick={logout}>
          Sign out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-10 md:py-16">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink">
          Your store
        </h1>
        <p className="mt-2 text-base text-ink-muted">
          {session.shard.toUpperCase()} · everything Riot has on rotation for
          your account.
        </p>

        {state.status === "loading" && (
          <div className="mt-8">
            <div className="skeleton-shimmer h-5 w-40 bg-surface-2" />
            <div
              className="mt-6 grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
            >
              {Array.from({ length: 4 }, (_, i) => (
                <SkinCardSkeleton key={i} index={i} />
              ))}
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-8">
            <ErrorState message={state.message} onRetry={() => void run()} />
          </div>
        )}

        {state.status === "ready" && (
          <>
            <div className="mt-8">
              <StoreTabs active={tab} onChange={changeTab} />
            </div>

            <div className="mt-8" role="tabpanel">
              {tab === "daily" && (
                <section className="flex flex-col gap-6">
                  <CountdownTimer text={countdown} />
                  {state.data.daily.items.length === 0 ? (
                    <EmptyNote>
                      No daily offers on your account right now. This can
                      happen right around the daily reset — try again in a few
                      minutes.
                    </EmptyNote>
                  ) : (
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      }}
                    >
                      {state.data.daily.items.map((item, i) => (
                        <SkinCard key={item.offerId} item={item} index={i} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === "bundle" &&
                (state.data.bundles.length > 0 ? (
                  <div className="flex flex-col gap-10">
                    {state.data.bundles.map((b) => (
                      <BundleView key={b.uuid} bundle={b} />
                    ))}
                  </div>
                ) : (
                  <EmptyNote>No featured bundle on your store right now.</EmptyNote>
                ))}

              {tab === "accessories" &&
                (state.data.accessories ? (
                  <AccessoriesView slice={state.data.accessories} />
                ) : (
                  <EmptyNote>No accessory offers right now.</EmptyNote>
                ))}

              {tab === "night" &&
                (state.data.night ? (
                  <NightMarketView slice={state.data.night} />
                ) : (
                  <EmptyNote>
                    Night market is not active right now — it returns a few
                    times per season. This tab will fill in when it does.
                  </EmptyNote>
                ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
