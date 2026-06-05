# Edit, Backdate & Location Autocomplete — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add entry editing, date backdating, and shop autocomplete to the Sundae Run PWA.

**Architecture:** All changes are in `index.html`. The file is split into CSS, HTML, and JS sections — each task targets one section. The edit view is a third view (`view-edit`) following the existing show/hide pattern. Autocomplete is a single reusable `wireShopAutocomplete(inputId, suggestionsId)` function wired to both the log and edit shop inputs.

**Tech Stack:** Vanilla HTML5, CSS3, JavaScript (ES2020+), localStorage

---

## File Map

```
index.html   ← only file modified
  <style>    ← add: .suggestions, .suggestion-item, .view-edit header, date input style
  HTML       ← add: view-edit div, date inputs in log + edit forms, suggestion divs
  <script>   ← add/modify: addEntry (date param), updateEntry, deleteEntry,
               getRecentShops, wireShopAutocomplete, openEditView, edit rating,
               edit save/delete/back handlers, showView (tab bar hide), renderEntryList (data-id + click)
```

---

## Task 1: Update Data Layer

**Files:**
- Modify: `index.html` — JS DATA LAYER section (lines ~330–357)

- [ ] **Step 1: Replace the DATA LAYER section**

Find this entire block in `index.html`:
```js
// ════════════════════════════════════════
// DATA LAYER
// ════════════════════════════════════════

const STORAGE_KEY = 'sundae_entries';

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry({ flavor, shop, rating, notes }) {
  const entries = loadEntries();
  const entry = {
    id: crypto.randomUUID(),
    flavor: flavor.trim(),
    shop: shop.trim(),
    rating,          // integer 1–5, or 0 for no rating
    notes: notes.trim(),
    date: new Date().toISOString(),
  };
  entries.unshift(entry); // newest first
  saveEntries(entries);
  return entry;
}
```

Replace with:
```js
// ════════════════════════════════════════
// DATA LAYER
// ════════════════════════════════════════

const STORAGE_KEY = 'sundae_entries';

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry({ flavor, shop, rating, notes, date }) {
  const entries = loadEntries();
  const entry = {
    id: crypto.randomUUID(),
    flavor: flavor.trim(),
    shop: shop.trim(),
    rating,
    notes: notes.trim(),
    date: new Date(date + 'T12:00:00').toISOString(),
  };
  entries.unshift(entry);
  saveEntries(entries);
  return entry;
}

function updateEntry(id, fields) {
  const entries = loadEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  entries[idx] = {
    ...entries[idx],
    flavor: fields.flavor.trim(),
    shop: fields.shop.trim(),
    rating: fields.rating,
    notes: fields.notes.trim(),
    date: new Date(fields.date + 'T12:00:00').toISOString(),
  };
  saveEntries(entries);
}

function deleteEntry(id) {
  saveEntries(loadEntries().filter(e => e.id !== id));
}

function getRecentShops() {
  const seen = new Set();
  const shops = [];
  for (const e of loadEntries()) {
    const name = e.shop?.trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      shops.push(name);
    }
  }
  return shops; // newest-first (entries stored newest-first)
}
```

- [ ] **Step 2: Verify in browser console**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

In DevTools console:
```js
// Test addEntry with date
addEntry({ flavor: 'Test', shop: 'Shops', rating: 3, notes: '', date: '2026-06-01' })
loadEntries()[0].date  // should contain "2026-06-01" in the ISO string
deleteEntry(loadEntries()[0].id)
loadEntries().length   // should be back to original count

// Test getRecentShops
getRecentShops()  // returns array of unique shop names, newest first
```

- [ ] **Step 3: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: update data layer — addEntry date param, updateEntry, deleteEntry, getRecentShops"
```

---

## Task 2: Add CSS

**Files:**
- Modify: `index.html` — `<style>` block, add after `.tab-btn.active .tab-label { color: var(--primary); }` (last existing CSS rule)

- [ ] **Step 1: Add new CSS rules**

Find the closing `</style>` tag and insert these rules immediately before it:

```css
    /* ── Edit view header ── */
    .header-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .back-btn {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      padding: 0;
      flex-shrink: 0;
    }

    /* ── Date input ── */
    input[type="date"].form-input {
      color: var(--primary);
      font-weight: 600;
    }

    /* ── Shop autocomplete ── */
    .suggestions-wrap { position: relative; }
    .suggestions {
      display: none;
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      background: var(--card);
      border-radius: var(--r-btn);
      box-shadow: 0 4px 20px rgba(91,63,166,0.15);
      z-index: 10;
      overflow: hidden;
    }
    .suggestions.open { display: block; }
    .suggestion-item {
      padding: 12px 16px;
      font-size: 14px;
      color: var(--text);
      cursor: pointer;
      border-bottom: 1px solid var(--divider);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .suggestion-item:last-child { border-bottom: none; }
    .suggestion-item:active { background: var(--bg); }
    .suggestion-icon { color: var(--muted); font-size: 13px; }

    /* ── Delete button ── */
    .btn-delete {
      width: 100%;
      background: none;
      border: 1.5px solid #FFCCC9;
      border-radius: var(--r-btn);
      padding: 14px;
      font-size: 14px;
      font-weight: 700;
      color: #FF453A;
      cursor: pointer;
      font-family: inherit;
      margin-top: 8px;
    }
    .btn-delete:active { opacity: 0.7; }

    /* ── Hide tab bar in edit view ── */
    #app.editing #tab-bar { display: none; }
```

- [ ] **Step 2: Verify CSS loaded**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

In DevTools → Elements, confirm `.suggestions`, `.btn-delete`, `.back-btn` rules are present. No visual change yet — HTML not added.

- [ ] **Step 3: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add CSS for edit view, autocomplete dropdown, date field, delete button"
```

---

## Task 3: Add HTML

**Files:**
- Modify: `index.html` — HTML body section

- [ ] **Step 1: Add date field and suggestions wrapper to log form**

Find in the log form:
```html
        <div class="form-group">
          <label class="form-label" for="input-shop">Shop</label>
          <input class="form-input" type="text" id="input-shop"
            placeholder="e.g. Cold Stone Creamery" autocomplete="off">
        </div>
```

Replace with:
```html
        <div class="form-group">
          <label class="form-label" for="input-date">Date</label>
          <input class="form-input" type="date" id="input-date">
        </div>
        <div class="form-group suggestions-wrap">
          <label class="form-label" for="input-shop">Shop</label>
          <input class="form-input" type="text" id="input-shop"
            placeholder="e.g. Cold Stone Creamery" autocomplete="off">
          <div class="suggestions" id="shop-suggestions"></div>
        </div>
```

- [ ] **Step 2: Add edit view**

Find the tab bar comment:
```html
  <!-- ── Tab bar ── -->
```

Insert the entire edit view immediately before it:
```html
  <!-- ── Edit view ── -->
  <div id="view-edit" class="view">
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="edit-back-btn">← Back</button>
        <h1>Edit Scoop ✏️</h1>
      </div>
    </div>
    <div class="view-content">
      <div class="form-group">
        <label class="form-label" for="input-edit-flavor">Flavor *</label>
        <input class="form-input" type="text" id="input-edit-flavor" autocomplete="off">
      </div>
      <div class="form-group">
        <label class="form-label" for="input-edit-date">Date</label>
        <input class="form-input" type="date" id="input-edit-date">
      </div>
      <div class="form-group suggestions-wrap">
        <label class="form-label" for="input-edit-shop">Shop</label>
        <input class="form-input" type="text" id="input-edit-shop" autocomplete="off">
        <div class="suggestions" id="edit-shop-suggestions"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Rating</label>
        <div class="rating-row" id="edit-rating-row">
          <button type="button" class="rating-btn edit-rating-btn" data-value="1">🍨</button>
          <button type="button" class="rating-btn edit-rating-btn" data-value="2">🍨</button>
          <button type="button" class="rating-btn edit-rating-btn" data-value="3">🍨</button>
          <button type="button" class="rating-btn edit-rating-btn" data-value="4">🍨</button>
          <button type="button" class="rating-btn edit-rating-btn" data-value="5">🍨</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="input-edit-notes">Notes</label>
        <textarea class="form-input" id="input-edit-notes" placeholder="Any thoughts?"></textarea>
      </div>
      <button class="btn-submit" id="edit-save-btn">Save Changes</button>
      <button class="btn-delete" id="edit-delete-btn">Delete Entry</button>
    </div>
  </div>

```

- [ ] **Step 3: Verify HTML structure**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

In DevTools → Elements, confirm:
- `#view-edit` exists as a sibling of `#view-home` and `#view-log`
- `#input-date` exists inside `#log-form`
- `#shop-suggestions` and `#edit-shop-suggestions` divs exist

- [ ] **Step 4: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add edit view HTML, date fields, and suggestion divs"
```

---

## Task 4: Add Autocomplete JS

**Files:**
- Modify: `index.html` — JS section, add after the RATING PICKER section

- [ ] **Step 1: Add autocomplete JS**

Find this comment in the JS:
```js
// ════════════════════════════════════════
// LOG FORM SUBMIT
// ════════════════════════════════════════
```

Insert the entire autocomplete section immediately before it:
```js
// ════════════════════════════════════════
// SHOP AUTOCOMPLETE
// ════════════════════════════════════════

function wireShopAutocomplete(inputId, suggestionsId) {
  const input = document.getElementById(inputId);
  const box   = document.getElementById(suggestionsId);

  function showSuggestions(query) {
    const all = getRecentShops();
    const q   = query.toLowerCase().trim();
    const matches = q
      ? all.filter(s => s.toLowerCase().includes(q))
      : all.slice(0, 5);

    if (matches.length === 0) {
      box.innerHTML = '';
      box.classList.remove('open');
      return;
    }

    box.innerHTML = matches.map(s =>
      `<div class="suggestion-item" data-name="${escapeHtml(s)}">
        <span class="suggestion-icon">🕐</span>${escapeHtml(s)}
      </div>`
    ).join('');
    box.classList.add('open');

    box.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent input blur before click fires
        input.value = item.dataset.name;
        box.classList.remove('open');
      });
    });
  }

  input.addEventListener('focus', () => showSuggestions(input.value));
  input.addEventListener('input', () => showSuggestions(input.value));
  input.addEventListener('blur',  () => {
    // Small delay so mousedown on suggestion fires first
    setTimeout(() => box.classList.remove('open'), 150);
  });
}

wireShopAutocomplete('input-shop', 'shop-suggestions');
wireShopAutocomplete('input-edit-shop', 'edit-shop-suggestions');
```

- [ ] **Step 2: Verify autocomplete works**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

1. Log at least two entries with different shop names (if you haven't already)
2. Tap the ➕ tab → click the Shop field
3. Dropdown should appear showing up to 5 recently used shops
4. Type a letter → list filters in real time
5. Click a suggestion → field fills, dropdown closes

- [ ] **Step 3: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add shop autocomplete wired to log and edit forms"
```

---

## Task 5: Update Log Form Submit + Date Init

**Files:**
- Modify: `index.html` — LOG FORM SUBMIT section and INIT section

- [ ] **Step 1: Update log form submit to pass date**

Find:
```js
document.getElementById('log-form').addEventListener('submit', e => {
  e.preventDefault();
  const flavor = document.getElementById('input-flavor').value.trim();
  if (!flavor) {
    alert('Add a flavor first!');
    document.getElementById('input-flavor').focus();
    return;
  }
  const shop  = document.getElementById('input-shop').value;
  const notes = document.getElementById('input-notes').value;
  addEntry({ flavor, shop, rating: selectedRating, notes });
  document.getElementById('log-form').reset();
  setRating(0);
  showView('home');
});
```

Replace with:
```js
document.getElementById('log-form').addEventListener('submit', e => {
  e.preventDefault();
  const flavor = document.getElementById('input-flavor').value.trim();
  if (!flavor) {
    alert('Add a flavor first!');
    document.getElementById('input-flavor').focus();
    return;
  }
  const shop  = document.getElementById('input-shop').value;
  const notes = document.getElementById('input-notes').value;
  const date  = document.getElementById('input-date').value;
  addEntry({ flavor, shop, rating: selectedRating, notes, date });
  document.getElementById('log-form').reset();
  setRating(0);
  initDateField();   // reset date to today after form reset
  showView('home');
});
```

- [ ] **Step 2: Add initDateField and call it in INIT**

Find:
```js
// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════

renderHome();
```

Replace with:
```js
// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════

function initDateField() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-date').value = today;
}

renderHome();
initDateField();
```

- [ ] **Step 3: Verify date field**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

1. Tap ➕ tab → Date field should default to today's date
2. Change date to yesterday → fill in a flavor → tap "Log It"
3. Entry should appear in home list showing yesterday's date (e.g. "Yesterday" or "Jun 3")
4. Tap ➕ again → Date field should be reset to today

- [ ] **Step 4: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: wire date field to log form, init to today, reset after submit"
```

---

## Task 6: Add Edit View JS

**Files:**
- Modify: `index.html` — add EDIT VIEW section after LOG FORM SUBMIT section

- [ ] **Step 1: Add edit view JS**

Find:
```js
// ════════════════════════════════════════
// VIEW SWITCHING
// ════════════════════════════════════════
```

Insert the entire edit section immediately before it:
```js
// ════════════════════════════════════════
// EDIT VIEW
// ════════════════════════════════════════

let editingId = null;
let selectedEditRating = 0;

function setEditRating(value) {
  selectedEditRating = value;
  document.querySelectorAll('.edit-rating-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.value) <= value);
  });
}

document.querySelectorAll('.edit-rating-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = Number(btn.dataset.value);
    setEditRating(v === selectedEditRating ? 0 : v);
  });
});

function openEditView(id) {
  const entry = loadEntries().find(e => e.id === id);
  if (!entry) return;
  editingId = id;

  document.getElementById('input-edit-flavor').value = entry.flavor;
  document.getElementById('input-edit-shop').value   = entry.shop ?? '';
  document.getElementById('input-edit-notes').value  = entry.notes ?? '';

  // Convert ISO date back to YYYY-MM-DD for the date input
  const dateStr = new Date(entry.date).toLocaleDateString('en-CA');
  document.getElementById('input-edit-date').value = dateStr;

  setEditRating(entry.rating ?? 0);
  showView('edit');
}

document.getElementById('edit-back-btn').addEventListener('click', () => {
  showView('home');
});

document.getElementById('edit-save-btn').addEventListener('click', () => {
  const flavor = document.getElementById('input-edit-flavor').value.trim();
  if (!flavor) {
    alert('Flavor is required!');
    document.getElementById('input-edit-flavor').focus();
    return;
  }
  updateEntry(editingId, {
    flavor,
    shop:   document.getElementById('input-edit-shop').value,
    rating: selectedEditRating,
    notes:  document.getElementById('input-edit-notes').value,
    date:   document.getElementById('input-edit-date').value,
  });
  editingId = null;
  showView('home');
});

document.getElementById('edit-delete-btn').addEventListener('click', () => {
  if (!confirm('Delete this scoop?')) return;
  deleteEntry(editingId);
  editingId = null;
  showView('home');
});
```

- [ ] **Step 2: Verify edit view opens (no click wiring yet)**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

In DevTools console:
```js
// Get any entry id
const id = loadEntries()[0].id
openEditView(id)
```

Expected:
- Edit view appears with all fields pre-filled
- Tab bar is hidden (`#app` gets class `editing` — this will be added in Task 7)
- Back button returns to Home
- Changing flavor and tapping Save Changes → updates entry, returns to Home, change visible

- [ ] **Step 3: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add edit view JS — openEditView, save, delete, back"
```

---

## Task 7: Update showView + renderEntryList

**Files:**
- Modify: `index.html` — VIEW SWITCHING section and RENDERING section

- [ ] **Step 1: Update showView to manage tab bar visibility**

Find:
```js
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelector(`.tab-btn[data-view="${name}"]`).classList.add('active');
  if (name === 'home') renderHome();
  document.getElementById('view-' + name).scrollTop = 0;
}
```

Replace with:
```js
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  // Edit view has no tab — only update tab highlight for home/log
  if (name !== 'edit') {
    const tab = document.querySelector(`.tab-btn[data-view="${name}"]`);
    if (tab) tab.classList.add('active');
  }

  // Hide tab bar while editing
  document.getElementById('app').classList.toggle('editing', name === 'edit');

  if (name === 'home') renderHome();
  document.getElementById('view-' + name).scrollTop = 0;
}
```

- [ ] **Step 2: Update renderEntryList to make cards tappable**

Find:
```js
  list.innerHTML = entries.map(entry => {
    const ratingHtml = entry.rating > 0
      ? `<div class="entry-rating">${'🍨'.repeat(entry.rating)}</div>`
      : '';
    const meta = [entry.shop, formatDate(entry.date)].filter(Boolean).join(' · ');
    return `
      <div class="entry-card">
        <div class="entry-chip" style="background:${chipColor(entry.flavor)}">🍦</div>
        <div class="entry-info">
          <div class="entry-flavor">${escapeHtml(entry.flavor)}</div>
          <div class="entry-meta">${escapeHtml(meta)}</div>
          ${ratingHtml}
        </div>
      </div>`;
  }).join('');
```

Replace with:
```js
  list.innerHTML = entries.map(entry => {
    const ratingHtml = entry.rating > 0
      ? `<div class="entry-rating">${'🍨'.repeat(entry.rating)}</div>`
      : '';
    const meta = [entry.shop, formatDate(entry.date)].filter(Boolean).join(' · ');
    return `
      <div class="entry-card" data-id="${escapeHtml(entry.id)}" style="cursor:pointer">
        <div class="entry-chip" style="background:${chipColor(entry.flavor)}">🍦</div>
        <div class="entry-info">
          <div class="entry-flavor">${escapeHtml(entry.flavor)}</div>
          <div class="entry-meta">${escapeHtml(meta)}</div>
          ${ratingHtml}
        </div>
        <span style="font-size:14px;color:var(--muted);opacity:0.5">›</span>
      </div>`;
  }).join('');

  // Wire click handlers after rendering
  list.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => openEditView(card.dataset.id));
  });
```

- [ ] **Step 3: Full end-to-end verification**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

Run through the full checklist:
```
✅ Home view shows entry cards with › chevron on the right
✅ Tapping an entry opens edit view with all fields pre-filled
✅ Full notes text is visible in the notes textarea
✅ Tab bar is hidden while in edit view
✅ Back button (← Back) returns to Home without saving
✅ Changing a field and tapping Save Changes updates the entry in the list
✅ Tapping Delete Entry → confirm dialog → entry removed from list
✅ Log form Date field defaults to today
✅ Changing date to 2 days ago → Log It → entry shows past date in list
✅ Shop field: focus with empty text → shows up to 5 recent shops
✅ Typing partial shop name → filters suggestions
✅ Clicking a suggestion → fills field, closes dropdown
✅ Edit form shop field also shows autocomplete
✅ Stats row updates correctly after add/edit/delete
```

- [ ] **Step 4: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: wire entry card taps to edit view, update showView for tab bar"
```

---

## Task 8: Deploy

- [ ] **Step 1: Bump service worker cache version**

Find in `sw.js`:
```js
const CACHE = 'sundae-v1';
```

Replace with:
```js
const CACHE = 'sundae-v2';
```

- [ ] **Step 2: Push to GitHub**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add sw.js
git commit -m "chore: bump SW cache to v2 for edit/backdate/autocomplete release"
git push
```

- [ ] **Step 3: Verify live**

Wait ~60 seconds, then:
```bash
curl -s -o /dev/null -w "%{http_code}" https://jle002121.github.io/sundae-run-web/
```

Expected: `200`

- [ ] **Step 4: Test on iPhone**

On iPhone Safari:
1. Open `https://jle002121.github.io/sundae-run-web/` (or open the installed app)
2. If installed: close app, reopen — service worker will fetch the update in background; may need one more reopen to get new version
3. Run the same checklist from Task 7 Step 3 on the real device
