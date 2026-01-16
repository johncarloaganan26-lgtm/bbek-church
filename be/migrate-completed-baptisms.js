/**
 * Migration Script: Convert completed water baptisms to members and accounts
 * 
 * This script processes all water baptism records with status 'completed'
 * that haven't been converted to members yet (is_member = 0 or member_id is null)
 * and creates corresponding member and account records.
 * 
 * Run with: node migrate-completed-baptisms.js
 */

// Load environment variables FIRST before any other imports
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Set production environment to use remote database
process.env.NODE_ENV = 'production';

const { query } = require('./database/db');
const moment = require('moment');
const crypto = require('crypto');

const { createMember } = require('./dbHelpers/church_records/memberRecords');
const { createAccount, getAccountByEmail } = require('./dbHelpers/church_records/accountRecords');
const { updateWaterBaptism } = require('./dbHelpers/services/waterBaptismRecords');
const { sendAccountDetails } = require('./dbHelpers/emailHelperSendGrid');

async function migrateCompletedBaptisms() {
  console.log('=== Starting Migration: Completed Water Baptisms to Members ===\n');
  
  try {
    // Get all completed water baptisms that haven't been converted to members
    const sql = `
      SELECT 
        baptism_id, 
        firstname, 
        lastname, 
        middle_name,
        birthdate,
        age,
        gender,
        address,
        email,
        phone_number,
        civil_status,
        guardian_name,
        guardian_contact,
        guardian_relationship,
        is_member,
        member_id
      FROM tbl_waterbaptism 
      WHERE status = 'completed'
        AND (is_member = 0 OR is_member IS NULL OR member_id IS NULL OR member_id = '')
    `;
    
    const [baptisms] = await query(sql);
    
    console.log(`Found ${baptisms.length} completed water baptism records to migrate.\n`);
    
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    
    for (const baptism of baptisms) {
      console.log(`\nProcessing: ${baptism.baptism_id} - ${baptism.firstname} ${baptism.lastname}`);
      console.log(`  Email: ${baptism.email}`);
      console.log(`  Is Member: ${baptism.is_member}, Member ID: ${baptism.member_id}`);
      
      try {
        // Check if member already exists with this email
        const existingAccount = await getAccountByEmail(baptism.email);
        if (existingAccount.success && existingAccount.data) {
          console.log(`  ⚠️  Account already exists for email: ${baptism.email} - Skipping`);
          
          // Update the baptism record to mark as member
          await updateWaterBaptism(baptism.baptism_id, { 
            is_member: true,
            member_id: existingAccount.data.member_id || null
          });
          
          skippedCount++;
          continue;
        }
        
        // Format birthdate
        let formattedBirthdate = null;
        if (baptism.birthdate) {
          try {
            formattedBirthdate = moment(baptism.birthdate).format('YYYY-MM-DD');
          } catch (e) {
            console.log(`  ⚠️  Invalid birthdate format: ${baptism.birthdate}`);
          }
        }
        
        // Truncate address if too long (VARCHAR(45))
        let formattedAddress = baptism.address || '';
        if (formattedAddress.length > 44) {
          formattedAddress = formattedAddress.substring(0, 44);
        }
        
        // Create member data
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
        
        console.log(`  Creating member record...`);
        
        // Create member
        const memberResult = await createMember(memberData);
        
        if (!memberResult.success) {
          console.log(`  ❌ Failed to create member: ${memberResult.message}`);
          failCount++;
          continue;
        }
        
        const newMemberId = memberResult.data.member_id;
        console.log(`  ✓ Member created with ID: ${newMemberId}`);
        
        // Create account
        const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 char random password
        const accountData = {
          email: baptism.email,
          password: tempPassword,
          position: 'Member',
          acc_name: `${baptism.firstname} ${baptism.lastname}`
        };
        
        console.log(`  Creating account...`);
        
        const accountResult = await createAccount(accountData);
        
        if (!accountResult.success) {
          console.log(`  ❌ Failed to create account: ${accountResult.message}`);
          failCount++;
          continue;
        }
        
        const account = accountResult.data;
        console.log(`  ✓ Account created with ID: ${account.acc_id}`);
        
        // Update water baptism record
        await updateWaterBaptism(baptism.baptism_id, { 
          member_id: newMemberId,
          is_member: true 
        });
        
        console.log(`  Updating baptism record...`);
        
        // Send welcome email
        const name = `${baptism.firstname} ${baptism.middle_name ? baptism.middle_name + ' ' : ''}${baptism.lastname}`.trim();
        
        try {
          await sendAccountDetails({
            acc_id: account.acc_id,
            email: baptism.email,
            name: name,
            type: 'new_account',
            temporaryPassword: tempPassword
          });
          console.log(`  ✓ Welcome email sent to ${baptism.email}`);
        } catch (emailErr) {
          console.log(`  ⚠️  Failed to send email: ${emailErr.message}`);
        }
        
        successCount++;
        console.log(`  ✅ Migration complete for ${baptism.baptism_id}`);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${baptism.baptism_id}:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total processed: ${baptisms.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log('\n=== Migration Complete ===');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the migration
migrateCompletedBaptisms();
