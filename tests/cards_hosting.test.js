// 8ball / tests / cards_hosting.test.js
// Pins the /cards hosted-JPEG set to the shared IG + Threads safe shape.
//
// The IG + Threads auto-drip pipelines fetch card images by PUBLIC URL
// (https://the-eight-ball.netlify.app/cards/{code}.jpg). This asserts that
// every catalog code shipped in cards/manifest.json has a matching cards/
// file that is a valid JPEG, exactly 1080x1350 (4:5), and <= 8 MB — the shape
// that stays inside Threads' width limit and Instagram's supported portrait
// aspect ratio. It also fails on any stray cards/*.jpg not in the manifest, so
// the hosted set can't silently drift from what build_card_jpegs.py produced.
//
// EXPECTED_CODES below is the union of ALL FOUR surface queues, in queue order.
// It matched reach/ig_pipeline/queue.txt alone until 2026-07-29, when the B-7
// ruling made the four queues DISJOINT and IG stopped being a superset of
// anything — rendering from it left three surfaces without images, and a
// surface with no image stalls on the same code every slot forever (no ledger
// row is written, so the code is re-selected). It is pinned here so a manifest
// that swaps in an off-queue code —
// which would 404 when the scheduler fetches {base}/{code}.jpg — fails CI
// instead of passing on a bare count check. Update protocol: a queue change
// regenerates cards/ via scripts/build_card_jpegs.py AND updates this list in
// the same PR, visibly (the content_shape / repo_shape pin discipline).
//
// Dependency-free: JPEG dimensions and markers are read straight from the
// segment stream (DOCTRINE §5 — no new runtime or test deps).

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cardsDir = join(__dirname, '..', 'cards');

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const MAX_BYTES = 8 * 1024 * 1024;

// Queued codes hosted OFF-SITE by the vault's extra_specimens manifest: no
// local cards/{code}.jpg is rendered for them, because image_url_for() prefers
// their publicUrl. Pinned so the tracked guard covers all 298 queued codes, not
// just the 288 rendered ones — an untracked code whose URL goes stale falls back
// to a cards/ file that does not exist, and the surface then stalls on it every
// slot forever with no ledger row while CI stays green (Codex L48 P1, PR #136).
// Reachability itself is NOT asserted here: DOCTRINE §5 forbids network in tests.
const EXPECTED_EXTERNAL = Object.freeze([
  'spec_archive_no-cxx', 'spec_archive_no-viii', 'spec_extended_hierophant-1990',
  'spec_archive_no-cxl', 'spec_extended_empress-1975', 'spec_extended_lovers-2000',
  'spec_archive_no-lxvii', 'spec_extended_hanged-man-1988', 'spec_archive_no-cxv',
  'spec_extended_hanged-man-1996',
]);

// Union of all four surface queues, in queue order. See header for the protocol.
const EXPECTED_CODES = Object.freeze([
  'spec_no-v', 'spec_no-cxii', 'spec_no-xxxi', 'spec_no-cxxxii', 'spec_no-lxi',
  'spec_no-xxxii', 'spec_no-lxxxii', 'spec_no-xlv', 'ss01_aries-x-taurus', 'ss02_aries-x-gemini',
  'ss03_aries-x-cancer', 'ss04_aries-x-leo', 'ss07_aries-x-scorpio', 'ss09_aries-x-capricorn', 'ss11_aries-x-pisces',
  'ss13_taurus-x-cancer', 'ee04_metal-x-water', 'ee08_earth-x-water', 'aed02_ox-x-earth', 'aed06_snake-x-fire',
  'aed10_rooster-x-metal', 'aex02_rat-x-fire', 'aex06_ox-x-fire', 'aex10_tiger-x-earth', 'aex14_rabbit-x-earth',
  'aex18_dragon-x-fire', 'aex22_snake-x-earth', 'aex26_horse-x-earth', 'aex30_goat-x-fire', 'aex34_monkey-x-fire',
  'aex38_rooster-x-fire', 'aex42_dog-x-fire', 'aex46_pig-x-fire', 'aa15_tiger-x-dog', 'aa19_rabbit-x-rooster',
  'aa23_dragon-x-rooster', 'aa27_snake-x-pig', 'aa31_goat-x-pig', 'ss15_taurus-x-virgo', 'ss19_taurus-x-capricorn',
  'ss23_gemini-x-leo', 'ss27_gemini-x-sagittarius', 'ss31_cancer-x-leo', 'ss35_cancer-x-sagittarius', 'ss39_leo-x-virgo',
  'ss43_leo-x-capricorn', 'ss47_virgo-x-scorpio', 'ss51_virgo-x-pisces', 'ss55_libra-x-aquarius', 'ss59_scorpio-x-aquarius',
  'ss63_sagittarius-x-pisces', 'nt01_number-1-x-the-magician', 'nt05_number-5-x-the-hierophant', 'nt09_number-9-x-the-hermit', 'nn01_number-11-x-number-2',
  'tt02_the-magician-x-the-high-priestess', 'tt06_the-hierophant-x-the-lovers', 'tt10_the-hermit-x-wheel-of-fortune', 'tt14_death-x-temperance', 'tt18_the-star-x-the-moon',
  'st01_aries-x-the-emperor', 'st05_leo-x-strength', 'st09_sagittarius-x-temperance', 'spec_extended_hierophant-1965', 'spec_extended_lovers-1985',
  'spec_extended_strength-1991', 'spec_extended_moon-2003', 'spec_extended_justice-1981', 'spec_extended_chariot-1951', 'spec_extended_world-1953',
  'spec_extended_justice-1956', 'spec_extended_chariot-1959', 'spec_extended_hermit-1962', 'spec_extended_chariot-1964', 'spec_extended_chariot-1967',
  'spec_extended_empress-1969', 'spec_extended_strength-1972', 'spec_extended_chariot-1974', 'spec_extended_hanged-man-1977', 'spec_extended_hanged-man-1979',
  'spec_extended_empress-1983', 'spec_extended_strength-1986', 'spec_extended_emperor-1988', 'spec_extended_sun-1941', 'spec_extended_judgement-1942',
  'spec_extended_world-1943', 'spec_extended_fool-1944', 'spec_extended_hierophant-1945', 'spec_extended_lovers-1946', 'spec_extended_chariot-1947',
  'spec_extended_strength-1948', 'spec_extended_hermit-1949', 'spec_extended_chariot-1950', 'spec_extended_strength-1951', 'spec_extended_hermit-1952',
  'spec_extended_lovers-1953', 'spec_extended_emperor-1954', 'spec_extended_chariot-1956', 'spec_extended_strength-1957', 'spec_extended_lovers-1958',
  'spec_extended_strength-1960', 'spec_extended_hermit-1961', 'spec_extended_wheel-of-fortune-1962', 'spec_extended_emperor-1963', 'spec_extended_hierophant-1964',
  'spec_extended_hierophant-1966', 'spec_extended_lovers-1967', 'spec_extended_chariot-1968', 'spec_extended_strength-1969', 'spec_extended_hierophant-1970',
  'spec_extended_lovers-1971', 'spec_extended_lovers-1973', 'spec_extended_hermit-1974', 'spec_extended_wheel-of-fortune-1975', 'spec_extended_strength-1976',
  'spec_extended_justice-1978', 'spec_extended_hermit-1979', 'spec_extended_wheel-of-fortune-1980', 'spec_extended_chariot-1981', 'spec_extended_hierophant-1982',
  'spec_extended_strength-1984', 'spec_extended_strength-1985', 'spec_extended_hermit-1986', 'spec_extended_hermit-1988', 'spec_extended_wheel-of-fortune-1989',
  'spec_extended_emperor-1990', 'spec_extended_chariot-1992', 'spec_extended_strength-1993', 'spec_extended_hermit-1994', 'spec_extended_chariot-1995',
  'spec_extended_strength-1996', 'spec_extended_hierophant-1997', 'spec_extended_lovers-1998', 'spec_extended_emperor-1999', 'spec_extended_chariot-2001',
  'spec_extended_temperance-2002', 'spec_extended_devil-2003', 'spec_extended_tower-2004', 'spec_extended_star-2005', 'spec_extended_moon-2006',
  'spec_extended_sun-2007', 'spec_extended_judgement-2008', 'spec_extended_world-2009', 'spec_extended_death-2010', 'aa08_ox-x-horse',
  'aa10_ox-x-rooster', 'aa12_tiger-x-snake', 'aa16_tiger-x-pig', 'aa20_rabbit-x-dog', 'aa24_dragon-x-dog',
  'aa28_horse-x-goat', 'aa32_monkey-x-pig', 'ss05_aries-x-virgo', 'ss16_taurus-x-libra', 'ss20_taurus-x-aquarius',
  'ss24_gemini-x-virgo', 'ss28_gemini-x-capricorn', 'ss32_cancer-x-virgo', 'ss36_cancer-x-capricorn', 'ss40_leo-x-libra',
  'ss44_leo-x-aquarius', 'ss48_virgo-x-sagittarius', 'ss52_libra-x-scorpio', 'ss56_libra-x-pisces', 'ss60_scorpio-x-pisces',
  'ss64_capricorn-x-aquarius', 't00_the-fool', 'e1_wood', 's01_aries', 'a01_rat',
  'n01_number-1', 't01_the-magician', 'e2_fire', 's02_taurus', 'a02_ox',
  'n02_number-2', 't02_the-high-priestess', 'e3_earth', 's03_gemini', 'a03_tiger',
  'n03_number-3', 't03_the-empress', 'e4_metal', 's04_cancer', 'a04_rabbit',
  'n04_number-4', 't04_the-emperor', 'e5_water', 's05_leo', 'a05_dragon',
  'n05_number-5', 't05_the-hierophant', 's06_virgo', 'a06_snake', 'n06_number-6',
  't06_the-lovers', 's07_libra', 'a07_horse', 'n07_number-7', 't07_the-chariot',
  's08_scorpio', 'a08_goat', 'n08_number-8', 't08_strength', 's09_sagittarius',
  'a09_monkey', 'n09_number-9', 't09_the-hermit', 's10_capricorn', 'a10_rooster',
  'n11_number-11', 't10_wheel-of-fortune', 's11_aquarius', 'a11_dog', 'n22_number-22',
  't11_justice', 's12_pisces', 'a12_pig', 'n33_number-33', 't12_the-hanged-man',
  't13_death', 't14_temperance', 't15_the-devil', 't16_the-tower', 't17_the-star',
  't18_the-moon', 't19_the-sun', 't20_judgement', 't21_the-world', 'ee01_wood-x-fire',
  'ee05_water-x-wood', 'ee09_metal-x-wood', 'aed03_tiger-x-wood', 'aed07_horse-x-fire', 'aed11_dog-x-earth',
  'aex03_rat-x-earth', 'aex07_ox-x-metal', 'aex11_tiger-x-metal', 'aex15_rabbit-x-metal', 'aex19_dragon-x-metal',
  'aex23_snake-x-metal', 'aex27_horse-x-metal', 'aex31_goat-x-metal', 'aex35_monkey-x-earth', 'aex39_rooster-x-earth',
  'aex43_dog-x-metal', 'aex47_pig-x-earth', 'nt02_number-2-x-the-high-priestess', 'nt06_number-6-x-the-lovers', 'nt10_number-11-x-justice',
  'nn02_number-22-x-number-4', 'tt03_the-high-priestess-x-the-empress', 'tt07_the-lovers-x-the-chariot', 'tt11_wheel-of-fortune-x-justice', 'tt15_temperance-x-the-devil',
  'tt19_the-moon-x-the-sun', 'st02_taurus-x-the-hierophant', 'st06_virgo-x-the-hermit', 'st10_capricorn-x-the-devil', 'spec_extended_hanged-man-1993',
  'spec_extended_hierophant-1999', 'spec_extended_strength-1987', 'spec_extended_emperor-1968', 'spec_extended_hermit-1997', 'spec_extended_fool-1951',
  'spec_extended_justice-1954', 'spec_extended_hierophant-1957', 'spec_extended_justice-1960', 'spec_extended_strength-1962', 'spec_extended_lovers-1965',
  'spec_extended_empress-1967', 'spec_extended_strength-1970', 'spec_extended_chariot-1972', 'spec_extended_emperor-1975', 'spec_extended_hermit-1978',
  'spec_extended_chariot-1980', 'spec_extended_chariot-1984', 'spec_extended_justice-1987', 'spec_extended_hanged-man-1989', 'spec_extended_chariot-1941',
  'spec_extended_strength-1942', 'spec_extended_hermit-1943', 'spec_extended_wheel-of-fortune-1944', 'spec_extended_justice-1945', 'spec_extended_empress-1946',
  'spec_extended_emperor-1947', 'spec_extended_hierophant-1948', 'spec_extended_lovers-1949', 'spec_extended_empress-1950', 'spec_extended_emperor-1951',
  'spec_extended_hierophant-1952', 'spec_extended_empress-1953', 'spec_extended_lovers-1955', 'spec_extended_emperor-1956', 'spec_extended_wheel-of-fortune-1957',
  'spec_extended_wheel-of-fortune-1959', 'spec_extended_emperor-1960', 'spec_extended_hierophant-1961', 'spec_extended_lovers-1962', 'spec_extended_lovers-1964',
  'spec_extended_chariot-1965', 'spec_extended_wheel-of-fortune-1966', 'spec_extended_justice-1967', 'spec_extended_hanged-man-1968', 'spec_extended_wheel-of-fortune-1969',
  'spec_extended_justice-1970', 'spec_extended_hierophant-1972', 'spec_extended_strength-1973', 'spec_extended_lovers-1974', 'spec_extended_chariot-1975',
  'spec_extended_wheel-of-fortune-1977', 'spec_extended_strength-1978', 'spec_extended_hierophant-1979', 'spec_extended_lovers-1980', 'spec_extended_emperor-1981',
  'spec_extended_chariot-1983', 'spec_extended_hierophant-1984', 'spec_extended_wheel-of-fortune-1986', 'spec_extended_emperor-1987', 'spec_extended_hierophant-1988',
  'spec_extended_lovers-1989', 'spec_extended_lovers-1991', 'spec_extended_emperor-1992', 'spec_extended_hierophant-1993', 'spec_extended_justice-1994',
  'spec_extended_hanged-man-1995', 'spec_extended_emperor-1996', 'spec_extended_justice-1997', 'spec_extended_hanged-man-1998', 'spec_extended_hanged-man-2000',
  'spec_extended_death-2001', 'spec_extended_sun-2002', 'spec_extended_judgement-2003', 'spec_extended_world-2004', 'spec_extended_fool-2005',
  'spec_extended_hierophant-2006', 'spec_extended_lovers-2007', 'spec_extended_chariot-2008', 'spec_extended_strength-2009', 'spec_extended_moon-2010',
  'aa01_rat-x-ox', 'aa02_rat-x-rabbit', 'aa03_rat-x-dragon', 'aa04_rat-x-horse', 'aa05_rat-x-goat',
  'aa06_rat-x-monkey', 'ss06_aries-x-libra', 'ss08_aries-x-sagittarius', 'ss10_aries-x-aquarius', 'ss12_taurus-x-gemini',
  'ee02_fire-x-earth', 'ee06_wood-x-earth', 'ee10_water-x-fire', 'aed04_rabbit-x-wood', 'aed08_goat-x-earth',
  'aed12_pig-x-water', 'aex04_rat-x-metal', 'aex08_ox-x-water', 'aex12_tiger-x-water', 'aex16_rabbit-x-water',
  'aex20_dragon-x-water', 'aex24_snake-x-water', 'aex28_horse-x-water', 'aex32_goat-x-water', 'aex36_monkey-x-water',
  'aex40_rooster-x-water', 'aex44_dog-x-water', 'aex48_pig-x-metal', 'aa17_rabbit-x-dragon', 'aa21_rabbit-x-pig',
  'aa25_snake-x-monkey', 'aa29_horse-x-dog', 'aa33_rooster-x-dog', 'ss17_taurus-x-scorpio', 'ss21_taurus-x-pisces',
  'ss25_gemini-x-libra', 'ss29_gemini-x-aquarius', 'ss33_cancer-x-libra', 'ss37_cancer-x-aquarius', 'ss41_leo-x-scorpio',
  'ss45_leo-x-pisces', 'ss49_virgo-x-capricorn', 'ss53_libra-x-sagittarius', 'ss57_scorpio-x-sagittarius', 'ss61_sagittarius-x-capricorn',
  'ss65_capricorn-x-pisces', 'nt03_number-3-x-the-empress', 'nt07_number-7-x-the-chariot', 'nt11_number-22-x-the-fool', 'nn03_number-33-x-number-6',
  'tt04_the-empress-x-the-emperor', 'tt08_the-chariot-x-strength', 'tt12_justice-x-the-hanged-man', 'tt16_the-devil-x-the-tower', 'tt20_the-sun-x-judgement',
  'st03_gemini-x-the-lovers', 'st07_libra-x-justice', 'st11_aquarius-x-the-star', 'spec_extended_emperor-1978', 'spec_extended_devil-2001',
  'spec_extended_justice-1958', 'spec_extended_empress-1962', 'spec_extended_lovers-1994', 'spec_extended_sun-1950', 'spec_extended_justice-1952',
  'spec_extended_hierophant-1955', 'spec_extended_lovers-1957', 'spec_extended_chariot-1960', 'spec_extended_chariot-1963', 'spec_extended_empress-1965',
  'spec_extended_strength-1968', 'spec_extended_hierophant-1971', 'spec_extended_empress-1973', 'spec_extended_hermit-1976', 'spec_extended_chariot-1978',
  'spec_extended_empress-1981', 'spec_extended_wheel-of-fortune-1985', 'spec_extended_hanged-man-1987', 'spec_extended_empress-1941', 'spec_extended_emperor-1942',
  'spec_extended_hierophant-1943', 'spec_extended_lovers-1944', 'spec_extended_chariot-1945', 'spec_extended_strength-1946', 'spec_extended_hermit-1947',
  'spec_extended_wheel-of-fortune-1948', 'spec_extended_justice-1949', 'spec_extended_hermit-1950', 'spec_extended_wheel-of-fortune-1951', 'spec_extended_fool-1953',
  'spec_extended_hierophant-1954', 'spec_extended_empress-1955', 'spec_extended_hermit-1956', 'spec_extended_chariot-1957', 'spec_extended_hanged-man-1959',
  'spec_extended_wheel-of-fortune-1960', 'spec_extended_justice-1961', 'spec_extended_hierophant-1963', 'spec_extended_empress-1964', 'spec_extended_emperor-1965',
  'spec_extended_chariot-1966', 'spec_extended_strength-1967', 'spec_extended_hermit-1968', 'spec_extended_world-1970', 'spec_extended_fool-1971',
  'spec_extended_justice-1972', 'spec_extended_hierophant-1973', 'spec_extended_strength-1975', 'spec_extended_lovers-1976', 'spec_extended_chariot-1977',
  'spec_extended_wheel-of-fortune-1978', 'spec_extended_justice-1979', 'spec_extended_empress-1980', 'spec_extended_lovers-1982', 'spec_extended_hermit-1983',
  'spec_extended_wheel-of-fortune-1984', 'spec_extended_chariot-1986', 'spec_extended_wheel-of-fortune-1987', 'spec_extended_justice-1988', 'spec_extended_justice-1990',
  'spec_extended_empress-1991', 'spec_extended_hermit-1992', 'spec_extended_wheel-of-fortune-1993', 'spec_extended_strength-1994', 'spec_extended_hermit-1995',
  'spec_extended_wheel-of-fortune-1996', 'spec_extended_emperor-1998', 'spec_extended_justice-1999', 'spec_extended_star-2000', 'spec_extended_moon-2001',
  'spec_extended_tower-2002', 'spec_extended_star-2003', 'spec_extended_moon-2004', 'spec_extended_sun-2005', 'spec_extended_judgement-2006',
  'spec_extended_world-2007', 'spec_extended_fool-2008', 'spec_extended_hierophant-2009', 'spec_extended_devil-2010', 'ee03_earth-x-metal',
  'ee07_fire-x-metal', 'aed01_rat-x-water', 'aed05_dragon-x-earth', 'aed09_monkey-x-metal', 'aex01_rat-x-wood',
  'aex05_ox-x-wood', 'aex09_tiger-x-fire', 'aex13_rabbit-x-fire', 'aex17_dragon-x-wood', 'aex21_snake-x-wood',
  'aex25_horse-x-wood', 'aex29_goat-x-wood', 'aex33_monkey-x-wood', 'aex37_rooster-x-wood', 'aex41_dog-x-wood',
  'aex45_pig-x-wood', 'aa07_ox-x-snake', 'aa09_ox-x-goat', 'aa11_ox-x-dog', 'aa13_tiger-x-horse',
  'aa14_tiger-x-monkey', 'aa18_rabbit-x-goat', 'aa22_dragon-x-monkey', 'aa26_snake-x-rooster', 'aa30_goat-x-dog',
  'ss14_taurus-x-leo', 'ss18_taurus-x-sagittarius', 'ss22_gemini-x-cancer', 'ss26_gemini-x-scorpio', 'ss30_gemini-x-pisces',
  'ss34_cancer-x-scorpio', 'ss38_cancer-x-pisces', 'ss42_leo-x-sagittarius', 'ss46_virgo-x-libra', 'ss50_virgo-x-aquarius',
  'ss54_libra-x-capricorn', 'ss58_scorpio-x-capricorn', 'ss62_sagittarius-x-aquarius', 'ss66_aquarius-x-pisces', 'nt04_number-4-x-the-emperor',
  'nt08_number-8-x-strength', 'nt12_number-33-x-the-lovers', 'tt01_the-fool-x-the-magician', 'tt05_the-emperor-x-the-hierophant', 'tt09_strength-x-the-hermit',
  'tt13_the-hanged-man-x-death', 'tt17_the-tower-x-the-star', 'tt21_judgement-x-the-world', 'st04_cancer-x-the-chariot', 'st08_scorpio-x-death',
  'st12_pisces-x-the-moon', 'spec_extended_strength-1982', 'spec_extended_chariot-1970', 'spec_extended_chariot-1973', 'spec_extended_wheel-of-fortune-1976',
  'spec_extended_hermit-1959', 'spec_extended_justice-1950', 'spec_extended_chariot-1953', 'spec_extended_fool-1955', 'spec_extended_strength-1958',
  'spec_extended_lovers-1961', 'spec_extended_wheel-of-fortune-1964', 'spec_extended_strength-1966', 'spec_extended_emperor-1969', 'spec_extended_empress-1971',
  'spec_extended_strength-1974', 'spec_extended_chariot-1976', 'spec_extended_emperor-1979', 'spec_extended_emperor-1983', 'spec_extended_justice-1985',
  'spec_extended_chariot-1988', 'spec_extended_hermit-1941', 'spec_extended_wheel-of-fortune-1942', 'spec_extended_justice-1943', 'spec_extended_empress-1944',
  'spec_extended_emperor-1945', 'spec_extended_hierophant-1946', 'spec_extended_lovers-1947', 'spec_extended_chariot-1948', 'spec_extended_strength-1949',
  'spec_extended_judgement-1951', 'spec_extended_world-1952', 'spec_extended_wheel-of-fortune-1953', 'spec_extended_chariot-1954', 'spec_extended_strength-1955',
  'spec_extended_lovers-1956', 'spec_extended_hermit-1958', 'spec_extended_judgement-1960', 'spec_extended_world-1961', 'spec_extended_fool-1962',
  'spec_extended_justice-1963', 'spec_extended_strength-1964', 'spec_extended_hermit-1965', 'spec_extended_hermit-1967', 'spec_extended_wheel-of-fortune-1968',
  'spec_extended_justice-1969', 'spec_extended_hermit-1970', 'spec_extended_wheel-of-fortune-1971', 'spec_extended_emperor-1972', 'spec_extended_emperor-1974',
  'spec_extended_hierophant-1975', 'spec_extended_justice-1976', 'spec_extended_hermit-1977', 'spec_extended_empress-1979', 'spec_extended_fool-1980',
  'spec_extended_hierophant-1981', 'spec_extended_empress-1982', 'spec_extended_lovers-1983', 'spec_extended_hermit-1985', 'spec_extended_hanged-man-1986',
  'spec_extended_empress-1988', 'spec_extended_emperor-1989', 'spec_extended_chariot-1990', 'spec_extended_hierophant-1991', 'spec_extended_lovers-1992',
  'spec_extended_chariot-1993', 'spec_extended_wheel-of-fortune-1995', 'spec_extended_justice-1996', 'spec_extended_empress-1997', 'spec_extended_wheel-of-fortune-1998',
  'spec_extended_chariot-1999', 'spec_extended_temperance-2000', 'spec_extended_strength-2002', 'spec_extended_hermit-2003', 'spec_extended_wheel-of-fortune-2004',
  'spec_extended_justice-2005', 'spec_extended_hanged-man-2006', 'spec_extended_death-2007', 'spec_extended_temperance-2008', 'spec_extended_devil-2009',
  'spec_extended_chariot-2010',
]);

const manifest = JSON.parse(
  readFileSync(join(cardsDir, 'manifest.json'), 'utf-8'),
);

// Parse a JPEG buffer's segment stream. Returns { width, height } from the
// first Start-Of-Frame, plus structural facts used to reject files that carry
// a plausible SOF header but are not a complete, metadata-free JPEG:
//   - hasSOS: a Start-Of-Scan (0xFFDA) segment is present
//   - endsWithEOI: the stream terminates with End-Of-Image (0xFFD9)
//   - appMarkers: the set of APPn markers seen (0xE0..0xEF) + COM (0xFE)
// Returns null if the byte stream is not a walkable JPEG.
function parseJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null; // SOI
  let off = 2;
  let dim = null;
  let hasSOS = false;
  const appMarkers = new Set();
  while (off + 1 < buf.length) {
    if (buf[off] !== 0xff) return null;
    let marker = buf[off + 1];
    // Skip fill bytes.
    while (marker === 0xff && off + 1 < buf.length) {
      off += 1;
      marker = buf[off + 1];
    }
    if (marker === 0xda) {
      hasSOS = true; // SOS — entropy-coded scan data follows; stop segment walk.
      break;
    }
    if (off + 3 >= buf.length) return null;
    const len = buf.readUInt16BE(off + 2);
    if (len < 2 || off + 2 + len > buf.length) return null;
    if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
      appMarkers.add(marker);
    }
    const isSOF =
      marker >= 0xc0 && marker <= 0xcf &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc; // not DHT/JPG/DAC
    if (isSOF && dim === null) {
      dim = { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
    }
    off += 2 + len;
  }
  const endsWithEOI = buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9;
  return { dim, hasSOS, endsWithEOI, appMarkers };
}

describe('cards hosting — shared IG + Threads safe shape', () => {
  it('manifest is exactly the union of all four surface queues, in order', () => {
    const codes = manifest.cards.map((c) => c.code);
    expect(manifest.count).toBe(codes.length);
    expect(codes).toEqual([...EXPECTED_CODES]); // ordered, exact — no off-queue swaps
    expect(new Set(codes).size).toBe(611);
  });

  it('manifest tracks every queued code — rendered locally or hosted off-site', () => {
    const external = manifest.external ?? [];
    expect(external.map((e) => e.code)).toEqual([...EXPECTED_EXTERNAL]);
    expect(manifest.external_count).toBe(external.length);
    for (const { code, url } of external) {
      // A malformed/absent URL makes image_url_for() fall back to
      // cards/{code}.jpg, which is deliberately not rendered for these.
      expect(typeof url, `${code}: url must be a string`).toBe('string');
      expect(url.startsWith('https://'), `${code}: url must be https`).toBe(true);
      expect(existsSync(join(cardsDir, `${code}.jpg`)), `${code}: must NOT be rendered locally`).toBe(false);
    }
    const covered = new Set([...manifest.cards.map((c) => c.code), ...external.map((e) => e.code)]);
    expect(covered.size).toBe(EXPECTED_CODES.length + EXPECTED_EXTERNAL.length);
  });

  it('every manifest code is a complete, metadata-free 1080x1350 JPEG <= 8 MB', () => {
    const bad = [];
    for (const { code, bytes } of manifest.cards) {
      const file = join(cardsDir, `${code}.jpg`);
      let buf;
      try {
        buf = readFileSync(file);
      } catch {
        bad.push(`${code}: missing file`);
        continue;
      }
      // Byte-parity with the manifest the build recorded (catches any
      // post-build tamper / re-save that the dimension check would miss).
      const onDisk = statSync(file).size;
      if (onDisk !== bytes) bad.push(`${code}: ${onDisk} bytes != manifest ${bytes}`);
      if (buf.length > MAX_BYTES) bad.push(`${code}: ${buf.length} bytes > 8 MB`);

      const j = parseJpeg(buf);
      if (!j || !j.dim) {
        bad.push(`${code}: not a parseable JPEG`);
        continue;
      }
      if (!j.hasSOS || !j.endsWithEOI) {
        bad.push(`${code}: truncated/incomplete JPEG (SOS=${j.hasSOS} EOI=${j.endsWithEOI})`);
      }
      if (j.dim.width !== CANVAS_W || j.dim.height !== CANVAS_H) {
        bad.push(`${code}: ${j.dim.width}x${j.dim.height} != ${CANVAS_W}x${CANVAS_H}`);
      }
      // Reproducible bytes require stripped metadata: reject EXIF (APP1),
      // ICC (APP2), and comment (COM) markers. APP0 (JFIF, 0xE0) is expected.
      for (const m of [0xe1, 0xe2, 0xfe]) {
        if (j.appMarkers.has(m)) {
          bad.push(`${code}: carries metadata marker 0x${m.toString(16)} (EXIF/ICC/COM not stripped)`);
        }
      }
    }
    expect(bad, `non-conforming cards:\n${bad.join('\n')}`).toEqual([]);
  });

  it('no stray cards/*.jpg outside the manifest', () => {
    const onDisk = readdirSync(cardsDir)
      .filter((f) => f.endsWith('.jpg'))
      .sort();
    const claimed = manifest.cards.map((c) => `${c.code}.jpg`).sort();
    expect(onDisk).toEqual(claimed);
  });
});
