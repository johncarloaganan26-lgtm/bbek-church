const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'bbekdb',
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
  enableKeepAlive: true
};

async function testPool() {
  try {
    console.log('Testing pool with dbConfig...');
    const pool = mysql.createPool(dbConfig);
    const [rows] = await pool.query('SELECT 1 + 1 as res');
    console.log('✅ Pool query successful! Result:', rows[0].res);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Pool test failed:', err.code, err.message);
    process.exit(1);
  }
}

testPool();
