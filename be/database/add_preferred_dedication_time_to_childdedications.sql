-- Add preferred_dedication_time field to tbl_childdedications
-- This allows scheduling child dedications with specific time slots

ALTER TABLE tbl_childdedications
ADD COLUMN preferred_dedication_time TIME NULL AFTER preferred_dedication_date;

-- Add comment for documentation
ALTER TABLE tbl_childdedications MODIFY COLUMN preferred_dedication_time TIME NULL COMMENT 'Preferred time for child dedication ceremony (HH:MM format)';