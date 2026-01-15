-- Create password reset tokens table
CREATE TABLE
IF
  NOT EXISTS `tbl_password_reset_tokens` (
    `id` INT NOT NULL AUTO_INCREMENT
    , `acc_id` VARCHAR(45) NOT NULL COMMENT 'Account ID from tbl_accounts'
    , `token` VARCHAR(255) NOT NULL COMMENT 'Reset token'
    , `expires_at` DATETIME NOT NULL COMMENT 'Token expiration time'
    , `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Token creation time'
    , PRIMARY KEY (`id`)
    , UNIQUE KEY `unique_token` (`token`)
    , UNIQUE KEY `unique_account` (`acc_id`)
    , INDEX `idx_expires_at` (`expires_at`)
    , INDEX `idx_acc_id` (`acc_id`)
    , CONSTRAINT `fk_reset_token_account` FOREIGN KEY (`acc_id`) REFERENCES `tbl_accounts` (`acc_id`)
    ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Password reset tokens for secure password recovery';