const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const icon = fs.readFileSync(path.join(root, 'icon.png'));
const directorySource = fs.readFileSync(path.join(root, 'data', 'socal-ice-cream.js'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const paramsStart = html.indexOf('(', start);
  let paramsDepth = 0, brace = -1;
  for (let i = paramsStart; i < html.length; i++) {
    if (html[i] === '(') paramsDepth++;
    if (html[i] === ')' && --paramsDepth === 0) { brace = html.indexOf('{', i); break; }
  }
  assert.notEqual(brace, -1, `missing body for function ${name}`);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const flavorMatch = html.match(/const BUILTIN_FLAVORS = (\[[\s\S]*?\]);/);
assert.ok(flavorMatch, 'missing built-in flavor list');
const socalBoundsMatch = html.match(/const SOCAL_BOUNDS = (\{[^;]+\});/);
assert.ok(socalBoundsMatch, 'missing Southern California bounds');

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
  const SOCAL_BOUNDS = ${socalBoundsMatch[1]};
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
  ${extractFunction('getWrappedTopRatedFlavor')}
  ${extractFunction('getWrappedBiggestDay')}
  ${extractFunction('getWrappedVariety')}
  ${extractFunction('isValidBackup')}
  ${extractFunction('isInSouthernCalifornia')}
  ${extractFunction('normalizeShopSearchQuery')}
  globalThis.api = { computeDailyStreak, computeWeeklyStreak, computeMonthlyStreak,
    getTopFlavors, getWrappedTopFlavor, getWrappedTotalSpent,
    getWrappedLongestStreak, getWrappedBusiestMonth, getWrappedFavoriteShop,
    getWrappedTopRatedFlavor, getWrappedBiggestDay, getWrappedVariety,
    isValidBackup, isInSouthernCalifornia, normalizeShopSearchQuery };
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
  { date: '2026-01-01T12:00:00', flavor: 'Mango', shop: 'A', price: 4.5, rating: 5 },
  { date: '2026-01-02T12:00:00', flavor: 'vanilla', shop: 'B', price: null, rating: 4 },
  { date: '2026-01-03T12:00:00', flavor: 'Vanilla', shop: 'B', price: 5, rating: 4 },
];
assert.deepEqual({ ...api.getWrappedTopFlavor(wrapped) }, { name: 'Vanilla', count: 2 });
assert.equal(api.getWrappedTotalSpent(wrapped), 9.5);
assert.equal(api.getWrappedLongestStreak(wrapped), 3);
assert.equal(api.getWrappedBusiestMonth(wrapped).name, 'January');
assert.deepEqual({ ...api.getWrappedFavoriteShop(wrapped) }, { name: 'B', count: 2 });
assert.equal(api.getWrappedTopRatedFlavor(wrapped).name, 'Mango');
assert.deepEqual({ ...api.getWrappedBiggestDay([...wrapped, { ...wrapped[0], flavor: 'Chocolate' }]) }, { date: '2026-01-01', count: 2 });
assert.deepEqual({ ...api.getWrappedVariety(wrapped) }, { flavors: 2, shops: 2 });

const backupEntry = { id: 'entry-1', flavor: 'Vanilla', date: '2026-08-25T12:00:00.000Z' };
assert.equal(api.isValidBackup({ app: 'Sundae Run', version: 1, entries: [backupEntry], favoriteShops: ['The Scoop'] }), true,
  'valid local backup is accepted');
assert.equal(api.isValidBackup({ app: 'Sundae Run', version: 1, entries: [{ ...backupEntry, date: 'not-a-date' }], favoriteShops: [] }), false,
  'backup with invalid entry date is rejected');
assert.equal(api.isValidBackup({ app: 'Something Else', version: 1, entries: [], favoriteShops: [] }), false,
  'foreign JSON is rejected');
assert.equal(api.isInSouthernCalifornia({ lat: 32.7463, lng: -117.2515 }), true, 'Ocean Beach is inside the preferred map region');
assert.equal(api.isInSouthernCalifornia({ lat: 49.3, lng: 10.6 }), false, 'ambiguous overseas results are rejected');
assert.equal(api.normalizeShopSearchQuery('scoops ocean beach'), 'ice cream ocean beach San Diego California',
  'natural scoop query becomes a local ice-cream discovery search');
assert.equal(api.normalizeShopSearchQuery('gelato Encinitas'), 'gelato Encinitas San Diego California',
  'gelato searches receive local context');
assert.equal(api.normalizeShopSearchQuery('Salt & Straw San Diego'), 'Salt & Straw San Diego',
  'specific local business searches remain unchanged');

for (const id of ['input-flavor', 'input-edit-flavor', 'input-price', 'input-edit-price',
  'view-shops', 'shops-empty', 'view-wrapped']) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing required DOM id ${id}`);
}
assert.match(html, /const SB = null/, 'local-first release must not initialize an account backend');
assert.doesNotMatch(html, /supabase-js@/, 'local-first release must not load the Supabase client');
assert.doesNotMatch(html, /data-view=["']feed["']/, 'local-first navigation must not expose the social feed');
assert.doesNotMatch(html, /data-view=["']profile["']/, 'local-first navigation must not expose remote profiles');
assert.match(html, /Content-Security-Policy/, 'content security policy is missing');
assert.match(html, /if \(!window\.L\)/, 'Leaflet CDN fallback missing');
assert.match(html, /function buildBackup\(/, 'backup export is missing');
assert.match(html, /function isValidBackup\(/, 'backup validation is missing');
assert.match(html, /id=["']view-more["']/, 'install, privacy, and accessibility view is missing');
assert.match(html, /id=["']open-recap-btn["']/, 'year-round annual report entry point is missing');
assert.match(html, /Your superlatives/, 'annual report superlatives are missing');
assert.match(html, /const SOCAL_BOUNDS =/, 'Southern California search bounds are missing');
assert.match(html, /function isInSouthernCalifornia\(/, 'regional coordinate validation is missing');
assert.match(html, /function cacheShopLocation\(/, 'selected shop coordinates are not retained');
assert.match(html, /function normalizeShopSearchQuery\(/, 'natural-language shop search interpretation is missing');
assert.match(html, /function searchOfflineShops\(/, 'offline shop directory search is missing');
assert.match(html, /data\/socal-ice-cream\.js/, 'offline shop directory is not loaded');
assert.match(directorySource, /Scoops Ocean Beach/, 'offline directory is missing Scoops Ocean Beach');
assert.match(directorySource, /An's Electronics Repair/, 'offline directory is missing An’s Electronics Repair');
assert.match(sw, /sundae-v9/, 'service-worker cache version not bumped');
assert.match(sw, /data\/socal-ice-cream\.js/, 'offline shop directory is not precached');
assert.match(sw, /self\.skipWaiting\(\)/, 'new service worker does not activate promptly');
assert.match(sw, /self\.clients\.claim\(\)/, 'service worker does not claim clients');
assert.match(sw, /url\.origin !== self\.location\.origin/, 'service worker must not cache third-party or account API responses');

const directoryContext = vm.createContext({ window: {}, String, Math });
vm.runInContext(directorySource, directoryContext);
vm.runInContext(`
  const SOCAL_BOUNDS = ${socalBoundsMatch[1]};
  const SAN_DIEGO_CENTER = { lat: 32.7157, lng: -117.1611 };
  const userLocation = null;
  ${extractFunction('isInSouthernCalifornia')}
  ${extractFunction('normalizeSearchText')}
  ${extractFunction('searchOfflineShops')}
  globalThis.searchOfflineShops = searchOfflineShops;
`, directoryContext);
const scoopsResults = directoryContext.searchOfflineShops('scoops ocean beach');
assert.equal(scoopsResults[0].name, 'Scoops Ocean Beach',
  'natural local query should rank the intended Scoops shop first');

const localStore = new Map();
const localContext = vm.createContext({
  Date, Set, JSON,
  crypto: { randomUUID: () => 'fresh-phone-entry' },
  localStorage: {
    getItem: key => localStore.has(key) ? localStore.get(key) : null,
    setItem: (key, value) => localStore.set(key, String(value)),
  },
});
vm.runInContext(`
  const STORAGE_KEY = 'sundae_entries';
  ${extractFunction('loadLocalEntries')}
  ${extractFunction('saveLocalEntries')}
  ${extractFunction('addLocalEntry')}
  ${extractFunction('localDateStr')}
  ${extractFunction('computeDailyStreak')}
  globalThis.localApi = { loadLocalEntries, addLocalEntry, computeDailyStreak };
`, localContext);
assert.equal(localContext.localApi.loadLocalEntries().length, 0, 'fresh local launch starts with no entries');
localContext.localApi.addLocalEntry({
  flavor: 'Vanilla', shop: 'Scoops Ocean Beach', rating: 5, notes: '',
  date: new Date().toLocaleDateString('en-CA'), price: 5, photo_data: null,
});
const freshEntries = localContext.localApi.loadLocalEntries();
assert.equal(freshEntries.length, 1, 'fresh local launch persists a new scoop');
assert.equal(localContext.localApi.computeDailyStreak(freshEntries), 1, 'new scoop produces a one-day streak');

assert.equal(manifest.display, 'standalone', 'PWA must launch without browser chrome from the Home Screen');
assert.equal(manifest.start_url, '/sundae-run-web/', 'PWA start URL must match its hosted path');
assert.equal(manifest.icons[0].sizes, '512x512', 'PWA must advertise its 512px install icon');
assert.equal(icon.readUInt32BE(16), 512, 'install icon width must be 512px');
assert.equal(icon.readUInt32BE(20), 512, 'install icon height must be 512px');

console.log('Sundae Run regression checks passed.');
