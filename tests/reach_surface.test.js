// 8ball / tests / reach_surface.test.js
//
// Pins the static reach / discoverability surface (canonical, JSON-LD, robots,
// sitemap) AND enforces §2 clinical voice on the INDEXABLE head: the factual,
// machine-readable description a search engine or AI assistant ingests must stay
// specimen/registry voice — never predictive/mystical. The arcade "magic 8-ball"
// hook is permitted ONLY on the og/twitter SOCIAL cards (§12 arcade carve-out),
// not on the indexable meta/JSON-LD surface.
//
// Added in the max-evolution pass after two independent cross-model reviews
// (codex/grok/claude) converged on: (a) these surfaces were unpinned false-greens
// that could rot while the suite stayed green, and (b) "a magic 8-ball that knows
// you" had leaked into the indexable <meta name="description"> + JSON-LD.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');
const html = read('index.html');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');

const SITE = 'https://the-eight-ball.netlify.app';
const SITE_RE = SITE.replace(/[.]/g, '\\.');
// §2: the indexable/factual surface may not carry oracle/prediction/guidance voice.
const MYSTICAL = /\b(magic|knows you|fortune|predict(s|ion)?|oracle|destiny|horoscope|prophec|future|guidance)\b/i;

function metaDescription() {
  const m = html.match(/<meta name="description" content="([^"]*)"/);
  return m ? m[1] : null;
}
function jsonLd() {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : null;
}

describe('reach surface — canonical / JSON-LD / robots / sitemap pins', () => {
  it('canonical points at the site root', () => {
    const m = html.match(/<link rel="canonical" href="([^"]*)"/);
    expect(m, 'canonical link missing').not.toBeNull();
    expect(m[1].replace(/\/$/, '')).toBe(SITE);
  });

  it('JSON-LD is valid, WebApplication, honest, URL-correct', () => {
    const ld = jsonLd();
    expect(ld, 'JSON-LD missing or unparseable').not.toBeNull();
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('WebApplication');
    expect(ld.url.replace(/\/$/, '')).toBe(SITE);
    expect(typeof ld.description).toBe('string');
    expect(ld.description.length).toBeGreaterThan(0);
  });

  it('robots.txt allows crawlers and points to the sitemap', () => {
    expect(robots).toMatch(/User-agent:\s*\*/i);
    expect(robots).toMatch(/Allow:\s*\//i);
    expect(robots).toMatch(new RegExp(`Sitemap:\\s*${SITE_RE}/sitemap\\.xml`, 'i'));
  });

  it('sitemap.xml is well-formed and lists the canonical root', () => {
    expect(sitemap).toMatch(/<\?xml/);
    expect(sitemap).toMatch(/<urlset[^>]*sitemaps\.org\/schemas\/sitemap/);
    expect(sitemap).toMatch(new RegExp(`<loc>${SITE_RE}/?</loc>`));
  });
});

describe('reach surface — og-image asset parity', () => {
  // The social unfurl (og/twitter image) is a reach artifact like robots/
  // sitemap: if the meta URL and the shipped asset drift apart — file
  // renamed, dimensions changed without the width/height metas following —
  // every link share silently unfurls broken while the suite stays green.
  const ogImageUrl = () => {
    const m = html.match(/<meta property="og:image" content="([^"]*)"/);
    return m ? m[1] : null;
  };

  it('og:image and twitter:image agree and live under the site origin', () => {
    const og = ogImageUrl();
    expect(og, 'og:image meta missing').not.toBeNull();
    expect(og.startsWith(`${SITE}/assets/`)).toBe(true);
    const tw = html.match(/<meta name="twitter:image" content="([^"]*)"/);
    expect(tw, 'twitter:image meta missing').not.toBeNull();
    expect(tw[1]).toBe(og);
  });

  it('the referenced asset exists and its PNG dimensions match the og metas', () => {
    const og = ogImageUrl();
    expect(og, 'og:image meta missing').not.toBeNull();
    const rel = og.slice(SITE.length + 1); // e.g. assets/og-image.png
    const png = readFileSync(join(__dirname, '..', ...rel.split('/')));
    // PNG signature + IHDR width/height (big-endian at offsets 16/20;
    // IHDR is the spec-mandated first chunk, type at bytes 12-15).
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const metaW = html.match(/<meta property="og:image:width" content="(\d+)"/);
    const metaH = html.match(/<meta property="og:image:height" content="(\d+)"/);
    expect(metaW && metaH, 'og:image width/height metas missing').toBeTruthy();
    expect(width).toBe(Number(metaW[1]));
    expect(height).toBe(Number(metaH[1]));
  });
});

describe('reach surface — §2 clinical voice on the indexable head', () => {
  it('meta description is clinical/specimen (no predictive/mystical phrasing)', () => {
    const d = metaDescription();
    expect(d, 'meta description missing').not.toBeNull();
    expect(d, `meta description leaks mystical/predictive voice: "${d}"`).not.toMatch(MYSTICAL);
  });

  it('JSON-LD description is clinical AND identical to the meta description (parity)', () => {
    const ld = jsonLd();
    expect(ld.description).not.toMatch(MYSTICAL);
    expect(ld.description).toBe(metaDescription());
  });

  it('meta description fits a SERP snippet (<=160 chars) with the privacy differentiator present', () => {
    const d = metaDescription();
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d).toMatch(/stored only on your device/i);
  });
});
