/**
 * Migration: Create Role Permissions Table
 * Purpose: Add permission control system for staff roles on service modules
 * Run: node be/migrations/create_role_permissions.js
 */

const { query } = require('../database/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Create Role Permissions Table...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../database/create_role_permissions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\n📝 Executing: ${statement.substring(0, 60)}...`);
        await query(statement);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Created table: tbl_role_permissions');
    console.log('👥 Default permissions set for: admin, staff, member roles');
    console.log('\nPermission Structure:');
    console.log('  - role: admin, staff, or member');
    console.log('  - service_module: child_dedication, water_baptism, burial_service, discipleship');
    console.log('  - Actions: can_view, can_create, can_update, can_delete');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
