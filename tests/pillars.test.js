// 8ball / tests / pillars.test.js
//
// Day-pillar + hour-pillar coordinates (core/pillars.js), build A. v1 scope:
// day pillar + hour pillar ONLY (brief cc_brief_pillars_module_2026-05-31 §8).
//
// ── Authoritative calibration ────────────────────────────────────────────────
// Day-pillar offsets (KS_DAY_STEM=9, KB_DAY_BRANCH=1, i.e. sex60=(JDN+49)%60,
// 0=甲子) are CALIBRATED, not guessed — verified against three authoritative
// 万年历 (今日干支) day pillars spanning 58 years. Source: buyiju.com 万年历
//   1966-01-21 → 庚辰 (geng-dragon)   [年柱 乙巳 · 月柱 己丑 · 日柱 庚辰]
//   2000-01-01 → 戊午 (wu-horse)      [年柱 己卯 · 月柱 丙子 · 日柱 戊午]
//   2024-02-10 → 甲辰 (jia-dragon)    [年柱 甲辰 · 月柱 丙寅 · 日柱 甲辰]
// A wrong noon-vs-midnight JDN epoch would break at least one of the three;
// all three match the single offset pair, which pins the calibration.
//
// Hour pillars derive from the day stem via the 五鼠遁 (Five Rats) rule:
//   hourStem = (dayStem*2 + hourBranch) mod 10. Mnemonic 五鼠遁日起时诀:
//   甲己还加甲 / 乙庚丙作初 / 丙辛从戊起 / 丁壬庚子居 / 戊癸壬子居.
//
// Fixture DOB rule (DOCTRINE §11): the day cycle is person-agnostic. All
// fixture dates are calendar/epoch anchors (millennium boundary, lunar-new-year
// dates) chosen for the calc path they exercise — no real-person DOB anchors.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STEMS,
  STEM_ELEMENTS,
  getDayPillar,
  getHourPillar,
} from '../core/pillars.js';
import {
  ANIMALS,
  buildProfile,
  getSunSign,
  getChineseElement,
  getAnimal,
  getInnerAnimal,
  getLifePath,
  getLifePathSum,
  getNameNumber,
  getNameNumberSum,
  getSoulUrge,
  getSoulUrgeSum,
  getPersonality,
  getPersonalitySum,
  getBirthday,
  getMaturity,
  getMaturitySum,
} from '../core/profile.js';
import { getBirthCard } from '../core/birthcard.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

// Step a Gregorian date by +1 day without relying on day-of-month arithmetic.
const nextDay = (y, m, d) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
};

const ELEMENT_BY_HALF = ['wood', 'fire', 'earth', 'metal', 'water'];

describe('STEMS / STEM_ELEMENTS structure', () => {
  it('STEMS lists the 10 heavenly stems in canonical order', () => {
    expect(STEMS).toEqual([
      'jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui',
    ]);
  });

  it('STEM_ELEMENTS maps 10 stems → 5 elements ×2 (floor(i/2))', () => {
    expect(STEM_ELEMENTS).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(STEM_ELEMENTS[i]).toBe(ELEMENT_BY_HALF[Math.floor(i / 2)]);
    }
  });
});

// ── Locked authoritative fixtures (day) ──────────────────────────────────────
const DAY_FIXTURES = [
  { date: [1966, 1, 21], stemIndex: 6, branchIndex: 4, stem: 'geng', element: 'metal', animal: 'dragon', ganzhi: '庚辰' },
  { date: [2000, 1, 1],  stemIndex: 4, branchIndex: 6, stem: 'wu',   element: 'earth', animal: 'horse',  ganzhi: '戊午' },
  { date: [2024, 2, 10], stemIndex: 0, branchIndex: 4, stem: 'jia',  element: 'wood',  animal: 'dragon', ganzhi: '甲辰' },
];

describe('day pillar — authoritative fixtures (buyiju.com 万年历, 58-yr spread)', () => {
  for (const f of DAY_FIXTURES) {
    const [y, m, d] = f.date;
    it(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} → ${f.ganzhi} (${f.stem}-${f.animal})`, () => {
      expect(getDayPillar(y, m, d)).toEqual({
        stemIndex: f.stemIndex,
        branchIndex: f.branchIndex,
        stemElement: f.element,
        animal: f.animal,
      });
      expect(STEMS[f.stemIndex]).toBe(f.stem);
    });
  }

  it('fixtures span more than 50 years (epoch-error guard)', () => {
    const years = DAY_FIXTURES.map(f => f.date[0]);
    expect(Math.max(...years) - Math.min(...years)).toBeGreaterThan(50);
  });
});

// ── Locked hour fixtures (五鼠遁, derived from verified day stems) ────────────
// 子-hour at h=23 lands on the SAME civil day (no 晚子时 rollover) — fixture
// 2024-02-10 h23 deliberately exercises that locked convention.
const HOUR_FIXTURES = [
  { date: [2000, 1, 1],  hour: 0,  stemIndex: 8, branchIndex: 0, stem: 'ren', element: 'water', animal: 'rat',   ganzhi: '壬子' },
  { date: [2000, 1, 1],  hour: 12, stemIndex: 4, branchIndex: 6, stem: 'wu',  element: 'earth', animal: 'horse', ganzhi: '戊午' },
  { date: [1966, 1, 21], hour: 14, stemIndex: 9, branchIndex: 7, stem: 'gui', element: 'water', animal: 'goat',  ganzhi: '癸未' },
  { date: [2024, 2, 10], hour: 23, stemIndex: 0, branchIndex: 0, stem: 'jia', element: 'wood',  animal: 'rat',   ganzhi: '甲子' },
];

describe('hour pillar — authoritative fixtures (五鼠遁)', () => {
  for (const f of HOUR_FIXTURES) {
    const [y, m, d] = f.date;
    it(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} h${f.hour} → ${f.ganzhi} (${f.stem}-${f.animal})`, () => {
      expect(getHourPillar(y, m, d, f.hour)).toEqual({
        stemIndex: f.stemIndex,
        branchIndex: f.branchIndex,
        stemElement: f.element,
        animal: f.animal,
      });
      expect(STEMS[f.stemIndex]).toBe(f.stem);
    });
  }
});

describe('hour-branch formula across all 24 hours', () => {
  // 地支 hour windows: 子 spans 23:00–00:59 (h=23 folds to branch 0), then each
  // branch covers two civil hours. 午 (Horse, index 6) is the noon window.
  const EXPECTED_BRANCH = [
    0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6,
    6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 0,
  ];
  // Use a fixed jia day (2024-02-10) so branchIndex is read independent of stem.
  it('h=0..23 each land the expected earthly branch', () => {
    for (let h = 0; h < 24; h++) {
      expect(getHourPillar(2024, 2, 10, h).branchIndex).toBe(EXPECTED_BRANCH[h]);
    }
  });

  it('worked anchors: 23→子, 0→子, 1→丑, 3→寅, 12→午', () => {
    expect(getHourPillar(2024, 2, 10, 23).branchIndex).toBe(0);  // 子 Rat (23:00)
    expect(getHourPillar(2024, 2, 10, 0).branchIndex).toBe(0);   // 子 Rat
    expect(getHourPillar(2024, 2, 10, 1).branchIndex).toBe(1);   // 丑 Ox
    expect(getHourPillar(2024, 2, 10, 3).branchIndex).toBe(2);   // 寅 Tiger
    expect(getHourPillar(2024, 2, 10, 12).branchIndex).toBe(6);  // 午 Horse (noon)
    expect(ANIMALS[getHourPillar(2024, 2, 10, 12).branchIndex]).toBe('horse');
  });
});

describe('Five Rats (五鼠遁) stem rule', () => {
  // The 子-hour (branch 0) stem per day stem — the load-bearing table the rule
  // encodes. dayStem groups 甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬.
  const ZI_HOUR_STEM = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];

  it('子-hour stem matches the rule for all 10 day stems', () => {
    // 10 consecutive days from 2000-01-01 (戊 day, stem 4) cover all 10 day stems.
    let date = [2000, 1, 1];
    const seen = new Set();
    for (let i = 0; i < 10; i++) {
      const dayStem = getDayPillar(...date).stemIndex;
      seen.add(dayStem);
      const ziHourStem = getHourPillar(...date, 0).stemIndex;
      expect(ziHourStem).toBe(ZI_HOUR_STEM[dayStem]);
      // and the general formula must agree with the table
      expect(ziHourStem).toBe((dayStem * 2 + 0) % 10);
      date = nextDay(...date);
    }
    expect(seen.size).toBe(10); // all day stems exercised
  });

  it('general rule hourStem = (dayStem*2 + hourBranch) mod 10 holds across hours', () => {
    for (const [y, m, d] of [[1966, 1, 21], [2000, 1, 1], [2024, 2, 10]]) {
      const dayStem = getDayPillar(y, m, d).stemIndex;
      for (let h = 0; h < 24; h++) {
        const hp = getHourPillar(y, m, d, h);
        expect(hp.stemIndex).toBe((dayStem * 2 + hp.branchIndex) % 10);
      }
    }
  });
});

describe('day-cycle continuity', () => {
  it('consecutive days advance dayStem +1 mod 10 and dayBranch +1 mod 12', () => {
    // ~430 days crossing a year boundary AND the 2000-02-29 leap day.
    let date = [1999, 12, 28];
    let prev = getDayPillar(...date);
    for (let i = 0; i < 430; i++) {
      date = nextDay(...date);
      const cur = getDayPillar(...date);
      expect(cur.stemIndex).toBe((prev.stemIndex + 1) % 10);
      expect(cur.branchIndex).toBe((prev.branchIndex + 1) % 12);
      prev = cur;
    }
  });

  it('crosses the 2000-02-29 leap day without a skip', () => {
    expect(getDayPillar(2000, 2, 28).branchIndex)
      .toBe((getDayPillar(2000, 2, 29).branchIndex + 11) % 12);
    expect(getDayPillar(2000, 2, 29).branchIndex)
      .toBe((getDayPillar(2000, 3, 1).branchIndex + 11) % 12);
  });
});

describe('branch → animal alignment (reuses profile.js ANIMALS)', () => {
  it('branch index 0 maps to the same "rat" string the engine uses', () => {
    expect(ANIMALS[0]).toBe('rat');
    // Walk to the first 子 (branch 0) day on/after 2000-01-01 (which is 2000-01-07).
    let date = [2000, 1, 1];
    while (getDayPillar(...date).branchIndex !== 0) date = nextDay(...date);
    expect(getDayPillar(...date).animal).toBe('rat');
    expect(getDayPillar(...date).animal).toBe(ANIMALS[0]);
  });

  it('every branch index resolves to ANIMALS[branchIndex] across 12 days', () => {
    let date = [2000, 1, 1];
    for (let i = 0; i < 12; i++) {
      const p = getDayPillar(...date);
      expect(p.animal).toBe(ANIMALS[p.branchIndex]);
      date = nextDay(...date);
    }
  });
});

describe('null-hour graceful, day pillar always defined', () => {
  it('hour pillar is null for missing/invalid hours', () => {
    for (const bad of [undefined, null, NaN, -1, 24, 25, 23.5, 0.5, '12', '0']) {
      expect(getHourPillar(2000, 1, 1, bad)).toBeNull();
    }
  });

  it('hour pillar resolves for every valid integer hour 0..23', () => {
    for (let h = 0; h <= 23; h++) {
      expect(getHourPillar(2000, 1, 1, h)).not.toBeNull();
    }
  });

  it('day pillar is always a defined object (date-only, never null)', () => {
    for (const [y, m, d] of [[1900, 1, 1], [1966, 1, 21], [2000, 1, 1], [2024, 2, 10], [2099, 12, 31]]) {
      const p = getDayPillar(y, m, d);
      expect(p).toBeTypeOf('object');
      expect(p.animal).toBeTypeOf('string');
      expect(p.stemElement).toBeTypeOf('string');
    }
  });
});

describe('buildProfile integration — additive only', () => {
  const PREEXISTING_KEYS = [
    'name', 'firstName', 'sunSign', 'chineseElement', 'animal', 'innerAnimal',
    'lifePath', 'lifePathSum', 'nameNumber', 'nameNumberSum', 'soulUrge',
    'soulUrgeSum', 'personality', 'personalitySum', 'birthday', 'maturity',
    'maturitySum', 'yyyy', 'mm', 'dd', 'risingSign', 'birthCard',
  ];

  it('adds exactly dayPillar + hourPillar, in order, removing/reordering none', () => {
    const p = buildProfile('Test Specimen', '2000-01-01');
    expect(Object.keys(p)).toEqual([...PREEXISTING_KEYS, 'dayPillar', 'hourPillar']);
  });

  it('every pre-existing field is byte-identical to its independent getter (no-opts path)', () => {
    const name = 'Test Specimen';
    const dob = '2000-01-01';
    const [y, m, d] = dob.split('-').map(Number);
    const p = buildProfile(name, dob);
    const expected = {
      name,
      firstName: 'Test',
      sunSign: getSunSign(m, d),
      chineseElement: getChineseElement(y, m, d),
      animal: getAnimal(y, m, d),
      innerAnimal: getInnerAnimal(y, m, d),
      lifePath: getLifePath(y, m, d),
      lifePathSum: getLifePathSum(y, m, d),
      nameNumber: getNameNumber(name),
      nameNumberSum: getNameNumberSum(name),
      soulUrge: getSoulUrge(name),
      soulUrgeSum: getSoulUrgeSum(name),
      personality: getPersonality(name),
      personalitySum: getPersonalitySum(name),
      birthday: getBirthday(d),
      maturity: getMaturity(y, m, d, name),
      maturitySum: getMaturitySum(y, m, d, name),
      yyyy: y, mm: m, dd: d,
      risingSign: undefined,
      birthCard: getBirthCard(y, m, d),
    };
    for (const k of PREEXISTING_KEYS) {
      expect(p[k]).toEqual(expected[k]);
    }
  });

  it('rising-sign path is undisturbed when full opts are supplied', () => {
    // NYC: tz + lat/lng + time. rising should still resolve to a string and the
    // additive pillars should appear alongside it.
    const opts = { time: '14:30', tz: 'America/New_York', lat: 40.7128, lng: -74.006 };
    const p = buildProfile('Test Specimen', '2000-01-01', opts);
    expect(typeof p.risingSign).toBe('string');
    expect(p.dayPillar).toEqual({ stemIndex: 4, branchIndex: 6, stemElement: 'earth', animal: 'horse' });
    expect(p.hourPillar).not.toBeNull();
  });

  it('dayPillar always present; hourPillar resolves on time alone (no city needed)', () => {
    // No birth time → hourPillar null, dayPillar present.
    const dateOnly = buildProfile('Test', '2000-01-01');
    expect(dateOnly.dayPillar).toEqual({ stemIndex: 4, branchIndex: 6, stemElement: 'earth', animal: 'horse' });
    expect(dateOnly.hourPillar).toBeNull();

    // lat/lng but no birth time → still no hour pillar (hour pillar needs the hour).
    const latLngOnly = buildProfile('Test', '2000-01-01', { lat: 40, lng: -74 });
    expect(latLngOnly.hourPillar).toBeNull();

    // time but no city/lat/lng/tz → hour pillar RESOLVES (needs only the hour).
    const timeNoCity = buildProfile('Test', '1966-01-21', { time: '14:00' });
    expect(timeNoCity.hourPillar).toEqual({ stemIndex: 9, branchIndex: 7, stemElement: 'water', animal: 'goat' });

    // malformed time → hourPillar null.
    expect(buildProfile('Test', '2000-01-01', { time: 'nope' }).hourPillar).toBeNull();
    expect(buildProfile('Test', '2000-01-01', { time: '25:00' }).hourPillar).toBeNull();
  });
});

describe('no surface leak this cycle (brief §7 — data-only, no render wiring)', () => {
  it('index.html does not reference dayPillar or hourPillar', () => {
    expect(html).not.toContain('dayPillar');
    expect(html).not.toContain('hourPillar');
  });
});
