"""Tests for audits/project_audit.py -- the audit TOOL itself, not the 8ball
product it audits.

Deliberately plain unittest, and deliberately NOT under tests/*.test.js: this
repo's vitest suite is scoped to the app and tests/repo_shape.test.js regex-
pins its file count, so a python test file does not belong there. This file
is a sibling of the script it tests, exactly like reach/test_drift_check.py
is a sibling of reach/drift_check.py in the ops tree.

Run (from the repo root — no absolute paths, works in any checkout):
    python3 -m unittest audits.test_project_audit -v
  or, from inside audits/:
    python3 -m unittest test_project_audit -v

Coverage strategy: wherever practical these tests shell out to the real
script via subprocess (exactly as CI does) and assert on its real JSON
report, rather than reimplementing its logic. project_audit.py guards its
execution behind `if __name__ == "__main__"`, so it is also safely importable
as a module for a few white-box cases (clip() boundary conditions, a
monkeypatched subprocess timeout) where driving it externally would be
needlessly slow or indirect.
"""
import importlib.util
import json
import os
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "audits" / "project_audit.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("project_audit_under_test", str(SCRIPT))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


pa = _load_module()

# The documented per-check shape (module docstring / CLAUDE.md): every check
# in every report must carry exactly these keys with these types.
REQUIRED_KEYS = {
    "id": str,
    "title": str,
    "category": str,
    "status": str,
    "severity": str,
    "summary": str,
    "duration_seconds": (int, float),
    "command": (list, type(None)),
    "output": str,
    "evidence": dict,
}
VALID_STATUSES = {"pass", "fail", "warn", "skip"}
VALID_SEVERITIES = {"blocking", "advisory", "info"}


class ClipHelperTests(unittest.TestCase):
    """Direct unit tests of clip() -- imported, not reimplemented."""

    def test_short_text_is_untouched(self):
        self.assertEqual(pa.clip("hello"), "hello")

    def test_exact_limit_is_untouched(self):
        text = "x" * pa.MAX_CAPTURE_CHARS
        self.assertEqual(pa.clip(text), text)

    def test_over_limit_truncates_with_exact_marker(self):
        text = "x" * (pa.MAX_CAPTURE_CHARS + 4000)
        out = pa.clip(text)
        self.assertTrue(out.startswith("x" * pa.MAX_CAPTURE_CHARS))
        self.assertTrue(out.endswith("\n… truncated 4000 characters"))
        self.assertEqual(len(out), pa.MAX_CAPTURE_CHARS + len("\n… truncated 4000 characters"))

    def test_custom_limit(self):
        self.assertEqual(pa.clip("abcdefghij", limit=5), "abcde\n… truncated 5 characters")

    def test_none_input_is_empty_string(self):
        self.assertEqual(pa.clip(None), "")


class NormalRunConsistencyTests(unittest.TestCase):
    """A real run against the real repo: exit code must be consistent with
    the report's own blocking_failure_count -- 0 iff blocking_failure_count
    == 0. Deliberately does not assert which one it will be: the repo's
    current health is not this test's concern, only that the two numbers
    never disagree."""

    def test_exit_code_matches_blocking_failure_count(self):
        with tempfile.TemporaryDirectory() as out_dir:
            proc = subprocess.run(
                [sys.executable, str(SCRIPT), "--output-dir", out_dir],
                cwd=str(REPO_ROOT), text=True, capture_output=True, timeout=280,
            )
            report = json.loads((Path(out_dir) / "latest.json").read_text())
            blocking = report["blocking_failure_count"]
            self.assertIn(proc.returncode, (0, 1),
                          "real repo has package.json and is a git repo, so config_ok "
                          "is always True here -- exit 2 would mean that assumption broke")
            if blocking == 0:
                self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
            else:
                self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)


class BadProductRootTests(unittest.TestCase):
    """--product pointing at a directory that is neither a git repo nor has
    a package.json."""

    def test_non_repo_product_root_exits_2_and_still_writes_a_report(self):
        with tempfile.TemporaryDirectory() as product_dir, tempfile.TemporaryDirectory() as out_dir:
            proc = subprocess.run(
                [sys.executable, str(SCRIPT), "--product", product_dir, "--output-dir", out_dir],
                text=True, capture_output=True, timeout=60,
            )
            self.assertEqual(proc.returncode, 2)

            latest = Path(out_dir) / "latest.json"
            self.assertTrue(latest.exists(), "a partial report must still be written on config error")
            report = json.loads(latest.read_text())

            # NOTE: this script (audits/project_audit.py, product scope) has
            # no check literally named "runner.roots" -- that id belongs to
            # the *other* deliverable, tooling/audit/project_audit.py (the
            # ops-tree orchestrator). Verified by reading both scripts in
            # full. Here, root-invalidity instead surfaces organically: many
            # of the 13 ordinary checks fail hard against a directory that
            # is not this repo. We assert the general shape the brief wants
            # (a report exists and contains blocking-severity root-invalidity
            # evidence) using the check that is unambiguously about product
            # root validity: product.index_budget can't even read index.html.
            blocking_fails = [c for c in report["checks"]
                               if c["status"] == "fail" and c["severity"] == "blocking"]
            self.assertTrue(blocking_fails,
                             "expected at least one blocking failure from checks run "
                             "against a bogus product root")
            ids = {c["id"] for c in blocking_fails}
            self.assertIn("product.index_budget", ids)


class CheckShapeTests(unittest.TestCase):
    """Every check emitted by one real run matches the documented per-check
    JSON shape, for every check the script currently defines."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        subprocess.run(
            [sys.executable, str(SCRIPT), "--output-dir", cls.tmp.name],
            cwd=str(REPO_ROOT), text=True, capture_output=True, timeout=280,
        )
        cls.report = json.loads((Path(cls.tmp.name) / "latest.json").read_text())

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_report_has_expected_top_level_keys(self):
        for key in ("schema_version", "title", "started_at", "finished_at", "verdict",
                    "counts", "blocking_failure_count", "product_root", "checks"):
            self.assertIn(key, self.report)

    def test_every_check_matches_the_documented_shape(self):
        self.assertTrue(self.report["checks"], "expected at least one check in a real run")
        for chk in self.report["checks"]:
            for key, types in REQUIRED_KEYS.items():
                self.assertIn(key, chk, f"{chk.get('id')} is missing key {key!r}")
                self.assertIsInstance(chk[key], types, f"{chk.get('id')}.{key} has the wrong type")
            self.assertIn(chk["status"], VALID_STATUSES, chk["id"])
            self.assertIn(chk["severity"], VALID_SEVERITIES, chk["id"])
            self.assertEqual(chk["category"], "product", chk["id"])

    def test_thirteen_named_checks_plus_snapshot_stability_are_present(self):
        expected_ids = {
            "product.git_status", "product.git_head", "product.git_origin_main",
            "product.diff_check", "product.worktree_diff_check", "product.tests",
            "product.local_pii", "product.index_budget", "product.t4_migration",
            "product.hko_calendar", "product.ci_doctrine_gate",
            "product.ci_doctrine_regression", "product.share_wiring",
            "product.snapshot_stability",
        }
        actual_ids = {c["id"] for c in self.report["checks"]}
        self.assertEqual(expected_ids, actual_ids)


class TruncationTests(unittest.TestCase):
    """Force a real check's captured subprocess output past MAX_CAPTURE_CHARS
    and confirm the real run_check()/clip() pipeline truncates it with the
    exact documented marker -- exercised via the real check function against
    a crafted fake product repo, not a reimplementation of clip()."""

    def test_local_pii_check_output_is_truncated_by_run_check(self):
        with tempfile.TemporaryDirectory() as product_dir:
            product_root = Path(product_dir)
            audits_dir = product_root / "audits"
            audits_dir.mkdir()
            # Presence of this file is what makes check_local_pii actually
            # run its command instead of returning its "skip" status.
            (audits_dir / "local_personal_data.txt").write_text("dummy pattern\n")
            script_path = audits_dir / "run_local_audit.sh"
            script_path.write_text(
                "#!/usr/bin/env bash\n"
                "python3 -c \"import sys; sys.stdout.write('x' * 20000)\"\n"
                "exit 0\n"
            )
            script_path.chmod(script_path.stat().st_mode | stat.S_IEXEC)

            chk = pa.check_local_pii(product_root)

        self.assertEqual(chk["status"], "pass")
        marker = "\n… truncated 4000 characters"
        self.assertTrue(chk["output"].endswith(marker))
        self.assertEqual(len(chk["output"]), pa.MAX_CAPTURE_CHARS + len(marker))


class TimeoutHandlingTests(unittest.TestCase):
    """A subprocess timeout on one check must be recorded as a failure whose
    summary names TimeoutExpired -- never an unhandled crash of the script."""

    def test_single_check_timeout_is_recorded_not_raised(self):
        with mock.patch.object(subprocess, "run",
                               side_effect=subprocess.TimeoutExpired(cmd=["git", "status"], timeout=5)):
            chk = pa.check_git_status(REPO_ROOT)
        self.assertEqual(chk["status"], "fail")
        self.assertIn("TimeoutExpired", chk["summary"])
        # declared severity is preserved even though the runner errored --
        # run_check() forces status to "fail" but does not touch severity.
        self.assertEqual(chk["severity"], "advisory")

    def test_whole_script_survives_one_check_timing_out(self):
        """Selectively time out only `npm test`; every other check in main()
        runs for real, proving a hung/slow check doesn't crash the run."""
        real_run = subprocess.run

        def fake_run(cmd, *args, **kwargs):
            if cmd[:2] == ["npm", "test"]:
                raise subprocess.TimeoutExpired(cmd=cmd, timeout=0.01)
            return real_run(cmd, *args, **kwargs)

        with tempfile.TemporaryDirectory() as out_dir:
            argv = ["project_audit.py", "--product", str(REPO_ROOT), "--output-dir", out_dir]
            with mock.patch.object(subprocess, "run", side_effect=fake_run), \
                 mock.patch.object(sys, "argv", argv):
                with self.assertRaises(SystemExit):
                    pa.main()
            report = json.loads((Path(out_dir) / "latest.json").read_text())

        tests_check = next(c for c in report["checks"] if c["id"] == "product.tests")
        self.assertEqual(tests_check["status"], "fail")
        self.assertIn("TimeoutExpired", tests_check["summary"])

        other_ids = {c["id"] for c in report["checks"]} - {"product.tests"}
        self.assertIn("product.git_head", other_ids)
        self.assertIn("product.snapshot_stability", other_ids)


class AtomicityTests(unittest.TestCase):
    def test_no_tmp_files_left_behind_after_a_real_run(self):
        with tempfile.TemporaryDirectory() as out_dir:
            subprocess.run(
                [sys.executable, str(SCRIPT), "--output-dir", out_dir],
                cwd=str(REPO_ROOT), text=True, capture_output=True, timeout=280,
            )
            leftover = list(Path(out_dir).glob("*.tmp"))
            self.assertEqual(leftover, [], f"atomic replace left tmp file(s) behind: {leftover}")

    def test_latest_json_parses_independently_of_the_timestamped_copy(self):
        with tempfile.TemporaryDirectory() as out_dir:
            subprocess.run(
                [sys.executable, str(SCRIPT), "--output-dir", out_dir],
                cwd=str(REPO_ROOT), text=True, capture_output=True, timeout=280,
            )
            latest_report = json.loads((Path(out_dir) / "latest.json").read_text())

            timestamped = list(Path(out_dir).glob("product_audit_*.json"))
            self.assertEqual(len(timestamped), 1)
            timestamped_report = json.loads(timestamped[0].read_text())

            self.assertEqual(latest_report["started_at"], timestamped_report["started_at"])
            self.assertEqual(latest_report["blocking_failure_count"],
                              timestamped_report["blocking_failure_count"])

    def test_atomic_write_helper_creates_and_replaces_with_no_tmp_left(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "out.json"
            pa.atomic_write(target, "first")
            self.assertEqual(target.read_text(), "first")
            self.assertEqual(list(Path(d).glob("*.tmp")), [])

            pa.atomic_write(target, "second")
            self.assertEqual(target.read_text(), "second")
            self.assertEqual(list(Path(d).glob("*.tmp")), [])


# ── HKO authority-gate negative coverage ────────────────────────────────
#
# The 2026-07-30 completion audit found this check could false-green three
# separate ways: a missing comparator/fixture returned "skip" even though the
# check is declared blocking; fixture years flagged incomplete were silently
# skipped; and the PASS predicate looked only at mismatch counts, so a fixture
# with zero years emitted
#     {"comparedYears": 0, "solarComparisons": 0, "solarMismatchCount": 0,
#      "lunarComparisonCount": 0, "lunarMismatchCount": 0}
# and PASSED -- zero mismatches over zero comparisons proves nothing. Every
# test below drives the real check_hko_calendar() / evaluate_hko_comparison()
# and asserts the gate now fails closed.

REAL_FIXTURE_PATH = REPO_ROOT / "audits" / "fixtures" / "hko_calendar_authority_1901_2100.json"
REAL_COMPARATOR_PATH = REPO_ROOT / "audits" / "hko_compare.mjs"
FIXTURE_REL = Path("audits") / "fixtures" / "hko_calendar_authority_1901_2100.json"

_OMIT = object()


def real_fixture_dict():
    """A fresh parse of the shipped fixture, so per-test mutation can't leak."""
    return json.loads(REAL_FIXTURE_PATH.read_text(encoding="utf-8"))


def build_hko_root(tmpdir, *, fixture=_OMIT, fixture_text=_OMIT, write_fixture=True,
                   with_comparator=True, comparator_stub=None):
    """Craft a minimal product root carrying only what check_hko_calendar
    touches: audits/hko_compare.mjs, the fixture, and core/calendar.js plus
    the core/math.js it imports."""
    root = Path(tmpdir)
    (root / "audits" / "fixtures").mkdir(parents=True, exist_ok=True)
    (root / "core").mkdir(exist_ok=True)

    if with_comparator:
        dest = root / "audits" / "hko_compare.mjs"
        if comparator_stub is not None:
            dest.write_text(comparator_stub, encoding="utf-8")
        else:
            shutil.copy(REAL_COMPARATOR_PATH, dest)

    shutil.copy(REPO_ROOT / "core" / "calendar.js", root / "core" / "calendar.js")
    shutil.copy(REPO_ROOT / "core" / "math.js", root / "core" / "math.js")

    if write_fixture:
        dest = root / FIXTURE_REL
        if fixture_text is not _OMIT:
            dest.write_text(fixture_text, encoding="utf-8")
        else:
            data = real_fixture_dict() if fixture is _OMIT else fixture
            dest.write_text(json.dumps(data), encoding="utf-8")
    return root


def stub_comparator(payload):
    """A comparator that ignores its inputs and emits `payload` verbatim --
    models a comparator regression under an otherwise-valid fixture."""
    return "console.log(JSON.stringify(%s));\n" % json.dumps(payload)


GOOD_COMPARISON = {
    "comparedYears": 200,
    "incomplete": [],
    # The 2026-07-30 finding-L fields. The comparator indexes by its own
    # canonical term list rather than by the fixture's, and reports here
    # whether the fixture's declared order and per-year term positions agree
    # with it -- so a rotated/relabelled authority record is diagnosed as a
    # forged fixture instead of as 2,400 ordinary calendar mismatches.
    "termOrderCanonical": True,
    "declaredTermOrder": list(pa.HKO_CANONICAL_TERM_ORDER),
    "semanticViolationCount": 0,
    "semanticViolations": [],
    "solarComparisons": 2400,
    "solarMismatchCount": 0,
    "solarMismatches": [],
    "lunarComparisonCount": 200,
    "lunarMismatchCount": 0,
    "lunarMismatches": [],
}


class HkoBlockingFailureMixin:
    def assert_blocking_failure(self, chk, needle=None):
        self.assertEqual(chk["status"], "fail",
                         f"expected a blocking failure, got {chk['status']}: {chk['summary']}")
        self.assertEqual(chk["severity"], "blocking", chk["id"])
        if needle is not None:
            haystack = chk["summary"] + json.dumps(chk["evidence"], default=str)
            self.assertIn(needle, haystack, chk["summary"])

    def assert_fixture_problem(self, fixture, needle, *, total=2):
        """Assert hko_fixture_problems() reports `needle` -- and reports
        exactly `total` problems overall. The count matters: matching a needle
        against a blob of several problems can succeed for the wrong reason,
        so each single-field mutation below pins its own problem plus the
        content-digest problem that any value edit necessarily also trips."""
        problems = pa.hko_fixture_problems(fixture)
        self.assertTrue(any(needle in p for p in problems),
                        f"no problem contained {needle!r}; got {problems}")
        self.assertEqual(len(problems), total,
                         f"expected exactly {total} problem(s), got {len(problems)}: {problems}")
        return problems

    def assert_digest_problem_present(self, problems):
        self.assertTrue(any("content digest" in p for p in problems),
                        f"expected a content-digest problem among {problems}")


class HkoMissingInputTests(HkoBlockingFailureMixin, unittest.TestCase):
    """A missing comparator or fixture is a blocking FAILURE, never a skip.
    The old code returned status="skip" with the reasoning that the
    dependency was 'built in parallel' -- which meant the calendar acceptance
    gate reported green in exactly the case where it had proved nothing."""

    def test_missing_comparator_is_a_blocking_failure_not_a_skip(self):
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, with_comparator=False)
            chk = pa.check_hko_calendar(root)
        self.assertNotEqual(chk["status"], "skip",
                            "a missing comparator must never be a skip -- that was the false-green")
        self.assert_blocking_failure(chk, "audits/hko_compare.mjs")

    def test_missing_fixture_is_a_blocking_failure_not_a_skip(self):
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, write_fixture=False)
            chk = pa.check_hko_calendar(root)
        self.assertNotEqual(chk["status"], "skip",
                            "a missing fixture must never be a skip -- that was the false-green")
        self.assert_blocking_failure(chk, "hko_calendar_authority_1901_2100.json")

    def test_both_inputs_missing_is_a_blocking_failure_naming_both(self):
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, with_comparator=False, write_fixture=False)
            chk = pa.check_hko_calendar(root)
        self.assertNotEqual(chk["status"], "skip")
        self.assert_blocking_failure(chk, "audits/hko_compare.mjs")
        self.assertEqual(len(chk["evidence"]["missing"]), 2, chk["evidence"])


class HkoUnparseableFixtureTests(HkoBlockingFailureMixin, unittest.TestCase):
    """Empty, truncated, or structurally wrong fixture files fail closed."""

    def test_empty_fixture_file_fails(self):
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, fixture_text="")
            chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk, "not parseable JSON")

    def test_truncated_fixture_fails(self):
        text = REAL_FIXTURE_PATH.read_text(encoding="utf-8")
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, fixture_text=text[: len(text) * 6 // 10])
            chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk, "not parseable JSON")

    def test_fixture_that_is_a_json_list_fails(self):
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, fixture_text="[]")
            chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk, "expected an object")

    def test_wrong_schema_version_fails(self):
        fx = real_fixture_dict()
        fx["schema_version"] = 2
        with tempfile.TemporaryDirectory() as d:
            chk = pa.check_hko_calendar(build_hko_root(d, fixture=fx))
        self.assert_blocking_failure(chk, "schema_version")


class HkoYearCoverageTests(HkoBlockingFailureMixin, unittest.TestCase):
    """Year-count, completeness and per-year density pins.

    Each test mutates exactly ONE field, so the expected problem count is
    always 2: the pin under test, plus the content-digest pin that any value
    edit necessarily also trips. An earlier draft of these tests mutated two
    fields at once, which let a needle match the wrong problem."""

    def test_zero_year_fixture_fails(self):
        """The completion audit's exact reproduction case: with the old
        predicate this produced comparedYears=0 / 0 mismatches and PASSED."""
        fx = real_fixture_dict()
        fx["years"] = {}
        problems = self.assert_fixture_problem(fx, "years covers 0 entries")
        self.assert_digest_problem_present(problems)

    def test_absent_years_block_fails(self):
        fx = real_fixture_dict()
        del fx["years"]
        self.assert_fixture_problem(fx, "years block is missing")

    def test_one_missing_year_fails(self):
        fx = real_fixture_dict()
        del fx["years"]["1950"]
        self.assert_fixture_problem(fx, "years covers 199 entries")

    def test_year_flagged_incomplete_fails(self):
        fx = real_fixture_dict()
        fx["years"]["1987"]["complete"] = False
        self.assert_fixture_problem(fx, "not marked complete")

    def test_year_missing_a_solar_term_fails_even_when_flagged_complete(self):
        """`complete` is the extractor's own claim; the density check is the
        independent one. A year missing a term while still flagged complete
        must not slip through."""
        fx = real_fixture_dict()
        terms = fx["years"]["2001"]["terms"]
        del terms[sorted(terms)[0]]
        fx["years"]["2001"]["complete"] = True
        self.assert_fixture_problem(fx, "lack 12 terms")

    def test_year_missing_its_lunar_new_year_fails(self):
        fx = real_fixture_dict()
        fx["years"]["2019"]["lunar_new_year"] = None
        fx["years"]["2019"]["complete"] = True
        self.assert_fixture_problem(fx, "lunar_new_year")

    def test_two_hundred_entries_covering_the_wrong_years_fails(self):
        """Size alone is not coverage: 200 year entries for 1801-2000 must
        fail, and the message must name the gap rather than printing the
        baffling '200 entries, expected exactly 200'. The assertions below
        avoid 1901/2100, which appear in the message's constant header."""
        fx = real_fixture_dict()
        fx["years"] = {str(int(k) - 100): v for k, v in fx["years"].items()}
        problems = self.assert_fixture_problem(fx, "years covers 200 entries")
        gap = next(p for p in problems if p.startswith("years covers"))
        self.assertIn("100 missing (first: 2001)", gap, gap)
        self.assertIn("100 unexpected (first: 1801)", gap, gap)

    def test_nonempty_incomplete_years_fails(self):
        fx = real_fixture_dict()
        fx["incomplete_years"] = [1901]
        self.assert_fixture_problem(fx, "incomplete_years")


class HkoSourceHashTests(HkoBlockingFailureMixin, unittest.TestCase):
    """200 SHA-256 source hashes, all well-formed."""

    def test_missing_hash_block_fails(self):
        fx = real_fixture_dict()
        del fx["source_sha256"]
        self.assert_fixture_problem(fx, "source_sha256 block is missing")

    def test_empty_hash_block_fails(self):
        fx = real_fixture_dict()
        fx["source_sha256"] = {}
        self.assert_fixture_problem(fx, "source_sha256 covers 0 years")

    def test_one_missing_hash_fails(self):
        fx = real_fixture_dict()
        del fx["source_sha256"]["2100"]
        self.assert_fixture_problem(fx, "source_sha256 covers 199 years")

    def test_malformed_hash_value_fails(self):
        fx = real_fixture_dict()
        fx["source_sha256"]["1901"] = "deadbeef"
        self.assert_fixture_problem(fx, "not 64-char lowercase hex")

    def test_uppercase_hash_value_fails(self):
        fx = real_fixture_dict()
        fx["source_sha256"]["1901"] = fx["source_sha256"]["1901"].upper()
        self.assert_fixture_problem(fx, "not 64-char lowercase hex")


class HkoProvenanceTests(HkoBlockingFailureMixin, unittest.TestCase):
    """The source block is the fixture's chain of custody back to HKO. A
    fixture that can't say where it came from is not an authority record."""

    def test_missing_source_block_fails(self):
        fx = real_fixture_dict()
        del fx["source"]
        self.assert_fixture_problem(fx, "source provenance block is missing")

    def test_empty_source_name_fails(self):
        fx = real_fixture_dict()
        fx["source"]["name"] = "   "
        self.assert_fixture_problem(fx, "source.name")

    def test_url_pattern_without_year_placeholder_fails(self):
        fx = real_fixture_dict()
        fx["source"]["url_pattern"] = "https://www.hko.gov.hk/"
        self.assert_fixture_problem(fx, "url_pattern")

    def test_malformed_retrieved_at_fails(self):
        fx = real_fixture_dict()
        fx["source"]["retrieved_at"] = "yesterday"
        self.assert_fixture_problem(fx, "retrieved_at")

    def test_wrong_declared_range_fails(self):
        fx = real_fixture_dict()
        fx["source"]["range"] = [1901, 2000]
        self.assert_fixture_problem(fx, "source.range")

    def test_short_term_order_fails(self):
        fx = real_fixture_dict()
        fx["source"]["term_order"] = fx["source"]["term_order"][:11]
        self.assert_fixture_problem(fx, "term_order")

    def test_duplicated_term_order_entry_fails(self):
        fx = real_fixture_dict()
        order = list(fx["source"]["term_order"])
        order[5] = order[0]
        fx["source"]["term_order"] = order
        self.assert_fixture_problem(fx, "term_order")

    def test_rotated_term_order_alone_fails(self):
        """Well-formed, 12 unique names, wrong order. The shape check above
        passes it; only the canonical pin catches it."""
        fx = real_fixture_dict()
        order = list(fx["source"]["term_order"])
        fx["source"]["term_order"] = order[1:] + order[:1]
        self.assert_fixture_problem(fx, "not the canonical HKO")

    def test_schema_version_true_is_rejected_despite_python_bool_equality(self):
        fx = real_fixture_dict()
        fx["schema_version"] = True
        self.assert_fixture_problem(fx, "schema_version is True")


class HkoSemanticOrderTests(HkoBlockingFailureMixin, unittest.TestCase):
    """The rotation tautology (Codex pre-merge audit 2026-07-30, finding L).

    The comparator used to take its term order from `source.term_order` AND
    look every expected value up by those same fixture-supplied names, so it
    compared the fixture against itself. Rotating `term_order`, relabelling
    every year's term values by the same rotation, and regenerating the
    content digest produced 2,400 comparisons, ZERO mismatches and a PASS
    with all 200 source hashes untouched -- a complete false green that no
    structural pin, and not even the digest, could see.

    Both halves of the closure are pinned here: the canonical order lives
    outside the fixture now, and the index-to-month invariant holds no matter
    what the terms are called."""

    @staticmethod
    def rotate(fx, by=1):
        """The audit's exact forgery: rotate the declared order AND relabel
        every year's values by the same rotation, so the fixture stays
        internally consistent."""
        order = list(fx["source"]["term_order"])
        rotated = order[by:] + order[:by]
        fx["source"]["term_order"] = rotated
        for entry in fx["years"].values():
            original = entry["terms"]
            entry["terms"] = {rotated[i]: original[order[i]] for i in range(len(order))}
        return fx

    def test_the_full_internally_consistent_rotation_is_caught(self):
        fx = self.rotate(real_fixture_dict())
        problems = pa.hko_fixture_problems(fx)
        self.assertTrue(any("not the canonical HKO" in p for p in problems), problems)
        self.assertTrue(any("index-to-month invariant" in p for p in problems), problems)

    def test_rotation_survives_a_regenerated_digest(self):
        """The digest cannot catch this: the forger regenerates it. Every
        remaining problem must therefore be a structural one."""
        fx = self.rotate(real_fixture_dict())
        with mock.patch.object(pa, "HKO_FIXTURE_CONTENT_SHA256",
                               pa.hko_fixture_content_digest(fx)):
            problems = pa.hko_fixture_problems(fx)
        self.assertFalse(any("content digest" in p for p in problems), problems)
        self.assertTrue(any("index-to-month invariant" in p for p in problems), problems)

    def test_renaming_the_terms_without_rotating_is_caught(self):
        """Names alone: keep every date where it is, rename the keys."""
        fx = real_fixture_dict()
        order = list(fx["source"]["term_order"])
        renamed = [f"Term {i}" for i in range(len(order))]
        fx["source"]["term_order"] = renamed
        for entry in fx["years"].values():
            original = entry["terms"]
            entry["terms"] = {renamed[i]: original[order[i]] for i in range(len(order))}
        problems = pa.hko_fixture_problems(fx)
        self.assertTrue(any("not the canonical HKO" in p for p in problems), problems)
        self.assertTrue(any("names are not the canonical set" in p for p in problems), problems)

    def test_a_single_term_moved_to_the_wrong_month_is_caught(self):
        fx = real_fixture_dict()
        fx["years"]["1950"]["terms"]["Spring Commences"] = [7, 4]
        problems = pa.hko_fixture_problems(fx)
        self.assertTrue(any("index-to-month invariant" in p for p in problems), problems)
        self.assertTrue(any("starts in month 7, expected 2" in p for p in problems), problems)

    def test_an_out_of_range_day_is_caught(self):
        fx = real_fixture_dict()
        fx["years"]["1950"]["terms"]["Cold Dew"] = [10, 44]
        problems = pa.hko_fixture_problems(fx)
        self.assertTrue(any("outside 1-31" in p for p in problems), problems)

    def test_a_non_pair_term_value_is_caught(self):
        fx = real_fixture_dict()
        fx["years"]["1950"]["terms"]["Heavy Snow"] = "12-08"
        problems = pa.hko_fixture_problems(fx)
        self.assertTrue(any("is not a [month, day] pair" in p for p in problems), problems)

    def test_the_shipped_fixture_satisfies_every_semantic_invariant(self):
        """Positive control: without it the pins above could all pass against
        an invariant no real fixture can meet."""
        fx = real_fixture_dict()
        self.assertEqual(tuple(fx["source"]["term_order"]), pa.HKO_CANONICAL_TERM_ORDER)
        for year, entry in fx["years"].items():
            self.assertEqual(set(entry["terms"]), set(pa.HKO_CANONICAL_TERM_ORDER), year)
            for index, term in enumerate(pa.HKO_CANONICAL_TERM_ORDER):
                self.assertEqual(entry["terms"][term][0], pa.HKO_TERM_START_MONTHS[index],
                                 f"{year} {term}")

    def test_the_real_comparator_reports_a_rotated_fixture_as_forged(self):
        """End-to-end through the real comparator, with the fixture-problems
        gate stubbed out so the comparator is genuinely reached. Two
        independent instruments have to catch this: the fixture validator
        (covered above) and the comparator itself, which indexes by its own
        canonical list rather than by the fixture's."""
        fx = self.rotate(real_fixture_dict())
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, fixture=fx)
            with mock.patch.object(pa, "hko_fixture_problems", return_value=[]):
                chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk)
        self.assertIn("termOrderCanonical=False", chk["summary"])
        self.assertIn("semanticViolationCount", chk["summary"])
        # And the rotation shows up as real date disagreements too, because
        # the comparator no longer takes its order from the file under test.
        self.assertGreater(chk["evidence"]["solarMismatchCount"], 0)


class HkoContentDigestTests(HkoBlockingFailureMixin, unittest.TestCase):
    """The digest is the only pin binding the fixture's VALUES to a reviewed
    state. Every structural pin above passes for a fixture whose term dates
    were regenerated from a broken engine -- and the comparator's own counts
    are tautological (it derives solarComparisons as comparedYears x 12), so
    without this pin '0 mismatches' could be produced by a forged authority."""

    def test_shipped_fixture_matches_the_pinned_digest(self):
        self.assertEqual(pa.hko_fixture_content_digest(real_fixture_dict()),
                         pa.HKO_FIXTURE_CONTENT_SHA256)

    def test_single_forged_term_value_is_caught_by_the_digest_alone(self):
        """The forgery that defeats every structural check: one term date
        changed, shape untouched. The digest must be the sole problem."""
        fx = real_fixture_dict()
        original = fx["years"]["1901"]["terms"]["Spring Commences"]
        fx["years"]["1901"]["terms"]["Spring Commences"] = [original[0], original[1] + 1]
        problems = self.assert_fixture_problem(fx, "content digest", total=1)
        self.assert_digest_problem_present(problems)

    def test_wholesale_value_forgery_is_caught(self):
        """Every solar boundary shifted by a day, provenance and hashes left
        intact -- the exact scenario the adversarial review reproduced."""
        fx = real_fixture_dict()
        for entry in fx["years"].values():
            entry["terms"] = {k: [v[0], v[1] + 1] for k, v in entry["terms"].items()}
        self.assert_fixture_problem(fx, "content digest", total=1)

    def test_digest_is_insensitive_to_key_order_and_whitespace(self):
        """Reformatting the fixture must not trip the pin -- only values do."""
        fx = real_fixture_dict()
        reordered = json.loads(json.dumps(fx, sort_keys=True, indent=8))
        self.assertEqual(pa.hko_fixture_content_digest(reordered),
                         pa.HKO_FIXTURE_CONTENT_SHA256)

    def test_digest_mismatch_blocks_end_to_end(self):
        fx = real_fixture_dict()
        fx["years"]["2050"]["lunar_new_year"] = [1, 1]
        with tempfile.TemporaryDirectory() as d:
            chk = pa.check_hko_calendar(build_hko_root(d, fixture=fx))
        self.assert_blocking_failure(chk, "content digest")


class HkoComparisonCountTests(HkoBlockingFailureMixin, unittest.TestCase):
    """Reduced comparison counts fail even with zero mismatches. Driven
    through a stub comparator so the fixture stays fully valid -- this models
    a comparator regression that under-reports coverage, which the old
    mismatch-count-only predicate would have called PASS."""

    def test_zero_comparisons_reported_fails(self):
        payload = dict(GOOD_COMPARISON, comparedYears=0, solarComparisons=0,
                       lunarComparisonCount=0)
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, comparator_stub=stub_comparator(payload))
            chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk, "comparedYears=0")

    def test_reduced_solar_comparisons_fails(self):
        payload = dict(GOOD_COMPARISON, solarComparisons=1200)
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, comparator_stub=stub_comparator(payload))
            chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk, "solarComparisons=1200")

    def test_reduced_lunar_comparisons_fails(self):
        payload = dict(GOOD_COMPARISON, lunarComparisonCount=199)
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, comparator_stub=stub_comparator(payload))
            chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk, "lunarComparisonCount=199")

    def test_comparator_reported_incomplete_years_fails(self):
        """Violates ONLY the `incomplete` pin -- an earlier draft also set
        comparedYears=199, so the failure could have come from either pin."""
        payload = dict(GOOD_COMPARISON, incomplete=[1999])
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, comparator_stub=stub_comparator(payload))
            chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk, "incomplete=[1999]")
        self.assertNotIn("comparedYears", chk["summary"], chk["summary"])

    def test_unparseable_comparator_stdout_fails(self):
        """Covers the pre-existing parse-error branch, not the hardening --
        this one would also pass against the old permissive check."""
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, comparator_stub="console.log('not json');\n")
            chk = pa.check_hko_calendar(root)
        self.assert_blocking_failure(chk, "parseable JSON")

    def test_non_object_comparator_json_fails_without_crashing(self):
        """Valid-but-non-object JSON used to reach .get() and raise, killing
        the run before any report was written -- which left the previous
        run's latest.json in place, still reading PASS."""
        for literal in ("null", "0", "[]", '"done"'):
            with self.subTest(stdout=literal):
                with tempfile.TemporaryDirectory() as d:
                    root = build_hko_root(
                        d, comparator_stub=f"console.log(JSON.stringify({literal}));\n")
                    chk = pa.check_hko_calendar(root)
                self.assert_blocking_failure(chk, "expected a JSON object")

    def test_large_mismatch_payload_survives_the_stdout_pipe(self):
        """hko_compare.mjs used to console.log() then process.exit(0), which
        dropped the unflushed tail on darwin. A systematic regression (every
        boundary wrong) then read as a comparator tooling failure instead of
        a calendar failure. The comparator now caps its detail arrays and
        lets node flush and exit on its own."""
        fat = dict(GOOD_COMPARISON,
                   solarMismatchCount=2400,
                   solarMismatches=[{"year": 1901 + (i % 200), "term": "Spring Commences",
                                     "index": 0, "expected": [2, 4], "actual": [2, 5],
                                     "pad": "x" * 40} for i in range(2400)])
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d, comparator_stub=stub_comparator(fat))
            chk = pa.check_hko_calendar(root)
        # The point: it fails on the MISMATCH pin, not on a parse error.
        self.assert_blocking_failure(chk, "solarMismatchCount=2400")
        self.assertNotIn("parseable JSON", chk["summary"], chk["summary"])

    def test_real_comparator_emits_complete_json_under_a_full_regression(self):
        """End-to-end against the real comparator and a calendar module whose
        every solar boundary is shifted -- 2400 mismatches. stdout must still
        parse."""
        with tempfile.TemporaryDirectory() as d:
            root = build_hko_root(d)
            # Shim the export the comparator imports, without touching the repo.
            shim = root / "core" / "calendar_shifted.js"
            shim.write_text(
                "import { monthAnimalSolarTerm as o, lunarNewYearDate } from './calendar.js';\n"
                "export const monthAnimalSolarTerm = (y, i) => { const r = o(y, i); "
                "return [r[0], r[1] + 1]; };\n"
                "export { lunarNewYearDate };\n",
                encoding="utf-8")
            env = dict(os.environ)
            env["CALENDAR_PATH"] = str(shim)
            env["FIXTURE_PATH"] = str(root / FIXTURE_REL)
            proc = subprocess.run(
                ["node", str(root / "audits" / "hko_compare.mjs")],
                cwd=str(root), env=env, text=True, capture_output=True, timeout=60)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        payload = json.loads(proc.stdout)  # must not be truncated mid-JSON
        self.assertEqual(payload["solarMismatchCount"], 2400)
        self.assertTrue(payload["solarMismatchesTruncated"])
        self.assertLessEqual(len(payload["solarMismatches"]), 50)

    def test_nonzero_comparator_exit_fails(self):
        stub = stub_comparator(GOOD_COMPARISON) + "process.exit(3);\n"
        with tempfile.TemporaryDirectory() as d:
            chk = pa.check_hko_calendar(build_hko_root(d, comparator_stub=stub))
        self.assert_blocking_failure(chk, "exit code=3")


class HkoEvaluatorUnitTests(unittest.TestCase):
    """Direct unit coverage of evaluate_hko_comparison()'s pins, one mutation
    at a time, so a future edit that drops a single pin is caught precisely."""

    def test_the_good_result_passes(self):
        status, summary = pa.evaluate_hko_comparison(0, dict(GOOD_COMPARISON))
        self.assertEqual(status, "pass", summary)
        self.assertIn("200 years", summary)
        self.assertIn("2400 solar", summary)

    def test_each_pin_violation_fails_individually(self):
        mutations = {
            "comparedYears": 199,
            "solarComparisons": 2399,
            "lunarComparisonCount": 199,
            "solarMismatchCount": 1,
            "lunarMismatchCount": 1,
            "incomplete": [1901],
            "semanticViolationCount": 1,
            "termOrderCanonical": False,
        }
        for key, bad_value in mutations.items():
            with self.subTest(pin=key):
                result = dict(GOOD_COMPARISON, **{key: bad_value})
                status, summary = pa.evaluate_hko_comparison(0, result)
                self.assertEqual(status, "fail", f"{key} pin did not fail: {summary}")
                self.assertIn(key, summary)

    def test_missing_key_fails_rather_than_passing_on_none(self):
        for key in ("comparedYears", "solarComparisons", "lunarComparisonCount",
                    "solarMismatchCount", "lunarMismatchCount", "incomplete",
                    "semanticViolationCount", "termOrderCanonical"):
            with self.subTest(missing=key):
                result = dict(GOOD_COMPARISON)
                del result[key]
                status, summary = pa.evaluate_hko_comparison(0, result)
                self.assertEqual(status, "fail", f"absent {key} must fail: {summary}")

    def test_semantic_violation_count_rejects_wrong_json_types(self):
        """P2 from the PR #186 pre-merge audit: this pin used ordinary
        equality, so `false` (False == 0) and `0.0` (0.0 == 0) both satisfied
        it. A forged fixture whose comparator reported the violation count in
        the wrong JSON type would have cleared the forged-fixture detector."""
        for bad in (False, 0.0, "0", None, [], 0j):
            with self.subTest(semanticViolationCount=bad):
                status, summary = pa.evaluate_hko_comparison(
                    0, dict(GOOD_COMPARISON, semanticViolationCount=bad))
                self.assertEqual(status, "fail",
                                 f"semanticViolationCount={bad!r} must fail: {summary}")
                self.assertIn("semanticViolationCount", summary)
                self.assertIn("is not an integer", summary)

    def test_term_order_canonical_is_matched_by_identity_not_equality(self):
        """Same P2, other half: `1 == True` in Python, so `termOrderCanonical:
        1` passed. Only the literal JSON `true` may satisfy this pin."""
        for bad in (1, 1.0, "true", "True", [True], None):
            with self.subTest(termOrderCanonical=bad):
                status, summary = pa.evaluate_hko_comparison(
                    0, dict(GOOD_COMPARISON, termOrderCanonical=bad))
                self.assertEqual(status, "fail",
                                 f"termOrderCanonical={bad!r} must fail: {summary}")
                self.assertIn("termOrderCanonical", summary)

    def test_the_two_finding_l_pins_still_accept_their_correct_types(self):
        """Positive control for the strict-type pins -- without this the two
        tests above could be passing because the pins reject everything."""
        status, _summary = pa.evaluate_hko_comparison(
            0, dict(GOOD_COMPARISON, semanticViolationCount=0, termOrderCanonical=True))
        self.assertEqual(status, "pass")

    def test_boolean_counts_are_rejected_as_non_numbers(self):
        """Python's `False == 0` and `isinstance(True, int)` would otherwise
        let a JSON boolean satisfy a zero-count pin."""
        for key, bad in (("solarMismatchCount", False), ("lunarMismatchCount", False),
                         ("comparedYears", True)):
            with self.subTest(pin=key):
                status, summary = pa.evaluate_hko_comparison(
                    0, dict(GOOD_COMPARISON, **{key: bad}))
                self.assertEqual(status, "fail", f"{key}={bad!r} must fail: {summary}")
                self.assertIn("not a number", summary)

    def test_string_counts_are_rejected_as_non_numbers(self):
        status, summary = pa.evaluate_hko_comparison(
            0, dict(GOOD_COMPARISON, solarComparisons="2400"))
        self.assertEqual(status, "fail")
        self.assertIn("not a number", summary)

    def test_nonzero_exit_fails_even_with_a_perfect_payload(self):
        status, summary = pa.evaluate_hko_comparison(1, dict(GOOD_COMPARISON))
        self.assertEqual(status, "fail")
        self.assertIn("exit code", summary)


class HkoPositiveControlTests(unittest.TestCase):
    """The shipped fixture and comparator must actually satisfy every pin --
    without this, the negative suite above could be passing simply because
    the gate rejects everything."""

    def test_shipped_fixture_and_comparator_pass_with_exact_counts(self):
        with tempfile.TemporaryDirectory() as d:
            chk = pa.check_hko_calendar(build_hko_root(d))
        self.assertEqual(chk["status"], "pass", chk["summary"] + "\n" + chk["output"])
        self.assertEqual(chk["severity"], "blocking")
        ev = chk["evidence"]
        self.assertEqual(ev["comparedYears"], 200)
        self.assertEqual(ev["solarComparisons"], 2400)
        self.assertEqual(ev["lunarComparisonCount"], 200)
        self.assertEqual(ev["solarMismatchCount"], 0)
        self.assertEqual(ev["lunarMismatchCount"], 0)
        self.assertEqual(ev["incomplete"], [])
        self.assertEqual(ev["fixtureSha256Count"], 200)

    def test_shipped_fixture_has_no_integrity_or_provenance_problems(self):
        self.assertEqual(pa.hko_fixture_problems(real_fixture_dict()), [])


# ── executed-suite CI-gate coverage ─────────────────────────────────────
#
# Codex's 2026-07-30 pre-merge audit (finding G) showed both CI-doctrine
# checks could report green without proving their claims, because both only
# grepped prose: three of the four required ci.yml substrings already existed
# at e3c2586; removing the live doctrine exclusion but leaving its text in an
# inert comment still passed; and a comment-only tests file carrying the two
# magic strings satisfied the regression check outright. Both now execute the
# real suites. The pins below are the negative coverage for that execution --
# above all that "zero failures" alone is NOT a pass, since zero failures over
# zero tests is exactly what a deleted or comment-only suite reports.

def vitest_report(*, passed_names=(), num_failed=0, num_passed=None):
    """A minimal vitest JSON report shaped like the real reporter's output."""
    names = list(passed_names)
    return {
        "numTotalTests": len(names) + num_failed,
        "numPassedTests": len(names) if num_passed is None else num_passed,
        "numFailedTests": num_failed,
        "testResults": [{
            "assertionResults": [
                {"status": "passed", "fullName": name} for name in names
            ],
        }],
    }


class ExecutedSuiteEvaluatorTests(unittest.TestCase):
    REQUIRED = ("load bearing one", "load bearing two")

    def evaluate(self, rc, report, min_tests=2):
        violations, _ = pa.evaluate_vitest_suite(rc, report, min_tests, self.REQUIRED)
        return violations

    def test_a_complete_passing_report_has_no_violations(self):
        report = vitest_report(passed_names=self.REQUIRED)
        self.assertEqual(self.evaluate(0, report), [])

    def test_comment_only_suite_is_rejected_despite_zero_failures(self):
        # The exact finding-G dodge: a file with no executable tests reports
        # zero failures. Under a mismatch-count-only predicate that is a pass.
        report = vitest_report(passed_names=())
        violations = self.evaluate(0, report)
        self.assertTrue(any("expected at least" in v for v in violations), violations)
        self.assertTrue(any("load-bearing" in v for v in violations), violations)

    def test_dropping_one_load_bearing_test_is_rejected_even_at_full_count(self):
        # The surgical case: the count is met by filler, but the test that
        # actually proves the gate is gone.
        report = vitest_report(passed_names=("load bearing one", "filler", "more filler"))
        violations = self.evaluate(0, report)
        self.assertTrue(any("load bearing two" in v for v in violations), violations)

    def test_reduced_passing_count_is_rejected(self):
        report = vitest_report(passed_names=self.REQUIRED)
        violations = self.evaluate(0, report, min_tests=31)
        self.assertTrue(any("expected at least 31" in v for v in violations), violations)

    def test_a_failing_test_is_rejected(self):
        report = vitest_report(passed_names=self.REQUIRED, num_failed=1)
        self.assertTrue(any("1 test(s) failed" in v for v in self.evaluate(0, report)))

    def test_nonzero_exit_fails_even_with_a_perfect_payload(self):
        report = vitest_report(passed_names=self.REQUIRED)
        self.assertTrue(any("vitest exited 1" in v for v in self.evaluate(1, report)))

    def test_boolean_counts_are_rejected_as_non_integers(self):
        # `isinstance(True, int)` is True and `False == 0`, so a JSON boolean
        # would otherwise satisfy the zero-failure and minimum-count pins.
        report = vitest_report(passed_names=self.REQUIRED)
        report["numFailedTests"] = False
        report["numPassedTests"] = True
        violations = self.evaluate(0, report)
        self.assertTrue(any("numFailedTests" in v for v in violations), violations)
        self.assertTrue(any("numPassedTests" in v for v in violations), violations)

    def test_missing_counts_fail_rather_than_passing_on_none(self):
        report = vitest_report(passed_names=self.REQUIRED)
        del report["numPassedTests"]
        del report["numFailedTests"]
        violations = self.evaluate(0, report)
        self.assertEqual(len(violations), 2, violations)


class ExecutedSuiteCheckTests(unittest.TestCase):
    def test_missing_suite_file_is_a_blocking_failure_not_a_skip(self):
        # Fails closed. An absent regression suite is the precise state these
        # checks exist to detect, so it must never read as "nothing to do".
        with tempfile.TemporaryDirectory() as d:
            chk = pa.executed_suite_check(
                Path(d), "product.example", "example",
                "tests/does_not_exist.test.js", 1, ("anything",),
            )
        self.assertEqual(chk["status"], "fail")
        self.assertEqual(chk["severity"], "blocking")
        self.assertIn("fails closed", chk["summary"])

    def test_both_shipped_gate_checks_pass_in_this_repo(self):
        # Positive control. Without it every negative test above could pass
        # against a check that can no longer succeed at all.
        for check_fn, check_id in (
            (pa.check_ci_doctrine_gate, "product.ci_doctrine_gate"),
            (pa.check_ci_doctrine_regression, "product.ci_doctrine_regression"),
        ):
            with self.subTest(check=check_id):
                chk = check_fn(REPO_ROOT)
                self.assertEqual(chk["id"], check_id)
                self.assertEqual(chk["severity"], "blocking")
                self.assertEqual(chk["status"], "pass", chk["summary"])
                self.assertEqual(chk["evidence"]["numFailedTests"], 0)
                self.assertGreaterEqual(
                    chk["evidence"]["numPassedTests"], chk["evidence"]["minimumRequired"]
                )


class LocalPiiSeverityTests(unittest.TestCase):
    """A blocking check that skips on every run in CI is claiming an assurance
    it never provides (2026-07-30 Codex pre-merge audit, finding H). The
    pattern file is gitignored and operator-local, so absent IS the permanent
    CI state -- that branch reports `info`. The branch where the scan actually
    runs must stay blocking."""

    def test_absent_pattern_file_skips_as_info_not_blocking(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "audits").mkdir()
            (root / "audits" / "run_local_audit.sh").write_text("#!/usr/bin/env bash\nexit 0\n")
            chk = pa.check_local_pii(root)
        self.assertEqual(chk["status"], "skip")
        self.assertEqual(chk["severity"], "info")
        self.assertFalse(chk["evidence"]["pattern_file_exists"])

    def test_a_real_pii_hit_is_still_a_blocking_failure(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            audits_dir = root / "audits"
            audits_dir.mkdir()
            (audits_dir / "local_personal_data.txt").write_text("dummy pattern\n")
            script = audits_dir / "run_local_audit.sh"
            script.write_text("#!/usr/bin/env bash\necho 'a hit'\nexit 1\n")
            script.chmod(script.stat().st_mode | stat.S_IEXEC)
            chk = pa.check_local_pii(root)
        self.assertEqual(chk["status"], "fail")
        self.assertEqual(chk["severity"], "blocking")


def check_explodes(product_root):
    raise RuntimeError("boom")


class GuardedCheckTests(unittest.TestCase):
    """A check raising an unexpected exception must become a blocking failure
    in the report. Without this, one crashing check aborts main() before the
    report is written at all, leaving the PREVIOUS run's latest.json in place
    still reading whatever it last said -- a stale green."""

    def test_raising_check_becomes_a_blocking_failure(self):
        chk = pa.guarded(check_explodes, REPO_ROOT)
        self.assertEqual(chk["status"], "fail")
        self.assertEqual(chk["severity"], "blocking")
        self.assertEqual(chk["id"], "product.explodes")
        self.assertIn("RuntimeError", chk["summary"])
        self.assertIn("boom", chk["summary"])

    def test_normal_check_passes_through_untouched(self):
        direct = pa.check_index_budget(REPO_ROOT)
        viaguard = pa.guarded(pa.check_index_budget, REPO_ROOT)
        self.assertEqual(direct["id"], viaguard["id"])
        self.assertEqual(direct["status"], viaguard["status"])

    def test_a_crashing_check_still_produces_a_written_report(self):
        original = pa.check_t4_migration

        def exploding(product_root):
            raise ValueError("simulated crash")

        exploding.__name__ = "check_t4_migration"
        with tempfile.TemporaryDirectory() as out_dir:
            argv = ["project_audit.py", "--product", str(REPO_ROOT), "--output-dir", out_dir]
            pa.check_t4_migration = exploding
            try:
                with mock.patch.object(sys, "argv", argv):
                    with self.assertRaises(SystemExit):
                        pa.main()
                report = json.loads((Path(out_dir) / "latest.json").read_text())
            finally:
                pa.check_t4_migration = original

        crashed = next(c for c in report["checks"] if c["id"] == "product.t4_migration")
        self.assertEqual(crashed["status"], "fail")
        self.assertEqual(crashed["severity"], "blocking")
        self.assertIn("ValueError", crashed["summary"])
        self.assertGreaterEqual(report["blocking_failure_count"], 1)


# ── path redaction (PR #191 pre-merge audit, P3) ────────────────────────────
#
# The auditor's reports are shared: CI uploads them as a build artifact and a
# local run is often pasted into an audit packet. They used to embed the
# operator's home directory — and therefore their account name — by three
# independent routes: the `product_root` field, an absolute path inside a
# captured `command` list, and captured subprocess output that printed its cwd.
#
# These tests pin the redaction AND pin that it lives at the serialization
# boundary rather than in each check, because the failure mode being prevented
# is a future check forgetting to redact.

def _home_leak_hits(text):
    """Every absolute home-ish path still present in a rendered report.

    Shared by the real-run assertion and by the guard-the-guard case below, so
    the sentinel exercises the exact predicate the real test relies on.
    """
    home = os.path.expanduser("~")
    needles = [n for n in {home, os.path.realpath(home)} if n and n != os.sep]
    return [n for n in needles if n in text]


class PathRedactionHelperTests(unittest.TestCase):
    """Unit-level: the helper itself, with no subprocess involved."""

    def test_redacts_product_root_and_home_in_a_nested_structure(self):
        root = os.path.join(os.path.expanduser("~"), "dev", "8ball")
        pairs = pa.redaction_map(root)
        payload = {
            "product_root": root,
            "checks": [
                {"command": ["node", os.path.join(root, "audits", "hko_compare.mjs")],
                 "output": f"RUN v4 {root}\nhome was {os.path.expanduser('~')}\n",
                 "evidence": {"nested": {"deep": [root]}}},
            ],
        }
        out = pa.redact_paths(payload, pairs)
        rendered = json.dumps(out)
        self.assertEqual(_home_leak_hits(rendered), [],
                         f"home path survived redaction: {rendered}")
        self.assertIn(pa.PRODUCT_ROOT_PLACEHOLDER, out["product_root"])
        # recursion actually reached a list inside a dict inside a list
        self.assertEqual(out["checks"][0]["evidence"]["nested"]["deep"],
                         [pa.PRODUCT_ROOT_PLACEHOLDER])

    def test_product_root_wins_over_home_when_nested(self):
        """Longest-needle-first ordering. If home were replaced first, the
        product root would become `<home>/dev/8ball` and the more specific
        token would never appear."""
        root = os.path.join(os.path.expanduser("~"), "dev", "8ball")
        out = pa.redact_paths(root, pa.redaction_map(root))
        self.assertEqual(out, pa.PRODUCT_ROOT_PLACEHOLDER)

    def test_non_string_leaves_are_untouched(self):
        pairs = pa.redaction_map(str(REPO_ROOT))
        self.assertEqual(pa.redact_paths({"n": 3, "f": 1.5, "b": True, "z": None}, pairs),
                         {"n": 3, "f": 1.5, "b": True, "z": None})

    def test_redacts_dict_keys_not_only_values(self):
        """P1 (PR #194 pre-merge audit): a path landing in a dict key — e.g.
        a per-file evidence map keyed by absolute path — must be redacted
        just like a value. Reproduces the exact leak shape the audit found:
        {"<home>/...": "value"}."""
        root = os.path.join(os.path.expanduser("~"), "dev", "8ball")
        pairs = pa.redaction_map(root)
        payload = {root: "value", os.path.expanduser("~"): "other"}
        out = pa.redact_paths(payload, pairs)
        rendered = json.dumps(out)
        self.assertEqual(_home_leak_hits(rendered), [],
                         f"home path survived key redaction: {rendered}")
        self.assertIn(pa.PRODUCT_ROOT_PLACEHOLDER, out)

    def test_key_redaction_collision_keeps_both_entries(self):
        """Two distinct keys that redact to the same string must not
        silently clobber one another.

        This must use ONLY the two full-path needles below — not
        `redaction_map()`'s output, which already contains the bare `home`
        needle. Since `redact_paths` applies needles in list order via
        sequential `.replace()`, a bare `home` needle ahead of these two
        would rewrite each key to a *distinct* string (`<home>/a/secret1`
        vs `<home>/b/secret2`) before either full-path needle got a chance
        to fire — so `len(out) == 2` would pass trivially even with the
        disambiguation branch deleted. (Caught by cross-model pre-merge
        review of PR #194 — the first version of this test did exactly
        that and never exercised the collision branch at all.)"""
        home = os.path.expanduser("~")
        secret1 = os.path.join(home, "a", "secret1")
        secret2 = os.path.join(home, "b", "secret2")
        payload = {secret1: 1, secret2: 2}
        collapsing_pairs = [
            (secret1, pa.HOME_PLACEHOLDER),
            (secret2, pa.HOME_PLACEHOLDER),
        ]
        out = pa.redact_paths(payload, collapsing_pairs)
        self.assertEqual(len(out), 2, f"a colliding key silently dropped an entry: {out}")
        self.assertEqual(sorted(out.values()), [1, 2])
        self.assertEqual(set(out.keys()), {pa.HOME_PLACEHOLDER, f"{pa.HOME_PLACEHOLDER}#2"},
                         f"expected exactly the disambiguated key set: {out}")

    def test_guard_can_fail(self):
        """Guard-the-guard: the leak predicate must actually fire on a report
        that was NOT redacted, or every assertion built on it is a false green."""
        leaky = json.dumps({"product_root": str(REPO_ROOT),
                            "output": f"RUN v4 {REPO_ROOT}"})
        self.assertNotEqual(_home_leak_hits(leaky), [],
                            "the leak detector cannot see an unredacted report, so "
                            "the real-run test below proves nothing")


class PathRedactionRealRunTests(unittest.TestCase):
    """End-to-end: a real audit of the real repo must emit no home path in
    either artifact. This is the assertion that would have caught the original
    defect, and it drives the real writer rather than the helper."""

    def test_real_report_artifacts_carry_no_absolute_home_path(self):
        with tempfile.TemporaryDirectory() as out_dir:
            subprocess.run(
                [sys.executable, str(SCRIPT), "--output-dir", out_dir],
                cwd=str(REPO_ROOT), text=True, capture_output=True, timeout=280,
            )
            for name in ("latest.json", "latest.md"):
                text = (Path(out_dir) / name).read_text()
                self.assertEqual(_home_leak_hits(text), [],
                                 f"{name} still embeds an absolute home path")
                # ...and the assertion is not vacuous: the report is real.
                self.assertGreater(len(text), 500, f"{name} looks empty")

    def test_redaction_is_applied_at_serialization_not_per_check(self):
        """Structural. If redaction moved into individual checks, a check
        record synthesised outside them would come back unredacted — which is
        precisely the future-check-forgets defect this placement prevents."""
        source = SCRIPT.read_text()
        serialize_at = source.index("json_text = json.dumps(report")
        redact_at = source.index("report = redact_paths(report")
        self.assertLess(redact_at, serialize_at,
                        "redaction must run before the report is serialized")
        self.assertLess(source.index("md_text = render_markdown(report)") - redact_at, 400,
                        "markdown is rendered from the same redacted report")


class TestLauncherPositionTests(unittest.TestCase):
    """P2 (PR #194 pre-merge audit): `unittest.main()` must run after every
    TestCase class is defined. Direct execution (`python3
    audits/test_project_audit.py`) evaluates top-to-bottom, so a launcher
    placed mid-file silently drops every class defined below it — that
    class body is never even reached before unittest.main() calls
    sys.exit()."""

    def test_launcher_runs_after_the_last_test_class(self):
        this_file = Path(__file__).resolve()
        source = this_file.read_text()
        launcher_at = source.rindex('if __name__ == "__main__":')
        last_class_at = source.rindex("\nclass ")
        self.assertLess(last_class_at, launcher_at,
                        "unittest.main() launcher must come after every "
                        "TestCase class, or direct execution silently "
                        "skips whatever follows it")


if __name__ == "__main__":
    unittest.main()
