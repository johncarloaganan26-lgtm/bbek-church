-- =====================================================
-- CREATE: tbl_system_logs table v2
-- Raw Data Only Storage - All fields store plain text
-- =====================================================

CREATE TABLE
IF
  NOT EXISTS `tbl_system_logs` (
    `log_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Primary key'
    , `user_email` VARCHAR(255) NULL COMMENT 'User email only - no user_id, name, or position'
    , `action_type` VARCHAR(50) NOT NULL COMMENT 'Action: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, VIEW_LIST (no single VIEW)'
    , `entity_type` VARCHAR(100) NOT NULL COMMENT 'Entity type as readable text (e.g., "Member", "Water Baptism")'
    , `entity_name` VARCHAR(255) NULL COMMENT 'Entity name/identifier as plain text (e.g., "John Doe" instead of ID 123)'
    , `description` TEXT NULL COMMENT 'Full description of the action including API route and what happened'
    , `ip_address` VARCHAR(45) NULL COMMENT 'IP address'
    , `status` VARCHAR(45) NOT NULL DEFAULT 'success' COMMENT 'Status: success, failed, error'
    , `error_message` TEXT NULL COMMENT 'Error details if failed'
    , `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When action occurred'
    , PRIMARY KEY (`log_id`)
    , INDEX `idx_email` (`user_email`)
    , INDEX `idx_action` (`action_type`)
    , INDEX `idx_entity` (`entity_type`)
    , INDEX `idx_status` (`status`)
    , INDEX `idx_date` (`date_created`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'System logs v2 - All data stored as plain text, minimal fields';

  -- =====================================================
  -- SAMPLE DATA (how records will look)
  -- =====================================================
  /*
     INSERT INTO tbl_system_logs (user_email, action_type, entity_type, entity_name, description, ip_address, status) VALUES
     ('admin@church.com', 'CREATE', 'Member', 'John Doe', 'Created new member via POST /api/church-records/members/createMember', '192.168.1.1', 'success'),
     ('pastor@church.com', 'UPDATE', 'Water Baptism', 'Jane Smith', 'Updated water baptism status from pending to approved via PUT /api/services/waterBaptism/updateStatus/456', '192.168.1.2', 'success'),
     ('admin@church.com', 'DELETE', 'Event', 'Summer Camp 2024', 'Deleted event via DELETE /api/church-records/events/deleteEvent/789', '192.168.1.1', 'success'),
     ('member@church.com', 'LOGIN', 'System', 'Login', 'User logged in via POST /api/church-records/accounts/login', '192.168.1.100', 'success');
     */