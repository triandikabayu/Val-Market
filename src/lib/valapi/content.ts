import { cachedJson } from "./client";

// valorant-api skinlevels: displayIcon is the wide store art (full loadout icon)
export interface SkinLevel {
  uuid: string;
  displayName: string;
  displayIcon?: string | null;
}

export interface ContentTier {
  uuid: string;
  displayName: string;
  devName: string;
}

export interface SkinInfo {
  level: SkinLevel;
  tier: ContentTier | null;
}

interface ParentSkin {
  uuid: string;
  displayName: string;
  contentUuid?: string | null;
  levels?: { uuid: string }[];
}

let skinLevelIndex: Map<string, SkinLevel> | null = null;
let levelToParentTier: Map<string, ContentTier> | null = null;

async function buildIndexes(): Promise<void> {
  if (skinLevelIndex && levelToParentTier) return;

  const [levelsRes, tiersRes, skinsRes] = await Promise.all([
    cachedJson<{ data: SkinLevel[] }>(
      "https://valorant-api.com/v1/weapons/skinlevels?language=en-US",
    ),
    cachedJson<{ data: ContentTier[] }>(
      "https://valorant-api.com/v1/contenttiers?language=en-US",
    ),
    cachedJson<{ data: ParentSkin[] }>(
      "https://valorant-api.com/v1/weapons/skins?language=en-US",
    ),
  ]);

  skinLevelIndex = new Map(levelsRes.data.map((l) => [l.uuid, l]));
  const tierByUuid = new Map(tiersRes.data.map((t) => [t.uuid, t]));

  levelToParentTier = new Map();
  for (const skin of skinsRes.data) {
    const tier = skin.contentUuid ? tierByUuid.get(skin.contentUuid) : undefined;
    if (!tier) continue;
    for (const level of skin.levels ?? []) {
      levelToParentTier.set(level.uuid, tier);
    }
  }
}

/** Resolve a daily-store level uuid → display data. Null if uuid is unknown. */
export async function getSkinInfo(levelUuid: string): Promise<SkinInfo | null> {
  await buildIndexes();
  const level = skinLevelIndex?.get(levelUuid);
  if (!level) return null;
  return { level, tier: levelToParentTier?.get(levelUuid) ?? null };
}

// --- featured bundle ---------------------------------------------------------

export interface BundleInfo {
  name: string;
  art: string | null;
  description: string | null;
}

interface BundleRaw {
  uuid: string;
  displayName?: string | null;
  displayIcon2?: string | null;
  displayIcon?: string | null;
  description?: string | null;
}

function toBundleInfo(raw: BundleRaw): BundleInfo {
  return {
    name: raw.displayName ?? "Featured bundle",
    art: raw.displayIcon2 ?? raw.displayIcon ?? null,
    description: raw.description ?? null,
  };
}

const bundleCache = new Map<string, Promise<BundleInfo | null>>();

export function getBundle(uuid: string): Promise<BundleInfo | null> {
  let entry = bundleCache.get(uuid);
  if (!entry) {
    entry = cachedJson<{ data: BundleRaw }>(
      `https://valorant-api.com/v1/bundles/${uuid}?language=en-US`,
    )
      .then((res) => res.data)
      // some bundles 404 per-uuid but exist in the full list — retry there
      .catch(() =>
        cachedJson<{ data: BundleRaw[] }>(
          "https://valorant-api.com/v1/bundles?language=en-US",
        ).then((all) => all.data.find((b) => b.uuid === uuid) ?? null),
      )
      .then((raw) => (raw ? toBundleInfo(raw) : null))
      .catch(() => null);
    bundleCache.set(uuid, entry);
  }
  return entry;
}

// --- accessories (buddies, cards, sprays, titles) ----------------------------

export interface AccessoryInfo {
  name: string;
  icon: string | null;
  kind: string;
}

let accessoryIndexPromise: Promise<Map<string, AccessoryInfo>> | null = null;

async function buildAccessoryIndex(): Promise<Map<string, AccessoryInfo>> {
  const buddyRes = cachedJson<
    { data: { uuid: string; displayName: string; displayIcon?: string | null }[] }
  >("https://valorant-api.com/v1/buddies?language=en-US");
  const cardRes = cachedJson<
    { data: { uuid: string; displayName: string; largeArt?: string | null; displayIcon?: string | null }[] }
  >("https://valorant-api.com/v1/playercards?language=en-US");
  const sprayRes = cachedJson<
    { data: { uuid: string; displayName: string; displayIcon?: string | null }[] }
  >("https://valorant-api.com/v1/sprays?language=en-US");
  const titleRes = cachedJson<
    { data: { uuid: string; displayName: string; titleText?: string | null }[] }
  >("https://valorant-api.com/v1/playertitles?language=en-US");

  const [buddies, cards, sprays, titles] = await Promise.all([
    buddyRes,
    cardRes,
    sprayRes,
    titleRes,
  ]);
  const map = new Map<string, AccessoryInfo>();
  for (const b of buddies.data)
    map.set(b.uuid, { name: b.displayName, icon: b.displayIcon ?? null, kind: "Gun buddy" });
  for (const c of cards.data)
    map.set(c.uuid, { name: c.displayName, icon: c.largeArt ?? c.displayIcon ?? null, kind: "Player card" });
  for (const s of sprays.data)
    map.set(s.uuid, { name: s.displayName, icon: s.displayIcon ?? null, kind: "Spray" });
  for (const t of titles.data)
    map.set(t.uuid, { name: t.titleText ?? t.displayName, icon: null, kind: "Title" });
  return map;
}

function getAccessoryIndex(): Promise<Map<string, AccessoryInfo>> {
  accessoryIndexPromise ??= buildAccessoryIndex().catch((err) => {
    // one failed route must not poison the cached promise — allow retry
    accessoryIndexPromise = null;
    throw err;
  });
  return accessoryIndexPromise;
}

export async function getAccessory(
  itemId: string,
): Promise<AccessoryInfo | null> {
  const index = await getAccessoryIndex();
  return index.get(itemId) ?? null;
}
