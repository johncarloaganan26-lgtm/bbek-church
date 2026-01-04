
const { createMember, deleteMember, checkDuplicateMember, getSpecificMemberByEmailAndStatus, getMemberById } = require('./church_records/memberRecords');
const {
  createAccount,
  checkDuplicateAccount
} = require('./church_records/accountRecords');
const { sendAccountDetails, sendBurialServiceRequestNotification, sendWaterBaptismDetails } = require('./emailHelper');
const moment = require('moment');
const {
  createWaterBaptism,
  deleteWaterBaptism
} = require('./services/waterBaptismRecords');
const {
  createBurialService,
  deleteBurialService
} = require('./services/burialServiceRecords');

/**
 * Basic payload validation for member registration coming from the
 * WaterBaptism.vue form. Returns a list of errors; empty list means valid.
 */
function validateRegistrationData(payload = {}) {
  const errors = [];
  const requiredFields = [
    'firstname',
    'lastname',
    'birthdate',
    'age',
    'gender',
    'address',
    'email',
    'phoneNumber'
  ];

  requiredFields.forEach((field) => {
    if (
      payload[field] === undefined ||
      payload[field] === null ||
      `${payload[field]}`.trim() === ''
    ) {
      errors.push(`${field} is required`);
    }
  });

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (payload.email && !emailRegex.test(payload.email.trim())) {
    errors.push('Invalid email format');
  }

  // Birthdate must be in the past
  if (payload.birthdate) {
    const birth = new Date(payload.birthdate);
    const today = new Date();
    if (Number.isNaN(birth.getTime()) || birth >= today) {
      errors.push('Birthdate must be a valid past date');
    }
  }

  // Age should be positive
  if (payload.age !== undefined) {
    const ageNum = Number(payload.age);
    if (Number.isNaN(ageNum) || ageNum <= 0) {
      errors.push('Age must be a positive number');
    }
  }

  // Phone number minimal sanity check (10-15 digits)
  if (payload.phoneNumber) {
    const digits = payload.phoneNumber.replace(/[^\d]/g, '');
    if (digits.length < 10 || digits.length > 15) {
      errors.push('Phone number must be between 10 and 15 digits');
    }
  }

  return errors;
}

function generateTemporaryPassword(length = 10) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}
/**
 * Register a member coming from the Burial Service landing page form.
 * - Validates payload
 * - Creates member record with position = null (no account created)
 * - Creates burial service record with status = 'pending'
 * - Sends burial service request notification email
 *
 * @param {Object} payload Form payload from BurialService.vue 
 * @returns {Promise<Object>} status object
 */
async function registerMemberFromBurialService(payload = {}) {
  // Step 1: Validate incoming data
  const validationErrors = validateRegistrationData(payload);
  if (validationErrors.length > 0) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    };
  }

  // Additional validation for burial service specific fields
  if (!payload.relationship || !payload.deceasedName || !payload.deceasedBirthDate || !payload.deceasedDeathDate) {
    return {
      success: false,
      message: 'Validation failed',
      errors: ['relationship, deceasedName, deceasedBirthDate, and deceasedDeathDate are required for burial service']
    };
  }

  // Prepare member payload aligning with memberRecords schema
  // Position is set to null as per requirements (no account will be created)
  const memberData = {
    firstname: payload.firstname?.trim(),
    lastname: payload.lastname?.trim(),
    middle_name: payload.middleName?.trim() || null,
    birthdate: payload.birthdate,
    age: payload.age,
    gender: payload.gender?.trim(),
    address: payload.address?.trim(),
    email: payload.email?.trim().toLowerCase(),
    phone_number: payload.phoneNumber?.trim(),
    civil_status: payload.civilStatus || null,
    position: 'none'  // Position is none for burial service registration (no account created)
  };

  let createdMemberId = null;
  let createdBurialServiceId = null;
  let isExistingMember = false; // Track if we used an existing member

  try {
    // Step 3: Create member record (includes duplicate checks internally)
    const memberResult = await createMember(memberData);
    if (!memberResult.success) {
      // Check if the error is due to duplicate email/phone (member already exists)
      const isDuplicateError = memberResult.error && (
        memberResult.error.includes('Email address already exists') ||
        memberResult.error.includes('Phone number already exists') ||
        memberResult.error.includes('Duplicate member detected')
      );

      if (isDuplicateError && memberResult.duplicateDetails && memberResult.duplicateDetails.length > 0) {
        // Member already exists - use the existing member's ID
        // Get the first duplicate member's ID (prefer email match if available)
        const emailMatch = memberResult.duplicateDetails.find(detail => detail.matchingFields.includes('email'));
        const existingMember = emailMatch || memberResult.duplicateDetails[0];
        createdMemberId = existingMember.member_id;
        isExistingMember = true;
        
        console.log(`Member already exists with email ${memberData.email}. Using existing member ID: ${createdMemberId}`);
      } else {
        // Other validation errors - return error
      const errorMessages = [];
      if (memberResult.error) {
        // Split comma-separated errors if present
        if (memberResult.error.includes(',')) {
          errorMessages.push(...memberResult.error.split(',').map(e => e.trim()));
        } else {
          errorMessages.push(memberResult.error);
        }
      }
      if (memberResult.errors && Array.isArray(memberResult.errors)) {
        errorMessages.push(...memberResult.errors);
      }
      if (memberResult.message && !errorMessages.includes(memberResult.message)) {
        errorMessages.push(memberResult.message);
      }
      return {
        success: false,
        message: memberResult.message || 'Failed to create member',
        errors: errorMessages.length > 0 ? errorMessages : ['Failed to create member record']
      };
    }
    } else {
      // Member was created successfully
    createdMemberId = memberResult.data.member_id;
    }

    // Step 4: Create burial service record with status 'pending'
    // Note: location, pastor_id, and service_date are optional for initial request
    const burialServiceData = {
      member_id: createdMemberId,
      relationship: payload.relationship?.trim(),
      location: payload.location?.trim() || 'To be determined',
      pastor_id: null, // Default null pastor_id (will be updated by admin)
      service_date: payload.service_date || null, // Default: 7 days after death date or current date + 7
      status: 'pending',
      deceased_name: payload.deceasedName?.trim(),
      deceased_birthdate: payload.deceasedBirthDate,
      date_death: payload.deceasedDeathDate || null
    };

    const burialResult = await createBurialService(burialServiceData);
    if (!burialResult.success) {
      // Roll back member if burial service creation failed (only if we created the member, not if it was existing)
      if (createdMemberId && !isExistingMember) {
        await deleteMember(createdMemberId);
      }
      const errorMessages = [];
      if (burialResult.error) {
        errorMessages.push(burialResult.error);
      }
      if (burialResult.errors && Array.isArray(burialResult.errors)) {
        errorMessages.push(...burialResult.errors);
      }
      if (burialResult.message && !errorMessages.includes(burialResult.message)) {
        errorMessages.push(burialResult.message);
      }
      return {
        success: false,
        message: burialResult.message || 'Failed to create burial service record',
        errors: errorMessages.length > 0 ? errorMessages : ['Failed to create burial service record']
      };
    }
    createdBurialServiceId = burialResult.data.burial_id;

    // Step 5: Send burial service request notification email
    let emailError = null;
    try {
    const burialEmailResult = await sendBurialServiceRequestNotification({
      email: memberData.email,
      recipientName: `${memberData.firstname} ${memberData.lastname}`.trim(),
      deceasedName: payload.deceasedName?.trim(),
      relationship: payload.relationship?.trim(),
      deceasedBirthDate: payload.deceasedBirthDate,
      dateOfDeath: payload.deceasedDeathDate,
      burialServiceId: createdBurialServiceId
    });
      
      // Check if email sending failed
      if (burialEmailResult && !burialEmailResult.success) {
        emailError = burialEmailResult.message || burialEmailResult.error || 'Failed to send burial service notification email';
      }
    } catch (emailErr) {
      emailError = emailErr.message || 'Failed to send burial service notification email';
      console.error('Error sending burial service notification email:', emailErr);
    }

    // If email failed, return error but don't rollback the records
    if (emailError) {
      // Get member data for response (either from creation result or fetch existing member)
      let memberDataForErrorResponse = null;
      if (isExistingMember) {
        // Fetch existing member data
        const existingMemberResult = await getMemberById(createdMemberId);
        if (existingMemberResult.success) {
          memberDataForErrorResponse = existingMemberResult.data;
        }
      } else {
        memberDataForErrorResponse = memberResult.data;
      }

      return {
        success: false,
        message: isExistingMember
          ? 'Burial service created for existing member, but failed to send notification email'
          : 'Member and burial service created, but failed to send notification email',
        errors: [emailError],
        data: {
          member: memberDataForErrorResponse,
          burialService: burialResult.data
        }
      };
    }

    // Get member data for response (either from creation result or fetch existing member)
    let memberDataForResponse = null;
    if (isExistingMember) {
      // Fetch existing member data
      const existingMemberResult = await getMemberById(createdMemberId);
      if (existingMemberResult.success) {
        memberDataForResponse = existingMemberResult.data;
      }
    } else {
      memberDataForResponse = memberResult.data;
    }

    return {
      success: true,
      message: isExistingMember 
        ? 'Burial service created successfully for existing member'
        : 'Member and burial service created successfully',
      data: {
        member: memberDataForResponse,
        burialService: burialResult.data
      }
    };
  } catch (error) {
    console.error('Error registering member from burial service form:', error);
    // Roll back burial service and member if they were created (only if we created the member, not if it was existing)
    if (createdBurialServiceId) {
      try {
        await deleteBurialService(createdBurialServiceId);
      } catch (rollbackErr) {
        console.error('Rollback failed (delete burial service):', rollbackErr);
      }
    }
    if (createdMemberId && !isExistingMember) {
      try {
        await deleteMember(createdMemberId);
      } catch (rollbackErr) {
        console.error('Rollback failed (delete member):', rollbackErr);
      }
    }
    return {
      success: false,
      message: 'Unexpected error during registration',
      errors: error.message ? [error.message] : ['An unexpected error occurred during burial service registration']
    };
  }
}

/**
 * Register a member coming from the Water Baptism landing page form.
 * - Validates payload
 * - Ensures no duplicate account/email
 * - Creates member record
 * - Creates water baptism record
 * - Creates account record
 * - Sends account setup email
 *
 * @param {Object} payload Form payload from WaterBaptism.vue
 * @returns {Promise<Object>} status object
 */
async function registerMemberFromWaterBaptism(payload = {}) {
    // const emailResult = await sendAccountDetails({
    //     acc_id: '2001',
    //     email: 'solloranoharold123@gmail.com',
    //     name: `Harold Sollorano`.trim(),
    //     type: 'new_account',
    //     temporaryPassword: "TestPassword123!"
    //   });
    // console.log(emailResult);
    // return {
    //   success: true,
    //   message: 'Email sent successfully',
    //   data: emailResult
    // };
  // Step 1: Validate incoming data
  const validationErrors = validateRegistrationData(payload);
  if (validationErrors.length > 0) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    };
  }

  // Step 2: Ensure account email does not already exist
  const duplicateAccount = await checkDuplicateAccount(payload.email);
  if (duplicateAccount.isDuplicate) {
    return {
      success: false,
      message: 'An account with this email already exists',
      errors: ['An account with this email already exists']
    };
  }

  // Prepare member payload aligning with memberRecords schema
  const memberData = {
    firstname: payload.firstname?.trim(),
    lastname: payload.lastname?.trim(),
    middle_name: payload.middleName?.trim() || null,
    birthdate: payload.birthdate,
    age: payload.age,
    gender: payload.gender?.trim(),
    address: payload.address?.trim(),
    email: payload.email?.trim().toLowerCase(),
    phone_number: payload.phoneNumber?.trim(),
    civil_status: payload.civilStatus || null,
    position: 'member',
    guardian_name: payload.guardianName?.trim() || null,
    guardian_contact: payload.guardianContact?.trim() || null,
    guardian_relationship: payload.guardianRelationship || null
  };

  let createdMemberId = null;
  let createdBaptismId = null;
  let tempPassword = null;

  try {
    // Step 3: Create member record (includes duplicate checks internally)
    const memberResult = await createMember(memberData);
    if (!memberResult.success) {
      // Extract specific error messages (e.g., "Email address already exists", "Phone number already exists")
      const errorMessages = [];
      if (memberResult.error) {
        // Split comma-separated errors if present
        if (memberResult.error.includes(',')) {
          errorMessages.push(...memberResult.error.split(',').map(e => e.trim()));
        } else {
          errorMessages.push(memberResult.error);
        }
      }
      if (memberResult.errors && Array.isArray(memberResult.errors)) {
        errorMessages.push(...memberResult.errors);
      }
      if (memberResult.message && !errorMessages.includes(memberResult.message)) {
        errorMessages.push(memberResult.message);
      }
      return {
        success: false,
        message: memberResult.message || 'Failed to create member',
        errors: errorMessages.length > 0 ? errorMessages : ['Failed to create member record']
      };
    }
    createdMemberId = memberResult.data.member_id;

    // Step 4: Create water baptism record
    // baptism_date is set to null as it will be set later when the baptism is scheduled/completed
    const baptismResult = await createWaterBaptism({
      member_id: createdMemberId,
      baptism_date: null,
      status: 'pending'
    });

    if (!baptismResult.success) {
      // Roll back member if water baptism creation failed
      if (createdMemberId) {
        await deleteMember(createdMemberId);
      }
      const errorMessages = [];
      if (baptismResult.error) {
        errorMessages.push(baptismResult.error);
      }
      if (baptismResult.errors && Array.isArray(baptismResult.errors)) {
        errorMessages.push(...baptismResult.errors);
      }
      if (baptismResult.message && !errorMessages.includes(baptismResult.message)) {
        errorMessages.push(baptismResult.message);
      }
      return {
        success: false,
        message: baptismResult.message || 'Failed to create water baptism record',
        errors: errorMessages.length > 0 ? errorMessages : ['Failed to create water baptism record']
      };
    }
    createdBaptismId = baptismResult.data.baptism_id;

    // Step 4.5: Send water baptism creation email
    let waterBaptismEmailError = null;
    try {
      const recipientName = `${memberData.firstname || ''} ${memberData.middle_name ? memberData.middle_name + ' ' : ''}${memberData.lastname || ''}`.trim() || 'Valued Member';
      const emailResult = await sendWaterBaptismDetails({
        email: memberData.email,
        status: baptismResult.data.status || 'pending',
        memberName: recipientName,
        baptismDate: baptismResult.data.baptism_date
          ? moment(baptismResult.data.baptism_date).format('YYYY-MM-DD HH:mm:ss')
          : 'To be determined',
        location: 'To be determined',
        recipientName
      });
      
      // Check if email sending failed
      if (emailResult && !emailResult.success) {
        waterBaptismEmailError = emailResult.message || emailResult.error || 'Failed to send water baptism notification email';
      }
    } catch (emailErr) {
      waterBaptismEmailError = emailErr.message || 'Failed to send water baptism notification email';
      console.error('Error sending water baptism creation email:', emailErr);
    }

    // Step 5: Create account with temporary password
    tempPassword = 'TestPassword123!'
    let accountResult;
    try {
      accountResult = await createAccount({
      email: memberData.email,
      password: tempPassword,
      position: 'member',
      status: 'active'
    });
    } catch (accountError) {
      // Handle errors thrown by createAccount
      accountResult = {
        success: false,
        message: accountError.message || 'Failed to create account',
        error: accountError.message || 'Failed to create account'
      };
    }

    if (!accountResult.success) {
      // Roll back water baptism and member if account creation failed
      if (createdBaptismId) {
        try {
          await deleteWaterBaptism(createdBaptismId);
        } catch (rollbackErr) {
          console.error('Rollback failed (delete water baptism):', rollbackErr);
        }
      }
      if (createdMemberId) {
        await deleteMember(createdMemberId);
      }
      const errorMessages = [];
      if (accountResult.error) {
        errorMessages.push(accountResult.error);
      }
      if (accountResult.errors && Array.isArray(accountResult.errors)) {
        errorMessages.push(...accountResult.errors);
      }
      if (accountResult.message && !errorMessages.includes(accountResult.message)) {
        errorMessages.push(accountResult.message);
      }
      return {
        success: false,
        message: accountResult.message || 'Failed to create account',
        errors: errorMessages.length > 0 ? errorMessages : ['Failed to create account']
      };
    }

    // Step 6: Send account setup email
    let accountEmailError = null;
    try {
    const emailResult = await sendAccountDetails({
      acc_id: accountResult.data.acc_id,
      email: memberData.email,
      name: `${memberData.firstname} ${memberData.lastname}`.trim(),
      type: 'new_account',
      temporaryPassword: tempPassword
    });
      
      // Check if email sending failed
      if (emailResult && !emailResult.success) {
        accountEmailError = emailResult.message || emailResult.error || 'Failed to send account setup email';
      }
    } catch (emailErr) {
      accountEmailError = emailErr.message || 'Failed to send account setup email';
      console.error('Error sending account setup email:', emailErr);
    }

    // Collect all email errors
    const emailErrors = [];
    if (waterBaptismEmailError) {
      emailErrors.push(waterBaptismEmailError);
    }
    if (accountEmailError) {
      emailErrors.push(accountEmailError);
    }

    // If any email failed, return error but don't rollback the records
    if (emailErrors.length > 0) {
      return {
        success: false,
        message: 'Member, water baptism, and account created, but failed to send notification email(s)',
        errors: emailErrors,
        data: {
          member: memberResult.data,
          waterBaptism: baptismResult.data,
          account: accountResult.data
        }
      };
    }

    return {
      success: true,
      message: 'Member, water baptism, and account created successfully',
      data: {
        member: memberResult.data,
        waterBaptism: baptismResult.data,
        account: accountResult.data
      }
    };
  } catch (error) {
    console.error('Error registering member from water baptism form:', error);
    // Roll back water baptism and member if they were created
    if (createdBaptismId) {
      try {
        await deleteWaterBaptism(createdBaptismId);
      } catch (rollbackErr) {
        console.error('Rollback failed (delete water baptism):', rollbackErr);
      }
    }
    if (createdMemberId) {
      try {
        await deleteMember(createdMemberId);
      } catch (rollbackErr) {
        console.error('Rollback failed (delete member):', rollbackErr);
      }
    }
    return {
      success: false,
      message: 'Unexpected error during registration',
      errors: error.message ? [error.message] : ['An unexpected error occurred during water baptism registration']
    };
  }
}

module.exports = {
  registerMemberFromWaterBaptism,
  registerMemberFromBurialService
};
