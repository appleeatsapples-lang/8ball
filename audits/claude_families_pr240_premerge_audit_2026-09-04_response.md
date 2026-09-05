# PR #240 four-family cross-model audit — reconciled response

**PR:** 8ball #240 — public.test.js sweep cost retired: the last 2-second test
**Head audited:** `9f20d52` (the two-lane reconciliation) against base `8a5080e`.
**Process:** on the controller's order ("claude families should perform an
audit"), one fresh lane per Claude family — Fable, Opus, Sonnet, Haiku — each in
its own clone of both base and head, each briefed to audit the two-lane
RECONCILIATION rather than the original change, and told to assume it carried
the same shape of blind spot its first draft did. No lane saw another's report.
Every finding lands in the reconciliation commit carrying this artifact; no
mid-audit push. The first artifact,
`audits/claude_relay_pr240_premerge_audit_2026-09-04_response.md`, stands as
the record of the two-lane pass and is not edited.

## Lane verdicts

| Lane | Verdict | Findings | Mutants |
|---|---|---|---|
| Fable | MERGE WITH FIXES | 1 HIGH, 2 MED, 4 LOW | 31 runs, 21 distinct; 7 prior kills reproduced |
| Opus | MERGE WITH FIXES | 2 HIGH, 4 MED, 4 LOW | 24 run; 7 prior kills reproduced |
| Sonnet | MERGE WITH FIXES | 1 HIGH, 1 MED, 1 LOW | 16 run; 7 prior kills reproduced |
| Haiku | MERGE | none | the 7 prior kills reproduced; none of its own |

**Reconciled outcome: MERGE WITH FIXES. Three of four families independently
found a second live detection regression of exactly the class the two-lane
reconciliation had just corrected — on the matcher pair that reconciliation's
artifact had explicitly waved through. All fixes landed. Merge remains the
controller's word per §10/L48.**

## HIGH-1 (Fable, Sonnet, Opus — independently) — the range check lost its type assertion

Vitest's `toBeGreaterThanOrEqual` / `toBeLessThanOrEqual` call `assertTypes(actual,
['number','bigint'])` before comparing (all three lanes read the matcher
source). The rewrite `if (!(r.posture.number >= 0 && r.posture.number <= 21))`
is a bare JS comparison, and JS coerces. Each lane planted on a date reachable
only by the stride-37 sweep:

| plant on `posture.number` | base | head (`9f20d52`) | found by |
|---|---|---|---|
| `null` | FAIL — TypeError "received object" | **44/44 green; whole suite 2,133 green** | Fable, Opus |
| `String(n)` / `'4'` | FAIL | **green** | Fable, Sonnet, Opus |
| `[n]` / `[]` | FAIL | **green** | Fable, Opus |
| `true` | FAIL | **green** | Fable, Sonnet, Opus |
| `''` | FAIL | FAIL | Opus — caught by the empty-string check, not the range check |

The base test that fails is titled *"the whole 1900–2100 range resolves — no
throw, no null, no empty field."* Head no longer detected `null` there. The
two-lane artifact's verified-true list had said: *"the range checks… are
equivalent for the values in play"* — precisely the licence the same artifact
had refused for `-0` one paragraph earlier. Neither prior lane looked at the
numeric matchers' type contract.

Fixed with an `inRange(n, lo, hi)` helper that asserts `typeof n === 'number'`
first, beside `differs`; the message now prints the value and its type. All
four plants and the `-0` re-verify fail the head file.

## HIGH-2 (Opus) / MED-2 (Fable) — `differs()` was the one helper left unguarded

The two-lane MED-1 was *"one unguarded line carried six sweeps"*, and its fix
added guard tests for `expectNone` and `registerOffenders` — but not for the
third helper the same commit introduced, the one that IS the `-0` fix.
`differs = () => false` disabled ten comparisons across five sweeps and stayed
44/44 green (Opus, Fable); combined with the audited `-0` plant, the audited
regression returned silently (both lanes ran the combination). A sentinel now
pins `differs` as `Object.is` (`0`/`-0` differ, `NaN`/`NaN` do not) and
`inRange` as number-asserting over `null`, `undefined`, `'4'`, `[4]`, `true`
and `NaN`.

## MED-1 (Fable) / MED-1 (Opus) / LOW (Sonnet) — the counts were computed outside the predicate walk

The sweep counted strings and characters from `strings`, then called
`registerOffenders(dob, strings)` separately. Nothing tied what the predicate
saw to what the counters counted. So the two-lane "killed" mutants were killed
in the placement that audit chose and survived one line lower:

| mutant at the call site | `dates`/`scanned`/`chars`/`shapes` | violation caught? |
|---|---|---|
| `registerOffenders(dob, strings.map(s => ({...s, text: ''})))` | all green | **no** (Fable T7) |
| `registerOffenders(dob, [])` | all green | **no** (Fable T8, Opus T2, Sonnet 7) |
| `registerOffenders(dob, strings.slice(0, 1))` | all green | **no** (Opus T2b) |
| blank after counting, before the call | all green | **no** (Fable T9) |

Fable and Opus each combined one of these with a real, same-length planted
violation: every pin green, violation undetected. The two-lane artifact's "all
four mutants killed" and the in-file "each line below kills one of those" were
true of one placement and false of the semantically identical one. Fixed as
Fable proposed and Opus independently recommended: `registerOffenders` now
returns `{ offenders, scanned, chars }` from its own loop and the sweep sums
them, so a count can only be right if the walk saw the text it counted. All
four call-site mutants now fail on `scanned` or `chars`.

## MED-2 (Opus) — the pins fired before `expectNone`, inverting the diagnosis claim

A register violation only ever arrives together with a content edit, and a
content edit moves `chars`. Opus planted `'a cosmic role…'` into a posture
stance: base reported the term and the path; head reported *"expected 1415066
to be 1414086"* and never printed an offender — in a test whose rewrite was
justified partly as "better diagnosis". The offenders assertion now runs first;
Opus verified the reorder restores the offender message and stays green on
clean content.

## MED-3 (Opus) — "applies all three predicates" planted two

No plant for `DIAGNOSTIC_FRAMING_RE`; deleting that predicate from the helper
stayed 44/44 green under a test titled "all three". Opus also proved the
predicate IS live in the sweep with a length-preserving plant
(`authored,` → `syndrome,`, both eight characters, so `chars` held). Third
plant and its message assertion added.

## MED-4 (Opus) / LOW-1 (Fable) / MED (Sonnet) — the reconciliation reproduced the floor it condemned

`expect(shapes.size).toBeGreaterThan(1000)` against a measured 1,245 (every
reading distinct): 19.7% slack, two lines under a comment reading *"EXACT
counts… not a floor"*, and never the line that killed the mutant credited to it
— all three lanes showed `scanned` fires first (65,985 ≠ 66,111). Opus also
showed `expect(new Set(dates).size).toBe(1245)` is inert, since `sweepDates`
yields strictly increasing dates. `shapes.size` is exact now; the inert line is
gone.

## LOW-2 (Fable) / LOW-3 (Opus) — floors and missing pins on the other sweeps

The adjacent range sweep kept `expect(count).toBeGreaterThan(1900)` against
1,985 (Fable's stride 37→38, dropping 53 dates, green on base and head); the
23/53/89/101-stride sweeps pinned nothing (Fable's 89→97, green). The "EXACT,
not a floor" argument had been applied to one sweep of seven. Every sweep now
goes through `sweepList(stride, expectedCount)`, which pins its own date count
with a message saying what to update. Both mutants now fail.

## LOW (Sonnet) — the bridge note's compliance rested on a coincidence

Breaking the sweep's call site with a planted second-person leak in
`MASTER_MODE_BRIDGE_NOTE` was caught only because the fixture snapshot happens
to hold four bridged dates. The note is now in the direct-scan `tables`
object (the pre-existing gap Lane B queued in the two-lane pass), and one
bridged date is checked through the walk directly, asserting the note's path
is among the strings scanned.

## LOW-3 (Fable) / LOW-4 (Opus) — pin messages

The exact pins failed with a bare integer diff and named nothing. Each now
says what moved it and what to do; and with `expectNone` first, a real
violation reports the violation.

## LOW-4 (Fable) / LOW-1 & LOW-2 (Opus) — the record, six sentences

1. `tests/public.test.js` still said *"The predicates, the data and the dates
   are unchanged"* after the journal and PR body had said otherwise. Corrected
   to name the two restored matcher semantics.
2. The same comment cited *"DOCTRINE §7 stage 3 v0.79's testTimeout note"*.
   DOCTRINE contains no such clause; v0.79 is the readings-list amendment. The
   budget lives in `vitest.config.js`. Corrected, with the mistake named.
3. `vitest.config.js` and `tests/dependency_discipline.test.js` stated the
   pr238-era `pii_scan`/`cards_hosting` idles (111 ms / 133 ms) in the present
   tense; `pii_scan`'s slowest test is now the #239 merge-conflict probe.
   Tensed.
4. The journal heading still read "PR pending" after the PR existed and the
   entry below had been flipped to SHIPPED in the same commit.
5. The journal's "fix" paragraph described the removed `> 50,000` floor as
   current. Corrected.
6. Three comments disagreed about what the 5/6 and 12/12 contention figures
   support. Aligned: history, not justification.

## Verified true across the lanes

- **Every pinned number, independently recomputed by three lanes:** 1,245
  dates; 1,245 distinct; 66,111 strings; 1,414,086 characters; 198,333 old
  `expect()` calls; stride 73 → 1,006 (239 dropped); stride 37 → 1,985; stride
  89 → 825, with 39 on arcana 0. All exact.
- **All seven two-lane kills reproduce** in all four lanes.
- **`differs()` is applied everywhere a `toBe` was** (Opus and Sonnet grepped
  every `!==`/`===`; the survivors are an expected-value expression present at
  base, the `toHaveLength` rewrite, and the `.some` rewrites).
- **`expectNone` on a non-array never passes silently** — `undefined`, `null`,
  `0`, `''`, `{}`, `{length:0}`, `Set` all throw (Fable, Opus).
- **The `NaN` asymmetry is real and one-directional** (`toContain` is
  `===`-based); `toHaveLength` → `.length !== n` is equivalent including on
  non-arrays; the determinism test compares `JSON.stringify` on both sides so
  key order, `undefined` and `-0`-in-JSON are identical (Fable, Opus).
- **Speed, ratios agreeing across hosts:** register sweep 17–20× faster, file
  5–6× faster; `public.test.js` third-slowest file in every lane; slowest
  single test ~0.4 s (Opus's runs happened to put `render_cards` first — the
  "identity is noise" restatement stands).
- **Counts and gates in every clone:** 42 → 44 (now 46) tests; 2,131 → 2,133
  (now 2,135); 61 files; assurance suite 121 OK; product audit PASS; `index.html`
  659; CLAUDE.md counts match; no `core/`, `ui/`, `content/` or `package.json`
  change; no `fetch(`, storage key or jsdom.
- **CI on `9f20d52`:** `test`, `product-audit`, `l48-gate` all green;
  `mergeable_state: clean`.

## Stated plainly — not reproduced

- Opus could not reproduce the mirror `NaN` plant end-to-end (`getAntiFitFamily(NaN)`
  throws before the comparison) and accepted the finding on the matcher
  semantics it verified directly.
- Absolute timings vary ~1.2× across lanes' hosts; ratios agree.
- The 52/37/47 ms sub-breakdown reproduces to order of magnitude only.
- No lane re-ran the pr238 contention experiments.
- Haiku ran no mutants of its own; its MERGE verdict rests on re-verification
  of the prior seven and the counts.

## Final state of the reconciled branch

- **Twenty family mutants run against the reconciled file, all killed:** the
  four non-number postures and the `-0` re-verify; `differs` reverted to `!==`
  and to `() => false`; `inRange` without its type guard; texts blanked at the
  call site, the call site fed `[]`, and fed one string; the diagnostic
  predicate deleted; the same reading for every date; the range sweep's stride
  37 → 38 and the posture sweep's 89 → 97; and the seven prior kills again.
- `tests/public.test.js` 44 → 46 tests; suite 2,133 → 2,135.

**Merge remains the controller's word per §10 / L48. This artifact claims no
merge authority.**
