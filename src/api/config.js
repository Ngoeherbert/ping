/**
 * Runtime configuration for the fake API.
 *
 * Screens never import this directly; they go through the API client. Change
 * these values in development to exercise loading and error states.
 */

/** @typedef {Object} ApiConfig */
/** @property {number} minDelayMs @property {number} maxDelayMs @property {number} failureRate @property {boolean} forceError @property {string|null} forcedErrorCode @property {string|null} forcedErrorMessage */

/** @type {ApiConfig} */
export const config = {
  /** Simulated network latency, in milliseconds. */
  minDelayMs: 400,
  maxDelayMs: 1200,

  /** Fraction of requests that fail, between 0 and 1. */
  failureRate: 0,

  /** When true every request fails, which makes error states easy to test. */
  forceError: false,
  forcedErrorCode: null,
  forcedErrorMessage: null,
};

/**
 * Override the simulated delay.
 * @param {number} min
 * @param {number} max
 */
export function setDelay(min, max) {
  config.minDelayMs = Math.max(0, Math.min(min, max));
  config.maxDelayMs = Math.max(min, max);
}

/**
 * Set the fraction of requests that fail randomly.
 * @param {number} rate 0 to 1.
 */
export function setFailureRate(rate) {
  config.failureRate = Math.min(1, Math.max(0, rate));
}

/**
 * Make every request fail, or clear it.
 * @param {boolean} shouldFail
 * @param {{ code?: string, message?: string }} [options]
 */
export function forceErrors(shouldFail, options = {}) {
  config.forceError = shouldFail;
  config.forcedErrorCode = options.code ?? "forced_error";
  config.forcedErrorMessage = options.message ?? "Something went wrong. Try again.";
}

/** Restore every setting to its default. */
export function resetConfig() {
  config.minDelayMs = 400;
  config.maxDelayMs = 1200;
  config.failureRate = 0;
  config.forceError = false;
  config.forcedErrorCode = null;
  config.forcedErrorMessage = null;
}

/** Snapshot the current config, useful in tests and debug screens. */
export function getConfig() {
  return { ...config };
}
