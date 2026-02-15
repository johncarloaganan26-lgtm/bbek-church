-- =====================================================
-- BBEK Church Yearly Events
-- Created: 2026-02-15
-- =====================================================
-- This script inserts yearly church events with 'ongoing' status
-- Uses INSERT IGNORE to prevent duplicates
-- =====================================================

-- =====================================================
-- Add unique constraint to prevent duplicate event titles
-- =====================================================
-- First remove any existing duplicates (keep the one with lowest ID)
DELETE e1
FROM
  tbl_events e1
  INNER JOIN tbl_events e2
WHERE
  e1.event_id > e2.event_id
  AND LOWER(e1.title) = LOWER(e2.title);

-- Add unique constraint on title (if not exists)
ALTER TABLE tbl_events ADD UNIQUE INDEX idx_unique_event_title (title);

-- =====================================================
-- YEARLY CHURCH EVENTS
-- =====================================================

-- 1. Couples Banquet - Every Second week of February
-- 2026: February 8-14 (second week), typically held on Saturday
INSERT IGNORE
INTO
  `tbl_events` (
    `title`
    , `description`
    , `start_date`
    , `end_date`
    , `location`
    , `link`
    , `type`
    , `status`
    , `date_created`
    , `image`
    , `joined_members`
  )
VALUES
  (
    'Couples Banquet'
    , 'A special event for couples to celebrate marriage and strengthen relationships. Held every second week of February. An evening of fellowship, dinner, and encouragement for married couples.'
    , '2026-02-14 18:00:00'
    , '2026-02-14 21:00:00'
    , 'Main Sanctuary'
    , NULL
    , 'Fellowship'
    , 'ongoing'
    , NOW()
    , NULL
    , '[]'
  );

-- 2. Cantata - Every Third Sunday of December
-- 2026: Third Sunday of December is December 20
INSERT IGNORE
INTO
  `tbl_events` (
    `title`
    , `description`
    , `start_date`
    , `end_date`
    , `location`
    , `link`
    , `type`
    , `status`
    , `date_created`
    , `image`
    , `joined_members`
  )
VALUES
  (
    'Cantata'
    , 'A sacred music presentation celebrating the birth of Christ and the essence of giving. Held every third Sunday of December. Experience the joy of Christmas through heartfelt worship and musical performances.'
    , '2026-12-20 17:00:00'
    , '2026-12-20 19:00:00'
    , 'Main Sanctuary'
    , NULL
    , 'Worship'
    , 'ongoing'
    , NOW()
    , NULL
    , '[]'
  );

-- 3. World Mission Conference - Every Second week of May (Friday)
-- 2026: May 8-14 (second week), Friday is May 8
INSERT IGNORE
INTO
  `tbl_events` (
    `title`
    , `description`
    , `start_date`
    , `end_date`
    , `location`
    , `link`
    , `type`
    , `status`
    , `date_created`
    , `image`
    , `joined_members`
  )
VALUES
  (
    'World Mission Conference'
    , 'A whole day event aimed at giving support for foreign and local missionaries all over the world. Held every second week of May (Friday). Join us in supporting global missions and spreading the Gospel.'
    , '2026-05-08 08:00:00'
    , '2026-05-08 17:00:00'
    , 'Main Sanctuary'
    , NULL
    , 'Conference'
    , 'ongoing'
    , NOW()
    , NULL
    , '[]'
  );

-- 4. Church Anniversary - Every second week of May (Sunday)
-- 2026: May 10-16 (second week), Sunday is May 10
INSERT IGNORE
INTO
  `tbl_events` (
    `title`
    , `description`
    , `start_date`
    , `end_date`
    , `location`
    , `link`
    , `type`
    , `status`
    , `date_created`
    , `image`
    , `joined_members`
  )
VALUES
  (
    'Church Anniversary'
    , 'Celebrating years of God\'s blessing in our church. Held every second week of May (Sunday). A special service of thanksgiving and celebration for what God has done through Bible Baptist Ekklesia of Kawit.'
    , '2026-05-10 10:00:00'
    , '2026-05-10 12:00:00'
    , 'Main Sanctuary'
    , NULL
    , 'Celebration'
    , 'ongoing'
    , NOW()
    , NULL
    , '[]'
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run this to see all yearly events:
-- SELECT event_id, title, description, start_date, end_date, status FROM tbl_events WHERE status = 'ongoing' ORDER BY start_date;

-- Count total ongoing events:
-- SELECT COUNT(*) as total_ongoing_events FROM tbl_events WHERE status = 'ongoing';