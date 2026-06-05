# Sundae Run — Edit, Backdate & Location Autocomplete Design Spec
**Date:** 2026-06-04
**Version:** 1.0
**Status:** Approved

---

## Overview

Three additive features to the existing `index.html` PWA:

1. **Edit entries** — tap any entry card to open a pre-filled edit view
2. **Backdate** — date picker on log and edit forms, defaults to today
3. **Location autocomplete** — shop field shows previously-used shop names on focus and filters as you type

---

## Feature 1: Edit View

### New HTML view
Add `<div id="view-edit" class="view">` alongside the existing `view-home` and `view-log`. The tab bar is **hidden** while `view-edit` is active (it is not a top-level destination).

### Header
- Back button (← Back) on the left — returns to Home without saving, discards changes
- Title: "Edit Scoop ✏️"

### Form fields (same order as log form)
| Field | Pre-filled from | Editable |
|---|---|---|
| Flavor * | `entry.flavor` | Yes |
| Date | `entry.date` (formatted to YYYY-MM-DD) | Yes |
| Shop | `entry.shop` | Yes + autocomplete |
| Rating | `entry.rating` | Yes |
| Notes | `entry.notes` | Yes |

### Buttons
- **Save Changes** — gradient button, updates the entry in localStorage by `id`, returns to Home, re-renders list
- **Delete Entry** — outlined red button below Save, shows `confirm("Delete this scoop?")` before deleting, returns to Home on confirm

### Tab bar behavior
`#tab-bar` gets `display: none` when `view-edit` is active. Restored when navigating away.

### Entry card tap target
Each rendered entry card gets `data-id="${entry.id}"` and a click listener that calls `openEditView(entry.id)`.

### Data functions needed
- `updateEntry(id, fields)` — finds entry by id in localStorage array, merges fields, saves
- `deleteEntry(id)` — filters entry by id out of array, saves

---

## Feature 2: Backdate

### Field
`<input type="date" id="input-date">` — native iOS date picker, no library.

### Placement
Between Flavor and Shop in both the Log form and the Edit form.

### Default value
Set to today on form open: `new Date().toISOString().split('T')[0]` → `"2026-06-04"`

### Storage
Combine the picked date string with noon local time to avoid timezone off-by-one:
```js
new Date(dateValue + 'T12:00:00').toISOString()
```

### Edit view pre-fill
When opening an entry for editing, convert its stored ISO date back to `YYYY-MM-DD`:
```js
new Date(entry.date).toLocaleDateString('en-CA') // "2026-06-03"
```
(`en-CA` locale reliably produces `YYYY-MM-DD` format.)

### `addEntry` signature change
Add `date` parameter: `addEntry({ flavor, shop, rating, notes, date })`. The `date` field replaces the hardcoded `new Date().toISOString()`.

---

## Feature 3: Location Autocomplete

### Behavior
- When the shop input is **focused** with empty text → dropdown shows up to 5 most recently used unique shop names
- When the user **types** → dropdown filters all previously-used shop names (case-insensitive prefix/substring match)
- Clicking a suggestion → fills the input, closes the dropdown
- If no matches → dropdown hidden (not shown empty)
- Clicking outside the input/dropdown → closes the dropdown

### Data source
`getRecentShops()` — derived from `loadEntries()`:
```js
function getRecentShops() {
  const entries = loadEntries();
  const seen = new Set();
  const shops = [];
  for (const e of entries) {
    const name = e.shop?.trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      shops.push(name);
    }
  }
  return shops; // ordered most-recent-first (entries are stored newest-first)
}
```

### Dropdown HTML
Rendered as a sibling div below the input, toggled via CSS class `.open`:
```html
<div id="shop-suggestions" class="suggestions"></div>
```

### Applies to
Both the Log form (`input-shop`) and the Edit form (`input-edit-shop`) — same `wireShopAutocomplete(inputId)` function handles both.

---

## Architecture Notes

All changes are in `index.html`. No new files.

### New HTML elements
- `<div id="view-edit" class="view">` — edit view
- `<input type="date" id="input-date">` in log form
- `<input type="date" id="input-edit-date">` in edit form
- `<div id="shop-suggestions" class="suggestions">` below log shop input
- `<div id="edit-shop-suggestions" class="suggestions">` below edit shop input
- All edit form fields: `input-edit-flavor`, `input-edit-date`, `input-edit-shop`, `input-edit-notes`
- Edit rating buttons with class `edit-rating-btn`

### New JS functions
| Function | Purpose |
|---|---|
| `updateEntry(id, fields)` | Merge-update entry in localStorage |
| `deleteEntry(id)` | Remove entry from localStorage |
| `openEditView(id)` | Load entry into edit form, show view-edit |
| `getRecentShops()` | Return unique shop names, most-recent-first |
| `wireShopAutocomplete(inputId, suggestionsId)` | Attach focus/input/click handlers for autocomplete |

### Modified JS
- `addEntry` — add `date` param, use it instead of `new Date().toISOString()`
- `renderEntryList` — add `data-id` to each card, add click listener
- `showView` — hide/show tab bar based on whether view is `edit`
- Log form submit — pass `date` field value
- Log form `setRating` / `selectedRating` — scoped to log form; edit form gets its own `selectedEditRating`

---

## Success Criteria

- [ ] Tapping any entry card opens the edit view pre-filled with all its data (including full notes)
- [ ] Back button returns to Home without saving
- [ ] Save Changes updates the entry in place, Home list reflects changes
- [ ] Delete Entry (with confirm dialog) removes the entry, Home list updates
- [ ] Log form has a Date field defaulting to today
- [ ] Logging with a past date shows the entry with the correct past date in the list
- [ ] Shop field on focus (empty) shows up to 5 recently used shops
- [ ] Typing filters suggestions in real time
- [ ] Clicking a suggestion fills the shop field
- [ ] Autocomplete works in both log form and edit form
