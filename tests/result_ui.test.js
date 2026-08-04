// 8ball / tests / result_ui.test.js
// Behavioral proof for the result/flip controller extracted from index.html
// under the DOCTRINE §6 line-budget rule.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initResultUI } from '../ui/result.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, '..', 'ui', 'result.js'), 'utf8');
const indexSource = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

function element() {
  const listeners = {};
  const classes = new Set();
  return {
    inert: false,
    textContent: '',
    attrs: {},
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      toggle: (name, force) => force ? classes.add(name) : classes.delete(name),
      contains: name => classes.has(name),
    },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    setAttribute(name, value) { this.attrs[name] = value; },
    focus: vi.fn(),
    scrollIntoView: vi.fn(),
    fire(type, event = {}) { listeners[type]?.(event); },
  };
}

function harness({ tier = 'free', facetState = null } = {}) {
  const back = element();
  const front = element();
  const flipInner = element();
  flipInner.querySelector = selector => selector.includes('.back') ? back : front;
  const refs = {
    flipInner,
    cardBack: element(),
    shakeAgainBtn: element(),
    result: element(),
    onboarding: element(),
    announce: element(),
  };
  refs.result.classList.add('hidden');
  let currentProfile = null;
  const hooks = {
    setCurrentProfile: vi.fn(profile => { currentProfile = profile; }),
    getCurrentProfile: vi.fn(() => currentProfile),
    getTier: vi.fn(() => tier),
    ownsCardEntry: vi.fn(value => value === 't3'),
    advanceFacet: vi.fn(() => facetState),
    renderCard: vi.fn(),
  };
  const api = initResultUI(refs, hooks);
  return { refs, hooks, api, back, front };
}

beforeEach(() => vi.useFakeTimers());

describe('result controller — arrival and face accessibility', () => {
  it('exposes the focusable card-back action with button semantics', () => {
    expect(indexSource).toMatch(
      /id="card-back" role="button" tabindex="0" aria-label="flip card"/
    );
  });

  it('renders, focuses and announces an explicit form/archive arrival', () => {
    const h = harness();
    const profile = { lifePath: 5 };
    h.api.showResult(profile, { tier: 'free', arrive: true });

    expect(h.hooks.setCurrentProfile).toHaveBeenCalledWith(profile);
    expect(h.hooks.renderCard).toHaveBeenCalledWith(profile, { tier: 'free', arrive: true });
    expect(h.refs.onboarding.classList.contains('hidden')).toBe(true);
    expect(h.refs.result.classList.contains('hidden')).toBe(false);
    expect(h.refs.result.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(h.refs.result.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(h.back.inert).toBe(false);
    expect(h.front.inert).toBe(true);

    vi.advanceTimersByTime(300);
    expect(h.back.inert).toBe(true);
    expect(h.front.inert).toBe(false);
    expect(h.refs.announce.textContent).toBe('specimen sheet ready');
  });

  it('boot rehydration renders without stealing focus, scroll, or announcement', () => {
    const h = harness();
    h.api.showResult({ lifePath: 5 }, { tier: 'free' });
    vi.advanceTimersByTime(300);
    expect(h.refs.result.focus).not.toHaveBeenCalled();
    expect(h.refs.result.scrollIntoView).not.toHaveBeenCalled();
    expect(h.refs.announce.textContent).toBe('');
  });

  it('lets only the newest showResult finish the shared card arrival', () => {
    const h = harness();
    const first = { lifePath: 2 };
    const second = { lifePath: 8 };
    // Model a callback already queued by the browser: cancellation alone is
    // unavailable, so the generation guard must reject the stale work.
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {});

    h.api.showResult(first, { tier: 'free', arrive: true });
    vi.advanceTimersByTime(100);
    h.api.showResult(second, { tier: 'free', arrive: true });

    // The first arrival would land here. The second still owns the back face
    // and must not be flipped or announced by that stale callback.
    vi.advanceTimersByTime(200);
    expect(h.back.inert).toBe(false);
    expect(h.front.inert).toBe(true);
    expect(h.refs.announce.textContent).toBe('');
    expect(h.hooks.renderCard).toHaveBeenLastCalledWith(
      second, { tier: 'free', arrive: true },
    );

    vi.advanceTimersByTime(100);
    expect(h.back.inert).toBe(true);
    expect(h.front.inert).toBe(false);
    expect(h.refs.announce.textContent).toBe('specimen sheet ready');
    clearTimeoutSpy.mockRestore();
  });

  it('reset invalidates a pending arrival and restores a silent front face', () => {
    const h = harness();
    h.api.showResult({ lifePath: 5 }, { tier: 'free', arrive: true });
    vi.advanceTimersByTime(100);

    h.api.reset();
    vi.advanceTimersByTime(200);

    expect(h.back.inert).toBe(true);
    expect(h.front.inert).toBe(false);
    expect(h.refs.announce.textContent).toBe('');
    expect(indexSource).toMatch(
      /tryAnotherBtn\.addEventListener[\s\S]*?resetResultTransitions\(\);[\s\S]*?resetFormDisplay\(\)/,
    );
  });
});

describe('result controller — shake behavior', () => {
  it('free shake is cosmetic and re-renders at the injected tier', () => {
    const h = harness({ tier: 'free' });
    const profile = { lifePath: 5 };
    h.api.showResult(profile, { tier: 'free' });
    vi.advanceTimersByTime(300);
    h.hooks.renderCard.mockClear();

    h.refs.shakeAgainBtn.fire('click');
    expect(h.hooks.advanceFacet).not.toHaveBeenCalled();
    vi.advanceTimersByTime(320);
    expect(h.hooks.renderCard).toHaveBeenCalledWith(profile, { tier: 'free' });
    expect(h.refs.announce.textContent).toBe('');
  });

  it('owned written-entry shake advances once and announces its position', () => {
    const h = harness({ tier: 't3', facetState: { facetIndex: 1 } });
    const profile = { lifePath: 11 };
    h.api.showResult(profile, { tier: 't3' });
    vi.advanceTimersByTime(300);
    h.hooks.renderCard.mockClear();

    h.refs.cardBack.fire('click');
    h.refs.cardBack.fire('click');
    expect(h.hooks.advanceFacet).toHaveBeenCalledTimes(1);
    expect(h.hooks.advanceFacet).toHaveBeenCalledWith(profile);
    vi.advanceTimersByTime(320);
    expect(h.hooks.renderCard).toHaveBeenCalledTimes(1);
    expect(h.refs.announce.textContent).toBe('written entry changed · 2 of 3');
  });

  it('does not announce an unverified written-entry advance', () => {
    const h = harness({ tier: 't3', facetState: null });
    const profile = { lifePath: 11 };
    h.api.showResult(profile, { tier: 't3', arrive: true });
    vi.advanceTimersByTime(300);
    expect(h.refs.announce.textContent).toBe('specimen sheet ready');
    h.hooks.renderCard.mockClear();

    h.refs.cardBack.fire('click');
    expect(h.refs.announce.textContent).toBe('');
    vi.advanceTimersByTime(320);

    expect(h.hooks.advanceFacet).toHaveBeenCalledWith(profile);
    expect(h.hooks.renderCard).toHaveBeenCalledWith(profile, { tier: 't3' });
    expect(h.refs.announce.textContent).toBe('');
  });

  it('a newer result cancels a pending shake render and owns the faces', () => {
    const h = harness({ tier: 'free' });
    const first = { lifePath: 5 };
    const second = { lifePath: 9 };
    h.api.showResult(first, { tier: 'free' });
    vi.advanceTimersByTime(300);
    h.hooks.renderCard.mockClear();

    h.refs.shakeAgainBtn.fire('click');
    // As above, force the stale callback to execute and prove the token guard
    // (rather than clearTimeout by itself) protects the newer result.
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {});
    vi.advanceTimersByTime(100);
    h.api.showResult(second, { tier: 'free', arrive: true });

    // The old shake would render at this point. It must neither redraw the
    // first profile nor land the second profile's still-running arrival.
    vi.advanceTimersByTime(220);
    expect(h.hooks.renderCard).toHaveBeenCalledTimes(1);
    expect(h.hooks.renderCard).toHaveBeenLastCalledWith(
      second, { tier: 'free', arrive: true },
    );
    expect(h.back.inert).toBe(false);
    expect(h.front.inert).toBe(true);
    expect(h.refs.announce.textContent).toBe('');

    vi.advanceTimersByTime(80);
    expect(h.back.inert).toBe(true);
    expect(h.front.inert).toBe(false);
    expect(h.refs.announce.textContent).toBe('specimen sheet ready');
    clearTimeoutSpy.mockRestore();
  });

  it('reset cancels a pending shake render and announcement', () => {
    const h = harness({ tier: 't3', facetState: { facetIndex: 2 } });
    h.api.showResult({ lifePath: 5 }, { tier: 't3' });
    vi.advanceTimersByTime(300);
    h.hooks.renderCard.mockClear();

    h.refs.cardBack.fire('click');
    vi.advanceTimersByTime(100);
    h.api.reset();
    vi.advanceTimersByTime(220);

    expect(h.hooks.renderCard).not.toHaveBeenCalled();
    expect(h.refs.announce.textContent).toBe('');
    expect(h.back.inert).toBe(true);
    expect(h.front.inert).toBe(false);
  });

  it('keyboard Enter prevents default and follows the same shake path', () => {
    const h = harness();
    const preventDefault = vi.fn();
    h.api.showResult({ lifePath: 5 }, { tier: 'free' });
    vi.advanceTimersByTime(300);
    h.hooks.renderCard.mockClear();
    h.refs.cardBack.fire('keydown', { key: 'Enter', preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(320);
    expect(h.hooks.renderCard).toHaveBeenCalledOnce();
  });

  it('carries no storage, network, payment-modal, or profile-schema capability', () => {
    expect(source).not.toMatch(/localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|sendBeacon/);
    expect(source).not.toMatch(/openPaywall|PendingProfile|nameInput|dobInput/);
  });
});
