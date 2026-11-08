const express = require('express');
const router = express.Router();

const bookController = require('../controllers/bookController');
const {
  createBookRules,
  updateBookRules,
  bookIdRules,
  bookQueryRules,
} = require('../validators/bookValidator');
const { validate } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/books
 * @desc    Retrieve all books with search, filtering, sorting, and pagination
 * @access  Public
 */
router.get('/', bookQueryRules, validate, bookController.getAllBooks);

/**
 * @route   POST /api/books
 * @desc    Add a new book
 * @access  Public
 */
router.post('/', createBookRules, validate, bookController.createBook);

/**
 * @route   GET /api/books/:id
 * @desc    Retrieve a specific book by ID
 * @access  Public
 */
router.get('/:id', bookIdRules, validate, bookController.getBookById);

/**
 * @route   PUT /api/books/:id
 * @desc    Update book details by ID
 * @access  Public
 */
router.put('/:id', updateBookRules, validate, bookController.updateBook);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete a book by ID
 * @access  Public
 */
router.delete('/:id', bookIdRules, validate, bookController.deleteBook);

module.exports = router;

