const db = require('../config/db');
const { ALLOWED_SORT_COLUMNS } = require('../validators/bookValidator');

/**
 * Service layer for Book operations.
 * Handles database queries, SQL parameterization, safe whitelisting, and business logic.
 */

/**
 * Create a new book record.
 * @param {Object} bookData - { title, author, price }
 * @returns {Promise<Object>} Created book
 */
const createBook = async ({ title, author, price }) => {
  const queryText = `
    INSERT INTO books (title, author, price)
    VALUES ($1, $2, $3)
    RETURNING id, title, author, price, created_at, updated_at;
  `;
  const values = [title.trim(), author.trim(), parseFloat(price)];
  const result = await db.query(queryText, values);
  return result.rows[0];
};

/**
 * Retrieve books with search, price filtering, safe sorting, and pagination.
 * @param {Object} options - Query filters and pagination options
 * @returns {Promise<{ books: Array, pagination: Object }>}
 */
const getAllBooks = async (options = {}) => {
  const {
    search_q,
    min_price,
    max_price,
    order_by = 'id',
    order = 'ASC',
    limit = 10,
    offset = 0,
  } = options;

  const conditions = [];
  const params = [];

  // Search by book title (partial match using parameterized ILIKE)
  if (search_q && typeof search_q === 'string' && search_q.trim() !== '') {
    params.push(`%${search_q.trim()}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }

  // Filter by minimum price
  if (min_price !== undefined && min_price !== null && !isNaN(min_price)) {
    params.push(parseFloat(min_price));
    conditions.push(`price >= $${params.length}`);
  }

  // Filter by maximum price
  if (max_price !== undefined && max_price !== null && !isNaN(max_price)) {
    params.push(parseFloat(max_price));
    conditions.push(`price <= $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Get total count for pagination metadata
  const countQuery = `SELECT COUNT(*) AS total FROM books ${whereClause};`;
  const countResult = await db.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // 2. Safe sorting validation against column whitelist
  const safeOrderBy = ALLOWED_SORT_COLUMNS.includes(order_by.toLowerCase())
    ? order_by.toLowerCase()
    : 'id';
  const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  // 3. Pagination numbers
  const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

  // 4. Query book records with LIMIT and OFFSET
  const dataParams = [...params, safeLimit, safeOffset];
  const dataQuery = `
    SELECT id, title, author, price, created_at, updated_at
    FROM books
    ${whereClause}
    ORDER BY ${safeOrderBy} ${safeOrder}
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
  `;

  const dataResult = await db.query(dataQuery, dataParams);
  const books = dataResult.rows;

  return {
    books,
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      count: books.length,
      total_pages: Math.ceil(total / safeLimit) || 1,
      current_page: Math.floor(safeOffset / safeLimit) + 1,
      has_next: safeOffset + books.length < total,
      has_previous: safeOffset > 0,
    },
  };
};

/**
 * Retrieve a specific book by ID.
 * @param {number} id - Book ID
 * @returns {Promise<Object|null>} Book record or null if not found
 */
const getBookById = async (id) => {
  const queryText = `
    SELECT id, title, author, price, created_at, updated_at
    FROM books
    WHERE id = $1;
  `;
  const result = await db.query(queryText, [id]);
  return result.rows[0] || null;
};

/**
 * Update an existing book by ID.
 * @param {number} id - Book ID
 * @param {Object} bookData - { title, author, price }
 * @returns {Promise<Object|null>} Updated book or null if not found
 */
const updateBook = async (id, { title, author, price }) => {
  const queryText = `
    UPDATE books
    SET title = $1,
        author = $2,
        price = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING id, title, author, price, created_at, updated_at;
  `;
  const values = [title.trim(), author.trim(), parseFloat(price), id];
  const result = await db.query(queryText, values);
  return result.rows[0] || null;
};

/**
 * Delete a book by ID.
 * @param {number} id - Book ID
 * @returns {Promise<Object|null>} Deleted book record or null if not found
 */
const deleteBook = async (id) => {
  const queryText = `
    DELETE FROM books
    WHERE id = $1
    RETURNING id, title, author, price, created_at, updated_at;
  `;
  const result = await db.query(queryText, [id]);
  return result.rows[0] || null;
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
};

