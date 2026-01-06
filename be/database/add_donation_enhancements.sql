-- Database Migration: Add Donation Enhancement Fields
-- Date: January 6, 2026

-- Add new columns to tbl_tithes based on your actual table structure

-- Step 1: Add new columns
ALTER TABLE tbl_tithes
ADD COLUMN donation_type ENUM('money', 'inkind') DEFAULT 'money' AFTER member_id;

ALTER TABLE tbl_tithes
ADD COLUMN member_name VARCHAR(100) NULL AFTER donation_type;

ALTER TABLE tbl_tithes
ADD COLUMN is_anonymous TINYINT(1) DEFAULT 0 AFTER member_name;

ALTER TABLE tbl_tithes
ADD COLUMN donation_items TEXT NULL AFTER payment_method;

-- Step 2: Update existing records to set donation_type = 'money' for all
UPDATE
  tbl_tithes
SET donation_type = 'money'
WHERE
  donation_type IS NULL;

-- Step 3: Update the view for fulltext search
DROP VIEW
IF
  EXISTS v_tithes_search;
  CREATE VIEW v_tithes_search AS
  SELECT
    t.tithes_id
    , t.member_id
    , COALESCE(m.firstname, '') as member_firstname
    , COALESCE(m.lastname, '') as member_lastname
    , t.member_name
    , t.is_anonymous
    , t.donation_type
    , t.type
    , t.amount
    , t.payment_method
    , t.donation_items
    , t.notes
    , t.status
    , t.date_created
    , CONCAT(
      COALESCE(m.firstname, '')
      , ' '
      , COALESCE(m.lastname, '')
      , ' '
      , COALESCE(t.member_name, '')
      , ' '
      , COALESCE(t.type, '')
      , ' '
      , COALESCE(t.donation_items, '')
      , ' '
      , COALESCE(t.notes, '')
    ) as search_text
  FROM
    tbl_tithes t
    LEFT JOIN tbl_members m
  ON t.member_id = m.member_id;

  -- Step 4: Create indexes
  CREATE INDEX idx_tithes_donation_type
  ON tbl_tithes(donation_type);
  CREATE INDEX idx_tithes_type
  ON tbl_tithes(type);

  -- ============================================
  -- INSERT Template for New Donations
  -- ============================================
  -- For Money Donation:
  INSERT INTO
    tbl_tithes (
      member_id
      , member_name
      , is_anonymous
      , donation_type
      , amount
      , type
      , payment_method
      , notes
      , status
      , date_created
    )
  VALUES
    (
      'M001'
      , NULL
      , 0
      , 'money'
      , 500.00
      , 'tithe'
      , 'cash'
      , 'Weekly tithe'
      , 'pending'
      , NOW()
    );

  -- For In-Kind Donation:
  INSERT INTO
    tbl_tithes (
      member_id
      , member_name
      , is_anonymous
      , donation_type
      , type
      , donation_items
      , notes
      , status
      , date_created
    )
  VALUES
    (
      NULL
      , 'John Doe'
      , 0
      , 'inkind'
      , 'food'
      , '5 cans of milk, 2 loaves of bread'
      , 'Food donation for charity'
      , 'pending'
      , NOW()
    );

  -- ============================================
  -- UPDATE Template for Existing Donations
  -- ============================================
  UPDATE
    tbl_tithes
  SET member_id = '[value-2]', member_name = '[value-new]', is_anonymous = 0, donation_type = 'money', amount = '[value-3]', type = '[value-4]', payment_method = '[value-5]', donation_items = NULL, notes = '[value-6]', status = '[value-7]', date_created = '[value-8]'
  WHERE
    tithes_id = 1;