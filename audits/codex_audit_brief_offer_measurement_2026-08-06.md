# Codex audit brief — the offer/measurement delta

**Status:** brief only. The lane has NOT been run against this delta. This
file states exactly what to review and how, so the run is reproducible and
does not repeat the two failure modes this branch has already hit.

## What to review

**Scope:** `fe946fb...HEAD` on `claude/specimen-four-line-symbolic` —
5 commits, 20 files, +1045/−16.

```
37221b0  audit: absorb the second-lane findings — a dead CSS rule, two false greens
cf78594  feat(offer): the $3 offer names the two-person comparison it already sells
7a6901f  feat(profile): the gender field says what it is, where it goes, what it does
9d5f4af  feat(measurement): four events, a shape that cannot carry a person, no collector
84d59b1  audits: operator-ready storefront copy for the folded-in comparative
```

Everything **before** `fe946fb` on this branch has already been read by two
independent lanes (grok, then codex) — see
`audits/relay_specimen_four_line_premerge_audit_2026-08-06_response.md` and
its addendum. Do not re-review it; review the delta.

## How to run it — both of these matter

**1. Capture the answer, not the transcript.**

```bash
codex exec --skip-git-repo-check --color never -o verdict.md - < context.md
```

`-o/--output-last-message` writes only the final message. Without it, the
response file is the agent's whole exploration transcript — 340KB+ with the
verdict buried or absent. That, not diff size, is what killed the two earlier
runs on this branch: a 163-line, 10KB single-commit control run reproduced the
failure exactly.

**2. Give it the WHOLE code corpus, not a path-scoped slice.**

The addendum records this as a design mistake worth not repeating: three of
the four lanes on the previous delta were path-scoped by subsystem, and
**six of fourteen findings were artifacts of the corpus boundary** — a lane
that cannot see `ui/tiers.js` reports `dyadRelation` missing from t3, a lane
that cannot see `ui/profile.js` reports the gender control deleted. All
arrived as blockers. This delta is ~1,045 lines, which is comfortably inside
what completes in one run, so scope it as one corpus:

```bash
git diff fe946fb...HEAD -- index.html core/ ui/ tests/ DOCTRINE.md CLAUDE.md 8BALL.md
```

Include the instruction that the diff is the complete corpus and that no
repository file is to be opened or echoed.

## Context the reviewer needs (do not make it go looking)

- **§1.D** — tier ladder `t1/t2/t3`, priced $1/$2/$3. t3 is the complete
  sheet, and since **v0.68** it also carries the two-person comparative.
- **§1.D v0.37** — sealed-DOM rule: a cell above the render tier holds
  `textContent === ''`. "Sealed" (unpaid) and "unresolvable" (paid but
  uncomputable, renders `—`) are different states and must not be conflated.
- **§4.B v0.56** — single-offer sprint presentation, live to 2026-08-08: the
  paywall carries exactly ONE purchase choice. **v0.62** — t1/t2 are not live
  storefront offers; both listings are unpublished.
- **§5 / §7 gate 7** — no analytics, no telemetry, permanently. The network
  primitives are banned in tracked source; `tests/privacy_scan.test.js`
  enforces it and scans `core/`.
- **§5.D** — `ui/share.js` imports nothing and knows no tier constant. This
  is deliberate and pinned; the measurement wiring had to route through a
  hook because of it.
- **§1.D v0.67** — the kua block is DELETED; the optional `gender` input is
  RETAINED and has NO reader.

## The five questions this delta actually turns on

Ranked by what would hurt most if wrong.

1. **Does the measurement contract leak anything, ever?**
   `core/measurement.js` builds `{event, tier}` from an object literal and
   `recordMeasurement` takes two positional values. **Try to find a call
   path that gets a third field, any PII, a timestamp, or anything that
   could join two records into a sequence, into an emitted record.** Also
   check the four call sites for a tier value that is not from
   `free|t1|t2|t3` — a raw `t4`/`t5` should build nothing rather than emit
   an unrecognised rung.

2. **Do the four call sites fire at the right moment, or merely exist?**
   Specifically: is `comparative_opened` after the entitlement gate (a
   refused tap must not count as an opened screen)? Is `share_completed`
   inside the native-share `try` after the `await` (a dismissed share sheet
   must not count as a share)? Is `reading_completed` reachable on every
   render path, and is it using the tier the sheet was actually sealed with
   rather than a second independent read?

3. **Is `tests/css_structure.test.js` sound, or does it have false
   negatives?** It strips comments and quoted strings, then scans selector
   preludes for `;` and trailing commas. **Try to construct a malformed
   stylesheet it would pass** — nested at-rules, `@supports`, a `}` inside
   a string it fails to strip, a prelude spanning a media boundary.

4. **Does the offer copy overclaim?** §2 forbids oracle register and any
   predictive/guidance/compatibility claim. The paywall now says "compare
   two people" and "the named relation between the two". **Does any new
   string promise a verdict about a pair rather than name a relation?**
   Check the CTA still carries exactly one dollar figure and one product URL.

5. **Is "does not affect your reading" actually true?** The claim ships on
   the form. It is held by a differential in `tests/profile.test.js` over
   two real `buildProfile` calls. **Find any path where `gender` reaches a
   coordinate, a catalog index, a note slot, the archive's recomputation, or
   the share artifact.** If one exists, the copy is a false statement to a
   user, which is the most serious defect available in this delta.

## Known-and-accepted, so do not report as findings

- **No collector exists.** The sink is null by default and nothing in the
  product installs one; a test pins that. This is deliberate — see
  `audits/measurement_plan_2026-08-06.md`.
- **The storefront listing still describes the single sheet.** Recorded in
  §1.D v0.68 and §4.B v0.69; the operator-ready copy is drafted at
  `audits/gumroad_listing_copy_2026-08-06.md` and deliberately unapplied.
  Store mutation is a controller action (§10).
- **The `gender` field still has no purpose on record.** §1.D v0.67 and
  §5 v0.69 both state the justification is vacant and leave it to the
  controller. A disclosure is not a purpose, and this delta does not claim
  it is.
- **No $1/$2 CTA was added.** Adding one would supersede §4.B v0.56
  mid-sprint and point at unpublished listings. Its absence is the intended
  state, pinned by existing tests.

## Verification already on record (re-check, don't re-derive)

- vitest **56 files / 1936 tests green**
- `audits/project_audit.py` **PASS 13 / 0 / 1 / 0**
- local PII audit **clean, 860 files**
- `index.html` **1474 / 1500**
- Browser pass at **320 / 390 / desktop**: no horizontal scroll at any
  width; all four measurement events observed firing live with correct
  tiers and no extra fields; the two CSS rules that the dangling comma had
  killed confirmed present in the live CSSOM, and confirmed absent when the
  pre-fix text is re-parsed.

**The claude relay lane cannot execute node or npm**, so a verdict from it
carries a live-green-run precondition. The runs above are the implementer's
own and are recorded here to satisfy it.

## Output wanted

Verdict (SAFE TO MERGE / MERGE WITH FIXES / DO NOT MERGE), then findings
ranked most severe first, each anchored to a `file:line` in the diff, each
with the concrete failure it allows and a suggested fix. Under 400 words.
If a finding cannot be anchored to the diff, do not report it.
