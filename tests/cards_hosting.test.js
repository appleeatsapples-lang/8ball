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
// Dependency-free: JPEG dimensions are read straight from the SOFn marker
// (DOCTRINE §5 — no new runtime or test deps).

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cardsDir = join(__dirname, '..', 'cards');

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const MAX_BYTES = 8 * 1024 * 1024;

const manifest = JSON.parse(
  readFileSync(join(cardsDir, 'manifest.json'), 'utf-8'),
);

// Read width/height from a JPEG buffer by walking segment markers to the first
// Start-Of-Frame (SOF0..SOFF, excluding DHT/JPG/DAC). Returns null if the byte
// stream is not a JPEG we can parse.
function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null; // SOI
  let off = 2;
  while (off + 3 < buf.length) {
    if (buf[off] !== 0xff) return null;
    let marker = buf[off + 1];
    // Skip fill bytes.
    while (marker === 0xff && off + 1 < buf.length) {
      off += 1;
      marker = buf[off + 1];
    }
    const len = buf.readUInt16BE(off + 2);
    // SOF markers carry frame dimensions; exclude non-SOF 0xC_ markers.
    const isSOF =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 && // DHT
      marker !== 0xc8 && // JPG
      marker !== 0xcc; // DAC
    if (isSOF) {
      const height = buf.readUInt16BE(off + 5);
      const width = buf.readUInt16BE(off + 7);
      return { width, height };
    }
    off += 2 + len;
  }
  return null;
}

describe('cards hosting — shared IG + Threads safe shape', () => {
  it('manifest carries the full queue superset (97 unique codes)', () => {
    const codes = manifest.cards.map((c) => c.code);
    expect(manifest.count).toBe(codes.length);
    expect(codes).toHaveLength(97);
    expect(new Set(codes).size).toBe(97);
  });

  it('every manifest code has a valid 1080x1350 JPEG <= 8 MB', () => {
    const bad = [];
    for (const { code } of manifest.cards) {
      const file = join(cardsDir, `${code}.jpg`);
      let buf;
      try {
        buf = readFileSync(file);
      } catch {
        bad.push(`${code}: missing file`);
        continue;
      }
      if (buf.length > MAX_BYTES) {
        bad.push(`${code}: ${buf.length} bytes > 8 MB`);
      }
      const dim = jpegSize(buf);
      if (!dim) {
        bad.push(`${code}: not a parseable JPEG`);
      } else if (dim.width !== CANVAS_W || dim.height !== CANVAS_H) {
        bad.push(`${code}: ${dim.width}x${dim.height} != ${CANVAS_W}x${CANVAS_H}`);
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
