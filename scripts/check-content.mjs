import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getDisplayName, getStatus } from '../public/js/ranking.js';

const ratings = ['geschmack', 'präsentation', 'übereinstimmung bestellung', 'service', 'ambiente', 'layering', 'zeit', 'fleisch', 'brot', 'gemüse', 'sauce', 'gesamt'];
const fields = new Set(['name', 'status', 'preis', 'menge', ...ratings, 'besonderheiten', 'subtitle', 'kommentar', 'datum', 'mapsUrl']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const absent = value => value === undefined || value === '-';

export function validateContent(source, stories, images) {
  const errors = [];
  let shops;
  try { shops = JSON.parse(source); }
  catch (error) { return [`doener.json: invalid JSON. ${error.message}`]; }

  // JSON.parse silently keeps the last duplicate property. Catch that mistake too.
  const stack = [];
  for (const match of source.matchAll(/"(?:[^"\\]|\\.)*"|[{}\[\]:,]/g)) {
    const token = match[0];
    const current = stack.at(-1);
    if (token === '{') stack.push({ keys: new Set(), key: true });
    else if (token === '[') stack.push({});
    else if (token === '}' || token === ']') stack.pop();
    else if (token === ',' && current?.keys) current.key = true;
    else if (token === ':' && current?.keys) current.key = false;
    else if (token.startsWith('"') && current?.key) {
      const key = JSON.parse(token);
      if (current.keys.has(key)) errors.push(`doener.json: duplicate field "${key}" near line ${source.slice(0, match.index).split('\n').length}.`);
      current.keys.add(key);
    }
  }

  if (!Array.isArray(shops)) return [...errors, 'doener.json must contain a JSON array: [ ... ].'];
  const names = new Set();
  const displayNames = new Set();
  shops.forEach((shop, index) => {
    const label = `Entry ${index + 1}${typeof shop?.name === 'string' ? ` (${shop.name})` : ''}`;
    const fail = message => errors.push(`${label}: ${message}`);
    if (!object(shop)) { fail('must be an object: { ... }.'); return; }
    if (typeof shop.name !== 'string' || !shop.name.trim()) { fail('name must be nonempty text.'); return; }
    if (shop.name !== shop.name.trim()) fail('remove spaces at the beginning/end of name.');
    if (/[<>:"/\\|?*\u0000-\u001f]/u.test(shop.name)) fail('name contains characters that cannot safely be used in filenames.');
    const identity = shop.name.normalize('NFC').toLowerCase();
    if (names.has(identity)) fail('duplicate restaurant name (including differences in capitalization).');
    names.add(identity);
    const displayIdentity = getDisplayName(shop).normalize('NFC').toLowerCase();
    if (displayNames.has(displayIdentity)) fail('duplicate display name; update the existing restaurant instead of adding another status-suffixed entry.');
    displayNames.add(displayIdentity);
    if (shop.status !== undefined && !['reviewed', 'pending', 'closed'].includes(shop.status)) fail('status must be "reviewed", "pending", or "closed".');
    if (getStatus(shop) === 'reviewed' && typeof shop.gesamt !== 'number') fail('status "reviewed" needs a numeric gesamt score.');
    if (getStatus(shop) === 'pending' && typeof shop.gesamt === 'number') fail('a scored restaurant cannot be "pending"; set status to "reviewed" or "closed".');

    for (const key of Object.keys(shop)) if (!fields.has(key)) fail(`unknown field "${key}"; check its spelling against the guide.`);
    for (const key of ratings) {
      const value = shop[key];
      const minimum = ['zeit', 'service'].includes(key) ? 0 : 1;
      if (!absent(value) && (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > 10)) {
        fail(`${key} must be a number from ${minimum} to 10 without quotes, or "-" when unknown.`);
      }
    }
    for (const key of ['preis', 'menge']) {
      const value = shop[key];
      if (!absent(value) && !(typeof value === 'number' && Number.isFinite(value) && value > 0) && !(typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) && Number(value) > 0)) {
        fail(`${key} must be positive, using a decimal point and no currency/unit (for example "7.50" or "500").`);
      }
    }
    for (const key of ['subtitle', 'kommentar', 'datum', 'mapsUrl']) {
      if (shop[key] !== undefined && typeof shop[key] !== 'string') fail(`${key} must be text in double quotes.`);
    }
    if (typeof shop.datum === 'string' && shop.datum) {
      const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(shop.datum);
      const date = match && new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
      if (!match || date.getUTCFullYear() !== Number(match[3]) || date.getUTCMonth() + 1 !== Number(match[2]) || date.getUTCDate() !== Number(match[1])) {
        fail('datum must be a real date in DD.MM.YYYY format, for example "18.10.2026".');
      }
    }
    if (typeof shop.mapsUrl === 'string' && shop.mapsUrl) {
      try {
        const url = new URL(shop.mapsUrl);
        if (url.protocol !== 'https:' || url.hostname !== 'www.google.com' || !url.pathname.startsWith('/maps/embed')) throw Error();
      } catch { fail('mapsUrl must be a Google Maps embed URL, or "" to omit the map.'); }
    }
    if (shop.besonderheiten !== undefined) {
      if (!object(shop.besonderheiten)) fail('besonderheiten must be an object with positiv, negativ, and neutral arrays.');
      else {
        for (const key of Object.keys(shop.besonderheiten)) if (!['positiv', 'negativ', 'neutral'].includes(key)) fail(`unknown besonderheiten category "${key}".`);
        for (const key of ['positiv', 'negativ', 'neutral']) {
          const value = shop.besonderheiten[key];
          if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) fail(`besonderheiten.${key} must be an array of nonempty text; use [] if empty.`);
        }
      }
    }

    if (typeof shop.gesamt === 'number') {
      for (const key of ['preis', 'menge', ...ratings]) if (shop[key] === undefined) fail(`reviewed restaurants need the ${key} field (use "-" if not measured).`);
      if (!shop.datum) fail('reviewed restaurants need a visit date in datum.');
      const story = stories.get(`${shop.name}.md`);
      if (story === undefined) fail(`missing public/stories/${shop.name}.md (case and spelling must match exactly).`);
      else if (!story.trim()) fail('review file is empty.');
    }

    const numbers = [];
    for (const filename of images) {
      if (!filename.startsWith(`${shop.name}_`)) continue;
      const suffix = filename.slice(shop.name.length + 1);
      if (!/^\d+\.[^.]+$/.test(suffix)) continue;
      if (!/^[1-9]\d*\.jpg$/.test(suffix)) { fail(`photo "${filename}" must use _1.jpg, _2.jpg, etc. (lowercase .jpg, no leading zeros).`); continue; }
      numbers.push(Number(suffix.split('.')[0]));
    }
    numbers.sort((a, b) => a - b);
    if (numbers.some((number, index) => number !== index + 1)) fail('photo numbering must start at 1 and have no gaps; the carousel stops at the first missing photo.');
    if (numbers.some(number => number > 20)) fail('the carousel supports at most 20 numbered photos.');
  });
  return errors;
}

const root = fileURLToPath(new URL('../', import.meta.url));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const source = readFileSync(path.join(root, 'public/data/doener.json'), 'utf8');
    const storyDir = path.join(root, 'public/stories');
    const stories = new Map(readdirSync(storyDir).filter(name => name.endsWith('.md')).map(name => [name, readFileSync(path.join(storyDir, name), 'utf8')]));
    const errors = validateContent(source, stories, readdirSync(path.join(root, 'public/images')));
    if (errors.length) {
      console.error(`Content check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n\n${errors.map(error => `- ${error}`).join('\n')}\n\nSee docs/REVIEWS.md for instructions.`);
      process.exitCode = 1;
    } else console.log(`Content check passed: ${JSON.parse(source).length} restaurants. JSON, scores, review filenames, and photo numbering are valid.`);
  } catch (error) {
    console.error(`Content check could not read the files: ${error.message}`);
    process.exitCode = 1;
  }
}
