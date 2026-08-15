/**
 * Live card draw — resolves identity at the exact moment of a tap, from
 * whatever's actually left in the pool right now. Nothing is precomputed
 * or pre-ordered before this function is called.
 *
 * This is deliberately NOT "shuffle the deck once, then reveal in order."
 * The pool is unordered on entry; every call is an independent draw
 * against whatever remains, seasoned with data unique to that tap.
 *
 * Fairness comes from crypto.getRandomValues (a real hardware/OS source
 * of randomness, not a seedable PRNG) — the `moment` data is provenance,
 * not a source of security, but it does mean two draws never resolve
 * identically: same pool + same crypto output is not reproducible because
 * the moment itself can't recur.
 */

/**
 * Cryptographically strong random index in [0, max).
 * Uses rejection sampling to avoid modulo bias.
 */
function secureRandomIndex(max) {
  if (max <= 0) return -1;
  if (max === 1) return 0;

  const array = new Uint32Array(1);
  const range = Math.floor(0xFFFFFFFF / max) * max;
  let x;
  do {
    crypto.getRandomValues(array);
    x = array[0];
  } while (x >= range);

  return x % max;
}

/**
 * Draw one card live from `pool` (an array of card objects/IDs).
 * Returns { card, remainingPool } — does NOT mutate the input array,
 * so the caller owns when/how the shrinking pool gets persisted (state,
 * ref, session, etc).
 *
 * `moment` (optional) is tap-provenance from OrbitWheelDraw's selectCard —
 * timestamp, ring angle, tap coordinates. Not required for fairness; kept
 * so a draw can be logged/audited as genuinely tied to a real interaction
 * if that's ever useful (e.g. "this card resolved at ring angle 214°,
 * 42.8s into the session").
 */
export function drawLiveCard(pool, moment = null) {
  if (!pool || pool.length === 0) {
    throw new Error("drawLiveCard: pool is empty — nothing left to draw.");
  }

  const index = secureRandomIndex(pool.length);
  const card = pool[index];
  const remainingPool = [...pool.slice(0, index), ...pool.slice(index + 1)];

  return {
    card,
    remainingPool,
    provenance: moment
      ? {
          drawnAt: moment.timestamp,
          ringAngleAtTap: moment.ringAngleAtTap,
          cardAngleAtTap: moment.cardAngleAtTap,
          tapX: moment.clientX,
          tapY: moment.clientY,
        }
      : null,
  };
}
