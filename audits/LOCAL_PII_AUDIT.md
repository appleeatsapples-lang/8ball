# Local PII audit

> Run before every push to main. Five minutes. The CI cannot see your personal data; only you can.

The public `tests/pii_scan.test.js` catches the obvious classes (operator name, SIRR cross-references, labeled-DOB shapes). It cannot catch personal data the operator never told it about — DOB, home address, family names, ID numbers, etc. This audit closes that gap.

The two layers together:

1. **Public CI** (`pii_scan.test.js`) — runs on every PR; catches public-banned shapes.
2. **Local audit** (this doc) — runs on operator's machine before push; catches personal-data shapes only the operator knows.

If only one layer can run, the local one is more important.

## What you need

A file at `audits/local_personal_data.txt` containing patterns to grep for. **This file is gitignored** (see `.gitignore`). Format: one pattern per line. Lines starting with `#` are comments.

Example contents (illustrative — yours will differ):

```
# DOBs (your real DOB in any format you might write it)
[YYYY-MM-DD]
[YYYY/MM/DD]
[MM/DD/YYYY]

# Names
[partner's name]
[parent names]

# Locations
[street name]
[apartment number combinations]

# Identifiers
[last 4 of any government ID]
[phone number digits]
```

You author this file once. Update it when your patterns change.

**Pattern-class boundary:** this file should carry only patterns with ZERO
legitimate tracked occurrences (your DOB, addresses, family names, IDs). The
operator's own name/handle shapes belong to the PUBLIC scan's banned-pattern +
allow-list system — they appear legitimately in tracked content (the LICENSE
copyright line, `MUHAB.md` governance references), so a raw name-grep here
would false-fire on files the public scan deliberately allows. This audit has
no allow-list on purpose: a hit must always mean "remove it."

## How to run

From the repo root:

```bash
bash audits/run_local_audit.sh
```

The script:

1. Reads `audits/local_personal_data.txt`.
2. Greps every tracked file (excluding `node_modules`, `.git`, the data file itself, this doc, the script itself, and `tests/pii_scan.test.js`) for each pattern. The `pii_scan.test.js` exclusion mirrors the public scan's own `SKIP_FILES`: that file carries the banned patterns plus positive-fire sentinel strings that are leak-shaped by design, so scanning it produces false positives, not coverage. What is given up: a real personal-data paste into that ONE file would be caught by neither layer — accepted because leak-shaped content is the file's function, edits to it are already high-scrutiny, and the alternative failure mode (weakening sentinels to appease the grep) is strictly worse. Fragmenting the sentinel strings instead would not close the hole: the banned-pattern regex literals themselves carry the same tokens in plain source.
3. Reports any matches.
4. Exits 0 on clean, 1 on hits.

If hits are reported, fix them BEFORE pushing. Either:

- Remove the personal data from the leaking file (preferred).
- Replace with a synthetic value that exercises the same code path.
- If genuinely unavoidable, document the exception in `journal.md` and discuss with operator before merge. (No exceptions have been granted as of this writing.)

## Why this isn't automated in CI

The personal-data file is gitignored. CI machines don't have it. We deliberately keep that knowledge on the operator's local machine only. Automating the personal-data side would mean uploading personal data to GitHub Actions secrets, which defeats the privacy primitive in DOCTRINE.md §5.

The *trade-off:* an unsupervised contributor could push without running this. Mitigations:

- The `release_checklist.md` makes the audit a named step.
- The repo doesn't accept pull requests from external contributors as of v0.x; if that changes, the trade-off is re-evaluated.
- Public CI catches the obvious leak shapes regardless.

## What to do if you find a leak in already-pushed history

Already-pushed leaks are persistent. Treat as incident:

1. Stop. Do not push more changes that touch the affected file.
2. Identify the leak: file, line, commit hash, push date.
3. Decide on remediation:
   - **`git filter-repo`** (preferred for clean history rewrite) — `pip install git-filter-repo`, then a targeted invocation. Requires force-push, breaks anyone's local clones.
   - **Truncate the leaked value to placeholder + force-push** — same caveat.
   - **Rotate the leaked value** if it's a credential/identifier that can be invalidated and re-issued.
   - **Accept and move on** if the leak is low-impact and rewrite cost > leak cost.
4. Document the incident + remediation in `journal.md` under a `===== YYYY-MM-DD · INCIDENT · ... =====` entry.

## Versioning of this doc

If the audit procedure changes (new pattern classes, new layer, new tooling), update this file and bump a date below.

**Audit doc version:** 2026-07-01 · v0.3 — pattern-class boundary + given-up/fragmenting notes; "[your full real name]" removed from the example block (a full-name pattern false-fires on the LICENSE copyright line — name shapes are the public scan's job).
(prior: 2026-07-01 · v0.2 — local scan now skips `tests/pii_scan.test.js`, mirroring the public scan's `SKIP_FILES`; 2026-05-08 · v0.1)
