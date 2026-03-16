const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDb() {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {} : false,
  };
  
  console.log('Connecting to:', dbConfig.host, dbConfig.database);
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const [tables] = await connection.execute("SHOW TABLES LIKE 'tbl_cms_%'");
    console.log('Existing CMS tables:', tables.map(t => Object.values(t)[0]));
    
    const requiredTables = ['tbl_cms_systemsettings'];
    
    for (const table of requiredTables) {
      const exists = tables.some(t => Object.values(t)[0] === table);
      if (!exists) {
        console.log(`Creating table ${table}...`);
        await connection.execute(`
          CREATE TABLE ${table} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            page_name VARCHAR(255) NOT NULL UNIQUE,
            content_json LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log(`Table ${table} created.`);
      }
    }
    
    // Check if system_settings record exists
    const [rows] = await connection.execute("SELECT id FROM tbl_cms_systemsettings WHERE page_name = 'system_settings'");
    if (rows.length === 0) {
      console.log('Inserting default system_settings...');
      await connection.execute(`
        INSERT INTO tbl_cms_systemsettings (page_name, content_json)
        VALUES ('system_settings', ?)
      `, [JSON.stringify({ allow_complete_without_schedule: false })]);
      console.log('Default settings inserted.');
    } else {
      console.log('System settings record already exists.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

checkDb();
