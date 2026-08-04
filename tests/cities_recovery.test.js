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
});
