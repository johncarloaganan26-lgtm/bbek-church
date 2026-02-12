-- Add water_baptism_registered column to tbl_discipleship_requests
ALTER TABLE tbl_discipleship_requests
ADD COLUMN water_baptism_registered TINYINT(1) DEFAULT 0 AFTER updated_at;

-- Add index for faster queries
CREATE INDEX idx_water_baptism_registered
ON tbl_discipleship_requests(water_baptism_registered);