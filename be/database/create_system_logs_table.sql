-- Create System Logs Table
-- This table stores all user actions for monitoring and security purposes

CREATE TABLE
IF
  NOT EXISTS `system_logs` (
    `log_id` INT(11) NOT NULL AUTO_INCREMENT
    , `user_id` INT(11) NULL
    , `user_name` VARCHAR(100) NOT NULL
    , `role` VARCHAR(50) NOT NULL
    , `action` VARCHAR(50) NOT NULL
    , -- (Login, Logout, Create, Update, Delete, View, Print, Export)
      `page` VARCHAR(100) NOT NULL
    , -- (Member Page, Marriage Page, Events Page, etc.)
      `description` TEXT NOT NULL
    , -- e.g. "Admin updated member record of John Doe"
      `ip_address` VARCHAR(45) NULL
    , -- optional but helpful
      `device_info` VARCHAR(255) NULL
    , -- optional, can be left blank
      `date_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    , PRIMARY KEY (`log_id`)
    , INDEX `idx_system_logs_user` (`user_id`)
    , INDEX `idx_system_logs_date` (`date_time`)
    , INDEX `idx_system_logs_action` (`action`)
    , INDEX `idx_system_logs_page` (`page`)
    , INDEX `idx_system_logs_role` (`role`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;