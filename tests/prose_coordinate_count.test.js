// 8ball / tests / prose_coordinate_count.test.js
//
// Guards surface-copy drift when the coordinate surface changes (the
// v0.5.0/v0.5.2 L: prose counts drift on coordinate changes — pin meta
// description, about modal, og/twitter tags). v0.6.0: the free surface
// is defined by the TIER_COORDS render constant in ui/tiers.js
// (DOCTRINE §1 v0.36 / §1.D), so the expected counts are DERIVED from
// it — free coordinates = TIER_COORDS.free rows + the catalog numeral.
// The DOM row structure itself is pinned by labels_reveal.test.js and
// the per-tier gating by tiers.test.js; this file pins the prose.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIER_COORDS } from '../ui/tiers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

// The free card's coordinate count per the §1.D locked table: the free
// rows (arcana / sun / animal / life path) plus the catalog numeral, which
// renders from the card corner rather than a coordinate row.
// §1.D v0.38: life path joined the free surface (DOB-derived split).
const FREE_COORDINATE_COUNT = TIER_COORDS.free.length + 1;

// Coordinates the about-modal must name on the free surface…
const FREE_COORDINATE_NAMES = [
  'tarot birth card',
  'sun sign',
  'public animal',
  'life path',
  'catalog numeral',
];
// …and across the paid rungs (DOCTRINE §1.D ladder, cumulative).
const LADDER_COORDINATE_NAMES = [
  'rising sign',
  'five-element',
  'private animal',
  'name number',
  'soul urge',
  'personality',
  'birthday',
  'maturity',
  'day pillar',
  'hour pillar',
];

const COUNT_WORDS = { 4: 'four', 5: 'five' };

function countWord(n) {
  const word = COUNT_WORDS[n];
  if (!word) throw new Error(`missing count word for ${n}`);
  return word;
}

function renderedCoordinateTitles() {
  const titles = [];
  const re = /<div class="coord-title"(?:\s+id="[^"]+")?>([^<]+)<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    titles.push(m[1].trim());
  }
  return titles;
}

function shareSymbolRefCount() {
  const m = html.match(/symbols:\s*\[([^\]]+)\]/);
  if (!m) throw new Error('initShareUI symbols array not found');
  return m[1].split(',').map(s => s.trim()).filter(Boolean).length;
}

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

describe('prose coordinate-count copy (v0.6.0 free surface)', () => {
  it('meta descriptions claim the free-surface count derived from TIER_COORDS', () => {
    const expected = `${countWord(FREE_COORDINATE_COUNT)} calibrated coordinates`;
    for (const text of [
      metaContent('description'),
      propertyContent('og:description'),
      metaContent('twitter:description'),
    ]) {
      expect(text.toLowerCase()).toContain(expected);
      // The free card is the demo; the rungs are the disclosed offer.
      expect(text.toLowerCase()).toContain('free');
      expect(text.toLowerCase()).toContain('paid rungs');
    }
  });

  it('about-modal free count matches TIER_COORDS and names every free coordinate', () => {
    const text = aboutText().toLowerCase();
    expect(text).toContain(`files ${countWord(FREE_COORDINATE_COUNT)} coordinates`);
    for (const coordinate of FREE_COORDINATE_NAMES) {
      expect(text, `about copy should name ${coordinate}`).toContain(coordinate);
    }
  });

  it('about-modal names every ladder coordinate across the three rungs', () => {
    const text = aboutText().toLowerCase();
    for (const coordinate of LADDER_COORDINATE_NAMES) {
      expect(text, `about copy should name ${coordinate}`).toContain(coordinate);
    }
  });

  it('the free row count stays coupled to the TIER_COORDS map', () => {
    // Belt-and-suspenders against a markup/tier-map split: the §1.D free
    // list names exactly the rows the prose count is derived from.
    expect(TIER_COORDS.free).toEqual(['arcana', 'sun', 'animal', 'lifePath']);
    expect(FREE_COORDINATE_COUNT).toBe(5);
  });

  it('share export refs stay coupled to rendered coordinate rows', () => {
    expect(shareSymbolRefCount()).toBe(renderedCoordinateTitles().length);
  });
});
