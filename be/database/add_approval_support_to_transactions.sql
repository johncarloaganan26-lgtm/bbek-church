-- Add support for approval-based transactions to tbl_transactions
-- This allows member requests for events and ministries to appear in the transaction system

ALTER TABLE tbl_transactions
ADD COLUMN approval_id INT NULL COMMENT 'ID from tbl_approval if this transaction is approval-based'
, ADD COLUMN approval_type VARCHAR(45) NULL COMMENT 'Type of approval: event, ministry'
, ADD COLUMN approval_status VARCHAR(45) NULL COMMENT 'Status of approval: pending, approved, rejected'
, ADD COLUMN is_approval BOOLEAN DEFAULT FALSE COMMENT 'Flag to indicate this is an approval-based transaction';

-- Create index for approval-based transactions
CREATE INDEX idx_approval_transaction
ON tbl_transactions (approval_id);
CREATE INDEX idx_approval_type
ON tbl_transactions (approval_type);
CREATE INDEX idx_approval_status
ON tbl_transactions (approval_status);
CREATE INDEX idx_is_approval
ON tbl_transactions (is_approval);