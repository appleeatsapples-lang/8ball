#!/usr/bin/env node
// Standalone comparator: checks core/calendar.js's monthAnimalSolarTerm() and
// lunarNewYearDate() against a pre-extracted HKO fixture (see
// scripts/extract_hko_fixture.py and audits/fixtures/hko_calendar_authority_1901_2100.json).
//
// No hardcoded absolute paths — both inputs come from the environment so
// this script can run against any calendar.js / fixture pair.
//
// Usage:
//   CALENDAR_PATH=/path/to/core/calendar.js \
//   FIXTURE_PATH=/path/to/audits/fixtures/hko_calendar_authority_1901_2100.json \
//   node audits/hko_compare.mjs
//
// Always exits 0 — this is a data producer, not a pass/fail gate. The caller
// reads the emitted JSON (comparedYears/solarMismatchCount/lunarMismatchCount/
// etc.) to decide pass/fail.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const calendarPath = process.env.CALENDAR_PATH;
const fixturePath = process.env.FIXTURE_PATH;

if (!calendarPath) {
  console.error('CALENDAR_PATH environment variable is required (path to core/calendar.js).');
  process.exit(1);
}
if (!fixturePath) {
  console.error('FIXTURE_PATH environment variable is required (path to the HKO fixture JSON).');
  process.exit(1);
}

const { monthAnimalSolarTerm, lunarNewYearDate } =
  await import(pathToFileURL(calendarPath).href);

// The canonical 12 month-starting (jié) terms, in HKO's own English wording
// and in the order core/calendar.js indexes them: index 0 starts the tiger
// month, index 11 the ox month.
//
// Pinned HERE rather than read from the fixture. Until 2026-07-30 this file
// took the order from `fixture.source.term_order` AND looked every expected
// value up by those same fixture-supplied names — so the comparator was
// checking the fixture against itself. Codex's pre-merge audit (finding L)
// rotated source.term_order, relabelled every year's term values by the same
// rotation, and regenerated the content digest: 2,400 comparisons, zero
// mismatches, PASS, with all 200 source hashes untouched. A complete false
// green. Indexing by this constant instead means a rotated fixture produces
// 2,400 mismatches, which is what it is.
const CANONICAL_TERM_ORDER = [
  'Spring Commences', 'Insects Waken', 'Bright & Clear', 'Summer Commences',
  'Corn on Ear', 'Moderate Heat', 'Autumn Commences', 'White Dew',
  'Cold Dew', 'Winter Commences', 'Heavy Snow', 'Moderate Cold',
];
// The Gregorian month each term starts, by index — the invariant that
// survives any renaming, since no relabelling of the fixture can move
// "Spring Commences" off February. Indices 0..10 run February through
// December; index 11 is January of the same Gregorian year (the ox month,
// which precedes the next year's lichun).
const CANONICAL_TERM_START_MONTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1];

const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const declaredTermOrder = fixture.source?.term_order;
const termOrderCanonical =
  Array.isArray(declaredTermOrder)
  && declaredTermOrder.length === CANONICAL_TERM_ORDER.length
  && declaredTermOrder.every((t, i) => t === CANONICAL_TERM_ORDER[i]);
const years = fixture.years;

const solarMismatches = [];
const lunarMismatches = [];
const incomplete = [];
// Structural defects that are NOT date disagreements: a year whose term keys
// are not the canonical set, or whose term index does not start the month it
// must. Reported separately so a relabelled fixture is diagnosed as a forged
// authority record rather than as 2,400 ordinary calendar mismatches.
const semanticViolations = [];

let comparedYears = 0;
let solarComparisons = 0;
let lunarComparisonCount = 0;

const allYearKeys = Object.keys(years).map(Number).sort((a, b) => a - b);

for (const year of allYearKeys) {
  const entry = years[String(year)];
  if (!entry || !entry.complete) {
    incomplete.push(year);
    continue;
  }

  comparedYears += 1;

  const termKeys = Object.keys(entry.terms ?? {});
  if (termKeys.length !== CANONICAL_TERM_ORDER.length
      || !CANONICAL_TERM_ORDER.every((t) => Object.hasOwn(entry.terms ?? {}, t))) {
    semanticViolations.push({
      year,
      problem: 'term keys are not the canonical 12 month-starting terms',
      keys: termKeys,
    });
  }

  for (let index = 0; index < CANONICAL_TERM_ORDER.length; index += 1) {
    const term = CANONICAL_TERM_ORDER[index];
    const expected = entry.terms?.[term];
    if (Array.isArray(expected) && expected[0] !== CANONICAL_TERM_START_MONTHS[index]) {
      semanticViolations.push({
        year,
        term,
        index,
        problem: `starts in month ${expected[0]}, expected ${CANONICAL_TERM_START_MONTHS[index]}`,
      });
    }
    const actual = monthAnimalSolarTerm(year, index);
    solarComparisons += 1;
    if (!expected || actual[0] !== expected[0] || actual[1] !== expected[1]) {
      solarMismatches.push({ year, term, index, expected: expected ?? null, actual });
    }
  }

  const expectedLny = entry.lunar_new_year;
  const actualLny = lunarNewYearDate(year);
  lunarComparisonCount += 1;
  if (!expectedLny || actualLny[0] !== expectedLny[0] || actualLny[1] !== expectedLny[1]) {
    lunarMismatches.push({ year, expected: expectedLny ?? null, actual: actualLny });
  }
}

// Include any years the fixture itself flagged as incomplete but that may
// not have an entry under `years` at all (e.g. source file was absent).
for (const year of fixture.incomplete_years ?? []) {
  if (!incomplete.includes(year)) incomplete.push(year);
}
incomplete.sort((a, b) => a - b);

// Detail arrays are capped so a systematic regression (every one of the 2400
// boundaries wrong) still emits a payload the caller can parse. Counts stay
// exact and unbounded; only the per-mismatch detail is sampled.
const SAMPLE_LIMIT = 50;

// No process.exit() here: stdout to a pipe is async, and exiting explicitly
// drops the unflushed tail — which truncated large payloads mid-JSON and made
// a real calendar regression look like a comparator tooling failure. Falling
// off the end of the script lets node flush and exit 0 on its own.
console.log(JSON.stringify({
  comparedYears,
  incomplete,
  termOrderCanonical,
  declaredTermOrder: declaredTermOrder ?? null,
  semanticViolationCount: semanticViolations.length,
  semanticViolations: semanticViolations.slice(0, SAMPLE_LIMIT),
  semanticViolationsTruncated: semanticViolations.length > SAMPLE_LIMIT,
  solarComparisons,
  solarMismatchCount: solarMismatches.length,
  solarMismatches: solarMismatches.slice(0, SAMPLE_LIMIT),
  solarMismatchesTruncated: solarMismatches.length > SAMPLE_LIMIT,
  lunarComparisonCount,
  lunarMismatchCount: lunarMismatches.length,
  lunarMismatches: lunarMismatches.slice(0, SAMPLE_LIMIT),
  lunarMismatchesTruncated: lunarMismatches.length > SAMPLE_LIMIT,
}, null, 2));
