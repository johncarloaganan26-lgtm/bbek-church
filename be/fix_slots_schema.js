const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { query } = require('./database/db');

async function fixEnum() {
  try {
    console.log('Using DB_HOST:', process.env.DB_HOST);
    console.log('Altering tbl_service_slots ENUM...');
    
    // Add all possible types to be safe
    await query(`
      ALTER TABLE tbl_service_slots 
      MODIFY COLUMN service_type ENUM('salvation', 'baptism', 'water_baptism', 'dedication', 'burial', 'bible_study') NOT NULL
    `);
    
    console.log('✅ ENUM altered successfully!');
    
    // Check if table exists, if not create it
    await query(`
      CREATE TABLE IF NOT EXISTS tbl_service_slots (
        slot_id INT AUTO_INCREMENT PRIMARY KEY,
        service_type ENUM('salvation', 'baptism', 'water_baptism', 'dedication', 'burial', 'bible_study') NOT NULL,
        available_date DATE NOT NULL,
        available_time TIME NOT NULL,
        max_slots INT DEFAULT 1,
        status ENUM('Available', 'Booked', 'Cancelled') DEFAULT 'Available',
        date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_service_date (service_type, available_date)
      )
    `);
    console.log('✅ TABLE verified/created!');
    
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.log('Table not found, creating it...');
      try {
        await query(`
          CREATE TABLE tbl_service_slots (
            slot_id INT AUTO_INCREMENT PRIMARY KEY,
            service_type ENUM('salvation', 'baptism', 'water_baptism', 'dedication', 'burial', 'bible_study') NOT NULL,
            available_date DATE NOT NULL,
            available_time TIME NOT NULL,
            max_slots INT DEFAULT 1,
            status ENUM('Available', 'Booked', 'Cancelled') DEFAULT 'Available',
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_service_date (service_type, available_date)
          )
        `);
        console.log('✅ Table created from scratch!');
      } catch (createErr) {
        console.error('Error creating table:', createErr);
      }
    } else {
      console.error('Error fixing ENUM:', err);
    }
  } finally {
    process.exit();
  }
}

fixEnum();
