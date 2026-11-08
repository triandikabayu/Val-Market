"use client";

export type TabId = "daily" | "bundle" | "accessories" | "night";

const TABS: { id: TabId; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "bundle", label: "Bundle" },
  { id: "accessories", label: "Accessories" },
  { id: "night", label: "Night Market" },
];

interface StoreTabsProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function StoreTabs({ active, onChange }: StoreTabsProps) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.id === active);
    const next =
      e.key === "ArrowRight"
        ? (idx + 1) % TABS.length
        : (idx - 1 + TABS.length) % TABS.length;
    onChange(TABS[next].id);
    document.getElementById(`tab-${TABS[next].id}`)?.focus();
  };

  return (
    <div role="tablist" className="flex gap-6 border-b border-line">
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={onKeyDown}
            onClick={() => onChange(t.id)}
            className={`relative pb-3 text-sm font-bold uppercase tracking-wide transition-colors duration-200 ease-(--ease-out-quart) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              isActive ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
            <span
              aria-hidden
              className={`absolute inset-x-0 -bottom-px h-[2px] origin-left bg-accent transition-transform duration-200 ease-(--ease-out-quart) ${
                isActive ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
