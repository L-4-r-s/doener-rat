const names = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

export function getStatus(shop) {
  if (shop.status) return shop.status;
  if (/\(geschlossen\)$/i.test(shop.name)) return 'closed';
  return typeof shop.gesamt === 'number' ? 'reviewed' : 'pending';
}

export function getDisplayName(shop) {
  return shop.name.replace(/\s*\((geschlossen|demnächst)\)$/i, '');
}

export function getStatusLabel(shop) {
  return { reviewed: 'Bewertet', pending: 'Demnächst', closed: 'Geschlossen' }[getStatus(shop)];
}

export function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^\d+(\.\d+)?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function visitDate(shop) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(shop.datum || '');
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const timestamp = Date.parse(`${iso}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== iso) return null;
  return { iso, label: shop.datum, timestamp };
}

export function compareShops(a, b, key = 'gesamt', order = 'desc') {
  // Historical reviews remain available, but closed restaurants stay at the bottom.
  const closed = Number(getStatus(a) === 'closed') - Number(getStatus(b) === 'closed');
  if (closed) return closed;
  if (key === 'name') {
    return names.compare(getDisplayName(a), getDisplayName(b)) * (order === 'asc' ? 1 : -1);
  }
  const left = key === 'datum' ? visitDate(a)?.timestamp ?? null : numericValue(a[key]);
  const right = key === 'datum' ? visitDate(b)?.timestamp ?? null : numericValue(b[key]);
  if (left === null && right !== null) return 1;
  if (right === null && left !== null) return -1;
  const difference = left === null ? 0 : (left - right) * (order === 'asc' ? 1 : -1);
  return difference || names.compare(getDisplayName(a), getDisplayName(b));
}

export function officialRanks(shops) {
  const ranked = shops.filter(shop => getStatus(shop) === 'reviewed' && typeof shop.gesamt === 'number')
    .toSorted((a, b) => compareShops(a, b));
  const result = new Map();
  let rank = 0;
  ranked.forEach((shop, index) => {
    if (index === 0 || shop.gesamt !== ranked[index - 1].gesamt) rank = index + 1;
    result.set(shop.name, rank);
  });
  return result;
}

export function selectShops(shops, { query = '', status = 'all', key = 'gesamt', order = 'desc' } = {}) {
  const search = query.trim().toLocaleLowerCase('de');
  return shops.filter(shop => (status === 'all' || getStatus(shop) === status)
    && getDisplayName(shop).toLocaleLowerCase('de').includes(search))
    .toSorted((a, b) => compareShops(a, b, key, order));
}
