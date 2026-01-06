-- Create tbl_audit_trail table for tracking all user actions
-- This table stores comprehensive audit logs for all actions performed in the system
-- Note: Only stores user_id and user_email (not user_name, user_position) for privacy

CREATE TABLE IF NOT EXISTS `tbl_audit_trail` (
  `audit_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(45) NOT NULL COMMENT 'User/Account ID who performed the action',
  `user_email` VARCHAR(255) NULL COMMENT 'User email address',
  `action_type` VARCHAR(50) NOT NULL COMMENT 'Type of action: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, VIEW_LIST (no single VIEW)',
  `entity_type` VARCHAR(100) NOT NULL COMMENT 'Type of entity affected: member, account, department, ministry, event, approval, tithe, transaction, etc.',
  `entity_id` VARCHAR(45) NULL COMMENT 'ID of the affected entity (if applicable)',
  `description` TEXT NULL COMMENT 'The API route/endpoint that was accessed (e.g., POST /api/church-records/members/createMember)',
  `ip_address` VARCHAR(45) NULL COMMENT 'IP address of the user who performed the action',
  `user_agent` TEXT NULL COMMENT 'User agent/browser information',
  `old_values` TEXT NULL COMMENT 'Previous values before update (for UPDATE actions) - stored as plain text',
  `new_values` TEXT NULL COMMENT 'New values after action (for CREATE/UPDATE actions) - stored as plain text',
  `status` VARCHAR(45) NOT NULL DEFAULT 'success' COMMENT 'Action status: success, failed, error',
  `error_message` TEXT NULL COMMENT 'Error message if action failed',
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the action was performed',
  PRIMARY KEY (`audit_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action_type` (`action_type`),
  INDEX `idx_entity_type` (`entity_type`),
  INDEX `idx_entity_id` (`entity_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_date_created` (`date_created`),
  INDEX `idx_user_email` (`user_email`),
  INDEX `idx_description` (`description`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail table for tracking all user actions and system activities';

