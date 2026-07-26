// 8ball / tests / channel_routes.test.js
//
// Deterministic validation of the first-party channel entry paths in
// netlify.toml (DOCTRINE §4.B v0.56 sprint / §5 v0.35 first-party
// observability). The five paths — /r /x /ig /tt /pin — are 200 rewrites
// that serve the app AT their own path so the host's server-side logs can
// attribute entries per channel with zero client surface: no client event,
// no cookie, no pixel, no query param, no third-party script.
//
// Netlify evaluates redirect rules top-to-bottom (first match wins) and a
// non-forced rule never shadows a real static file. Both facts are load-
// bearing: the channel rules must sit ABOVE the SPA catch-all to be
// explicit rather than incidental, and no repo file may share a channel
// path name. Dependency-free — the TOML is regex-walked, not parsed with
// a library (§7 stage 4 dependency discipline).

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const toml = readFileSync(join(root, 'netlify.toml'), 'utf-8');

const CHANNEL_PATHS = ['/r', '/x', '/ig', '/tt', '/pin'];

// Walk every [[redirects]] block into { from, to, status, force, raw } in
// file order. A block runs from its header to the next [[ header or EOF.
function redirectBlocks() {
  const blocks = [];
  const re = /\[\[redirects\]\]([\s\S]*?)(?=\n\[\[|$)/g;
  let m;
  while ((m = re.exec(toml)) !== null) {
    const body = m[1];
    const get = (key) => {
      const km = body.match(new RegExp(`^\\s*${key}\\s*=\\s*("([^"]*)"|\\S+)`, 'm'));
      if (!km) return undefined;
      return km[2] !== undefined ? km[2] : km[1];
    };
    blocks.push({
      from: get('from'),
      to: get('to'),
      status: get('status'),
      force: get('force'),
      raw: body,
    });
  }
  return blocks;
}

describe('channel entry paths (netlify.toml, §4.B v0.56)', () => {
  const blocks = redirectBlocks();

  it('all five channel paths exist as exact 200 rewrites to the app', () => {
    for (const path of CHANNEL_PATHS) {
      const rule = blocks.find((b) => b.from === path);
      expect(rule, `missing [[redirects]] rule for ${path}`).toBeDefined();
      expect(rule.to).toBe('/index.html');
      expect(rule.status).toBe('200');
    }
  });

  it('channel rules are non-forced and carry no conditions, query matching, or headers', () => {
    for (const path of CHANNEL_PATHS) {
      const rule = blocks.find((b) => b.from === path);
      expect(rule.force, `${path} must not force over static files`).toBeUndefined();
      expect(rule.raw).not.toMatch(/\bquery\b|\bconditions\b|\bheaders\b|\bsigned\b/);
    }
  });

  it('channel rules sit above the SPA catch-all (first match wins)', () => {
    const catchAllIndex = blocks.findIndex((b) => b.from === '/*');
    expect(catchAllIndex, 'SPA catch-all missing').toBeGreaterThan(-1);
    for (const path of CHANNEL_PATHS) {
      const i = blocks.findIndex((b) => b.from === path);
      expect(i, `${path} rule missing`).toBeGreaterThan(-1);
      expect(i, `${path} must precede the /* catch-all`).toBeLessThan(catchAllIndex);
    }
  });

  it('the SPA catch-all survives unchanged (offline/paid-return behavior untouched)', () => {
    const catchAll = blocks.find((b) => b.from === '/*');
    expect(catchAll.to).toBe('/index.html');
    expect(catchAll.status).toBe('200');
    expect(catchAll.force).toBeUndefined();
  });

  it('no channel path collides with the root and none shadows a tracked file or folder', () => {
    // Exact-match, non-forced rules cannot shadow real files — but a repo
    // file NAMED r/x/ig/tt/pin would silently win over its channel rule.
    const rootEntries = new Set(readdirSync(root));
    for (const path of CHANNEL_PATHS) {
      expect(path).not.toBe('/');
      const bare = path.slice(1);
      expect(rootEntries.has(bare), `repo root entry "${bare}" would shadow ${path}`).toBe(false);
    }
    // The paid-return path stays the root: no channel rule rewrites "/".
    expect(blocks.some((b) => b.from === '/')).toBe(false);
  });

  it('channel targets carry no query parameters (no client-side attribution)', () => {
    for (const path of CHANNEL_PATHS) {
      const rule = blocks.find((b) => b.from === path);
      expect(rule.to).not.toMatch(/[?&]/);
    }
  });
});
