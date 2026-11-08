# ARCHITECTURE.md — val-market

## Stack

| Layer | Choice | Why |
|---|---|---|
| Shell | **Tauri v2 desktop app** (Rust + system webview) | Riot blocks pure-web login three ways (CORS, hCaptcha domain-lock, redirect lock). A native webview shows Riot's real hosted login — captcha and every social platform button work — and the app captures the token from the redirect. |
| UI | Next.js 15 static export (`out/`) loaded by Tauri | Same React/TS/Tailwind code, zero server |
| Styling | Tailwind v4 + CSS variables from DESIGN.md | Tokens → utilities, dark locked |
| Backend | **None.** Riot calls go through Tauri's HTTP plugin (Rust fetch) | No CORS, no proxy, no server ever sees credentials |
| Data persistence | `localStorage` (history, wantlist, display prefs) | No DB until cross-device sync is a real need |
| Metadata API | `valorant-api.com` (public, no key) | Skin images, names, tiers, versions |
| Deploy | `npm run tauri build` → native installer | macOS now; Windows/Linux are config-only |

No environment secrets exist. The app is a desktop client talking straight to Riot.

## Login flow (Tauri webview redirect capture)

```
Main window (our UI)          Native webview                Riot
  │ "Sign in with Riot"          │                            │
  │ ── riot_login command ──►  opens auth.riotgames.com/authorize
  │                              │   client_id=play-valorant-web-prod
  │                              │   redirect_uri=playvalorant.com/opt_in
  │                              │   response_type=token id_token
  │                              │  ◄── user logs in on Riot's REAL page
  │                              │      (captcha OK, Google/Facebook/Apple/
  │                              │       Xbox/PSN buttons all work)
  │                              │  ◄── 302 → playvalorant.com/opt_in#access_token=…
  │                              │      navigation intercepted (cancelled),
  │                              │      fragment captured, window closes
  │ ◄── fragment ────────────────┘
  │ parse access_token + id_token (puuid = id_token `sub` claim)
  │ POST entitlements.auth.riotgames.com/api/token/v1  (Bearer access_token)
  │      → entitlement_token   ← moved from GET /api/token/tdm (dead, 404)
  ▼ session {accessToken, entitlement, puuid, shard} — memory only
```

Why this works when the web app couldn't: the login page runs on Riot's own domain (hCaptcha domain-lock satisfied), and the fragment is captured by the shell before playvalorant.com loads (redirect-lock irrelevant). Social sign-in is fully supported by Riot's hosted page — no per-provider code.

`rememberDevice` is not ticked; nothing persists beyond the OS webview session the user already had.

## Storefront fetch

`GET/POST https://pd.{shard}.a.pvp.net/storefront` — community-verified contract: **v3 = POST with body `{}`** (what production tools run), **v2 = GET** (what valapidocs documents). The app tries v3 POST → v2 GET on the session's shard, then probes the remaining shards on 403/404/405 and corrects `session.shard` in place. Four headers: `Authorization: Bearer`, `X-Riot-Entitlements-JWT`, `X-Riot-ClientVersion` (from `valorant-api.com/v1/version`, cached), `X-Riot-ClientPlatform` (documented-working blob).

Shard comes from `userinfo.affinity.pp` at sign-in (mapped na/eu/ap/kr/latam/br + legacy as/ind/oce/jp→ap, ru/tr→eu); no region picker.

| Field | UI |
|---|---|
| `SkinsPanelLayout` → offers + `SingleItemOffersRemainingDurationInSeconds` | Daily tab + reset countdown (exact, server-derived) |
| `FeaturedBundle` (+ remaining duration) | Bundle tab |
| `AccessoryStore` | Accessories tab |
| `BonusStore` (only while night market is live) | Night Market tab, honest empty state otherwise |

Skin uuid → name/image/tier via `valorant-api.com/v1/weapons/skinlevels` + `/v1/contenttiers`, in-memory cached per session.

## Failure modes & handling

| Failure | Behavior |
|---|---|
| Login window closed / timeout | Inline error, user can retry |
| Token capture failed (no tokens in fragment) | Error with detail; diagnostics in UI |
| Riot endpoint down / 429 | ErrorState with retry; one fetch per manual action |
| Client version outdated | Refetch `/v1/version`, retry once |
| Metadata fetch fail | Render with uuid fallback + cached data; prices still show |
| Token expired mid-session | Single re-auth prompt; no silent loops |

Rate-limit discipline: one storefront fetch per session, no polling, no automation.

## Project structure

```
src/                      # Next.js UI (static export)
  app/                    # login page (/), store placeholder (/store)
  lib/riot/               # auth (redirect capture), storefront, platform, http
  lib/valapi/             # valorant-api client + in-memory cache
  lib/session.tsx         # in-memory session (React context)
  components/             # ui/ + store/ + auth/ (PrivacyNote)
src-tauri/
  src/lib.rs              # riot_login command: webview + navigation capture
  capabilities/           # http scope: Riot hosts + valorant-api only
  tauri.conf.json         # window config, bundle
scripts/verify-auth-flow.ts  # pure-logic self-check (npm run verify)
```

## Legal & trust posture

- Unofficial tool. Not affiliated with or endorsed by Riot Games. Disclaimer on login + footer.
- Credentials are typed into Riot's own page in a native webview — this app's code never touches them at all. Tokens live in memory only.
- Automated access sits outside Riot ToS — mitigated: single fetch per session, no polling, no automation, no credential storage.
- Open-sourceable without redaction — no secrets exist.
