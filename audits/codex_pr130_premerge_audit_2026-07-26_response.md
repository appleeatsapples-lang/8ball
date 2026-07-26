Verdict: MERGE WITH FIXES

| # | Severity | finding | evidence |
|---|---|---|---|
| 1 | Med | The buyer-facing story is internally inconsistent. The paywall deliberately offers one complete `$3` purchase, but About still tells a current visitor that “one, two, or three dollars” opens one of “three paid rungs.” Keeping t1/t2 products and returns alive makes old ownership valid; it does not make those hidden choices available from the current purchase surface. The regression test actively pins the contradiction. Rewrite About so the sprint’s current choice is unambiguous (`$3` complete sheet) while existing/lower-rung ownership remains explicitly honored; re-pin the disclosure test. | `index.html:968,970` versus `index.html:993-1004`; `tests/payments_markup.test.js:460-462`. |
| 2 | Med | The current-state journal entry was not closed over the real PR lifecycle. It says base `969e912`, “PR to open,” and that the audit brief will be filed, while PR #130 is already open, its brief is filed, and the branch was merged forward to current `origin/main` `b459fdab…`. The journal is a canonical state surface, so this is operationally false, not cosmetic. Update the top entry to name PR #130, current base/head, filed brief, green CI, and the active Codex disposition/fix state. Preserve the issued audit brief as provenance; the response can record the corrected base. | `journal.md:10-14,89-91`; `gh pr view 130`: base `b459fdab51390f5a8162fafecb1e6119d0cda4e6`, head `3d05520ed1b6ac337c1fbdf4f51aa036554dd90c`, OPEN, checks green. |
| 3 | Med | The approved Reddit operating exception is contradictory on disk. §5.1.a authorizes a labeled sprint post with `/r` and supplies Reddit rules, but says it is only a Carnaval carve-out; §5.3 still absolutely forbids product links until an explicit lift. Reconcile this before any packet is prepared: during the dated window, narrowly supersede the §5.3 product-link hold only for an already clean-posted community whose current rules explicitly permit owner-disclosed promotion; retain the first-time/new-sub hold and immediate stop-on-moderation rule. Publishing remains operator-only. | `~/8ball/APPROACH.md:181-195` versus `~/8ball/APPROACH.md:207-215`. |
| 4 | Low | The sprint expiry is a law/date, not a runtime mechanism. The deployed one-offer markup will not restore the ladder by itself after 2026-08-08. Add an explicit dated closeout gate naming the operator-owned action: renew deliberately or ship the mechanical restoration by the end of the window. Do not describe the product UI as self-reverting. | `DOCTRINE.md` §4.B v0.56 says the presentation “lapses” and restoration is mechanical; the diff adds no date gate or scheduled runtime/deploy behavior. |
| 5 | Low | Two comments in byte-untouched `ui/payments.js` describe retired presentation facts: the lock icon is no longer the only paywall trigger, and the live modal no longer has three ladder CTAs. This does not change behavior and should not be allowed to widen the protected entitlement diff during this fix cycle; record it as documentation debt or correct it only in a separately justified comment-only cycle. | `ui/payments.js:24-25,164-167`; actual shared trigger at `index.html:1374-1389`. |

Required disposition before merge:

1. Fix findings 1–3 in their respective owner surfaces and re-run the full suite/browser checks.
2. Close finding 4 with a dated, owner-named restoration/renewal gate.
3. Leave finding 5 non-blocking if maintaining an empty `ui/` diff is the higher-order invariant; name the carry explicitly.
4. File this response at `audits/codex_pr130_premerge_audit_2026-07-26_response.md`. Re-audit the resulting delta before merge.

Independent checks and returned output

```text
$ git rev-parse HEAD
3d05520ed1b6ac337c1fbdf4f51aa036554dd90c

$ git rev-parse origin/main
b459fdab51390f5a8162fafecb1e6119d0cda4e6

$ git diff --check origin/main...HEAD
[no output; exit 0]

$ git diff --quiet origin/main...HEAD -- core ui content tests/fixtures.json; echo $?
0

$ git diff --quiet origin/main...HEAD -- tests/privacy_scan.test.js tests/pii_scan.test.js; echo $?
0

$ wc -l index.html
1465 index.html

$ find tests -maxdepth 1 -name '*.test.js' | wc -l
41

$ git diff -U0 origin/main...HEAD -- '*.js' '*.html' | rg '^\+.*(fetch\(|XMLHttpRequest|sendBeacon)'
[no output]

$ npm test
Test Files  41 passed (41)
Tests       1438 passed (1438)
Duration    2.75s

$ [read-only equivalent of audits/run_local_audit.sh using the operator pattern file from the primary checkout]
LOCAL PII AUDIT: clean (246 files scanned using operator pattern file)

$ for route in r x ig tt pin; do curl -sS -o /dev/null -w "/$route %{http_code} %{content_type} %{url_effective}\n" "https://deploy-preview-130--the-eight-ball.netlify.app/$route"; done
/r 200 text/html; charset=UTF-8 https://deploy-preview-130--the-eight-ball.netlify.app/r
/x 200 text/html; charset=UTF-8 https://deploy-preview-130--the-eight-ball.netlify.app/x
/ig 200 text/html; charset=UTF-8 https://deploy-preview-130--the-eight-ball.netlify.app/ig
/tt 200 text/html; charset=UTF-8 https://deploy-preview-130--the-eight-ball.netlify.app/tt
/pin 200 text/html; charset=UTF-8 https://deploy-preview-130--the-eight-ball.netlify.app/pin

$ for tier in t1 t2; do curl -sS -o /dev/null -w "/?paid=$tier %{http_code} %{content_type} %{url_effective}\n" "https://deploy-preview-130--the-eight-ball.netlify.app/?paid=$tier"; done
/?paid=t1 200 text/html; charset=UTF-8 https://deploy-preview-130--the-eight-ball.netlify.app/?paid=t1
/?paid=t2 200 text/html; charset=UTF-8 https://deploy-preview-130--the-eight-ball.netlify.app/?paid=t2

$ gh pr view 130 --json state,isDraft,mergeable,headRefOid,baseRefOid,statusCheckRollup
state=OPEN; isDraft=false; mergeable=MERGEABLE
head=3d05520ed1b6ac337c1fbdf4f51aa036554dd90c
base=b459fdab51390f5a8162fafecb1e6119d0cda4e6
ci/test=SUCCESS; ci/l48-gate=SUCCESS; Netlify redirect/header/deploy-preview=SUCCESS
```

Browser verification on the Netlify deploy preview:

- Cold promise renders: `name + birth data in. one fixed identity sheet out`.
- A free visitor renders `5 of 15 coordinates open · 10 sealed at paid tiers`; the visitor’s own written entry nodes remain empty.
- The paywall title is `complete 8ball · $3 once`, with exactly one current Gumroad purchase link (`xjpvp`) and a collapsed fixed example.
- The fixed example is populated from `CARDS.aries.dragon`; `/cards/spec_no-v.jpg` loads; the preview and paywall are outside `#card-face`, so the share snapshot cannot serialize them.
- Desktop paywall content is scrollable and dismissible; no layout blocker observed.

Audit conclusion: checkout, entitlement compatibility, privacy, sealed-value isolation, first-party routing, and test/count claims pass. The three Medium findings are truth/control-plane defects that should be corrected before the commercial change ships.
