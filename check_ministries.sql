-- Check current ministry data
SELECT 
  ministry_id,
  ministry_name,
  status,
  department_id,
  schedule,
  leader_id,
  date_created
FROM tbl_ministry
ORDER BY ministry_id DESC;

-- If no ministries, uncomment the INSERT statements below to add sample data:

-- INSERT INTO tbl_ministry (ministry_name, schedule, leader_id, department_id, members, status, date_created, description)
-- VALUES 
-- ('Adult Worship Group', '2026-01-25 10:00:00', 1, 1, '[]', 'active', NOW(), 'Join us for worship and spiritual growth focused on adult believers'),
-- ('Ladies Prayer Circle', '2026-01-26 18:00:00', 2, 2, '[]', 'active', NOW(), 'A ministry dedicated to prayer, fellowship, and spiritual encouragement for women'),
-- ('Youth Sunday Service', '2026-02-01 09:00:00', 3, 3, '[]', 'active', NOW(), 'Dynamic worship service designed specifically for young believers');

-- Verify the inserted data
-- SELECT COUNT(*) as total_ministries, 
--        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_ministries
-- FROM tbl_ministry;
