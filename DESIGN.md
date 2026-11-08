# DESIGN.md — val-market design system

Visual language: faithful Valorant brand, executed as a calm product tool. Dark navy surfaces, off-white ink, red reserved for actions and urgency. Angular (sharp corners) — no soft-rounded SaaS shapes.

## Scene sentence

A player checks their store from a dim dorm room or office on their phone during a break — the screen is the brightest thing around. Dark theme is not a vibe choice; it's the physical context.

## Theme

Dark-only for MVP (single theme, locked — no light mode). Valorant's own brand is dark-native; a light mode would fight the skin art. Dual-theme can be added later if data shows demand.

## Color

Source of truth: hex (Riot brand). OKLCH values are converted references. One accent (red), locked across the whole app.

### Tokens

| Token | Hex | OKLCH (approx) | Role |
|---|---|---|---|
| `--bg` | `#0F1923` | oklch(0.20 0.026 240) | Page background |
| `--surface` | `#141E28` | oklch(0.23 0.024 240) | Cards, panels |
| `--surface-2` | `#1B2733` | oklch(0.27 0.024 240) | Elevated surfaces, inputs |
| `--line` | `#2A3743` | oklch(0.32 0.022 240) | 1px borders, dividers |
| `--ink` | `#ECE8E1` | oklch(0.93 0.011 80) | Primary text (Riot off-white) |
| `--ink-muted` | `#A9AFB4` | oklch(0.75 0.012 240) | Secondary text — verify ≥4.5:1 on `--bg` |
| `--accent` | `#FF4655` | oklch(0.65 0.21 20) | Primary actions, countdown, active tab |
| `--accent-press` | `#E03A48` | oklch(0.59 0.20 20) | Button :active |
| `--on-accent` | `#0F1923` | — | Text on red (AA-passing; never off-white on red) |
| `--danger` | `#FF6B6B` | oklch(0.68 0.17 25) | Errors (distinct from brand red by context + icon) |
| `--success` | `#5FD9A4` | oklch(0.80 0.13 165) | Success states (rare) |

### Rules

- Red accent ≤10% of any screen (Restrained strategy). It marks: primary button, active tab underline, live countdown, 2FA emphasis.
- **No off-white text on red** — fails contrast (~2.7:1). Red surfaces carry `#0F1923` text.
- Skin rarity colors are **runtime data** (`highlightColorHex` from `valorant-api.com/v1/contenttiers`), rendered as a small tag/edge on skin cards — semantic, not decorative. No hardcoded rarity palette in tokens.
- Never pure `#000` / `#FFF`.

## Typography

| Face | Use | Weights | Source |
|---|---|---|---|
| Anton | Display only: page titles, big numbers (countdown, price walls) | 400, uppercase, letter-spacing ≥ -0.01em | `next/font/google`, self-hosted |
| DM Sans | Everything UI: labels, body, buttons, forms | 400 / 500 / 700 | `next/font/google` |
| JetBrains Mono | VP prices, countdown digits, UUID-free data chips | 400 / 600 | `next/font/google` |

- Fixed rem scale (product register — no fluid clamp): 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 px (0.75–3rem).
- Line-height: 1.5 body, 1.05 display. `text-wrap: balance` on h1–h3.
- Display font never appears in buttons, labels, or data (product ban).
- Body line length ≤ 65ch (disclaimers, empty states).

## Shape & depth

- **Radius: 0 everywhere** (all-sharp lock) — buttons, inputs, cards, tags. The angular cut is the Valorant identity; a single rounded element is a bug.
- Borders over shadows: 1px `--line`. The only shadow is a short dark-tinted shadow on the 2FA dialog (`0 8px 24px rgba(15,25,35,.6)`).
- Signature detail: 45° clipped corner on primary buttons and featured cards via `clip-path: polygon(...)` — used sparingly (primary CTA + featured bundle card only), not on every box.

## Layout

- Mobile-first; content column `max-w-[1200px]`, store grid `repeat(auto-fit, minmax(260px, 1fr))`.
- Top bar 64px (sticky, z-10): wordmark left, reset countdown right.
- Tabs (Daily / Bundle / Accessories / Night Market) as underline-style tabs, not pill buttons.
- Skin cards: art on `--surface`, name + rarity tag + VP price row. No nested cards.
- Section rhythm: `py-16` desktop, `py-10` mobile. Vary spacing, don't tile equal blocks.

## Motion

- 150–250ms, `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quart). Transform/opacity only.
- Motion = state only: skeleton→content crossfade, tab underline slide, countdown tick (no animation), login error shake (120ms, reduced-motion: border flash instead).
- No entrance choreography on load. Store content appears via skeleton resolution, not stagger reveals.
- Every animation has a `@media (prefers-reduced-motion: reduce)` equivalent (instant/crossfade).

## Components inventory

Button (primary red / secondary outline / ghost), Input (sharp, label above, error below), Tabs, SkinCard, BundleCard, PriceTag (mono, VP icon), CountdownTimer (mono digits), RarityTag (runtime color), SessionBar (logged-in user + logout), TwoFactorDialog (native `<dialog>`), Skeleton (card-shaped), EmptyState, ErrorState, DisclaimerFooter. Every component ships with: default, hover, focus-visible, active, disabled, loading, error states.

## Z-index scale

`--z-sticky: 10` topbar · `--z-dropdown: 20` · `--z-dialog-backdrop: 30` · `--z-dialog: 40` · `--z-toast: 50`. Nothing outside this scale.

## Bans (project-specific, on top of global rules)

- No glassmorphism, no gradient text, no neon glow, no side-stripe borders on cards.
- No cream/beige surfaces anywhere (the anti-reference list is explicit).
- No eyebrow/kicker labels above sections; section headings stand alone.
- No spinners in content areas — skeletons only.
- Icons: one family (`@phosphor-icons/react`), strokeWidth 1.5, no hand-rolled SVG, no emoji.
