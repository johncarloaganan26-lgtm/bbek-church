/**
 * Safely convert Buffer or any value to plain text string
 * @param {*} value - Value to convert
 * @param {String} defaultValue - Default value if conversion fails
 * @returns {String} Plain text string representation
 */
function safeToString(value, defaultValue = null) {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return defaultValue;
    }
  }
  
  return String(value);
}

/**
 * Convert any value to plain text (no IDs, no Buffers, just text)
 * @param {*} value - Value to convert
 * @param {String} defaultValue - Default value if conversion fails
 * @returns {String} Plain text string
 */
function toPlainText(value, defaultValue = '') {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  // Handle Buffer - convert to UTF-8 string
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8').trim();
  }
  
  // Handle objects - convert to readable text
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return defaultValue;
    }
  }
  
  // Handle numbers - convert to string
  if (typeof value === 'number') {
    return String(value);
  }
  
  // Handle booleans - convert to string
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  // Handle strings - trim and return
  return String(value).trim();
}

const { createAuditLog } = require('../dbHelpers/auditTrailRecords');
const { query } = require('../database/db');

/**
 * Audit Trail Middleware
 * Automatically logs user actions to the audit trail
 */

/**
 * Get user information from database based on user_id (acc_id)
 * @param {String} userId - User/Account ID
 * @returns {Promise<Object>} User information
 */
async function getUserInfo(userId) {
  try {
    if (!userId) return null;

    // Get account info - only email needed
    const sql = `
      SELECT 
        a.acc_id,
        a.email
      FROM tbl_accounts a
      WHERE a.acc_id = ?
    `;
    const [rows] = await query(sql, [userId]);
    
    if (rows.length > 0) {
      return {
        user_id: rows[0].acc_id,
        user_email: rows[0].email || null
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user info for audit trail:', error);
    return null;
  }
}

/**
 * Extract entity type and ID from request path
 * Returns plain text descriptions instead of IDs
 * @param {String} path - Request path
 * @param {String} method - HTTP method
 * @returns {Object} Entity type and description (text, not IDs)
 */
function extractEntityInfo(path, method) {
  // Map API paths to entity types based on actual routes in index.js
  // Order matters - more specific paths should come first
  const pathMappings = {
    '/api/church-records/members': 'member',
    '/api/church-records/accounts': 'account',
    '/api/church-records/departments': 'department',
    '/api/church-records/ministries': 'ministry',
    '/api/church-records/events': 'event',
    '/api/church-records/approvals': 'approval',
    '/api/church-records/tithes': 'tithe',
    '/api/church-records/church-leaders': 'church_leader',
    '/api/church-records/department-officers': 'department_officer',
    '/api/church-records/child-dedications': 'child_dedication',
    '/api/church-records/burial-services': 'burial_service',
    '/api/services/water-baptisms': 'water_baptism',
    '/api/services/marriage-services': 'marriage_service',
    '/api/transactions': 'transaction',
    '/api/member-registration': 'member_registration',
    '/api/audit-trail': 'audit_trail',
    '/api/archives': 'archive',
    '/api/announcements': 'announcement',
    '/api/forms': 'form',
    '/api/cms': 'cms_page',
    '/api/dashboard': 'dashboard'
  };

  let entityType = 'unknown';
  let entityDescription = 'Unknown entity';

  // Find matching path prefix (check longest matches first)
  const sortedPrefixes = Object.entries(pathMappings).sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, type] of sortedPrefixes) {
    if (path.startsWith(prefix)) {
      entityType = type;
      // Create a readable description from the path
      entityDescription = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      break;
    }
  }

  // If still unknown, try to infer from path segments
  if (entityType === 'unknown') {
    const pathSegments = path.split('/').filter(seg => seg && !seg.includes('?'));
    
    // Try to extract entity type from path segments
    // e.g., /api/something/action -> 'something'
    if (pathSegments.length >= 2 && pathSegments[0] === 'api') {
      const potentialEntity = pathSegments[1];
      // Convert kebab-case or snake_case to readable text
      const normalizedEntity = potentialEntity
        .replace(/-/g, '_')
        .toLowerCase();
      
      // Only use if it looks like a valid entity name (alphanumeric and underscores)
      if (/^[a-z][a-z0-9_]*$/.test(normalizedEntity)) {
        entityType = normalizedEntity;
        entityDescription = normalizedEntity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
  }

  return { entityType, entityDescription };
}

/**
 * Convert request data to plain text description
 * No IDs, no Buffers - just readable text of what the data is
 * @param {Object} req - Express request object
 * @param {String} entityType - Type of entity
 * @returns {Object} Plain text data description
 */
function getDataAsText(req, entityType) {
  const result = {
    action_description: '',
    data_summary: '',
    data_details: []
  };

  // Build action description
  const method = req.method.toUpperCase();
  const path = req.path;
  result.action_description = `${method} ${path}`;

  // If there's a body, summarize it as plain text
  if (req.body && Object.keys(req.body).length > 0) {
    const textParts = [];
    
    for (const [key, value] of Object.entries(req.body)) {
      // Skip sensitive fields
      if (['password', 'token', 'secret', 'key'].includes(key.toLowerCase())) {
        textParts.push(`${key}: [REDACTED]`);
      } else {
        const textValue = toPlainText(value, 'null');
        textParts.push(`${key}: ${textValue}`);
      }
    }
    
    result.data_summary = textParts.join(', ');
    result.data_details = textParts;
  }

  return result;
}

/**
 * Create audit log entry with plain text data (no IDs, no Buffers)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {String} actionType - Action type override (optional)
 * @param {String} entityType - Entity type override (optional)
 * @param {String} description - Description override (optional)
 * @param {Object} oldValues - Old values for UPDATE actions (optional) - will be converted to text
 * @param {Object} newValues - New values for CREATE/UPDATE actions (optional) - will be converted to text
 * @param {String} status - Status (success, failed, error) - default: 'success'
 * @param {String} errorMessage - Error message if status is not success (optional)
 */
async function logAuditAction(req, res, options = {}) {
  try {
    // Don't log audit trail routes themselves to avoid recursion
    if (req.path.startsWith('/api/audit-trail')) {
      return;
    }
    
    // Don't log if user is not authenticated (unless it's a login action)
    if (!req.user && !req.path.includes('/login')) {
      return;
    }

    const {
      actionType: overrideActionType,
      entityType: overrideEntityType,
      description: overrideDescription,
      oldValues,
      newValues,
      status: overrideStatus = 'success',
      errorMessage
    } = options;

    // Get user info - only store email (user_id and user_email only)
    let userInfo = {
      user_id: toPlainText(req.user?.acc_id || req.user?.user_id || 'anonymous'),
      user_email: toPlainText(req.user?.email || null)
    };

    // Fetch full user info if we have user_id
    if (userInfo.user_id && userInfo.user_id !== 'anonymous') {
      const fullUserInfo = await getUserInfo(userInfo.user_id);
      if (fullUserInfo) {
        userInfo = {
          user_id: toPlainText(fullUserInfo.user_id),
          user_email: toPlainText(fullUserInfo.user_email)
        };
      }
    }

    // Extract entity info - get plain text description instead of ID
    const { entityType: extractedEntityType, entityDescription } = extractEntityInfo(req.path, req.method);
    const finalEntityType = overrideEntityType || extractedEntityType;
    
    // Log warning if entity type is still unknown (for debugging)
    if (finalEntityType === 'unknown' && !overrideEntityType) {
      console.warn(`[Audit Trail] Unknown entity type for path: ${req.method} ${req.path}`);
    }

    // Don't log VIEW actions - only log CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, VIEW_LIST
    const finalActionType = overrideActionType || getActionType(req.method, req.path);
    if (!finalActionType) {
      return; // Skip logging VIEW actions (single record views)
    }

    // Get the route that was accessed as plain text
    const routeAccessed = toPlainText(req.originalUrl || req.path);
    
    // Use route as description (or override if provided)
    const description = overrideDescription || routeAccessed;

    // Get IP address and user agent as plain text
    const ipAddress = toPlainText(req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']);
    const userAgent = toPlainText(req.headers['user-agent']);

    // Process values to plain text - no Buffers, no IDs, just text
    let processedOldValues = null;
    let processedNewValues = null;

    if (oldValues) {
      processedOldValues = convertToPlainTextObject(oldValues);
    }

    if (newValues) {
      processedNewValues = convertToPlainTextObject(newValues);
    } else if (req.method !== 'GET' && req.body) {
      processedNewValues = convertToPlainTextObject(req.body);
    }

    // Prepare audit data with plain text only
    const auditData = {
      ...userInfo,
      action_type: toPlainText(finalActionType),
      entity_type: toPlainText(finalEntityType),
      entity_id: toPlainText(entityDescription), // Store description instead of ID
      description: toPlainText(description),
      ip_address: ipAddress,
      user_agent: userAgent,
      old_values: processedOldValues,
      new_values: processedNewValues,
      status: toPlainText(overrideStatus),
      error_message: toPlainText(errorMessage)
    };

    // Create audit log (non-blocking - don't fail the request if logging fails)
    createAuditLog(auditData).catch(error => {
      console.error('Error creating audit log (non-blocking):', error);
    });
  } catch (error) {
    // Don't throw error - audit logging should never break the main request
    console.error('Error in audit trail middleware:', error);
  }
}

/**
 * Convert an object to plain text values (no Buffers, no IDs)
 * @param {Object} obj - Object to convert
 * @returns {Object} Object with plain text values
 */
function convertToPlainTextObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return toPlainText(obj);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields
    if (['password', 'token', 'secret', 'key', 'acc_password'].includes(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = toPlainText(value);
    }
  }
  return result;
}

/**
 * Determine action type from HTTP method and path
 * Based on actual route patterns in the codebase
 * @param {String} method - HTTP method
 * @param {String} path - Request path
 * @returns {String} Action type
 */
function getActionType(method, path) {
  const upperMethod = method.toUpperCase();
  const lowerPath = path.toLowerCase();
  
  // Check for specific action patterns in path (order matters - check specific first)
  
  // Authentication actions
  if (lowerPath.includes('/login')) return 'LOGIN';
  if (lowerPath.includes('/logout')) return 'LOGOUT';
  if (lowerPath.includes('/forgotpassword')) return 'FORGOT_PASSWORD';
  if (lowerPath.includes('/verifycredentials')) return 'VERIFY_CREDENTIALS';
  
  // Certificate actions
  if (lowerPath.includes('/getcertificatedata')) return 'VIEW_CERTIFICATE';
  
  // Export actions
  if (lowerPath.includes('/exportexcel') || lowerPath.includes('/export')) return 'EXPORT';
  
  // Check actions
  if (lowerPath.includes('/check')) return 'CHECK';
  
  // CRUD actions based on route patterns
  if (lowerPath.includes('/create')) return 'CREATE';
  if (lowerPath.includes('/register')) return 'CREATE'; // member registration
  if (lowerPath.includes('/update')) return 'UPDATE';
  if (lowerPath.includes('/delete')) return 'DELETE';
  
  // GET requests - don't log VIEW actions for single records
  // Only log VIEW_LIST for list views
  if (upperMethod === 'GET') {
    // Patterns that indicate viewing a list:
    // - /getAllX
    // - /getAllXForSelect
    // - /getTotalsByServiceType (summary/statistics)
    if (lowerPath.includes('/getall') || 
        lowerPath.includes('/gettotals') ||
        lowerPath.includes('/getaudittrailsummary')) {
      return 'VIEW_LIST';
    }
    
    // Don't log VIEW actions for single records - return null to skip
    return null;
  }
  
  // Map HTTP methods to action types (fallback)
  switch (upperMethod) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Middleware to log actions after response is sent
 * This ensures we can log the status of the action
 */
const auditTrailMiddleware = (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;
  const originalJson = res.json;

  // Override res.json to capture response
  res.json = function(body) {
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };

  // Override res.end to log after response is sent
  res.end = function(chunk, encoding) {
    // Log audit action after response is sent (non-blocking)
    setImmediate(async () => {
      try {
        // Determine status based on status code and response body
        let status = 'success'; // Default to success
        let errorMessage = null;

        // Check status code first
        if (res.statusCode) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            status = 'success';
          } else if (res.statusCode >= 400 && res.statusCode < 500) {
            status = 'failed';
          } else if (res.statusCode >= 500) {
            status = 'error';
          }
        }

        // Also check response body for success/failure indicators
        if (res.locals.responseBody) {
          const responseBody = res.locals.responseBody;
          
          // If response has explicit success: false, mark as failed
          if (responseBody.success === false) {
            status = 'failed';
            errorMessage = responseBody.error || responseBody.message || null;
          }
          // If response has explicit success: true, ensure status is success
          else if (responseBody.success === true) {
            status = 'success';
          }
          // If response has error field, mark as failed/error
          else if (responseBody.error) {
            status = res.statusCode >= 500 ? 'error' : 'failed';
            errorMessage = responseBody.error || responseBody.message || null;
          }
        }

        await logAuditAction(req, res, {
          status,
          errorMessage: status !== 'success' ? errorMessage : null
        });
      } catch (error) {
        console.error('Error in audit trail middleware callback:', error);
      }
    });

    // Call original end
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Helper function to manually log an action (for use in route handlers)
 * @param {Object} req - Express request object
 * @param {Object} options - Audit log options
 */
async function manualLogAction(req, options = {}) {
  await logAuditAction(req, null, options);
}

module.exports = {
  auditTrailMiddleware,
  logAuditAction,
  manualLogAction,
  getActionType,
  extractEntityInfo
};

