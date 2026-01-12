-- Add preferred_baptism_time column to tbl_waterbaptism table
-- This allows scheduling specific times for water baptism services

ALTER TABLE tbl_waterbaptism
ADD COLUMN preferred_baptism_time TIME NULL AFTER baptism_date;

-- Update the column comment to reflect its purpose
ALTER TABLE tbl_waterbaptism CHANGE COLUMN preferred_baptism_time preferred_baptism_time TIME NULL COMMENT 'Preferred time for water baptism service (HH:MM:SS format)';

-- Add index on baptism_date and preferred_baptism_time for better query performance
CREATE INDEX idx_waterbaptism_datetime
ON tbl_waterbaptism (baptism_date, preferred_baptism_time);

-- Verify the column was added successfully
SELECT
  baptism_id
  , baptism_date
  , preferred_baptism_time
  , status
FROM
  tbl_waterbaptism
LIMIT
  5;