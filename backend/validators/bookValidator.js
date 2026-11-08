const { body, param, query } = require('express-validator');

// Allowed columns for sorting to prevent SQL injection and invalid queries
const ALLOWED_SORT_COLUMNS = ['id', 'title', 'author', 'price', 'created_at', 'updated_at'];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC', 'asc', 'desc'];

/**
 * Validation rules for creating a new book (POST /api/books)
 */
const createBookRules = [
  body('title')
    .exists({ checkFalsy: true })
    .withMessage('Title is required and must not be empty.')
    .bail()
    .isString()
    .withMessage('Title must be a string.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters long.'),

  body('author')
    .exists({ checkFalsy: true })
    .withMessage('Author is required and must not be empty.')
    .bail()
    .isString()
    .withMessage('Author must be a string.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Author must be between 1 and 255 characters long.'),

  body('price')
    .exists()
    .withMessage('Price is required.')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid non-negative number (0 or greater).')
    .toFloat(),
];

/**
 * Validation rules for updating an existing book (PUT /api/books/:id)
 */
const updateBookRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer.')
    .toInt(),

  body('title')
    .exists({ checkFalsy: true })
    .withMessage('Title is required and must not be empty.')
    .bail()
    .isString()
    .withMessage('Title must be a string.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters long.'),

  body('author')
    .exists({ checkFalsy: true })
    .withMessage('Author is required and must not be empty.')
    .bail()
    .isString()
    .withMessage('Author must be a string.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Author must be between 1 and 255 characters long.'),

  body('price')
    .exists()
    .withMessage('Price is required.')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid non-negative number (0 or greater).')
    .toFloat(),
];

/**
 * Validation rules for single book retrieval & deletion (GET/DELETE /api/books/:id)
 */
const bookIdRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer.')
    .toInt(),
];

/**
 * Validation rules for book query parameters:
 * search_q, order_by, order, limit, offset, min_price, max_price
 */
const bookQueryRules = [
  query('search_q')
    .optional()
    .isString()
    .withMessage('search_q must be a string.')
    .trim(),

  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('min_price must be a non-negative number.')
    .toFloat(),

  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('max_price must be a non-negative number.')
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.min_price !== undefined && parseFloat(value) < parseFloat(req.query.min_price)) {
        throw new Error('max_price cannot be less than min_price.');
      }
      return true;
    }),

  query('order_by')
    .optional()
    .isIn(ALLOWED_SORT_COLUMNS)
    .withMessage(`order_by must be one of: ${ALLOWED_SORT_COLUMNS.join(', ')}.`),

  query('order')
    .optional()
    .isIn(ALLOWED_SORT_ORDERS)
    .withMessage('order must be either ASC or DESC.')
    .toUpperCase(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100.')
    .toInt(),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer.')
    .toInt(),
];

module.exports = {
  ALLOWED_SORT_COLUMNS,
  ALLOWED_SORT_ORDERS,
  createBookRules,
  updateBookRules,
  bookIdRules,
  bookQueryRules,
};

