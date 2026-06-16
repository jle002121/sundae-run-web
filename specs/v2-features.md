# Spec: Sundae Run Web — V2 Features

## Objective
Add four new features to the existing single-file PWA (`index.html`): streak tracking, a smart flavor picker, Google Places shop search, and a My Shops favorites list. All changes stay in `index.html` except for a new `GOOGLE_PLACES_KEY` reference in a `.env`-style comment. Data stays in `localStorage`.

---

## Requirements

### 1 — Streak Tracker (Home Screen)

1.1 Display three streak counters on the Home screen below the stats row:
- **Daily streak** — consecutive calendar days with at least one entry
- **Weekly streak** — consecutive calendar weeks (Mon–Sun) with at least one entry
- **Monthly streak** — consecutive calendar months with at least one entry

1.2 Each counter shows the count and a label (e.g. "7 days", "3 weeks", "2 months").

1.3 Streak is shown as 0 if the current period (today / this week / this month) has no entry yet.

1.4 Streak logic is computed from `loadEntries()` on every Home render — no separate storage field needed.

1.5 Daily streak: count backward from today; if today has no entry, check if yesterday does — if not, streak = 0. If yesterday does, count consecutive days back from yesterday.

1.6 Weekly streak: same logic using ISO week numbers (week starts Monday).

1.7 Monthly streak: same logic using year-month pairs.

---

### 2 — Flavor Picker (Log + Edit Forms)

2.1 Replace the plain flavor text input with a combo field: a text input + dropdown that shows flavor suggestions as the user types.

2.2 The dropdown merges two sources (deduped, case-insensitive):
- **Built-in list** of common flavors: Vanilla, Chocolate, Strawberry, Mint Chip, Cookies & Cream, Rocky Road, Butter Pecan, Cookie Dough, Neapolitan, Pistachio, Coffee, Caramel, Lemon, Mango, Peach, Black Raspberry, Moose Tracks, Birthday Cake, Salted Caramel, Peanut Butter Cup
- **Past flavors** from the user's own entries (most-frequent first)

2.3 When the user types, the dropdown filters to flavors whose names contain the typed string (case-insensitive).

2.4 Selecting a suggestion fills the field exactly (canonical spelling) and closes the dropdown.

2.5 The user can still type a free-form flavor not in the list — it saves as entered.

2.6 On the Home screen stats row, add a **Flavors** breakdown: below the existing stats row, show a "Top Flavors" section listing each unique flavor with a count of how many times it has been logged (canonical match, case-insensitive). Sorted most-to-least. Show top 5 max.

2.7 Flavor picker applies to both the Log form and the Edit form.

---

### 3 — Google Places Shop Search (Log + Edit Forms)

3.1 The shop input uses the Google Places Autocomplete API (`/maps/api/place/autocomplete/json`) to suggest real nearby business names as the user types.

3.2 Suggestions are limited to type `establishment` and biased toward the user's current location (obtained via `navigator.geolocation.getCurrentPosition`).

3.3 If geolocation is unavailable or denied, Places search works without location bias.

3.4 Past entries shops (from `getRecentShops()`) are shown first when the field is focused with no text typed; Google Places results appear when the user types 2+ characters.

3.5 The Google Places API key is stored as a JS constant at the top of the script: `const PLACES_KEY = 'YOUR_KEY_HERE';` — with a comment explaining where to get it.

3.6 If `PLACES_KEY` is empty or `'YOUR_KEY_HERE'`, Places search is silently skipped and only past-entry suggestions are shown (graceful degradation).

3.7 Each Places suggestion shows the business name and a 📍 icon. Past-entry suggestions show a 🕐 icon (already existing behavior).

3.8 Applies to both the Log form and the Edit form shop fields.

---

### 4 — My Shops (New Tab)

4.1 Add a third tab to the tab bar: **Shops** (🏪).

4.2 The Shops view shows two sections:
- **Favorites** — manually saved shops (star icon)
- **Visited** — shops derived from past entries (auto-populated, read-only in this list)

4.3 In the Favorites section, the user can add a shop by name (text input + Add button). Favorites are stored in `localStorage` under key `sundae_shops`.

4.4 Each favorite shop card shows the shop name and a remove button (✕).

4.5 In the Visited section, each shop card shows the shop name and the number of times the user has logged an entry there.

4.6 Both sections are sorted alphabetically.

4.7 When the shop field is focused in the Log or Edit form, Favorites appear at the top of the suggestion dropdown (⭐ icon), before past-entry shops (🕐) and before Google Places results.

4.8 The Shops tab has an empty state message if no favorites and no visited shops yet.

---

## Edge Cases

- A flavor typed in mixed case (e.g. "VANILLA") matches "Vanilla" in the built-in list and should not create a new entry — the canonical spelling is used when a match exists.
- Streak logic must handle timezone correctly — use local date (not UTC) for all day/week/month comparisons.
- If the user has no entries, all streaks show 0, Top Flavors section is hidden, Visited shops section is empty.
- Google Places fetch errors (network down, quota exceeded) are silently swallowed — the field still works with local suggestions.
- Duplicate favorites (same name, case-insensitive) cannot be added.

---

## Constraints

- Single `index.html` file — no build step, no npm, no frameworks.
- All data in `localStorage` — no backend changes.
- Google Places API key must be provided by the user — the app works without it (graceful degradation).
- Existing entries, stats, and edit/delete flow must not break.
- Design must match existing color system (`constants/theme.ts` tokens already in CSS variables).

---

## Definition of Done

- [ ] Home screen shows daily / weekly / monthly streak counters, all computing correctly from entries
- [ ] Top Flavors section on Home shows up to 5 flavors with correct counts
- [ ] Log and Edit forms have a flavor combo field with built-in + past-entry suggestions filtered as you type
- [ ] Selecting a suggestion uses canonical spelling; free-form entry still works
- [ ] Shop field shows Places suggestions when 2+ chars typed (if key is set), past entries on focus, favorites at top
- [ ] Graceful degradation when Places key is missing — local suggestions still work
- [ ] My Shops tab exists with Favorites (add/remove) and Visited (auto) sections
- [ ] Favorites appear first in shop dropdown with ⭐ icon
- [ ] All existing features (log, edit, delete, backdate, stats) still work
- [ ] No JS errors in console
