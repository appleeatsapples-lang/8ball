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
import { buildCardSVGFromSnapshot } from '../ui/share.js';

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
      { title: 'ARCANA', symbol: 'XXI · the world' },
      { title: 'FIVE-ELEMENT', symbol: 'metal' },
      { title: 'SUN ↑ RISING', symbol: 'gemini ↑ virgo' },
      { title: 'PUBLIC ⇌ PRIVATE', symbol: 'horse ⇌ rabbit' },
      { title: 'LIFE · NAME · SOUL', symbol: '3 8 3' },
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

  it('renders all five t1-density coordinate rows without paid or profile content', () => {
    expect(svg.match(/<g transform="translate\(0 /g)).toHaveLength(5);
    for (const text of [
      'ARCANA', 'XXI · the world',
      'FIVE-ELEMENT', 'metal',
      'SUN ↑ RISING', 'gemini ↑ virgo',
      'PUBLIC ⇌ PRIVATE', 'horse ⇌ rabbit',
      'LIFE · NAME · SOUL', '3 8 3',
    ]) {
      expect(svg).toContain(`>${text}</text>`);
    }
    for (const forbidden of ['card-name', 'card-type', 'card-habit', 'card-note']) {
      expect(svg).not.toContain(forbidden);
    }
  });

  // v0.6.0 (§5.D v0.36): the builder is row-count adaptive — the free
  // card emits 3 rows, the t3 card 8 — and every row lands between the
  // stack rules (y 86..398) regardless of count.
  function rowYs(svgStr) {
    return [...svgStr.matchAll(/<g transform="translate\(0 ([\d.]+)\)"/g)]
      .map(m => parseFloat(m[1]));
  }

  it('free-tier snapshot (3 rows + catalog) renders 3 rows inside the stack', () => {
    const free = buildCardSVGFromSnapshot({
      catalog: 'no. 042',
      sections: [
        { title: 'ARCANA', symbol: 'XXI · the world' },
        { title: 'SUN', symbol: 'gemini' },
        { title: 'PUBLIC', symbol: 'horse' },
      ],
    });
    const ys = rowYs(free);
    expect(ys).toHaveLength(3);
    for (const y of ys) {
      expect(y).toBeGreaterThan(86);
      expect(y).toBeLessThan(398);
    }
    expect(free).toContain('>no. 042</text>');
    expect(free).not.toContain('↑'); // free sun line is bare
    expect(free).not.toContain('⇌'); // free animal line is public-only
  });

  it('t3-density snapshot (8 rows) renders 8 rows inside the stack', () => {
    const t3 = buildCardSVGFromSnapshot({
      catalog: 'no. 042',
      sections: [
        { title: 'ARCANA', symbol: 'XXI · the world' },
        { title: 'FIVE-ELEMENT', symbol: 'metal' },
        { title: 'SUN ↑ RISING', symbol: 'gemini ↑ virgo' },
        { title: 'PUBLIC ⇌ PRIVATE', symbol: 'horse ⇌ rabbit' },
        { title: 'LIFE · NAME · SOUL', symbol: '3 8 3' },
        { title: 'PERSONALITY · BIRTHDAY · MATURITY', symbol: '5 7 11' },
        { title: 'DAY PILLAR', symbol: 'dragon · earth' },
        { title: 'HOUR PILLAR', symbol: 'rat · wood' },
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

describe('share tier-awareness (DOCTRINE §5.D v0.36)', () => {
  it('the builder skips tier-hidden rows (reads section.hidden, set by ui/tiers.js)', () => {
    // Mechanism pin: buildCardSVG filters refs.symbols on the closest
    // .coord-section's hidden flag before snapshotting. This is how the
    // PNG matches the on-screen card at the current tier without share.js
    // learning the tier model.
    expect(shareJs).toMatch(/function isRenderedSymbol\(/);
    expect(shareJs).toMatch(/closest\(['"]\.coord-section['"]\)/);
    expect(shareJs).toMatch(/section\.hidden/);
    expect(shareJs).toMatch(/\.filter\(isRenderedSymbol\)/);
  });

  it('index.html passes all eight coordinate rows to initShareUI', () => {
    const m = html.match(/symbols:\s*\[([^\]]+)\]/);
    expect(m, 'initShareUI symbols array not found').not.toBeNull();
    const refs = m[1].split(',').map(s => s.trim()).filter(Boolean);
    expect(refs).toHaveLength(8);
  });

  it('share.js still imports nothing and knows no tier constant (gating stays in ui/tiers.js)', () => {
    expect(shareJs).not.toMatch(/^\s*import\s/m);
    expect(shareJs).not.toMatch(/TIER_COORDS|eight_ball_tier_v1/);
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
