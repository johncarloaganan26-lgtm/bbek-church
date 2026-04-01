const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api'; // I'll assume it's 5000

async function testCreateSlot() {
  try {
    // Need a token
    console.log('Testing create slot...');
    
    // Actually, I'll just run a node script that calls the db query directly to see if it works
    const { query } = require('./database/db');
    
    const result = await query(
      'INSERT INTO tbl_service_slots (service_type, available_date, available_time, max_slots, status, date_created) VALUES (?, ?, ?, ?, \'Available\', NOW())',
      ['bible_study', '2026-05-01', '09:00:00', 10]
    );
    
    console.log('✅ Insertion successful!', result);
    
  } catch (err) {
    console.error('❌ Insertion failed:', err);
  } finally {
    process.exit();
  }
}

testCreateSlot();
