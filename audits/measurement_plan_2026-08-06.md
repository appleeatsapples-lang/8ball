# Measurement plan — four events, no collector

**Date:** 2026-08-06
**Status:** contract shipped, collector NOT shipped and not proposed here.
**Governing law:** DOCTRINE §5 (privacy primitive), §5 v0.70 (this contract),
§7 gate 7 (no third-party / client telemetry, permanently).

## The short version

The product now names exactly four things it would ever want to count, and
fixes the shape a count may take. It counts none of them anywhere. There is
no collector, no storage, no network call, and no identity. `core/measurement.js`
holds the contract and one injectable local sink whose default is `null`.

This is deliberate. Writing the contract is cheap, reversible and testable.
Adopting a collector is a §5 amendment, a disclosure change, and a decision
about what the product is — and it is the controller's, not an agent's.

## The four events

| event | fires when | why it is worth counting |
|---|---|---|
| `reading_completed` | a card render finishes | the denominator. Without it every other number is a rate with no base. |
| `paid_t3_cta_clicked` | the $3 CTA in the paywall is tapped | separates "nobody sees the offer" from "everybody sees it and declines". These are opposite problems with opposite fixes. |
| `comparative_opened` | the two-person screen is opened | the comparative just became half of what $3 buys. If it is never opened, the offer is mispriced against its own contents. |
| `share_completed` | a share or download of the sheet PNG finishes | the only reach signal the product can observe at all without tracking anyone. |

The list is CLOSED. A fifth event is a doctrine amendment, not an edit.

## The payload, and what it cannot carry

A record is exactly two fields:

```js
{ event: 'reading_completed', tier: 'free' }
```

- `event` — one of the four names above. Anything else builds nothing.
- `tier` — one of `free` / `t1` / `t2` / `t3`. Device density, which is the
  entire question these events exist to answer, and already the whole of what
  `eight_ball_tier_v1` stores. It says which rung a browser owns; it says
  nothing about a person.

Nothing else is representable. The record is built from a two-key object
literal, not filtered down from the caller's object, so a name, a DOB, a
gender, a city, a coordinate value or a card string cannot reach it even if
a call site passes one in. That is the difference between a rule and a
mechanism, and it is why the shape is built rather than sanitized.

Explicitly absent, and each for a reason:

- **no name, DOB, gender, city, birth time** — the §5 boundary; these never
  leave the browser at all.
- **no coordinate or card value** — a sun sign plus a life path plus a
  catalog numeral is a near-identifier, and the sealed-value rule (§1.D
  v0.37) exists precisely to keep paid values out of places they don't belong.
- **no id, session token, device token or counter** — nothing that can join
  two records into a sequence, which is the line between counting events and
  tracking a person.
- **no timestamp** — a timestamp is a join key. Ordering is not needed to
  answer any of the four questions above.
- **no URL, referrer, user agent, screen size or locale** — a fingerprint
  assembled from "harmless" fields is still a fingerprint.

## Where it fires

Four call sites, one per event, each at the moment the thing actually
happened rather than at the moment it was requested:

| event | site |
|---|---|
| `reading_completed` | `index.html` `renderCard`, after the render completes |
| `paid_t3_cta_clicked` | `ui/payments.js` `initPaywallUI`, on the CTA anchor |
| `comparative_opened` | `ui/dyad.js`, after the entitlement gate passes |
| `share_completed` | `ui/share.js` `onShare`, after the artifact is delivered |

Each is proven by a test that installs a recording sink and drives the real
path, then asserts the event name, the tier, and that the record has exactly
two keys.

## What would have to be true to adopt a collector

Recorded so the next person does not have to reconstruct the argument.

1. **A §5 amendment**, because §5's "No analytics" is literal and §7 gate 7
   says "permanently". The amendment has to say what is collected, where it
   goes, who can read it, and how long it lives.
2. **A first-party, server-side path — or nothing.** §5 v0.35 already
   distinguishes host request logs from telemetry: logs are produced by the
   host, not by tracked source, and the product injects nothing. Any adopted
   measurement should stay on that side of the line. `fetch`, `XMLHttpRequest`
   and `navigator.sendBeacon` stay banned in tracked source and
   `tests/privacy_scan.test.js` keeps enforcing that.
3. **A disclosure change in the about modal**, before merge, not after.
4. **A reason the existing signals are not enough.** They may well be. The
   netlify.toml channel routes (`/r` `/x` `/ig` `/tt` `/pin`) already give
   channel attribution from first-party server logs with no client event at
   all, and the storefront dashboard already gives purchase counts. Between
   them, three of the four questions above have a partial answer today
   without collecting anything.

## The honest read on whether this is worth pursuing

The standing strategic finding on record is that reach — not conversion — is
the binding constraint, by roughly two orders of magnitude. Measurement
sharpens conversion decisions. At current volumes the four counters above
would mostly produce small integers with wide error bars, and a decision
taken on them would be a decision taken on noise.

So: the contract is worth having now, because it is what stops an
ad-hoc analytics snippet from being pasted in later under deadline. The
collector is not worth having until reach moves. This plan recommends
holding at contract-only, and revisiting when the denominator is large
enough for a rate to mean something.
