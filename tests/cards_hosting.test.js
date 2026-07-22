// 8ball / tests / cards_hosting.test.js
// Pins the /cards hosted-JPEG set to the shared IG + Threads safe shape.
//
// The IG + Threads auto-drip pipelines fetch card images by PUBLIC URL
// (https://the-eight-ball.netlify.app/cards/{code}.jpg). This asserts that
// every catalog code shipped in cards/manifest.json has a matching cards/
// file that is a valid JPEG, exactly 1080x1350 (4:5), and <= 8 MB — the shape
// that stays inside Threads' width limit and Instagram's supported portrait
// aspect ratio. It also fails on any stray cards/*.jpg not in the manifest, so
// the hosted set can't silently drift from what build_card_jpegs.py produced.
//
// EXPECTED_CODES below is the canonical queue superset in queue order (byte-
// matches reach/ig_pipeline/queue.txt, the source of the URLs both pipelines
// build). It is pinned here so a manifest that swaps in an off-queue code —
// which would 404 when the scheduler fetches {base}/{code}.jpg — fails CI
// instead of passing on a bare count check. Update protocol: a queue change
// regenerates cards/ via scripts/build_card_jpegs.py AND updates this list in
// the same PR, visibly (the content_shape / repo_shape pin discipline).
//
// Dependency-free: JPEG dimensions and markers are read straight from the
// segment stream (DOCTRINE §5 — no new runtime or test deps).

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cardsDir = join(__dirname, '..', 'cards');

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const MAX_BYTES = 8 * 1024 * 1024;

// Canonical queue superset, in queue order. See header for the update protocol.
const EXPECTED_CODES = Object.freeze([
  't00_the-fool', 'spec_no-v', 'spec_no-cxii', 'spec_no-xxxi', 'spec_no-cxxxii',
  'spec_no-lxi', 'spec_no-xxxii', 'spec_no-lxxxii', 'spec_no-xlv', 'e1_wood',
  's01_aries', 'aa01_rat-x-ox', 'a01_rat', 'n01_number-1', 't01_the-magician',
  'ss01_aries-x-taurus', 'e2_fire', 's02_taurus', 'a02_ox', 'aa02_rat-x-rabbit',
  'n02_number-2', 't02_the-high-priestess', 'ss02_aries-x-gemini', 'e3_earth',
  's03_gemini', 'aa03_rat-x-dragon', 'a03_tiger', 'n03_number-3',
  'ss03_aries-x-cancer', 't03_the-empress', 'e4_metal', 'aa04_rat-x-horse',
  's04_cancer', 'a04_rabbit', 'n04_number-4', 'ss04_aries-x-leo',
  't04_the-emperor', 'e5_water', 'aa05_rat-x-goat', 's05_leo', 'a05_dragon',
  'n05_number-5', 'ss05_aries-x-virgo', 't05_the-hierophant', 's06_virgo',
  'aa06_rat-x-monkey', 'a06_snake', 'n06_number-6', 'ss06_aries-x-libra',
  't06_the-lovers', 's07_libra', 'a07_horse', 'n07_number-7', 'aa07_ox-x-snake',
  't07_the-chariot', 's08_scorpio', 'ss07_aries-x-scorpio', 'a08_goat',
  'n08_number-8', 't08_strength', 'aa08_ox-x-horse', 's09_sagittarius',
  'a09_monkey', 'ss08_aries-x-sagittarius', 'n09_number-9', 't09_the-hermit',
  'aa09_ox-x-goat', 's10_capricorn', 'a10_rooster', 'ss09_aries-x-capricorn',
  'n11_number-11', 't10_wheel-of-fortune', 's11_aquarius', 'aa10_ox-x-rooster',
  'a11_dog', 'n22_number-22', 't11_justice', 'ss10_aries-x-aquarius',
  's12_pisces', 'a12_pig', 'aa11_ox-x-dog', 'n33_number-33',
  't12_the-hanged-man', 't13_death', 'ss11_aries-x-pisces', 't14_temperance',
  't15_the-devil', 'aa12_tiger-x-snake', 't16_the-tower', 't17_the-star',
  'ss12_taurus-x-gemini', 't18_the-moon', 't19_the-sun', 'aa13_tiger-x-horse',
  't20_judgement', 't21_the-world', 'ss13_taurus-x-cancer',
]);

const manifest = JSON.parse(
  readFileSync(join(cardsDir, 'manifest.json'), 'utf-8'),
);

// Parse a JPEG buffer's segment stream. Returns { width, height } from the
// first Start-Of-Frame, plus structural facts used to reject files that carry
// a plausible SOF header but are not a complete, metadata-free JPEG:
//   - hasSOS: a Start-Of-Scan (0xFFDA) segment is present
//   - endsWithEOI: the stream terminates with End-Of-Image (0xFFD9)
//   - appMarkers: the set of APPn markers seen (0xE0..0xEF) + COM (0xFE)
// Returns null if the byte stream is not a walkable JPEG.
function parseJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null; // SOI
  let off = 2;
  let dim = null;
  let hasSOS = false;
  const appMarkers = new Set();
  while (off + 1 < buf.length) {
    if (buf[off] !== 0xff) return null;
    let marker = buf[off + 1];
    // Skip fill bytes.
    while (marker === 0xff && off + 1 < buf.length) {
      off += 1;
      marker = buf[off + 1];
    }
    if (marker === 0xda) {
      hasSOS = true; // SOS — entropy-coded scan data follows; stop segment walk.
      break;
    }
    if (off + 3 >= buf.length) return null;
    const len = buf.readUInt16BE(off + 2);
    if (len < 2 || off + 2 + len > buf.length) return null;
    if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
      appMarkers.add(marker);
    }
    const isSOF =
      marker >= 0xc0 && marker <= 0xcf &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc; // not DHT/JPG/DAC
    if (isSOF && dim === null) {
      dim = { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
    }
    off += 2 + len;
  }
  const endsWithEOI = buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9;
  return { dim, hasSOS, endsWithEOI, appMarkers };
}

describe('cards hosting — shared IG + Threads safe shape', () => {
  it('manifest is exactly the canonical queue superset, in order', () => {
    const codes = manifest.cards.map((c) => c.code);
    expect(manifest.count).toBe(codes.length);
    expect(codes).toEqual([...EXPECTED_CODES]); // ordered, exact — no off-queue swaps
    expect(new Set(codes).size).toBe(97);
  });

  it('every manifest code is a complete, metadata-free 1080x1350 JPEG <= 8 MB', () => {
    const bad = [];
    for (const { code, bytes } of manifest.cards) {
      const file = join(cardsDir, `${code}.jpg`);
      let buf;
      try {
        buf = readFileSync(file);
      } catch {
        bad.push(`${code}: missing file`);
        continue;
      }
      // Byte-parity with the manifest the build recorded (catches any
      // post-build tamper / re-save that the dimension check would miss).
      const onDisk = statSync(file).size;
      if (onDisk !== bytes) bad.push(`${code}: ${onDisk} bytes != manifest ${bytes}`);
      if (buf.length > MAX_BYTES) bad.push(`${code}: ${buf.length} bytes > 8 MB`);

      const j = parseJpeg(buf);
      if (!j || !j.dim) {
        bad.push(`${code}: not a parseable JPEG`);
        continue;
      }
      if (!j.hasSOS || !j.endsWithEOI) {
        bad.push(`${code}: truncated/incomplete JPEG (SOS=${j.hasSOS} EOI=${j.endsWithEOI})`);
      }
      if (j.dim.width !== CANVAS_W || j.dim.height !== CANVAS_H) {
        bad.push(`${code}: ${j.dim.width}x${j.dim.height} != ${CANVAS_W}x${CANVAS_H}`);
      }
      // Reproducible bytes require stripped metadata: reject EXIF (APP1),
      // ICC (APP2), and comment (COM) markers. APP0 (JFIF, 0xE0) is expected.
      for (const m of [0xe1, 0xe2, 0xfe]) {
        if (j.appMarkers.has(m)) {
          bad.push(`${code}: carries metadata marker 0x${m.toString(16)} (EXIF/ICC/COM not stripped)`);
        }
      }
    }
    expect(bad, `non-conforming cards:\n${bad.join('\n')}`).toEqual([]);
  });

  it('no stray cards/*.jpg outside the manifest', () => {
    const onDisk = readdirSync(cardsDir)
      .filter((f) => f.endsWith('.jpg'))
      .sort();
    const claimed = manifest.cards.map((c) => `${c.code}.jpg`).sort();
    expect(onDisk).toEqual(claimed);
  });
});
