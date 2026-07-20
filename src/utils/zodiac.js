// src/utils/zodiac.js
//
// Deterministic zodiac sun-sign derivation from a birthdate.
// Pure date math — no LLM, no API. Layer 1 of the cosmic content system.

const ZODIAC_RANGES = [
  // [sign, startMonth, startDay] — each sign begins on this date
  ["capricorn", 12, 22],
  ["aquarius", 1, 20],
  ["pisces", 2, 19],
  ["aries", 3, 21],
  ["taurus", 4, 20],
  ["gemini", 5, 21],
  ["cancer", 6, 21],
  ["leo", 7, 23],
  ["virgo", 8, 23],
  ["libra", 9, 23],
  ["scorpio", 10, 23],
  ["sagittarius", 11, 22],
];

/**
 * Get the zodiac sun sign for a birthdate.
 * @param {string|Date} birthdate - ISO string ("1990-04-15") or Date object
 * @returns {string} lowercase sign name, e.g. "aries"
 */
export function getZodiacSign(birthdate) {
  const d = birthdate instanceof Date ? birthdate : new Date(birthdate);
  const month = d.getUTCMonth() + 1; // 1-12
  const day = d.getUTCDate();

  // Walk backwards through sign start dates to find the active one
  for (let i = ZODIAC_RANGES.length - 1; i >= 0; i--) {
    const [sign, startMonth, startDay] = ZODIAC_RANGES[i];
    if (month > startMonth || (month === startMonth && day >= startDay)) {
      return sign;
    }
  }
  // Dates before Jan 20 fall into Capricorn (which wraps the year boundary)
  return "capricorn";
}

/** Capitalized display name, e.g. "Aries" */
export function getZodiacDisplayName(birthdate) {
  const sign = getZodiacSign(birthdate);
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}