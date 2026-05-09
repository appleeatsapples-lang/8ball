// 8ball / tests / rising.test.js
// Rising-sign additive surface coordinate (v0.2.1).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buildProfile } from '../core/profile.js';
import {
  ascendantDeg,
  getRisingSign,
  gmstDeg,
  julianDay,
  obliquityDeg
} from '../core/rising.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures.json'), 'utf-8'));

const VALID_SIGNS = new Set([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]);

const referenceCases = [
  {
    label: 'London noon BST',
    y: 1990, m: 6, d: 15, h: 12, min: 0, utcOffsetMinutes: 60,
    lat: 51.5074, lng: -0.1278,
    jd: 2448057.958333,
    gmst: 68.4671871,
    obliquity: 23.4405326,
    ascendant: 164.7398,
    sign: 'virgo'
  },
  {
    label: 'NYC mid-afternoon EST',
    y: 1985, m: 3, d: 15, h: 14, min: 30, utcOffsetMinutes: -300,
    lat: 40.7128, lng: -74.006,
    jd: 2446140.3125,
    gmst: 105.8446269,
    obliquity: 23.4412153,
    ascendant: 134.2061,
    sign: 'leo'
  },
  {
    label: 'Riyadh sunrise AST',
    y: 2000, m: 1, d: 1, h: 6, min: 0, utcOffsetMinutes: 180,
    lat: 24.7136, lng: 46.6753,
    jd: 2451544.625,
    gmst: 145.0910006,
    obliquity: 23.4392912,
    ascendant: 270.2354,
    sign: 'capricorn'
  }
];

function parseDob(dob) {
  return dob.split('-').map(Number);
}

function parseTime(time) {
  return time.split(':').map(Number);
}

describe('rising sign — algorithm fixtures', () => {
  for (const c of fixtures.rising_cases) {
    it(c.label, () => {
      const [y, m, d] = parseDob(c.dob);
      const [hour, minute] = parseTime(c.time);
      expect(getRisingSign(
        y, m, d, hour, minute,
        c.utcOffsetMinutes,
        c.lat, c.lng
      )).toBe(c.expected.risingSign);
    });
  }
});

describe('rising sign — math primitives', () => {
  for (const c of referenceCases) {
    it(`${c.label}: Julian day`, () => {
      const utHours = c.h + c.min / 60 - c.utcOffsetMinutes / 60;
      expect(julianDay(c.y, c.m, c.d, utHours)).toBeCloseTo(c.jd, 6);
    });

    it(`${c.label}: GMST and obliquity`, () => {
      const utHours = c.h + c.min / 60 - c.utcOffsetMinutes / 60;
      const jd = julianDay(c.y, c.m, c.d, utHours);
      expect(gmstDeg(jd)).toBeCloseTo(c.gmst, 4);
      expect(obliquityDeg(jd)).toBeCloseTo(c.obliquity, 4);
    });

    it(`${c.label}: ascendant and sign`, () => {
      expect(ascendantDeg(
        c.y, c.m, c.d, c.h, c.min,
        c.utcOffsetMinutes,
        c.lat, c.lng
      )).toBeCloseTo(c.ascendant, 4);
      expect(getRisingSign(
        c.y, c.m, c.d, c.h, c.min,
        c.utcOffsetMinutes,
        c.lat, c.lng
      )).toBe(c.sign);
    });
  }
});

describe('rising sign — buildProfile integration', () => {
  it('omits risingSign when no opts are supplied', () => {
    const p = buildProfile('alice', '1990-06-15');
    expect(p.risingSign).toBeUndefined();
    expect(p.sunSign).toBe('gemini');
    expect(p.animal).toBe('horse');
    expect(p.lifePath).toBe(4);
  });

  it('omits risingSign when opts are empty', () => {
    const p = buildProfile('alice', '1990-06-15', {});
    expect(p.risingSign).toBeUndefined();
  });

  it('computes risingSign when full time and location opts are supplied', () => {
    const p = buildProfile('alice', '1990-06-15', {
      time: '12:00',
      country: 'DE',
      lat: 51.5074,
      lng: -0.1278
    });
    expect(p.risingSign).toBe('virgo');
    expect(p.sunSign).toBe('gemini');
    expect(p.chineseElement).toBe('metal');
    expect(p.animal).toBe('horse');
    expect(p.innerAnimal).toBe('horse');
    expect(p.lifePath).toBe(4);
    expect(p.nameNumber).toBe(3);
    expect(p.soulUrge).toBe(6);
  });
});

describe('rising sign — edge cases', () => {
  const cases = [
    ['equator', 2000, 1, 1, 12, 0, 0, 0, 0],
    ['northern high latitude', 2000, 1, 1, 12, 0, 0, 66.5, 10],
    ['southern high latitude', 2000, 1, 1, 12, 0, 0, -66.5, 10],
    ['near north pole', 2000, 1, 1, 12, 0, 0, 89, 10],
    ['near south pole', 2000, 1, 1, 12, 0, 0, -89, 10],
    ['east of IDL', 2000, 1, 1, 12, 0, 720, 0, 179.99],
    ['west of IDL', 2000, 1, 1, 12, 0, -720, 0, -179.99],
    ['pre-1970 Beijing anchor', 1924, 2, 4, 0, 0, 480, 39.9, 116.4],
    ['post-2050 future date', 2099, 12, 31, 23, 59, 0, 51.5, -0.1]
  ];

  for (const [label, y, m, d, h, min, offset, lat, lng] of cases) {
    it(`${label}: returns a valid sign`, () => {
      const asc = ascendantDeg(y, m, d, h, min, offset, lat, lng);
      const sign = getRisingSign(y, m, d, h, min, offset, lat, lng);
      expect(Number.isNaN(asc)).toBe(false);
      expect(asc).toBeGreaterThanOrEqual(0);
      expect(asc).toBeLessThan(360);
      expect(VALID_SIGNS.has(sign)).toBe(true);
    });
  }
});
