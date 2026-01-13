const express = require('express');
const moment = require('moment');
const {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
  exportMembersToExcel,
  exportMembersToCSV,
  getAllMembersForSelect,
  getAllDepartmentMembersForSelect,
  getAllPastorsForSelect,
  getAllMembersWithoutPastorsForSelect,
  getMembersWithoutBaptism
} = require('../../dbHelpers/church_records/memberRecords');

const router = express.Router();


/**
 * CREATE - Insert a new member record
 * POST /api/church-records/members/createMember
 */
router.post('/createMember', async (req, res) => {
  try {
    const result = await createMember(req.body);
    
    if (result.success) {
      res.status(201).json({
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({
      error: error.message || 'Failed to create member'
    });
  }
});



/**
 * GET ALL FOR SELECT - Get all members for select/dropdown elements
 * GET /api/church-records/members/getAllMembersForSelect
 * Returns simplified member data (member_id and fullname) without pagination
 */
router.get('/getAllMembersForSelect', async (req, res) => {
  try {
    const result = await getAllMembersForSelect();
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
    console.error('Error fetching members for select:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members for select'
    });
  }
});

/**
 * GET ALL DEPARTMENT MEMBERS FOR SELECT - Get all members with position = 'department' for select/dropdown elements
 * GET /api/church-records/members/getAllDepartmentMembersForSelect
 * Returns simplified member data (member_id and fullname) without pagination
 * Filters by member position = 'department' from tbl_members
 */
router.get('/getAllDepartmentMembersForSelect', async (req, res) => {
  try {
    const result = await getAllDepartmentMembersForSelect();
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
    console.error('Error fetching department members for select:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch department members for select'
    });
  }
});

/**
 * READ ALL - Get all member records with pagination and filters
 * GET /api/church-records/members/getAllMembers (query params)
 * POST /api/church-records/members/getAllMembers (body payload)
 * Parameters: search, limit, offset, page, pageSize, ageRange, joinMonth, sortBy
 */
router.get('/getAllMembers', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllMembers(options);
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
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members'
    });
  }
});
/**
 * READ ALL - Get all member records with pagination and filters
 * GET /api/church-records/members/getAllPastorsForSelect (query params)
 * POST /api/church-records/members/getAllPastorsForSelect (body payload)
 * Parameters: search, limit, offset, page, pageSize, ageRange, joinMonth, sortBy
 */
router.get('/getAllPastorsForSelect', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllPastorsForSelect(options);
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
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members'
    });
  }
});

router.get('/getAllMembersWithoutPastorsForSelect', async (req, res) => {
  try {
    const result = await getAllMembersWithoutPastorsForSelect();
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
    console.error('Error fetching members without pastors for select:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members without pastors for select'
    });
  }
});

/**
 * GET MEMBERS WITHOUT BAPTISM - Get members who don't have baptism records
 * GET /api/church-records/members/getMembersWithoutBaptism
 * Returns members who don't have records in water_baptism table
 */
router.get('/getMembersWithoutBaptism', async (req, res) => {
  try {
    const result = await getMembersWithoutBaptism();
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
    console.error('Error fetching members without baptism:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members without baptism'
    });
  }
});
/**
 * EXPORT - Export member records to Excel
 * GET /api/church-records/members/exportExcel (query params)
 * POST /api/church-records/members/exportExcel (body payload)
 * Parameters: search, ageRange, joinMonth, sortBy (same as getAllMembers, but no pagination)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query
    
    console.log('Export request with options:', options)
    
    const excelBuffer = await exportMembersToExcel(options)
    
    if (!excelBuffer || excelBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate Excel file'
      })
    }
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss')
    const filename = `members_export_${timestamp}.xlsx`
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', excelBuffer.length)
    
    console.log(`Sending Excel file: ${filename} (${excelBuffer.length} bytes)`)
    
    // Send the Excel file
    res.send(excelBuffer)
  } catch (error) {
    console.error('Error exporting members to Excel:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export members to Excel'
    })
  }
})

/**
 * EXPORT - Export member records to Excel (POST alternative)
 * POST /api/church-records/members/exportExcel (for body payload)
 */
router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body
    const options = req.body
    
    console.log('Export POST request with options:', options)
    
    const excelBuffer = await exportMembersToExcel(options)
    
    if (!excelBuffer || excelBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate Excel file'
      })
    }
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss')
    const filename = `members_export_${timestamp}.xlsx`
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', excelBuffer.length)
    
    console.log(`Sending Excel file: ${filename} (${excelBuffer.length} bytes)`)
    
    // Send the Excel file
    res.send(excelBuffer)
  } catch (error) {
    console.error('Error exporting members to Excel (POST):', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export members to Excel'
    })
  }
})




router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const excelBuffer = await exportMembersToExcel(options);

    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `members_export_${timestamp}.xlsx`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting members to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export members to Excel'
    });
  }
});

/**
 * EXPORT - Export member records to CSV
 * GET /api/church-records/members/exportCSV (query params)
 * POST /api/church-records/members/exportCSV (body payload)
 * Parameters: search, ageRange, joinMonth, sortBy (same as getAllMembers, but no pagination)
 */
router.get('/exportCSV', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;

    console.log('CSV Export request with options:', options);

    const csvContent = await exportMembersToCSV(options);

    if (!csvContent || csvContent.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate CSV file'
      });
    }

    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `members_export_${timestamp}.csv`;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

    console.log(`Sending CSV file: ${filename} (${csvContent.length} characters)`);

    // Send the CSV file
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting members to CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export members to CSV'
    });
  }
});

router.post('/exportCSV', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;

    console.log('CSV Export POST request with options:', options);

    const csvContent = await exportMembersToCSV(options);

    if (!csvContent || csvContent.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate CSV file'
      });
    }

    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `members_export_${timestamp}.csv`;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

    console.log(`Sending CSV file: ${filename} (${csvContent.length} characters)`);

    // Send the CSV file
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting members to CSV (POST):', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export members to CSV'
    });
  }
});

/**
 * READ ONE - Get a single member by ID
 * GET /api/church-records/members/getMemberById/:id
 */
router.get('/getMemberById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Invalid member ID'
      });
    }

    const result = await getMemberById(memberId);
    
    if (result.success) {
      res.status(200).json({
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch member'
    });
  }
});

/**
 * UPDATE - Update an existing member record
 * PUT /api/church-records/members/updateMember/:id
 */
router.put('/updateMember/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Invalid member ID'
      });
    }

    const result = await updateMember(memberId, req.body);
    
    if (result.success) {
      res.status(200).json({
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({
      error: error.message || 'Failed to update member'
    });
  }
});

/**
 * DELETE - Delete a member record
 * DELETE /api/church-records/members/deleteMember/:id
 */
router.delete('/deleteMember/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = parseInt(id);
    const archivedBy = req.user?.acc_id || null;

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Invalid member ID'
      });
    }

    const result = await deleteMember(memberId, archivedBy);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete member'
    });
  }
});

module.exports = router;

