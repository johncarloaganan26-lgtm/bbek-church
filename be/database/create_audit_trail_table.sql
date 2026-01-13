-- Create Audit Trail Table
-- This table stores all user activities and system events for accountability and security monitoring

CREATE TABLE
IF
  NOT EXISTS `tbl_audit_trail` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(45) NOT NULL COMMENT 'ID of the user who performed the action',
    `user_email` VARCHAR(100) NOT NULL COMMENT 'Email of the user who performed the action',
    `user_name` VARCHAR(255) NOT NULL COMMENT 'Full name of the user who performed the action',
    `user_position` VARCHAR(100) NOT NULL COMMENT 'Position/role of the user (admin, staff, member)',
    `action_type` VARCHAR(50) NOT NULL COMMENT 'Type of action performed (LOGIN, LOGOUT, VIEW, CREATE, UPDATE, DELETE, PRINT, EXPORT)',
    `module` VARCHAR(100) NOT NULL COMMENT 'Module or page where the action occurred (Members, Events, Services, etc.)',
    `description` TEXT NOT NULL COMMENT 'Detailed description of what was done',
    `entity_type` VARCHAR(50) NULL COMMENT 'Type of entity affected (member, event, transaction, etc.)',
    `entity_id` VARCHAR(45) NULL COMMENT 'ID of the specific entity affected',
    `ip_address` VARCHAR(45) NULL COMMENT 'IP address of the user',
    `user_agent` TEXT NULL COMMENT 'Browser/device information',
    `old_values` JSON NULL COMMENT 'Previous values before update (for UPDATE actions)',
    `new_values` JSON NULL COMMENT 'New values after update (for UPDATE actions)',
    `status` VARCHAR(50) DEFAULT 'success' COMMENT 'Status of the action (success, failed)',
    `error_message` TEXT NULL COMMENT 'Error message if the action failed',
    `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the action occurred',
    -- Indexes for better query performance
    INDEX `idx_audit_trail_entity` (`entity_type`, `entity_id`),
    INDEX `idx_audit_trail_user` (`user_id`),
    INDEX `idx_audit_trail_date` (`date_created`),
    INDEX `idx_audit_trail_action` (`action_type`),
    INDEX `idx_audit_trail_module` (`module`),
    INDEX `idx_audit_trail_status` (`status`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Add table comment
ALTER TABLE `tbl_audit_trail` COMMENT = 'Audit trail table for tracking all user activities and system events';