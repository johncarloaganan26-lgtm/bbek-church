const express = require('express');
const {
  createForm,
  getAllForms,
  getFormById,
  getFormsByUser,
  updateForm,
  deleteForm,
  getMemberServices
} = require('../dbHelpers/formRecords');

const router = express.Router();

/**
 * CREATE - Create a new form submission
 * POST /api/forms/createForm
 * Public route - can be accessed without authentication
 */
router.post('/createForm', async (req, res) => {
  try {
    // Prefer submitted_by from request body, fallback to JWT token user, then null
    const submittedBy = req.body.submitted_by || req.user?.acc_id || null;
    
    const formData = {
      ...req.body,
      submitted_by: submittedBy
    };

    // For authenticated users, try to get name/email from user info
    if (req.user?.acc_id && !formData.name && !formData.email) {
      // User is authenticated, we can get their info from the token
      // The name/email will be set from form_data if provided, otherwise from user context
      formData.submitted_by = req.user.acc_id;
    }

    const result = await createForm(formData);
    
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
    console.error('Error creating form:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create form submission'
    });
  }
});

/**
 * READ ALL - Get all forms with pagination and filters (Admin only)
 * GET /api/forms/getAllForms
 */
router.get('/getAllForms', async (req, res) => {
  try {
    const options = req.query;
    const result = await getAllForms(options);
    
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
    console.error('Error fetching forms:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch forms'
    });
  }
});

/**
 * READ ONE - Get a single form by ID
 * GET /api/forms/getFormById/:id
 */
router.get('/getFormById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getFormById(parseInt(id));
    
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
    console.error('Error fetching form:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch form'
    });
  }
});

/**
 * Get forms by current user (for authenticated users to see their own submissions)
 * GET /api/forms/getMyForms
 */
router.get('/getMyForms', async (req, res) => {
  try {
    const userId = req.user?.acc_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to view your forms'
      });
    }

    const formType = req.query.form_type || null;
    const result = await getFormsByUser(userId, formType);
    
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
    console.error('Error fetching user forms:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user forms'
    });
  }
});

/**
 * UPDATE - Update a form (typically for status changes and admin notes)
 * PUT /api/forms/updateForm/:id
 */
router.put('/updateForm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      reviewed_by: req.user?.acc_id || null
    };

    const result = await updateForm(parseInt(id), updateData);
    
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
    console.error('Error updating form:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update form'
    });
  }
});

/**
 * DELETE - Delete a form
 * DELETE /api/forms/deleteForm/:id
 */
router.delete('/deleteForm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteForm(parseInt(id), req.user?.acc_id);
    
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
    console.error('Error deleting form:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete form'
    });
  }
});

/**
 * Get member services (non-completed) for schedule change selection
 * GET /api/forms/getMemberServices/:memberId
 */
router.get('/getMemberServices/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const result = await getMemberServices(memberId);
    
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
    console.error('Error fetching member services:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch member services'
    });
  }
});

module.exports = router;

