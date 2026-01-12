require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { query } = require('./database/db');

async function createAuditTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS tbl_audit_trail (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(45),
        user_email VARCHAR(100),
        user_name VARCHAR(255),
        user_position VARCHAR(100),
        action_type VARCHAR(50),
        entity_type VARCHAR(50),
        entity_id VARCHAR(45),
        description TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        old_values JSON,
        new_values JSON,
        status VARCHAR(50),
        error_message TEXT,
        date_created VARCHAR(45)
      );
    `;
    
    await query(sql);
    console.log('✅ Audit trail table created successfully');
    
    // Create indexes
    const indexes = [
      'CREATE INDEX idx_audit_trail_entity ON tbl_audit_trail (entity_type, entity_id)',
      'CREATE INDEX idx_audit_trail_user ON tbl_audit_trail (user_id)',
      'CREATE INDEX idx_audit_trail_date ON tbl_audit_trail (date_created)'
    ];
    
    for (const indexSql of indexes) {
      await query(indexSql);
    }
    
    console.log('✅ Audit trail indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating audit trail table:', error.message);
  }
}

createAuditTable();