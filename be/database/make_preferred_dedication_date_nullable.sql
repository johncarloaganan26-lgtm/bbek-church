-- ============================================
-- Make preferred_dedication_date nullable for member registrations
-- ============================================
-- This script modifies the tbl_childdedications table to allow NULL values
-- for preferred_dedication_date, since members should not provide this date
-- (only admins can set the preferred dedication date)
-- ============================================

-- Alter the preferred_dedication_date column to allow NULL values
ALTER TABLE tbl_childdedications MODIFY COLUMN preferred_dedication_date DATE NULL COMMENT 'Preferred date for the dedication (set by admin only)';

-- ============================================
-- Notes:
-- - This allows member registrations to proceed without a preferred date
-- - Admins can later update the record to set the preferred date
-- - The comment has been updated to clarify it's set by admin only
-- ============================================