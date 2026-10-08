/**
 * src/utils/AppError.js
 * Custom error class for known, expected errors (e.g. NOT_FOUND, FORBIDDEN).
 * The central error handler uses this to produce clean API error responses.
 *
 * Usage:
 *   throw new AppError('Unit not found', 404, 'NOT_FOUND');
 */
export class AppError extends Error {
  /**
   * @param {string} message     - Human-readable message (goes to client)
   * @param {number} statusCode  - HTTP status code
   * @param {string} code        - Machine-readable code (e.g. 'NOT_FOUND')
   * @param {Array}  [details]   - Optional field-level detail array
   */
  constructor(message, statusCode, code, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}
