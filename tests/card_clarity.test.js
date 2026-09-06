// Card clarity, v0.87: output/lifecycle proofs, not browser-layout acceptance.
// Synthetic fixtures only. This deliberately small parser preserves real text
// nodes and native details/summary structure; it implements no CSS/layout engine.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  READING_CONTEXT, readingContextMarkup, initReadingContext,
  buildSheetMarkup, createSheet,
} from '../ui/sheet.js';
import {
  publicReadFor, initPublicUI, renderPublicRead,
} from '../ui/public.js';
import {
  CELL_KEYS, initTiersUI, renderTierSections, shareRowRefs,
} from '../ui/tiers.js';
import { buildProfile } from '../core/profile.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const hostMarkup = html.match(/<article\b[^>]*\bid="card-face"[\s\S]*?<\/article>/)?.[0];
if (!hostMarkup) throw new Error('Actual host card markup not found');

const decode = text => text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, key) =>
  ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: '\u00a0' })[key]);

class TextNode {
  constructor(text) { this.nodeType = 3; this.textContent = text; this.parentElement = null; }
}
class Element {
  constructor(tag) {
    this.nodeType = 1;
    this.tagName = tag.toUpperCase();
    this.attrs = new Map();
    this.childNodes = [];
    this.parentElement = null;
    this.style = { setProperty() {}, removeProperty() {} };
    const tokens = () => new Set(this.className.split(/\s+/).filter(Boolean));
    this.classList = {
      contains: token => tokens().has(token),
      add: token => { const set = tokens(); set.add(token); this.className = [...set].join(' '); },
      remove: token => { const set = tokens(); set.delete(token); this.className = [...set].join(' '); },
      toggle: (token, force) => {
        const on = force === undefined ? !tokens().has(token) : !!force;
        this.classList[on ? 'add' : 'remove'](token);
        return on;
      },
    };
  }
  setAttribute(key, value) { this.attrs.set(key, String(value)); }
  getAttribute(key) { return this.attrs.has(key) ? this.attrs.get(key) : null; }
  hasAttribute(key) { return this.attrs.has(key); }
  removeAttribute(key) { this.attrs.delete(key); }
  get className() { return this.getAttribute('class') || ''; }
  set className(value) { this.setAttribute('class', value); }
  get id() { return this.getAttribute('id') || ''; }
  set id(value) { this.setAttribute('id', value); }
  get hidden() { return this.hasAttribute('hidden'); }
  set hidden(on) { on ? this.setAttribute('hidden', '') : this.removeAttribute('hidden'); }
  get open() { return this.hasAttribute('open'); }
  set open(on) { on ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  get children() { return this.childNodes.filter(node => node.nodeType === 1); }
  get textContent() { return this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) {
    for (const child of this.childNodes) child.parentElement = null;
    this.childNodes = [];
    if (String(value)) this.appendChild(new TextNode(String(value)));
  }
  appendChild(node) { node.parentElement = this; this.childNodes.push(node); return node; }
  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    const attr = selector.match(/^\[([-\w]+)(?:="([^"]*)")?\]$/);
    if (attr) return attr[2] === undefined ? this.hasAttribute(attr[1]) : this.getAttribute(attr[1]) === attr[2];
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [
      ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node;
    return null;
  }
}
function parse(markup) {
  const root = new Element('fixture');
  const stack = [root];
  for (const token of markup.match(/<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g) || []) {
    if (token.startsWith('<!--')) continue;
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/([\w-]+)/)[1].toUpperCase();
      if (stack.length === 1 || stack.pop().tagName !== tag) throw new Error('Unbalanced fixture markup');
    } else if (token.startsWith('<')) {
      const match = token.match(/^<([\w-]+)([\s\S]*?)\/?>$/);
      if (!match) throw new Error('Unsupported fixture token');
      const node = new Element(match[1]);
      for (const attr of match[2].matchAll(/([-\w:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g)) {
        node.setAttribute(attr[1], decode(attr[2] ?? attr[3] ?? attr[4] ?? ''));
      }
      stack[stack.length - 1].appendChild(node);
      if (!/^(br|hr|input|img|link|meta)$/i.test(match[1]) && !token.endsWith('/>')) stack.push(node);
    } else {
      stack[stack.length - 1].appendChild(new TextNode(decode(token)));
    }
  }
  if (stack.length !== 1) throw new Error('Unclosed fixture markup');
  return root;
}
function installDocument(root) {
  const head = new Element('head');
  vi.stubGlobal('document', {
    head,
    createElement: tag => new Element(tag),
    getElementById: id => head.querySelector('#' + id) || root.querySelector('#' + id),
  });
  return head;
}
// A native closed details exposes its summary, not its body. This checks DOM
// ancestry/hidden attributes only, never claims browser/CSS computed visibility.
function exposedText(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.hidden) return '';
  const children = node.tagName === 'DETAILS' && !node.open
    ? node.children.filter(child => child.tagName === 'SUMMARY') : node.childNodes;
  return children.map(exposedText).join('');
}
const A = buildProfile('specimen alpha', '2000-01-11');
const B = buildProfile('specimen beta', '2000-01-12');
const masters = {
  ...A, lifePath: 11, nameNumber: 22, soulUrge: 33,
  personality: 33, birthday: 11, maturity: 22, risingSign: 'leo',
};
function hostFixture() {
  const root = parse(hostMarkup);
  installDocument(root);
  const q = selector => root.querySelector(selector);
  const cells = Object.fromEntries(CELL_KEYS.map(key => [
    key, q('#coord-' + (key === 'innerAnimal' ? 'inner' : key.toLowerCase()) + '-symbol'),
  ]));
  initTiersUI({ cells, sunTitle: q('#coord-sun-title'), animalTitle: q('#coord-animal-title'),
    entry: q('#card-entry'), publicRead: q('#public-read') });
  return { root, q, cells };
}
function publicHost() {
  const host = hostFixture();
  const refs = { root: host.q('#public-read'), families: host.q('#public-families'),
    antiFit: host.q('#public-antifit'), roleLine: host.q('#public-roleline') };
  initPublicUI(refs);
  return { ...host, refs };
}
function pairFixture(prefix = 'a') {
  const root = parse(buildSheetMarkup(prefix));
  installDocument(root);
  return { root, sheet: createSheet(root, { prefix }),
    q: name => root.querySelector('[data-sheet-' + name + '="' + prefix + '"]') };
}
const context = (root, kind) => root.querySelector('[data-reading-context="' + kind + '"]');
const qualifier = root => root.querySelector('[data-reading-qualifier="associations"]');
const renderPair = (fixture, profile = A, tier = 't5') =>
  fixture.sheet.render(profile, tier, { publicRead: publicReadFor(profile) });
function expectNative(details, kind) {
  expect(details.tagName).toBe('DETAILS');
  expect(details.children[0].tagName).toBe('SUMMARY');
  expect(details.children[0].textContent).toBe(READING_CONTEXT[kind].summary);
  expect(details.getAttribute('role')).toBeNull();
  expect(details.children.slice(1).map(node => node.textContent)).toEqual(READING_CONTEXT[kind].paragraphs);
}
afterEach(() => { initPublicUI(null); initTiersUI({}); vi.unstubAllGlobals(); });

describe('card clarity — fixed attribution and native disclosures', () => {
  it('fixed copy is deeply frozen and accurately distinguishes selection, order and symbolic axes', () => {
    expect(Object.isFrozen(READING_CONTEXT)).toBe(true);
    for (const copy of Object.values(READING_CONTEXT)) {
      expect(Object.isFrozen(copy)).toBe(true);
      expect(Object.isFrozen(copy.paragraphs)).toBe(true);
    }
    expect(READING_CONTEXT.entry.paragraphs.join(' ')).toMatch(/sun sign and year animal.*Life path.*first of three.*flip again.*does not change the birth calculations/);
    expect(READING_CONTEXT.associations.paragraphs.join(' ')).toMatch(/day element.*season.*birthday work mode.*counterpoint.*tarot posture.*birthday work method.*separate symbolic axes/);
    expect(READING_CONTEXT.associations.qualifier).toBe('symbolic correspondences, not an assessment of aptitude or career suitability.');
  });
  it('unknown context kinds produce no markup or mounted nodes', () => {
    const root = parse('');
    installDocument(root);
    expect(readingContextMarkup('unknown')).toBe('');
    initReadingContext(root, 'unknown').setAvailable(true);
    expect(root.children).toHaveLength(0);
  });
  it('generated disclosures are native, initially hidden, with the qualifier outside details', () => {
    for (const kind of ['entry', 'associations']) {
      const root = parse(readingContextMarkup(kind));
      const details = context(root, kind);
      expectNative(details, kind);
      expect(details.hidden).toBe(true);
      expect(details.open).toBe(false);
      if (kind === 'associations') {
        expect(qualifier(root).parentElement).toBe(details.parentElement);
        expect(qualifier(root).hidden).toBe(true);
      }
    }
  });
  it('host mounting is idempotent and binds pre-existing Pair disclosure nodes without duplication', () => {
    for (const initial of ['', readingContextMarkup('associations')]) {
      const root = parse(initial);
      installDocument(root);
      initReadingContext(root, 'associations');
      const first = context(root, 'associations');
      initReadingContext(root, 'associations').setAvailable(true);
      expect(context(root, 'associations')).toBe(first);
      expect(root.querySelectorAll('details')).toHaveLength(1);
      expect(root.querySelectorAll('[data-reading-qualifier="associations"]')).toHaveLength(1);
      expectNative(first, 'associations');
    }
  });
  it('availability closes prior expansion, hides both nodes, and reveals only fixed copy again', () => {
    const root = parse('');
    installDocument(root);
    const controller = initReadingContext(root, 'associations');
    controller.setAvailable(true);
    const details = context(root, 'associations');
    details.open = true;
    controller.setAvailable(false);
    expect(details.hidden).toBe(true);
    expect(details.open).toBe(false);
    expect(qualifier(root).hidden).toBe(true);
    expect(exposedText(root)).toBe('');
    controller.setAvailable(true);
    expect(details.open).toBe(false);
    expect(exposedText(root)).toContain(READING_CONTEXT.associations.qualifier);
  });
  it('the qualifier stays exposed while the native explanatory body is collapsed', () => {
    const host = publicHost();
    renderPublicRead(A, { entitled: true });
    const details = context(host.refs.root, 'associations');
    expect(qualifier(host.refs.root).hidden).toBe(false);
    expect(exposedText(host.refs.root)).toContain(READING_CONTEXT.associations.qualifier);
    expect(exposedText(host.refs.root)).not.toContain(READING_CONTEXT.associations.paragraphs[0]);
    details.open = true;
    expect(exposedText(host.refs.root)).toContain(READING_CONTEXT.associations.paragraphs[0]);
  });
  it('mounting the host entry disclosure uses the same fixed copy and no personal interpolation', () => {
    const host = hostFixture();
    initReadingContext(host.q('#card-entry'), 'entry').setAvailable(true);
    const details = context(host.q('#card-entry'), 'entry');
    expectNative(details, 'entry');
    expect(details.hidden).toBe(false);
    expect(details.textContent).not.toContain('specimen alpha');
  });
});

describe('card clarity — actual rendered text-node separation', () => {
  it.each(['host', 'pair'])('%s: both numeral rows and adjacent signs/animals retain separate copied tokens', surface => {
    let root, values;
    if (surface === 'host') {
      const host = hostFixture();
      renderTierSections(masters, 't5');
      root = host.root; values = host.cells;
    } else {
      const pair = pairFixture();
      renderPair(pair, masters);
      root = pair.root;
      values = Object.fromEntries(CELL_KEYS.map(key => [key, root.querySelector('[data-sheet-cell="a:' + key + '"]')]));
    }
    const row = key => values[key].closest('.coord-cells').textContent;
    expect(row('lifePath')).toBe('11 22 33');
    expect(row('personality')).toBe('33 11 22');
    expect(row('sun')).toBe(masters.sunSign + ' leo');
    expect(row('animal')).toBe(masters.animal + ' ' + masters.innerAnimal);
    expect(['lifePath', 'nameNumber', 'soulUrge'].map(key => values[key].textContent)).toEqual(['11', '22', '33']);
    expect(root.querySelectorAll('.coord-separator')).toHaveLength(0);
    const rows = root.querySelectorAll('.coord-cells');
    expect(rows).toHaveLength(9);
    expect(rows.filter(node => node.children.length > 1)).toHaveLength(4);
    for (const node of rows) {
      // Whitespace text nodes preserve copied tokens without adding flex/grid
      // items. Every element child must still be an original coordinate cell.
      expect(node.children.every(child => child.classList.contains('coord-cell'))).toBe(true);
      for (let index = 1; index < node.children.length; index += 1) {
        const left = node.childNodes.indexOf(node.children[index - 1]);
        const right = node.childNodes.indexOf(node.children[index]);
        const gap = node.childNodes.slice(left + 1, right);
        expect(gap.length).toBeGreaterThan(0);
        expect(gap.every(child => child.nodeType === 3 && /^\s+$/.test(child.textContent))).toBe(true);
        expect(gap.map(child => child.textContent).join('')).toBe(' ');
      }
    }
  });
  it.each(['host', 'pair'])('%s: unresolved marks remain distinct from adjacent master values', surface => {
    const unresolved = { ...masters, nameNumber: null, risingSign: null };
    let values;
    if (surface === 'host') {
      const host = hostFixture();
      renderTierSections(unresolved, 't5'); values = host.cells;
    } else {
      const pair = pairFixture();
      renderPair(pair, unresolved);
      values = Object.fromEntries(CELL_KEYS.map(key => [key, pair.root.querySelector('[data-sheet-cell="a:' + key + '"]')]));
    }
    expect(values.lifePath.closest('.coord-cells').textContent).toBe('11 — 33');
    expect(values.sun.closest('.coord-cells').textContent).toBe(unresolved.sunSign + ' —');
    expect(values.nameNumber.textContent).toBe('—');
    expect(values.rising.textContent).toBe('—');
    expect(values.nameNumber.closest('.coord-cell').classList.contains('unres')).toBe(true);
  });
  it('real host share-row references contain pure values, never copied-text separators', () => {
    const host = hostFixture();
    renderTierSections(masters, 't5');
    const rows = shareRowRefs();
    expect(rows.flatMap(row => row.cells).map(cell => cell.value)).toEqual(
      CELL_KEYS.map(key => host.cells[key].textContent),
    );
    expect(rows.find(row => row.title === 'LIFE · NAME · SOUL').cells.map(cell => cell.value)).toEqual(['11', '22', '33']);
  });
});

describe('card clarity — independent Pair lifecycle', () => {
  it.each(['clear', 'null', 'sealed'])('%s removes derived output and resets both disclosure states', transition => {
    const pair = pairFixture();
    renderPair(pair);
    const entry = context(pair.root, 'entry');
    const associations = context(pair.root, 'associations');
    expect(entry.hidden).toBe(false); expect(associations.hidden).toBe(false);
    entry.open = true; associations.open = true;
    if (transition === 'clear') pair.sheet.clear();
    if (transition === 'null') pair.sheet.render(null, 't5');
    if (transition === 'sealed') renderPair(pair, A, 'free');
    for (const details of [entry, associations]) {
      expect(details.hidden).toBe(true);
      expect(details.open).toBe(false);
    }
    expect(qualifier(pair.root).hidden).toBe(true);
    for (const field of ['name', 'type', 'habit', 'note', 'families', 'antifit', 'roleline', 'public-bridge']) {
      expect(pair.q(field).textContent).toBe('');
    }
  });
  it('an invalid catalog/reading hides attribution and clears previous prose instead of leaving stale evidence', () => {
    const pair = pairFixture();
    renderPair(pair);
    context(pair.root, 'entry').open = true;
    context(pair.root, 'associations').open = true;
    pair.sheet.render({ ...A, sunSign: 'not-a-sign' }, 't5', { publicRead: null });
    expect(pair.q('catalog').textContent).toBe('no. —');
    expect(pair.q('habit').textContent).toBe('');
    expect(pair.q('families').textContent).toBe('');
    for (const kind of ['entry', 'associations']) {
      expect(context(pair.root, kind).hidden).toBe(true);
      expect(context(pair.root, kind).open).toBe(false);
    }
  });
  it('rerendering or clearing A does not change B expansion, availability, or reading text', () => {
    const root = parse(buildSheetMarkup('a') + buildSheetMarkup('b'));
    installDocument(root);
    const a = createSheet(root, { prefix: 'a' });
    const b = createSheet(root, { prefix: 'b' });
    a.render(A, 't5', { publicRead: publicReadFor(A) });
    b.render(B, 't5', { publicRead: publicReadFor(B) });
    const bFace = root.querySelector('[data-sheet-face="b"]');
    const bDetails = context(bFace, 'associations');
    const aDetails = context(root.querySelector('[data-sheet-face="a"]'), 'associations');
    bDetails.open = true; aDetails.open = true;
    const before = bFace.textContent;
    a.render(B, 't5', { publicRead: publicReadFor(B) });
    expect(aDetails.open).toBe(false);
    expect(bDetails.open).toBe(true);
    a.clear();
    expect(bDetails.open).toBe(true);
    expect(bDetails.hidden).toBe(false);
    expect(qualifier(bFace).hidden).toBe(false);
    expect(bFace.textContent).toBe(before);
  });
  it('Pair master bridge is preserved exactly, then cleared on an unbridged rerender', () => {
    const pair = pairFixture();
    const read = publicReadFor(A);
    expect(read.bridge).toContain('11');
    renderPair(pair);
    expect(pair.q('public-bridge').textContent).toBe(read.bridge);
    expect(pair.q('antifit').textContent).toBe(read.antiFit);
    expect(pair.q('roleline').textContent).toBe(read.roleLine);
    renderPair(pair, B);
    expect(publicReadFor(B).bridge).toBe('');
    expect(pair.q('public-bridge').textContent).toBe('');
  });
});

describe('card clarity — real public host rendering', () => {
  it.each(['invalid', 'sealed', 'clear'])('%s clears fields and hides/resets the previous disclosure and qualifier', transition => {
    const host = publicHost();
    const read = renderPublicRead(A, { entitled: true });
    expect(host.refs.families.textContent).toBe(read.families);
    expect(host.refs.antiFit.textContent).toMatch(/^counterpoint · /);
    const details = context(host.refs.root, 'associations');
    details.open = true;
    const profile = transition === 'invalid' ? { yyyy: 2000, mm: 2, dd: 31 } : transition === 'clear' ? null : A;
    expect(renderPublicRead(profile, { entitled: transition !== 'sealed' })).toBeNull();
    for (const node of [host.refs.families, host.refs.antiFit, host.refs.roleLine, host.refs.root.querySelector('.public-bridge')]) {
      expect(node.textContent).toBe('');
    }
    expect(details.open).toBe(false);
    expect(details.hidden).toBe(true);
    expect(qualifier(host.refs.root).hidden).toBe(true);
    expect(host.refs.root.getAttribute('aria-label')).toBe('symbolic associations · unavailable');
  });
  it('host master bridge survives framing, clears for an ordinary birthday, and returns without duplicate nodes', () => {
    const host = publicHost();
    const expected = publicReadFor(A);
    renderPublicRead(A, { entitled: true });
    expect(host.refs.root.querySelector('.public-bridge').textContent).toBe(expected.bridge);
    expect(host.refs.roleLine.textContent).toBe(expected.roleLine);
    renderPublicRead(B, { entitled: true });
    expect(host.refs.root.querySelector('.public-bridge').textContent).toBe('');
    initPublicUI(host.refs);
    renderPublicRead(A, { entitled: true });
    expect(host.refs.root.querySelectorAll('.public-bridge')).toHaveLength(1);
    expect(host.refs.root.querySelectorAll('details')).toHaveLength(1);
    expect(host.refs.root.querySelectorAll('.sheet-qualifier')).toHaveLength(1);
    expect(host.refs.root.querySelector('.public-bridge').textContent).toBe(expected.bridge);
  });
  it('host and Pair contexts remain independent when the host rerenders or clears', () => {
    const host = publicHost();
    renderPublicRead(A, { entitled: true });
    const pair = pairFixture();
    renderPair(pair, B);
    const pairDetails = context(pair.root, 'associations');
    pairDetails.open = true;
    const before = pair.root.textContent;
    renderPublicRead(B, { entitled: true });
    renderPublicRead(null, { entitled: true });
    expect(pairDetails.open).toBe(true);
    expect(pairDetails.hidden).toBe(false);
    expect(pair.root.textContent).toBe(before);
    expect(context(host.refs.root, 'associations').hidden).toBe(true);
  });
});
