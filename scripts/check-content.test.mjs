import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent } from './check-content.mjs';

const review = {
  name: "Chef's Döner & Pizza", preis: '7.50', menge: '500',
  geschmack: 7, präsentation: 7, 'übereinstimmung bestellung': 10,
  service: '-', ambiente: 7, layering: 7, zeit: 7, fleisch: 7, brot: 7,
  gemüse: 7, sauce: 7, gesamt: 7.2, datum: '18.10.2026', mapsUrl: '',
  besonderheiten: { positiv: ['Netter Service'], negativ: [], neutral: [] },
};
const stories = new Map([[`${review.name}.md`, 'Our review.']]);
const check = (shops, photos = []) => validateContent(JSON.stringify(shops), stories, photos);

test('accepts a complete review, special characters, unknown scores, and optional photos', () => {
  assert.deepEqual(check([review], [`${review.name}_1.jpg`, `${review.name}_2.jpg`]), []);
  assert.deepEqual(check([review]), []);
  assert.deepEqual(check([{ name: 'Coming soon' }]), []);
});

test('rejects malformed JSON, duplicate keys, and duplicate names', () => {
  assert.match(validateContent('[{"name":"A",}]', stories, [])[0], /invalid JSON/);
  assert.match(validateContent('[{"name":"A","name":"B"}]', stories, []).join(), /duplicate field/);
  assert.match(check([review, { name: review.name.toUpperCase() }]).join(), /duplicate restaurant/);
});

test('requires numeric scores and catches field typos, invalid dates, and non-embed maps', () => {
  for (const change of [{ gesamt: '7.2' }, { gesamt: 11 }, { geschmack: null }, { datum: '31.02.2026' }, { mapsUrl: 'https://maps.app.goo.gl/example' }, { geschmak: 7 }]) {
    assert.ok(check([{ ...review, ...change }]).length, JSON.stringify(change));
  }
  assert.deepEqual(check([{ ...review, datum: '29.02.2024' }]), []);
});

test('requires complete rated entries and correctly named, nonempty stories', () => {
  assert.match(check([{ ...review, preis: undefined }]).join(), /preis field/);
  assert.match(validateContent(JSON.stringify([review]), new Map([[`${review.name.toLowerCase()}.md`, 'Review']]), []).join(), /missing public\/stories/);
  assert.match(validateContent(JSON.stringify([review]), new Map([[`${review.name}.md`, ' ']]), []).join(), /empty/);
});

test('rejects photo gaps, leading zeros, wrong extensions, and photos beyond the limit', () => {
  for (const suffixes of [['_2.jpg'], ['_1.jpg', '_3.jpg'], ['_01.jpg'], ['_1.png'], ['_1.JPG'], Array.from({ length: 21 }, (_, i) => `_${i + 1}.jpg`)]) {
    assert.ok(check([review], suffixes.map(suffix => review.name + suffix)).length, suffixes.join());
  }
});

test('allows JSON punctuation inside text without reporting duplicate keys', () => {
  assert.deepEqual(check([{ name: 'Pending {place}', subtitle: 'Say "hello": [one, two] {three}' }]), []);
});

test('validates status and rejects a second entry with the same display name', () => {
  assert.deepEqual(check([{ ...review, status: 'reviewed' }]), []);
  assert.deepEqual(check([{ ...review, status: 'closed' }]), []);
  assert.deepEqual(check([{ name: 'Pending', status: 'pending' }]), []);
  assert.deepEqual(check([{ name: 'Closed before review', status: 'closed' }]), []);
  assert.match(check([{ ...review, status: 'pending' }]).join(), /cannot be "pending"/);
  assert.match(check([{ name: 'Pending', status: 'reviewed' }]).join(), /needs a numeric gesamt/);
  assert.match(check([{ ...review, status: 'open' }]).join(), /status must be/);
  assert.match(check([{ name: 'Pending' }, { name: 'Pending (demnächst)' }]).join(), /duplicate display name/);
});

test('accepts explicit zero time and service scores while preserving the other score ranges', () => {
  assert.deepEqual(check([{ ...review, zeit: 0 }]), []);
  assert.deepEqual(check([{ ...review, service: 0 }]), []);
  assert.match(check([{ ...review, zeit: -1 }]).join(), /zeit must be a number from 0 to 10/);
  assert.match(check([{ ...review, service: -1 }]).join(), /service must be a number from 0 to 10/);
  assert.match(check([{ ...review, geschmack: 0 }]).join(), /geschmack must be a number from 1 to 10/);
  assert.match(check([{ ...review, gesamt: 0 }]).join(), /gesamt must be a number from 1 to 10/);
});
