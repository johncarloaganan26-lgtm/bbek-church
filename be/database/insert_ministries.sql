-- =====================================================
-- BBEK Church Ministries - Complete List
-- Created: 2026-02-15
-- =====================================================
-- This script prevents duplicates by:
-- 1. Adding a unique constraint on ministry_name
-- 2. Using INSERT IGNORE to skip existing records
-- =====================================================

-- =====================================================
-- STEP 1: Add unique constraint to prevent duplicates
-- =====================================================
-- First, remove any existing duplicates (keep the one with lowest ID)
DELETE m1
FROM
  tbl_ministry m1
  INNER JOIN tbl_ministry m2
WHERE
  m1.ministry_id > m2.ministry_id
  AND LOWER(m1.ministry_name) = LOWER(m2.ministry_name);

-- Add unique constraint on ministry_name (if not exists)
ALTER TABLE tbl_ministry ADD UNIQUE INDEX idx_unique_ministry_name (ministry_name);

-- =====================================================
-- STEP 2: Insert all ministries
-- Using INSERT IGNORE to skip if already exists
-- =====================================================

-- =====================================================
-- MAIN CHURCH MINISTRIES
-- =====================================================

-- 1. Soulwinning/Evangelism - Saturday
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Soulwinning/Evangelism'
    , '2026-02-21 08:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Sharing the Gospel to souls and winning them for Christ through evangelism activities. Held every Saturday.'
  );

-- 2. Street Preaching - Sunday afternoon
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Street Preaching'
    , '2026-02-15 14:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Preaching the Gospel in public places to reach the lost and fallen. Held every Sunday afternoon.'
  );

-- 3. Water Baptism - every 2 months
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Water Baptism'
    , '2026-03-15 09:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Baptizing believers in water as an outward expression of their faith in Christ. Held every 2 months.'
  );

-- 4. Lord Supper - every quarter of the year
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Lord Supper'
    , '2026-03-29 10:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Celebrating the communion as a remembrance of Christ sacrifice. Held every quarter of the year.'
  );

-- 5. Daily Vacation Bible School - 3 consecutive days, every Summer Vacation
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Daily Vacation Bible School'
    , '2026-04-14 08:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'A 3-day summer program for children to learn biblical values and truths. Held during summer vacation of students.'
  );

-- 6. Feeding Program - Once a month
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Feeding Program'
    , '2026-02-28 11:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Providing food to the hungry and less fortunate in our community. Held once a month.'
  );

-- 7. Outreach Program - Monday - Saturday
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Outreach Program'
    , '2026-02-16 08:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Reaching out to communities with love, compassion, and the Gospel. Held Monday to Saturday.'
  );

-- 8. Building Strong Family in Christ (BASFIC) - Thursday
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Building Strong Family in Christ (BASFIC)'
    , '2026-02-19 18:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Strengthening families through biblical principles and Christian fellowship. Led by Pastor Fresco. Held every Thursday.'
  );

-- 9. Bible Studies - Monday - Saturday
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Bible Studies'
    , '2026-02-16 18:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Studying the Word of God for spiritual growth and maturity. Led by Pastor Fresco. Held Monday to Saturday.'
  );

-- 10. Prayer and Fasting - Monday
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Prayer and Fasting'
    , '2026-02-16 06:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Seeking God through prayer and fasting for spiritual breakthroughs. Led by Pastor Fresco. Held every Monday.'
  );

-- =====================================================
-- YP MINISTRY (Youth Department)
-- =====================================================

-- 11. Youth Fellowship
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Youth Fellowship'
    , '2026-02-21 17:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'A gathering of young people for fellowship, worship, and spiritual growth. Part of YP Ministry.'
  );

-- 12. Cantata
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Cantata'
    , '2026-12-20 18:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'A musical performance or concert, typically during Christmas season. Part of YP Ministry.'
  );

-- 13. Couples Banquet
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Couples Banquet'
    , '2026-02-14 18:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'A special event for couples to celebrate marriage and strengthen relationships. Part of YP Ministry.'
  );

-- 14. Sportfest Fellowship
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Sportfest Fellowship'
    , '2026-05-15 08:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Sports activities and fellowship for church members. Part of YP Ministry.'
  );

-- 15. Thanksgiving Sunday
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Thanksgiving Sunday'
    , '2026-11-29 10:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'A special Sunday service to give thanks to God for His blessings. Part of YP Ministry.'
  );

-- 16. Church Anniversary
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Church Anniversary'
    , '2026-09-15 10:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Celebrating the founding anniversary of Bible Baptist Ekklesia of Kawit. Part of YP Ministry.'
  );

-- =====================================================
-- ADULT DEPARTMENT
-- =====================================================

-- 17. Adult Department Fellowship
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Adult Department Fellowship'
    , '2026-02-22 18:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'Fellowship gathering for the adult members of the church. Part of Adult Department.'
  );

-- =====================================================
-- LED BY PASTOR FRESCO (Additional Ministries)
-- =====================================================

-- 18. Global Life University (Bible School)
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'Global Life University'
    , '2026-02-16 09:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'A Bible school for theological education and ministry training. Led by Pastor Fresco.'
  );

-- 19. World Missions Conference
INSERT IGNORE
INTO
  `tbl_ministry` (
    `ministry_name`
    , `schedule`
    , `leader_id`
    , `department_id`
    , `members`
    , `status`
    , `date_created`
    , `description`
  )
VALUES
  (
    'World Missions Conference'
    , '2026-10-15 10:00:00'
    , NULL
    , NULL
    , '[]'
    , 'active'
    , NOW()
    , 'A conference focused on world missions and evangelism. Led by Pastor Fresco.'
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run this to see all ministries:
-- SELECT ministry_id, ministry_name, schedule, status, description FROM tbl_ministry ORDER BY ministry_name;

-- Count total ministries:
-- SELECT COUNT(*) as total_ministries FROM tbl_ministry WHERE status = 'active';