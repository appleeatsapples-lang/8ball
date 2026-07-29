# Audit brief — DOCTRINE v0.61, §3 label-only fixture carve-out

- **Date:** 2026-07-29
- **Note:** drafted as v0.60; renumbered to **v0.61** when #178/#182/#183 took v0.60 for the §1.D public-rung retirement while this PR was open. Filename retains the `v060` token it was created with.
- **Status:** COMMISSION, not a verdict. This file exists to satisfy the CI
  audit-artifact gate for a `DOCTRINE.md` change and to state what needs
  reading. **It clears nothing.** No verdict may cite it as one.
- **Author lane:** Claude Code (implementer). The same lane wrote the clause
  being audited, which is exactly why an outside read is required.

## What to audit

A single §3 amendment plus its version-block and version-list entries. No code,
test, fixture value, or calc behavior changes anywhere in the PR.

The clause says: a change to `tests/fixtures.json` confined to (a) `label`
string values and (b) top-level `_`-prefixed documentation keys is **not a
fixture change** under §3 — no `core/profile.js` lockstep, no calc-version
bump, and it does not trip §3's closing same-commit rejection clause.

## Why this is not a routine amendment

**It relaxes a gate.** Everything else in §3 tightens or documents; this widens
what may bypass a lockstep requirement. A gate-relaxing clause written by the
lane that tripped the gate is the structural case L48 exists for, and the
recent record is not reassuring: the journal's 2026-07-29 entry *"A false
premise reached `main` inside a proposed constitutional amendment"* describes a
§10 amendment whose entire finding section rested on a premise that was false
when written.

The provoking edit was benign — #162 corrected a fixture label from `LMT` to
`MMT`, because tzdata's `Asia/Kolkata` gives `+05:21:10` as Madras Mean Time,
not Local Mean Time. The question is not whether that edit was fine. It is
whether the general rule written from it is sound.

## The three scope facts the clause rests on

Each was verified against the tree rather than assumed. **Re-derive them; do
not take them from this file.** If any is false, the clause is unsound.

1. `tests/fixtures.json` is consumed by exactly two files — `tests/profile.test.js`
   and `tests/rising.test.js` — and only through explicitly named keys
   (`cases`, `rising_cases`, `rising_tz_cases`, `name_number`, `cards`,
   `brackets`). Nothing enumerates the object's keys, so `_`-prefixed keys are
   read by nothing.
2. In those two consumers, `label` appears only as the vitest `it()` name or
   inside an assertion **message**. It is never an asserted value and never
   selects a fixture. The `.label` assertion in `tests/birthcard.test.js` and
   the `label ===` lookup in `tests/pii_scan.test.js` operate on those files'
   own in-file arrays, not on `tests/fixtures.json`.
3. No runtime module (`core/`, `ui/`, `index.html`) reads `tests/fixtures.json`.

## The §11 interaction — check this one empirically

The clause asserts §11 is **not** relaxed: `tests/fixtures.json` sits inside the
PII scan's walk, `label` values included.

This was confirmed by planting a string matching the labeled-DOB rule — the
`labeled-DOB leak` entry in `tests/pii_scan.test.js`'s `BANNED` table; read the
pattern there rather than from this file — into a fixture `label`, and
observing `tests/pii_scan.test.js` go red naming `tests/fixtures.json:7`.
**Recorded because the first attempt at this probe was a false negative** — it
used the word "born", which that pattern does not contain, so the scan stayed
green and briefly suggested the file was unscanned. Re-run the probe yourself
with a string that genuinely matches the rule, and restore the file afterward.

(Note for whoever re-runs it: this brief deliberately does not quote the
pattern inline. It contains operator name tokens, and `audits/*.md` is outside
the PII scanner's `DOCTRINE_ALLOW` — quoting it here reds the scan. That is
itself a small demonstration that the scan reaches new files in `audits/`.)

If the file were in fact outside the PII walk, the clause's second
non-relaxation bullet is wrong and the carve-out becomes a free-text channel
into a tracked file. That is the highest-severity failure mode available here.

## Specific hooks

1. **Is "by field, not by intent" actually enforceable?** The clause tells the
   reviewer to confirm the diff touches only `label` values and `_`-keys. Is
   that mechanically checkable in practice — including a diff that edits a
   label *and* an `expected` value in the same hunk, or renames a `_`-key while
   changing a sibling? Is a CI check warranted instead of reviewer discipline,
   and if so should this clause have shipped with one?
2. **Is the lapse condition sufficient?** The clause self-expires if a future
   test asserts on a label, selects by label, or enumerates the file's keys.
   Is that the complete set of ways a label could become load-bearing? A
   snapshot test over the parsed object, or a count/uniqueness assertion over
   labels, would not obviously be caught by that wording.
3. **Does it interact with §4 immutability or §11's fixture-DOB sub-rule?**
   Neither is named in the clause. Confirm neither is silently widened.
4. **CLAUDE.md is not edited by this PR**, so its don't-do entry still reads
   absolutely while §3 now carries an exception. Is a pointer required there,
   or does §3 correctly govern? Note CLAUDE.md is outside the PII scanner's
   `DOCTRINE_ALLOW`, which constrains what may be written into it.
5. **Is the carve-out worth its own risk?** The honest alternative is: do
   nothing, and let each label fix carry a one-line doctrine note. That costs a
   sentence per occurrence and keeps the gate absolute. Argue the other side.

## Provenance and independence

The clause, this brief, and the journal entry are all from one lane. The
previous cycle's audit found that this lane committed the same error class it
was correcting — a result measured over a narrow set, stated as a general
truth — twice inside the correction itself
(`audits/claude_pr162_premerge_audit_2026-07-29_response.md`, F1 and F4). Treat
every generalization here as a claim to test.

Per #159's own second section, a fresh Claude lane is **not** a §10 cross-model
audit: same lineage, same blind spots. Note also that the "Codex is retired"
premise recorded in L48 sighting #14 was **later found false** — Codex ran at
00:45 and again at 08:01 the same day — so a genuine second-vendor read may be
reachable and should be preferred here over another Claude lane. The gate's
`[a-z0-9_]+` model token accepts any lane prefix, so the response filename is
not a constraint on who reads it.

**Merge is the controller's word, and per §10/L48 this one should not be
cleared by override.** A controller override is the wrong instrument for a
clause whose whole effect is to widen what may bypass a gate.
