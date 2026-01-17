-- Migration: Add used_at column to tbl_password_reset_tokens
-- Purpose: Track when a password reset token was actually used to prevent reuse
-- Date: January 2026

ALTER TABLE `tbl_password_reset_tokens`
ADD COLUMN `used_at` DATETIME NULL COMMENT 'Timestamp when token was successfully used for password reset' AFTER `expires_at`;

-- Create index for better query performance
CREATE INDEX `idx_used_at`
ON `tbl_password_reset_tokens` (`used_at`);

-- Add note to schema
ALTER TABLE `tbl_password_reset_tokens` COMMENT = 'Password reset tokens for secure password recovery - tokens are marked as used rather than deleted for audit trail';