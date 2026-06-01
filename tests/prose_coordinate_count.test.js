// 8ball / tests / prose_coordinate_count.test.js
//
// Guards surface-copy drift when free coordinates are added. The DOM
// structure is already pinned by labels_reveal.test.js; this pins the
// prose that claims "N coordinates" so meta/about copy cannot lag.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

const SURFACED_COORDINATES = [
  'tarot birth card',
  'sun',
  'five-element',
  'public animal',
  'private animal',
  'life path',
  'name number',
  'soul urge',
];
const OPTIONAL_COORDINATE = 'rising sign';
const COUNT_WORDS = {
  8: 'eight',
  9: 'ninth',
};

function metaContent(name) {
  const re = new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]+)"`);
  const m = html.match(re);
  if (!m) throw new Error(`meta ${name} not found`);
  return m[1];
}

function propertyContent(property) {
  const re = new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]+)"`);
  const m = html.match(re);
  if (!m) throw new Error(`meta property ${property} not found`);
  return m[1];
}

function aboutText() {
  const m = html.match(/id="about-modal"[\s\S]*?<p>([\s\S]*?)<\/p>/);
  if (!m) throw new Error('about-modal first paragraph not found');
  return m[1].replace(/\s+/g, ' ');
}

describe('prose coordinate-count copy', () => {
  it('meta descriptions claim the current free-surface count', () => {
    const expected = `${COUNT_WORDS[SURFACED_COORDINATES.length]} calibrated coordinates`;
    expect(metaContent('description').toLowerCase()).toContain('optional rising sign');
    for (const text of [
      metaContent('description'),
      propertyContent('og:description'),
      metaContent('twitter:description'),
    ]) {
      expect(text.toLowerCase()).toContain(expected);
    }
  });

  it('about-modal count matches the named coordinate list', () => {
    const text = aboutText().toLowerCase();
    expect(text).toContain(`calculates ${COUNT_WORDS[SURFACED_COORDINATES.length]} coordinates`);
    for (const coordinate of SURFACED_COORDINATES) {
      expect(text, `about copy should name ${coordinate}`).toContain(coordinate);
    }
  });

  it('about-modal optional rising count is exactly one more than the base count', () => {
    const text = aboutText().toLowerCase();
    expect(text).toContain(`a ${COUNT_WORDS[SURFACED_COORDINATES.length + 1]} — ${OPTIONAL_COORDINATE} — is added`);
    expect(SURFACED_COORDINATES.length + 1).toBe(9);
  });
});
