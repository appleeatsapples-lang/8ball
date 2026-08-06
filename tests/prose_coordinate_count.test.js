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
  'moon sign',
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
      // The free card is the demo; the sprint's single complete offer is
      // the disclosed price (§4.B v0.56 — supersedes the "paid rungs"
      // phrasing pinned here through v0.55).
      expect(text.toLowerCase()).toContain('free');
      expect(text).toContain('$3');
      expect(text.toLowerCase()).toContain('complete');
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


// ── the escaped-Unicode rendering pin ─────────────────────────────
//
// This document set has now shipped the SAME typographical defect three
// times: a sentence asserting the Unicode-escape bypass while rendering it
// WITHOUT its backslash, which turns the example into an ordinary property
// read that every guard catches — inverting the point being made. Addendum 6
// printed it bare; Addendum 8's erratum "corrected" it and printed it bare
// again; Addendum 10 declared the matter closed and printed it bare a third
// time, in the very table asserting who had got it right.
//
// The recurring cause is that the backslash does not survive the round trip
// from intent to bytes, and prose review cannot see a missing backslash.
// So it is pinned mechanically instead.
//
// THE RULE: in the tracked documents below, any line containing
// `profile.gend` must EITHER carry the real escape sequence, OR be on the
// allowlist of lines that deliberately render the ORDINARY read (quoting the
// historical error, or showing the unrelated spread repro).
//
// WHEN THIS FAILS: if you meant the escaped form, your backslash was eaten —
// write it so the file's BYTES contain one. If you meant the ordinary read,
// add the line verbatim below.
const BARE_GENDER_PROSE = {
  "DOCTRINE.md": [
    "cardName.textContent = profile.gender ? \"f\" : cell.name;",
    "**The defect is pinned mechanically.** `tests/prose_coordinate_count.test.js` now requires that, in DOCTRINE, the journal and the audit artifact, **every line naming `profile.gend` either carries the real escape sequence or appears verbatim on an allowlist of lines that deliberately render the ORDINARY read** (quoting the historical error, or showing the unrelated spread repro). Verified by counterfactual: removing one backslash reds the suite. The two malformed sites in the artifact were repaired to hold a real `0x5c`, confirmed with `od -c` and an exact fixed-string match rather than by reading.",
    "**superseded:** 2026-08-06 · v0.74 (§5 — **the absolute claim moves off the hand lexer and onto a raw, fail-closed allowlist.** A final-byte audit produced the settling repro: `const spread = [.../[//]/.exec(cell.name)]; cardName.textContent = profile.gender ? \"f\" : cell.name;` — valid JavaScript, executed, changing the card, and **both lexical guards reported clean**, because a regex may legally begin after a spread `...` and the heuristic does not list it, so the `//` inside the character class opened a comment over a live read. `for await` and division-RHS variants reproduce independently. **§5 v0.73's \"every spelled read fails at any nesting depth\" is superseded**: enumerating every ES position a regex may begin in is not something a hand lexer does correctly, and v0.72 and v0.73 each closed the newest hole and re-asserted the same absolute claim. The PRIMARY invariant is now a raw allowlist — every line of `index.html` and of every `core/`/`ui/` module outside the three input-path files that contains the identifier, in any casing, pinned verbatim. It parses nothing, so no syntax confusion can hide a read; comments and user-visible copy are pinned too, deliberately, because stale gender copy is a defect this cycle already corrected twice. The lexical guards are retained as SECONDARY diagnostics with narrowed claims, and a counter-case pins one of their blind spots so the split is enforced by behaviour, not prose. Also fixed: the inline-module matcher missed `type=module` / `type = \"module\"` / `TYPE=\"module\"`, and its test asserted on a token the baseline already carried (a unique sentinel replaces it). **Unchanged:** the runtime differential over the pure surfaces is the real guarantee, and no static check closes the indirection class — a runtime-built key, a Unicode escape or a value-scanning sniff writes no identifier and is invisible to raw and lexical scanning alike. Suite 56 files / 2003 tests green; product audit PASS 14/0/0/0 on a clean tree; local PII scan clean, 862 files; `index.html` 1474/1500. **STAGED — cross-model audit before merge per §10/L48; merge is the operator's word.**)",
    "- v0.78: §5 — v0.77's \"only addenda 6 and 7 printed the malformed Unicode form\" was false ON ARRIVAL: Addendum 10, in the same change, printed it bare in the table asserting who had it right. The count is three (6, 8's erratum, 10). Fourth attempt at one sentence, so it is pinned mechanically instead — every `profile.gend` line in the tracked docs must carry the real escape or sit on an allowlist of deliberate ordinary-read renderings, verified by counterfactual. Two artifact sites repaired to hold a real 0x5c, confirmed with od -c; the in-place byte repair is disclosed rather than silent.",
    "- v0.74: §5 — the absolute \"every spelled read\" claim moves off the hand lexer onto a RAW, fail-closed allowlist, after a repro that both lexical guards passed while a live `profile.gender` read changed the card (a regex may begin after a spread `...`; the `//` in its character class opened a comment). v0.73's claim superseded. Lexical guards retained as secondary diagnostics with narrowed claims and a blind-spot counter-case; inline-module matcher and its non-discriminating sentinel fixed. No static check closes the indirection class, and the runtime differential remains the real guarantee."
  ],
  "journal.md": [
    "Scanning every `profile.gend` occurrence in the artifact — rather than",
    "requires every line naming `profile.gend` in DOCTRINE, this journal and the",
    "cardName.textContent = profile.gender ? \"f\" : cell.name;",
    "bypass as `profile.gender` instead of the escaped form, which inverts the",
    "\"calc-driving (the kua block reads profile.gender)\" — asserting a"
  ],
  "audits/relay_specimen_four_line_premerge_audit_2026-08-06_response.md": [
    "the kua block reads profile.gender\". The kua block was deleted at",
    "And the limits prose named a Unicode-escape bypass (`profile.gender`)",
    "Addendum 6 says the limits prose named a Unicode-escape bypass \"(`profile.gender`)\".",
    "is `profile.gender` — an escaped `e` inside the property name, which is a",
    "Written as `profile.gender` the sentence describes an ordinary read that every",
    "cardName.textContent = profile.gender ? \"f\" : cell.name;",
    "blanking a live `profile.gender` read. **Both lexical guards reported clean:",
    "- **WRONG, as both earlier addenda rendered it:** `profile.gender`",
    "`profile.gender` — without the escape\". **v0.73 already carries the escaped",
    "| v0.73 (`:471`) | `profile.gender` — **correct** |",
    "| v0.74 (`:482`) | `profile.gender` — but this is its **separate spread/regex repro**, a different bypass |",
    "`profile.gend` occurrence in this file rather than by re-reading the passage.",
    "`profile.gend` in DOCTRINE, the journal and this artifact either carries the"
  ]
};

describe('the Unicode-escape bypass is rendered with a real backslash', () => {
  const ESCAPED = 'profile.gend' + String.fromCharCode(92) + 'u0065r';

  for (const [rel, allowed] of Object.entries(BARE_GENDER_PROSE)) {
    it(`${rel}: every bare rendering is a deliberate one`, () => {
      const bare = readFileSync(join(__dirname, '..', rel), 'utf-8')
        .split('\n').map(l => l.trim())
        .filter(l => l.includes('profile.gend') && !l.includes(ESCAPED));
      expect(
        bare,
        `${rel}: a line names profile.gend without the escape. If it meant the `
        + `escaped bypass, the backslash was lost — check the BYTES. If it meant `
        + `the ordinary read, add the line verbatim to BARE_GENDER_PROSE.`,
      ).toEqual(allowed);
    });
  }

  it('the escaped form really is present, with a real 0x5c byte', () => {
    // Guards the guard: if the constant above ever loses its backslash, every
    // assertion here would pass vacuously against bare prose.
    expect(ESCAPED.charCodeAt(12)).toBe(92);
    expect(ESCAPED).toBe('profile.gend' + '\u005cu0065r'.replace('\u005c', String.fromCharCode(92)));
    const artifact = readFileSync(
      join(__dirname, '..', 'audits',
        'relay_specimen_four_line_premerge_audit_2026-08-06_response.md'), 'utf-8');
    expect(artifact.includes(ESCAPED),
      'the artifact no longer renders the escaped form at all').toBe(true);
  });
});
