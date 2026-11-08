# Advanced Book Management REST API

> A robust, production-ready backend REST API built with Node.js, Express.js, and PostgreSQL. Features comprehensive CRUD operations, full-text partial title search, multi-criteria price filtering, safe whitelisted column sorting, limit-offset pagination, strict input validation with `express-validator`, connection pooling, health diagnostics, and error handling.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Objectives](#objectives)
3. [Technology Stack](#technology-stack)
4. [Key Features](#key-features)
5. [Architecture & Folder Structure](#architecture--folder-structure)
6. [Database Schema & Design](#database-schema--design)
7. [API Endpoint Documentation](#api-endpoint-documentation)
8. [Query Parameters & Filtering Examples](#query-parameters--filtering-examples)
9. [HTTP Status Codes & Response Standards](#http-status-codes--response-standards)
10. [Local Installation & Setup](#local-installation--setup)
11. [Environment Configuration](#environment-configuration)
12. [Running the Application](#running-the-application)
13. [Debugging & Resilience](#debugging--resilience)
14. [Automated Testing & Postman Instructions](#automated-testing--postman-instructions)
15. [Deployment Guide (GitHub + Neon + Render)](#deployment-guide-github--neon--render)

---

## Project Overview

The **Advanced Book Management REST API** is an enterprise-grade backend service built to provide fast, reliable, and secure data access for managing books in a library or bookstore system. It strictly enforces separation of concerns through a layered architecture (Controllers, Services, Validators, Middleware, and Database Config), implements parameterized SQL queries to prevent SQL injection, and delivers uniform JSON responses for both successful operations and error states.

> **Note on Architecture:** This repository is strictly a backend service. It contains zero frontend assets (no HTML, CSS, React, or browser templates), complying strictly with API-first backend standards.

---

## Objectives

- **Robust RESTful Design:** Follow standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) with exact status codes (`200`, `201`, `400`, `404`, `500`).
- **Data Security:** Ensure 100% parameterization of SQL queries (`$1`, `$2`, ...) and enforce strict whitelisting on dynamic sorting columns.
- **High Performance:** Leverage PostgreSQL connection pooling (`pg.Pool`), indexing on searchable and sortable columns, and offset-limit pagination to handle large datasets.
- **Strict Validation:** Use `express-validator` to intercept and reject invalid, empty, or negative values before they reach the persistence layer.
- **Cloud-Ready Deployment:** Seamless compatibility with modern cloud platforms (Neon PostgreSQL, Render, GitHub Actions).

---

## Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v18+) | Non-blocking, event-driven JavaScript engine |
| **Web Framework** | Express.js (v4.21+) | Fast, minimalist web framework for routing and middleware |
| **Database** | PostgreSQL | Enterprise relational SQL database with ACID guarantees |
| **Database Client** | `pg` (node-postgres) | High-performance PostgreSQL client with connection pooling |
| **Validation** | `express-validator` | Declarative schema validation and sanitization middleware |
| **Security** | `helmet`, `cors` | HTTP headers hardening and Cross-Origin Resource Sharing control |
| **Logging** | `morgan` | HTTP request and error logger |
| **Environment** | `dotenv` | Zero-dependency environment variable manager |
| **Testing** | `jest`, `supertest` | Automated unit/integration test runner and HTTP assertions |
| **API Client** | Postman | Automated collection test runner and manual API exploration |

---

## Key Features

### 1. CRUD Operations
- **Create:** Add new books with verified titles, authors, and non-negative prices.
- **Read All:** Retrieve paginated lists of books with dynamic metadata.
- **Read One:** Fetch single book details by numerical ID.
- **Update:** Completely update existing book fields while updating timestamps.
- **Delete:** Safely remove a book record by numerical ID.

### 2. Search Functionality
- Partial, case-insensitive book title matching via SQL `ILIKE`.
- Example: `GET /api/books?search_q=python` returns all books containing "python" anywhere in their title.

### 3. Safe Dynamic Sorting
- Query parameters: `order_by` and `order` (`ASC` / `DESC`).
- **Security Whitelist:** Strictly restricted to `id`, `title`, `author`, `price`, `created_at`, and `updated_at`. Any unauthorized column name immediately returns `HTTP 400 Bad Request`, completely preventing SQL injection through order clauses.

### 4. Limit-Offset Pagination
- Query parameters: `limit` (default: 10, max: 100) and `offset` (default: 0).
- Response includes complete pagination metadata: `total`, `limit`, `offset`, `count`, `total_pages`, `current_page`, `has_next`, `has_previous`.

### 5. Price Range Filtering
- Query parameters: `min_price` and `max_price`.
- Parameterized SQL conditions (`price >= $1 AND price <= $2`).
- Validates that `max_price` cannot be less than `min_price`.

### 6. Health & Diagnostics
- `GET /health` endpoint inspects the active database connection pool, measures system uptime, and reports overall service health (`UP` / `DEGRADED`).

---

## Architecture & Folder Structure

```
backend/
├── config/
│   └── db.js                   # PostgreSQL connection pool & health checker
├── controllers/
│   └── bookController.js       # HTTP request handlers & JSON response formatting
├── database/
│   ├── schema.sql              # Table creation, indexes, and timestamp triggers
│   ├── seed.sql                # 20 diverse seed books for testing
│   └── initDb.js               # CLI script to automatically run schema and seeds
├── middleware/
│   ├── errorMiddleware.js      # Global 404 handler and 500 error interception
│   └── validationMiddleware.js # express-validator results formatter (HTTP 400)
├── routes/
│   └── bookRoutes.js           # Endpoint route mappings and middleware binding
├── services/
│   └── bookService.js          # Business logic, query construction, and DB queries
├── tests/
│   ├── book.test.js            # Automated Jest & Supertest test suite (29 tests)
│   └── postman_collection.json # Exportable Postman collection with test assertions
├── validators/
│   └── bookValidator.js        # Express-validator validation chains
├── .env.example                # Template for environment variables
├── .gitignore                  # Git ignore rules for node_modules, logs, .env
├── package.json                # Project dependencies and operational scripts
├── server.js                   # Application bootstrap, Express config, and lifecycle
└── README.md                   # Full documentation
```

---

## Database Schema & Design

### Table: `books`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Auto-incrementing unique identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Book title (1 to 255 characters) |
| `author` | `VARCHAR(255)` | `NOT NULL` | Author name (1 to 255 characters) |
| `price` | `NUMERIC(10, 2)` | `NOT NULL`, `CHECK (price >= 0)` | Price with 2 decimal precision (non-negative) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Auto-updated on every modification via trigger |

### Indexes
- `idx_books_title`: Accelerates partial search queries (`search_q`).
- `idx_books_price`: Accelerates price filtering (`min_price`, `max_price`) and price sorting.
- `idx_books_author`: Accelerates author-based queries.
- `idx_books_created_at`: Accelerates timestamp ordering.

---

## API Endpoint Documentation

### Base URL: `http://localhost:5000` (or your deployed cloud URL)

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health & DB connection check | `200`, `503` |
| `GET` | `/` | API overview and documentation routes | `200` |
| `POST` | `/api/books` | Create a new book record | `201`, `400`, `500` |
| `GET` | `/api/books` | Retrieve books (search, filter, sort, paginate) | `200`, `400`, `500` |
| `GET` | `/api/books/:id` | Retrieve a specific book by ID | `200`, `400`, `404`, `500` |
| `PUT` | `/api/books/:id` | Update an existing book by ID | `200`, `400`, `404`, `500` |
| `DELETE` | `/api/books/:id` | Delete a book by ID | `200`, `400`, `404`, `500` |

---

## Query Parameters & Filtering Examples

### 1. Partial Search by Title
```http
GET /api/books?search_q=python
```
Matches titles like "Python Crash Course", "Fluent Python", "Learning Python".

### 2. Price Filtering
```http
GET /api/books?min_price=20&max_price=50
```
Returns books whose price satisfies: `price >= 20.00 AND price <= 50.00`.

### 3. Sorting with Whitelisted Columns
```http
GET /api/books?order_by=price&order=DESC
```
Sorts books by price from highest to lowest. Whitelist: `id`, `title`, `author`, `price`, `created_at`, `updated_at`.

### 4. Pagination
```http
GET /api/books?limit=5&offset=10
```
Skips the first 10 records and returns the next 5 records (Page 3).

### 5. Combined Advanced Query
```http
GET /api/books?search_q=data&min_price=25&max_price=70&order_by=price&order=ASC&limit=5&offset=0
```

---

## HTTP Status Codes & Response Standards

Every response adheres to a predictable JSON format.

### Success Response (`200 OK` or `201 Created`)
```json
{
  "message": "Book created successfully",
  "data": {
    "id": 1,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "price": "37.50",
    "created_at": "2026-11-08T16:00:00.000Z",
    "updated_at": "2026-11-08T16:00:00.000Z"
  }
}
```

### List Response with Pagination (`200 OK`)
```json
{
  "message": "Books retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "total": 20,
    "limit": 10,
    "offset": 0,
    "count": 10,
    "total_pages": 2,
    "current_page": 1,
    "has_next": true,
    "has_previous": false
  }
}
```

### Validation Error Response (`400 Bad Request`)
```json
{
  "message": "Validation failed: Invalid input provided",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a valid non-negative number (0 or greater).",
      "value": -15,
      "location": "body"
    }
  ]
}
```

### Not Found Response (`404 Not Found`)
```json
{
  "message": "Book not found with ID: 999999",
  "data": null
}
```

### Server Error (`500 Internal Server Error`)
```json
{
  "message": "Database connection error. Please ensure the database server is running and reachable.",
  "data": null
}
```

---

## Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later)
- PostgreSQL (Local instance OR free cloud instance from [Neon](https://neon.tech))

### Step-by-Step Setup

1. **Clone or Navigate to the Project:**
   ```bash
   cd "LAB-03 BACKEND DEVELOPMENT/backend"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to create your active `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your database details.

4. **Initialize Database Schema & Sample Records:**
   Run the included database migration script:
   ```bash
   npm run db:init
   ```
   This executes `schema.sql` and `seed.sql` automatically, creating the tables, triggers, indexes, and inserting 20 sample books.

---

## Environment Configuration

Sample `.env` file configuration:

```env
# Server Port
PORT=5000
NODE_ENV=development

# Database Connection (Neon Cloud or Local PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:your_password@ep-cool-cloud.us-east-2.aws.neon.tech/neondb?sslmode=require

# Individual settings (used if DATABASE_URL is not set)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookdb
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Security
CORS_ORIGIN=*
```

---

## Running the Application

### Development Mode (with auto-reload via Nodemon):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Verify Server Health:
Open your browser or terminal:
```bash
curl http://localhost:5000/health
```

---

## Debugging & Resilience

The project includes built-in safeguards for common developer mistakes and operational failures:

1. **`EADDRINUSE` Port Conflicts:**
   The server listens for `error` events. If the configured port is occupied, it logs an actionable error message instructing you to terminate the blocking process or adjust `PORT` in `.env`, rather than crashing ungracefully.

2. **PostgreSQL Connection Failures:**
   Catches specific PostgreSQL error codes (`ECONNREFUSED`, `28P01` auth failures, `3D000` missing database, SSL negotiation issues) and logs readable troubleshooting advice.

3. **Missing `await` & Unhandled Promise Rejections:**
   Every asynchronous controller method is wrapped with `try/catch` delegating to Express `next(error)` and centralized middleware.

4. **Query Parameter Tampering:**
   Query parameters are validated and coerced by `express-validator`. Dynamic column sorting relies strictly on the `ALLOWED_SORT_COLUMNS` whitelist.

5. **Graceful Shutdown:**
   Catches `SIGINT` (Ctrl+C) and `SIGTERM` signals to cleanly drain and terminate the PostgreSQL connection pool before the process exits.

---

## Automated Testing & Postman Instructions

### 1. Run Automated Unit & Integration Tests
The project includes a 29-test automated test suite testing every endpoint, validation rule, query parameter, and HTTP status code using Jest and Supertest.

To run the test suite:
```bash
npm test
```

### 2. Postman Testing Collection
A ready-to-import Postman collection is located at:
`backend/tests/postman_collection.json`

#### How to Import & Run in Postman:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop `backend/tests/postman_collection.json` (or click **Choose Files**).
4. Select the collection **"Advanced Book Management REST API"**.
5. The collection variable `{{baseUrl}}` defaults to `http://localhost:5000`. If you deploy online, simply change `{{baseUrl}}` to your Render URL (e.g., `https://your-api.onrender.com`).
6. Click **Run Collection** to automatically execute all 20+ test cases with built-in assertions!

---

## Deployment Guide (GitHub + Neon + Render)

Follow these step-by-step instructions to deploy your API publicly online:

### Step 1: Push Source Code to GitHub
1. Initialize git in your project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Advanced Book Management REST API"
   ```
2. Create a new repository on [GitHub](https://github.com).
3. Link your remote repository and push:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
   *(Ensure `.env` is ignored by `.gitignore` so your credentials are never exposed!)*

### Step 2: Create a Cloud PostgreSQL Database on Neon
1. Go to [Neon.tech](https://neon.tech) and sign up for a free account.
2. Create a new project (e.g. `book-management-db`).
3. Neon will display your **Connection Details**.
4. Copy the **Connection String** (`DATABASE_URL`), which looks like:
   `postgresql://neondb_owner:xxxx@ep-cool-cloud.us-east-2.aws.neon.tech/neondb?sslmode=require`
5. On your local machine, temporarily set this `DATABASE_URL` in your `.env` and run:
   ```bash
   npm run db:init
   ```
   This will instantly create the `books` table, indexes, triggers, and seed data directly on your Neon cloud database!

### Step 3: Deploy Backend Service to Render
1. Go to [Render.com](https://render.com) and create an account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name:** `advanced-book-api`
   - **Region:** Select the region closest to your Neon database (e.g., Ohio or Frankfurt).
   - **Branch:** `main`
   - **Root Directory:** `backend` *(if the project is inside the backend folder)* or leave blank if at root.
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `your_neon_connection_string_here`
   - `DB_SSL` = `true`
6. Click **Deploy Web Service**.
7. Once deployment finishes, Render provides your **Public API URL**:
   `https://advanced-book-api.onrender.com`

### Step 4: Verify Your Deployed API
Test your live cloud API:
- **Health Check:** `https://your-api.onrender.com/health`
- **Retrieve Books:** `https://your-api.onrender.com/api/books`
- **Search Books:** `https://your-api.onrender.com/api/books?search_q=python`

