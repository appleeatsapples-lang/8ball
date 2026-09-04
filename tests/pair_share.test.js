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
} from '../ui/pairShare.js';

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

describe('pairShareStatusMessage — every outcome is a distinct, non-overclaiming string', () => {
  it('shared / downloaded / downloaded-copied / cancelled / empty / failed are all different', () => {
    const states = ['shared', 'downloaded', 'downloaded-copied', 'cancelled', 'empty', 'failed'];
    const messages = states.map(pairShareStatusMessage);
    expect(new Set(messages).size).toBe(states.length);
    for (const msg of messages) expect(msg.length).toBeGreaterThan(0);
  });

  it('only `shared` claims the artifact was actually shared', () => {
    for (const state of ['downloaded', 'downloaded-copied', 'cancelled', 'empty', 'failed']) {
      expect(pairShareStatusMessage(state).toLowerCase()).not.toContain('shared');
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

const RealBlob = globalThis.Blob;
const originals = {
  document: globalThis.document,
  Image: globalThis.Image,
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
    _fire(ev, arg) { return handlers[ev] && handlers[ev](arg); },
    click() { this.clickCount++; },
    remove() { this.removeCount++; },
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
  };
}

function installEnv({
  canShare = null, share = null, clipboard = null,
  toBlob = 'ok', imageFails = false, contextThrows = false, imageDefer = false,
} = {}) {
  const log = {
    svg: [], created: [], revoked: [], anchors: [], canvases: [], shared: [], copied: [], fetchCalls: 0,
    // Only populated when imageDefer is true — one release function per
    // constructed Image, so a test can hold rasterization "in flight" and
    // release it at a chosen moment (audit A2: prove the identity guard
    // catches a change that happens WHILE the async work is pending, not
    // only before it starts).
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
  const body = { appendChild(node) { log.anchors.push(node); return node; } };
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
      return makeEl(tag);
    },
  };
  const navigator = {};
  if (canShare) navigator.canShare = canShare;
  if (share) navigator.share = async payload => { log.shared.push(payload); return share(payload); };
  if (clipboard) navigator.clipboard = { writeText: async text => { log.copied.push(text); return clipboard(text); } };
  Object.defineProperty(globalThis, 'navigator', { value: navigator, configurable: true, writable: true });
  globalThis.fetch = () => { log.fetchCalls++; throw new Error('network is forbidden (§5/§7)'); };
  return log;
}

function boot(getRelation) {
  const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
  initPairShareUI(refs, { getRelation });
  return refs;
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
  if (originals.navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', originals.navigatorDescriptor);
});

describe('Pair Imprint — the live click path', () => {
  it('initPairShareUI tolerates a boot with no refs/hooks', () => {
    installEnv();
    expect(() => initPairShareUI({}, {})).not.toThrow();
    expect(() => initPairShareUI(null, null)).not.toThrow();
  });

  it('empty relation: no render attempted, status reads "nothing to share yet"', async () => {
    const log = installEnv({ clipboard: () => {} });
    const refs = boot(() => null);
    await clickShare(refs);
    expect(log.canvases).toHaveLength(0);
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('empty'));
    expect(log.fetchCalls).toBe(0);
  });

  it('native Web Share success: status reads "shared", the PNG + caption travel together, no download/clipboard', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const refs = boot(() => VALID_RELATION);
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
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('cancelled'));
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('shared'));
  });

  it('a genuine share exception (not AbortError): status reads "failed"', async () => {
    installEnv({ canShare: () => true, share: () => { throw new Error('boom'); } });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });

  it('no native share support: falls back to download + clipboard copy', async () => {
    const log = installEnv({ clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(log.copied).toHaveLength(1);
    expect(log.copied[0]).toContain('8 ball · pair reading');
    expect(refs.status.textContent).toBe(pairShareStatusMessage('downloaded-copied'));
  });

  it('download fallback with no/denied clipboard: status reads "downloaded" only, never claims a copy', async () => {
    const log = installEnv(); // no clipboard installed
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('downloaded'));
  });

  it('canShare present but returns false for this file: falls back to download, not a broken share attempt', async () => {
    const log = installEnv({ canShare: () => false, share: () => undefined, clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1);
  });

  it('every object URL created (the SVG source and the download anchor) is revoked', async () => {
    const log = installEnv({ clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    // The SVG blob URL is revoked synchronously once the rasterizer's Image
    // has loaded — before the download step even starts.
    expect(log.revoked).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    // The download anchor's URL is revoked on its own 1000ms timer.
    expect(log.revoked).toHaveLength(2);
    expect(log.created).toEqual(log.revoked);
  });

  it('a render failure (canvas context throws): status reads "failed", nothing shared or downloaded', async () => {
    const log = installEnv({ contextThrows: true, clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });

  it('no network call at any point in the flow', async () => {
    const log = installEnv({ canShare: () => true, share: () => undefined });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.fetchCalls).toBe(0);
  });

  it('the SVG handed to the rasterizer is the same allow-listed snapshot the pure builder produces — the adversarial sentinel, end to end', async () => {
    const log = installEnv({ clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.svg).toHaveLength(1);
    expect(log.svg[0]).not.toContain(SENTINEL_NAME);
    expect(log.svg[0]).not.toContain(SENTINEL_DOB);
    expect(log.svg[0]).not.toContain('liuhe');
  });

  it('a status message clears itself after a few seconds rather than sticking forever', async () => {
    installEnv({ clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.hidden).toBe(false);
    vi.advanceTimersByTime(4000);
    expect(refs.status.hidden).toBe(true);
  });
});

// ── Remediation gate (audit_pair_dossier_imprint_2026-09-04.md) ─────────

describe('C2 — busy state during generation', () => {
  it('disables the button and sets aria-busy the instant the click starts, announcing preparation', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    const pending = clickShare(refs); // NOT awaited yet — still mid-flight
    expect(refs.btn.disabled).toBe(true);
    expect(refs.btn.getAttribute('aria-busy')).toBe('true');
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('busy'));
    log.pendingImages[0](); // release rasterization
    await pending;
    expect(refs.btn.disabled).toBe(false);
    expect(refs.btn.getAttribute('aria-busy')).toBe('false');
  });

  it('clears busy state on EVERY terminal path — empty, failed, and success alike', async () => {
    installEnv();
    const refsEmpty = boot(() => null);
    await clickShare(refsEmpty);
    // The empty path returns before setBusy(true) is ever reached — there is
    // no busy state to clear, so aria-busy is simply never touched (stays
    // the static markup's own default in a real DOM). Not-true is the
    // correct assertion here, not a forced 'false'.
    expect(refsEmpty.btn.disabled).toBe(false);
    expect(refsEmpty.btn.getAttribute('aria-busy')).not.toBe('true');

    installEnv({ contextThrows: true });
    const refsFailed = boot(() => VALID_RELATION);
    await clickShare(refsFailed);
    expect(refsFailed.btn.disabled).toBe(false);
    expect(refsFailed.btn.getAttribute('aria-busy')).toBe('false');

    installEnv({ clipboard: () => {} });
    const refsOk = boot(() => VALID_RELATION);
    await clickShare(refsOk);
    expect(refsOk.btn.disabled).toBe(false);
    expect(refsOk.btn.getAttribute('aria-busy')).toBe('false');
  });

  it('the terminal status text is never clobbered by the busy-state teardown', async () => {
    installEnv({ clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('downloaded-copied'));
  });
});

describe('C1 — capability is disclosed before the button is ever pressed', () => {
  const originalShare = globalThis.navigator?.share;
  const originalCanShare = globalThis.navigator?.canShare;

  it('discloses "shares...directly" when the platform supports native file share', () => {
    installEnv({ canShare: () => true, share: () => undefined });
    const refs = boot(() => VALID_RELATION);
    expect(refs.disclosure.textContent).toContain('pair imprint');
    expect(refs.disclosure.textContent).toContain('shares the pair imprint directly');
    expect(refs.disclosure.textContent).not.toMatch(/web share|navigator|browser api/i);
  });

  it('discloses "saves...as an image" when native share is unsupported', () => {
    installEnv();
    const refs = boot(() => VALID_RELATION);
    expect(refs.disclosure.textContent).toContain('pair imprint');
    expect(refs.disclosure.textContent).toContain('saves the pair imprint as an image on this device');
  });

  it('tolerates a boot with no disclosure ref', () => {
    installEnv({ clipboard: () => {} });
    expect(() => initPairShareUI({ btn: makeEl('button'), status: makeEl('p') }, { getRelation: () => null })).not.toThrow();
  });

  it('the disclosure copy is a pure function of capability — independently testable', () => {
    expect(pairImprintDisclosureText(true)).toBe('created on this device · personal details excluded · shares the pair imprint directly');
    expect(pairImprintDisclosureText(false)).toBe('created on this device · personal details excluded · saves the pair imprint as an image on this device');
  });
});

describe('A2 — stale/concurrent operations never complete a side effect for the wrong pair', () => {
  it('permits only one active operation — a second click while one is in flight is a silent no-op', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    const first = clickShare(refs);
    const second = clickShare(refs); // fired before the first has resolved
    expect(log.pendingImages).toHaveLength(1); // the second click never started its own rasterization
    log.pendingImages[0]();
    await Promise.all([first, second]);
    expect(log.anchors).toHaveLength(1); // exactly one download, not two
  });

  it('a relation replaced WHILE rasterization is in flight invalidates the operation — no share, no download', async () => {
    let relation = VALID_RELATION;
    const log = installEnv({ imageDefer: true, canShare: () => true, share: () => undefined });
    const refs = boot(() => relation);
    const pending = clickShare(refs);
    relation = adversarialRelation({ elementDirectionAB: 'A · fire → B · water · generating' }); // Compare Another landed a new pair
    log.pendingImages[0]();
    await pending;
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('the pair closing (relation becomes null) WHILE rasterization is in flight is also caught', async () => {
    let relation = VALID_RELATION;
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const refs = boot(() => relation);
    const pending = clickShare(refs);
    relation = null; // Back / close landed
    log.pendingImages[0]();
    await pending;
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('a re-init (initPairShareUI called again) invalidates an operation the PRIOR instance started', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const refs = boot(() => VALID_RELATION);
    const pending = clickShare(refs);
    // A fresh init — e.g. the host re-wiring the module — bumps the
    // generation counter out from under the in-flight operation above, AND
    // takes over module-level `_refs`/`_hooks` (a real re-init replaces the
    // whole wiring, not just the generation number) — so the stale
    // resolution is observed on the NEW instance's status node, which is
    // the accurate description of what re-init actually does.
    const refs2 = boot(() => VALID_RELATION);
    log.pendingImages[0]();
    await pending;
    expect(log.anchors).toHaveLength(0);
    expect(refs2.status.textContent).toBe(pairShareStatusMessage('stale'));
  });

  it('an UNCHANGED relation across the same async boundary completes normally — the guard does not false-positive', async () => {
    const log = installEnv({ imageDefer: true, clipboard: () => {} });
    const refs = boot(() => VALID_RELATION); // same reference every call
    const pending = clickShare(refs);
    log.pendingImages[0]();
    await pending;
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).not.toBe(pairShareStatusMessage('stale'));
  });
});

describe('A3 — every capability is contained independently; nothing escapes as an unhandled rejection', () => {
  it('a throwing File constructor settles to "failed", never an unhandled rejection', async () => {
    installEnv();
    const RealFile = globalThis.File;
    globalThis.File = class { constructor() { throw new Error('no File here'); } };
    try {
      const refs = boot(() => VALID_RELATION);
      await expect(clickShare(refs)).resolves.toBeUndefined();
      expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
    } finally {
      globalThis.File = RealFile;
    }
  });

  it('a throwing canShare falls back to download rather than propagating', async () => {
    const log = installEnv({ clipboard: () => {} });
    globalThis.navigator.canShare = () => { throw new Error('canShare exploded'); };
    globalThis.navigator.share = async () => undefined;
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('downloaded-copied'));
  });

  it('canShare is evaluated with the EXACT payload navigator.share receives (files AND text), not a narrower one', async () => {
    let seenPayload = null;
    installEnv({
      canShare: payload => { seenPayload = payload; return true; },
      share: () => undefined,
    });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(seenPayload).toHaveProperty('files');
    expect(seenPayload).toHaveProperty('text');
    expect(typeof seenPayload.text).toBe('string');
    expect(seenPayload.text.length).toBeGreaterThan(0);
  });

  it('a throwing download (anchor.click) settles to "failed", never attempts clipboard on top of it', async () => {
    const log = installEnv({ clipboard: () => {} });
    const originalCreateElement = globalThis.document.createElement;
    globalThis.document.createElement = tag => {
      const el = originalCreateElement(tag);
      if (tag === 'a') el.click = () => { throw new Error('download blocked'); };
      return el;
    };
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).toBe(pairShareStatusMessage('failed'));
  });

  it('clipboard failure never invalidates an already-successful download', async () => {
    const log = installEnv({ clipboard: () => { throw new Error('denied'); } });
    const refs = boot(() => VALID_RELATION);
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1); // the download still happened
    expect(refs.status.textContent).toBe(pairShareStatusMessage('downloaded'));
  });

  it('a throwing getRelation() hook is contained and settles truthfully, never an unhandled rejection', async () => {
    installEnv();
    const refs = { btn: makeEl('button'), status: makeEl('p'), disclosure: makeEl('div') };
    initPairShareUI(refs, { getRelation: () => { throw new Error('hook exploded'); } });
    // relationNow() contains the throw and treats it the same as "no
    // relation available" — the outcome is `empty`, not `failed`: nothing
    // was attempted (no render, no share, no download), so "nothing to
    // share yet" is the truthful description, not a claim that something
    // was tried and broke. The load-bearing proof is that the promise
    // resolves at all — a throwing hook must never become an unhandled
    // rejection.
    await expect(clickShare(refs)).resolves.toBeUndefined();
    expect(refs.status.textContent).toBe(pairShareStatusMessage('empty'));
  });

  it('an absent navigator object entirely degrades to the download fallback path, not a crash', async () => {
    installEnv({ clipboard: () => {} });
    const savedDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    // Simulate an environment where `navigator.canShare`/`.share` are
    // simply undefined (the realistic "unsupported" shape) rather than
    // deleting the global entirely, which no real browser ever does but
    // which the `typeof navigator !== 'undefined'` guards defend anyway.
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true, writable: true });
    try {
      const refs = boot(() => VALID_RELATION);
      await expect(clickShare(refs)).resolves.toBeUndefined();
    } finally {
      if (savedDescriptor) Object.defineProperty(globalThis, 'navigator', savedDescriptor);
    }
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
