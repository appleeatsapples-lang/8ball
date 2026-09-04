// 8ball / tests / public.test.js
//
// Public-tier computation engine (core/public.js) + its tables
// (content/public.v3.js, which carries content/public.v1.js + v2 unedited).
//
// Five required properties, per the tier brief, each with its own describe
// block below: determinism, table coverage with no gaps, a date-only path
// that produces the full output with the hour absent, an anti-fit that is
// never also a fit family, and snapshot fixtures for a set of known dates.
// Everything else here guards the seams that would let one of those five
// pass while the engine was still wrong.
//
// Fixture dates (DOCTRINE §11): synthetic. Every one is a calendar or
// calibration anchor chosen for the calc path it exercises — the day-pillar
// anchors shared with tests/pillars.test.js, the calc v3.1 correction dates,
// every value of the mode driver, the leap day, and the ends of the
// 1900–2100 solar-term table. No real person's date of birth.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parsePublicDob,
  getDayMaster,
  getSeasonalState,
  getSeason,
  getFavorability,
  getWorkMode,
  resolveModeKey,
  rankDomainFamilies,
  getAntiFitFamily,
  getRolePosture,
  getRoleLine,
  buildPublicReading,
} from '../core/public.js';
import {
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  BRANCH_ELEMENTS,
  SEASONAL_STATES,
  ELEMENT_FAVORABILITY,
  DOMAIN_FAMILIES,
  FAMILY_CHARACTERS,
  WORK_MODES,
  MASTER_MODE_BRIDGE,
  ROLE_POSTURES,
  PUBLIC_SOURCES,
} from '../content/public.v3.js';
import { NUMEROLOGY_MEANINGS } from '../content/meanings.v3.js';
import { LIFE_PATH_VALUES } from '../content/concordance.v3.js';
import { TIER_COORDS } from '../ui/tiers.js';
import { ANIMALS, buildProfile, getInnerAnimal, getBirthday } from '../core/profile.js';
import { getDayPillar, STEM_ELEMENTS } from '../core/pillars.js';
import { MAJOR_ARCANA, getBirthCard } from '../core/birthcard.js';
import {
  voiceRegisterHits,
  SECOND_PERSON_RE,
  DIAGNOSTIC_FRAMING_RE,
  BANNED_PATTERNS,
} from './helpers/voice-register.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const fixture = JSON.parse(
  readFileSync(join(__dirname, 'public_tier.fixture.json'), 'utf-8'),
);
const publicSrc = readFileSync(join(REPO_ROOT, 'core', 'public.js'), 'utf-8');

// The mode driver's domain is the shipped numerology registry — imported,
// not restated, so this tier can never disagree with §1.B about which values
// exist. As of §1.D v0.59 the driver is the BIRTHDAY number; as of §1.B v0.62
// that number keeps its master value, so the domain is the full terminal
// domain and the nine-entry mode table is reached through MASTER_MODE_BRIDGE.
const TERMINAL = LIFE_PATH_VALUES;
// The nine keys the authored mode table actually carries.
const NINE = LIFE_PATH_VALUES.filter(n => n <= 9);
const FREE_COORD_KEYS = TIER_COORDS.free;

// A deterministic sweep across the whole supported solar-term range. The
// stride is prime so it walks every month and every weekday position rather
// than landing on the same day-of-month each year; no randomness, so a
// failure is reproducible from the printed date alone.
function* sweepDates(strideDays = 37) {
  const start = Date.UTC(1900, 0, 1);
  const end = Date.UTC(2100, 11, 31);
  const day = 86400000;
  for (let t = start; t <= end; t += strideDays * day) {
    const d = new Date(t);
    yield [
      d.getUTCFullYear(),
      String(d.getUTCMonth() + 1).padStart(2, '0'),
      String(d.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }
}

// Sweep assertions COLLECT and assert once, rather than calling expect() per
// item. The register sweep below made 198,333 expect() calls for ~136ms of
// real work — 94% of its 2.17s was vitest's per-assertion overhead, and it was
// the slowest test in the repository by 4x, close enough to the default 5s
// budget to time out under load (see DOCTRINE §7 stage 3 v0.79's testTimeout
// note and the journal's parallel-run flake entries). Collecting is also
// better diagnosis: a failure lists every offending date instead of aborting
// on the first. The predicates, the data and the dates are unchanged — this
// is the pattern the non-sweep tests in this file already use.
function expectNone(offenders, what) {
  const shown = offenders.slice(0, 25);
  const more = offenders.length > 25 ? `\n… and ${offenders.length - 25} more` : '';
  expect(offenders, `${offenders.length} ${what}:\n${shown.join('\n')}${more}`).toEqual([]);
}

// Source with `//` comment lines dropped. The modules deliberately keep
// history notes naming the retired `expression` vocabulary (why the rename
// happened, per L17 supersede-don't-erase); the label bans below are about
// live code, so they scan this, not the raw file.
const codeOnly = src => src.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');

// Every string reachable from a value, for the register scans.
function collectStrings(value, path = '', out = []) {
  if (typeof value === 'string') out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectStrings(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

describe('public tier — determinism', () => {
  it('the same date yields byte-identical output across 100 runs', () => {
    const bad = [];
    for (const dob of ['1900-01-01', '1966-01-21', '2000-01-01', '2024-02-10', '2100-12-31']) {
      const first = JSON.stringify(buildPublicReading(dob));
      for (let run = 0; run < 100; run++) {
        if (JSON.stringify(buildPublicReading(dob)) !== first) bad.push(`${dob} run ${run} differs from run 0`);
      }
      expectNone(bad, 'runs are not byte-identical');
    }
  });

  it('output is identical whether an hour is supplied or not, in any accepted shape', () => {
    for (const dob of ['1919-01-01', '2000-02-29', '2050-06-15']) {
      const dateOnly = JSON.stringify(buildPublicReading(dob));
      const shapes = [
        undefined, {}, { time: '00:00' }, { time: '07:30' }, { time: '23:59' },
        { hour: 0 }, { hour: 13 }, { hour: 23 }, { time: '07:30', hour: 7 },
        { time: 'not-a-time' }, { hour: 99 },
      ];
      for (const opts of shapes) {
        expect(JSON.stringify(buildPublicReading(dob, opts)), `${dob} ${JSON.stringify(opts)}`)
          .toBe(dateOnly);
      }
    }
  });

  it('carries no non-deterministic source — no clock, no randomness, no I/O', () => {
    for (const forbidden of [
      'Date.now', 'new Date', 'Math.random', 'fetch(', 'localStorage',
      'sessionStorage', 'XMLHttpRequest', 'sendBeacon', 'toLocale', 'process.env',
    ]) {
      expect(publicSrc.includes(forbidden), `core/public.js contains ${forbidden}`).toBe(false);
    }
  });
});

describe('public tier — coverage, no gaps', () => {
  it('every element × strength resolves to a favorability entry', () => {
    expect(Object.keys(ELEMENT_FAVORABILITY)).toHaveLength(10);
    for (const element of ELEMENTS) {
      for (const strength of ['strong', 'weak']) {
        const entry = getFavorability(element, strength);
        expect(entry.dayMaster).toBe(element);
        expect(entry.strength).toBe(strength);
        expect(entry.favorable.length + entry.unfavorable.length).toBe(5);
        expect([...entry.favorable, ...entry.unfavorable].sort())
          .toEqual([...ELEMENTS].sort());
      }
    }
  });

  it('every element × birthday ranks three distinct families and an anti-fit', () => {
    for (const element of ELEMENTS) {
      for (const n of NINE) {
        const ranked = rankDomainFamilies(element, n);
        expect(ranked, `${element} × ${n}`).toHaveLength(3);
        expect(new Set(ranked.map(f => f.key)).size).toBe(3);
        expect(new Set(ranked.map(f => f.character)).size).toBe(3);
        expect(ranked.every(f => f.element === element)).toBe(true);
        const anti = getAntiFitFamily(element, n);
        expect(anti.element).toBe(element);
      }
    }
  });

  it('every birthday has a mode whose priority is a permutation of the characters', () => {
    expect(Object.keys(WORK_MODES).map(Number).sort((a, b) => a - b))
      .toEqual([...NINE]);
    for (const n of NINE) {
      const mode = getWorkMode(n);
      expect(mode.birthday).toBe(n);
      expect([...mode.priority].sort()).toEqual([...FAMILY_CHARACTERS].sort());
      expect(mode.theme.length).toBeGreaterThan(0);
      expect(mode.method.length).toBeGreaterThan(0);
    }
  });

  it('every major-arcana number 0..21 has a posture, in the birthcard ordering', () => {
    expect(ROLE_POSTURES).toHaveLength(22);
    ROLE_POSTURES.forEach((posture, index) => {
      expect(posture.number).toBe(index);
      expect(posture.arcana).toBe(MAJOR_ARCANA[index]);
      expect(getRolePosture(index)).toBe(posture);
    });
  });

  it('every seasonal state resolves, and the five relations are total over element pairs', () => {
    const seen = new Set();
    for (const dayMaster of ELEMENTS) {
      for (const season of ELEMENTS) {
        const state = getSeasonalState(dayMaster, season);
        expect(Object.values(SEASONAL_STATES)).toContain(state);
        expect(['strong', 'weak']).toContain(state.strength);
        seen.add(state.key);
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(SEASONAL_STATES).sort());
  });

  it('the whole 1900–2100 range resolves — no throw, no null, no empty field', () => {
    const bad = [];
    let count = 0;
    for (const dob of sweepDates()) {
      const r = buildPublicReading(dob);
      count += 1;
      if (!TERMINAL.includes(r.mode.birthday)) bad.push(`${dob}: birthday ${r.mode.birthday} is not a terminal value`);
      if (!NINE.includes(r.mode.modeKey)) bad.push(`${dob}: modeKey ${r.mode.modeKey} is outside 1..9`);
      if (r.mode.bridged !== (MASTER_MODE_BRIDGE[r.mode.birthday] !== undefined)) bad.push(`${dob}: bridged flag disagrees with MASTER_MODE_BRIDGE`);
      if (!(r.posture.number >= 0 && r.posture.number <= 21)) bad.push(`${dob}: posture number ${r.posture.number} is outside 0..21`);
      if (r.families.length !== 3) bad.push(`${dob}: ${r.families.length} families, expected 3`);
      if (!r.antiFit.key) bad.push(`${dob}: anti-fit key is empty`);
      if (!r.roleLine.endsWith('.')) bad.push(`${dob}: role line does not end in a period`);
      if (!collectStrings(r).every(({ text }) => text.length > 0)) bad.push(`${dob}: an empty string in the reading`);
    }
    expectNone(bad, 'readings break the range contract');
    expect(count).toBeGreaterThan(1900);
  });
});

describe('public tier — date-only input', () => {
  it('the full output resolves from a date with no hour anywhere in it', () => {
    const r = buildPublicReading('1984-02-02');
    expect(Object.keys(r)).toEqual([
      'dob', 'dayMaster', 'season', 'strength', 'favorable', 'unfavorable',
      'primaryFavorable', 'primaryUnfavorable', 'favorabilityNote', 'mode',
      'posture', 'families', 'antiFit', 'roleLine', 'sources',
    ]);
    expect(r.dayMaster.element).toBeTruthy();
    expect(r.season.monthAnimal).toBeTruthy();
    expect(r.families.map(f => f.rank)).toEqual([1, 2, 3]);
    expect(r.roleLine.split(', ').length).toBeGreaterThan(1);
    expect(JSON.stringify(r)).not.toMatch(/hour/i);
  });

  it('takes a date and nothing identifying — no name parameter, no name in the output', () => {
    // One required parameter — the date. The second (ignored) opts parameter
    // is defaulted, so it does not count toward Function.length.
    expect(buildPublicReading.length).toBe(1);
    const r = buildPublicReading('2000-01-01');
    expect(r).not.toHaveProperty('name');
    expect(r).not.toHaveProperty('firstName');
    expect(JSON.stringify(r)).not.toMatch(/name"/);
  });

  it('rejects malformed and impossible dates exactly as buildProfile does', () => {
    // Differential guard on the deliberate validation fork (see core/public.js).
    const cases = [
      '', 'nonsense', '2000-1-1', '2000/01/01', '20000101', '2000-01-01T00:00',
      '2000-00-01', '2000-13-01', '2000-01-00', '2000-01-32',
      '2001-02-29', '1900-02-29', '2000-02-29', '2000-02-30', '2000-04-31',
      '1999-11-31', '2024-02-29', '2100-02-29', '2000-06-31', '2000-12-31',
    ];
    for (const dob of cases) {
      const publicThrow = (() => { try { parsePublicDob(dob); return null; } catch (e) { return e.message; } })();
      const profileThrow = (() => { try { buildProfile('x', dob); return null; } catch (e) { return e.message; } })();
      expect(publicThrow, `divergence on "${dob}"`).toBe(profileThrow);
    }
    expect(() => buildPublicReading('2001-02-29')).toThrow('DOB out of range');
    expect(() => buildPublicReading('nope')).toThrow('DOB must be YYYY-MM-DD');
  });

  it('accepts the same dates buildProfile accepts across the sweep', () => {
    const bad = [];
    for (const dob of sweepDates(101)) {
      try { parsePublicDob(dob); } catch (err) { bad.push(`${dob}: parsePublicDob threw ${err.message}`); }
      try { buildProfile('x', dob); } catch (err) { bad.push(`${dob}: buildProfile threw ${err.message}`); }
    }
    expectNone(bad, 'dates one parser accepts and the other rejects');
  });
});

describe('public tier — anti-fit is never a fit family', () => {
  it('holds for every element × life-path combination', () => {
    for (const element of ELEMENTS) {
      for (const strength of ['strong', 'weak']) {
        const { favorable, unfavorable } = getFavorability(element, strength);
        expect(favorable).not.toContain(unfavorable[0]);
        for (const n of NINE) {
          const fit = rankDomainFamilies(favorable[0], n).map(f => f.key);
          const anti = getAntiFitFamily(unfavorable[0], n).key;
          expect(fit, `${element}/${strength} × ${n}`).not.toContain(anti);
        }
      }
    }
  });

  it('holds on every reading across the 1900–2100 sweep', () => {
    const bad = [];
    for (const dob of sweepDates()) {
      const r = buildPublicReading(dob);
      if (r.families.some(f => f.key === r.antiFit.key)) bad.push(`${dob}: anti-fit key ${r.antiFit.key} is also a fit family`);
      if (r.families.some(f => f.element === r.antiFit.element)) bad.push(`${dob}: anti-fit element ${r.antiFit.element} is also a fit element`);
      if (r.favorable.includes(r.primaryUnfavorable)) bad.push(`${dob}: ${r.primaryUnfavorable} is both favorable and the primary unfavorable`);
      if (r.unfavorable.includes(r.primaryFavorable)) bad.push(`${dob}: ${r.primaryFavorable} is both unfavorable and the primary favorable`);
    }
    expectNone(bad, 'readings put the anti-fit inside the fit');
  });
});

describe('public tier — snapshot fixtures', () => {
  it('carries at least 12 cases, and they cover the calc paths they claim to', () => {
    expect(fixture.cases.length).toBeGreaterThanOrEqual(12);
    // Every date calc v3.1 moved is in the set — the LNY and all three
    // solar terms — so a regression in the era-offset rule fails here too.
    // 2026-07-29 HKO audit (P1-D): 1912-01-07 and 1927-09-08 were added
    // here — 1912 xiaohan was never actually in this set despite the old
    // comment's claim, and 1927-09-09 alone cannot discriminate the
    // corrected bailu cutoff (Sep 8) from the pre-PR-#140 one, since Sep 9
    // lands after either. 1911-05-06 stays: the P1-D fix moved lixia to
    // 05-07, so this date is now the day BEFORE that boundary rather than
    // on it — still a real, useful anchor, just a different one. The full
    // exact-date + before/boundary matrix for all eight P1-D corrections
    // lives in tests/profile.test.js, against getInnerAnimal directly.
    for (const dob of [
      '1916-02-03', '1911-05-06', '1912-01-07', '1927-09-09', '1927-09-08',
    ]) {
      expect(fixture.cases.map(c => c.dob), dob).toContain(dob);
    }
    const readings = fixture.cases.map(c => c.reading);
    expect(new Set(readings.map(r => r.dayMaster.element)).size).toBe(5);
    expect(new Set(readings.map(r => r.strength)).size).toBe(2);
    expect(new Set(readings.map(r => r.season.state)).size).toBe(5);
    // Every authored mode key, plus both master birthday values reachable
    // from a day of the month (calc v4, §1.B v0.62) — so the fixture set
    // covers the bridged read as well as the nine direct ones.
    expect([...new Set(readings.map(r => r.mode.birthday))].sort((a, b) => a - b))
      .toEqual([...NINE, 11, 22]);
    expect([...new Set(readings.map(r => r.mode.modeKey))].sort((a, b) => a - b))
      .toEqual([...NINE]);
    expect(readings.filter(r => r.mode.bridged).length).toBeGreaterThanOrEqual(2);
    for (const c of fixture.cases) expect(c.note.length).toBeGreaterThan(10);
  });

  it('every fixture case still computes byte-identically', () => {
    for (const { dob, reading } of fixture.cases) {
      expect(buildPublicReading(dob), dob).toEqual(reading);
    }
  });
});

// ── Anchors independent of the snapshot ─────────────────────────────────────
// A fixture regenerated from the implementation cannot catch an implementation
// that was wrong when it was generated. These re-derive the same values from
// the modules the engine composes, and from one fully hand-walked case.
describe('public tier — independent anchors', () => {
  it('the day master matches the calibrated day pillar for the shared anchors', () => {
    const anchors = [
      ['1966-01-21', 'geng', 'metal'],
      ['2000-01-01', 'wu', 'earth'],
      ['2024-02-10', 'jia', 'wood'],
    ];
    for (const [dob, stem, element] of anchors) {
      const [y, m, d] = dob.split('-').map(Number);
      const dm = getDayMaster(y, m, d);
      expect(dm.stem, dob).toBe(stem);
      expect(dm.element, dob).toBe(element);
      expect(dm.element, dob).toBe(STEM_ELEMENTS[getDayPillar(y, m, d).stemIndex]);
    }
  });

  // 2000-01-01, walked by hand:
  //   day pillar 戊午 wu-horse → day master wu → earth, yang (stem index 4)
  //   Jan 1 precedes xiaohan, so the month branch is the previous rat window
  //     → rat → water season
  //   earth controls water (ke) → 囚 qiu → weak
  //   earth weak → favourable [fire, earth], unfavourable [wood, metal, water]
  //   birthday = day-of-month 1 → mode 1 (initiative),
  //     priority [origination, transmission, stewardship]
  //   fire families by that priority → tech, media, energy
  //   anti-fit = wood's stewardship family → health
  //   birth card 2+0+0+0+1+1 = 4 → IV · the emperor
  it('reproduces the fully hand-walked 2000-01-01 case', () => {
    const r = buildPublicReading('2000-01-01');
    expect(r.dayMaster).toEqual({
      stem: 'wu', polarity: 'yang', element: 'earth', branchAnimal: 'horse',
    });
    expect(r.season.monthAnimal).toBe('rat');
    expect(r.season.element).toBe('water');
    expect(r.season.state).toBe('qiu');
    expect(r.strength).toBe('weak');
    expect(r.favorable).toEqual(['fire', 'earth']);
    expect(r.unfavorable).toEqual(['wood', 'metal', 'water']);
    expect(r.mode).toMatchObject({ dayOfMonth: 1, birthday: 1, theme: 'initiative' });
    expect(r.posture).toMatchObject({ number: 4, roman: 'IV', arcana: 'the emperor' });
    expect(r.families.map(f => f.key)).toEqual(['tech', 'media', 'energy']);
    expect(r.antiFit.key).toBe('health');
    expect(r.roleLine).toBe(
      'a role held as the setting of order, worked from a standing start, one line at a time.',
    );
  });

  it('re-derives every favorability entry from the sheng and ke cycles', () => {
    // The convention the table claims: a supported day master opens onto
    // output → wealth → officer; an unsupported one onto resource → peer.
    for (const element of ELEMENTS) {
      const peer = element;
      const resource = ELEMENTS.find(e => ELEMENT_SHENG[e] === element);
      const output = ELEMENT_SHENG[element];
      const wealth = ELEMENT_KE[element];
      const officer = ELEMENTS.find(e => ELEMENT_KE[e] === element);
      expect(getFavorability(element, 'strong').favorable).toEqual([output, wealth, officer]);
      expect(getFavorability(element, 'strong').unfavorable).toEqual([resource, peer]);
      expect(getFavorability(element, 'weak').favorable).toEqual([resource, peer]);
      expect(getFavorability(element, 'weak').unfavorable).toEqual([officer, output, wealth]);
    }
  });

  it('the mode driver IS the shipped birthday number — no second implementation', () => {
    // Three controller rulings on 2026-07-29: collapse to nine, rename to
    // what it was, then move it OFF the free surface (§1.D v0.59, spec §6.1).
    // core/public.js exports no number function of its own; the reading reads
    // its driver from core/profile.js. If these ever diverge, one of the two
    // changed alone, which is the drift this pins against.
    expect(codeOnly(publicSrc)).not.toMatch(/reduceExpression|getExpressionNumber|getExpressionSum/);
    const bad = [];
    for (const dob of sweepDates(23)) {
      const [, , d] = dob.split('-').map(Number);
      const { mode } = buildPublicReading(dob);
      if (mode.birthday !== getBirthday(d)) bad.push(`${dob}: mode.birthday ${mode.birthday} ≠ shipped getBirthday ${getBirthday(d)}`);
      if (mode.dayOfMonth !== d) bad.push(`${dob}: mode.dayOfMonth ${mode.dayOfMonth} ≠ ${d}`);
    }
    expectNone(bad, 'dates disagree with the shipped birthday number');
  });

  it('the driver is NOT a free-surface coordinate — that was the whole ruling', () => {
    // The mode used to be keyed by the life path, free since §1.D v0.38, so
    // the paid rung's only new content re-read something every visitor
    // already had. The birthday is a t2 (`numbers2`) coordinate.
    expect(FREE_COORD_KEYS).toContain('lifePath');
    expect(FREE_COORD_KEYS).not.toContain('birthday');
    expect(codeOnly(publicSrc)).not.toMatch(/getLifePath/);
  });

  it('reduces the day of the month, keeping master days master, and every day resolves', () => {
    // Days 11 and 22 are master stops under calc v4 and stay themselves;
    // 33 is not reachable from a day of the month. 29 stops at 11 rather
    // than running on to 2 — the case the nine-number rule used to swallow.
    expect(buildPublicReading('2000-01-29').mode).toMatchObject({ dayOfMonth: 29, birthday: 11 });
    expect(buildPublicReading('2000-01-11').mode).toMatchObject({ dayOfMonth: 11, birthday: 11 });
    expect(buildPublicReading('2000-01-22').mode).toMatchObject({ dayOfMonth: 22, birthday: 22 });
    expect(buildPublicReading('2000-01-31').mode).toMatchObject({ dayOfMonth: 31, birthday: 4 });
    expect(buildPublicReading('2000-01-09').mode).toMatchObject({ dayOfMonth: 9, birthday: 9 });
    const seen = new Set();
    for (let d = 1; d <= 31; d++) {
      const iso = `2000-01-${String(d).padStart(2, '0')}`;
      const { mode } = buildPublicReading(iso);
      expect(TERMINAL, iso).toContain(mode.birthday);
      seen.add(mode.birthday);
    }
    // Every single digit plus the two reachable master stops.
    expect([...seen].sort((a, b) => a - b)).toEqual([...NINE, 11, 22]);
  });

  it('a master birthday reads a base mode through a DISCLOSED bridge', () => {
    // §1.B v0.62: the coordinate keeps its master value, the nine-entry mode
    // table is reached through the declared bridge, and the reading SAYS so.
    // Silently indexing a nine-entry table with 11 is the failure this pins.
    expect(MASTER_MODE_BRIDGE).toEqual({ 11: 2, 22: 4, 33: 6 });
    for (const [masterKey, base] of Object.entries(MASTER_MODE_BRIDGE)) {
      const master = Number(masterKey);
      expect(resolveModeKey(master)).toEqual({ key: base, bridged: true, from: master });
      // The mode read for a master is byte-identical to its base's mode...
      expect(getWorkMode(master)).toBe(WORK_MODES[base]);
      // ...and the table itself gains no master entry, so nothing here can
      // pass a bridged read off as authored master content.
      expect(WORK_MODES[master]).toBeUndefined();
    }
    const bridged = buildPublicReading('2000-01-11');
    expect(bridged.mode.birthday).toBe(11);
    expect(bridged.mode.modeKey).toBe(2);
    expect(bridged.mode.bridged).toBe(true);
    expect(bridged.mode.bridgeNote).toContain('11');
    expect(bridged.mode.bridgeNote).toContain('2');
    expect(bridged.mode.theme).toBe(WORK_MODES[2].theme);
    // The provenance line names the bridge rather than a rule it does not run.
    expect(PUBLIC_SOURCES.mode).toMatch(/master/);
    expect(PUBLIC_SOURCES.mode).not.toMatch(/nine-number/);

    // An unbridged birthday reports the absence of a bridge explicitly, so a
    // consumer can distinguish "no bridge" from "field not populated".
    const direct = buildPublicReading('2000-01-09');
    expect(direct.mode).toMatchObject({ birthday: 9, modeKey: 9, bridged: false, bridgeNote: null });
    expect(resolveModeKey(9)).toEqual({ key: 9, bridged: false, from: 9 });
  });

  it('a master birthday produces a complete reading — families, anti-fit, role line', () => {
    // The bridge must not be a place the reading can half-resolve. Every
    // downstream consumer of the mode is driven, on a real master date.
    for (const iso of ['2000-01-11', '2000-01-22', '1984-03-29']) {
      const r = buildPublicReading(iso);
      expect(TERMINAL, iso).toContain(r.mode.birthday);
      expect(r.mode.bridged, iso).toBe(true);
      expect(r.families, iso).toHaveLength(3);
      expect(r.families.map(f => f.rank), iso).toEqual([1, 2, 3]);
      expect(r.antiFit.key, iso).toBeTruthy();
      expect(r.roleLine.endsWith('.'), iso).toBe(true);
      expect(collectStrings(r).every(({ text }) => text.length > 0), iso).toBe(true);
    }
  });

  it('the season reuses the shipped solar-term month animal, not a second table', () => {
    const bad = [];
    for (const dob of sweepDates(53)) {
      const [y, m, d] = dob.split('-').map(Number);
      const season = getSeason(y, m, d, getDayMaster(y, m, d).element);
      if (season.monthAnimal !== getInnerAnimal(y, m, d)) bad.push(`${dob}: month animal ${season.monthAnimal} ≠ shipped ${getInnerAnimal(y, m, d)}`);
      if (season.element !== BRANCH_ELEMENTS[season.monthAnimal]) bad.push(`${dob}: season element ${season.element} ≠ BRANCH_ELEMENTS[${season.monthAnimal}]`);
    }
    expectNone(bad, 'dates where the season leaves the shipped solar-term table');
  });

  it('the posture and role line follow the shipped birth card', () => {
    const bad = [];
    for (const dob of sweepDates(89)) {
      const [y, m, d] = dob.split('-').map(Number);
      const card = getBirthCard(y, m, d);
      const r = buildPublicReading(dob);
      if (r.posture.number !== card.number) bad.push(`${dob}: posture number ${r.posture.number} ≠ card ${card.number}`);
      if (r.posture.roman !== card.roman) bad.push(`${dob}: posture roman ${r.posture.roman} ≠ card ${card.roman}`);
      if (r.posture.arcana !== card.name) bad.push(`${dob}: posture arcana ${r.posture.arcana} ≠ card ${card.name}`);
      if (r.roleLine !== getRoleLine(r.mode.birthday, card.number)) bad.push(`${dob}: role line does not follow the shipped card`);
    }
    expectNone(bad, 'readings leave the shipped birth card');
  });
});

describe('public tier — table integrity', () => {
  it('branch elements cover all twelve animals, and only those', () => {
    expect(Object.keys(BRANCH_ELEMENTS).sort()).toEqual([...ANIMALS].sort());
    expect(Object.values(BRANCH_ELEMENTS).every(e => ELEMENTS.includes(e))).toBe(true);
    // Four earth branches close the seasons; the other four elements hold two each.
    const counts = {};
    for (const e of Object.values(BRANCH_ELEMENTS)) counts[e] = (counts[e] || 0) + 1;
    expect(counts).toEqual({ wood: 2, fire: 2, metal: 2, water: 2, earth: 4 });
  });

  it('domain families are five elements × three characters, one family per character', () => {
    expect(Object.keys(DOMAIN_FAMILIES).sort()).toEqual([...ELEMENTS].sort());
    const keys = new Set();
    for (const element of ELEMENTS) {
      const families = DOMAIN_FAMILIES[element];
      expect(families, element).toHaveLength(3);
      expect(families.map(f => f.character).sort()).toEqual([...FAMILY_CHARACTERS].sort());
      for (const f of families) {
        expect(f.element).toBe(element);
        expect(keys.has(f.key), `duplicate family key ${f.key}`).toBe(false);
        keys.add(f.key);
      }
    }
    expect(keys.size).toBe(15);
    // The families named in the tier brief, by element.
    expect(DOMAIN_FAMILIES.wood.map(f => f.key).sort()).toEqual(['growth', 'health', 'teaching']);
    expect(DOMAIN_FAMILIES.fire.map(f => f.key).sort()).toEqual(['energy', 'media', 'tech']);
    expect(DOMAIN_FAMILIES.earth.map(f => f.key).sort()).toEqual(['advisory', 'construction', 'property']);
    expect(DOMAIN_FAMILIES.metal.map(f => f.key).sort()).toEqual(['engineering', 'finance', 'law']);
    expect(DOMAIN_FAMILIES.water.map(f => f.key).sort()).toEqual(['communication', 'logistics', 'trade']);
  });

  it('the modes stay exactly nine and reuse the meanings.v3 theme vocabulary', () => {
    // Calc v4 restores the master values but authors NO master work mode —
    // the table is still nine entries, reached for a master through the
    // declared bridge. A fourth-through-twelfth entry appearing here would
    // mean new paid copy shipped under cover of a calculation change.
    expect(Object.keys(WORK_MODES)).toHaveLength(9);
    expect(WORK_MODES[11]).toBeUndefined();
    expect(WORK_MODES[22]).toBeUndefined();
    expect(WORK_MODES[33]).toBeUndefined();
    // A value that is neither a mode key nor a bridged master still throws.
    expect(() => getWorkMode(10)).toThrow('No work mode');
    expect(() => getWorkMode(44)).toThrow('No work mode');
    for (let n = 1; n <= 9; n++) {
      expect(WORK_MODES[n].theme, `mode ${n}`).toBe(NUMEROLOGY_MEANINGS[String(n)].theme);
    }
  });

  it('no table or output field carries the retired "expression" label', () => {
    // The rename ruling: one value, one name. `expression/name number` stays
    // §1.B's name-derived coordinate and this tier does not borrow the word.
    // meanings.v2's theme for 3 is legitimately the English word, so the scan
    // is over KEYS, not values.
    const contentSrc = readFileSync(join(REPO_ROOT, 'content', 'public.v1.js'), 'utf-8');
    expect(codeOnly(contentSrc)).not.toMatch(/EXPRESSION_MODES|expression:/);
    expect(codeOnly(publicSrc)).not.toMatch(/expression:/);
    const keys = new Set(collectStrings(buildPublicReading('2000-01-01')).map(s => s.path.split('.')[0]));
    expect([...keys]).not.toContain('expression');
  });

  it('every table is frozen — no runtime consumer can mutate the content layer', () => {
    for (const table of [
      BRANCH_ELEMENTS, SEASONAL_STATES, ELEMENT_FAVORABILITY, DOMAIN_FAMILIES,
      WORK_MODES, ROLE_POSTURES, PUBLIC_SOURCES, FAMILY_CHARACTERS,
    ]) {
      expect(Object.isFrozen(table)).toBe(true);
    }
    expect(Object.isFrozen(DOMAIN_FAMILIES.wood[0])).toBe(true);
    expect(Object.isFrozen(ELEMENT_FAVORABILITY.wood_weak.favorable)).toBe(true);
    expect(Object.isFrozen(WORK_MODES[1].priority)).toBe(true);
  });
});

describe('public tier — voice register (§2 / §4)', () => {
  const tables = {
    PUBLIC_SOURCES, SEASONAL_STATES, ELEMENT_FAVORABILITY,
    DOMAIN_FAMILIES, WORK_MODES, ROLE_POSTURES,
  };
  const strings = collectStrings(tables);

  it('scans a non-trivial number of strings (guard against an empty walk)', () => {
    expect(strings.length).toBeGreaterThan(100);
  });

  it('no banned voice-register term', () => {
    const hits = strings.flatMap(({ path, text }) =>
      voiceRegisterHits(text).map(h => `${path}: "${h.term}" in "${h.containing}"`));
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('no second-person address', () => {
    const hits = strings.filter(({ text }) => SECOND_PERSON_RE.test(text));
    expect(hits.map(h => `${h.path}: ${h.text}`)).toEqual([]);
  });

  it('no diagnostic framing and no slur pattern', () => {
    const hits = strings.filter(({ text }) =>
      DIAGNOSTIC_FRAMING_RE.test(text) || BANNED_PATTERNS.some(re => re.test(text)));
    expect(hits.map(h => `${h.path}: ${h.text}`)).toEqual([]);
  });

  it('assembled output carries the same register across the sweep', () => {
    const offenders = [];
    let scanned = 0;
    for (const dob of sweepDates(59)) {
      const r = buildPublicReading(dob);
      for (const { path, text } of collectStrings(r)) {
        scanned += 1;
        const hits = voiceRegisterHits(text);
        if (hits.length) offenders.push(`${dob} ${path}: register "${hits[0].term}" in "${text}"`);
        if (SECOND_PERSON_RE.test(text)) offenders.push(`${dob} ${path}: second person in "${text}"`);
        if (DIAGNOSTIC_FRAMING_RE.test(text)) offenders.push(`${dob} ${path}: diagnostic framing in "${text}"`);
      }
    }
    // non-vacuous: the sweep really assembled readings and really read them
    expect(scanned).toBeGreaterThan(50000);
    expectNone(offenders, 'assembled strings break the register');
  });

  it('carries no imperative CTA vocabulary in the tables', () => {
    // The tier brief bans a call to action outright. These are the shapes a
    // sales voice reaches for first.
    const CTA = /\b(buy|unlock|upgrade|subscribe|sign up|get started|click|tap here|order now|shop)\b/i;
    const hits = strings.filter(({ text }) => CTA.test(text));
    expect(hits.map(h => `${h.path}: ${h.text}`)).toEqual([]);
  });
});

describe('public tier — surface isolation', () => {
  it('ui/public.js is the ONLY importer of core/public.js', () => {
    // This assertion has MOVED, not loosened. Until §1.D v0.58 it read
    // "nothing imports the engine yet" and was written to fail the moment a
    // surface appeared — which is exactly what it did when the t4 rung was
    // wired. It now pins the single seam: one DOM controller consumes the
    // engine, so a second, unreviewed wiring still fails CI.
    const consumers = [];
    for (const rel of [
      ...readdirSync(join(REPO_ROOT, 'ui')).map(f => join('ui', f)),
      ...readdirSync(join(REPO_ROOT, 'core')).filter(f => f !== 'public.js').map(f => join('core', f)),
      'index.html',
    ]) {
      const src = readFileSync(join(REPO_ROOT, rel), 'utf-8');
      if (/["'`][^"'`]*core\/public\.js|from '\.\/public\.js'/.test(src)) consumers.push(rel);
    }
    expect(consumers).toEqual([join('ui', 'public.js')]);
  });

  it('the engine still knows nothing about tiers, prices or entitlement', () => {
    // The wiring went the other way round on purpose: ui/public.js is told
    // whether the device is entitled; core/public.js never asks.
    // codeOnly again: the module's header comment names the capabilities it
    // deliberately does NOT have, and that sentence must not trip its own ban.
    const uiSrc = codeOnly(readFileSync(join(REPO_ROOT, 'ui', 'public.js'), 'utf-8'));
    expect(uiSrc).not.toMatch(/localStorage|fetch\(|gumroad/i);
    expect(uiSrc).toMatch(/entitled/);
  });

  it('the engine reads no tier, price, entitlement or storage state', () => {
    for (const forbidden of ['tier', 'paid', 'gumroad', 'price', 'credit', 'entitle']) {
      expect(publicSrc.toLowerCase().split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .some(line => line.includes(forbidden)), `core/public.js references ${forbidden}`).toBe(false);
    }
  });

  it('the shipped calculation core is untouched by this tier', () => {
    // core/public.js composes core/profile.js, core/pillars.js and
    // core/birthcard.js; it must not be imported BY them (no cycle) and must
    // not shadow their exports.
    for (const rel of ['core/profile.js', 'core/pillars.js', 'core/birthcard.js', 'core/engine.js']) {
      expect(readFileSync(join(REPO_ROOT, rel), 'utf-8')).not.toMatch(/public\.js/);
    }
  });
});
