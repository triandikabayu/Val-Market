"use client";

import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { getBundle, getSkinInfo, type BundleInfo } from "@/lib/valapi/content";
import { SkinCard, type DailyItem } from "./SkinCard";
import { CountdownTimer } from "./CountdownTimer";
import type { BundleSlice } from "@/lib/riot/storefront";

interface BundleDetails {
  info: BundleInfo;
  items: DailyItem[];
}

export function BundleView({ bundle }: { bundle: BundleSlice }) {
  const [details, setDetails] = useState<BundleDetails | null>(null);
  const countdown = useCountdown(bundle.remainingSeconds);

  useEffect(() => {
    let live = true;
    void (async () => {
      const info = await getBundle(bundle.uuid);
      const items = await Promise.all(
        bundle.items.map(async (it) => {
          const info = await getSkinInfo(it.levelId).catch(() => null);
          return {
            offerId: it.levelId,
            vp: it.discountedPrice || it.basePrice,
            name: info?.level.displayName ?? "Item",
            art: info?.level.displayIcon ?? null,
            tierName: info?.tier?.displayName ?? null,
          } satisfies DailyItem;
        }),
      );
      // temporary diagnostic (see terminal): bundle uuid + what resolved
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        void invoke("debug_log", {
          message: `bundle render: uuid=${bundle.uuid} info=${info ? `"${info.name}" art=${info.art ? "yes" : "no"}` : "null"} items=${items.length}/${bundle.items.length}`,
        });
      } catch {
        /* not running inside Tauri */
      }
      if (live) {
        setDetails({
          info: info ?? { name: "Featured bundle", art: null, description: null },
          items,
        });
      }
    })();
    return () => {
      live = false;
    };
  }, [bundle]);

  if (!details) {
    return (
      <div className="skeleton-shimmer aspect-[2.4/1] w-full border border-line bg-surface-2" />
    );
  }

  const onSale = bundle.discountPercent > 0;

  return (
    <section className="flex flex-col gap-6">
      <CountdownTimer text={countdown} />

      <article className="border border-line bg-surface">
        <div className="aspect-[2.4/1] w-full overflow-hidden bg-surface-2">
          {details.info.art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={details.info.art}
              alt={details.info.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-3 p-5">
          <h3 className="font-display text-2xl uppercase tracking-wide text-ink">
            {details.info.name}
          </h3>
          {details.info.description && (
            <p className="max-w-[65ch] text-sm leading-relaxed text-ink-muted">
              {details.info.description}
            </p>
          )}
          <p className="flex items-baseline gap-2 font-mono text-lg text-ink">
            {onSale && (
              <span className="text-sm text-ink-muted line-through">
                {bundle.baseVp}
              </span>
            )}
            <span className={onSale ? "text-accent" : ""}>
              {bundle.discountedVp}
            </span>
            <span className="text-xs font-medium text-ink-muted">VP</span>
            {onSale && (
              <span className="ml-1 border border-accent px-2 py-0.5 text-xs font-bold text-accent">
                -{bundle.discountPercent}%
              </span>
            )}
          </p>
        </div>
      </article>

      {details.items.length > 0 && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {details.items.map((item, i) => (
            <SkinCard key={item.offerId} item={item} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
