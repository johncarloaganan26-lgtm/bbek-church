const mysql = require('mysql2/promise');

async function checkHome() {
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
    const [rows] = await connection.execute('SELECT * FROM tbl_cms_home LIMIT 1');
    if (rows.length > 0) {
        console.log('Home data content keys:', Object.keys(JSON.parse(rows[0].content_json)));
    }
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkHome();
