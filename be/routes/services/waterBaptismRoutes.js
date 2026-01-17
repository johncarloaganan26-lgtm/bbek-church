const express = require('express');
const moment = require('moment');
const {
  createWaterBaptism,
  getAllWaterBaptisms,
  getWaterBaptismById,
  getWaterBaptismByMemberId,
  updateWaterBaptism,
  deleteWaterBaptism,
  exportWaterBaptismsToExcel
} = require('../../dbHelpers/services/waterBaptismRecords');
const { getMemberById, createMember, getSpecificMemberByEmailAndStatus } = require('../../dbHelpers/church_records/memberRecords');
const { checkDuplicateAccount } = require('../../dbHelpers/church_records/accountRecords');
const { getAccountByEmail, createAccount } = require('../../dbHelpers/church_records/accountRecords');
const { sendAccountDetails, sendWaterBaptismDetails } = require('../../dbHelpers/emailHelper');
const { query } = require('../../database/db');

const router = express.Router();

/**
 * CREATE - Insert a new water baptism record
 * POST /api/services/water-baptisms/createWaterBaptism
 * Body: {
 *   baptism_id?,
 *   member_id?,           // Required for members
 *   is_member?,           // true = member, false = non-member (default: true)
 *   firstname?,           // Required for non-members
 *   lastname?,            // Required for non-members
 *   middle_name?,
 *   email?,               // Required for non-members
 *   phone_number?,
 *   birthdate?,
 *   age?,
 *   gender?,
 *   address?,
 *   civil_status?,
 *   baptism_date?,
 *   location?,
 *   pastor_name?,
 *   status?,
 *   guardian_name?,
 *   guardian_contact?,
 *   guardian_relationship?,
 *   date_created?
 * }
 */
router.post('/createWaterBaptism', async (req, res) => {
  try {
    // Check if creating a completed baptism for non-member
    const isNonMemberCompleted = 
      (req.body.is_member === false || req.body.is_member === 0 || req.body.is_member === 'false' || req.body.is_member === '0' || req.body.member_id === null) &&
      req.body.status && 
      req.body.status.toLowerCase() === 'completed';
    
    console.log(`=== CREATING WATER BAPTISM ===`);
    console.log(`Is non-member completed: ${isNonMemberCompleted}`);
    console.log(`Request body:`, JSON.stringify({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      is_member: req.body.is_member,
      member_id: req.body.member_id,
      status: req.body.status
    }, null, 2));
    
    const result = await createWaterBaptism(req.body);
    
    if (result.success) {
      // If this is a non-member with completed status, create member and account
      if (isNonMemberCompleted) {
        const baptism = result.data;
        console.log(`✅ Creating member and account for completed non-member baptism: ${baptism.baptism_id}`);
        
        try {
          // Format birthdate to YYYY-MM-DD
          let formattedBirthdate = null;
          if (baptism.birthdate) {
            try {
              formattedBirthdate = moment(baptism.birthdate).format('YYYY-MM-DD');
            } catch (e) {
              console.error('Error formatting birthdate:', e);
              formattedBirthdate = null;
            }
          }
          
          // Truncate address if too long (VARCHAR(45))
          let formattedAddress = baptism.address || '';
          if (formattedAddress.length > 44) {
            formattedAddress = formattedAddress.substring(0, 44);
          }
          
          // Create member from baptism data
          const memberData = {
            firstname: baptism.firstname || '',
            lastname: baptism.lastname || '',
            middle_name: baptism.middle_name || null,
            birthdate: formattedBirthdate,
            age: baptism.age || '',
            gender: baptism.gender || '',
            address: formattedAddress,
            email: baptism.email || '',
            phone_number: baptism.phone_number || '',
            civil_status: baptism.civil_status || null,
            guardian_name: baptism.guardian_name || null,
            guardian_contact: baptism.guardian_contact || null,
            guardian_relationship: baptism.guardian_relationship || null,
            position: 'Member'
          };
          
          console.log('Creating member record...');
          const memberResult = await createMember(memberData);
          
          let existingMemberId = null;
          
          if (memberResult.success && memberResult.data) {
            existingMemberId = memberResult.data.member_id;
            console.log(`✅ Member created successfully with ID: ${existingMemberId}`);
          } else if (memberResult.message && memberResult.message.includes('Duplicate member detected')) {
            // Member already exists - try to find by email first
            console.log(`⚠️ Member already exists (duplicate detected). Looking up by email...`);
            let existingMember = await getSpecificMemberByEmailAndStatus(baptism.email);
            
            if (!existingMember) {
              const sql = 'SELECT member_id FROM tbl_members WHERE phone_number = ?';
              const [rows] = await query(sql, [baptism.phone_number]);
              if (rows.length > 0) {
                existingMember = { member_id: rows[0].member_id };
                console.log(`✅ Found existing member by phone with ID: ${existingMember.member_id}`);
              }
            } else {
              console.log(`✅ Found existing member by email with ID: ${existingMember.member_id}`);
            }
            
            if (!existingMember && baptism.firstname && baptism.lastname && baptism.birthdate) {
              const nameSql = 'SELECT member_id FROM tbl_members WHERE LOWER(TRIM(firstname)) = LOWER(TRIM(?)) AND LOWER(TRIM(lastname)) = LOWER(TRIM(?)) AND birthdate = ?';
              const birthdateFormatted = moment(baptism.birthdate).format('YYYY-MM-DD');
              const [nameRows] = await query(nameSql, [baptism.firstname, baptism.lastname, birthdateFormatted]);
              if (nameRows.length > 0) {
                existingMember = { member_id: nameRows[0].member_id };
                console.log(`✅ Found existing member by name + birthdate with ID: ${existingMember.member_id}`);
              }
            }
            
            if (existingMember) {
              existingMemberId = existingMember.member_id;
            }
          }
          
          if (existingMemberId) {
            // Update water baptism record with member_id
            console.log('Updating water baptism record with member_id...');
            await updateWaterBaptism(baptism.baptism_id, { member_id: existingMemberId, is_member: true });
            
            // Create account for the member if not exists
            const tempPassword = Math.random().toString(36).slice(-12);
            console.log(`Generated temp password: ${tempPassword}`);
            
            let accountResult = await getAccountByEmail(baptism.email);
            if (!accountResult.success || !accountResult.data) {
              const accountData = {
                email: baptism.email,
                password: tempPassword,
                position: 'Member',
                acc_name: `${baptism.firstname} ${baptism.lastname}`
              };
              console.log('Creating account record...');
              accountResult = await createAccount(accountData);
            } else {
              console.log(`Account already exists for ${baptism.email}, using existing account`);
            }
            
            if (accountResult.success && accountResult.data) {
              const account = accountResult.data;
              console.log(`✅ Account ready with ID: ${account.acc_id}`);
              
              const name = `${baptism.firstname} ${baptism.middle_name ? baptism.middle_name + ' ' : ''}${baptism.lastname}`.trim();
              console.log(`Sending welcome email to ${baptism.email} for ${name}...`);
              
              const emailResult = await sendAccountDetails({
                acc_id: account.acc_id,
                email: baptism.email,
                name: name,
                type: 'new_account',
                temporaryPassword: tempPassword
              });
              
              if (emailResult.success) {
                console.log(`✅ Welcome email sent successfully to ${baptism.email}`);
                
                console.log(`Sending water baptism completion confirmation email to ${baptism.email}...`);
                const baptismEmailResult = await sendWaterBaptismDetails({
                  email: baptism.email,
                  status: 'completed',
                  recipientName: name,
                  memberName: name,
                  baptismDate: baptism.baptism_date || moment().format('YYYY-MM-DD'),
                  location: baptism.location || 'Bible Baptist Ekklesia of Kawit'
                });
                
                if (baptismEmailResult.success) {
                  console.log(`✅ Water baptism completion email sent to ${baptism.email}`);
                } else {
                  console.error(`❌ Failed to send water baptism completion email: ${baptismEmailResult.message}`);
                }
              } else {
                console.error(`❌ Failed to send welcome email: ${emailResult.message}`, emailResult.error);
              }
            }
          }
          console.log(`=== Non-member baptism completion processing complete ===`);
        } catch (memberErr) {
          console.error('Error creating member from completed baptism:', memberErr);
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
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error creating water baptism:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create water baptism'
    });
  }
});

/**
 * READ ALL - Get all water baptism records with pagination and filters
 * GET /api/services/water-baptisms/getAllWaterBaptisms (query params)
 * POST /api/services/water-baptisms/getAllWaterBaptisms (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, sortBy
 */
router.get('/getAllWaterBaptisms', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllWaterBaptisms(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        summaryStats: result.summaryStats, // Summary statistics from all records
        thisYearCount: result.thisYearCount, // Count of baptisms this year
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
    console.error('Error fetching water baptisms:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch water baptisms'
    });
  }
});

router.post('/getAllWaterBaptisms', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllWaterBaptisms(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        summaryStats: result.summaryStats, // Summary statistics from all records
        thisYearCount: result.thisYearCount, // Count of baptisms this year
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
    console.error('Error fetching water baptisms:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch water baptisms'
    });
  }
});

/**
 * READ ONE - Get a single water baptism by ID
 * GET /api/services/water-baptisms/getWaterBaptismById/:id
 */
router.get('/getWaterBaptismById/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Baptism ID is required'
      });
    }

    const result = await getWaterBaptismById(id);
    
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
    console.error('Error fetching water baptism:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch water baptism'
    });
  }
});

/**
 * READ ONE - Get a single water baptism by member_id
 * GET /api/services/water-baptisms/getWaterBaptismByMemberId/:memberId
 */
router.get('/getWaterBaptismByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'Member ID is required'
      });
    }

    const result = await getWaterBaptismByMemberId(memberId);
    
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
    console.error('Error fetching water baptism by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch water baptism'
    });
  }
});

/**
 * UPDATE - Update an existing water baptism record
 * PUT /api/services/water-baptisms/updateWaterBaptism/:id
 * Body: { member_id?, baptism_date?, status?, date_created? }
 * When status is changed to "completed", sends account setup email to the member
 */
router.put('/updateWaterBaptism/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Baptism ID is required'
      });
    }

    // Get current baptism record to check if status is changing to "completed"
    const currentBaptism = await getWaterBaptismById(id);
    console.log(`=== WATER BAPTISM STATUS UPDATE ===`);
    console.log(`Baptism ID: ${id}`);
    console.log(`Request body status: ${req.body.status}`);
    console.log(`Current baptism status: ${currentBaptism.data?.status}`);
    
    const isStatusChangingToCompleted = 
      req.body.status && 
      req.body.status.toLowerCase() === 'completed' && 
      currentBaptism.success && 
      currentBaptism.data && 
      currentBaptism.data.status?.toLowerCase() !== 'completed';
      
    console.log(`Is status changing to completed: ${isStatusChangingToCompleted}`);

    const result = await updateWaterBaptism(id, req.body);
    
    if (result.success) {
      // If status changed to "completed" and this is a non-member, create member record
      if (isStatusChangingToCompleted) {
        const baptism = currentBaptism.data;
        
        if (baptism.is_member === 0 || baptism.is_member === '0' || baptism.is_member === false || baptism.is_member === 'false' || baptism.member_id === null) {
          console.log(`✅ Is non-member: is_member=${baptism.is_member} (${typeof baptism.is_member}), member_id=${baptism.member_id}`);
          // This is a non-member - create member record
          try {
            console.log(`=== Processing non-member baptism completion ===`);
            console.log(`Baptism ID: ${id}`);
            console.log(`Baptism data:`, JSON.stringify({
              firstname: baptism.firstname,
              lastname: baptism.lastname,
              email: baptism.email,
              is_member: baptism.is_member,
              member_id: baptism.member_id
            }, null, 2));
            
            // Format birthdate to YYYY-MM-DD
            let formattedBirthdate = null;
            if (baptism.birthdate) {
              try {
                formattedBirthdate = moment(baptism.birthdate).format('YYYY-MM-DD');
              } catch (e) {
                console.error('Error formatting birthdate:', e);
                formattedBirthdate = null;
              }
            }
            
            // Truncate address if too long (VARCHAR(45))
            let formattedAddress = baptism.address || '';
            if (formattedAddress.length > 44) {
              formattedAddress = formattedAddress.substring(0, 44);
            }
            
            // Create member from baptism data
            const memberData = {
              firstname: baptism.firstname || '',
              lastname: baptism.lastname || '',
              middle_name: baptism.middle_name || null,
              birthdate: formattedBirthdate,
              age: baptism.age || '',
              gender: baptism.gender || '',
              address: formattedAddress,
              email: baptism.email || '',
              phone_number: baptism.phone_number || '',
              civil_status: baptism.civil_status || null,
              guardian_name: baptism.guardian_name || null,
              guardian_contact: baptism.guardian_contact || null,
              guardian_relationship: baptism.guardian_relationship || null,
              position: 'Member'
            };
            
            console.log('Creating member record...');
            const memberResult = await createMember(memberData);
            
            let existingMemberId = null;
            
            if (memberResult.success && memberResult.data) {
              // New member created successfully
              existingMemberId = memberResult.data.member_id;
              console.log(`✅ Member created successfully with ID: ${existingMemberId}`);
            } else if (memberResult.message && memberResult.message.includes('Duplicate member detected')) {
              // Member already exists - try to find by email first
              console.log(`⚠️ Member already exists (duplicate detected). Looking up by email...`);
              let existingMember = await getSpecificMemberByEmailAndStatus(baptism.email);
              
              if (!existingMember) {
                // Try by phone number
                console.log(`Email not found, trying phone number...`);
                const sql = 'SELECT member_id FROM tbl_members WHERE phone_number = ?';
                const [rows] = await query(sql, [baptism.phone_number]);
                if (rows.length > 0) {
                  existingMember = { member_id: rows[0].member_id };
                  console.log(`✅ Found existing member by phone with ID: ${existingMember.member_id}`);
                }
              } else {
                console.log(`✅ Found existing member by email with ID: ${existingMember.member_id}`);
              }
              
              // If still not found, try by name + birthdate
              if (!existingMember && baptism.firstname && baptism.lastname && baptism.birthdate) {
                console.log(`Phone not found, trying name + birthdate...`);
                const nameSql = 'SELECT member_id FROM tbl_members WHERE LOWER(TRIM(firstname)) = LOWER(TRIM(?)) AND LOWER(TRIM(lastname)) = LOWER(TRIM(?)) AND birthdate = ?';
                const birthdateFormatted = moment(baptism.birthdate).format('YYYY-MM-DD');
                const [nameRows] = await query(nameSql, [baptism.firstname, baptism.lastname, birthdateFormatted]);
                if (nameRows.length > 0) {
                  existingMember = { member_id: nameRows[0].member_id };
                  console.log(`✅ Found existing member by name + birthdate with ID: ${existingMember.member_id}`);
                }
              }
              
              if (existingMember) {
                existingMemberId = existingMember.member_id;
              } else {
                // Return user-friendly error instead of failing silently
                console.error(`❌ Duplicate member detected but could not find existing record`);
                return res.status(400).json({
                  success: false,
                  error: 'A member with the same name and birthdate already exists in our system. Please contact the church office to link your baptism record.'
                });
              }
            }
            
            if (existingMemberId) {
              // Update water baptism record with member_id
              console.log('Updating water baptism record with member_id...');
              await updateWaterBaptism(id, { member_id: existingMemberId, is_member: true });
              
              // Create account for the member if not exists
              const tempPassword = Math.random().toString(36).slice(-12);
              console.log(`Generated temp password: ${tempPassword}`);
              
              // Check if account exists
              let accountResult = await getAccountByEmail(baptism.email);
              if (!accountResult.success || !accountResult.data) {
                // Create account
                const accountData = {
                  email: baptism.email,
                  password: tempPassword,
                  position: 'Member',
                  acc_name: `${baptism.firstname} ${baptism.lastname}`
                };
                console.log('Creating account record...');
                accountResult = await createAccount(accountData);
              } else {
                console.log(`Account already exists for ${baptism.email}, using existing account`);
              }
              
              if (accountResult.success && accountResult.data) {
                const account = accountResult.data;
                console.log(`✅ Account ready with ID: ${account.acc_id}`);
                
                // Send welcome email with account details
                const name = `${baptism.firstname} ${baptism.middle_name ? baptism.middle_name + ' ' : ''}${baptism.lastname}`.trim();
                console.log(`Sending welcome email to ${baptism.email} for ${name}...`);
                
                const emailResult = await sendAccountDetails({
                  acc_id: account.acc_id,
                  email: baptism.email,
                  name: name,
                  type: 'new_account',
                  temporaryPassword: tempPassword
                });
                
                if (emailResult.success) {
                  console.log(`✅ Welcome email sent successfully to ${baptism.email}`);
                  
                  // Also send water baptism completion confirmation email
                  console.log(`Sending water baptism completion confirmation email to ${baptism.email}...`);
                  const baptismEmailResult = await sendWaterBaptismDetails({
                    email: baptism.email,
                    status: 'completed',
                    recipientName: name,
                    memberName: name,
                    baptismDate: baptism.baptism_date || moment().format('YYYY-MM-DD'),
                    location: baptism.location || 'Bible Baptist Ekklesia of Kawit'
                  });
                  
                  if (baptismEmailResult.success) {
                    console.log(`✅ Water baptism completion email sent to ${baptism.email}`);
                  } else {
                    console.error(`❌ Failed to send water baptism completion email: ${baptismEmailResult.message}`);
                  }
                } else {
                  console.error(`❌ Failed to send welcome email: ${emailResult.message}`, emailResult.error);
                }
              } else {
                console.error(`❌ Failed to get/create account: ${accountResult.message}`);
              }
            } else {
              console.error(`❌ Failed to create or find member: ${memberResult.message}`);
              // Return error response if member creation fails
              return res.status(400).json({
                success: false,
                error: memberResult.message || 'Failed to create member record'
              });
            }
            console.log(`=== Non-member baptism completion processing complete ===`);
          } catch (memberErr) {
            console.error('Error creating member from completed baptism:', memberErr);
            // Don't fail the update, but log the error
          }
        } else {
          console.log(`❌ Not a non-member: is_member=${baptism.is_member} (${typeof baptism.is_member}), member_id=${baptism.member_id} (${typeof baptism.member_id}) - treating as existing member`);
          // Existing member - generate temporary password and send account setup email
          try {
            console.log(`Processing completed baptism for existing member. Baptism ID: ${id}`);
            
            const memberResult = await getMemberById(result.data.member_id);
            if (memberResult.success && memberResult.data) {
              const member = memberResult.data;
              console.log(`Found member: ${member.firstname} ${member.lastname}, Email: ${member.email}`);
              
              // Generate a random temporary password
              const tempPassword = Math.random().toString(36).slice(-12);
              console.log(`Generated temp password: ${tempPassword}`);
              
              // Check if account exists, if not create one
              let accountResult = await getAccountByEmail(member.email);
              if (!accountResult.success || !accountResult.data) {
                console.log(`No account found for ${member.email}, creating new account...`);
                // Create account if doesn't exist
                const newAccountData = {
                  email: member.email,
                  password: tempPassword,
                  position: 'Member',
                  acc_name: `${member.firstname} ${member.lastname}`
                };
                accountResult = await createAccount(newAccountData);
                if (accountResult.success) {
                  console.log(`Account created successfully for ${member.email}`);
                } else {
                  console.error(`Failed to create account: ${accountResult.message}`);
                }
              } else {
                console.log(`Account already exists for ${member.email}, acc_id: ${accountResult.data.acc_id}`);
              }
              
              if (accountResult.success && accountResult.data) {
                const account = accountResult.data;
                
                const name = `${member.firstname} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname}`.trim();
                console.log(`Sending account setup email to ${member.email} for ${name}...`);
                
                const emailResult = await sendAccountDetails({
                  acc_id: account.acc_id,
                  email: member.email,
                  name: name,
                  type: 'new_account',
                  temporaryPassword: tempPassword
                });
                
                if (emailResult.success) {
                  console.log(`✅ Account setup email sent successfully to ${member.email}`);
                } else {
                  console.error(`❌ Failed to send email: ${emailResult.message}`, emailResult.error);
                }
              }
            } else {
              console.error(`Member not found for member_id: ${result.data.member_id}`);
            }
          } catch (emailErr) {
            console.error('Error sending account setup email for completed baptism:', emailErr);
          }
        }
      }

      res.status(200).json({
        success: true,
        message: result.message + (isStatusChangingToCompleted ? ' Member record created and welcome email sent.' : ''),
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
    console.error('Error updating water baptism:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update water baptism'
    });
  }
});

/**
 * DELETE - Delete a water baptism record
 * DELETE /api/services/water-baptisms/deleteWaterBaptism/:id
 */
router.delete('/deleteWaterBaptism/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Baptism ID is required'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteWaterBaptism(id, archivedBy);
    
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
    console.error('Error deleting water baptism:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete water baptism'
    });
  }
});

/**
 * EXPORT - Export water baptism records to Excel
 * GET /api/services/water-baptisms/exportExcel (query params)
 * POST /api/services/water-baptisms/exportExcel (body payload)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    const options = req.query;
    const excelBuffer = await exportWaterBaptismsToExcel(options);
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `water_baptisms_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting water baptisms to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export water baptisms to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    const options = req.body;
    const excelBuffer = await exportWaterBaptismsToExcel(options);
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `water_baptisms_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting water baptisms to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export water baptisms to Excel'
    });
  }
});

/**
 * CREATE - Non-member water baptism registration
 * POST /api/services/water-baptisms/register-non-member
 * Body: {
 *   firstname, lastname, middle_name, email, phone_number,
 *   birthdate, age, gender, address, civil_status,
 *   guardian_name, guardian_contact, guardian_relationship,
 *   baptism_date?, location?, pastor_name?
 * }
 * This creates a water baptism record WITHOUT creating a member record
 */
router.post('/register-non-member', async (req, res) => {
  try {
    // Validate required fields for non-member
    const { firstname, lastname, email } = req.body;
    
    if (!firstname || !lastname || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required for non-member registration'
      });
    }
    
    // Check if email already exists (in accounts or members)
    const duplicateAccount = await checkDuplicateAccount(email);
    if (duplicateAccount.isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        error: 'An account with this email already exists. Please use a different email or contact support.'
      });
    }
    
    const existingMember = await getSpecificMemberByEmailAndStatus(email?.trim().toLowerCase());
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        error: 'A member with this email already exists. Please use a different email or contact support.'
      });
    }
    
    // Create water baptism record with is_member = 0
    const baptismData = {
      ...req.body,
      is_member: false,
      member_id: null,
      status: 'pending'
    };
    
    const result = await createWaterBaptism(baptismData);
    
    if (result.success) {
      // Send confirmation email for pending registration
      const recipientName = `${req.body.firstname} ${req.body.lastname}`;
      console.log(`Sending pending registration confirmation email to ${req.body.email}...`);
      
      const emailResult = await sendWaterBaptismDetails({
        email: req.body.email,
        status: 'pending',
        recipientName: recipientName,
        memberName: recipientName,
        baptismDate: req.body.baptism_date || 'To be scheduled',
        location: req.body.location || 'Bible Baptist Ekklesia of Kawit'
      });
      
      if (emailResult.success) {
        console.log(`✅ Pending registration confirmation email sent to ${req.body.email}`);
      } else {
        console.error(`❌ Failed to send pending registration email: ${emailResult.message}`);
      }
      
      res.status(201).json({
        success: true,
        message: 'Water baptism registration submitted successfully! You will receive an email with further instructions.',
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
    console.error('Error registering non-member for water baptism:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register for water baptism'
    });
  }
});

/**
 * CHECK EMAIL EXISTS - Check if an email already exists in accounts table
 * GET /api/services/water-baptisms/check-email-exists?email=xxx
 * This prevents creating duplicate accounts
 */
router.get('/check-email-exists', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Direct query to avoid circular dependency
    const sql = 'SELECT acc_id, email FROM tbl_accounts WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))';
    const [rows] = await query(sql, [email]);

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        data: { exists: true, account: rows[0] }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email is available',
      data: { exists: false }
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check email'
    });
  }
});

/**
 * CHECK TIME SLOT - Check if a time slot is already booked for water baptism
 * GET /api/services/water-baptisms/check-time-slot?baptism_date=YYYY-MM-DD&baptism_time=HH:mm:ss&exclude_id=xxx
 * This prevents double-booking of baptism time slots
 */
router.get('/check-time-slot', async (req, res) => {
  try {
    const { baptism_date, baptism_time, exclude_id } = req.query;

    if (!baptism_date || !baptism_time) {
      return res.status(400).json({
        success: false,
        message: 'Baptism date and time are required'
      });
    }

    // Query to check for existing approved baptisms at the same date and time
    let sql = `
      SELECT baptism_id, firstname, lastname, baptism_date, preferred_baptism_time as baptism_time
      FROM tbl_waterbaptism
      WHERE baptism_date = ?
      AND preferred_baptism_time = ?
      AND status = 'approved'
    `;

    const params = [baptism_date, baptism_time];

    // Exclude current baptism if editing
    if (exclude_id) {
      sql += ' AND baptism_id != ?';
      params.push(exclude_id);
    }

    const [rows] = await query(sql, params);

    if (rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Time slot is already booked',
        data: {
          isBooked: true,
          conflictingBaptism: {
            baptism_id: rows[0].baptism_id,
            name: `${rows[0].firstname} ${rows[0].lastname}`,
            baptism_date: rows[0].baptism_date,
            baptism_time: rows[0].baptism_time
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Time slot is available',
      data: { isBooked: false }
    });
  } catch (error) {
    console.error('Error checking time slot:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check time slot'
    });
  }
});

module.exports = router;

