# 8ball — release checklist

> Read top to bottom every release. No skipping.

Pulled directly from `DOCTRINE.md §8`. This is the operational form of the same gates.

## Pre-merge

- [ ] **CI green.** All five stages pass: calc+pipeline, privacy scan, PII scan, dependency discipline, single-file rule. (Stage list aligned with `DOCTRINE.md §7` v0.10+.)
- [ ] **Local PII audit clean.** Run `bash audits/run_local_audit.sh` from repo root. Zero hits.
- [ ] **Diff review.** Read every line. Ask:
  - [ ] Any new private content batch cross §4 (slurs, protected classes, real-person targets, minor-targeting, card-content strings landing in tracked files)?
  - [ ] Any new path in `core/` cross §5 (storing or transmitting more than name + DOB)?
  - [ ] Any new tracked content cross §11 (operator personal data)?
  - [ ] Any new line cross §9 (SIRR cross-references, named depth)?
- [ ] **Cross-model audit (if applicable).** Doctrine changes or content batches go through ChatGPT or Codex per §10. Mechanical edits don't require it.
- [ ] **Single-file rule still holds.** `wc -l index.html` < 1500. (CI also checks this; verify locally if you're close.)

## Merge

- [ ] Merge to `main`.
- [ ] Confirm Netlify auto-deploy fires.
- [ ] Wait for build to finish (~30s).
- [ ] Open the live URL. Hard reload (Cmd+Shift+R) to bypass cache.

## Post-merge

- [ ] **Smoke test live.** Enter your real DOB. Shake 5 times. Verify no console errors. Verify the seven coordinates render correctly (element / sun sign / animal pair via `⇌` / numerology triplet) with the catalog corner in roman.
- [ ] **Append to `journal.md`.** Use the `===== YYYY-MM-DD · Title =====` shape. Document:
  - what shipped
  - what was rejected
  - what's deferred
  - any incident + remediation
- [ ] **Update `8BALL.md` if state changed.** Calc version, content version, doctrine version, blockers.

## If something fails

- CI red → fix the cause; do not bypass.
- Local audit red → fix per `audits/LOCAL_PII_AUDIT.md` "what to do if you find a leak" section.
- Live URL broken → roll back via Netlify dashboard (instant); diagnose offline.
- Deploy works but surface lands wrong → file a v0.2.x note in `journal.md`; no rollback needed for surface polish.
