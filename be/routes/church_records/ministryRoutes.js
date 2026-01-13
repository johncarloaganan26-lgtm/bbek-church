const express = require('express');
const multer = require('multer');
const {
  createMinistry,
  getAllMinistries,
  getMinistryById,
  getMinistriesByMemberId,
  updateMinistry,
  deleteMinistry,
  getPublicMinistries,
  getAllMinistriesForSelect,
  exportMinistriesToExcel
} = require('../../dbHelpers/church_records/ministryRecords');

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * CREATE - Insert a new ministry record
 * POST /api/church-records/ministries/createMinistry
 * Supports both:
 *   - JSON body with base64 image: { ministry_name, schedule, leader_id, department_id, members, status?, date_created?, image?, description? }
 *   - multipart/form-data with file upload: form fields + 'image' file field
 */
router.post('/createMinistry', upload.single('image'), async (req, res) => {
  try {
    // Prepare ministry data from request
    let ministryData = { ...req.body };

    // If file was uploaded via multer (multipart/form-data), use it
    if (req.file) {
      console.log('File uploaded via multer:', req.file.originalname, req.file.size, 'bytes');
      ministryData.image = req.file;
    } else if (req.body.image) {
      // If image is provided as base64 string in JSON body
      console.log('Image provided as base64 string');
      ministryData.image = req.body.image;
    } else {
      console.log('No image provided for create');
    }

    const result = await createMinistry(ministryData);
    
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
    console.error('Error creating ministry:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create ministry'
    });
  }
});

/**
 * READ ALL - Get all ministry records with pagination and filters
 * GET /api/church-records/ministries/getAllMinistries (query params)
 * POST /api/church-records/ministries/getAllMinistries (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, sortBy
 */
router.get('/getAllMinistries', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllMinistries(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        summaryStats: result.summaryStats, // Summary statistics from all records
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
    console.error('Error fetching ministries:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ministries'
    });
  }
});

router.post('/getAllMinistries', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllMinistries(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        summaryStats: result.summaryStats, // Summary statistics from all records
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
    console.error('Error fetching ministries:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ministries'
    });
  }
});

/**
 * READ ONE - Get a single ministry by ID
 * GET /api/church-records/ministries/getMinistryById/:id
 */
router.get('/getMinistryById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ministryId = parseInt(id);

    if (isNaN(ministryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ministry ID'
      });
    }

    const result = await getMinistryById(ministryId);
    
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
    console.error('Error fetching ministry:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ministry'
    });
  }
});

/**
 * UPDATE - Update an existing ministry record
 * PUT /api/church-records/ministries/updateMinistry/:id
 * Supports both:
 *   - JSON body with base64 image: { ministry_name?, schedule?, leader_id?, department_id?, members?, status?, date_created?, image?, description? }
 *   - multipart/form-data with file upload: form fields + 'image' file field
 */
router.put('/updateMinistry/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const ministryId = parseInt(id);

    if (isNaN(ministryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ministry ID'
      });
    }

    // Prepare ministry data from request
    let ministryData = { ...req.body };

    // If file was uploaded via multer (multipart/form-data), use it
    if (req.file) {
      console.log('File uploaded via multer for update:', req.file.originalname, req.file.size, 'bytes');
      ministryData.image = req.file;
    } else if (req.body.image) {
      // If image is provided as base64 string in JSON body
      console.log('Image provided as base64 string for update');
      ministryData.image = req.body.image;
    } else {
      // No image provided - don't include image field in update (keeps existing image)
      console.log('No image provided for update - keeping existing image');
      // Don't set ministryData.image = undefined, just don't include it
    }

    const result = await updateMinistry(ministryId, ministryData);
    
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
    console.error('Error updating ministry:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update ministry'
    });
  }
});

/**
 * DELETE - Delete a ministry record
 * DELETE /api/church-records/ministries/deleteMinistry/:id
 */
router.delete('/deleteMinistry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ministryId = parseInt(id);
    const archivedBy = req.user?.acc_id || null;

    if (isNaN(ministryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ministry ID'
      });
    }

    const result = await deleteMinistry(ministryId, archivedBy);
    
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
    console.error('Error deleting ministry:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete ministry'
    });
  }
});

router.get('/getPublicMinistries', async (req, res) => {
  try {
    const result = await getPublicMinistries();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching public ministries:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch public ministries' });
  }
});

/**
 * READ ALL BY MEMBER - Get all ministries where a specific member has joined
 * GET /api/church-records/ministries/getMinistriesByMemberId/:memberId (query params)
 * POST /api/church-records/ministries/getMinistriesByMemberId/:memberId (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, sortBy
 */
router.get('/getMinistriesByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const memberIdNum = parseInt(memberId);

    if (isNaN(memberIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid member ID'
      });
    }

    // Get parameters from query string
    const options = req.query;
    const result = await getMinistriesByMemberId(memberIdNum, options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
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
    console.error('Error fetching ministries by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ministries by member ID'
    });
  }
});

router.post('/getMinistriesByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const memberIdNum = parseInt(memberId);

    if (isNaN(memberIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid member ID'
      });
    }

    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getMinistriesByMemberId(memberIdNum, options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
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
    console.error('Error fetching ministries by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ministries by member ID'
    });
  }
});

/**
 * GET ALL FOR SELECT - Get all ministries for select dropdown
 * GET /api/church-records/ministries/getAllMinistriesForSelect
 */
router.get('/getAllMinistriesForSelect', async (req, res) => {
  try {
    const result = await getAllMinistriesForSelect();

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
    console.error('Error fetching ministries for select:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ministries for select'
    });
  }
});

/**
 * EXPORT - Export ministries to Excel
 * GET /api/church-records/ministries/exportExcel (query params)
 * Parameters: search, status, sortBy, department_name_pattern
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await exportMinistriesToExcel(options);

    if (result.success) {
      // Set headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="ministries_export.xlsx"`);

      // Send the Excel file as binary data
      res.status(200).send(result.fileBuffer);
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error exporting ministries to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export ministries to Excel'
    });
  }
});

module.exports = router;

