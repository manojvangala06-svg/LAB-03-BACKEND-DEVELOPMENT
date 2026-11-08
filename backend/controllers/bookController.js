const bookService = require('../services/bookService');

/**
 * Controller layer for Book endpoints.
 * Handles HTTP request processing, status codes, and JSON response formatting.
 */

/**
 * @desc    Create a new book
 * @route   POST /api/books
 * @access  Public
 */
const createBook = async (req, res, next) => {
  try {
    const { title, author, price } = req.body;
    const newBook = await bookService.createBook({ title, author, price });

    return res.status(201).json({
      message: 'Book created successfully',
      data: newBook,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve all books with search, filtering, sorting, and pagination
 * @route   GET /api/books
 * @access  Public
 */
const getAllBooks = async (req, res, next) => {
  try {
    const { books, pagination } = await bookService.getAllBooks(req.query);

    return res.status(200).json({
      message: 'Books retrieved successfully',
      data: books,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve a specific book by ID
 * @route   GET /api/books/:id
 * @access  Public
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await bookService.getBookById(id);

    if (!book) {
      return res.status(404).json({
        message: `Book not found with ID: ${id}`,
        data: null,
      });
    }

    return res.status(200).json({
      message: 'Book retrieved successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing book by ID
 * @route   PUT /api/books/:id
 * @access  Public
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, price } = req.body;

    const updatedBook = await bookService.updateBook(id, { title, author, price });

    if (!updatedBook) {
      return res.status(404).json({
        message: `Book not found with ID: ${id}`,
        data: null,
      });
    }

    return res.status(200).json({
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a book by ID
 * @route   DELETE /api/books/:id
 * @access  Public
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedBook = await bookService.deleteBook(id);

    if (!deletedBook) {
      return res.status(404).json({
        message: `Book not found with ID: ${id}`,
        data: null,
      });
    }

    return res.status(200).json({
      message: 'Book deleted successfully',
      data: deletedBook,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
};

