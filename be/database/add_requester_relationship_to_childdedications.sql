-- Add requester_relationship column to tbl_childdedications
-- This column stores the relationship of the requester to the child (father, mother, grandparent, etc.)

ALTER TABLE tbl_childdedications
ADD COLUMN requester_relationship VARCHAR(45) NULL AFTER requested_by;

-- Add comment to the column
ALTER TABLE tbl_childdedications MODIFY COLUMN requester_relationship VARCHAR(45) NULL COMMENT 'Relationship of requester to child (father, mother, grandparent, guardian, other_family, other)';