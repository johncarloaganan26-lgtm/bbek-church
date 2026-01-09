const express = require('express');
const {
  getAllArchives,
  getArchiveById,
  restoreArchive,
  getArchiveSummary,
  deleteArchivePermanently
} = require('../dbHelpers/archiveRecords');

const router = express.Router();

/**
 * Admin-only middleware
 * Checks if the user is an admin based on the decoded token
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.position !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
      message: 'Only administrators can access this resource.'
    });
  }
  next();
};

/**
 * READ ALL - Get all archived records with pagination and filters
 * GET /api/archives/getAllArchives
 * Query params: search, limit, offset, page, pageSize, original_table, restored, date_from, date_to, sortBy
 */
router.get('/getAllArchives', requireAdmin, async (req, res) => {
  try {
    const options = req.query;
    const result = await getAllArchives(options);
    
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
    console.error('Error fetching archives:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch archives'
    });
  }
});

/**
 * READ ONE - Get a single archive record by ID
 * GET /api/archives/getArchiveById/:id
 */
router.get('/getArchiveById/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getArchiveById(parseInt(id));
    
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
    console.error('Error fetching archive:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch archive'
    });
  }
});

/**
 * RESTORE - Restore an archived record back to its original table
 * POST /api/archives/restoreArchive/:id
 * Body: { restored_by?, restore_notes? }
 */
router.post('/restoreArchive/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { restored_by, restore_notes } = req.body;
    const userId = restored_by || req.user?.acc_id || null;

    const result = await restoreArchive(parseInt(id), userId, restore_notes);
    
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
    console.error('Error restoring archive:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restore archive'
    });
  }
});

/**
 * GET SUMMARY - Get archive summary statistics
 * GET /api/archives/getArchiveSummary
 */
router.get('/getArchiveSummary', requireAdmin, async (req, res) => {
  try {
    const result = await getArchiveSummary();
    
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
    console.error('Error fetching archive summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch archive summary'
    });
  }
});

/**
 * DELETE PERMANENTLY - Permanently delete an archive record
 * DELETE /api/archives/deleteArchive/:id
 */
router.delete('/deleteArchive/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteArchivePermanently(parseInt(id));
    
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
    console.error('Error permanently deleting archive:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to permanently delete archive'
    });
  }
});

module.exports = router;
