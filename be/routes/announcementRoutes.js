const express = require('express');
const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  bulkDeleteAnnouncements,
  getActiveAnnouncementsForUser,
  markAnnouncementAsViewed,
  getAnnouncementSummary
} = require('../dbHelpers/announcementRecords');

const router = express.Router();

/**
 * CREATE - Create a new announcement
 * POST /api/announcements/createAnnouncement
 */
router.post('/createAnnouncement', async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      created_by: req.user?.acc_id || null
    };

    const result = await createAnnouncement(announcementData);
    
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
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create announcement'
    });
  }
});

/**
 * READ ALL - Get all announcements with pagination and filters
 * GET /api/announcements/getAllAnnouncements
 */
router.get('/getAllAnnouncements', async (req, res) => {
  try {
    const options = req.query;
    const result = await getAllAnnouncements(options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
        totalCount: result.totalCount,
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
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch announcements'
    });
  }
});

/**
 * READ ONE - Get a single announcement by ID
 * GET /api/announcements/getAnnouncementById/:id
 */
router.get('/getAnnouncementById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getAnnouncementById(parseInt(id));
    
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
        data: null
      });
    }
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch announcement'
    });
  }
});

/**
 * UPDATE - Update an announcement
 * PUT /api/announcements/updateAnnouncement/:id
 */
router.put('/updateAnnouncement/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateAnnouncement(parseInt(id), req.body);
    
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
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update announcement'
    });
  }
});

/**
 * DELETE - Delete an announcement
 * DELETE /api/announcements/deleteAnnouncement/:id
 */
router.delete('/deleteAnnouncement/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteAnnouncement(parseInt(id), req.user?.acc_id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete announcement'
    });
  }
});

/**
 * BULK DELETE - Delete multiple announcements
 * DELETE /api/announcements/bulkDeleteAnnouncements
 * Body: { announcementIds: [1, 2, 3] }
 */
router.delete('/bulkDeleteAnnouncements', async (req, res) => {
  try {
    const { announcementIds } = req.body;
    const archivedBy = req.user?.acc_id || null;

    if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'announcementIds array is required and cannot be empty'
      });
    }

    // Skip audit trail for bulk operations to improve performance
    req.skipAuditTrail = true;

    const result = await bulkDeleteAnnouncements(announcementIds, archivedBy);

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
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error bulk deleting announcements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete announcements'
    });
  }
});

/**
 * Get active announcements for current user (works for authenticated and non-authenticated users)
 * GET /api/announcements/getActiveAnnouncementsForUser
 */
router.get('/getActiveAnnouncementsForUser', async (req, res) => {
  try {
    const userId = req.user?.acc_id || null;

    const result = await getActiveAnnouncementsForUser(userId);
    
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
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch active announcements'
    });
  }
});

/**
 * Mark announcement as viewed (only works for authenticated users)
 * POST /api/announcements/markAsViewed/:id
 */
router.post('/markAsViewed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.acc_id;
    
    if (!userId) {
      // For non-authenticated users, just return success (can't track views)
      return res.status(200).json({
        success: true,
        message: 'Announcement dismissed (view tracking requires authentication)'
      });
    }

    const result = await markAnnouncementAsViewed(parseInt(id), userId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error marking announcement as viewed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark announcement as viewed'
    });
  }
});

/**
 * GET SUMMARY - Get announcement summary statistics
 * GET /api/announcements/getAnnouncementSummary
 */
router.get('/getAnnouncementSummary', async (req, res) => {
  try {
    const result = await getAnnouncementSummary();
    
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
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching announcement summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch announcement summary'
    });
  }
});

module.exports = router;

