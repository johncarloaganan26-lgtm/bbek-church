const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Validates Bearer token from Authorization header
 * 
 * Public routes (exceptions) - routes that don't require authentication:
 * - /api/health
 * - /api/church-records/accounts/login
 * - /api/church-records/accounts/verifyCredentials
 * - /api/church-records/accounts/forgotPassword
 * - /api/member-registration/**
 * - /api/example
 */

// List of public routes that don't require authentication
const publicRoutes = [
  '/api/health',
  '/api/example',
  '/api/church-records/accounts/login',
  '/api/church-records/accounts/verifyCredentials',
  '/api/church-records/accounts/forgotPassword',
  '/api/church-records/accounts/getAccountById',
  '/api/church-records/accounts/updateAccount',
  '/api/church-records/accounts/getAllAccounts',
  // Member registration routes
  '/api/church-records/ministries/getPublicMinistries',
  '/api/church-records/members/getAllMembersForSelect',
  '/api/church-records/members/getAllDepartmentMembersForSelect',
  '/api/church-records/departments/getAllDepartmentsForSelect',
  '/api/church-records/church-leaders/getAllChurchLeadersForSelect',
  '/api/church-records/department-officers/getAllDepartmentOfficersForSelect',
  '/api/church-records/members/getAllMembersWithoutPastorsForSelect',
  '/api/church-records/members/getAllPastorsForSelect',
  '/api/church-records/members/getMemberById',
  '/api/church-records/members/exportCSV',
  '/api/church-records/events/getAllEvents',
  '/api/church-records/ministries/getAllMinistries',
  '/api/member-registration/register/water-baptism',
  '/api/member-registration/register/burial-service',
  // Announcement routes (public for viewing)
  '/api/announcements/getActiveAnnouncementsForUser',
  '/api/announcements/markAsViewed',
  '/api/church-records/events/getSermonEvents',
  // Form routes (public for submission)
  '/api/forms/createForm',
  // Add more public routes as needed
  // add cms table routes here 
  '/api/cms/header',
  '/api/cms/home',
  '/api/cms/about',
  '/api/cms/imnew',
  '/api/cms/services',
  '/api/cms/events',
  '/api/cms/give',
  '/api/cms/footer',
  '/api/cms/planvisit',
  '/api/cms/waterbaptism',
  '/api/cms/burialservice',
  '/api/cms/sermons',
  '/api/cms/youngpeople',
  '/api/cms/adultmen',
  '/api/cms/adultladies',
  '/api/cms/learnmoreministry',
  '/api/cms/learnmoreevents',
  '/api/cms/acceptjesus',
  '/api/cms/belief',
  '/api/cms/churchleader',
  '/api/cms/departmentofficer',
  '/api/cms/ourstory',
  '/api/cms/childdedication',
  '/api/cms/marriageservice',
  // forgot password routes
  '/api/church-records/accounts/forgotPassword',
];

/**
 * Check if a route is public (doesn't require authentication)
 * @param {string} path - The request path
 * @param {string} originalUrl - The original request URL
 * @returns {boolean} - True if route is public
 */
const isPublicRoute = (path, originalUrl) => {
  // Use originalUrl if available, otherwise use path
  const checkPath = originalUrl || path;
  
  return publicRoutes.some(route => {
    // Exact match
    if (checkPath === route || path === route) return true;
    // Wildcard match for routes starting with the public route
    if (route.endsWith('**')) {
      const baseRoute = route.replace('**', '');
      return checkPath.startsWith(baseRoute) || path.startsWith(baseRoute);
    }
    // Check if path starts with route
    if (checkPath.startsWith(route) || path.startsWith(route)) return true;
    return false;
  });
};

/**
 * JWT Authentication Middleware
 * Extracts and validates JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  // Check if route is public (check both path and originalUrl for reliability)
  if (isPublicRoute(req.path, req.originalUrl)) {
    return next();
  }

  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // If no token provided
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
      message: 'Authentication token is required. Please login first.'
    });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Token expired or invalid
      let errorMessage = 'Invalid or expired token';
      
      if (err.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired. Please login again.';
      } else if (err.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token. Please login again.';
      }

      return res.status(401).json({
        success: false,
        error: errorMessage,
        message: errorMessage
      });
    }

    // Token is valid - attach decoded user info to request
    req.user = decoded; // Contains: { email, position, acc_id, iat, exp }
    next();
  });
};

/**
 * (Optional) Role middleware was removed because roles are not required now.
 * Keep this placeholder for future use if role checks are needed.
 */
module.exports = {
  authenticateToken,
  isPublicRoute
};

