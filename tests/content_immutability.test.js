// 8ball / tests / content_immutability.test.js
//
// DOCTRINE §4: a shipped content batch is immutable — a new release is a
// NEW file, never an in-place edit. Through v0.72 that rule was enforced by
// review and `git diff` alone; the pr232 audit (both lanes) showed an edit
// to a v5 placement line riding the whole suite green, and since
// content/meanings.v6.js carries v5 by star re-export, a v5 edit changes
// SHIPPED panel text. This file pins every shipped meanings batch by
// content hash. Changing a hash here is the §4 safety-patch carve-out and
// needs the journal note that carve-out requires; a new batch is a new
// line, not a changed one.

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHIPPED = {
  'content/meanings.v1.js': '4b6d8ba9c37fa738c9b85613dd3febae444cf0901faca136c5d6feab3b693163',
  'content/meanings.v2.js': '23d867a8ca4027db1e394e367d7d60981fcbc4355cf5d830f086942582880c80',
  'content/meanings.v3.js': '2a8e8abf952062b9fabaa5f680ecd6024d8057881e1e943015ec9c02289c7fcf',
  'content/meanings.v4.js': '6696826eba7853f0311d69b6eeb4a6ff2cbade2163cdb0ce8d62dbbb016aa1ad',
  'content/meanings.v5.js': 'a1c36085db14f574cd01cf3acc41dcb8f194b57575b9087e5de3bb3b44afa9d2',
  'content/meanings.v6.js': 'cb906235f0e85ada5788e8d1de97a150b4de0ffc26a2c67b70b37fbec47e2920',
};

describe('content immutability (§4) — shipped meanings batches pinned by hash', () => {
  for (const [file, sha] of Object.entries(SHIPPED)) {
    it(`${file} is byte-identical to its shipped form`, () => {
      const actual = createHash('sha256').update(readFileSync(join(root, file))).digest('hex');
      expect(actual, `${file} changed — §4: new release = new file`).toBe(sha);
    });
  }

  it('every meanings batch on disk is pinned (a new batch adds a line here)', () => {
    const onDisk = readdirSync(join(root, 'content')).filter(f => /^meanings\.v\d+\.js$/.test(f)).map(f => `content/${f}`).sort();
    expect(onDisk).toEqual(Object.keys(SHIPPED).sort());
  });
});
