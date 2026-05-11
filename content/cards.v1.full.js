// 8ball / content / cards.v1.js
// Specimen-card content. One card per (sunSign, animal) pair.
//
// Schema:
//   { name, type, habit, note, catalog }
//   note is { low, mid, high } — three life-path-bracket-keyed variants.
//   The engine resolves note against profile.lifePath via resolveBracket().
//
// Bracket map (DOCTRINE §1, brief Phase-2F-1):
//   low:  LP ∈ {1, 2, 3}
//   mid:  LP ∈ {4, 5, 6}
//   high: LP ∈ {7, 8, 9, 11, 22, 33}
//
// Authoring rules (DOCTRINE §4):
//   • No slurs. No medical/diagnostic framing (including ironic adoption).
//   • Cultural-symbol respect when drawing from any tradition.
//   • Voice register is declarative-observational, materialistic.
//     `BANNED_VOICE_REGISTER` scan in tests/profile.test.js enforces §2.
//   • Universal floor — cards land equally on a person who picked their own DOB.
//   • Versioned, not edited. Shipped batches are immutable; new release = new file.
//
// Phase-2F-1 shipped Aries × 12 animals (catalog i–xii).
// Phase-2F-2 lands the remaining 132 cards (catalog xiii–cxliv) across 11 sun rows.

export const CARDS = {
  aries: {
    rat: {
      name: 'the receipt runner',
      type: 'operator · fast ledger',
      habit: 'collects openings, allies, and exits before the room catches up.',
      note: {
        low:  'starts conversations like small raids and leaves with three useful names.',
        mid:  'turns movement into leverage, then files the proof where nobody checks.',
        high: 'studies the room at sprint pace and spends charm like working capital.'
      },
      catalog: 'i'
    },
    ox: {
      name: 'the brick charge',
      type: 'freight engine · locked jaw',
      habit: 'moves slowly until opposed, then becomes the whole road.',
      note: {
        low:  'begins with blunt force and learns that patience can also make noise.',
        mid:  'builds momentum into duty and treats delay as a personal insult.',
        high: 'plans by outlasting resistance, then calls the result common sense.'
      },
      catalog: 'ii'
    },
    tiger: {
      name: 'the lit fuse',
      type: 'brave animal · poor brakes',
      habit: 'enters first, explains later, and somehow improves the odds.',
      note: {
        low:  'speaks before the room settles and makes hesitation look decorative.',
        mid:  'turns pressure into action, then argues with the cleanup schedule.',
        high: 'studies risk only after touching it and calls this field research.'
      },
      catalog: 'iii'
    },
    rabbit: {
      name: 'the velvet alarm',
      type: 'escape artist · sharp manners',
      habit: 'keeps peace beautifully while memorizing every possible exit.',
      note: {
        low:  'arrives bright, reads danger quickly, and smiles with one foot gone.',
        mid:  'repairs disarray with taste, speed, and a private list of offenders.',
        high: 'analyzes discomfort early and designs retreat before anyone names the problem.'
      },
      catalog: 'iv'
    },
    dragon: {
      name: 'the entrance machine',
      type: 'director · visible weather',
      habit: 'takes the room personally and improves its lighting by force.',
      note: {
        low:  'appears loudly enough that attention feels less requested than assigned.',
        mid:  'turns spectacle into procedure and expects maintenance to admire the blueprint.',
        high: 'studies impact as architecture and treats timing like a private department.'
      },
      catalog: 'v'
    },
    snake: {
      name: 'the warm blade',
      type: 'strategist · quick strike',
      habit: 'waits longer than expected, then moves faster than explained.',
      note: {
        low:  'starts quietly, then cuts into the moment with unnerving precision.',
        mid:  'builds advantage through restraint and spends action only when profitable.',
        high: 'keeps the full plan internal until the room has already entered it.'
      },
      catalog: 'vi'
    },
    horse: {
      name: 'the open gate',
      type: 'runner · unfinished map',
      habit: 'leaves early, returns loud, and calls the detour necessary.',
      note: {
        low:  'begins in motion and treats stillness like a clerical error.',
        mid:  'builds plans with wheels attached, then argues with the destination.',
        high: 'studies escape routes as strategy and mistakes arrival for reduced options.'
      },
      catalog: 'vii'
    },
    goat: {
      name: 'the soft riot',
      type: 'aesthete · flammable mood',
      habit: 'demands calm while rearranging the furniture during the argument.',
      note: {
        low:  'enters expressively, improves the scene, and complicates the peace.',
        mid:  'builds comfort like infrastructure, then resents every ugly compromise required.',
        high: 'turns preference into doctrine and studies discomfort from excellent upholstery.'
      },
      catalog: 'viii'
    },
    monkey: {
      name: 'the laughing lever',
      type: 'trick mechanic · loose screws',
      habit: 'improvises trouble, solves half of it, and monetizes the rest.',
      note: {
        low:  'starts the bit before the plan and sells both with speed.',
        mid:  'turns chaos into workflow, then edits the workflow during escape.',
        high: 'studies systems for weak hinges and calls mischief applied intelligence.'
      },
      catalog: 'ix'
    },
    rooster: {
      name: 'the brass index',
      type: 'foreman · polished beak',
      habit: 'corrects the room aloud and assumes gratitude is delayed.',
      note: {
        low:  'announces presence with polish, volume, and a suspiciously prepared opinion.',
        mid:  'builds order through critique and mistakes correction for public service.',
        high: 'studies rank, timing, and presentation until confidence has paperwork.'
      },
      catalog: 'x'
    },
    dog: {
      name: 'the siren loyalist',
      type: 'guard · moral teeth',
      habit: 'spots unfairness quickly and barks before checking the leash.',
      note: {
        low:  'rushes toward trouble with a speech already forming in the mouth.',
        mid:  'builds loyalty into policy and patrols every breach like infrastructure.',
        high: 'studies trust as a system and keeps old evidence indexed.'
      },
      catalog: 'xi'
    },
    pig: {
      name: 'the velvet spark',
      type: 'host · appetite forward',
      habit: 'keeps things pleasant until pleasure itself requires enforcement.',
      note: {
        low:  'starts with warmth, excess, and an immediate claim on the dessert.',
        mid:  'builds comfort generously, then defends it with surprising force.',
        high: 'studies ease as strategy and knows exactly when indulgence becomes leverage.'
      },
      catalog: 'xii'
    }
  },

  taurus: {
    rat: {
      name: 'the pantry ledger',
      type: 'operator · stored advantage',
      habit: 'collects comforts, contacts, and backup plans in labeled silence.',
      note: {
        low:  'starts slowly, smiles warmly, and leaves with the useful corner secured.',
        mid:  'builds leverage through repetition, favors, and snacks nobody remembers funding.',
        high: 'treats security like inventory and charm like a locked cabinet.'
      },
      catalog: 'xiii'
    },
    ox: {
      name: 'the stone engine',
      type: 'freight animal · fixed route',
      habit: 'moves at one speed and makes impatience look poorly constructed.',
      note: {
        low:  'begins with quiet weight and refuses to perform urgency for spectators.',
        mid:  'builds routine into a wall and calls pressure bad planning.',
        high: 'measures time in load-bearing habits and outlives the argument politely.'
      },
      catalog: 'xiv'
    },
    tiger: {
      name: 'the velvet shove',
      type: 'force · padded claws',
      habit: 'waits until comfort is threatened, then becomes suddenly expensive.',
      note: {
        low:  'starts pleasant, then turns sharp when appetite meets obstruction.',
        mid:  'builds calm around ownership and defends the furniture like territory.',
        high: 'reads provocation through cost, comfort, and the risk of moving first.'
      },
      catalog: 'xv'
    },
    rabbit: {
      name: 'the linen exit',
      type: 'keeper · soft perimeter',
      habit: 'keeps the room tasteful while tracking every route out.',
      note: {
        low:  'arrives gently, notices disruption early, and leaves before ugliness spreads.',
        mid:  'builds peace through arrangement, meals, and selective nonresponse.',
        high: 'catalogs discomfort by texture and withdraws before anyone calls it strategy.'
      },
      catalog: 'xvi'
    },
    dragon: {
      name: 'the private monument',
      type: 'sovereign · upholstered mass',
      habit: 'expects admiration to arrive naturally and preferably seated.',
      note: {
        low:  'appears slowly enough that attention has time to prepare itself.',
        mid:  'builds grandeur out of routine, possessions, and immovable preferences.',
        high: 'handles status like furniture: heavy, visible, and difficult to relocate.'
      },
      catalog: 'xvii'
    },
    snake: {
      name: 'the cellar knife',
      type: 'strategist · patient appetite',
      habit: 'waits beneath the surface until desire has paperwork.',
      note: {
        low:  'starts with stillness, then makes one clean claim on the moment.',
        mid:  'builds advantage through patience, taste, and unadvertised possession.',
        high: 'keeps intention under lock until the room has priced it wrong.'
      },
      catalog: 'xviii'
    },
    horse: {
      name: 'the grazing engine',
      type: 'runner · reluctant roots',
      habit: 'wants freedom, comfort, and a chair available at all times.',
      note: {
        low:  'starts moving, then circles back for the better meal.',
        mid:  'builds motion around reliable pleasures and resents every fixed address.',
        high: 'frames escape through comfort, not distance, and travels with preferences intact.'
      },
      catalog: 'xix'
    },
    goat: {
      name: 'the velvet sulk',
      type: 'aesthete · furnished grievance',
      habit: 'demands softness and makes inconvenience answer for its crimes.',
      note: {
        low:  'enters with taste, mood, and a visible refusal of rough edges.',
        mid:  'builds comfort like a civic project and audits every ugly compromise.',
        high: 'indexes pleasure as order and treats discomfort as evidence of mismanagement.'
      },
      catalog: 'xx'
    },
    monkey: {
      name: 'the snack scheme',
      type: 'trickster · stored treats',
      habit: 'turns laziness into tactics and tactics into better seating.',
      note: {
        low:  'starts the joke slowly, then pockets the useful result.',
        mid:  'builds shortcuts through charm, appetite, and suspicious timing.',
        high: 'runs indulgence like a system and hides calculation inside leisure.'
      },
      catalog: 'xxi'
    },
    rooster: {
      name: 'the polished shelf',
      type: 'inspector · visible standards',
      habit: 'arranges the room correctly and waits for civilization to notice.',
      note: {
        low:  'announces taste through posture, grooming, and controlled disapproval.',
        mid:  'builds order from standards and treats sloppiness as unpaid labor.',
        high: 'reads presentation as infrastructure and keeps reputation dusted.'
      },
      catalog: 'xxii'
    },
    dog: {
      name: 'the locked porch',
      type: 'guardian · stubborn oath',
      habit: 'protects familiar ground and distrusts sudden renovations of trust.',
      note: {
        low:  'starts loyal, stands close, and questions any visitor with momentum.',
        mid:  'builds care into routine and patrols change like a cracked fence.',
        high: 'treats trust as property and remembers who handled the gate badly.'
      },
      catalog: 'xxiii'
    },
    pig: {
      name: 'the butter fort',
      type: 'host · defended comfort',
      habit: 'keeps everyone fed and quietly owns the best chair.',
      note: {
        low:  'starts with warmth, generosity, and a firm opinion about portions.',
        mid:  'builds pleasure into policy and resists scarcity with table manners.',
        high: 'knows ease as leverage and hospitality as a soft form of control.'
      },
      catalog: 'xxiv'
    }
  },

  gemini: {
    rat: {
      name: 'the gossip abacus',
      type: 'operator · moving signal',
      habit: 'collects versions, names, and motives before choosing a position.',
      note: {
        low:  'starts three threads and turns each one into usable social weather.',
        mid:  'builds leverage from updates, contradictions, and quick exits.',
        high: 'calculates rooms through language and prices loyalty by incoming information.'
      },
      catalog: 'xxv'
    },
    ox: {
      name: 'the split plow',
      type: 'worker · double track',
      habit: 'argues with the plan while continuing to execute it.',
      note: {
        low:  'starts in one direction, explains another, and still moves the load.',
        mid:  'builds reliability through repetition while revising the reason aloud.',
        high: 'treats certainty as equipment and keeps a spare explanation nearby.'
      },
      catalog: 'xxvi'
    },
    tiger: {
      name: 'the loud switch',
      type: 'impulse · verbal teeth',
      habit: 'pounces on the idea before checking which side owns it.',
      note: {
        low:  'starts fast, speaks sharper, and makes silence look underqualified.',
        mid:  'builds action from argument and changes lanes mid-charge.',
        high: 'reads risk through rhetoric and confuses speed with proof when excited.'
      },
      catalog: 'xxvii'
    },
    rabbit: {
      name: 'the polite static',
      type: 'escape artist · social antenna',
      habit: 'smiles through conflict while opening six conversational side doors.',
      note: {
        low:  'starts charming, senses tension quickly, and exits through humor.',
        mid:  'builds peace with phrasing, timing, and strategic vagueness.',
        high: 'maps discomfort by tone and disappears before the room becomes literal.'
      },
      catalog: 'xxviii'
    },
    dragon: {
      name: 'the headline animal',
      type: 'mythmaker · live broadcast',
      habit: 'turns every entrance into a story with disputed sources.',
      note: {
        low:  'arrives as news, edits the headline, and quotes itself first.',
        mid:  'builds spectacle from language and expects facts to keep pace.',
        high: 'frames attention as circulation and reputation as a moving publication.'
      },
      catalog: 'xxix'
    },
    snake: {
      name: 'the coded smile',
      type: 'strategist · verbal lock',
      habit: 'says enough to steer the room and not enough to be caught.',
      note: {
        low:  'starts lightly, then places one sentence where it cannot be ignored.',
        mid:  'builds advantage through phrasing, pauses, and selective disclosure.',
        high: 'handles conversation like a cabinet with false backs.'
      },
      catalog: 'xxx'
    },
    horse: {
      name: 'the loose itinerary',
      type: 'runner · open tab',
      habit: 'moves through options faster than commitment can get dressed.',
      note: {
        low:  'starts anywhere, speaks everywhere, and calls the detour useful.',
        mid:  'builds motion from curiosity and abandons maps with confidence.',
        high: 'treats arrival as reduced vocabulary and keeps escape conversational.'
      },
      catalog: 'xxxi'
    },
    goat: {
      name: 'the decorative tangent',
      type: 'aesthete · roaming mood',
      habit: 'turns preference into weather and weather into a monologue.',
      note: {
        low:  'enters expressive, changes tone, and makes taste sound urgent.',
        mid:  'builds comfort through talk, rearrangement, and negotiable memory.',
        high: 'indexes mood through language and lets beauty interrupt the facts.'
      },
      catalog: 'xxxii'
    },
    monkey: {
      name: 'the tab juggler',
      type: 'trickster · quick mouth',
      habit: 'opens trouble, renames it, and sells the renamed version.',
      note: {
        low:  'starts the bit, changes the bit, and outruns the receipt.',
        mid:  'builds escape routes from jokes, edits, and technicalities.',
        high: 'runs chaos through language until blame loses the thread.'
      },
      catalog: 'xxxiii'
    },
    rooster: {
      name: 'the speaking mirror',
      type: 'critic · polished noise',
      habit: 'corrects the phrasing first and the person second.',
      note: {
        low:  'announces certainty in clean sentences and adjustable evidence.',
        mid:  'builds order through wording, timing, and public calibration.',
        high: 'reads status through articulation and keeps confidence grammatically dressed.'
      },
      catalog: 'xxxiv'
    },
    dog: {
      name: 'the anxious witness',
      type: 'guard · verbal oath',
      habit: 'audits trust through tone and remembers the exact wording.',
      note: {
        low:  'starts protective, asks three questions, and hears the fourth answer.',
        mid:  'builds loyalty from conversation and prosecutes every inconsistency.',
        high: 'treats language as evidence and files betrayal under quotation marks.'
      },
      catalog: 'xxxv'
    },
    pig: {
      name: 'the buffet narrator',
      type: 'host · generous chatter',
      habit: 'keeps the table warm and the story moving.',
      note: {
        low:  'starts friendly, overexplains the menu, and feeds the whole room.',
        mid:  'builds ease through humor, abundance, and flexible accounting.',
        high: 'knows pleasure travels better when given a voice and a refill.'
      },
      catalog: 'xxxvi'
    }
  },

  cancer: {
    rat: {
      name: 'the memory broker',
      type: 'operator · sentimental ledger',
      habit: 'stores favors, birthdays, injuries, and exits in the same drawer.',
      note: {
        low:  'starts warm, notices need, and leaves with emotional inventory.',
        mid:  'builds safety through care, records, and quiet social debt.',
        high: 'treats memory like capital and affection like a guarded archive.'
      },
      catalog: 'xxxvii'
    },
    ox: {
      name: 'the harbor wall',
      type: 'guardian · slow concrete',
      habit: 'absorbs impact, remembers it, and calls the wall love.',
      note: {
        low:  'starts soft, holds ground, and refuses to rush repair.',
        mid:  'builds protection through routine and endurance that can turn heavy.',
        high: 'reads loyalty by duration and trusts what survives weather.'
      },
      catalog: 'xxxviii'
    },
    tiger: {
      name: 'the wet roar',
      type: 'defender · feeling teeth',
      habit: 'protects first, explains emotionally, and apologizes unevenly later.',
      note: {
        low:  'starts from feeling and makes danger answer immediately.',
        mid:  'builds care into defense and argues with every cleanup bill.',
        high: 'handles fear as data but still lets it choose the volume.'
      },
      catalog: 'xxxix'
    },
    rabbit: {
      name: 'the teacup bunker',
      type: 'keeper · delicate fort',
      habit: 'makes comfort beautifully and resents anyone who dents it.',
      note: {
        low:  'starts gently, reads the room, and hides behind excellent manners.',
        mid:  'builds peace with food, fabric, and careful disappearance.',
        high: 'catalogs safety by softness and exits before need becomes exposure.'
      },
      catalog: 'xl'
    },
    dragon: {
      name: 'the family weather',
      type: 'sovereign · ancestral room',
      habit: 'makes belonging dramatic and drama feel like inheritance.',
      note: {
        low:  'arrives with feeling large enough to rearrange the house.',
        mid:  'builds loyalty into theatre and expects care to applaud.',
        high: 'frames memory as lineage and influence as a furnished room.'
      },
      catalog: 'xli'
    },
    snake: {
      name: 'the locked tide',
      type: 'strategist · private feeling',
      habit: 'keeps emotion below the surface until the timing turns sharp.',
      note: {
        low:  'starts quiet, feels everything, and releases one precise sentence.',
        mid:  'builds protection through concealment, patience, and exact recall.',
        high: 'keeps hurt encrypted until leverage and clarity share a door.'
      },
      catalog: 'xlii'
    },
    horse: {
      name: 'the homesick runner',
      type: 'runner · returning tide',
      habit: 'leaves for air, then misses the room it escaped.',
      note: {
        low:  'starts moving, carries the feeling, and calls back from the road.',
        mid:  'builds freedom around attachment and resents both equally.',
        high: 'treats distance as relief until memory starts charging rent.'
      },
      catalog: 'xliii'
    },
    goat: {
      name: 'the rainy parlor',
      type: 'aesthete · moody shelter',
      habit: 'turns sadness into decor and decor into a boundary.',
      note: {
        low:  'enters soft, changes the lighting, and makes feeling visible.',
        mid:  'builds comfort from mood and expects care to notice details.',
        high: 'reads atmosphere like evidence and lets beauty protect the wound.'
      },
      catalog: 'xliv'
    },
    monkey: {
      name: 'the crying trick',
      type: 'trickster · tender mischief',
      habit: 'jokes around the wound until everyone forgets where it started.',
      note: {
        low:  'starts funny, swerves tender, and steals control from awkwardness.',
        mid:  'builds escape through humor while keeping one hand on the hurt.',
        high: 'handles pain sideways and turns vulnerability into choreography.'
      },
      catalog: 'xlv'
    },
    rooster: {
      name: 'the spotless grudge',
      type: 'inspector · domestic blade',
      habit: 'keeps the house correct and the old complaint polished.',
      note: {
        low:  'announces care through standards and hears neglect in small messes.',
        mid:  'builds order as love and correction as household maintenance.',
        high: 'reads devotion through details and keeps resentment neatly folded.'
      },
      catalog: 'xlvi'
    },
    dog: {
      name: 'the porch witness',
      type: 'guard · faithful memory',
      habit: 'protects the vulnerable and remembers who made protection necessary.',
      note: {
        low:  'starts close, worries early, and defends before being asked.',
        mid:  'builds loyalty from care and patrols every emotional breach.',
        high: 'treats trust as shelter and keeps old weather reports.'
      },
      catalog: 'xlvii'
    },
    pig: {
      name: 'the soup treaty',
      type: 'host · soft abundance',
      habit: 'feeds conflict until it forgets what it came for.',
      note: {
        low:  'starts with warmth, servings, and a suspiciously full bowl.',
        mid:  'builds peace through comfort and defends it with kitchen force.',
        high: 'knows appetite can soften rooms before truth enters them.'
      },
      catalog: 'xlviii'
    }
  },

  leo: {
    rat: {
      name: 'the backstage broker',
      type: 'operator · bright ledger',
      habit: 'collects applause routes before deciding where to stand.',
      note: {
        low:  'starts visibly, charms quickly, and remembers who clapped first.',
        mid:  'builds influence through favors, timing, and curated generosity.',
        high: 'treats attention as currency and keeps the exchange rate private.'
      },
      catalog: 'xlix'
    },
    ox: {
      name: 'the crowned plow',
      type: 'worker · royal patience',
      habit: 'carries the load like duty and expects a decent procession.',
      note: {
        low:  'starts proud, moves steady, and refuses to look hurried.',
        mid:  'builds authority through endurance and calls praise basic maintenance.',
        high: 'reads rank through stamina and makes labor look hereditary.'
      },
      catalog: 'l'
    },
    tiger: {
      name: 'the parade bite',
      type: 'brave animal · spotlight teeth',
      habit: 'leaps first and turns the landing into public evidence.',
      note: {
        low:  'starts loud, risks openly, and waits for the room to register it.',
        mid:  'builds courage into spectacle and argues with restraint on principle.',
        high: 'frames danger as stagecraft and competence as a visible animal.'
      },
      catalog: 'li'
    },
    rabbit: {
      name: 'the golden exit',
      type: 'escape artist · dressed nerves',
      habit: 'needs admiration but keeps a graceful route away from embarrassment.',
      note: {
        low:  'arrives bright, reads judgment fast, and smiles toward the door.',
        mid:  'builds charm through polish and avoids scenes that cheapen the costume.',
        high: 'indexes dignity by audience temperature and retreats before the crown slips.'
      },
      catalog: 'lii'
    },
    dragon: {
      name: 'the myth furnace',
      type: 'mythmaker · royal heat',
      habit: 'turns self-image into climate and expects witnesses to adapt.',
      note: {
        low:  'appears like a story already convinced of its ending.',
        mid:  'builds legend from style, appetite, and repeated public proof.',
        high: 'handles identity as theatre with accounting, lighting, and succession plans.'
      },
      catalog: 'liii'
    },
    snake: {
      name: 'the velvet command',
      type: 'strategist · warm crown',
      habit: 'withholds approval until the room starts working for it.',
      note: {
        low:  'starts smooth, waits behind the smile, and claims the decisive inch.',
        mid:  'builds influence through restraint and lets desire do the advertising.',
        high: 'reads admiration as leverage and keeps the real appetite composed.'
      },
      catalog: 'liv'
    },
    horse: {
      name: 'the runaway banner',
      type: 'runner · public flame',
      habit: 'leaves dramatically and hopes the exit has good sightlines.',
      note: {
        low:  'starts in motion and makes departure look like a premiere.',
        mid:  'builds freedom into identity and resents any unglamorous tether.',
        high: 'treats escape as branding and arrival as a publicity risk.'
      },
      catalog: 'lv'
    },
    goat: {
      name: 'the velvet demand',
      type: 'aesthete · golden mood',
      habit: 'requires beauty, praise, and softer conditions for every feeling.',
      note: {
        low:  'enters expressive, improves the room, and expects visible appreciation.',
        mid:  'builds comfort theatrically and sulks when compromise looks cheap.',
        high: 'reads taste as sovereignty and mood as a decorated command.'
      },
      catalog: 'lvi'
    },
    monkey: {
      name: 'the spotlight racket',
      type: 'trickster · stage hands',
      habit: 'turns mischief into performance and performance into plausible innocence.',
      note: {
        low:  'starts the bit loudly and sells the accident as design.',
        mid:  'builds escape through charm, timing, and a better punchline.',
        high: 'runs attention like machinery and hides the lever inside applause.'
      },
      catalog: 'lvii'
    },
    rooster: {
      name: 'the rehearsal knife',
      type: 'performer · exact polish',
      habit: 'disciplines the image until confidence looks freshly tailored.',
      note: {
        low:  'announces presence through finish, posture, and a sharpened entrance.',
        mid:  'builds showmanship through correction and treats polish as public duty.',
        high: 'reads performance as architecture and keeps vanity on a schedule.'
      },
      catalog: 'lviii'
    },
    dog: {
      name: 'the loyal banner',
      type: 'guard · dramatic oath',
      habit: 'defends chosen people loudly and expects loyalty to have witnesses.',
      note: {
        low:  'starts protective, speaks grandly, and makes fairness visible.',
        mid:  'builds loyalty into honor code and patrols disrespect with volume.',
        high: 'treats trust as a banner and remembers who stood beneath it.'
      },
      catalog: 'lix'
    },
    pig: {
      name: 'the banquet sun',
      type: 'host · generous crown',
      habit: 'feeds the room lavishly and accepts affection as table service.',
      note: {
        low:  'starts warm, excessive, and beautifully difficult to ignore.',
        mid:  'builds pleasure into ceremony and defends abundance like pride.',
        high: 'knows generosity can govern a room without sounding like command.'
      },
      catalog: 'lx'
    }
  },

  virgo: {
    rat: {
      name: 'the margin broker',
      type: 'operator · clean ledger',
      habit: 'finds the flaw, the angle, and the exit receipt.',
      note: {
        low:  'starts by noticing what everyone missed and saying it neatly.',
        mid:  'builds leverage through records, fixes, and useful small corrections.',
        high: 'treats detail as currency and keeps advantage properly labeled.'
      },
      catalog: 'lxi'
    },
    ox: {
      name: 'the careful load',
      type: 'worker · corrected mass',
      habit: 'carries responsibility while improving the method under protest.',
      note: {
        low:  'starts with a task and immediately finds its weaker hinge.',
        mid:  'builds reliability through procedure and distrusts inspirational shortcuts.',
        high: 'reads endurance as maintenance and measures love by completed repairs.'
      },
      catalog: 'lxii'
    },
    tiger: {
      name: 'the sharpened alarm',
      type: 'force · nervous precision',
      habit: 'attacks the problem because waiting would be structurally irresponsible.',
      note: {
        low:  'starts fast, points at the flaw, and makes hesitation sloppy.',
        mid:  'builds action from urgency and argues with the cleanup notes.',
        high: 'handles risk by naming defects before courage can exaggerate itself.'
      },
      catalog: 'lxiii'
    },
    rabbit: {
      name: 'the folded escape',
      type: 'keeper · anxious order',
      habit: 'makes the room gentle, correct, and easy to leave.',
      note: {
        low:  'starts polite, notices friction, and organizes a graceful disappearance.',
        mid:  'builds peace through small repairs and quiet standards.',
        high: 'catalogs discomfort by detail and exits before chaos stains the method.'
      },
      catalog: 'lxiv'
    },
    dragon: {
      name: 'the perfect specimen',
      type: 'director · audited shine',
      habit: 'wants excellence visible, measured, and slightly feared.',
      note: {
        low:  'appears prepared enough that spontaneity looks underdressed and improvisation reads like an apology.',
        mid:  'builds authority from competence and expects admiration to be accurate.',
        high: 'frames greatness through precision and keeps grandeur under inspection.'
      },
      catalog: 'lxv'
    },
    snake: {
      name: 'the kept blade',
      type: 'strategist · quiet correction',
      habit: 'waits, observes the weakness, and cuts only the necessary thread.',
      note: {
        low:  'starts quietly, identifies the fault, and speaks with measured economy.',
        mid:  'builds advantage through restraint, records, and exact timing.',
        high: 'handles complexity like a locked drawer with numbered compartments.'
      },
      catalog: 'lxvi'
    },
    horse: {
      name: 'the restless checklist',
      type: 'runner · revised map',
      habit: 'moves quickly while correcting the route in real time.',
      note: {
        low:  'starts in motion and notices every defect along the road.',
        mid:  'builds plans with contingencies and resents destinations that stay vague.',
        high: 'treats freedom as logistics and keeps escape routes properly maintained.'
      },
      catalog: 'lxvii'
    },
    goat: {
      name: 'the curated complaint',
      type: 'aesthete · edited mood',
      habit: 'improves the room while privately itemizing its failures.',
      note: {
        low:  'enters with taste, concern, and a correction already softened.',
        mid:  'builds comfort through refinement and resents avoidable ugliness.',
        high: 'reads atmosphere through defects and makes preference look technical.'
      },
      catalog: 'lxviii'
    },
    monkey: {
      name: 'the clever patch',
      type: 'trick mechanic · tidy scam',
      habit: 'breaks the rule intelligently and documents why it worked.',
      note: {
        low:  'starts with a shortcut and makes the shortcut look inspected.',
        mid:  'builds fixes from improvisation, humor, and suspicious competence.',
        high: 'runs mischief through systems until it qualifies as process improvement.'
      },
      catalog: 'lxix'
    },
    rooster: {
      name: 'the red pen',
      type: 'inspector · public standard',
      habit: 'corrects the mistake before mercy can blur the edges.',
      note: {
        low:  'announces the flaw clearly and polishes the announcement afterward.',
        mid:  'builds order through critique and calls tact a secondary tool.',
        high: 'reads rank through standards and keeps judgment sharpened but filed.'
      },
      catalog: 'lxx'
    },
    dog: {
      name: 'the duty audit',
      type: 'guard · anxious standard',
      habit: 'protects by checking what everyone promised against what arrived.',
      note: {
        low:  'starts worried, loyal, and already reviewing the terms.',
        mid:  'builds care through follow-up and patrols neglect with documentation.',
        high: 'treats trust as compliance and remembers every failed inspection.'
      },
      catalog: 'lxxi'
    },
    pig: {
      name: 'the clean feast',
      type: 'host · orderly appetite',
      habit: 'makes abundance practical and pleasure slightly better organized.',
      note: {
        low:  'starts warm, useful, and concerned about the serving method.',
        mid:  'builds comfort through systems and defends ease from waste.',
        high: 'knows indulgence works best when the pantry has been audited.'
      },
      catalog: 'lxxii'
    }
  },

  libra: {
    rat: {
      name: 'the charming ledger',
      type: 'operator · balanced favor',
      habit: 'collects options, allies, and exits without wrinkling the smile.',
      note: {
        low:  'starts charming, gathers opinions, and leaves with the social map.',
        mid:  'builds leverage through agreement and delays the cost of choosing.',
        high: 'treats harmony like currency and tracks who owes the room balance.'
      },
      catalog: 'lxxiii'
    },
    ox: {
      name: 'the marble pause',
      type: 'worker · weighted scale',
      habit: 'moves only after every side has become tired of waiting.',
      note: {
        low:  'starts carefully and makes patience look like good breeding.',
        mid:  'builds fairness into routine and resists pressure with polished mass.',
        high: 'reads choice through consequence and lets delay do some negotiation.'
      },
      catalog: 'lxxiv'
    },
    tiger: {
      name: 'the velvet strike',
      type: 'force · social claws',
      habit: 'attacks imbalance while trying not to disturb the centerpiece.',
      note: {
        low:  'starts bold, charming, and offended by visible unfairness.',
        mid:  'builds action from tension and argues with the cleanup etiquette.',
        high: 'frames conflict as design failure and enters only when symmetry breaks.'
      },
      catalog: 'lxxv'
    },
    rabbit: {
      name: 'the porcelain exit',
      type: 'escape artist · graceful scale',
      habit: 'keeps things beautiful and leaves before anyone asks for a position.',
      note: {
        low:  'starts sweet, reads tension, and disappears through good manners.',
        mid:  'builds peace with taste, deflection, and very selective clarity.',
        high: 'maps conflict by social temperature and exits before ugliness becomes contractual.'
      },
      catalog: 'lxxvi'
    },
    dragon: {
      name: 'the mirrored throne',
      type: 'director · social symmetry',
      habit: 'commands by making everyone want the room to look better.',
      note: {
        low:  'appears beautifully and lets admiration settle the seating chart.',
        mid:  'builds influence through style and expects consensus to admire itself.',
        high: 'handles status as composition and moves power through reflected desire.'
      },
      catalog: 'lxxvii'
    },
    snake: {
      name: 'the satin clause',
      type: 'strategist · elegant delay',
      habit: 'says little, balances much, and keeps the real preference wrapped.',
      note: {
        low:  'starts softly, withholds the verdict, and smiles around the trap.',
        mid:  'builds advantage through timing, grace, and undisclosed preference.',
        high: 'treats agreement as architecture and hides leverage inside proportion.'
      },
      catalog: 'lxxviii'
    },
    horse: {
      name: 'the drifting invitation',
      type: 'runner · social weather',
      habit: 'moves between options until commitment loses the address.',
      note: {
        low:  'starts anywhere pleasant and leaves before the choice hardens.',
        mid:  'builds motion through people, plans, and beautifully postponed decisions.',
        high: 'treats freedom as available seating and arrival as reduced charm.'
      },
      catalog: 'lxxix'
    },
    goat: {
      name: 'the pretty stalemate',
      type: 'aesthete · soft tension',
      habit: 'wants peace, beauty, and several incompatible comforts at once.',
      note: {
        low:  'enters lovely, feels the tension, and decorates around it.',
        mid:  'builds comfort through arrangement while postponing the hard sentence.',
        high: 'reads beauty as negotiation and lets preference masquerade as fairness.'
      },
      catalog: 'lxxx'
    },
    monkey: {
      name: 'the charming loophole',
      type: 'trickster · smiling pivot',
      habit: 'talks through the problem and exits through the compliment.',
      note: {
        low:  'starts playful, flatters quickly, and changes the vote mid-laugh.',
        mid:  'builds escape from tact, jokes, and flexible agreements.',
        high: 'runs conflict through charm until accountability misses its appointment.'
      },
      catalog: 'lxxxi'
    },
    rooster: {
      name: 'the polished verdict',
      type: 'inspector · elegant standard',
      habit: 'corrects the imbalance and makes the correction look dressed.',
      note: {
        low:  'announces taste with poise and a prepared objection.',
        mid:  'builds order through standards and calls presentation part of justice.',
        high: 'reads rank through polish and keeps judgment socially acceptable.'
      },
      catalog: 'lxxxii'
    },
    dog: {
      name: 'the fairness leash',
      type: 'guard · balanced oath',
      habit: 'protects the agreement and worries it was unfairly worded.',
      note: {
        low:  'starts loyal, mediates fast, and distrusts anyone enjoying advantage.',
        mid:  'builds care through fairness and patrols every tilted promise.',
        high: 'treats trust as balance and remembers who leaned on the scale.'
      },
      catalog: 'lxxxiii'
    },
    pig: {
      name: 'the dessert treaty',
      type: 'host · pleasant bargain',
      habit: 'keeps peace with generosity and negotiates from the dessert tray.',
      note: {
        low:  'starts warm, agreeable, and very aware of who got seconds.',
        mid:  'builds comfort through sharing and defends pleasure from bad manners.',
        high: 'knows harmony often enters through appetite before principle.'
      },
      catalog: 'lxxxiv'
    }
  },

  scorpio: {
    rat: {
      name: 'the locked receipt',
      type: 'operator · private ledger',
      habit: 'collects secrets, leverage, and exits without changing expression.',
      note: {
        low:  'starts quietly, notices everything, and leaves with the useful shadow.',
        mid:  'builds power through memory, favors, and controlled disclosure.',
        high: 'treats intimacy like intelligence and keeps the archive fireproof.'
      },
      catalog: 'lxxxv'
    },
    ox: {
      name: 'the buried engine',
      type: 'freight animal · subterranean will',
      habit: 'moves slowly under pressure and becomes impossible to uproot.',
      note: {
        low:  'starts silent, holds ground, and lets resistance exhaust itself.',
        mid:  'builds endurance from grievance and calls permanence a virtue.',
        high: 'reads power by what survives pressure and what refuses daylight.'
      },
      catalog: 'lxxxvi'
    },
    tiger: {
      name: 'the black flare',
      type: 'force · dangerous pulse',
      habit: 'strikes from feeling and makes intensity look like evidence.',
      note: {
        low:  'starts hot, sees threat quickly, and enters without permission.',
        mid:  'builds action from suspicion and argues with any leash offered.',
        high: 'handles risk through appetite, memory, and a private threat model.'
      },
      catalog: 'lxxxvii'
    },
    rabbit: {
      name: 'the velvet trapdoor',
      type: 'escape artist · hidden nerve',
      habit: 'looks delicate while keeping a second room underneath the first.',
      note: {
        low:  'starts soft, reads danger, and vanishes with the evidence.',
        mid:  'builds safety through manners, silence, and unshared conclusions.',
        high: 'maps discomfort below the floorboards and exits through concealed design.'
      },
      catalog: 'lxxxviii'
    },
    dragon: {
      name: 'the dark gravity',
      type: 'magnet · withheld crown',
      habit: 'pulls attention by refusing to explain what it wants.',
      note: {
        low:  'appears contained and makes curiosity do the noisy work.',
        mid:  'builds influence through restraint, heat, and unanswered questions.',
        high: 'treats visibility as bait and power as controlled absence.'
      },
      catalog: 'lxxxix'
    },
    snake: {
      name: 'the sealed blade',
      type: 'strategist · deep lock',
      habit: 'keeps the plan so private even the pause has a password.',
      note: {
        low:  'starts still, waits long, and cuts exactly once.',
        mid:  'builds advantage through secrecy and lets patience sharpen the room.',
        high: 'handles desire as classified material with a long retention policy.'
      },
      catalog: 'xc'
    },
    horse: {
      name: 'the midnight runner',
      type: 'runner · haunted map',
      habit: 'leaves suddenly but keeps returning to the charged place.',
      note: {
        low:  'starts in motion, escapes heat, and carries the heat along.',
        mid:  'builds freedom from rupture and resents any simple destination.',
        high: 'treats distance as control until obsession shortens the road.'
      },
      catalog: 'xci'
    },
    goat: {
      name: 'the velvet storm',
      type: 'aesthete · black weather',
      habit: 'turns mood into decor and decor into a warning system.',
      note: {
        low:  'enters beautifully, feels deeply, and makes calm slightly unsafe.',
        mid:  'builds comfort around intensity and resents shallow peace.',
        high: 'reads beauty as concealment and mood as a private jurisdiction.'
      },
      catalog: 'xcii'
    },
    monkey: {
      name: 'the knife joke',
      type: 'trickster · dangerous timing',
      habit: 'makes the room laugh while moving the sharp object.',
      note: {
        low:  'starts funny, watches reactions, and hides the serious part.',
        mid:  'builds escape through wit, pressure, and perfect misdirection.',
        high: 'runs mischief through secrecy until laughter becomes cover.'
      },
      catalog: 'xciii'
    },
    rooster: {
      name: 'the narrow verdict',
      type: 'inspector · cold precision',
      habit: 'finds the weak point and names it without decoration.',
      note: {
        low:  'announces the flaw plainly and lets the room bleed quietly.',
        mid:  'builds order through exact judgment and controlled severity.',
        high: 'reads presentation for fractures and keeps correction narrow, deep, final.'
      },
      catalog: 'xciv'
    },
    dog: {
      name: 'the black oath',
      type: 'guard · forensic loyalty',
      habit: 'protects fiercely and remembers every breach by scent and date.',
      note: {
        low:  'starts loyal, suspects quickly, and stands too close to danger.',
        mid:  'builds trust through tests and patrols betrayal like a perimeter.',
        high: 'treats loyalty as evidence and keeps old wounds cross-referenced.'
      },
      catalog: 'xcv'
    },
    pig: {
      name: 'the velvet appetite',
      type: 'host · hidden hunger',
      habit: 'keeps things pleasant while wanting more than the table shows.',
      note: {
        low:  'starts warm, indulges deeply, and notices who reaches first.',
        mid:  'builds comfort around desire and defends pleasure with quiet force.',
        high: 'knows appetite can conceal strategy better than restraint can.'
      },
      catalog: 'xcvi'
    }
  },

  sagittarius: {
    rat: {
      name: 'the travel broker',
      type: 'operator · moving odds',
      habit: 'collects exits, theories, and useful strangers in transit.',
      note: {
        low:  'starts a conversation anywhere and leaves with a cheaper route.',
        mid:  'builds leverage through movement, stories, and accidental alliances.',
        high: 'treats distance as information and charm as portable currency.'
      },
      catalog: 'xcvii'
    },
    ox: {
      name: 'the stubborn compass',
      type: 'freight animal · fixed horizon',
      habit: 'moves slowly toward a huge idea and refuses smaller maps.',
      note: {
        low:  'starts blunt, points outward, and ignores warnings with dignity.',
        mid:  'builds momentum through belief and resents practical ceilings.',
        high: 'reads commitment as direction and makes conviction carry the load.'
      },
      catalog: 'xcviii'
    },
    tiger: {
      name: 'the flaming passport',
      type: 'impulse · open road',
      habit: 'runs toward the risk and calls the bruises education.',
      note: {
        low:  'starts loud, jumps early, and makes caution feel provincial.',
        mid:  'builds action from appetite and negotiates with consequences afterward.',
        high: 'frames danger as coursework and treats survival like a certificate.'
      },
      catalog: 'xcix'
    },
    rabbit: {
      name: 'the polite fugitive',
      type: 'escape artist · distant manners',
      habit: 'leaves the tension kindly and sends a beautiful update later.',
      note: {
        low:  'starts sweet, senses limits, and exits toward wider air.',
        mid:  'builds peace through distance, tact, and selective availability.',
        high: 'maps discomfort as geography and relocates before conflict gets furniture.'
      },
      catalog: 'c'
    },
    dragon: {
      name: 'the road myth',
      type: 'mythmaker · horizon animal',
      habit: 'turns every departure into proof that the story is expanding.',
      note: {
        low:  'appears with a destination and makes staying look unambitious.',
        mid:  'builds legend through distance, excess, and public conviction.',
        high: 'handles identity as a map that keeps demanding larger paper.'
      },
      catalog: 'ci'
    },
    snake: {
      name: 'the quiet expedition',
      type: 'strategist · long route',
      habit: 'plans the escape before admitting it wants out.',
      note: {
        low:  'starts lightly, watches the exits, and chooses the useful road.',
        mid:  'builds advantage through timing, distance, and concealed preparation.',
        high: 'treats freedom as logistics and keeps belief under tactical review.'
      },
      catalog: 'cii'
    },
    horse: {
      name: 'the open horizon',
      type: 'runner · no fence',
      habit: 'moves because stopping would make the questions too local.',
      note: {
        low:  'starts in motion and treats arrival as an administrative problem.',
        mid:  'builds life around departures and argues with every tether.',
        high: 'reads freedom as oxygen and mistakes stillness for shrinking.'
      },
      catalog: 'ciii'
    },
    goat: {
      name: 'the scenic complaint',
      type: 'aesthete · wandering mood',
      habit: 'wants beauty, distance, and better conditions immediately.',
      note: {
        low:  'enters expressive, changes the plan, and calls it expansion.',
        mid:  'builds comfort on the move and resents ugly logistics.',
        high: 'indexes happiness by scenery and treats inconvenience as failed design.'
      },
      catalog: 'civ'
    },
    monkey: {
      name: 'the border trick',
      type: 'trickster · loose itinerary',
      habit: 'turns detours into stories and stories into escape routes.',
      note: {
        low:  'starts the joke abroad and imports the consequences later.',
        mid:  'builds motion from improvisation, shortcuts, and unpaid deposits.',
        high: 'runs freedom through mischief until responsibility loses the trail.'
      },
      catalog: 'cv'
    },
    rooster: {
      name: 'the loud compass',
      type: 'foreman · preached direction',
      habit: 'announces the route and corrects everyone\'s smaller horizon.',
      note: {
        low:  'starts certain, speaks broadly, and dresses opinion as navigation.',
        mid:  'builds order from belief and critiques anyone packing poorly.',
        high: 'reads status through conviction and keeps doctrine polished for travel.'
      },
      catalog: 'cvi'
    },
    dog: {
      name: 'the frontier oath',
      type: 'guard · restless principle',
      habit: 'defends the cause, then needs the cause to keep moving.',
      note: {
        low:  'starts loyal, blunt, and impatient with cowardly nuance.',
        mid:  'builds care around principle and patrols hypocrisy on the road.',
        high: 'treats trust as a campaign and keeps faith moving forward.'
      },
      catalog: 'cvii'
    },
    pig: {
      name: 'the roadside feast',
      type: 'host · wandering appetite',
      habit: 'turns travel into meals and meals into temporary citizenship.',
      note: {
        low:  'starts generous, hungry, and ready to call strangers friends.',
        mid:  'builds comfort wherever it lands and overpacks pleasure.',
        high: 'knows abundance travels best when nobody counts the portions too early.'
      },
      catalog: 'cviii'
    }
  },

  capricorn: {
    rat: {
      name: 'the promotion ledger',
      type: 'operator · rank account',
      habit: 'collects leverage quietly and makes ambition look like responsibility.',
      note: {
        low:  'starts formal, learns the hierarchy, and remembers the useful door.',
        mid:  'builds position through favors, records, and patient advancement.',
        high: 'treats status as infrastructure and charm as controlled expenditure.'
      },
      catalog: 'cix'
    },
    ox: {
      name: 'the granite ladder',
      type: 'freight engine · uphill law',
      habit: 'climbs slowly, complains minimally, and becomes part of the institution.',
      note: {
        low:  'starts serious, takes the weight, and distrusts easy praise.',
        mid:  'builds authority through endurance and makes duty look permanent.',
        high: 'reads time as structure and success as load-bearing proof.'
      },
      catalog: 'cx'
    },
    tiger: {
      name: 'the executive bite',
      type: 'force · disciplined teeth',
      habit: 'moves hard when the objective has a measurable top.',
      note: {
        low:  'starts blunt, wants the win, and treats hesitation as overhead.',
        mid:  'builds pressure into output and argues with any soft process.',
        high: 'handles risk like a budget line with teeth attached.'
      },
      catalog: 'cxi'
    },
    rabbit: {
      name: 'the careful ascent',
      type: 'escape artist · formal nerves',
      habit: 'avoids mess, keeps standards, and climbs through the side door.',
      note: {
        low:  'starts polite, reads exposure, and protects the clean exit.',
        mid:  'builds safety through procedure and quietly refuses bad optics.',
        high: 'maps risk by reputation and leaves before informality becomes liability.'
      },
      catalog: 'cxii'
    },
    dragon: {
      name: 'the dynasty machine',
      type: 'institution · carved ambition',
      habit: 'turns achievement into architecture and architecture into inheritance.',
      note: {
        low:  'appears already appointed and waits for the room to catch up.',
        mid:  'builds authority through systems, symbols, and patient accumulation.',
        high: 'treats legacy as engineering and keeps grandeur on the payroll.'
      },
      catalog: 'cxiii'
    },
    snake: {
      name: 'the boardroom blade',
      type: 'strategist · sealed agenda',
      habit: 'keeps the real plan behind the approved minutes.',
      note: {
        low:  'starts quiet, watches rank, and moves when advantage signs off.',
        mid:  'builds leverage through timing, restraint, and institutional patience.',
        high: 'handles ambition as confidential material with a long calendar.'
      },
      catalog: 'cxiv'
    },
    horse: {
      name: 'the scheduled escape',
      type: 'runner · managed horizon',
      habit: 'wants freedom but puts it on the five-year plan.',
      note: {
        low:  'starts moving, then asks whether motion improves the position.',
        mid:  'builds mobility through credentials and resents unmanaged spontaneity.',
        high: 'treats freedom as an asset class and arrival as a negotiation.'
      },
      catalog: 'cxv'
    },
    goat: {
      name: 'the expensive standard',
      type: 'aesthete · disciplined comfort',
      habit: 'wants softness with receipts and luxury that justifies itself.',
      note: {
        low:  'enters tasteful, controlled, and annoyed by cheap shortcuts.',
        mid:  'builds comfort through work and calls indulgence earned infrastructure.',
        high: 'reads beauty through value and keeps pleasure accountable to rank.'
      },
      catalog: 'cxvi'
    },
    monkey: {
      name: 'the corporate trick',
      type: 'trick mechanic · useful loophole',
      habit: 'finds the shortcut that still looks approved.',
      note: {
        low:  'starts clever, reads the policy, and bends it cleanly.',
        mid:  'builds advantage from loopholes, timing, and plausible diligence.',
        high: 'runs mischief through hierarchy until it resembles strategy.'
      },
      catalog: 'cxvii'
    },
    rooster: {
      name: 'the rank index',
      type: 'inspector · promotion mechanics',
      habit: 'tracks polish, timing, and advancement like weather systems.',
      note: {
        low:  'announces competence through finish and a prepared correction.',
        mid:  'builds order through standards and makes visibility serve advancement.',
        high: 'reads hierarchy by presentation and keeps ambition formatted correctly.'
      },
      catalog: 'cxviii'
    },
    dog: {
      name: 'the policy hound',
      type: 'guard · institutional oath',
      habit: 'protects the rules and worries who benefits when they bend.',
      note: {
        low:  'starts loyal, serious, and suspicious of informal promises.',
        mid:  'builds trust through duty and patrols breaches with procedure.',
        high: 'treats loyalty as governance and keeps old violations on record.'
      },
      catalog: 'cxix'
    },
    pig: {
      name: 'the earned feast',
      type: 'host · disciplined appetite',
      habit: 'enjoys comfort more when it has survived the budget.',
      note: {
        low:  'starts generous after checking the cost and the calendar.',
        mid:  'builds ease through achievement and defends rest like compensation.',
        high: 'knows pleasure is safest when it can explain its invoice.'
      },
      catalog: 'cxx'
    }
  },

  aquarius: {
    rat: {
      name: 'the network ghost',
      type: 'operator · abstract ledger',
      habit: 'collects people as nodes and calls distance a design choice.',
      note: {
        low:  'starts oddly charming and maps the room without joining it.',
        mid:  'builds leverage through networks, ideas, and selective warmth.',
        high: 'treats belonging as infrastructure and intimacy as optional access.'
      },
      catalog: 'cxxi'
    },
    ox: {
      name: 'the fixed theory',
      type: 'worker · stubborn concept',
      habit: 'moves slowly behind an idea and calls resistance unexamined.',
      note: {
        low:  'starts detached, states the principle, and refuses convenient exceptions.',
        mid:  'builds systems through persistence and distrusts emotional shortcuts.',
        high: 'reads consistency as ethics and turns opinion into load-bearing structure.'
      },
      catalog: 'cxxii'
    },
    tiger: {
      name: 'the abstract strike',
      type: 'force · ideological teeth',
      habit: 'attacks the old rule before checking the replacement parts.',
      note: {
        low:  'starts bold, names the system, and breaks the nearest hinge.',
        mid:  'builds action from principle and argues with practical maintenance.',
        high: 'handles risk as proof that the model needed stress-testing.'
      },
      catalog: 'cxxiii'
    },
    rabbit: {
      name: 'the distant teacup',
      type: 'escape artist · cool manners',
      habit: 'keeps peace by becoming politely unavailable to the room.',
      note: {
        low:  'starts kind, senses pressure, and exits into clean abstraction.',
        mid:  'builds safety through distance, tact, and low emotional bandwidth.',
        high: 'maps discomfort through patterns and withdraws before feeling gets specific.'
      },
      catalog: 'cxxiv'
    },
    dragon: {
      name: 'the concept monarch',
      type: 'architect · strange authority',
      habit: 'commands the room by acting like the future has already briefed it.',
      note: {
        low:  'appears unusual enough that attention starts explaining itself.',
        mid:  'builds influence through ideas and expects reality to update.',
        high: 'frames status as prototype and keeps ego dressed as systems design.'
      },
      catalog: 'cxxv'
    },
    snake: {
      name: 'the cold schematic',
      type: 'strategist · quiet circuit',
      habit: 'observes the human problem until it becomes a diagram.',
      note: {
        low:  'starts detached, listens long, and inserts one precise variable.',
        mid:  'builds advantage through distance, timing, and unreadable logic.',
        high: 'treats emotion as data and keeps the model behind glass.'
      },
      catalog: 'cxxvi'
    },
    horse: {
      name: 'the free circuit',
      type: 'runner · open system',
      habit: 'moves wherever the idea has fewer walls.',
      note: {
        low:  'starts restless, talks theory, and leaves before closure forms.',
        mid:  'builds motion through experiments and resents fixed membership.',
        high: 'reads freedom as architecture and treats arrival as system lock.'
      },
      catalog: 'cxxvii'
    },
    goat: {
      name: 'the art committee',
      type: 'aesthete · abstract weather',
      habit: 'wants beauty, distance, and a better social model immediately.',
      note: {
        low:  'enters strange, tasteful, and emotionally adjacent to the room.',
        mid:  'builds comfort through design while resisting ordinary closeness.',
        high: 'indexes mood as pattern and lets preference become theory.'
      },
      catalog: 'cxxviii'
    },
    monkey: {
      name: 'the system prank',
      type: 'trickster · clever circuit',
      habit: 'breaks the model for fun and calls the wreckage research.',
      note: {
        low:  'starts the experiment before consent reaches the room.',
        mid:  'builds escape through jokes, hacks, and elegant misbehavior.',
        high: 'runs mischief as calibration and laughs when the structure confesses.'
      },
      catalog: 'cxxix'
    },
    rooster: {
      name: 'the broadcast standard',
      type: 'inspector · future polish',
      habit: 'corrects the present for failing to match the proposed model.',
      note: {
        low:  'announces the better way with unusual confidence and clean edges.',
        mid:  'builds order from principles and critiques outdated presentation.',
        high: 'reads status through originality and keeps standards pointed forward.'
      },
      catalog: 'cxxx'
    },
    dog: {
      name: 'the principle guard',
      type: 'guard · abstract oath',
      habit: 'defends humanity while needing a break from individual humans.',
      note: {
        low:  'starts loyal to the cause and awkward near the person.',
        mid:  'builds care through rules and patrols unfair systems aloud.',
        high: 'treats trust as architecture and keeps affection at measurable distance.'
      },
      catalog: 'cxxxi'
    },
    pig: {
      name: 'the communal couch',
      type: 'host · detached abundance',
      habit: 'shares generously, then disappears before gratitude becomes intimate.',
      note: {
        low:  'starts friendly, feeds the group, and avoids the heavy follow-up.',
        mid:  'builds comfort through shared space and flexible attachment.',
        high: 'knows generosity can scale better when nobody demands confession.'
      },
      catalog: 'cxxxii'
    }
  },

  pisces: {
    rat: {
      name: 'the drifting broker',
      type: 'operator · fog ledger',
      habit: 'collects feelings, favors, and stories until the edges blur.',
      note: {
        low:  'starts soft, charms sideways, and pockets the emotional weather.',
        mid:  'builds leverage through kindness, timing, and vague bookkeeping.',
        high: 'treats memory as water and lets advantage move beneath it.'
      },
      catalog: 'cxxxiii'
    },
    ox: {
      name: 'the drowned plow',
      type: 'worker · soft endurance',
      habit: 'keeps going through fog and calls exhaustion devotion.',
      note: {
        low:  'starts tender, takes the weight, and forgets where it began.',
        mid:  'builds care through endurance and struggles to invoice the labor.',
        high: 'reads duty through feeling and mistakes burden for proof of depth.'
      },
      catalog: 'cxxxiv'
    },
    tiger: {
      name: 'the storm impulse',
      type: 'force · wet teeth',
      habit: 'moves from feeling before the map has dried.',
      note: {
        low:  'starts flooded, strikes fast, and explains through atmosphere.',
        mid:  'builds action from emotion and negotiates cleanup with tears nearby.',
        high: 'handles risk through instinct and lets mood choose the first door.'
      },
      catalog: 'cxxxv'
    },
    rabbit: {
      name: 'the mist exit',
      type: 'escape artist · porous manners',
      habit: 'absorbs the room, smiles gently, and vanishes into static.',
      note: {
        low:  'starts sweet, feels too much, and slips out softly.',
        mid:  'builds peace through caretaking and loses the boundary line.',
        high: 'maps discomfort by saturation and retreats before the self dissolves.'
      },
      catalog: 'cxxxvi'
    },
    dragon: {
      name: 'the dream monarch',
      type: 'mythmaker · soft spectacle',
      habit: 'turns longing into scenery and expects reality to keep up.',
      note: {
        low:  'appears luminous, emotional, and slightly late to the facts.',
        mid:  'builds drama from tenderness and makes beauty do logistics.',
        high: 'frames identity as a film still and lets scale blur the edges.'
      },
      catalog: 'cxxxvii'
    },
    snake: {
      name: 'the moonlit knife',
      type: 'strategist · liquid hush',
      habit: 'waits inside ambiguity until the right feeling opens.',
      note: {
        low:  'starts quiet, senses the gap, and moves without hard edges.',
        mid:  'builds advantage through softness, secrecy, and patient drift.',
        high: 'keeps intention underwater until the room misreads the tide.'
      },
      catalog: 'cxxxviii'
    },
    horse: {
      name: 'the wandering tide',
      type: 'runner · dissolving map',
      habit: 'leaves because motion makes the feeling less named.',
      note: {
        low:  'starts drifting, follows an impulse, and calls the road necessary.',
        mid:  'builds freedom through avoidance and resents any practical shore.',
        high: 'treats arrival as definition and keeps moving to stay uncontained.'
      },
      catalog: 'cxxxix'
    },
    goat: {
      name: 'the sad velvet',
      type: 'aesthete · weathered mood',
      habit: 'turns ache into atmosphere and atmosphere into a personal room.',
      note: {
        low:  'enters softly, changes the lighting, and makes longing visible.',
        mid:  'builds comfort from beauty and lets mess become decoration.',
        high: 'reads feeling through texture and lets preference become refuge.'
      },
      catalog: 'cxl'
    },
    monkey: {
      name: 'the floating trick',
      type: 'trickster · soft chaos',
      habit: 'turns confusion into charm and charm into another exit.',
      note: {
        low:  'starts funny, gets vague, and escapes through the side feeling.',
        mid:  'builds mischief from mood, timing, and selective memory.',
        high: 'runs chaos through tenderness until accountability arrives damp and late.'
      },
      catalog: 'cxli'
    },
    rooster: {
      name: 'the wet mirror',
      type: 'inspector · fragile polish',
      habit: 'corrects the scene while quietly absorbing its bad weather.',
      note: {
        low:  'announces taste gently and feels the flaw too personally.',
        mid:  'builds order through presentation and resents every coarse edge.',
        high: 'reads polish as protection and keeps judgment wrapped in softness.'
      },
      catalog: 'cxlii'
    },
    dog: {
      name: 'the faithful fog',
      type: 'guard · porous oath',
      habit: 'protects everyone and forgets which hurt was originally theirs.',
      note: {
        low:  'starts loyal, feels danger, and rushes toward the wounded place.',
        mid:  'builds care through devotion and patrols pain without boundaries.',
        high: 'treats trust as rescue and keeps old sorrow on watch.'
      },
      catalog: 'cxliii'
    },
    pig: {
      name: 'the soft flood',
      type: 'host · generous drift',
      habit: 'feeds, forgives, overextends, and calls the overflow kindness.',
      note: {
        low:  'starts warm, gives too much, and lets the table blur.',
        mid:  'builds comfort through abundance and struggles to close the door.',
        high: 'knows pleasure can hide sorrow until the room is full.'
      },
      catalog: 'cxliv'
    }
  }
};
