-- Complete script to drop and recreate announcements tables with JSON audience support

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE
IF
  EXISTS tbl_user_announcements;
  DROP TABLE
  IF
    EXISTS tbl_announcements;
    DROP TABLE
    IF
      EXISTS tbl_announcements_backup;

      -- Re-enable foreign key checks
      SET FOREIGN_KEY_CHECKS = 1;

      -- Create announcements table with JSON target_audience
      CREATE TABLE
      IF
        NOT EXISTS `tbl_announcements` (
          `announcement_id` INT NOT NULL AUTO_INCREMENT
          , `title` VARCHAR(255) NOT NULL COMMENT 'Title of the announcement'
          , `content` TEXT NOT NULL COMMENT 'Content/body of the announcement'
          , `type` VARCHAR(50) NOT NULL DEFAULT 'info' COMMENT 'Type: info, warning, success, error'
          , `priority` VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT 'Priority: low, normal, high, urgent'
          , `target_audience` JSON NOT NULL COMMENT 'Target audiences as JSON array: ["all"], ["admin","pastor"], ["member"], ["non_member"], etc.'
          , `start_date` DATETIME NULL COMMENT 'Start date when announcement should be shown'
          , `end_date` DATETIME NULL COMMENT 'End date when announcement should stop showing'
          , `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether the announcement is active'
          , `created_by` VARCHAR(45) NULL COMMENT 'User ID who created the announcement (from tbl_accounts)'
          , `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when announcement was created'
          , `updated_at` DATETIME NULL DEFAULT NULL
          ON
          UPDATE
            CURRENT_TIMESTAMP COMMENT 'Timestamp when announcement was last updated'
            , PRIMARY KEY (`announcement_id`)
            , INDEX `idx_is_active` (`is_active`)
            , INDEX `idx_start_date` (`start_date`)
            , INDEX `idx_end_date` (`end_date`)
            , INDEX `idx_created_at` (`created_at`)
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Announcements table for system-wide messages';

        -- Create user announcement tracking table
        CREATE TABLE
        IF
          NOT EXISTS `tbl_user_announcements` (
            `tracking_id` INT NOT NULL AUTO_INCREMENT
            , `announcement_id` INT NOT NULL COMMENT 'Reference to tbl_announcements'
            , `user_id` VARCHAR(45) NOT NULL COMMENT 'User ID who viewed the announcement (from tbl_accounts)'
            , `viewed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when user viewed the announcement'
            , PRIMARY KEY (`tracking_id`)
            , UNIQUE KEY `unique_user_announcement` (`announcement_id`, `user_id`)
            , INDEX `idx_announcement_id` (`announcement_id`)
            , INDEX `idx_user_id` (`user_id`)
            , INDEX `idx_viewed_at` (`viewed_at`)
            , CONSTRAINT `fk_user_announcement_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `tbl_announcements` (`announcement_id`)
            ON DELETE CASCADE
          ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Tracks which users have viewed which announcements';

          -- Insert sample data to test JSON functionality
          INSERT INTO
            tbl_announcements (
              title
              , content
              , type
              , priority
              , target_audience
              , is_active
            )
          VALUES
            (
              'Welcome to BBEK Church'
              , 'Welcome all new members to our church community!'
              , 'success'
              , 'normal'
              , '["all"]'
              , 1
            )
            , (
              'Admin Only: System Maintenance'
              , 'Scheduled maintenance this weekend'
              , 'warning'
              , 'high'
              , '["admin"]'
              , 1
            )
            , (
              'Staff Meeting'
              , 'Weekly staff meeting on Friday at 2 PM'
              , 'info'
              , 'normal'
              , '["admin","staff"]'
              , 1
            )
            , (
              'Member Exclusive Event'
              , 'Special prayer meeting for members only'
              , 'info'
              , 'normal'
              , '["member"]'
              , 1
            )
            , (
              'Public Service Announcement'
              , 'Church parking lot will be closed for resurfacing'
              , 'warning'
              , 'urgent'
              , '["all","non_member"]'
              , 1
            );

          -- Verify the data
          SELECT
            announcement_id
            , title
            , target_audience
            , JSON_VALID(target_audience) as is_valid_json
          FROM
            tbl_announcements;