import { getDisplayName, getStatus, getStatusLabel, numericValue, officialRanks, selectShops, visitDate } from './ranking.js';

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const columns = [
  ['preis', 'Preis', ''], ['geschmack', 'Geschmack', ''],
  ['präsentation', 'Präsentation', 'hide-tier-0'],
  ['übereinstimmung bestellung', 'Bestellung', 'hide-tier-1 allow-wrap'],
  ['menge', 'Menge', 'hide-tier-3'], ['service', 'Service', 'hide-tier-3'],
  ['ambiente', 'Ambiente', 'hide-tier-2'], ['layering', 'Layering', 'hide-tier-1'],
  ['zeit', 'Zeit', 'hide-tier-3'], ['fleisch', 'Fleisch', 'hide-tier-4'],
  ['brot', 'Brot', 'hide-tier-4'], ['gemüse', 'Gemüse', 'hide-tier-4'],
  ['sauce', 'Sauce', 'hide-tier-4'], ['gesamt', 'Gesamt', 'font-semibold md:text-base'],
];

function cell(label, value, classes = '') {
  const td = document.createElement('td');
  td.className = `p-2 ${classes}`;
  td.dataset.label = label;
  td.textContent = value;
  return td;
}

function restaurantRow(shop, rank) {
  const row = document.createElement('tr');
  const status = getStatus(shop);
  row.className = 'border-b md:border-b-0';
  row.dataset.restaurant = shop.name;
  if (status === 'closed') row.classList.add('bg-gray-200/40');
  if (rank) row.classList.add(`rank-${rank}`);
  row.append(cell('Platz', rank ?? '–', 'font-semibold'));

  const nameCell = cell('Name', '', 'font-medium allow-wrap');
  const info = document.createElement('div');
  info.className = 'restaurant-name';
  const name = document.createElement(typeof shop.gesamt === 'number' ? 'a' : 'span');
  name.textContent = getDisplayName(shop);
  if (name.tagName === 'A') {
    name.href = `laden.html?name=${encodeURIComponent(shop.name)}`;
    name.className = 'text-blue-600 hover:underline';
  }
  const medal = { 1: '🏆', 2: '🥈', 3: '🥉' }[rank];
  if (medal) {
    const badge = document.createElement('span');
    badge.className = 'top-badge ml-2';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = medal;
    name.append(badge);
  }
  info.append(name);
  if (rank) {
    const position = document.createElement('span');
    position.className = 'text-xs text-gray-600 md:hidden';
    position.textContent = `Platz ${rank}`;
    info.append(position);
  }
  const badge = document.createElement('span');
  badge.className = `restaurant-status status-${status}`;
  badge.textContent = getStatusLabel(shop);
  info.append(badge);
  const date = visitDate(shop);
  if (date) {
    const time = document.createElement('time');
    time.className = 'text-xs font-normal text-gray-600';
    time.dateTime = date.iso;
    time.textContent = `Besucht am ${date.label}`;
    info.append(time);
  }
  nameCell.append(info);
  row.append(nameCell);
  for (const [key, label, classes] of columns) {
    let value = shop[key] ?? '–';
    if (key === 'preis') value = numericValue(shop.preis) === null ? '–' : euro.format(numericValue(shop.preis));
    if (key === 'gesamt') value = typeof shop.gesamt === 'number' ? shop.gesamt.toFixed(1) : '–';
    row.append(cell(label, value, classes));
  }
  return row;
}

// Filtering and sorting never change the ranks derived from the complete dataset.
document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('ranking-body');
  const search = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const sortSelect = document.getElementById('sort-select');
  const thead = document.querySelector('thead');
  const count = document.getElementById('results-count');
  const empty = document.getElementById('no-results');
  const toggle = document.getElementById('toggle-details-btn');
  const container = document.getElementById('doener-table-container');
  let shops = [];
  let ranks = new Map();
  let sort = { key: 'gesamt', order: 'desc' };

  function syncSortControls() {
    document.getElementById('column-sort-option')?.remove();
    const value = `${sort.key}-${sort.order}`;
    if (![...sortSelect.options].some(option => option.value === value)) {
      const title = thead.querySelector(`th[data-sort="${sort.key}"]`)?.textContent.trim().replace(/\s+/g, ' ') || sort.key;
      const option = new Option(`${title}: ${sort.order === 'asc' ? 'aufsteigend' : 'absteigend'}`, value);
      option.id = 'column-sort-option';
      sortSelect.add(option);
    }
    sortSelect.value = value;
    for (const header of thead.querySelectorAll('th[data-sort]')) {
      const active = header.dataset.sort === sort.key;
      header.setAttribute('aria-sort', active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none');
      header.querySelector('.sort-indicator').className = `sort-indicator${active ? ` ${sort.order}` : ''}`;
    }
  }

  function render() {
    const filtered = selectShops(shops, { query: search.value, status: statusFilter.value, ...sort });
    tbody.replaceChildren(...filtered.map(shop => restaurantRow(shop, ranks.get(shop.name))));
    count.textContent = `${filtered.length} von ${shops.length} Restaurants`;
    empty.hidden = filtered.length > 0;
    syncSortControls();
  }

  search.addEventListener('input', render);
  statusFilter.addEventListener('change', render);
  sortSelect.addEventListener('change', () => {
    const separator = sortSelect.value.lastIndexOf('-');
    sort = { key: sortSelect.value.slice(0, separator), order: sortSelect.value.slice(separator + 1) };
    render();
  });
  function sortColumn(event) {
    const header = event.target.closest('th[data-sort]');
    if (!header) return;
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    if (event.type === 'keydown') event.preventDefault();
    const key = header.dataset.sort;
    sort = { key, order: key === sort.key ? (sort.order === 'asc' ? 'desc' : 'asc') : (['name', 'preis'].includes(key) ? 'asc' : 'desc') };
    render();
  }
  for (const header of thead.querySelectorAll('th[data-sort]')) header.tabIndex = 0;
  thead.addEventListener('click', sortColumn);
  thead.addEventListener('keydown', sortColumn);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'doener-table-container');
  toggle.addEventListener('click', () => {
    const hidden = container.classList.toggle('details-hidden');
    toggle.textContent = hidden ? 'Details anzeigen' : 'Details ausblenden';
    toggle.setAttribute('aria-expanded', String(!hidden));
  });

  count.textContent = 'Restaurants werden geladen …';
  try {
    const response = await fetch('data/doener.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    shops = await response.json();
    ranks = officialRanks(shops);
    render();
  } catch (error) {
    console.error('Daten konnten nicht geladen werden:', error);
    count.textContent = '';
    empty.textContent = 'Daten konnten nicht geladen werden. Bitte lade die Seite erneut.';
    empty.hidden = false;
  }
});

// === NEU: INFO MODAL LOGIK (KATEGORIEN ERKLÄRT) ===
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const infoModalContent = document.getElementById('info-modal-content');
const closeInfoModalIcons =[
  document.getElementById('close-info-modal'),
  document.getElementById('close-info-modal-btn')
];

// Funktion zum Ein-/Ausblenden des Info-Modals mit geschmeidiger Animation
function toggleInfoModal(show) {
  if (!infoModal) return;

  if (show) {
    infoModal.classList.remove('hidden');
    // Winziger Timeout, damit die CSS-Transition (Fade & Scale) greifen kann
    setTimeout(() => {
      infoModal.classList.remove('opacity-0');
      infoModalContent.classList.remove('scale-95');
    }, 10);
  } else {
    infoModal.classList.add('opacity-0');
    infoModalContent.classList.add('scale-95');
    // Warten bis die Ausblend-Animation (300ms) fertig ist, dann aus dem DOM verstecken
    setTimeout(() => {
      infoModal.classList.add('hidden');
    }, 300);
  }
}

// Event Listener an die Buttons binden
if (infoBtn) {
  infoBtn.addEventListener('click', () => toggleInfoModal(true));
}

// Schließen-Buttons aktivieren
closeInfoModalIcons.forEach(btn => {
  if (btn) btn.addEventListener('click', () => toggleInfoModal(false));
});

// Modal schließen, wenn man außerhalb (auf den grauen Hintergrund) klickt
window.addEventListener("click", (e) => {
  if (e.target === infoModal) toggleInfoModal(false);
});
