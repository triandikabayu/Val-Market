"use client";

// ponytail: tier colors are client-faithful approximations shared by checker
// projects — adjust if the game client disagrees, not hardcoded game DATA
// (names + tiers still come from valorant-api at runtime)
const TIER_COLORS: Record<string, string> = {
  "Select Edition": "#687e81",
  "Deluxe Edition": "#21bd6b",
  "Premium Edition": "#f9d869",
  "Exclusive Edition": "#fa7f43",
  "Ultra Edition": "#b76cef",
};

interface RarityTagProps {
  tierName: string | null;
}

export function RarityTag({ tierName }: RarityTagProps) {
  if (!tierName) return null;
  const color = TIER_COLORS[tierName] ?? "#a9afb4";
  return (
    <span
      className="inline-block border px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
      style={{ color, borderColor: color }}
    >
      {tierName.replace(" Edition", "")}
    </span>
  );
}
