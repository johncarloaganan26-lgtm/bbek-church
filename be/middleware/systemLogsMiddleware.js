/**
 * SYSTEM LOGS MIDDLEWARE v3 - Full Entity Data
 * Captures the actual entity data from database for complete audit trail
 * Uses tbl_system_logs table
 */

const { query } = require('../database/db');
const { createSystemLog } = require('../dbHelpers/systemLogsRecords');

/**
 * Get action type from request method and route
 * @param {Object} req - Express request object
 * @returns {String} Action type as plain text
 */
function getActionType(req) {
  const method = req.method.toUpperCase();
  const path = req.path || req.originalUrl || '';

  // Skip certain paths
  if (path.includes('/getAll') || path.includes('/getArchives') || path.includes('/export')) {
    return 'VIEW_LIST';
  }

  if (path.includes('/login')) {
    return 'LOGIN';
  }
  if (path.includes('/logout')) {
    return 'LOGOUT';
  }

  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'VIEW_LIST';
  }
}

/**
 * Get entity type from route path
 * @param {Object} req - Express request object
 * @returns {String} Entity type as plain text
 */
function getEntityType(req) {
  const path = req.path || req.originalUrl || '';

  // Map routes to entity types (readable text)
  const entityMappings = {
    '/church-records/members': 'Member',
    '/church-records/accounts': 'Account',
    '/church-records/departments': 'Department',
    '/church-records/ministry': 'Ministry',
    '/church-records/events': 'Event',
    '/church-records/approval': 'Approval',
    '/church-records/tithes': 'Tithe',
    '/church-records/church-leaders': 'Church Leader',
    '/church-records/department-officers': 'Department Officer',
    '/services/waterBaptism': 'Water Baptism',
    '/services/burialService': 'Burial Service',
    '/services/marriageService': 'Marriage Service',
    '/services/childDedication': 'Child Dedication',
    '/transactions': 'Transaction',
    '/announcements': 'Announcement',
    '/cms': 'CMS',
    '/archives': 'Archive'
  };

  for (const [route, entity] of Object.entries(entityMappings)) {
    if (path.includes(route)) {
      return entity;
    }
  }

  // Default fallback
  return 'System';
}

/**
 * Get entity ID from request
 * @param {Object} req - Express request object
 * @returns {String} Entity ID or empty string
 */
function getEntityId(req) {
  // Try params first (e.g., /:id)
  if (req.params && req.params.id) {
    return req.params.id;
  }
  // Try body (for DELETE with body)
  if (req.body && req.body.id) {
    return req.body.id;
  }
  return '';
}

/**
 * Fetch actual entity data from database
 * @param {String} entityType - Type of entity
 * @param {String} entityId - Entity ID
 * @returns {Object} Entity data or null
 */
async function fetchEntityData(entityType, entityId) {
  if (!entityId || !entityType) return null;

  const idNum = parseInt(entityId);
  if (isNaN(idNum)) return null;

  try {
    switch (entityType) {
      case 'Member': {
        const [rows] = await query(
          `SELECT id, firstname, lastname, email, contact_number, civil_status, gender, birthday, address, membership_status, date_created 
           FROM tbl_members WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Account': {
        const [rows] = await query(
          `SELECT id, member_id, account_type, account_name, account_number, bank_name, date_created 
           FROM tbl_accounts WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Department': {
        const [rows] = await query(
          `SELECT id, department_name, department_code, description, status, date_created 
           FROM tbl_departments WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Ministry': {
        const [rows] = await query(
          `SELECT id, ministry_name, ministry_code, description, leader_id, status, date_created 
           FROM tbl_ministries WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Event': {
        const [rows] = await query(
          `SELECT id, event_name, event_type, event_date, location, description, status, date_created 
           FROM tbl_events WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Water Baptism': {
        const [rows] = await query(
          `SELECT id, firstname, lastname, email, contact_number, baptism_date, pastor, location, status, date_created 
           FROM tbl_water_baptism_registration WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Burial Service': {
        const [rows] = await query(
          `SELECT id, deceased_name, date_of_birth, date_of_death, contact_person, contact_number, pastor, location, status, date_created 
           FROM tbl_burial_service WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Marriage Service': {
        const [rows] = await query(
          `SELECT id, groom_name, bride_name, marriage_date, contact_person, contact_number, pastor, location, status, date_created 
           FROM tbl_marriage_service WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Child Dedication': {
        const [rows] = await query(
          `SELECT id, child_name, parent_names, dedication_date, pastor, location, status, date_created 
           FROM tbl_child_dedication WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Tithe': {
        const [rows] = await query(
          `SELECT id, member_id, amount, tithe_date, payment_method, reference_number, status, date_created 
           FROM tbl_tithes WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Transaction': {
        const [rows] = await query(
          `SELECT id, transaction_type, member_id, amount, description, payment_method, reference_number, status, date_created 
           FROM tbl_transactions WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Church Leader': {
        const [rows] = await query(
          `SELECT id, firstname, lastname, position, department_id, date_appointed, status, date_created 
           FROM tbl_church_leaders WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Department Officer': {
        const [rows] = await query(
          `SELECT id, member_id, department_id, position, date_appointed, status, date_created 
           FROM tbl_department_officers WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      case 'Announcement': {
        const [rows] = await query(
          `SELECT id, title, content, announcement_type, publish_date, expiry_date, status, date_created 
           FROM tbl_announcements WHERE id = ?`,
          [idNum]
        );
        return rows[0] || null;
      }
      default:
        return null;
    }
  } catch (error) {
    console.error('Error fetching entity data for audit log:', error);
    return null;
  }
}

/**
 * Format entity data as readable text
 * @param {Object} entityData - Entity data object
 * @param {String} entityType - Type of entity
 * @returns {String} Formatted entity data
 */
function formatEntityData(entityData, entityType) {
  if (!entityData) return '(No data found)';

  // Filter out sensitive fields and internal fields
  const excludeFields = ['password', 'token', 'secret', 'acc_password', 'created_at', 'updated_at'];
  
  const filtered = {};
  for (const [key, value] of Object.entries(entityData)) {
    if (!excludeFields.includes(key.toLowerCase()) && key !== 'id') {
      filtered[key] = value;
    }
  }

  // Format as readable key-value pairs
  const entries = Object.entries(filtered).slice(0, 15); // Limit to 15 fields
  if (entries.length === 0) return '(No data)';

  return entries
    .map(([k, v]) => {
      const formattedKey = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const formattedValue = v === null || v === undefined ? '(null)' : String(v);
      return `${formattedKey}: ${formattedValue}`;
    })
    .join('\n');
}

/**
 * Get entity name for display
 * @param {Object} entityData - Entity data from database
 * @param {String} entityType - Type of entity
 * @returns {String} Entity name
 */
function getEntityDisplayName(entityData, entityType) {
  if (!entityData) return '(not found)';

  // Common name fields
  const nameFields = ['firstname', 'lastname', 'name', 'event_name', 'department_name', 'ministry_name', 'title', 'deceased_name', 'groom_name', 'bride_name', 'child_name'];
  
  for (const field of nameFields) {
    if (entityData[field]) {
      // Combine firstname and lastname if both exist
      if (field === 'firstname' && entityData.lastname) {
        return `${entityData[field]} ${entityData.lastname}`;
      }
      return String(entityData[field]);
    }
  }

  // Fallback: show entity type and ID
  return `${entityType} #${entityData.id}`;
}

/**
 * Build description text with full entity data
 * @param {Object} req - Express request object
 * @param {Object} body - Request body (sanitized)
 * @param {String} actionType - Action type
 * @param {String} entityType - Entity type
 * @param {String} entityId - Entity ID
 * @param {Object} entityData - Actual entity data from database
 * @returns {String} Description as plain text
 */
async function buildFullDescription(req, body, actionType, entityType, entityId, entityData) {
  const path = req.path || req.originalUrl || '';
  const method = req.method.toUpperCase();

  let description = '';

  // Header with action info
  description += `=== ${actionType} ${entityType} ===\n`;
  description += `Path: ${method} ${path}\n\n`;

  // Entity info (the actual data from database)
  if (entityData) {
    description += `--- ACTUAL DATA (from database) ---\n`;
    description += formatEntityData(entityData, entityType);
    description += '\n\n';
  }

  // Request data (what was submitted)
  if (body && Object.keys(body).length > 0) {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'acc_password'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Remove internal fields
    delete sanitized.id;
    delete sanitized.date_created;

    if (Object.keys(sanitized).length > 0) {
      description += `--- SUBMITTED DATA ---\n`;
      const entries = Object.entries(sanitized).slice(0, 15);
      entries.forEach(([k, v]) => {
        description += `${k}: ${v}\n`;
      });
    }
  }

  return description.trim();
}

/**
 * Get user email from request
 * @param {Object} req - Express request object
 * @returns {String} User email or empty string
 */
function getUserEmail(req) {
  if (req.user && req.user.email) {
    return req.user.email;
  }
  if (req.body && req.body.email) {
    return req.body.email;
  }
  if (req.query && req.query.email) {
    return req.query.email;
  }
  return '';
}

/**
 * System logs middleware v3
 * Logs all requests with full entity data from database
 */
const systemLogsMiddleware = async (req, res, next) => {
  // Skip non-API routes
  const path = req.path || req.originalUrl || '';
  if (!path.startsWith('/api/') || path.includes('/login') || path.includes('/register')) {
    return next();
  }

  // Skip GET requests (they're just viewing)
  const actionType = getActionType(req);
  if (actionType === 'VIEW_LIST' || actionType === 'LOGIN' || actionType === 'LOGOUT') {
    return next();
  }

  // Capture original end method
  const originalEnd = res.end;
  let responseBody = '';

  // Override res.end to capture response
  res.end = function (chunk, encoding) {
    responseBody = chunk ? chunk.toString() : '';
    originalEnd.call(this, chunk, encoding);
  };

  // Proceed with request
  res.on('finish', async () => {
    try {
      // Determine status
      const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failed';

      const entityType = getEntityType(req);
      const entityId = getEntityId(req);
      const action = getActionType(req);

      // Fetch actual entity data from database (for UPDATE/DELETE)
      let entityData = null;
      if ((action === 'UPDATE' || action === 'DELETE') && entityId) {
        entityData = await fetchEntityData(entityType, entityId);
      } else if (action === 'CREATE' && req.body) {
        // For CREATE, use the submitted data
        entityData = req.body;
      }

      // Build full description with entity data
      const description = await buildFullDescription(req, req.body, action, entityType, entityId, entityData);

      // Get display name
      const entityName = getEntityDisplayName(entityData, entityType);

      // Build log data (all plain text)
      const logData = {
        user_email: getUserEmail(req),
        action_type: action,
        entity_type: entityType,
        entity_name: entityName,
        description: description,
        ip_address: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '',
        status: status,
        error_message: status === 'failed' ? `HTTP ${res.statusCode}` : null
      };

      // Log to database (fire and forget, don't block response)
      createSystemLog(logData).catch(err => {
        console.error('System logs logging error:', err);
      });
    } catch (error) {
      console.error('System logs middleware error:', error);
    }
  });

  next();
};

module.exports = systemLogsMiddleware;
