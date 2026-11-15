/**
 * Wraps async route handlers to pass unhandled errors to Express error-handling middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Global error-handling middleware for Express.
 * Catches database constraint violations (PostgreSQL codes 23505, 23503) and runtime errors.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Global Error Handler:", err);

  // PostgreSQL unique violation (e.g., duplicate email/username)
  if (err.code === '23505') {
    return res.status(409).json({ message: 'Conflict', detail: err.detail });
  }

  // PostgreSQL foreign key violation (e.g., referencing non-existent ID)
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Invalid reference', detail: err.detail });
  }

  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error' 
  });
};