const express = require('express');
const { getDashboardStats } = require('../dbHelpers/dashboardHelper');
const { query } = require('../database/db');

const router = express.Router();

const GLOBAL_SEARCH_MAX_LIMIT = 120;
const GLOBAL_SEARCH_MAX_PER_MODULE = 12;

const MODULE_SORT_ORDER = {
  members: 1,
  accounts: 2,
  departments: 3,
  churchLeaders: 4,
  events: 5,
  ministries: 6,
  tithes: 7,
  discipleship: 8,
  waterBaptism: 9,
  childDedication: 10,
  burialService: 11,
  messages: 12,
  archives: 13,
  auditTrail: 14
};

const requireAdminOrStaff = (req, res, next) => {
  const position = String(req.user?.position || '').toLowerCase();
  if (position !== 'admin' && position !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or staff privileges are required.',
      error: 'Forbidden'
    });
  }
  next();
};

const clampInt = (value, min, max, defaultValue) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }
  return Math.min(max, Math.max(min, parsed));
};

const formatFullName = (firstname, middleName, lastname) => {
  return [firstname, middleName, lastname]
    .map((part) => (part === null || part === undefined ? '' : String(part).trim()))
    .filter(Boolean)
    .join(' ');
};

const stringifyValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
};

const createResult = ({
  module,
  moduleTitle,
  section,
  routeName,
  icon,
  recordId,
  title,
  subtitle
}) => {
  const safeTitle = stringifyValue(title, `${moduleTitle} Record`);
  const safeSubtitle = stringifyValue(subtitle);
  const safeRecordId = stringifyValue(recordId);
  return {
    itemType: 'record',
    module,
    moduleTitle,
    section,
    routeName,
    icon,
    recordId: safeRecordId,
    title: safeTitle,
    subtitle: safeSubtitle,
    searchIndex: `${safeTitle} ${safeSubtitle} ${moduleTitle} ${safeRecordId}`.toLowerCase()
  };
};

const computeMatchScore = (item, normalizedQuery) => {
  if (!normalizedQuery) return 0;

  const title = String(item.title || '').toLowerCase();
  const subtitle = String(item.subtitle || '').toLowerCase();
  const searchIndex = String(item.searchIndex || `${title} ${subtitle}`).toLowerCase();

  let score = 0;
  if (title === normalizedQuery) score += 200;
  if (title.startsWith(normalizedQuery)) score += 120;
  if (title.includes(normalizedQuery)) score += 80;
  if (subtitle.startsWith(normalizedQuery)) score += 60;
  if (subtitle.includes(normalizedQuery)) score += 40;
  if (searchIndex.includes(normalizedQuery)) score += 20;

  return score;
};

const executeSearchQuery = async (moduleName, sql, params = []) => {
  try {
    const [rows] = await query(sql, params);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error(`Global search query failed for ${moduleName}:`, error.message);
    return [];
  }
};

/**
 * GET DASHBOARD STATISTICS - Get all dashboard statistics in one call
 * GET /api/dashboard/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await getDashboardStats();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to fetch dashboard statistics',
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET GLOBAL ADMIN SEARCH RESULTS
 * GET /api/dashboard/global-search?q=...
 */
router.get('/global-search', requireAdminOrStaff, async (req, res) => {
  try {
    const rawQuery = req.query.q;
    const queryText = typeof rawQuery === 'string' ? rawQuery.trim() : '';
    const normalizedQuery = queryText.toLowerCase();

    if (normalizedQuery.length < 2) {
      return res.status(200).json({
        success: true,
        message: 'Type at least 2 characters to search.',
        data: {
          query: queryText,
          count: 0,
          results: []
        }
      });
    }

    const perModuleLimit = clampInt(
      req.query.perModuleLimit,
      1,
      GLOBAL_SEARCH_MAX_PER_MODULE,
      4
    );
    const totalLimit = clampInt(req.query.limit, 1, GLOBAL_SEARCH_MAX_LIMIT, 40);
    const likeTerm = `%${queryText}%`;
    const isAdmin = String(req.user?.position || '').toLowerCase() === 'admin';
    const limitClause = String(perModuleLimit);

    const searchTasks = [
      {
        module: 'members',
        moduleTitle: 'Member Record',
        section: 'Church Records',
        routeName: 'MemberRecord',
        icon: 'mdi-account-group',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'members',
            `SELECT member_id, firstname, middle_name, lastname, email, phone_number, position
             FROM tbl_members
             WHERE CAST(member_id AS CHAR) LIKE ? OR firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR phone_number LIKE ?
             ORDER BY date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'members',
              moduleTitle: 'Member Record',
              section: 'Church Records',
              routeName: 'MemberRecord',
              icon: 'mdi-account-group',
              recordId: row.member_id,
              title: formatFullName(row.firstname, row.middle_name, row.lastname) || row.email,
              subtitle: `ID: ${row.member_id} | ${row.email || row.phone_number || row.position || 'Member'}`
            })
          );
        }
      },
      {
        module: 'accounts',
        moduleTitle: 'Accounts',
        section: 'Church Records',
        routeName: 'Accounts',
        icon: 'mdi-account',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'accounts',
            `SELECT acc_id, email, position, status
             FROM tbl_accounts
             WHERE CAST(acc_id AS CHAR) LIKE ? OR email LIKE ? OR position LIKE ?
             ORDER BY date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'accounts',
              moduleTitle: 'Accounts',
              section: 'Church Records',
              routeName: 'Accounts',
              icon: 'mdi-account',
              recordId: row.acc_id,
              title: row.email,
              subtitle: `Account #${row.acc_id} | ${row.position || 'Unknown'} | ${row.status || 'N/A'}`
            })
          );
        }
      },
      {
        module: 'departments',
        moduleTitle: 'Departments',
        section: 'Church Records',
        routeName: 'Departments',
        icon: 'mdi-office-building',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'departments',
            `SELECT d.department_id, d.department_name, d.status, d.member_id,
                    m.firstname AS leader_firstname, m.middle_name AS leader_middle_name, m.lastname AS leader_lastname
             FROM tbl_departments d
             LEFT JOIN tbl_members m ON d.member_id = m.member_id
             WHERE CAST(d.department_id AS CHAR) LIKE ? OR d.department_name LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ?
             ORDER BY d.date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) => {
            const leaderName = formatFullName(row.leader_firstname, row.leader_middle_name, row.leader_lastname);
            return createResult({
              module: 'departments',
              moduleTitle: 'Departments',
              section: 'Church Records',
              routeName: 'Departments',
              icon: 'mdi-office-building',
              recordId: row.department_id,
              title: row.department_name,
              subtitle: `Department #${row.department_id} | Leader: ${leaderName || row.member_id || 'N/A'} | ${row.status || 'N/A'}`
            });
          });
        }
      },
      {
        module: 'churchLeaders',
        moduleTitle: 'Church Leaders',
        section: 'Church Records',
        routeName: 'ChurchLeaders',
        icon: 'mdi-account-tie',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'churchLeaders',
            `SELECT cl.leader_id, cl.member_id, cl.status, m.firstname, m.middle_name, m.lastname, m.position
             FROM tbl_churchleaders cl
             LEFT JOIN tbl_members m ON cl.member_id = m.member_id
             WHERE CAST(cl.leader_id AS CHAR) LIKE ? OR CAST(cl.member_id AS CHAR) LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.position LIKE ?
             ORDER BY cl.date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'churchLeaders',
              moduleTitle: 'Church Leaders',
              section: 'Church Records',
              routeName: 'ChurchLeaders',
              icon: 'mdi-account-tie',
              recordId: row.leader_id,
              title: formatFullName(row.firstname, row.middle_name, row.lastname) || `Leader #${row.leader_id}`,
              subtitle: `Leader ID: ${row.leader_id} | Member ID: ${row.member_id || 'N/A'} | ${row.position || row.status || 'N/A'}`
            })
          );
        }
      },
      {
        module: 'events',
        moduleTitle: 'Events Records',
        section: 'Church Records',
        routeName: 'EventsRecords',
        icon: 'mdi-calendar',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'events',
            `SELECT event_id, title, type, location, status, start_date
             FROM tbl_events
             WHERE CAST(event_id AS CHAR) LIKE ? OR title LIKE ? OR description LIKE ? OR location LIKE ? OR type LIKE ?
             ORDER BY date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'events',
              moduleTitle: 'Events Records',
              section: 'Church Records',
              routeName: 'EventsRecords',
              icon: 'mdi-calendar',
              recordId: row.event_id,
              title: row.title,
              subtitle: `Event #${row.event_id} | ${row.type || 'Event'} | ${row.start_date || row.location || row.status || 'N/A'}`
            })
          );
        }
      },
      {
        module: 'ministries',
        moduleTitle: 'Ministries',
        section: 'Church Records',
        routeName: 'Ministries',
        icon: 'mdi-account-group',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'ministries',
            `SELECT m.ministry_id, m.ministry_name, m.status, m.schedule,
                    d.department_name,
                    mem.firstname AS leader_firstname, mem.middle_name AS leader_middle_name, mem.lastname AS leader_lastname
             FROM tbl_ministry m
             LEFT JOIN tbl_departments d ON m.department_id = d.department_id
             LEFT JOIN tbl_members mem ON m.leader_id = mem.member_id
             WHERE CAST(m.ministry_id AS CHAR) LIKE ? OR m.ministry_name LIKE ? OR m.schedule LIKE ? OR d.department_name LIKE ? OR mem.firstname LIKE ? OR mem.lastname LIKE ?
             ORDER BY m.date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) => {
            const leaderName = formatFullName(row.leader_firstname, row.leader_middle_name, row.leader_lastname);
            return createResult({
              module: 'ministries',
              moduleTitle: 'Ministries',
              section: 'Church Records',
              routeName: 'Ministries',
              icon: 'mdi-account-group',
              recordId: row.ministry_id,
              title: row.ministry_name,
              subtitle: `Ministry #${row.ministry_id} | ${row.department_name || 'No Department'} | ${leaderName || row.schedule || row.status || 'N/A'}`
            });
          });
        }
      },
      {
        module: 'tithes',
        moduleTitle: 'Tithes & Offerings',
        section: 'Church Records',
        routeName: 'TithesOfferings',
        icon: 'mdi-gift',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'tithes',
            `SELECT t.tithes_id, t.member_id, t.member_name, t.donor_email, t.amount, t.type, t.status, t.donation_type,
                    m.firstname, m.middle_name, m.lastname
             FROM tbl_tithes t
             LEFT JOIN tbl_members m ON t.member_id = m.member_id
             WHERE CAST(t.tithes_id AS CHAR) LIKE ? OR CAST(t.member_id AS CHAR) LIKE ? OR t.member_name LIKE ? OR t.donor_email LIKE ? OR t.type LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ?
             ORDER BY t.date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) => {
            const memberName = row.member_name || formatFullName(row.firstname, row.middle_name, row.lastname);
            return createResult({
              module: 'tithes',
              moduleTitle: 'Tithes & Offerings',
              section: 'Church Records',
              routeName: 'TithesOfferings',
              icon: 'mdi-gift',
              recordId: row.tithes_id,
              title: memberName || `Donation #${row.tithes_id}`,
              subtitle: `Tithe #${row.tithes_id} | ${row.type || row.donation_type || 'Donation'} | Amount: ${row.amount || '0'} | ${row.status || 'N/A'}`
            });
          });
        }
      },
      {
        module: 'discipleship',
        moduleTitle: 'Discipleship Requests',
        section: 'Services',
        routeName: 'DiscipleshipAdmin',
        icon: 'mdi-account-plus',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'discipleship',
            `SELECT request_id, firstname, middle_name, lastname, email, status, scheduled_date
             FROM tbl_discipleship_requests
             WHERE request_id LIKE ? OR firstname LIKE ? OR lastname LIKE ? OR email LIKE ?
             ORDER BY date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'discipleship',
              moduleTitle: 'Discipleship Requests',
              section: 'Services',
              routeName: 'DiscipleshipAdmin',
              icon: 'mdi-account-plus',
              recordId: row.request_id,
              title: formatFullName(row.firstname, row.middle_name, row.lastname) || row.email || `Request ${row.request_id}`,
              subtitle: `Request ID: ${row.request_id} | ${row.status || 'N/A'} | ${row.email || row.scheduled_date || 'N/A'}`
            })
          );
        }
      },
      {
        module: 'waterBaptism',
        moduleTitle: 'Water Baptism',
        section: 'Services',
        routeName: 'WaterBaptism',
        icon: 'mdi-water',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'waterBaptism',
            `SELECT baptism_id, member_id, firstname, middle_name, lastname, email, status, baptism_date
             FROM tbl_waterbaptism
             WHERE CAST(baptism_id AS CHAR) LIKE ? OR CAST(member_id AS CHAR) LIKE ? OR firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR location LIKE ? OR pastor_name LIKE ?
             ORDER BY date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'waterBaptism',
              moduleTitle: 'Water Baptism',
              section: 'Services',
              routeName: 'WaterBaptism',
              icon: 'mdi-water',
              recordId: row.baptism_id,
              title: formatFullName(row.firstname, row.middle_name, row.lastname) || row.email || `Baptism ${row.baptism_id}`,
              subtitle: `Baptism ID: ${row.baptism_id} | Member ID: ${row.member_id || 'N/A'} | ${row.status || 'N/A'}`
            })
          );
        }
      },
      {
        module: 'childDedication',
        moduleTitle: 'Child Dedication',
        section: 'Services',
        routeName: 'ChildDedicationAdmin',
        icon: 'mdi-baby-face',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'childDedication',
            `SELECT child_id, child_firstname, child_middle_name, child_lastname, status, preferred_dedication_date, contact_email, requested_by
             FROM tbl_childdedications
             WHERE CAST(child_id AS CHAR) LIKE ? OR child_firstname LIKE ? OR child_lastname LIKE ? OR contact_email LIKE ?
             ORDER BY date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'childDedication',
              moduleTitle: 'Child Dedication',
              section: 'Services',
              routeName: 'ChildDedicationAdmin',
              icon: 'mdi-baby-face',
              recordId: row.child_id,
              title: formatFullName(row.child_firstname, row.child_middle_name, row.child_lastname) || `Child ${row.child_id}`,
              subtitle: `Child ID: ${row.child_id} | Requested by: ${row.requested_by || 'N/A'} | ${row.status || row.preferred_dedication_date || 'N/A'}`
            })
          );
        }
      },
      {
        module: 'burialService',
        moduleTitle: 'Burial Service',
        section: 'Services',
        routeName: 'BurialService',
        icon: 'mdi-coffin',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'burialService',
            `SELECT burial_id, deceased_name, requester_name, requester_email, status, service_date, member_id
             FROM tbl_burialservice
             WHERE CAST(burial_id AS CHAR) LIKE ? OR deceased_name LIKE ? OR requester_name LIKE ? OR requester_email LIKE ? OR location LIKE ? OR pastor_name LIKE ?
             ORDER BY date_created DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'burialService',
              moduleTitle: 'Burial Service',
              section: 'Services',
              routeName: 'BurialService',
              icon: 'mdi-coffin',
              recordId: row.burial_id,
              title: row.deceased_name || row.requester_name || `Burial ${row.burial_id}`,
              subtitle: `Burial ID: ${row.burial_id} | Member ID: ${row.member_id || 'N/A'} | ${row.status || row.service_date || 'N/A'}`
            })
          );
        }
      },
      {
        module: 'messages',
        moduleTitle: 'Messages',
        section: 'Communication',
        routeName: 'Messages',
        icon: 'mdi-message-text',
        fetch: async () => {
          const rows = await executeSearchQuery(
            'messages',
            `SELECT form_id, form_type, name, email, status, created_at
             FROM tbl_forms
             WHERE CAST(form_id AS CHAR) LIKE ? OR form_type LIKE ? OR name LIKE ? OR email LIKE ? OR CAST(form_data AS CHAR) LIKE ?
             ORDER BY created_at DESC
             LIMIT ${limitClause}`,
            [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
          );
          return rows.map((row) =>
            createResult({
              module: 'messages',
              moduleTitle: 'Messages',
              section: 'Communication',
              routeName: 'Messages',
              icon: 'mdi-message-text',
              recordId: row.form_id,
              title: row.name || row.email || `Form ${row.form_id}`,
              subtitle: `Form ID: ${row.form_id} | ${row.form_type || 'message'} | ${row.status || row.created_at || 'N/A'}`
            })
          );
        }
      }
    ];

    if (isAdmin) {
      searchTasks.push(
        {
          module: 'archives',
          moduleTitle: 'Archives',
          section: 'Maintenance',
          routeName: 'Archive',
          icon: 'mdi-folder',
          fetch: async () => {
            const rows = await executeSearchQuery(
              'archives',
              `SELECT archive_id, original_table, original_id, restored, archived_at
               FROM tbl_archives
               WHERE CAST(archive_id AS CHAR) LIKE ? OR original_table LIKE ? OR CAST(original_id AS CHAR) LIKE ?
               ORDER BY archived_at DESC
               LIMIT ${limitClause}`,
              [likeTerm, likeTerm, likeTerm]
            );
            return rows.map((row) =>
              createResult({
                module: 'archives',
                moduleTitle: 'Archives',
                section: 'Maintenance',
                routeName: 'Archive',
                icon: 'mdi-folder',
                recordId: row.archive_id,
                title: `${row.original_table || 'Record'} #${row.original_id || row.archive_id}`,
                subtitle: `Archive ID: ${row.archive_id} | Restored: ${row.restored ? 'Yes' : 'No'} | ${row.archived_at || 'N/A'}`
              })
            );
          }
        },
        {
          module: 'auditTrail',
          moduleTitle: 'Audit Trail',
          section: 'Maintenance',
          routeName: 'AuditTrail',
          icon: 'mdi-file-document',
          fetch: async () => {
            const rows = await executeSearchQuery(
              'auditTrail',
              `SELECT id, user_name, user_email, module, action_type, description, status, date_created
               FROM tbl_audit_trail
               WHERE CAST(id AS CHAR) LIKE ? OR user_name LIKE ? OR user_email LIKE ? OR module LIKE ? OR description LIKE ? OR action_type LIKE ?
               ORDER BY date_created DESC
               LIMIT ${limitClause}`,
              [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
            );
            return rows.map((row) =>
              createResult({
                module: 'auditTrail',
                moduleTitle: 'Audit Trail',
                section: 'Maintenance',
                routeName: 'AuditTrail',
                icon: 'mdi-file-document',
                recordId: row.id,
                title: `${row.action_type || 'Activity'} - ${row.module || 'Module'}`,
                subtitle: `Log #${row.id} | ${row.user_name || row.user_email || 'Unknown user'} | ${row.status || row.date_created || 'N/A'}`
              })
            );
          }
        }
      );
    }

    const moduleResults = await Promise.all(searchTasks.map((task) => task.fetch()));
    const flatResults = moduleResults.flat();

    const rankedResults = flatResults
      .map((item) => ({
        ...item,
        matchScore: computeMatchScore(item, normalizedQuery),
        sortOrder: MODULE_SORT_ORDER[item.module] || 999
      }))
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.title.localeCompare(b.title);
      })
      .slice(0, totalLimit);

    const moduleCounts = rankedResults.reduce((acc, item) => {
      acc[item.module] = (acc[item.module] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: 'Global admin search completed successfully.',
      data: {
        query: queryText,
        count: rankedResults.length,
        perModuleLimit,
        limit: totalLimit,
        moduleCounts,
        results: rankedResults
      }
    });
  } catch (error) {
    console.error('Error during global admin search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform global admin search.',
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;

