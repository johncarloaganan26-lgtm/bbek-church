const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../database/db');
const NodeCache = require('node-cache');

const router = express.Router();

// Initialize cache for login attempts (15-minute lockout)
const loginAttemptsCache = new NodeCache({ stdTTL: 900, checkperiod: 60 });
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME_MINS = 15;

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // BRUTE FORCE PROTECTION: Check if email is currently locked out
    const attemptKey = `login_attempts_${email.toLowerCase().trim()}`;
    const attempts = loginAttemptsCache.get(attemptKey) || 0;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again after ${LOCKOUT_TIME_MINS} minutes.`,
        error: 'Account locked temporarily'
      });
    }

    // Find user by email
    const [users] = await query('SELECT * FROM tbl_accounts WHERE email = ?', [email]);

    if (users.length === 0) {
      // Increment failed attempts
      const newAttempts = attempts + 1;
      loginAttemptsCache.set(attemptKey, newAttempts);

      return res.status(401).json({
        success: false,
        message: newAttempts >= MAX_LOGIN_ATTEMPTS 
          ? `Too many failed attempts. Account locked for ${LOCKOUT_TIME_MINS} minutes.`
          : `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`
      });
    }

    const user = users[0];

    // Check password (assuming passwords are hashed)
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Increment failed attempts
      const newAttempts = attempts + 1;
      loginAttemptsCache.set(attemptKey, newAttempts);

      return res.status(401).json({
        success: false,
        message: newAttempts >= MAX_LOGIN_ATTEMPTS 
          ? `Too many failed attempts. Account locked for ${LOCKOUT_TIME_MINS} minutes.`
          : `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`
      });
    }

    // Success! Clear failed attempts
    loginAttemptsCache.del(attemptKey);

    // Get member info
    const [members] = await query('SELECT * FROM tbl_members WHERE member_id = ?', [user.member_id]);
    const memberInfo = members.length > 0 ? members[0] : {};

    // Generate JWT token
    const token = jwt.sign(
      {
        acc_id: user.acc_id,
        email: user.email,
        position: user.position,
        permissions: user.permissions, // Added permissions to token
        member: memberInfo
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        acc_id: user.acc_id,
        email: user.email,
        position: user.position,
        permissions: user.permissions, // Added permissions to response
        member: memberInfo
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  // We can still log this action
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Verify token route (optional)
router.get('/verify', (req, res) => {
  // This would be handled by the authenticateToken middleware
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router;