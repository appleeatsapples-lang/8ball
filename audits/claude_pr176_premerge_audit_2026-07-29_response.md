# PR #176 — Pre-merge audit: DOCTRINE v0.61 §3 label-only fixture carve-out

**Artifact:** `audits/claude_pr176_premerge_audit_2026-07-29_response.md`
**PR:** #176 — branch `claude/rising-sign-mutation-fixtures-rvaocg`, head `bbbd149`, base `main` (`aa8d568`)
**Diff:** `DOCTRINE.md` (+24/−1), `journal.md` (+80), `audits/doctrine_v060_label_carveout_2026-07-29_brief.md` (new, 118 lines). No code, test, fixture, or calc change.
**Suite at head:** 45 files / 1587 tests green (reproduced independently by five lenses).

---

## VERDICT: **MERGE WITH FIXES** — and not on this artifact alone

The clause is substantively sound. Every empirical claim it makes about the tree was independently re-derived and holds. Five adversarial lenses raised nine P1 findings against it; **eight were killed by executed refutation** and the ninth survived only as a P3 drafting-completeness note. No lens produced an executed repro in which the carve-out lets a wrong calculation, a §11 violation, or a silently-green wrong result reach `main`.

But two things stop this from being SAFE TO MERGE as written:

1. **Six factual/editorial defects in the PR's own text** are unrefuted and cheap to fix — a stale test count contradicted by the same commit's own message, a body-less duplicate journal heading that resurrects a STAGED status for an entry `main` records as SHIPPED, a dangling cross-reference in the expiry sentence, and four tracked locations that continue to state the amended rule absolutely. Merging a constitutional amendment carrying a false status line into an append-only record is not acceptable in a repo whose journal is the state of record.
2. **The §10 cross-model requirement is unmet, and this artifact does not meet it** (next section). The clause's own footer says an independent cross-model read is REQUIRED before merge. That has not happened.

Fix the six items below, obtain a genuine second-vendor read, then merge. **Do not merge on a controller override** — the PR body itself says so, and this artifact endorses that instruction.

---

## THIS IS NOT A §10 CROSS-MODEL AUDIT

Read this section before treating anything below as clearance.

Every lens that produced the findings in this artifact was **Claude**. Models varied across opus and sonnet, the lenses ran in isolated worktrees with no sight of each other, and the refutation pass was genuinely adversarial — one lens's finding was killed by another lens's executed counter-evidence in eight of nine cases. That is real independence of *reasoning*. It is **not** independence of *lineage*. Shared training, shared priors, shared blind spots.

Per #159's own second section, shared lineage is **disqualifying** for the §10 cross-model requirement. This artifact must not be filed as satisfying it, and the `l48-gate` passing on this PR does not satisfy it either (see `l48-gate-docs-only-bypass-confirmed` below — it went green via the docs-only exemption, confirmed from the live Actions log, without ever running the shape check).

**The "Codex is retired" premise recorded in L48 sighting #14 was subsequently found FALSE.** A genuine second-vendor read is therefore likely reachable and should be preferred over this artifact. Commission it before merge. This document is a thorough same-vendor pre-read — useful, dense, and it did kill eight P1s — but it is not the required verdict.

Additionally worth stating plainly, since it is the structural reason the requirement matters here: **this clause relaxes a gate and was authored by the lane that tripped that gate.** The mitigating record is that the *recommendation* to write it came from an independent reviewer — `audits/claude_pr162_premerge_audit_2026-07-29_response.md` F7 ends "recommend writing the carve-out down", and the implementer's response in the same file explicitly refused to write it as "the controller's call, not the implementer's". So origination is clean; authorship is not. That is exactly the configuration §10 exists for.

---

## Findings

### CONFIRMED (survived refutation)

| ID | Sev | Title |
|---|---|---|
| `expiry-2` | **P3** (down from P1) | The lapse trigger list is a closed three-item enumeration; a snapshot-keyed consumer is a fourth trigger none of the three names |

### KILLED BY REFUTATION (process working — recorded as evidence)

| ID | Filed | Killed on |
|---|---|---|
| `bypass-1` | P1 | Scanner gap is repo-wide and pre-existing; same payloads pass identically in `tests/rising.test.js`, a file the clause never mentions. The clause's one testable claim (labeled-DOB in a label reds pii_scan naming file:line) was confirmed by the finder's own control. |
| `bypass-2` | P1 | Payload attaches a false label to a pre-existing synthetic `dob`; `dob` is named in bullet 2 as still fully gated. The relation-word case IS caught by `audits/run_local_audit.sh` — executed with a throwaway pattern file, `grep -nFi`, newline-immune, exit 1, names file:line. §11 designates that layer for exactly this. |
| `bypass-3` | P1 | The type-flip attack is explicitly excluded by bullet 2 (`expected.*` is a fixture change "whatever the commit says it is doing"). Bullet 4's mandated confinement check, executed against the finder's own 110-line haystack, returned exactly the 2 offending lines with zero false positives. Pre-existing weakness at `tests/rising.test.js:180` (from #152); the clause is the first text in the repo that would have caught it. |
| `expiry-1` | P1 | The PII red belongs to every byte in the repo, not to `label` — the same payload reds from `journal.md` prose and a `core/profile.js` comment. The clause states this fact four lines above the lapse list in bold. The lapse list is a one-way ratchet that can only make §3 stricter; an omission from it cannot authorize shipping anything. |
| `expiry-3` | P1 | Control experiment: renaming a *hardcoded* `it()` name in `tests/rising.test.js` produces identical `-t` silent-green degradation. The mechanism is a generic vitest property of every test name in all 45 files, orthogonal to §3 and to this clause. No `-t` / `testNamePattern` exists anywhere in the repo. |
| `expiry-4` | P1 | Attributes label-safety to bullet 1 (which is about `_`-keys); label safety is bullet 2, whose condition a corpus snapshot negates — making it lapse trigger 1 verbatim. Full-suite run with the mutation: 2 files red. The clause cannot turn a red suite green. |
| `expiry-6` | P1 | All three named lapse conditions red the ordinary suite at the exact PR that edits the label — executed one at a time. The detector the finding says doesn't exist is the `test` job. The finding's own proposed guard misses the only genuinely silent variant (non-`===` `.filter()` selector). |
| `expiry-7` | P1 | The operative valve is the *second* sentence, which names all three triggers verbatim and contains no pointer. The house convention (DOCTRINE §2/v0.25 changelog precedent) resolves "Nth bullet" to the Nth `-` item, i.e. the charitable reading. No reviewer action differs between readings. |
| `counterfactual-1` | P1 | Provenance charge inverted: F7's recommendation to write the carve-out came from the *independent reviewer*, and the finding quoted F7 stopping one sentence short of it. Frequency denominator wrong (1-of-5 fixture-touching commits, 20%, and the most recent of the five — not 1-of-114). Names no leak; the lens hunted for one and found none. |

### UNVERIFIED, NOT CLEARED (over refutation cap — no lens attempted to kill these)

These are **not** findings that survived scrutiny. They are findings that never received it. Treat accordingly.

| ID | Sev | Claim (unrefuted, unconfirmed) |
|---|---|---|
| `journal-2` / `expiry-9` / `journal-duplicate-heading` | **P1/P2** | `journal.md:84` carries a body-less duplicate `## 2026-07-29 — Local live-fire is available here… — STAGED` heading, immediately above an unrelated entry; the real entry exists ~94 lines below marked SHIPPED, and `main` records it once, as SHIPPED. Almost certainly a rebase artifact from absorbing #178/#182/#183. |
| `bypass-4` / `bypass-2(P2)` / `underscore-3` | P2 | Clause (b) constrains the *key shape* but not the *value*: a `_`-key may hold arbitrary nested content, and deletion of `_comment` / `_pii_rule` / `_rising_pii_rule` — the file's own in-file §3/§11 reminders — is classified as not-a-fixture-change. One lens independently executed the gutting of `_pii_rule` and got a green 45/1587 suite (noted inside the `counterfactual-1` kill, but never refuted on its own terms). Equally undetected on `main`; the clause changes whether §3 forbids it, not whether anything catches it. |
| `bypass-5` | P2 | "The reviewer verifies it mechanically" ships no mechanism, and the obvious mechanisation rejects diffs clause (b) permits (inner lines of a structured `_`-key are neither `label` values nor `_`-prefixed keys). |
| `bypass-6` | P2 | The clause permits editing exempt fields and a test file in the same commit with no bound on the test-file change; a one-line edit to the fixture consumer loop could make every §3 contract row pass unconditionally, and nothing pins test counts. |
| `bypass-1(P2)` | P2 | "§11 still applies in full" is broader than the same-line probe supports: label and `dob` sit on different lines in this file's layout, and the labeled-DOB regex is line-local. |
| `expiry-5` | P2 | A label-only edit can create a duplicate `it()` name; vitest accepts it silently and junit collapses the two testcases. (One refuter executed the duplicate case and found no coverage loss — 137/137 — but that was in service of killing `expiry-6`, not this finding.) |
| `l48-gate-docs-only-bypass-confirmed` | P2 | **Confirmed from the live Actions log**, not just reproduced locally: `l48-gate` printed "docs-only PR … exempt" and exited 0. Had the shape check run, it would have rejected this PR's own brief (`doctrine_v060_label_carveout_…_brief.md` matches neither `_premerge_audit_…_response` nor `L48_override_…`). Known, previously triaged as P2 in `audits/claude_l48_predicate_crossread_2026-07-29.md` finding 6. The PR body discloses it prominently. |
| `crossref-4` / `bypass-8` | P2/P3 | "The scope conditions in the third bullet above" — the nearest preceding list is the numbered "does NOT relax" list, whose item 3 is the truthfulness rule. (`expiry-7`'s refutation resolves this to a singular/plural slip and downgrades it, but `crossref-4` as filed was never separately refuted.) |
| `pin-5` | P2 | Nothing pins the three scope facts or the lapse condition; `tests/repo_shape.test.js` is the in-repo precedent for pinning tree-derived prose, and CLAUDE.md records such claims drifting unnoticed for a month, twice. A ~30-line pin exists and passes clean / fails planted. |
| `divergence-6` / `stale-doc-1` / `claude-md-stale-absolute-rule` | P2/P3 | The rule is stated in five tracked places; this PR amends one. `CLAUDE.md:100`, `README.md:25`, `README.md:67`, `core/profile.js:4-5`, and `tests/fixtures.json`'s own `_comment` all still state it absolutely. CLAUDE.md is the file an agent reads first and claims override authority. |
| `bypass-7` / `expiry-8` / `test-count-mismatch` / `count-8` | P3 | `journal.md:73` says "45 files / 1583 tests green"; the head measures **1587**, which is what the same commit's message and the live PR body both say. Off by 4, a pre-rebase leftover. |
| `overstated-1` | P3 | Scope fact 1 as literally worded ("consumed by exactly two files", "`_`-keys never read by anything") is false for byte-level consumers: `tests/pii_scan.test.js` reads the whole file including `_`-key values and reds on them. The *parse* claim is true. |
| `expectedlabel-9` | P3 | Clause (a) exempts "`label` string values" unqualified; bullet 2 says "anything under `expected`" is a fixture change. A future `expected.label` is simultaneously exempt and not exempt. |
| `gate-7` | P3 | The clause declares a cross-model read REQUIRED; CI enforces nothing of the kind for this PR shape. (Duplicate of the l48 finding at doctrine level.) |
| `authority-10` | P3 | No tracked controller commission for this amendment. `counterfactual-1`'s refutation establishes an independent reviewer *recommended* it and the implementer *deferred* it to the controller — but the controller instruction itself appears nowhere in tracked content. Absence of record, not record of absence. |

---

## What reproduced exactly

Everything below was executed, in isolated worktrees or `git archive` sandboxes at `bbbd149`, with the tree restored and verified clean afterward.

**Baseline.** Clean full suite at `bbbd149`: **45 files / 1587 tests passed**, reproduced independently by five lenses. `origin/main` (`aa8d568`) also 1587 — this doc-only PR does not move the count. Final `md5sum tests/fixtures.json` = `5a92a8d58102c750dbcc206fc36056c7` in every lens that mutated it; `git status --porcelain` empty; HEAD `bbbd1493308eec09f5b3a0af03364467fd021906`.

**Scope fact 1 (parse), proven destructively.** Corrupting `tests/fixtures.json` to `{ THIS IS NOT VALID JSON` and running the full suite failed **exactly two files** — `tests/profile.test.js:48` and `tests/rising.test.js:27`. 43 of 45 passed. `grep -n 'fixtures\.'` over both yields exactly the six named keys and nothing else; node enumeration of the file shows those six arrays plus six `_`-keys and no other top-level key.

**Scope fact 1 (no enumeration).** `Object.keys|entries|values|for-in` over the parsed fixtures object: **zero hits** repo-wide. The only `Object.entries` in `profile.test.js` is at :54 over a per-case `expected` sub-object; the two `Object.keys` at :517/:530 are over `CARDS`, an imported content table.

**Scope fact 2.** Every `label` reference in the two consumers is an `it()` name or an assertion message — `profile.test.js:52,55,371`; `rising.test.js:73,87,92,99,134,159,177`. Never an asserted value, never a selector. The `.label` assertions in `tests/birthcard.test.js` and the `label ===` lookup in `tests/pii_scan.test.js:147` are against those files' own in-file arrays, confirmed by reading both.

**Scope fact 3.** No module under `core/`, `ui/`, or `index.html` reads the file. Only non-test mention is a comment at `core/profile.js:4`. `netlify.toml` additionally `rm -rf`s `tests` before publish.

**§11 non-relaxation, the clause's highest-stakes claim.** Planting a labeled-DOB shape in a fixture label (a name-token from the rule's alternation followed by a `YYYY-MM-DD` date on the same line — payload not reproduced here, see the redaction note) reds `tests/pii_scan.test.js` naming **`tests/fixtures.json:7`** under the `labeled-DOB leak` rule (pattern in `tests/pii_scan.test.js`'s `BANNED` table; not quoted here — see the redaction note at the foot of this file). Reproduced by four lenses independently with four different payload spellings. A non-DOB rule confirmed live too: a sibling-project vocabulary token in a label fired that rule's scan at `tests/fixtures.json:171`. Allow-list status re-derived mechanically: `DOCTRINE_ALLOW` false, `CONFIG_ALLOW` false, `LABELED_DOB_ALLOW` false, `.json` in `TEXT_EXTS`, `tests` not in `SKIP_DIRS`, `fixtures.json` not in `SKIP_FILES` — **all nine BANNED patterns apply to this file.**

**The second PII layer, executed.** `audits/run_local_audit.sh` against a throwaway `local_personal_data.txt`: clean run `LOCAL PII AUDIT: clean (558 files scanned)` exit 0; with a planted label hit → `HITS FOUND / --- pattern: … / tests/fixtures.json:7`, exit 1. It is `grep -nFi` — fixed-string, per-line, **newline-immune** — and it covers the cross-line relation-word case the public scanner misses. It is operator-local and pre-push only; it never runs in CI.

**l48-gate predicate, executed and confirmed live.** The workflow's docs-only test is `! echo "$CHANGED" | grep -qvE '\.md$'`. `CHANGED='tests/fixtures.json'` → **NOT exempt, artifact required.** So every future label-only fixture PR still summons a cross-model audit artifact or a logged override. Conversely, for *this* PR (all `.md`) the live Actions log shows `l48-gate` printed "docs-only PR … exempt" and exited 0.

**Bullet 4's confinement check works, at scale.** Against a deliberately constructed 110-line haystack (54 label rewrites hiding one `expected.offsetMinutes` int→string type-flip): the naive line-level grep returned exactly the two offending lines, zero false positives across 108 legitimate label lines. The structural JSON-path version reported `changed paths: 55 exempt: 54 OUT OF SCOPE: 1 / !! rising_tz_cases.0.expected.offsetMinutes TYPE int->str`, exit 1.

**The tzdata premise behind the motivating edit is correct.** Verified independently via `zdump -v Asia/Kolkata` and Python `zoneinfo`: the +05:21:10 (19270s) offset in effect 1869-12-31 → 1905-12-31 carries abbreviation **MMT** (Madras Mean Time). LMT applies only pre-1854 at +05:53:28. Matches both the clause and #162's journal record.

**Renumber integrity.** `main`'s v0.60 §1.D clause is preserved **byte-identical** when relabeled to "superseded"; the version bullet list is correctly ordered with v0.61 prepended and every other line untouched; `v0.61` was genuinely unused anywhere in the repo before this PR. The v0.60/v0.61 collision with the concurrent #178/#182/#183 chain was detected and resolved correctly.

**`expiry-2`, the one confirmed finding — both halves.** A test using the label *only* as the `it()` name (the clause's own "safe" pattern) with `toMatchSnapshot()` as its assertion: baseline `25 written / 25 passed`; after a verified label-only edit, `CI=true` → `Snapshot "… > Aries Rat LP3 (year-pillar rat, 1900-anchored) 1" mismatched`, 1 failed. Without `CI=true` → `1 written, 1 obsolete`, green. The refuter then executed the branch the finder only asserted: committing the locally-written snapshot and re-running under `CI=true` gives `Obsolete snapshots found when no snapshot update is expected` — **also red**. The only green path is `vitest run -u`, and diffing the `.snap` shows a **pure key rename** — the recorded value `{animal:"rat", lifePath:3, sunSign:"aries"}` byte-identical under the new key — landing as a second tracked file in the same diff (`__snapshots__/` is not gitignored; `.gitignore` read in full). Zero `toMatchSnapshot|toMatchInlineSnapshot|toMatchFileSnapshot` hits repo-wide; no `__snapshots__` dir; no `.snap` file. `tests/repo_shape.test.js` forces a CLAUDE.md edit in any PR that adds a test file, so the precondition cannot arrive silently.

---

## The brief's five hooks, answered

**Hook 1 — Is "by field, not by intent" mechanically checkable in a mixed hunk, and should a CI check exist?**
**Yes, checkable — proven.** Both the line-level grep and a structural JSON-path differ ran clean against a deliberate 110-line haystack containing one hidden type-flip: 2/2 caught, 0 false positives. **A CI check should exist but the drafted forms are not yet correct.** The line-level version breaks on clause (b) as written — a structured `_`-key's inner lines are neither `label` values nor `_`-prefixed keys, so the check rejects a change the clause permits (`bypass-5`, unrefuted). Either constrain clause (b) to scalar string values, or write the check structurally (JSON-path based) so nested `_`-key content is exempt by path prefix. Until one exists, bullet 4's "verified mechanically" describes an obligation, not a mechanism.

**Hook 2 — Is the lapse condition list complete?**
**No.** This is `expiry-2`, the single confirmed finding. The list is a closed three-item enumeration — asserts on a `label`, selects by `label`, enumerates keys — and a consumer whose *test identity* depends on a label (snapshot key namespace, junit `name` attribute, any downstream name-keyed report) is a fourth trigger none of the three names under any natural reading. Two further gaps: a non-`===` selector (`.filter(c => c.label.startsWith(…))`) drops a test silently, 138→137, green — the one genuinely quiet mode, and the mode the finder's own proposed guard misses; and the trigger sentence's subject is "a future **test**", which structurally cannot fire on a future *runtime* consumer, even though scope bullet 3 is entirely about runtime modules. All three close with one principled reformulation: *"If any future consumer's behavior — including test identity — depends on a `label` value or on enumerating this file's keys, this carve-out lapses for that field."*

**Hook 3 — Is `label` a free-text channel?**
**Practically no, but the clause overstates it.** Executed: 10/10 probes, twice, by two lenses. Caught: sibling-project vocabulary (two spellings), and the same-line name-token+DOB shape. Not caught by the 8 CI regexes: cross-line label/`dob` pairing, relation words ("my mother, born 1961-04-03"), card-content strings, third-party contact blocks. **But** — the same payloads pass identically when planted in `tests/rising.test.js`, a file the clause never mentions and which §4 prohibits card-content in by name, so this is a repo-wide property of `tests/pii_scan.test.js` (untouched by this PR), not something the carve-out creates. The designated second layer covers the relation-word case: `run_local_audit.sh` fired on it, exit 1, file:line. Residual: it is operator-local, pre-push only, fixed-string, and never runs in CI — so a container-based lane pushing a "label-only" edit gets the 8 regexes and nothing else. **Recommended wording correction:** "the public scanner catches the same-line operator-token variant; §11's local-audit layer covers the rest." Also add §4 and §9 to the "does NOT relax" list — naming only §11 invites an *expressio unius* misreading.

**Hook 4 — Should CLAUDE.md carry a pointer?**
**Yes, and this is blocking.** `CLAUDE.md:100` reads "Don't edit `tests/fixtures.json` without updating `core/profile.js` in lockstep per §3" — unconditional, in a file that opens by asserting its instructions "OVERRIDE any default behavior." After this merge, the file every Claude Code session reads first will be strictly stricter than doctrine on this point. Four other tracked locations have the same problem (`README.md:25`, `README.md:67`, `core/profile.js:4-5`, and `tests/fixtures.json`'s own `_comment`, which reads "if a fixture changes, that's an algorithm change"). Adding "(see §3 v0.61 for the label-only carve-out)" to each is a five-line change. Note the CLAUDE.md edit must not quote operator tokens — CLAUDE.md is outside `DOCTRINE_ALLOW`.

**Hook 5 — Is the carve-out worth its own risk?**
**Marginally, yes — but the case is weaker than the PR implies, and the honest do-nothing alternative is live.** The frequency data: 5 commits have ever touched `tests/fixtures.json`; exactly 1 (`1513ad8`, #162, LMT→MMT) was label-only. But the repo is 25 days old, 4 of the 5 landed on/after 2026-07-21, 3 on 2026-07-29, and the label-only one is the *most recent* — so "bound once in history" is an n=5 artifact, and #162's own auditor forecast "this will be re-litigated on the next label fix." Against that: the friction removed is one doctrine sentence per occurrence. In favor: the clause is the **first text in the repo** that mandates a per-field confinement check on a fixtures diff — §3's byte-identity bright line is conditioned on the ADDITIVE contract (a PR adding outputs to `core/profile.js`), so a fixtures-only PR fell into neither §3 category and drew no bright-line scrutiny at all. That is the gap #162 hit. Post-v0.61, claiming the carve-out *summons* a check that names the payload; not claiming it leaves you exactly where you were. There is no configuration in which v0.61 leaves an attacker better off. **Net: worth it, on the condition that bullet 4's check is made mechanical rather than aspirational (hook 1).** The do-nothing option remains defensible and the controller should weigh it knowing the friction is ~1 sentence per ~5 fixture commits.

---

## Fix list

### Blocking — must land before merge

1. **Remove the duplicate journal heading at `journal.md:84`.** Body-less `## 2026-07-29 — Local live-fire is available here… — STAGED`, duplicating an entry that exists ~94 lines below as SHIPPED and that `main` records once as SHIPPED. A rebase artifact writing a false status into the append-only record. *(`journal-2`, `expiry-9`, `journal-duplicate-heading` — unverified/unrefuted, but the textual claim was reproduced by three lenses reading the file.)*
2. **Correct the suite count: `1583` → `1587`** at `journal.md:73`. Contradicted by this same commit's own message, by the live PR body, and by five independent measured runs. *(`bypass-7`, `expiry-8`, `test-count-mismatch`, `count-8`)*
3. **Fix the expiry sentence's dangling pointer.** Replace "The scope conditions in the third bullet above" with an explicit reference — "the three bullets under *Why those two fields specifically*". *(`crossref-4`, `bypass-8`; `expiry-7`'s refutation establishes it is a singular/plural slip with no operative consequence, but it sits in the self-expiry paragraph and should not ship ambiguous.)*
4. **Widen the lapse trigger** to a principled formulation covering test-identity dependence, non-`===` selectors, and runtime consumers: *"If any future consumer's behavior — including test identity — depends on a `label` value or on enumerating this file's keys, this carve-out lapses for that field."* This is the one confirmed finding. *(`expiry-2`, hook 2)*
5. **Update the four stale absolute statements** — `CLAUDE.md:100`, `README.md:25`, `README.md:67`, `core/profile.js:4-5` — with a pointer to §3 v0.61. *(`divergence-6`, `claude-md-stale-absolute-rule`, hook 4)*
6. **Obtain a genuine second-vendor cross-model read.** The clause's own footer requires it; `l48-gate` will not enforce it for an all-`.md` diff (confirmed from the live log); this artifact does not satisfy it. The "Codex is retired" premise in L48 sighting #14 was found false — try it.

### Recommended — should land, not strictly blocking

7. **Bound clause (b)'s values.** Constrain `_`-key values to scalar strings, or state that nested content inside a `_`-key is exempt by path prefix. As written the clause exempts an unbounded content channel and, separately, blesses deletion of `_pii_rule` / `_rising_pii_rule` / `_comment` — the file's own §11 and §3 statements. Executed: gutting `_pii_rule` to say "§11 does not apply to this file" leaves the suite green at 45/1587. *(`bypass-4`, `underscore-3` — unverified, not cleared; equally undetected on `main`, so the clause changes the permission, not the detection.)*
8. **Ship the mechanical confinement check** bullet 4 already promises, as a CI stage. Write it structurally (JSON-path) so it does not reject clause (b) content. *(`bypass-5`, `pin-5`, hook 1)*
9. **Correct the §11 scope sentence.** "Labels are not a free-text channel" is broader than the same-line probe supports. Suggested: "the public scanner catches the same-line operator-token variant; §11's local-audit layer covers the rest, and §11 applies in full regardless." *(`bypass-1(P2)`, hook 3)*
10. **Add §4 and §9 to the "does NOT relax" list.** Naming only §11 is a drafting asymmetry inviting an *expressio unius* misreading. *(residue of `bypass-1`)*
11. **Update `tests/fixtures.json`'s own `_comment`**, which still reads "if a fixture changes, that's an algorithm change" — now false for label and `_`-key edits. Note the recursion: this edit is itself a clause-(b) edit and is the first live test of the carve-out. *(`stale-doc-1`)*

### Optional — bank for later

12. Resolve the clause (a) / bullet 2 contradiction for a hypothetical `expected.label`. One clarifying parenthetical: "`label` at fixture top level only; a `label` under `expected` is a fixture change." *(`expectedlabel-9`)*
13. Soften scope fact 1's wording from "consumed by exactly two files" to "**parsed** by exactly two files" — `tests/pii_scan.test.js` byte-reads it, `_`-key values included, and reds on them. *(`overstated-1`)*
14. Bound the same-commit test-file allowance in bullet 4 (currently unlimited). *(`bypass-6`)*
15. Consider pinning the three scope facts mechanically, per the `tests/repo_shape.test.js` precedent and CLAUDE.md's own record of unpinned tree claims drifting twice. Note the drafted guard is incomplete — widen its selector pattern beyond `===`, drop the duplicate-label assertion (pins a non-harm: two identical labels run 137/137 with no coverage loss), drop the `-t` assertion (CI policy, not §3). *(`pin-5`, residue of `expiry-6`)*
16. Harden `tests/rising.test.js:180` — the `typeof … === 'number'` guard is the only conditional guard on a fixtures value in the repo, and a type-flip through it is silent. Pre-existing (from #152), a finding against `main`, not against this clause. *(residue of `bypass-3`)*
17. `audits/claude_l48_predicate_crossread_2026-07-29.md` finding 6 remains open: the docs-only exemption does not exclude `DOCTRINE.md`, so gate-relaxing constitutional amendments auto-exempt. Previously triaged P2 and dismissed at P0. Worth re-opening now that a live instance exists.

---

## Coverage gaps — unverified, not cleared

Stated because "I could not check" is a real category here and asserting past it would be the failure mode this audit exists to catch.

- **No lens ran a real GitHub Actions job.** All `l48-gate` and journal-gate conclusions come from evaluating `.github/workflows/ci.yml`'s shell predicates by hand, with the single exception of the live log fetch confirming this PR's docs-only exemption. Vitest snapshot semantics under Actions were substituted with local `CI=true`.
- **`audits/local_personal_data.txt` is gitignored and absent.** Every `run_local_audit.sh` result used an invented throwaway pattern. That proves the mechanism (whole-repo, fixed-string, per-line, newline-immune, exit 1, names file:line). It says nothing about what the operator's real pattern list contains or how likely a label is to collide with it. **No claim is made that any specific real DOB or name is covered.**
- **Branch protection status on `main` was not queried.** CLAUDE.md states nothing blocks a merge on a red check today. The "loud detection" this artifact relies on for the killed `expiry-*` findings is therefore advisory-but-binding by convention, not mechanically enforced at merge.
- **Repository visibility was not queried.** §11 findings are stated as tracked-content violations, not confirmed public exposure. The deployed Netlify site was not fetched (egress blocked); `netlify.toml`'s `rm -rf … tests …` was read, not observed.
- **No tracked record of a controller commission** for this amendment exists. An out-of-band verbal instruction would not appear in the repo, so this is absence of record, not record of absence. *(`authority-10`)*
- **Fourteen P2/P3 findings were never subjected to a refutation pass** — the list above marks them explicitly. They may be wrong. They have not been shown to be wrong.
- **No prior DOCTRINE-only PR history audit** for silent exploitation of the same docs-only l48 exemption beyond this one confirmed instance.
- **Non-string / absent `label` values** (`null`, object, key removed) were not executed. The clause says "`label` string values"; nothing enforces the type.
- **Environment-sensitivity of the 1587 count** was not fully excluded — measured three times in one container, but not every test file was audited for environment-conditional test generation.
- **A shared scratchpad sandbox at `…/scratchpad/sb` is contaminated** by a prior agent (its `tests/fixtures.json` carries `"Capricorn boundary Dec 22"` vs HEAD's `"Capricorn cusp Dec 22"`). Flagged so a later auditor does not trust it.

## Hygiene

Every lens worked in an isolated worktree or a `git archive` sandbox, used `git -C <path>` throughout with no `cd`, restored every mutated file via `git checkout --` or a checksummed backup, removed every temporary `node_modules` symlink, and verified `git status --porcelain` empty with HEAD at `bbbd1493308eec09f5b3a0af03364467fd021906` before reporting. `node_modules` was symlinked from the main checkout rather than freshly installed via `npm ci` — the dependency tree is the operator's installed one.

---

## Redaction note

This artifact lives at `audits/*.md`, which is **outside** the PII scanner's `DOCTRINE_ALLOW`. The verdict as originally synthesized quoted the `labeled-DOB leak` regex verbatim and named two sibling-project vocabulary tokens as probe payloads; committing it unaltered redded five `tests/pii_scan.test.js` checks. Three spans were replaced with descriptive references before commit. **No finding, severity, verdict, count, or repro result was changed** — only literal banned tokens. The patterns themselves are readable in `tests/pii_scan.test.js`. That the scan fired on this artifact is itself corroboration of the clause's §11 bullet: the walk reaches new files under `audits/`.
