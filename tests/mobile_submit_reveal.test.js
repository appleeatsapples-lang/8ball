// 8ball / tests / mobile_submit_reveal.test.js
//
// Pins the mobile (<=480px) #enter-btn reveal contract in ui/experience.css.
//
// Below 480px the only submit control is a fixed 72px circular button, hidden
// by default and revealed by :has() once name + DOB are valid. PR #200 also
// withdrew it while anything inside #rising-fields or .kua-gender-field held
// :focus. That second rule had no exit: ui/citysearch.js preventDefault()s the
// suggestion mousedown precisely so the choice survives the focus shift, so
// focus stays in #city-input after a birthplace is picked and the button
// stayed invisible for the rest of the session — a user who filled the
// optional block last had no way to submit but to tap dead space. The #200
// cross-model audit logged this as an open ":has()-based mobile #enter-btn
// tab-order concern" it could not verify; live-fire on 2026-08-30 confirmed it.
//
// The withdraw rule is now keyed to the birthplace listbox's own
// aria-expanded, which citysearch sets on render and clears on selection,
// Escape, blur, empty results and reset. Two things must hold together, so
// both are pinned here: the CSS keys on that attribute and never on :focus,
// and the controller really does clear it on selection.
//
// A second geometry contract rides along: on short viewports
// (max-height: 680px) the fixed circle is retired entirely. The birthplace
// row spans the full form width, so a bottom-right fixed control overlaps it
// whenever the viewport is shorter than the form leaves room for (~623px at
// 360px wide, worse at 320px — measured 2026-08-30); no size or corner fixes
// that, so the short-viewport block returns the submit to the in-flow,
// full-width shape it has above 480px.
//
// Static-scan style for the CSS half (mirrors tests/monochrome_surface.test.js);
// the behavior half drives the real controller with the injected DOM mocks
// used by tests/citysearch.test.js.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../core/cities.js', () => ({
  searchCities: vi.fn(),
  isCityLoadExhausted: error => error?.code === 'CITY_LOAD_EXHAUSTED',
}));

import { searchCities } from '../core/cities.js';
import { initCitySearchUI, SEARCH_DEBOUNCE_MS } from '../ui/citysearch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, '..', 'ui', 'experience.css'), 'utf-8');
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

// Slice out the @supports block that owns the reveal, by brace matching —
// a bare regex cannot survive the nested rules inside it.
function blockAfter(source, marker) {
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const open = source.indexOf('{', start);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  return '';
}

// Comments are stripped first: they sit between rules, so a comment body
// would otherwise be read as part of the following selector.
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const supportsBlock = blockAfter(cssNoComments, '@supports selector(form:has(input:valid))');

// Every selector in the block that targets #enter-btn, one per entry.
const enterBtnSelectors = supportsBlock
  .split('}')
  .map(chunk => chunk.slice(0, chunk.indexOf('{')))
  .filter(sel => sel.includes('#enter-btn'))
  .flatMap(sel => sel.split(','))
  .map(sel => sel.trim())
  .filter(Boolean);

describe('mobile #enter-btn reveal — the CSS contract', () => {
  it('the @supports reveal block is present and non-vacuous', () => {
    // Guards every assertion below: an empty slice would pass them all.
    expect(supportsBlock.length).toBeGreaterThan(200);
    expect(enterBtnSelectors.length).toBeGreaterThanOrEqual(3);
  });

  it('the button is hidden by default and revealed only once name + DOB are valid', () => {
    expect(supportsBlock).toMatch(
      /#enter-btn\s*\{[^}]*opacity:\s*0;[^}]*visibility:\s*hidden;[^}]*pointer-events:\s*none/s,
    );
    expect(supportsBlock).toMatch(
      /#profile-form:has\(#name-input:valid\):has\(#dob-input:valid\)\s+#enter-btn\s*\{[^}]*visibility:\s*visible/s,
    );
  });

  it('withdraws the button while the birthplace listbox is open, keyed to aria-expanded', () => {
    const withdraw = enterBtnSelectors.filter(sel =>
      sel.includes('#city-input[aria-expanded="true"]'),
    );
    expect(withdraw).toHaveLength(1);
    // Still gated on the required fields, so it cannot re-hide a button that
    // was never revealed.
    expect(withdraw[0]).toContain('#name-input:valid');
    expect(withdraw[0]).toContain('#dob-input:valid');
  });

  it('never keys the hidden state off :focus — the state a user cannot exit', () => {
    // The PR #200 dead end. Selecting a suggestion deliberately keeps focus in
    // #city-input, and a native time/gender picker leaves focus on its control,
    // so any :focus-gated hide of the sole submit is unreachable-by-design.
    for (const sel of enterBtnSelectors) {
      expect(sel).not.toMatch(/:focus/);
    }
    expect(supportsBlock).not.toMatch(/#rising-fields\s+:focus/);
    expect(supportsBlock).not.toMatch(/\.kua-gender-field\s+:focus/);
  });

  it('the markup still supplies the ids and the single submit the rules bind to', () => {
    expect(html).toMatch(/id="enter-btn"[^>]*type="submit"|type="submit"[^>]*id="enter-btn"/);
    expect(html).toMatch(/id="city-input"/);
    expect(html).toMatch(/id="name-input"[^>]*required/);
    expect(html).toMatch(/id="dob-input"[^>]*required/);
    expect(html.match(/id="enter-btn"/g)).toHaveLength(1);
  });
});

describe('mobile #enter-btn geometry — short viewports retire the fixed circle', () => {
  const shortBlock = blockAfter(
    cssNoComments,
    '@media (max-width: 480px) and (max-height: 680px)',
  );

  it('the short-viewport block exists and is non-vacuous', () => {
    expect(shortBlock.length).toBeGreaterThan(100);
  });

  it('returns #enter-btn to in-flow full width below 680px height', () => {
    // position: static defuses the fixed circle's right/bottom/z-index in one
    // move; width restores the block shape. Without this, the button overlaps
    // the birthplace label + input at 320x568 (btn top 480 vs city row
    // 493-537) with nothing focused and nothing to scroll.
    expect(shortBlock).toMatch(/#enter-btn\s*\{[^}]*position:\s*static/s);
    expect(shortBlock).toMatch(/#enter-btn\s*\{[^}]*width:\s*100%/s);
    expect(shortBlock).toMatch(/#enter-btn\s*\{[^}]*border-radius:\s*0/s);
  });

  it('drops the FAB-clearance padding the in-flow button no longer needs', () => {
    expect(shortBlock).toMatch(/#profile-form\s*\{[^}]*padding-bottom:\s*0/s);
  });
});

describe('mobile #enter-btn reveal — the aria-expanded the CSS depends on', () => {
  const originalDocument = globalThis.document;

  function makeNode(tag) {
    const handlers = {};
    return {
      tag,
      children: [],
      attrs: {},
      textContent: '',
      className: '',
      setAttribute(k, v) { this.attrs[k] = v; },
      removeAttribute(k) { delete this.attrs[k]; },
      appendChild(c) { this.children.push(c); },
      addEventListener(ev, fn) { handlers[ev] = fn; },
      _fire(ev, arg) { return handlers[ev] && handlers[ev](arg); },
    };
  }

  function makeRefs() {
    const citySuggestions = makeNode('ul');
    Object.defineProperty(citySuggestions, 'innerHTML', {
      set(v) { if (v === '') this.children.length = 0; },
    });
    const cityInput = makeNode('input');
    cityInput.value = '';
    const cityStatus = makeNode('p');
    cityStatus.hidden = true;
    return {
      cityInput,
      citySuggestions,
      cityStatus,
      legacyHint: { hidden: false },
      polarMessage: { hidden: true },
    };
  }

  const OSLO = { name: 'Oslo', country: 'Norway', countryCode: 'NO', lat: 59.91, lng: 10.75, tz: 'Europe/Oslo' };

  let refs;
  beforeEach(() => {
    vi.useFakeTimers();
    searchCities.mockReset();
    globalThis.document = { createElement: makeNode };
    refs = makeRefs();
    initCitySearchUI(refs, { setSelectedCity: () => {} });
  });
  afterEach(() => {
    vi.useRealTimers();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });

  async function openListbox() {
    searchCities.mockResolvedValue([OSLO]);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
  }

  it('clears aria-expanded when a suggestion is chosen, restoring the submit', async () => {
    await openListbox();
    expect(refs.cityInput.attrs['aria-expanded']).toBe('true');

    // The pointer path the CSS rides on: mousedown selects and, critically,
    // leaves focus in the input — so aria-expanded is the ONLY thing that can
    // bring the button back.
    refs.citySuggestions.children[0]._fire('mousedown', { preventDefault() {} });
    expect(refs.cityInput.attrs['aria-expanded']).toBe('false');
  });

  it('clears aria-expanded on Escape and on blur', async () => {
    await openListbox();
    refs.cityInput._fire('keydown', { key: 'Escape', preventDefault() {} });
    expect(refs.cityInput.attrs['aria-expanded']).toBe('false');

    await openListbox();
    refs.cityInput._fire('blur');
    await vi.advanceTimersByTimeAsync(300);
    expect(refs.cityInput.attrs['aria-expanded']).toBe('false');
  });

  it('clears aria-expanded when a search returns nothing', async () => {
    await openListbox();
    searchCities.mockResolvedValue([]);
    refs.cityInput.value = 'zzzz';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.cityInput.attrs['aria-expanded']).toBe('false');
  });
});
