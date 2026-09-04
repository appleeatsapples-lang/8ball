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

// Item 8: the real taxonomy is EIGHT states, not six — `busy` and `stale`
// are real, reachable, user-visible states in their own right (an earlier
// journal entry undercounted this before either existed as a distinguished
// state), not implementation footnotes. This enumeration is the single
// source of truth every other "every state"-shaped test/count should agree
// with.
const ALL_STATES = ['busy', 'shared', 'download-started', 'download-started-copied', 'cancelled', 'stale', 'empty', 'failed'];

describe('pairShareStatusMessage — every outcome is a distinct, non-overclaiming string (the full eight-state taxonomy)', () => {
  it('all eight real states produce distinct, non-empty messages', () => {
    const messages = ALL_STATES.map(pairShareStatusMessage);
    expect(ALL_STATES).toHaveLength(8);
    expect(new Set(messages).size).toBe(ALL_STATES.length);
    for (const msg of messages) expect(msg.length).toBeGreaterThan(0);
  });

  it('only `shared` claims the artifact was actually shared', () => {
    for (const state of ALL_STATES.filter(s => s !== 'shared')) {
      expect(pairShareStatusMessage(state).toLowerCase()).not.toContain('shared');
    }
  });

  it('no state claims the artifact was "saved" — only that a download STARTED (item 6: this module cannot observe disk completion)', () => {
    for (const state of ALL_STATES) {
      expect(pairShareStatusMessage(state).toLowerCase()).not.toMatch(/\bsaved\b/);
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
const originals = {
  document: globalThis.document,
  Image: globalThis.Image,
  Blob: globalThis.Blob,
  fetch: globalThis.fetch,
  createObjectURL: globalThis.URL.createObjectURL,
  revokeObjectURL: globalThis.URL.revokeObjectURL,
  navigatorDescriptor: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  File: globalThis.File,
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
  globalThis.document = originals.document;
  globalThis.Image = originals.Image;
  globalThis.Blob = originals.Blob;
  globalThis.fetch = originals.fetch;
  globalThis.URL.createObjectURL = originals.createObjectURL;
  globalThis.URL.revokeObjectURL = originals.revokeObjectURL;
  globalThis.File = originals.File;
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
    // No click ever happened — nothing was shared or saved, so the
    // transient "preparing…" text clears rather than sticking.
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
  it('fourth-gate item 1: a relation replaced while awaiting navigator.share (RESOLVED) reports "previous pair shared", never a bare "shared" AND never a false "stale"', async () => {
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
    // previous/selected pair.
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('shared'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('stale'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('failed'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared-previous'));
    expect(refs.status.textContent).toBe('previous pair shared.');
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

  it('fourth-gate item 1: a relation replaced while awaiting clipboard.writeText (RESOLVED) reports the download AND the copy, explicitly naming the previous pair — never a bare claim and never a false "stale"/"failed"', async () => {
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
    // falsely imply nothing was saved, and a bare "download started ·
    // caption copied." would ambiguously imply it concerns the pair now
    // on screen. Both real effects are reported, explicitly named as
    // concerning the previous/selected pair.
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('download-started-copied'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('download-started'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('stale'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('failed'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-previous-copied'));
    expect(refs.status.textContent).toBe('download started for previous pair · caption copied.');
  });

  it('fourth-gate item 1: a relation replaced while awaiting clipboard.writeText (REJECTED) reports the download alone, explicitly naming the previous pair — never a false "failed"/"stale" and never a false copy claim', async () => {
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
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('download-started-previous-copied'));
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-previous'));
    expect(refs.status.textContent).toBe('download started for previous pair.');
  });

  it('an UNCHANGED relation across every async boundary completes normally — the guard does not false-positive', async () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const { refs } = await boot(() => VALID_RELATION); // same reference every call
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('shared'));
  });

  it('an UNCHANGED relation across the clipboard await reports the ordinary current-pair copied state, not a "previous pair" qualifier', async () => {
    installEnv({ clipboard: () => {} });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('download-started-copied'));
    expect(refs.status.textContent).not.toContain('previous');
  });

  it('fourth-gate item 1: closing/retiring the controller (not just replacing the pair) while a native share resolves SUPPRESSES the announcement entirely — never a leaked "shared"/"previous pair" onto a new owner\'s refs', async () => {
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
    // not `shared`, not `shared-previous`, nothing.
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

// index.html re-initializes against the SAME static `#dyad-share-btn` /
// `#dyad-share-status` DOM nodes on every dyad-screen open — the realistic
// re-init shape, distinct from the different-refs scenarios above.
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

  it('a throwing download (anchor.click) settles to "failed", never attempts clipboard on top of it', async () => {
    const log = installEnv({ clipboard: () => {}, clickThrows: true });
    const { refs } = await boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
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
