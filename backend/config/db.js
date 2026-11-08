const { Pool } = require('pg');
require('dotenv').config();

/**
 * Configure PostgreSQL connection pool.
 * Supports connection via DATABASE_URL (recommended for Neon & Render)
 * as well as individual environment variables (DB_USER, DB_PASSWORD, etc.).
 */

const isProduction = process.env.NODE_ENV === 'production';
const useSSL = process.env.DB_SSL === 'true' || 
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')) ||
  isProduction;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'bookdb',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

// Catch unexpected errors on idle database clients to prevent crashes
pool.on('error', (err) => {
  console.error('❌ [Database Pool Error]: Unexpected idle client error:', err.message);
});

/**
 * Executes a parameterized SQL query using the pool.
 * @param {string} text - SQL query string with parameter placeholders ($1, $2, etc.)
 * @param {Array} params - Array of parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_SQL === 'true') {
      console.log(`[SQL Query] (${duration}ms):`, text, params);
    }
    return res;
  } catch (error) {
    console.error('❌ [Database Query Error]:', {
      message: error.message,
      query: text,
      params,
      code: error.code,
    });
    throw error;
  }
};

/**
 * Health check test connection to verify database connectivity.
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() AS current_time');
    client.release();
    console.log(`✅ [Database Connected]: PostgreSQL responded at ${res.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ [Database Connection Failed]:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('👉 Hint: Check if your PostgreSQL server is running and the port is correct.');
    } else if (error.code === '28P01') {
      console.error('👉 Hint: Authentication failed. Verify your database username and password.');
    } else if (error.code === '3D000') {
      console.error('👉 Hint: The specified database does not exist. Please create it first.');
    } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
      console.error('👉 Hint: SSL connection error. Ensure ssl is configured correctly for cloud databases.');
    }
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
};

