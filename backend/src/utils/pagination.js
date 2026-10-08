/**
 * src/utils/pagination.js
 * 
 * Helper for offset-based pagination.
 * Computes standard skip and limit values, and formats the pagination response metadata.
 */

/**
 * Get mongoose query options and metadata values for pagination
 * @param {Object} query - Express req.query
 * @param {number} defaultLimit - Default limit if not specified (default: 20)
 * @returns {Object} { limit, skip, page }
 */
export const getPaginationOptions = (query, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return { limit, skip, page };
};

/**
 * Format the paginated response envelope
 * @param {Array} items - The queried documents
 * @param {number} total - The total count of documents matching the filter
 * @param {Object} options - { limit, page } returned from getPaginationOptions
 * @returns {Object} The paginated payload
 */
export const formatPaginatedResponse = (items, total, { limit, page }) => {
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
