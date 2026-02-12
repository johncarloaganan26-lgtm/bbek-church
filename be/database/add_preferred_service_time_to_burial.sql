-- Add preferred_service_time column to tbl_burialservice
-- This field allows families to specify when they want the pastor to conduct the burial service
-- Default time is set to 18:00 (6:00 PM) as burial services are typically conducted at night

ALTER TABLE `tbl_burialservice`
ADD COLUMN `preferred_service_time` TIME NULL AFTER `service_date`;

-- Add comment to explain the purpose of this column
ALTER TABLE `tbl_burialservice` MODIFY COLUMN `preferred_service_time` TIME NULL COMMENT 'Preferred time for the pastor to conduct the burial service (default: 18:00 for night services)';

-- Verify the column was added
-- SELECT burial_id, service_date, preferred_service_time FROM tbl_burialservice LIMIT 5;