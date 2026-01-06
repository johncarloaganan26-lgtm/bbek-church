-- Migration: Update audit trail to store plain text data (no Buffers, no IDs)
-- This migration updates the tbl_audit_trail table schema to reflect:
-- 1. entity_id stores plain text descriptions instead of numeric IDs
-- 2. old_values/new_values stored as TEXT (not JSON)
-- 3. Only user_id and user_email stored (no user_name, user_position)
-- 4. Action types: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, VIEW_LIST (no single VIEW)

-- Drop existing FULLTEXT index if it exists
ALTER TABLE `tbl_audit_trail` DROP INDEX IF EXISTS `idx_description`;

-- Update the comment for entity_id column to reflect it stores plain text descriptions
ALTER TABLE `tbl_audit_trail` MODIFY COLUMN `entity_id` VARCHAR(255) NULL COMMENT 'Plain text description of the entity (e.g., "Member", "Water Baptism", "Transaction") - no numeric IDs, just readable text';

-- Update table comment to reflect the new text-only storage approach
ALTER TABLE `tbl_audit_trail` COMMENT = 'Audit trail table for tracking all user actions - all data stored as plain text, minimal user info (email only)';

-- Update action_type column comment
ALTER TABLE `tbl_audit_trail` MODIFY COLUMN `action_type` VARCHAR(50) NOT NULL COMMENT 'Type of action: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, VIEW_LIST (no single VIEW)';

-- Update old_values and new_values columns to use TEXT for better formatted JSON
ALTER TABLE `tbl_audit_trail` MODIFY COLUMN `old_values` TEXT NULL COMMENT 'Previous values before update (for UPDATE actions) - stored as formatted plain text';

ALTER TABLE `tbl_audit_trail` MODIFY COLUMN `new_values` TEXT NULL COMMENT 'New values after action (for CREATE/UPDATE actions) - stored as formatted plain text';

-- Update description column to use TEXT for longer descriptions
ALTER TABLE `tbl_audit_trail` MODIFY COLUMN `description` TEXT NULL COMMENT 'The API route/endpoint that was accessed and plain text description';

-- Add FULLTEXT index for better search performance on description
ALTER TABLE `tbl_audit_trail` ADD FULLTEXT INDEX `idx_description` (`description`(255));