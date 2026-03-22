// Load environment variables only in non-Vercel environments
const IS_VERCEL = process.env.VERCEL || process.env.VERCEL_ENV;
if (!IS_VERCEL) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
}

// System Logs Module Integration - Trigger nodemon restart

/**
 * Church Management System Backend API
 *
 * Environment Configuration:
 * ===========================
 *
 * LOCAL DEVELOPMENT:
 *   - Set NODE_ENV=development (or leave unset)
 *   - CORS allows: localhost:5173, localhost:5174, localhost:5175
 *   - Verbose logging enabled
 *   - Detailed error messages with stack traces
 *
 * CLOUD PRODUCTION:
 *   Required Environment Variables:
 *   - NODE_ENV=production
 *   - PORT (usually set by cloud platform)
 *   - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *   - FRONTEND_URL or CLIENT_ORIGIN (for CORS)
 *
 *   CORS Configuration:
 *   - Option 1: FRONTEND_URL=https://your-frontend.com (single URL)
 *   - Option 2: CLIENT_ORIGIN=https://app1.com,https://app2.com (comma-separated)
 *
 *   Optional:
 *   - JWT_SECRET (for authentication)
 *   - Other service-specific secrets
 *
 * The server binds to 0.0.0.0 to accept connections from all network interfaces,
 * which is required for cloud deployments while still working locally.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Wrap route imports in try-catch to prevent serverless function crashes
console.log('🚀 Starting API server initialization...');
let authenticateToken, memberRouter, accountRouter, departmentOfficerRouter, departmentRouter;
let tithesRouter, ministryRouter, eventRouter, churchLeaderRouter, approvalRoutes;
let childDedicationRouter, burialServiceRouter, waterBaptismRouter, discipleshipRouter, marriageServiceRouter;
let biblestudyRouter, salvationAvailabilityRouter, promotionVisitRouter;
let transactionRouter, memberRegistrationRouter, archiveRouter, announcementRouter;
let formRouter, cmsRouter, dashboardRouter, auditTrailRouter, auditTrailMiddleware, authRouter;
let notificationRouter;

try {
  const authMiddleware = require('../middleware/authMiddleware');
  authenticateToken = authMiddleware.authenticateToken;

  memberRouter = require('../routes/church_records/memberRoutes');
  accountRouter = require('../routes/church_records/accountRoutes');
  departmentOfficerRouter = require('../routes/church_records/departmentOfficerRoutes');
  departmentRouter = require('../routes/church_records/departmentRoutes');
  tithesRouter = require('../routes/church_records/tithesRoutes');
  ministryRouter = require('../routes/church_records/ministryRoutes');
  eventRouter = require('../routes/church_records/eventRoutes');
  churchLeaderRouter = require('../routes/church_records/churchLeaderRoutes');
  approvalRoutes = require('../routes/church_records/approvalRoutes');
  childDedicationRouter = require('../routes/services/childDedicationRoutes');
  burialServiceRouter = require('../routes/services/burialServiceRoutes');
  waterBaptismRouter = require('../routes/services/waterBaptismRoutes');
  discipleshipRouter = require('../routes/services/discipleshipRoutes');
  biblestudyRouter = require('../routes/services/biblestudyRoutes');
  salvationAvailabilityRouter = require('../routes/services/salvationAvailabilityRoutes');
  marriageServiceRouter = require('../routes/services/marriageServiceRoutes');
  promotionVisitRouter = require('../routes/services/promotionVisitRoutes');
  transactionRouter = require('../routes/transactionRoutes');
  memberRegistrationRouter = require('../routes/memberRegistrationRoute');
  archiveRouter = require('../routes/archiveRoutes');
  announcementRouter = require('../routes/announcementRoutes');
  formRouter = require('../routes/formRoutes');
  cmsRouter = require('../routes/cmsRoutes');
  dashboardRouter = require('../routes/dashboardRoutes');
  auditTrailRouter = require('../routes/auditTrailRoutes');
  auditTrailMiddleware = require('../middleware/auditTrailMiddleware');
  authRouter = require('../routes/authRoutes');
  console.log('🔄 Loading notificationRouter...');
  notificationRouter = require('../routes/notificationRoutes');
  console.log('📋 Loaded notificationRouter:', !!notificationRouter, typeof notificationRouter);
  console.log('📋 notificationRouter stack length:', notificationRouter ? notificationRouter.stack.length : 'N/A');
} catch (error) {
  console.error('❌ Error loading route modules:', error.message);
  console.error('Stack:', error.stack);
  // Continue with app creation even if some routes fail to load
  // This prevents serverless function crashes
}

const app = express();

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = NODE_ENV === 'development';

// CORS configuration for both local and cloud deployment
// Supports:
//   - CLIENT_ORIGIN (comma-separated list): "https://app1.com,https://app2.com"
//   - FRONTEND_URL (single URL): "https://app.com"
//   - Default (development): localhost ports
const getAllowedOrigins = () => {
  // Production domain - always allowed
  const productionOrigins = [
    'https://biblebaptistekklesiaofkawit.xyz',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ];

  // Check for FRONTEND_URL (single URL) - cloud production
  if (process.env.FRONTEND_URL1 || process.env.FRONTEND_URL2) {
    const origins = [];
    if (process.env.FRONTEND_URL1) origins.push(process.env.FRONTEND_URL1.trim());
    if (process.env.FRONTEND_URL2) origins.push(process.env.FRONTEND_URL2.trim());
    return [...origins, ...productionOrigins];
  }

  // Always include production domain and localhost
  // Add Vercel preview deployments if on Vercel
  if (IS_VERCEL) {
    return [
      ...productionOrigins,
      'https://bbek-church-app.vercel.app',
      'https://bbek-church-app-git-main-ulacdev.vercel.app'
    ];
  }

  // Default: localhost for development
  return productionOrigins;
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) {
      if (IS_DEVELOPMENT) {
        console.log('CORS: Request with no origin - allowing');
      }
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;
      // Allow Vercel preview deployments (e.g. *.vercel.app) when running on Vercel
      const isVercelPreview = !!origin && origin.endsWith('.vercel.app');
    
    // In development, log CORS checks for debugging
    if (IS_DEVELOPMENT) {
      console.log('CORS Check:', {
        origin,
        allowedOrigins,
        isAllowed
      });
    }
    
    if (isAllowed || (IS_VERCEL && isVercelPreview)) {
      callback(null, true);
    } else {
      if (IS_DEVELOPMENT) {
        console.warn('CORS: Origin not allowed:', origin);
      }
      callback(new Error(`Not allowed by CORS. Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: IS_PRODUCTION ? 86400 : 3600 // 24 hours in production, 1 hour in development
};

// Security headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Remove X-Powered-By header
  app.disable('x-powered-by');
  
  next();
});

// CORS middleware
app.use(cors(corsOptions));

// Body parsers - Increased limit to handle base64 image/video uploads
// Base64 encoding increases size by ~33%, and videos can be very large
// CMS routes need higher limits for multiple images/videos in one request
// IMPORTANT: Skip body-parser for multipart/form-data (handled by multer)
const skipMultipart = (contentType) => {
  return contentType && contentType.includes('multipart/form-data');
};

// For JSON requests - skip multipart. Use boolean-returning `type` to avoid accidental
// string return values that could be misinterpreted by body-parser.
app.use(bodyParser.json({ 
  limit: '500mb',
  type: (req) => {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (skipMultipart(contentType)) return false;
    return contentType.includes('application/json') || contentType === '';
  }
}));

// For URL-encoded requests - skip multipart
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '500mb',
    type: (req) => {
      const contentType = (req.headers['content-type'] || '').toLowerCase();
      if (skipMultipart(contentType)) return false;
      return contentType.includes('application/x-www-form-urlencoded') || contentType === '';
    }
  })
);

// Additional body parser specifically for CMS routes with even higher limits
// This handles cases where multiple large images/videos are sent together
app.use('/api/cms', bodyParser.json({ 
  limit: '500mb',
  type: (req) => {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (skipMultipart(contentType)) return false;
    return contentType.includes('application/json') || contentType === '';
  }
}));
app.use('/api/cms', bodyParser.urlencoded({ 
  extended: true, 
  limit: '500mb',
  type: (req) => {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (skipMultipart(contentType)) return false;
    return contentType.includes('application/x-www-form-urlencoded') || contentType === '';
  }
}));

// Request logging middleware
// In development: log all requests
// In production: log only errors (via error handler)
app.use((req, res, next) => {
  if (IS_DEVELOPMENT) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint (public route - no auth required)
// Used by cloud platforms for health monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Church backend is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Database pool status endpoint (for debugging - requires auth in production)
app.get('/api/db-status', (req, res) => {
  try {
    const { getPoolStats } = require('../database/db');
    const stats = getPoolStats();
    res.status(200).json({
      status: 'ok',
      pool: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Church Management System API',
    version: '1.0.0',
    environment: NODE_ENV,
    status: 'running'
  });
});

// Example JSON route (public route - no auth required)
app.post('/api/example', (req, res) => {
  const data = req.body;
  res.json({ received: data });
});

// Authentication routes (public - no auth required)
if (authRouter) {
  app.use('/api/auth', authRouter);
}

// PUBLIC WATER BAPTISM REGISTRATION ROUTE (no auth required)
// This allows anyone to register for water baptism without logging in
app.post('/api/public/water-baptism/register', async (req, res) => {
  try {
    const { createWaterBaptism } = require('../dbHelpers/services/waterBaptismRecords');
    const { sendWaterBaptismDetails } = require('../dbHelpers/emailHelper');
    const { checkDuplicateAccount } = require('../dbHelpers/church_records/accountRecords');
    const { getSpecificMemberByEmailAndStatus } = require('../dbHelpers/church_records/memberRecords');
    const { query } = require('../database/db');

    // Extract all fields including optional request_id
    const { 
      firstname, 
      lastname, 
      email, 
      middle_name, 
      phone_number, 
      birthdate, 
      age, 
      gender, 
      address, 
      civil_status, 
      guardian_name, 
      guardian_contact, 
      guardian_relationship,
      request_id  // Optional: from discipleship invitation
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Check if email already exists
    const duplicateAccount = await checkDuplicateAccount(email);
    if (duplicateAccount.isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        error: 'An account with this email already exists. Please use a different email.'
      });
    }

    const existingMember = await getSpecificMemberByEmailAndStatus(email?.trim().toLowerCase());
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered as member',
        error: 'A member with this email already exists. Please use a different email.'
      });
    }

    // Create water baptism record
    const baptismData = {
      firstname,
      lastname,
      middle_name: middle_name || '',
      email,
      phone_number: phone_number || '',
      birthdate: birthdate || '',
      age: age || null,
      gender: gender || '',
      address: address || '',
      civil_status: civil_status || '',
      guardian_name: guardian_name || '',
      guardian_contact: guardian_contact || '',
      guardian_relationship: guardian_relationship || '',
      baptism_date: req.body.baptism_date || null,
      baptism_time: req.body.baptism_time || null,
      is_member: false,
      member_id: null,
      status: 'pending',
      ...(request_id && { request_id })
    };

    const result = await createWaterBaptism(baptismData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Water baptism registration submitted successfully! Check your email for confirmation.',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error in public water baptism registration:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register for water baptism'
    });
  }
});

// Apply JWT authentication middleware to all routes
// Public routes are handled within the middleware itself
if (authenticateToken) {
  app.use(authenticateToken);
}

// Apply audit trail middleware to log user actions
if (auditTrailMiddleware) {
  app.use(auditTrailMiddleware);
}

// System logs middleware removed - functionality no longer used



// Church records routes - with error handling
if (memberRouter) app.use('/api/church-records/members', memberRouter);
if (accountRouter) app.use('/api/church-records/accounts', accountRouter);
if (departmentOfficerRouter) app.use('/api/church-records/department-officers', departmentOfficerRouter);
if (departmentRouter) app.use('/api/church-records/departments', departmentRouter);
if (tithesRouter) app.use('/api/church-records/tithes', tithesRouter);
if (ministryRouter) app.use('/api/church-records/ministries', ministryRouter);
if (eventRouter) app.use('/api/church-records/events', eventRouter);
if (churchLeaderRouter) app.use('/api/church-records/church-leaders', churchLeaderRouter);
if (approvalRoutes) app.use('/api/church-records/approvals', approvalRoutes);
if (childDedicationRouter) app.use('/api/church-records/child-dedications', childDedicationRouter);
if (burialServiceRouter) app.use('/api/church-records/burial-services', burialServiceRouter);
if (waterBaptismRouter) app.use('/api/services/water-baptisms', waterBaptismRouter);
if (burialServiceRouter) app.use('/api/services/burial-services', burialServiceRouter);
if (childDedicationRouter) app.use('/api/services/child-dedications', childDedicationRouter);

if (discipleshipRouter) app.use('/api/services/discipleship-requests', discipleshipRouter);
if (biblestudyRouter) app.use('/api/services/biblestudy-requests', biblestudyRouter);
if (salvationAvailabilityRouter) app.use('/api/services/salvation-availability', salvationAvailabilityRouter);
if (marriageServiceRouter) app.use('/api/services/marriage-services', marriageServiceRouter);
if (promotionVisitRouter) app.use('/api/services/promotion-visits', promotionVisitRouter);
if (transactionRouter) app.use('/api/transactions', transactionRouter);

// Member registration routes
if (memberRegistrationRouter) app.use('/api/member-registration', memberRegistrationRouter);



// Archive routes
if (archiveRouter) app.use('/api/archives', archiveRouter);

// Announcement routes
if (announcementRouter) app.use('/api/announcements', announcementRouter);

// Form routes
if (formRouter) app.use('/api/forms', formRouter);

// Notification routes
console.log('🔍 Checking notificationRouter for registration...');
console.log('   notificationRouter exists:', !!notificationRouter);
console.log('   notificationRouter type:', typeof notificationRouter);
if (notificationRouter) {
  console.log('📋 Registering notification routes at /api/notifications');
  app.use('/api/notifications', notificationRouter);
  console.log('✅ Notification routes registered successfully');
} else {
  console.log('⚠️ notificationRouter not loaded - skipping registration');
}

// CMS routes (Landing Page Content Management)
if (cmsRouter) app.use('/api/cms', cmsRouter);

// Dashboard routes
if (dashboardRouter) app.use('/api/dashboard', dashboardRouter);

// Audit trail routes
if (auditTrailRouter) app.use('/api/audit-trail', auditTrailRouter);


// Fallback for unknown routes
app.use((req, res) => {
  console.log(req.url);
  res.status(404).json({ error: 'Endpoint not found' });
});


// Error handler middleware
app.use((err, req, res, next) => {
  // Log error details (more detailed in development, sanitized in production)
  const errorLog = {
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(IS_DEVELOPMENT && { stack: err.stack, body: req.body, query: req.query })
  };
  
  console.error('Error occurred:', errorLog);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS Error', 
      message: 'Origin not allowed' 
    });
  }
  
  // Handle payload too large error
  if (err.type === 'entity.too.large' || err.status === 413) {
    const maxSize = '500MB';
    return res.status(413).json({ 
      error: 'Payload too large', 
      message: `The request payload is too large. Maximum size is ${maxSize}. Please reduce the size of images/videos or split them into multiple requests.`,
      maxSize: maxSize
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Authentication Error', 
      message: 'Invalid or expired token' 
    });
  }
  
  // Handle database max_connection errors
  const { isMaxConnectionError, isMaxUserConnectionsError, isMaxConnectionError: dbIsMaxConnectionError } = require('../database/db');
  if (isMaxConnectionError(err) || dbIsMaxConnectionError(err)) {
    const isUserLimit = isMaxUserConnectionsError(err);
    const errorType = isUserLimit ? 'max_user_connections' : 'max_connections';
    console.error(`${errorType} error reached after retries:`, err);
    return res.status(503).json({ 
      error: 'Service Temporarily Unavailable', 
      message: isUserLimit 
        ? 'Database user connection limit reached. Please try again in a moment.'
        : 'Database connection limit reached. Please try again in a moment.',
      retryAfter: 5 // Suggest retrying after 5 seconds
    });
  }
  
  // Default error response
  const errorResponse = {
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request'
  };
  
  res.status(err.status || 500).json(errorResponse);
});

// Export the Express app for Vercel serverless functions
module.exports = app;

// For local development testing
if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log(`🚀 Church Management System API Server (Local Development)`);
    console.log('='.repeat(60));
    console.log(`📦 Environment: ${NODE_ENV.toUpperCase()}`);
    console.log(`🌐 Server URL: http://0.0.0.0:${PORT}`);
    console.log(`🔒 Mode: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
    console.log(`🌍 CORS Origins: ${allowedOrigins.join(', ')}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    // Display database configuration status (without sensitive data)
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'bbekdb';
    console.log(`💾 Database: ${dbName} @ ${dbHost}`);
    console.log('='.repeat(60));
  });

  // Graceful shutdown for local development
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      console.log('HTTP server closed.');

      // Close database connections
      const { pool } = require('../database/db');
      pool.end((err) => {
        if (err) {
          console.error('Error closing database pool:', err);
        } else {
          console.log('Database pool closed.');
        }
        process.exit(0);
      });
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
}


