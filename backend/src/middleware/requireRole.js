/**
 * src/middleware/requireRole.js
 * Role-based access control middleware.
 * Must be used AFTER authenticate (requires req.user to be set).
 *
 * Per SECURITY.md: returns 403 FORBIDDEN (not 401) because the user IS
 * authenticated but does not have the required role.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole(['admin']), handler);
 */

/**
 * Factory function that returns a middleware checking req.user.role.
 * @param {string[]} roles - Array of allowed roles, e.g. ['admin']
 */
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      // Should not happen if authenticate runs first, but guard anyway
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    }

    next();
  };
}
