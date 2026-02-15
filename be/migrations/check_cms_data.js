const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCmsData() {
  try {
    const dbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? {} : false,
    };
    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      'SELECT content_json FROM tbl_cms_home WHERE page_name = ?',
      ['home']
    );

    if (rows.length > 0) {
      const content = JSON.parse(rows[0].content_json);
      console.log('Current CMS data keys:', Object.keys(content));
      console.log('Button-related fields:');
      Object.keys(content).forEach(key => {
        if (key.includes('button') || key.includes('Button')) {
          console.log('  ', key, ':', content[key]);
        }
      });
    } else {
      console.log('No home CMS data found');
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCmsData();