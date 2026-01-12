-- Add requester_name and requester_email columns to tbl_burialservice
ALTER TABLE `tbl_burialservice` 
ADD COLUMN `requester_name` VARCHAR(100) NULL AFTER `member_id`,
ADD COLUMN `requester_email` VARCHAR(100) NULL AFTER `requester_name`;

-- Create index on requester_email for faster lookups
CREATE INDEX `idx_requester_email` ON `tbl_burialservice` (`requester_email`);
