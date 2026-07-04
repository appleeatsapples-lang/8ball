// content/meanings.v1.js
// Static, tradition-cited descriptions for the four free-tier single-symbol
// coordinates: arcana, sun sign, public animal, life path. Registrar voice —
// states what the named tradition associates with the symbol; never
// predicts, advises, diagnoses, or addresses the reader directly (DOCTRINE
// §2 voice register / §4 content rules).
//
// Deliberately excludes the catalog index. That compound sun x animal
// reading is the paid card entry (content/cards.v1.full.js name/type/habit/
// note) — giving it a free "meaning" here would undercut what t3 sells.
//
// Shape per entry: { register: 'short two-part tag', body: 'one to two
// sentences' }. Keyed by the exact string values core/profile.js and
// core/birthcard.js already produce (SUN_SIGNS names, ANIMALS, MAJOR_ARCANA
// names, life path digits as strings) — see tests/meanings_content.test.js
// for the completeness + voice-register scan against those canonical lists.
//
// Versioned per DOCTRINE §4 (immutable once shipped; a revision ships as
// meanings.v2.js, this file stays as historical record).

export const ARCANA_MEANINGS = {
  'the fool': {
    register: 'beginning · unwritten page',
    body: 'the tarot tradition assigns this card a first step taken before full information arrives — motion that precedes certainty.',
  },
  'the magician': {
    register: 'will · resourcefulness',
    body: 'associated with turning available tools into a result — intention converted directly into action.',
  },
  'the high priestess': {
    register: 'intuition · withheld knowledge',
    body: 'traditionally the card of what is known but not yet said — insight held behind a threshold.',
  },
  'the empress': {
    register: 'abundance · creative growth',
    body: 'linked to fertility and material flourishing — conditions that let something grow without forcing it.',
  },
  'the emperor': {
    register: 'structure · authority',
    body: 'reads as established order — rules set and maintained, often at the cost of flexibility.',
  },
  'the hierophant': {
    register: 'tradition · institution',
    body: 'represents inherited doctrine — knowledge passed through a recognized structure rather than discovered alone.',
  },
  'the lovers': {
    register: 'choice · alignment',
    body: 'traditionally marks a decision between values, not only a pairing — union that requires an actual choice.',
  },
  'the chariot': {
    register: 'willpower · directed motion',
    body: 'associated with forward movement achieved by holding two opposing forces on the same course.',
  },
  strength: {
    register: 'patience · quiet force',
    body: 'reads as restraint applied to power — control exercised without needing to overwhelm.',
  },
  'the hermit': {
    register: 'withdrawal · search',
    body: 'the card of stepping back from company to look for something a crowd tends to obscure.',
  },
  'wheel of fortune': {
    register: 'cycle · turning point',
    body: 'marks change arriving from outside personal control — a turn in circumstance rather than choice.',
  },
  justice: {
    register: 'cause and consequence',
    body: 'associated with balance restored through accounting — an outcome matched to what preceded it.',
  },
  'the hanged man': {
    register: 'suspension · reversed view',
    body: 'traditionally a pause that is not defeat — stillness that changes what becomes visible.',
  },
  death: {
    register: 'ending · clearing',
    body: 'reads as closure making room for what follows; rarely a literal reading in this tradition.',
  },
  temperance: {
    register: 'moderation · blending',
    body: 'the card of combining without excess — patience applied to mixture rather than force.',
  },
  'the devil': {
    register: 'attachment · constraint',
    body: 'associated with a bond to a pattern that limits movement, often one that could be set down.',
  },
  'the tower': {
    register: 'collapse · forced revelation',
    body: 'marks structural failure that exposes what the structure had been hiding.',
  },
  'the star': {
    register: 'renewal · quiet hope',
    body: 'reads as restoration after damage — a calm return of conditions worth continuing in.',
  },
  'the moon': {
    register: 'uncertainty · partial light',
    body: 'associated with navigating where the picture is incomplete — instinct used in place of full clarity.',
  },
  'the sun': {
    register: 'clarity · vitality',
    body: 'traditionally the most unguarded card in the deck — visible success without a hidden cost attached.',
  },
  judgement: {
    register: 'reckoning · awakening',
    body: 'marks a call to account for what came before — recognition arriving, not always requested.',
  },
  'the world': {
    register: 'completion · integration',
    body: 'reads as a cycle closed in full — components arriving at a settled, working whole.',
  },
};

export const SUN_MEANINGS = {
  aries: {
    register: 'initiation · directness',
    body: 'associated with acting before extended deliberation — energy that starts a sequence rather than joining one in progress.',
  },
  taurus: {
    register: 'persistence · grounding',
    body: 'reads as steady resistance to disruption — value placed on what can be relied on to stay put.',
  },
  gemini: {
    register: 'duality · exchange',
    body: 'traditionally linked to movement between ideas and people — attention distributed across more than one thread at a time.',
  },
  cancer: {
    register: 'protection · memory',
    body: 'associated with attachment to origin and an instinct to shelter what is close.',
  },
  leo: {
    register: 'visibility · expression',
    body: 'reads as comfort being seen — presence directed outward, often toward an audience.',
  },
  virgo: {
    register: 'refinement · discernment',
    body: 'traditionally the sign of functional attention — noticing what is slightly off and adjusting it.',
  },
  libra: {
    register: 'balance · negotiation',
    body: 'associated with weighing two sides evenly, sometimes leaving the balance itself unresolved.',
  },
  scorpio: {
    register: 'intensity · control',
    body: 'reads as transformation approached through pressure — change that arrives via a crisis point rather than gradually.',
  },
  sagittarius: {
    register: 'expansion · horizon',
    body: 'traditionally linked to movement toward distance — a preference for the wider view over the fixed one.',
  },
  capricorn: {
    register: 'ambition · structure',
    body: 'associated with building toward a long horizon — discipline applied over a span longer than the immediate.',
  },
  aquarius: {
    register: 'detachment · principle',
    body: 'reads as allegiance to an idea ahead of allegiance to a person — distance kept in service of a position.',
  },
  pisces: {
    register: 'dissolution · empathy',
    body: 'traditionally the sign where boundaries blur under feeling — permeability between self and surroundings.',
  },
};

export const ANIMAL_MEANINGS = {
  rat: {
    register: 'resourcefulness · adaptability',
    body: 'traditionally read as quick to locate an opening and quick to use it, regardless of the shape it takes.',
  },
  ox: {
    register: 'endurance · steadiness',
    body: 'associated with sustained effort — insistence maintained over a long duration rather than a short push.',
  },
  tiger: {
    register: 'boldness · risk',
    body: 'reads as movement toward contest — a preference for confrontation over avoidance.',
  },
  rabbit: {
    register: 'caution · diplomacy',
    body: 'traditionally linked to the indirect route — care taken to preserve calm rather than force an outcome.',
  },
  dragon: {
    register: 'authority · ambition',
    body: 'associated with comfort being seen at scale — presence that expects to lead rather than follow.',
  },
  snake: {
    register: 'discretion · strategy',
    body: 'reads as concealed intent applied patiently — movement made without announcing it first.',
  },
  horse: {
    register: 'independence · restlessness',
    body: 'traditionally linked to energy directed outward — discomfort with being held in one place.',
  },
  goat: {
    register: 'gentleness · artistry',
    body: 'associated with sensitivity to atmosphere — attention tuned to mood over structure.',
  },
  monkey: {
    register: 'ingenuity · wit',
    body: 'reads as improvisation treated as a skill — solutions assembled from whatever is at hand.',
  },
  rooster: {
    register: 'precision · candor',
    body: 'traditionally linked to confidence in observation — a habit of stating what was noticed plainly.',
  },
  dog: {
    register: 'loyalty · vigilance',
    body: 'associated with a sense of duty to the group — attention kept on what threatens it.',
  },
  pig: {
    register: 'generosity · ease',
    body: 'reads as tolerance for indulgence — comfort extended to both self and others without much reservation.',
  },
};

export const LIFE_PATH_MEANINGS = {
  '1': {
    register: 'the initiator',
    body: 'the pythagorean tradition assigns 1 to independence — starting a sequence rather than joining one already underway.',
  },
  '2': {
    register: 'the mediator',
    body: 'traditionally read as cooperation — attention split between two positions in search of balance between them.',
  },
  '3': {
    register: 'the communicator',
    body: 'associated with expression carried outward — words, image, or performance used to move an idea into view.',
  },
  '4': {
    register: 'the builder',
    body: 'reads as order applied over time — structure assembled to hold rather than to impress.',
  },
  '5': {
    register: 'the seeker',
    body: 'traditionally linked to change — resistance to routine and a pull toward variation.',
  },
  '6': {
    register: 'the caretaker',
    body: 'associated with responsibility toward others — attention directed at maintaining harmony within a group.',
  },
  '7': {
    register: 'the analyst',
    body: 'reads as introspection — a pull toward what sits beneath the visible surface of a question.',
  },
  '8': {
    register: 'the executive',
    body: 'traditionally linked to material and organizational command — ambition applied at scale.',
  },
  '9': {
    register: 'the humanitarian',
    body: 'associated with concern extended past the personal — closure sought on behalf of a wider group.',
  },
  '11': {
    register: 'the illuminator (master number)',
    body: 'read in this tradition as heightened intuition carried at a cost — insight that arrives with more tension than the base number 2 it reduces from.',
  },
  '22': {
    register: 'the master builder (master number)',
    body: 'traditionally the number of large ambition made real through discipline, rather than left as an idea.',
  },
  '33': {
    register: 'the master teacher (master number)',
    body: 'associated with guidance offered in service of others — a number rarely claimed outright in the tradition it comes from.',
  },
};
