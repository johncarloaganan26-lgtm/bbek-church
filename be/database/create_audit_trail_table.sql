-- Create the missing audit trail table
CREATE TABLE
IF
  NOT EXISTS tbl_audit_trail (
    id INT AUTO_INCREMENT PRIMARY KEY
    , user_id VARCHAR(45)
    , user_email VARCHAR(100)
    , user_name VARCHAR(255)
    , user_position VARCHAR(100)
    , action_type VARCHAR(50)
    , entity_type VARCHAR(50)
    , entity_id VARCHAR(45)
    , description TEXT
    , ip_address VARCHAR(45)
    , user_agent TEXT
    , old_values JSON
    , new_values JSON
    , status VARCHAR(50)
    , error_message TEXT
    , date_created VARCHAR(45)
  );

  -- Create index for better performance
  CREATE INDEX idx_audit_trail_entity
  ON tbl_audit_trail (entity_type, entity_id);
  CREATE INDEX idx_audit_trail_user
  ON tbl_audit_trail (user_id);
  CREATE INDEX idx_audit_trail_date
  ON tbl_audit_trail (date_created);