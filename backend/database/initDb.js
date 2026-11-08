/**
 * Database Initialization Script
 * Executes schema.sql and seed.sql against the configured PostgreSQL database.
 * Useful for local setup and cloud databases (Neon, Render, Supabase) without requiring psql CLI.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/db');

async function initializeDatabase() {
  console.log('----------------------------------------------------');
  console.log('🔄 Starting Database Schema & Seed Initialization...');
  console.log('----------------------------------------------------');

  try {
    // 1. Verify connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Could not establish database connection. Please check your DB credentials / DATABASE_URL in .env.');
    }

    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    console.log('📄 Executing schema.sql (tables, indexes, triggers)...');
    await pool.query(schemaSql);
    console.log('✅ Database schema created/verified successfully.');

    // 3. Read seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    console.log('🌱 Executing seed.sql (inserting sample books)...');
    await pool.query(seedSql);
    console.log('✅ Seed data inserted successfully.');

    // 4. Verification count
    const res = await pool.query('SELECT COUNT(*) AS total_books FROM books');
    console.log(`📊 Verification: Total books in database: ${res.rows[0].total_books}`);
    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error(error.message);
    if (error.code) {
      console.error(`PostgreSQL Error Code: ${error.code}`);
    }
    process.exitCode = 1;
  } finally {
    // Gracefully close pool
    await pool.end();
    console.log('🔌 Database pool closed.');
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;

