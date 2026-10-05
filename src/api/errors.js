/**
 * A single error type for every API call, shaped like a real backend response.
 * Stores catch it and read `error.code` to decide what to show.
 */
export class ApiError extends Error {
  /**
   * @param {string} code Machine-readable, e.g. "not_found".
   * @param {string} message Safe to show to a user.
   * @param {{ status?: number, details?: Object|null, requestId?: string|null }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status ?? statusForCode(code);
    this.details = options.details ?? null;
    this.requestId = options.requestId ?? null;
  }

  /** @returns {import("../types").ApiErrorBody} */
  toBody() {
    return {
      code: this.code,
      message: this.message,
      requestId: this.requestId,
      details: this.details,
    };
  }
}

/** Map a code to a plausible HTTP status. */
function statusForCode(code) {
  switch (code) {
    case "not_found":
      return 404;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "validation_error":
      return 422;
    case "conflict":
      return 409;
    case "rate_limited":
      return 429;
    default:
      return 500;
  }
}

export const notFound = (message = "Not found") => new ApiError("not_found", message);
export const validationError = (message, details = null) =>
  new ApiError("validation_error", message, { details });
export const forbidden = (message = "You cannot do that") =>
  new ApiError("forbidden", message);
export const conflict = (message = "That conflicts with something that already exists") =>
  new ApiError("conflict", message);

/** Give every request an id, so errors can be traced like a real backend. */
let requestCounter = 0;
export function nextRequestId() {
  requestCounter += 1;
  return `req_${requestCounter.toString(36)}`;
}
