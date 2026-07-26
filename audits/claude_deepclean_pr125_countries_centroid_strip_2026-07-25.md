# PR-C — countries centroid strip + F3/F4 resolutions (deep-clean) — 2026-07-25

**Lane:** Claude chat (orchestrator, DC shell) · **Word:** operator "ALL" on
`8ball_deepclean_packet_2026-07-25.md`. Change developed and suite-validated
in an isolated clone first, then re-applied and re-validated on the
operator's machine: **1370/1370** both runs (baseline 1369; +1 keyset-parity
test).

## F5 — SHIPPED: legacy centroid strip
- `core/countries.js`: `defaultLat`/`defaultLng` removed from all 276 rows
  (48.4KB → 37.6KB shipped to every visitor). No production codepath ever
  read them (per the #78 annotation itself).
- Coverage carried forward per that annotation's own condition:
  `tests/country_centroids.fixture.json` (extracted verbatim from the
  pre-strip rows), `tests/countries.test.js` rewired to it, plus a new
  fixture↔COUNTRIES keyset-parity test.
- **Supersession note:** #78 chose annotate-and-keep; operator word
  2026-07-25 supersedes with strip-and-carry-forward.

## F3 — RESOLVED AS KEEP: content v1→v2 shims
`content/concordance.v2.js` and `content/meanings.v2.js` re-export from v1.
DOCTRINE §4 ("versioned, not edited — new release = new file") makes the
seam intentional, and `audits/protect_immutable_content.js` guards the
pattern. Flattening would trade doctrine compliance for two files. Kept;
recorded here so the question doesn't reopen.

## F4 — RESOLVED AS KEEP: three city test files
Not duplication. Documented distinct scopes in each header:
`cities.test.js` = data-quality contract for assets/cities.json;
`cities_search.test.js` = behavioral coverage for core/cities.js;
`citysearch.test.js` = ui/citysearch.js DI shape + behavior (§6 v0.23
split). Deliberate separation; kept; recorded.

## F6 — FALSE POSITIVE, closed
The packet flagged journal.md tail-ordering. On read: the journal is
newest-first by convention (2026-07-25 entries at top, May at bottom). No
defect, no erratum.

## L48
Codex pre-merge verdict pending via operator relay. This artifact satisfies
the gate; it is not a self-certification.
