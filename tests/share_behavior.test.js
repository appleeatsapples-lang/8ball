// 8ball / tests / share_behavior.test.js
// ui/share.js LIVE PATH run for real (2026-07-24 coverage pass).
//
// tests/share_surface.test.js exercises the pure builders and pins the §5.D
// invariants that a static scan can prove (no fetch, no paid-content read,
// no PII in the source). Everything downstream of the click — rowSections
// against live row refs, renderCardPng, the navigator.share branch, the
// download + clipboard fallback, and flashStatus — never executed: 50%
// statements, 8 of 25 functions. This file boots initShareUI and drives
// onShare end to end against stubbed browser globals (node env, no jsdom,
// same convention as tests/meanings_behavior.test.js).
//
// What the live path proves that the builder tests cannot: the sealed-value
// strip holds on the bytes that actually leave the device (the SVG handed to
// the rasterizer and the caption handed to the share sheet), the object URLs
// are revoked, a dismissed share sheet stays silent, and no network surface
// is touched during a share.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initShareUI } from '../ui/share.js';

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

// ── element stubs ─────────────────────────────────────────────────
function makeEl(tag = 'div') {
  const handlers = {};
  const classes = new Set();
  return {
    tag,
    textContent: '',
    hidden: false,
    offsetWidth: 0,
    clickCount: 0,
    removeCount: 0,
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      contains: c => classes.has(c),
    },
    addEventListener(ev, fn) { handlers[ev] = fn; },
    _fire(ev, arg) { return handlers[ev] && handlers[ev](arg); },
    click() { this.clickCount++; },
    remove() { this.removeCount++; },
  };
}

// A live row ref as ui/tiers.js shareRowRefs() produces it.
const row = (title, cells) => ({ title, cells });
const open = value => ({ state: 'open', value });
const sealed = value => ({ state: 'sealed', value }); // adversarial: sealed WITH a value
const unres = () => ({ state: 'unres', value: '—' });

function installEnv({
  canShare = null,       // null → property absent entirely
  share = null,
  clipboard = null,
  toBlob = 'ok',         // 'ok' | 'null'
  imageFails = false,
  contextThrows = false,
} = {}) {
  const log = {
    svg: [], created: [], revoked: [], anchors: [], canvases: [],
    shared: [], copied: [], fetchCalls: 0,
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
      if (imageFails) { if (this.onerror) this.onerror(); }
      else if (this.onload) this.onload();
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

  globalThis.fetch = () => { log.fetchCalls++; throw new Error('network is forbidden during share (§5.D c)'); };
  return log;
}

function boot({ catalog = 'no. 042', symbols } = {}) {
  const refs = {
    btn: makeEl('button'),
    status: makeEl('p'),
    catalog: Object.assign(makeEl('span'), { textContent: catalog }),
    symbols: symbols || [
      row('ARCANA', [open('XXI · the world')]),
      row('FIVE-ELEMENT', [sealed('metal')]),
      row('SUN ↑ RISING', [open('gemini'), sealed('virgo')]),
      row('LIFE · NAME · SOUL', [open('3'), unres(), sealed('7')]),
    ],
  };
  initShareUI(refs, {});
  return refs;
}

const clickShare = refs => refs.btn._fire('click');

// One row group of the specimen SVG, by its title.
function svgRow(svg, title) {
  const group = svg
    .split('<g transform=').slice(1)
    .map(part => `<g transform=${part}`)
    .find(part => part.includes(`>${title}</text>`));
  if (!group) throw new Error(`row group not found: ${title}`);
  return group.split('</g>')[0];
}

// Value slots render at font-size 13; row titles render at 9.
const valueTexts = group =>
  [...group.matchAll(/font-size="13"[^>]*>([^<]*)</g)].map(m => m[1]);

beforeEach(() => { vi.useFakeTimers(); });

afterEach(() => {
  vi.useRealTimers();
  globalThis.document = originals.document;
  globalThis.Image = originals.Image;
  globalThis.Blob = originals.Blob;
  globalThis.fetch = originals.fetch;
  globalThis.URL.createObjectURL = originals.createObjectURL;
  globalThis.URL.revokeObjectURL = originals.revokeObjectURL;
  if (originals.navigatorDescriptor) {
    Object.defineProperty(globalThis, 'navigator', originals.navigatorDescriptor);
  }
});

describe('share wiring (DOCTRINE §6 DI)', () => {
  it('initShareUI binds the click and one click runs the whole flow', async () => {
    const log = installEnv({ clipboard: () => {} });
    const refs = boot();
    await clickShare(refs);
    expect(log.canvases).toHaveLength(1);
    expect(log.anchors).toHaveLength(1);
  });

  it('tolerates a boot with no button ref', () => {
    installEnv();
    expect(() => initShareUI({}, {})).not.toThrow();
    expect(() => initShareUI(null, null)).not.toThrow();
  });
});

describe('sealed values never reach the shared artifact (§5.D invariant a)', () => {
  it('the SVG handed to the rasterizer carries open values and no sealed value', async () => {
    const log = installEnv({ clipboard: () => {} });
    const refs = boot();
    await clickShare(refs);
    expect(log.svg).toHaveLength(1);
    const svg = log.svg[0];
    for (const shown of ['XXI · the world', 'gemini', 'ARCANA', 'FIVE-ELEMENT', 'LIFE · NAME · SOUL']) {
      expect(svg, `${shown} should render`).toContain(shown);
    }
    for (const hidden of ['metal', 'virgo']) {
      expect(svg, `sealed value ${hidden} must not reach the artifact`).not.toContain(hidden);
    }
    // Every sealed cell renders a hatch instead of a value — 3 in this sheet.
    expect(svg.match(/fill="url\(#seal-hatch\)"/g)).toHaveLength(3);
  });

  it('a single-character sealed value is hatched, not rendered — checked structurally', async () => {
    // A bare digit cannot be swept for as a substring (SVG geometry is full of
    // them), so assert the row's value slots directly: the numerology row must
    // emit exactly its open and unresolved values, plus one hatch for the
    // sealed 7.
    const log = installEnv({ clipboard: () => {} });
    await clickShare(boot());
    const group = svgRow(log.svg[0], 'LIFE · NAME · SOUL');
    expect(valueTexts(group)).toEqual(['3', '—']);
    expect(group.match(/fill="url\(#seal-hatch\)"/g)).toHaveLength(1);
  });

  it('the caption handed to the share sheet carries no sealed value', async () => {
    const log = installEnv({ canShare: () => true, share: () => {} });
    const refs = boot();
    await clickShare(refs);
    const { text } = log.shared[0];
    expect(text).toContain('no. 042');
    expect(text).toContain('gemini');
    expect(text).toContain('sealed remainder');
    for (const hidden of ['metal', 'virgo']) expect(text).not.toContain(hidden);
    expect(text).toContain('https://the-eight-ball.netlify.app');
  });

  it('the unresolved field is skipped rather than shared as a dash', async () => {
    const log = installEnv({ canShare: () => true, share: () => {} });
    const refs = boot();
    await clickShare(refs);
    expect(log.shared[0].text.split('\n')[0]).not.toContain('—');
  });

  it('no network call is made anywhere in the flow (§5.D invariant c)', async () => {
    const log = installEnv({ canShare: () => true, share: () => {} });
    const refs = boot();
    await clickShare(refs);
    expect(log.fetchCalls).toBe(0);
  });
});

describe('raster step', () => {
  it('rasters at the locked specimen geometry and asks for a PNG', async () => {
    const log = installEnv({ clipboard: () => {} });
    await clickShare(boot());
    const canvas = log.canvases[0];
    expect([canvas.width, canvas.height]).toEqual([960, 1440]); // 320×480 at SCALE 3
    expect(canvas.contextKind).toBe('2d');
    expect(canvas.drawn.slice(1)).toEqual([0, 0, 960, 1440]);
    expect(canvas.toBlobType).toBe('image/png');
  });

  it('revokes the SVG object URL once the raster is consumed', async () => {
    const log = installEnv({ clipboard: () => {} });
    await clickShare(boot());
    expect(log.revoked).toContain(log.created[0]);
  });

  it('a failed image load aborts silently and still revokes the URL', async () => {
    const log = installEnv({ imageFails: true, canShare: () => true, share: () => {} });
    const refs = boot();
    await expect(clickShare(refs)).resolves.toBeUndefined();
    expect(log.revoked).toEqual([log.created[0]]);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe('');
  });

  it('a null toBlob aborts silently — nothing is shared or downloaded', async () => {
    const log = installEnv({ toBlob: 'null', canShare: () => true, share: () => {} });
    const refs = boot();
    await clickShare(refs);
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(0);
    expect(refs.status.textContent).toBe('');
  });

  it('a canvas that refuses a context aborts silently and revokes', async () => {
    const log = installEnv({ contextThrows: true, clipboard: () => {} });
    const refs = boot();
    await clickShare(refs);
    expect(log.revoked).toEqual([log.created[0]]);
    expect(log.anchors).toHaveLength(0);
  });
});

describe('native share branch', () => {
  it('hands the PNG file and caption to the share sheet, with no fallback noise', async () => {
    const log = installEnv({ canShare: () => true, share: () => {}, clipboard: () => {} });
    const refs = boot();
    await clickShare(refs);
    expect(log.shared).toHaveLength(1);
    const [file] = log.shared[0].files;
    expect(file.name).toBe('8ball-specimen-042.png');
    expect(file.type).toBe('image/png');
    expect(log.anchors).toHaveLength(0);   // no download
    expect(log.copied).toHaveLength(0);    // no clipboard
    expect(refs.status.textContent).toBe(''); // no flash
  });

  it('asks canShare about the actual file before using the sheet', async () => {
    const seen = [];
    const log = installEnv({ canShare: p => { seen.push(p); return true; }, share: () => {} });
    await clickShare(boot());
    expect(seen).toHaveLength(1);
    expect(seen[0].files[0].name).toBe('8ball-specimen-042.png');
    expect(log.shared).toHaveLength(1);
  });

  it('a dismissed share sheet stays silent — no download, no clipboard, no status', async () => {
    const log = installEnv({
      canShare: () => true,
      share: () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; },
      clipboard: () => {},
    });
    const refs = boot();
    await expect(clickShare(refs)).resolves.toBeUndefined();
    expect(log.anchors).toHaveLength(0);
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).toBe('');
  });

  it('falls back when canShare rejects the file rather than sharing anyway', async () => {
    const log = installEnv({ canShare: () => false, share: () => {}, clipboard: () => {} });
    await clickShare(boot());
    expect(log.shared).toHaveLength(0);
    expect(log.anchors).toHaveLength(1);
  });
});

describe('download + clipboard fallback', () => {
  it('downloads under the catalog filename and copies the caption', async () => {
    const log = installEnv({ clipboard: () => {} });
    const refs = boot();
    await clickShare(refs);
    const anchor = log.anchors[0];
    expect(anchor.download).toBe('8ball-specimen-042.png');
    expect(anchor.href).toBe(log.created[1]); // a second object URL, for the PNG
    expect(anchor.clickCount).toBe(1);
    expect(anchor.removeCount).toBe(1);
    expect(log.copied[0]).toContain('no. 042');
    expect(refs.status.textContent).toBe('image saved · caption copied');
  });

  it('revokes the download URL on the delayed timer, not immediately', async () => {
    const log = installEnv({ clipboard: () => {} });
    await clickShare(boot());
    const downloadUrl = log.created[1];
    expect(log.revoked).not.toContain(downloadUrl);
    vi.advanceTimersByTime(1000);
    expect(log.revoked).toContain(downloadUrl);
  });

  it('a rejected clipboard write still confirms the saved image', async () => {
    const log = installEnv({ clipboard: () => { throw new Error('denied'); } });
    const refs = boot();
    await clickShare(refs);
    expect(log.anchors).toHaveLength(1);
    expect(refs.status.textContent).toBe('image saved');
  });

  it('no clipboard API at all still downloads and confirms', async () => {
    const log = installEnv();
    const refs = boot();
    await clickShare(refs);
    expect(log.copied).toHaveLength(0);
    expect(refs.status.textContent).toBe('image saved');
  });

  it('an unrecognized catalog falls back to the generic filename (no profile token can ride)', async () => {
    const log = installEnv({ clipboard: () => {} });
    await clickShare(boot({ catalog: 'ada 1988-03-04' }));
    expect(log.anchors[0].download).toBe('8ball-specimen.png');
  });
});

describe('status flash lifecycle', () => {
  it('shows, then hides after the transition window', async () => {
    installEnv({ clipboard: () => {} });
    const refs = boot();
    await clickShare(refs);
    expect(refs.status.hidden).toBe(false);
    expect(refs.status.classList.contains('visible')).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(refs.status.classList.contains('visible')).toBe(false);
    expect(refs.status.hidden).toBe(false); // still occupying space during the fade
    vi.advanceTimersByTime(400);
    expect(refs.status.hidden).toBe(true);
  });
});
