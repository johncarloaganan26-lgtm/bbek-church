/**
 * Notification Routes
 * Unified notification system API endpoints
 */

const express = require('express');
const router = express.Router();
const { 
  getUnifiedNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  getNotificationCount 
} = require('../dbHelpers/notificationRecords');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * GET /api/notifications/unified
 * Get unified notifications for the current user
 * Query params: lastFetch (optional - ISO timestamp for incremental loading)
 */
// TEMPORARY: Skip authentication for testing
router.get('/unified', async (req, res) => {
  try {
    const { lastFetch } = req.query;
    // Simulate admin user for testing
    const memberId = null; // Admin sees all notifications

    const result = await getUnifiedNotifications(memberId, lastFetch);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to retrieve notifications'
      });
    }
  } catch (error) {
    console.error('Error in /notifications/unified:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * PUT /api/notifications/mark-as-read/:notificationId
 * Mark a specific notification as read
 * Body: { sourceType: 'form' | 'service' }
 */
router.put('/mark-as-read/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { sourceType } = req.body;
    
    if (!sourceType) {
      return res.status(400).json({
        success: false,
        message: 'sourceType is required'
      });
    }
    
    const result = await markNotificationAsRead(notificationId, sourceType);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to mark notification as read'
      });
    }
  } catch (error) {
    console.error('Error in /notifications/mark-as-read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * PUT /api/notifications/mark-all-as-read
 * Mark all notifications as read for the current user
 */
// TEMPORARY: Skip authentication for testing
router.put('/mark-all-as-read', async (req, res) => {
  try {
    // Simulate admin user for testing
    const memberId = null;

    const result = await markAllNotificationsAsRead(memberId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to mark all notifications as read'
      });
    }
  } catch (error) {
    console.error('Error in /notifications/mark-all-as-read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/notifications/count
 * Get notification count for the current user
 */
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const memberId = req.user?.member_id;
    
    if (!memberId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - member not identified'
      });
    }
    
    const result = await getNotificationCount(memberId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Notification count retrieved',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to retrieve notification count'
      });
    }
  } catch (error) {
    console.error('Error in /notifications/count:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/notifications/test
 * Test endpoint for notification system
 */
router.get('/test', async (req, res) => {
  try {
    // Generate sample notification data for testing
    const sampleNotifications = [
      {
        id: 'test-1',
        category: 'contact',
        title: 'Test Contact Form',
        message: 'This is a test contact form notification',
        details: 'Test details',
        status: 'pending',
        date_created: new Date().toISOString(),
        read: false,
        source_type: 'form'
      },
      {
        id: 'test-2',
        category: 'prayer_request',
        title: 'Test Prayer Request',
        message: 'This is a test prayer request notification',
        details: 'Test prayer details',
        status: 'pending',
        date_created: new Date().toISOString(),
        read: false,
        source_type: 'form'
      },
      {
        id: 'test-3',
        category: 'service',
        title: 'Test Service Notification',
        message: 'This is a test service notification',
        details: 'Test service details',
        status: 'approved',
        date_created: new Date().toISOString(),
        read: false,
        source_type: 'service',
        service_type: 'water_baptism'
      }
    ];

    res.json({
      success: true,
      message: 'Test notifications generated',
      data: sampleNotifications
    });
  } catch (error) {
    console.error('Error in /notifications/test:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

module.exports = router;