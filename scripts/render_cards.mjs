#!/usr/bin/env node
// 8ball / scripts / render_cards.mjs — the in-repo renderer for the two
// card artifacts that DEPICT THE SHEET: the /cards specimen JPEGs
// (spec_no-* and spec_extended_*) and assets/og-image.png.
//
// WHY THIS EXISTS (journal 2026-09-03). Through v0.74 both artifacts were
// rendered OFF-REPO — the specimen PNGs in the operator's asset vault, the
// og image by a vault tool — so every change to the sheet (v0.72 system
// groups, v0.73 MOON row, v0.74 titles-only labels) left them stale with no
// way to regenerate from here. This script derives everything from the
// repo's own registries, so the artifacts can never drift from the sheet
// again:
//
//   · row order, titles and groups come from ui/tiers.js SHEET_GROUPS and
//     ui/sheet.js ROW_TITLES (the same registry the host sheet, the dyad
//     sheets and the §5.D share PNG derive from);
//   · every value comes from core/profile.js buildProfile through
//     ui/tiers.js cellRenderState — the one mapping the app renders with;
//   · the og card art is ui/share.js buildCardSVGFromSnapshot — the share
//     PNG's own builder, so the unfurl shows exactly what a share shows.
//
// SPECIMENS ARE SYNTHETIC (§11). A specimen code names a CATALOG POSITION
// (`spec_no-xxxi` = catalog card 31) or an ARCANA + YEAR
// (`spec_extended_hierophant-1965`), never a person. The profile behind
// each card is derived DETERMINISTICALLY from the code — a seeded search
// for a date of birth that lands on that catalog position (or that birth
// card in that year), a seeded synthetic name built from syllables, a
// seeded birth time and a seeded city from assets/cities.json — so the
// same code always renders the same card, and no card is anchored to a
// real person. The name never appears on the card. The values on a
// specimen changed when this renderer replaced the vault renders (the
// vault's synthetic profiles were never in this repo); the code, the
// catalog position and the arcana/year each card advertises did not.
//
// OUTPUT SHAPE is the pipeline's contract, unchanged and pinned by
// tests/cards_hosting.test.js: exactly 1080x1350 JPEG, q90, <= 8 MB, no
// EXIF / ICC / COM segments (Chromium writes an ICC APP2; it is stripped
// here). The og image is 1200x630 PNG and fully achromatic
// (tests/monochrome_assets.test.js).
//
// DRIVER. Chromium renders the HTML. playwright-core is NOT a dependency of
// this repo (§7 stage 4 caps devDependencies; CLAUDE.md: the driver lives
// in a scratch directory, never in package.json). Point --driver at a
// directory whose node_modules carries playwright-core, and CHROME (or the
// PLAYWRIGHT_BROWSERS_PATH glob) at a Chromium binary:
//
//   mkdir -p /tmp/lf && cd /tmp/lf && npm i playwright-core
//   node scripts/render_cards.mjs --specimens --driver /tmp/lf
//   node scripts/render_cards.mjs --og --driver /tmp/lf
//   node scripts/render_cards.mjs --specimens --only spec_no-v,spec_no-xxxi --driver /tmp/lf
//
// The pure parts (code parsing, profile derivation, snapshots, the HTML
// templates, the JPEG stripper) are exported and tested without a browser
// in tests/render_cards.test.js. The concordance and index card families
// do not depict the sheet and stay with scripts/build_card_jpegs.py.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { deflateSync, inflateSync } from 'node:zlib';
import { buildProfile, getSunSign, getAnimal } from '../core/profile.js';
import { getBirthCard } from '../core/birthcard.js';
import { getCard } from '../core/engine.js';
import { SHEET_GROUPS, cellRenderState } from '../ui/tiers.js';
import { ROW_TITLES } from '../ui/sheet.js';
import { buildCardSVGFromSnapshot } from '../ui/share.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'the-eight-ball.netlify.app';
export const CANVAS = Object.freeze({ w: 1080, h: 1350 });
export const OG = Object.freeze({ w: 1200, h: 630 });
export const JPEG_QUALITY = 90;

// ── codes ────────────────────────────────────────────────────────────
const ROMAN = { m: 1000, d: 500, c: 100, l: 50, x: 10, v: 5, i: 1 };
export function fromRoman(s) {
  if (!/^[mdclxvi]+$/.test(s)) return null;
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN[s[i]], next = ROMAN[s[i + 1]] || 0;
    total += v < next ? -v : v;
  }
  return total;
}

/** `spec_no-<roman>` → {kind:'catalog', n}; `spec_extended_<slug>-<year>` →
 *  {kind:'extended', arcana, year}; anything else (the external
 *  spec_archive_* codes, the concordance/index families) → null. */
export function parseCode(code) {
  let m = /^spec_no-([mdclxvi]+)$/.exec(code);
  if (m) {
    const n = fromRoman(m[1]);
    return n >= 1 && n <= 144 ? { kind: 'catalog', n } : null;
  }
  m = /^spec_extended_([a-z-]+)-(\d{4})$/.exec(code);
  if (m) return { kind: 'extended', arcana: m[1], year: Number(m[2]) };
  return null;
}

// ── deterministic synthesis ──────────────────────────────────────────
// mulberry32 over an FNV-1a hash of the code: tiny, dependency-free, and
// stable across Node versions (integer math only).
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Catalog order (core/engine.js): sun rows aries..pisces, animal columns
// rat..pig; card n = sunIdx*12 + animalIdx + 1. Restated here only to
// INVERT it; the forward direction is verified against getCard below.
const SUN_ORDER = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const ANIMAL_ORDER = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

const YEARS = Array.from({ length: 56 }, (_, i) => 1950 + i); // 1950..2005
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function shuffled(list, rnd) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** A date of birth on catalog card n (sun + animal), seeded. */
function dobForCatalog(n, rnd) {
  const sun = SUN_ORDER[Math.floor((n - 1) / 12)];
  const animal = ANIMAL_ORDER[(n - 1) % 12];
  for (const y of shuffled(YEARS, rnd)) {
    const days = [];
    for (let m = 1; m <= 12; m++) for (let d = 1; d <= daysIn(y, m); d++) days.push([m, d]);
    for (const [m, d] of shuffled(days, rnd)) {
      if (getSunSign(m, d) === sun && getAnimal(y, m, d) === animal) return iso(y, m, d);
    }
  }
  throw new Error(`no date lands on catalog ${n}`);
}

const slugOf = name => name.replace(/^the /, '').replace(/\s+/g, '-');
/** A date of birth in `year` whose birth card is `arcana` (slug), seeded. */
function dobForExtended(arcana, year, rnd) {
  const days = [];
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= daysIn(year, m); d++) days.push([m, d]);
  for (const [m, d] of shuffled(days, rnd)) {
    if (slugOf(getBirthCard(year, m, d).name) === arcana) return iso(year, m, d);
  }
  throw new Error(`no ${year} date has birth card ${arcana}`);
}

// Synthetic names: two words from syllables — pronounceable, carrying
// vowels and consonants so every name-derived number resolves, and drawn
// from no list of real names (§11). Never rendered on a card.
const ONSETS = ['t', 'r', 'n', 'l', 'm', 'v', 'k', 's', 'd', 'b', 'f', 'h'];
const NUCLEI = ['a', 'e', 'i', 'o', 'u', 'ae', 'ia', 'io'];
const CODAS = ['', 'n', 'r', 'l', 's', 'th', 'm'];
function syllable(rnd) {
  return ONSETS[Math.floor(rnd() * ONSETS.length)] + NUCLEI[Math.floor(rnd() * NUCLEI.length)] + CODAS[Math.floor(rnd() * CODAS.length)];
}
function word(rnd) {
  const n = 1 + Math.floor(rnd() * 2);
  let w = '';
  for (let i = 0; i < n; i++) w += syllable(rnd);
  return w[0].toUpperCase() + w.slice(1);
}
export function syntheticName(rnd) { return `${word(rnd)} ${word(rnd)}`; }

let _cities = null;
export function loadCities() {
  if (_cities) return _cities;
  const raw = JSON.parse(readFileSync(join(ROOT, 'assets', 'cities.json'), 'utf-8'));
  // the 1500 most populous cities at |lat| <= 60 (rising resolves; every
  // timezone is a real IANA zone), in their stored (population) order
  _cities = raw.cities
    .filter(c => Math.abs(c[2]) <= 60)
    .slice(0, 1500)
    .map(c => ({ city: c[0], cc: c[1], lat: c[2], lng: c[3], tz: raw.tz[c[4]] }));
  return _cities;
}

/** The deterministic synthetic profile inputs behind a specimen code. */
export function specimenInputsFor(code, cities = loadCities()) {
  const parsed = parseCode(code);
  if (!parsed) return null;
  const rnd = seededRandom(hash32(code));
  const dob = parsed.kind === 'catalog'
    ? dobForCatalog(parsed.n, rnd)
    : dobForExtended(parsed.arcana, parsed.year, rnd);
  const name = syntheticName(rnd);
  const hour = Math.floor(rnd() * 24);
  const minute = Math.floor(rnd() * 12) * 5;
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const c = cities[Math.floor(rnd() * cities.length)];
  return { code, name, dob, time, city: c.city, cc: c.cc, tz: c.tz, lat: c.lat, lng: c.lng };
}

export function profileFor(inputs) {
  return buildProfile(inputs.name, inputs.dob, { time: inputs.time, tz: inputs.tz, lat: inputs.lat, lng: inputs.lng });
}

// ── the sheet snapshot (registry-driven, every cell open) ────────────
function rowTitleFor(lead, profile) {
  if (lead === 'sun') return profile.risingSign ? 'SUN ↑ RISING' : 'SUN · RISING';
  if (lead === 'animal') return 'PUBLIC ⇌ PRIVATE';
  return ROW_TITLES[lead];
}
export function snapshotFor(profile) {
  const groups = SHEET_GROUPS.map(g => ({
    key: g.key,
    title: g.title,
    rows: g.rows.map(keys => ({
      title: rowTitleFor(keys[0], profile),
      cells: keys.map(k => {
        const { state, text } = cellRenderState(profile, k, true);
        return { state: state === 'value' ? 'open' : 'unres', value: state === 'value' ? text : '—' };
      }),
    })),
  }));
  return { catalog: `no. ${getCard(profile).catalog}`, groups, sections: groups.flatMap(g => g.rows) };
}

// ── templates ────────────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONO = "'DejaVu Sans Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/** The paper specimen card, 1080x1350 — the hosted /cards shape. */
export function specimenHtml(snapshot) {
  const groups = snapshot.groups.map(g =>
    `<div class="group"><div class="group-title"><span>${esc(g.title)}</span></div>` +
    g.rows.map(r =>
      `<div class="row"><div class="row-title">${esc(r.title)}</div><div class="cells">` +
      r.cells.map(c => `<div class="cell${c.state === 'unres' ? ' unres' : ''}">${esc(c.value)}</div>`).join('') +
      `</div></div>`).join('') +
    `</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#ebe5d4;width:${CANVAS.w}px;height:${CANVAS.h}px;overflow:hidden}
body{font-family:${MONO};color:#151515}
.card{position:absolute;left:135px;top:45px;width:810px;height:1260px;box-sizing:border-box;border:2px solid #4a4a44;background:#ebe5d4}
.head{position:absolute;left:40px;right:40px;top:40px;display:flex;justify-content:space-between;align-items:baseline}
.mark{font-size:46px;font-weight:700;letter-spacing:0.06em}
.no{font-size:28px;letter-spacing:0.14em;color:#3a3a36}
.stack{position:absolute;left:40px;right:40px;top:150px;bottom:150px;display:flex;flex-direction:column;justify-content:space-evenly}
.group-title{display:flex;align-items:center;gap:18px;font-size:19px;letter-spacing:0.28em;color:#6a675f;text-transform:uppercase;margin:0 0 4px}
.group-title::before,.group-title::after{content:"";flex:1;height:1px;background:#8d8a80}
.row{margin:10px 0 12px}
.row-title{text-align:center;font-size:20px;letter-spacing:0.18em;color:#5a5852;text-transform:uppercase}
.cells{display:flex;justify-content:space-evenly;align-items:baseline;margin-top:4px}
.cell{font-size:38px;font-weight:700;letter-spacing:0.02em;white-space:nowrap}
.cell.unres{color:#7a7870;font-weight:400}
.foot{position:absolute;left:0;right:0;bottom:56px;text-align:center;font-size:26px;letter-spacing:0.06em;color:#3a3a36}
</style></head><body><div class="card">
<div class="head"><div class="mark">8ball</div><div class="no">${esc(snapshot.catalog)}</div></div>
<div class="stack">${groups}</div>
<div class="foot">${SITE}</div>
</div></body></html>`;
}

export const OG_COPY = Object.freeze({
  title: '8 ball',
  sub: 'a magic 8-ball that knows you',
  lines: [
    'name + birth data in. one fixed identity sheet out —',
    'tarot, western astrology, chinese zodiac, numerology.',
    'the complete sheet, free. stored only on your device.',
  ],
});

/** The 1200x630 social card: the share PNG's own card art beside the wordmark. */
export function ogHtml(snapshot) {
  const svg = buildCardSVGFromSnapshot({ catalog: snapshot.catalog, sections: snapshot.sections });
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#000;width:${OG.w}px;height:${OG.h}px;overflow:hidden}
body{font-family:${MONO};color:#fff;position:relative}
.art{position:absolute;left:90px;top:45px;width:360px;height:540px}
.art svg{width:360px;height:540px;display:block}
.text{position:absolute;left:510px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:0}
.title{font-size:96px;font-weight:700;letter-spacing:0.08em;line-height:1;margin-bottom:34px}
.sub{font-size:30px;color:#b8b8b8;margin-bottom:30px}
.line{font-size:19px;line-height:1.75;color:#8f8f8f}
.url{font-size:22px;color:#fff;margin-top:34px;letter-spacing:0.02em}
</style></head><body>
<div class="art">${svg}</div>
<div class="text"><div class="title">${esc(OG_COPY.title)}</div><div class="sub">${esc(OG_COPY.sub)}</div>
${OG_COPY.lines.map(l => `<div class="line">${esc(l)}</div>`).join('')}
<div class="url">${SITE}</div></div>
</body></html>`;
}

// ── JPEG metadata stripper (dependency-free) ─────────────────────────
// Chromium's JPEG encoder writes JFIF (APP0) and an ICC profile (APP2).
// The pipeline contract forbids APP1 (EXIF), APP2 (ICC) and COM; walk the
// segments before SOS and drop those, byte-exact otherwise.
export function stripJpegMetadata(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG');
  const parts = [buf.subarray(0, 2)];
  let off = 2;
  while (off + 4 <= buf.length) {
    if (buf[off] !== 0xff) throw new Error(`bad marker at ${off}`);
    const marker = buf[off + 1];
    if (marker === 0xda) { parts.push(buf.subarray(off)); return Buffer.concat(parts); } // SOS → rest verbatim
    const len = buf.readUInt16BE(off + 2);
    const seg = buf.subarray(off, off + 2 + len);
    if (!(marker === 0xe1 || marker === 0xe2 || marker === 0xfe)) parts.push(seg);
    off += 2 + len;
  }
  throw new Error('no SOS segment');
}

// ── achromatic PNG pass (dependency-free) ────────────────────────────
// tests/monochrome_assets.test.js proves every brand PNG has r == g == b at
// EVERY pixel. Chromium's subpixel (LCD) text antialiasing tints glyph
// edges even on a gray page, so the og render is forced achromatic here:
// decode (8-bit, non-interlaced, RGB/RGBA — what Chromium emits), collapse
// each pixel to its luma, re-encode with filter 0. Launching with
// --disable-lcd-text (below) removes most of it; this pass guarantees it.
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
export function toAchromaticPng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error('not a PNG');
  let off = 8, width, height, colorType, bitDepth, interlace;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0 || !(colorType === 2 || colorType === 6)) throw new Error('unsupported PNG (need 8-bit non-interlaced RGB/RGBA)');
  const ch = colorType === 6 ? 4 : 3, stride = width * ch;
  const raw = inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(height * stride);
  let r = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[r++], row = y * stride, prev = row - stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[r++], a = x >= ch ? px[row + x - ch] : 0, b = y > 0 ? px[prev + x] : 0, c = y > 0 && x >= ch ? px[prev + x - ch] : 0;
      px[row + x] = (f === 0 ? v : f === 1 ? v + a : f === 2 ? v + b : f === 3 ? v + ((a + b) >> 1) : v + paeth(a, b, c)) & 0xff;
    }
  }
  // collapse to luma (Rec. 601), keep alpha, emit filter-0 scanlines as RGB
  const out = Buffer.alloc(height * (1 + width * 3));
  let o = 0;
  for (let y = 0; y < height; y++) {
    out[o++] = 0;
    for (let x = 0; x < width; x++) {
      const i = y * stride + x * ch;
      const l = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
      out[o++] = l; out[o++] = l; out[o++] = l;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([PNG_SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(out, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ── driver ───────────────────────────────────────────────────────────
function arg(name, dflt) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
async function launch(driverDir) {
  const req = createRequire(join(driverDir, 'package.json'));
  const { chromium } = req('playwright-core');
  let exe = process.env.CHROME;
  if (!exe) {
    const { globSync } = await import('node:fs');
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
    exe = globSync(join(base, 'chromium-*', 'chrome-linux', 'chrome'))[0];
  }
  return chromium.launch({ executablePath: exe, args: ['--disable-lcd-text', '--font-render-hinting=none'] });
}

async function renderSpecimens(browser, only) {
  const manifestPath = join(ROOT, 'cards', 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const codes = manifest.cards.map(c => c.code).filter(c => parseCode(c) && (!only || only.includes(c)));
  const page = await browser.newPage({ viewport: { width: CANVAS.w, height: CANVAS.h }, deviceScaleFactor: 1 });
  let n = 0;
  for (const code of codes) {
    const inputs = specimenInputsFor(code);
    const snapshot = snapshotFor(profileFor(inputs));
    await page.setContent(specimenHtml(snapshot), { waitUntil: 'load' });
    const raw = await page.screenshot({ type: 'jpeg', quality: JPEG_QUALITY });
    const jpg = stripJpegMetadata(raw);
    writeFileSync(join(ROOT, 'cards', `${code}.jpg`), jpg);
    const entry = manifest.cards.find(c => c.code === code);
    entry.source = 'scripts/render_cards.mjs';
    entry.bytes = jpg.length;
    n++;
    if (n % 50 === 0) console.log(`  ${n}/${codes.length}`);
  }
  await page.close();
  manifest.note = 'Generated by scripts/build_card_jpegs.py (concordance + index families, from the vault PNG sources) and scripts/render_cards.mjs (the spec_no-* / spec_extended_* specimen sheets, derived deterministically from each code and the repo registries — journal 2026-09-03). The tracked export set is the union of all four reach queues in queue order. \'external\' assets are hosted off-site and deliberately not rendered here. Every local file is 1080x1350 JPEG, q90, metadata stripped.';
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`rendered ${n} specimen JPEGs`);
}

async function renderOg(browser) {
  // the same specimen the unfurl has always shown: catalog card xxxi
  const snapshot = snapshotFor(profileFor(specimenInputsFor('spec_no-xxxi')));
  const page = await browser.newPage({ viewport: { width: OG.w, height: OG.h }, deviceScaleFactor: 1 });
  await page.setContent(ogHtml(snapshot), { waitUntil: 'load' });
  const png = toAchromaticPng(await page.screenshot({ type: 'png' }));
  writeFileSync(join(ROOT, 'assets', 'og-image.png'), png);
  await page.close();
  console.log(`wrote assets/og-image.png (${png.length} bytes)`);
}

async function main() {
  const driver = arg('--driver', process.env.CARD_DRIVER);
  if (!driver || !existsSync(join(driver, 'node_modules', 'playwright-core'))) {
    console.error('need --driver <dir with node_modules/playwright-core> (see header)');
    return 2;
  }
  const only = arg('--only', '') ? arg('--only').split(',') : null;
  const browser = await launch(driver);
  try {
    if (process.argv.includes('--specimens')) await renderSpecimens(browser, only);
    if (process.argv.includes('--og')) await renderOg(browser);
    if (!process.argv.includes('--specimens') && !process.argv.includes('--og')) {
      console.error('nothing to do: pass --specimens and/or --og'); return 2;
    }
  } finally { await browser.close(); }
  return 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().then(code => process.exit(code), err => { console.error(err); process.exit(1); });
}
