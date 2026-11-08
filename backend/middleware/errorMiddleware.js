/**
 * Error Handling Middleware
 * Centralized handlers for 404 Not Found and internal server errors (500).
 */

/**
 * 404 Not Found Middleware for undefined endpoints
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found.`,
    data: null,
  });
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log full error in server console
  console.error(`💥 [Unhandled Error] ${req.method} ${req.url}:`, {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Bad JSON syntax in request body (e.g., malformed JSON payload)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Invalid JSON format in request body.',
      errors: [{ message: err.message }],
    });
  }

  // Handle PostgreSQL specific errors
  if (err.code) {
    // 23514: Check violation (e.g., price >= 0)
    if (err.code === '23514') {
      return res.status(400).json({
        message: 'Database constraint violation: input values failed validation checks.',
        errors: [{ message: err.detail || err.message }],
      });
    }

    // 23505: Unique violation
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'A record with this identifier already exists.',
        errors: [{ message: err.detail || err.message }],
      });
    }

    // 22P02: Invalid text representation (e.g., integer expected)
    if (err.code === '22P02') {
      return res.status(400).json({
        message: 'Invalid data format provided for database query.',
        errors: [{ message: err.message }],
      });
    }

    // Connection errors (ECONNREFUSED, 57P01, etc.)
    if (['ECONNREFUSED', '57P01', '57P02', '57P03', '08006', '08001'].includes(err.code)) {
      return res.status(500).json({
        message: 'Database connection error. Please ensure the database server is running and reachable.',
        data: null,
      });
    }
  }

  // Custom application error (if has statusCode)
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    data: null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

