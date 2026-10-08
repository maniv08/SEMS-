/**
 * src/utils/scopeToUser.js
 * 
 * IDOR prevention helper.
 * If the requester is not an admin, automatically scopes the query to their own documents.
 */

/**
 * Adds ownership filter to a query if the user is not an admin.
 * @param {Object} query - The initial MongoDB query filter (e.g. { isActive: true })
 * @param {Object} req - The Express request object containing req.user
 * @param {string} ownerField - The field name that represents the owner (default: 'owner')
 * @returns {Object} The modified query filter
 */
export const scopeToUser = (query, req, ownerField = 'owner') => {
  const scopedQuery = { ...query };
  
  // Admin sees all, so we only apply the filter for non-admins
  if (req.user && req.user.role !== 'admin') {
    scopedQuery[ownerField] = req.user._id;
  }
  
  return scopedQuery;
};
