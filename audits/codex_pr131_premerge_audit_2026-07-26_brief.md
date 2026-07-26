# CODEX PRE-MERGE AUDIT PACKET — PR #131 (l48-gate tightening: response/override shapes only) — 2026-07-26

## Who you are and what this is
You are an independent pre-merge auditor for PR #131 of the 8ball
repository (local checkout: ~/dev/8ball, branch
`claude/l48-gate-response-only`, base origin/main @ 437a101).
This PR changes ONE thing: the artifact predicate inside the
`l48-gate` CI job (`.github/workflows/ci.yml`), plus the journal entry
and the in-PR L48 artifacts. No app code, no tests, no docs beyond
those.

Rules that bind this audit:
- A PR may not merge until an auditor who did not write it returns a
  verdict. You are that auditor; re-derive every claim yourself.
- READ-ONLY lane plus test runs. No edits, commits, pushes, or fixes.
- Do not create branches; leave the checkout exactly as found.

## Context (why this PR exists)
The l48-gate's old predicate `^audits/[^/]*pr<N>[^0-9][^/]*\.md$`
accepted ANY audits file naming the PR. Two live false-greens are on
record: #126 audit F1 (a 100%-similarity renamed session record
satisfied it) and #129 audit F2 (the pre-verdict brief alone satisfied
it — confirmed by both relay legs). CLAUDE.md's gate letter has always
documented the tight requirement (verdict response or explicit
override); the implementation was looser. This PR makes the regex match
the documented letter. The controller worded it ("gate tightening").

## What the PR claims
- New predicate (only the artifact check changed):
  `^audits/([a-z0-9_]+_pr<N>_premerge_audit_[0-9]{4}-[0-9]{2}-[0-9]{2}_response|L48_override_pr<N>_[0-9]{4}-[0-9]{2}-[0-9]{2})\.md$`
  applied to the PR's changed files; matched artifact echoed to the
  log; error text now states a brief alone does not satisfy the gate.
- Docs-only exemption logic, the journal-touch job, `needs:`-lessness,
  and everything else in ci.yml: byte-untouched.
- Local harness (exact grep line): brief-only RED; brief+response
  GREEN; override-only GREEN; renamed-record shape RED; wrong-PR
  response RED; pr-number boundary (pr1290 vs pr129) RED; response
  among code files GREEN; any lowercase model token GREEN.
- Historical sweep: every `*_premerge_audit_*_response.md` on disk
  (#92 → #129) matches its own PR number under the new predicate; the
  only excluded shapes are the #103 retroactive record, the #94/#95
  crosscheck, and the pre-gate-era #93 record — none of which should
  self-satisfy a PRE-merge gate.
- Self-test: this PR is not docs-only (.yml changed), so its own
  l48-gate runs the TIGHTENED predicate — RED on the brief-only head,
  GREEN once `audits/codex_pr131_premerge_audit_2026-07-26_response.md`
  lands. The red-then-green check-run sequence is in-PR evidence.
- Suite unaffected: 40 files / 1433 tests (nothing executes workflow
  YAML).

## Adversarial checklist
1. DIFF PERIMETER. `git diff --name-status origin/main...HEAD` — exactly
   `.github/workflows/ci.yml`, `journal.md`, and the pr131 brief (later
   + response). Any other file is a finding.
2. PREDICATE CORRECTNESS. Re-derive the regex yourself. Try to construct
   a filename that SHOULD pass and doesn't (legit model tokens with
   digits/underscores; valid dates), and one that SHOULDN'T pass and
   does (briefs; `_response.md` embedded in a longer name; uppercase
   smuggling; `pr13` vs `pr131` and `pr1310` boundaries; a path like
   `audits/sub/..._response.md`; date-shaped garbage `9999-99-99` — the
   shape check is deliberately syntactic, judge whether that is
   acceptable for this gate's purpose). Check the `$CHANGED` source
   (diff BASE...HEAD) — can a file already on main (e.g. an OLD PR's
   response) ever satisfy the gate for a new PR? Check quoting: `${PR}`
   comes from `github.event.pull_request.number` (numeric) —
   interpolation-injection surface, if any.
3. BEHAVIOR PRESERVATION. Byte-diff the rest of ci.yml against main —
   docs-only exemption, journal-touch job, test job, and the no-`needs:`
   property must be unchanged. Confirm the workflow parses (actionlint
   or careful YAML read).
4. SELF-TEST EVIDENCE. `gh pr checks 131` / check-run history: l48-gate
   FAILURE on the brief-only commit, SUCCESS only after the response
   commit. If the red leg never happened, the acceptance test is
   unproven — say so.
5. HISTORICAL SWEEP. Re-run the sweep yourself over audits/ and confirm
   the claims, including that #131's own response (once present)
   matches.
6. JOURNAL TRUTH + SCANS. Entry claims match the diff; newest-at-top;
   tracker lines untouched. `npm test` → 40 files / 1433 tests;
   `/bin/bash audits/run_local_audit.sh` if the pattern file exists.
7. GATE-CIRCUMVENTION HUNT. With the new predicate, enumerate what
   still greens the gate WITHOUT an independent verdict: a self-authored
   file named `*_response.md` (content unchecked), an override file
   anyone can commit. Name these residual holes explicitly and judge
   whether they are acceptable (the gate checks shape, not provenance —
   provenance stays a human-lane law) or need a follow-up.

## Required output shape (so the verdict files cleanly)
- Line 1: `Verdict: MERGE` | `MERGE WITH FIXES` | `NO-GO`
- Findings table: # | High/Med/Low | finding | evidence (file:line/output)
- Then: the exact commands you ran and what they returned.
Zero findings is acceptable only after you actually ran the checks.
