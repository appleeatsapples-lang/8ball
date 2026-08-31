// 8ball / tests / cities_recovery.test.js
// Terminal recovery behavior for the bounded city-asset import sequence.

import { describe, it, expect, vi } from 'vitest';

const attempts = vi.hoisted(() => ({ base: 0, retry1: 0, retry2: 0 }));

vi.mock('../assets/cities.json', () => {
  attempts.base++;
  throw new Error('base asset unavailable');
});

vi.mock('../assets/cities.json?retry=1', () => {
  attempts.retry1++;
  throw new Error('retry 1 unavailable');
});

vi.mock('../assets/cities.json?retry=2', () => {
  attempts.retry2++;
  throw new Error('retry 2 unavailable');
});

import {
  loadCities,
  CITY_LOAD_EXHAUSTED_CODE,
  isCityLoadExhausted,
} from '../core/cities.js';

describe('core/cities.js — bounded failure recovery', () => {
  it('marks the final failure exhausted and performs no fourth import', async () => {
    let first;
    try { await loadCities(); } catch (error) { first = error; }
    expect(isCityLoadExhausted(first)).toBe(false);

    let second;
    try { await loadCities(); } catch (error) { second = error; }
    expect(isCityLoadExhausted(second)).toBe(false);

    let third;
    try { await loadCities(); } catch (error) { third = error; }
    expect(isCityLoadExhausted(third)).toBe(true);
    expect(third.code).toBe(CITY_LOAD_EXHAUSTED_CODE);
    expect(third.name).toBe('CityLoadExhaustedError');
    expect(third.cause).toBeInstanceOf(Error);

    let fourth;
    try { await loadCities(); } catch (error) { fourth = error; }
    expect(isCityLoadExhausted(fourth)).toBe(true);
    expect(attempts).toEqual({ base: 1, retry1: 1, retry2: 1 });
  });

  it('warmCities swallows a failed prefetch and consumes at most one bounded attempt, across sequential warms', async () => {
    // The focus-time warm (ui/citysearch.js) must never surface a rejection
    // of its own — the real search path owns the status line — and must
    // share loadCities' bounded importer sequence rather than adding
    // traffic beside it. TWO city fields exist (host + dyad), each with its
    // own { once: true } focus listener, so SEQUENTIAL warms are reachable:
    // without warmCities' module latch, focus one field, let the warm fail,
    // focus the other, and two of the three bounded attempts are gone
    // before the user's first typed search — which then terminates in
    // CITY_LOAD_EXHAUSTED having shown no prior error (pr214 audit F1).
    // The latch pins the whole class: any number of warms spend one attempt.
    vi.resetModules();
    const fresh = await import('../core/cities.js');
    const before = { ...attempts };
    expect(() => fresh.warmCities()).not.toThrow();
    expect(fresh.warmCities()).toBeUndefined(); // fire-and-forget, no leaked promise
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(attempts.base).toBe(before.base + 1);
    fresh.warmCities(); // a later warm, after the first has already failed
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(attempts.base).toBe(before.base + 1);
    expect(attempts.retry1).toBe(before.retry1); // no recovery specifier spent by warming
    let next;
    try { await fresh.loadCities(); } catch (error) { next = error; }
    expect(fresh.isCityLoadExhausted(next)).toBe(false);
    expect(attempts.retry1).toBe(before.retry1 + 1);
  });
});
