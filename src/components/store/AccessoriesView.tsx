"use client";

import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { getAccessory, type AccessoryInfo } from "@/lib/valapi/content";
import { CountdownTimer } from "./CountdownTimer";
import type { AccessorySlice } from "@/lib/riot/storefront";

interface ResolvedItem extends AccessoryInfo {
  itemId: string;
  cost: number;
}

export function AccessoriesView({ slice }: { slice: AccessorySlice }) {
  const [items, setItems] = useState<ResolvedItem[] | null>(null);
  const countdown = useCountdown(slice.remainingSeconds);

  useEffect(() => {
    let live = true;
    void (async () => {
      const resolved = await Promise.all(
        slice.items.map(async (it) => {
          const info = await getAccessory(it.itemId).catch(() => null);
          return {
            itemId: it.itemId,
            cost: it.cost,
            name: info?.name ?? "Unknown item",
            icon: info?.icon ?? null,
            kind: info?.kind ?? "Accessory",
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
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {Array.from({ length: Math.min(slice.items.length, 6) }, (_, i) => (
          <div key={i} className="border border-line bg-surface" aria-hidden>
            <div className="skeleton-shimmer aspect-square w-full bg-surface-2" />
            <div className="flex flex-col gap-3 p-4">
              <div className="skeleton-shimmer h-5 w-full bg-surface-2" />
              <div className="skeleton-shimmer h-4 w-16 bg-surface-2" />
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
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {items.map((item, i) => (
          <article
            key={item.itemId}
            className="skin-card flex flex-col border border-line bg-surface"
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="aspect-square w-full overflow-hidden bg-surface-2 p-5">
              {item.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.icon}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {item.kind}
              </span>
              <h3 className="text-sm font-medium leading-snug text-ink">
                {item.name}
              </h3>
              <p className="mt-auto flex items-baseline gap-1.5 pt-2 font-mono text-sm text-ink">
                {item.cost}
                <span className="text-xs font-medium text-ink-muted">KC</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
