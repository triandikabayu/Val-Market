"use client";

import { useState } from "react";
import { RarityTag } from "./RarityTag";

export interface DailyItem {
  offerId: string;
  vp: number;
  name: string;
  art: string | null;
  tierName: string | null;
}

export function SkinCard({ item, index = 0 }: { item: DailyItem; index?: number }) {
  const [artLoaded, setArtLoaded] = useState(false);

  return (
    <article
      className="skin-card flex flex-col border border-line bg-surface"
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="aspect-video w-full overflow-hidden bg-surface-2 p-4">
        {item.art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.art}
            alt={item.name}
            loading="lazy"
            onLoad={() => setArtLoaded(true)}
            className={`skin-art h-full w-full object-contain ${artLoaded ? "is-loaded" : ""}`}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <RarityTag tierName={item.tierName} />
        <h3 className="text-base font-medium leading-snug text-ink">
          {item.name}
        </h3>
        <p className="mt-auto flex items-baseline gap-1.5 font-mono text-sm text-ink">
          {item.vp}
          <span className="text-xs font-medium text-ink-muted">VP</span>
        </p>
      </div>
    </article>
  );
}

export function SkinCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="flex flex-col border border-line bg-surface"
      aria-hidden
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="skeleton-shimmer aspect-video w-full bg-surface-2" />
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton-shimmer h-5 w-24 bg-surface-2" />
        <div className="skeleton-shimmer h-5 w-full bg-surface-2" />
        <div className="skeleton-shimmer mt-auto h-5 w-16 bg-surface-2" />
      </div>
    </div>
  );
}
