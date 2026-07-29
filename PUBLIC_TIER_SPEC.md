# PUBLIC_TIER_SPEC.md — public-tier computation

> Spec for `core/public.js` + `content/public.v1.js`. Engine and tables only.
> No surface, no price, no entitlement. Not doctrine: this file describes what
> was built and names what a controller has to decide before any of it is
> shown to anyone. Where it touches ground the constitution already covers,
> `DOCTRINE.md` wins.

Written 2026-07-29 against `main` @ `6f3ebdc` (calc v3.1, doctrine v0.57).

## §0. Position, and what could not be read

The tier brief describes a ladder restructured to **exposure radius** rather
than coordinate density — private (you alone) · comparative (you and one) ·
public (you and the world, work as its legible instance) — and puts this
engine at the public rung.

**That restructure is not recorded in any tracked file in this repository.**
`DOCTRINE.md` §1.D still describes a three-rung *density* ladder repriced to
$1 / $2 / $3 on 2026-07-26 (§1.D v0.55), with the §4.B v0.56 sprint
presenting a single $3 offer through 2026-08-08. The brief's per-rung prices
($3 / $6 / $9) and its radius framing contradict that on their face. The
brief also named four operator-local reading sources — a personal context
file, an approach document, a sibling development checkout, and the newest
session handoff — **none of which exist in this container**, which carries a
fresh clone of this repository and nothing else. Everything below was derived
from what is on disk here: `8BALL.md`, `DOCTRINE.md`, `journal.md`,
`CLAUDE.md`, and the shipped modules.

The consequence is stated rather than smoothed over: this engine implements
the brief's *computation* faithfully, and takes **no position** on the ladder,
the price, the param name, or which rung sells it. Reconciling the radius
ladder with §1.D is a doctrine amendment under §10 cross-model review, and is
deliberately not attempted here.

## §1. What this computes

From a birth **date** alone: three ranked domain families, one anti-fit
family, and one shape-of-role line.

The four inputs to that output, in order:

1. **Day master element + strength** → favourable / unfavourable elements
2. **Favourable element** → the domain families in play
3. **Expression number** → the mode of work, which ranks them
4. **Tarot birth card** → the role posture

Steps 1–2 produce the families and the anti-fit. Steps 3–4 produce the role
line, and step 3 also supplies the ranking used in step 2. Every value is a
lookup or an integer reduction over frozen tables. There is no model call at
runtime, no network, no storage, no clock, and no randomness —
`tests/public.test.js` pins all five by scanning the module source.

## §2. Input contract

```js
buildPublicReading('1984-02-02')                     // date only
buildPublicReading('1984-02-02', { time: '07:30' })  // byte-identical output
```

- **Date only.** `YYYY-MM-DD`. The day master derives from the day pillar,
  which is date-only, so no birth time is required and none is asked for.
- **Hour accepted, unused.** `opts.time` and `opts.hour` are accepted without
  error and never read. A date + hour call returns output byte-identical to
  the same date alone. This is not an oversight to be fixed later by
  accident — an hour-aware strength refinement is §6 open question 3, and
  would be a versioned change with its own fixtures.
- **No name.** The function takes no name parameter and no name appears in
  its output. The public tier needs a date and nothing else that identifies
  anybody.
- **Validation.** Malformed strings and impossible dates (`2001-02-29`,
  `2000-04-31`) throw with the same two messages `buildProfile` throws.
  The validator is a deliberate second implementation rather than an import,
  so this tier does not touch the shipped calculation core; the fork is
  pinned against drift by a differential test that asserts both accept and
  reject exactly the same dates.

## §3. Computation

### §3.1 Day master and strength

The **day master** is the heavenly stem of the day pillar, read straight off
the shipped `core/pillars.js` (`getDayPillar`), whose offsets are calibrated
against three authoritative 万年历 day pillars spanning 58 years. Its element
is the element the whole reading is keyed on; polarity follows stem parity.

The **season** is the month-pillar branch, read off the shipped solar-term
path `getInnerAnimal` (calc v3.1, era-correct cusps). Its element comes from
`BRANCH_ELEMENTS` — the twelve branches with the four earth months closing
the seasons.

**Strength** is the classical five-state read of the day master against the
season element (旺相休囚死), collapsed to two values:

| state | relation | strength |
|---|---|---|
| 旺 wang | season shares the day master's element | strong |
| 相 xiang | season generates the day master | strong |
| 休 xiu | day master generates the season | weak |
| 囚 qiu | day master controls the season | weak |
| 死 si | season controls the day master | weak |

Exactly one state holds for any ordered pair of elements, so the resolution is
total — no default branch, no unreachable input. **Named limit:** this is the
seasonal-state model, month branch only. A full BaZi strength read weighs
roots, hidden stems and the rest of the chart. That is a deliberate
simplification for a date-only tier, and it is the single largest place where
a practitioner would disagree with the output. See §6 open question 3.

### §3.2 Favourability — 10 entries

`ELEMENT_FAVORABILITY`, keyed `<element>_<strength>` — five elements × two
strengths. Ranked, authored, and checkable: the convention is the standard
yongshen read, and `tests/public.test.js` re-derives all ten entries from the
sheng/ke cycles rather than trusting the table's word.

- **strong** → favourable `[output, wealth, officer]`, unfavourable
  `[resource, peer]` — a day master its season already carries opens onto
  what draws it out, spends it, and bounds it.
- **weak** → favourable `[resource, peer]`, unfavourable
  `[officer, output, wealth]` — a day master its season does not carry opens
  onto what feeds and joins it.

`favorable[0]` selects the fit families; `unfavorable[0]` selects the anti-fit.
The two are always different elements, which is what makes the anti-fit
structurally incapable of colliding with a fit family (§3.5).

The sheng and ke cycles are **not redefined** for this tier — they are
imported from the immutable `content/concordance.v1.js`, the same reuse
`content/concordance.v2.js` performs. One wuxing table in the repo.

### §3.3 Domain families — 5 × 3

The families named in the brief, keyed by element, each carrying one of three
**characters**:

| element | origination | transmission | stewardship |
|---|---|---|---|
| wood | growth | teaching | health |
| fire | tech | media | energy |
| earth | construction | advisory | property |
| metal | engineering | law | finance |
| water | trade | communication | logistics |

- *origination* — the family makes the thing that was not there
- *transmission* — the family carries it between parties
- *stewardship* — the family holds and runs it once it exists

One family per character per element is load-bearing, not decorative: it makes
the ranking a total order with no tie-break and no positional bias, and it
makes the anti-fit selection single-valued.

### §3.4 Expression number and mode — 9 entries

The expression number is the digit sum of the date, reduced by repeated digit
sum to exactly `1..9` — no master stop. The domain is nine values, nine modes.

**This was eleven, and a controller ruling on 2026-07-29 collapsed it.** The
first draft retained the 11 and 22 stops because the brief specified eleven
modes; DOCTRINE §1.B v0.54 (calc v3) fixed active Pythagorean numerology at
exactly nine terminal values, and the constitution won. Recorded here rather
than quietly re-specified: the brief was overruled, not misread.

**The consequence is that this number is the life path.** A date digit sum
reduced strictly to 1..9 is the same sum under the same reduction that
`core/profile.js` already ships as `lifePath`, free-surface since §1.D v0.38.
So the tier no longer computes a distinct number, and it does not
reimplement one: `getExpressionSum` and `getExpressionNumber` delegate to
`getLifePathSum` / `getLifePath`, with a test pinning the delegation across
the date range. A private copy of an identical rule is the drift risk
`core/math.js`'s header names, and this tier does not take it.

Each mode carries a `theme`, a `register`, a `method` (the second clause of
the role line), and a `priority` — a permutation of the three characters.
`priority[0]` takes rank 1 among the fit families; `priority[2]` selects the
anti-fit. All six permutations are still used across the nine modes.

Themes are the same nine-term vocabulary `content/meanings.v2.js` already
ships (pinned by a cross-check test), so the tier introduces no numerology
vocabulary of its own.

### §3.5 Ranking, anti-fit, role posture, role line

- **Fit families** — the three families of `favorable[0]`, sorted by the
  mode's `priority`, returned with explicit `rank: 1|2|3`.
- **Anti-fit** — from `unfavorable[0]`, the family whose character is
  `priority[2]`. Because the fit element and the anti-fit element are always
  different and families never cross elements, the anti-fit can never be a
  fit family. This is a structural property, and it is also tested directly
  across every element × mode combination and across the whole date range.
- **Role posture** — one of 22 entries indexed by the major-arcana number the
  shipped `core/birthcard.js` computes. A posture is a way a role is held,
  never an identity claim about a person.
- **Role line** — a join of exactly two table fields:
  `` `${posture.stance}, ${mode.method}.` ``. Nothing is generated; no
  adjective is computed. For `2000-01-01`: *"a role held as the setting of
  order, worked to a plan, in fixed stages."*

## §4. Output contract

`buildPublicReading` returns a plain object with these keys, in this order:

| field | shape |
|---|---|
| `dob` | `{ year, month, day }` |
| `dayMaster` | `{ stem, polarity, element, branchAnimal }` |
| `season` | `{ monthAnimal, element, state, stateHan, stateLabel, relation }` |
| `strength` | `'strong' \| 'weak'` |
| `favorable` / `unfavorable` | ranked element arrays, together always all five |
| `primaryFavorable` / `primaryUnfavorable` | the two selectors |
| `favorabilityNote` | the table's one-line note for this entry |
| `expression` | `{ sum, number, theme, register, method }` |
| `posture` | `{ number, roman, arcana, register, stance }` |
| `families` | three entries, `{ rank, key, element, label, character, body }` |
| `antiFit` | one entry, same shape minus `rank` |
| `roleLine` | one sentence |
| `sources` | named tradition per computed field |

`sources` follows the §1.E provenance posture: it records what a value was
read off, never what it is supposed to mean.

## §5. Determinism

Guaranteed by construction — pure functions over frozen tables, integer
arithmetic only, no clock, no locale, no randomness, no I/O — and pinned four
ways: 100-run byte-identity across five dates; identity across eleven
hour-shaped option payloads; a source scan for the non-deterministic APIs; and
16 full-output snapshot fixtures.

The fixtures are a snapshot of the implementation, and a snapshot cannot catch
an implementation that was wrong when it was taken. Four independent anchors
carry that weight instead: the day master is cross-checked against the three
calibrated day pillars `tests/pillars.test.js` already pins; the whole
`2000-01-01` case is walked by hand in the test file and asserted field by
field; all ten favourability entries are re-derived from the sheng/ke cycles;
and the season and posture are re-derived from `getInnerAnimal` and
`getBirthCard` across the date range.

## §6. Open questions — controller decisions, not implementer ones

1. **The field name is now wrong twice, and this is the open one.** With the
   nine-mode collapse, `expression` is neither §1.B's name-derived
   expression/name number nor a distinct number of its own — it is the life
   path (§3.4). Two labels on one sheet for one value is the failure mode, and
   it is cheap to fix now and expensive after anything renders. The
   recommendation is to rename the output field to `lifePath` (or to something
   naming its job here, e.g. `modeDriver`) before any surfacing change. Not
   done in this PR because the ruling asked for the collapse, not the rename;
   it is a field name, three test references, and a fixture regeneration.
2. **Ruled 2026-07-29: nine modes, not eleven** (§3.4). Kept in this list as a
   record rather than a question. What follows from it and is *not* settled:
   whether a driver that duplicates an already-free coordinate is the right
   input for the mode of work at all, or whether this tier wants a number the
   free sheet does not already show.
3. **Strength is month-branch only** (§3.1), and the hour is accepted but
   unused (§2). Both are honest simplifications for a date-only tier; both
   are the obvious first amendments if a practitioner reviews the output and
   finds the strength read too coarse.
4. **Domain families are a five-way partition of all work.** Any such table is
   a convention, not a fact. The categories here are the classical wuxing
   industry groupings named in the brief; they are authored, and a reviewer
   should read them as authored.
5. **First `core/` → `content/` import.** Every other `core/` module carries
   its own constants. This tier is explicitly table-driven and DOCTRINE §6
   puts versioned static data in `content/`, so `core/public.js` imports
   `content/public.v1.js`. The direction is one-way and adds no runtime
   capability, but it is a new edge in the architecture and wants a reviewer's
   eye.

## §7. Deliberately not built

No UI, no surface, no `TIER_COORDS` entry, no sheet row, no sealed cell. No
price, no Gumroad product, no `?paid=` param, no entitlement or paywall path.
No `core/payments.js` or `ui/*` change. No `index.html` change. No
`DOCTRINE.md` amendment. Nothing in the repository imports `core/public.js` —
a test pins that, so wiring it can never happen silently.

Before any of it is shown to anyone, in this order: a doctrine amendment
defining the rung under §1.D (or its successor) with cross-model review per
§10, the §6.1 rename, and a §5.D pass on what a public-tier share surface
would carry.

## §8. Test map

`tests/public.test.js` (37 tests) — determinism · coverage with no gaps ·
date-only path · anti-fit never a fit family · snapshot fixtures · independent
anchors · table integrity · voice register (the canonical
`BANNED_VOICE_REGISTER` / second-person / diagnostic-framing / slur tables,
plus a CTA scan) · surface isolation.

`tests/public_tier.fixture.json` — 16 synthetic dates (DOCTRINE §11): the
three day-pillar calibration anchors, the calc v3.1 correction dates, the
three sums that used to stop at a master value, a leap day, and both ends of
the 1900–2100 solar-term table. They cover all five day-master elements, both
strengths, all five seasonal states, and all nine expression values —
including the three digit sums (11, 22, 33) that no longer stop early.

## §9. Rollback

Delete `core/public.js`, `content/public.v1.js`, `tests/public.test.js`,
`tests/public_tier.fixture.json`, and this file; restore the two counts in
`CLAUDE.md`. Nothing else in the repository references any of them.
