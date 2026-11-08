# PLAN.md — val-market execution plan

Master plan. Review gate: nothing below runs until this document is approved.

## Decision log

| Date | Decision |
|---|---|
| 2026-10-30 | Web-only login declared **impossible**: Riot blocks it three ways (CORS on auth/pd, hCaptcha domain-locked to their domains, redirect tokens locked to playvalorant.com). User approved pivot to **Tauri v2 desktop shell** — login runs on Riot's real hosted page in a native webview (captcha + all social platform sign-ins work), token captured from the redirect fragment. Server/proxy deleted entirely. |
| 2026-11-03 | Target = **installable app on all platforms**. Added **headless auth in Rust** (Riot Client SDK identity — no captcha contract) so mobile works: login form universal, webview window stays desktop-only for social sign-ins. macOS dmg built; Windows/Linux via GitHub Actions `release.yml` (tauri-action, tag push). Android/iOS builds need local toolchains (Xcode / Android Studio) — setup documented in README; CI can cover Android later. |
| 2026-11-03 | **Headless contract confirmed closed by Riot**: byte-faithful RadiantConnect replication (probe: exact headers, scope, h1/h2, cookies) still returns `invalid_request`. The SDK-header bypass is stale — yugam23's flow no longer works either. Login surface final: **desktop = webview window** (proven), **mobile = system browser + paste-URL fallback** (`completeSignInFromUrl`). Headless code deleted. |

## Phases

### Phase 0 — Spike: prove the auth flow (½ day)

The load-bearing risk is CORS on `auth.riotgames.com`. Prove it before any UI.

- [x] Scaffold Next.js 15 + TS + Tailwind v4 → now a static export inside the Tauri shell
- [x] Spike completed through three real failures: (1) direct browser→Riot = CORS-blocked → stateless forwarder built; (2) forwarder still `invalid_request` → discovered Riot's new `riot_identity` + hCaptcha contract; (3) hCaptcha domain-locked → pure-web login impossible. Final architecture per Decision log: Tauri webview redirect capture.
- [x] Client-version headers, countdown semantics (`SingleItemOffersRemainingDurationInSeconds`), night-market inactive shape — encoded in `lib/riot/storefront.ts` types; final confirmation rides the first real-account run.

**Done when:** storefront JSON for a real account renders in console from a browser origin, or the fallback is built and verified.

### Phase 1 — Design foundation (½ day)

- [x] Tokens from DESIGN.md as CSS variables + Tailwind theme mapping
- [x] Fonts: Anton, DM Sans, JetBrains Mono via `next/font` (self-hosted, `display: swap`)
- [x] Shell: topbar (64px, sticky), page container, tab scaffold — topbar shipped on `/store`; tabs land with Phase 3
- [x] Core components with full state sets: Button, Input, SelectField, Skeleton, EmptyState, ErrorState, DisclaimerFooter — Skeleton/EmptyState/ErrorState land with their first consuming surface (Phase 3), not before (no unused scaffold)
- [x] Sharp-corner + clip-path CTA implemented per DESIGN.md

**Done when:** a static demo page shows every component in every state on mobile + desktop widths.

### Phase 2 — Auth (1 day)

- [x] Login form (label-above inputs, inline errors, plain-language privacy note adjacent to the submit button)
- [x] 2FA `<dialog>` flow (6-digit input, error on bad code, reduced-motion-safe feedback)
- [x] In-memory session context; login → redirect to store; logout in SessionBar
- [x] Failure handling per ARCHITECTURE.md table (wrong creds, 429, version retry — version retry executes in `fetchStorefront`'s caller paths; retry-once wrapper lands with Phase 3 error states)
- [x] Legal disclaimer visible on the login surface

**Done when:** real login + 2FA + logout round-trip works; wrong-password and rate-limit states are reachable and correct. — **code-side complete; real-account round-trip pending user verification**

### Phase 3 — Daily store view (1 day)

- [x] SkinCard (art, name, RarityTag from runtime `contenttiers`, PriceTag in VP) — tier colors are local approximations (valorant-api exposes no color field), names/tiers runtime
- [x] CountdownTimer driven by `SingleItemOffersRemainingDurationInSeconds` (mono digits, no per-second animation)
- [x] Skeletons resolve to content; empty/error states for every fetch failure mode
- [x] Metadata resolve + in-memory cache (`skinlevels`, `skins`→`contentUuid`→`contenttiers`, one fetch each per session)

**Done when:** a logged-in user sees their 4 skins + prices + accurate countdown within ~3s of login, mobile and desktop. — **code complete; live visual check pending user run**

### Phase 4 — Bundle, Accessories, Night Market (1 day)

- [x] Bundle tab: bundle art + name + description (`/v1/bundles`), contents as skin cards, base/discounted VP with % tag, countdown
- [x] Accessories tab: buddies/cards/sprays/titles resolved from `gunbuddylevels`/`playercards`/`sprays`/`playertitles`, KC prices, kind chip, countdown
- [x] Night Market tab: `BonusStore` offers with base struck-through + discounted VP when live; honest empty state when not
- [x] Tab state preserved in URL (`?tab=`) — pushState + popstate sync, arrow-key accessible tablist

**Done when:** all four tabs show correct live data for an account that has them active. — **code complete; live check pending user run**

### Phase 5 — Local history & wantlist (½ day)

- [ ] Each successful daily-store fetch appends skin uuids + date to `localStorage` history (device-local, disclosed as such)
- [ ] History tab: past rotations, grouped by date
- [ ] Wantlist: mark skins; a matching skin in any store surface gets a "wanted" marker

**Done when:** two consecutive days of data produce a readable history; wantlist marker appears on a matching skin.

### Phase 6 — Polish, harden, ship (1 day)

- [ ] `/impeccable audit` + `/impeccable polish` pass (a11y, contrast per token, responsive)
- [x] Keyboard walkthrough: login → 2FA → tabs → logout with no mouse
- [x] `prefers-reduced-motion` verified everywhere
- [x] Copy self-audit (no hallucinated strings, consistent labels, one CTA intent per surface)
- [x] README + privacy statement + disclaimer final
- [x] ~~Deploy to Vercel~~ → **amended 2026-11-03**: ship = `npm run tauri build` installers (macOS dmg done) + GitHub Actions CI for Windows/Linux (`.github/workflows/release.yml`); Vercel-only landing page optional on explicit request

**Done when:** installers pass the checklist above.

## Decisions locked

| Decision | Call |
|---|---|
| Platform | Web only (Next.js) |
| Auth | Client-side RSO; edge-function forwarder is contingency only |
| Scope | Full suite: daily + bundle + accessories + night market + local history/wantlist |
| History storage | `localStorage`, device-local, disclosed in UI |
| Theme | Dark-only MVP |
| UI language | English (matches game terms); i18n later if wanted |
| Backend/DB | None until cross-device sync is requested |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| CORS blocked on auth/pd endpoints | Blocks architecture | Phase 0 spike first; forwarder fallback ready |
| Riot changes endpoints/headers | Breaks fetches | Isolated in `lib/riot/`; version retry; spike notes updated |
| Rate limiting / account flags | User harm | One fetch per session, no polling, no automation |
| Trust perception (creds phishing) | Adoption killer | Client-side note at the form, open-sourceable code, privacy page |
| Skin metadata gaps (new skins) | Broken cards | uuid fallback + graceful render |

## Out of scope (explicitly)

Cross-device sync, accounts/database, notifications/automation, market prices & trading, light theme, i18n, mobile app wrappers. Each needs an explicit new request.

## Verification

One runnable check per meaningful unit, no framework: typecheck + `next build` clean per phase; a single `scripts/verify-auth-flow.ts` parse-check (token extraction from URI fragment, 2FA branch, storefront field mapping against a captured fixture) runs via `tsx` in Phase 0 and stays green.
