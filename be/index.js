require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// System Logs Module Integration - Trigger nodemon restart

/**
 * Bible Baptist Ekklesia of Kawit Backend API
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
const { authenticateToken } = require('./middleware/authMiddleware');
const memberRouter = require('./routes/church_records/memberRoutes');
const accountRouter = require('./routes/church_records/accountRoutes');
const departmentOfficerRouter = require('./routes/church_records/departmentOfficerRoutes');
const departmentRouter = require('./routes/church_records/departmentRoutes');
const tithesRouter = require('./routes/church_records/tithesRoutes');
const ministryRouter = require('./routes/church_records/ministryRoutes');
const eventRouter = require('./routes/church_records/eventRoutes');
const churchLeaderRouter = require('./routes/church_records/churchLeaderRoutes');
const approvalRoutes = require('./routes/church_records/approvalRoutes');
const childDedicationRouter = require('./routes/services/childDedicationRoutes');
const burialServiceRouter = require('./routes/services/burialServiceRoutes');
const waterBaptismRouter = require('./routes/services/waterBaptismRoutes');
const marriageServiceRouter = require('./routes/services/marriageServiceRoutes');
const transactionRouter = require('./routes/transactionRoutes');
const memberRegistrationRouter = require('./routes/memberRegistrationRoute');
const archiveRouter = require('./routes/archiveRoutes');
const announcementRouter = require('./routes/announcementRoutes');
const formRouter = require('./routes/formRoutes');
const cmsRouter = require('./routes/cmsRoutes');
const dashboardRouter = require('./routes/dashboardRoutes');
const auditTrailRouter = require('./routes/auditTrailRoutes');
const auditTrailMiddleware = require('./middleware/auditTrailMiddleware');
const authRouter = require('./routes/authRoutes');

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
  // Check for FRONTEND_URL (single URL) - cloud production
  if (process.env.FRONTEND_URL1 || process.env.FRONTEND_URL2 ) {
    return [process.env.FRONTEND_URL1.trim(), process.env.FRONTEND_URL2.trim()];
  }
  
  // Default: localhost for development
  return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
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
    
    // In development, log CORS checks for debugging
    if (IS_DEVELOPMENT) {
      console.log('CORS Check:', {
        origin,
        allowedOrigins,
        isAllowed
      });
    }
    
    if (isAllowed) {
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
app.use(bodyParser.json({ limit: '500mb' }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '500mb'
  })
);

// Additional body parser specifically for CMS routes with even higher limits
// This handles cases where multiple large images/videos are sent together
app.use('/api/cms', bodyParser.json({ limit: '500mb' }));
app.use('/api/cms', bodyParser.urlencoded({ extended: true, limit: '500mb' }));

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
    message: 'Bible Baptist Ekklesia of Kawit backend is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Database pool status endpoint (for debugging - requires auth in production)
app.get('/api/db-status', (req, res) => {
  try {
    const { getPoolStats } = require('./database/db');
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
    message: 'Bible Baptist Ekklesia of Kawit API',
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
app.use('/api/auth', authRouter);

// Apply JWT authentication middleware to all routes
// Public routes are handled within the middleware itself
app.use(authenticateToken);

// Apply audit trail middleware to log user actions
app.use(auditTrailMiddleware);

// System logs middleware removed - functionality no longer used



// Church records routes
app.use('/api/church-records/members', memberRouter);
app.use('/api/church-records/accounts', accountRouter);
app.use('/api/church-records/department-officers', departmentOfficerRouter);
app.use('/api/church-records/departments', departmentRouter);
app.use('/api/church-records/tithes', tithesRouter);
app.use('/api/church-records/ministries', ministryRouter);
app.use('/api/church-records/events', eventRouter);
app.use('/api/church-records/church-leaders', churchLeaderRouter);
app.use('/api/church-records/approvals', approvalRoutes);
app.use('/api/church-records/child-dedications', childDedicationRouter);
app.use('/api/church-records/burial-services', burialServiceRouter);
app.use('/api/services/water-baptisms', waterBaptismRouter);
app.use('/api/services/marriage-services', marriageServiceRouter);
app.use('/api/transactions', transactionRouter);

// Member registration routes
app.use('/api/member-registration', memberRegistrationRouter);



// Archive routes
app.use('/api/archives', archiveRouter);

// Announcement routes
app.use('/api/announcements', announcementRouter);

// Form routes
app.use('/api/forms', formRouter);

// CMS routes (Landing Page Content Management)
app.use('/api/cms', cmsRouter);

// Dashboard routes
app.use('/api/dashboard', dashboardRouter);

// Audit trail routes
app.use('/api/audit-trail', auditTrailRouter);


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
  const { isMaxConnectionError, isMaxUserConnectionsError } = require('./database/db');
  if (isMaxConnectionError(err)) {
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

// Start server
// Bind to 0.0.0.0 to accept connections from all network interfaces (required for cloud)
// This works for both local (localhost) and cloud deployments
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`🚀 Bible Baptist Ekklesia of Kawit API Server`);
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

  // Auto-run password reset token migration on startup
  const runMigration = async () => {
    try {
      const { query } = require('./database/db');
      
      console.log('📋 Checking if password reset token migration is needed...');
      
      // Check if used_at column exists
      const [columns] = await query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tbl_password_reset_tokens' AND COLUMN_NAME = 'used_at'"
      );
      
      if (columns && columns.length > 0) {
        console.log('✅ Migration already applied - used_at column exists');
        return;
      }
      
      console.log('⚠️  used_at column not found, applying migration...');
      
      // Add the column
      await query(`
        ALTER TABLE \`tbl_password_reset_tokens\` 
        ADD COLUMN \`used_at\` DATETIME NULL COMMENT 'Timestamp when token was successfully used for password reset' AFTER \`expires_at\`
      `);
      console.log('✅ Column added successfully');
      
      // Create index
      try {
        await query(`
          CREATE INDEX \`idx_used_at\` ON \`tbl_password_reset_tokens\` (\`used_at\`)
        `);
        console.log('✅ Index created successfully');
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log('ℹ️  Index already exists');
        } else {
          throw err;
        }
      }
      
      // Cleanup old expired tokens
      const [result] = await query(`
        DELETE FROM tbl_password_reset_tokens 
        WHERE expires_at <= NOW()
      `);
      console.log(`✅ Migration complete - Cleaned up ${result.affectedRows} expired tokens`);
      
    } catch (error) {
      console.error('⚠️  Migration warning (non-critical):', error.message);
    }
  };
  
  // Run migration asynchronously
  runMigration().catch(err => {
    console.error('⚠️  Migration encountered an error:', err.message);
  });

  // Setup password reset token cleanup (runs every 6 hours)
  const setupTokenCleanup = () => {
    try {
      const { query } = require('./database/db');
      
      // Clean up expired and used tokens periodically
      const cleanupInterval = setInterval(async () => {
        try {
          const result = await query(`
            DELETE FROM tbl_password_reset_tokens 
            WHERE expires_at <= NOW() OR (used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
          `);
          if (result[0].affectedRows > 0) {
            console.log(`🧹 Cleaned up ${result[0].affectedRows} expired password reset tokens`);
          }
        } catch (error) {
          console.error('Error cleaning up password reset tokens:', error.message);
        }
      }, 6 * 60 * 60 * 1000); // Run every 6 hours
      
      // Also run cleanup on startup
      (async () => {
        try {
          const result = await query(`
            DELETE FROM tbl_password_reset_tokens 
            WHERE expires_at <= NOW() OR (used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
          `);
          if (result[0].affectedRows > 0) {
            console.log(`🧹 Initial cleanup: Removed ${result[0].affectedRows} expired tokens`);
          }
        } catch (error) {
          console.error('Error during initial token cleanup:', error.message);
        }
      })();
      
      // Store interval for cleanup on graceful shutdown
      global.tokenCleanupInterval = cleanupInterval;
    } catch (error) {
      console.warn('⚠️  Could not setup token cleanup routine:', error.message);
    }
  };
  
  setupTokenCleanup();
});

// Graceful shutdown for cloud platforms
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop token cleanup interval
  if (global.tokenCleanupInterval) {
    clearInterval(global.tokenCleanupInterval);
    console.log('Token cleanup interval stopped.');
  }
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connections
    const { pool } = require('./database/db');
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


