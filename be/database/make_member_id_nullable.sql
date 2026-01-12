-- Make member_id nullable in tbl_burialservice to support non-member burial service requests
ALTER TABLE tbl_burialservice MODIFY COLUMN member_id VARCHAR(45) NULL;
