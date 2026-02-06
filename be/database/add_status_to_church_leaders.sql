-- Add status column to tbl_churchleaders
-- This adds support for tracking church leader status (active/inactive)

ALTER TABLE tbl_churchleaders
ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER joined_date;

-- Add comment for the new column
COMMENT ON COLUMN tbl_churchleaders.status IS 'Status of the church leader: active, inactive';

-- Update existing records to have default value
UPDATE tbl_churchleaders SET status = 'active' WHERE status IS NULL;

-- Make status NOT NULL after setting defaults
ALTER TABLE tbl_churchleaders MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
