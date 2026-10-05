/**
 * The public API surface.
 *
 * Screens and stores import from here and never reach into the data layer or
 * the in-memory database. To swap the mock for a real backend, reimplement the
 * functions below against `fetch` and nothing else changes.
 */

export * from "./users";
export * from "./content";
export * from "./messaging";
export * from "./social";

export {
  config,
  setDelay,
  setFailureRate,
  forceErrors,
  resetConfig,
  getConfig,
} from "./config";

export { ApiError, notFound, validationError, forbidden, conflict } from "./errors";

export { paginate, DEFAULT_LIMIT, MAX_LIMIT } from "./pagination";

export { resetDb, getDb, CURRENT_USER_ID } from "./db";

/**
 * Everything above, in one object, for code that prefers a namespace:
 * `import api from "../../src/api/client"; api.listFeed()`.
 */
import * as users from "./users";
import * as content from "./content";
import * as messaging from "./messaging";
import * as social from "./social";
import * as configModule from "./config";
import * as errors from "./errors";
import { resetDb, getDb, CURRENT_USER_ID } from "./db";
import { paginate, DEFAULT_LIMIT, MAX_LIMIT } from "./pagination";

export const api = {
  ...users,
  ...content,
  ...messaging,
  ...social,
  ...configModule,
  ...errors,
  paginate,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  resetDb,
  getDb,
  CURRENT_USER_ID,
};

export default api;
