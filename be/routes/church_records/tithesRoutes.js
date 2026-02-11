const express = require('express');
const moment = require('moment');
const {
  createTithe,
  createOnlineDonation,
  getAllTithes,
  getTitheById,
  updateTithe,
  deleteTithe,
  bulkDeleteTithes,
  exportTithesToExcel,
  verifyDonation,
  getProofImage,
  getAdminProofImage
} = require('../../dbHelpers/church_records/tithesRecords');

const router = express.Router();

/**
 * CREATE - Insert a new tithe record
 * POST /api/church-records/tithes/createTithe
 * Body: { tithes_id?, member_id, amount, type, payment_method, notes?, status?, date_created? }
 */
router.post('/createTithe', async (req, res) => {
  try {
    const result = await createTithe(req.body);

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
    console.error('Error creating tithe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tithe'
    });
  }
});

/**
 * READ ALL - Get all tithe records with pagination and filters
 * GET /api/church-records/tithes/getAllTithes (query params)
 * POST /api/church-records/tithes/getAllTithes (body payload)
 * Parameters: search, limit, offset, page, pageSize, type, status, sortBy, dateRange
 */
router.get('/getAllTithes', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllTithes(options);
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
    console.error('Error fetching tithes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tithes'
    });
  }
});

router.post('/getAllTithes', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllTithes(options);
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
    console.error('Error fetching tithes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tithes'
    });
  }
});

/**
 * READ ONE - Get a single tithe by ID
 * GET /api/church-records/tithes/getTitheById/:id
 */
router.get('/getTitheById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    const result = await getTitheById(tithesId);

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
    console.error('Error fetching tithe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tithe'
    });
  }
});

/**
 * READ ONE - Get a single tithe by member_id
 * GET /api/church-records/tithes/getTitheByMemberId/:memberId
 */
router.get('/getTitheByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'Member ID is required'
      });
    }

    const result = await getTitheByMemberId(memberId);

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
    console.error('Error fetching tithe by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tithe'
    });
  }
});

/**
 * UPDATE - Update an existing tithe record
 * PUT /api/church-records/tithes/updateTithe/:id
 * Body: { member_id?, amount?, type?, payment_method?, notes?, status?, date_created? }
 */
router.put('/updateTithe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    const result = await updateTithe(tithesId, req.body);

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
    console.error('Error updating tithe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tithe'
    });
  }
});

/**
 * DELETE - Delete a tithe record
 * DELETE /api/church-records/tithes/deleteTithe/:id
 */
router.delete('/deleteTithe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteTithe(tithesId, archivedBy);

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
    console.error('Error deleting tithe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete tithe'
    });
  }
});

/**
 * BULK DELETE - Delete multiple tithe records
 * DELETE /api/church-records/tithes/bulkDeleteTithes
 * Body: { tithesIds: [1, 2, 3] }
 */
router.delete('/bulkDeleteTithes', async (req, res) => {
  try {
    const { tithesIds } = req.body;
    const archivedBy = req.user?.acc_id || null;

    if (!Array.isArray(tithesIds) || tithesIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tithesIds array is required and cannot be empty'
      });
    }

    // Skip audit trail for bulk operations to improve performance
    req.skipAuditTrail = true;

    const result = await bulkDeleteTithes(tithesIds, archivedBy);

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
    console.error('Error bulk deleting tithes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete tithes'
    });
  }
});

/**
 * EXPORT - Export tithe records to Excel
 * GET /api/church-records/tithes/exportExcel (query params)
 * POST /api/church-records/tithes/exportExcel (body payload)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const excelBuffer = await exportTithesToExcel(options);

    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `tithes_offerings_export_${timestamp}.xlsx`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting tithes to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export tithes to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const excelBuffer = await exportTithesToExcel(options);

    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `tithes_offerings_export_${timestamp}.xlsx`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting tithes to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export tithes to Excel'
    });
  }
});

/**
 * SUBMIT ONLINE DONATION - Public route for submitting donation proof
 * POST /api/church-records/tithes/submitOnlineDonation
 * Body: { donor_name, is_anonymous, amount, type, donation_method, donation_method_other, proof_image, notes, donation_date }
 * This route is PUBLIC (added to authMiddleware publicRoutes)
 */
router.post('/submitOnlineDonation', async (req, res) => {
  try {
    const {
      donor_name,
      is_anonymous,
      email,
      amount,
      type,
      donation_method,
      donation_method_other,
      proof_image,
      proof_image_type,
      notes,
      donation_date
    } = req.body;

    console.log('📦 [Backend] Received Donation Submission:', {
      donor_name,
      email,
      amount,
      has_proof: !!proof_image
    });

    // Validate required fields
    const errors = [];
    if (!amount || parseFloat(amount) <= 0) {
      errors.push('A valid donation amount is required');
    }
    if (!donation_method) {
      errors.push('Payment method is required');
    }
    if (!proof_image) {
      errors.push('Proof of donation (screenshot) is required');
    }
    if (!is_anonymous && (!donor_name || donor_name.trim() === '')) {
      errors.push('Donor name is required (or check anonymous)');
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Invalid email address format');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    const result = await createOnlineDonation({
      donor_name: donor_name ? donor_name.trim() : null,
      is_anonymous: is_anonymous || false,
      email: email ? email.trim() : null,
      amount: parseFloat(amount),
      type: type || 'donation',
      donation_method: donation_method,
      donation_method_other: donation_method_other || null,
      proof_image: proof_image,
      proof_image_type: proof_image_type || null,
      notes: notes || null,
      donation_date: donation_date || null
    });

    if (result.success) {
      // Try to send admin notification email (non-blocking)
      try {
        const { sendDonationNotification } = require('../../dbHelpers/emailHelper');
        if (typeof sendDonationNotification === 'function') {
          await sendDonationNotification(result.data);
        }
      } catch (emailError) {
        console.error('Failed to send donation notification email:', emailError.message);
        // Don't fail the donation submission if email fails
      }

      // Try to send donor acknowledgement email (if email provided)
      if (email) {
        try {
          const { sendDonorAcknowledgementEmail } = require('../../dbHelpers/emailHelper');
          if (typeof sendDonorAcknowledgementEmail === 'function') {
            await sendDonorAcknowledgementEmail(result.data);
          }
        } catch (emailError) {
          console.error('Failed to send donor acknowledgement email:', emailError.message);
        }
      }

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
    console.error('Error submitting online donation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit online donation'
    });
  }
});

/**
 * VERIFY DONATION - Admin confirms or rejects an online donation
 * PUT /api/church-records/tithes/verifyDonation/:id
 * Body: { action: 'confirmed' | 'rejected', rejection_reason? }
 */
router.put('/verifyDonation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);
    const { action, rejection_reason, admin_proof_image } = req.body;
    const verifiedBy = req.user?.acc_id || null;

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    if (!['confirmed', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "confirmed" or "rejected"'
      });
    }

    if (action === 'rejected' && !rejection_reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required when rejecting a donation'
      });
    }

    const result = await verifyDonation(tithesId, action, verifiedBy, rejection_reason, admin_proof_image);

    if (result.success) {
      // Send status update email to donor if email exists
      if (result.data.donor_email) {
        try {
          const { sendDonorStatusUpdateEmail } = require('../../dbHelpers/emailHelper');
          if (typeof sendDonorStatusUpdateEmail === 'function') {
            await sendDonorStatusUpdateEmail(result.data, action, result.data.rejection_reason);
          }
        } catch (emailError) {
          console.error('Failed to send donor status update email:', emailError.message);
        }
      }

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
    console.error('Error verifying donation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify donation'
    });
  }
});

/**
 * GET PROOF IMAGE - Retrieve the proof image for a donation
 * GET /api/church-records/tithes/getProofImage/:id
 */
router.get('/getProofImage/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    const result = await getProofImage(tithesId);

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
    console.error('Error getting proof image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get proof image'
    });
  }
});

/**
 * GET ADMIN PROOF IMAGE - Retrieve the admin proof image for a donation
 * GET /api/church-records/tithes/getAdminProofImage/:id
 */
router.get('/getAdminProofImage/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    const result = await getAdminProofImage(tithesId);

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
    console.error('Error getting admin proof image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get admin proof image'
    });
  }
});

module.exports = router;

