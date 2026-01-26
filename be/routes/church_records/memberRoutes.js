const express = require('express');
const moment = require('moment');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
  bulkDeleteMembers,
  exportMembersToExcel,
  exportMembersToCSV,
  importMembers,
  getAllMembersForSelect,
  getAllDepartmentMembersForSelect,
  getAllPastorsForSelect,
  getAllMembersWithoutPastorsForSelect,
  getMembersWithoutBaptism,
  getSpecificMemberByEmailAndStatus
} = require('../../dbHelpers/church_records/memberRecords');

const router = express.Router();

// Configure multer for file uploads
// Use memory storage for hosting platforms (serverless environments)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const allowedExtensions = ['.csv', '.xlsx'];

    const isValidType = allowedTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());

    if (isValidType || isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
  }
});


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
 * IMPORT - Import member records from CSV/Excel file
 * POST /api/church-records/members/import
 */
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileBuffer = req.file.buffer;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let memberDataArray = [];

    // Parse file based on type
    if (fileExtension === '.csv') {
      memberDataArray = await parseCSVBuffer(fileBuffer);
    } else if (fileExtension === '.xlsx') {
      memberDataArray = await parseExcelBuffer(fileBuffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type'
      });
    }

    // Validate that we have data
    if (!memberDataArray || memberDataArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in file'
      });
    }

    // Get user info for logging
    const userInfo = {
      acc_id: req.user?.acc_id || 'system',
      email: req.user?.email || 'system@church.com',
      name: req.user?.name || 'System Admin',
      position: req.user?.position || 'admin'
    };

    // Import members
    const result = await importMembers(memberDataArray, userInfo);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error importing members:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import members'
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
 * Parameters: search, limit, offset, page, pageSize, ageRange, joinMonth, sortBy, dateRange
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
 * READ ONE - Get a single member by email (real-time lookup)
 * GET /api/church-records/members/getSpecificMemberByEmail/:email
 */
router.get('/getSpecificMemberByEmail/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'Email is required'
      });
    }

    const result = await getSpecificMemberByEmailAndStatus(email);
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Member retrieved successfully',
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Member not found',
        data: null
      });
    }
  } catch (error) {
    console.error('Error fetching member by email:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member',
      error: error.message || 'Failed to fetch member by email'
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

/**
 * BULK DELETE MEMBERS - Permanently delete multiple member records
 * DELETE /api/church-records/members/bulkDeleteMembers
 * Body: { member_ids: [1, 2, 3] }
 */
router.delete('/bulkDeleteMembers', async (req, res) => {
  try {
    const { member_ids } = req.body;

    if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Member IDs array is required and cannot be empty',
        message: 'Please provide an array of member IDs to delete'
      });
    }

    // Convert string IDs to numbers and validate
    const memberIds = member_ids.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);

    if (memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid member IDs provided',
        message: 'All provided member IDs must be valid numbers'
      });
    }

    // Skip audit trail for bulk operations to improve performance
    req.skipAuditTrail = true;

    const result = await bulkDeleteMembers(memberIds, req.user?.acc_id);

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
    console.error('Error bulk deleting members:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete members'
    });
  }
});

// Helper function to parse CSV buffer
async function parseCSVBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    let rowIndex = 1; // Start from 1 (header is 0)
    let isFirstRow = true;

    // Convert buffer to readable stream
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => {
        // Skip header row
        if (isFirstRow) {
          isFirstRow = false;
          return;
        }
        // Add row index for error reporting
        data._rowIndex = rowIndex++;
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Helper function to parse Excel buffer
async function parseExcelBuffer(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      return [];
    }

    // First row is headers
    const headers = jsonData[0];
    const results = [];

    // Process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowData = {};

      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      // Add row index for error reporting
      rowData._rowIndex = i;
      results.push(rowData);
    }

    return results;
  } catch (error) {
    throw new Error('Failed to parse Excel file: ' + error.message);
  }
}

module.exports = router;

