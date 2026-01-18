const mysql = require('mysql2/promise');

/**
 * Database Configuration for Local and Cloud
 *
 * Connection Pool Sizing:
 * - Local Development: Default 10 connections (higher limit for local MySQL)
 * - Cloud Databases: Default 2 connections (to stay well under typical 5 max_user_connections limit)
 * - Can be overridden with DB_CONNECTION_LIMIT environment variable
 *
 * Cloud databases (especially free/shared tiers) often have strict connection limits:
 * - max_connections: Server-wide limit (typically 5-10 for free tiers)
 * - max_user_connections: Per-user limit (typically 5 for free tiers)
 *
 * Using 2 connections ensures we stay well under the limit and account for:
 * - Multiple application instances/processes
 * - Other applications using the same database user
 * - Connection pool overhead
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_VERCEL = process.env.VERCEL || process.env.VERCEL_ENV;

// Determine connection limit based on environment
// Cloud databases typically have 5 connection limit (both max_connections and max_user_connections)
// We use 1 connection to stay well under the limit and account for multiple instances/processes
// This prevents max_user_connections errors that block audit trail logging
const getConnectionLimit = () => {
  // Allow explicit override via environment variable
  if (process.env.DB_CONNECTION_LIMIT) {
    return parseInt(process.env.DB_CONNECTION_LIMIT, 10);
  }

  // For Vercel/serverless: use 1 connection per function
  if (IS_VERCEL) {
    return 1;
  }

  // Default: 1 connection for both production and development
  // This ensures we never hit max_user_connections limits and audit trails work properly
  return 1;
};

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'bbekdb',

  // Timezone configuration - ensure UTC for consistent timestamps
  timezone: '+00:00',

  // Connection pool configuration
  waitForConnections: true,
  connectionLimit: getConnectionLimit(),
  queueLimit: 0,

  // Connection timeout settings (important for cloud databases)
  connectTimeout: 10000, // 10 seconds
  // acquireTimeout: 10000, // 10 seconds to acquire connection from pool
  // timeout: 60000, // 60 seconds query timeout

  // Enable keep-alive for cloud databases (prevents connection drops)
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // SSL configuration (many cloud databases require SSL)
  ssl: process.env.DB_SSL === 'true' ? {} : false,

  // Ensure binary data (BLOB) is handled correctly and text fields are converted to strings
  // This fixes issues where VARCHAR/TEXT/DATETIME fields are returned as Buffer objects
  typeCast: function (field, next) {
    // Handle BLOB fields (binary data)
    if (field.type === 'BLOB' || field.type === 'LONGBLOB') {
      return field.buffer();
    }

    // For TEXT fields, ensure they are returned as strings, not Buffers
    if (field.type === 'TEXT' || field.type === 'LONGTEXT' ||
        field.type === 'MEDIUMTEXT' || field.type === 'TINYTEXT') {
      // TEXT fields should be returned as strings by mysql2, but if they're Buffer, convert
      const value = field.string();
      if (Buffer.isBuffer(value)) {
        return value.toString('utf8');
      }
      return value;
    }

    // For VARCHAR and other string fields, ensure proper string conversion
    if (field.type === 'VAR_STRING' || field.type === 'STRING' || field.type === 'VARCHAR') {
      const value = field.string();
      if (Buffer.isBuffer(value)) {
        return value.toString('utf8');
      }
      return value;
    }

    // Handle DATETIME and TIMESTAMP fields
    if (field.type === 'DATETIME' || field.type === 'TIMESTAMP' ||
        field.type === 'DATE' || field.type === 'TIME') {
      return field.string();
    }

    return next();
  }
};

// Create a shared connection pool
let pool = mysql.createPool(dbConfig);

// Set timezone for all connections
pool.on('connection', async (connection) => {
  if (!IS_PRODUCTION) {
    console.log('New database connection established:', connection.threadId);
  }

  // Set session timezone to UTC for consistent timestamp handling
  try {
    await connection.execute('SET time_zone = "+00:00"');
  } catch (error) {
    console.warn('Failed to set session timezone:', error.message);
  }
});

/**
 * Recreate the connection pool with optional reduced connection limit
 * Used when encountering max_connection errors or other critical connection issues
 * @param {number} newConnectionLimit - Optional new connection limit (default: uses current dbConfig)
 * Returns a promise that resolves when the pool is recreated
 */
const recreatePool = async (newConnectionLimit = null) => {
  console.warn('Recreating database connection pool...');
  
  // If new limit provided, update config
  if (newConnectionLimit !== null && newConnectionLimit > 0) {
    console.log(`Reducing connection pool limit from ${dbConfig.connectionLimit} to ${newConnectionLimit}`);
    dbConfig.connectionLimit = newConnectionLimit;
  }
  
  // Close existing pool gracefully
  if (pool) {
    try {
      await pool.end();
      console.log('Old pool closed successfully');
    } catch (err) {
      console.error('Error closing old pool:', err);
      // Continue anyway - force close
    }
  }
  
  // Wait a moment for connections to fully close
  await sleep(1000);
  
  // Create new pool with updated configuration
  pool = mysql.createPool(dbConfig);
  
  // Re-attach event listeners
  pool.on('connection', async (connection) => {
    if (!IS_PRODUCTION) {
      console.log('New database connection established:', connection.threadId);
    }

    // Set session timezone to UTC for consistent timestamp handling
    try {
      await connection.execute('SET time_zone = "+00:00"');
    } catch (error) {
      console.warn('Failed to set session timezone:', error.message);
    }
  });
  
  pool.on('error', (err) => {
    console.error('Database pool error:', {
      code: err.code || err.errno,
      message: err.message || err.sqlMessage,
      sqlState: err.sqlState
    });
    
    // If it's a max_connection error at pool level, log it prominently
    if (isMaxConnectionError(err)) {
      console.error('⚠️ CRITICAL: Max connection error detected at pool level!');
      console.error('Consider recreating the pool or reducing connection limit.');
    }
  });
  
  console.log(`Database connection pool recreated successfully with limit: ${dbConfig.connectionLimit}`);
};

// Log pool configuration on startup
if (IS_PRODUCTION || process.env.LOG_DB_CONFIG === 'true') {
  console.log('Database Pool Configuration:', {
    host: dbConfig.host,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit,
    environment: NODE_ENV
  });
}

// Monitor pool events
pool.on('connection', (connection) => {
  if (!IS_PRODUCTION) {
    console.log('New database connection established:', connection.threadId);
  }
});

pool.on('error', (err) => {
  console.error('Database pool error:', {
    code: err.code || err.errno,
    message: err.message || err.sqlMessage,
    sqlState: err.sqlState
  });
  
  // If it's a max_connection error at pool level, log it prominently
  if (isMaxConnectionError(err)) {
    console.error('⚠️ CRITICAL: Max connection error detected at pool level!');
    console.error('Consider recreating the pool or reducing connection limit.');
  }
});

/**
 * Check if error is a max_connection or max_user_connections error
 * MySQL error codes:
 * - 1040 = ER_CON_COUNT_ERROR (Too many connections - server level)
 * - 1203 = ER_USER_LIMIT_REACHED (max_user_connections - user level)
 * Also checks for various error formats that might indicate connection issues
 */
const isMaxConnectionError = (error) => {
  if (!error) return false;
  
  // Check error code (string or number)
  const errorCode = error.code || error.errno;
  if (errorCode === 'ER_CON_COUNT_ERROR' || errorCode === 1040 || errorCode === '1040' ||
      errorCode === 'ER_USER_LIMIT_REACHED' || errorCode === 1203 || errorCode === '1203') {
    return true;
  }
  
  // Check error message
  const errorMessage = (error.message || error.sqlMessage || '').toLowerCase();
  if (errorMessage.includes('too many connections') || 
      errorMessage.includes('max_connections') ||
      errorMessage.includes('max_user_connections') ||
      errorMessage.includes('exceeded') && errorMessage.includes('connection') ||
      errorMessage.includes('connection limit')) {
    return true;
  }
  
  // Check sqlState
  if (error.sqlState === '08004' || error.sqlState === 'HY000') {
    // These SQL states can indicate connection issues
    if (errorMessage.includes('connection')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if error is specifically a max_user_connections error
 */
const isMaxUserConnectionsError = (error) => {
  if (!error) return false;
  
  const errorCode = error.code || error.errno;
  if (errorCode === 'ER_USER_LIMIT_REACHED' || errorCode === 1203 || errorCode === '1203') {
    return true;
  }
  
  const errorMessage = (error.message || error.sqlMessage || '').toLowerCase();
  if (errorMessage.includes('max_user_connections') || 
      (errorMessage.includes('exceeded') && errorMessage.includes('max_user_connections'))) {
    return true;
  }
  
  return false;
};

/**
 * Sleep helper for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to run queries using the pool with automatic retry on max_connection errors.
 * Each query explicitly gets a connection, uses it, and releases it.
 * This ensures connections are properly closed after each query.
 * 
 * Features:
 * - Automatic retry on max_connection errors with exponential backoff
 * - Pool recreation if retries fail
 * - Connection is acquired from pool
 * - Query is executed
 * - Connection is explicitly released back to pool
 * - Prevents connection leaks and MySQL errors
 * 
 * Usage:
 *   const { query } = require('./database/db');
 *   const [rows] = await query('SELECT * FROM users WHERE id = ?', [id]);
 */
const query = async (sql, params, retryCount = 0) => {
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 1000; // 1 second
  const MAX_RETRY_DELAY = 10000; // 10 seconds
  
  let connection = null;
  try {
    // Get a connection from the pool
    // This can throw max_connection errors
    connection = await pool.getConnection();
    
    // Execute the query using query() for regular queries, execute() for prepared statements
    const result = await connection.query(sql, params || []);
    
    // Return the result
    return result;
  } catch (error) {
    // Log error details for debugging (especially in development)
    if (!IS_PRODUCTION || retryCount === 0) {
      console.error('Database query error:', {
        code: error.code || error.errno,
        sqlState: error.sqlState,
        message: error.message || error.sqlMessage,
        retryCount,
        sql: sql.substring(0, 100) // First 100 chars of SQL for debugging
      });
    }
    
    // Check if this is a max_connection error
    const isMaxConnError = isMaxConnectionError(error);
    const isMaxUserConnError = isMaxUserConnectionsError(error);
    
    if (isMaxConnError && retryCount < MAX_RETRIES) {
      // Calculate exponential backoff delay
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
        MAX_RETRY_DELAY
      );
      
      const errorType = isMaxUserConnError ? 'max_user_connections' : 'max_connections';
      console.warn(`⚠️ ${errorType} error detected (attempt ${retryCount + 1}/${MAX_RETRIES}). Retrying in ${delay}ms...`, {
        errorCode: error.code || error.errno,
        errorMessage: error.message || error.sqlMessage,
        sqlState: error.sqlState,
        errorType
      });
      
      // Release connection if we have one (might not have one if getConnection failed)
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error('Error releasing connection during retry:', releaseError);
        }
        connection = null;
      }
      
      // Wait before retrying
      await sleep(delay);
      
      // For max_user_connections errors, reduce pool size more aggressively
      if (isMaxUserConnError && retryCount === 0) {
        // Reduce pool size immediately on first retry for user connection limit
        const currentLimit = dbConfig.connectionLimit;
        const newLimit = Math.max(1, Math.floor(currentLimit / 2)); // Reduce by half, minimum 1
        console.warn(`Reducing connection pool limit from ${currentLimit} to ${newLimit} due to max_user_connections error`);
        await recreatePool(newLimit);
      } else if (retryCount === MAX_RETRIES - 2) {
        // Recreate pool before the last retry attempt to get fresh connections
        console.log('Recreating pool before final retry attempt...');
        await recreatePool();
      }
      
      // Retry the query
      return query(sql, params, retryCount + 1);
    }
    
    // For non-max-connection errors or if retries exhausted, re-throw
    // Log final error if max connection error
    if (isMaxConnError && retryCount >= MAX_RETRIES) {
      console.error('❌ Max connection error: All retry attempts exhausted', {
        errorCode: error.code || error.errno,
        errorMessage: error.message || error.sqlMessage,
        totalRetries: MAX_RETRIES
      });
    }
    
    throw error;
  } finally {
    // Always release the connection back to the pool
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
};

/**
 * Get pool statistics (useful for monitoring)
 * Note: This provides basic stats. Full pool internals may vary by mysql2 version.
 */
const getPoolStats = () => {
  try {
    // Access pool internals safely
    const poolInternal = pool.pool;
    return {
      totalConnections: poolInternal?._allConnections?.length ?? 'unknown',
      freeConnections: poolInternal?._freeConnections?.length ?? 'unknown',
      queueLength: poolInternal?._connectionQueue?.length ?? 'unknown',
      connectionLimit: dbConfig.connectionLimit
    };
  } catch (error) {
    return {
      connectionLimit: dbConfig.connectionLimit,
      error: 'Unable to retrieve pool statistics'
    };
  }
};

/**
 * Get the current pool instance
 * This ensures modules that import pool get the latest instance after recreation
 */
const getPool = () => pool;

module.exports = {
  get pool() { return pool; }, // Getter to always return current pool
  query,
  getPoolStats,
  recreatePool,
  isMaxConnectionError,
  isMaxUserConnectionsError,
  getPool, // Function to get current pool
};
