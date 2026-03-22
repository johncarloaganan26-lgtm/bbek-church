const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDirect() {
  try {
    console.log('Testing direct connection...');
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ Connected directly!');
    const [rows] = await conn.query('SELECT 1 + 1 as res');
    console.log('Result:', rows[0].res);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Direct connection failed:', err.code, err.message);
    process.exit(1);
  }
}

testDirect();
