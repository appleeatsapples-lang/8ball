// 8ball / tests / monochrome_assets.test.js
//
// Pixel-level proof that the shipped binary brand assets (favicons, apple
// touch icon, OG image) are actually achromatic — not just a claim in the
// journal. A minimal from-scratch PNG decoder (signature + IHDR + IDAT
// inflate + per-scanline unfilter, node:zlib only, no new dependency)
// because these are exactly the files a future regen could silently
// re-tint without any text-based scan ever catching it.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetPath = (...p) => join(__dirname, '..', 'assets', ...p);

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

// Decodes a non-interlaced 8-bit PNG (color type 2 RGB or 6 RGBA — the only
// types Chrome's --screenshot ever emits) into { width, height, channels, pixels }.
function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error('not a PNG');
  let offset = 8;
  let width, height, bitDepth, colorType;
  const idatChunks = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
      const interlace = data.readUInt8(12);
      if (interlace !== 0) throw new Error('interlaced PNG not supported');
      if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} not supported`);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 8 + len + 4; // length + type + data + crc
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`color type ${colorType} not supported`);
  const raw = inflateSync(Buffer.concat(idatChunks));
  const bpp = channels; // bytes per pixel at 8-bit depth
  const stride = width * bpp;
  const pixels = Buffer.alloc(height * stride);
  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[rawOffset++];
    const rowStart = y * stride;
    const prevRowStart = rowStart - stride;
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[rawOffset++];
      const a = x >= bpp ? pixels[rowStart + x - bpp] : 0;
      const b = y > 0 ? pixels[prevRowStart + x] : 0;
      const c = y > 0 && x >= bpp ? pixels[prevRowStart + x - bpp] : 0;
      let value;
      switch (filterType) {
        case 0: value = rawByte; break;
        case 1: value = (rawByte + a) & 0xff; break;
        case 2: value = (rawByte + b) & 0xff; break;
        case 3: value = (rawByte + Math.floor((a + b) / 2)) & 0xff; break;
        case 4: value = (rawByte + paeth(a, b, c)) & 0xff; break;
        default: throw new Error(`filter type ${filterType} not supported`);
      }
      pixels[rowStart + x] = value;
    }
  }
  return { width, height, channels, pixels };
}

function assertAchromatic(buf, label) {
  const { width, height, channels, pixels } = decodePng(buf);
  expect(channels, `${label}: expected RGB or RGBA`).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < width * height; i++) {
    const base = i * channels;
    const r = pixels[base], g = pixels[base + 1], b = pixels[base + 2];
    if (r !== g || g !== b) {
      throw new Error(`${label}: non-achromatic pixel at index ${i} — rgb(${r},${g},${b})`);
    }
  }
}

// Extracts each embedded PNG from a modern PNG-in-ICO container.
function* icoPngs(buf) {
  const count = buf.readUInt16LE(4);
  for (let i = 0; i < count; i++) {
    const off = 6 + i * 16;
    const size = buf.readUInt32BE(off + 8) === 0 ? 0 : buf.readUInt32LE(off + 8);
    const offset = buf.readUInt32LE(off + 12);
    yield buf.subarray(offset, offset + size);
  }
}

describe('monochrome brand assets — pixel-level achromatic proof', () => {
  it('favicon-16.png is fully achromatic', () => {
    assertAchromatic(readFileSync(assetPath('favicon-16.png')), 'favicon-16.png');
  });

  it('favicon-32.png is fully achromatic', () => {
    assertAchromatic(readFileSync(assetPath('favicon-32.png')), 'favicon-32.png');
  });

  it('apple-touch-icon-180.png is fully achromatic', () => {
    assertAchromatic(readFileSync(assetPath('apple-touch-icon-180.png')), 'apple-touch-icon-180.png');
  });

  it('og-image.png is fully achromatic', () => {
    assertAchromatic(readFileSync(assetPath('og-image.png')), 'og-image.png');
  });

  it('every PNG embedded in favicon.ico is fully achromatic', () => {
    const ico = readFileSync(assetPath('favicon.ico'));
    let checked = 0;
    for (const png of icoPngs(ico)) {
      assertAchromatic(png, 'favicon.ico (embedded PNG)');
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('og-image.png retains its 1200x630 social-card dimensions after regen', () => {
    const { width, height } = decodePng(readFileSync(assetPath('og-image.png')));
    expect(width).toBe(1200);
    expect(height).toBe(630);
  });
});
