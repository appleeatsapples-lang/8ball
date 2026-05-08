// 8ball / content / traits.v1.js
// Roast-flavored trait phrases keyed by axis.
// Each entry should fit "you're {trait}" or close variants.
//
// Editing rules (DOCTRINE.md §4):
//   • No slurs. No protected-class targets.
//   • Self-applied universal traits only.
//   • If you can't tell whether it crosses the line, it crosses the line.
//   • New version = new file (traits.v2.js). Don't edit shipped pools in place.

export const TRAITS_SUN = {
  aries: [
    'running on the impatience of a microwave button',
    'first to react, last to think',
    'genuinely confused why people pause',
    'a starter pistol with opinions',
    'allergic to other people finishing sentences',
    'someone who treats traffic lights as suggestions',
    'driving the conversation like it stole something',
    'wired to charge first and ask zero questions',
    'a one-person stampede',
    'someone who texts back in 4 seconds and expects the same'
  ],
  taurus: [
    'as flexible as a parking meter',
    'allergic to plans that change',
    'someone whose hill to die on is a snack',
    'the slowest to anger and the longest to forgive',
    'married to your routine in ways your partner should worry about',
    'someone who takes 20 minutes to leave a restaurant',
    'genuinely offended by surprise gifts',
    'building a personal brand around comfort',
    'on a first-name basis with three couches',
    'a stubborn rock with strong opinions on linen'
  ],
  gemini: [
    'a different person depending on who texted last',
    'arguing both sides while drinking',
    'changing your mind faster than your phone battery dies',
    'best described as several browser tabs',
    'someone whose loyalty depends on the wifi',
    'made of opinions you read 20 minutes ago',
    'the human group chat',
    'fluent in vibes, illiterate in commitment',
    'starting six conversations and finishing zero',
    'quoting sources you have not vetted'
  ],
  cancer: [
    'remembering things from 2014 like they happened on Tuesday',
    'crying at car commercials and lying about it',
    'someone whose mood depends on the moon and the dishwasher',
    'protected by a shell that is also a feelings amplifier',
    'someone who texts your mom unprompted',
    'collecting people like a museum',
    'in your feelings about being in your feelings',
    'making everyone soup as conflict resolution',
    'capable of holding a grudge across reincarnations',
    'an emotional sponge that judges you for wringing it out'
  ],
  leo: [
    'allergic to not being looked at',
    'rehearsing this conversation in your head before having it',
    'taking up emotional square footage',
    'volume control set to parade',
    'someone who tips well so people will tell the story later',
    'directing your own movie nobody is watching',
    'genuinely wounded when not the protagonist',
    'making your hair the third character in this room',
    'born certain, raised certain, fact-checking optional',
    'someone who can turn buying coffee into an arc'
  ],
  virgo: [
    'editing this sentence in real time',
    'someone whose love language is constructive criticism',
    'organizing other people problems before your own',
    'spreadsheeting your emotions',
    'allergic to waste, allergic to praise',
    'genuinely happy fixing things that did not ask',
    'helpful in the way a smoke alarm is helpful',
    'someone who folds anxiety like laundry',
    'a perfectionist who calls it being thorough',
    'noticing the typo before the love letter'
  ],
  libra: [
    'unable to choose a restaurant or a stance',
    'someone who weighs every option until the options expire',
    'allergic to disagreement and addicted to tension',
    'aesthetically driven, logistically vague',
    'someone whose conflict style is ghosting with a candle',
    'collecting opinions like brunch invitations',
    'flirting with everyone, committing to a salad',
    'making peace by promising things to all sides',
    'pretty about it, paralyzed about it',
    'someone whose decisions need a second opinion that needs a second opinion'
  ],
  scorpio: [
    'looking at people like you have read their search history',
    'a casual conversationalist whose casual is interrogation lamp',
    'collecting receipts in a folder marked later',
    'someone whose forgiveness has a six-month wait list',
    'the human deep end',
    'finding meaning in a glance and wrong about it 40% of the time',
    'hot, suspicious, and right about three things',
    'someone who can hold a grudge through democratic transitions',
    'doing the most while saying you do the least',
    'stalking yourself in old photos at 2am'
  ],
  sagittarius: [
    'someone whose honesty is technically assault',
    'making 4am plans that cost a paycheck',
    'allergic to follow-through and addicted to airport energy',
    'turning every dinner into a TED talk you did not book',
    'optimistic past the point of the evidence',
    'someone whose passport is the personality',
    'starting a religion every six months',
    'committed to being uncommitted',
    'someone who confuses bluntness with bravery',
    'the friend who plans the trip and ditches the deposit'
  ],
  capricorn: [
    'born middle-aged and sharper for it',
    'someone whose fun is scheduled and ROI-positive',
    'a five-year plan with skin',
    'allergic to vulnerability that does not move the org chart',
    'married to the bit, the bit being achievement',
    'someone who treats hobbies as career pivots',
    'capable of making a vacation feel like a deliverable',
    'old soul who is also slightly tired of being told that',
    'climbing something whether or not there is a top',
    'a workaholic in recovery, recovering by working'
  ],
  aquarius: [
    'detached in a way you call evolved',
    'human-shaped concept art',
    'someone who has unique opinions everyone else has too',
    'allergic to small talk and addicted to abstract talk',
    'in a parasocial relationship with your own ideas',
    'a humanitarian who finds individual humans exhausting',
    'someone whose intimacy knob is jammed at 2',
    'rebellious in entirely socially acceptable directions',
    'reinventing the wheel and giving the wheel a podcast',
    'someone whose love languages include sending articles'
  ],
  pisces: [
    'a wet tissue when boundaries are required',
    'someone whose feelings have feelings',
    'drowning beautifully and posting about it',
    'in love with three people fictional',
    'allergic to plans, addicted to dreams',
    'an emotional sponge that doubles as a drama generator',
    'genuinely confused about which timeline this is',
    'someone whose intuition is right and unverifiable',
    'a sensitive soul with a strong taste for chaos',
    'the human equivalent of a sad playlist that hits'
  ]
};

export const TRAITS_ANIMAL = {
  rat: [
    'calculating socially the way poker rooms calculate',
    'hoarding takeout menus and intel',
    'charming on the surface, scheming on the spreadsheet',
    'someone who networks at funerals',
    'three steps ahead and counting receipts',
    'a survivor with strong opinions on cheese',
    'making allies you do not know about yet'
  ],
  ox: [
    'set to glacier on the urgency dial',
    'capable of grudging across four presidential terms',
    'a human bulldozer in slow gear',
    'a one-person freight train, weather permitting',
    'someone whose stubborn is technically a personality disorder',
    'reliable in the way concrete is reliable',
    'capable of outlasting the entire conversation point'
  ],
  tiger: [
    'an impulse with a nervous system attached',
    'someone whose calm is loading',
    'all teeth, no plan, somehow it works',
    'walking around with the energy of a slammed door',
    'the dramatic friend, the brave friend, the loud friend, all you',
    'someone who thinks competence and volume are the same thing',
    'genuinely unsure why people are scared of you'
  ],
  rabbit: [
    'someone whose conflict tolerance is rabbit-shaped',
    'disappearing diplomatically in three languages',
    'a refined panic, beautifully decorated',
    'making everyone tea and resenting them quietly',
    'someone who has standards and a back exit',
    'sensitive to vibes you did not even send',
    'allergic to chaos and weirdly drawn to it'
  ],
  dragon: [
    'staging your own myth from inside the myth',
    'humility tour, party of zero',
    'genuinely confused why everyone is not obsessed',
    'someone whose entrance has its own physics',
    'an entire weather system with hair',
    'allergic to subtlety, allergic to being ignored',
    'directing the room without being elected'
  ],
  snake: [
    'observing a six-month period before saying hi',
    'someone who plans the conversation before having it',
    'hot, quiet, and slightly threatening',
    'a strategist with snacks',
    'capable of keeping one secret for a decade and another for life',
    'looking like you know something and you do',
    'patient in a way that should worry your competitors'
  ],
  horse: [
    'forty open browser tabs in human form',
    'someone whose attention span is a vibe',
    'in love with motion, allergic to arrival',
    'a galloping plan that ends at a wall',
    'someone whose freedom is non-negotiable and inconvenient',
    'restless in any chair longer than 12 minutes',
    'starting six things, finishing none, calling it growth'
  ],
  goat: [
    'aesthetics first, ethics negotiable',
    'someone who will rearrange the room before paying rent',
    'capable of sulking in eight visible directions',
    'a poet about your problems, vague about solutions',
    'someone whose moods come with weather warnings',
    'demanding peace while creating drama',
    'in a long-term relationship with the soft life'
  ],
  monkey: [
    'a scheme inside a scheme inside a TikTok',
    'someone whose patience is a meme',
    'making a plan and laughing at it simultaneously',
    'capable of talking your way into and out of the same building',
    'too clever to be wise, too funny to be ignored',
    'turning crisis into content in real time',
    'allergic to consequences and good at choreography'
  ],
  rooster: [
    'someone who checks the mirror like it owes you something',
    'an unsolicited critique loaded and ready',
    'allergic to being underdressed and overlooked',
    'organizing chaos and calling it leadership',
    'a perfectionist who is loud about it',
    'capable of being right and unbearable in the same sentence',
    'someone whose confidence does not require a permit'
  ],
  dog: [
    'morality patrol, badge optional',
    'someone whose loyalty is a contract you did not sign',
    'a trust audit with feelings',
    'capable of forgiving slowly and remembering forever',
    'a guard dog of other people peace',
    'allergic to injustice, addicted to lecturing',
    'someone whose worry is a love language nobody asked for'
  ],
  pig: [
    'someone whose moderation is a rumor',
    'committed to the bit, the bit being comfort',
    'a peacekeeper who will fight for the dessert',
    'kind, lazy, generous, slightly flammable',
    'a buffet personality with a velvet rope',
    'allergic to drama, addicted to long meals',
    'genuinely good and slightly suspicious of why'
  ]
};

export const TRAITS_LP = {
  1: [
    'alone but in charge of it',
    'leading a confused parade by choice',
    'allergic to instructions',
    'a ceo of vibes',
    'a one-person trend, possibly your own',
    'first or sulking'
  ],
  2: [
    'asserting in murmurs',
    'taking 14 emotional readings before saying hi',
    'a peacemaker who keeps score',
    'sensitive to footsteps two rooms away',
    'someone whose spine is loading',
    'partnered up by default, even at the dentist'
  ],
  3: [
    'capable of talking to a ceiling fan for an hour',
    'a scattered showrunner of your own life',
    'someone whose follow-through is mostly rumor',
    'making everything a bit',
    'creative, distracted, and one cup of coffee from a podcast',
    'allergic to silence, addicted to applause'
  ],
  4: [
    'spreadsheet first, marriage proposal second',
    'spontaneity scheduled in advance',
    'someone whose plan B has a plan B',
    'the foundation of any group, also the killjoy',
    'capable of folding fitted sheets and emotions',
    'married to a system, possibly literally'
  ],
  5: [
    'commitment span of a vine',
    'changing cities to avoid changing yourself',
    'allergic to routine and addicted to airports',
    'a freedom fighter against your own calendar',
    'starting things to feel alive, finishing things to feel adult',
    'someone whose home is a rotating set of zip codes'
  ],
  6: [
    'a mom-friend with a fee structure',
    'a savior with grievances',
    'capable of fixing everyone except you-know-who',
    'home is a project you are running',
    'a counselor, paid in resentment',
    'someone whose love language is unsolicited fixing'
  ],
  7: [
    'small-talk allergic, big-question fluent',
    'analyzing this conversation in your head',
    'a lone wolf with library cards',
    'allergic to surface, suspicious of depth',
    'someone whose silence is loud',
    'married to your own thoughts'
  ],
  8: [
    'a ceo posture in a Trader Joe\'s',
    'feelings priced and itemized',
    'allergic to losing, addicted to optics',
    'a strategist for whom rest is a tactic',
    'capable of monetizing your own breakdown',
    'someone whose hobbies have invoices'
  ],
  9: [
    'a savior complex with a paid plan',
    'lecturing about ego while building yours',
    'a humanitarian whose patience is theoretical',
    'someone whose closure is a multi-step process',
    'attached to letting go',
    'older than your age and tired of being told'
  ],
  11: [
    'a mystic with anxiety',
    'astral-projecting to avoid eye contact',
    'feeling everyone mood in a four-block radius',
    'a visionary who has not slept',
    'someone whose intuition is correct and unprovable',
    'tuned to frequencies that do not pay'
  ],
  22: [
    'building an empire while overthinking the doorknob',
    'capable of architecture and apologizing for it',
    'a master builder of half-built things',
    'someone whose vision exceeds your spreadsheet, barely',
    'designed to ship, distracted by depth',
    'allergic to small wins and addicted to scope'
  ],
  33: [
    'adopted three strangers this month',
    'a savior complex but slightly accurate',
    'a counselor in a body, refunds unavailable',
    'capable of holding everyone mood at once and resenting it',
    'someone whose love is a public utility',
    'tired in a way that sounds spiritual'
  ]
};
