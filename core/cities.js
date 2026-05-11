// 8ball / core / cities.js
// City autocomplete + IANA-timezone resolution.
//
// v0.2.7.2 introduces city-level birthplace selection. Replaces the
// country-centroid lat/lng + fixed-offset rising path from v0.2.1.
//
// Data: assets/cities.json — GeoNames cities5000 source, additional
// pop ≥ 7500 floor to fit the §6 single-file / asset-size discipline
// (≤ 2.5 MB raw target). 53,308 entries, 341 unique IANA tz strings,
// sorted by population descending.
//
// Storage format:
//   { tz: [string], cities: [[name, cc, lat, lng, tzIdx, pop], ...] }
//   tz strings are deduplicated; cities reference by index.
//
// Public API:
//   loadCities()                  → Promise<{ tz, cities }>
//   searchCities(query, limit?)   → Promise<City[]>
//   getCountryName(cc)            → string | undefined
//
// City shape: { name, country, countryCode, lat, lng, tz, pop }
//
// Loading uses dynamic `import()` with `with: { type: 'json' }` — the
// same-origin lazy-load mechanism permitted under DOCTRINE.md §5
// (v0.21 amendment). No XHR, no `sendBeacon`, no third-party endpoints,
// and no use of the network-call API banned by `tests/privacy_scan.test.js`.

// ── Country code → name table ──────────────────────────────────────
// ISO 3166-1 alpha-2 for every code present in assets/cities.json.
// Used by searchCities() to surface "Berlin, Germany" rather than the
// raw "DE" code in autocomplete results.

const COUNTRY_NAMES = {
  AD: 'Andorra', AE: 'United Arab Emirates', AF: 'Afghanistan',
  AG: 'Antigua and Barbuda', AL: 'Albania', AM: 'Armenia', AO: 'Angola',
  AR: 'Argentina', AS: 'American Samoa', AT: 'Austria', AU: 'Australia',
  AW: 'Aruba', AX: 'Åland Islands', AZ: 'Azerbaijan',
  BA: 'Bosnia and Herzegovina', BB: 'Barbados', BD: 'Bangladesh',
  BE: 'Belgium', BF: 'Burkina Faso', BG: 'Bulgaria', BH: 'Bahrain',
  BI: 'Burundi', BJ: 'Benin', BM: 'Bermuda', BN: 'Brunei',
  BO: 'Bolivia', BQ: 'Caribbean Netherlands', BR: 'Brazil',
  BS: 'Bahamas', BT: 'Bhutan', BW: 'Botswana', BY: 'Belarus',
  BZ: 'Belize', CA: 'Canada', CD: 'DR Congo',
  CF: 'Central African Republic', CG: 'Republic of the Congo',
  CH: 'Switzerland', CI: "Côte d'Ivoire", CK: 'Cook Islands',
  CL: 'Chile', CM: 'Cameroon', CN: 'China', CO: 'Colombia',
  CR: 'Costa Rica', CU: 'Cuba', CV: 'Cape Verde', CW: 'Curaçao',
  CY: 'Cyprus', CZ: 'Czechia', DE: 'Germany', DJ: 'Djibouti',
  DK: 'Denmark', DM: 'Dominica', DO: 'Dominican Republic',
  DZ: 'Algeria', EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt',
  EH: 'Western Sahara', ER: 'Eritrea', ES: 'Spain', ET: 'Ethiopia',
  FI: 'Finland', FJ: 'Fiji', FM: 'Micronesia', FO: 'Faroe Islands',
  FR: 'France', GA: 'Gabon', GB: 'United Kingdom', GD: 'Grenada',
  GE: 'Georgia', GF: 'French Guiana', GG: 'Guernsey', GH: 'Ghana',
  GI: 'Gibraltar', GL: 'Greenland', GM: 'Gambia', GN: 'Guinea',
  GP: 'Guadeloupe', GQ: 'Equatorial Guinea', GR: 'Greece',
  GT: 'Guatemala', GU: 'Guam', GW: 'Guinea-Bissau', GY: 'Guyana',
  HK: 'Hong Kong', HN: 'Honduras', HR: 'Croatia', HT: 'Haiti',
  HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland', IL: 'Israel',
  IM: 'Isle of Man', IN: 'India', IQ: 'Iraq', IR: 'Iran',
  IS: 'Iceland', IT: 'Italy', JE: 'Jersey', JM: 'Jamaica',

  JO: 'Jordan', JP: 'Japan', KE: 'Kenya', KG: 'Kyrgyzstan',
  KH: 'Cambodia', KI: 'Kiribati', KM: 'Comoros', KN: 'Saint Kitts and Nevis',
  KP: 'North Korea', KR: 'South Korea', KW: 'Kuwait', KY: 'Cayman Islands',
  KZ: 'Kazakhstan', LA: 'Laos', LB: 'Lebanon', LC: 'Saint Lucia',
  LK: 'Sri Lanka', LR: 'Liberia', LS: 'Lesotho', LT: 'Lithuania',
  LU: 'Luxembourg', LV: 'Latvia', LY: 'Libya',
  MA: 'Morocco', MC: 'Monaco', MD: 'Moldova', ME: 'Montenegro',
  MG: 'Madagascar', MH: 'Marshall Islands', MK: 'North Macedonia', ML: 'Mali',
  MM: 'Myanmar', MN: 'Mongolia', MO: 'Macau', MP: 'Northern Mariana Islands',
  MQ: 'Martinique', MR: 'Mauritania', MT: 'Malta', MU: 'Mauritius',
  MV: 'Maldives', MW: 'Malawi', MX: 'Mexico', MY: 'Malaysia',
  MZ: 'Mozambique', NA: 'Namibia', NC: 'New Caledonia', NE: 'Niger',
  NG: 'Nigeria', NI: 'Nicaragua', NL: 'Netherlands', NO: 'Norway',
  NP: 'Nepal', NZ: 'New Zealand', OM: 'Oman', PA: 'Panama',
  PE: 'Peru', PF: 'French Polynesia', PG: 'Papua New Guinea', PH: 'Philippines',
  PK: 'Pakistan', PL: 'Poland', PR: 'Puerto Rico', PS: 'Palestine',
  PT: 'Portugal', PW: 'Palau', PY: 'Paraguay', QA: 'Qatar',
  RE: 'Réunion', RO: 'Romania', RS: 'Serbia', RU: 'Russia',
  RW: 'Rwanda',
  SA: 'Saudi Arabia', SB: 'Solomon Islands', SC: 'Seychelles', SD: 'Sudan',
  SE: 'Sweden', SG: 'Singapore', SI: 'Slovenia', SK: 'Slovakia',
  SL: 'Sierra Leone', SM: 'San Marino', SN: 'Senegal', SO: 'Somalia',
  SR: 'Suriname', SS: 'South Sudan', ST: 'Sao Tome and Principe', SV: 'El Salvador',
  SX: 'Sint Maarten', SY: 'Syria', SZ: 'Eswatini',
  TC: 'Turks and Caicos Islands', TD: 'Chad', TG: 'Togo', TH: 'Thailand',
  TJ: 'Tajikistan', TL: 'Timor-Leste', TM: 'Turkmenistan', TN: 'Tunisia',
  TO: 'Tonga', TR: 'Turkey', TT: 'Trinidad and Tobago', TW: 'Taiwan',
  TZ: 'Tanzania', UA: 'Ukraine', UG: 'Uganda', US: 'United States',
  UY: 'Uruguay', UZ: 'Uzbekistan', VC: 'Saint Vincent and the Grenadines',
  VE: 'Venezuela', VG: 'British Virgin Islands', VI: 'U.S. Virgin Islands',
  VN: 'Vietnam', VU: 'Vanuatu', WS: 'Samoa', XK: 'Kosovo',
  YE: 'Yemen', YT: 'Mayotte', ZA: 'South Africa', ZM: 'Zambia',
  ZW: 'Zimbabwe'
};

// ── Module-private cache ───────────────────────────────────────────
// loadCities() is the one entry point that resolves the JSON asset.
// First call kicks off the lazy import; subsequent calls reuse the
// resolved object. Concurrent first-callers share a single promise via
// `_loading` so we don't issue duplicate network round-trips on
// near-simultaneous searches (e.g. fast typing).

let _cache = null;
let _loading = null;

/**
 * Resolve the city dataset on demand.
 *
 * Returns the raw shape `{ tz: string[], cities: Array }` —
 * downstream callers (`searchCities`) read both fields.
 *
 * @returns {Promise<{ tz: string[], cities: Array }>}
 */
export async function loadCities() {
  if (_cache) return _cache;
  if (_loading) return _loading;
  _loading = (async () => {
    const mod = await import('../assets/cities.json', { with: { type: 'json' } });
    _cache = mod.default;
    _loading = null;
    return _cache;
  })();
  return _loading;
}

// ── Search normalization ───────────────────────────────────────────
// NFD-decompose then strip combining marks so "Reykjavík" and
// "Reykjavik" hit the same index path, and lowercase so search is
// case-insensitive. Applied to BOTH the stored city name and the
// query string at search time — cheap, no bundle cost.

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ── Public search API ──────────────────────────────────────────────

/**
 * Search the city dataset by case- and diacritic-insensitive substring
 * match on the city name. Returns up to `limit` results, ranked by
 * population descending (the underlying data is pre-sorted).
 *
 * Returns an empty array for queries shorter than 2 normalized chars.
 *
 * @param {string} query
 * @param {number} [limit=20]
 * @returns {Promise<Array<{
 *   name: string,
 *   country: string,
 *   countryCode: string,
 *   lat: number,
 *   lng: number,
 *   tz: string,
 *   pop: number
 * }>>}
 */
export async function searchCities(query, limit = 20) {
  const q = normalize((query || '').trim());
  if (q.length < 2) return [];
  const data = await loadCities();
  const out = [];
  for (let i = 0; i < data.cities.length; i++) {
    const c = data.cities[i];
    // c = [name, cc, lat, lng, tzIdx, pop]
    if (normalize(c[0]).includes(q)) {
      out.push({
        name: c[0],
        country: COUNTRY_NAMES[c[1]] || c[1],
        countryCode: c[1],
        lat: c[2],
        lng: c[3],
        tz: data.tz[c[4]],
        pop: c[5]
      });
      if (out.length >= limit) break;
    }
  }
  return out;
}

/**
 * Resolve a country display name from an ISO 3166-1 alpha-2 code.
 * Returns the short English name (e.g. "DE" → "Germany"), or
 * `undefined` if the code is not present in the dataset's coverage.
 *
 * @param {string} cc
 * @returns {string | undefined}
 */
export function getCountryName(cc) {
  return COUNTRY_NAMES[cc];
}
