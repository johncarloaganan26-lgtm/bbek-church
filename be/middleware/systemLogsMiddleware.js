/**
 * SYSTEM LOGS MIDDLEWARE v2 - Raw Data Only
 * All data stored as plain text, no Buffers, no IDs
 * Uses tbl_system_logs table
 */

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
 * Get entity name/identifier for display
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} body - Request body
 * @returns {String} Entity name as plain text
 */
function getEntityName(req, res, body) {
  // Try to get name from common fields
  const nameFields = ['firstname', 'name', 'title', 'event_name', 'department_name', 'ministry_name', 'email'];
  
  for (const field of nameFields) {
    if (body && body[field]) {
      const value = body[field];
      // If it's an object with firstname/lastname
      if (typeof value === 'object' && value.firstname) {
        return `${value.firstname} ${value.lastname || ''}`.trim();
      }
      return String(value);
    }
  }

  // Try to get from params (e.g., ID in URL)
  if (req.params && req.params.id) {
    return `ID: ${req.params.id}`;
  }

  return '';
}

/**
 * Build description text
 * @param {Object} req - Express request object
 * @param {Object} body - Request body (sanitized)
 * @returns {String} Description as plain text
 */
function buildDescription(req, body) {
  const method = req.method.toUpperCase();
  const path = req.path || req.originalUrl || '';
  const actionType = getActionType(req);
  const entityType = getEntityType(req);

  let description = `${method} ${path}`;

  // Add entity type and action
  description += ` | ${actionType} ${entityType}`;

  // Add body summary (sanitized, no passwords)
  if (body && Object.keys(body).length > 0) {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'acc_password'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Convert to readable string
    const keys = Object.keys(sanitized).slice(0, 5); // Limit to 5 fields
    if (keys.length > 0) {
      const summary = keys.map(k => `${k}`).join(', ');
      description += ` | Data: {${summary}}`;
    }
  }

  return description;
}

/**
 * Get user email from request
 * @param {Object} req - Express request object
 * @returns {String} User email or empty string
 */
function getUserEmail(req) {
  // Try different sources
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
 * System logs middleware v2
 * Logs all requests to tbl_system_logs as plain text data
 */
const systemLogsMiddleware = async (req, res, next) => {
  // Skip non-API routes
  const path = req.path || req.originalUrl || '';
  if (!path.startsWith('/api/') || path.includes('/login') || path.includes('/register')) {
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

      // Build log data (all plain text)
      const logData = {
        user_email: getUserEmail(req),
        action_type: getActionType(req),
        entity_type: getEntityType(req),
        entity_name: getEntityName(req, res, req.body),
        description: buildDescription(req, req.body),
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
