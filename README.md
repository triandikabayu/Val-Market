# val-market

Valorant daily store checker — see your full in-game store (daily skins, bundle, accessories, night market) without launching the game. Desktop app (Tauri v2): login happens on Riot's official page in a native webview — captcha and all social platform sign-ins (Google/Facebook/Apple/Xbox/PSN) work; tokens are captured from the redirect and never stored.

**Status:** Phase 0–2 built (Tauri shell + login). Read [docs/PLAN.md](docs/PLAN.md) before executing anything.

## Prerequisites

- Node.js + npm
- Rust toolchain (`brew install rust`, or https://rustup.rs)
- Android builds: Android Studio + JDK · iOS builds: full Xcode + Apple Developer account

## Commands

- `npm run tauri dev` — run the full desktop app in dev
- `npm run dev` — UI only in a browser tab (login won't work there; UI iteration only)
- `npm run build` — static export to `out/`
- `npm run typecheck` — TypeScript check
- `npm run verify` — pure-logic self-check (fixture-based, no network)
- `npm run tauri build` — native installer (`.dmg`/`.app` on macOS; `.msi` on Windows; `.deb`/`AppImage` on Linux)
- Mobile (needs the toolchains above): `npx tauri ios init` / `npx tauri android init`, then `tauri ios build` / `tauri android build`
- Releases: push a `v*` tag with `.github/workflows/release.yml` present → CI builds macOS (ARM+Intel) / Windows / Linux installers automatically

## Platforms

| Platform | Status |
|---|---|
| macOS (Apple Silicon) | built locally — `val-market_0.1.0_aarch64.dmg` |
| macOS Intel / Windows / Linux | CI on tag push (`release.yml`) |
| Android | CI on tag push (`release.yml`, android job) → debug APK artifact |
| iOS | code-ready; final build needs local Xcode + Apple Developer account (see below) |

### iOS build (local)

1. Install full Xcode from the App Store, then `xcodebuild -version` works.
2. Apple Developer account ($99/yr) is required to install on a real device (TestFlight or direct provisioning). The simulator works without it.
3. `npx tauri ios init`, open `gen/apple/valmarket.xcodeproj` in Xcode, set your signing team, then Run — or `npx tauri ios build`.
4. Login on iOS uses the paste-URL flow (the app opens Riot's sign-in in Safari; paste the redirected URL back).

### Android build (local, optional — CI covers it)

1. Install Android Studio + JDK 17 (or cmdline-tools).
2. `npx tauri android init` → `npx tauri android build --apk` (add `--debug` for an installable unsigned APK).
3. Login on Android uses the same paste-URL flow.

## Disclaimers

- Unofficial fan tool. Not affiliated with or endorsed by Riot Games.
- Valorant and all related properties are trademarks of Riot Games, Inc.
- Uses Riot's unofficial web endpoints; automated access sits outside Riot's ToS. The app fetches once per session and never automates.
- Your credentials are typed into Riot's own hosted login page inside a native webview — this app never sees them. Tokens live in memory only.
- Store history is saved locally in your browser storage only.

## Docs

- [PRODUCT.md](PRODUCT.md) — users, purpose, positioning, design principles
- [DESIGN.md](DESIGN.md) — design system: tokens, type, components, motion
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — auth flow, endpoints, security, structure
- [docs/PLAN.md](docs/PLAN.md) — phases, decisions, risks, definition of done
