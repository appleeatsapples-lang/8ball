#!/usr/bin/env bash
# 8ball / audits / run_local_audit.sh
# Reads patterns from audits/local_personal_data.txt (gitignored)
# and greps tracked content for hits.
# Exits 0 on clean, 1 on hits.
#
# See audits/LOCAL_PII_AUDIT.md for the full procedure.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATTERN_FILE="$REPO_ROOT/audits/local_personal_data.txt"

cd "$REPO_ROOT"

if [ ! -f "$PATTERN_FILE" ]; then
  echo "ERROR: $PATTERN_FILE does not exist."
  echo "Create it per audits/LOCAL_PII_AUDIT.md before running this audit."
  exit 1
fi

# Build the list of files to scan: tracked content excluding the audit data file
# itself and the audit doc. Include untracked-but-not-ignored files too so a
# half-built leak is caught before commit.
FILES=()
while IFS= read -r line; do
  FILES+=("$line")
done < <(git ls-files --cached --others --exclude-standard \
  | grep -vE '^(audits/local_personal_data\.txt|audits/LOCAL_PII_AUDIT\.md|audits/run_local_audit\.sh|node_modules/|\.git/)')

if [ ${#FILES[@]} -eq 0 ]; then
  echo "WARN: no files to scan (empty git working tree?)"
  exit 0
fi

ANY_HIT=0
HITS=""

while IFS= read -r line; do
  # skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  pattern="$line"
  # case-insensitive grep, fixed string, with file:line format
  matches=$(grep -nFi --color=never -- "$pattern" "${FILES[@]}" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    ANY_HIT=1
    HITS+="--- pattern: $pattern\n$matches\n\n"
  fi
done < "$PATTERN_FILE"

if [ "$ANY_HIT" -eq 1 ]; then
  echo "LOCAL PII AUDIT: HITS FOUND"
  echo
  printf '%b' "$HITS"
  echo
  echo "Fix these before pushing. See audits/LOCAL_PII_AUDIT.md."
  exit 1
fi

echo "LOCAL PII AUDIT: clean (${#FILES[@]} files scanned)"
exit 0
