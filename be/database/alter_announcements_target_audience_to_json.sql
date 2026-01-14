-- Alter table to change target_audience column from VARCHAR to JSON
-- Run this BEFORE running the migration script

ALTER TABLE `tbl_announcements` MODIFY COLUMN `target_audience` JSON NOT NULL DEFAULT ('["all"]') COMMENT 'Target audiences as JSON array: ["all"], ["admin","pastor"], ["member"], ["non_member"], etc.';