# PR #246 pre-merge cross-model audit — reconciled response

**PR:** 8ball #246 — calc v5: the canonical name fold — NFC/NFD spellings of one name reduce alike (DOCTRINE v0.82)
**Base → head:** `d554616` (#245) → `e9f15cf` (calc) + `8734de1` (journal) at audit start; both lanes' fixes land in `a66d077` and in the commit carrying this artifact.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review, run from the local Mac. The `relay` script's codex adapter still lacks `-o/--output-last-message`, so both lanes were driven directly with the same 185,973-character corpus (`~/ai-relay/runs/20260906-122302-8ball-namefold-direct/context.md`): the complete diff, the full post-change `core/profile.js`, `tests/profile.test.js`, `tests/fixtures.json`, every reader of the profile name (`ui/profile.js`, `isNewPair`, `compactReadingProfile`, the index.html submit and archive-open paths, a grep of `ui/share.js` / `ui/dyad.js` / `ui/public.js` / `ui/meanings.js`), DOCTRINE §3 and the footer post-change, and the journal entry. Lanes were told the corpus was complete and not to open or echo repository files. Neither lane wrote a fix. Codex (`gpt-5.5`; the default `gpt-6-astra` refused this CLI version) returned in under two minutes; grok in about five. A third, fully independent review by the controller's Codex desktop session (`~/Documents/Codex/2026-09-06/as/outputs/8ball-independent-review-2026-09-06.md`) is cited where it adds evidence; it was not a lane of this run.

## Lane verdicts

| Lane | Verdict | Findings | Mutants proposed |
|---|---|---|---|
| Codex | MERGE WITH FIXES | 1 P2, 3 P3 | 5 |
| Grok | MERGE WITH FIXES | 1 P1, 2 P2, 2 P3 | 5 |
| Controller's independent review (Codex desktop) | "passed my checks" | 0 new code defects | — (1,000-profile ASCII differential, 63,488-code-point partition sweep, 12,118 NFC/NFD pairs) |

**Reconciled outcome: MERGE WITH FIXES — every finding landed and every proposed mutant was planted and killed.** Neither lane found a P0 or a product-behaviour defect; both found the same two record/test-hardness gaps independently (the break-count and the unpinned `Ł` / `Ø` / `ß`), which is the agreement that makes those findings load-bearing. The fold itself, the null-not-zero limit, the ASCII invariance, the date-coordinate independence, the fixture literals' NFC form, the L17 footer rotation and the §3 bullet were confirmed by both lanes as matching the diff.

## Findings and dispositions

| # | Lane | Sev | Finding | Disposition |
|---|---|---|---|---|
| 1 | Grok | P1 | Journal's "fail nine times (three fixtures, six in the block)" split was false: five fixtures and four block tests fail on main | **Fixed** (`a66d077`): recounted from a live run — before the codex absorb 9 = 5 + 4, after it 10 = 5 + 5; the journal records both the corrected count and that the first split was wrong. Grok's per-fixture table (José 8→4, Zoë 5→1, Renée 4→9, Ångström 1→8, Đặng Thị 22→5; Ana Sofía, İrem, Đ coincide) matches the run |
| 2 | Codex | P2 | A fold that maps a wrong letter with a COLLIDING value (ë → n keeps "Zoë" at 1) passes every assertion | **Confirmed by planting it** — the mutant survived the original block. **Fixed** (`a66d077`): `nameLetters()` is pinned to its exact output for 14 inputs in both compositions |
| 3 | Grok | P2 | Fixtures `Ana Sofía` → 3 and `İrem` → 9 coincide with the raw calc v4 reducer, so they do not carry the fold | **Fixed** (this commit): every accented fixture also pins `nameNumberSum` / `soulUrgeSum` / `personalitySum`, values produced by executing the module (the first hand-typed draft of three of them was wrong and failed the suite — recorded here as the reason the rule "execute, never type" exists), and the consumer reads them |
| 4 | Codex / Grok | P3 / P2 | `Ł`, `Ø`, `ß` named as the limit in doctrine but only `Đ` pinned | **Fixed** (`a66d077` + this commit): all four in the unresolved loop; plus `Łukasz → ukasz`, `Øystein → ystein`, `Straße → strae` pin that the limit is per letter, not per name |
| 5 | Codex | P3 | "NFC literals only" stated in the fixture file, not enforced — a stored NFD literal passes the runtime test | **Confirmed by planting it** (an NFD "José" literal survived). **Fixed** (`a66d077`): a test proves every non-ASCII `name_number` literal equals its own NFC form |
| 6 | Grok | P3 | "Unaffected" framing too narrow: `profile.name` / `firstName` DO become NFC, so the sheet title and dyad heads render the canonical string for an NFD entry | **Fixed** (this commit): DOCTRINE §3 bullet and the journal state it as a display change; a test pins `buildProfile('José Martí').firstName === 'José'`. `isNewPair` (typed vs stored raw) and the readings archive (stores inputs) confirmed unaffected by both lanes |
| 7 | Grok | P3 | `expect(a.name.normalize('NFC')).toBe(a.name)` is vacuous alone; `'123'` in the partition loop is `0+0===0` | **Accepted as stated**: the load-bearing half (`b.name === a.name` across the NFD twin) is kept beside it; `'123'` stays as the digits case in a loop of real names — no change |
| 8 | Both | — | Combining ranges beyond U+0300–U+036F: not used by canonical Latin decompositions; the final `[^a-z]` drops them anyway | No change; both lanes agree it is not a Latin-name defect |

## Mutants planted (all ten, both lanes) — each killed, by name

| Mutant | Killed by |
|---|---|
| G1 drop NFD, strip marks only | exact letter sequence · diacritic contributes its base letter · fold-only letters resolved |
| G2 `nameLetters` always `''` | masters on all six coordinates (pre-existing) · absent letter class unresolved · exact letter sequence |
| G3 classify vowels on raw code points | diacritic base letter · vowel/consonant classified AFTER fold · partition |
| G4 `cleanName` without NFC | NFC/NFD one set of coordinates · exact letter sequence (the `firstName` pin) |
| G5 unsupported-only name → invented value | absent letter class unresolved · partition · no-supported-letter unresolved |
| C1 ë → n after NFD | exact letter sequence · fixture "Zoë" (via `nameNumberSum`) |
| C2 í → r | exact letter sequence · fixture "Ana Sofía" (via `nameNumberSum`) |
| C3 ỗ → x | exact letter sequence |
| C4 ß → ss, Ł → l, Ø → o compatibility | exact letter sequence · no-supported-letter unresolved |
| C5 an NFD fixture literal | every non-ASCII fixture is NFC |

Before the absorbs, C1 and C5 SURVIVED the original test block — the two lanes' P2/P3 were real, not hypothetical.

## Verification at the head carrying this artifact (local Mac, live runs)

- `npx vitest run` — **62 files / 2209 tests** green (main: 62 / 2192)
- `npx vitest run tests/profile.test.js` against `origin/main`'s `core/profile.js` — **10 failed / 183 passed**, then green with the fold restored
- `python3 -m unittest audits.test_project_audit` — OK; `python3 audits/project_audit.py` — PASS, 0 blocking (the single advisory WARN was the not-yet-committed tree)
- `bash audits/run_local_audit.sh` — clean, 910 files (pattern file copied in from the main checkout and deleted after)
- `index.html` untouched, 697 lines; no `ui/`, `content/`, key, pricing or entitlement change
- Controller's independent review, same calc commit: 62 / 2207 (before the absorbs), product audit 13/0/0/1, three names pinned to hand-calculated sums, 1,000 deterministic ASCII profiles byte-identical to the unchanged code, partition held across 63,488 BMP code points, 12,118 NFC/NFD pairs agreed (489 with supported letters)

The relay's claude lane was not run; the reconciliation is this document, written by the implementing seat, and the live-green pre-condition it would have carried is satisfied by the recorded runs above.

## What this audit does not claim

Supplementary-plane characters were not swept. Transliteration is out of scope by design (Arabic, CJK and the four glyph-mark letters resolve UNRESOLVED). Nothing here touches the storefront defect found the same day (Buy Link 404; the only listing at another slug, another price, not for sale) — that is a separate, Gumroad-side action and is not gated by this PR.

**This artifact claims no merge authority — the merge word stays with the controller per §10/L48.**
