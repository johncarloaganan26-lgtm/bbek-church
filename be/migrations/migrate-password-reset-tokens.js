#!/usr/bin/env node
/**
 * Migration: Add used_at column and cleanup routine for password reset tokens
 * Purpose: 
 *   1. Add used_at column to track token usage
 *   2. Setup automatic cleanup of expired/used tokens
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'church_records',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  connectTimeout: 30000,
});

async function runMigration() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('✅ Connected to database');

    // Check if used_at column already exists
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tbl_password_reset_tokens' AND COLUMN_NAME = 'used_at'"
    );

    if (columns.length > 0) {
      console.log('ℹ️  used_at column already exists, skipping column creation');
    } else {
      console.log('📝 Adding used_at column to tbl_password_reset_tokens...');
      
      await connection.query(`
        ALTER TABLE \`tbl_password_reset_tokens\` 
        ADD COLUMN \`used_at\` DATETIME NULL COMMENT 'Timestamp when token was successfully used for password reset' AFTER \`expires_at\`
      `);
      console.log('✅ Column added successfully');

      // Create index for performance
      await connection.query(`
        CREATE INDEX \`idx_used_at\` ON \`tbl_password_reset_tokens\` (\`used_at\`)
      `);
      console.log('✅ Index created successfully');
    }

    // Cleanup old tokens (optional - can be scheduled as cron job)
    console.log('🧹 Cleaning up expired/used tokens...');
    const [result] = await connection.query(`
      DELETE FROM tbl_password_reset_tokens 
      WHERE expires_at <= NOW() OR (used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
    `);
    console.log(`✅ Cleaned up ${result.affectedRows} old tokens`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test password reset flow to ensure tokens work correctly');
    console.log('2. Verify that tokens cannot be reused after successful password reset');
    console.log('3. Verify that expired tokens show proper error message');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
    }
    await pool.end();
  }
}

// Run migration
runMigration();
