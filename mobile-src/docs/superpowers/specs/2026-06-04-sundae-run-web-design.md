# Sundae Run Web — Design Spec
**Date:** 2026-06-04
**Version:** 1.0
**Status:** Approved

---

## Overview

A complete rewrite of the Sundae Run ice cream tracker as a plain HTML/CSS/JS Progressive Web App (PWA) hosted on GitHub Pages. Replaces the Expo/React Native approach due to toolchain friction (metro bundler timeouts, peer dependency conflicts, Expo Go connection issues).

The web version is intentionally simpler: no backend, no auth, no photo upload. Data lives in `localStorage`. The goal is a working app on your iPhone home screen today, with room to add complexity later.

---

## Repository

**New repo:** `sundae-run-web` (separate from the existing Expo repo)
**GitHub Pages URL:** `https://jle002121.github.io/sundae-run-web/`
**Deploy:** Push to `main` branch → GitHub Pages auto-deploys in ~60 seconds

---

## Files

```
sundae-run-web/
├── index.html        ← entire app (HTML + CSS + JS all inline)
├── manifest.json     ← PWA metadata (name, icons, theme color)
├── sw.js             ← service worker (offline caching + iOS install support)
└── icon.png          ← 192×192 app icon
```

No build step. No `node_modules`. No package.json. Push the files, it's live.

---

## Data Model

Storage key: `sundae_entries` in `localStorage`.
Value: JSON array of entry objects.

```js
// Entry shape
{
  id: string,        // crypto.randomUUID() — unique per entry
  flavor: string,    // required — user-entered text
  shop: string,      // optional — plain text, no Places API
  rating: number,    // optional — integer 1–5, 0 = no rating
  notes: string,     // optional — free text caption
  date: string,      // auto — ISO 8601 timestamp (new Date().toISOString())
}
```

**Read:** `JSON.parse(localStorage.getItem('sundae_entries') ?? '[]')`
**Write:** `localStorage.setItem('sundae_entries', JSON.stringify(entries))`

---

## Views

Two views, toggled by showing/hiding a `<div>` via a CSS class. Bottom tab bar is always visible.

### Home View (default on open)

Top to bottom:

1. **Header** — "Sundae Run 🍨" title
2. **Stats row** — 3 cards side by side:
   - Scoops: `entries.length`
   - Flavors: distinct `flavor` values (case-insensitive, trimmed)
   - Shops: distinct non-empty `shop` values (case-insensitive, trimmed)
3. **"RECENT SCOOPS" label**
4. **Entry list** — all entries, newest first. Each card shows:
   - Flavor name (bold)
   - Star rating (🍨 × rating, empty if no rating)
   - Shop name (if set) · formatted date
5. **Empty state** — "No scoops yet — tap ➕ to log your first! 🍦" when list is empty

### Log View

Single scrollable form:

| Order | Field | Type | Required |
|---|---|---|---|
| 1 | Flavor | Text input | Yes |
| 2 | Shop | Text input (plain, no Places API) | No |
| 3 | Rating | Tap row of 5 🍨 icons | No |
| 4 | Notes | Textarea | No |

**Submit button:** "Log It 🍦" — full-width gradient button
**On submit:** save entry to localStorage, switch to Home view, entry appears at top of list
**Validation:** alert if flavor is empty

---

## Design System

Keeps the original Sundae Run visual identity for future continuity.

| Token | Value |
|---|---|
| Primary | `#5B3FA6` (deep lavender) |
| Accent 1 | `#C9B8FF` (soft purple) |
| Accent 2 | `#FFB3C6` (soft pink) |
| Background | `#F7F0FF` (lavender white) |
| Card | `#FFFFFF` |
| Text secondary | `#9B7ED4` |
| Gradient | `linear-gradient(135deg, #C9B8FF, #FFB3C6)` — Log It button |
| Border radius | Cards: 16px · Button: 14px · Stats: 12px |

Typography: system-ui (San Francisco on iOS) — no custom fonts, no extra requests.

---

## PWA Configuration

**manifest.json** enables "Add to Home Screen" on iOS/Android:
- `display: standalone` — hides browser chrome, looks native
- `theme_color: #5B3FA6` — colors the iOS status bar
- `background_color: #F7F0FF` — splash screen background
- `start_url: /sundae-run-web/` — required for GitHub Pages subdirectory

**sw.js** (service worker):
- Caches `index.html`, `manifest.json`, `sw.js`, `icon.png` on install
- Serves from cache on fetch — app works fully offline
- Required for iOS 16.4+ to show "Add to Home Screen" install prompt

**Install flow on iPhone:**
1. Open `https://jle002121.github.io/sundae-run-web/` in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. App icon appears on home screen, opens in standalone mode

---

## Bottom Tab Bar

Always visible, fixed to bottom of viewport.

| Tab | Icon | Action |
|---|---|---|
| Home | 🏠 | Switch to Home view |
| Log | ➕ | Switch to Log view |

Active tab highlighted in primary color (`#5B3FA6`). Inactive in secondary (`#9B7ED4`).

---

## Scope

### V1 (this spec)
- [x] Log an entry (flavor required, shop/rating/notes optional)
- [x] View full history, newest first
- [x] Stats: total scoops, distinct flavors, distinct shops
- [x] Data persists in localStorage
- [x] PWA installable on iPhone home screen
- [x] Works offline

### V2 (deferred)
- Streak counters (daily / weekly / monthly)
- Calendar heatmap
- Photo upload (likely requires Supabase Storage or base64 in localStorage)
- Supabase backend (data syncs across devices, login)
- Social features (feed, kudos, following)
- Yearly Wrapped

---

## Success Criteria

The V1 is complete when:
- [ ] App loads at `https://jle002121.github.io/sundae-run-web/`
- [ ] User can log an entry (flavor required, all others optional)
- [ ] Entry appears in history list on Home view immediately after logging
- [ ] Stats row counts update correctly after each log
- [ ] Entries persist after closing and reopening Safari
- [ ] App is installable on iPhone via Safari → Add to Home Screen
- [ ] App loads and works with no internet connection (offline via service worker)
