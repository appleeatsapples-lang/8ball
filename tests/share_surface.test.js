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
import {
  buildCardSVGFromSnapshot,
  buildCaptionFromSnapshot,
  rowSections,
  sharePngFilename,
} from '../ui/share.js';

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

  it('#share-btn is the second control, promoted above try-another (§5.D reach)', () => {
    // Share PNG is the primary organic reach artifact — the share affordance
    // sits directly after the primary shake-again action, ahead of try-another.
    const iShake = controls.indexOf('id="shake-again-btn"');
    const iShare = controls.indexOf('id="share-btn"');
    const iTry = controls.indexOf('id="try-another-btn"');
    expect(iShake).toBeGreaterThanOrEqual(0);
    expect(iShare).toBeGreaterThan(iShake);
    expect(iTry).toBeGreaterThan(iShare);
  });

  it('#share-btn label is "share" and type is button', () => {
    const m = html.match(/<button([^>]*id="share-btn"[^>]*)>([\s\S]*?)<\/button>/);
    expect(m, 'share-btn element not found').not.toBeNull();
    expect(m[1]).toMatch(/type="button"/);
    expect(m[2].trim()).toBe('share');
    // reach promotion (§5.D): pins the primary restyle, not just the order —
    // share-btn must be a primary .btn-block, never the dim .btn-secondary.
    expect(m[1]).toMatch(/class="[^"]*\bbtn-block\b[^"]*"/);
    expect(m[1]).not.toMatch(/btn-secondary/);
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

  it('escapes &, <, > in DOM-derived catalog and cell values (SVG well-formedness / no markup injection)', () => {
    const svg = buildCardSVGFromSnapshot({
      catalog: 'no. <1> & 2',
      sections: [
        { title: 'ARCANA', cells: [{ value: 'a & <b>', state: 'open' }] },
      ],
    });
    // Both the catalog and the cell value must be entity-escaped verbatim.
    expect(svg).toContain('>no. &lt;1&gt; &amp; 2</text>');
    expect(svg).toContain('>a &amp; &lt;b&gt;</text>');
    // No raw markup leaks: the unescaped forms must not appear.
    expect(svg).not.toContain('<b>');
    expect(svg).not.toContain('& 2</text>');
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

describe('share PNG filename (§5.D catalog-only, reach)', () => {
  it('derives a deterministic slug from the on-card catalog display', () => {
    expect(sharePngFilename('no. xliii')).toBe('8ball-specimen-xliii.png');
    expect(sharePngFilename('no. 042')).toBe('8ball-specimen-042.png');
  });

  it('falls back when the catalog is empty or unresolved', () => {
    expect(sharePngFilename('no. —')).toBe('8ball-specimen.png');
    expect(sharePngFilename('')).toBe('8ball-specimen.png');
    expect(sharePngFilename(null)).toBe('8ball-specimen.png');
  });

  it('rejects non-catalog text (profile tokens / traversal / unicode / overlong) → generic fallback', () => {
    for (const hostile of [
      'no. john-1990-01-01',   // profile-shaped (name + DOB)
      'no. name dob profile',  // literal PII tokens
      'no. ../../etc/passwd',  // path traversal
      'no. 名前',               // unicode
      'no. ' + 'x'.repeat(50), // overlong
    ]) {
      expect(sharePngFilename(hostile), `must fall back for: ${hostile}`).toBe('8ball-specimen.png');
    }
    // the legit catalog still resolves, and never carries a separator or PII token
    const name = sharePngFilename('no. xliii');
    expect(name).toBe('8ball-specimen-xliii.png');
    expect(name).not.toMatch(/[/\\]|\.{2}|name|dob|profile/i);
  });

  it('share flow uses sharePngFilename for File + download (not a fixed generic name)', () => {
    expect(shareJs).toMatch(/const filename = sharePngFilename\(/);
    expect(shareJs).toMatch(/new File\(\[blob\],\s*filename/);
    expect(shareJs).toMatch(/downloadBlob\(blob,\s*filename\)/);
    expect(shareJs).not.toMatch(/eight-ball\.png/);
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

  it('head grammar is exact: "8ball specimen no. NNN" with catalog, "8ball specimen" without', () => {
    const withCat = buildCaptionFromSnapshot({ catalog: 'no. 042', sections: [] });
    expect(withCat).toBe('8ball specimen no. 042\nhttps://the-eight-ball.netlify.app');
    // Empty catalog: bare wordmark head, no dangling catalog numeral, no stray separator.
    const noCat = buildCaptionFromSnapshot({});
    expect(noCat).toBe('8ball specimen\nhttps://the-eight-ball.netlify.app');
    expect(noCat).not.toContain(' · ');
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
  it('rowSections strips a sealed value present in a live row ref — it never reaches the snapshot (§5.D a)', () => {
    // Adversarial refs: a sealed cell that (wrongly) still carries its value.
    // The snapshot layer itself must drop it, whatever ui/tiers.js produced.
    const sections = rowSections([
      { title: 'FIVE-ELEMENT', cells: [{ state: 'sealed', value: 'metal' }, { state: 'open', value: 'gemini' }] },
    ]);
    expect(JSON.stringify(sections)).not.toContain('metal');
    expect(sections[0].cells[0]).toEqual({ state: 'sealed', value: '' });
    expect(sections[0].cells[1].value).toBe('gemini');
  });

  // #126 audit F2: rowSections is fail-closed. Only the exact 'open' state
  // carries a value and only exact 'unres' carries the — field; a missing,
  // unknown, or malformed state must coerce to sealed with no value, so a
  // wrongly-carried value can never reach the SVG or the caption.
  it('rowSections coerces a missing state carrying a value to sealed+empty (§5.D a, fail-closed)', () => {
    const sections = rowSections([
      { title: 'DAY PILLAR', cells: [{ value: 'ox · wood' }] },
    ]);
    expect(sections[0].cells[0]).toEqual({ state: 'sealed', value: '' });
    expect(JSON.stringify(sections)).not.toContain('ox');
  });

  it('rowSections coerces an unknown state carrying a value to sealed+empty (§5.D a, fail-closed)', () => {
    const sections = rowSections([
      { title: 'HOUR PILLAR', cells: [{ state: 'locked', value: 'rat · water' }] },
    ]);
    expect(sections[0].cells[0]).toEqual({ state: 'sealed', value: '' });
    expect(JSON.stringify(sections)).not.toContain('rat');
  });

  it('rowSections strips a value wrongly present on an unres cell — the — field renders instead (§5.D a)', () => {
    const sections = rowSections([
      { title: 'SUN · RISING', cells: [{ state: 'unres', value: 'scorpio' }, { state: 'unres', value: '—' }] },
    ]);
    expect(JSON.stringify(sections)).not.toContain('scorpio');
    expect(sections[0].cells[0]).toEqual({ state: 'unres', value: '—' });
    expect(sections[0].cells[1]).toEqual({ state: 'unres', value: '—' });
  });

  it('rowSections coerces a null cell to sealed+empty, never open (§5.D a, fail-closed)', () => {
    const sections = rowSections([
      { title: 'LIFE · NAME · SOUL', cells: [null] },
    ]);
    expect(sections[0].cells[0]).toEqual({ state: 'sealed', value: '' });
  });

  // #129 audit F1: own DATA properties only. An inherited state/value, a
  // getter-backed cell, or a mixed own/inherited shape must seal — checked
  // end-to-end through the SVG and caption builders, not just the snapshot.
  it('rowSections ignores inherited and getter-backed state/value — own data properties only (§5.D a)', () => {
    const inherited = Object.create({ state: 'open', value: 'PROTO_SECRET' });
    const getterBacked = {};
    Object.defineProperty(getterBacked, 'state', { get: () => 'open', enumerable: true });
    Object.defineProperty(getterBacked, 'value', { get: () => 'GETTER_SECRET', enumerable: true });
    const ownValueOnly = Object.assign(Object.create({ state: 'open' }), { value: 'PROTO_MIX_SECRET' });
    const sections = rowSections([
      { title: 'FIVE-ELEMENT', cells: [inherited, getterBacked, ownValueOnly] },
    ]);
    expect(JSON.stringify(sections)).not.toContain('SECRET');
    for (const cell of sections[0].cells) {
      expect(cell).toEqual({ state: 'sealed', value: '' });
    }
    const svg = buildCardSVGFromSnapshot({ catalog: 'IX', sections });
    const caption = buildCaptionFromSnapshot({ catalog: 'IX', sections });
    expect(svg).not.toContain('SECRET');
    expect(caption).not.toContain('SECRET');
  });

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

  // CLP §1.E: provenance placards (.coord-prov) are on-screen only. The PNG
  // builder reads the shareRowRefs snapshot (.coord-val + .coord-title)
  // never the placard, so the derivation notes stay out of the artifact.
  it('ui/share.js does not serialize the provenance placard (.coord-prov)', () => {
    expect(shareJs).not.toMatch(/coord-prov/);
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

// ── §5.D v0.61: the fit-family row ────────────────────────────────
//
// The share artifact gains ONE line: the labeled fit-family triple. It does
// NOT gain the anti-fit or the role line, and the guarantee for that is
// structural rather than a filter — `ui/tiers.js` is handed only the
// families node, so no code path exists by which the other two could reach
// the snapshot. These tests pin the structure, not the filter, because a
// filter is what a later edit drops by accident.
describe('share surface — fit families (§5.D v0.61)', () => {
  const REPO = join(__dirname, '..');
  const tiersSrc = readFileSync(join(REPO, 'ui', 'tiers.js'), 'utf-8');
  const shareSrc = readFileSync(join(REPO, 'ui', 'share.js'), 'utf-8');
  const html = readFileSync(join(REPO, 'index.html'), 'utf-8');

  it('only the families node is handed to the share layer', () => {
    const initCall = html.match(/initTiersUI\(\{[\s\S]*?\n\}, \{\}\);/);
    expect(initCall, 'initTiersUI call not found').not.toBeNull();
    expect(initCall[0]).toContain("publicFamilies: $('public-families')");
    expect(initCall[0]).not.toContain('public-antifit');
    expect(initCall[0]).not.toContain('public-roleline');
    expect(tiersSrc).not.toMatch(/antifit|antiFit|roleLine|roleline/i);
    expect(shareSrc).not.toMatch(/antifit|antiFit|roleLine|roleline/i);
  });

  it('nothing reads text THROUGH the block root — the guarantee this rests on', () => {
    // The honest version of the omission (§5.D v0.61, corrected): it is NOT
    // impossible for the anti-fit and role line to reach the artifact.
    // ui/tiers.js holds the block ROOT (refs.publicRead) so it can toggle
    // the unseal class, and all three lines are descendants of it — so
    // `_publicRoot.textContent` alone would concatenate the lot. What
    // actually holds the line is that nothing reads through that root.
    // Pinned here because a one-line edit is all it would take.
    expect(tiersSrc).not.toMatch(/_publicRoot\s*\.\s*(textContent|innerText|innerHTML)/);
    expect(tiersSrc).not.toMatch(/_publicRoot\s*\.\s*(querySelector|children|firstChild|childNodes)/);
    // the share row must read the dedicated node, not the root
    expect(tiersSrc).toMatch(/_publicFamilies\s*\?\s*String\(_publicFamilies\.textContent\)/);
  });

  it('the root would in fact leak all three lines — proving the pin above is load-bearing', () => {
    // A guard whose failure mode is never demonstrated is decoration. This
    // shows what the corrected clause warns about: reading the root yields
    // the anti-fit and role line together with the families.
    const root = { textContent: '\n DOMAIN FIT \n 1 tech · 2 media · 3 energy \n anti-fit · health \n a role held as the setting of order, worked from a standing start, one line at a time. \n' };
    const asIfRootWereRead = String(root.textContent).trim();
    expect(asIfRootWereRead).toContain('anti-fit');
    expect(asIfRootWereRead).toContain('a role held');
  });

  it('the artifact builder was not taught a new concept', () => {
    // The row rides the existing {title, cells:[{state,value}]} shape, so
    // every invariant already governing the artifact still governs it.
    expect(shareSrc).not.toMatch(/DOMAIN FIT|publicRead|publicFamilies/);
  });

  it('renders the families as an open value, and hatches when sealed', () => {
    const open = buildCardSVGFromSnapshot({
      catalog: 'no. cxii',
      sections: rowSections([
        { title: 'DOMAIN FIT', cells: [{ state: 'open', value: '1 tech · 2 media · 3 energy' }] },
      ]),
    });
    expect(open).toContain('DOMAIN FIT');
    expect(open).toContain('1 tech · 2 media · 3 energy');

    const sealed = buildCardSVGFromSnapshot({
      catalog: 'no. cxii',
      sections: rowSections([
        { title: 'DOMAIN FIT', cells: [{ state: 'sealed', value: '1 tech · 2 media · 3 energy' }] },
      ]),
    });
    expect(sealed).toContain('DOMAIN FIT');
    expect(sealed).toContain('seal-hatch');
    // the value is dropped by rowSections before it can reach the SVG
    expect(sealed).not.toContain('tech');
  });

  it('the caption carries the families and never the other two lines', () => {
    const caption = buildCaptionFromSnapshot({
      catalog: 'no. cxii',
      sections: rowSections([
        { title: 'ARCANA', cells: [{ state: 'open', value: 'iv · the emperor' }] },
        { title: 'DOMAIN FIT', cells: [{ state: 'open', value: '1 tech · 2 media · 3 energy' }] },
      ]),
    });
    expect(caption).toContain('1 tech · 2 media · 3 energy');
    expect(caption).not.toMatch(/anti-fit|a role held/);
    expect(caption).not.toMatch(/\d{4}-\d{2}-\d{2}/);   // no DOB shape
  });

  it('an anti-fit or role-line string cannot reach the artifact even if injected', () => {
    // Defence in depth: if a future edit wrongly passed one through, it
    // would still have to survive rowSections' own-data read. This asserts
    // the omission at the level that matters — nothing in the pipeline
    // knows those strings — rather than proving a filter exists.
    const svg = buildCardSVGFromSnapshot({
      catalog: 'no. cxii',
      sections: rowSections([
        { title: 'DOMAIN FIT', cells: [{ state: 'sealed', value: 'anti-fit · health' }] },
      ]),
    });
    expect(svg).not.toContain('anti-fit');
    expect(svg).not.toContain('health');
  });
});
