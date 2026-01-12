-- Test preferred baptism time update functionality
-- 1. First, let's check if the column exists
DESCRIBE tbl_waterbaptism;

-- 2. Let's find a baptism record to test with
SELECT
  baptism_id
  , baptism_date
  , preferred_baptism_time
  , status
FROM
  tbl_waterbaptism
WHERE
  baptism_date IS NOT NULL
LIMIT
  5;

-- 3. Test updating a record with preferred time
UPDATE
  tbl_waterbaptism
SET preferred_baptism_time = '14:30:00'
WHERE
  baptism_id = '000000036';

-- 4. Verify the update worked
SELECT
  baptism_id
  , baptism_date
  , preferred_baptism_time
  , status
FROM
  tbl_waterbaptism
WHERE
  baptism_id = '000000036';