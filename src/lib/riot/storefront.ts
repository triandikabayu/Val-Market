import { riotFetch } from "./http";
import { getClientVersion, CLIENT_PLATFORM } from "./platform";
import { RiotError, type Session, type Shard } from "./auth";

export interface DailyOffer {
  offerId: string;
  vp: number;
}

export interface DailyPanel {
  offers: DailyOffer[];
  remainingSeconds: number;
}

export interface StoreCost {
  OfferID?: string;
  Cost?: Record<string, number>;
  Rewards?: { ItemTypeID?: string; ItemID?: string; Quantity?: number }[];
}

export interface BundleItemData {
  Item?: { ItemTypeID?: string; ItemID?: string; Amount?: number };
  BasePrice?: number;
  DiscountedPrice?: number;
  DiscountPercent?: number;
}

export interface BundleData {
  ID?: string;
  DataAssetID?: string;
  Items?: BundleItemData[];
  TotalBaseCost?: Record<string, number> | null;
  TotalDiscountedCost?: Record<string, number> | null;
  TotalDiscountPercent?: number;
  DurationRemainingInSeconds?: number;
}

export interface FeaturedBundle {
  Bundle?: BundleData;
  Bundles?: BundleData[];
  BundleRemainingDurationInSeconds?: number;
}

export interface AccessoryStore {
  AccessoryStoreOffers?: { Offer?: StoreCost }[];
  AccessoryStoreRemainingDurationInSeconds?: number;
}

export interface BonusStore {
  BonusStoreOffers?: {
    Offer?: StoreCost;
    DiscountPercent?: number;
    DiscountCosts?: Record<string, number>;
  }[];
  BonusStoreRemainingDurationInSeconds?: number;
}

export interface Storefront {
  SkinsPanelLayout?: {
    SingleItemOffers?: string[];
    SingleItemOffersRemainingDurationInSeconds?: number;
    SingleItemStoreOffers?: { OfferID?: string; Cost?: Record<string, number> }[];
  };
  FeaturedBundle?: FeaturedBundle;
  AccessoryStore?: AccessoryStore | null;
  BonusStore?: BonusStore | null;
}

// currency ids (community-canonical; costs are keyed by these)
export const CURRENCY_VP = "85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741";
export const CURRENCY_KC = "85ca954a-41f2-ce94-9b45-8ca3dd39a00d";
export const ITEM_TYPE_SKIN_LEVEL = "e7c63390-eda7-46e0-bb7a-a6abdacd2433";

export function costOf(
  costs: Record<string, number> | null | undefined,
  currency?: string,
): number {
  if (!costs) return 0;
  if (currency && costs[currency] != null) return costs[currency];
  return Object.values(costs)[0] ?? 0;
}

/** VP is the only currency on daily offers; take the single cost entry. */
export function mapDailyOffers(sf: Storefront): DailyPanel {
  const panel = sf.SkinsPanelLayout ?? {};
  const costs = new Map(
    (panel.SingleItemStoreOffers ?? [])
      .filter((o) => o.OfferID)
      .map((o) => [o.OfferID as string, Object.values(o.Cost ?? {})[0] ?? 0]),
  );
  const offers = (panel.SingleItemOffers ?? []).map((offerId) => ({
    offerId,
    vp: costs.get(offerId) ?? 0,
  }));
  return {
    offers,
    remainingSeconds: panel.SingleItemOffersRemainingDurationInSeconds ?? 0,
  };
}

export interface BundleItemSlice {
  levelId: string;
  basePrice: number;
  discountedPrice: number;
}

export interface BundleSlice {
  uuid: string;
  baseVp: number;
  discountedVp: number;
  discountPercent: number;
  remainingSeconds: number;
  items: BundleItemSlice[];
}

export function mapBundles(sf: Storefront): BundleSlice[] {
  const featured = sf.FeaturedBundle;
  if (!featured) return [];
  // Bundle = the featured one; Bundles[] = additional event bundles on sale
  const candidates = [featured.Bundle, ...(featured.Bundles ?? [])].filter(
    (b): b is BundleData => Boolean(b),
  );
  const slices: BundleSlice[] = [];
  const seen = new Set<string>();
  for (const fb of candidates) {
    const uuid = fb.DataAssetID ?? fb.ID;
    if (!uuid || seen.has(uuid)) continue;
    seen.add(uuid);
    const items = (fb.Items ?? [])
      .map((it) => ({
        levelId: it.Item?.ItemTypeID === ITEM_TYPE_SKIN_LEVEL ? (it.Item?.ItemID ?? "") : "",
        basePrice: it.BasePrice ?? 0,
        discountedPrice: it.DiscountedPrice ?? it.BasePrice ?? 0,
      }))
      .filter((it) => it.levelId);
    slices.push({
      uuid,
      baseVp: costOf(fb.TotalBaseCost, CURRENCY_VP),
      discountedVp: costOf(fb.TotalDiscountedCost, CURRENCY_VP),
      discountPercent: fb.TotalDiscountPercent ?? 0,
      remainingSeconds:
        fb.DurationRemainingInSeconds ??
        featured.BundleRemainingDurationInSeconds ??
        0,
      items,
    });
  }
  return slices;
}

export interface AccessorySliceItem {
  itemId: string;
  cost: number;
}

export interface AccessorySlice {
  items: AccessorySliceItem[];
  remainingSeconds: number;
}

export function mapAccessories(sf: Storefront): AccessorySlice | null {
  const store = sf.AccessoryStore;
  const offers = store?.AccessoryStoreOffers ?? [];
  if (offers.length === 0) return null;
  return {
    items: offers
      .map((o) => o.Offer)
      .filter((o): o is StoreCost => Boolean(o?.Rewards?.length))
      .map((o) => ({
        itemId: o.Rewards![0].ItemID ?? "",
        cost: costOf(o.Cost, CURRENCY_KC),
      }))
      .filter((it) => it.itemId),
    remainingSeconds: store?.AccessoryStoreRemainingDurationInSeconds ?? 0,
  };
}

export interface NightItem {
  levelUuid: string;
  baseVp: number;
  discountVp: number;
  discountPercent: number;
}

export interface NightSlice {
  items: NightItem[];
  remainingSeconds: number;
}

export function mapNightMarket(sf: Storefront): NightSlice | null {
  const bonus = sf.BonusStore;
  const offers = bonus?.BonusStoreOffers ?? [];
  if (offers.length === 0) return null;
  return {
    items: offers
      .filter((o) => o.Offer?.Rewards?.length)
      .map((o) => {
        const offer = o.Offer!;
        const reward = offer.Rewards!.find(
          (r) => r.ItemTypeID === ITEM_TYPE_SKIN_LEVEL,
        );
        return {
          levelUuid: reward?.ItemID ?? offer.OfferID ?? "",
          baseVp: costOf(offer.Cost, CURRENCY_VP),
          discountVp: costOf(o.DiscountCosts, CURRENCY_VP),
          discountPercent: o.DiscountPercent ?? 0,
        };
      })
      .filter((it) => it.levelUuid),
    remainingSeconds: bonus?.BonusStoreRemainingDurationInSeconds ?? 0,
  };
}

const WRONG_PLACE = new Set([403, 404, 405]);
const ALL_SHARDS: Shard[] = ["na", "eu", "ap", "kr", "latam", "br"];

async function attempt(
  url: string,
  headers: Record<string, string>,
  init?: { method: string; body: string },
): Promise<Response> {
  return riotFetch(url, { headers, ...init });
}

/**
 * Storefront lives at v3 (POST, body {}) or v2 (GET) depending on Riot's mood;
 * community-verified contract (yugam23/Valorant-Store-Checker runs v3 POST in
 * production, valapidocs documents v2 GET). Try both, then probe other shards
 * — userinfo affinity doesn't always match the PD shard. The session's shard
 * is corrected in place when a probe wins.
 */
export async function fetchStorefront(session: Session): Promise<Storefront> {
  const clientVersion = await getClientVersion();
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Riot-Entitlements-JWT": session.entitlement,
    "X-Riot-ClientVersion": clientVersion,
    "X-Riot-ClientPlatform": CLIENT_PLATFORM,
  };

  const tryShard = async (shard: Shard): Promise<Response | null> => {
    const base = `https://pd.${shard}.a.pvp.net`;
    // v3: POST with empty body
    let res = await attempt(`${base}/store/v3/storefront/${session.puuid}`, headers, {
      method: "POST",
      body: "{}",
    });
    if (res.ok) return res;
    if (res.status === 429) throw new RiotError("rate_limited", 429);
    if (res.status === 401) throw new RiotError("unknown", 401, "storefront: auth rejected");
    if (!WRONG_PLACE.has(res.status)) {
      throw new RiotError("unknown", res.status, "storefront");
    }
    // v2: GET
    res = await attempt(`${base}/store/v2/storefront/${session.puuid}`, headers);
    if (res.ok) return res;
    if (res.status === 429) throw new RiotError("rate_limited", 429);
    if (!WRONG_PLACE.has(res.status)) {
      throw new RiotError("unknown", res.status, "storefront");
    }
    return null;
  };

  const first = await tryShard(session.shard);
  if (first) return (await first.json()) as Storefront;

  for (const shard of ALL_SHARDS.filter((s) => s !== session.shard)) {
    const res = await tryShard(shard);
    if (res) {
      // ponytail: in-place shard correction; SessionBar may show stale text until rerender
      session.shard = shard;
      return (await res.json()) as Storefront;
    }
  }

  throw new RiotError("unknown", 404, "storefront: no shard accepted this puuid");
}
