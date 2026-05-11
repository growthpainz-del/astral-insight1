/**
 * src/lib/subscriptionUtils.js
 *
 * Single source of truth for subscription tier checks.
 * Import these helpers instead of writing inline tier comparisons.
 */

/** Ordered list of tiers from lowest to highest */
export const TIERS = ['free', 'mystic', 'oracle_pro', 'creator']

/**
 * Returns true if the user has at least the specified tier.
 * Handles null/undefined users gracefully (returns false).
 */
export function hasTier(user, minimumTier) {
  if (!user) return false
  const userIndex = TIERS.indexOf(user.subscription_tier || 'free')
  const requiredIndex = TIERS.indexOf(minimumTier)
  if (requiredIndex === -1) return false
  return userIndex >= requiredIndex
}

/**
 * Returns true for any paid tier (mystic, oracle_pro, or creator).
 */
export function isPaid(user) {
  return hasTier(user, 'mystic')
}

/**
 * Returns true for oracle_pro or creator.
 */
export function isOraclePro(user) {
  return hasTier(user, 'oracle_pro')
}

/**
 * Returns true for creator tier only.
 */
export function isCreator(user) {
  return hasTier(user, 'creator')
}

/**
 * Returns true if the user has admin role.
 */
export function isAdmin(user) {
  return user?.role === 'admin'
}