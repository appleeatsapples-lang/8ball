#!/usr/bin/env python3
"""8ball / audits / project_audit.py

Read-only, deterministic audit of the 8ball PRODUCT repository only
(no ops-tree / operations checks — a separate tool elsewhere owns those
and invokes this script as a subprocess, merging this JSON into a combined
report). Nothing here writes to tracked files, mutates git state, or
depends on anything outside this git checkout.

Runs standalone in GitHub Actions CI: pure Python 3 stdlib, shelling out to
`git`/`node`/`npm`/`bash` (all already used elsewhere in this repo).

Exit codes:
  0 — ran fine, no blocking-severity check has status == "fail".
  1 — at least one blocking-severity check has status == "fail".
  2 — --product doesn't look like this repo (missing package.json or not a
      git repo) — configuration failure. A partial report is still written.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# ── shared plumbing (mirrors the reference implementation exactly) ────────

MAX_CAPTURE_CHARS = 16_000


def clip(text, limit=MAX_CAPTURE_CHARS):
    if text is None:
        return ""
    if len(text) <= limit:
        return text
    return text[:limit] + f"\n… truncated {len(text) - limit} characters"


def run_cmd(cmd, cwd=None, env=None, timeout=None):
    """subprocess.run wrapper. Returns (returncode, stdout, stderr, duration,
    exc). exc is None on normal completion (any returncode); on OSError /
    TimeoutExpired, returncode is None and exc carries the exception."""
    start = time.monotonic()
    try:
        proc = subprocess.run(
            cmd, cwd=cwd, env=env, text=True, capture_output=True,
            timeout=timeout, check=False,
        )
        duration = time.monotonic() - start
        return proc.returncode, proc.stdout or "", proc.stderr or "", duration, None
    except (OSError, subprocess.TimeoutExpired) as exc:
        duration = time.monotonic() - start
        out = getattr(exc, "stdout", None) or ""
        err = getattr(exc, "stderr", None) or ""
        if isinstance(out, bytes):
            out = out.decode("utf-8", "replace")
        if isinstance(err, bytes):
            err = err.decode("utf-8", "replace")
        return None, out, err, duration, exc


def make_check(check_id, title, severity, status, summary, duration, command, output, evidence):
    return {
        "id": check_id,
        "title": title,
        "category": "product",
        "status": status,
        "severity": severity,
        "summary": summary,
        "duration_seconds": round(float(duration), 3),
        "command": command,
        "output": output,
        "evidence": evidence,
    }


def run_check(check_id, title, severity, cmd, cwd=None, env=None, timeout=None, evaluate=None):
    """Standard subprocess-backed check. On runner error (OSError /
    TimeoutExpired), records status="fail" regardless of `evaluate`,
    preserving the check's declared severity so a timeout on a blocking
    check still drives exit code 1. Otherwise, `evaluate(rc, stdout,
    stderr) -> (status, summary, evidence)` decides the outcome; if
    `evaluate` is None, the default rule is pass iff returncode == 0."""
    rc, out, err, duration, exc = run_cmd(cmd, cwd=cwd, env=env, timeout=timeout)
    combined_output = clip(out + err)
    if exc is not None:
        return make_check(
            check_id, title, severity, "fail",
            f"runner error: {type(exc).__name__}: {exc}",
            duration, cmd, combined_output, {},
        )
    if evaluate is not None:
        status, summary, evidence = evaluate(rc, out, err)
    else:
        status = "pass" if rc == 0 else "fail"
        summary = f"exit code {rc}"
        evidence = {"returncode": rc}
    return make_check(check_id, title, severity, status, summary, duration, cmd, combined_output, evidence)


# ── individual checks ──────────────────────────────────────────────────────

def check_git_status(product_root):
    def evaluate(rc, out, err):
        if rc != 0:
            return "fail", f"git status exited {rc}", {"returncode": rc}
        dirty_lines = [ln for ln in out.splitlines() if ln.strip()]
        if dirty_lines:
            return "warn", f"working tree is dirty ({len(dirty_lines)} entries)", {"entries": len(dirty_lines)}
        return "pass", "working tree clean", {"entries": 0}
    return run_check(
        "product.git_status", "git status (porcelain)", "advisory",
        ["git", "status", "--porcelain=v1"], cwd=product_root, evaluate=evaluate,
    )


def check_git_head(product_root):
    def evaluate(rc, out, err):
        if rc == 0:
            return "pass", f"HEAD = {out.strip()}", {"head": out.strip()}
        return "fail", f"git rev-parse HEAD exited {rc}", {"returncode": rc}
    return run_check(
        "product.git_head", "git HEAD commit", "info",
        ["git", "rev-parse", "HEAD"], cwd=product_root, evaluate=evaluate,
    )


def check_git_origin_main(product_root):
    def evaluate(rc, out, err):
        if rc == 0:
            return "pass", f"origin/main = {out.strip()}", {"origin_main": out.strip()}
        return "warn", "origin/main did not resolve (no network/remote?)", {
            "returncode": rc, "stderr": clip(err, 2000),
        }
    return run_check(
        "product.git_origin_main", "git origin/main resolves", "advisory",
        ["git", "rev-parse", "origin/main"], cwd=product_root, evaluate=evaluate,
    )


def check_diff_check(product_root):
    def evaluate(rc, out, err):
        if rc == 0:
            return "pass", "no whitespace/conflict-marker issues in origin/main...HEAD", {"returncode": rc}
        return "fail", "git diff --check flagged issues in origin/main...HEAD (see output)", {"returncode": rc}
    return run_check(
        "product.diff_check", "git diff --check origin/main...HEAD", "blocking",
        ["git", "diff", "--check", "origin/main...HEAD"], cwd=product_root, evaluate=evaluate,
    )


def check_worktree_diff_check(product_root):
    def evaluate(rc, out, err):
        if rc == 0:
            return "pass", "no whitespace/conflict-marker issues in the working tree", {"returncode": rc}
        return "fail", "git diff --check flagged issues in the working tree (see output)", {"returncode": rc}
    return run_check(
        "product.worktree_diff_check", "git diff --check (worktree)", "blocking",
        ["git", "diff", "--check"], cwd=product_root, evaluate=evaluate,
    )


def check_tests(product_root):
    def evaluate(rc, out, err):
        if rc == 0:
            return "pass", "npm test passed", {"returncode": rc}
        return "fail", "npm test failed (see output)", {"returncode": rc}
    return run_check(
        "product.tests", "npm test", "blocking",
        ["npm", "test"], cwd=product_root, timeout=240, evaluate=evaluate,
    )


def check_local_pii(product_root):
    check_id = "product.local_pii"
    title = "local PII audit (audits/run_local_audit.sh)"
    cmd = ["bash", "audits/run_local_audit.sh"]
    pattern_file = product_root / "audits" / "local_personal_data.txt"
    if not pattern_file.exists():
        return make_check(
            check_id, title, "blocking", "skip",
            "audits/local_personal_data.txt is absent (gitignored, operator-local) — "
            "expected in a fresh CI checkout, not a defect",
            0.0, cmd, "", {"pattern_file_exists": False},
        )

    def evaluate(rc, out, err):
        if rc == 0:
            return "pass", "local PII audit clean", {"returncode": rc}
        return "fail", "local PII audit found hits (see output)", {"returncode": rc}
    return run_check(check_id, title, "blocking", cmd, cwd=product_root, timeout=180, evaluate=evaluate)


def check_index_budget(product_root):
    check_id = "product.index_budget"
    title = "index.html single-file line budget (DOCTRINE §6)"
    start = time.monotonic()
    path = product_root / "index.html"
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        duration = time.monotonic() - start
        return make_check(check_id, title, "blocking", "fail",
                           f"could not read index.html: {exc}", duration, None, "", {})
    lines = text.splitlines()
    n = len(lines)
    duration = time.monotonic() - start
    status = "pass" if n <= 1500 else "fail"
    summary = f"index.html is {n} lines (limit 1500)"
    return make_check(check_id, title, "blocking", status, summary, duration, None, "", {"lines": n, "limit": 1500})


T4_MIGRATION_SCRIPT = """
const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};
store.set('eight_ball_tier_v1', 't4');
const mod = await import('./ui/payments.js');
const resolved = mod.getRenderTier();
const storedAfter = globalThis.localStorage.getItem('eight_ball_tier_v1');
if (resolved !== 't3') {
  console.error(`FAIL: getRenderTier() resolved ${JSON.stringify(resolved)}, expected 't3'`);
  process.exit(1);
}
if (storedAfter !== 't3') {
  console.error(`FAIL: localStorage['eight_ball_tier_v1'] after getRenderTier() is ${JSON.stringify(storedAfter)}, expected 't3'`);
  process.exit(1);
}
console.log('PASS: raw stored t4 resolves to t3 via getRenderTier() and persists t3 to storage');
process.exit(0);
"""


def check_t4_migration(product_root):
    check_id = "product.t4_migration"
    title = "retired-tier t4 -> t3 migration (ui/payments.js getRenderTier)"
    cmd = ["node", "--input-type=module", "-e", T4_MIGRATION_SCRIPT]

    def evaluate(rc, out, err):
        if rc == 0:
            return "pass", "t4 -> t3 render + persistence migration verified", {"returncode": rc}
        return "fail", "t4 -> t3 migration assertion failed (see output)", {"returncode": rc}
    return run_check(check_id, title, "blocking", cmd, cwd=product_root, timeout=30, evaluate=evaluate)


# The HKO authority fixture covers 1901–2100 inclusive: 200 years, 12 solar
# terms per year, one lunar-new-year row per year. These pins are the
# acceptance contract — a run that compares anything less is a failure, never
# a quieter pass. (2026-07-30 completion audit: a zero-year fixture used to
# satisfy the old mismatch-count-only predicate.)
HKO_YEAR_START = 1901
HKO_YEAR_END = 2100
HKO_EXPECTED_YEARS = 200
HKO_EXPECTED_SOLAR_COMPARISONS = 2400
HKO_EXPECTED_LUNAR_COMPARISONS = 200
HKO_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
HKO_RETRIEVED_AT_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Content digest of the accepted fixture, over a canonical (key-sorted,
# whitespace-free) serialization of the whole parsed object — so reformatting
# is tolerated but any VALUE change is not.
#
# Why this exists: every other pin here is structural, and the comparator's
# own counts are tautological once the structure validates (it derives
# solarComparisons as comparedYears x 12). So a fixture whose term dates were
# regenerated from a broken core/calendar.js — source block, the 200 real
# source_sha256 digests and every key set left untouched — would satisfy all
# of them and report "0 mismatches" while proving nothing. This digest is what
# binds the fixture's VALUES to a reviewed state.
#
# Regenerating the fixture is therefore a deliberate two-step act: re-run
# scripts/extract_hko_fixture.py, then update this constant in the same
# commit, so the new authority values land in a reviewable diff.
HKO_FIXTURE_CONTENT_SHA256 = "6358cb0b2a0c83bb79e4fcc5ad619d31da55f105e3f3adf9d7737aed52e088e1"


def hko_fixture_content_digest(fixture):
    canonical = json.dumps(fixture, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def describe_year_key_gap(actual_keys, expected_keys, label, noun):
    """Year-keyed blocks are pinned by key set, not by size — 200 entries
    covering the wrong 200 years is still wrong. Names the actual gap so the
    report says which years are missing rather than only how many."""
    missing = sorted(expected_keys - actual_keys)
    unexpected = sorted(actual_keys - expected_keys)
    parts = [
        f"{label} covers {len(actual_keys)} {noun}, expected exactly "
        f"{HKO_EXPECTED_YEARS} ({HKO_YEAR_START}-{HKO_YEAR_END})"
    ]
    if missing:
        parts.append(f"{len(missing)} missing (first: {missing[0]})")
    if unexpected:
        parts.append(f"{len(unexpected)} unexpected (first: {unexpected[0]})")
    return "; ".join(parts)


def hko_fixture_problems(fixture):
    """Integrity + provenance validation of the parsed HKO fixture. Returns a
    list of human-readable problem strings; empty means valid. Every problem
    is blocking — the fixture is the authority record, so a hole in it means
    the comparison below it proves less than it claims."""
    if not isinstance(fixture, dict):
        return [f"fixture root is {type(fixture).__name__}, expected an object"]

    problems = []
    schema_version = fixture.get("schema_version")
    # `True == 1` in Python, so a bare != would accept "schema_version": true.
    if isinstance(schema_version, bool) or schema_version != 1:
        problems.append(f"schema_version is {schema_version!r}, expected 1")

    digest = hko_fixture_content_digest(fixture)
    if digest != HKO_FIXTURE_CONTENT_SHA256:
        problems.append(
            f"fixture content digest is {digest}, expected {HKO_FIXTURE_CONTENT_SHA256} — "
            "the authority values changed; regenerate via scripts/extract_hko_fixture.py and "
            "update HKO_FIXTURE_CONTENT_SHA256 in the same commit"
        )

    expected_year_keys = {str(y) for y in range(HKO_YEAR_START, HKO_YEAR_END + 1)}

    source = fixture.get("source")
    if not isinstance(source, dict):
        problems.append("source provenance block is missing or not an object")
    else:
        name = source.get("name")
        if not (isinstance(name, str) and name.strip()):
            problems.append("source.name is missing or empty")
        url_pattern = source.get("url_pattern")
        if not (isinstance(url_pattern, str) and "{year}" in url_pattern):
            problems.append("source.url_pattern is missing or lacks a {year} placeholder")
        retrieved_at = source.get("retrieved_at")
        if not (isinstance(retrieved_at, str) and HKO_RETRIEVED_AT_RE.match(retrieved_at)):
            problems.append(f"source.retrieved_at is {retrieved_at!r}, expected YYYY-MM-DD")
        if source.get("range") != [HKO_YEAR_START, HKO_YEAR_END]:
            problems.append(
                f"source.range is {source.get('range')!r}, expected [{HKO_YEAR_START}, {HKO_YEAR_END}]"
            )
        term_order = source.get("term_order")
        if not (isinstance(term_order, list) and len(term_order) == 12
                and all(isinstance(t, str) and t.strip() for t in term_order)
                and len(set(term_order)) == 12):
            problems.append("source.term_order is not a list of 12 unique non-empty term names")

    hashes = fixture.get("source_sha256")
    if not isinstance(hashes, dict):
        problems.append("source_sha256 block is missing or not an object")
    else:
        if set(hashes) != expected_year_keys:
            problems.append(
                describe_year_key_gap(set(hashes), expected_year_keys, "source_sha256", "years")
            )
        bad_hashes = sorted(
            year for year, digest in hashes.items()
            if not (isinstance(digest, str) and HKO_SHA256_RE.match(digest))
        )
        if bad_hashes:
            problems.append(
                f"{len(bad_hashes)} source_sha256 values are not 64-char lowercase hex "
                f"(first: year {bad_hashes[0]})"
            )

    years = fixture.get("years")
    if not isinstance(years, dict):
        problems.append("years block is missing or not an object")
    else:
        if set(years) != expected_year_keys:
            problems.append(
                describe_year_key_gap(set(years), expected_year_keys, "years", "entries")
            )
        not_complete = sorted(
            year for year, entry in years.items()
            if not (isinstance(entry, dict) and entry.get("complete") is True)
        )
        if not_complete:
            problems.append(
                f"{len(not_complete)} year entries are not marked complete "
                f"(first: {not_complete[0]})"
            )
        deficient = sorted(
            year for year, entry in years.items()
            if isinstance(entry, dict) and (
                not isinstance(entry.get("terms"), dict)
                or len(entry.get("terms") or {}) != 12
                or not entry.get("lunar_new_year")
            )
        )
        if deficient:
            problems.append(
                f"{len(deficient)} year entries lack 12 terms plus a lunar_new_year "
                f"(first: {deficient[0]})"
            )

    if fixture.get("incomplete_years") != []:
        problems.append(
            f"incomplete_years is {fixture.get('incomplete_years')!r}, expected []"
        )

    return problems


def evaluate_hko_comparison(rc, result):
    """Strict pins over the comparator's emitted JSON. Returns (status,
    summary). Every pin must hold exactly — reduced comparison counts fail
    even with zero mismatches, because 0 mismatches over 0 comparisons
    proves nothing."""
    counts = [
        ("comparedYears", result.get("comparedYears"), HKO_EXPECTED_YEARS),
        ("solarComparisons", result.get("solarComparisons"), HKO_EXPECTED_SOLAR_COMPARISONS),
        ("lunarComparisonCount", result.get("lunarComparisonCount"), HKO_EXPECTED_LUNAR_COMPARISONS),
        ("solarMismatchCount", result.get("solarMismatchCount"), 0),
        ("lunarMismatchCount", result.get("lunarMismatchCount"), 0),
    ]
    violated = []
    for name, actual, required in counts:
        # `isinstance(True, int)` is True and `False == 0`, so a JSON boolean
        # would otherwise satisfy a zero-count pin. Counts must be real numbers.
        if isinstance(actual, bool) or not isinstance(actual, (int, float)):
            violated.append(f"{name}={actual!r} is not a number (required {required!r})")
        elif actual != required:
            violated.append(f"{name}={actual!r} (required {required!r})")

    for name, actual, required in (("exit code", rc, 0), ("incomplete", result.get("incomplete"), [])):
        if actual != required:
            violated.append(f"{name}={actual!r} (required {required!r})")
    if violated:
        return "fail", "authority pins violated: " + "; ".join(violated)
    return "pass", (
        f"compared {HKO_EXPECTED_YEARS} years — {HKO_EXPECTED_SOLAR_COMPARISONS} solar and "
        f"{HKO_EXPECTED_LUNAR_COMPARISONS} lunar comparisons, 0 mismatches, 0 incomplete"
    )


def check_hko_calendar(product_root):
    check_id = "product.hko_calendar"
    title = "HKO calendar authority comparison (core/calendar.js)"
    comparator = product_root / "audits" / "hko_compare.mjs"
    fixture_path = product_root / "audits" / "fixtures" / "hko_calendar_authority_1901_2100.json"
    start = time.monotonic()

    # Fails closed: a missing comparator or fixture is a blocking failure,
    # never a skip — this check IS the calendar acceptance gate, and an
    # absent input would otherwise silently green the exact thing it exists
    # to prove.
    missing = [
        str(p.relative_to(product_root))
        for p in (comparator, fixture_path) if not p.exists()
    ]
    if missing:
        return make_check(
            check_id, title, "blocking", "fail",
            f"required input missing (this check fails closed): {', '.join(missing)}",
            time.monotonic() - start, None, "", {"missing": missing},
        )

    try:
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    except OSError as exc:
        return make_check(
            check_id, title, "blocking", "fail",
            f"could not read the HKO fixture: {exc}",
            time.monotonic() - start, None, "", {"fixture": str(fixture_path)},
        )
    except (ValueError, json.JSONDecodeError) as exc:
        return make_check(
            check_id, title, "blocking", "fail",
            f"HKO fixture is not parseable JSON (empty or truncated?): {exc}",
            time.monotonic() - start, None, "", {"fixture": str(fixture_path)},
        )

    problems = hko_fixture_problems(fixture)
    if problems:
        return make_check(
            check_id, title, "blocking", "fail",
            f"HKO fixture failed integrity/provenance validation ({len(problems)} problem(s); see evidence)",
            time.monotonic() - start, None, "", {"problems": problems},
        )

    env = dict(os.environ)
    env["CALENDAR_PATH"] = str(product_root / "core" / "calendar.js")
    env["FIXTURE_PATH"] = str(fixture_path)
    cmd = ["node", str(comparator)]
    rc, out, err, duration, exc = run_cmd(cmd, cwd=product_root, env=env, timeout=60)
    combined_output = clip(out + err)
    if exc is not None:
        return make_check(
            check_id, title, "blocking", "fail",
            f"runner error: {type(exc).__name__}: {exc}",
            duration, cmd, combined_output, {},
        )

    evidence = {}
    parse_error = None
    try:
        evidence = json.loads(out.strip())
    except (ValueError, json.JSONDecodeError) as exc:
        parse_error = str(exc)
    else:
        # Valid-but-non-object JSON (`null`, `[]`, `3`) parses fine and would
        # otherwise reach evaluate_hko_comparison's .get() and raise, killing
        # the run before any report is written — leaving the previous run's
        # latest.json in place, still reading PASS.
        if not isinstance(evidence, dict):
            parse_error = f"expected a JSON object, got {type(evidence).__name__}"

    if parse_error is not None:
        status = "fail"
        summary = f"hko_compare.mjs did not emit parseable JSON on stdout: {parse_error}"
        evidence = {"parse_error": parse_error}
    else:
        status, summary = evaluate_hko_comparison(rc, evidence)
        evidence["fixtureSha256Count"] = len(fixture["source_sha256"])
        evidence["fixtureRetrievedAt"] = fixture["source"]["retrieved_at"]
    return make_check(check_id, title, "blocking", status, summary, duration, cmd, combined_output, evidence)


def check_ci_doctrine_gate(product_root):
    check_id = "product.ci_doctrine_gate"
    title = "CI l48-gate doctrine-only false-green closure (ci.yml, P1-C)"
    path = product_root / ".github" / "workflows" / "ci.yml"
    start = time.monotonic()
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        duration = time.monotonic() - start
        return make_check(check_id, title, "blocking", "fail",
                           f"could not read ci.yml: {exc}", duration, None, "", {})

    # Substrings verified against the real file (commit f223174, "fix(ci):
    # close doctrine-only L48 false-green (P1-C)") rather than guessed.
    required = {
        # The l48-gate job's docs-only exemption explicitly falls through to
        # the strict check when DOCTRINE.md changed, instead of taking the
        # early "all files end in .md" exit.
        "l48_docs_only_excludes_doctrine": "if ! echo \"$CHANGED\" | grep -qE '^DOCTRINE\\.md$'",
        # The strict verdict/override artifact filename shape.
        "artifact_shape_premerge_audit": "premerge_audit_",
        "artifact_shape_l48_override": "L48_override_pr",
        # PR-number-interpolated added-file check (rename/copy-aware).
        "added_files_pr_interpolation": 'ART=$(echo "$ADDED"',
    }
    found = {key: (substr in text) for key, substr in required.items()}
    duration = time.monotonic() - start
    missing = [k for k, v in found.items() if not v]
    status = "pass" if not missing else "fail"
    summary = (
        "all required doctrine-gate substrings present in ci.yml" if not missing
        else f"missing required ci.yml substrings: {', '.join(missing)}"
    )
    return make_check(check_id, title, "blocking", status, summary, duration, None, "",
                       {"found": found, "missing": missing})


def check_ci_doctrine_regression(product_root):
    check_id = "product.ci_doctrine_regression"
    title = "regression test guarding the doctrine-only L48 false-green"
    tests_dir = product_root / "tests"
    start = time.monotonic()

    candidates = []
    if tests_dir.is_dir():
        candidates = sorted(tests_dir.glob("*l48*composition*.test.js"))
        if not candidates:
            candidates = sorted(tests_dir.glob("*l48*.test.js"))

    match = None
    for p in candidates:
        try:
            text = p.read_text(encoding="utf-8")
        except OSError:
            continue
        if "DOCTRINE.md" in text and "docs-only" in text:
            match = p
            break
    duration = time.monotonic() - start

    if match is None:
        return make_check(
            check_id, title, "advisory", "fail",
            "no tests/*l48*.test.js file found mentioning both 'DOCTRINE.md' and 'docs-only'",
            duration, None, "",
            {"candidates": [str(p.relative_to(product_root)) for p in candidates]},
        )
    rel = str(match.relative_to(product_root))
    return make_check(
        check_id, title, "advisory", "pass",
        f"{rel} exists and mentions both DOCTRINE.md and docs-only",
        duration, None, "", {"file": rel},
    )


SHARE_PRODUCER_SCRIPT = """
const mod = await import('./ui/tiers.js');
const rows = mod.shareRowRefs();
console.log(JSON.stringify({ producer_count: rows.length }));
"""


def check_share_wiring(product_root):
    check_id = "product.share_wiring"
    title = "share-surface producer/consumer wiring (ui/tiers.js <-> index.html)"
    start = time.monotonic()
    cmd = ["node", "--input-type=module", "-e", SHARE_PRODUCER_SCRIPT]
    rc, out, err, node_duration, exc = run_cmd(cmd, cwd=product_root, timeout=30)
    combined_output = clip(out + err)
    if exc is not None:
        duration = time.monotonic() - start
        return make_check(
            check_id, title, "blocking", "fail",
            f"runner error: {type(exc).__name__}: {exc}",
            duration, cmd, combined_output, {},
        )

    producer_count = None
    if rc == 0:
        try:
            producer_count = json.loads(out.strip()).get("producer_count")
        except (ValueError, json.JSONDecodeError):
            producer_count = None

    consumer_count = None
    index_path = product_root / "index.html"
    try:
        html = index_path.read_text(encoding="utf-8")
        call_idx = html.find("initShareUI(")
        if call_idx != -1:
            window = html[call_idx:call_idx + 2000]
            m = re.search(r"symbols\s*:\s*\[([^\]]*)\]", window, re.DOTALL)
            if m:
                items = [x.strip() for x in m.group(1).split(",") if x.strip()]
                consumer_count = len(items)
    except OSError:
        pass

    duration = time.monotonic() - start
    evidence = {"producer_count": producer_count, "consumer_count": consumer_count}
    if rc != 0:
        status = "fail"
        summary = f"node exited {rc} while calling shareRowRefs() (see output)"
    elif producer_count is None or consumer_count is None:
        status = "fail"
        summary = "could not determine both producer and consumer counts"
    elif producer_count == consumer_count:
        status = "pass"
        summary = f"producer ({producer_count}) and consumer ({consumer_count}) counts match"
    else:
        status = "fail"
        summary = f"producer ({producer_count}) and consumer ({consumer_count}) counts differ"
    return make_check(check_id, title, "blocking", status, summary, duration, cmd, combined_output, evidence)


# ── snapshot stability (fingerprint before check 1 and after check 13) ────

def list_git_files(product_root):
    rc, out, err, duration, exc = run_cmd(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        cwd=product_root,
    )
    if exc is not None or rc != 0:
        return []
    return [p for p in out.split("\x00") if p]


def snapshot_repo(product_root):
    snap = {}
    for rel in list_git_files(product_root):
        p = product_root / rel
        try:
            data = p.read_bytes()
            snap[rel] = hashlib.sha256(data).hexdigest()
        except OSError as exc:
            snap[rel] = f"<unreadable:{type(exc).__name__}>"

    rc_head, out_head, _err_head, _d, exc_head = run_cmd(["git", "rev-parse", "HEAD"], cwd=product_root)
    snap["__git_head__"] = out_head.strip() if (exc_head is None and rc_head == 0) else "<error>"

    rc_status, out_status, _err_status, _d2, exc_status = run_cmd(
        ["git", "status", "--porcelain=v1"], cwd=product_root,
    )
    snap["__git_status__"] = out_status if (exc_status is None and rc_status == 0) else "<error>"
    return snap


def diff_snapshots(before, after):
    before_keys = set(before)
    after_keys = set(after)
    added = sorted(after_keys - before_keys)
    removed = sorted(before_keys - after_keys)
    changed = sorted(k for k in (before_keys & after_keys) if before[k] != after[k])
    return added, removed, changed


def check_snapshot_stability(before, after):
    check_id = "product.snapshot_stability"
    title = "repo file fingerprint stability across the audit run"
    start = time.monotonic()
    added, removed, changed = diff_snapshots(before, after)
    duration = time.monotonic() - start
    if not added and not removed and not changed:
        n = len(before)
        return make_check(check_id, title, "blocking", "pass",
                           f"all {n} audited files remained stable", duration, None, "", {"audited": n})
    evidence = {"added": added, "removed": removed, "changed": changed}
    summary = f"repo mutated during the audit run: +{len(added)} added, -{len(removed)} removed, ~{len(changed)} changed"
    return make_check(check_id, title, "blocking", "fail", summary, duration, None, "", evidence)


# ── report rendering ────────────────────────────────────────────────────

def render_markdown(report):
    lines = []
    lines.append("# 8ball product-scope audit")
    lines.append("")
    lines.append(f"**Verdict: {report['verdict']}**")
    lines.append("")
    lines.append(f"- Started: {report['started_at']}")
    lines.append(f"- Finished: {report['finished_at']}")
    lines.append(f"- Product root: `{report['product_root']}`")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append("| Pass | Fail | Warn | Skip | Blocking failures |")
    lines.append("|---|---|---|---|---|")
    c = report["counts"]
    lines.append(
        f"| {c.get('pass', 0)} | {c.get('fail', 0)} | {c.get('warn', 0)} | "
        f"{c.get('skip', 0)} | {report['blocking_failure_count']} |"
    )
    lines.append("")
    lines.append("## Checks")
    lines.append("")
    lines.append("| Status | Severity | Check | Summary |")
    lines.append("|---|---|---|---|")
    for chk in report["checks"]:
        summary = str(chk["summary"]).replace("|", "\\|").replace("\n", " ")
        lines.append(f"| {chk['status'].upper()} | {chk['severity']} | `{chk['id']}` | {summary} |")
    lines.append("")

    nonpass = [chk for chk in report["checks"] if chk["status"] != "pass"]
    if nonpass:
        lines.append("## Failure and warning evidence")
        lines.append("")
        for chk in nonpass:
            lines.append(f"### `{chk['id']}` — {chk['status'].upper()} ({chk['severity']})")
            lines.append("")
            lines.append(str(chk["summary"]))
            lines.append("")
            lines.append("<details><summary>evidence + output</summary>")
            lines.append("")
            lines.append("```json")
            lines.append(json.dumps(chk["evidence"], indent=2, default=str))
            lines.append("```")
            lines.append("")
            if chk.get("command"):
                lines.append("Command: `" + " ".join(chk["command"]) + "`")
                lines.append("")
            lines.append("```")
            lines.append(chk["output"] or "(no output)")
            lines.append("```")
            lines.append("")
            lines.append("</details>")
            lines.append("")
    return "\n".join(lines) + "\n"


def atomic_write(path, content):
    tmp_path = path.parent / f"{path.name}.{os.getpid()}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp_path, path)


# ── product-root resolution + config validity ──────────────────────────

def resolve_product_root(explicit):
    if explicit:
        return Path(explicit).resolve()
    rc, out, _err, _d, exc = run_cmd(["git", "rev-parse", "--show-toplevel"], timeout=10)
    if exc is None and rc == 0 and out.strip():
        return Path(out.strip()).resolve()
    return Path(__file__).resolve().parents[1]


def is_git_repo(path):
    rc, out, _err, _d, exc = run_cmd(["git", "rev-parse", "--is-inside-work-tree"], cwd=path, timeout=10)
    return exc is None and rc == 0 and out.strip() == "true"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# Derived from each check function's name so the fallback id can't drift from
# the id the check itself emits: check_hko_calendar -> product.hko_calendar.
def guarded(check_fn, *args):
    """Run one check, converting an unexpected exception into a blocking
    failure. Without this, a single crashing check aborts main() before the
    report is written at all — which leaves the previous run's latest.json in
    place, still reading whatever it last said. A hard error must be loud in
    the report, not silently replaced by a stale one."""
    check_id = "product." + check_fn.__name__.removeprefix("check_")
    try:
        return check_fn(*args)
    except Exception as exc:  # noqa: BLE001 — deliberate catch-all
        return make_check(
            check_id, check_fn.__name__, "blocking", "fail",
            f"check raised an unhandled {type(exc).__name__}: {exc}",
            0.0, None, "", {"exception": type(exc).__name__, "message": str(exc)},
        )


# ── main ────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(description="8ball product-scope audit (read-only, deterministic)")
    parser.add_argument("--product", default=None, help="Path to the product repo (default: auto-detect via git)")
    parser.add_argument("--output-dir", default=None, help="Where to write reports (default: <product>/audits/automated/)")
    return parser.parse_args()


def main():
    args = parse_args()
    product_root = resolve_product_root(args.product)
    output_dir = Path(args.output_dir).resolve() if args.output_dir else product_root / "audits" / "automated"
    output_dir.mkdir(parents=True, exist_ok=True)

    config_ok = (product_root / "package.json").is_file() and is_git_repo(product_root)

    started_at = now_iso()
    checks = []

    before_snapshot = snapshot_repo(product_root)

    for check_fn in (
        check_git_status, check_git_head, check_git_origin_main,
        check_diff_check, check_worktree_diff_check, check_tests,
        check_local_pii, check_index_budget, check_t4_migration,
        check_hko_calendar, check_ci_doctrine_gate,
        check_ci_doctrine_regression, check_share_wiring,
    ):
        checks.append(guarded(check_fn, product_root))

    after_snapshot = snapshot_repo(product_root)
    checks.append(check_snapshot_stability(before_snapshot, after_snapshot))

    finished_at = now_iso()

    counts = {"pass": 0, "fail": 0, "warn": 0, "skip": 0}
    blocking_failure_count = 0
    for chk in checks:
        counts[chk["status"]] = counts.get(chk["status"], 0) + 1
        if chk["status"] == "fail" and chk["severity"] == "blocking":
            blocking_failure_count += 1

    verdict = "FAIL" if blocking_failure_count > 0 else "PASS"

    report = {
        "schema_version": 1,
        "title": "8ball product-scope audit",
        "started_at": started_at,
        "finished_at": finished_at,
        "verdict": verdict,
        "counts": counts,
        "blocking_failure_count": blocking_failure_count,
        "product_root": str(product_root),
        "checks": checks,
    }

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    json_path = output_dir / f"product_audit_{timestamp}.json"
    md_path = output_dir / f"product_audit_{timestamp}.md"
    latest_json = output_dir / "latest.json"
    latest_md = output_dir / "latest.md"

    json_text = json.dumps(report, indent=2, default=str)
    md_text = render_markdown(report)

    atomic_write(json_path, json_text)
    atomic_write(md_path, md_text)
    atomic_write(latest_json, json_text)
    atomic_write(latest_md, md_text)

    summary_line = {
        "verdict": verdict,
        "counts": counts,
        "blocking_failure_count": blocking_failure_count,
        "json": str(json_path),
        "markdown": str(md_path),
    }
    print(json.dumps(summary_line))

    if not config_ok:
        sys.exit(2)
    sys.exit(1 if blocking_failure_count > 0 else 0)


if __name__ == "__main__":
    main()
