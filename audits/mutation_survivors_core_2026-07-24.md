# Mutation survivors — `core/` (complete listing)

Stryker 9.6.1 + `@stryker-mutator/vitest-runner`, run 2026-07-24 (13m54s),
branch `claude/test-coverage-analysis-27tc7k` at `4df1eee`.

**Every one of the 1178 undetected mutants — 1152 `Survived` + 26 `NoCoverage` —
is listed below.** This file exists so a finding never requires repeating the
run: the companion record `test_quality_audit_2026-07-24.md` §4 carries the
analysis and scores, this file carries the raw evidence.

**Run parameters.** `mutate: core/**/*.js`, `coverageAnalysis: perTest`,
`timeoutMS: 10000`, `concurrency: 3`; 3097 mutants generated; 1897 killed +
22 timeout detected; overall score **62.0%**. Stryker and the coverage
provider were installed `--no-save` and removed after; `package.json` and the
lockfile were never modified. One test was skipped for the run —
`tests/cities_search.test.js` "source pin: a failed load resets _loading" —
because instrumentation necessarily breaks source-text pins; it kills no
mutants, and the skip was reverted immediately after.

**A surviving mutant means the suite did not notice that change.** It is a
hypothesis about a missing assertion, not automatically a defect: some
survivors are equivalent mutants or deliberately-unasserted display data.
The per-file analysis in the companion record separates those.

**Row format** (stable and greppable):

```
L<line>  <MutatorName>  `<original>` -> `<replacement>`  [no-coverage]
```
`[no-coverage]` marks code no test executes at all; unmarked rows were
executed but the change went unnoticed.

## Per-file summary

| file | score | killed | timeout | survived | no-coverage | undetected (listed) |
|---|--:|--:|--:|--:|--:|--:|
| `core/birthcard.js` | 71.2% | 40 | 2 | 17 | 0 | 17 |
| `core/calendar.js` | 42.7% | 172 | 13 | 243 | 5 | 248 |
| `core/cities.js` | 14.8% | 40 | 0 | 230 | 0 | 230 |
| `core/countries.js` | 61.9% | 843 | 0 | 520 | 0 | 520 |
| `core/engine.js` | 86.9% | 89 | 4 | 12 | 2 | 14 |
| `core/math.js` | 100.0% | 8 | 1 | 0 | 0 | 0 |
| `core/payments.js` | 95.6% | 129 | 0 | 4 | 2 | 6 |
| `core/pillars.js` | 98.7% | 73 | 0 | 1 | 0 | 1 |
| `core/profile.js` | 77.7% | 356 | 2 | 86 | 17 | 103 |
| `core/rising.js` | 79.0% | 147 | 0 | 39 | 0 | 39 |
| **TOTAL** | **62.0%** | **1897** | **22** | **1152** | **26** | **1178** |

## Listing

### `core/birthcard.js` — 17 undetected

Mutators: StringLiteral ×17

```
L45    StringLiteral          `'0'` -> `""`
L45    StringLiteral          `'I'` -> `""`
L45    StringLiteral          `'II'` -> `""`
L45    StringLiteral          `'IV'` -> `""`
L45    StringLiteral          `'V'` -> `""`
L45    StringLiteral          `'VII'` -> `""`
L45    StringLiteral          `'VIII'` -> `""`
L45    StringLiteral          `'IX'` -> `""`
L45    StringLiteral          `'X'` -> `""`
L46    StringLiteral          `'XII'` -> `""`
L46    StringLiteral          `'XIV'` -> `""`
L46    StringLiteral          `'XV'` -> `""`
L46    StringLiteral          `'XVI'` -> `""`
L46    StringLiteral          `'XVII'` -> `""`
L46    StringLiteral          `'XVIII'` -> `""`
L46    StringLiteral          `'XIX'` -> `""`
L46    StringLiteral          `'XX'` -> `""`
```

### `core/calendar.js` — 248 undetected

Mutators: ArithmeticOperator ×171 · AssignmentOperator ×25 · EqualityOperator ×16 · ConditionalExpression ×15 · UnaryOperator ×11 · BlockStatement ×5 · UpdateOperator ×3 · ArrayDeclaration ×1 · LogicalOperator ×1

```
L24    ArithmeticOperator     `T * T` -> `T / T`
L25    ArithmeticOperator     `280.46646 + 36000.76983 * T + 0.0003032 * T2` -> `280.46646 + 36000.76983 * T - 0.0003032 * T2`
L26    ArithmeticOperator     `357.52911 + 35999.05029 * T - 0.0001537 * T2` -> `357.52911 + 35999.05029 * T + 0.0001537 * T2`
L28    ArithmeticOperator     `(1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr) …` -> `(1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr) + (0.019993 -`
L28    ArithmeticOperator     `1.914602 - 0.004817 * T - 0.000014 * T2` -> `1.914602 - 0.004817 * T + 0.000014 * T2`
L28    ArithmeticOperator     `1.914602 - 0.004817 * T` -> `1.914602 + 0.004817 * T`
L29    ArithmeticOperator     `0.019993 - 0.000101 * T` -> `0.019993 + 0.000101 * T`
L29    ArithmeticOperator     `0.000101 * T` -> `0.000101 / T`
L29    ArithmeticOperator     `2 * Mr` -> `2 / Mr`
L30    ArithmeticOperator     `0.000289 * Math.sin(3 * Mr)` -> `0.000289 / Math.sin(3 * Mr)`
L30    ArithmeticOperator     `3 * Mr` -> `3 / Mr`
L32    ArithmeticOperator     `(125.04 - 1934.136 * T) * D2R` -> `(125.04 - 1934.136 * T) / D2R`
L32    ArithmeticOperator     `125.04 - 1934.136 * T` -> `125.04 + 1934.136 * T`
L32    ArithmeticOperator     `1934.136 * T` -> `1934.136 / T`
L33    ArithmeticOperator     `trueLon - 0.00569 - 0.00478 * Math.sin(omega)` -> `trueLon - 0.00569 + 0.00478 * Math.sin(omega)`
L33    ArithmeticOperator     `trueLon - 0.00569` -> `trueLon + 0.00569`
L33    ArithmeticOperator     `0.00478 * Math.sin(omega)` -> `0.00478 / Math.sin(omega)`
L41    ArithmeticOperator     `T * T` -> `T / T`
L41    ArithmeticOperator     `T2 * T` -> `T2 / T`
L41    ArithmeticOperator     `T3 * T` -> `T3 / T`
L43    ArithmeticOperator     `2451550.09766 …` -> `2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 `
L43    ArithmeticOperator     `2451550.09766 …` -> `2451550.09766 + 29.530588861 * k + 0.00015437 * T2 + 0.000000150 * T3`
L43    ArithmeticOperator     `2451550.09766 …` -> `2451550.09766 + 29.530588861 * k - 0.00015437 * T2`
L49    ArithmeticOperator     `1 - 0.002516 * T - 0.0000074 * T2` -> `1 - 0.002516 * T + 0.0000074 * T2`
L49    ArithmeticOperator     `1 - 0.002516 * T` -> `1 + 0.002516 * T`
L49    ArithmeticOperator     `0.002516 * T` -> `0.002516 / T`
L49    ArithmeticOperator     `0.0000074 * T2` -> `0.0000074 / T2`
L50    ArithmeticOperator     `2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3` -> `2.5534 + 29.10535670 * k - 0.0000014 * T2 + 0.00000011 * T3`
L50    ArithmeticOperator     `2.5534 + 29.10535670 * k - 0.0000014 * T2` -> `2.5534 + 29.10535670 * k + 0.0000014 * T2`
L50    ArithmeticOperator     `0.0000014 * T2` -> `0.0000014 / T2`
L50    ArithmeticOperator     `0.00000011 * T3` -> `0.00000011 / T3`
L51    ArithmeticOperator     `201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000…` -> `201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 + 0.000`
L51    ArithmeticOperator     `201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3` -> `201.5643 + 385.81693528 * k + 0.0107582 * T2 - 0.00001238 * T3`
L51    ArithmeticOperator     `201.5643 + 385.81693528 * k + 0.0107582 * T2` -> `201.5643 + 385.81693528 * k - 0.0107582 * T2`
L51    ArithmeticOperator     `0.0107582 * T2` -> `0.0107582 / T2`
L51    ArithmeticOperator     `0.00001238 * T3` -> `0.00001238 / T3`
L51    ArithmeticOperator     `0.000000058 * T4` -> `0.000000058 / T4`
L52    ArithmeticOperator     `(160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.00…` -> `(160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.00`
L52    ArithmeticOperator     `160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000…` -> `160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 - 0.000`
L52    ArithmeticOperator     `160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3` -> `160.7108 + 390.67050284 * k - 0.0016118 * T2 + 0.00000227 * T3`
L52    ArithmeticOperator     `160.7108 + 390.67050284 * k - 0.0016118 * T2` -> `160.7108 + 390.67050284 * k + 0.0016118 * T2`
L52    ArithmeticOperator     `160.7108 + 390.67050284 * k` -> `160.7108 - 390.67050284 * k`
L52    ArithmeticOperator     `390.67050284 * k` -> `390.67050284 / k`
L52    ArithmeticOperator     `0.0016118 * T2` -> `0.0016118 / T2`
L52    ArithmeticOperator     `0.00000227 * T3` -> `0.00000227 / T3`
L52    ArithmeticOperator     `0.000000011 * T4` -> `0.000000011 / T4`
L53    ArithmeticOperator     `(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * D2R` -> `(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) / D2R`
L53    ArithmeticOperator     `124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3` -> `124.7746 - 1.56375588 * k + 0.0020672 * T2 - 0.00000215 * T3`
L53    ArithmeticOperator     `124.7746 - 1.56375588 * k + 0.0020672 * T2` -> `124.7746 - 1.56375588 * k - 0.0020672 * T2`
L53    ArithmeticOperator     `124.7746 - 1.56375588 * k` -> `124.7746 + 1.56375588 * k`
L53    ArithmeticOperator     `1.56375588 * k` -> `1.56375588 / k`
L53    ArithmeticOperator     `0.0020672 * T2` -> `0.0020672 / T2`
L53    ArithmeticOperator     `0.00000215 * T3` -> `0.00000215 / T3`
L58    ArithmeticOperator     `0.17241 * E` -> `0.17241 / E`
L59    ArithmeticOperator     `0.01608 * Math.sin(2 * Mp)` -> `0.01608 / Math.sin(2 * Mp)`
L59    ArithmeticOperator     `2 * Mp` -> `2 / Mp`
L59    AssignmentOperator     `corr += 0.01608 * Math.sin(2 * Mp)` -> `corr -= 0.01608 * Math.sin(2 * Mp)`
L60    ArithmeticOperator     `0.01039 * Math.sin(2 * F)` -> `0.01039 / Math.sin(2 * F)`
L60    ArithmeticOperator     `2 * F` -> `2 / F`
L60    AssignmentOperator     `corr += 0.01039 * Math.sin(2 * F)` -> `corr -= 0.01039 * Math.sin(2 * F)`
L61    ArithmeticOperator     `0.00739 * E * Math.sin(Mp - M)` -> `0.00739 * E / Math.sin(Mp - M)`
L61    ArithmeticOperator     `0.00739 * E` -> `0.00739 / E`
L61    ArithmeticOperator     `Mp - M` -> `Mp + M`
L61    AssignmentOperator     `corr += 0.00739 * E * Math.sin(Mp - M)` -> `corr -= 0.00739 * E * Math.sin(Mp - M)`
L62    ArithmeticOperator     `-0.00514 * E` -> `-0.00514 / E`
L62    ArithmeticOperator     `Mp + M` -> `Mp - M`
L62    AssignmentOperator     `corr += -0.00514 * E * Math.sin(Mp + M)` -> `corr -= -0.00514 * E * Math.sin(Mp + M)`
L62    UnaryOperator          `-0.00514` -> `+0.00514`
L63    ArithmeticOperator     `0.00208 * E * E * Math.sin(2 * M)` -> `0.00208 * E * E / Math.sin(2 * M)`
L63    ArithmeticOperator     `0.00208 * E * E` -> `0.00208 * E / E`
L63    ArithmeticOperator     `2 * M` -> `2 / M`
L63    ArithmeticOperator     `0.00208 * E` -> `0.00208 / E`
L63    AssignmentOperator     `corr += 0.00208 * E * E * Math.sin(2 * M)` -> `corr -= 0.00208 * E * E * Math.sin(2 * M)`
L64    ArithmeticOperator     `-0.00111 * Math.sin(Mp - 2 * F)` -> `-0.00111 / Math.sin(Mp - 2 * F)`
L64    ArithmeticOperator     `Mp - 2 * F` -> `Mp + 2 * F`
L64    ArithmeticOperator     `2 * F` -> `2 / F`
L64    AssignmentOperator     `corr += -0.00111 * Math.sin(Mp - 2 * F)` -> `corr -= -0.00111 * Math.sin(Mp - 2 * F)`
L64    UnaryOperator          `-0.00111` -> `+0.00111`
L65    ArithmeticOperator     `-0.00057 * Math.sin(Mp + 2 * F)` -> `-0.00057 / Math.sin(Mp + 2 * F)`
L65    ArithmeticOperator     `2 * F` -> `2 / F`
L65    ArithmeticOperator     `Mp + 2 * F` -> `Mp - 2 * F`
L65    AssignmentOperator     `corr += -0.00057 * Math.sin(Mp + 2 * F)` -> `corr -= -0.00057 * Math.sin(Mp + 2 * F)`
L65    UnaryOperator          `-0.00057` -> `+0.00057`
L66    ArithmeticOperator     `0.00056 * E * Math.sin(2 * Mp + M)` -> `0.00056 * E / Math.sin(2 * Mp + M)`
L66    ArithmeticOperator     `0.00056 * E` -> `0.00056 / E`
L66    ArithmeticOperator     `2 * Mp + M` -> `2 * Mp - M`
L66    ArithmeticOperator     `2 * Mp` -> `2 / Mp`
L66    AssignmentOperator     `corr += 0.00056 * E * Math.sin(2 * Mp + M)` -> `corr -= 0.00056 * E * Math.sin(2 * Mp + M)`
L67    ArithmeticOperator     `-0.00042 * Math.sin(3 * Mp)` -> `-0.00042 / Math.sin(3 * Mp)`
L67    ArithmeticOperator     `3 * Mp` -> `3 / Mp`
L67    AssignmentOperator     `corr += -0.00042 * Math.sin(3 * Mp)` -> `corr -= -0.00042 * Math.sin(3 * Mp)`
L67    UnaryOperator          `-0.00042` -> `+0.00042`
L68    ArithmeticOperator     `0.00042 * E * Math.sin(M + 2 * F)` -> `0.00042 * E / Math.sin(M + 2 * F)`
L68    ArithmeticOperator     `0.00042 * E` -> `0.00042 / E`
L68    ArithmeticOperator     `M + 2 * F` -> `M - 2 * F`
L68    ArithmeticOperator     `2 * F` -> `2 / F`
L68    AssignmentOperator     `corr += 0.00042 * E * Math.sin(M + 2 * F)` -> `corr -= 0.00042 * E * Math.sin(M + 2 * F)`
L69    ArithmeticOperator     `0.00038 * E * Math.sin(M - 2 * F)` -> `0.00038 * E / Math.sin(M - 2 * F)`
L69    ArithmeticOperator     `M - 2 * F` -> `M + 2 * F`
L69    ArithmeticOperator     `0.00038 * E` -> `0.00038 / E`
L69    ArithmeticOperator     `2 * F` -> `2 / F`
L69    AssignmentOperator     `corr += 0.00038 * E * Math.sin(M - 2 * F)` -> `corr -= 0.00038 * E * Math.sin(M - 2 * F)`
L70    ArithmeticOperator     `-0.00024 * E * Math.sin(2 * Mp - M)` -> `-0.00024 * E / Math.sin(2 * Mp - M)`
L70    ArithmeticOperator     `-0.00024 * E` -> `-0.00024 / E`
L70    ArithmeticOperator     `2 * Mp - M` -> `2 * Mp + M`
L70    ArithmeticOperator     `2 * Mp` -> `2 / Mp`
L70    AssignmentOperator     `corr += -0.00024 * E * Math.sin(2 * Mp - M)` -> `corr -= -0.00024 * E * Math.sin(2 * Mp - M)`
L70    UnaryOperator          `-0.00024` -> `+0.00024`
L71    AssignmentOperator     `corr += -0.00017 * Math.sin(Om)` -> `corr -= -0.00017 * Math.sin(Om)`
L71    UnaryOperator          `-0.00017` -> `+0.00017`
L72    ArithmeticOperator     `-0.00007 * Math.sin(Mp + 2 * M)` -> `-0.00007 / Math.sin(Mp + 2 * M)`
L72    ArithmeticOperator     `Mp + 2 * M` -> `Mp - 2 * M`
L72    ArithmeticOperator     `2 * M` -> `2 / M`
L72    AssignmentOperator     `corr += -0.00007 * Math.sin(Mp + 2 * M)` -> `corr -= -0.00007 * Math.sin(Mp + 2 * M)`
L72    UnaryOperator          `-0.00007` -> `+0.00007`
L73    ArithmeticOperator     `0.00004 * Math.sin(2 * Mp - 2 * F)` -> `0.00004 / Math.sin(2 * Mp - 2 * F)`
L73    ArithmeticOperator     `2 * Mp - 2 * F` -> `2 * Mp + 2 * F`
L73    ArithmeticOperator     `2 * Mp` -> `2 / Mp`
L73    ArithmeticOperator     `2 * F` -> `2 / F`
L73    AssignmentOperator     `corr += 0.00004 * Math.sin(2 * Mp - 2 * F)` -> `corr -= 0.00004 * Math.sin(2 * Mp - 2 * F)`
L74    ArithmeticOperator     `0.00004 * Math.sin(3 * M)` -> `0.00004 / Math.sin(3 * M)`
L74    ArithmeticOperator     `3 * M` -> `3 / M`
L74    AssignmentOperator     `corr += 0.00004 * Math.sin(3 * M)` -> `corr -= 0.00004 * Math.sin(3 * M)`
L75    ArithmeticOperator     `0.00003 * Math.sin(Mp + M - 2 * F)` -> `0.00003 / Math.sin(Mp + M - 2 * F)`
L75    ArithmeticOperator     `Mp + M - 2 * F` -> `Mp + M + 2 * F`
L75    ArithmeticOperator     `Mp + M` -> `Mp - M`
L75    ArithmeticOperator     `2 * F` -> `2 / F`
L75    AssignmentOperator     `corr += 0.00003 * Math.sin(Mp + M - 2 * F)` -> `corr -= 0.00003 * Math.sin(Mp + M - 2 * F)`
L76    ArithmeticOperator     `0.00003 * Math.sin(2 * Mp + 2 * F)` -> `0.00003 / Math.sin(2 * Mp + 2 * F)`
L76    ArithmeticOperator     `2 * Mp + 2 * F` -> `2 * Mp - 2 * F`
L76    ArithmeticOperator     `2 * Mp` -> `2 / Mp`
L76    ArithmeticOperator     `2 * F` -> `2 / F`
L76    AssignmentOperator     `corr += 0.00003 * Math.sin(2 * Mp + 2 * F)` -> `corr -= 0.00003 * Math.sin(2 * Mp + 2 * F)`
L77    ArithmeticOperator     `-0.00003 * Math.sin(Mp + M + 2 * F)` -> `-0.00003 / Math.sin(Mp + M + 2 * F)`
L77    ArithmeticOperator     `Mp + M + 2 * F` -> `Mp + M - 2 * F`
L77    ArithmeticOperator     `Mp + M` -> `Mp - M`
L77    ArithmeticOperator     `2 * F` -> `2 / F`
L77    AssignmentOperator     `corr += -0.00003 * Math.sin(Mp + M + 2 * F)` -> `corr -= -0.00003 * Math.sin(Mp + M + 2 * F)`
L77    UnaryOperator          `-0.00003` -> `+0.00003`
L78    ArithmeticOperator     `0.00003 * Math.sin(Mp - M + 2 * F)` -> `0.00003 / Math.sin(Mp - M + 2 * F)`
L78    ArithmeticOperator     `Mp - M + 2 * F` -> `Mp - M - 2 * F`
L78    ArithmeticOperator     `Mp - M` -> `Mp + M`
L78    ArithmeticOperator     `2 * F` -> `2 / F`
L78    AssignmentOperator     `corr += 0.00003 * Math.sin(Mp - M + 2 * F)` -> `corr -= 0.00003 * Math.sin(Mp - M + 2 * F)`
L79    ArithmeticOperator     `-0.00002 * Math.sin(Mp - M - 2 * F)` -> `-0.00002 / Math.sin(Mp - M - 2 * F)`
L79    ArithmeticOperator     `Mp - M - 2 * F` -> `Mp - M + 2 * F`
L79    ArithmeticOperator     `Mp - M` -> `Mp + M`
L79    ArithmeticOperator     `2 * F` -> `2 / F`
L79    AssignmentOperator     `corr += -0.00002 * Math.sin(Mp - M - 2 * F)` -> `corr -= -0.00002 * Math.sin(Mp - M - 2 * F)`
L79    UnaryOperator          `-0.00002` -> `+0.00002`
L80    ArithmeticOperator     `-0.00002 * Math.sin(3 * Mp + M)` -> `-0.00002 / Math.sin(3 * Mp + M)`
L80    ArithmeticOperator     `3 * Mp` -> `3 / Mp`
L80    ArithmeticOperator     `3 * Mp + M` -> `3 * Mp - M`
L80    AssignmentOperator     `corr += -0.00002 * Math.sin(3 * Mp + M)` -> `corr -= -0.00002 * Math.sin(3 * Mp + M)`
L80    UnaryOperator          `-0.00002` -> `+0.00002`
L81    ArithmeticOperator     `4 * Mp` -> `4 / Mp`
L81    ArithmeticOperator     `0.00002 * Math.sin(4 * Mp)` -> `0.00002 / Math.sin(4 * Mp)`
L81    AssignmentOperator     `corr += 0.00002 * Math.sin(4 * Mp)` -> `corr -= 0.00002 * Math.sin(4 * Mp)`
L84    ArrayDeclaration       `[ …` -> `[]`
L85    ArithmeticOperator     `299.77 + 0.107408 * k - 0.009173 * T2` -> `299.77 + 0.107408 * k + 0.009173 * T2`
L85    ArithmeticOperator     `299.77 + 0.107408 * k` -> `299.77 - 0.107408 * k`
L85    ArithmeticOperator     `0.107408 * k` -> `0.107408 / k`
L85    ArithmeticOperator     `0.009173 * T2` -> `0.009173 / T2`
L86    ArithmeticOperator     `251.88 + 0.016321 * k` -> `251.88 - 0.016321 * k`
L86    ArithmeticOperator     `0.016321 * k` -> `0.016321 / k`
L87    ArithmeticOperator     `251.83 + 26.651886 * k` -> `251.83 - 26.651886 * k`
L87    ArithmeticOperator     `26.651886 * k` -> `26.651886 / k`
L88    ArithmeticOperator     `349.42 + 36.412478 * k` -> `349.42 - 36.412478 * k`
L88    ArithmeticOperator     `36.412478 * k` -> `36.412478 / k`
L89    ArithmeticOperator     `84.66 + 18.206239 * k` -> `84.66 - 18.206239 * k`
L89    ArithmeticOperator     `18.206239 * k` -> `18.206239 / k`
L90    ArithmeticOperator     `141.74 + 53.303771 * k` -> `141.74 - 53.303771 * k`
L90    ArithmeticOperator     `53.303771 * k` -> `53.303771 / k`
L91    ArithmeticOperator     `207.14 + 2.453732 * k` -> `207.14 - 2.453732 * k`
L91    ArithmeticOperator     `2.453732 * k` -> `2.453732 / k`
L92    ArithmeticOperator     `154.84 + 7.306860 * k` -> `154.84 - 7.306860 * k`
L92    ArithmeticOperator     `7.306860 * k` -> `7.306860 / k`
L93    ArithmeticOperator     `34.52 + 27.261239 * k` -> `34.52 - 27.261239 * k`
L93    ArithmeticOperator     `27.261239 * k` -> `27.261239 / k`
L94    ArithmeticOperator     `207.19 + 0.121824 * k` -> `207.19 - 0.121824 * k`
L94    ArithmeticOperator     `0.121824 * k` -> `0.121824 / k`
L95    ArithmeticOperator     `291.34 + 1.844379 * k` -> `291.34 - 1.844379 * k`
L95    ArithmeticOperator     `1.844379 * k` -> `1.844379 / k`
L96    ArithmeticOperator     `161.72 + 24.198154 * k` -> `161.72 - 24.198154 * k`
L96    ArithmeticOperator     `24.198154 * k` -> `24.198154 / k`
L97    ArithmeticOperator     `239.56 + 25.513099 * k` -> `239.56 - 25.513099 * k`
L97    ArithmeticOperator     `25.513099 * k` -> `25.513099 / k`
L98    ArithmeticOperator     `331.55 + 3.592518 * k` -> `331.55 - 3.592518 * k`
L98    ArithmeticOperator     `3.592518 * k` -> `3.592518 / k`
L104   BlockStatement         `{ …` -> `{}`
L104   ConditionalExpression  `i < A.length` -> `false`
L104   EqualityOperator       `i < A.length` -> `i >= A.length`
L105   ArithmeticOperator     `W[i] * Math.sin(A[i] * D2R)` -> `W[i] / Math.sin(A[i] * D2R)`
L105   ArithmeticOperator     `A[i] * D2R` -> `A[i] / D2R`
L105   AssignmentOperator     `extra += W[i] * Math.sin(A[i] * D2R)` -> `extra -= W[i] * Math.sin(A[i] * D2R)`
L108   ArithmeticOperator     `jde + corr + extra` -> `jde + corr - extra`
L114   BlockStatement         `{ Y -= 1; M += 12; }` -> `{}`
L114   ConditionalExpression  `M <= 2` -> `true`
L114   ConditionalExpression  `M <= 2` -> `false`
L114   EqualityOperator       `M <= 2` -> `M < 2`
L114   EqualityOperator       `M <= 2` -> `M > 2`
L116   ArithmeticOperator     `2 - A + Math.floor(A / 4)` -> `2 - A - Math.floor(A / 4)`
L130   BlockStatement         `{ …` -> `{}`  [no-coverage]
L130   ConditionalExpression  `Z < 2299161` -> `false`
L130   EqualityOperator       `Z < 2299161` -> `Z <= 2299161`
L142   EqualityOperator       `month > 2` -> `month >= 2`
L147   ArithmeticOperator     `a.year - b.year` -> `a.year + b.year`
L160   ConditionalExpression  `d > 180` -> `false`
L160   EqualityOperator       `d > 180` -> `d >= 180`
L161   AssignmentOperator     `d += 360` -> `d -= 360`  [no-coverage]
L161   ConditionalExpression  `d <= -180` -> `false`
L161   EqualityOperator       `d <= -180` -> `d < -180`
L164   EqualityOperator       `i < 60` -> `i <= 60`
L164   UpdateOperator         `i++` -> `i--`
L166   ArithmeticOperator     `hi - lo` -> `hi + lo`
L166   ConditionalExpression  `hi - lo < 1e-6` -> `false`
L166   EqualityOperator       `hi - lo < 1e-6` -> `hi - lo <= 1e-6`
L167   EqualityOperator       `diff(mid) < 0` -> `diff(mid) <= 0`
L170   ArithmeticOperator     `(lo + hi) / 2` -> `(lo + hi) * 2`  [no-coverage]
L170   ArithmeticOperator     `lo + hi` -> `lo - hi`  [no-coverage]
L198   EqualityOperator       `year > RANGE_MAX` -> `year >= RANGE_MAX`
L212   ArithmeticOperator     `gregorianToJD(year, rm, rd) + 0.5` -> `gregorianToJD(year, rm, rd) - 0.5`
L221   ArithmeticOperator     `gregorianToJD(targetDate.year, targetDate.month, targetDate.day) + 0.5` -> `gregorianToJD(targetDate.year, targetDate.month, targetDate.day) - 0.5`
L224   EqualityOperator       `compareDates(jdeToShanghaiDate(newMoonJDE(k)), targetDate) > 0` -> `compareDates(jdeToShanghaiDate(newMoonJDE(k)), targetDate) >= 0`
L226   ConditionalExpression  `compareDates(jdeToShanghaiDate(newMoonJDE(k + 1)), targetDate) <= 0` -> `false`
L226   EqualityOperator       `compareDates(jdeToShanghaiDate(newMoonJDE(k + 1)), targetDate) <= 0` -> `compareDates(jdeToShanghaiDate(newMoonJDE(k + 1)), targetDate) < 0`
L226   UpdateOperator         `k++` -> `k--`  [no-coverage]
L234   ArithmeticOperator     `gregorianToJD(monthStartDate.year, monthStartDate.month, monthStartDat…` -> `gregorianToJD(monthStartDate.year, monthStartDate.month, monthStartDat`
L239   ArithmeticOperator     `Math.floor(lon / 30) + 1` -> `Math.floor(lon / 30) - 1`
L241   ArithmeticOperator     `monthStartJDE + 15` -> `monthStartJDE - 15`
L243   ConditionalExpression  `compareDates(zhongqiDate, nextMonthStartDate) < 0` -> `true`
L243   EqualityOperator       `compareDates(zhongqiDate, nextMonthStartDate) < 0` -> `compareDates(zhongqiDate, nextMonthStartDate) <= 0`
L260   ArithmeticOperator     `gregorianToJD(year - 1, 12, 22) + 0.5` -> `gregorianToJD(year - 1, 12, 22) - 0.5`
L262   ArithmeticOperator     `gregorianToJD(year, 12, 22) + 0.5` -> `gregorianToJD(year, 12, 22) - 0.5`
L270   ConditionalExpression  `lunations === 12` -> `true`
L274   UnaryOperator          `-1` -> `+1`
L275   BlockStatement         `{ …` -> `{}`
L275   ConditionalExpression  `i <= 12` -> `false`
L275   EqualityOperator       `i <= 12` -> `i < 12`
L275   EqualityOperator       `i <= 12` -> `i > 12`
L275   UpdateOperator         `i++` -> `i--`
L276   ArithmeticOperator     `k11 + i` -> `k11 - i`
L278   BlockStatement         `{ …` -> `{}`
L278   ConditionalExpression  `!monthHasZhongqi(monthStart, nextStart)` -> `false`
L283   ConditionalExpression  `leapOffset === 1 || leapOffset === 2` -> `false`
L283   ConditionalExpression  `leapOffset === 1` -> `false`
L283   ConditionalExpression  `leapOffset === 2` -> `false`
L283   LogicalOperator        `leapOffset === 1 || leapOffset === 2` -> `leapOffset === 1 && leapOffset === 2`
```

### `core/cities.js` — 230 undetected

Mutators: StringLiteral ×222 · ConditionalExpression ×2 · ObjectLiteral ×2 · MethodExpression ×2 · BlockStatement ×1 · EqualityOperator ×1

```
L34    StringLiteral          `'Andorra'` -> `""`
L34    StringLiteral          `'United Arab Emirates'` -> `""`
L34    StringLiteral          `'Afghanistan'` -> `""`
L35    StringLiteral          `'Antigua and Barbuda'` -> `""`
L35    StringLiteral          `'Albania'` -> `""`
L35    StringLiteral          `'Armenia'` -> `""`
L35    StringLiteral          `'Angola'` -> `""`
L36    StringLiteral          `'Argentina'` -> `""`
L36    StringLiteral          `'American Samoa'` -> `""`
L36    StringLiteral          `'Austria'` -> `""`
L36    StringLiteral          `'Australia'` -> `""`
L37    StringLiteral          `'Aruba'` -> `""`
L37    StringLiteral          `'Åland Islands'` -> `""`
L37    StringLiteral          `'Azerbaijan'` -> `""`
L38    StringLiteral          `'Bosnia and Herzegovina'` -> `""`
L38    StringLiteral          `'Barbados'` -> `""`
L38    StringLiteral          `'Bangladesh'` -> `""`
L39    StringLiteral          `'Belgium'` -> `""`
L39    StringLiteral          `'Burkina Faso'` -> `""`
L39    StringLiteral          `'Bulgaria'` -> `""`
L39    StringLiteral          `'Bahrain'` -> `""`
L40    StringLiteral          `'Burundi'` -> `""`
L40    StringLiteral          `'Bermuda'` -> `""`
L40    StringLiteral          `'Benin'` -> `""`
L40    StringLiteral          `'Brunei'` -> `""`
L41    StringLiteral          `'Bolivia'` -> `""`
L41    StringLiteral          `'Caribbean Netherlands'` -> `""`
L41    StringLiteral          `'Brazil'` -> `""`
L42    StringLiteral          `'Bahamas'` -> `""`
L42    StringLiteral          `'Bhutan'` -> `""`
L42    StringLiteral          `'Botswana'` -> `""`
L42    StringLiteral          `'Belarus'` -> `""`
L43    StringLiteral          `'Belize'` -> `""`
L43    StringLiteral          `'Canada'` -> `""`
L43    StringLiteral          `'DR Congo'` -> `""`
L44    StringLiteral          `'Central African Republic'` -> `""`
L44    StringLiteral          `'Republic of the Congo'` -> `""`
L45    StringLiteral          `'Switzerland'` -> `""`
L45    StringLiteral          `"Côte d'Ivoire"` -> `""`
L45    StringLiteral          `'Cook Islands'` -> `""`
L46    StringLiteral          `'Chile'` -> `""`
L46    StringLiteral          `'Cameroon'` -> `""`
L46    StringLiteral          `'China'` -> `""`
L46    StringLiteral          `'Colombia'` -> `""`
L47    StringLiteral          `'Costa Rica'` -> `""`
L47    StringLiteral          `'Cuba'` -> `""`
L47    StringLiteral          `'Cape Verde'` -> `""`
L47    StringLiteral          `'Curaçao'` -> `""`
L48    StringLiteral          `'Cyprus'` -> `""`
L48    StringLiteral          `'Czechia'` -> `""`
L48    StringLiteral          `'Djibouti'` -> `""`
L49    StringLiteral          `'Denmark'` -> `""`
L49    StringLiteral          `'Dominica'` -> `""`
L49    StringLiteral          `'Dominican Republic'` -> `""`
L50    StringLiteral          `'Algeria'` -> `""`
L50    StringLiteral          `'Ecuador'` -> `""`
L50    StringLiteral          `'Estonia'` -> `""`
L50    StringLiteral          `'Egypt'` -> `""`
L51    StringLiteral          `'Western Sahara'` -> `""`
L51    StringLiteral          `'Eritrea'` -> `""`
L51    StringLiteral          `'Spain'` -> `""`
L51    StringLiteral          `'Ethiopia'` -> `""`
L52    StringLiteral          `'Finland'` -> `""`
L52    StringLiteral          `'Fiji'` -> `""`
L52    StringLiteral          `'Micronesia'` -> `""`
L52    StringLiteral          `'Faroe Islands'` -> `""`
L53    StringLiteral          `'France'` -> `""`
L53    StringLiteral          `'Gabon'` -> `""`
L53    StringLiteral          `'United Kingdom'` -> `""`
L53    StringLiteral          `'Grenada'` -> `""`
L54    StringLiteral          `'Georgia'` -> `""`
L54    StringLiteral          `'French Guiana'` -> `""`
L54    StringLiteral          `'Guernsey'` -> `""`
L54    StringLiteral          `'Ghana'` -> `""`
L55    StringLiteral          `'Gibraltar'` -> `""`
L55    StringLiteral          `'Greenland'` -> `""`
L55    StringLiteral          `'Gambia'` -> `""`
L55    StringLiteral          `'Guinea'` -> `""`
L56    StringLiteral          `'Guadeloupe'` -> `""`
L56    StringLiteral          `'Equatorial Guinea'` -> `""`
L56    StringLiteral          `'Greece'` -> `""`
L57    StringLiteral          `'Guatemala'` -> `""`
L57    StringLiteral          `'Guam'` -> `""`
L57    StringLiteral          `'Guinea-Bissau'` -> `""`
L57    StringLiteral          `'Guyana'` -> `""`
L58    StringLiteral          `'Hong Kong'` -> `""`
L58    StringLiteral          `'Honduras'` -> `""`
L58    StringLiteral          `'Croatia'` -> `""`
L58    StringLiteral          `'Haiti'` -> `""`
L59    StringLiteral          `'Hungary'` -> `""`
L59    StringLiteral          `'Ireland'` -> `""`
L59    StringLiteral          `'Indonesia'` -> `""`
L59    StringLiteral          `'Israel'` -> `""`
L60    StringLiteral          `'Isle of Man'` -> `""`
L60    StringLiteral          `'India'` -> `""`
L60    StringLiteral          `'Iraq'` -> `""`
L60    StringLiteral          `'Iran'` -> `""`
L61    StringLiteral          `'Italy'` -> `""`
L61    StringLiteral          `'Jamaica'` -> `""`
L61    StringLiteral          `'Jersey'` -> `""`
L63    StringLiteral          `'Jordan'` -> `""`
L63    StringLiteral          `'Japan'` -> `""`
L63    StringLiteral          `'Kenya'` -> `""`
L63    StringLiteral          `'Kyrgyzstan'` -> `""`
L64    StringLiteral          `'Cambodia'` -> `""`
L64    StringLiteral          `'Kiribati'` -> `""`
L64    StringLiteral          `'Comoros'` -> `""`
L64    StringLiteral          `'Saint Kitts and Nevis'` -> `""`
L65    StringLiteral          `'North Korea'` -> `""`
L65    StringLiteral          `'South Korea'` -> `""`
L65    StringLiteral          `'Cayman Islands'` -> `""`
L65    StringLiteral          `'Kuwait'` -> `""`
L66    StringLiteral          `'Kazakhstan'` -> `""`
L66    StringLiteral          `'Laos'` -> `""`
L66    StringLiteral          `'Lebanon'` -> `""`
L66    StringLiteral          `'Saint Lucia'` -> `""`
L67    StringLiteral          `'Liberia'` -> `""`
L67    StringLiteral          `'Sri Lanka'` -> `""`
L67    StringLiteral          `'Lesotho'` -> `""`
L67    StringLiteral          `'Lithuania'` -> `""`
L68    StringLiteral          `'Luxembourg'` -> `""`
L68    StringLiteral          `'Latvia'` -> `""`
L68    StringLiteral          `'Libya'` -> `""`
L69    StringLiteral          `'Morocco'` -> `""`
L69    StringLiteral          `'Monaco'` -> `""`
L69    StringLiteral          `'Moldova'` -> `""`
L69    StringLiteral          `'Montenegro'` -> `""`
L70    StringLiteral          `'Madagascar'` -> `""`
L70    StringLiteral          `'North Macedonia'` -> `""`
L70    StringLiteral          `'Marshall Islands'` -> `""`
L70    StringLiteral          `'Mali'` -> `""`
L71    StringLiteral          `'Myanmar'` -> `""`
L71    StringLiteral          `'Mongolia'` -> `""`
L71    StringLiteral          `'Macau'` -> `""`
L71    StringLiteral          `'Northern Mariana Islands'` -> `""`
L72    StringLiteral          `'Martinique'` -> `""`
L72    StringLiteral          `'Mauritania'` -> `""`
L72    StringLiteral          `'Malta'` -> `""`
L72    StringLiteral          `'Mauritius'` -> `""`
L73    StringLiteral          `'Maldives'` -> `""`
L73    StringLiteral          `'Malawi'` -> `""`
L73    StringLiteral          `'Mexico'` -> `""`
L73    StringLiteral          `'Malaysia'` -> `""`
L74    StringLiteral          `'Mozambique'` -> `""`
L74    StringLiteral          `'Namibia'` -> `""`
L74    StringLiteral          `'New Caledonia'` -> `""`
L74    StringLiteral          `'Niger'` -> `""`
L75    StringLiteral          `'Nigeria'` -> `""`
L75    StringLiteral          `'Nicaragua'` -> `""`
L75    StringLiteral          `'Netherlands'` -> `""`
L76    StringLiteral          `'Nepal'` -> `""`
L76    StringLiteral          `'New Zealand'` -> `""`
L76    StringLiteral          `'Oman'` -> `""`
L76    StringLiteral          `'Panama'` -> `""`
L77    StringLiteral          `'Peru'` -> `""`
L77    StringLiteral          `'French Polynesia'` -> `""`
L77    StringLiteral          `'Papua New Guinea'` -> `""`
L77    StringLiteral          `'Philippines'` -> `""`
L78    StringLiteral          `'Pakistan'` -> `""`
L78    StringLiteral          `'Poland'` -> `""`
L78    StringLiteral          `'Puerto Rico'` -> `""`
L78    StringLiteral          `'Palestine'` -> `""`
L79    StringLiteral          `'Portugal'` -> `""`
L79    StringLiteral          `'Palau'` -> `""`
L79    StringLiteral          `'Paraguay'` -> `""`
L79    StringLiteral          `'Qatar'` -> `""`
L80    StringLiteral          `'Réunion'` -> `""`
L80    StringLiteral          `'Romania'` -> `""`
L80    StringLiteral          `'Russia'` -> `""`
L80    StringLiteral          `'Serbia'` -> `""`
L81    StringLiteral          `'Rwanda'` -> `""`
L82    StringLiteral          `'Solomon Islands'` -> `""`
L82    StringLiteral          `'Seychelles'` -> `""`
L82    StringLiteral          `'Sudan'` -> `""`
L83    StringLiteral          `'Sweden'` -> `""`
L83    StringLiteral          `'Singapore'` -> `""`
L83    StringLiteral          `'Slovenia'` -> `""`
L83    StringLiteral          `'Slovakia'` -> `""`
L84    StringLiteral          `'Sierra Leone'` -> `""`
L84    StringLiteral          `'San Marino'` -> `""`
L84    StringLiteral          `'Senegal'` -> `""`
L84    StringLiteral          `'Somalia'` -> `""`
L85    StringLiteral          `'Suriname'` -> `""`
L85    StringLiteral          `'South Sudan'` -> `""`
L85    StringLiteral          `'Sao Tome and Principe'` -> `""`
L85    StringLiteral          `'El Salvador'` -> `""`
L86    StringLiteral          `'Sint Maarten'` -> `""`
L86    StringLiteral          `'Syria'` -> `""`
L86    StringLiteral          `'Eswatini'` -> `""`
L87    StringLiteral          `'Turks and Caicos Islands'` -> `""`
L87    StringLiteral          `'Chad'` -> `""`
L87    StringLiteral          `'Togo'` -> `""`
L87    StringLiteral          `'Thailand'` -> `""`
L88    StringLiteral          `'Tajikistan'` -> `""`
L88    StringLiteral          `'Timor-Leste'` -> `""`
L88    StringLiteral          `'Turkmenistan'` -> `""`
L88    StringLiteral          `'Tunisia'` -> `""`
L89    StringLiteral          `'Tonga'` -> `""`
L89    StringLiteral          `'Turkey'` -> `""`
L89    StringLiteral          `'Trinidad and Tobago'` -> `""`
L89    StringLiteral          `'Taiwan'` -> `""`
L90    StringLiteral          `'Tanzania'` -> `""`
L90    StringLiteral          `'Ukraine'` -> `""`
L90    StringLiteral          `'Uganda'` -> `""`
L90    StringLiteral          `'United States'` -> `""`
L91    StringLiteral          `'Uruguay'` -> `""`
L91    StringLiteral          `'Uzbekistan'` -> `""`
L91    StringLiteral          `'Saint Vincent and the Grenadines'` -> `""`
L92    StringLiteral          `'Venezuela'` -> `""`
L92    StringLiteral          `'British Virgin Islands'` -> `""`
L92    StringLiteral          `'U.S. Virgin Islands'` -> `""`
L93    StringLiteral          `'Vietnam'` -> `""`
L93    StringLiteral          `'Vanuatu'` -> `""`
L93    StringLiteral          `'Samoa'` -> `""`
L93    StringLiteral          `'Kosovo'` -> `""`
L94    StringLiteral          `'Yemen'` -> `""`
L94    StringLiteral          `'Mayotte'` -> `""`
L94    StringLiteral          `'South Africa'` -> `""`
L94    StringLiteral          `'Zambia'` -> `""`
L95    StringLiteral          `'Zimbabwe'` -> `""`
L117   ConditionalExpression  `_cache` -> `false`
L118   ConditionalExpression  `_loading` -> `false`
L125   ObjectLiteral          `{ type: 'json' }` -> `{}`
L125   ObjectLiteral          `{ with: { type: 'json' } }` -> `{}`
L125   StringLiteral          `'json'` -> `""`
L128   BlockStatement         `{ …` -> `{}`
L142   MethodExpression       `s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()` -> `s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()`
L167   MethodExpression       `(query || '').trim()` -> `query || ''`
L167   StringLiteral          `''` -> `"Stryker was here!"`
L168   EqualityOperator       `q.length < 2` -> `q.length <= 2`
```

### `core/countries.js` — 520 undetected

Mutators: StringLiteral ×276 · UnaryOperator ×244

```
L28    StringLiteral          `'afghanistan'` -> `""`
L29    StringLiteral          `'aland islands'` -> `""`
L30    StringLiteral          `'albania'` -> `""`
L31    StringLiteral          `'algeria'` -> `""`
L32    StringLiteral          `'andorra'` -> `""`
L33    StringLiteral          `'angola'` -> `""`
L33    UnaryOperator          `-12.5` -> `+12.5`
L34    StringLiteral          `'anguilla'` -> `""`
L34    UnaryOperator          `-240` -> `+240`
L34    UnaryOperator          `-63.2` -> `+63.2`
L35    StringLiteral          `'antarctica'` -> `""`
L35    UnaryOperator          `-90.0` -> `+90.0`
L36    StringLiteral          `'antigua and barbuda'` -> `""`
L36    UnaryOperator          `-240` -> `+240`
L36    UnaryOperator          `-61.8` -> `+61.8`
L37    StringLiteral          `'argentina'` -> `""`
L37    UnaryOperator          `-180` -> `+180`
L37    UnaryOperator          `-34.0` -> `+34.0`
L37    UnaryOperator          `-64.0` -> `+64.0`
L38    StringLiteral          `'armenia'` -> `""`
L39    StringLiteral          `'aruba'` -> `""`
L39    UnaryOperator          `-240` -> `+240`
L39    UnaryOperator          `-70.0` -> `+70.0`
L40    StringLiteral          `'australia (central)'` -> `""`
L40    UnaryOperator          `-30.0` -> `+30.0`
L41    StringLiteral          `'australia (eastern)'` -> `""`
L42    StringLiteral          `'australia (western)'` -> `""`
L42    UnaryOperator          `-27.0` -> `+27.0`
L43    StringLiteral          `'austria'` -> `""`
L44    StringLiteral          `'azerbaijan'` -> `""`
L45    StringLiteral          `'bahamas'` -> `""`
L45    UnaryOperator          `-300` -> `+300`
L45    UnaryOperator          `-76.0` -> `+76.0`
L46    StringLiteral          `'bahrain'` -> `""`
L47    StringLiteral          `'bangladesh'` -> `""`
L48    StringLiteral          `'barbados'` -> `""`
L48    UnaryOperator          `-240` -> `+240`
L48    UnaryOperator          `-59.5` -> `+59.5`
L49    StringLiteral          `'belarus'` -> `""`
L50    StringLiteral          `'belgium'` -> `""`
L51    StringLiteral          `'belize'` -> `""`
L51    UnaryOperator          `-360` -> `+360`
L51    UnaryOperator          `-88.8` -> `+88.8`
L52    StringLiteral          `'benin'` -> `""`
L53    StringLiteral          `'bermuda'` -> `""`
L53    UnaryOperator          `-240` -> `+240`
L53    UnaryOperator          `-64.8` -> `+64.8`
L54    StringLiteral          `'bhutan'` -> `""`
L55    StringLiteral          `'bolivia'` -> `""`
L55    UnaryOperator          `-240` -> `+240`
L55    UnaryOperator          `-17.0` -> `+17.0`
L55    UnaryOperator          `-65.0` -> `+65.0`
L56    StringLiteral          `'bosnia and herzegovina'` -> `""`
L57    StringLiteral          `'botswana'` -> `""`
L57    UnaryOperator          `-22.0` -> `+22.0`
L58    StringLiteral          `'bouvet island'` -> `""`
L58    UnaryOperator          `-54.4` -> `+54.4`
L59    StringLiteral          `'brazil (acre)'` -> `""`
L59    UnaryOperator          `-300` -> `+300`
L59    UnaryOperator          `-8.8` -> `+8.8`
L59    UnaryOperator          `-70.5` -> `+70.5`
L60    StringLiteral          `'brazil (brasilia)'` -> `""`
L60    UnaryOperator          `-15.5` -> `+15.5`
L61    StringLiteral          `'brazil (fernando de noronha)'` -> `""`
L61    UnaryOperator          `-120` -> `+120`
L61    UnaryOperator          `-3.9` -> `+3.9`
L61    UnaryOperator          `-32.4` -> `+32.4`
L62    StringLiteral          `'british indian ocean territory'` -> `""`
L62    UnaryOperator          `-6.0` -> `+6.0`
L63    StringLiteral          `'british virgin islands'` -> `""`
L63    UnaryOperator          `-240` -> `+240`
L63    UnaryOperator          `-64.5` -> `+64.5`
L64    StringLiteral          `'brunei'` -> `""`
L65    StringLiteral          `'bulgaria'` -> `""`
L66    StringLiteral          `'burkina faso'` -> `""`
L66    UnaryOperator          `-2.0` -> `+2.0`
L67    StringLiteral          `'burundi'` -> `""`
L67    UnaryOperator          `-3.5` -> `+3.5`
L68    StringLiteral          `'cambodia'` -> `""`
L69    StringLiteral          `'cameroon'` -> `""`
L70    StringLiteral          `'canada (atlantic)'` -> `""`
L70    UnaryOperator          `-240` -> `+240`
L70    UnaryOperator          `-63.0` -> `+63.0`
L71    StringLiteral          `'canada (central)'` -> `""`
L71    UnaryOperator          `-360` -> `+360`
L71    UnaryOperator          `-97.0` -> `+97.0`
L72    StringLiteral          `'canada (eastern)'` -> `""`
L72    UnaryOperator          `-300` -> `+300`
L72    UnaryOperator          `-75.0` -> `+75.0`
L73    StringLiteral          `'canada (mountain)'` -> `""`
L73    UnaryOperator          `-115.0` -> `+115.0`
L73    UnaryOperator          `-420` -> `+420`
L74    StringLiteral          `'canada (newfoundland)'` -> `""`
L74    UnaryOperator          `-210` -> `+210`
L74    UnaryOperator          `-56.0` -> `+56.0`
L75    StringLiteral          `'canada (pacific)'` -> `""`
L75    UnaryOperator          `-480` -> `+480`
L75    UnaryOperator          `-120.0` -> `+120.0`
L76    StringLiteral          `'cape verde'` -> `""`
L76    UnaryOperator          `-60` -> `+60`
L76    UnaryOperator          `-24.0` -> `+24.0`
L77    StringLiteral          `'caribbean nl'` -> `""`
L77    UnaryOperator          `-240` -> `+240`
L77    UnaryOperator          `-68.3` -> `+68.3`
L78    StringLiteral          `'cayman islands'` -> `""`
L78    UnaryOperator          `-300` -> `+300`
L78    UnaryOperator          `-80.5` -> `+80.5`
L79    StringLiteral          `'central african rep.'` -> `""`
L80    StringLiteral          `'chad'` -> `""`
L81    StringLiteral          `'chile (continental)'` -> `""`
L81    UnaryOperator          `-30.0` -> `+30.0`
L82    StringLiteral          `'chile (easter island)'` -> `""`
L82    UnaryOperator          `-360` -> `+360`
L82    UnaryOperator          `-27.1` -> `+27.1`
L82    UnaryOperator          `-109.4` -> `+109.4`
L83    StringLiteral          `'china'` -> `""`
L84    StringLiteral          `'christmas island'` -> `""`
L84    UnaryOperator          `-10.5` -> `+10.5`
L85    StringLiteral          `'cocos islands'` -> `""`
L85    UnaryOperator          `-12.5` -> `+12.5`
L86    StringLiteral          `'colombia'` -> `""`
L86    UnaryOperator          `-300` -> `+300`
L86    UnaryOperator          `-72.0` -> `+72.0`
L87    StringLiteral          `'comoros'` -> `""`
L87    UnaryOperator          `-12.2` -> `+12.2`
L88    StringLiteral          `'cook islands'` -> `""`
L88    UnaryOperator          `-600` -> `+600`
L88    UnaryOperator          `-21.2` -> `+21.2`
L88    UnaryOperator          `-159.8` -> `+159.8`
L89    StringLiteral          `'costa rica'` -> `""`
L89    UnaryOperator          `-360` -> `+360`
L89    UnaryOperator          `-84.0` -> `+84.0`
L90    StringLiteral          `'cote d\'ivoire'` -> `""`
L90    UnaryOperator          `-5.0` -> `+5.0`
L91    StringLiteral          `'croatia'` -> `""`
L92    StringLiteral          `'cuba'` -> `""`
L92    UnaryOperator          `-300` -> `+300`
L92    UnaryOperator          `-80.0` -> `+80.0`
L93    StringLiteral          `'curacao'` -> `""`
L93    UnaryOperator          `-240` -> `+240`
L93    UnaryOperator          `-69.0` -> `+69.0`
L94    StringLiteral          `'cyprus'` -> `""`
L95    StringLiteral          `'czech republic'` -> `""`
L96    StringLiteral          `'democratic republic of the congo'` -> `""`
L97    StringLiteral          `'denmark'` -> `""`
L98    StringLiteral          `'djibouti'` -> `""`
L99    StringLiteral          `'dominica'` -> `""`
L99    UnaryOperator          `-240` -> `+240`
L99    UnaryOperator          `-61.3` -> `+61.3`
L100   StringLiteral          `'dominican republic'` -> `""`
L100   UnaryOperator          `-240` -> `+240`
L100   UnaryOperator          `-70.7` -> `+70.7`
L101   StringLiteral          `'east timor'` -> `""`
L101   UnaryOperator          `-8.8` -> `+8.8`
L102   StringLiteral          `'ecuador'` -> `""`
L102   UnaryOperator          `-300` -> `+300`
L102   UnaryOperator          `-2.0` -> `+2.0`
L102   UnaryOperator          `-77.5` -> `+77.5`
L103   StringLiteral          `'egypt'` -> `""`
L104   StringLiteral          `'el salvador'` -> `""`
L104   UnaryOperator          `-360` -> `+360`
L104   UnaryOperator          `-88.9` -> `+88.9`
L105   StringLiteral          `'equatorial guinea'` -> `""`
L106   StringLiteral          `'eritrea'` -> `""`
L107   StringLiteral          `'estonia'` -> `""`
L108   StringLiteral          `'eswatini (swaziland)'` -> `""`
L108   UnaryOperator          `-26.5` -> `+26.5`
L109   StringLiteral          `'ethiopia'` -> `""`
L110   StringLiteral          `'falkland islands'` -> `""`
L110   UnaryOperator          `-180` -> `+180`
L110   UnaryOperator          `-51.8` -> `+51.8`
L110   UnaryOperator          `-59.0` -> `+59.0`
L111   StringLiteral          `'faroe islands'` -> `""`
L111   UnaryOperator          `-7.0` -> `+7.0`
L112   StringLiteral          `'fiji'` -> `""`
L112   UnaryOperator          `-18.0` -> `+18.0`
L113   StringLiteral          `'finland'` -> `""`
L114   StringLiteral          `'france'` -> `""`
L115   StringLiteral          `'french guiana'` -> `""`
L115   UnaryOperator          `-180` -> `+180`
L115   UnaryOperator          `-53.0` -> `+53.0`
L116   StringLiteral          `'french polynesia'` -> `""`
L116   UnaryOperator          `-600` -> `+600`
L116   UnaryOperator          `-15.0` -> `+15.0`
L116   UnaryOperator          `-140.0` -> `+140.0`
L117   StringLiteral          `'french s. terr.'` -> `""`
L117   UnaryOperator          `-49.3` -> `+49.3`
L118   StringLiteral          `'gabon'` -> `""`
L118   UnaryOperator          `-1.0` -> `+1.0`
L119   StringLiteral          `'gambia'` -> `""`
L119   UnaryOperator          `-16.6` -> `+16.6`
L120   StringLiteral          `'georgia'` -> `""`
L121   StringLiteral          `'germany'` -> `""`
L122   StringLiteral          `'ghana'` -> `""`
L122   UnaryOperator          `-2.0` -> `+2.0`
L123   StringLiteral          `'gibraltar'` -> `""`
L123   UnaryOperator          `-5.4` -> `+5.4`
L124   StringLiteral          `'greece'` -> `""`
L125   StringLiteral          `'greenland'` -> `""`
L125   UnaryOperator          `-120` -> `+120`
L125   UnaryOperator          `-40.0` -> `+40.0`
L126   StringLiteral          `'grenada'` -> `""`
L126   UnaryOperator          `-240` -> `+240`
L126   UnaryOperator          `-61.7` -> `+61.7`
L127   StringLiteral          `'guadeloupe'` -> `""`
L127   UnaryOperator          `-240` -> `+240`
L127   UnaryOperator          `-61.6` -> `+61.6`
L128   StringLiteral          `'guam'` -> `""`
L129   StringLiteral          `'guatemala'` -> `""`
L129   UnaryOperator          `-360` -> `+360`
L129   UnaryOperator          `-90.3` -> `+90.3`
L130   StringLiteral          `'guernsey'` -> `""`
L130   UnaryOperator          `-2.6` -> `+2.6`
L131   StringLiteral          `'guinea'` -> `""`
L131   UnaryOperator          `-10.0` -> `+10.0`
L132   StringLiteral          `'guinea-bissau'` -> `""`
L132   UnaryOperator          `-15.0` -> `+15.0`
L133   StringLiteral          `'guyana'` -> `""`
L133   UnaryOperator          `-240` -> `+240`
L133   UnaryOperator          `-59.0` -> `+59.0`
L134   StringLiteral          `'haiti'` -> `""`
L134   UnaryOperator          `-300` -> `+300`
L134   UnaryOperator          `-72.4` -> `+72.4`
L135   StringLiteral          `'heard island and mcdonald islands'` -> `""`
L135   UnaryOperator          `-53.1` -> `+53.1`
L136   StringLiteral          `'honduras'` -> `""`
L136   UnaryOperator          `-360` -> `+360`
L136   UnaryOperator          `-86.5` -> `+86.5`
L137   StringLiteral          `'hong kong'` -> `""`
L138   StringLiteral          `'hungary'` -> `""`
L139   StringLiteral          `'iceland'` -> `""`
L139   UnaryOperator          `-18.0` -> `+18.0`
L140   StringLiteral          `'india'` -> `""`
L141   StringLiteral          `'indonesia (wib)'` -> `""`
L141   UnaryOperator          `-6.2` -> `+6.2`
L142   StringLiteral          `'indonesia (wit)'` -> `""`
L142   UnaryOperator          `-4.0` -> `+4.0`
L143   StringLiteral          `'indonesia (wita)'` -> `""`
L143   UnaryOperator          `-2.0` -> `+2.0`
L144   StringLiteral          `'iran'` -> `""`
L145   StringLiteral          `'iraq'` -> `""`
L146   StringLiteral          `'ireland'` -> `""`
L146   UnaryOperator          `-8.0` -> `+8.0`
L147   StringLiteral          `'isle of man'` -> `""`
L147   UnaryOperator          `-4.5` -> `+4.5`
L148   StringLiteral          `'israel'` -> `""`
L149   StringLiteral          `'italy'` -> `""`
L150   StringLiteral          `'jamaica'` -> `""`
L150   UnaryOperator          `-300` -> `+300`
L150   UnaryOperator          `-77.5` -> `+77.5`
L151   StringLiteral          `'japan'` -> `""`
L152   StringLiteral          `'jersey'` -> `""`
L152   UnaryOperator          `-2.2` -> `+2.2`
L153   StringLiteral          `'jordan'` -> `""`
L154   StringLiteral          `'kazakhstan (east)'` -> `""`
L155   StringLiteral          `'kazakhstan (west)'` -> `""`
L156   StringLiteral          `'kenya'` -> `""`
L157   StringLiteral          `'kiribati'` -> `""`
L158   StringLiteral          `'kosovo'` -> `""`
L159   StringLiteral          `'kuwait'` -> `""`
L160   StringLiteral          `'kyrgyzstan'` -> `""`
L161   StringLiteral          `'laos'` -> `""`
L162   StringLiteral          `'latvia'` -> `""`
L163   StringLiteral          `'lebanon'` -> `""`
L164   StringLiteral          `'lesotho'` -> `""`
L164   UnaryOperator          `-29.5` -> `+29.5`
L165   StringLiteral          `'liberia'` -> `""`
L165   UnaryOperator          `-9.5` -> `+9.5`
L166   StringLiteral          `'libya'` -> `""`
L167   StringLiteral          `'liechtenstein'` -> `""`
L168   StringLiteral          `'lithuania'` -> `""`
L169   StringLiteral          `'luxembourg'` -> `""`
L170   StringLiteral          `'macau'` -> `""`
L171   StringLiteral          `'madagascar'` -> `""`
L171   UnaryOperator          `-20.0` -> `+20.0`
L172   StringLiteral          `'malawi'` -> `""`
L172   UnaryOperator          `-13.5` -> `+13.5`
L173   StringLiteral          `'malaysia'` -> `""`
L174   StringLiteral          `'maldives'` -> `""`
L175   StringLiteral          `'mali'` -> `""`
L175   UnaryOperator          `-4.0` -> `+4.0`
L176   StringLiteral          `'malta'` -> `""`
L177   StringLiteral          `'marshall islands'` -> `""`
L178   StringLiteral          `'martinique'` -> `""`
L178   UnaryOperator          `-240` -> `+240`
L178   UnaryOperator          `-61.0` -> `+61.0`
L179   StringLiteral          `'mauritania'` -> `""`
L179   UnaryOperator          `-12.0` -> `+12.0`
L180   StringLiteral          `'mauritius'` -> `""`
L180   UnaryOperator          `-20.3` -> `+20.3`
L181   StringLiteral          `'mayotte'` -> `""`
L181   UnaryOperator          `-12.8` -> `+12.8`
L182   StringLiteral          `'mexico (central)'` -> `""`
L182   UnaryOperator          `-360` -> `+360`
L182   UnaryOperator          `-101.0` -> `+101.0`
L183   StringLiteral          `'mexico (northwest)'` -> `""`
L183   UnaryOperator          `-115.0` -> `+115.0`
L183   UnaryOperator          `-480` -> `+480`
L184   StringLiteral          `'mexico (pacific)'` -> `""`
L184   UnaryOperator          `-420` -> `+420`
L184   UnaryOperator          `-110.0` -> `+110.0`
L185   StringLiteral          `'micronesia'` -> `""`
L186   StringLiteral          `'moldova'` -> `""`
L187   StringLiteral          `'monaco'` -> `""`
L188   StringLiteral          `'mongolia (east)'` -> `""`
L189   StringLiteral          `'mongolia (west)'` -> `""`
L190   StringLiteral          `'montenegro'` -> `""`
L191   StringLiteral          `'montserrat'` -> `""`
L191   UnaryOperator          `-240` -> `+240`
L191   UnaryOperator          `-62.2` -> `+62.2`
L192   StringLiteral          `'morocco'` -> `""`
L192   UnaryOperator          `-10.0` -> `+10.0`
L193   StringLiteral          `'mozambique'` -> `""`
L193   UnaryOperator          `-18.3` -> `+18.3`
L194   StringLiteral          `'myanmar (burma)'` -> `""`
L195   StringLiteral          `'namibia'` -> `""`
L195   UnaryOperator          `-22.0` -> `+22.0`
L196   StringLiteral          `'nauru'` -> `""`
L196   UnaryOperator          `-0.5` -> `+0.5`
L197   StringLiteral          `'nepal'` -> `""`
L198   StringLiteral          `'netherlands'` -> `""`
L199   StringLiteral          `'new caledonia'` -> `""`
L199   UnaryOperator          `-21.5` -> `+21.5`
L200   StringLiteral          `'new zealand'` -> `""`
L200   UnaryOperator          `-41.0` -> `+41.0`
L201   StringLiteral          `'nicaragua'` -> `""`
L201   UnaryOperator          `-85.0` -> `+85.0`
L201   UnaryOperator          `-360` -> `+360`
L202   StringLiteral          `'niger'` -> `""`
L203   StringLiteral          `'nigeria'` -> `""`
L204   StringLiteral          `'niue'` -> `""`
L204   UnaryOperator          `-660` -> `+660`
L204   UnaryOperator          `-19.0` -> `+19.0`
L204   UnaryOperator          `-169.9` -> `+169.9`
L205   StringLiteral          `'norfolk island'` -> `""`
L205   UnaryOperator          `-29.0` -> `+29.0`
L206   StringLiteral          `'north korea'` -> `""`
L207   StringLiteral          `'north macedonia'` -> `""`
L208   StringLiteral          `'northern mariana islands'` -> `""`
L209   StringLiteral          `'norway'` -> `""`
L210   StringLiteral          `'oman'` -> `""`
L211   StringLiteral          `'pakistan'` -> `""`
L212   StringLiteral          `'palau'` -> `""`
L213   StringLiteral          `'palestine'` -> `""`
L214   StringLiteral          `'panama'` -> `""`
L214   UnaryOperator          `-300` -> `+300`
L214   UnaryOperator          `-80.0` -> `+80.0`
L215   StringLiteral          `'papua new guinea'` -> `""`
L215   UnaryOperator          `-6.0` -> `+6.0`
L216   StringLiteral          `'paraguay'` -> `""`
L216   UnaryOperator          `-240` -> `+240`
L216   UnaryOperator          `-23.0` -> `+23.0`
L216   UnaryOperator          `-58.0` -> `+58.0`
L217   StringLiteral          `'peru'` -> `""`
L217   UnaryOperator          `-300` -> `+300`
L217   UnaryOperator          `-10.0` -> `+10.0`
L217   UnaryOperator          `-76.0` -> `+76.0`
L218   StringLiteral          `'philippines'` -> `""`
L219   StringLiteral          `'pitcairn'` -> `""`
L219   UnaryOperator          `-480` -> `+480`
L219   UnaryOperator          `-25.1` -> `+25.1`
L219   UnaryOperator          `-130.1` -> `+130.1`
L220   StringLiteral          `'poland'` -> `""`
L221   StringLiteral          `'portugal'` -> `""`
L221   UnaryOperator          `-8.0` -> `+8.0`
L222   StringLiteral          `'puerto rico'` -> `""`
L222   UnaryOperator          `-240` -> `+240`
L222   UnaryOperator          `-66.5` -> `+66.5`
L223   StringLiteral          `'qatar'` -> `""`
L224   StringLiteral          `'republic of the congo'` -> `""`
L224   UnaryOperator          `-1.0` -> `+1.0`
L225   StringLiteral          `'reunion'` -> `""`
L225   UnaryOperator          `-21.1` -> `+21.1`
L226   StringLiteral          `'romania'` -> `""`
L227   StringLiteral          `'russia (irkutsk)'` -> `""`
L228   StringLiteral          `'russia (kaliningrad)'` -> `""`
L229   StringLiteral          `'russia (kamchatka)'` -> `""`
L230   StringLiteral          `'russia (moscow)'` -> `""`
L231   StringLiteral          `'russia (vladivostok)'` -> `""`
L232   StringLiteral          `'russia (yekaterinburg)'` -> `""`
L233   StringLiteral          `'rwanda'` -> `""`
L233   UnaryOperator          `-2.0` -> `+2.0`
L234   StringLiteral          `'samoa (american)'` -> `""`
L234   UnaryOperator          `-660` -> `+660`
L234   UnaryOperator          `-14.3` -> `+14.3`
L234   UnaryOperator          `-170.0` -> `+170.0`
L235   StringLiteral          `'samoa (western)'` -> `""`
L235   UnaryOperator          `-13.6` -> `+13.6`
L235   UnaryOperator          `-172.3` -> `+172.3`
L236   StringLiteral          `'san marino'` -> `""`
L237   StringLiteral          `'sao tome and principe'` -> `""`
L238   StringLiteral          `'saudi arabia'` -> `""`
L239   StringLiteral          `'senegal'` -> `""`
L239   UnaryOperator          `-14.0` -> `+14.0`
L240   StringLiteral          `'serbia'` -> `""`
L241   StringLiteral          `'seychelles'` -> `""`
L241   UnaryOperator          `-4.6` -> `+4.6`
L242   StringLiteral          `'sierra leone'` -> `""`
L242   UnaryOperator          `-11.5` -> `+11.5`
L243   StringLiteral          `'singapore'` -> `""`
L244   StringLiteral          `'slovakia'` -> `""`
L245   StringLiteral          `'slovenia'` -> `""`
L246   StringLiteral          `'solomon islands'` -> `""`
L246   UnaryOperator          `-8.0` -> `+8.0`
L247   StringLiteral          `'somalia'` -> `""`
L248   StringLiteral          `'south africa'` -> `""`
L248   UnaryOperator          `-29.0` -> `+29.0`
L249   StringLiteral          `'south georgia and south sandwich islands'` -> `""`
L249   UnaryOperator          `-120` -> `+120`
L249   UnaryOperator          `-54.5` -> `+54.5`
L249   UnaryOperator          `-37.0` -> `+37.0`
L250   StringLiteral          `'south korea'` -> `""`
L251   StringLiteral          `'south sudan'` -> `""`
L252   StringLiteral          `'spain'` -> `""`
L252   UnaryOperator          `-4.0` -> `+4.0`
L253   StringLiteral          `'sri lanka'` -> `""`
L254   StringLiteral          `'st barthelemy'` -> `""`
L254   UnaryOperator          `-240` -> `+240`
L254   UnaryOperator          `-62.8` -> `+62.8`
L255   StringLiteral          `'st helena'` -> `""`
L255   UnaryOperator          `-15.9` -> `+15.9`
L255   UnaryOperator          `-5.7` -> `+5.7`
L256   StringLiteral          `'st kitts and nevis'` -> `""`
L256   UnaryOperator          `-240` -> `+240`
L256   UnaryOperator          `-62.8` -> `+62.8`
L257   StringLiteral          `'st lucia'` -> `""`
L257   UnaryOperator          `-240` -> `+240`
L257   UnaryOperator          `-61.0` -> `+61.0`
L258   StringLiteral          `'st maarten (dutch)'` -> `""`
L258   UnaryOperator          `-63.1` -> `+63.1`
L258   UnaryOperator          `-240` -> `+240`
L259   StringLiteral          `'st martin (french)'` -> `""`
L259   UnaryOperator          `-240` -> `+240`
L259   UnaryOperator          `-63.9` -> `+63.9`
L260   StringLiteral          `'st pierre and miquelon'` -> `""`
L260   UnaryOperator          `-180` -> `+180`
L260   UnaryOperator          `-56.3` -> `+56.3`
L261   StringLiteral          `'st vincent'` -> `""`
L261   UnaryOperator          `-240` -> `+240`
L261   UnaryOperator          `-61.2` -> `+61.2`
L262   StringLiteral          `'sudan'` -> `""`
L263   StringLiteral          `'suriname'` -> `""`
L263   UnaryOperator          `-180` -> `+180`
L263   UnaryOperator          `-56.0` -> `+56.0`
L264   StringLiteral          `'svalbard and jan mayen'` -> `""`
L265   StringLiteral          `'sweden'` -> `""`
L266   StringLiteral          `'switzerland'` -> `""`
L267   StringLiteral          `'syria'` -> `""`
L268   StringLiteral          `'taiwan'` -> `""`
L269   StringLiteral          `'tajikistan'` -> `""`
L270   StringLiteral          `'tanzania'` -> `""`
L270   UnaryOperator          `-6.0` -> `+6.0`
L271   StringLiteral          `'thailand'` -> `""`
L272   StringLiteral          `'togo'` -> `""`
L273   StringLiteral          `'tokelau'` -> `""`
L273   UnaryOperator          `-9.0` -> `+9.0`
L273   UnaryOperator          `-172.0` -> `+172.0`
L274   StringLiteral          `'tonga'` -> `""`
L274   UnaryOperator          `-20.0` -> `+20.0`
L274   UnaryOperator          `-175.0` -> `+175.0`
L275   StringLiteral          `'trinidad and tobago'` -> `""`
L275   UnaryOperator          `-240` -> `+240`
L275   UnaryOperator          `-61.0` -> `+61.0`
L276   StringLiteral          `'tunisia'` -> `""`
L277   StringLiteral          `'turkey'` -> `""`
L278   StringLiteral          `'turkmenistan'` -> `""`
L279   StringLiteral          `'turks and caicos is'` -> `""`
L279   UnaryOperator          `-300` -> `+300`
L279   UnaryOperator          `-71.6` -> `+71.6`
L280   StringLiteral          `'tuvalu'` -> `""`
L280   UnaryOperator          `-8.0` -> `+8.0`
L281   StringLiteral          `'u.s. virgin islands'` -> `""`
L281   UnaryOperator          `-64.8` -> `+64.8`
L281   UnaryOperator          `-240` -> `+240`
L282   StringLiteral          `'uganda'` -> `""`
L283   StringLiteral          `'ukraine'` -> `""`
L284   StringLiteral          `'united arab emirates'` -> `""`
L285   StringLiteral          `'united kingdom'` -> `""`
L285   UnaryOperator          `-2.0` -> `+2.0`
L286   StringLiteral          `'united states (alaska)'` -> `""`
L286   UnaryOperator          `-540` -> `+540`
L286   UnaryOperator          `-150.0` -> `+150.0`
L287   StringLiteral          `'united states (central)'` -> `""`
L287   UnaryOperator          `-360` -> `+360`
L287   UnaryOperator          `-90.0` -> `+90.0`
L288   StringLiteral          `'united states (eastern)'` -> `""`
L289   StringLiteral          `'united states (hawaii)'` -> `""`
L289   UnaryOperator          `-600` -> `+600`
L289   UnaryOperator          `-156.3` -> `+156.3`
L290   StringLiteral          `'united states (mountain)'` -> `""`
L290   UnaryOperator          `-420` -> `+420`
L290   UnaryOperator          `-106.0` -> `+106.0`
L291   StringLiteral          `'united states (pacific)'` -> `""`
L291   UnaryOperator          `-480` -> `+480`
L291   UnaryOperator          `-119.5` -> `+119.5`
L292   StringLiteral          `'uruguay'` -> `""`
L292   UnaryOperator          `-180` -> `+180`
L292   UnaryOperator          `-33.0` -> `+33.0`
L292   UnaryOperator          `-56.0` -> `+56.0`
L293   StringLiteral          `'us minor outlying islands'` -> `""`
L293   UnaryOperator          `-660` -> `+660`
L293   UnaryOperator          `-177.4` -> `+177.4`
L294   StringLiteral          `'uzbekistan'` -> `""`
L295   StringLiteral          `'vanuatu'` -> `""`
L295   UnaryOperator          `-16.0` -> `+16.0`
L296   StringLiteral          `'vatican'` -> `""`
L297   StringLiteral          `'venezuela'` -> `""`
L297   UnaryOperator          `-240` -> `+240`
L297   UnaryOperator          `-66.0` -> `+66.0`
L298   StringLiteral          `'vietnam'` -> `""`
L299   StringLiteral          `'wallis and futuna'` -> `""`
L299   UnaryOperator          `-13.3` -> `+13.3`
L299   UnaryOperator          `-176.2` -> `+176.2`
L300   StringLiteral          `'western sahara'` -> `""`
L300   UnaryOperator          `-13.0` -> `+13.0`
L301   StringLiteral          `'yemen'` -> `""`
L302   StringLiteral          `'zambia'` -> `""`
L302   UnaryOperator          `-15.0` -> `+15.0`
L303   StringLiteral          `'zimbabwe'` -> `""`
L303   UnaryOperator          `-20.0` -> `+20.0`
```

### `core/engine.js` — 14 undetected

Mutators: StringLiteral ×5 · ConditionalExpression ×4 · EqualityOperator ×2 · LogicalOperator ×2 · BlockStatement ×1

```
L33    BlockStatement         `{ …` -> `{}`  [no-coverage]
L33    ConditionalExpression  `!Number.isInteger(n) || n < 1` -> `false`
L33    ConditionalExpression  `!Number.isInteger(n) || n < 1 || n > 3999` -> `false`
L33    ConditionalExpression  `n < 1` -> `false`
L33    ConditionalExpression  `n > 3999` -> `false`
L33    EqualityOperator       `n > 3999` -> `n >= 3999`
L33    LogicalOperator        `!Number.isInteger(n) || n < 1 || n > 3999` -> `(!Number.isInteger(n) || n < 1) && n > 3999`
L33    LogicalOperator        `!Number.isInteger(n) || n < 1` -> `!Number.isInteger(n) && n < 1`
L34    StringLiteral          ``toRoman: out of range integer ${n}`` -> ````  [no-coverage]
L37    StringLiteral          `'m'` -> `""`
L37    StringLiteral          `'cm'` -> `""`
L37    StringLiteral          `'d'` -> `""`
L37    StringLiteral          `'cd'` -> `""`
L40    EqualityOperator       `i < values.length` -> `i <= values.length`
```

### `core/payments.js` — 6 undetected

Mutators: ConditionalExpression ×3 · StringLiteral ×2 · EqualityOperator ×1

```
L20    EqualityOperator       `n < 0` -> `n <= 0`
L45    ConditionalExpression  `value === undefined` -> `false`
L52    ConditionalExpression  `clean === null` -> `false`
L52    StringLiteral          ``Unknown facet index: ${current}`` -> ````  [no-coverage]
L64    ConditionalExpression  `cleanFacet === null` -> `false`
L64    StringLiteral          ``Unknown facet index: ${facetIndex}`` -> ````  [no-coverage]
```

### `core/pillars.js` — 1 undetected

Mutators: ConditionalExpression ×1

```
L124   ConditionalExpression  `typeof hour !== 'number'` -> `false`
```

### `core/profile.js` — 103 undetected

Mutators: ConditionalExpression ×48 · EqualityOperator ×19 · LogicalOperator ×12 · ArrayDeclaration ×10 · Regex ×7 · StringLiteral ×5 · BlockStatement ×1 · MethodExpression ×1

```
L26    ArrayDeclaration       `[2, 19]` -> `[]`
L27    ArrayDeclaration       `[3, 21]` -> `[]`
L27    ArrayDeclaration       `[4, 19]` -> `[]`
L28    ArrayDeclaration       `[4, 20]` -> `[]`
L30    ArrayDeclaration       `[6, 21]` -> `[]`
L31    ArrayDeclaration       `[7, 23]` -> `[]`
L32    ArrayDeclaration       `[8, 23]` -> `[]`
L33    ArrayDeclaration       `[9, 23]` -> `[]`
L34    ArrayDeclaration       `[10, 23]` -> `[]`
L35    ArrayDeclaration       `[11, 22]` -> `[]`
L46    StringLiteral          `'water'` -> `""`
L52    BlockStatement         `{ …` -> `{}`  [no-coverage]
L52    ConditionalExpression  `sm === em` -> `false`
L53    ConditionalExpression  `month === sm && day >= sd && day <= ed` -> `true`  [no-coverage]
L53    ConditionalExpression  `month === sm && day >= sd && day <= ed` -> `false`  [no-coverage]
L53    ConditionalExpression  `month === sm && day >= sd` -> `true`  [no-coverage]
L53    ConditionalExpression  `month === sm` -> `true`  [no-coverage]
L53    ConditionalExpression  `day >= sd` -> `true`  [no-coverage]
L53    ConditionalExpression  `day <= ed` -> `true`  [no-coverage]
L53    EqualityOperator       `month === sm` -> `month !== sm`  [no-coverage]
L53    EqualityOperator       `day >= sd` -> `day > sd`  [no-coverage]
L53    EqualityOperator       `day >= sd` -> `day < sd`  [no-coverage]
L53    EqualityOperator       `day <= ed` -> `day < ed`  [no-coverage]
L53    EqualityOperator       `day <= ed` -> `day > ed`  [no-coverage]
L53    LogicalOperator        `month === sm && day >= sd && day <= ed` -> `month === sm && day >= sd || day <= ed`  [no-coverage]
L53    LogicalOperator        `month === sm && day >= sd` -> `month === sm || day >= sd`  [no-coverage]
L54    ConditionalExpression  `sm > em` -> `true`
L54    ConditionalExpression  `sm > em` -> `false`
L54    EqualityOperator       `sm > em` -> `sm >= em`
L54    EqualityOperator       `sm > em` -> `sm <= em`
L58    ConditionalExpression  `day >= sd` -> `true`
L59    EqualityOperator       `day <= ed` -> `day < ed`
L60    ConditionalExpression  `month > sm && month < em` -> `false`
L60    ConditionalExpression  `month > sm` -> `true`
L60    EqualityOperator       `month > sm` -> `month >= sm`
L60    EqualityOperator       `month > sm` -> `month <= sm`
L63    StringLiteral          `'aries'` -> `""`  [no-coverage]
L170   ConditionalExpression  `!name` -> `false`
L174   ConditionalExpression  `code > 122` -> `false`
L174   EqualityOperator       `code > 122` -> `code >= 122`
L186   StringLiteral          `'u'` -> `""`
L192   ConditionalExpression  `!name` -> `false`
L197   ConditionalExpression  `code > 122` -> `false`
L197   EqualityOperator       `code < 97` -> `code <= 97`
L210   ConditionalExpression  `!name` -> `false`
L236   ConditionalExpression  `lifePath === null || nameNumber === null` -> `false`
L236   ConditionalExpression  `lifePath === null` -> `false`
L236   ConditionalExpression  `nameNumber === null` -> `false`
L236   LogicalOperator        `lifePath === null || nameNumber === null` -> `lifePath === null && nameNumber === null`
L244   Regex                  `/^\d{4}-\d{2}-\d{2}$/` -> `/\d{4}-\d{2}-\d{2}$/`
L244   Regex                  `/^\d{4}-\d{2}-\d{2}$/` -> `/^\d{4}-\d{2}-\d{2}/`
L248   ConditionalExpression  `m < 1` -> `false`
L248   ConditionalExpression  `d < 1` -> `false`
L248   ConditionalExpression  `d > 31` -> `false`
L261   MethodExpression       `(name || '').trim()` -> `name || ''`
L261   StringLiteral          `''` -> `"Stryker was here!"`  [no-coverage]
L276   ConditionalExpression  `typeof opts.lat === 'number'` -> `true`
L276   ConditionalExpression  `typeof opts.lng === 'number'` -> `true`
L277   Regex                  `/^(\d{1,2}):(\d{2})$/` -> `/(\d{1,2}):(\d{2})$/`
L277   Regex                  `/^(\d{1,2}):(\d{2})$/` -> `/^(\d{1,2}):(\d{2})/`
L278   ConditionalExpression  `tm` -> `true`
L281   ConditionalExpression  `hour >= 0 && hour <= 23 …` -> `true`
L281   ConditionalExpression  `hour >= 0 && hour <= 23 …` -> `true`
L281   ConditionalExpression  `hour >= 0 && hour <= 23 …` -> `true`
L281   ConditionalExpression  `hour >= 0 && hour <= 23 …` -> `true`
L281   ConditionalExpression  `hour >= 0 && hour <= 23 …` -> `true`
L281   ConditionalExpression  `hour >= 0 && hour <= 23 …` -> `true`
L281   ConditionalExpression  `hour >= 0 && hour <= 23` -> `true`
L281   ConditionalExpression  `hour >= 0` -> `true`
L281   ConditionalExpression  `hour <= 23` -> `true`
L281   EqualityOperator       `hour <= 23` -> `hour < 23`
L281   LogicalOperator        `hour >= 0 && hour <= 23 …` -> `hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && opts.lat >= `
L281   LogicalOperator        `hour >= 0 && hour <= 23 …` -> `hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && opts.lat >= `
L281   LogicalOperator        `hour >= 0 && hour <= 23 …` -> `hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && opts.lat >= `
L281   LogicalOperator        `hour >= 0 && hour <= 23 …` -> `hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 || opts.lat >= `
L281   LogicalOperator        `hour >= 0 && hour <= 23 …` -> `hour >= 0 && hour <= 23 && minute >= 0 || minute <= 59`
L281   LogicalOperator        `hour >= 0 && hour <= 23 …` -> `hour >= 0 && hour <= 23 || minute >= 0`
L281   LogicalOperator        `hour >= 0 && hour <= 23` -> `hour >= 0 || hour <= 23`
L282   ConditionalExpression  `minute >= 0` -> `true`
L282   ConditionalExpression  `minute <= 59` -> `true`
L282   EqualityOperator       `minute <= 59` -> `minute < 59`
L283   ConditionalExpression  `opts.lat >= -90` -> `true`
L283   ConditionalExpression  `opts.lat <= 90` -> `true`
L283   EqualityOperator       `opts.lat >= -90` -> `opts.lat > -90`
L283   EqualityOperator       `opts.lat <= 90` -> `opts.lat < 90`
L284   ConditionalExpression  `opts.lng >= -180` -> `true`
L284   ConditionalExpression  `opts.lng <= 180` -> `true`
L284   EqualityOperator       `opts.lng >= -180` -> `opts.lng > -180`
L284   EqualityOperator       `opts.lng <= 180` -> `opts.lng < 180`
L285   ConditionalExpression  `opts.tz.length > 0` -> `true`
L285   EqualityOperator       `opts.tz.length > 0` -> `opts.tz.length >= 0`
L288   ConditionalExpression  `tz` -> `true`
L303   Regex                  `/^(\d{1,2}):(\d{2})$/` -> `/(\d{1,2}):(\d{2})$/`
L303   Regex                  `/^(\d{1,2}):(\d{2})$/` -> `/^(\d{1,2}):(\d{2})/`
L307   ConditionalExpression  `hpHour >= 0 && hpHour <= 23 && hpMinute >= 0` -> `true`
L307   ConditionalExpression  `hpHour >= 0 && hpHour <= 23` -> `true`
L307   ConditionalExpression  `hpHour >= 0` -> `true`
L307   ConditionalExpression  `hpHour <= 23` -> `true`
L307   ConditionalExpression  `hpMinute >= 0` -> `true`
L307   LogicalOperator        `hpHour >= 0 && hpHour <= 23 && hpMinute >= 0` -> `hpHour >= 0 && hpHour <= 23 || hpMinute >= 0`
L307   LogicalOperator        `hpHour >= 0 && hpHour <= 23` -> `hpHour >= 0 || hpHour <= 23`
L314   Regex                  `/\s+/` -> `/\s/`
L314   StringLiteral          `''` -> `"Stryker was here!"`  [no-coverage]
```

### `core/rising.js` — 39 undetected

Mutators: ArithmeticOperator ×12 · ConditionalExpression ×12 · EqualityOperator ×5 · StringLiteral ×4 · Regex ×4 · BooleanLiteral ×1 · LogicalOperator ×1

```
L15    StringLiteral          `'gemini'` -> `""`
L16    StringLiteral          `'aquarius'` -> `""`
L16    StringLiteral          `'pisces'` -> `""`
L25    ArithmeticOperator     `utHours / 24` -> `utHours * 24`
L26    ArithmeticOperator     `dayDelta * 24` -> `dayDelta / 24`
L27    ArithmeticOperator     `day + dayDelta` -> `day - dayDelta`
L39    EqualityOperator       `m <= 2` -> `m < 2`
L55    ArithmeticOperator     `280.46061837 …` -> `280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * `
L55    ArithmeticOperator     `280.46061837 …` -> `280.46061837 + 360.98564736629 * (JD - 2451545.0) - 0.000387933 * T * `
L64    ArithmeticOperator     `23.4392911 …` -> `23.4392911 - 0.0130042 * T - 0.00000164 * T * T - 0.000000503 * T * T `
L64    ArithmeticOperator     `23.4392911 …` -> `23.4392911 - 0.0130042 * T + 0.00000164 * T * T`
L86    ConditionalExpression  `diff < 1 || diff > 179` -> `true`
L86    ConditionalExpression  `diff < 1` -> `false`
L86    EqualityOperator       `diff < 1` -> `diff <= 1`
L86    EqualityOperator       `diff < 1` -> `diff >= 1`
L86    EqualityOperator       `diff > 179` -> `diff >= 179`
L87    ArithmeticOperator     `asc + 180` -> `asc - 180`
L118   BooleanLiteral         `false` -> `true`
L125   ConditionalExpression  `!offPart` -> `false`
L127   ConditionalExpression  `s === 'GMT'` -> `false`
L127   StringLiteral          `'GMT'` -> `""`
L129   Regex                  `/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/` -> `/GMT([+-])(\d{1,2})(?::?(\d{2}))?$/`
L129   Regex                  `/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/` -> `/^GMT([+-])(\d{1,2})(?::?(\d{2}))?/`
L129   Regex                  `/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/` -> `/^GMT([+-])(\d{1,2})(?::?(\d{2}))$/`
L129   Regex                  `/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/` -> `/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/`
L130   ConditionalExpression  `!m` -> `false`
L132   ArithmeticOperator     `parseInt(m[2], 10) * 60 + (m[3] ? parseInt(m[3], 10) : 0)` -> `parseInt(m[2], 10) * 60 - (m[3] ? parseInt(m[3], 10) : 0)`
L136   ConditionalExpression  `typeof tz !== 'string' || tz.length === 0` -> `false`
L136   ConditionalExpression  `typeof tz !== 'string'` -> `false`
L136   ConditionalExpression  `tz.length === 0` -> `false`
L136   LogicalOperator        `typeof tz !== 'string' || tz.length === 0` -> `typeof tz !== 'string' && tz.length === 0`
L138   ConditionalExpression  `isNaN(guess.getTime())` -> `false`
L140   ConditionalExpression  `o1 === null` -> `false`
L141   ArithmeticOperator     `guess.getTime() - o1 * 60 * 1000` -> `guess.getTime() + o1 * 60 * 1000`
L141   ArithmeticOperator     `o1 * 60 * 1000` -> `o1 * 60 / 1000`
L141   ArithmeticOperator     `o1 * 60` -> `o1 / 60`
L143   ConditionalExpression  `o2 === null` -> `true`
L143   ConditionalExpression  `o2 === null` -> `false`
L143   EqualityOperator       `o2 === null` -> `o2 !== null`
```

## Regenerating

Only needed if `core/` or the suite changes — this file is the record for the
tree at `4df1eee`:

```sh
npm i --no-save @stryker-mutator/core @stryker-mutator/vitest-runner
cat > stryker.config.json <<'EOF'
{ "mutate": ["core/**/*.js"], "testRunner": "vitest",
  "coverageAnalysis": "perTest", "reporters": ["progress","clear-text","json"],
  "timeoutMS": 10000, "concurrency": 3 }
EOF
# skip tests/cities_search.test.js's source-pin test for the run, then:
npx stryker run   # ~14 min; report at reports/mutation/mutation.json
# cleanup: revert the skip, rm -rf .stryker-tmp reports stryker.config.json, npm ci
```
