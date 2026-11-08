const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection, pool } = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. Security & Utility Middleware
// ==========================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (skip during automated tests to keep test output clean)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ==========================================
// 2. Health & Base Routes
// ==========================================

/**
 * @route   GET /health
 * @desc    System & Database Health Check Endpoint
 * @access  Public
 */
app.get('/health', async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  let dbError = null;

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbStatus = 'CONNECTED';
  } catch (err) {
    dbStatus = 'ERROR';
    dbError = err.message;
  }

  const isHealthy = dbStatus === 'CONNECTED';

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    database: {
      status: dbStatus,
      ...(dbError && { error: dbError }),
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @route   GET /
 * @desc    API Root Information
 * @access  Public
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Advanced Book Management REST API',
    version: '1.0.0',
    documentation: {
      health: 'GET /health',
      books: {
        list_and_search: 'GET /api/books?search_q=&order_by=&order=&limit=&offset=&min_price=&max_price=',
        get_single: 'GET /api/books/:id',
        create: 'POST /api/books',
        update: 'PUT /api/books/:id',
        delete: 'DELETE /api/books/:id',
      },
    },
  });
});

// ==========================================
// 3. API Routes
// ==========================================
app.use('/api/books', bookRoutes);

// ==========================================
// 4. Error Handling Middleware
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// 5. Server Startup & Debugging Lifecycle
// ==========================================
let server;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, async () => {
    console.log('====================================================');
    console.log(`🚀 Advanced Book Management API is running on port ${PORT}`);
    console.log(`📡 Base URL: http://localhost:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Books API: http://localhost:${PORT}/api/books`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('====================================================');

    // Test database connection at startup
    await testConnection();
  });

  // Handle common server errors (e.g. EADDRINUSE port conflict)
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ [Port Conflict]: Port ${PORT} is already in use by another process.`);
      console.error(`👉 Hint: Change the PORT variable in your .env file or terminate the process using port ${PORT}.`);
    } else {
      console.error('❌ [Server Initialization Error]:', error);
    }
    process.exit(1);
  });

  // Graceful shutdown on SIGTERM / SIGINT signals
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 [${signal}] signal received. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      try {
        await pool.end();
        console.log('🔌 PostgreSQL pool drained and closed.');
      } catch (err) {
        console.error('Error closing database pool:', err.message);
      }
      process.exit(0);
    });

    // Force shutdown if cleanup takes more than 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;

