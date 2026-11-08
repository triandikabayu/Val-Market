/**
 * Self-check for pure auth/storefront logic — fixture-based, no network.
 * Run: npm run verify
 */
import {
  parseFragment,
  puuidFromIdToken,
  shardFromAffinity,
} from "../src/lib/riot/auth";
import {
  costOf,
  mapAccessories,
  mapBundles,
  mapDailyOffers,
  mapNightMarket,
  CURRENCY_VP,
  type Storefront,
} from "../src/lib/riot/storefront";

let failures = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`  PASS ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
  }
}

// --- parseFragment ----------------------------------------------------------
const fragment =
  "access_token=AT123&scope=openid&expires_in=3599&id_token=ID456&token_type=Bearer";
const fromUri = parseFragment(`https://playvalorant.com/opt_in#${fragment}`);
assert("parseFragment extracts tokens from a full redirect URI", fromUri?.accessToken === "AT123" && fromUri?.idToken === "ID456");
const fromBare = parseFragment(fragment);
assert("parseFragment accepts a bare fragment too", fromBare?.accessToken === "AT123");
assert("parseFragment rejects missing id_token", parseFragment("https://x.com#access_token=1") === null);
assert("parseFragment rejects empty input", parseFragment("") === null);

// --- puuidFromIdToken -------------------------------------------------------
const payload = btoa(JSON.stringify({ sub: "puuid-test-123" }))
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");
const fakeJwt = `eyJhbGciOiJub25lIn0.${payload}.c2ln`;
assert("puuuidFromIdToken reads the sub claim", puuidFromIdToken(fakeJwt) === "puuid-test-123");
assert("puuidFromIdToken rejects junk", puuidFromIdToken("not.a.jwt") === null);
assert("puuidFromIdToken rejects missing sub", puuidFromIdToken(`h.${btoa("{}")}.s`) === null);

// --- storefront mapping -----------------------------------------------------
const fixture: Storefront = {
  SkinsPanelLayout: {
    SingleItemOffers: ["skin-a", "skin-b", "skin-c", "skin-d"],
    SingleItemOffersRemainingDurationInSeconds: 3600,
    SingleItemStoreOffers: [
      { OfferID: "skin-a", Cost: { "85ca954a-41f0-58cf-6b0c-8bddafabcdef": 2175 } },
      { OfferID: "skin-b", Cost: { "85ca954a-41f0-58cf-6b0c-8bddafabcdef": 875 } },
      { OfferID: "skin-c", Cost: { "85ca954a-41f0-58cf-6b0c-8bddafabcdef": 4345 } },
      { OfferID: "skin-d", Cost: { "85ca954a-41f0-58cf-6b0c-8bddafabcdef": 1775 } },
    ],
  },
  FeaturedBundle: { Bundle: {}, BundleRemainingDurationInSeconds: 80000 },
  AccessoryStore: {},
  BonusStore: null,
};
const panel = mapDailyOffers(fixture);
assert("daily offers mapped 1:1", panel.offers.length === 4);
assert("VP cost mapped", panel.offers[0].vp === 2175 && panel.offers[2].vp === 4345);
assert("reset countdown carried through", panel.remainingSeconds === 3600);
  assert(
    "empty panel maps to zero offers safely",
    mapDailyOffers({}).offers.length === 0 &&
      mapDailyOffers({}).remainingSeconds === 0,
  );

  // --- shard affinity mapping -------------------------------------------------
  assert("affinity.pp wins", shardFromAffinity({ pp: "ap", live: "na" }) === "ap");
  assert("legacy affinity maps (jp → ap)", shardFromAffinity({ live: "jp" }) === "ap");
  assert("unknown affinity defaults to ap", shardFromAffinity(undefined) === "ap");

  // --- bundle / accessories / night market mapping ----------------------------
  const multiFixture: Storefront = {
    FeaturedBundle: {
      Bundle: {
        ID: "bundle-1",
        DataAssetID: "da-1",
        Items: [
          { Item: { ItemTypeID: "e7c63390-eda7-46e0-bb7a-a6abdacd2433", ItemID: "lvl-1" }, BasePrice: 5100, DiscountedPrice: 4080 },
          { Item: { ItemTypeID: "dd3bf334-87f3-40bd-b043-682a57a8dc3a", ItemID: "buddy-x" }, BasePrice: 500, DiscountedPrice: 500 },
          { Item: { ItemTypeID: "e7c63390-eda7-46e0-bb7a-a6abdacd2433", ItemID: "lvl-2" }, BasePrice: 2175, DiscountedPrice: 2175 },
        ],
        TotalBaseCost: { [CURRENCY_VP]: 7000 },
        TotalDiscountedCost: { [CURRENCY_VP]: 5600 },
        TotalDiscountPercent: 20,
        DurationRemainingInSeconds: 90000,
      },
      Bundles: [
        {
          ID: "bundle-2",
          DataAssetID: "da-2",
          Items: [{ Item: { ItemTypeID: "e7c63390-eda7-46e0-bb7a-a6abdacd2433", ItemID: "lvl-3" }, BasePrice: 875, DiscountedPrice: 700 }],
          TotalBaseCost: { [CURRENCY_VP]: 1000 },
          DurationRemainingInSeconds: 1000,
        },
        { ID: "bundle-1", DataAssetID: "da-1" }, // duplicate → deduped
      ],
      BundleRemainingDurationInSeconds: 80000,
    },
    AccessoryStore: {
      AccessoryStoreOffers: [
        { Offer: { Cost: { "85ca954a-41f2-ce94-9b45-8ca3dd39a00d": 750 }, Rewards: [{ ItemTypeID: "x", ItemID: "buddy-1" }] } },
        { Offer: { Rewards: [{ ItemID: "card-1" }] } },
      ],
      AccessoryStoreRemainingDurationInSeconds: 42,
    },
    BonusStore: {
      BonusStoreOffers: [
        {
          Offer: { Cost: { [CURRENCY_VP]: 8550 }, Rewards: [{ ItemTypeID: "e7c63390-eda7-46e0-bb7a-a6abdacd2433", ItemID: "nm-lvl-1" }] },
          DiscountCosts: { [CURRENCY_VP]: 3300 },
        },
      ],
      BonusStoreRemainingDurationInSeconds: 100000,
    },
  };

  const bundles = mapBundles(multiFixture);
  assert(
    "bundles slice: featured + event bundles, deduped",
    bundles.length === 2 && bundles[0].uuid === "da-1" && bundles[1].uuid === "da-2",
  );
  assert("bundles slice: per-bundle remaining", bundles[0].remainingSeconds === 90000 && bundles[1].remainingSeconds === 1000);
  assert("bundles slice: VP costs by currency key", bundles[0].baseVp === 7000 && bundles[0].discountedVp === 5600);
  assert(
    "bundles slice: keeps only skin-level item ids",
    bundles[0].items.length === 2 && bundles[0].items[0].levelId === "lvl-1",
  );
  assert(
    "bundle item per-weapon prices pulled",
    bundles[0].items[0].basePrice === 5100 &&
      bundles[0].items[0].discountedPrice === 4080 &&
      bundles[1].items[0].discountedPrice === 700,
  );

  const acc = mapAccessories(multiFixture);
  assert(
    "accessories slice: KC cost + item id extraction",
    acc?.items.length === 2 && acc?.items[0].cost === 750 && acc?.items[1].itemId === "card-1",
  );

  const night = mapNightMarket(multiFixture);
  assert(
    "night market slice: base vs discounted",
    night?.items.length === 1 &&
      night?.items[0].levelUuid === "nm-lvl-1" &&
      night?.items[0].baseVp === 8550 &&
      night?.items[0].discountVp === 3300,
  );

  const empty = mapBundles({}).length === 0 && mapAccessories({}) === null && mapNightMarket({}) === null;
  assert("all slices return null when sections absent", empty);

  assert("costOf picks preferred currency", costOf({ a: 1, [CURRENCY_VP]: 2175 }, CURRENCY_VP) === 2175);
  assert("costOf falls back to first value", costOf({ x: 99 }) === 99);
  assert("costOf handles null", costOf(null) === 0);

console.log(
  failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
