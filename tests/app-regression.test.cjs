const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const flavorMatch = html.match(/const BUILTIN_FLAVORS = (\[[\s\S]*?\]);/);
assert.ok(flavorMatch, 'missing built-in flavor list');

const context = vm.createContext({
  Date,
  Math,
  Set,
  Object,
  String,
  Number,
  Array,
  Intl,
});

vm.runInContext(`
  const BUILTIN_FLAVORS = ${flavorMatch[1]};
  const BUILTIN_FLAVOR_MAP = {};
  for (const f of BUILTIN_FLAVORS) BUILTIN_FLAVOR_MAP[f.toLowerCase()] = f;
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  ${extractFunction('localDateStr')}
  ${extractFunction('getWeekStart')}
  ${extractFunction('getMonthKey')}
  ${extractFunction('computeDailyStreak')}
  ${extractFunction('computeWeeklyStreak')}
  ${extractFunction('computeMonthlyStreak')}
  ${extractFunction('getTopFlavors')}
  ${extractFunction('getWrappedTopFlavor')}
  ${extractFunction('getWrappedTotalSpent')}
  ${extractFunction('getWrappedLongestStreak')}
  ${extractFunction('getWrappedBusiestMonth')}
  ${extractFunction('getWrappedFavoriteShop')}
  globalThis.api = { computeDailyStreak, computeWeeklyStreak, computeMonthlyStreak,
    getTopFlavors, getWrappedTopFlavor, getWrappedTotalSpent,
    getWrappedLongestStreak, getWrappedBusiestMonth, getWrappedFavoriteShop };
`, context);

const api = context.api;
const localNoon = d => {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + d);
  return value.toISOString();
};

assert.equal(api.computeDailyStreak([
  { date: localNoon(0) }, { date: localNoon(-1) }, { date: localNoon(-2) },
]), 3, 'daily streak counts consecutive local days');
assert.equal(api.computeDailyStreak([{ date: localNoon(-3) }]), 0, 'daily streak stops after a gap');

const today = new Date();
const weekEntries = [0, -7, -14].map(offset => {
  const d = new Date(today); d.setDate(d.getDate() + offset); return { date: d.toISOString() };
});
assert.equal(api.computeWeeklyStreak(weekEntries), 3, 'weekly streak counts Monday-based weeks');

const monthEntries = [0, 1, 2].map(offset => {
  const d = new Date(today.getFullYear(), today.getMonth() - offset, 15, 12);
  return { date: d.toISOString() };
});
assert.equal(api.computeMonthlyStreak(monthEntries), 3, 'monthly streak crosses month boundaries');

const flavors = api.getTopFlavors([
  { flavor: 'VANILLA' }, { flavor: 'Vanilla' }, { flavor: 'Mango' },
]);
assert.equal(JSON.stringify(flavors), JSON.stringify([['Vanilla', 2], ['Mango', 1]]), 'flavors canonicalize case');

const wrapped = [
  { date: '2026-01-01T12:00:00', flavor: 'Mango', shop: 'A', price: 4.5 },
  { date: '2026-01-02T12:00:00', flavor: 'vanilla', shop: 'B', price: null },
  { date: '2026-01-03T12:00:00', flavor: 'Vanilla', shop: 'B', price: 5 },
];
assert.deepEqual({ ...api.getWrappedTopFlavor(wrapped) }, { name: 'Vanilla', count: 2 });
assert.equal(api.getWrappedTotalSpent(wrapped), 9.5);
assert.equal(api.getWrappedLongestStreak(wrapped), 3);
assert.equal(api.getWrappedBusiestMonth(wrapped).name, 'January');
assert.deepEqual({ ...api.getWrappedFavoriteShop(wrapped) }, { name: 'B', count: 2 });

for (const id of ['input-flavor', 'input-edit-flavor', 'input-price', 'input-edit-price',
  'view-shops', 'shops-empty', 'view-wrapped']) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing required DOM id ${id}`);
}
assert.match(html, /const SB = window\.supabase\?\.createClient/, 'Supabase CDN fallback missing');
assert.match(html, /if \(!window\.L\)/, 'Leaflet CDN fallback missing');
assert.match(sw, /sundae-v4/, 'service-worker cache version not bumped');
assert.match(sw, /self\.skipWaiting\(\)/, 'new service worker does not activate promptly');
assert.match(sw, /self\.clients\.claim\(\)/, 'service worker does not claim clients');
assert.match(sw, /url\.origin !== self\.location\.origin/, 'service worker must not cache third-party or account API responses');

console.log('Sundae Run regression checks passed.');
