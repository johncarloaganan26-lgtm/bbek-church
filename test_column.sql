-- Test the preferred baptism time column
UPDATE
  tbl_waterbaptism
SET preferred_baptism_time = '14:30:00'
WHERE
  baptism_id = '000000036';

-- Verify it was saved
SELECT
  baptism_id
  , baptism_date
  , preferred_baptism_time
  , status
FROM
  tbl_waterbaptism
WHERE
  baptism_id = '000000036';