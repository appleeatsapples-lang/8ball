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

const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const termOrder = fixture.source.term_order;
const years = fixture.years;

const solarMismatches = [];
const lunarMismatches = [];
const incomplete = [];

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

  for (let index = 0; index < termOrder.length; index += 1) {
    const term = termOrder[index];
    const expected = entry.terms[term];
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
  solarComparisons,
  solarMismatchCount: solarMismatches.length,
  solarMismatches: solarMismatches.slice(0, SAMPLE_LIMIT),
  solarMismatchesTruncated: solarMismatches.length > SAMPLE_LIMIT,
  lunarComparisonCount,
  lunarMismatchCount: lunarMismatches.length,
  lunarMismatches: lunarMismatches.slice(0, SAMPLE_LIMIT),
  lunarMismatchesTruncated: lunarMismatches.length > SAMPLE_LIMIT,
}, null, 2));
