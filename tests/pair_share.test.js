// 8ball / tests / pair_share.test.js
//
// ui/pairShare.js — the Pair Imprint (DOCTRINE §5.D / §1.J v0.79). Two
// halves, mirroring the tests/share_surface.test.js / tests/share_behavior.
// test.js split for ui/share.js:
//
//   1. Pure builders (allow-list construction, SVG/caption content, status
//      copy) — driven directly, no DOM.
//   2. The live click path — initPairShareUI + onShareClick run end to end
//      against stubbed browser globals (node env, no jsdom, same convention
//      as tests/share_behavior.test.js), covering the Web Share branch, the
//      download+clipboard fallback, and every distinguished outcome state.
//
// The adversarial sentinel (§ below) is the security-boundary proof the
// brief's risk register asks for: it peppers a relation-record-shaped input
// with PII/profile-adjacent strings that are NOT among the three allow-
// listed fields and asserts none of them reach the snapshot, the SVG, the
// caption, the filename, or the URL — a positive-fire pattern (the sentinel
// values ARE present on the input) so the guard cannot silently pass by
// having nothing to find.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PAIR_IMPRINT_ALLOW,
  buildPairImprintSnapshot,
  buildPairImprintSVG,
  buildPairImprintCaption,
  pairShareStatusMessage,
  pairImprintDisclosureText,
  initPairShareUI,
  FOOTER_LAYOUT,
  fitValueFontSize,
  VALUE_GEOMETRY,
} from '../ui/pairShare.js';
import { elementDirection, combinedPath } from '../core/dyad.js';
import { SUN_SIGNS, ANIMALS } from '../core/profile.js';
import { getCard } from '../core/engine.js';
import { ELEMENTS } from '../content/concordance.v1.js';
import { LIFE_PATH_VALUES } from '../content/concordance.v3.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const pairShareJs = readFileSync(join(REPO_ROOT, 'ui', 'pairShare.js'), 'utf-8');
const dyadJs = readFileSync(join(REPO_ROOT, 'ui', 'dyad.js'), 'utf-8');

// A realistic formatted-relation-record shape (ui/dyad.js formatDyadRelation
// output), peppered with adversarial PII/profile-shaped fields that are NOT
// among the three fields the snapshot may read. If any of these strings ever
// reach the snapshot/SVG/caption, the sentinel fires.
const SENTINEL_NAME = 'zelmira quettlebaum';
const SENTINEL_DOB = '1955-02-17';
function adversarialRelation(overrides = {}) {
  return {
    elementSpine: 'water ⇄ wood',
    elementHead: 'water → wood · generating',
    elementAB: `${SENTINEL_NAME} feeds the wood forward.`,
    elementBA: 'wood draws on water in turn.',
    elementDirectionAB: 'A · water → B · wood',
    elementDirectionBA: 'B · wood ← A · water',
    numerologyHead: '4 + 7 → 11 · a bridging number',
    numerologyReduction: 'the two life paths sum to 11.',
    numerologyMeaning: `filed under ${SENTINEL_NAME}, born ${SENTINEL_DOB}.`,
    numerologySpine: '4 + 7 → 11',
    cardPairHead: 'no. iv × no. xlii',
    cardPair: `${SENTINEL_NAME}'s two year branches sit in a named pair.`,
    cardBranchHead: 'year branch · liuhe',
    cardBranchBody: 'the two year branches sit in a named liuhe pair.',
    cardBracketHead: 'A · arrival → B · command',
    cardBracketBody: 'the first entry sits in the arrival bracket.',
    qualifier: 'recorded, not certified.',
    ...overrides,
  };
}

describe('buildPairImprintSnapshot — allow-list construction', () => {
  it('the constructed object carries exactly the allow-listed keys, nothing else', () => {
    const snapshot = buildPairImprintSnapshot(adversarialRelation());
    expect(Object.keys(snapshot).sort()).toEqual([...PAIR_IMPRINT_ALLOW].sort());
  });

  it('reads exactly three fields off the input, by name — the rest is discarded', () => {
    const relation = adversarialRelation();
    const snapshot = buildPairImprintSnapshot(relation);
    expect(snapshot.elementCycle).toBe(relation.elementDirectionAB);
    expect(snapshot.combinedLifePath).toBe(relation.numerologySpine);
    expect(snapshot.cardPair).toBe(relation.cardPairHead);
    expect(snapshot.brand).toBe('8 ball · pair reading');
    expect(snapshot.pairLabel).toBe('A × B');
    expect(snapshot.disclosure).toBe('relation, not compatibility');
    expect(snapshot.privacyLine).toBe('personal details excluded');
    expect(snapshot.url).toBe('the-eight-ball.netlify.app');
  });

  it('the adversarial sentinel: none of the non-allow-listed fields reach the snapshot', () => {
    const snapshot = buildPairImprintSnapshot(adversarialRelation());
    const blob = JSON.stringify(snapshot);
    expect(blob).not.toContain(SENTINEL_NAME);
    expect(blob).not.toContain(SENTINEL_DOB);
    // The full-citation / meaning-prose fields never leak through either.
    expect(blob).not.toContain('feeds the wood forward');
    expect(blob).not.toContain('draws on water in turn');
    expect(blob).not.toContain('bridging number');
    expect(blob).not.toContain('liuhe');
  });

  it('null / malformed / missing-field input never produces a partial snapshot', () => {
    expect(buildPairImprintSnapshot(null)).toBeNull();
    expect(buildPairImprintSnapshot(undefined)).toBeNull();
    expect(buildPairImprintSnapshot({})).toBeNull();
    expect(buildPairImprintSnapshot({ elementDirectionAB: 'A · water → B · wood' })).toBeNull();
    expect(buildPairImprintSnapshot('not an object')).toBeNull();
  });

  it('never spreads the input — an added field on the relation record cannot ride along', () => {
    const relation = adversarialRelation({ futureField: 'a field this function has never heard of' });
    const snapshot = buildPairImprintSnapshot(relation);
    expect(JSON.stringify(snapshot)).not.toContain('a field this function has never heard of');
  });
});

describe('buildPairImprintSVG — 1080×1350 portrait, monochrome, escaped', () => {
  it('declares the exact deterministic canvas size', () => {
    const svg = buildPairImprintSVG(buildPairImprintSnapshot(adversarialRelation()));
    expect(svg).toContain('width="1080" height="1350"');
    expect(svg).toContain('viewBox="0 0 1080 1350"');
  });

  it('renders the brand, A × B, all three labeled findings, and the fixed copy', () => {
    const snapshot = buildPairImprintSnapshot(adversarialRelation());
    const svg = buildPairImprintSVG(snapshot);
    expect(svg).toContain('8 ball · pair reading');
    expect(svg).toContain('A × B');
    expect(svg).toContain('ELEMENT CYCLE');
    expect(svg).toContain('A · water → B · wood');
    expect(svg).toContain('COMBINED LIFE PATH');
    expect(svg).toContain('4 + 7 → 11');
    expect(svg).toContain('CARD PAIR');
    expect(svg).toContain('no. iv × no. xlii');
    expect(svg).toContain('relation, not compatibility');
    expect(svg).toContain('personal details excluded');
    expect(svg).toContain('the-eight-ball.netlify.app');
  });

  it('the adversarial sentinel: no PII/profile string reaches the SVG', () => {
    const svg = buildPairImprintSVG(buildPairImprintSnapshot(adversarialRelation()));
    expect(svg).not.toContain(SENTINEL_NAME);
    expect(svg).not.toContain(SENTINEL_DOB);
    expect(svg).not.toContain('liuhe');
    expect(svg).not.toContain('bridging number');
  });

  it('is monochrome — black paper, white ink, one mid-gray rule, no color hues', () => {
    const svg = buildPairImprintSVG(buildPairImprintSnapshot(adversarialRelation()));
    const hexes = new Set((svg.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
    expect(hexes).toEqual(new Set(['#000000', '#ffffff', '#b8b8b8', '#737373']));
  });

  it('escapes HTML-significant characters in every rendered field (XSS-safe)', () => {
    const relation = adversarialRelation({
      elementDirectionAB: 'A · <script>alert(1)</script> & "quoted" → B · wood',
    });
    const svg = buildPairImprintSVG(buildPairImprintSnapshot(relation));
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&amp;');
    expect(svg).toContain('&quot;quoted&quot;');
  });

  it('never contains a query string, hash, or per-result parameter on the URL', () => {
    const svg = buildPairImprintSVG(buildPairImprintSnapshot(adversarialRelation()));
    expect(svg).not.toMatch(/the-eight-ball\.netlify\.app[?#]/);
  });
});

// ── P2 geometry (second remediation gate) ───────────────────────────────
// The three signature values are FINITE outputs of immutable content tables,
// not free text — so "the longest real line" is an enumerable fact, not a
// guess. These tests drive the REAL production functions over every real
// combination each field can take and assert fitValueFontSize keeps the
// worst case inside VALUE_GEOMETRY.laneWidth at or above VALUE_GEOMETRY.
// fontMin — the same fit buildPairImprintSVG's row loop applies internally.
describe('P2 geometry — the longest REAL element-direction/numerology/card-pair line stays in the lane', () => {
  function activeCycleLine(a, b) {
    const aToB = elementDirection(a, b);
    const bToA = elementDirection(b, a);
    if (aToB.kind === 'same') return `A · ${a} = B · ${b}`;
    const aToBActive = aToB.kind === 'sheng' || aToB.kind === 'ke';
    const active = aToBActive ? aToB : bToA;
    const fromLabel = aToBActive ? 'A' : 'B';
    const toLabel = aToBActive ? 'B' : 'A';
    return `${fromLabel} · ${active.from} → ${toLabel} · ${active.to} · ${active.label}`;
  }

  function widthOf(text, fontSize) {
    return text.length * VALUE_GEOMETRY.charAdvanceEm * fontSize;
  }

  it('every real element-cycle direction (all 25 ordered element pairs, both wings) fits the lane at a legible size', () => {
    let longest = '';
    for (const a of ELEMENTS) {
      for (const b of ELEMENTS) {
        const line = activeCycleLine(a, b);
        if (line.length > longest.length) longest = line;
      }
    }
    expect(longest.length).toBeGreaterThan(0);
    const fitted = fitValueFontSize(longest);
    expect(fitted).toBeGreaterThanOrEqual(VALUE_GEOMETRY.fontMin);
    expect(widthOf(longest, fitted)).toBeLessThanOrEqual(VALUE_GEOMETRY.laneWidth);
  });

  it('every real combined-life-path finding (the full numerology domain, both orders) fits the lane', () => {
    let longest = '';
    for (const a of LIFE_PATH_VALUES) {
      for (const b of LIFE_PATH_VALUES) {
        const { combined } = combinedPath(a, b);
        const line = `${a} + ${b} → ${combined}`;
        if (line.length > longest.length) longest = line;
      }
    }
    expect(longest.length).toBeGreaterThan(0);
    const fitted = fitValueFontSize(longest);
    expect(fitted).toBeGreaterThanOrEqual(VALUE_GEOMETRY.fontMin);
    expect(widthOf(longest, fitted)).toBeLessThanOrEqual(VALUE_GEOMETRY.laneWidth);
  });

  it('every real card-pair catalog finding (144×144 roman-numeral pairs) fits the lane', () => {
    const catalogs = [];
    for (const sun of SUN_SIGNS) {
      for (const animal of ANIMALS) {
        catalogs.push(getCard({ sunSign: sun.name, animal }).catalog);
      }
    }
    expect(catalogs).toHaveLength(144);
    let longest = '';
    for (const a of catalogs) {
      for (const b of catalogs) {
        const line = `no. ${a} × no. ${b}`;
        if (line.length > longest.length) longest = line;
      }
    }
    const fitted = fitValueFontSize(longest);
    expect(fitted).toBeGreaterThanOrEqual(VALUE_GEOMETRY.fontMin);
    expect(widthOf(longest, fitted)).toBeLessThanOrEqual(VALUE_GEOMETRY.laneWidth);
  });

  it('a short, ordinary string still renders at the full base size — the fit never shrinks what does not need it', () => {
    expect(fitValueFontSize('4 + 7 → 11')).toBe(VALUE_GEOMETRY.fontMax);
    expect(fitValueFontSize('no. iv × no. xlii')).toBe(VALUE_GEOMETRY.fontMax);
  });

  it('the fitted size, applied to the actual longest real element-cycle string, is what buildPairImprintSVG renders', () => {
    let longest = '';
    for (const a of ELEMENTS) {
      for (const b of ELEMENTS) {
        const line = activeCycleLine(a, b);
        if (line.length > longest.length) longest = line;
      }
    }
    const snapshot = buildPairImprintSnapshot(adversarialRelation({ elementDirectionAB: longest }));
    const svg = buildPairImprintSVG(snapshot);
    expect(svg).toContain(`font-size="${fitValueFontSize(longest)}"`);
  });
});

describe('buildPairImprintCaption — same snapshot, same bounds', () => {
  it('carries the three findings, the disclosure, and the bare host', () => {
    const snapshot = buildPairImprintSnapshot(adversarialRelation());
    const caption = buildPairImprintCaption(snapshot);
    expect(caption).toContain('8 ball · pair reading');
    expect(caption).toContain('A × B');
    expect(caption).toContain('element cycle: A · water → B · wood');
    expect(caption).toContain('combined life path: 4 + 7 → 11');
    expect(caption).toContain('card pair: no. iv × no. xlii');
    expect(caption).toContain('relation, not compatibility');
    expect(caption).toContain('personal details excluded');
    expect(caption.trim().endsWith('the-eight-ball.netlify.app')).toBe(true);
  });

  it('the adversarial sentinel: no PII/profile string reaches the caption', () => {
    const caption = buildPairImprintCaption(buildPairImprintSnapshot(adversarialRelation()));
    expect(caption).not.toContain(SENTINEL_NAME);
    expect(caption).not.toContain(SENTINEL_DOB);
    expect(caption).not.toContain('liuhe');
  });

  it('a null snapshot never throws — empty fields, not a crash', () => {
    expect(() => buildPairImprintCaption(null)).not.toThrow();
    expect(() => buildPairImprintCaption(undefined)).not.toThrow();
  });
});

// Fifth remediation gate, item 2: the real taxonomy is ELEVEN states, not
// eight — the third gate's eight-state count (itself a correction of an
// even earlier six-state undercount) predates the fourth gate's post-effect
// qualified-pair distinction, and this file's own canonical enumeration was
// never updated to match, even though ui/pairShare.js's
// `pairShareStatusMessage` switch itself already carried all eleven. Sixth
// remediation gate, item 2: the fourth/fifth gates named the qualified
// states `shared-previous`/`download-started-previous[-copied]` and used
// them for BOTH a confirmed pair change AND an unconfirmed (hook-threw)
// re-read — but a throw never proves the pair changed, only that currency
// is unknown, so "previous" was a false claim in the unknown case. Renamed
// to `shared-selected`/`download-started-selected[-copied]`: "selected" is
// truthful either way, since the exported artifact is certainly the
// snapshot selected at click time. This enumeration is the single source of
// truth every other "every state"-shaped test/count in this file should
// agree with.
const ALL_STATES = [
  'busy',
  'shared',
  'shared-selected',
  'download-started',
  'download-started-copied',
  'download-started-selected',
  'download-started-selected-copied',
  'cancelled',
  'stale',
  'empty',
  'failed',
];
const SHARED_STATES = ['shared', 'shared-selected'];
const SELECTED_PAIR_STATES = ['shared-selected', 'download-started-selected', 'download-started-selected-copied'];
const CURRENT_PAIR_DOWNLOAD_STATES = ['download-started', 'download-started-copied'];

describe('pairShareStatusMessage — every outcome is a distinct, non-overclaiming string (the full eleven-state taxonomy)', () => {
  it('all eleven real states produce distinct, non-empty messages', () => {
    const messages = ALL_STATES.map(pairShareStatusMessage);
    expect(ALL_STATES).toHaveLength(11);
    expect(new Set(messages).size).toBe(ALL_STATES.length);
    for (const msg of messages) expect(msg.length).toBeGreaterThan(0);
  });

  // `shared` and `shared-selected` BOTH truthfully report a completed share
  // — navigator.share() genuinely resolved either way (fourth gate, item 1:
  // a resolved share is a real, irreversible effect that must never be
  // erased just because identity couldn't be confirmed afterward). The two
  // are NOT interchangeable: `shared` is the unqualified claim ("this is
  // the pair on screen"), `shared-selected` explicitly names the pair as
  // the one selected at click time, never a bare ambiguous "shared."
  it('`shared` and `shared-selected` both truthfully claim a share completed — every other state never says "shared"', () => {
    for (const state of SHARED_STATES) {
      expect(pairShareStatusMessage(state).toLowerCase()).toContain('shared');
    }
    for (const state of ALL_STATES.filter(s => !SHARED_STATES.includes(s))) {
      expect(pairShareStatusMessage(state).toLowerCase()).not.toContain('shared');
    }
  });

  it('`shared` is the unqualified current-pair claim; `shared-selected` is never the same bare string, and never says "previous"', () => {
    expect(pairShareStatusMessage('shared')).toBe('shared.');
    expect(pairShareStatusMessage('shared-selected')).not.toBe(pairShareStatusMessage('shared'));
    expect(pairShareStatusMessage('shared-selected').toLowerCase()).toContain('selected pair');
    expect(pairShareStatusMessage('shared-selected').toLowerCase()).not.toContain('previous');
  });

  // Fourth gate, item 1's other irreversible-effect pair: a fired download.
  // `download-started`/`download-started-copied` are the current-pair
  // claims; the `-selected` variants explicitly name the selected pair
  // rather than leaving the reader to guess which pair the download
  // concerned — and never say "previous", since a `-selected` state can be
  // reached by an UNCONFIRMED read that proves no change at all.
  it('the current-pair download states never say "selected" or "previous"; the selected-pair download states always say "selected", never "previous"', () => {
    for (const state of CURRENT_PAIR_DOWNLOAD_STATES) {
      expect(pairShareStatusMessage(state).toLowerCase()).not.toContain('selected');
      expect(pairShareStatusMessage(state).toLowerCase()).not.toContain('previous');
    }
    for (const state of SELECTED_PAIR_STATES.filter(s => s !== 'shared-selected')) {
      expect(pairShareStatusMessage(state).toLowerCase()).toContain('selected pair');
      expect(pairShareStatusMessage(state).toLowerCase()).not.toContain('previous');
    }
  });

  it('no status string anywhere in the taxonomy contains the word "previous"', () => {
    for (const state of ALL_STATES) {
      expect(pairShareStatusMessage(state).toLowerCase()).not.toContain('previous');
    }
  });

  it('the clipboard-copied variants (current and selected pair) say so; the non-copied variants do not', () => {
    expect(pairShareStatusMessage('download-started-copied').toLowerCase()).toContain('caption copied');
    expect(pairShareStatusMessage('download-started-selected-copied').toLowerCase()).toContain('caption copied');
    expect(pairShareStatusMessage('download-started').toLowerCase()).not.toContain('copied');
    expect(pairShareStatusMessage('download-started-selected').toLowerCase()).not.toContain('copied');
  });

  it('no state claims the artifact was "saved" or that a download reached disk — only that a download STARTED (item 6: this module cannot observe disk completion)', () => {
    for (const state of ALL_STATES) {
      const msg = pairShareStatusMessage(state).toLowerCase();
      expect(msg).not.toMatch(/\bsaved\b/);
      expect(msg).not.toMatch(/disk/);
    }
  });

  it('an unknown state resolves to an empty string, never a stale/guessed message', () => {
    expect(pairShareStatusMessage('not-a-real-state')).toBe('');
    expect(pairShareStatusMessage(undefined)).toBe('');
  });
});

describe('static structure — self-containment and the isolation boundary', () => {
  const stripComments = src => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/[^:]\/\/.*$/gm, '');
  const code = stripComments(pairShareJs);

  it('zero imports — cannot reach ui/dyad.js, ui/sheet.js, ui/tiers.js or any core/ module', () => {
    expect(pairShareJs).not.toMatch(/^\s*import\s/m);
  });

  it('never references a profile field, a form id, or sheet DOM', () => {
    // `.name` is deliberately excluded from this list — `err.name ===
    // 'AbortError'` is a legitimate Error-object read, not a profile field,
    // and a bare `.name` substring scan false-positives on it.
    for (const token of [
      'profile.name', '.dob', '.firstName', '.time', '.city', '.cc', '.tz', '.lat', '.lng',
      'dyad-name-input', 'dyad-dob-input', 'data-sheet-', 'coord-val', 'getElementById',
      'card-name', 'card-type', 'card-habit', 'card-note',
    ]) {
      expect(code, token).not.toContain(token);
    }
  });

  it('never names a localStorage key or reaches sessionStorage/indexedDB', () => {
    expect(code).not.toMatch(/localStorage/);
    expect(code).not.toMatch(/sessionStorage/i);
    expect(code).not.toMatch(/indexedDB/i);
  });

  it('no network capability — no fetch/XHR/beacon anywhere in the module', () => {
    expect(code).not.toMatch(/fetch\(/);
    expect(code).not.toMatch(/XMLHttpRequest/);
    expect(code).not.toMatch(/navigator\.sendBeacon/);
  });

  it('the filename is one static constant — never derived from the relation content', () => {
    const matches = pairShareJs.match(/IMPRINT_FILENAME\s*=\s*'([^']+)'/);
    expect(matches).toBeTruthy();
    expect(matches[1]).toBe('8ball-pair-reading.png');
    // Only ever assigned once, and never templated with a variable.
    expect(pairShareJs.match(/IMPRINT_FILENAME\s*=/g)).toHaveLength(1);
  });

  it('ui/dyad.js does not import ui/pairShare.js — the wiring is index.html-mediated, not a direct dependency', () => {
    expect(dyadJs).not.toMatch(/import[^;]*pairShare/);
  });

  it('index.html wires initPairShareUI exactly once, reading the relation via the getRelation hook — never a profile', () => {
    const html = readFileSync(join(REPO_ROOT, 'index.html'), 'utf-8');
    expect(html.match(/initPairShareUI\(/g)).toHaveLength(1);
    expect(html).toMatch(/getRelation:\s*dyadCurrentRelation/);
    expect(html).not.toMatch(/initPairShareUI\([^)]*profile/i);
  });

  // Sixth remediation gate, item 1: the two tests above (and every other
  // structural check in this describe block) never strip comments before
  // matching — a comment that happens to QUOTE the real wiring (this file's
  // own prose does exactly that, describing the wiring in prose near the
  // call sites) could make a vacuous assertion pass even if the executable
  // wiring were deleted or rewired. This test strips comments first (the
  // same stripComments idiom this describe block already uses on
  // pairShareJs) and pins BOTH halves of the actual host contract as
  // EXECUTABLE structure: the click-time READ (getRelation delegates to the
  // dyad relation accessor) and the proactive WRITE (every dyad relation
  // change is delegated to the pair-share controller's own
  // notifyRelationChange, via the pairShareController closure index.html
  // itself documents at the top of this wiring). Either half being removed,
  // renamed, or rewired to a different function must fail this test.
  it('index.html host contract, pinned as executable structure (comments stripped): getRelation delegates to the dyad accessor AND onRelationChange delegates to notifyRelationChange', () => {
    const html = readFileSync(join(REPO_ROOT, 'index.html'), 'utf-8');
    const stripped = stripComments(html);
    // Half 1 — the read: ui/pairShare.js's hooks.getRelation must be wired
    // to ui/dyad.js's real relation accessor, in executable code.
    expect(stripped).toMatch(/getRelation:\s*dyadCurrentRelation/);
    // Half 2 — the write: ui/dyad.js's onRelationChange hook must call the
    // live pairShareController's notifyRelationChange with the relation it
    // was just handed — the exact narrow proactive-pre-render seam P1-4
    // depends on. A vacuous `onRelationChange: () => {}` or one that calls
    // anything else must fail this.
    expect(stripped).toMatch(
      /onRelationChange:\s*relation\s*=>\s*\{\s*if\s*\(pairShareController\)\s*pairShareController\.notifyRelationChange\(relation\);\s*\}/
    );
    // The controller both hooks close over must actually be the return
    // value of the one initPairShareUI() call — not a same-named decoy.
    expect(stripped).toMatch(/pairShareController\s*=\s*initPairShareUI\(/);
  });
});

// ── the live click path (node env, no jsdom — mirrors share_behavior.test.js) ──
//
// Second remediation gate: the click path now runs through a pre-render
// cache (P1-4). `installEnv`'s Image mock still fires its `onload`
// synchronously by default, but `svgToPngBlob` wraps that in a real Promise,
// so the mock's own resolution only lands on the NEXT microtask — `boot()`
// below flushes exactly one microtask after triggering the (default) proactive
// pre-render, matching how a real browser's pre-render would already be
// settled by the time a human reaches the button.

const RealBlob = globalThis.Blob;
// Eleventh remediation gate (addendum item 4): `document`/`Image`/`File` are
// NOT real Node globals in this test environment the way `Blob`/`fetch`/
// `URL` are — snapshotting them "by value" (`originals.document =
// globalThis.document`) captures `undefined` when absent, and restoring via
// plain assignment (`globalThis.document = originals.document`) then leaves
// `document` as an OWN property of globalThis holding `undefined`, not the
// TRUE absence it started as (`hasOwnProperty` flips from false to true).
// The exact descriptor/absence is snapshotted here and restored via
// `restoreGlobal()` below, the same discipline `navigator`'s own
// descriptor-based restore already used.
function snapshotGlobal(key) {
  return {
    had: Object.prototype.hasOwnProperty.call(globalThis, key),
    desc: Object.getOwnPropertyDescriptor(globalThis, key),
  };
}
function restoreGlobal(key, snapshot) {
  if (snapshot.had) Object.defineProperty(globalThis, key, snapshot.desc);
  else delete globalThis[key];
}
const originals = {
  documentSnapshot: snapshotGlobal('document'),
  imageSnapshot: snapshotGlobal('Image'),
  fileSnapshot: snapshotGlobal('File'),
  Blob: globalThis.Blob,
  fetch: globalThis.fetch,
  createObjectURL: globalThis.URL.createObjectURL,
  revokeObjectURL: globalThis.URL.revokeObjectURL,
  navigatorDescriptor: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
};

function makeEl(tag = 'div') {
  const handlers = {};
  const attrs = {};
  return {
    tag, textContent: '', hidden: false, disabled: false, clickCount: 0, removeCount: 0,
    attrs,
    classList: { add() {}, remove() {}, contains() { return false; } },
    addEventListener(ev, fn) { handlers[ev] = fn; },
    removeEventListener(ev, fn) { if (handlers[ev] === fn) delete handlers[ev]; },
    _fire(ev, arg) { return handlers[ev] && handlers[ev](arg); },
    _hasListener(ev) { return !!handlers[ev]; },
    click() { this.clickCount++; },
    remove() { this.removeCount++; },
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
  };
}

function installEnv({
  canShare = null, share = null, clipboard = null,
  toBlob = 'ok', imageFails = false, contextThrows = false, imageDefer = false,
  appendThrows = false, clickThrows = false, removeThrows = false, setTimeoutThrows = false,
} = {}) {
  const log = {
    svg: [], created: [], revoked: [], anchors: [], canvases: [], shared: [], copied: [], fetchCalls: 0,
    // Only populated when imageDefer is true — one release function per
    // constructed Image, so a test can hold rasterization "in flight" and
    // release it at a chosen moment.
    pendingImages: [],
  };

  globalThis.Blob = class extends RealBlob {
    constructor(parts, opts) {
      super(parts, opts);
      if (opts && String(opts.type).startsWith('image/svg')) log.svg.push(parts.map(String).join(''));
    }
  };
  let seq = 0;
  globalThis.URL.createObjectURL = () => { const u = `blob:mock/${++seq}`; log.created.push(u); return u; };
  globalThis.URL.revokeObjectURL = u => { log.revoked.push(u); };
  globalThis.Image = class {
    constructor() { this.onload = null; this.onerror = null; }
    set src(value) {
      this._src = value;
      const fire = () => {
        if (imageFails) { if (this.onerror) this.onerror(); }
        else if (this.onload) this.onload();
      };
      if (imageDefer) log.pendingImages.push(fire);
      else fire();
    }
    get src() { return this._src; }
  };
  const body = {
    appendChild(node) {
      if (appendThrows) throw new Error('appendChild blocked');
      log.anchors.push(node);
      return node;
    },
  };
  globalThis.document = {
    body,
    createElement(tag) {
      if (tag === 'canvas') {
        const canvas = {
          tag, width: 0, height: 0,
          getContext(kind) {
            if (contextThrows) throw new Error('context unavailable');
            canvas.contextKind = kind;
            return { drawImage: (...args) => { canvas.drawn = args; } };
          },
          toBlob(cb, type) {
            canvas.toBlobType = type;
            cb(toBlob === 'null' ? null : new RealBlob(['png-bytes'], { type: 'image/png' }));
          },
        };
        log.canvases.push(canvas);
        return canvas;
      }
      const el = makeEl(tag);
      if (tag === 'a') {
        if (clickThrows) el.click = () => { throw new Error('download blocked'); };
        if (removeThrows) el.remove = () => { throw new Error('remove blocked'); };
      }
      return el;
    },
  };
  const navigator = {};
  if (canShare) navigator.canShare = canShare;
  if (share) navigator.share = async payload => { log.shared.push(payload); return share(payload); };
  if (clipboard) navigator.clipboard = { writeText: async text => { log.copied.push(text); return clipboard(text); } };
  Object.defineProperty(globalThis, 'navigator', { value: navigator, configurable: true, writable: true });
  globalThis.fetch = () => { log.fetchCalls++; throw new Error('network is forbidden (§5/§7)'); };
  if (setTimeoutThrows) {
    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (fn, ms) => {
      if (typeof fn === 'function' && ms === 1000) throw new Error('setTimeout blocked');
      return realSetTimeout(fn, ms);
    };
  }
  return log;
}

// `prerender:true` (the default) mirrors production: index.html's
// onRelationChange hook fires the instant a relation becomes current, well
// before a human can reach the button, so by the time a test clicks, the
// cache is normally already populated. `prerender:false` boots with no
// proactive render at all, for tests of the "cache never warmed" fallback.
async function boot(getRelation, { prerender = true } = {}) {
  const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
  const controller = initPairShareUI(refs, { getRelation });
  if (prerender) {
    controller.notifyRelationChange(getRelation());
    await Promise.resolve(); // flush the mock's promise-wrapped rasterization
  }
  return { refs, controller };
}

const VALID_RELATION = adversarialRelation();
const clickShare = refs => refs.btn._fire('click');

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => {
  vi.useRealTimers();
  restoreGlobal('document', originals.documentSnapshot);
  restoreGlobal('Image', originals.imageSnapshot);
  restoreGlobal('File', originals.fileSnapshot);
  globalThis.Blob = originals.Blob;
  globalThis.fetch = originals.fetch;
  globalThis.URL.createObjectURL = originals.createObjectURL;
  globalThis.URL.revokeObjectURL = originals.revokeObjectURL;
  if (originals.navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', originals.navigatorDescriptor);
});

describe('Pair Imprint — the live click path (blob pre-rendered before the click, the common case)', () => {
  it('initPairShareUI tolerates a boot with no refs/hooks', () => {
    installEnv();
    expect(() => initPairShareUI({}, {})).not.toThrow();
    expect(() => initPairShareUI(null, null)).not.toThrow();
  });

  it('empty relation: no render attempted, status reads "nothing to share yet"', async () => {
    const log = installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => null);
    await clickShare(refs);
    expect(log.canvases).toHaveLength(0);
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('empty'));
    expect(log.fetchCalls).toBe(0);
  });

  it('native Web Share success: status reads "shared", the PNG + caption travel together, no download/clipboard', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.shared).toHaveLength(1);
    expect(log.shared[0].text).toContain('8 ball · pair reading');
    expect(log.shared[0].files).toHaveLength(1);
    expect(log.shared[0].files[0].name).toBe('8ball-pair-reading.png');
    expect(log.anchors).toHaveLength(0); // no download fallback fired
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
  });

  it('user dismisses the native share sheet (AbortError): status reads "cancelled", never "shared"', async () => {
    const abort = new Error('cancelled by user');
    abort.name = 'AbortError';
    installEnv({ canShare: () => true, share: () => { throw abort; } });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('cancelled'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('shared'));
  });

  it('a genuine share exception (not AbortError, second-gate P1-4): preserves the local download, never just "failed"', async () => {
    const log = installEnv({ canShare: () => true, share: () => { throw new Error('boom'); }, clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    // The platform's OWN chooser broke, but the PNG this device already
    // rendered is still right here — the fallback download must still run.
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('no native share support: falls back to download + clipboard copy', async () => {
    const log = installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(log.copied).toHaveLength(1);
    expect(log.copied[0]).toContain('8 ball · pair reading');
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('download fallback with no/denied clipboard: status reads "downloaded" only, never claims a copy', async () => {
    const log = installEnv(); // no clipboard installed
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('canShare present but returns false for this file: falls back to download, not a broken share attempt', async () => {
    const log = installEnv({ canShare: () => false, share: () => undefined, clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1);
  });

  it('every object URL created (the pre-render SVG source and the download anchor) is revoked', async () => {
    const log = installEnv({ clipboard: () => {} });
    // The pre-render's own SVG-source URL is already revoked by the time
    // boot() returns (its Image loaded and canvas.toBlob resolved during
    // the microtask flush) — one create+revoke pair with nothing pending.
    const { refs } = await boot(() => VALID_RELATION);
    expect(log.revoked).toHaveLength(1);
    await clickShare(refs);
    // The download anchor's own URL (built from the ALREADY-cached PNG
    // blob, not a fresh SVG) is created here and revoked on its own 1000ms
    // timer.
    expect(log.revoked).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(log.revoked).toHaveLength(2);
    expect(log.created).toEqual(log.revoked);
  });

  it('no network call at any point in the flow', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.fetchCalls).toBe(0);
  });

  it('the SVG the rasterizer receives is the same allow-listed snapshot the pure builder produces — the adversarial sentinel, end to end', async () => {
    const log = installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.svg).toHaveLength(1); // rendered once, during pre-render — the click reuses the cached blob
    expect(log.svg[0]).not.toContain(SENTINEL_NAME);
    expect(log.svg[0]).not.toContain(SENTINEL_DOB);
    expect(log.svg[0]).not.toContain('liuhe');
  });

  it('a status message clears itself after a few seconds rather than sticking forever', async () => {
    installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.hidden).toBe(false);
    vi.advanceTimersByTime(4000);
    expect(refs.status.hidden).toBe(true);
  });
});

describe('Pair Imprint — the click path with NO pre-render yet (cache never warmed, or still in flight)', () => {
  it('no cache at all: renders on click, then falls straight to download — never a native share attempt (activation cannot be preserved)', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined, clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await clickShare(refs);
    expect(log.shared).toHaveLength(0); // second-gate P1-4: never attempted without a ready blob
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('a render failure with no pre-render (canvas context throws): status reads "failed", nothing shared or downloaded', async () => {
    const log = installEnv({ contextThrows: true, clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });

  it('clicking while the pre-render is STILL in flight waits for it, then downloads only — no native share', async () => {
    const log = installEnv({ imageDefer: true, canShare: () => true, share: () => undefined, clipboard: () => {} });
    const { refs, controller } = await boot(() => VALID_RELATION, { prerender: false });
    controller.notifyRelationChange(VALID_RELATION); // starts the render, deliberately held
    const pending = clickShare(refs); // clicked before the artifact is ready
    expect(log.pendingImages).toHaveLength(1);
    log.pendingImages[0](); // release it
    await pending;
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });
});

// ── second remediation gate (bc23c12 was independently audit-blocked) ────

describe('P1-4 / C2 — busy/disabled state reflects real artifact readiness, not just an active click', () => {
  it('pre-rendering (BEFORE any click) disables the button, sets aria-busy, and announces preparation', async () => {
    const log = installEnv({ imageDefer: true });
    const { refs, controller } = await boot(() => VALID_RELATION, { prerender: false });
    controller.notifyRelationChange(VALID_RELATION); // background pre-render starts
    expect(refs.btn.disabled).toBe(true);
    expect(refs.btn.getAttribute('aria-busy')).toBe('true');
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    log.pendingImages[0](); // release it
    await Promise.resolve();
    await Promise.resolve();
    expect(refs.btn.disabled).toBe(false);
    expect(refs.btn.getAttribute('aria-busy')).toBe('false');
    // No click ever happened — no share was attempted and no download was
    // started, so the transient "preparing…" text clears rather than sticking.
    expect(refs.status.hidden).toBe(true);
  });

  it('a click still shows busy at its own start, even on the fast (pre-rendered) path', async () => {
    installEnv({ canShare: () => true, share: () => new Promise(() => {}) }); // never resolves — hold the click open
    const { refs } = await boot(() => VALID_RELATION);
    clickShare(refs); // not awaited — still mid-flight
    expect(refs.btn.disabled).toBe(true);
    expect(refs.btn.getAttribute('aria-busy')).toBe('true');
  });

  it('clears busy state on EVERY terminal path — empty, failed, and success alike', async () => {
    installEnv();
    const { refs: refsEmpty } = await boot(() => null);
    await clickShare(refsEmpty);
    expect(refsEmpty.btn.disabled).toBe(false);
    expect(refsEmpty.btn.getAttribute('aria-busy')).not.toBe('true');

    installEnv({ contextThrows: true, clipboard: () => {} });
    const { refs: refsFailed } = await boot(() => VALID_RELATION);
    await clickShare(refsFailed);
    expect(refsFailed.btn.disabled).toBe(false);
    expect(refsFailed.btn.getAttribute('aria-busy')).toBe('false');

    installEnv({ clipboard: () => {} });
    const { refs: refsOk } = await boot(() => VALID_RELATION);
    await clickShare(refsOk);
    expect(refsOk.btn.disabled).toBe(false);
    expect(refsOk.btn.getAttribute('aria-busy')).toBe('false');
  });

  it('the terminal status text is never clobbered by the busy-state teardown', async () => {
    installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });
});

describe('item 1 — busy/preparing remains visible for the WHOLE pending window, never auto-hidden by a blind timer', () => {
  it('a slow proactive render held open past 4 seconds: busy stays visible the entire time, then clears on settle', async () => {
    const log = installEnv({ imageDefer: true });
    const { refs, controller } = await boot(() => VALID_RELATION, { prerender: false });
    controller.notifyRelationChange(VALID_RELATION);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    expect(refs.status.hidden).toBe(false);
    vi.advanceTimersByTime(6000); // well past the OLD blind 4s hide
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    expect(refs.btn.disabled).toBe(true);
    log.pendingImages[0]();
    await Promise.resolve();
    await Promise.resolve();
    expect(refs.status.hidden).toBe(true);
    expect(refs.btn.disabled).toBe(false);
  });

  it('a native share chooser held open past 4 seconds: busy stays visible until it settles, then the terminal text takes over and gets ITS OWN 4s timer', async () => {
    let releaseShare;
    installEnv({ canShare: () => true, share: () => new Promise(resolve => { releaseShare = resolve; }) });
    const { refs } = await boot(() => VALID_RELATION);
    const pending = clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    vi.advanceTimersByTime(6000);
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    releaseShare(undefined);
    await pending;
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
    expect(refs.status.hidden).toBe(false); // the terminal message is freshly shown
    vi.advanceTimersByTime(4000); // NOW the terminal state's own timer fires
    expect(refs.status.hidden).toBe(true);
  });

  it('a clipboard operation held open past 4 seconds: busy stays visible until it settles', async () => {
    let releaseCopy;
    installEnv({ clipboard: () => new Promise(resolve => { releaseCopy = resolve; }) });
    const { refs } = await boot(() => VALID_RELATION);
    const pending = clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    vi.advanceTimersByTime(6000);
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    releaseCopy(undefined);
    await pending;
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('every TERMINAL state still auto-hides after 4 seconds — only busy is exempt', async () => {
    installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.hidden).toBe(false);
    vi.advanceTimersByTime(4000);
    expect(refs.status.hidden).toBe(true);
  });
});

describe('C1 / P2 disclosure truth — capability is disclosed truthfully, before the button is ever pressed', () => {
  it('discloses a CONDITIONAL native share plus the download fallback when the platform supports native file share — never an unconditional promise, and never a "saved" completion claim', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const { refs } = await boot(() => VALID_RELATION);
    expect(refs.disclosure.textContent).toContain('created on this device');
    expect(refs.disclosure.textContent).toContain('personal details excluded');
    expect(refs.disclosure.textContent).toContain('when your device supports it');
    expect(refs.disclosure.textContent).toContain('downloads it as an image');
    expect(refs.disclosure.textContent).not.toMatch(/web share|navigator|browser api/i);
    // Item 6: "saves"/"saved" claims a completion this module cannot
    // observe — the disclosure must describe the ACTION (download), not a
    // completion it has no way to confirm.
    expect(refs.disclosure.textContent).not.toMatch(/\bsaves\b|\bsaved\b/);
  });

  it('discloses plain "downloads...as an image" when native share is unsupported — nothing conditional to hedge, and no "saved" claim', async () => {
    installEnv();
    const { refs } = await boot(() => VALID_RELATION);
    expect(refs.disclosure.textContent).toContain('pair imprint');
    expect(refs.disclosure.textContent).toContain('downloads the pair imprint as an image to this device');
    expect(refs.disclosure.textContent).not.toContain('when your device supports it');
    expect(refs.disclosure.textContent).not.toMatch(/\bsaves\b|\bsaved\b/);
  });

  it('tolerates a boot with no disclosure ref', () => {
    installEnv({ clipboard: () => {} });
    expect(() => initPairShareUI({ btn: makeEl('button'), status: makeEl('p') }, { getRelation: () => null })).not.toThrow();
  });

  it('the disclosure copy is a pure function of capability — independently testable', () => {
    expect(pairImprintDisclosureText(true)).toBe(
      'created on this device · personal details excluded · shares directly when your device supports it, otherwise downloads it as an image',
    );
    expect(pairImprintDisclosureText(false)).toBe(
      'created on this device · personal details excluded · downloads the pair imprint as an image to this device',
    );
  });

  it('method presence alone is never enough to claim a share will succeed — the wording never says "will" or an unconditional "shares"', () => {
    const text = pairImprintDisclosureText(true);
    expect(text).not.toMatch(/\bwill share\b/i);
    // "shares directly WHEN..." is conditional; a bare "shares the pair
    // imprint directly" with nothing after it would be the overclaim this
    // rewrite exists to remove.
    expect(text).not.toMatch(/directly\.?$/);
  });
});

describe('P1-2 — identity is re-checked after EVERY async boundary, including resolved AND rejected share/clipboard', () => {
  it('fourth-gate item 1: a relation replaced while awaiting navigator.share (RESOLVED) reports "selected pair shared", never a bare "shared" AND never a false "stale"', async () => {
    let relation = VALID_RELATION;
    let releaseShare;
    installEnv({
      canShare: () => true,
      share: () => new Promise(resolve => { releaseShare = resolve; }),
    });
    const { refs, controller } = await boot(() => relation);
    const pending = clickShare(refs);
    relation = adversarialRelation({ elementDirectionAB: 'A · fire → B · water · generating' });
    controller.notifyRelationChange(relation); // Compare Another landed a new pair mid-share
    releaseShare(undefined); // the OLD share resolves successfully...
    await pending;
    // ...it must never be reported as an unqualified `shared` for a pair
    // that is no longer current (that would be ambiguous: did it share
    // the pair now on screen, or not?) — but it ALSO must never be
    // reported as `stale`, which would falsely imply nothing happened. A
    // real platform share completed; it is reported as concerning the
    // pair SELECTED at click time (a CONFIRMED change, in this test).
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('shared'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('stale'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('failed'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared-selected'));
    expect(refs.status.textContent).toBe('selected pair shared.');
  });

  // Sixth remediation gate, item 2: the SAME `shared-selected` state, but
  // reached via an UNCONFIRMED post-effect read (getRelation() throws on
  // the re-check) rather than a confirmed change — the defect this gate
  // fixes is that the fourth/fifth gates named this outcome "previous pair"
  // even when nothing proved the pair had actually changed. A throw proves
  // only that currency is unknown, never that it changed — "selected" is
  // truthful either way, which is exactly why both verdicts share one state.
  it('sixth-gate item 2: a getRelation() hook that THROWS on the post-share identity re-check ALSO reports "selected pair shared" — an unknown read is never "previous", never a false "stale", never a false "failed"', async () => {
    let calls = 0;
    let releaseShare;
    installEnv({
      canShare: () => true,
      share: () => new Promise(resolve => { releaseShare = resolve; }),
    });
    const getRelation = () => {
      calls++;
      // boot's prerender read, the click's own initial read, and (tenth/
      // eleventh/twelfth remediation gates) trySyncNativeShare's own SIX
      // preparatory rechecks (after safeNavigator(); after reading the
      // File getter AND after constructing it — two distinct boundaries;
      // after reading the canShare getter AND after invoking it — two more
      // distinct boundaries; after reading the share getter) must all
      // still see the valid relation so share() is genuinely invoked — the
      // hook only breaks starting at the POST-SHARE recheck this test
      // targets.
      if (calls <= 8) return VALID_RELATION;
      throw new Error('hook broke after the share resolved — currency is UNKNOWN, not confirmed changed');
    };
    const { refs } = await boot(getRelation);
    const pending = clickShare(refs);
    releaseShare(undefined);
    await pending;
    expect(calls).toBeGreaterThanOrEqual(9);
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('shared'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('stale'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('failed'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared-selected'));
    expect(refs.status.textContent).toBe('selected pair shared.');
  });

  it('a relation replaced while awaiting navigator.share (REJECTED, non-Abort) never reports "downloaded" for the old pair', async () => {
    let relation = VALID_RELATION;
    let rejectShare;
    installEnv({
      canShare: () => true,
      share: () => new Promise((_, reject) => { rejectShare = reject; }),
      clipboard: () => {},
    });
    const { refs, controller } = await boot(() => relation);
    const pending = clickShare(refs);
    relation = null; // Back / close landed mid-share
    controller.notifyRelationChange(relation);
    rejectShare(new Error('boom'));
    await pending;
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('AbortError still reports "cancelled" when the pair is UNCHANGED — the identity check does not false-positive on a legitimate cancel', async () => {
    const abort = new Error('cancelled by user');
    abort.name = 'AbortError';
    installEnv({ canShare: () => true, share: () => { throw abort; } });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('cancelled'));
  });

  it('fourth-gate item 1: a relation replaced while awaiting clipboard.writeText (RESOLVED) reports the download AND the copy, explicitly naming the selected pair — never a bare claim and never a false "stale"/"failed"', async () => {
    let relation = VALID_RELATION;
    let releaseCopy;
    installEnv({
      clipboard: () => new Promise(resolve => { releaseCopy = resolve; }),
    });
    const { refs, controller } = await boot(() => relation);
    const pending = clickShare(refs); // download fires synchronously; clipboard write is the pending await
    relation = adversarialRelation({ elementDirectionAB: 'A · fire → B · water · generating' });
    controller.notifyRelationChange(relation);
    releaseCopy(undefined);
    await pending;
    // The download AND the copy both genuinely happened (synchronous
    // download, then a clipboard write that resolved before identity was
    // found to have changed) — reporting `stale`/`failed` here would
    // falsely imply no download was started, and a bare "download started ·
    // caption copied." would ambiguously imply it concerns the pair now
    // on screen. Both real effects are reported, explicitly named as
    // concerning the pair SELECTED at click time (a CONFIRMED change here).
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('download-started-copied'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('download-started'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('stale'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('failed'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-selected-copied'));
    expect(refs.status.textContent).toBe('download started for selected pair · caption copied.');
  });

  // Sixth remediation gate, item 2: the SAME `download-started-selected-
  // copied` state, but reached via an UNCONFIRMED post-effect read
  // (getRelation() throws on the clipboard-step re-check) rather than a
  // confirmed change. A throw proves only that currency is unknown; it
  // must land on the identical truthful "selected pair" wording as a
  // confirmed change, never "previous", never "failed" (the download and
  // the copy both genuinely happened — a read failure afterward doesn't
  // erase either), and never a bare unqualified claim.
  it('sixth-gate item 2: a getRelation() hook that THROWS on the clipboard-step re-check ALSO reports "download started for selected pair · caption copied" — an unknown read is never "previous"', async () => {
    let calls = 0;
    let releaseCopy;
    installEnv({
      clipboard: () => new Promise(resolve => { releaseCopy = resolve; }),
    });
    const getRelation = () => {
      calls++;
      // boot's prerender read, the click's own initial read,
      // trySyncNativeShare's own SIX preparatory rechecks (after
      // safeNavigator(); after the File getter AND after constructing it;
      // after the canShare getter AND after invoking it -- no canShare
      // configured, so it never reaches the share-getter recheck and
      // returns not-attempted after those six), the precheck immediately
      // before the anchor click, and (fourteenth remediation gate) the
      // THREE separate post-download boundary checks -- after safeNavigator(),
      // after the clipboard getter, and after the writeText getter -- all
      // TWELVE must still see the valid relation so the clipboard write is
      // genuinely invoked (assigning releaseCopy); the hook only breaks
      // starting at the POST-write recheck this test targets, exactly
      // matching its own title ("clipboard-STEP" — the await, not any
      // pre-invoke gate).
      if (calls <= 12) return VALID_RELATION;
      throw new Error('hook broke after the download fired — currency is UNKNOWN, not confirmed changed');
    };
    const { refs } = await boot(getRelation);
    const pending = clickShare(refs); // download fires synchronously; clipboard write is the pending await
    releaseCopy(undefined);
    await pending;
    expect(calls).toBeGreaterThanOrEqual(13);
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('download-started-copied'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('stale'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('failed'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-selected-copied'));
    expect(refs.status.textContent).toBe('download started for selected pair · caption copied.');
  });

  it('fourth-gate item 1: a relation replaced while awaiting clipboard.writeText (REJECTED) reports the download alone, explicitly naming the selected pair — never a false "failed"/"stale" and never a false copy claim', async () => {
    let relation = VALID_RELATION;
    let rejectCopy;
    installEnv({
      clipboard: () => new Promise((_, reject) => { rejectCopy = reject; }),
    });
    const { refs, controller } = await boot(() => relation);
    const pending = clickShare(refs);
    relation = null;
    controller.notifyRelationChange(relation);
    rejectCopy(new Error('denied'));
    await pending;
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('download-started-selected-copied'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-selected'));
    expect(refs.status.textContent).toBe('download started for selected pair.');
  });

  it('an UNCHANGED relation across every async boundary completes normally — the guard does not false-positive', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const { refs } = await boot(() => VALID_RELATION); // same reference every call
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
  });

  it('an UNCHANGED relation across the clipboard await reports the ordinary current-pair copied state, not a "selected pair" qualifier', async () => {
    installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
    expect(refs.status.textContent).not.toContain('selected');
    expect(refs.status.textContent).not.toContain('previous');
  });

  it('fourth-gate item 1: closing/retiring the controller (not just replacing the pair) while a native share resolves SUPPRESSES the announcement entirely — never a leaked "shared"/"selected pair" onto a new owner\'s refs', async () => {
    let releaseShare;
    installEnv({
      canShare: () => true,
      share: () => new Promise(resolve => { releaseShare = resolve; }),
    });
    const { refs: oldRefs } = await boot(() => VALID_RELATION);
    const pending = clickShare(oldRefs);
    // A re-init (e.g. the dyad screen closing and a fresh controller taking
    // over the SAME or different DOM) retires the old controller entirely
    // — a stronger invalidation than a mere relation replacement.
    const { refs: newRefs } = await boot(() => VALID_RELATION);
    releaseShare(undefined);
    await pending;
    // Nothing is written to the OLD controller's own refs once retired —
    // not `shared`, not `shared-selected`, nothing.
    expect(oldRefs.status.textContent).toBe('');
    expect(oldRefs.status.hidden).toBe(true);
    // And definitely nothing leaks onto the NEW controller's refs either.
    expect(newRefs.status.textContent).toBe('');
  });

  it('fourth-gate item 1: closing/retiring the controller while a download\'s clipboard step resolves SUPPRESSES the announcement — the download itself already fired (unavoidable), but nothing further is written anywhere', async () => {
    let releaseCopy;
    installEnv({
      clipboard: () => new Promise(resolve => { releaseCopy = resolve; }),
    });
    const { refs: oldRefs } = await boot(() => VALID_RELATION);
    const pending = clickShare(oldRefs); // download fires synchronously
    const { refs: newRefs } = await boot(() => VALID_RELATION);
    releaseCopy(undefined);
    await pending;
    expect(oldRefs.status.textContent).toBe('');
    expect(newRefs.status.textContent).toBe('');
  });
});

describe('P1-3 — controller-local isolation: a retired controller\'s completion cannot touch new refs or admit a third operation', () => {
  it('DIFFERENT-refs re-init: an in-flight operation on a RETIRED controller never writes status/busy into the NEW controller\'s refs', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const { refs: refsOld, controller: oldController } = await boot(() => VALID_RELATION, { prerender: false });
    oldController.notifyRelationChange(VALID_RELATION); // old controller's OWN pre-render, deliberately held
    // The pre-render itself (still the ACTIVE controller at this point) is
    // real, truthful state — busy/disabled/"preparing…" on its own refs.
    expect(refsOld.btn.disabled).toBe(true);
    expect(refsOld.status.textContent).toBe(pairShareStatusMessage('busy'));
    // Re-init BEFORE the old controller's rasterization ever settles.
    // Item 2: retirement now RELINQUISHES the old controller's own refs —
    // even though these two boots use different ref objects here (the
    // "same-node" battery below covers the shared-ref case explicitly),
    // resetControllerDOM() runs against whatever refs the retiring
    // controller held, unconditionally.
    const { refs: refsNew, controller: newController } = await boot(() => VALID_RELATION, { prerender: false });
    expect(log.pendingImages).toHaveLength(1); // only the OLD controller's render was ever started
    expect(refsOld.status.textContent).toBe(''); // relinquished at the moment of retirement, not left showing "busy"
    expect(refsOld.btn.disabled).toBe(false);
    log.pendingImages[0](); // release the old, now-retired, rasterization
    await Promise.resolve();
    await Promise.resolve();
    // The retired controller's own async tail STILL writes nothing further
    // to its refs once released (the "only the current token may write"
    // rule) — the relinquished idle state above is untouched by its later
    // completion.
    expect(refsOld.status.textContent).toBe('');
    expect(refsOld.btn.disabled).toBe(false);
    // The NEW controller's refs are entirely unaffected by the old
    // controller's completion — no status, no busy toggle it didn't itself
    // request.
    expect(refsNew.status.textContent).toBe('');
    expect(refsNew.btn.disabled).toBe(false);
  });

  it('old AND new deferred rasterizations resolving out of order never cross-contaminate refs or admit a third operation', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const { refs: refsOld, controller: oldController } = await boot(() => VALID_RELATION, { prerender: false });
    oldController.notifyRelationChange(VALID_RELATION);
    const oldClick = clickShare(refsOld); // the old controller's click starts its OWN render (no cache yet)
    expect(log.pendingImages.length).toBeGreaterThanOrEqual(1);

    const { refs: refsNew, controller: newController } = await boot(() => VALID_RELATION, { prerender: false });
    newController.notifyRelationChange(VALID_RELATION);
    const newClick = clickShare(refsNew);
    const totalPending = log.pendingImages.length;
    expect(totalPending).toBeGreaterThanOrEqual(2); // both controllers' renders are independently in flight

    // Release the NEW controller's rasterization(s) first, then the old
    // one's — deliberately out of order, to prove completion order cannot
    // let a retired operation land on live refs or open a slot for a third
    // click neither controller authorized.
    for (let i = totalPending - 1; i >= 0; i--) log.pendingImages[i]();
    await Promise.all([oldClick, newClick]);

    // The OLD controller is retired — its own click's outcome may land on
    // ITS OWN refs (that operation was its own, not cross-contamination),
    // but it must never appear on the NEW controller's refs.
    expect(refsNew.status.textContent).not.toBe('');
    expect(log.anchors.length).toBeLessThanOrEqual(2); // never more than one download per controller's one click
  });
});

// Eighth remediation gate: corrected — index.html calls initPairShareUI()
// exactly ONCE at boot (pinned above: "index.html wires initPairShareUI
// exactly once"), not on every dyad-screen open; the Pair screen opening and
// closing repeatedly drives notifyRelationChange(), never a re-init. The
// SAME static `#dyad-share-btn` / `#dyad-share-status` DOM nodes being
// reused across a re-init is still a real, defensively-tested shape of this
// module's controller architecture (a hot-reload, or any future wiring
// change that calls initPairShareUI more than once against the same
// injected markup) — exercised here for that reason, not because current
// production code re-initializes per open.
function bootSameRefs(refs, getRelation, { prerender = true } = {}) {
  const controller = initPairShareUI(refs, { getRelation });
  if (prerender) controller.notifyRelationChange(getRelation());
  return controller;
}

describe('item 2 — same-node re-init lifecycle: the SAME button/status pair is reused across re-inits', () => {
  it('re-init during a held prerender: the shared button re-enables immediately, not left stuck disabled for the new controller', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    const oldController = bootSameRefs(refs, () => VALID_RELATION, { prerender: false });
    oldController.notifyRelationChange(VALID_RELATION);
    expect(refs.btn.disabled).toBe(true);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));

    // Re-init against the SAME refs while that render is still pending.
    const newController = bootSameRefs(refs, () => VALID_RELATION, { prerender: false });
    expect(refs.btn.disabled).toBe(false); // relinquished, not inherited stuck-busy
    expect(refs.status.textContent).toBe('');

    log.pendingImages[0](); // the old, retired render finally settles
    await Promise.resolve();
    await Promise.resolve();
    // The old controller's settled render must not re-disable/re-busy the
    // shared button out from under the new controller's idle state.
    expect(refs.btn.disabled).toBe(false);
    expect(refs.status.textContent).toBe('');
  });

  it('re-init DURING a click: the in-flight old click cannot leave the shared button disabled forever once retired', async () => {
    const log = installEnv({ imageDefer: true, canShare: () => true, share: () => undefined, clipboard: () => {} });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    bootSameRefs(refs, () => VALID_RELATION, { prerender: false });
    const oldClick = clickShare(refs); // starts its own render (no cache) — busy set synchronously
    expect(refs.btn.disabled).toBe(true);

    // Re-init against the SAME refs mid-click.
    bootSameRefs(refs, () => VALID_RELATION, { prerender: false });
    expect(refs.btn.disabled).toBe(false); // the new controller's clean idle state, not the old click's busy

    log.pendingImages[0]();
    await oldClick;
    // The old (retired) click's own completion must not re-disable the
    // button the new controller now owns.
    expect(refs.btn.disabled).toBe(false);
  });

  it('an ARMED old terminal-status timer, followed by re-init and a fresh status: the old timer cannot later hide the NEW status', async () => {
    installEnv({ clipboard: () => {} });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    const oldController = bootSameRefs(refs, () => VALID_RELATION);
    await oldController.onShareClick(); // completes, arms a 4s auto-hide timer on the SHARED status node
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));

    // Re-init against the SAME refs before that timer fires — item 2:
    // retirement must cancel the OLD armed timer, or it would later fire
    // and hide whatever the NEW controller has since written.
    bootSameRefs(refs, () => null, { prerender: false });
    expect(refs.status.textContent).toBe(''); // relinquished by the reset, not left showing the old terminal text
    refs.status.textContent = 'a status the new controller just wrote';
    refs.status.hidden = false;

    vi.advanceTimersByTime(4000); // when the OLD timer WOULD have fired, had it not been cancelled
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe('a status the new controller just wrote');
  });

  it('listener singularity: only ONE click listener is ever active on a reused button, never a second accumulating', async () => {
    installEnv({ clipboard: () => {} });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    bootSameRefs(refs, () => VALID_RELATION);
    bootSameRefs(refs, () => VALID_RELATION);
    bootSameRefs(refs, () => VALID_RELATION);
    // makeEl's addEventListener overwrites its single `handlers[ev]` slot —
    // a real accumulation bug (multiple listeners) would fire the click
    // handler multiple times per physical click, which this harness can't
    // directly count; what IS directly provable is that each re-init
    // detached the PRIOR listener before attaching its own, so _fire only
    // ever invokes the CURRENT controller's handler, never a defunct one
    // racing it.
    let fireCount = 0;
    const originalFire = refs.btn._fire.bind(refs.btn);
    refs.btn._fire = (...args) => { fireCount++; return originalFire(...args); };
    await clickShare(refs);
    expect(fireCount).toBe(1); // the mock's own handler slot is singular by construction — one call in, one handler run
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('out-of-order completion on the SAME refs: an old click resolving AFTER a new click starts never corrupts the new one\'s result', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    const oldController = bootSameRefs(refs, () => VALID_RELATION, { prerender: false });
    oldController.notifyRelationChange(VALID_RELATION);
    log.pendingImages[0]();
    await Promise.resolve();
    await Promise.resolve(); // old controller's cache is now warm

    const oldClick = oldController.onShareClick(); // fast path — no NEW image, uses the warm cache
    // Re-init on the SAME refs while the old controller's click is still
    // awaiting its download/clipboard tail.
    const newController = bootSameRefs(refs, () => VALID_RELATION, { prerender: false });
    await oldClick; // the OLD, now-retired click's own tail finishes...
    // ...but it must not have written into the state the NEW controller
    // will show for ITS OWN next click.
    const newClick = newController.onShareClick();
    expect(log.pendingImages.length).toBeGreaterThanOrEqual(2); // the new controller had no cache and rendered fresh
    log.pendingImages[log.pendingImages.length - 1]();
    await newClick;
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });
});

describe('P1-1 — File construction failure or absence ALWAYS continues to the on-device download, never "failed"', () => {
  it('a throwing File constructor falls through to the REAL download side effect — an anchor actually fires, not just a resolved promise', async () => {
    const log = installEnv({ clipboard: () => {} });
    globalThis.File = class { constructor() { throw new Error('no File here'); } };
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1); // the actual anchor/download side effect, not merely a settled promise
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('File entirely absent from the global scope (not just throwing) also falls through to a real download', async () => {
    const log = installEnv({ clipboard: () => {} });
    delete globalThis.File;
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('a truly absent `navigator` object entirely still produces a real download, not a crash', async () => {
    const log = installEnv({ clipboard: () => {} });
    const savedDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true, writable: true });
    try {
      const { refs } = await boot(() => VALID_RELATION);
      await clickShare(refs);
      expect(log.anchors).toHaveLength(1); // the real side effect, not just a resolved promise
      expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
    } finally {
      if (savedDescriptor) Object.defineProperty(globalThis, 'navigator', savedDescriptor);
    }
  });
});

describe('A3 / P2 hook truth — every capability is contained independently; a broken hook is FAILED, not empty', () => {
  it('a throwing canShare falls back to download rather than propagating', async () => {
    const log = installEnv({ clipboard: () => {} });
    globalThis.navigator.canShare = () => { throw new Error('canShare exploded'); };
    globalThis.navigator.share = async () => undefined;
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('canShare is evaluated with the EXACT payload navigator.share receives (files AND text), not a narrower one', async () => {
    let seenPayload = null;
    installEnv({
      canShare: payload => { seenPayload = payload; return true; },
      share: () => undefined,
    });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(seenPayload).toHaveProperty('files');
    expect(seenPayload).toHaveProperty('text');
    expect(typeof seenPayload.text).toBe('string');
    expect(seenPayload.text.length).toBeGreaterThan(0);
  });

  it('eleventh remediation gate, B2: a throwing anchor.click() was genuinely INVOKED (crossed the irreversible boundary) — settles to "download-started", never "failed", and never attempts clipboard on top of it', async () => {
    // Corrected from a prior gate's expectation: `a.click()` throwing does
    // NOT mean nothing happened -- some hostile/broken environments could
    // throw AFTER dispatching the click event, and this module cannot
    // prove otherwise. Reporting `failed` here would erase an
    // already-invoked, possibly-effective download; the clipboard step is
    // still skipped (too uncertain to layer a second host call on top of
    // an anchor that just misbehaved), which is the part of this test's
    // original claim that remains true.
    const log = installEnv({ clipboard: () => {}, clickThrows: true });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('failed'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('clipboard failure never invalidates an already-successful download', async () => {
    const log = installEnv({ clipboard: () => { throw new Error('denied'); } });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1); // the download still happened
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('a getRelation() hook that throws on the INITIAL click read settles to "failed" (a read failure), never "empty"', async () => {
    installEnv();
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    initPairShareUI(refs, { getRelation: () => { throw new Error('hook exploded'); } });
    // Second-gate P2 hook truth: a throwing hook is a READ FAILURE, distinct
    // from a legitimate "nothing to share yet" (a clean null return) — the
    // outcome is `failed`, and the promise must still resolve rather than
    // becoming an unhandled rejection.
    await expect(clickShare(refs)).resolves.toBeUndefined();
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });

  it('a getRelation() hook that answers once, then THROWS on the post-await identity re-check, settles to "failed" — never mistaken for "the pair changed"', async () => {
    let calls = 0;
    const log = installEnv({ imageDefer: true, canShare: () => true, share: () => undefined });
    const getRelation = () => {
      calls++;
      if (calls === 1) return VALID_RELATION; // the click's own initial read
      throw new Error('hook broke mid-flight'); // every re-check after that
    };
    const { refs, controller } = await boot(getRelation, { prerender: false });
    // notifyRelationChange takes the relation as a direct argument — it
    // never calls the hook itself — so this starts a (held) pre-render
    // without consuming a getRelation() call.
    controller.notifyRelationChange(VALID_RELATION);
    const pending = clickShare(refs); // consumes call #1 (VALID_RELATION), then awaits the held render
    expect(log.pendingImages).toHaveLength(1);
    log.pendingImages[0](); // release it — the click now reaches its post-await recheck, which is call #2 (throws)
    await pending;
    expect(calls).toBeGreaterThanOrEqual(2);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });
});

describe('P2 cleanup — svgToPngBlob and downloadBlob are idempotent and leak nothing on a throw', () => {
  it('appendChild throwing during download leaves no anchor and no leaked object URL, and settles truthfully', async () => {
    const log = installEnv({ clipboard: () => {}, appendThrows: true });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0);
    // The download's own object URL (created before appendChild is
    // attempted) must still be revoked rather than leaked.
    expect(log.revoked).toContain(log.created[log.created.length - 1]);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });

  it('anchor.remove() throwing after a successful click() does not flip an already-truthful download into "failed"', async () => {
    const log = installEnv({ clipboard: () => {}, removeThrows: true });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    // The download itself (click()) already fired — that is real user-
    // visible truth and must not be erased by a DOM-tidiness failure.
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('setTimeout throwing while scheduling the revoke still revokes immediately rather than leaking the object URL', async () => {
    const log = installEnv({ clipboard: () => {}, setTimeoutThrows: true });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    // No 1000ms wait needed — the URL was already revoked synchronously.
    expect(log.revoked).toContain(log.created[log.created.length - 1]);
  });

  it('rasterizer setup failure (canvas context throws) revokes the SVG source URL exactly once — no leak', async () => {
    const log = installEnv({ contextThrows: true, clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    expect(log.canvases).toHaveLength(0); // context throws before any canvas.toBlob call
    await clickShare(refs);
    expect(log.created).toHaveLength(1);
    expect(log.revoked).toHaveLength(1);
    expect(log.created).toEqual(log.revoked);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });

  it('toBlob returning null is treated as a render failure, not a silent success, and still revokes the source URL', async () => {
    const log = installEnv({ toBlob: 'null', clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0);
    expect(log.created).toEqual(log.revoked);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });
});

describe('A4 — the PNG footer clears the frame edge with a real margin', () => {
  it('the URL baseline sits comfortably above the frame\'s bottom edge — not 2px from it', () => {
    const clearance = FOOTER_LAYOUT.frameBottom - FOOTER_LAYOUT.urlBaselineY;
    // A conservative descent estimate for this font stack at this size —
    // the "y" in "netlify" is the glyph that actually clipped before.
    const estimatedDescent = FOOTER_LAYOUT.urlFontSize * 0.3;
    expect(clearance).toBeGreaterThan(estimatedDescent * 2); // real margin, not a coin-flip
  });

  it('the rendered SVG places the url text well inside the frame rect, not on top of its stroke', () => {
    const svg = buildPairImprintSVG(buildPairImprintSnapshot(adversarialRelation()));
    const frameMatch = svg.match(/<rect x="48" y="48" width="\d+" height="(\d+)"/);
    const urlMatch = svg.match(/y="(\d+)"[^>]*>the-eight-ball\.netlify\.app</);
    expect(frameMatch).toBeTruthy();
    expect(urlMatch).toBeTruthy();
    const frameBottom = 48 + Number(frameMatch[1]);
    const urlY = Number(urlMatch[1]);
    expect(frameBottom - urlY).toBeGreaterThan(20);
  });
});

// ── eighth remediation gate ─────────────────────────────────────────────
// A second independent capability audit found: (1) navigator/share/
// canShare/clipboard/writeText were read as bare property accesses, so a
// hostile getter on any of them threw straight through this module instead
// of degrading like an absent one; (2) a DIRECT SYNCHRONOUS AbortError from
// navigator.share (some platforms throw rather than reject) fell through
// the generic catch-all as "not attempted" and silently fell back to a
// download, when it should report `cancelled` with zero fallback, exactly
// like an async-rejected AbortError already does; (3) `error.name` was read
// bare when classifying a rejection, so a hostile `.name` getter could
// escape the catch block and erase the fallback download entirely; (4) a
// callable share/writeText that returns a non-promise was awaited as if it
// were a genuine async operation, when `await nonThenable` resolves
// immediately rather than throwing — silently misreporting a share/copy as
// successful; (5) `buildPairImprintSnapshot`'s field reads and String()
// coercions were unguarded. All installEnv() navigator mocks elsewhere in
// this file wrap share/writeText in a real `async` function, which always
// returns a genuine Promise regardless of what the inner callback returns —
// so none of the existing tests above could ever exercise these paths; the
// tests below construct `navigator` directly for that reason.
describe('eighth remediation gate — hostile navigator/share/canShare/clipboard/writeText accessor containment', () => {
  function setNavigator(nav) {
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  }

  it('a navigator global that throws on GET degrades to the plain download fallback — no unhandled throw, a truthful terminal status', async () => {
    const log = installEnv({ clipboard: () => {} });
    Object.defineProperty(globalThis, 'navigator', { get() { throw new Error('hostile navigator'); }, configurable: true });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await expect(clickShare(refs)).resolves.not.toThrow();
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('a throwing navigator.canShare getter degrades to the download fallback, never an uncaught throw', async () => {
    const log = installEnv();
    const nav = {};
    Object.defineProperty(nav, 'canShare', { get() { throw new Error('hostile canShare'); }, configurable: true });
    setNavigator(nav);
    // prerender:true (default) — a native share attempt is only ever
    // possible when the blob was pre-warmed BEFORE the click (P1-4,
    // transient-activation preservation); a fresh on-click render never
    // attempts share at all, which would make this test pass for the wrong
    // reason (never reaching trySyncNativeShare in the first place).
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('a throwing navigator.share getter degrades to the download fallback', async () => {
    const log = installEnv();
    const nav = { canShare: () => true };
    Object.defineProperty(nav, 'share', { get() { throw new Error('hostile share'); }, configurable: true });
    setNavigator(nav);
    const { refs } = await boot(() => VALID_RELATION); // prerender:true, see above
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('a throwing navigator.clipboard getter degrades to download-started with no copy — the already-true download is never erased', async () => {
    const log = installEnv();
    const nav = {};
    Object.defineProperty(nav, 'clipboard', { get() { throw new Error('hostile clipboard'); }, configurable: true });
    setNavigator(nav);
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await expect(clickShare(refs)).resolves.not.toThrow();
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('a throwing navigator.clipboard.writeText getter degrades to download-started with no copy', async () => {
    const log = installEnv();
    const clipboardObj = {};
    Object.defineProperty(clipboardObj, 'writeText', { get() { throw new Error('hostile writeText'); }, configurable: true });
    setNavigator({ clipboard: clipboardObj });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await expect(clickShare(refs)).resolves.not.toThrow();
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('navigator.canShare and navigator.share are invoked with `this` bound to the real navigator object (receiver-sensitive)', async () => {
    installEnv();
    let canShareThis = null, shareThis = null;
    const nav = {
      canShare() { canShareThis = this; return true; },
      share() { shareThis = this; return Promise.resolve(); },
    };
    setNavigator(nav);
    const { refs } = await boot(() => VALID_RELATION); // prerender:true — the blob must be pre-warmed, or a fresh on-click render never attempts native share at all (P1-4)
    await clickShare(refs);
    expect(canShareThis).toBe(nav);
    expect(shareThis).toBe(nav);
  });

  it('navigator.clipboard.writeText is invoked with `this` bound to the real navigator.clipboard object (receiver-sensitive)', async () => {
    installEnv();
    let writeTextThis = null;
    const clipboardObj = { writeText() { writeTextThis = this; return Promise.resolve(); } };
    setNavigator({ clipboard: clipboardObj });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await clickShare(refs);
    expect(writeTextThis).toBe(clipboardObj);
  });
});

describe('eighth remediation gate — sync AbortError, hostile error.name, and non-thenable share/writeText returns', () => {
  function setNavigator(nav) {
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  }

  it('a DIRECT SYNCHRONOUS AbortError thrown by navigator.share (not a rejection) is classified cancelled — zero fallback download, zero clipboard', async () => {
    const log = installEnv();
    const abort = new Error('sync abort');
    abort.name = 'AbortError';
    setNavigator({ canShare: () => true, share() { throw abort; } });
    const { refs } = await boot(() => VALID_RELATION); // prerender:true — must reach trySyncNativeShare
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0);
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('cancelled'));
  });

  it('a direct synchronous NON-AbortError thrown by navigator.share still falls back to download (old async-only wrapper hid this exact path)', async () => {
    const log = installEnv();
    setNavigator({ canShare: () => true, share() { throw new Error('sync boom, not abort'); } });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('a rejected share promise whose error.name getter throws does not escape or erase the fallback — one download fires, a truthful terminal status', async () => {
    const log = installEnv();
    const hostileErr = {};
    Object.defineProperty(hostileErr, 'name', { get() { throw new Error('hostile name'); }, configurable: true });
    setNavigator({ canShare: () => true, share: () => Promise.reject(hostileErr) });
    const { refs } = await boot(() => VALID_RELATION);
    await expect(clickShare(refs)).resolves.not.toThrow();
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('navigator.share returning a plain non-promise value is not awaited as a successful share — falls back to download instead', async () => {
    const log = installEnv();
    setNavigator({ canShare: () => true, share: () => 'not a promise' });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });

  it('navigator.share returning an object whose .then getter throws is treated as non-thenable, not a hung/successful share — falls back to download', async () => {
    const log = installEnv();
    const hostileThenable = {};
    Object.defineProperty(hostileThenable, 'then', { get() { throw new Error('hostile then'); }, configurable: true });
    setNavigator({ canShare: () => true, share: () => hostileThenable });
    const { refs } = await boot(() => VALID_RELATION);
    await expect(clickShare(refs)).resolves.not.toThrow();
    expect(log.anchors).toHaveLength(1);
  });

  it('navigator.clipboard.writeText returning a plain non-promise value retains download-started WITHOUT the falsely-earned "-copied" suffix', async () => {
    const log = installEnv();
    setNavigator({ clipboard: { writeText: () => 'not a promise' } });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started'));
  });
});

describe('eighth remediation gate — buildPairImprintSnapshot poison-field containment', () => {
  // formattedRelation is produced entirely by ui/dyad.js's own
  // formatDyadRelation() in normal operation, never user-controlled
  // directly — narrow, evidence-backed disposition: these tests exist as
  // defense-in-depth for the hook boundary (readRelation's own contract
  // already treats a throwing hooks.getRelation() as a distinct read
  // failure), not because a poisoned relation is reachable through any
  // current production input.
  it('a relation object with a throwing elementDirectionAB getter degrades to null, never an uncaught throw', () => {
    const relation = { numerologySpine: '4 + 7', cardPairHead: 'no. i' };
    Object.defineProperty(relation, 'elementDirectionAB', { get() { throw new Error('poison'); }, configurable: true });
    expect(() => buildPairImprintSnapshot(relation)).not.toThrow();
    expect(buildPairImprintSnapshot(relation)).toBeNull();
  });

  it('a relation field whose String() coercion throws (a poisoned toString) degrades to null, never an uncaught throw', () => {
    const poison = { toString() { throw new Error('poison toString'); } };
    const relation = { elementDirectionAB: poison, numerologySpine: '4 + 7', cardPairHead: 'no. i' };
    expect(() => buildPairImprintSnapshot(relation)).not.toThrow();
    expect(buildPairImprintSnapshot(relation)).toBeNull();
  });

  it('reaches onShareClick end to end with a poisoned relation field: status reads "empty", never an unhandled rejection', async () => {
    installEnv();
    const poison = { toString() { throw new Error('poison'); } };
    const relation = { elementDirectionAB: poison, numerologySpine: '4 + 7', cardPairHead: 'no. i' };
    const { refs } = await boot(() => relation, { prerender: false });
    await expect(clickShare(refs)).resolves.not.toThrow();
    expect(refs.status.textContent).toBe(pairShareStatusMessage('empty'));
  });
});

describe('eighth remediation gate — opInFlight guards against a real double activation', () => {
  // Mutation-sensitivity of both tests below is verified by temporarily
  // neutering the `controller.opInFlight` guard at the top of onShareClick
  // (ui/pairShare.js) and re-running this file: both tests below fail as
  // expected (a second render/share genuinely starts) — the same
  // temporary-source-mutation-plus-revert technique this remediation series
  // already uses for its CSS contrast fixes, not left embedded in the test
  // itself since `boot()`'s `controller` is initPairShareUI's PUBLIC return
  // value ({onShareClick, notifyRelationChange}), not the internal state
  // object with `.opInFlight` — there is no live handle from test code to
  // reach into and flip that guard off for an in-test mutation assertion.
  it('a second click fired while the first is still mid-render (no cache yet) produces exactly ONE render/download', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    clickShare(refs); // first click starts; synchronously reaches the held render (opInFlight is now true)
    expect(log.pendingImages).toHaveLength(1);
    expect(refs.btn.disabled).toBe(true);
    clickShare(refs); // a genuine second activation while the first is still in flight — must be a no-op
    expect(log.pendingImages).toHaveLength(1); // no second rasterization was started
    log.pendingImages[0](); // release the one held render
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });

  it('a second click fired while navigator.share is still pending (cache pre-warmed) produces exactly ONE native-share invocation and exactly one terminal status', async () => {
    let resolveShare;
    const sharePromise = new Promise(res => { resolveShare = res; });
    let shareCallCount = 0;
    installEnv();
    Object.defineProperty(globalThis, 'navigator', {
      value: { canShare: () => true, share: () => { shareCallCount++; return sharePromise; } },
      configurable: true, writable: true,
    });
    const { refs } = await boot(() => VALID_RELATION); // prerender:true — blob pre-warmed before either click
    const p1 = clickShare(refs); // synchronously reaches and calls navigator.share() once, then awaits it
    expect(shareCallCount).toBe(1);
    expect(refs.btn.disabled).toBe(true);
    const p2 = clickShare(refs); // a genuine second activation while the share promise is still pending
    expect(shareCallCount).toBe(1); // the guard, not luck: no second invocation happened
    resolveShare();
    await p1; await p2;
    expect(shareCallCount).toBe(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
  });
});

// A second independent capability audit: syncBusyFromPrerender() ran
// unguarded the instant onShareClick's `finally` cleared opInFlight — if a
// background prerender for a NEWER pair (started via notifyRelationChange
// while the click's own operation was still in flight) was still pending at
// that moment, it overwrote the just-written truthful terminal status
// (shared-selected / stale / download-started[-selected][-copied]) with
// "preparing pair image…", then blanked it entirely once that prerender
// settled — the real result flashed away for a reason having nothing to do
// with the click's own outcome. Fixed in syncBusyFromPrerender: the button's
// disabled/aria-busy MAY still reflect the pending render, but the live
// status text is left alone while it is genuinely still showing a terminal
// result (`!el.hidden`).
describe('eighth remediation gate — async status ownership: a pending background prerender must not overwrite a just-completed click\'s terminal status', () => {
  const PAIR2 = adversarialRelation({
    elementDirectionAB: 'A · fire → B · earth', numerologySpine: '9 + 2 → 11', cardPairHead: 'no. ii × no. iii',
  });

  it('resolved native share: the terminal text survives a NEWER pair\'s prerender becoming pending during the finally block, and survives that prerender settling afterward too', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    let resolveShare;
    const sharePromise = new Promise(res => { resolveShare = res; });
    const log = installEnv({ imageDefer: true });
    Object.defineProperty(globalThis, 'navigator', {
      value: { canShare: () => true, share: () => sharePromise },
      configurable: true, writable: true,
    });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    const controller = initPairShareUI(refs, { getRelation });
    controller.notifyRelationChange(currentRelation); // pair1's prerender starts, held
    expect(log.pendingImages).toHaveLength(1);
    log.pendingImages[0](); // release pair1's render — it is genuinely warm before the click
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    const p1 = clickShare(refs); // cached-blob fast path: calls navigator.share() synchronously, then awaits it (held)
    expect(refs.btn.disabled).toBe(true);

    // While the share is still pending, the relation changes to PAIR2 and
    // its own prerender starts — held, so it stays pending through the
    // click's own settlement below.
    currentRelation = PAIR2;
    controller.notifyRelationChange(PAIR2);
    expect(log.pendingImages).toHaveLength(2);

    resolveShare(); // settle the OLD (pair1) share BEFORE releasing pair2's raster
    await p1;

    // The click's own truthful terminal result must be visible: the pair
    // changed underneath it (recheck() reads getRelation() -> PAIR2, not
    // the original reference), so postEffectStatus reports the SELECTED
    // variant — and it must not have been overwritten with "preparing pair
    // image…" by pair2's still-pending prerender settling opInFlight=false
    // in the same tick.
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared-selected'));

    // Release pair2's raster and confirm the SAME terminal remains — not
    // cleared to empty by the prerender's own settle-path in
    // syncBusyFromPrerender (which only ever clears ITS OWN "preparing…"
    // text, never a real terminal status a click already wrote).
    log.pendingImages[1]();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared-selected'));
    expect(refs.status.hidden).toBe(false);
  });

  it('download fallback path: the terminal text survives a NEWER pair\'s prerender becoming pending during the finally block', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    let resolveClipboard;
    const clipboardPromise = new Promise(res => { resolveClipboard = res; });
    const log = installEnv({ imageDefer: true });
    // No native share support — this click takes the fresh-render
    // download-only path (P1-4), which still exercises the exact same
    // finally -> syncBusyFromPrerender race the native-share test above
    // does. The clipboard write is held under manual control (not
    // installEnv's default async wrapper) so the relation can be changed
    // at the EXACT point that matters: after the download has genuinely
    // fired (P1-2's own pre-effect check would otherwise correctly report
    // `stale` if the relation changed before the render/download even
    // started, which is a different, already-covered contract) but before
    // downloadFallback's own post-clipboard recheck and the click's finally
    // block both run.
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText: () => clipboardPromise } },
      configurable: true, writable: true,
    });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    const controller = initPairShareUI(refs, { getRelation });
    const p1 = clickShare(refs); // no cache yet — the click renders fresh, held
    expect(log.pendingImages).toHaveLength(1);
    log.pendingImages[0](); // release the click's own render — relation is STILL unchanged here
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(log.anchors).toHaveLength(1); // the download has genuinely already fired

    // NOW the relation changes to a newer pair, and that pair's own
    // prerender starts — held, so it stays pending while the clipboard
    // write (and then the click's own finally block) settle below.
    currentRelation = PAIR2;
    controller.notifyRelationChange(PAIR2);
    expect(log.pendingImages).toHaveLength(2);

    resolveClipboard(); // settle the clipboard write
    await p1;

    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-selected-copied'));

    log.pendingImages[1](); // release the newer pair's still-pending prerender
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-selected-copied'));
    expect(refs.status.hidden).toBe(false);
  });
});

// Ninth remediation gate: a real, independently-audited defect distinct
// from the eighth gate's async-status-ownership fix above. That fix
// stopped a still-pending newer prerender from overwriting a just-written
// terminal status the INSTANT the click's own finally block ran. It did
// NOT cover the terminal status's own 4-SECOND AUTO-HIDE TIMER, which
// still unconditionally hid the status text on expiry — leaving a button
// that syncBusyFromPrerender correctly keeps disabled/aria-busy="true"
// (because a newer pair's render is genuinely still pending) with NO
// visible or live-announced explanation at all once that timer fired. The
// fix makes the timer callback check the SAME live state the finally-block
// fix already checks: if a prerender is still pending and no click owns
// busy right now, transition to a visible `busy` explanation instead of
// hiding; otherwise hide exactly as before.
describe('ninth remediation gate — the terminal status\'s own 4s auto-hide timer reconciles with a still-pending newer prerender', () => {
  const PAIR2 = adversarialRelation({
    elementDirectionAB: 'A · fire → B · earth', numerologySpine: '9 + 2 → 11', cardPairHead: 'no. ii × no. iii',
  });

  it('native share terminal: at the 4s mark, a still-pending newer prerender turns the status visibly busy instead of a blind hide; settling it cleans up', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ imageDefer: true, canShare: () => true, share: () => undefined });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    const controller = initPairShareUI(refs, { getRelation });
    controller.notifyRelationChange(currentRelation); // pair1 prerender, held
    expect(log.pendingImages).toHaveLength(1);
    log.pendingImages[0](); // release pair1's render
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    await clickShare(refs); // cached-blob fast path; navigator.share() resolves on the next microtask
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
    expect(refs.status.hidden).toBe(false);

    // A newer pair's prerender starts and stays pending through the
    // terminal status's own 4s window below.
    currentRelation = PAIR2;
    controller.notifyRelationChange(PAIR2);
    expect(log.pendingImages).toHaveLength(2);

    vi.advanceTimersByTime(4000); // the OLD terminal's own auto-hide timer fires here
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    expect(refs.btn.disabled).toBe(true);
    expect(refs.btn.attrs['aria-busy']).toBe('true');

    log.pendingImages[1](); // release pair2's still-pending render
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(refs.status.hidden).toBe(true);
    expect(refs.btn.disabled).toBe(false);
    expect(refs.btn.attrs['aria-busy']).toBe('false');
  });

  it('download-fallback terminal: the same 4s reconciliation applies when the terminal came from the download path, not native share', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ imageDefer: true, clipboard: () => {} }); // no native share support at all
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    const controller = initPairShareUI(refs, { getRelation });
    controller.notifyRelationChange(currentRelation);
    expect(log.pendingImages).toHaveLength(1);
    log.pendingImages[0]();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    await clickShare(refs); // cached-blob path; no share method -> falls straight to download+clipboard
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
    expect(refs.status.hidden).toBe(false);

    currentRelation = PAIR2;
    controller.notifyRelationChange(PAIR2);
    expect(log.pendingImages).toHaveLength(2);

    vi.advanceTimersByTime(4000);
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    expect(refs.btn.disabled).toBe(true);

    log.pendingImages[1]();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(refs.status.hidden).toBe(true);
    expect(refs.btn.disabled).toBe(false);
  });

  it('the ORDINARY case is unchanged: with nothing pending, the terminal status still hides normally at 4s', async () => {
    const log = installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION, { prerender: false });
    await clickShare(refs);
    expect(refs.status.hidden).toBe(false);
    vi.advanceTimersByTime(4000);
    expect(refs.status.hidden).toBe(true);
  });
});

// Tenth remediation gate: an independent exact-SHA probe against the exact
// code shape of this module found a real host-reentrancy gap. Every host-
// controlled capability lookup/call in this file (property getters,
// canShare/share invocations, thenable assimilation, clipboard lookups) is
// already contained against THROWING or returning a non-thenable — but
// none of that containment stops a well-behaved (non-throwing) call from
// carrying an arbitrary SIDE EFFECT that changes the relation identity
// mid-call. The specific gap: trySyncNativeShare() returning
// {attempted:false} after such a side effect fell straight through to
// downloadFallback() with zero identity recheck, downloading the OLD
// pair's blob and reporting an unqualified "download started." for a pair
// that was no longer on screen. Fixed with the same pre-effect checkpoint
// every other "before this pair's first irreversible action" moment in
// this file already uses.
describe('tenth remediation gate — a host-controlled call\'s SIDE EFFECT (not just a throw) must not let a stale pair download', () => {
  function setNavigator(nav) {
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  }
  const PAIR2 = adversarialRelation({
    elementDirectionAB: 'A · fire → B · earth', numerologySpine: '9 + 2 → 11', cardPairHead: 'no. ii × no. iii',
  });

  it('the exact probed scenario: navigator.canShare() switches the relation to pair 2 mid-call, then returns false — zero download, zero clipboard, status "stale"', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ clipboard: () => {} });
    setNavigator({
      canShare() { currentRelation = PAIR2; return false; }, // the hostile side effect, no throw
    });
    const { refs } = await boot(getRelation); // prerender:true — the blob is warm before the click
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0); // zero download — the pair changed before any irreversible action
    expect(log.copied).toHaveLength(0); // zero clipboard
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('canShare returns TRUE (a genuine yes) but its side effect already changed the relation — share must never be reached, zero download, "stale"', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ clipboard: () => {} });
    let shareCalls = 0;
    setNavigator({
      canShare() { currentRelation = PAIR2; return true; }, // a genuine "yes" — the side effect is the danger, not the answer
      share() { shareCalls++; return Promise.resolve(); }, // must never be reached
    });
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(shareCalls).toBe(0); // the recheck immediately after the canShare call must catch this before ever reading the share getter
    expect(log.anchors).toHaveLength(0);
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('canShare\'s side effect, with share never even reached (canShare itself declines too) — same zero-download, stale outcome', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ clipboard: () => {} });
    let shareCalls = 0;
    setNavigator({
      canShare() { currentRelation = PAIR2; return false; },
      share() { shareCalls++; return Promise.resolve(); }, // must never be reached
    });
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(shareCalls).toBe(0);
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('a DISTINCT boundary: canShare returns true with NO side effect, but reading the navigator.share PROPERTY GETTER itself changes the relation — the returned function must never be invoked', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ clipboard: () => {} });
    let shareCalls = 0;
    let getterReads = 0;
    const realShareFn = () => { shareCalls++; return Promise.resolve(); }; // must never be reached
    const nav = { canShare: () => true }; // genuinely current, no side effect
    Object.defineProperty(nav, 'share', {
      configurable: true,
      get() {
        getterReads++;
        // initPairShareUI's own boot-time detectShareCapability() does a
        // harmless `typeof navigator.share` read to choose disclosure copy —
        // that first read must stay inert so it doesn't pre-consume the
        // side effect before the click-time boundary this test targets.
        if (getterReads > 1) currentRelation = PAIR2; // the hostile side effect lives in the GETTER, not the call
        return realShareFn;
      },
    });
    setNavigator(nav);
    const { refs } = await boot(getRelation);
    expect(getterReads).toBe(1); // sanity: boot's capability probe already read it once, inertly
    await clickShare(refs);
    expect(shareCalls).toBe(0); // the getter fired again (that's how the side effect happened) but the function it returned never ran
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('a hostile capability lookup that makes the hook throw on the LATER recheck (unconfirmable, not confirmed-changed) reports "failed", not a false "stale" or an unqualified download', async () => {
    let calls = 0;
    const getRelation = () => {
      calls++;
      if (calls <= 2) return VALID_RELATION; // boot's prerender, the click's own initial read
      throw new Error('hook broke during the pre-download recheck');
    };
    const log = installEnv({ clipboard: () => {} });
    setNavigator({ canShare: () => false }); // no side effect this time, but the NEXT read (this fix's own recheck) throws
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });

  it('BLOCKER 3: a hostile URL.createObjectURL side effect BEFORE the click (a preparatory step, not the irreversible boundary) must produce ZERO anchor clicks and "stale" — not a downloaded old pair', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv(); // no clipboard support at all
    // prerender:true (default) warms the blob FIRST, through the real,
    // unhooked URL.createObjectURL -- svgToPngBlob's OWN internal call for
    // the SVG source is a SEPARATE host-controlled call site from
    // downloadBlob's later PNG call, and this test targets only the
    // latter (the actual download action's own createObjectURL), not the
    // former (rendering).
    const { refs } = await boot(getRelation);
    const realCreateObjectURL = globalThis.URL.createObjectURL;
    globalThis.URL.createObjectURL = (...args) => {
      currentRelation = PAIR2; // the hostile side effect, before the click
      globalThis.URL.createObjectURL = realCreateObjectURL; // one-shot -- only this call is hostile
      return realCreateObjectURL(...args);
    };
    await clickShare(refs); // cached-blob path: no native share configured, falls straight to download
    globalThis.URL.createObjectURL = realCreateObjectURL;
    // createObjectURL is PREPARATORY (fully reversible): the anchor is
    // still momentarily APPENDED (log.anchors tracks appendChild, not
    // click) before the precheck declines and downloadBlob removes it
    // again — the real signal that no download happened is clickCount
    // staying 0 and the anchor being cleaned back up, not the append log.
    expect(log.anchors).toHaveLength(1);
    expect(log.anchors[0].clickCount).toBe(0); // the actual irreversible action never fired
    expect(log.anchors[0].removeCount).toBe(1); // precheck-decline cleanup ran
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('BLOCKER 3 companion: a hostile side effect INSIDE anchor.click() itself is past the irreversible boundary — the download DID fire, reported as the SELECTED pair', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv();
    const { refs } = await boot(getRelation);
    const realCreateElement = globalThis.document.createElement;
    globalThis.document.createElement = (tag) => {
      const el = realCreateElement(tag);
      if (tag === 'a') {
        const realClick = el.click.bind(el);
        el.click = () => {
          currentRelation = PAIR2; // the hostile side effect, INSIDE the click itself
          globalThis.document.createElement = realCreateElement; // one-shot
          return realClick();
        };
      }
      return el;
    };
    await clickShare(refs);
    globalThis.document.createElement = realCreateElement;
    expect(log.anchors).toHaveLength(1); // the click genuinely fired -- irreversible, already happened
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-selected'));
  });

  it('a hostile side effect INSIDE the navigator.share() call itself (past the irreversible call boundary, already invoked) — genuinely shared, reported as the SELECTED pair', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    let shareCalls = 0;
    const log = installEnv({
      canShare: () => true,
      share: () => { shareCalls++; currentRelation = PAIR2; return undefined; }, // side effect INSIDE the call, not before it
    });
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(shareCalls).toBe(1); // the call genuinely happened -- already irreversible
    expect(log.anchors).toHaveLength(0); // share succeeded -- no download fallback
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared-selected'));
  });

  it('a hostile clipboard.writeText PROPERTY GETTER side effect (after the download already fired, before the copy is ever invoked) suppresses the copy — reported download-started-selected, never "-copied"', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv(); // no clipboard wired via the helper -- hand-wired below so the GETTER itself is the hostile step
    const { refs } = await boot(getRelation);
    let writeTextCalls = 0;
    const realWriteText = () => { writeTextCalls++; return Promise.resolve(); }; // must never be reached
    const clipboardObj = {};
    Object.defineProperty(clipboardObj, 'writeText', {
      configurable: true,
      get() {
        currentRelation = PAIR2; // the hostile side effect lives in the GETTER, not the call
        return realWriteText;
      },
    });
    globalThis.navigator.clipboard = clipboardObj;
    await clickShare(refs);
    expect(writeTextCalls).toBe(0);
    expect(log.anchors).toHaveLength(1); // the download already fired -- irreversible, unaffected by this later boundary
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-selected'));
  });

  it('a hostile side effect INSIDE the clipboard.writeText() call itself (past that boundary, already invoked) — genuinely copied, reported as the SELECTED pair', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({
      clipboard: () => { currentRelation = PAIR2; return undefined; }, // side effect INSIDE the write itself
    });
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(log.copied).toHaveLength(1); // the write genuinely happened -- already irreversible
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-selected-copied'));
  });
});

// Eleventh remediation gate: an independent capability audit found the
// tenth gate's own reentrancy fix incomplete in five further ways — every
// one fixed below, with an adversarial test proving it and (per the
// governing prompt) mutation-verified.
describe('eleventh remediation gate — the FIVE further hostile synchronous native-share/capability tails', () => {
  function setNavigator(nav) {
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  }
  const PAIR2 = adversarialRelation({
    elementDirectionAB: 'A · fire → B · earth', numerologySpine: '9 + 2 → 11', cardPairHead: 'no. ii × no. iii',
  });

  it('B4(a): navigator.share()\'s own CALL carries the side effect, then returns a non-thenable — never a synthesized "shared" claim for a share that plainly never resolved', async () => {
    // Twelfth remediation gate (pre-commit race addendum, item 3): a
    // malformed non-promise return means share() never genuinely resolved.
    // A prior draft synthesized an already-resolved promise here, producing
    // the false "selected pair shared." claim. Corrected: since identity
    // changed by the time this is discovered, the honest pre-effect `stale`
    // applies — never a stale download either.
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ clipboard: () => {} });
    let shareCalls = 0;
    setNavigator({
      canShare: () => true,
      share: () => { shareCalls++; currentRelation = PAIR2; return undefined; }, // side effect + non-thenable, both inside the call
    });
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(shareCalls).toBe(1); // the call genuinely happened
    expect(log.anchors).toHaveLength(0); // never falls back to downloading the now-stale pair
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).not.toContain('shared');
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('B4(b): navigator.share()\'s own CALL carries the side effect, then throws a non-Abort error — the identity change is caught HERE, not left for a later unrelated check to maybe notice', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv();
    setNavigator({
      canShare: () => true,
      share: () => { currentRelation = PAIR2; throw new Error('platform refused, not an AbortError'); },
    });
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0); // DOCTRINE: a native-share exception routes to download -- but never a STALE one
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('B4(c): the global File lookup/constructor carries a side effect — caught before canShare/share are ever reached', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const realFile = globalThis.File;
    globalThis.File = class extends realFile {
      constructor(...args) {
        currentRelation = PAIR2; // the hostile side effect, during construction, before super() touches anything observable
        super(...args);
      }
    };
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    globalThis.File = realFile;
    expect(log.shared).toHaveLength(0); // share() must never be reached
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('B4(d): the navigator ACCESSOR itself (not canShare/share) carries a side effect — caught before this module decides anything on the strength of it', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv(); // boot's own capability probe reads THIS harmless navigator
    const { refs } = await boot(getRelation);
    // Swap in the hostile accessor only AFTER boot — isolates the CLICK-time
    // safeNavigator() read as the only thing this getter can observe,
    // rather than also firing (inertly or not) during initPairShareUI's own
    // detectShareCapability() probe.
    const realNav = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      get() { currentRelation = PAIR2; return realNav; },
    });
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('B4(e): a hostile `.then` PROPERTY GETTER on the value navigator.share() returns changes identity while isThenable evaluates it — never a stale download, never a synthesized "shared" claim', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ clipboard: () => {} });
    const hostileResult = {};
    Object.defineProperty(hostileResult, 'then', {
      get() {
        currentRelation = PAIR2; // the hostile side effect lives in the GETTER
        return undefined; // lies about thenability -- isThenable sees this as false
      },
    });
    setNavigator({ canShare: () => true, share: () => hostileResult });
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0); // never downloads the now-stale pair on top of an invoked share() call
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).not.toContain('shared');
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('B4(e) companion: the SAME hostile `.then` getter, but identity is confirmed CURRENT at that exact moment — ordinary local-download fallback proceeds, unchanged', async () => {
    const getRelation = () => VALID_RELATION;
    const log = installEnv({ clipboard: () => {} });
    const hostileResult = {};
    let thenReads = 0;
    Object.defineProperty(hostileResult, 'then', {
      get() { thenReads++; return undefined; }, // no side effect this time -- genuinely malformed, nothing more
    });
    setNavigator({ canShare: () => true, share: () => hostileResult });
    const { refs } = await boot(getRelation);
    await clickShare(refs);
    expect(thenReads).toBeGreaterThanOrEqual(1);
    expect(log.anchors).toHaveLength(1); // identity was never in question -- the ordinary download fallback proceeds
    expect(refs.status.textContent).not.toContain('shared');
  });
});

describe('eleventh remediation gate, B5 — remaining download preparation/accessor tails', () => {
  function setNavigator(nav) {
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  }
  const PAIR2 = adversarialRelation({
    elementDirectionAB: 'A · wood → B · fire', numerologySpine: '4 + 5 → 9', cardPairHead: 'no. v × no. vii',
  });

  it('a hostile anchor.click PROPERTY GETTER changes identity BEFORE the click is ever invoked — zero clicks, "stale", never an unqualified download', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv(); // no canShare/share/clipboard -- straight to the download fallback
    const { refs } = await boot(getRelation);
    const realCreateElement = globalThis.document.createElement;
    globalThis.document.createElement = (tag) => {
      const el = realCreateElement(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'click', {
          configurable: true,
          get() {
            currentRelation = PAIR2; // the hostile side effect lives in the GETTER, not the call
            return () => { el.clickCount = (el.clickCount || 0) + 1; };
          },
        });
      }
      return el;
    };
    await clickShare(refs);
    globalThis.document.createElement = realCreateElement;
    expect(log.anchors).toHaveLength(1); // appendChild happened (preparatory, reversible)
    expect(log.anchors[0].clickCount || 0).toBe(0); // the returned function was extracted but NEVER invoked
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('an identity change DURING download preparation, followed by an UNRELATED preparatory throw, reports the confirmed "stale" — never masked by a blind "failed"', async () => {
    let currentRelation = VALID_RELATION;
    const getRelation = () => currentRelation;
    const log = installEnv({ appendThrows: true });
    const { refs } = await boot(getRelation);
    const realCreateObjectURL = globalThis.URL.createObjectURL;
    globalThis.URL.createObjectURL = (...args) => {
      currentRelation = PAIR2; // the side effect, BEFORE the (unrelated) appendChild throw below
      globalThis.URL.createObjectURL = realCreateObjectURL; // one-shot
      return realCreateObjectURL(...args);
    };
    await clickShare(refs); // appendChild throws (installEnv's appendThrows) -- a genuinely unrelated preparatory failure
    globalThis.URL.createObjectURL = realCreateObjectURL;
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('failed'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });
});

describe('eleventh remediation gate, addendum — recheck() re-verifies ownership AFTER the getRelation() hook call, not just before', () => {
  it('a hostile hook that re-initializes the SAME refs mid-recheck retires the calling controller — it must not continue to click a stale anchor', async () => {
    const log = installEnv(); // no canShare/share configured -- straight to the download fallback
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    let calls = 0;
    const getRelation = () => {
      calls++;
      if (calls === 3) {
        // Simulates a hostile host integration where READING the relation
        // triggers a synchronous re-render/re-init cycle on the SAME
        // refs — retiring the controller that is mid-recheck right now,
        // as a side effect of the very call it's making.
        initPairShareUI(refs, { getRelation: () => VALID_RELATION });
      }
      return VALID_RELATION;
    };
    const controller = initPairShareUI(refs, { getRelation });
    controller.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();
    await controller.onShareClick();
    // The FIRST controller was retired mid-flight by its own hook call —
    // without the post-hook-call ownership recheck, it would read the
    // hook's answer (the SAME relation reference) as 'current' and
    // proceed to click on refs it no longer owns.
    expect(log.anchors).toHaveLength(0);
  });
});

describe('eleventh remediation gate, B3 — setTimeout/clearTimeout are host-controlled too', () => {
  it('twelfth remediation gate: a hostile/re-entrant setTimeout that invokes its callback SYNCHRONOUSLY (before returning) must never hide the status or store a stale handle', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const realSetTimeout = globalThis.setTimeout;
    let refs, controller;
    try {
      globalThis.setTimeout = (fn, ms) => { fn(); return 77; }; // fires the callback BEFORE returning an id -- a genuine timer-semantics violation
      ({ refs, controller } = await boot(() => VALID_RELATION));
      await clickShare(refs);
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
    // The synchronous callback must have been a no-op (never hidden the
    // text, never reconciled to 'busy') -- the truthful terminal text is
    // left visible indefinitely, since no real 4-second wait ever happened.
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
    expect(refs.status.hidden).toBe(false);
    // No stale handle (77, or anything) was stored as this controller's
    // "current" timer -- confirmed by re-initializing on the same refs and
    // proving no throw/corruption follows from whatever bookkeeping this
    // controller was left in.
    const refs2 = { btn: refs.btn, status: refs.status, disclosure: refs.disclosure };
    expect(() => initPairShareUI(refs2, { getRelation: () => VALID_RELATION })).not.toThrow();
    void controller;
  });

  it('a throwing setTimeout GETTER must not turn a just-written truthful outcome into "failed"', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const realSetTimeout = globalThis.setTimeout;
    let refs;
    try {
      Object.defineProperty(globalThis, 'setTimeout', {
        configurable: true,
        get() { throw new Error('hostile setTimeout getter'); },
      });
      ({ refs } = await boot(() => VALID_RELATION));
      await clickShare(refs);
    } finally {
      Object.defineProperty(globalThis, 'setTimeout', { configurable: true, writable: true, value: realSetTimeout });
    }
    // navigator.share resolved for the current pair -- 'shared' -- and the
    // hostile setTimeout getter (arming the auto-hide timer) must not have
    // turned that truthful outcome into an uncaught rejection the outer
    // catch would report as 'failed'.
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
    expect(refs.status.hidden).toBe(false);
    void log;
  });

  it('a throwing setTimeout CALL must not turn a just-written truthful outcome into "failed"', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const realSetTimeout = globalThis.setTimeout;
    let refs;
    try {
      globalThis.setTimeout = () => { throw new Error('hostile setTimeout call'); };
      ({ refs } = await boot(() => VALID_RELATION));
      await clickShare(refs);
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
  });

  it('a throwing clearTimeout CALL must not abort controller re-init or a later status write', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const realClearTimeout = globalThis.clearTimeout;
    let refs;
    try {
      globalThis.clearTimeout = () => { throw new Error('hostile clearTimeout call'); };
      ({ refs } = await boot(() => VALID_RELATION));
      await clickShare(refs); // arms the 4s auto-hide timer, then setStatus's own re-entry tries to clear it
      expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
      // Re-init on the same refs -- its own retirement-time clearStatusTimer()
      // call must not throw or abort the handover despite the hostile
      // clearTimeout above.
      const refs2 = { btn: refs.btn, status: refs.status, disclosure: refs.disclosure };
      expect(() => initPairShareUI(refs2, { getRelation: () => VALID_RELATION })).not.toThrow();
    } finally {
      globalThis.clearTimeout = realClearTimeout;
    }
  });

  it('a throwing clearTimeout GETTER (distinct from the call above) must not abort controller re-init or a later status write', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const realClearTimeout = globalThis.clearTimeout;
    let refs;
    try {
      Object.defineProperty(globalThis, 'clearTimeout', {
        configurable: true,
        get() { throw new Error('hostile clearTimeout getter'); },
      });
      ({ refs } = await boot(() => VALID_RELATION));
      await clickShare(refs);
      expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
      const refs2 = { btn: refs.btn, status: refs.status, disclosure: refs.disclosure };
      expect(() => initPairShareUI(refs2, { getRelation: () => VALID_RELATION })).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'clearTimeout', { configurable: true, writable: true, value: realClearTimeout });
    }
  });

  it('a hostile no-op clearTimeout lets the OLD terminal-timer callback survive re-init — it must be a hard no-op, never touching the SUCCESSOR\'s VISIBLE status', async () => {
    // Twelfth remediation gate (pre-commit race addendum, item 4 + B item
    // 2): an already-hidden/empty successor state cannot detect the old
    // buggy `el.hidden = true` write (that write and the correct idle state
    // are indistinguishable). The successor here is given a genuinely
    // VISIBLE status -- a held/pending prerender's own `busy` explanation --
    // that the surviving old callback must never touch.
    installEnv({ canShare: () => true, share: () => undefined }); // no imageDefer -- the FIRST boot/click must resolve normally
    const realClearTimeout = globalThis.clearTimeout;
    const realImage = globalThis.Image;
    let refs;
    try {
      globalThis.clearTimeout = () => {}; // no-op -- "cancels" nothing, the real timer still fires later
      ({ refs } = await boot(() => VALID_RELATION));
      await clickShare(refs); // writes 'shared', arms a REAL 4s auto-hide timer (fake timers, so it's queued not fired)
      expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
      // Re-init on the SAME refs -- the retiring controller's clearStatusTimer()
      // call is now a confirmed no-op (clearTimeout above never cancels
      // anything), so the OLD timer is still armed and will fire later.
      const controller2 = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
      // Hold Image construction forever from THIS point on, so ONLY the
      // successor's own prerender never completes -- the button stays
      // disabled/aria-busy and the status stays genuinely visible ("preparing
      // pair image…") for the rest of this test: a real, VISIBLE state the
      // surviving old callback could plausibly (and wrongly) hide.
      globalThis.Image = class {
        constructor() { this.onload = null; this.onerror = null; }
        set src(v) { this._src = v; /* never fires onload/onerror -- held forever */ }
        get src() { return this._src; }
      };
      controller2.notifyRelationChange(VALID_RELATION);
      await Promise.resolve();
      expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
      expect(refs.status.hidden).toBe(false);
      // Advance the fake clock so the OLD (never truly cancelled) timer's
      // callback fires.
      vi.advanceTimersByTime(4000);
      // The old callback must have been a hard no-op: the new controller's
      // genuinely visible busy explanation must survive completely unchanged.
      expect(refs.status.hidden).toBe(false);
      expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
      expect(refs.btn.disabled).toBe(true);
    } finally {
      globalThis.clearTimeout = realClearTimeout;
      globalThis.Image = realImage;
    }
  });

  it('a re-entrant setTimeout CALL that itself changes the relation cannot leave an unqualified terminal claim standing', async () => {
    let currentRelation = VALID_RELATION;
    const PAIR2 = adversarialRelation({
      elementDirectionAB: 'A · earth → B · metal', numerologySpine: '2 + 7 → 9', cardPairHead: 'no. iv × no. vi',
    });
    const getRelation = () => currentRelation;
    installEnv({ canShare: () => true, share: () => undefined });
    const realSetTimeout = globalThis.setTimeout;
    let refs;
    try {
      globalThis.setTimeout = (fn, ms) => {
        currentRelation = PAIR2; // the hostile side effect, INSIDE the scheduling call itself
        return realSetTimeout(fn, ms);
      };
      ({ refs } = await boot(getRelation));
      await clickShare(refs);
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
    // setStatusRequalified's own post-schedule recheck must catch this and
    // upgrade the unqualified 'shared' claim to the truthful 'shared-selected'
    // one, rather than leaving "shared." standing for a pair that changed
    // during the very call that scheduled its own auto-hide timer.
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('shared'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared-selected'));
  });
});

describe('twelfth remediation gate — pre-commit race addendum: the INITIAL relation/snapshot read can itself retire the controller or re-enter the click', () => {
  it('regression A: the INITIAL getRelation() hook re-initializes the SAME refs and still returns a valid pair — zero effects, exact new-controller idle DOM', async () => {
    const log = installEnv();
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    let reinitDone = false;
    const getRelation = () => {
      if (!reinitDone) {
        reinitDone = true;
        initPairShareUI(refs, { getRelation: () => VALID_RELATION }); // re-init on the SAME refs, mid-read
      }
      return VALID_RELATION;
    };
    const controller = initPairShareUI(refs, { getRelation });
    await controller.onShareClick();
    expect(log.anchors).toHaveLength(0);
    expect(log.shared).toHaveLength(0);
    expect(refs.btn.disabled).toBe(false);
    expect(refs.btn.getAttribute('aria-busy')).toBe('false');
    expect(refs.status.hidden).toBe(true);
    expect(refs.status.textContent).toBe('');
  });

  it('regression B: an ALLOW-LISTED snapshot property getter re-initializes the SAME refs — the old controller performs zero busy/status/effect writes past that boundary', async () => {
    const log = installEnv();
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    let reinitDone = false;
    const hostileRelation = {
      numerologySpine: 'valid spine', cardPairHead: 'valid card',
      get elementDirectionAB() {
        if (!reinitDone) {
          reinitDone = true;
          initPairShareUI(refs, { getRelation: () => VALID_RELATION }); // re-init on the SAME refs, mid-snapshot-read
        }
        return 'A · fire -> B · earth';
      },
    };
    const controller = initPairShareUI(refs, { getRelation: () => hostileRelation });
    await controller.onShareClick();
    expect(log.anchors).toHaveLength(0);
    expect(refs.btn.disabled).toBe(false);
    expect(refs.btn.getAttribute('aria-busy')).toBe('false');
    expect(refs.status.hidden).toBe(true);
  });

  it('second supplement: a re-entrant getRelation() hook that synchronously calls the SAME controller\'s onShareClick() again must never produce a second native-share call', async () => {
    let shareCalls = 0;
    const log = installEnv({ canShare: () => true, share: () => { shareCalls++; return undefined; } });
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    let nested = false;
    let controller;
    const getRelation = () => {
      if (!nested) {
        nested = true;
        controller.onShareClick(); // re-entrant nested call, started (not awaited) before this read even returns
      }
      return VALID_RELATION;
    };
    controller = initPairShareUI(refs, { getRelation });
    controller.notifyRelationChange(VALID_RELATION); // warm the cache -- the exact probed scenario is a WARM-cache click
    await Promise.resolve();
    await controller.onShareClick();
    await Promise.resolve();
    await Promise.resolve();
    expect(shareCalls).toBe(1); // never two
    expect(refs.btn.disabled).toBe(false); // settled back to idle, not stuck opInFlight
    expect(refs.btn.getAttribute('aria-busy')).toBe('false');
    void log;
  });
});

// Twelfth remediation gate (final supplement, item 1): every host-supplied
// function this file invokes used to be called via a bare `fn.call(receiver,
// ...)` — but `.call` is ITSELF a property read on `fn`, and a hostile
// function can define its OWN `call` own-property (a getter) that shadows
// `Function.prototype.call`. A probe that changes relation inside such a
// getter, then returns the REAL `Function.prototype.call`, would still have
// the underlying share/click/writeText genuinely invoked with the identity
// already changed, past every recheck positioned around the call site.
// `invoke()` (backed by a module-captured `Reflect.apply`) never reads
// `fn.call` at all — these tests prove that directly (a read counter) for
// each of the three named sites, and that the receiver (`this`) binding is
// still correct.
describe('twelfth remediation gate (final supplement) — trusted invocation: extracted host functions are never invoked via their own `.call` property', () => {
  function setNavigator(nav) {
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  }

  it('navigator.share: a hostile OWN `.call` getter is never read; the receiver is still the real navigator', async () => {
    let callGetterReads = 0;
    let receiverOk = false;
    installEnv();
    const nav = { canShare: () => true };
    const realShareFn = function shareImpl() { receiverOk = (this === nav); return Promise.resolve(); };
    Object.defineProperty(realShareFn, 'call', {
      get() { callGetterReads++; return Function.prototype.call; },
    });
    nav.share = realShareFn;
    setNavigator(nav);
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(callGetterReads).toBe(0);
    expect(receiverOk).toBe(true);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
  });

  it('anchor.click: a hostile OWN `.call` getter is never read; the download still genuinely fires', async () => {
    let callGetterReads = 0;
    const log = installEnv(); // no canShare/share configured -- straight to the download fallback
    const { refs } = await boot(() => VALID_RELATION);
    const realCreateElement = globalThis.document.createElement;
    globalThis.document.createElement = (tag) => {
      const el = realCreateElement(tag);
      if (tag === 'a') {
        const realClick = () => { el.clickCount = (el.clickCount || 0) + 1; };
        Object.defineProperty(realClick, 'call', {
          get() { callGetterReads++; return Function.prototype.call; },
        });
        el.click = realClick;
      }
      return el;
    };
    await clickShare(refs);
    globalThis.document.createElement = realCreateElement;
    expect(callGetterReads).toBe(0);
    expect(log.anchors[0].clickCount).toBe(1); // the click genuinely happened, via the trusted primitive
  });

  it('clipboard.writeText: a hostile OWN `.call` getter is never read; the copy still genuinely happens', async () => {
    let callGetterReads = 0;
    installEnv(); // no clipboard configured via the helper -- hand-wired below
    const { refs } = await boot(() => VALID_RELATION);
    let copied = null;
    const realWriteText = function writeTextImpl(text) { copied = text; return Promise.resolve(); };
    Object.defineProperty(realWriteText, 'call', {
      get() { callGetterReads++; return Function.prototype.call; },
    });
    globalThis.navigator.clipboard = { writeText: realWriteText };
    await clickShare(refs);
    expect(callGetterReads).toBe(0);
    expect(copied).not.toBeNull();
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
  });
});

// Twelfth remediation gate (final supplement, item 2): atomic init handover.
// Uses a REAL listener-collection harness (a Set with genuine add/remove),
// not `makeEl`'s single-handler-slot mock, so listener accumulation is
// provable directly rather than inferred from a mock that can't represent
// it.
describe('twelfth remediation gate (final supplement) — atomic initPairShareUI handover under recursive re-entrant cleanup', () => {
  function makeRealListenerButton() {
    const listeners = new Set();
    return {
      disabled: false,
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k]; },
      addEventListener(ev, fn) { if (ev === 'click') listeners.add(fn); },
      removeEventListener(ev, fn) { if (ev === 'click') listeners.delete(fn); },
      _listeners: listeners,
    };
  }
  function makeStatusEl() {
    return { textContent: '', hidden: true, setAttribute() {}, getAttribute() { return null; } };
  }

  it('an armed prior timer whose clearTimeout recursively inits the SAME refs: exactly ONE live listener survives, one controller alone owns button/status/disclosure, EXACTLY one effect from one physical dispatch', async () => {
    const btn = makeRealListenerButton();
    const status = makeStatusEl();
    const disclosure = { textContent: '' };
    const refs = { btn, status, disclosure };

    const log = installEnv({ canShare: () => true, share: () => undefined });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    await controllerA.onShareClick(); // writes a real terminal status, arms a real 4s auto-hide timer
    expect(btn._listeners.size).toBe(1);

    const realClearTimeout = globalThis.clearTimeout;
    let controllerB, controllerC;
    try {
      let reinitDone = false;
      controllerC = null;
      globalThis.clearTimeout = (id) => {
        if (!reinitDone) {
          reinitDone = true;
          // The recursive/re-entrant init: happens WHILE the outer init below
          // is still mid-retirement of controllerA, triggered as a side
          // effect of ITS OWN clearStatusTimer() call.
          controllerC = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return realClearTimeout(id);
      };
      controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    } finally {
      globalThis.clearTimeout = realClearTimeout;
    }

    // Exactly one listener, ever -- the WeakMap-cached wiring means the
    // recursive init found it already installed and never called
    // addEventListener a second time.
    expect(btn._listeners.size).toBe(1);

    // The outer init (controllerB) lost the race -- it must be an inert
    // facade, never a second live controller silently coexisting.
    expect(controllerB.onShareClick).not.toBe(controllerC.onShareClick);
    await controllerB.onShareClick(); // must be a complete no-op
    expect(log.shared).toHaveLength(0); // the loser performed no effect

    // Warm the WINNING controller's cache so the physical dispatch below
    // resolves deterministically rather than racing an unwarmed render.
    controllerC.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();

    // Physically dispatch ONCE -- fire whatever the single surviving
    // listener is -- and prove EXACTLY one effect follows (never zero,
    // never two).
    for (const fn of btn._listeners) fn();
    for (let i = 0; i < 8 && log.shared.length === 0; i++) await Promise.resolve();
    expect(log.shared).toHaveLength(1);
  });

  it('a hostile btn.disabled SETTER reenters on the very FIRST-EVER init (no prior controller exists yet) — the nested winner\'s VISIBLE status survives completely untouched, the outer initializer is inert', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    let reinitDone = false;
    let controllerB = null;
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const btn = makeEl('button');
    let disabledValue = false;
    Object.defineProperty(btn, 'disabled', {
      configurable: true,
      get() { return disabledValue; },
      set(v) {
        disabledValue = v;
        if (!reinitDone) {
          reinitDone = true;
          // The nested winner resolves to a null relation -- its own
          // onShareClick() writes the truthful 'empty' status entirely
          // synchronously (no await reached on that path), so by the time
          // this setter returns, that write has already genuinely
          // happened.
          controllerB = initPairShareUI(refs, { getRelation: () => null });
          controllerB.onShareClick();
        }
      },
    });
    const refs = { btn, status, disclosure };
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick); // the outer lost the race
    expect(status.textContent).toBe(pairShareStatusMessage('empty'));
    expect(status.hidden).toBe(false);
    // The winner (controllerB, via its OWN fresh-controller resetControllerDOM,
    // reached after the outer's setter call returns) is what actually wrote
    // this attribute -- the outer's own resumed reset never got that far
    // (it lost the race one boundary earlier, at the `disabled` setter
    // itself, per resetControllerDOM's per-boundary `stillCurrent()` guard).
    expect(btn.getAttribute('aria-busy')).toBe('false');
  });

  it('a hostile status.textContent SETTER reenters during retirement of an EXISTING controller — the nested winner\'s status survives, the outer\'s own resumed clear never runs', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const btnEl = makeEl('button');
    const disclosure = makeEl('div');
    // `armed` stays false through controllerA's OWN construction (which
    // ALSO writes `textContent = ''` once, via its own fresh-controller
    // resetControllerDOM -- a DIFFERENT boundary than the one this test
    // targets) -- only set true once controllerA is confirmed constructed
    // and has done real work, so the reentry trap fires exactly once, on
    // the SPECIFIC retirement-clearing write this test is named for.
    let armed = false;
    let reinitDone = false;
    let controllerB = null;
    let hidden = true;
    let textContent = '';
    const status = {
      get textContent() { return textContent; },
      set textContent(v) {
        textContent = v;
        if (armed && v === '' && !reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => null });
          controllerB.onShareClick();
        }
      },
      get hidden() { return hidden; },
      set hidden(v) { hidden = v; },
    };
    const refs = { btn: btnEl, status, disclosure };
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    await controllerA.onShareClick(); // real terminal status, so the LATER retirement below has something to clear
    armed = true; // now arm the trap for the NEXT clearing write only
    // Re-init on the same refs -- retirement's resetControllerDOM() tries to
    // clear `status.textContent = ''`, which is the hostile setter above.
    const controllerC = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerC.onShareClick).not.toBe(controllerB.onShareClick); // this outer ALSO lost the race
    expect(status.textContent).toBe(pairShareStatusMessage('empty'));
    expect(status.hidden).toBe(false);
  });

  it('a hostile btn.setAttribute CALL (distinct from a property-getter boundary) reenters during resetControllerDOM — the nested winner survives', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const status = makeEl('p');
    const disclosure = makeEl('div');
    let reinitDone = false;
    let controllerB = null;
    const btn = {
      _attrs: {},
      disabled: false,
      setAttribute(k, v) {
        this._attrs[k] = String(v);
        if (k === 'aria-busy' && v === 'false' && !reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => null });
          controllerB.onShareClick();
        }
      },
      getAttribute(k) { return this._attrs[k]; },
    };
    const refs = { btn, status, disclosure };
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    expect(status.textContent).toBe(pairShareStatusMessage('empty'));
    expect(status.hidden).toBe(false);
  });

  it('the disclosure sequence: a hostile navigator CAPABILITY getter reentering leaves the nested winner\'s disclosure text intact, never overwritten by the outer\'s resumed write', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const btn = makeEl('button');
    const status = makeEl('p');
    let reinitDone = false;
    let controllerB = null;
    const realNav = globalThis.navigator;
    // A write-count spy, not a content check: the outer's stale write and the
    // nested winner's write compute the IDENTICAL string from the same
    // capability flag, so comparing final text alone cannot distinguish
    // "outer correctly stopped before writing" from "outer overwrote with an
    // equal value" — only counting writes catches a reintroduced missing
    // checkpoint between the capability getter and the textContent setter.
    let writeCount = 0;
    let disclosureText = 'sentinel-untouched';
    const disclosure = {
      get textContent() { return disclosureText; },
      set textContent(v) { writeCount += 1; disclosureText = v; },
    };
    const refs = { btn, status, disclosure };
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      get() {
        if (!reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
          // The nested winner's OWN disclosure write must land first.
        }
        return realNav;
      },
    });
    let controllerA;
    try {
      controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    } finally {
      Object.defineProperty(globalThis, 'navigator', { configurable: true, writable: true, value: realNav });
    }
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // The nested winner's disclosure write is a real, non-sentinel string —
    // the outer's own resumed sequence never got the chance to overwrite it
    // with anything (correct or not), since it stopped at the capability-
    // read boundary.
    expect(disclosureText).not.toBe('sentinel-untouched');
    expect(disclosureText.length).toBeGreaterThan(0);
    // The load-bearing assertion: exactly one write ever landed (the nested
    // winner's). A missing checkpoint between the capability getter and the
    // textContent setter would let the outer write too, silently, since both
    // writes compute the same string from the same capability flag.
    expect(writeCount).toBe(1);
    void log;
  });

  it('the disclosure sequence: a hostile disclosure.textContent SETTER reentering does not let the outer\'s own (now-stale) write follow it', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const btn = makeEl('button');
    const status = makeEl('p');
    let reinitDone = false;
    let controllerB = null;
    let disclosureText = '';
    const refs = { btn, status, disclosure: null };
    const disclosure = {
      get textContent() { return disclosureText; },
      set textContent(v) {
        if (!reinitDone) {
          reinitDone = true;
          disclosureText = v; // the OUTER's own (about-to-be-stale) write lands first, chronologically
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION }); // nested winner overwrites it
        } else {
          disclosureText = v;
        }
      },
    };
    refs.disclosure = disclosure;
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // Whatever the FINAL disclosure text is, it must be the nested winner's
    // OWN write (real disclosure copy), and the outer must never write
    // AGAIN after losing the race -- there is only one following boundary
    // check right after this setter, which the outer's own lostRace() must
    // catch, so no further outer write follows this one.
    expect(typeof disclosureText).toBe('string');
    expect(disclosureText.length).toBeGreaterThan(0);
    // The load-bearing assertion: a missing checkpoint right after this
    // setter would let the outer fall through and claim _activeController/
    // wiring.current for itself instead of returning INERT_FACADE, becoming
    // a second LIVE controller sharing the winner's own refs. Content
    // comparison above can't see that, and a NO-cache click can't either
    // (a real-but-wrongly-live controller with no warmed cache takes the
    // download-fallback path, never calling navigator.share(), which would
    // leave log.shared unchanged either way) -- so warm the OUTER's own
    // cache too: if it is genuinely INERT_FACADE, notifyRelationChange/
    // onShareClick are both frozen no-ops and this produces nothing; if the
    // checkpoint is missing and it is a real live controller instead, this
    // gives it everything it needs to reach a real, detectable share() call.
    controllerA.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();
    await controllerA.onShareClick();
    expect(log.shared).toHaveLength(0);
    controllerB.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();
    await controllerB.onShareClick();
    for (let i = 0; i < 8 && log.shared.length === 0; i++) await Promise.resolve();
    expect(log.shared).toHaveLength(1);
  });

  it('notifyRelationChange: a hostile status.textContent SETTER reentering the on-relation-change clear never lets the outer\'s own stale hidden write follow it', async () => {
    installEnv({});
    const btn = makeEl('button');
    const disclosure = makeEl('div');
    let reinitDone = false;
    let controllerB = null;
    let textValue = '';
    let sawNonEmpty = false;
    let hiddenWritesAfterReinit = 0;
    const refs = { btn, status: null, disclosure };
    const status = {
      get textContent() { return textValue; },
      set textContent(v) {
        textValue = v;
        if (v !== '') { sawNonEmpty = true; return; }
        if (sawNonEmpty && !reinitDone) {
          reinitDone = true;
          // Nested re-init on the SAME refs, mid-write of the OUTER's own
          // on-relation-change clear (notifyRelationChange) — retires the
          // outer controller and builds a fresh controllerB, whose OWN
          // construction resets this same status node to idle empty/hidden.
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
      },
    };
    // A write-count spy scoped to AFTER the reentry trigger, same rationale
    // as the syncBusyFromPrerender test above: two writes are expected from
    // the nested init alone (retire the outer, construct the winner) — a
    // third would mean the outer's own stale write followed, which a plain
    // final-value check can't distinguish since both write the same `true`.
    Object.defineProperty(status, 'hidden', {
      get() { return this._hiddenValue; },
      set(v) {
        this._hiddenValue = v;
        if (reinitDone) hiddenWritesAfterReinit += 1;
      },
    });
    refs.status = status;
    const controllerA = initPairShareUI(refs, { getRelation: () => null });
    await controllerA.onShareClick(); // getRelation() returns null -> setStatus('empty'), a real non-empty terminal message
    expect(sawNonEmpty).toBe(true);
    controllerA.notifyRelationChange(VALID_RELATION); // relation change with no click in flight -> clears the stale terminal text
    expect(controllerB).not.toBeNull();
    expect(textValue).toBe('');
    expect(status._hiddenValue).toBe(true);
    expect(hiddenWritesAfterReinit).toBe(2);
  });

  it('syncBusyFromPrerender: a hostile status.textContent SETTER reentering the pre-render-settled clear never lets the outer\'s own stale hidden write follow it', async () => {
    installEnv({});
    const btn = makeEl('button');
    const disclosure = makeEl('div');
    let reinitDone = false;
    let controllerB = null;
    let textValue = '';
    let hiddenValue = false;
    let hiddenWritesAfterReinit = 0;
    let sawBusy = false;
    const refs = { btn, status: null, disclosure };
    const status = {
      get textContent() { return textValue; },
      set textContent(v) {
        textValue = v;
        if (v !== '') { sawBusy = true; return; }
        if (sawBusy && !reinitDone) {
          reinitDone = true;
          // Nested re-init on the SAME refs, mid-write of the OUTER's own
          // pre-render-settled clear (syncBusyFromPrerender) — retires the
          // outer controller and builds a fresh controllerB, whose OWN
          // construction resets this same status node to idle empty/hidden.
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
      },
      get hidden() { return hiddenValue; },
      // A write-count spy scoped to AFTER the reentry trigger fires: the
      // nested winner's own construction-time reset and the outer's stale
      // resumed write both set `hidden` to the SAME value (true), so
      // comparing the final value alone cannot distinguish "outer correctly
      // stopped before writing" from "outer harmlessly-looking but
      // incorrectly wrote again" — only counting writes from this point
      // catches a reintroduced missing checkpoint. Exactly two are expected
      // from the nested init alone: resetControllerDOM retiring the outer
      // controller, then resetControllerDOM constructing the fresh winner.
      set hidden(v) {
        hiddenValue = v;
        if (reinitDone) hiddenWritesAfterReinit += 1;
      },
    };
    refs.status = status;
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    controllerA.notifyRelationChange(VALID_RELATION); // starts a pre-render: busy text shows, then the mock rasterization settles and this module's own settle-clear fires
    for (let i = 0; i < 8 && !reinitDone; i++) await Promise.resolve();
    expect(controllerB).not.toBeNull();
    // The nested winner's fresh idle DOM (empty + hidden) must survive --
    // the outer's own settle-clear lost the race at the textContent write
    // and must never go on to also write el.hidden.
    expect(textValue).toBe('');
    expect(hiddenValue).toBe(true);
    expect(hiddenWritesAfterReinit).toBe(2);
  });

  it('applyBusyDOM: a hostile btn.disabled SETTER reentering a click\'s own busy-start write never lets the outer\'s own stale aria-busy write follow it', async () => {
    let reinitDone = false;
    let controllerB = null;
    const btnAttrs = {};
    const status = makeEl('p');
    const disclosure = makeEl('div');
    let disabledValue = false;
    const refs = { btn: null, status, disclosure };
    const btn = {
      get disabled() { return disabledValue; },
      set disabled(v) {
        disabledValue = v;
        if (!reinitDone && v === true) {
          reinitDone = true;
          // Nested re-init on the SAME refs, mid-write of controllerA's own
          // applyBusyDOM(true) call — retires controllerA and builds a
          // fresh controllerB, whose OWN construction resets this same
          // button to its idle (not-busy) state.
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
      },
      setAttribute(k, v) { btnAttrs[k] = String(v); },
      getAttribute(k) { return btnAttrs[k]; },
    };
    refs.btn = btn;
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    await controllerA.onShareClick();
    expect(controllerB).not.toBeNull();
    // The nested winner's fresh idle button (aria-busy="false", written by
    // its own construction-time resetControllerDOM) must survive --
    // controllerA's own applyBusyDOM(true) call lost the race at the
    // disabled write and must never go on to also write aria-busy="true".
    expect(btnAttrs['aria-busy']).toBe('false');
  });

  it('setStatus: a hostile status.textContent SETTER reentering a click\'s own busy-status write never lets the outer\'s own stale hidden write follow it', async () => {
    const btn = makeEl('button');
    let reinitDone = false;
    let controllerB = null;
    let textValue = '';
    let hiddenValue = false;
    const refs = { btn, status: null, disclosure: null };
    const status = {
      get textContent() { return textValue; },
      set textContent(v) {
        textValue = v;
        if (!reinitDone && v) {
          reinitDone = true;
          // Nested re-init on the SAME refs, mid-write of controllerA's own
          // setStatus('busy') call — retires controllerA and builds a fresh
          // controllerB, whose OWN construction resets this same status
          // node to the idle empty/hidden state.
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
      },
      get hidden() { return hiddenValue; },
      set hidden(v) { hiddenValue = v; },
    };
    refs.status = status;
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    await controllerA.onShareClick();
    expect(controllerB).not.toBeNull();
    // The nested winner's fresh idle DOM (empty + hidden) must survive --
    // controllerA's own setStatus('busy') call lost the race at the
    // textContent write and must never go on to also write el.hidden
    // (which would force the empty status region visible again).
    expect(textValue).toBe('');
    expect(hiddenValue).toBe(true);
  });

  it('first-ever addEventListener GETTER reentry on the SAME button: exactly ONE physical listener installs, the losing facade is inert, one physical dispatch produces EXACTLY one effect', async () => {
    const listeners = new Set();
    let reinitDone = false;
    let controllerB = null;
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const btnAttrs = {};
    const btn = {
      disabled: false,
      setAttribute(k, v) { btnAttrs[k] = String(v); },
      getAttribute(k) { return btnAttrs[k]; },
    };
    Object.defineProperty(btn, 'addEventListener', {
      configurable: true,
      get() {
        if (!reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION }); // nested, re-enters buttonWiringFor(btn) too
        }
        return (ev, fn) => { if (ev === 'click') listeners.add(fn); };
      },
    });
    const refs = { btn, status, disclosure };
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // The wiring record was published to the WeakMap BEFORE this getter was
    // ever read -- the nested call's own buttonWiringFor(btn) found it
    // already there and never read the getter again, so it was read
    // exactly once and exactly one listener was ever installed.
    expect(listeners.size).toBe(1);

    controllerB.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();
    for (const fn of listeners) fn();
    for (let i = 0; i < 8 && log.shared.length === 0; i++) await Promise.resolve();
    expect(log.shared).toHaveLength(1);
    await controllerA.onShareClick(); // the loser, invoked directly -- must add nothing further
    expect(log.shared).toHaveLength(1);
  });

  it('first-ever addEventListener CALL reentry on the SAME button (distinct from the getter above): exactly ONE physical listener installs, one physical dispatch produces EXACTLY one effect', async () => {
    const listeners = new Set();
    let reinitDone = false;
    let controllerB = null;
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const btnAttrs = {};
    const btn = {
      disabled: false,
      setAttribute(k, v) { btnAttrs[k] = String(v); },
      getAttribute(k) { return btnAttrs[k]; },
      addEventListener(ev, fn) {
        if (!reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION }); // nested, re-enters buttonWiringFor(btn) too, DURING this same call
        }
        if (ev === 'click') listeners.add(fn);
      },
    };
    const refs = { btn, status, disclosure };
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // Exactly one physical addEventListener call ever happened -- the
    // nested call's own buttonWiringFor(btn) found the wiring record
    // already published (set BEFORE this call was ever made) and returned
    // immediately without calling addEventListener a second time.
    expect(listeners.size).toBe(1);

    controllerB.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();
    for (const fn of listeners) fn();
    for (let i = 0; i < 8 && log.shared.length === 0; i++) await Promise.resolve();
    expect(log.shared).toHaveLength(1);
  });
});

describe('thirteenth remediation gate — atomic-handoff follow-up: the button-reference read and the init-time capability probe each get their own checkpoint', () => {
  it('a hostile refs.btn GETTER reentering the LATER buttonWiringFor lookup (not the earlier construction-time reset read) leaves the outer inert: zero listener registration on a GHOST button, zero DOM writes, notifyRelationChange a no-op, exactly one winning effect', async () => {
    // The mutation this test must catch: a hostile refs.btn getter can
    // return a DIFFERENT object after it has already reentered — if the
    // outer resumes past that read without a checkpoint, it hands buttonWiringFor
    // a button the WeakMap has never published wiring for, which installs a
    // REAL, orphaned second listener on it. Reusing the SAME button object
    // for both reads cannot catch this: buttonWiringFor's WeakMap already
    // dedups same-object re-entry regardless of any checkpoint here, so a
    // prior version of this test that returned the identical button both
    // times passed even with the checkpoint deleted. A distinct "ghost"
    // button the WeakMap has never seen is required to make the missing
    // checkpoint observable.
    const listeners = new Set();
    const ghostListeners = new Set();
    let btnReads = 0;
    let reinitDone = false;
    let controllerB = null;
    const btnAttrs = {};
    const realBtn = {
      disabled: false,
      setAttribute(k, v) { btnAttrs[k] = String(v); },
      getAttribute(k) { return btnAttrs[k]; },
      addEventListener(ev, fn) { if (ev === 'click') listeners.add(fn); },
    };
    const ghostAttrs = {};
    const ghostBtn = {
      disabled: false,
      setAttribute(k, v) { ghostAttrs[k] = String(v); },
      getAttribute(k) { return ghostAttrs[k]; },
      addEventListener(ev, fn) { if (ev === 'click') ghostListeners.add(fn); },
    };
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = {
      status, disclosure,
      // Read #1 happens inside resetControllerDOM's construction-time reset
      // (already covered by an earlier gate's tests targeting THAT site) —
      // this trigger deliberately skips it and fires on read #2, the LATER
      // lookup this gate split out of buttonWiringFor's own call, and
      // returns the GHOST from that point on.
      get btn() {
        btnReads += 1;
        if (btnReads === 2 && !reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
          return ghostBtn;
        }
        return realBtn;
      },
    };
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerB).not.toBeNull();
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // The outer lost the race AT the second `refs.btn` read, before ever
    // calling buttonWiringFor — exactly one physical listener exists on the
    // REAL button (the nested winner's doing), and the ghost the outer's
    // stale read returned gets ZERO — it must never reach buttonWiringFor.
    expect(listeners.size).toBe(1);
    expect(ghostListeners.size).toBe(0);

    controllerB.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();
    const dispatches = [];
    for (const fn of listeners) dispatches.push(fn());
    await Promise.all(dispatches); // wait for the click's own async completion (final status write), not just the share() push
    for (let i = 0; i < 8 && log.shared.length === 0; i++) await Promise.resolve();
    expect(log.shared).toHaveLength(1); // exactly one effect from one physical dispatch
    expect(log.anchors).toHaveLength(0); // native share succeeded — no fallback download
    expect(log.copied).toHaveLength(0); // no fallback clipboard copy either

    // Item 4: the loser is inert on BOTH exported hooks, not just the one
    // already dispatched above. Neither call may produce a second effect,
    // touch the winner's cache, or write status/busy DOM.
    const statusBefore = status.textContent;
    const hiddenBefore = status.hidden;
    controllerA.notifyRelationChange(VALID_RELATION);
    expect(status.textContent).toBe(statusBefore);
    expect(status.hidden).toBe(hiddenBefore);
    await controllerA.onShareClick();
    expect(log.shared).toHaveLength(1); // still exactly one — the loser added nothing
    expect(log.anchors).toHaveLength(0);
    expect(log.copied).toHaveLength(0);
    expect(status.textContent).toBe(statusBefore);
    expect(status.hidden).toBe(hiddenBefore);
    expect(ghostListeners.size).toBe(0); // still zero — the loser's own onShareClick call never touches the ghost either
  });

  it('capability read: a hostile navigator.share GETTER reentering the init-time capability probe never lets the outer read canShare or write disclosure text after the nested winner', async () => {
    let reinitDone = false;
    let controllerB = null;
    const btn = makeEl('button');
    const status = makeEl('p');
    let disclosureWrites = 0;
    let disclosureText = '';
    const disclosure = {
      get textContent() { return disclosureText; },
      set textContent(v) { disclosureText = v; disclosureWrites += 1; },
    };
    const refs = { btn, status, disclosure };
    let canShareReads = 0;
    const nav = {
      get share() {
        if (!reinitDone) {
          reinitDone = true;
          // Nested re-init on the SAME refs, mid-read of the OUTER's own
          // init-time capability probe — retires the outer and builds a
          // fresh controllerB, whose OWN capability probe runs to
          // completion and writes the real disclosure text.
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return () => {};
      },
      get canShare() { canShareReads += 1; return () => true; },
    };
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerB).not.toBeNull();
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // The outer lost the race AT the share getter and must never go on to
    // read canShare — exactly one read total, the nested winner's own.
    expect(canShareReads).toBe(1);
    // ...and must never go on to write disclosure text either.
    expect(disclosureWrites).toBe(1);
    expect(disclosureText.length).toBeGreaterThan(0);
  });

  it('capability read: a hostile navigator.canShare GETTER reentering the init-time capability probe never lets the outer write disclosure text after the nested winner', async () => {
    let reinitDone = false;
    let controllerB = null;
    const btn = makeEl('button');
    const status = makeEl('p');
    let disclosureWrites = 0;
    let disclosureText = '';
    const disclosure = {
      get textContent() { return disclosureText; },
      set textContent(v) { disclosureText = v; disclosureWrites += 1; },
    };
    const refs = { btn, status, disclosure };
    const nav = {
      share: () => {},
      get canShare() {
        if (!reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return () => true;
      },
    };
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerB).not.toBeNull();
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // The outer lost the race AT the canShare getter (the third capability
    // checkpoint) and must never go on to write disclosure text — exactly
    // one write total, the nested winner's own.
    expect(disclosureWrites).toBe(1);
    expect(disclosureText.length).toBeGreaterThan(0);
  });

  it('buttonWiringFor: addEventListener with a hostile own .call property getter is never read via .call — the trusted Reflect.apply path installs exactly one listener, at the correct receiver, and produces exactly one effect with no extra download/copy', async () => {
    // A plain Set/counter dedups identical-reference double-registrations
    // silently — a real double-install bug where the SAME closure gets
    // added twice would still report size 1. Track raw invocation counts
    // independently of the Set so a real double-call cannot hide.
    const listeners = new Set();
    let addEventListenerGetterReads = 0;
    let invocationCount = 0;
    let lastReceiver = null;
    let callGetterReads = 0;
    const btnAttrs = {};
    const btn = {
      disabled: false,
      setAttribute(k, v) { btnAttrs[k] = String(v); },
      getAttribute(k) { return btnAttrs[k]; },
    };
    const addListenerFn = function (ev, fn) {
      invocationCount += 1;
      lastReceiver = this;
      if (ev === 'click') listeners.add(fn);
    };
    Object.defineProperty(addListenerFn, 'call', {
      configurable: true,
      get() { callGetterReads += 1; return Function.prototype.call; },
    });
    // addEventListener itself is a GETTER (a second, distinct host-controlled
    // boundary from the .call property on whatever it returns) — proves the
    // property is read exactly once too, not just that .call is untouched.
    Object.defineProperty(btn, 'addEventListener', {
      configurable: true,
      get() { addEventListenerGetterReads += 1; return addListenerFn; },
    });
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = { btn, status, disclosure };
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const controller = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(callGetterReads).toBe(0); // .call itself is never read
    expect(addEventListenerGetterReads).toBe(1); // the property is read exactly once
    expect(invocationCount).toBe(1); // the real function is invoked exactly once
    expect(lastReceiver).toBe(btn); // Reflect.apply preserved the correct `this`
    expect(listeners.size).toBe(1); // exactly one physical listener registered

    controller.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();
    for (const fn of listeners) fn();
    for (let i = 0; i < 8 && log.shared.length === 0; i++) await Promise.resolve();
    expect(log.shared).toHaveLength(1); // exactly one native-share effect
    expect(log.anchors).toHaveLength(0); // native share succeeded — no fallback download
    expect(log.copied).toHaveLength(0); // no fallback clipboard copy either
    expect(callGetterReads).toBe(0); // never read even once, including at dispatch/registration time
    expect(addEventListenerGetterReads).toBe(1); // still exactly one — dispatch doesn't re-read the property
    expect(invocationCount).toBe(1); // still exactly one — one physical dispatch is not a second registration
  });

  it('buttonWiringFor: a hostile addEventListener GETTER that returns a DIFFERENT corrupting function after completing a nested winner is never invoked by the losing outer (exact live-repro reproduction)', async () => {
    // Live-repro finding: publishing the wiring record before the read (an
    // earlier gate's fix) stops a nested call from installing a SECOND
    // listener, but it does not stop the OUTER from following through on
    // its own stale read once the getter returns — the getter's return
    // value can be a function that does ANYTHING when invoked, not merely
    // register a listener. Reusing the same well-behaved addEventListener
    // for both the outer and the nested winner cannot catch this, since
    // nothing distinguishes "installed correctly" from "installed by the
    // wrong caller." A getter that hands back a NEW, actively corrupting
    // function on every read is required to make a missing ownership
    // checkpoint between the read and the invocation observable.
    let nested = null;
    let getterReads = 0;
    let staleReturnedCalls = 0;
    let reentered = false;
    const disclosure = makeEl('div');
    const status = makeEl('p');
    const btn = { disabled: false, setAttribute() {}, getAttribute() { return null; } };
    const refs = { btn, status, disclosure };
    Object.defineProperty(btn, 'addEventListener', {
      configurable: true,
      get() {
        getterReads += 1;
        if (!reentered) {
          reentered = true;
          nested = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return function () {
          staleReturnedCalls += 1;
          disclosure.textContent = 'CORRUPTED_BY_STALE_OUTER_REGISTRATION';
        };
      },
    });
    installEnv({ canShare: () => true, share: () => undefined });
    const outer = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(nested).not.toBeNull();
    expect(outer.onShareClick).not.toBe(nested.onShareClick);
    // The nested winner's own correct disclosure text must survive
    // completely untouched — the losing outer's stale registration
    // function is never invoked, no matter what it would have done.
    expect(disclosure.textContent).not.toBe('CORRUPTED_BY_STALE_OUTER_REGISTRATION');
    expect(disclosure.textContent.length).toBeGreaterThan(0);
    // The getter is read twice (the outer's own read, then the nested
    // winner's own separate read once it reaches buttonWiringFor itself),
    // but the corrupting function it returns is only ever INVOKED once —
    // by the nested winner, which legitimately claimed the install. If the
    // outer also invoked its own stale copy, this would be 2 and/or the
    // disclosure assertion above would have already failed.
    expect(getterReads).toBe(2);
    expect(staleReturnedCalls).toBe(1);
    void status;
  });
});

describe('thirteenth remediation gate (further follow-up) — throw-contained refs access and single-read safeNavigator()', () => {
  it('a throwing refs.btn GETTER degrades safely — initPairShareUI never crashes, the button is simply absent from this controller', () => {
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = {
      status, disclosure,
      get btn() { throw new Error('hostile btn getter'); },
    };
    expect(() => initPairShareUI(refs, { getRelation: () => VALID_RELATION })).not.toThrow();
    expect(disclosure.textContent.length).toBeGreaterThan(0); // the rest of construction still completes truthfully
  });

  it('a throwing refs.disclosure GETTER degrades safely — no crash, disclosure is simply skipped', () => {
    const btn = makeEl('button');
    const status = makeEl('p');
    const refs = {
      btn, status,
      get disclosure() { throw new Error('hostile disclosure getter'); },
    };
    let controller;
    expect(() => { controller = initPairShareUI(refs, { getRelation: () => VALID_RELATION }); }).not.toThrow();
    expect(typeof controller.onShareClick).toBe('function'); // construction still completed
  });

  it('resetControllerDOM: a refs.btn GETTER that starts throwing before a re-init does not crash retirement — the new controller still constructs cleanly', () => {
    const status = makeEl('p');
    const disclosure = makeEl('div');
    let btnThrows = false;
    const refs = {
      status, disclosure,
      get btn() {
        if (btnThrows) throw new Error('hostile btn getter, now throwing');
        return makeEl('button');
      },
    };
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    btnThrows = true;
    let controllerB;
    expect(() => { controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION }); }).not.toThrow();
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    expect(typeof controllerB.onShareClick).toBe('function');
  });

  it('resetControllerDOM: a refs.status GETTER that starts throwing before a re-init does not crash retirement or construction', () => {
    const btn = makeEl('button');
    const disclosure = makeEl('div');
    let statusThrows = false;
    const refs = {
      btn, disclosure,
      get status() {
        if (statusThrows) throw new Error('hostile status getter, now throwing');
        return makeEl('p');
      },
    };
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    statusThrows = true;
    let controllerB;
    expect(() => { controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION }); }).not.toThrow();
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
  });

  it('a hostile refs.disclosure GETTER reentering leaves the outer inert before ever reading capability or writing disclosure text', async () => {
    let reinitDone = false;
    let controllerB = null;
    const btn = makeEl('button');
    const status = makeEl('p');
    let disclosureWrites = 0;
    let disclosureText = '';
    const realDisclosure = {
      get textContent() { return disclosureText; },
      set textContent(v) { disclosureText = v; disclosureWrites += 1; },
    };
    const refs = {
      btn, status,
      get disclosure() {
        if (!reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return realDisclosure;
      },
    };
    installEnv({ canShare: () => true, share: () => undefined });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerB).not.toBeNull();
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // The nested winner's own disclosure write is the ONLY one — the outer
    // lost the race at this exact read and never reaches capability
    // detection or the textContent write at all. A content check alone
    // can't prove this (both would compute the same string); the write
    // count can.
    expect(disclosureWrites).toBe(1);
    expect(disclosureText.length).toBeGreaterThan(0);
  });

  it('safeNavigator(): the global navigator accessor is read EXACTLY ONCE per call, even when it throws', () => {
    let reads = 0;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      get() { reads += 1; throw new Error('hostile navigator'); },
    });
    const btn = makeEl('button');
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = { btn, status, disclosure };
    expect(() => initPairShareUI(refs, { getRelation: () => VALID_RELATION })).not.toThrow();
    expect(reads).toBe(1);
    expect(disclosure.textContent.length).toBeGreaterThan(0); // still gets a truthful (download-only) disclosure, no crash
  });

  it('safeNavigator(): a hostile navigator GETTER reentering init on the SAME refs is read exactly once by the OUTER before it loses the race — the nested winner performs its own separate read', () => {
    let reads = 0;
    let reinitDone = false;
    let controllerB = null;
    const btn = makeEl('button');
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = { btn, status, disclosure };
    const realNav = { share: () => {}, canShare: () => true };
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      get() {
        reads += 1;
        if (!reinitDone) {
          reinitDone = true;
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return realNav;
      },
    });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    expect(controllerB).not.toBeNull();
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // Exactly TWO reads total: the outer's own (which reenters), and the
    // nested winner's own separate, later read — never a third from the
    // outer resuming past its own read after losing the race (that would
    // mean safeNavigator() itself read the accessor twice for one logical
    // checkpoint, the exact defect this fix closed).
    expect(reads).toBe(2);
  });
});

describe('fourteenth remediation gate — post-download clipboard chain: safeNavigator(), the clipboard getter, and the writeText getter are three separate checkpoints', () => {
  it('a hostile navigator GETTER that reenters init, followed by a clipboard getter that corrupts DOM directly, is never reached once ownership is lost (exact live-repro reproduction)', async () => {
    const log = installEnv(); // no canShare/share configured -- forces the download fallback path
    const { refs } = await boot(() => VALID_RELATION);
    let navigatorReads = 0;
    let clipboardReads = 0;
    let writeTextReads = 0;
    let reentered = false;
    let nested = null;
    const nav = {};
    Object.defineProperty(nav, 'clipboard', {
      configurable: true,
      get() {
        clipboardReads += 1;
        // The hostile side effect lives directly in the getter, exactly
        // like the exact external repro — no reentrant init needed here,
        // since the navigator getter below already supplied that.
        refs.status.textContent = 'CORRUPTED_BY_STALE_CLIPBOARD_GETTER';
        refs.status.hidden = false;
        const clipboard = {};
        Object.defineProperty(clipboard, 'writeText', {
          configurable: true,
          get() { writeTextReads += 1; return () => Promise.resolve(); },
        });
        return clipboard;
      },
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      get() {
        navigatorReads += 1;
        if (navigatorReads === 2 && !reentered) {
          reentered = true;
          nested = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return nav;
      },
    });
    await clickShare(refs);
    expect(nested).not.toBeNull();
    // The outer lost the race AT the second navigator read (the one that
    // reentered) and must never go on to read clipboard or writeText at
    // all — this is the exact checkpoint the missing recheck skipped.
    expect(clipboardReads).toBe(0);
    expect(writeTextReads).toBe(0);
    // The download itself already fired — irreversible, unaffected by a
    // LATER boundary losing the race.
    expect(log.anchors).toHaveLength(1);
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).not.toBe('CORRUPTED_BY_STALE_CLIPBOARD_GETTER');
  });

  it('a hostile clipboard GETTER reentering (navigator itself well-behaved) is never reached once ownership is lost at THAT boundary — writeText is never read', async () => {
    const log = installEnv();
    const { refs } = await boot(() => VALID_RELATION);
    let clipboardReads = 0;
    let writeTextReads = 0;
    let reentered = false;
    let nested = null;
    const nav = {};
    Object.defineProperty(nav, 'clipboard', {
      configurable: true,
      get() {
        clipboardReads += 1;
        if (!reentered) {
          reentered = true;
          nested = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        const clipboard = {};
        Object.defineProperty(clipboard, 'writeText', {
          configurable: true,
          get() { writeTextReads += 1; return () => Promise.resolve(); },
        });
        return clipboard;
      },
    });
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
    await clickShare(refs);
    expect(nested).not.toBeNull();
    // Exactly ONE clipboard read — the outer's own, which reentered
    // (construction alone, not a click) — the outer must stop AT this
    // checkpoint and never read it again.
    expect(clipboardReads).toBe(1);
    // writeText is never read at all — the outer stopped at the
    // clipboard-read checkpoint, before ever reaching writeText.
    expect(writeTextReads).toBe(0);
    expect(log.anchors).toHaveLength(1);
  });

  it('a hostile writeText GETTER reentering is never invoked by the losing outer — the nested winner\'s own write is the only one that ever happens', async () => {
    const log = installEnv();
    const { refs } = await boot(() => VALID_RELATION);
    let writeTextReads = 0;
    let writeCalls = 0;
    let reentered = false;
    let nested = null;
    const clipboardObj = {};
    Object.defineProperty(clipboardObj, 'writeText', {
      configurable: true,
      get() {
        writeTextReads += 1;
        if (!reentered) {
          reentered = true;
          nested = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return () => { writeCalls += 1; return Promise.resolve(); };
      },
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: clipboardObj }, configurable: true, writable: true,
    });
    await clickShare(refs);
    expect(nested).not.toBeNull();
    // The outer lost the race AT the writeText read and must never invoke
    // the (distinct, freshly-returned) function it got back.
    expect(writeCalls).toBe(0);
    expect(log.anchors).toHaveLength(1);
    expect(log.copied).toHaveLength(0);
  });
});

describe('fourteenth remediation gate — applyBusyDOM: contained refs read + checkpoint before the first write, busy setup inside the guarded try/finally', () => {
  it('a hostile refs.btn GETTER reentering DURING a click\'s own applyBusyDOM(true) read leaves the nested winner\'s idle reset intact — the outer never re-disables it (exact live-repro shape: nested:true, disabled stays false, aria-busy stays "false")', async () => {
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const btnAttrs = {};
    let disabledValue = false;
    const realBtn = {
      get disabled() { return disabledValue; },
      set disabled(v) { disabledValue = v; },
      setAttribute(k, v) { btnAttrs[k] = String(v); },
      getAttribute(k) { return btnAttrs[k]; },
      addEventListener() {},
    };
    let armed = false;
    let reinitDone = false;
    let controllerB = null;
    const refs = {
      status, disclosure,
      get btn() {
        if (armed && !reinitDone) {
          reinitDone = true;
          // Reentry during THIS click's own applyBusyDOM(true) read (not
          // the earlier construction-time read, already separately
          // protected) — the nested winner's construction resets this SAME
          // button to idle (disabled=false, aria-busy="false") before the
          // outer's read even returns.
          controllerB = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
        }
        return realBtn;
      },
    };
    installEnv({ canShare: () => true, share: () => undefined });
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION }); // construction's own read — armed=false, no reentry
    armed = true; // now arm the trap for the UPCOMING click's own applyBusyDOM read
    await controllerA.onShareClick();
    expect(controllerB).not.toBeNull();
    expect(controllerA.onShareClick).not.toBe(controllerB.onShareClick);
    // The nested winner's fresh idle button (disabled=false, aria-busy=
    // "false", from its own construction-time resetControllerDOM) must
    // survive — controllerA's own applyBusyDOM(true) call lost the race at
    // the refs.btn read and must never go on to also write disabled=true.
    expect(disabledValue).toBe(false);
    expect(btnAttrs['aria-busy']).toBe('false');
  });

  it('a throwing btn.disabled SETTER (not internally contained the way a getter is) during applyBusyDOM never leaves opInFlight stuck — busy setup runs inside the guarded try/finally, so its own finally still releases the reservation', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const status = makeEl('p');
    const disclosure = makeEl('div');
    let disabledThrows = false; // false during construction, so resetControllerDOM's own reset succeeds
    let disabledValue = false;
    const btn = {
      get disabled() { return disabledValue; },
      set disabled(v) {
        if (disabledThrows) throw new Error('hostile disabled setter');
        disabledValue = v;
      },
      setAttribute() {},
      getAttribute() { return null; },
      addEventListener() {},
    };
    const refs = { btn, status, disclosure };
    const controller = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    disabledThrows = true; // arm the trap for the UPCOMING click's own applyBusyDOM(true) write
    await expect(controller.onShareClick()).resolves.not.toThrow();
    // The throw must not have wedged opInFlight — a later click, once the
    // setter stops throwing, must still genuinely proceed (not silently
    // no-op forever because opInFlight was never released).
    disabledThrows = false;
    controller.notifyRelationChange(VALID_RELATION);
    await Promise.resolve();
    await controller.onShareClick();
    expect(log.shared).toHaveLength(1);
  });
});

describe('fourteenth remediation gate — readRelation: hooks.getRelation is extracted exactly once, with an ownership checkpoint between the read and the call', () => {
  it('a hostile getRelation GETTER that reenters, then returns a DIFFERENT corrupting function, is never invoked by the losing outer (exact live-repro shape)', async () => {
    const btn = makeEl('button');
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = { btn, status, disclosure };
    let reads = 0;
    let staleCalls = 0;
    let reentered = false;
    let nested = null;
    const hooks = {
      get getRelation() {
        reads += 1;
        if (!reentered) {
          reentered = true;
          nested = initPairShareUI(refs, hooks);
        }
        return () => {
          staleCalls += 1;
          status.textContent = 'CORRUPTED_BY_STALE_GETRELATION_CALL';
          status.hidden = false;
          return null;
        };
      },
    };
    const controllerA = initPairShareUI(refs, hooks); // construction never reads hooks.getRelation -- no reentry here
    await controllerA.onShareClick(); // THIS is what first reads hooks.getRelation, triggering the hostile getter
    expect(nested).not.toBeNull();
    expect(controllerA.onShareClick).not.toBe(nested.onShareClick);
    // The outer lost the race AT the getRelation read and must never
    // invoke the (distinct, freshly-returned) function it got back.
    expect(staleCalls).toBe(0);
    expect(status.textContent).not.toBe('CORRUPTED_BY_STALE_GETRELATION_CALL');
    expect(reads).toBe(1);
  });
});

describe('fifteenth remediation gate — latest-relation-generation ownership for notifyRelationChange/syncBusyFromPrerender, and genuine prerender-failure retry', () => {
  const secondRelation = () => adversarialRelation({
    elementDirectionAB: 'A · fire → B · earth',
    numerologySpine: '3 + 3 → 6',
    cardPairHead: 'no. lxxiii × no. xxxvii',
  });

  it('nested notify(A) -> notify(B) from a hostile relation field getter: B remains the one warm cache — clicking exports B, never A, with no wasted third raster (exact live-repro shape)', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined, imageDefer: true });
    const btn = makeEl('button');
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = { btn, status, disclosure };
    const relationB = secondRelation();
    let nested = false;
    let controllerRef;
    // Object.defineProperty, not a spread-object literal override — the
    // `{...overrides}` spread inside adversarialRelation() would EVALUATE a
    // getter passed that way immediately, during construction, long before
    // buildPairImprintSnapshot ever reads it.
    const relationA = adversarialRelation();
    Object.defineProperty(relationA, 'elementDirectionAB', {
      configurable: true,
      get() {
        if (!nested) {
          nested = true;
          controllerRef.notifyRelationChange(relationB);
        }
        return 'A · water → B · wood';
      },
    });
    const controller = initPairShareUI(refs, { getRelation: () => relationB });
    controllerRef = controller;
    controller.notifyRelationChange(relationA);
    expect(nested).toBe(true);
    // Only B's raster ever started — A's outer continuation stopped at the
    // checkpoint immediately after buildPairImprintSnapshot, BEFORE ever
    // reaching svgToPngBlob.
    expect(log.pendingImages).toHaveLength(1);
    log.pendingImages[0]();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    // Still just one — settling B never triggers a wasted/corrupting third
    // render from A's stale continuation.
    expect(log.pendingImages).toHaveLength(1);
    expect(log.svg[log.svg.length - 1]).toContain('fire'); // B's own text
    expect(log.svg[log.svg.length - 1]).not.toContain('A · water → B · wood'); // never A's

    await controller.onShareClick();
    expect(log.shared).toHaveLength(1); // native share invoked synchronously — the warm-cache fast path
    expect(log.anchors).toHaveLength(0); // no download fallback needed
  });

  it('old A settle -> disabled=false setter -> notify(B): B remains disabled=true/aria-busy=true with its own visible preparing status; old A performs no post-loss DOM write; B then settles to a coherent idle state (exact live-repro shape)', async () => {
    const log = installEnv({ imageDefer: true }); // no canShare/share configured — irrelevant to this scenario
    const relationA = adversarialRelation();
    const relationB = secondRelation();
    const attrs = {};
    let disabledValue = false;
    let armed = false;
    let reentered = false;
    let controllerRef;
    const btn = {
      get disabled() { return disabledValue; },
      set disabled(v) {
        disabledValue = !!v;
        if (armed && v === false && !reentered) {
          reentered = true;
          controllerRef.notifyRelationChange(relationB);
        }
      },
      setAttribute(k, v) { attrs[k] = String(v); },
      getAttribute(k) { return attrs[k]; },
      addEventListener() {},
    };
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = { btn, status, disclosure };
    const controller = initPairShareUI(refs, { getRelation: () => relationB });
    controllerRef = controller;
    controller.notifyRelationChange(relationA);
    armed = true;

    expect(log.pendingImages).toHaveLength(1); // A's own raster started
    log.pendingImages[0](); // settle A — its own syncBusyFromPrerender(false) crosses applyBusyDOM's disabled=false setter, which reenters
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    expect(reentered).toBe(true);
    expect(log.pendingImages).toHaveLength(2); // B's own raster also genuinely started
    // B's busy state is intact — never overwritten by A's stale continuation.
    expect(disabledValue).toBe(true);
    expect(attrs['aria-busy']).toBe('true');
    expect(status.textContent).toBe(pairShareStatusMessage('busy'));
    expect(status.hidden).toBe(false);

    // Settle B for real — must reach a coherent idle state, not stuck busy.
    log.pendingImages[1]();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(disabledValue).toBe(false);
    expect(attrs['aria-busy']).toBe('false');
    expect(status.hidden).toBe(true);
    expect(status.textContent).toBe('');
    void log;
  });

  it('a hostile status.textContent SETTER reentering notifyRelationChange during the status-clearing block leaves the newer notification the sole owner of the cache — the older continuation never starts its own raster', async () => {
    const log = installEnv({ imageDefer: true });
    let armed = false; // construction's OWN idle-reset write (resetControllerDOM) also sets textContent='' -- skip that one
    let reentered = false;
    let controllerRef;
    const relationA = adversarialRelation();
    const relationB = secondRelation();
    let textValue = 'stale prior status';
    let hiddenValue = false;
    const status = {
      get textContent() { return textValue; },
      set textContent(v) {
        textValue = v;
        if (armed && v === '' && !reentered) {
          reentered = true;
          controllerRef.notifyRelationChange(relationB);
        }
      },
      get hidden() { return hiddenValue; },
      set hidden(v) { hiddenValue = v; },
    };
    const btn = makeEl('button');
    const disclosure = makeEl('div');
    const refs = { btn, status, disclosure };
    const controller = initPairShareUI(refs, { getRelation: () => relationB });
    controllerRef = controller;
    armed = true; // now arm for THIS test's own notifyRelationChange(relationA) call below
    controller.notifyRelationChange(relationA);
    expect(reentered).toBe(true);
    // Only B's raster started — the outer (A) continuation lost the race
    // during the status-clearing block itself and stopped at the
    // checkpoint right after buildPairImprintSnapshot, before ever
    // reaching svgToPngBlob for A.
    expect(log.pendingImages).toHaveLength(1);
    void log;
  });

  it('a one-time prerender raster failure for an UNCHANGED pair is truthful on the first prerender, then a click genuinely retries and succeeds — no permanent error cache (exact live-repro shape)', async () => {
    const RealBlob = globalThis.Blob;
    let canvasAttempts = 0;
    let anchorClicks = 0;
    globalThis.URL.createObjectURL = () => `blob:retry-test-${canvasAttempts}`;
    globalThis.URL.revokeObjectURL = () => {};
    globalThis.Image = class { set src(_v) { this.onload(); } };
    globalThis.document = {
      body: { appendChild() {} },
      createElement(tag) {
        if (tag === 'canvas') {
          return {
            set width(_v) {}, set height(_v) {},
            getContext() {
              canvasAttempts += 1;
              if (canvasAttempts === 1) throw new Error('one-time canvas failure');
              return { drawImage() {} };
            },
            toBlob(cb) { cb(new RealBlob(['png'], { type: 'image/png' })); },
          };
        }
        return {
          set href(_v) {}, set download(_v) {},
          click() { anchorClicks += 1; },
          remove() {},
        };
      },
    };
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true, writable: true });

    const btn = makeEl('button');
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const controller = initPairShareUI({ btn, status, disclosure }, { getRelation: () => VALID_RELATION });
    controller.notifyRelationChange(VALID_RELATION);
    await Promise.resolve(); await Promise.resolve();
    expect(canvasAttempts).toBe(1); // the one-time prerender failure already happened, truthfully cached

    await controller.onShareClick();
    // The click genuinely retries — a real SECOND raster attempt, not a
    // permanently-cached failure — and this one succeeds.
    expect(canvasAttempts).toBe(2);
    expect(anchorClicks).toBe(1);
    expect(status.textContent).toBe(pairShareStatusMessage('download-started'));

    await controller.onShareClick();
    // A LATER click continues to work normally too — not a one-shot fluke.
    expect(canvasAttempts).toBe(3);
    expect(anchorClicks).toBe(2);
  });

  it('a superseded (non-nested, sequential) relation generation whose raster settles AFTER a newer notify() cannot publish cache or synchronize busy/status state', async () => {
    const log = installEnv({ imageDefer: true });
    const relationA = adversarialRelation();
    const relationB = secondRelation();
    const btn = makeEl('button');
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const controller = initPairShareUI({ btn, status, disclosure }, { getRelation: () => relationB });
    controller.notifyRelationChange(relationA); // starts A's raster
    controller.notifyRelationChange(relationB); // sequential, not nested — supersedes A, starts B's raster
    expect(log.pendingImages).toHaveLength(2);
    // Settle the OLDER (A) raster AFTER B has already taken over.
    log.pendingImages[0]();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    // A's settle must not have published anything — B's own (still
    // unsettled) pending state is what's reflected.
    expect(btn.disabled).toBe(true);
    expect(status.textContent).toBe(pairShareStatusMessage('busy'));
    // Settle B for real.
    log.pendingImages[1]();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(btn.disabled).toBe(false);
    expect(status.hidden).toBe(true);
  });

  it('a retired controller\'s notifyRelationChange is a hard no-op — no cache write, no DOM write, no raster started', () => {
    const log = installEnv({ imageDefer: true });
    const btn = makeEl('button');
    const status = makeEl('p');
    const disclosure = makeEl('div');
    const refs = { btn, status, disclosure };
    const controllerA = initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    // Re-init on the SAME refs retires controllerA (the module's own
    // atomic-handoff protocol, unrelated to this gate's fix, but the
    // precondition this test needs).
    initPairShareUI(refs, { getRelation: () => VALID_RELATION });
    controllerA.notifyRelationChange(secondRelation());
    expect(log.pendingImages).toHaveLength(0); // no raster started on behalf of a retired controller
    void log;
  });
});
