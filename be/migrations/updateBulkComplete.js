const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'dbHelpers', 'services', 'waterBaptismRecords.js');
const content = fs.readFileSync(filePath, 'utf8');

const newFunction = `/**
 * BULK COMPLETE - Mark multiple water baptisms as completed
 * Only services with 'approved' status will be marked as completed
 * For non-members, also creates member record, account, and sends setup email
 * @param {Array} baptismIds - Array of baptism IDs to mark as completed
 * @returns {Object} Result object with success status and details
 */
async function bulkCompleteWaterBaptisms(baptismIds) {
  try {
    if (!Array.isArray(baptismIds) || baptismIds.length === 0) {
      throw new Error('Baptism IDs array is required and cannot be empty');
    }

    // Validate all IDs are provided
    const validIds = baptismIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validIds.length === 0) {
      throw new Error('No valid baptism IDs provided');
    }

    // Get water baptisms that are 'approved' status
    const placeholders = validIds.map(() => '?').join(',');
    const selectSql = \`SELECT baptism_id, status, is_member, member_id, firstname, lastname, middle_name, email, phone_number, birthdate, age, gender, address, civil_status, baptism_date, location, pastor_name, guardian_name, guardian_contact, guardian_relationship FROM tbl_waterbaptism WHERE baptism_id IN (\${placeholders})\`;
    const [rows] = await query(selectSql, validIds);

    // Filter only approved services
    const approvedBaptisms = rows.filter(row => row.status === 'approved');
    const nonApprovedBaptisms = rows.filter(row => row.status !== 'approved');

    // Update only approved baptisms to completed
    let completedCount = 0;
    let failedCount = 0;
    let nonMembersCreated = 0;

    if (approvedBaptisms.length > 0) {
      // Import required functions
      const { createMember } = require('../church_records/memberRecords');
      const { getAccountByEmail, createAccount } = require('../church_records/accountRecords');
      const { sendAccountDetails, sendWaterBaptismDetails } = require('../emailHelper');

      for (const baptism of approvedBaptisms) {
        try {
          // Update baptism status to completed
          const updateSql = \`UPDATE tbl_waterbaptism SET status = 'completed' WHERE baptism_id = ?\`;
          await query(updateSql, [baptism.baptism_id]);
          completedCount++;

          // For non-members, create member record, account, and send setup email
          const isNonMember = baptism.is_member === 0 || baptism.is_member === '0' || baptism.is_member === false || baptism.is_member === 'false' || baptism.member_id === null;
          
          if (isNonMember && baptism.email) {
            try {
              // Format birthdate to YYYY-MM-DD
              let formattedBirthdate = null;
              if (baptism.birthdate) {
                try {
                  formattedBirthdate = moment(baptism.birthdate).format('YYYY-MM-DD');
                } catch (e) {
                  formattedBirthdate = null;
                }
              }

              // Truncate address if too long
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

              const memberResult = await createMember(memberData);
              let existingMemberId = null;

              if (memberResult.success && memberResult.data) {
                existingMemberId = memberResult.data.member_id;
                console.log(\`✅ Member created for baptism \${baptism.baptism_id} with ID: \${existingMemberId}\`);
              } else if (memberResult.message && memberResult.message.includes('Duplicate member detected')) {
                // Member already exists - try to find by email
                const { getSpecificMemberByEmailAndStatus } = require('../church_records/memberRecords');
                let existingMember = await getSpecificMemberByEmailAndStatus(baptism.email);
                if (existingMember) {
                  existingMemberId = existingMember.member_id;
                } else {
                  // Try by phone
                  const sql = 'SELECT member_id FROM tbl_members WHERE phone_number = ?';
                  const [phoneRows] = await query(sql, [baptism.phone_number]);
                  if (phoneRows.length > 0) {
                    existingMemberId = phoneRows[0].member_id;
                  }
                }
              }

              if (existingMemberId) {
                // Update water baptism with member_id
                await query(\`UPDATE tbl_waterbaptism SET member_id = ?, is_member = 1 WHERE baptism_id = ?\`, [existingMemberId, baptism.baptism_id]);

                // Create account for the member
                const tempPassword = Math.random().toString(36).slice(-12);
                let accountResult = await getAccountByEmail(baptism.email);
                
                if (!accountResult.success || !accountResult.data) {
                  const accountData = {
                    email: baptism.email,
                    password: tempPassword,
                    position: 'Member',
                    acc_name: \`\${baptism.firstname} \${baptism.lastname}\`
                  };
                  accountResult = await createAccount(accountData);
                }

                if (accountResult.success && accountResult.data) {
                  const account = accountResult.data;
                  const name = \`\${baptism.firstname} \${baptism.middle_name ? baptism.middle_name + ' ' : ''}\${baptism.lastname}\`.trim();

                  // Send welcome email with account details
                  await sendAccountDetails({
                    acc_id: account.acc_id,
                    email: baptism.email,
                    name: name,
                    type: 'new_account',
                    temporaryPassword: tempPassword
                  });

                  // Send water baptism completion email
                  await sendWaterBaptismDetails({
                    email: baptism.email,
                    status: 'completed',
                    recipientName: name,
                    memberName: name,
                    baptismDate: baptism.baptism_date || moment().format('YYYY-MM-DD HH:mm:ss'),
                    location: baptism.location || '',
                    pastorName: baptism.pastor_name || '',
                    isMember: true,
                    firstname: baptism.firstname || '',
                    middleName: baptism.middle_name || '',
                    lastname: baptism.lastname || '',
                    birthdate: formattedBirthdate || '',
                    age: baptism.age || null,
                    gender: baptism.gender || '',
                    address: baptism.address || '',
                    phoneNumber: baptism.phone_number || '',
                    civilStatus: baptism.civil_status || '',
                    profession: ''
                  });

                  nonMembersCreated++;
                }
              }
            } catch (nonMemberError) {
              console.error(\`Error creating member for baptism \${baptism.baptism_id}:\`, nonMemberError.message);
            }
          } else {
            // For members, just send completion email
            try {
              const name = \`\${baptism.firstname || ''} \${baptism.middle_name ? baptism.middle_name + ' ' : ''}\${baptism.lastname || ''}\`.trim();
              
              await sendWaterBaptismDetails({
                email: baptism.email,
                status: 'completed',
                recipientName: name,
                memberName: name,
                baptismDate: baptism.baptism_date || moment().format('YYYY-MM-DD HH:mm:ss'),
                location: baptism.location || '',
                pastorName: baptism.pastor_name || '',
                isMember: true,
                firstname: baptism.firstname || '',
                middleName: baptism.middle_name || '',
                lastname: baptism.lastname || '',
                birthdate: baptism.birthdate || '',
                age: baptism.age || null,
                gender: baptism.gender || '',
                address: baptism.address || '',
                phoneNumber: baptism.phone_number || '',
                civilStatus: baptism.civil_status || '',
                profession: ''
              });
            } catch (emailError) {
              console.error(\`Error sending completion email for baptism \${baptism.baptism_id}:\`, emailError.message);
            }
          }
        } catch (error) {
          console.error(\`Error processing baptism \${baptism.baptism_id}:\`, error.message);
        }
      }
    }

    failedCount = nonApprovedBaptisms.length;

    return {
      success: true,
      message: \`Bulk complete: \${completedCount} marked as completed, \${nonMembersCreated} member accounts created, \${failedCount} skipped (not approved)\`,
      data: {
        requested: validIds.length,
        completed: completedCount,
        memberAccountsCreated: nonMembersCreated,
        skipped: failedCount,
        skippedDetails: nonApprovedBaptisms.map(b => ({ baptism_id: b.baptism_id, status: b.status }))
      }
    };
  } catch (error) {
    console.error('Error bulk completing water baptisms:', error);
    throw error;
  }
}`;

// Find and replace the function
const regex = /\/\*\*[\s\S]*?async function bulkCompleteWaterBaptisms\(baptismIds\) \{[\s\S]*?^\s*\}/m;
const newContent = content.replace(regex, newFunction);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Updated bulkCompleteWaterBaptisms function');
