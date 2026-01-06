-- =====================================================
-- MIGRATION: Update existing tbl_audit_trail to v2
-- Converts table to raw data only storage
-- =====================================================

-- Step 1: Drop unused columns (one at a time for MySQL compatibility)
ALTER TABLE `tbl_audit_trail`
DROP COLUMN
IF
  EXISTS `user_id`;
  ALTER TABLE `tbl_audit_trail`
  DROP COLUMN
  IF
    EXISTS `user_name`;
    ALTER TABLE `tbl_audit_trail`
    DROP COLUMN
    IF
      EXISTS `user_position`;
      ALTER TABLE `tbl_audit_trail`
      DROP COLUMN
      IF
        EXISTS `user_agent`;
        ALTER TABLE `tbl_audit_trail`
        DROP COLUMN
        IF
          EXISTS `old_values`;
          ALTER TABLE `tbl_audit_trail`
          DROP COLUMN
          IF
            EXISTS `new_values`;

            -- Step 2: Rename entity_id to entity_name and change to VARCHAR(255)
            ALTER TABLE `tbl_audit_trail` CHANGE COLUMN `entity_id` `entity_name` VARCHAR(255) NULL COMMENT 'Entity name/identifier as plain text (e.g., "John Doe" instead of ID 123)';

            -- Step 3: Update column comments
            ALTER TABLE `tbl_audit_trail` MODIFY COLUMN `user_email` VARCHAR(255) NULL COMMENT 'User email only - no user_id, name, or position'
            , MODIFY COLUMN `action_type` VARCHAR(50) NOT NULL COMMENT 'Action: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, VIEW_LIST (no single VIEW)'
            , MODIFY COLUMN `entity_type` VARCHAR(100) NOT NULL COMMENT 'Entity type as readable text (e.g., "Member", "Water Baptism")'
            , MODIFY COLUMN `description` TEXT NULL COMMENT 'Full description of the action including API route and what happened'
            , MODIFY COLUMN `ip_address` VARCHAR(45) NULL COMMENT 'IP address'
            , MODIFY COLUMN `status` VARCHAR(45) NOT NULL DEFAULT 'success' COMMENT 'Status: success, failed, error'
            , MODIFY COLUMN `error_message` TEXT NULL COMMENT 'Error details if failed'
            , MODIFY COLUMN `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When action occurred';

            -- Step 4: Update table comment
            ALTER TABLE `tbl_audit_trail` COMMENT = 'Audit trail v2 - All data stored as plain text, minimal fields';

            -- Step 5: Drop old indexes and create new ones
            ALTER TABLE `tbl_audit_trail`
            DROP INDEX
            IF
              EXISTS `idx_user_id`
              , DROP INDEX
              IF
                EXISTS `idx_entity_id`
                , DROP INDEX
                IF
                  EXISTS `idx_description`;

                  -- Step 6: Add new indexes
                  ALTER TABLE `tbl_audit_trail` ADD INDEX `idx_email` (`user_email`)
                  , ADD INDEX `idx_action` (`action_type`)
                  , ADD INDEX `idx_entity` (`entity_type`)
                  , ADD INDEX `idx_status` (`status`)
                  , ADD INDEX `idx_date` (`date_created`);

                  -- =====================================================
                  -- SAMPLE DATA (how new records will look)
                  -- =====================================================
                  /*
                     INSERT INTO tbl_audit_trail (user_email, action_type, entity_type, entity_name, description, ip_address, status) VALUES
                     ('admin@church.com', 'CREATE', 'Member', 'John Doe', 'Created new member via POST /api/church-records/members/createMember', '192.168.1.1', 'success'),
                     ('pastor@church.com', 'UPDATE', 'Water Baptism', 'Jane Smith', 'Updated water baptism status from pending to approved via PUT /api/services/waterBaptism/updateStatus/456', '192.168.1.2', 'success'),
                     ('admin@church.com', 'DELETE', 'Event', 'Summer Camp 2024', 'Deleted event via DELETE /api/church-records/events/deleteEvent/789', '192.168.1.1', 'success'),
                     ('member@church.com', 'LOGIN', 'System', 'Login', 'User logged in via POST /api/church-records/accounts/login', '192.168.1.100', 'success');
                     */