/**
 * src/utils/formatters.js
 * Shared formatting utilities for energy and money values.
 * ONE implementation used by the backend (API responses and reports).
 * The frontend has a mirror of this in frontend/src/utils/formatters.js.
 *
 * Rule 16: all money and energy formatting must go through these functions.
 */

/**
 * Format a kWh value to a string with 2 decimal places.
 * Returns null if the value is missing or not a number.
 *
 * @param {number|null} value
 * @param {number} [decimals=2]
 * @returns {string|null}
 */
export function formatKwh(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return `${Number(value).toFixed(decimals)} kWh`;
}

/**
 * Format a rupee amount to a string (₹ symbol, 2 decimal places).
 *
 * @param {number|null} value
 * @returns {string|null}
 */
export function formatRupees(value) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return `₹${Number(value).toFixed(2)}`;
}

/**
 * Format a percentage change with a leading + for positive values.
 *
 * @param {number|null} value
 * @param {number} [decimals=1]
 * @returns {string|null}
 */
export function formatPct(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return null;
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(decimals)}%`;
}

/**
 * Compute slab-based electricity cost from total kWh and a tariff slabs array.
 * Cost is always computed — never stored.
 *
 * @param {number} totalKwh - Total units consumed in the billing period
 * @param {Array<{upToKwh: number|null, ratePerKwh: number}>} slabs
 *   Slabs must be sorted ascending by upToKwh. Last slab has upToKwh = null (∞).
 * @returns {number} Cost in rupees, rounded to 2 decimal places
 */
export function computeCost(totalKwh, slabs) {
  if (!totalKwh || totalKwh <= 0) return 0;

  let cost = 0;
  let remaining = totalKwh;
  let prevBoundary = 0;

  for (const slab of slabs) {
    const ceiling = slab.upToKwh ?? Infinity;
    const slabSize = ceiling - prevBoundary;
    const consumed = Math.min(remaining, slabSize);
    cost += consumed * slab.ratePerKwh;
    remaining -= consumed;
    prevBoundary = ceiling;
    if (remaining <= 0) break;
  }

  return Math.round(cost * 100) / 100;
}
