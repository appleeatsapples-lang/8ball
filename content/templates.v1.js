// 8ball / content / templates.v1.js
// Response templates with slot-fill tokens.
//
// Tokens:
//   {name}        first name (or "you")
//   {sun}         sun sign string
//   {animal}      Chinese zodiac animal
//   {lp}          life path number
//   {trait_sun}   one trait from sun pool
//   {trait_animal} one trait from animal pool
//   {trait_lp}    one trait from life-path pool
//   {trait_any}   weighted-random across all three
//   {trait_any_alt} second {trait_any} for "with notes of" style lines

export const TEMPLATES_NO_QUESTION = [
  'truth: you are {trait_any}.',
  '{name}, you are {trait_any}. allegedly.',
  '{trait_any}. do not shoot the messenger.',
  'you are {trait_any}. and it is on brand.',
  'you are {trait_any}, and it is probably your most consistent feature.',
  '{name}, you keep being {trait_any}. it is working, sort of.',
  'classic {sun}: {trait_any}.',
  'classic {animal}: {trait_any}.',
  'this is your {animal} energy showing: {trait_any}.',
  'remember when you decided to be {trait_any}? me neither, it is genetic.',
  'plot twist, except not: you are {trait_any}.',
  'someone has to be {trait_any}. lucky you.',
  'you are {trait_any}, and the people in your life are doing fine. probably.',
  '{trait_any}, with notes of {trait_any_alt}.',
  'in case you forgot: {trait_any}.'
];

export const TEMPLATES_YES = [
  'yes. but {trait_any}, so adjust.',
  'yes. classic {sun} luck.',
  'yes — your {animal} stubbornness will do the rest.',
  'yes. but you are {trait_any}, so we both know what happens.',
  'yes. the path is clear. you, however, are {trait_any}.',
  'absolutely. and do not make it weird like a {sun} would.',
  'yes. do not forget you are {trait_any}.'
];

export const TEMPLATES_NO = [
  'no. and it is because you are {trait_any}.',
  'no. do not take it personally — actually do, you are {trait_any}.',
  'no. {trait_any}-shaped problem, that one.',
  'no. classic {animal} miscalculation.',
  'no. and you knew that, classic {sun}.',
  'no. try again when you are less {trait_any}.',
  'no. {name}, this is the {trait_any} talking.'
];

export const TEMPLATES_MAYBE = [
  'maybe. {trait_any} energy will tip it.',
  'maybe. depends on whether you can stop being {trait_any} for an hour.',
  'cloudy. you are {trait_any}, which does not help.',
  'unclear. ask when you are less {trait_any}.',
  'split — half yes, half {trait_any}.',
  'tbd. the {animal} in you wants one thing, the {sun} another.',
  'ask again later. preferably after the {trait_any} part subsides.'
];
