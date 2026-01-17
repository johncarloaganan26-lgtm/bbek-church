-- Create password reset tokens table
-- Updated to use accurate Philippine time (UTC+8) for all datetime fields
CREATE TABLE
IF
  NOT EXISTS `tbl_password_reset_tokens` (
    `id` INT NOT NULL AUTO_INCREMENT
    , `acc_id` INT NOT NULL COMMENT 'Account ID from tbl_accounts'
    , `token` VARCHAR(255) NOT NULL COMMENT 'Reset token'
    , `expires_at` DATETIME NOT NULL COMMENT 'Token expiration time (Philippine Time - UTC+8)'
    , `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Token creation time (Philippine Time - UTC+8)'
    , `used_at` DATETIME NULL COMMENT 'Timestamp when token was successfully used (Philippine Time - UTC+8)'
    , PRIMARY KEY (`id`)
    , UNIQUE KEY `unique_token` (`token`)
    , UNIQUE KEY `unique_account` (`acc_id`)
    , INDEX `idx_expires_at` (`expires_at`)
    , INDEX `idx_acc_id` (`acc_id`)
    , INDEX `idx_used_at` (`used_at`)
    , CONSTRAINT `fk_reset_token_account` FOREIGN KEY (`acc_id`) REFERENCES `tbl_accounts` (`acc_id`)
    ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Password reset tokens for secure password recovery with Philippine time support';