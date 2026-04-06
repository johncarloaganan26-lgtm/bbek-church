const mysql = require('mysql2/promise');

async function listTables() {
  const dbConfig = {
    host: 'bryfbawdw5ngbh2tmkdf-mysql.services.clever-cloud.com',
    port: 20244,
    user: 'ui76bvg5zzzcsfsu',
    password: 'nePK3UhOAOBKnC4dVVEb',
    database: 'bryfbawdw5ngbh2tmkdf',
    ssl: {
      rejectUnauthorized: false
    }
  };
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SHOW TABLES');
    const tableNames = rows.map(r => Object.values(r)[0]);
    console.log('Tables:', tableNames.join(', '));
    
    const cmsTables = tableNames.filter(name => name.startsWith('tbl_cms'));
    console.log('CMS Tables:', cmsTables.join(', '));
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listTables();
