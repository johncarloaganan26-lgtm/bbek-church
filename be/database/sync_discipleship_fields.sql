-- 1. Add missing fields to tbl_discipleship_requests (Phase 1)
ALTER TABLE `tbl_discipleship_requests` ADD COLUMN `guardian_name` VARCHAR(100) NULL AFTER `notes`;
ALTER TABLE `tbl_discipleship_requests` ADD COLUMN `guardian_contact` VARCHAR(20) NULL AFTER `guardian_name`;
ALTER TABLE `tbl_discipleship_requests` ADD COLUMN `guardian_relationship` VARCHAR(50) NULL AFTER `guardian_contact`;

-- 2. Add missing fields to tbl_biblestudy_requests (Phase 2)
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `middle_name` VARCHAR(100) NULL AFTER `lastname`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `birthdate` DATE NULL AFTER `phone_number`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `age` INT NULL AFTER `birthdate`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `gender` VARCHAR(10) NULL AFTER `age`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `address` TEXT NULL AFTER `gender`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `civil_status` VARCHAR(20) NULL AFTER `address`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `profession` VARCHAR(100) NULL AFTER `civil_status`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `spouse_name` VARCHAR(100) NULL AFTER `profession`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `marriage_date` DATE NULL AFTER `spouse_name`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `children` TEXT NULL AFTER `marriage_date`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `guardian_name` VARCHAR(100) NULL AFTER `notes`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `guardian_contact` VARCHAR(20) NULL AFTER `guardian_name`;
ALTER TABLE `tbl_biblestudy_requests` ADD COLUMN `guardian_relationship` VARCHAR(50) NULL AFTER `guardian_contact`;
