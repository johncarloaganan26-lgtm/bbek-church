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
  // Member registration routes
  // Ministry public READ routes (viewing ministries doesn't require auth)
  '/api/church-records/ministries/getPublicMinistries',
  '/api/church-records/ministries/getAllMinistries',
  '/api/church-records/ministries/getMinistryById**',
  '/api/church-records/ministries/getAllMinistriesForSelect',
  '/api/church-records/ministries/exportExcel',
  '/api/church-records/members/getAllMembersForSelect',
  '/api/church-records/members/getAllDepartmentMembersForSelect',
  '/api/church-records/departments/getAllDepartmentsForSelect',
  '/api/church-records/church-leaders/getAllChurchLeadersForSelect',
  '/api/church-records/department-officers/getAllDepartmentOfficersForSelect',
  '/api/church-records/members/getAllMembersWithoutPastorsForSelect',
  '/api/church-records/members/getAllPastorsForSelect',
  '/api/church-records/members/getMemberById',
  '/api/church-records/members/exportCSV',
  '/api/member-registration/register/water-baptism',
  '/api/member-registration/register/burial-service',
  // Water baptism non-member registration (public - no auth required)
  '/api/services/water-baptisms/register-non-member',
  // Burial service routes (public for non-member requests)
  '/api/church-records/burial-services/createBurialService',
  '/api/church-records/burial-services/getAllBurialServices',
  '/api/church-records/burial-services/getBurialServiceById',
  '/api/church-records/burial-services/check-duplicate',
  '/api/church-records/burial-services/check-member-burial',
  // Notification routes (require authentication)
  // '/api/notifications/unified',  // Commented out - should require auth
  // '/api/notifications/mark-as-read',  // Commented out - should require auth
  // '/api/notifications/mark-all-as-read',  // Commented out - should require auth
  '/api/church-records/burial-services/exportExcel',
  '/api/church-records/burial-services/searchFulltext',
  '/api/church-records/burial-services/analyzeAvailability',
  // Announcement routes (public for viewing)
  '/api/announcements/getActiveAnnouncementsForUser',
  '/api/announcements/markAsViewed',
  '/api/church-records/events/getSermonEvents',
  '/api/church-records/events/getCompletedSermonEvents',
  '/api/church-records/events/getAllEvents',
  '/api/church-records/events/getEventById',
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
  '/api/cms/give/full',
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
  '/api/cms/churchleader/full',
  '/api/cms/departmentofficer',
  '/api/cms/departmentofficer/full',
  '/api/cms/ourstory',
  '/api/cms/childdedication',
  '/api/cms/marriageservice',
  '/api/cms/info',
  '/api/cms/info/full',
  '/api/cms/upload-image',
  // CMS save routes (temporarily public for testing)
  '/api/cms/header/save',
  '/api/cms/home/save',
  '/api/cms/about/save',
  '/api/cms/imnew/save',
  '/api/cms/services/save',
  '/api/cms/events/save',
  '/api/cms/give/save',
  '/api/cms/footer/save',
  '/api/cms/planvisit/save',
  '/api/cms/waterbaptism/save',
  '/api/cms/burialservice/save',
  '/api/cms/sermons/save',
  '/api/cms/youngpeople/save',
  '/api/cms/adultmen/save',
  '/api/cms/adultladies/save',
  '/api/cms/learnmoreministry/save',
  '/api/cms/learnmoreevents/save',
  '/api/cms/acceptjesus/save',
  '/api/cms/belief/save',
  '/api/cms/churchleader/save',
  '/api/cms/departmentofficer/save',
  '/api/cms/ourstory/save',
  '/api/cms/childdedication/save',
  '/api/cms/marriageservice/save',
  '/api/cms/info/save',
  // forgot password routes
  '/api/church-records/accounts/forgotPassword',
  '/api/church-records/accounts/verifyResetToken',
  '/api/church-records/accounts/resetPasswordWithToken',
  '/api/church-records/accounts/createResetTokensTable',
  // Child dedication routes (public for member creation)
  '/api/church-records/child-dedications/createChildDedication',
  '/api/church-records/child-dedications/check-duplicate',
  '/api/church-records/child-dedications/check-member-dedication',
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
  const isPublic = isPublicRoute(req.path, req.originalUrl);

  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // For public routes, validate token if provided but don't require it
  if (isPublic) {
    if (token) {
      // Token provided - validate it and attach user info if valid
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err) {
          // Token is valid - attach decoded user info to request
          req.user = decoded; // Contains: { email, position, acc_id, iat, exp }
        }
        // If token is invalid, continue without setting req.user
        return next();
      });
    } else {
      // No token provided for public route - continue without authentication
      return next();
    }
    return; // Exit here for public routes
  }

  // For protected routes - require authentication
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
