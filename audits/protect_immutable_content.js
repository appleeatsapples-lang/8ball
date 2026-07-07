#!/usr/bin/env node
// audits/protect_immutable_content.js
//
// Claude Code PreToolUse hook (matcher: "Edit|Write|MultiEdit").
// Blocks in-place edits to shipped, doctrine-immutable content files.
//
// See DOCTRINE.md §4 ("Versioned, not edited... new release = new file")
// and the §4 safety-patch carve-out clause. Registered under
// hooks.PreToolUse in .claude/settings.local.json.
//
// Exit 0 = allow the tool call.
// Exit 2 = block; stderr text is surfaced back to Claude as the reason.
//
// Deliberately fails OPEN on a parse error: a bug in this narrow, single-file
// check should not be able to block every edit in the repo. If you need to
// widen the protected-path list, add to PROTECTED_SUFFIXES below.

const PROTECTED_SUFFIXES = ["content/cards.v1.full.js"];

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let filePath = "";
  try {
    const input = JSON.parse(raw);
    filePath = (input.tool_input && input.tool_input.file_path) || "";
  } catch (e) {
    process.exit(0); // malformed input: fail open, not closed
  }

  const hit = PROTECTED_SUFFIXES.find((suffix) => filePath.endsWith(suffix));
  if (hit) {
    console.error(
      `BLOCKED: ${hit} is immutable per DOCTRINE.md \u00a74 ` +
        `("Versioned, not edited... new release = new file"). In-place ` +
        `edits are only permitted under a documented safety-patch ` +
        `carve-out (DOCTRINE \u00a74), which this hook cannot verify ` +
        `automatically.\n` +
        `If this really is a safety-patch carve-out: confirm it with the ` +
        `operator, have them temporarily remove this hook's entry in ` +
        `.claude/settings.local.json, make the edit, log the carve-out + ` +
        `reasoning in journal.md, then restore the hook.\n` +
        `Otherwise: create a new file (e.g. content/cards.v2.full.js) ` +
        `instead of editing this one.`
    );
    process.exit(2);
  }

  process.exit(0);
});
