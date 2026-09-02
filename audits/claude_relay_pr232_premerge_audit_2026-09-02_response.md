# PR #232 pre-merge cross-model audit — reconciled response

**PR:** 8ball #232 — DOCTRINE v0.73: the moon sign — the sixteenth
coordinate (§1.K)
**Base → head:** `34e3d7b` → `2360a46` at audit start; every finding
lands in the reconciliation commit carrying this artifact — no
mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review — the
mandatory cross-model read for a DOCTRINE-touching PR; per-lane
subdirectories and port bands; both lanes worked from archives/clones
and left the working tree untouched.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 1 HIGH, 6 MED, 5 LOW, observations; 28 mutants, 21 killed |
| Lane B | MERGE WITH FIXES | 2 HIGH, 3 MED, 1 LOW; 12 mutants, 10 killed |

**Reconciled outcome: MERGE WITH FIXES — the astronomy and the product
behaviour held on both drives; the fixes were one repo-integrity
defect, one test-honesty gap and a cluster of quantitative truth
errors in text about to become constitution. All landed. Final call
remains with the controller per L48 (no advance authorization covered
this pass).**

## The astronomy, cleared by two independent derivations

Lane A re-typed Meeus Table 47.A from the book before reading the
module (validating its own table by reproducing the book's Σr and the
368409.7 km distance for 47.a), diffed it row-for-row against the
shipped array — zero coefficient mismatches, zero transposed
arguments, identical order — and matched the module bit-for-bit over
197,433 samples at 0.37-day steps across 1900–2100. Lane B wrote a
second implementation from the formulas with its own JD and its own
Intl-based offset resolver and reproduced all six fixtures exactly.
Both checked known syzygies against a Meeus ch. 25 solar longitude
(2024-04-08 and 2000-01-06 new moons; 2019-01-21, 2023-08-31, 2017-08-21
full moons and eclipses): every elongation residual ≤ 0.05°, consistent
with the low-precision solar series. Example 47.a reproduces at every
intermediate to the book's six decimals. E on |M| = 1, E² on |M| = 2;
the additive block is exactly 3958 sin A1 + 1962 sin(L′−F) + 318 sin A2
(A3 correctly unused). Same instant in two timezones → same sign,
2400/2400 over random instants including Pacific/Chatham and
Asia/Kolkata; southern-hemisphere DST, spring-forward gap and fall-back
ambiguity all deterministic.

## Findings and dispositions

**HIGH (both lanes) — a tracked `node_modules` symlink.** The commit
carried `node_modules` as a mode-120000 symlink to the absolute path
`/home/user/8ball/node_modules` — added by a broad `git add` in the
staging worktree, past `.gitignore`'s directory-only `node_modules/`.
A fresh checkout cannot run the suite; `npm ci` leaves the tree
permanently dirty; the auditor's `product.git_status` drops to WARN;
the file is published. On the author's own checkout the `reset
--hard` that moved the branch onto the commit replaced the real
directory with the link and the suite went silent until `npm ci`
restored it — the defect reproduced on the author before the fix.
**Landed:** removed from the index; a bare `node_modules` line added to
`.gitignore` so a symlink of that name can never be re-added; recorded
in the journal.

**HIGH (Lane B) / MED-3 (Lane A) — the ΔT bound was the Sun's order of
magnitude.** "ΔT < 70 s across 1900–2100 … < 0.001° of lunar motion":
70 s at the Moon's 0.49–0.63°/hour is ≈ 0.01°, and ΔT is ~70 s today
and projected near 200 s by 2100 (≈ 0.03°). Nothing bounds the moon's
input year, so the range framing was also loose. **Landed:** restated
in the module header, §1.K and the journal as ≈ 0.01° now, ≈ 0.03° at
the far end, about two minutes of clock at most; the nutation figure
(≤ 0.0048°, ~30 s) was correct and stands.

**MED-2 (Lane A) — the angle pin never exercised the shipping path.**
The fixtures' three-decimal longitude was checked on the bare series
with a JD the test built itself, while `computeMoon` — the only entry
`core/profile.js` calls — was asserted only at 30° granularity. A
mutant dropping the birth MINUTES rode 59/1991 green; the offset-sign
mutant was killed by only two of six cases; no fixture sat within 8.8°
of a cusp. **Landed:** `moonLongitudeFor(opts)` is the shipping parse →
offset → JD → series path and `computeMoon` maps it to a sign; the
fixtures pin the angle through it (and pin the bare series equal to it
at the same instant); two cusp cases sit one minute either side of
270° (2000-01-05 10:24 → sagittarius 269.998°, 10:25 → capricorn
270.006°) and the test requires at least two near-cusp cases on
opposite sides. Re-run: the minutes mutant fails 4 tests, the offset
sign 5.

**MED-4 (Lane A) — "the full 60-term series" is 59 rows.** The book's
60th row carries only a distance term and was correctly omitted; the
count claim was not true of the code. **Landed:** "the 59 non-zero
longitude rows of the 60-row Table 47.A" in the module, §1.K, the
footer, the test header and the journal.

**MED-5 (both) — the suite count.** 1982 was a pre-final run.
**Landed:** the reconciled head is 60 files / 2004 tests; restated in
the journal and the version list.

**MED-6 (Lane A) — `8BALL.md` did not move.** Three orientation
sentences still said fourteen compartments / the v5 registry.
**Landed:** dated §1.K markers appended (the file's own idiom).
**MED (Lane B)** the DOCTRINE `content version` / `content interaction
amendment` footer lines likewise — markers appended.

**MED-7 (Lane A) — the v0.73 footer entry omitted the merge-authority
sentence** every entry since v0.64 carries. **Landed:** appended. The
rotation itself was L17-clean (word-diff removes exactly one token
cluster, the prior→superseded relabel).

**LOW-8 (both) — `PROV_NOTE.moon` / `ATLAS_NOTE.moon` unpinned by
value** (a rising↔moon swap rode green). **Landed:** both pinned with
rising's counterparts and a uniqueness check.

**LOW-9 (Lane A) — the moon's unresolved copy unpinned.** **Landed:**
pinned; the copy now names the timezone the birthplace supplies ("birth
time and a birthplace, for its timezone").

**LOW-10 (both) — §4 immutability had no mechanical backstop,** and v5
is live through v6's star re-export. **Landed:**
`tests/content_immutability.test.js` (new) pins every shipped meanings
batch v1–v6 by SHA-256 and requires every `content/meanings.v*.js` on
disk to be listed; a v5 edit now fails.

**LOW-11 (Lane A)** DOCTRINE line 11's clause-family enumeration gains
the §1.K marker. **LOW-12** the MOON title carries `id="coord-moon-title"`.

**Observations, recorded not fixed:** `PUBLIC_TIER_SPEC.md` still says
fifteen (a superseded-era document); the twelve moon lines share the
family's 74-character prefix by design (36/36 lines unique across the
three families); pre-1911 LMT zones fail closed in parity with rising
(rising `null`, moon `undefined`, both the dash); the artifact was
absent at audit start by design and is this file.

## Verified clean (both lanes)

Fail-closed inputs live (DOB only → dash/unres; time without city →
dash; time + city → sign); legacy country payload resolves like rising;
MOON under WESTERN after SUN ↑ RISING on the host and both dyad sheets;
`CELL_KEYS` 15, strip "16 of 16"; the real share PNG through the
button: 9 rows, MOON in place, value present, group titles absent;
v6 re-exports v5 unedited (all exports identity-equal, context 14 → 15
by addition only), no v1–v5 file in the diff; all twelve moon lines
name "moon sign", unique, zero register hits, dignities correct
(domicile cancer · exaltation taurus · detriment capricorn · fall
scorpio); saved readings recompute (time+city → sign, no time → dash),
no new storage key; keyboard open, `aria-label`, DOM order; zero
console errors across every state and both mobile widths; CLAUDE.md
counts parse; `index.html` 645 lines; no runtime dep, no fetch.

## Reconciled verification (post-fix head)

- Suite 60 files / 2004 tests green; product audit PASS, 0 blocking;
  `git status` clean after `npm ci`.
- Mutation re-run on the fixed head: dropped minutes (4 fail), flipped
  offset sign (5), `PROV_NOTE.moon` → ascendant (1), `ATLAS_NOTE.moon`
  → rising sign (1), a v5 placement edit (1), the moon's unresolved
  copy deleted (1) — all killed.
- Gates: the `test` job's DOCTRINE-artifact leg and `l48-gate` were red
  by design until this artifact; this file satisfies both; journal-touch
  already passed.

qualifier: recorded, not certified. Merge authority remains the controller's.
