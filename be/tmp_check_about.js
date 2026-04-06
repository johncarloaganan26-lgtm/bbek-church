const mysql = require('mysql2/promise');

async function checkAbout() {
  const dbConfig = {
    host: 'bryfbawdw5ngbh2tmkdf-mysql.services.clever-cloud.com',
    port: 20244,
    user: 'ui76bvg5zzzcsfsu',
    password: 'nePK3UhOAOBKnC4dVVEb',
    database: 'bryfbawdw5ngbh2tmkdf',
    ssl: { rejectUnauthorized: false }
  };
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_cms_about LIMIT 1');
    console.log('About data:', JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAbout();
