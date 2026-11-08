# AGENTS.md

Context for AI agents working in this repo. Read the linked docs before doing anything.

## Project

Valorant daily store checker — **Tauri v2 desktop shell around a Next.js 15 static-export UI** (TypeScript + Tailwind v4). No backend: login happens on Riot's official page inside a native webview (captcha + social platform buttons work); the shell captures the token from the redirect. Tokens are memory-only, never persisted or logged. Riot API calls go through Tauri's HTTP plugin (Rust-side, no CORS).

- Product context: [PRODUCT.md](PRODUCT.md) — register: **product**, platform: **web** (UI tech)
- Design system: [DESIGN.md](DESIGN.md) — tokens, type, components, motion. Follow it exactly.
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — login flow, endpoints, security rules
- Execution plan: [docs/PLAN.md](docs/PLAN.md) — phases, locked decisions, risks

## Commands

- `npm run tauri dev` — full desktop app in dev (needs Rust toolchain)
- `npm run dev` — UI only in a browser tab (login won't work there; UI iteration only)
- `npm run build` — static export to `out/` (must pass clean before a phase is done)
- `npm run typecheck` — run after every code change
- `npm run verify` — pure-logic self-check (fixture-based, no network)
- `npm run tauri build` — native installer

## Hard rules

1. **Review gate:** nothing beyond the approved [docs/PLAN.md](docs/PLAN.md) runs without explicit user approval.
2. **Security:** never persist or log Riot credentials/tokens; no `localStorage` for anything sensitive; one storefront fetch per session, no polling/automation. Never rebuild a credentials form — login happens only on Riot's own hosted page.
3. **Design:** dark theme only, radius 0 everywhere, red `#FF4655` ≤10% per screen, `--on-accent` is `#0F1923` (never off-white on red). Every component ships all states (default/hover/focus/active/disabled/loading/error) + reduced-motion support.
4. **No hardcoded game data:** rarity colors, skin names/images, client version come from `valorant-api.com` at runtime.
5. **English UI copy.** Disclaimers from README.md stay visible on auth surfaces.
6. Use `skill: impeccable` for any UI work; run `/impeccable audit` before calling a phase done.
