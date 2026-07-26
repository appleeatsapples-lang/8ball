# Codex pre-merge audit — PR #129 response — filed 2026-07-26

Relay run: `~/ai-relay/runs/20260726-050533-8ball` (codex reviewer,
read-only sandbox, xhigh reasoning; claude reconciler seat ACTIVE this
run — the first two-leg run since the seat re-auth, and the
reconciliation independently reproduced F1 before accepting it).
Brief: `audits/codex_pr129_premerge_audit_2026-07-26_brief.md`.
Dispositions appended below the verbatim verdict and reconciliation;
each finding carries a named action per the L48 record discipline.

---

## Verbatim verdict (codex reviewer)

Verdict: MERGE WITH FIXES

| # | Sev | Finding | Evidence |
|---|---|---|---|
| 1 | Med | `rowSections` still trusts inherited/accessor properties. A malformed cell can inherit `state: 'open'`, smuggling a paid value into both SVG and caption. Require plain cells with own data properties and add an end-to-end adversarial pin. | `ui/share.js:186-188`; reproducer returned `{"state":"open","value":"PROTO_SECRET"}`, `svgLeak:true`, `captionLeak:true`. |
| 2 | Med | The brief/journal claim L48 is RED until a response lands, but the current regex accepts the PR brief itself. This permits merge without an independent verdict. Commit the response before merge and correct the staged claims; gate tightening remains necessary. | `audits/codex_pr129_premerge_audit_2026-07-26_brief.md:31-32,99-103`; `journal.md:10`; actual gate: `pass` on the brief, response count `0`. |

Commands/results (as reported):

```text
git diff --name-status origin/main...HEAD
# exact seven claimed files; protected-path diff exit 0; git diff --check clean

# Base/HEAD Node harness: main leaked missing/unknown/unres values; HEAD
# closed all four staged cases. Trailing/numeric/object/sealed/nested
# cases closed; prototype/accessor cases leaked. Well-formed
# snapshot/SVG/caption byte comparisons all true.

npx vitest run ... tests/share_surface.test.js tests/share_behavior.test.js
# 2 files, 66/66 passed

node ... vitest.mjs run ...
# 40 files, 1432/1432 passed (plain invocation blocked by sandbox temp writes)

# Privacy/PII suites 22/22; /bin/bash audits/run_local_audit.sh clean, 245 files
# git merge-base origin/main origin/claude/test-coverage-analysis-27tc7k → 7cd0947…
# arithmetic → 61.8%, 98.6%
# Append checks: both errata records pure appends; PR126 disposition text
# preserved; journal prior tail unchanged; index.html 1401 lines.
```

What others may miss (verbatim): green advertised pins conceal both the
prototype-chain privacy bypass and the still-false-green L48 predicate.

## Reconciliation (claude reconciler — verbatim verdict section)

FINAL MERGED VERDICT: **MERGE WITH FIXES.** The core fail-closed fix is
sound for the whitelisted state values and is well-pinned (4 adversarial
cases, full suite green, PII/privacy clean, journal/errata integrity
verified), but it doesn't yet cover the prototype/accessor injection
path — a real gap in the exact guarantee (§5.D) this PR exists to
enforce, so it should be closed in this same fix cycle rather than
deferred. Separately, file the `_response.md` for PR #129 before merging
(satisfying L48 by the letter CLAUDE.md itself defines), and open a
follow-up to tighten the L48 regex so a brief alone can never look
green. The reconciler independently verified F1 by direct reproduction
(inherited `state:'open'` + own `value` → `svgLeak:true`,
`captionLeak:true`) and corroborated F2 from the filesystem (only the
`_brief.md` on-branch at review time).

---

## Dispositions (orchestrator, same session, pre-merge)

**F1 (Med) — prototype/accessor bypass. ABSORBED IN-PR, same session.**
`rowSections` now reads `state` and `value` exclusively as OWN DATA
properties: `Object.getOwnPropertyDescriptor` with a data descriptor
required, so inherited properties and getter-backed properties are both
excluded — and a getter is never invoked. A fifth adversarial pin
covers the reconciler's reproduction plus two harder shapes
(getter-backed cell; own-value-with-inherited-state), asserted
end-to-end through `buildCardSVGFromSnapshot` AND
`buildCaptionFromSnapshot`, not just the snapshot. Reproducer re-run
post-fix: every shape seals; no leak. Scope bound, on record: a
same-realm hostile Proxy can forge descriptors — §5.D's guarantee
targets malformed or buggy snapshot data, not an attacker already
executing in the page, whose DOM access is total regardless.

**F2 (Med) — gate passed on the brief; staged claims said RED. SPLIT:
absorbed here + already-queued.** (a) THIS artifact is committed
on-branch pre-merge, satisfying L48 by CLAUDE.md's letter independent
of the loose regex; the journal entry's Status line and Pins/absorb
paragraphs were corrected in place pre-merge (the brief file itself
stays as filed — packet corrections live in dispositions per the #127
precedent). (b) The regex tightening (accept only
`*_premerge_audit_*_response.md` / `L48_override_*` shapes) remains the
queued follow-up CI PR first staged by the #126 audit — now
corroborated by both legs of this run; its own word.

**Process note, for the ledger.** Merge words for this PR arrived twice
before the verdict landed; the hold protocol held both times, an
override artifact was considered and NOT created (the harness safety
layer declined it and the decision went back to the controller), and
the verdict landed first. The verdict-before-merge sequence was kept;
no L48 sighting accrues from this cycle.

Merge remains gated on the controller's word (L48), fresh and
post-verdict. This artifact plus the in-PR brief constitute the
cross-model audit record for PR #129.
