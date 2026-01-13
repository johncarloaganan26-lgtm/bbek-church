const systemLogsRecords = require('../dbHelpers/systemLogsRecords');

// Middleware to automatically log user actions to system_logs
const systemLogsMiddleware = (req, res, next) => {
  // Only log authenticated requests
  if (!req.user) {
    return next();
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

      const logData = {
        user_id: userInfo.account?.acc_id || userInfo.acc_id,
        user_name: `${memberInfo.firstname || ''} ${memberInfo.lastname || ''}`.trim() || userInfo.email || userInfo.account?.email,
        role: userInfo.account?.position || userInfo.position || 'member',
        action: actionData.action,
        page: actionData.page,
        description: actionData.description,
        ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
        device_info: req.get('User-Agent') || 'unknown'
      };

      await systemLogsRecords.createLog(logData);
    } catch (error) {
      console.error('System logs logging error:', error);
      // Don't fail the request if logging fails
    }
  };

  // Determine action type and details from request
  const determineActionDetails = () => {
    const method = req.method;
    const path = req.path;
    const baseUrl = req.baseUrl || '';

    // Extract entity ID from path (usually at the end)
    const pathParts = path.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];

    // Check if last part looks like an ID (numeric or UUID-like)
    const isId = /^\d+$/.test(lastPart) || /^[a-f0-9-]{8,}$/i.test(lastPart);

    let action = 'View';
    let page = 'Unknown Page';
    let description = '';

    // Determine page from path
    if (path.includes('/members')) {
      page = 'Member Page';
    } else if (path.includes('/accounts')) {
      page = 'Account Page';
    } else if (path.includes('/events')) {
      page = 'Events Page';
    } else if (path.includes('/ministries')) {
      page = 'Ministries Page';
    } else if (path.includes('/departments')) {
      page = 'Departments Page';
    } else if (path.includes('/tithes')) {
      page = 'Tithes & Offerings Page';
    } else if (path.includes('/transactions')) {
      page = 'Transactions Page';
    } else if (path.includes('/water-baptisms')) {
      page = 'Water Baptism Page';
    } else if (path.includes('/burial-services')) {
      page = 'Burial Service Page';
    } else if (path.includes('/child-dedications')) {
      page = 'Child Dedication Page';
    } else if (path.includes('/marriage-services')) {
      page = 'Marriage Service Page';
    } else if (path.includes('/approvals')) {
      page = 'Approvals Page';
    } else if (path.includes('/dashboard')) {
      page = 'Dashboard';
    } else if (path.includes('/cms')) {
      page = 'Content Management Page';
    } else if (path.includes('/archives')) {
      page = 'Archives Page';
    } else if (path.includes('/system-logs')) {
      page = 'System Logs Page';
    }

    // Determine action from method and path
    if (method === 'POST') {
      if (path.includes('/login')) {
        action = 'Login';
        page = 'Login Page';
        description = 'User logged in successfully';
      } else if (path.includes('/create') || !isId) {
        action = 'Create';
        description = `Created new record on ${page}`;
      } else {
        action = 'Update';
        description = `Updated record on ${page}`;
      }
    } else if (method === 'PUT') {
      action = 'Update';
      description = `Updated record on ${page}`;
    } else if (method === 'DELETE') {
      action = 'Delete';
      description = `Deleted record on ${page}`;
    } else if (method === 'GET') {
      if (path.includes('/export') || path.includes('/download')) {
        action = 'Export';
        description = `Exported data from ${page}`;
      } else if (path.includes('/print')) {
        action = 'Print';
        description = `Printed data from ${page}`;
      } else {
        action = 'View';
        description = `Viewed ${page}`;
      }
    }

    // Special handling for logout
    if (path.includes('/logout')) {
      action = 'Logout';
      page = 'Dashboard';
      description = 'User logged out from the system';
    }

    return {
      action: action,
      page: page,
      description: description
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

module.exports = systemLogsMiddleware;