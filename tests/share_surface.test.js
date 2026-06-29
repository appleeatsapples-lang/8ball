// 8ball / tests / share_surface.test.js
//
// v0.4.0 share-surface markup + privacy invariants (DOCTRINE §5.D v0.31
// / §6 / share brief §3). Mirrors the static-scan shape of
// tests/payments_markup.test.js: read index.html + ui/share.js as text
// and assert the surface shape and the §5.D invariants that a static
// scan can prove (no network surface, no paid-content read, no PII).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCardSVGFromSnapshot, buildCaptionFromSnapshot } from '../ui/share.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const shareJs = readFileSync(
  join(__dirname, '..', 'ui', 'share.js'),
  'utf-8'
);

describe('share-surface markup (DOCTRINE §5.D / §6)', () => {
  // The result-controls region: from the controls container open to the
  // disclaimer line that closes the button stack.
  const rcStart = html.indexOf('class="result-controls"');
  const controls = html.slice(
    rcStart,
    html.indexOf('class="disclaimer"', rcStart)
  );

  it('#share-btn lives inside .result-controls', () => {
    expect(controls).toMatch(/id="share-btn"/);
  });

  it('#share-btn is the third control, after shake-again and try-another', () => {
    const iShake = controls.indexOf('id="shake-again-btn"');
    const iTry = controls.indexOf('id="try-another-btn"');
    const iShare = controls.indexOf('id="share-btn"');
    expect(iShake).toBeGreaterThanOrEqual(0);
    expect(iTry).toBeGreaterThan(iShake);
    expect(iShare).toBeGreaterThan(iTry);
  });

  it('#share-btn label is "share" and type is button', () => {
    const m = html.match(/<button([^>]*id="share-btn"[^>]*)>([\s\S]*?)<\/button>/);
    expect(m, 'share-btn element not found').not.toBeNull();
    expect(m[1]).toMatch(/type="button"/);
    expect(m[2].trim()).toBe('share');
  });

  it('share-status confirmation node exists', () => {
    expect(html).toMatch(/id="share-status"/);
  });
});

describe('ui/share.js DI shape (DOCTRINE §6)', () => {
  it('exports initShareUI with (refs, hooks) arity', () => {
    expect(shareJs).toMatch(/export function initShareUI\s*\(\s*refs\s*,\s*hooks\s*\)/);
  });

  it('index.html boots the share surface via initShareUI', () => {
    expect(html).toMatch(/import\s*\{\s*initShareUI\s*\}\s*from\s*['"]\.\/ui\/share\.js['"]/);
    expect(html).toMatch(/initShareUI\(/);
  });

  it('the initShareUI call site passes no profile or paid-card ref (§5.D a/b at the wiring)', () => {
    const i = html.indexOf('initShareUI(');
    expect(i, 'initShareUI call not found').toBeGreaterThanOrEqual(0);
    const call = html.slice(i, html.indexOf(');', i) + 2);
    for (const key of ['btn', 'status', 'catalog', 'symbols']) {
      expect(call, `initShareUI should pass ${key}`).toContain(key);
    }
    for (const bad of ['currentProfile', 'profile', 'cardName', 'card-name', 'cardType', 'cardHabit', 'cardNote', 'unlock']) {
      expect(call, `initShareUI must not pass ${bad}`).not.toContain(bad);
    }
  });
});

describe('share PNG SVG structure', () => {
  const svg = buildCardSVGFromSnapshot({
    catalog: 'no. 042',
    sections: [
      { title: 'ARCANA', cells: [{ value: 'XXI · the world', state: 'open' }] },
      { title: 'FIVE-ELEMENT', cells: [{ value: 'metal', state: 'open' }] },
      { title: 'SUN ↑ RISING', cells: [{ value: 'gemini', state: 'open' }, { value: 'virgo', state: 'open' }] },
      { title: 'PUBLIC ⇌ PRIVATE', cells: [{ value: 'horse', state: 'open' }, { value: 'rabbit', state: 'open' }] },
      { title: 'LIFE · NAME · SOUL', cells: [{ value: '3', state: 'open' }, { value: '8', state: 'open' }, { value: '3', state: 'open' }] },
    ],
  });

  it('carries the 8ball wordmark, catalog, and bare URL inside the export card', () => {
    expect(svg).toContain('>8ball</text>');
    expect(svg).toContain('>no. 042</text>');
    expect(svg).toContain('>the-eight-ball.netlify.app</text>');
    expect(svg).toMatch(/<rect x="16" y="16" width="288" height="448"/);
    expect(svg).toMatch(/x="30" y="43"/);
    expect(svg).toMatch(/y="442"/);
  });

  it('renders the five rows and their open cell values, no paid/profile content', () => {
    expect(svg.match(/<g transform="translate\(0 /g)).toHaveLength(5); // one group per ROW
    for (const text of [
      'ARCANA', 'XXI · the world',
      'FIVE-ELEMENT', 'metal',
      'SUN ↑ RISING', 'gemini', 'virgo',
      'PUBLIC ⇌ PRIVATE', 'horse', 'rabbit',
      'LIFE · NAME · SOUL', '3', '8',
    ]) {
      expect(svg).toContain(`>${text}</text>`);
    }
    for (const forbidden of ['card-name', 'card-type', 'card-habit', 'card-note']) {
      expect(svg).not.toContain(forbidden);
    }
  });

  // The builder is row-count adaptive — every row lands between the stack
  // rules (y 86..398) regardless of count (§5.D v0.39 renders all 8).
  function rowYs(svgStr) {
    return [...svgStr.matchAll(/<g transform="translate\(0 ([\d.]+)\)"/g)]
      .map(m => parseFloat(m[1]));
  }

  it('a 3-section snapshot renders 3 rows inside the stack (row-count adaptive)', () => {
    const small = buildCardSVGFromSnapshot({
      catalog: 'no. 042',
      sections: [
        { title: 'ARCANA', cells: [{ value: 'XXI · the world', state: 'open' }] },
        { title: 'SUN', cells: [{ value: 'gemini', state: 'open' }] },
        { title: 'PUBLIC', cells: [{ value: 'horse', state: 'open' }] },
      ],
    });
    const ys = rowYs(small);
    expect(ys).toHaveLength(3);
    for (const y of ys) {
      expect(y).toBeGreaterThan(86);
      expect(y).toBeLessThan(398);
    }
    expect(small).toContain('>no. 042</text>');
  });

  it('an eight-row snapshot renders 8 rows inside the stack', () => {
    const t3 = buildCardSVGFromSnapshot({
      catalog: 'no. 042',
      sections: [
        { title: 'ARCANA', cells: [{ value: 'XXI · the world', state: 'open' }] },
        { title: 'FIVE-ELEMENT', cells: [{ value: 'metal', state: 'open' }] },
        { title: 'SUN ↑ RISING', cells: [{ value: 'gemini', state: 'open' }, { value: 'virgo', state: 'open' }] },
        { title: 'PUBLIC ⇌ PRIVATE', cells: [{ value: 'horse', state: 'open' }, { value: 'rabbit', state: 'open' }] },
        { title: 'LIFE · NAME · SOUL', cells: [{ value: '3', state: 'open' }, { value: '8', state: 'open' }, { value: '3', state: 'open' }] },
        { title: 'PERSONALITY · BIRTHDAY · MATURITY', cells: [{ value: '5', state: 'open' }, { value: '7', state: 'open' }, { value: '11', state: 'open' }] },
        { title: 'DAY PILLAR', cells: [{ value: 'dragon · earth', state: 'open' }] },
        { title: 'HOUR PILLAR', cells: [{ value: 'rat · wood', state: 'open' }] },
      ],
    });
    const ys = rowYs(t3);
    expect(ys).toHaveLength(8);
    for (const y of ys) {
      expect(y).toBeGreaterThan(86);
      expect(y).toBeLessThan(398);
    }
    expect(t3).toContain('>DAY PILLAR</text>');
    expect(t3).toContain('>HOUR PILLAR</text>');
  });
});

describe('share full-sheet (DOCTRINE §5.D v0.39)', () => {
  // The FREE card: 8 rows, 14 cells, 4 open (arcana, sun, public animal,
  // life path), 10 sealed. Sealed cells are handed a real value on purpose
  // to prove the builder never emits it (per-cell, not per-row — the P1 fix).
  const freeSheet = buildCardSVGFromSnapshot({
    catalog: 'no. 042',
    sections: [
      { title: 'ARCANA', cells: [{ value: 'XXI · the world', state: 'open' }] },
      { title: 'FIVE-ELEMENT', cells: [{ value: 'metal', state: 'sealed' }] },
      { title: 'SUN · RISING', cells: [{ value: 'gemini', state: 'open' }, { value: 'virgo', state: 'sealed' }] },
      { title: 'PUBLIC · PRIVATE', cells: [{ value: 'horse', state: 'open' }, { value: 'rabbit', state: 'sealed' }] },
      { title: 'LIFE · NAME · SOUL', cells: [{ value: '3', state: 'open' }, { value: '8', state: 'sealed' }, { value: '3', state: 'sealed' }] },
      { title: 'PERSONALITY · BIRTHDAY · MATURITY', cells: [{ value: '5', state: 'sealed' }, { value: '7', state: 'sealed' }, { value: '11', state: 'sealed' }] },
      { title: 'DAY PILLAR', cells: [{ value: 'dragon · earth', state: 'sealed' }] },
      { title: 'HOUR PILLAR', cells: [{ value: 'rat · wood', state: 'sealed' }] },
    ],
  });

  it('renders all eight rows at free tier (full sheet, not open-only)', () => {
    expect([...freeSheet.matchAll(/<g transform="translate\(0 /g)]).toHaveLength(8);
  });

  it('mixed rows surface BOTH the open value AND the sealed compartment (P1 fix)', () => {
    expect(freeSheet).toContain('>gemini</text>'); // open sun in SUN · RISING
    expect(freeSheet).toContain('>horse</text>');  // open public animal
    expect(freeSheet).toContain('>3</text>');      // open life path
    expect(freeSheet).toContain('<pattern id="seal-hatch"');
  });

  it('every sealed CELL renders a hatch — 10 on the free card (14 cells − 4 free)', () => {
    expect(freeSheet.match(/url\(#seal-hatch\)/g) || []).toHaveLength(10);
  });

  it('all eight row labels render (constant skeleton)', () => {
    for (const label of ['ARCANA', 'FIVE-ELEMENT', 'SUN · RISING', 'PUBLIC · PRIVATE',
      'LIFE · NAME · SOUL', 'PERSONALITY · BIRTHDAY · MATURITY', 'DAY PILLAR', 'HOUR PILLAR']) {
      expect(freeSheet).toContain(`>${label}</text>`);
    }
  });

  it('no sealed cell value leaks anywhere (§5.D a / H1 aggregate sentinel)', () => {
    // Each sealed cell above was handed a real value; none may appear.
    for (const paidVal of ['metal', 'virgo', 'rabbit', '8', '5', '7', '11',
      'dragon · earth', 'rat · wood']) {
      expect(freeSheet, `sealed value ${paidVal} leaked`).not.toContain(`>${paidVal}</text>`);
    }
  });

  it('unresolved cells render the — field, not a seal (F4 in the PNG)', () => {
    const svg = buildCardSVGFromSnapshot({
      catalog: 'no. 042',
      sections: [{ title: 'DAY PILLAR', cells: [{ value: '—', state: 'unres' }] }],
    });
    expect(svg).toContain('>—</text>');
    expect(svg).not.toContain('url(#seal-hatch)');
  });

  it('index.html passes all eight coordinate rows to initShareUI', () => {
    const m = html.match(/symbols:\s*\[([^\]]+)\]/);
    expect(m, 'initShareUI symbols array not found').not.toBeNull();
    const refs = m[1].split(',').map(s => s.trim()).filter(Boolean);
    expect(refs).toHaveLength(8);
  });

  it('the builder renders per-cell from the row refs, not a hidden-filter', () => {
    expect(shareJs).not.toMatch(/isRenderedSymbol/);
    expect(shareJs).not.toMatch(/section\.hidden/);
    expect(shareJs).toMatch(/cell\.state === 'sealed'/);
  });

  it('share.js still imports nothing and knows no tier constant (gating stays in ui/tiers.js)', () => {
    expect(shareJs).not.toMatch(/^\s*import\s/m);
    expect(shareJs).not.toMatch(/TIER_COORDS|eight_ball_tier_v1/);
  });
});

describe('share caption (DOCTRINE §5.D v0.39 / §2 voice / H5)', () => {
  it('builds a clinical caption: catalog + open coords + sealed remainder + bare URL', () => {
    const cap = buildCaptionFromSnapshot({
      catalog: 'no. 042',
      sections: [
        { title: 'ARCANA', cells: [{ value: 'XXI · the world', state: 'open' }] },
        { title: 'SUN · RISING', cells: [{ value: 'gemini', state: 'open' }, { value: 'virgo', state: 'sealed' }] },
        { title: 'DAY PILLAR', cells: [{ value: 'dragon · earth', state: 'sealed' }] },
      ],
    });
    expect(cap).toContain('no. 042');
    expect(cap).toContain('XXI · the world');
    expect(cap).toContain('gemini');
    expect(cap).toContain('sealed remainder');
    expect(cap).toContain('https://the-eight-ball.netlify.app');
  });

  it('never carries a sealed cell value (§5.D a, caption layer)', () => {
    const cap = buildCaptionFromSnapshot({
      catalog: 'no. 042',
      sections: [
        { title: 'SUN · RISING', cells: [{ value: 'gemini', state: 'open' }, { value: 'virgo', state: 'sealed' }] },
        { title: 'DAY PILLAR', cells: [{ value: 'dragon · earth', state: 'sealed' }] },
        { title: 'HOUR PILLAR', cells: [{ value: 'rat · wood', state: 'sealed' }] },
      ],
    });
    expect(cap).toContain('gemini');     // open cell kept
    expect(cap).not.toContain('virgo');  // sealed sibling dropped
    expect(cap).not.toContain('dragon · earth');
    expect(cap).not.toContain('rat · wood');
  });

  it('skips the — unresolved field in the caption', () => {
    const cap = buildCaptionFromSnapshot({
      catalog: 'no. 042',
      sections: [
        { title: 'SUN · RISING', cells: [{ value: 'gemini', state: 'open' }, { value: '—', state: 'unres' }] },
      ],
    });
    expect(cap).toContain('gemini');
    expect(cap).not.toContain('—');
  });

  it('caption carries no sales register (§2 clinical voice)', () => {
    const cap = buildCaptionFromSnapshot({
      catalog: 'no. 042',
      sections: [{ title: 'SUN', cells: [{ value: 'gemini', state: 'open' }] }],
    });
    expect(cap).not.toMatch(/unlock|discover|reveal|your (truth|reading|fate|destiny)|buy|free/i);
  });

  it('share flow couples the caption: native share text + fallback copies caption (H5)', () => {
    expect(shareJs).toMatch(/navigator\.share\(\{\s*files:\s*\[file\],\s*text:\s*caption\s*\}\)/);
    expect(shareJs).toMatch(/writeText\(caption\)/);
    expect(shareJs).not.toMatch(/writeText\(SITE_URL\)/);
  });
});

describe('cold-landing mechanism strip', () => {
  it('a one-line mechanism strip sits between the registry header and the form', () => {
    expect(html).toMatch(/id="mechanism-strip"/);
    const i = html.indexOf('registry-header');
    const j = html.indexOf('id="mechanism-strip"');
    const k = html.indexOf('id="profile-form"');
    expect(j).toBeGreaterThan(i);
    expect(k).toBeGreaterThan(j);
  });

  it('the mechanism strip carries no pricing or CTA', () => {
    const m = html.match(/id="mechanism-strip"[^>]*>([\s\S]*?)<\/p>/);
    expect(m, 'mechanism strip not found').not.toBeNull();
    expect(m[1]).not.toMatch(/\$|unlock|buy|price|free trial|sign up/i);
  });
});

describe('share-surface privacy invariants (DOCTRINE §5.D / §5 / §7)', () => {
  // §5.D invariant (c): no network call of any kind. Belt-and-suspenders
  // with tests/privacy_scan.test.js (which scans ui/ too) — asserted here
  // explicitly so the share module carries its own guard.
  it('ui/share.js introduces no network surface (fetch / XHR / sendBeacon)', () => {
    expect(shareJs).not.toMatch(/fetch\s*\(/);
    expect(shareJs).not.toMatch(/XMLHttpRequest/);
    expect(shareJs).not.toMatch(/sendBeacon/);
  });

  // §5.D invariant (a): never the paid card-content layer. The image
  // builder must not read the unlocked name/type/habit/note slots.
  it('ui/share.js does not reference the paid card-content layer', () => {
    for (const token of [
      'card-name', 'card-type', 'card-habit', 'card-note',
      'cardName', 'cardType', 'cardHabit', 'cardNote',
    ]) {
      expect(shareJs, `share.js must not reference ${token}`).not.toContain(token);
    }
    // The cell-content property reads from the unlocked branch must not
    // appear in the share builder either.
    expect(shareJs).not.toMatch(/\.habit\b/);
    expect(shareJs).not.toMatch(/\.note\b/);
  });

  // §5.D invariant (a)/(b): never name or DOB; no per-result link or
  // query parameter encodes any profile field.
  it('ui/share.js carries no name/DOB profile read', () => {
    // No profile object is imported or read at all — the builder works
    // purely off the rendered free-symbol DOM nodes. Guard the property
    // reads that would pull PII (matches code, not prose: a comment may
    // legitimately mention "name or DOB" while describing the invariant).
    expect(shareJs).not.toMatch(/profile\.(name|dob|time|city|cc|lat|lng|tz)\b/);
    expect(shareJs).not.toMatch(/\.dob\b/);
    expect(shareJs).not.toMatch(/\.name\b/);
  });

  it('the shared URL is the bare production URL with no query string', () => {
    const m = shareJs.match(/SITE_URL\s*=\s*['"]([^'"]+)['"]/);
    expect(m, 'SITE_URL constant not found').not.toBeNull();
    expect(m[1]).toBe('https://the-eight-ball.netlify.app');
    expect(m[1]).not.toMatch(/[?&]/);
  });

  // §5.D invariant (c): no share counting / telemetry. The image render
  // path is on-device only — assert the on-device primitives are present
  // and no new dependency is pulled in.
  it('ui/share.js renders on-device (canvas/toBlob) and pulls no dependency', () => {
    expect(shareJs).toMatch(/toBlob/);
    expect(shareJs).toMatch(/createObjectURL/);
    // No imports at all — share.js is self-contained, so dependency
    // discipline (tests/dependency_discipline.test.js) is unaffected.
    expect(shareJs).not.toMatch(/^\s*import\s/m);
    expect(shareJs).not.toMatch(/require\s*\(/);
  });
});
