# Spec: Ice Cream Wrapped + Price Field

## Objective
Add an optional price field to every log entry so spending can be tracked, and add a "Wrapped" view — a year-end summary that unlocks only in December — showing the user's top stats for the current calendar year (most frequent flavor, total spent, longest streak, busiest month, most visited shop).

---

## Requirements

### 1 — Price Field (Log + Edit Forms)

1.1 Add an optional numeric price input to the Log form, between the Shop field and the Rating field. Label: "Price". Placeholder: "e.g. 4.50". Type: `number`, `min="0"`, `step="0.01"`. Not required.

1.2 Add the same optional price input to the Edit form in the same relative position.

1.3 `addEntry()` saves a `price` field: a float if entered, or `null` if left blank.

1.4 `updateEntry()` saves the updated `price` field the same way.

1.5 Existing entries without a `price` field are treated as `null` (no migration needed).

1.6 The price is not displayed on entry cards in the Home list (keeps cards clean).

---

### 2 — Wrapped View

2.1 A "Wrapped 🎁" tab appears in the tab bar **only in December** (month index 11). It does not appear in any other month.

2.2 The Wrapped view shows stats for the **current calendar year** (Jan 1 – Dec 31 of the current year) computed from `loadEntries()`.

2.3 **Stat 1 — Top Flavor:** The flavor logged the most times this year. Show the flavor name and the count (e.g. "Vanilla · 12 times"). Use case-insensitive canonical matching (same logic as Top Flavors on Home). If tied, show the one that appears first alphabetically.

2.4 **Stat 2 — Total Spent:** Sum of all `price` fields for entries this year where price is non-null. Display as a dollar amount formatted to 2 decimal places (e.g. "$47.50"). If no entries have a price, show "—".

2.5 **Stat 3 — Longest Streak:** The longest consecutive-day streak achieved at any point during the current year (not the current active streak). A streak counts only days within the current year. Show the count and unit (e.g. "14 days").

2.6 **Stat 4 — Busiest Month:** The calendar month this year with the most entries. Show the full month name and the count (e.g. "July · 8 scoops"). If tied, show the earliest month.

2.7 **Stat 5 — Favorite Shop:** The shop logged the most times this year (entries must have a non-empty shop field). Show the shop name and count (e.g. "Cold Stone · 6 visits"). If no shop data exists, show "—".

2.8 Each stat is displayed as a visually distinct card using the existing design system (gradient backgrounds, primary color text, card border radius). The view has a celebratory header: "Your [YEAR] Wrapped 🎁".

2.9 If the user has zero entries for the current year, show an empty state message: "No scoops logged yet this year — get out there! 🍦".

2.10 The Wrapped tab is the fourth tab when visible: Home · Log · Shops · Wrapped.

---

## Edge Cases

- Entries from previous years must be excluded from all Wrapped stats (filter by current year before computing anything).
- The Wrapped tab must not appear at all outside December — not hidden/greyed out, fully absent from the DOM.
- If only one entry exists for the year, longest streak = 1, busiest month = that entry's month, top flavor = that flavor.
- Price input accepts decimals; empty input saves as `null` not `0` or `""`.
- Longest streak calculation must use local timezone dates (same `localDateStr` function already in codebase), and only count days that fall within the current year.

---

## Constraints

- Single `index.html` file — no new files.
- All data in `localStorage` — no schema migration needed for existing entries.
- Must use existing CSS variables and design patterns.
- Tab bar must remain at 3 tabs (Home · Log · Shops) in all months except December.
- No changes to service worker or manifest.

---

## Definition of Done

- [ ] Log form has an optional Price field (number input, between Shop and Rating)
- [ ] Edit form has the same optional Price field, pre-filled from the entry's saved price
- [ ] `addEntry` and `updateEntry` persist the `price` value (float or null)
- [ ] Wrapped tab (🎁) appears in tab bar only when the current month is December
- [ ] Wrapped view shows all 5 stat cards for the current year
- [ ] Top Flavor stat shows correct flavor + count (case-insensitive, canonical)
- [ ] Total Spent shows formatted dollar amount or "—" if no prices logged
- [ ] Longest Streak shows the best consecutive-day streak within the current year
- [ ] Busiest Month shows the correct month name + count
- [ ] Favorite Shop shows correct shop + count, or "—" if no shop data
- [ ] All stats exclude entries from previous years
- [ ] Empty state shown if no entries for current year
- [ ] Existing log/edit/delete/streaks/flavor picker/My Shops all still work

---

## 2026 Recap Extension

- Keep the December-only Wrapped tab, but provide a year-round entry point from More so the owner can preview the report as data accumulates.
- Present the recap as a warm, tactile personal collection using adapted Cult UI texture-card surfaces, Motion Primitives-style selection feedback, and Tremor-style data hierarchy. Avoid newspaper styling and generic gradient-card grids.
- Add total scoops, unique flavor/shop counts, price coverage and average recorded price.
- Add three named superlatives: Regular of the Year, Critic's Choice, and Biggest Sundae Day.
- Continue calculating everything locally from the selected calendar year's entries.
