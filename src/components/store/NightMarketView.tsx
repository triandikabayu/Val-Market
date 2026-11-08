"use client";

import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { getSkinInfo } from "@/lib/valapi/content";
import { CountdownTimer } from "./CountdownTimer";
import { RarityTag } from "./RarityTag";
import type { NightSlice } from "@/lib/riot/storefront";

interface ResolvedNightItem {
  levelUuid: string;
  name: string;
  art: string | null;
  tierName: string | null;
  baseVp: number;
  discountVp: number;
}

export function NightMarketView({ slice }: { slice: NightSlice }) {
  const [items, setItems] = useState<ResolvedNightItem[] | null>(null);
  const countdown = useCountdown(slice.remainingSeconds);

  useEffect(() => {
    let live = true;
    void (async () => {
      const resolved = await Promise.all(
        slice.items.map(async (it) => {
          const info = await getSkinInfo(it.levelUuid).catch(() => null);
          return {
            levelUuid: it.levelUuid,
            name: info?.level.displayName ?? "Unknown item",
            art: info?.level.displayIcon ?? null,
            tierName: info?.tier?.displayName ?? null,
            baseVp: it.baseVp,
            discountVp: it.discountVp,
          };
        }),
      );
      if (live) setItems(resolved);
    })();
    return () => {
      live = false;
    };
  }, [slice]);

  if (!items) {
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
      >
        {Array.from({ length: Math.min(slice.items.length, 6) }, (_, i) => (
          <div key={i} className="border border-line bg-surface" aria-hidden>
            <div className="skeleton-shimmer aspect-video w-full bg-surface-2" />
            <div className="flex flex-col gap-3 p-4">
              <div className="skeleton-shimmer h-5 w-24 bg-surface-2" />
              <div className="skeleton-shimmer h-5 w-full bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <CountdownTimer text={countdown} />
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
      >
        {items.map((item, i) => (
          <article
            key={item.levelUuid}
            className="skin-card flex flex-col border border-line bg-surface"
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="aspect-video w-full overflow-hidden bg-surface-2 p-4">
              {item.art && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.art}
                  alt={item.name}
                  loading="lazy"
                  className="skin-art h-full w-full object-contain is-loaded"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <RarityTag tierName={item.tierName} />
              <h3 className="text-base font-medium leading-snug text-ink">
                {item.name}
              </h3>
              <p className="mt-auto flex items-baseline gap-2 font-mono text-sm text-ink">
                <span className="text-ink-muted line-through">{item.baseVp}</span>
                <span className="text-accent">{item.discountVp}</span>
                <span className="text-xs font-medium text-ink-muted">VP</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
