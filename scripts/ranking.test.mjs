import test from 'node:test';
import assert from 'node:assert/strict';
import { compareShops, getDisplayName, getStatus, numericValue, officialRanks, selectShops, visitDate } from '../public/js/ranking.js';

const shops = [
  { name: 'A', status: 'reviewed', gesamt: 8, preis: '10', menge: '1000', datum: '01.02.2026' },
  { name: 'B', status: 'reviewed', gesamt: 7, preis: '9.50', menge: '950', datum: '31.12.2025' },
  { name: 'C', status: 'reviewed', gesamt: 7, preis: 8, menge: 500 },
  { name: 'D', status: 'reviewed', gesamt: 6, preis: '-', menge: '-' },
  { name: 'Coming soon (demnächst)', status: 'pending' },
  { name: 'Closed (geschlossen)', status: 'closed', gesamt: 10, preis: '1' },
];

test('ranks the full active reviewed list, with shared ranks for ties', () => {
  const ranks = officialRanks(shops);
  assert.deepEqual([...ranks], [['A', 1], ['B', 2], ['C', 2], ['D', 4]]);
  const found = selectShops(shops, { query: 'B', key: 'preis', order: 'asc' });
  assert.equal(found.length, 1);
  assert.equal(ranks.get(found[0].name), 2);
  assert.equal(ranks.has('Closed (geschlossen)'), false);
  assert.equal(ranks.has('Coming soon (demnächst)'), false);
});

test('sorts numeric strings and numbers together, keeping missing values and closed shops last', () => {
  assert.deepEqual(selectShops(shops, { key: 'preis', order: 'asc' }).map(s => s.name), ['C', 'B', 'A', 'Coming soon (demnächst)', 'D', 'Closed (geschlossen)']);
  assert.deepEqual(selectShops(shops, { key: 'preis', order: 'desc' }).slice(0, 3).map(s => s.name), ['A', 'B', 'C']);
  assert.deepEqual(selectShops(shops, { key: 'menge', order: 'asc' }).slice(0, 3).map(s => s.name), ['C', 'B', 'A']);
  assert.equal(compareShops({ name: 'A' }, { name: 'B' }, 'preis', 'desc'), -1);
  for (const value of [undefined, null, '', ' ', '-', '7,50', 'EUR 7', Infinity]) assert.equal(numericValue(value), null);
  assert.equal(numericValue('10.50'), 10.5);
});

test('combines search and status filters and never mutates the source list', () => {
  const snapshot = structuredClone(shops);
  assert.equal(selectShops(shops, { status: 'reviewed' }).length, 4);
  assert.equal(selectShops(shops, { query: ' coming ', status: 'pending' }).length, 1);
  assert.equal(selectShops(shops, { query: 'Coming', status: 'closed' }).length, 0);
  assert.equal(selectShops(shops, { status: 'closed' })[0].name, 'Closed (geschlossen)');
  assert.deepEqual(shops, snapshot);
});

test('shows clean labels while preserving names and honoring explicit status changes', () => {
  assert.equal(getDisplayName(shops[4]), 'Coming soon');
  assert.equal(getDisplayName(shops[5]), 'Closed');
  assert.equal(getStatus({ name: 'Old (geschlossen)', gesamt: 8 }), 'closed');
  assert.equal(getStatus({ name: 'Old (geschlossen)', status: 'reviewed', gesamt: 8 }), 'reviewed');
  assert.equal(getStatus({ name: 'New' }), 'pending');
  assert.equal(shops[5].name, 'Closed (geschlossen)');
});

test('sorts visit dates chronologically and returns timezone-independent markup values', () => {
  assert.equal(selectShops(shops, { key: 'datum', order: 'desc' })[0].name, 'A');
  assert.equal(selectShops(shops, { key: 'datum', order: 'asc' })[0].name, 'B');
  assert.deepEqual(visitDate({ datum: '29.02.2024' }), { iso: '2024-02-29', label: '29.02.2024', timestamp: Date.parse('2024-02-29T00:00:00Z') });
  assert.equal(visitDate({ datum: '31.02.2026' }), null);
  assert.equal(visitDate({}), null);
});

test('zero time scores remain numeric and sort ahead of missing values', () => {
  const entries = [{ name: 'Missing', status: 'reviewed' }, { name: 'Zero', status: 'reviewed', zeit: 0 }, { name: 'Nine', status: 'reviewed', zeit: 9 }];
  assert.equal(numericValue(0), 0);
  assert.deepEqual(selectShops(entries, { key: 'zeit', order: 'asc' }).map(s => s.name), ['Zero', 'Nine', 'Missing']);
  assert.deepEqual(selectShops(entries, { key: 'zeit', order: 'desc' }).map(s => s.name), ['Nine', 'Zero', 'Missing']);
});
