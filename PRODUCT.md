# Product

## Register

product

## Platform

web

## Users

Valorant players who want to check their daily store rotation without launching the game — typically on a phone or work/school laptop, away from their gaming PC. They check once or twice a day, in short sessions (under 30 seconds), often in low-light environments. Primary audience: Indonesian SEA-region players; the tool works for any region. Secondary: night-market hunters who check deals during night market windows.

## Product Purpose

A web tool that logs in with Riot credentials (client-side only) and shows everything in the player's daily store: the 4 rotating skin offers with VP prices, the featured bundle, the accessory store, and the night market when active — plus a countdown to the next store reset and an optional local history of past rotations. Success: a player opens the site, logs in once per session, and sees their full store within ~3 seconds, on mobile or desktop.

## Positioning

The complete Valorant store — daily skins, bundle, accessories, night market, and reset countdown — checked in seconds, without launching the game, with credentials that never leave your browser.

## Brand Personality

Tactical, sharp, trustworthy. Feels like an official Riot companion tool, not a fan-made hack page. Calm confidence over hype: the interface stays quiet so the skins (which are loud) carry the color. Emotional goal: "this is safe, fast, and mine."

## Anti-references

- Ad-riddled esports stat sites: banner ads, fake download buttons, popups.
- Neon-glow "gamer aesthetic" pages: glowing text, animated gradients, RGB everywhere.
- Generic SaaS dashboard slop: soft cream surfaces, rounded-2xl cards, purple accents.
- Phishing-adjacent look: anything that asks for credentials without instantly communicating security (no privacy note, no client-side explanation) is a trust failure.

## Design Principles

1. **Skins are the hero, chrome is silent.** Dark, low-saturation surfaces let skin art and rarity colors carry the page; UI color is reserved for actions and urgency (countdown, 2FA).
2. **Trust is a feature.** Every credential surface states plainly that data goes browser-to-Riot only. No dark patterns, no stored passwords, no tracking.
3. **30-second task, zero ceremony.** Login → store visible. No onboarding walls, no modals where inline works, skeletons instead of spinners.
4. **Familiar like the game.** Angular Valorant visual language (sharp corners, condensed display type, red/off-white/navy) so users instantly read this as a Valorant tool.
5. **Honest data.** Prices, reset countdowns, and rarity come from live game data — never hardcoded guesses. Inactive features (e.g., night market between events) say so plainly.

## Accessibility & Inclusion

WCAG 2.1 AA minimum. Dark theme is primary; contrast verified per token (note: off-white text on the brand red fails AA — dark navy ink is used on red surfaces instead). Full `prefers-reduced-motion` support. Keyboard-operable login, 2FA, and tab navigation. Skin names are real text, never baked into images.
