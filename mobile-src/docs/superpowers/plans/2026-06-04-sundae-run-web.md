# Sundae Run Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a plain HTML/CSS/JS PWA ice cream tracker hosted on GitHub Pages with localStorage persistence, installable on iPhone.

**Architecture:** Single `index.html` (HTML + CSS + JS inline), `manifest.json`, `sw.js`, `icon.png`. Two views (Home, Log) toggled via CSS class. All data in `localStorage` as a JSON array under key `sundae_entries`.

**Tech Stack:** Vanilla HTML5, CSS3, JavaScript (ES2020+), localStorage, Service Worker API, GitHub Pages

---

## File Map

```
sundae-run-web/
├── index.html     ← entire app — HTML skeleton, all CSS in <style>, all JS in <script>
├── manifest.json  ← PWA metadata (name, icons, display mode, theme color)
├── sw.js          ← service worker — cache-first for offline support
└── icon.png       ← 192×192 purple app icon (generated via Python)
```

---

## Task 1: Repository Setup

**Files:**
- Create: `/Users/jacoble/Downloads/sundae-run-web/` (new project directory)
- Create: `.gitignore`

- [ ] **Step 1: Create project directory and initialize git**

```bash
mkdir /Users/jacoble/Downloads/sundae-run-web
cd /Users/jacoble/Downloads/sundae-run-web
git init
```

Expected: `Initialized empty Git repository in .../sundae-run-web/.git/`

- [ ] **Step 2: Create .gitignore**

Create `/Users/jacoble/Downloads/sundae-run-web/.gitignore`:
```
.DS_Store
```

- [ ] **Step 3: Initial commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add .gitignore
git commit -m "chore: initialize sundae-run-web repo"
```

---

## Task 2: PWA Assets

**Files:**
- Create: `icon.png`
- Create: `manifest.json`
- Create: `sw.js`

- [ ] **Step 1: Generate icon.png**

Run this Python script (uses only built-in modules, no pip install needed):

```bash
cd /Users/jacoble/Downloads/sundae-run-web
python3 -c "
import struct, zlib

def make_png(w, h, r, g, b):
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''.join(b'\x00' + bytes([r, g, b] * w) for _ in range(h))
    out = b'\x89PNG\r\n\x1a\n'
    out += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    out += chunk(b'IDAT', zlib.compress(raw))
    out += chunk(b'IEND', b'')
    return out

open('icon.png', 'wb').write(make_png(192, 192, 0x5B, 0x3F, 0xA6))
print('icon.png created')
"
```

Expected output: `icon.png created`

- [ ] **Step 2: Verify icon.png exists and is non-zero**

```bash
ls -lh /Users/jacoble/Downloads/sundae-run-web/icon.png
```

Expected: file exists, size > 0 bytes (should be ~1-2 KB)

- [ ] **Step 3: Create manifest.json**

Create `/Users/jacoble/Downloads/sundae-run-web/manifest.json`:
```json
{
  "name": "Sundae Run",
  "short_name": "Sundae Run",
  "description": "Track every scoop",
  "start_url": "/sundae-run-web/",
  "display": "standalone",
  "background_color": "#F7F0FF",
  "theme_color": "#5B3FA6",
  "icons": [
    {
      "src": "icon.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 4: Create sw.js**

Create `/Users/jacoble/Downloads/sundae-run-web/sw.js`:
```js
const CACHE = 'sundae-v1';
const ASSETS = [
  '/sundae-run-web/',
  '/sundae-run-web/index.html',
  '/sundae-run-web/manifest.json',
  '/sundae-run-web/icon.png',
  '/sundae-run-web/sw.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached ?? fetch(e.request))
  );
});
```

- [ ] **Step 5: Commit PWA assets**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add icon.png manifest.json sw.js
git commit -m "feat: add PWA manifest, service worker, and icon"
```

---

## Task 3: HTML Skeleton + CSS

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html with full HTML structure and CSS**

Create `/Users/jacoble/Downloads/sundae-run-web/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Sundae Run">
  <meta name="theme-color" content="#5B3FA6">
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icon.png">
  <title>Sundae Run</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    /* ── Tokens ── */
    :root {
      --primary:   #5B3FA6;
      --accent1:   #C9B8FF;
      --accent2:   #FFB3C6;
      --bg:        #F7F0FF;
      --card:      #FFFFFF;
      --text:      #1C1C1E;
      --muted:     #9B7ED4;
      --divider:   #EEE8FF;
      --gradient:  linear-gradient(135deg, #C9B8FF, #FFB3C6);
      --radius-card:   16px;
      --radius-btn:    14px;
      --radius-stat:   12px;
    }

    /* ── App shell ── */
    html, body {
      height: 100%;
      background: var(--bg);
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }
    #app {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-width: 430px;
      margin: 0 auto;
    }

    /* ── Views ── */
    .view {
      display: none;
      flex: 1;
      flex-direction: column;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    .view.active { display: flex; }
    .view-content { padding: 16px 16px 32px; }

    /* ── Header ── */
    .header {
      padding: 56px 16px 12px;
      background: var(--bg);
    }
    .header h1 {
      font-size: 22px;
      font-weight: 800;
      color: var(--primary);
    }

    /* ── Stats row ── */
    .stats-row {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .stat-card {
      flex: 1;
      background: var(--card);
      border-radius: var(--radius-stat);
      padding: 14px 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--primary);
      display: block;
    }
    .stat-label {
      font-size: 9px;
      font-weight: 700;
      color: var(--muted);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 2px;
      display: block;
    }

    /* ── Section label ── */
    .section-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--muted);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    /* ── Entry cards ── */
    .entry-card {
      background: var(--card);
      border-radius: var(--radius-card);
      padding: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .entry-chip {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .entry-info { flex: 1; min-width: 0; }
    .entry-flavor {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .entry-meta {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }
    .entry-rating { font-size: 10px; margin-top: 2px; }

    /* ── Empty state ── */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--muted);
      font-size: 14px;
    }

    /* ── Log form ── */
    .form-group { margin-bottom: 14px; }
    .form-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: block;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      background: var(--card);
      border: none;
      border-radius: var(--radius-btn);
      padding: 14px 16px;
      font-size: 15px;
      color: var(--text);
      font-family: inherit;
      outline: none;
      -webkit-appearance: none;
    }
    .form-input::placeholder { color: var(--muted); }
    textarea.form-input {
      resize: none;
      height: 80px;
    }

    /* ── Rating picker ── */
    .rating-row {
      display: flex;
      gap: 8px;
    }
    .rating-btn {
      font-size: 28px;
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.25;
      transition: opacity 0.15s;
      padding: 0;
      line-height: 1;
    }
    .rating-btn.active { opacity: 1; }

    /* ── Submit button ── */
    .btn-submit {
      width: 100%;
      background: var(--gradient);
      border: none;
      border-radius: var(--radius-btn);
      padding: 16px;
      font-size: 16px;
      font-weight: 700;
      color: white;
      cursor: pointer;
      font-family: inherit;
      margin-top: 8px;
      -webkit-appearance: none;
    }
    .btn-submit:active { opacity: 0.85; }

    /* ── Tab bar ── */
    #tab-bar {
      display: flex;
      background: var(--card);
      border-top: 1px solid var(--divider);
      padding-bottom: env(safe-area-inset-bottom);
      flex-shrink: 0;
    }
    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      padding: 10px 0 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-family: inherit;
    }
    .tab-icon { font-size: 22px; line-height: 1; }
    .tab-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--muted);
    }
    .tab-btn.active .tab-label { color: var(--primary); }
  </style>
</head>
<body>
<div id="app">

  <!-- ── Home view ── -->
  <div id="view-home" class="view active">
    <div class="header">
      <h1>Sundae Run 🍨</h1>
    </div>
    <div class="view-content">
      <div class="stats-row" id="stats-row">
        <div class="stat-card">
          <span class="stat-value" id="stat-scoops">0</span>
          <span class="stat-label">scoops</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" id="stat-flavors">0</span>
          <span class="stat-label">flavors</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" id="stat-shops">0</span>
          <span class="stat-label">shops</span>
        </div>
      </div>
      <div class="section-label">Recent Scoops</div>
      <div id="entry-list"></div>
    </div>
  </div>

  <!-- ── Log view ── -->
  <div id="view-log" class="view">
    <div class="header">
      <h1>New Scoop 🍦</h1>
    </div>
    <div class="view-content">
      <form id="log-form">
        <div class="form-group">
          <label class="form-label" for="input-flavor">Flavor *</label>
          <input class="form-input" type="text" id="input-flavor" placeholder="e.g. Chocolate Chip Cookie Dough" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label" for="input-shop">Shop</label>
          <input class="form-input" type="text" id="input-shop" placeholder="e.g. Cold Stone Creamery" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">Rating</label>
          <div class="rating-row" id="rating-row">
            <button type="button" class="rating-btn" data-value="1">🍨</button>
            <button type="button" class="rating-btn" data-value="2">🍨</button>
            <button type="button" class="rating-btn" data-value="3">🍨</button>
            <button type="button" class="rating-btn" data-value="4">🍨</button>
            <button type="button" class="rating-btn" data-value="5">🍨</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-notes">Notes</label>
          <textarea class="form-input" id="input-notes" placeholder="Any thoughts?"></textarea>
        </div>
        <button type="submit" class="btn-submit">Log It 🍦</button>
      </form>
    </div>
  </div>

  <!-- ── Tab bar ── -->
  <nav id="tab-bar">
    <button class="tab-btn active" data-view="home">
      <span class="tab-icon">🏠</span>
      <span class="tab-label">Home</span>
    </button>
    <button class="tab-btn" data-view="log">
      <span class="tab-icon">➕</span>
      <span class="tab-label">Log</span>
    </button>
  </nav>

</div>
<script>
// ── placeholder: JS added in Task 4–7 ──
</script>
</body>
</html>
```

- [ ] **Step 2: Verify HTML opens in browser**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

Expected: Browser opens showing "Sundae Run 🍨" header, stats row (all 0s), empty entry area, bottom tab bar with Home and Log tabs. Tapping Log tab does nothing yet (JS not wired).

- [ ] **Step 3: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add HTML skeleton and full CSS"
```

---

## Task 4: Data Layer

**Files:**
- Modify: `index.html` — replace `// ── placeholder ──` script block with full JS

- [ ] **Step 1: Replace the placeholder script block with the data layer**

In `index.html`, find:
```html
<script>
// ── placeholder: JS added in Task 4–7 ──
</script>
```

Replace with:
```html
<script>
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

// ════════════════════════════════════════
// PLACEHOLDER: rendering + events in Tasks 5–7
// ════════════════════════════════════════
</script>
```

- [ ] **Step 2: Verify data layer in browser console**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

Open DevTools (right-click → Inspect → Console) and run:
```js
addEntry({ flavor: 'Chocolate', shop: 'Cold Stone', rating: 4, notes: 'great' })
loadEntries()
```

Expected: `addEntry` returns an entry object with `id`, `flavor`, `date`. `loadEntries()` returns an array with that entry.

- [ ] **Step 3: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add localStorage data layer"
```

---

## Task 5: Home View Rendering

**Files:**
- Modify: `index.html` — replace `// PLACEHOLDER: rendering + events in Tasks 5–7` with rendering functions

- [ ] **Step 1: Replace the rendering placeholder with home view render functions**

In `index.html`, find:
```js
// ════════════════════════════════════════
// PLACEHOLDER: rendering + events in Tasks 5–7
// ════════════════════════════════════════
```

Replace with:
```js
// ════════════════════════════════════════
// RENDERING
// ════════════════════════════════════════

const CHIP_COLORS = ['#FFB3C6','#C9B8FF','#B8F0E6','#FFE4A0','#FFD6B3'];

function chipColor(flavor) {
  let n = 0;
  for (const c of flavor) n += c.charCodeAt(0);
  return CHIP_COLORS[n % CHIP_COLORS.length];
}

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderStats(entries) {
  document.getElementById('stat-scoops').textContent = entries.length;
  const flavors = new Set(entries.map(e => e.flavor.toLowerCase().trim()));
  document.getElementById('stat-flavors').textContent = flavors.size;
  const shops = new Set(entries.filter(e => e.shop).map(e => e.shop.toLowerCase().trim()));
  document.getElementById('stat-shops').textContent = shops.size;
}

function renderEntryList(entries) {
  const list = document.getElementById('entry-list');
  if (entries.length === 0) {
    list.innerHTML = '<div class="empty-state">No scoops yet —<br>tap ➕ to log your first! 🍦</div>';
    return;
  }
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
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHome() {
  const entries = loadEntries();
  renderStats(entries);
  renderEntryList(entries);
}

// ════════════════════════════════════════
// PLACEHOLDER: log form + view switching in Tasks 6–7
// ════════════════════════════════════════
```

- [ ] **Step 2: Add a temporary init call to test rendering**

Directly after the `renderHome` function definition (and before the placeholder comment), add:
```js
renderHome();
```

- [ ] **Step 3: Verify home view renders**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

Expected:
- If localStorage is empty: shows empty state message "No scoops yet…"
- Stats row shows 0 / 0 / 0
- If you previously ran the console test in Task 4, the entry from that test appears in the list

- [ ] **Step 4: Remove the temporary `renderHome()` call** (it will be called properly in Task 7's init function)

Delete the standalone `renderHome();` line you added in Step 2. The placeholder comment should immediately follow the `renderHome` function definition.

- [ ] **Step 5: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add home view rendering and stats"
```

---

## Task 6: Log Form

**Files:**
- Modify: `index.html` — replace `// PLACEHOLDER: log form + view switching in Tasks 6–7`

- [ ] **Step 1: Replace the log form placeholder with form interaction and submit logic**

In `index.html`, find:
```js
// ════════════════════════════════════════
// PLACEHOLDER: log form + view switching in Tasks 6–7
// ════════════════════════════════════════
```

Replace with:
```js
// ════════════════════════════════════════
// RATING PICKER
// ════════════════════════════════════════

let selectedRating = 0;

function setRating(value) {
  selectedRating = value;
  document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.value) <= value);
  });
}

document.querySelectorAll('.rating-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = Number(btn.dataset.value);
    // tap same star again = clear rating
    setRating(v === selectedRating ? 0 : v);
  });
});

// ════════════════════════════════════════
// LOG FORM SUBMIT
// ════════════════════════════════════════

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
  // Reset form
  document.getElementById('log-form').reset();
  setRating(0);
  // Go to Home and refresh
  showView('home');
});

// ════════════════════════════════════════
// PLACEHOLDER: view switching + init in Task 7
// ════════════════════════════════════════
```

- [ ] **Step 2: Verify rating picker in browser**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

Click the Log tab (does nothing yet — view switching comes in Task 7). In the console, run:
```js
document.getElementById('view-log').classList.add('active');
document.getElementById('view-home').classList.remove('active');
```

Then tap the 🍨 icons. Expected: tapping 3rd icon lights up first 3 icons, tapping it again clears all.

- [ ] **Step 3: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add log form, rating picker, and submit handler"
```

---

## Task 7: View Switching + Init

**Files:**
- Modify: `index.html` — replace `// PLACEHOLDER: view switching + init in Task 7`, add service worker registration

- [ ] **Step 1: Replace the view switching placeholder with final wiring**

In `index.html`, find:
```js
// ════════════════════════════════════════
// PLACEHOLDER: view switching + init in Task 7
// ════════════════════════════════════════
```

Replace with:
```js
// ════════════════════════════════════════
// VIEW SWITCHING
// ════════════════════════════════════════

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelector(`.tab-btn[data-view="${name}"]`).classList.add('active');
  if (name === 'home') renderHome();
  // Scroll back to top when switching views
  document.getElementById('view-' + name).scrollTop = 0;
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// ════════════════════════════════════════
// SERVICE WORKER REGISTRATION
// ════════════════════════════════════════

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sundae-run-web/sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════

renderHome();
```

- [ ] **Step 2: Full local test in browser**

```bash
open /Users/jacoble/Downloads/sundae-run-web/index.html
```

Run through this checklist manually:

```
✅ Home view loads by default showing "Sundae Run 🍨" header
✅ Stats row shows 0 / 0 / 0 on first load
✅ Empty state message visible in entry list
✅ Tapping "➕ Log" tab switches to Log view
✅ Tapping "🏠 Home" tab switches back to Home view
✅ Active tab is highlighted (primary color)
✅ Rating picker: tap 3rd 🍨 → first 3 light up; tap 3rd again → all dim
✅ Submit with empty flavor → alert fires, no entry created
✅ Submit with "Chocolate Chip", shop "Cold Stone", rating 3 → returns to Home
✅ Home shows the new entry with chip, flavor, shop · Today, 3 🍨
✅ Stats update: scoops=1, flavors=1, shops=1
✅ Reload page → entry still appears (localStorage persisted)
✅ Log another entry with same flavor, different shop → flavors still 1, shops=2
```

- [ ] **Step 3: Commit**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git add index.html
git commit -m "feat: add view switching, service worker registration, and app init"
```

---

## Task 8: GitHub Pages Deployment

- [ ] **Step 1: Create repo on GitHub**

```bash
gh repo create sundae-run-web --public --description "Sundae Run ice cream tracker — PWA"
```

Expected: prints the new repo URL, e.g. `https://github.com/jle002121/sundae-run-web`

- [ ] **Step 2: Add remote and push**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git remote add origin https://github.com/jle002121/sundae-run-web.git
git branch -M main
git push -u origin main
```

Expected: all commits pushed, `main` branch tracking remote

- [ ] **Step 3: Enable GitHub Pages**

```bash
gh api repos/jle002121/sundae-run-web/pages \
  --method POST \
  -f source[branch]=main \
  -f source[path]=/
```

Expected: JSON response with `"url": "https://jle002121.github.io/sundae-run-web/"`

- [ ] **Step 4: Wait for deployment (~60 seconds)**

```bash
sleep 60
gh api repos/jle002121/sundae-run-web/pages --jq '.status'
```

Expected: `"built"` — if still `"building"`, wait another 30 seconds and retry.

- [ ] **Step 5: Verify live URL in browser**

```bash
open https://jle002121.github.io/sundae-run-web/
```

Expected: App loads. Run through the same checklist from Task 7 Step 2.

- [ ] **Step 6: Install on iPhone**

On your iPhone:
1. Open Safari → `https://jle002121.github.io/sundae-run-web/`
2. Tap the Share button (box with arrow pointing up)
3. Scroll down → tap "Add to Home Screen"
4. Tap "Add"
5. Find the purple "Sundae Run" icon on your home screen
6. Tap it — app opens in standalone mode (no browser chrome)

Verify:
```
✅ App opens fullscreen with no browser URL bar
✅ Log an entry → appears in history
✅ Close app, reopen → entry still there
✅ Enable airplane mode → app still loads (offline via service worker)
```

- [ ] **Step 7: Final commit with status update**

```bash
cd /Users/jacoble/Downloads/sundae-run-web
git commit --allow-empty -m "chore: MVP complete — live at https://jle002121.github.io/sundae-run-web/"
```

---

## Success Criteria (from spec)

```
✅ App loads at https://jle002121.github.io/sundae-run-web/
✅ User can log an entry (flavor required, all others optional)
✅ Entry appears in history list on Home view immediately after logging
✅ Stats row counts update correctly after each log
✅ Entries persist after closing and reopening Safari
✅ App is installable on iPhone via Safari → Add to Home Screen
✅ App loads and works with no internet connection (offline via service worker)
```
