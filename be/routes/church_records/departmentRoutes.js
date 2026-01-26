const express = require('express');
const moment = require('moment');
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentByName,
  updateDepartment,
  deleteDepartment,
  bulkDeleteDepartments,
  exportDepartmentsToExcel,
  getAllDepartmentsForSelect
} = require('../../dbHelpers/church_records/departmentRecords');

const router = express.Router();

/**
 * CREATE - Insert a new department record
 * POST /api/church-records/departments/createDepartment
 */
router.post('/createDepartment', async (req, res) => {
  try {
    const result = await createDepartment(req.body);
    
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
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create department'
    });
  }
});

/**
 * READ ALL - Get all department records with pagination and filters
 * GET /api/church-records/departments/getAllDepartments (query params)
 * POST /api/church-records/departments/getAllDepartments (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, sortBy, dateRange
 */
router.get('/getAllDepartments', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllDepartments(options);
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
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch departments'
    });
  }
});

router.post('/getAllDepartments', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllDepartments(options);
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
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch departments'
    });
  }
});

/**
 * READ ONE - Get a single department by ID
 * GET /api/church-records/departments/getDepartmentById/:id
 */
router.get('/getDepartmentById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid department ID'
      });
    }

    const result = await getDepartmentById(departmentId);
    
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
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch department'
    });
  }
});

/**
 * READ ONE - Get a single department by name
 * GET /api/church-records/departments/getDepartmentByName/:name
 */
router.get('/getDepartmentByName/:name', async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Department name is required'
      });
    }

    const result = await getDepartmentByName(name);
    
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
    console.error('Error fetching department by name:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch department'
    });
  }
});

/**
 * UPDATE - Update an existing department record
 * PUT /api/church-records/departments/updateDepartment/:id
 */
router.put('/updateDepartment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid department ID'
      });
    }

    const result = await updateDepartment(departmentId, req.body);
    
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
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update department'
    });
  }
});

/**
 * DELETE - Delete a department record
 * DELETE /api/church-records/departments/deleteDepartment/:id
 */
router.delete('/deleteDepartment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid department ID'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteDepartment(departmentId, archivedBy);
    
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
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete department'
    });
  }
});

/**
 * BULK DELETE DEPARTMENTS - Permanently delete multiple department records
 * DELETE /api/church-records/departments/bulkDeleteDepartments
 * Body: { department_ids: [1, 2, 3] }
 */
router.delete('/bulkDeleteDepartments', async (req, res) => {
  try {
    const { department_ids } = req.body;

    if (!department_ids || !Array.isArray(department_ids) || department_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Department IDs array is required and cannot be empty',
        message: 'Please provide an array of department IDs to delete'
      });
    }

    // Convert string IDs to numbers and validate
    const departmentIds = department_ids.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);

    if (departmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid department IDs provided',
        message: 'All provided department IDs must be valid numbers'
      });
    }

    // Skip audit trail for bulk operations to improve performance
    req.skipAuditTrail = true;

    const result = await bulkDeleteDepartments(departmentIds, req.user?.acc_id);

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
    console.error('Error bulk deleting departments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete departments'
    });
  }
});

/**
 * EXPORT - Export department records to Excel
 * GET /api/church-records/departments/exportExcel (query params)
 * POST /api/church-records/departments/exportExcel (body payload)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const excelBuffer = await exportDepartmentsToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `departments_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting departments to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export departments to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const excelBuffer = await exportDepartmentsToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `departments_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting departments to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export departments to Excel'
    });
  }
});

/**
 * GET ALL DEPARTMENTS FOR SELECT - Get simplified department list for dropdowns
 * GET /api/church-records/departments/getAllDepartmentsForSelect
 */
router.get('/getAllDepartmentsForSelect', async (req, res) => {
  try {
    const result = await getAllDepartmentsForSelect();
    
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
    console.error('Error fetching departments for select:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch departments for select'
    });
  }
});

module.exports = router;

