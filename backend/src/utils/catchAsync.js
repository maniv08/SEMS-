/**
 * src/utils/catchAsync.js
 * Wraps an async route handler so any rejected promise is forwarded to next(err).
 * Without this, unhandled promise rejections in routes would crash the server.
 *
 * Usage:
 *   router.get('/route', catchAsync(async (req, res) => { ... }));
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
