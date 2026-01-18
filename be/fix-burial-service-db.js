#!/usr/bin/env node

/**
 * This script runs all necessary database migrations to fix the burial service creation issue
 * The 500 error occurs because of foreign key constraint issues when trying to insert NULL member_id
 */

const { query } = require('./database/db');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  console.log('🔧 Starting burial service database fixes...\n');

  try {
    // Migration 1: Drop foreign key constraint if it exists
    console.log('📌 Step 1: Dropping foreign key constraint on member_id...');
    try {
      const result = await query(`
        ALTER TABLE \`tbl_burialservice\` 
        DROP FOREIGN KEY \`fk_burial_service_member\`;
      `);
      console.log('✅ Foreign key constraint dropped successfully\n');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  Foreign key constraint does not exist (already dropped)\n');
      } else if (err.code === 'ECONNREFUSED') {
        console.log('❌ Cannot connect to database. Please ensure MySQL is running.\n');
        console.log('   Connection details:');
        console.log(`   - Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`   - Port: ${process.env.DB_PORT || '3306'}`);
        console.log(`   - User: ${process.env.DB_USER || 'root'}`);
        console.log(`   - Database: ${process.env.DB_NAME || 'bbek_church'}\n`);
        throw err;
      } else {
        throw err;
      }
    }

    // Migration 2: Make member_id nullable
    console.log('📌 Step 2: Making member_id nullable...');
    await query(`
      ALTER TABLE \`tbl_burialservice\` 
      MODIFY COLUMN \`member_id\` VARCHAR(45) NULL;
    `);
    console.log('✅ member_id column is now nullable\n');

    // Migration 3: Rename pastor_id to pastor_name if needed
    console.log('📌 Step 3: Checking if pastor_id column needs to be renamed to pastor_name...');
    const [columns] = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tbl_burialservice'
        AND COLUMN_NAME IN ('pastor_id', 'pastor_name')
    `);

    const hasPastorId = columns.some(col => col.COLUMN_NAME === 'pastor_id');
    const hasPastorName = columns.some(col => col.COLUMN_NAME === 'pastor_name');

    if (hasPastorId && !hasPastorName) {
      console.log('  - Found pastor_id, renaming to pastor_name...');
      await query(`
        ALTER TABLE \`tbl_burialservice\` 
        CHANGE COLUMN \`pastor_id\` \`pastor_name\` VARCHAR(45) NULL;
      `);
      console.log('✅ pastor_id renamed to pastor_name\n');
    } else if (hasPastorName) {
      console.log('✅ pastor_name column already exists\n');
    } else {
      console.log('⚠️  Neither pastor_id nor pastor_name column found, adding pastor_name...\n');
      await query(`
        ALTER TABLE \`tbl_burialservice\` 
        ADD COLUMN \`pastor_name\` VARCHAR(45) NULL AFTER \`location\`;
      `);
      console.log('✅ pastor_name column added\n');
    }

    // Migration 4: Verify final table structure
    console.log('📌 Step 4: Verifying final table structure...');
    const [finalColumns] = await query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_KEY
      FROM 
        INFORMATION_SCHEMA.COLUMNS
      WHERE 
        TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tbl_burialservice'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n📋 Table structure:');
    console.table(finalColumns);

    console.log('\n✅ All burial service database fixes completed successfully!');
    console.log('\n🎯 You can now create burial service records for non-members.\n');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
