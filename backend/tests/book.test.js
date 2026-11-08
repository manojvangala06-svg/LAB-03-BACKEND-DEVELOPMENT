/**
 * Automated API Test Suite
 * Tests all CRUD endpoints, search, filtering, sorting, pagination,
 * validation errors, and HTTP status codes using Jest and Supertest.
 */

// Mock the database pool and query functions before requiring the app
jest.mock('../config/db', () => {
  const mockBooks = [
    {
      id: 1,
      title: 'Python Crash Course',
      author: 'Eric Matthes',
      price: 29.99,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      title: 'Fluent Python',
      author: 'Luciano Ramalho',
      price: 49.99,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 3,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      price: 37.50,
      created_at: '2026-01-03T00:00:00.000Z',
      updated_at: '2026-01-03T00:00:00.000Z',
    },
  ];

  return {
    query: jest.fn(async (text, params = []) => {
      const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();

      // COUNT query for pagination
      if (normalized.includes('select count(*)')) {
        return { rows: [{ total: mockBooks.length.toString() }] };
      }

      // SELECT single book by ID
      if (normalized.includes('from books where id = $1')) {
        const id = parseInt(params[0], 10);
        const book = mockBooks.find((b) => b.id === id);
        return { rows: book ? [book] : [] };
      }

      // SELECT all / filtered books
      if (normalized.includes('from books')) {
        return { rows: mockBooks };
      }

      // INSERT book
      if (normalized.startsWith('insert into books')) {
        const [title, author, price] = params;
        const newBook = {
          id: mockBooks.length + 1,
          title,
          author,
          price: parseFloat(price),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { rows: [newBook] };
      }

      // UPDATE book
      if (normalized.startsWith('update books')) {
        const [title, author, price, id] = params;
        const bookId = parseInt(id, 10);
        if (bookId === 999999) {
          return { rows: [] };
        }
        return {
          rows: [
            {
              id: bookId,
              title,
              author,
              price: parseFloat(price),
              created_at: '2026-01-01T00:00:00.000Z',
              updated_at: new Date().toISOString(),
            },
          ],
        };
      }

      // DELETE book
      if (normalized.startsWith('delete from books')) {
        const id = parseInt(params[0], 10);
        if (id === 999999) {
          return { rows: [] };
        }
        return {
          rows: [
            {
              id,
              title: 'Clean Code',
              author: 'Robert C. Martin',
              price: 37.50,
              created_at: '2026-01-03T00:00:00.000Z',
              updated_at: '2026-01-03T00:00:00.000Z',
            },
          ],
        };
      }

      return { rows: [] };
    }),
    pool: {
      connect: jest.fn(async () => ({
        query: jest.fn(async () => ({ rows: [{ '?column?': 1 }] })),
        release: jest.fn(),
      })),
      end: jest.fn(),
      on: jest.fn(),
    },
    testConnection: jest.fn(async () => true),
  };
});

const request = require('supertest');
const app = require('../server');

describe('=== Advanced Book Management REST API Test Suite ===', () => {

  // ==========================================
  // Health & Documentation Endpoints
  // ==========================================
  describe('System Endpoints', () => {
    it('GET /health - Should return HTTP 200 with system status UP', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.database.status).toBe('CONNECTED');
    });

    it('GET / - Should return API documentation overview', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Welcome to the Advanced Book Management REST API');
      expect(res.body.documentation).toBeDefined();
    });

    it('GET /api/nonexistent - Should return HTTP 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Route not found');
    });
  });

  // ==========================================
  // 1. POST /api/books (Create)
  // ==========================================
  describe('POST /api/books - Create Book', () => {
    it('Should create a book with valid input and return HTTP 201', async () => {
      const validPayload = {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        price: 45.00,
      };

      const res = await request(app)
        .post('/api/books')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Book created successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe(validPayload.title);
      expect(res.body.data.author).toBe(validPayload.author);
      expect(res.body.data.price).toBe(validPayload.price);
    });

    it('Should return HTTP 400 when title is missing or empty', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({ author: 'Author Name', price: 19.99 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('Should return HTTP 400 when author is missing or empty', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({ title: 'Book Title', price: 19.99 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'author')).toBe(true);
    });

    it('Should return HTTP 400 when price is missing', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({ title: 'Book Title', author: 'Author Name' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'price')).toBe(true);
    });

    it('Should return HTTP 400 when price is negative', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({ title: 'Book Title', author: 'Author Name', price: -10 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'price')).toBe(true);
    });

    it('Should return HTTP 400 when price is not a numeric value', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({ title: 'Book Title', author: 'Author Name', price: 'free' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'price')).toBe(true);
    });
  });

  // ==========================================
  // 2. GET /api/books (List, Search, Filter, Sort, Paginate)
  // ==========================================
  describe('GET /api/books - Retrieve, Search, Filter, Sort, Paginate', () => {
    it('Should retrieve all books with default pagination and return HTTP 200', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Books retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.offset).toBe(0);
    });

    it('Should support search query: GET /api/books?search_q=python', async () => {
      const res = await request(app).get('/api/books?search_q=python');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Books retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Should support price filtering: GET /api/books?min_price=20&max_price=50', async () => {
      const res = await request(app).get('/api/books?min_price=20&max_price=50');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Books retrieved successfully');
    });

    it('Should return HTTP 400 if max_price is less than min_price', async () => {
      const res = await request(app).get('/api/books?min_price=100&max_price=20');
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'max_price')).toBe(true);
    });

    it('Should support safe sorting: GET /api/books?order_by=price&order=DESC', async () => {
      const res = await request(app).get('/api/books?order_by=price&order=DESC');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Books retrieved successfully');
    });

    it('Should return HTTP 400 for disallowed sort column: GET /api/books?order_by=injected_col', async () => {
      const res = await request(app).get('/api/books?order_by=injected_col');
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'order_by')).toBe(true);
    });

    it('Should return HTTP 400 for invalid sort order: GET /api/books?order=INVALID', async () => {
      const res = await request(app).get('/api/books?order=INVALID');
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'order')).toBe(true);
    });

    it('Should support pagination: GET /api/books?limit=5&offset=2', async () => {
      const res = await request(app).get('/api/books?limit=5&offset=2');
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.pagination.offset).toBe(2);
    });

    it('Should return HTTP 400 for negative limit or offset', async () => {
      const res = await request(app).get('/api/books?limit=-5&offset=-1');
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'limit' || e.field === 'offset')).toBe(true);
    });
  });

  // ==========================================
  // 3. GET /api/books/:id (Retrieve Single Book)
  // ==========================================
  describe('GET /api/books/:id - Get Book By ID', () => {
    it('Should return a book when valid ID exists and return HTTP 200', async () => {
      const res = await request(app).get('/api/books/1');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Book retrieved successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(1);
    });

    it('Should return HTTP 404 when book ID does not exist', async () => {
      const res = await request(app).get('/api/books/999999');
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Book not found');
    });

    it('Should return HTTP 400 for non-numeric ID parameter (e.g., abc)', async () => {
      const res = await request(app).get('/api/books/abc');
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'id')).toBe(true);
    });

    it('Should return HTTP 400 for negative or zero ID', async () => {
      const res = await request(app).get('/api/books/0');
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'id')).toBe(true);
    });
  });

  // ==========================================
  // 4. PUT /api/books/:id (Update Book)
  // ==========================================
  describe('PUT /api/books/:id - Update Book', () => {
    it('Should update a book with valid input and return HTTP 200', async () => {
      const updatePayload = {
        title: 'Python Crash Course - 3rd Edition',
        author: 'Eric Matthes',
        price: 34.99,
      };

      const res = await request(app)
        .put('/api/books/1')
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Book updated successfully');
      expect(res.body.data.title).toBe(updatePayload.title);
      expect(res.body.data.price).toBe(updatePayload.price);
    });

    it('Should return HTTP 404 when updating nonexistent book ID', async () => {
      const res = await request(app)
        .put('/api/books/999999')
        .send({
          title: 'Nonexistent Book',
          author: 'Ghost Author',
          price: 25.00,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Book not found');
    });

    it('Should return HTTP 400 when updating with invalid price', async () => {
      const res = await request(app)
        .put('/api/books/1')
        .send({
          title: 'Title',
          author: 'Author',
          price: -50,
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'price')).toBe(true);
    });

    it('Should return HTTP 400 when updating with empty title', async () => {
      const res = await request(app)
        .put('/api/books/1')
        .send({
          title: '',
          author: 'Author',
          price: 20,
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'title')).toBe(true);
    });
  });

  // ==========================================
  // 5. DELETE /api/books/:id (Delete Book)
  // ==========================================
  describe('DELETE /api/books/:id - Delete Book', () => {
    it('Should delete an existing book and return HTTP 200', async () => {
      const res = await request(app).delete('/api/books/3');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Book deleted successfully');
      expect(res.body.data).toBeDefined();
    });

    it('Should return HTTP 404 when deleting a nonexistent book ID', async () => {
      const res = await request(app).delete('/api/books/999999');
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Book not found');
    });

    it('Should return HTTP 400 when deleting with an invalid ID parameter', async () => {
      const res = await request(app).delete('/api/books/invalid-id');
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'id')).toBe(true);
    });
  });
});
