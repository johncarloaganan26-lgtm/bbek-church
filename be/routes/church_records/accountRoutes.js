const express = require('express');
const moment = require('moment');
const {
  createAccount,
  getAllAccounts,
  getAccountById,
  getAccountByEmail,
  updateAccount,
  deleteAccount,
  verifyAccountCredentials,
  exportAccountsToExcel,
  getSpecificMemberByEmailAndPassword,
  forgotPasswordByEmail
} = require('../../dbHelpers/church_records/accountRecords');

const router = express.Router();

/**
 * CREATE - Insert a new account record
 * POST /api/church-records/accounts/createAccount
 */
router.post('/createAccount', async (req, res) => {
  try {
    const result = await createAccount(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create account'
    });
  }
});

/**
 * READ ALL - Get all account records with pagination and filters
 * GET /api/church-records/accounts/getAllAccounts (query params)
 * POST /api/church-records/accounts/getAllAccounts (body payload)
 * Parameters: search, limit, offset, page, pageSize, position, status, sortBy
 */
router.get('/getAllAccounts', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllAccounts(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch accounts'
    });
  }
});

router.post('/getAllAccounts', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllAccounts(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch accounts'
    });
  }
});

/**
 * READ ONE - Get a single account by ID
 * GET /api/church-records/accounts/getAccountById/:id
 */
router.get('/getAccountById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accId = parseInt(id);

    if (isNaN(accId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const result = await getAccountById(accId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account'
    });
  }
});

/**
 * READ ONE - Get a single account by email
 * GET /api/church-records/accounts/getAccountByEmail/:email
 */
router.get('/getAccountByEmail/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await getAccountByEmail(email);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching account by email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account'
    });
  }
});

/**
 * UPDATE - Update an existing account record
 * PUT /api/church-records/accounts/updateAccount/:id
 */
router.put('/updateAccount/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accId = parseInt(id);

    if (isNaN(accId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const result = await updateAccount(accId, req.body);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update account'
    });
  }
});

/**
 * DELETE - Delete an account record
 * DELETE /api/church-records/accounts/deleteAccount/:id
 */
router.delete('/deleteAccount/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accId = parseInt(id);
    const archivedBy = req.user?.acc_id || null;

    if (isNaN(accId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const result = await deleteAccount(accId, archivedBy);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account'
    });
  }
});

/**
 * VERIFY - Verify account credentials (login)
 * POST /api/church-records/accounts/verifyCredentials
 * Body: { email, password }
 */
router.post('/verifyCredentials', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await verifyAccountCredentials(email, password);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error verifying credentials:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify credentials'
    });
  }
});

/**
 * EXPORT - Export account records to Excel
 * GET /api/church-records/accounts/exportExcel (query params)
 * POST /api/church-records/accounts/exportExcel (body payload)
 * Parameters: search, position, status, sortBy (same as getAllAccounts, but no pagination)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const excelBuffer = await exportAccountsToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `accounts_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting accounts to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export accounts to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const excelBuffer = await exportAccountsToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `accounts_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting accounts to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export accounts to Excel'
    });
  }
});


/**
 *  Login - Login to the system
 *  POST /api/church-records/accounts/login
 *  Body: { email, password } return access token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Email and password are required'
      });
    }

    const result = await getSpecificMemberByEmailAndPassword(email, password);

    // Check if result is null (invalid credentials)
    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Invalid email or password'
      });
    }

    // Check if result has success property
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message || 'Login failed',
        error: result.message || 'Login failed'
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to login'
    });
  }
});

/**
 * FORGOT PASSWORD - Send password reset email
 * POST /api/church-records/accounts/forgotPassword
 * Body: { email }
 */
router.post('/forgotPassword', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await forgotPasswordByEmail(email);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error processing forgot password request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process forgot password request'
    });
  }
});

/**
 * LOGOUT - Log user out and record audit trail
 * POST /api/church-records/accounts/logout
 * Body: { logout_reason? }
 */
router.post('/logout', async (req, res) => {
  try {
    // Get user info from token
    const userEmail = req.user?.email || null;
    const userId = req.user?.acc_id || null;
    const logoutReason = req.body?.logout_reason || 'User initiated logout';

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: {
        email: userEmail,
        acc_id: userId,
        logout_reason: logoutReason
      }
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to logout'
    });
  }
});

/**
 * SAMPLE ROUTE - Get current user profile (requires authentication)
 * GET /api/church-records/accounts/me
 * This route demonstrates accessing req.user from the JWT token
 */
router.get('/me', (req, res) => {
  try {
    // req.user is automatically populated by authenticateToken middleware
    // Contains: { email, position, acc_id, iat, exp }
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        email: req.user.email,
        position: req.user.position,
        acc_id: req.user.acc_id
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user profile'
    });
  }
});

module.exports = router;

