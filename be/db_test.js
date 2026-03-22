const { query } = require('./database/db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const [rows] = await query('SELECT 1 + 1 as result');
    console.log('✅ Database connected successfully. Result:', rows[0].result);
    
    console.log('Testing tbl_churchleaders existence...');
    const [leaders] = await query('SELECT COUNT(*) as count FROM tbl_churchleaders');
    console.log('✅ tbl_churchleaders exists. Count:', leaders[0].count);

    console.log('Testing tbl_department_officers existence...');
    const [officers] = await query('SELECT COUNT(*) as count FROM tbl_department_officers');
    console.log('✅ tbl_department_officers exists. Count:', officers[0].count);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
       console.error('💡 Connection Refused. Is MySQL running?');
    }
    process.exit(1);
  }
}

testConnection();
