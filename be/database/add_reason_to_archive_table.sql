-- Add reason column to tbl_archives table
-- This allows storing the reason for archiving/deleting records

ALTER TABLE `tbl_archives`
ADD COLUMN `reason` TEXT NULL COMMENT 'Reason for archiving the record' AFTER `archived_by`;