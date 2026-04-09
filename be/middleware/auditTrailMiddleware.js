const auditTrailRecords = require('../dbHelpers/auditTrailRecords');

// Helper function to determine module from path
function determineModule(reqPath, reqBaseUrl) {
  // Check the full path including baseUrl for mounted routes
  const fullPath = (reqBaseUrl || '') + (reqPath || '');

  if (fullPath.includes('/members') || fullPath.includes('/church-records/members')) {
    return 'Members';
  } else if (fullPath.includes('/accounts') || fullPath.includes('/church-records/accounts')) {
    return 'Accounts';
  } else if (fullPath.includes('/events') || fullPath.includes('/church-records/events')) {
    return 'Events';
  } else if (fullPath.includes('/ministries') || fullPath.includes('/church-records/ministries') || fullPath.includes('/ministry')) {
    return 'Ministries';
  } else if (fullPath.includes('/departments') || fullPath.includes('/church-records/departments')) {
    return 'Departments';
  } else if (fullPath.includes('/department-officers') || fullPath.includes('/church-records/department-officers') || fullPath.includes('/departmentofficers')) {
    return 'Department Officers';
  } else if (fullPath.includes('/church-leaders') || fullPath.includes('/church-records/church-leaders') || fullPath.includes('/churchleaders')) {
    return 'Church Leaders';
  } else if (fullPath.includes('/tithes') || fullPath.includes('/church-records/tithes')) {
    return 'Tithes & Offerings';
  } else if (fullPath.includes('/transactions')) {
    return 'Transactions';
  } else if (fullPath.includes('/water-baptisms') || fullPath.includes('/services/water-baptisms') || fullPath.includes('/waterbaptism')) {
    return 'Water Baptism';
  } else if (fullPath.includes('/burial-services') || fullPath.includes('/church-records/burial-services') || fullPath.includes('/burialservice')) {
    return 'Burial Service';
  } else if (fullPath.includes('/child-dedications') || fullPath.includes('/church-records/child-dedications') || fullPath.includes('/childdedication')) {
    return 'Child Dedication';
  } else if (fullPath.includes('/marriage-services') || fullPath.includes('/services/marriage-services') || fullPath.includes('/marriageservice')) {
    return 'Marriage Service';
  } else if (fullPath.includes('/approvals') || fullPath.includes('/church-records/approvals') || fullPath.includes('/approval')) {
    return 'Approvals';
  } else if (fullPath.includes('/archives')) {
    return 'Archives';
  } else if (fullPath.includes('/announcements')) {
    return 'Announcements';
  } else if (fullPath.includes('/cms')) {
    return 'Content Management';
  } else if (fullPath.includes('/dashboard')) {
    return 'Dashboard';
  } else if (fullPath.includes('/forms')) {
    return 'Forms';
  } else if (fullPath.includes('/services/discipleship-requests') || fullPath.includes('/discipleship-requests') || fullPath.includes('/discipleship')) {
    return 'Discipleship';
  }
  return 'System';
}

// Helper function to truncate description if too long (max 5000 chars)
const MAX_DESCRIPTION_LENGTH = 5000;
function truncateDescription(description) {
  if (!description || description.length <= MAX_DESCRIPTION_LENGTH) {
    return description;
  }
  return description.substring(0, MAX_DESCRIPTION_LENGTH - 50) + '... [truncated]';
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
    'tbl_cms_images': 'image_id',
    'tbl_discipleship_requests': 'request_id'
  };
  return primaryKeys[tableName] || 'id';
}

// Middleware to automatically log user actions
const auditTrailMiddleware = async (req, res, next) => {
  // Only log authenticated requests
  if (!req.user) {
    return next();
  }

  // Skip audit trail if explicitly requested (for performance-critical bulk operations)
  if (req.skipAuditTrail) {
    return next();
  }

  // For DELETE and UPDATE operations, try to capture the record data before it's modified/deleted
  // Only capture data in development mode to avoid performance overhead in production
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';

  if (!IS_PRODUCTION && (req.method === 'DELETE' || req.method === 'PUT')) {
    // Extract ID from URL path for routes like /api/church-records/members/deleteMember/123 or /updateMember/123
    const path = req.path || '';
    const pathParts = path.split('/');
    const lastPart = pathParts[pathParts.length - 1];

    // Check if last part looks like an ID (numeric)
    const id = req.params.id || (lastPart && /^\d+$/.test(lastPart) ? lastPart : null);

    if (id) {
      try {
        const { query } = require('../database/db');
        const module = determineModule(req.path, req.baseUrl);

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
            'Content Management': 'tbl_cms_images',
            'Discipleship': 'tbl_discipleship_requests'
          };

          const tableName = tableMap[module];
          if (tableName) {
            const primaryKey = getPrimaryKeyField(tableName);
            const recordSql = `SELECT * FROM \`${tableName}\` WHERE ${primaryKey} = ?`;
            const [recordRows] = await query(recordSql, [id]);

            if (recordRows.length > 0) {
              // Store the record data for later use in logging
              if (req.method === 'DELETE') {
                req.record_to_delete = recordRows[0];
              } else if (req.method === 'PUT') {
                req.record_before_update = recordRows[0];
              }
            }
          }
        }
      } catch (error) {
        // Silently fail if we can't capture the data - audit logging should not block the request
      }
    }
  }

  // Store original response methods to intercept them
  const originalJson = res.json;
  const originalSend = res.send;
  const originalEnd = res.end;

  // Flag to track if we've already logged this request
  let logged = false;

  // Function to log the action
  const logAction = async (actionData, responseData = null) => {
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

              // Include reason if provided
              const reasonText = archive.reason ? ` Reason: ${archive.reason}` : '';

              // Create user-friendly description with key info
              let userFriendlyInfo = '';
              if (cleanArchivedData.firstname || cleanArchivedData.lastname) {
                const name = `${cleanArchivedData.firstname || ''} ${cleanArchivedData.middle_name || ''} ${cleanArchivedData.lastname || ''}`.replace(/\s+/g, ' ').trim();
                if (name) userFriendlyInfo = ` - ${name}`;
              } else if (cleanArchivedData.name) {
                userFriendlyInfo = ` - ${cleanArchivedData.name}`;
              } else if (cleanArchivedData.member_id) {
                userFriendlyInfo = ` (Member ID: ${cleanArchivedData.member_id})`;
              } else if (cleanArchivedData.original_id) {
                userFriendlyInfo = ` (ID: ${cleanArchivedData.original_id})`;
              }

              enhancedDescription = `Deleted archived ${tableName} record${userFriendlyInfo}${reasonText}`;
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


      const isFailed = res.statusCode >= 400;
      let finalDescription = req.auditDescription || enhancedDescription;

      // Prepend failure status to description if it failed
      if (isFailed) {
        finalDescription = `FAILED ATTEMPT: ${finalDescription}`;
      }

      // Extract error message from response data if it's a failure
      let errorMessage = null;
      if (isFailed) {
        if (responseData && typeof responseData === 'object') {
          errorMessage = responseData.message || responseData.error || responseData.details || `HTTP ${res.statusCode}`;
          // If message is an object or array, stringify it
          if (typeof errorMessage === 'object') {
            errorMessage = JSON.stringify(errorMessage);
          }
        } else {
          errorMessage = `HTTP ${res.statusCode}`;
        }
      }

      // Use explicit overrides if provided in the request object
      const logData = {
        user_id: userInfo.account?.acc_id || userInfo.acc_id,
        user_email: userInfo.account?.email || userInfo.email,
        user_name: req.auditUserDisplayName || `${memberInfo.firstname || ''} ${memberInfo.lastname || ''}`.trim() || userInfo.name || userInfo.email,
        user_position: userInfo.account?.position || userInfo.position || 'member',
        action_type: req.auditAction || actionData.action_type,
        module: req.auditModule || actionData.module,
        description: truncateDescription(finalDescription),
        entity_type: req.auditEntityType || actionData.entity_type,
        entity_id: req.auditEntityId || actionData.entity_id,
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
        user_agent: null, // Hidden for privacy
        status: isFailed ? 'failed' : 'success',
        error_message: errorMessage,
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
    } else if (fullPath.includes('/services/discipleship-requests') || fullPath.includes('/discipleship-requests') || fullPath.includes('/discipleship')) {
      module = 'Discipleship';
      entityType = 'discipleship_request';
      entityId = isId ? lastPart : null;
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
            (entityId ? `ID ${entityId}` : '');

          // Add more context based on module
          let createContext = '';
          if (module === 'Members') {
            createContext = data.email ? ` with email ${data.email}` : '';
          } else if (module === 'Events') {
            createContext = data.event_date ? ` scheduled for ${data.event_date}` : '';
          } else if (module === 'Water Baptism') {
            createContext = data.baptism_date ? ` set for ${data.baptism_date}` : '';
          }

          let createDescription = `Added a new ${entityName}${createName ? `: ${createName}` : ''}${createContext}.`;

          // Add complete record data at the end for technical reference
          const modulesWithCreateForms = [
            'Members', 'Accounts', 'Events', 'Ministries', 'Departments',
            'Department Officers', 'Church Leaders', 'Tithes & Offerings',
            'Water Baptism', 'Burial Service', 'Child Dedication', 'Marriage Service',
            'Approvals', 'Forms', 'Content Management'
          ];

          if (modulesWithCreateForms.includes(module) && Object.keys(data).length > 0) {
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
              createDescription += ` - Record Data: ${JSON.stringify(cleanData)}`;
            }
          }

          return createDescription;

        case 'UPDATE':
          // Try to get meaningful name from request body or use ID
          let updateName = '';
          if (module === 'Ministries') {
            updateName = data.ministry_name || (entityId ? `ID ${entityId}` : '');
          } else if (module === 'Events') {
            updateName = data.title || (entityId ? `ID ${entityId}` : '');
          } else {
            updateName = data.name || data.title || data.firstname || data.email ||
              (data.firstname && data.lastname ? `${data.firstname} ${data.lastname}` : null) ||
              (entityId ? `ID ${entityId}` : '');
          }

          let updateDescription = `Modified ${entityName}${updateName ? `: ${updateName}` : ''}.`;

          // Add summarized changes
          const oldData = req.record_before_update;
          const newData = data;

          if (oldData && Object.keys(newData).length > 0) {
            const changes = [];
            for (const [key, newVal] of Object.entries(newData)) {
              const oldVal = oldData[key];
              // Skip if same or if it's a sensitive/system field
              if (JSON.stringify(oldVal) === JSON.stringify(newVal) ||
                ['updated_at', 'created_at', 'password', 'token'].includes(key)) continue;

              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              changes.push(`${label} was changed from "${oldVal || 'None'}" to "${newVal || 'None'}"`);
            }

            if (changes.length > 0) {
              if (changes.length <= 3) {
                updateDescription = `Updated ${entityName}${updateName ? `: ${updateName}` : ''}. Changes: ${changes.join('; ')}.`;
              } else {
                updateDescription = `Updated ${entityName}${updateName ? `: ${updateName}` : ''}. Total of ${changes.length} fields were modified.`;
              }
            }

            // Always keep the full JSON at the end for the structured view
            updateDescription += ` - Before: ${JSON.stringify(oldData)} | After: ${JSON.stringify(newData)}`;
          } else if (Object.keys(newData).length > 0) {
            updateDescription += ` - Updated Data: ${JSON.stringify(newData)}`;
          }

          return updateDescription;

        case 'DELETE':
          // For delete, show complete record data like archives do
          let deleteDescription = `Permanently removed ${entityName}`;

          // Add identifying information
          const identifiers = [];
          if (data.name) identifiers.push(`"${data.name}"`);
          else if (data.title) identifiers.push(`"${data.title}"`);
          else if (data.firstname && data.lastname) identifiers.push(`${data.firstname} ${data.lastname}`);
          else if (data.firstname) identifiers.push(data.firstname);
          else if (data.email) identifiers.push(data.email);
          else if (entityId) identifiers.push(`ID ${entityId}`);

          if (identifiers.length > 0) {
            deleteDescription += `: ${identifiers[0]}`;
          }

          if (module && module !== 'Unknown Module') {
            deleteDescription += ` from ${module}.`;
          }

          // Keep JSON at the end
          if (Object.keys(data).length > 0) {
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
              deleteDescription += ` - Removed Data: ${JSON.stringify(cleanData)}`;
            }
          }

          return deleteDescription;

        case 'RESTORE':
          const restoreDetails = [];
          if (data.name) restoreDetails.push(`"${data.name}"`);
          else if (entityId) restoreDetails.push(`ID: ${entityId}`);
          if (module && module !== 'Unknown Module') restoreDetails.push(`to ${module}`);
          // Include restore notes if provided
          if (data.restore_notes) restoreDetails.push(`Note: ${data.restore_notes}`);

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
            viewDetails.push(`a specific ${entityName} (ID ${entityId})`);
          } else if (query.search) {
            viewDetails.push(`the search results for "${query.search}"`);
          } else if (query.page && query.pageSize) {
            viewDetails.push(`page ${query.page} of the list`);
          } else {
            viewDetails.push('the overview list');
          }

          // Add filters
          const filters = [];
          if (query.ageRange && query.ageRange !== 'All Ages') filters.push(`age range: ${query.ageRange}`);
          if (query.gender && query.gender !== 'All Genders') filters.push(`gender: ${query.gender}`);
          if (query.joinMonth && query.joinMonth !== 'All Months') filters.push(`joining month: ${query.joinMonth}`);
          if (query.start_date || query.end_date) filters.push(`date range: ${query.start_date || 'start'} to ${query.end_date || 'end'}`);

          let viewDesc = `Accessed ${viewDetails.join(' ')} in ${module}`;
          if (filters.length > 0) {
            viewDesc += ` with active filters: ${filters.join(', ')}.`;
          } else {
            viewDesc += `.`;
          }

          return viewDesc;

        case 'LOGIN':
          return `User logged in to their account.`;

        case 'LOGOUT':
          return `User logged out of the session.`;

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
  res.json = function (data) {
    const actionDetails = determineActionDetails();
    logAction(actionDetails, data);
    return originalJson.call(this, data);
  };

  res.send = function (data) {
    const actionDetails = determineActionDetails();
    let responseData = data;
    try {
      if (typeof data === 'string') {
        responseData = JSON.parse(data);
      }
    } catch (e) {
      // Not JSON
    }
    logAction(actionDetails, responseData);
    return originalSend.call(this, data);
  };

  res.end = function (data) {
    const actionDetails = determineActionDetails();
    logAction(actionDetails);
    return originalEnd.call(this, data);
  };

  next();
};

module.exports = auditTrailMiddleware;


