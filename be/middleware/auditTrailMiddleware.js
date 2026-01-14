const auditTrailRecords = require('../dbHelpers/auditTrailRecords');

// Helper function to determine module from path
function determineModule(path) {
  // Check the full path including baseUrl for mounted routes
  const fullPath = (req.baseUrl || '') + path;

  if (fullPath.includes('/members') || fullPath.includes('/church-records/members')) {
    return 'Members';
  } else if (fullPath.includes('/accounts') || fullPath.includes('/church-records/accounts')) {
    return 'Accounts';
  } else if (fullPath.includes('/events') || fullPath.includes('/church-records/events')) {
    return 'Events';
  } else if (fullPath.includes('/ministries') || fullPath.includes('/church-records/ministries')) {
    return 'Ministries';
  } else if (fullPath.includes('/departments') || fullPath.includes('/church-records/departments')) {
    return 'Departments';
  } else if (fullPath.includes('/department-officers') || fullPath.includes('/church-records/department-officers')) {
    return 'Department Officers';
  } else if (fullPath.includes('/church-leaders') || fullPath.includes('/church-records/church-leaders')) {
    return 'Church Leaders';
  } else if (fullPath.includes('/tithes') || fullPath.includes('/church-records/tithes')) {
    return 'Tithes & Offerings';
  } else if (fullPath.includes('/transactions')) {
    return 'Transactions';
  } else if (fullPath.includes('/water-baptisms') || fullPath.includes('/services/water-baptisms')) {
    return 'Water Baptism';
  } else if (fullPath.includes('/burial-services') || fullPath.includes('/church-records/burial-services')) {
    return 'Burial Service';
  } else if (fullPath.includes('/child-dedications') || fullPath.includes('/church-records/child-dedications')) {
    return 'Child Dedication';
  } else if (fullPath.includes('/marriage-services') || fullPath.includes('/services/marriage-services')) {
    return 'Marriage Service';
  } else if (fullPath.includes('/approvals') || fullPath.includes('/church-records/approvals')) {
    return 'Approvals';
  } else if (fullPath.includes('/archives')) {
    return 'Archives';
  }
  return 'Unknown Module';
}

// Helper function to get primary key field for a table
function getPrimaryKeyField(tableName) {
  const primaryKeys = {
    'tbl_members': 'member_id',
    'tbl_accounts': 'acc_id',
    'tbl_events': 'event_id',
    'tbl_ministry': 'ministry_id',
    'tbl_departments': 'department_id',
    'tbl_departmentofficers': 'officer_id',
    'tbl_churchleaders': 'leader_id',
    'tbl_tithes': 'tithes_id',
    'tbl_waterbaptism': 'baptism_id',
    'tbl_burialservice': 'burial_id',
    'tbl_marriageservice': 'marriage_id',
    'tbl_childdedications': 'child_id',
    'tbl_transactions': 'transaction_id',
    'tbl_approval': 'approval_id',
    'tbl_announcements': 'announcement_id',
    'tbl_cms_images': 'image_id'
  };
  return primaryKeys[tableName] || 'id';
}

// Middleware to automatically log user actions
const auditTrailMiddleware = async (req, res, next) => {
  // Only log authenticated requests
  if (!req.user) {
    return next();
  }

  // For DELETE and UPDATE operations, try to capture the record data before it's modified/deleted
  if (req.method === 'DELETE' || req.method === 'PUT') {
    // Extract ID from URL path for routes like /api/church-records/members/deleteMember/123 or /updateMember/123
    const pathParts = req.path.split('/');
    const lastPart = pathParts[pathParts.length - 1];

    // Check if last part looks like an ID (numeric)
    const id = req.params.id || (lastPart && /^\d+$/.test(lastPart) ? lastPart : null);

    if (id) {
      console.log('DEBUG: Capturing data for', req.method, req.path, 'ID:', id);
      try {
        const { query } = require('../database/db');
        const module = determineModule(req.path);
        console.log('DEBUG: Determined module:', module);

        if (module !== 'Archives') {
          const tableMap = {
            'Members': 'tbl_members',
            'Accounts': 'tbl_accounts',
            'Events': 'tbl_events',
            'Ministries': 'tbl_ministry',
            'Departments': 'tbl_departments',
            'Department Officers': 'tbl_departmentofficers',
            'Church Leaders': 'tbl_churchleaders',
            'Tithes & Offerings': 'tbl_tithes',
            'Water Baptism': 'tbl_waterbaptism',
            'Burial Service': 'tbl_burialservice',
            'Marriage Service': 'tbl_marriageservice',
            'Child Dedication': 'tbl_childdedications',
            'Transactions': 'tbl_transactions',
            'Approvals': 'tbl_approval',
            'Announcements': 'tbl_announcements',
            'Content Management': 'tbl_cms_images'
          };

          const tableName = tableMap[module];
          console.log('DEBUG: Table name:', tableName);
          if (tableName) {
            const primaryKey = getPrimaryKeyField(tableName);
            console.log('DEBUG: Primary key:', primaryKey);
            const recordSql = `SELECT * FROM \`${tableName}\` WHERE ${primaryKey} = ?`;
            console.log('DEBUG: Executing query:', recordSql, 'with param:', id);
            const [recordRows] = await query(recordSql, [id]);
            console.log('DEBUG: Query returned', recordRows.length, 'rows');

            if (recordRows.length > 0) {
              // Store the record data for later use in logging
              if (req.method === 'DELETE') {
                req.record_to_delete = recordRows[0];
                console.log('DEBUG: Stored complete record data for deletion logging');
              } else if (req.method === 'PUT') {
                req.record_before_update = recordRows[0];
                console.log('DEBUG: Stored complete record data for update logging');
              }
            } else {
              console.log('DEBUG: No record found with ID:', id);
            }
          } else {
            console.log('DEBUG: No table mapping found for module:', module);
          }
        } else {
          console.log('DEBUG: Skipping data capture for Archives module');
        }
      } catch (error) {
        // Silently fail if we can't capture the data
        console.error('Error capturing record data for audit:', error);
      }
    } else {
      console.log('DEBUG: No ID found in', req.method, 'request path:', req.path);
    }
  }

  // Store original response methods to intercept them
  const originalJson = res.json;
  const originalSend = res.send;
  const originalEnd = res.end;

  // Flag to track if we've already logged this request
  let logged = false;

  // Function to log the action
  const logAction = async (actionData) => {
    if (logged) return; // Prevent duplicate logging
    logged = true;

    try {
      const userInfo = req.user;
      const memberInfo = req.user.member || {};

      // Get current time in Philippine timezone (UTC+8)
      const now = new Date();
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for PH time
      const phTimestamp = phTime.toISOString().replace('Z', '+08:00');

      // For deletions, try to get the actual record data before it's deleted
      let enhancedDescription = actionData.description;
      if (actionData.action_type === 'DELETE' && actionData.entity_id) {
        try {
          const { query } = require('../database/db');

          if (actionData.module === 'Archives') {
            // Check if archive data was provided by the route handler
            if (req.archive_data) {
              const archive = req.archive_data;
              const tableName = archive.original_table.replace('tbl_', '');

              // Parse and format the archived data
              let archivedData = archive.archived_data;
              if (typeof archivedData === 'string') {
                try {
                  archivedData = JSON.parse(archivedData);
                } catch (e) {
                  // Keep as string if not valid JSON
                }
              }

              // Convert Buffer fields in archived data
              const cleanArchivedData = {};
              for (const [key, value] of Object.entries(archivedData)) {
                if (Buffer.isBuffer(value)) {
                  cleanArchivedData[key] = value.toString('utf8');
                } else if (typeof value === 'object' && value !== null) {
                  cleanArchivedData[key] = JSON.stringify(value);
                } else {
                  cleanArchivedData[key] = value;
                }
              }

              enhancedDescription = `Deleted archived ${tableName} record: ${JSON.stringify(cleanArchivedData)}`;
            } else {
              // Fallback: try to query the database (though archive might be deleted)
              try {
                const archiveSql = `
                  SELECT original_table, original_id, archived_data
                  FROM tbl_archives
                  WHERE archive_id = ?
                `;
                const [archiveRows] = await query(archiveSql, [actionData.entity_id]);
                if (archiveRows.length > 0) {
                  const archive = archiveRows[0];
                  const tableName = archive.original_table.replace('tbl_', '');
                  enhancedDescription = `Deleted archived ${tableName} record (ID: ${archive.original_id}, from Archives)`;
                }
              } catch (dbError) {
                // Keep original description if database query fails
              }
            }
          } else {
            // For regular deletions, use the captured record data
            if (req.record_to_delete) {
              const recordData = req.record_to_delete;
              // Convert Buffer fields and format as readable JSON
              const cleanData = {};
              for (const [key, value] of Object.entries(recordData)) {
                if (Buffer.isBuffer(value)) {
                  cleanData[key] = value.toString('utf8');
                } else if (typeof value === 'object' && value !== null) {
                  cleanData[key] = JSON.stringify(value);
                } else {
                  cleanData[key] = value;
                }
              }
              enhancedDescription = `Deleted ${actionData.entity_type}: ${JSON.stringify(cleanData)}`;
            } else {
              // Fallback: try to query the database (though record might be deleted)
              try {
                const tableMap = {
                  'Members': 'tbl_members',
                  'Accounts': 'tbl_accounts',
                  'Events': 'tbl_events',
                  'Ministries': 'tbl_ministry',
                  'Departments': 'tbl_departments',
                  'Department Officers': 'tbl_departmentofficers',
                  'Church Leaders': 'tbl_churchleaders',
                  'Tithes & Offerings': 'tbl_tithes',
                  'Water Baptism': 'tbl_waterbaptism',
                  'Burial Service': 'tbl_burialservice',
                  'Marriage Service': 'tbl_marriageservice',
                  'Child Dedication': 'tbl_childdedications',
                  'Transactions': 'tbl_transactions',
                  'Approvals': 'tbl_approval',
                  'Announcements': 'tbl_announcements',
                  'Content Management': 'tbl_cms_images'
                };

                const tableName = tableMap[actionData.module];
                if (tableName) {
                  const recordSql = `SELECT * FROM \`${tableName}\` WHERE ${getPrimaryKeyField(tableName)} = ?`;
                  const [recordRows] = await query(recordSql, [actionData.entity_id]);
                  if (recordRows.length > 0) {
                    const recordData = recordRows[0];
                    const cleanData = {};
                    for (const [key, value] of Object.entries(recordData)) {
                      if (Buffer.isBuffer(value)) {
                        cleanData[key] = value.toString('utf8');
                      } else if (typeof value === 'object' && value !== null) {
                        cleanData[key] = JSON.stringify(value);
                      } else {
                        cleanData[key] = value;
                      }
                    }
                    enhancedDescription = `Deleted ${actionData.entity_type}: ${JSON.stringify(cleanData)}`;
                  }
                }
              } catch (dbError) {
                // Keep original description if database query fails
              }
            }
          }
        } catch (dbError) {
          console.error('Error fetching record details for audit log:', dbError);
          // Continue with original description if database query fails
        }
      }


      const logData = {
        user_id: userInfo.account?.acc_id || userInfo.acc_id,
        user_email: userInfo.account?.email || userInfo.email,
        user_name: `${memberInfo.firstname || ''} ${memberInfo.lastname || ''}`.trim() || userInfo.email,
        user_position: userInfo.account?.position || userInfo.position || 'member',
        action_type: actionData.action_type,
        module: actionData.module,
        description: enhancedDescription,
        entity_type: actionData.entity_type,
        entity_id: actionData.entity_id,
        ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
        user_agent: null, // Hidden for privacy
        status: res.statusCode >= 400 ? 'failed' : 'success',
        error_message: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
        date_created: phTimestamp
      };

      await auditTrailRecords.createAuditLog(logData);
    } catch (error) {
      console.error('Audit trail logging error:', error);
      // Don't fail the request if audit logging fails
    }
  };

  // Determine action type and details from request
  const determineActionDetails = () => {
    const method = req.method;
    const path = req.path;
    const baseUrl = req.baseUrl || '';
    const fullPath = baseUrl + path;
    const query = req.query || {};
    const body = req.body || {};

    // Extract entity ID from path (usually at the end)
    const pathParts = path.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];

    // Check if last part looks like an ID (numeric or UUID-like)
    const isId = /^\d+$/.test(lastPart) || /^[a-f0-9-]{8,}$/i.test(lastPart);

    let actionType = 'VIEW';
    let module = 'Unknown Module';
    let entityType = null;
    let entityId = isId ? lastPart : null;
    let description = '';

    // Determine module from full path
    if (fullPath.includes('/members') || fullPath.includes('/church-records/members')) {
      module = 'Members';
      entityType = 'member';
    } else if (fullPath.includes('/accounts') || fullPath.includes('/church-records/accounts')) {
      module = 'Accounts';
      entityType = 'account';
    } else if (fullPath.includes('/events') || fullPath.includes('/church-records/events')) {
      module = 'Events';
      entityType = 'event';
    } else if (fullPath.includes('/ministries') || fullPath.includes('/church-records/ministries')) {
      module = 'Ministries';
      entityType = 'ministry';
    } else if (fullPath.includes('/departments') || fullPath.includes('/church-records/departments')) {
      module = 'Departments';
      entityType = 'department';
    } else if (fullPath.includes('/department-officers') || fullPath.includes('/church-records/department-officers')) {
      module = 'Department Officers';
      entityType = 'department_officer';
    } else if (fullPath.includes('/church-leaders') || fullPath.includes('/church-records/church-leaders')) {
      module = 'Church Leaders';
      entityType = 'church_leader';
    } else if (fullPath.includes('/tithes') || fullPath.includes('/church-records/tithes')) {
      module = 'Tithes & Offerings';
      entityType = 'tithe';
    } else if (fullPath.includes('/transactions')) {
      module = 'Transactions';
      entityType = 'transaction';
    } else if (fullPath.includes('/water-baptisms') || fullPath.includes('/services/water-baptisms')) {
      module = 'Water Baptism';
      entityType = 'water_baptism';
    } else if (fullPath.includes('/burial-services') || fullPath.includes('/church-records/burial-services')) {
      module = 'Burial Service';
      entityType = 'burial_service';
    } else if (fullPath.includes('/child-dedications') || fullPath.includes('/church-records/child-dedications')) {
      module = 'Child Dedication';
      entityType = 'child_dedication';
    } else if (fullPath.includes('/marriage-services') || fullPath.includes('/services/marriage-services')) {
      module = 'Marriage Service';
      entityType = 'marriage_service';
    } else if (fullPath.includes('/approvals') || fullPath.includes('/church-records/approvals')) {
      module = 'Approvals';
      entityType = 'approval';
    } else if (fullPath.includes('/dashboard')) {
      module = 'Dashboard';
    } else if (fullPath.includes('/cms')) {
      module = 'Content Management';
    } else if (fullPath.includes('/archives')) {
      module = 'Archives';
    } else if (fullPath.includes('/announcements')) {
      module = 'Announcements';
    } else if (fullPath.includes('/forms')) {
      module = 'Forms';
    } else if (fullPath.includes('/audit-trail')) {
      module = 'Audit Trail';
    } else if (fullPath.includes('/system-logs')) {
      module = 'System Logs';
    } else if (fullPath.includes('/member-registration')) {
      module = 'Member Registration';
    } else if (fullPath.includes('/archives')) {
      module = 'Archives';
    }

    // Helper function to generate informative descriptions
    const generateDescription = (action, entityType, entityId, module, data = {}) => {
      const entityName = entityType ? entityType.replace(/_/g, ' ') : 'record';

      switch (action) {
        case 'CREATE':
          // Try to get meaningful name from request body
          const createName = data.name || data.title || data.firstname || data.email ||
                    (data.firstname && data.lastname ? `${data.firstname} ${data.lastname}` : null) ||
                    (entityId ? `#${entityId}` : '');

          // Add more context based on module
          let createContext = '';
          if (module === 'Members') {
            createContext = data.email ? ` (Email: ${data.email})` : '';
          } else if (module === 'Events') {
            createContext = data.event_date ? ` (Date: ${data.event_date})` : '';
          } else if (module === 'Water Baptism') {
            createContext = data.baptism_date ? ` (Date: ${data.baptism_date})` : '';
          }

          let createDescription = `Created new ${entityName}${createName ? `: ${createName}` : ''}${createContext}`;

          // Add complete record data like DELETE does, but only for modules with create forms
          const modulesWithCreateForms = [
            'Members', 'Accounts', 'Events', 'Ministries', 'Departments',
            'Department Officers', 'Church Leaders', 'Tithes & Offerings',
            'Water Baptism', 'Burial Service', 'Child Dedication', 'Marriage Service',
            'Approvals', 'Forms', 'Content Management'
          ];

          if (modulesWithCreateForms.includes(module) && Object.keys(data).length > 0) {
            // Format the complete data as JSON, excluding null/undefined values
            const cleanData = {};
            for (const [key, value] of Object.entries(data)) {
              if (value !== null && value !== undefined && value !== '') {
                if (Buffer.isBuffer(value)) {
                  cleanData[key] = value.toString('utf8');
                } else if (typeof value === 'object') {
                  cleanData[key] = JSON.stringify(value);
                } else {
                  cleanData[key] = value;
                }
              }
            }

            if (Object.keys(cleanData).length > 0) {
              createDescription += ` - Complete Data: ${JSON.stringify(cleanData)}`;
            }
          }

          return createDescription;

        case 'UPDATE':
          // Try to get meaningful name from request body or use ID
          let updateName = '';
          if (module === 'Ministries') {
            updateName = data.ministry_name || (entityId ? `#${entityId}` : '');
          } else if (module === 'Events') {
            updateName = data.title || (entityId ? `#${entityId}` : '');
          } else {
            updateName = data.name || data.title || data.firstname || data.email ||
                      (data.firstname && data.lastname ? `${data.firstname} ${data.lastname}` : null) ||
                      (entityId ? `#${entityId}` : '');
          }

          // Add more context based on module
          let updateContext = '';
          if (module === 'Members') {
            updateContext = data.email ? ` (Email: ${data.email})` : '';
          } else if (module === 'Events') {
            updateContext = data.start_date ? ` (Date: ${data.start_date})` : '';
          } else if (module === 'Ministries') {
            updateContext = data.schedule ? ` (Schedule: ${data.schedule})` : '';
          }

          let updateDescription = `Updated ${entityName}${updateName ? `: ${updateName}` : (entityId ? ` #${entityId}` : '')}${updateContext}`;

          // Add before/after data for modules with edit forms
          const modulesWithEditForms = [
            'Members', 'Accounts', 'Events', 'Ministries', 'Departments',
            'Department Officers', 'Church Leaders', 'Tithes & Offerings',
            'Water Baptism', 'Burial Service', 'Child Dedication', 'Marriage Service',
            'Approvals', 'Forms', 'Content Management'
          ];

          if (modulesWithEditForms.includes(module)) {
            // Get old data if available
            const oldData = req.record_before_update;
            const newData = data;

            if (oldData && Object.keys(newData).length > 0) {
              // Format old data
              const cleanOldData = {};
              for (const [key, value] of Object.entries(oldData)) {
                if (value !== null && value !== undefined && value !== '') {
                  if (Buffer.isBuffer(value)) {
                    cleanOldData[key] = value.toString('utf8');
                  } else if (typeof value === 'object') {
                    cleanOldData[key] = JSON.stringify(value);
                  } else {
                    cleanOldData[key] = value;
                  }
                }
              }

              // Format new data
              const cleanNewData = {};
              for (const [key, value] of Object.entries(newData)) {
                if (value !== null && value !== undefined && value !== '') {
                  if (Buffer.isBuffer(value)) {
                    cleanNewData[key] = value.toString('utf8');
                  } else if (typeof value === 'object') {
                    cleanNewData[key] = JSON.stringify(value);
                  } else {
                    cleanNewData[key] = value;
                  }
                }
              }

              if (Object.keys(cleanOldData).length > 0 || Object.keys(cleanNewData).length > 0) {
                updateDescription += ` - Before: ${JSON.stringify(cleanOldData)} | After: ${JSON.stringify(cleanNewData)}`;
              }
            } else if (Object.keys(newData).length > 0) {
              // Fallback: just show new data if old data not available
              const cleanData = {};
              for (const [key, value] of Object.entries(newData)) {
                if (value !== null && value !== undefined && value !== '') {
                  if (Buffer.isBuffer(value)) {
                    cleanData[key] = value.toString('utf8');
                  } else if (typeof value === 'object') {
                    cleanData[key] = JSON.stringify(value);
                  } else {
                    cleanData[key] = value;
                  }
                }
              }

              if (Object.keys(cleanData).length > 0) {
                updateDescription += ` - Updated Data: ${JSON.stringify(cleanData)}`;
              }
            }
          }

          return updateDescription;

        case 'DELETE':
          // For delete, show complete record data like archives do
          let deleteDescription = `Deleted ${entityName}`;

          // Add identifying information
          const identifiers = [];
          if (data.name) identifiers.push(`"${data.name}"`);
          else if (data.title) identifiers.push(`"${data.title}"`);
          else if (data.firstname && data.lastname) identifiers.push(`${data.firstname} ${data.lastname}`);
          else if (data.firstname) identifiers.push(data.firstname);
          else if (data.email) identifiers.push(data.email);
          else if (entityId) identifiers.push(`ID: ${entityId}`);

          if (identifiers.length > 0) {
            deleteDescription += ` (${identifiers[0]})`;
          }

          // Add module context
          if (module && module !== 'Unknown Module') {
            deleteDescription += ` from ${module}`;
          }

          // Add complete record data if available (like archives)
          if (Object.keys(data).length > 0) {
            // Format the complete data as JSON, excluding null/undefined values
            const cleanData = {};
            for (const [key, value] of Object.entries(data)) {
              if (value !== null && value !== undefined && value !== '') {
                if (Buffer.isBuffer(value)) {
                  cleanData[key] = value.toString('utf8');
                } else if (typeof value === 'object') {
                  cleanData[key] = JSON.stringify(value);
                } else {
                  cleanData[key] = value;
                }
              }
            }

            if (Object.keys(cleanData).length > 0) {
              deleteDescription += ` - Complete Data: ${JSON.stringify(cleanData)}`;
            }
          }

          return deleteDescription;

        case 'RESTORE':
          const restoreDetails = [];
          if (data.name) restoreDetails.push(`"${data.name}"`);
          else if (entityId) restoreDetails.push(`ID: ${entityId}`);
          if (module && module !== 'Unknown Module') restoreDetails.push(`to ${module}`);

          return `Restored ${entityName}${restoreDetails.length ? ` (${restoreDetails.join(', ')})` : ''}`;

        case 'EXPORT':
          // Include export details from query params
          const exportDetails = [];
          if (query.start_date || query.end_date) {
            exportDetails.push(`date range: ${query.start_date || 'start'} to ${query.end_date || 'end'}`);
          }
          if (query.format) exportDetails.push(`format: ${query.format}`);
          if (query.type) exportDetails.push(`type: ${query.type}`);
          if (query.search) exportDetails.push(`search: "${query.search}"`);
          if (query.ageRange && query.ageRange !== 'All Ages') exportDetails.push(`age: ${query.ageRange}`);
          if (query.gender && query.gender !== 'All Genders') exportDetails.push(`gender: ${query.gender}`);

          return `Exported ${module} data${exportDetails.length ? ` (${exportDetails.join(', ')})` : ''}`;

        case 'PRINT':
          // Include print details from query params
          const printDetails = [];
          if (query.start_date || query.end_date) {
            printDetails.push(`date range: ${query.start_date || 'start'} to ${query.end_date || 'end'}`);
          }
          if (query.type) printDetails.push(`type: ${query.type}`);
          if (query.search) printDetails.push(`search: "${query.search}"`);
          if (query.ageRange && query.ageRange !== 'All Ages') printDetails.push(`age: ${query.ageRange}`);
          if (query.gender && query.gender !== 'All Genders') printDetails.push(`gender: ${query.gender}`);

          return `Printed ${module} data${printDetails.length ? ` (${printDetails.join(', ')})` : ''}`;

        case 'VIEW':
          // More detailed view descriptions
          let viewDetails = [];
          if (entityId) {
            viewDetails.push(`specific ${entityName} (ID: ${entityId})`);
          } else if (query.search) {
            viewDetails.push(`search results for "${query.search}"`);
          } else if (query.page && query.pageSize) {
            viewDetails.push(`page ${query.page} (${query.pageSize} items per page)`);
          } else {
            viewDetails.push('list/overview');
          }

          // Add filters
          const filters = [];
          if (query.ageRange && query.ageRange !== 'All Ages') filters.push(`age: ${query.ageRange}`);
          if (query.gender && query.gender !== 'All Genders') filters.push(`gender: ${query.gender}`);
          if (query.joinMonth && query.joinMonth !== 'All Months') filters.push(`joined: ${query.joinMonth}`);
          if (query.start_date || query.end_date) filters.push(`date range: ${query.start_date || 'start'} to ${query.end_date || 'end'}`);

          if (filters.length > 0) {
            viewDetails.push(`with filters: ${filters.join(', ')}`);
          }

          return `Viewed ${module} ${viewDetails.join(' - ')}`;

        case 'LOGIN':
          return `User logged in successfully`;

        case 'LOGOUT':
          return `User logged out`;

        default:
          return `${action} ${entityName}${entityId ? ` #${entityId}` : ''}`;
      }
    };

    // Determine action type from method and full path
    if (method === 'POST') {
      if (fullPath.includes('/login')) {
        actionType = 'LOGIN';
        module = 'Authentication';
        description = 'User login attempt';
        entityType = null;
        entityId = null;
      } else if (fullPath.includes('/restore')) {
        actionType = 'RESTORE';
        description = generateDescription('RESTORE', entityType, entityId, module, body);
      } else if (fullPath.includes('/create') || !isId) {
        actionType = 'CREATE';
        description = generateDescription('CREATE', entityType, entityId, module, body);
      } else {
        actionType = 'UPDATE';
        description = generateDescription('UPDATE', entityType, entityId, module, body);
      }
    } else if (method === 'PUT') {
      actionType = 'UPDATE';
      description = generateDescription('UPDATE', entityType, entityId, module, body);
    } else if (method === 'DELETE') {
      actionType = 'DELETE';
      description = generateDescription('DELETE', entityType, entityId, module, body);
    } else if (method === 'GET') {
      if (fullPath.includes('/export') || fullPath.includes('/download')) {
        actionType = 'EXPORT';
        description = generateDescription('EXPORT', entityType, entityId, module, body);
      } else if (fullPath.includes('/print')) {
        actionType = 'PRINT';
        description = generateDescription('PRINT', entityType, entityId, module, body);
      } else {
        // Enhanced view logging for specific modules
        if (fullPath.includes('/ministries/getAllMinistries') ||
            fullPath.includes('/ministries/getMinistryById') ||
            fullPath.includes('/ministries/getMinistriesByMemberId')) {
          actionType = 'VIEW_MINISTRY';
          module = 'Ministries';
          description = generateDescription('VIEW', entityType, entityId, 'Ministries', body);
        } else if (fullPath.includes('/accounts/getAllAccounts') ||
                   fullPath.includes('/accounts/getAccountById') ||
                   fullPath.includes('/accounts/me')) {
          actionType = 'VIEW_ACCOUNT';
          module = 'Accounts';
          description = generateDescription('VIEW', entityType, entityId, 'Accounts', body);
        } else if (fullPath.includes('/events/getAllEvents') ||
                   fullPath.includes('/events/getEventById') ||
                   fullPath.includes('/events/getEventsByMemberId') ||
                   fullPath.includes('/events/getSermonEvents') ||
                   fullPath.includes('/events/getCompletedSermonEvents')) {
          actionType = 'VIEW_EVENT';
          module = 'Events';
          description = generateDescription('VIEW', entityType, entityId, 'Events', body);
        } else {
          actionType = 'VIEW';
          description = generateDescription('VIEW', entityType, entityId, module, body);
        }
      }
    }

    // Special handling for logout
    if (fullPath.includes('/logout')) {
      actionType = 'LOGOUT';
      module = 'Authentication';
      description = 'User logged out';
      entityType = null;
      entityId = null;
    }

    return {
      action_type: actionType,
      module: module,
      description: description,
      entity_type: entityType,
      entity_id: entityId
    };
  };

  // Intercept response methods to log after response is sent
  res.json = function(data) {
    const actionDetails = determineActionDetails();
    logAction(actionDetails);
    return originalJson.call(this, data);
  };

  res.send = function(data) {
    const actionDetails = determineActionDetails();
    logAction(actionDetails);
    return originalSend.call(this, data);
  };

  res.end = function(data) {
    const actionDetails = determineActionDetails();
    logAction(actionDetails);
    return originalEnd.call(this, data);
  };

  next();
};

module.exports = auditTrailMiddleware;


