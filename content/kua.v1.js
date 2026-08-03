// content/kua.v1.js
// Eight Mansions trigram registry, v1 — the citation layer for the kua
// t3 block (§1.D kua amendment; register law per §1.G).
//
// DOCTRINE §4 ("versioned, not edited"): this file is a fresh v1 batch.
// Once shipped it is IMMUTABLE — a future change is a kua.v2.js that
// carries these tables unedited, never an in-place edit.
//
// THE PROBLEM. The kua number (core/kua.js) files a birth under one of
// eight trigrams, and the product needs a written layer for the block.
// Eight Mansions' traditional use of that filing is directional guidance
// — auspicious and inauspicious orientations — which is oracle register
// and permanently out under §12. What may ship is what §1.G ships for
// every other symbol: a citation of what the named tradition ASSOCIATES,
// never what it advises.
//
// THE TWO WRONG FIXES, named so they are not re-proposed. (a) Carrying
// both kua schools (the single continuous rule and the post-2000
// variant) as a switchable table — that would put two values behind one
// coordinate and re-open the truth defect §1.B v0.62 closed; the fork is
// NAMED in KUA_SOURCES instead, and the calc ships one rule. (b) Writing
// the directions as guidance ("face northeast for…") — that is the
// oracle register §12 bans; entries below carry registry facts only.
//
// THE FIX. Eight entries, keyed by the eight reachable kua numbers
// (1-4, 6-9 — a raw 5 has no trigram and files 2/8 in core/kua.js with
// the remap disclosed). Each entry: the trigram's name, glyph, element,
// seat direction, east/west group, and a §1.G-register citation line.
// Shape per entry: { trigram, glyph, element, direction, group,
// register: 'short two-part tag', body: 'one to two sentences' }.

export const KUA_TRIGRAMS = Object.freeze({
  1: Object.freeze({
    trigram: 'kan', glyph: '☵', element: 'water', direction: 'north', group: 'east',
    register: 'kan · the abysmal',
    body: 'the eight mansions tradition files kua one under kan, the water trigram seated in the north, and counts it in the east group of four.',
  }),
  2: Object.freeze({
    trigram: 'kun', glyph: '☷', element: 'earth', direction: 'southwest', group: 'west',
    register: 'kun · the receptive',
    body: 'the eight mansions tradition files kua two under kun, the earth trigram seated in the southwest, and counts it in the west group of four.',
  }),
  3: Object.freeze({
    trigram: 'zhen', glyph: '☳', element: 'wood', direction: 'east', group: 'east',
    register: 'zhen · the arousing',
    body: 'the eight mansions tradition files kua three under zhen, the wood trigram of thunder seated in the east, and counts it in the east group of four.',
  }),
  4: Object.freeze({
    trigram: 'xun', glyph: '☴', element: 'wood', direction: 'southeast', group: 'east',
    register: 'xun · the gentle',
    body: 'the eight mansions tradition files kua four under xun, the wood trigram of wind seated in the southeast, and counts it in the east group of four.',
  }),
  6: Object.freeze({
    trigram: 'qian', glyph: '☰', element: 'metal', direction: 'northwest', group: 'west',
    register: 'qian · the creative',
    body: 'the eight mansions tradition files kua six under qian, the metal trigram of heaven seated in the northwest, and counts it in the west group of four.',
  }),
  7: Object.freeze({
    trigram: 'dui', glyph: '☱', element: 'metal', direction: 'west', group: 'west',
    register: 'dui · the joyous',
    body: 'the eight mansions tradition files kua seven under dui, the metal trigram of the lake seated in the west, and counts it in the west group of four.',
  }),
  8: Object.freeze({
    trigram: 'gen', glyph: '☶', element: 'earth', direction: 'northeast', group: 'west',
    register: 'gen · keeping still',
    body: 'the eight mansions tradition files kua eight under gen, the earth trigram of the mountain seated in the northeast, and counts it in the west group of four.',
  }),
  9: Object.freeze({
    trigram: 'li', glyph: '☲', element: 'fire', direction: 'south', group: 'east',
    register: 'li · the clinging',
    body: 'the eight mansions tradition files kua nine under li, the fire trigram seated in the south, and counts it in the east group of four.',
  }),
});

// Provenance strings for the atlas/provenance surfaces (public.v3.js
// PUBLIC_SOURCES shape). The limitation line is load-bearing: it is the
// named fork THE PROBLEM paragraph promises, kept next to the tables it
// qualifies rather than in a comment nobody renders.
export const KUA_SOURCES = Object.freeze({
  kua: 'ba zhai ming jing (eight mansions) · kua number by solar birth year and gender; male 11−S, female 4+S over the year digit sum; a raw 5 files male→2, female→8, disclosed at render',
  boundary: 'solar year turns at li chun per the HKO-pinned solar-term table (core/calendar.js), at-or-after',
  limitation: 'a competing modern school changes the constants for post-2000 births (male 9−S, female 6+S); this registry ships the single continuous rule and names the fork here instead of carrying both',
});
