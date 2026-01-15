
const { query, pool } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const { archiveRecord } = require('../archiveRecords');
const { parseCSVFile, processBatches, sanitizeRow, getCSVHeaders, autoMapMemberHeaders } = require('../../utils/csvParser');
/**
 * Member Records CRUD Operations
 * Based on tbl_members schema:
 * - member_id (INT, PK, NN)
 * - firstname (VARCHAR(45), NN)
 * - lastname (VARCHAR(45), NN)
 * - middle_name (VARCHAR(45), nullable)
 * - birthdate (DATE, NN)
 * - age (VARCHAR(45), NN)
 * - gender (VARCHAR(1), NN)
 * - address (VARCHAR(45), NN)
 * - email (VARCHAR(45), NN)
 * - phone_number (VARCHAR(45), NN)
 * - position (VARCHAR(45), NN, default: 'member')
 * - date_created (DATETIME, NN)
 */

/**
 * Normalize phone number by removing non-digit characters and standardizing prefixes
 * @param {String} phoneNumber - Raw phone number
 * @returns {String} Normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';

  // Remove all non-digit characters
  let normalized = phoneNumber.replace(/\D/g, '');

  // If it starts with 63 (country code without +), add +
  if (normalized.startsWith('63')) {
    normalized = '+' + normalized;
  }
  // If it starts with 9 (Philippine mobile), add +63
  else if (normalized.startsWith('9') && normalized.length === 10) {
    normalized = '+63' + normalized;
  }
  // If it doesn't have country code and is 10 digits starting with 9, add +63
  else if (normalized.length === 10 && normalized.startsWith('9')) {
    normalized = '+63' + normalized;
  }

  return normalized;
}

/**
 * Check if a member with the same data already exists
 * @param {Object} memberData - Member data to check
 * @param {String|Number} excludeMemberId - Optional member_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isDuplicate flag and details about what fields match
 */
async function checkDuplicateMember(memberData, excludeMemberId = null) {
  try {
    const { email, phone_number, firstname, lastname, birthdate } = memberData;
    const duplicateFields = [];
    const duplicateDetails = [];

    // Build WHERE conditions
    const conditions = [];
    const params = [];

    // Check for duplicate email (case-insensitive)
    if (email) {
      conditions.push('LOWER(TRIM(email)) = LOWER(TRIM(?))');
      params.push(email);
    }

    // Check for duplicate phone number (normalize by removing non-digits and standardizing prefixes)
    if (phone_number) {
      const normalizedPhone = normalizePhoneNumber(phone_number);
      // Check both normalized and original formats for backward compatibility
      conditions.push('(phone_number = ? OR REPLACE(phone_number, "+63", "") = REPLACE(?, "+63", ""))');
      params.push(normalizedPhone, normalizedPhone);
    }

    // Check for duplicate name + birthdate combination (case-insensitive, trimmed)
    if (firstname && lastname && birthdate) {
      conditions.push('(LOWER(TRIM(firstname)) = LOWER(TRIM(?)) AND LOWER(TRIM(lastname)) = LOWER(TRIM(?)) AND birthdate = ?)');
      params.push(firstname, lastname, moment(birthdate).format('YYYY-MM-DD'));
    }

    if (conditions.length === 0) {
      return {
        isDuplicate: false,
        duplicateFields: [],
        duplicateDetails: []
      };
    }

    // Build SQL query
    let sql = 'SELECT member_id, firstname, lastname, email, phone_number, birthdate FROM tbl_members WHERE (';
    sql += conditions.join(' OR ') + ')';

    // Exclude current member if updating
    if (excludeMemberId) {
      sql += ' AND member_id != ?';
      params.push(excludeMemberId);
    }

    const [rows] = await query(sql, params);

    if (rows.length === 0) {
      return {
        isDuplicate: false,
        duplicateFields: [],
        duplicateDetails: []
      };
    }

    // Analyze which fields match
    rows.forEach(member => {
      const matches = [];
      
      if (email && member.email && member.email.toLowerCase().trim() === email.toLowerCase().trim()) {
        matches.push('email');
        duplicateFields.push('email');
      }
      
      // Normalize phone numbers for comparison (using new normalization function)
      if (phone_number && member.phone_number) {
        const normalizedInput = normalizePhoneNumber(phone_number);
        const normalizedMember = normalizePhoneNumber(member.phone_number);
        if (normalizedInput === normalizedMember) {
          matches.push('phone_number');
          duplicateFields.push('phone_number');
        }
      }
      
      // Check name and birthdate combination (case-insensitive)
      if (firstname && lastname && birthdate) {
        const memberBirthdate = moment(member.birthdate).format('YYYY-MM-DD');
        const inputBirthdate = moment(birthdate).format('YYYY-MM-DD');
        
        if (member.firstname && member.lastname && 
            member.firstname.trim().toLowerCase() === firstname.trim().toLowerCase() && 
            member.lastname.trim().toLowerCase() === lastname.trim().toLowerCase() && 
            memberBirthdate === inputBirthdate) {
          matches.push('name and birthdate');
          duplicateFields.push('name_birthdate');
        }
      }

      if (matches.length > 0) {
        duplicateDetails.push({
          member_id: member.member_id,
          name: `${member.firstname} ${member.lastname}`,
          email: member.email,
          phone_number: member.phone_number,
          matchingFields: matches
        });
      }
    });

    // Remove duplicates from duplicateFields array
    const uniqueDuplicateFields = [...new Set(duplicateFields)];

    return {
      isDuplicate: rows.length > 0,
      duplicateFields: uniqueDuplicateFields,
      duplicateDetails: duplicateDetails
    };
  } catch (error) {
    console.error('Error checking for duplicate member:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new member record
 * @param {Object} memberData - Member data object
 * @returns {Promise<Object>} Result object with insertId
 */
async function createMember(memberData) {
  try {
    // Get next member_id if not provided
    const new_member_id = await getNextMemberId();
    console.log('New member ID:', new_member_id);
    const {
      member_id = new_member_id,
      firstname,
      lastname,
      middle_name = null,
      birthdate,
      age,
      gender,
      address,
      email,
      phone_number,
      position = 'member',
      profession = null,
      spouse_name = null,
      marriage_date = null,
      children = null,
      desire_ministry = null,
      date_created = new Date()
    } = memberData;

    // Validate and provide defaults for required fields (member_id is auto-generated)
    const finalFirstname = firstname || 'Unknown';
    const finalLastname = lastname || 'Unknown';
    const finalAge = age || '0';
    const finalGender = gender || 'M';
    const finalAddress = String(address || 'Not Provided').substring(0, 44);
    const finalEmail = email || 'unknown@example.com';
    const finalPhone = phone_number || '+639000000000';

    // Format birthdate - try multiple formats
    let formattedBirthdate = null;
    if (birthdate) {
      try {
        if (typeof birthdate === 'string' && birthdate.includes('-')) {
          formattedBirthdate = birthdate;
        } else {
          formattedBirthdate = moment(birthdate).format('YYYY-MM-DD');
        }
      } catch (e) {
        console.error('Error parsing birthdate:', birthdate, e);
        formattedBirthdate = null;
      }
    }

    // Check for duplicate member before creating
    const duplicateCheck = await checkDuplicateMember({
      ...memberData,
      firstname: finalFirstname,
      lastname: finalLastname,
      email: finalEmail,
      phone_number: finalPhone
    });
    if (duplicateCheck.isDuplicate) {
      const duplicateMessages = [];
      
      if (duplicateCheck.duplicateFields.includes('email')) {
        duplicateMessages.push('Email address already exists');
      }
      if (duplicateCheck.duplicateFields.includes('phone_number')) {
        duplicateMessages.push('Phone number already exists');
      }
      if (duplicateCheck.duplicateFields.includes('name_birthdate')) {
        duplicateMessages.push('A member with the same name and birthdate already exists');
      }

      return {
        success: false,
        message: `Duplicate member detected: ${duplicateMessages.join(', ')}`,
        error: duplicateMessages.join(', '),
        duplicateDetails: duplicateCheck.duplicateDetails
      };
    }

    // Ensure member_id is set
    const final_member_id = member_id || new_member_id;

    // Normalize phone number before insertion
    const normalizedPhoneNumber = normalizePhoneNumber(finalPhone);

    const sql = `
      INSERT INTO tbl_members
        (member_id, firstname, lastname, middle_name, birthdate, age, gender, address, email, phone_number, civil_status, position, guardian_name, guardian_contact, guardian_relationship, profession, spouse_name, marriage_date, children, desire_ministry, date_created)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      final_member_id,
      finalFirstname,
      finalLastname,
      middle_name,
      formattedBirthdate,
      finalAge,
      finalGender,
      finalAddress,
      finalEmail,
      normalizedPhoneNumber,
      memberData.civil_status || null,
      position,
      memberData.guardian_name || null,
      memberData.guardian_contact || null,
      memberData.guardian_relationship || null,
      profession,
      spouse_name,
      marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null,
      children ? JSON.stringify(children) : null,
      desire_ministry,
      date_created
    ];

    const [result] = await query(sql, params);
    
    return {
      success: true,
      message: 'Member created successfully',
      data: {
        member_id: final_member_id,
        firstname: finalFirstname,
        lastname: finalLastname,
        middle_name,
        birthdate: formattedBirthdate,
        age: finalAge,
        gender: finalGender,
        address: finalAddress,
        email: finalEmail,
        phone_number: normalizedPhoneNumber,
        position,
        profession,
        spouse_name,
        marriage_date: marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null,
        children,
        desire_ministry,
        date_created
      }
    };
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new member record with transaction connection
 * @param {Object} memberData - Member data object
 * @param {Object} connection - Database connection for transaction
 * @returns {Promise<Object>} Result object with insertId
 */
async function createMemberWithConnection(memberData, connection) {
  try {
    // Get next member_id if not provided
    const new_member_id = await getNextMemberId();
    const {
      member_id = new_member_id,
      firstname,
      lastname,
      middle_name = null,
      birthdate,
      age,
      gender,
      address,
      email,
      phone_number,
      position = 'member',
      profession = null,
      spouse_name = null,
      marriage_date = null,
      children = null,
      desire_ministry = null,
      date_created = new Date()
    } = memberData;

    // Validate required fields
    if (!firstname || !lastname || !birthdate || !age || !gender || !address || !email || !phone_number) {
      throw new Error('Missing required fields: firstname, lastname, birthdate, age, gender, address, email, phone_number');
    }

    // Check for duplicate member before creating
    const duplicateCheck = await checkDuplicateMember(memberData);
    if (duplicateCheck.isDuplicate) {
      const duplicateMessages = [];
      if (duplicateCheck.duplicateFields.includes('email')) {
        duplicateMessages.push('Email address already exists');
      }
      if (duplicateCheck.duplicateFields.includes('phone_number')) {
        duplicateMessages.push('Phone number already exists');
      }
      if (duplicateCheck.duplicateFields.includes('name_birthdate')) {
        duplicateMessages.push('A member with the same name and birthdate already exists');
      }
      return {
        success: false,
        message: `Duplicate member detected: ${duplicateMessages.join(', ')}`,
        error: duplicateMessages.join(', '),
        duplicateDetails: duplicateCheck.duplicateDetails
      };
    }

    // Ensure member_id is set
    const final_member_id = member_id || new_member_id;

    // Normalize phone number before insertion
    const normalizedPhoneNumber = normalizePhoneNumber(phone_number);

    const sql = `
      INSERT INTO tbl_members
        (member_id, firstname, lastname, middle_name, birthdate, age, gender, address, email, phone_number, civil_status, position, guardian_name, guardian_contact, guardian_relationship, profession, spouse_name, marriage_date, children, desire_ministry, date_created)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      final_member_id,
      firstname,
      lastname,
      middle_name,
      birthdate,
      age,
      gender,
      address,
      email,
      normalizedPhoneNumber,
      memberData.civil_status || null,
      position,
      memberData.guardian_name || null,
      memberData.guardian_contact || null,
      memberData.guardian_relationship || null,
      profession,
      spouse_name,
      marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null,
      children ? JSON.stringify(children) : null,
      desire_ministry,
      date_created
    ];

    const [result] = await connection.query(sql, params);

    return {
      success: true,
      message: 'Member created successfully',
      data: {
        member_id: final_member_id,
        firstname,
        lastname,
        middle_name,
        birthdate,
        age,
        gender,
        address,
        email,
        phone_number: normalizedPhoneNumber,
        position,
        profession,
        spouse_name,
        marriage_date: marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null,
        children,
        desire_ministry,
        date_created
      }
    };
  } catch (error) {
    console.error('Error creating member with connection:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing member record
 * @param {Number} memberId - Member ID
 * @param {Object} memberData - Updated member data
 * @returns {Promise<Object>} Result object
 */
async function updateMember(memberId, memberData) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    // Check if member exists
    const memberCheck = await getMemberById(memberId);
    if (!memberCheck.success) {
      return {
        success: false,
        message: 'Member not found',
        data: null
      };
    }

    const {
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
      position,
      guardian_name,
      guardian_contact,
      guardian_relationship,
      profession,
      spouse_name,
      marriage_date,
      children,
      desire_ministry
    } = memberData;

    // Check for duplicate member before updating (exclude current member)
    const duplicateCheck = await checkDuplicateMember(memberData, memberId);
    if (duplicateCheck.isDuplicate) {
      const duplicateMessages = [];
      
      if (duplicateCheck.duplicateFields.includes('email')) {
        duplicateMessages.push('Email address already exists');
      }
      if (duplicateCheck.duplicateFields.includes('phone_number')) {
        duplicateMessages.push('Phone number already exists');
      }
      if (duplicateCheck.duplicateFields.includes('name_birthdate')) {
        duplicateMessages.push('A member with the same name and birthdate already exists');
      }

      return {
        success: false,
        message: `Duplicate member detected: ${duplicateMessages.join(', ')}`,
        error: duplicateMessages.join(', '),
        duplicateDetails: duplicateCheck.duplicateDetails
      };
    }

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (firstname !== undefined) {
      fields.push('firstname = ?');
      params.push(firstname);
    }
    if (lastname !== undefined) {
      fields.push('lastname = ?');
      params.push(lastname);
    }
    if (middle_name !== undefined) {
      fields.push('middle_name = ?');
      params.push(middle_name);
    }
    if (birthdate !== undefined) {
      fields.push('birthdate = ?');
      params.push(moment(birthdate).format('YYYY-MM-DD'));
    }
    if (age !== undefined) {
      fields.push('age = ?');
      params.push(age);
    }
    if (gender !== undefined) {
      fields.push('gender = ?');
      params.push(gender);
    }
    if (address !== undefined) {
      fields.push('address = ?');
      params.push(address);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email);
    }
    if (phone_number !== undefined) {
      fields.push('phone_number = ?');
      params.push(normalizePhoneNumber(phone_number));
    }
    if (civil_status !== undefined) {
      fields.push('civil_status = ?');
      params.push(civil_status);
    }
    if (position !== undefined) {
      fields.push('position = ?');
      params.push(position);
    }
    if (guardian_name !== undefined) {
      fields.push('guardian_name = ?');
      params.push(guardian_name);
    }
    if (guardian_contact !== undefined) {
      fields.push('guardian_contact = ?');
      params.push(guardian_contact);
    }
    if (guardian_relationship !== undefined) {
      fields.push('guardian_relationship = ?');
      params.push(guardian_relationship);
    }
    if (profession !== undefined) {
      fields.push('profession = ?');
      params.push(profession);
    }
    if (spouse_name !== undefined) {
      fields.push('spouse_name = ?');
      params.push(spouse_name);
    }
    if (marriage_date !== undefined) {
      fields.push('marriage_date = ?');
      params.push(marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null);
    }
    if (children !== undefined) {
      fields.push('children = ?');
      params.push(children ? JSON.stringify(children) : null);
    }
    if (desire_ministry !== undefined) {
      fields.push('desire_ministry = ?');
      params.push(desire_ministry);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(memberId);

    const sql = `
      UPDATE tbl_members
      SET ${fields.join(', ')}
      WHERE member_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Member not found or no changes made',
        data: null
      };
    }

    // Fetch updated member
    const updatedMember = await getMemberById(memberId);

    return {
      success: true,
      message: 'Member updated successfully',
      data: updatedMember.data
    };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
}
/**
 * DELETE - Delete a member record (archives it first)
 * @param {Number} memberId - Member ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteMember(memberId, archivedBy = null) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    // Check if member exists
    const memberCheck = await getMemberById(memberId);
    if (!memberCheck.success) {
      return {
        success: false,
        message: 'Member not found',
        data: null
      };
    }

    // Archive the record before deleting
    try {
      await archiveRecord(
        'tbl_members',
        String(memberId),
        memberCheck.data,
        archivedBy
      );
    } catch (archiveError) {
      console.error('Error archiving member before deletion:', archiveError);
      // Continue with deletion even if archiving fails (non-blocking)
    }

    // Delete from original table
    const sql = 'DELETE FROM tbl_members WHERE member_id = ?';
    const [result] = await query(sql, [memberId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Member not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Member archived and deleted successfully',
      data: { member_id: memberId }
    };
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
}
/**
 * READ ALL - Get all member records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, ageRange, joinMonth, sortBy)
 * @returns {Promise<Object>} Object with paginated member records and metadata
 */
async function getAllMembers(options = {}) {
    try {
      // Extract and normalize parameters from options
      // Handle both query params (strings) and body payload (may be strings or numbers)
      const search = options.search || options.q || null;
      const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
      const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
      const page = options.page !== undefined ? parseInt(options.page) : undefined;
      const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
      const ageRange = options.ageRange || null;
      const joinMonth = options.joinMonth || null;
      const gender = options.gender || null;
      const sortBy = options.sortBy || null;
      
      // Build base query for counting total records
      let countSql = 'SELECT COUNT(*) as total FROM tbl_members';
      let countParams = [];
      
      // Build query for fetching records
      let sql = 'SELECT * FROM tbl_members';
      const params = [];
  
      // Build WHERE conditions array
      const whereConditions = [];
      let hasWhere = false;
  
      // Add search functionality
      // Handle both 'search' and 'q' parameter names, and filter out empty strings
      const searchValue = search && search.trim() !== '' ? search.trim() : null;
      if (searchValue) {
        const searchCondition = `(firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR phone_number LIKE ?)`;
        const searchPattern = `%${searchValue}%`;
        
        whereConditions.push(searchCondition);
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        hasWhere = true;
      }
  
      // Add age range filter
      // Handle ageRange parameter (e.g., "0-18", "19-30", "31-50", "51+", "All Ages")
      if (ageRange && ageRange !== 'All Ages' && ageRange.trim() !== '') {
        const ageRangeValue = ageRange.trim();
        if (ageRangeValue === '51+') {
          // Cast age to number for comparison (age is stored as VARCHAR)
          whereConditions.push('CAST(age AS UNSIGNED) >= ?');
          countParams.push(51);
          params.push(51);
        } else if (ageRangeValue.includes('-')) {
          const [min, max] = ageRangeValue.split('-').map(Number);
          if (!isNaN(min) && !isNaN(max)) {
            // Cast age to number for comparison (age is stored as VARCHAR)
            whereConditions.push('CAST(age AS UNSIGNED) >= ? AND CAST(age AS UNSIGNED) <= ?');
            countParams.push(min, max);
            params.push(min, max);
          }
        }
        hasWhere = true;
      }
  
      // Add join month filter
      // Handle joinMonth parameter (e.g., "January", "February", etc., or "All Months", "This Month", "Last Month")
      if (joinMonth && joinMonth !== 'All Months' && joinMonth.trim() !== '') {
        const monthName = joinMonth.trim();
        
        if (monthName === 'This Month') {
          whereConditions.push('MONTH(date_created) = MONTH(CURDATE()) AND YEAR(date_created) = YEAR(CURDATE())');
          hasWhere = true;
        } else if (monthName === 'Last Month') {
          whereConditions.push('MONTH(date_created) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(date_created) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
          hasWhere = true;
        } else {
          // Get month number (1-12) from month name
          const monthMap = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
          };
          const monthNum = monthMap[monthName];
          
          if (monthNum) {
            whereConditions.push('MONTH(date_created) = ? AND YEAR(date_created) = YEAR(CURDATE())');
            countParams.push(monthNum);
            params.push(monthNum);
            hasWhere = true;
          }
        }
      }
  
      // Add gender filter
      // Handle gender parameter (e.g., "Male", "Female")
      if (gender && gender !== 'All Genders' && gender.trim() !== '') {
        const genderValue = gender.trim();
        // Map display name to database value
        const genderMap = {
          'Male': 'M',
          'Female': 'F'
        };
        const dbGender = genderMap[genderValue] || genderValue;
        
        whereConditions.push('gender = ?');
        countParams.push(dbGender);
        params.push(dbGender);
        hasWhere = true;
      }
  
      // Apply WHERE clause if any conditions exist
      if (hasWhere) {
        const whereClause = ' WHERE ' + whereConditions.join(' AND ');
        countSql += whereClause;
        sql += whereClause;
      }
  
      // Add sorting
      // Handle sortBy parameter (e.g., "Name (A-Z)", "Name (Z-A)", "Join Date (Newest)", etc.)
      let orderByClause = ' ORDER BY ';
      const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
      switch (sortByValue) {
        case 'Name (A-Z)':
          orderByClause += 'firstname ASC, lastname ASC';
          break;
        case 'Name (Z-A)':
          orderByClause += 'firstname DESC, lastname DESC';
          break;
        case 'Join Date (Newest)':
          orderByClause += 'date_created DESC';
          break;
        case 'Join Date (Oldest)':
          orderByClause += 'date_created ASC';
          break;
        case 'Age (Low to High)':
          // Cast age to number for proper numeric sorting (age is stored as VARCHAR)
          orderByClause += 'CAST(age AS UNSIGNED) ASC';
          break;
        case 'Age (High to Low)':
          // Cast age to number for proper numeric sorting (age is stored as VARCHAR)
          orderByClause += 'CAST(age AS UNSIGNED) DESC';
          break;
        case 'Gender (Male First)':
          orderByClause += 'gender ASC';
          break;
        case 'Gender (Female First)':
          orderByClause += 'gender DESC';
          break;
        default:
          orderByClause += 'date_created DESC'; // Default sorting
      }
      sql += orderByClause;
  
      // Determine pagination values
      // Priority: use page/pageSize if provided, otherwise use limit/offset
      let finalLimit, finalOffset;
      
      if (page !== undefined && pageSize !== undefined) {
        // Use page-based pagination
        const pageNum = parseInt(page) || 1;
        const size = parseInt(pageSize) || 10;
        finalLimit = size;
        finalOffset = (pageNum - 1) * size;
      } else if (limit !== undefined) {
        // Use limit/offset pagination
        finalLimit = parseInt(limit) || 10;
        finalOffset = offset !== undefined ? parseInt(offset) : 0;
      } else {
        // No pagination - return all records
        finalLimit = null;
        finalOffset = null;
      }
  
      // Get total count (before pagination)
      const [countResult] = await query(countSql, countParams);
      const totalCount = countResult[0]?.total || 0;
  
      // Add pagination to main query
      // Note: MySQL doesn't support parameterized LIMIT/OFFSET, so we interpolate directly
      // This is safe because finalLimit and finalOffset are already parsed and validated as integers
      if (finalLimit !== null) {
        const limitValue = Math.max(1, parseInt(finalLimit) || 10); // Ensure at least 1, default to 10
        const offsetValue = Math.max(0, parseInt(finalOffset) || 0); // Ensure non-negative
        
        if (offsetValue > 0) {
          sql += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
        } else {
          sql += ` LIMIT ${limitValue}`;
        }
      }
  
      // Execute query to get paginated results
      const [rows] = await query(sql, params);
      
      // Calculate pagination metadata
      const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
      const currentPageSize = finalLimit || rows.length;
      const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;
      
      return {
        success: true,
        message: 'Members retrieved successfully',
        data: rows,
        count: rows.length, // Number of records in current page
        totalCount: totalCount, // Total number of records matching the query
        pagination: {
          page: currentPage,
          pageSize: currentPageSize,
          totalPages: totalPages,
          totalCount: totalCount,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1
        }
      };
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }
// Create function to get the next member_id (incremental integer)
async function getNextMemberId() {
  try {
    const sql = 'SELECT MAX(member_id) AS max_member_id FROM tbl_members';
    const [rows] = await query(sql);
    
    // If no records exist, start with 1, otherwise increment by 1
    const maxId = rows[0]?.max_member_id || 0;
    // it should return a string like 0000000001
    const new_member_id = parseInt(maxId) + 1;
    return new_member_id.toString().padStart(9, '0');
  } catch (error) {
    console.error('Error getting next member ID:', error);
    throw error;
  }
}
async function getMemberById(memberId) {
    try {
      if (!memberId) {
        throw new Error('Member ID is required');
      }
  
      const sql = 'SELECT * FROM tbl_members WHERE member_id = ?';
      const [rows] = await query(sql, [memberId]);
  
      if (rows.length === 0) {
        return {
          success: false,
          message: 'Member not found',
          data: null
        };
      }
  
      return {
        success: true,
        message: 'Member retrieved successfully',
        data: rows[0]
      };
    } catch (error) {
      console.error('Error fetching member:', error);
      throw error;
    }
  }
  
/**
 * EXPORT - Export member records to CSV
 * @param {Object} options - Optional query parameters (same as getAllMembers: search, ageRange, joinMonth, sortBy)
 * @returns {Promise<String>} CSV content as string
 */
async function exportMembersToCSV(options = {}) {
  try {
    // Get all members matching the filters (without pagination for export)
    const exportOptions = { ...options };
    // Remove pagination to get all records
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllMembers(exportOptions);

    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No members found to export');
    }

    const members = result.data;

    // CSV headers - Use lowercase field names to match import expectations
    const headers = [
      'member_id',
      'firstname',
      'lastname',
      'middle_name',
      'birthdate',
      'age',
      'gender',
      'address',
      'email',
      'phone_number',
      'civil_status',
      'position',
      'profession',
      'spouse_name',
      'marriage_date',
      'children',
      'desire_ministry',
      'date_created'
    ];

    // Create CSV content
    let csvContent = headers.join(',') + '\n';

    members.forEach(member => {
      const row = [
        member.member_id || '',
        `"${(member.firstname || '').replace(/"/g, '""')}"`, // Escape quotes
        `"${(member.lastname || '').replace(/"/g, '""')}"`,
        `"${(member.middle_name || '').replace(/"/g, '""')}"`,
        member.birthdate ? moment(member.birthdate).format('YYYY-MM-DD') : '',
        member.age || '',
        member.gender || '',
        `"${(member.address || '').replace(/"/g, '""')}"`,
        member.email || '',
        member.phone_number || '',
        member.civil_status || '',
        member.position || '',
        member.profession || '',
        `"${(member.spouse_name || '').replace(/"/g, '""')}"`,
        member.marriage_date ? moment(member.marriage_date).format('YYYY-MM-DD') : '',
        member.children ? `"${JSON.stringify(member.children).replace(/"/g, '""')}"` : '',
        member.desire_ministry || '',
        member.date_created ? moment(member.date_created).format('YYYY-MM-DD HH:mm:ss') : ''
      ];

      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  } catch (error) {
    console.error('Error exporting members to CSV:', error);
    throw error;
  }
}

/**
 * EXPORT - Export member records to Excel
 * @param {Object} options - Optional query parameters (same as getAllMembers: search, ageRange, joinMonth, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportMembersToExcel(options = {}) {
  try {
    // Get all members matching the filters (without pagination for export)
    const exportOptions = { ...options };
    // Remove pagination to get all records
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    console.log('Export options:', exportOptions);

    const result = await getAllMembers(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No members found to export');
    }

    const members = result.data;
    console.log(`Exporting ${members.length} members to Excel`);

    // Prepare data for Excel export
    const excelData = members.map((member, index) => {
      return {
        'No.': index + 1,
        'Member ID': member.member_id || '',
        'First Name': member.firstname || '',
        'Last Name': member.lastname || '',
        'Middle Name': member.middle_name || '',
        'Full Name': `${member.firstname || ''} ${member.middle_name || ''} ${member.lastname || ''}`.trim(),
        'Birthdate': member.birthdate ? moment(member.birthdate).format('YYYY-MM-DD') : '',
        'Age': member.age || '',
        'Gender': member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender === 'O' ? 'Other' : member.gender || '',
        'Address': member.address || '',
        'Email': member.email || '',
        'Phone Number': member.phone_number || '',
        'Civil Status': member.civil_status || '',
        'Position': member.position || '',
        'Profession': member.profession || '',
        'Spouse Name': member.spouse_name || '',
        'Marriage Date': member.marriage_date ? moment(member.marriage_date).format('YYYY-MM-DD') : '',
        'Children': member.children ? JSON.stringify(member.children) : '',
        'Desire Ministry': member.desire_ministry || '',
        'Date Created': member.date_created ? moment(member.date_created).format('YYYY-MM-DD HH:mm:ss') : '',
        'Join Date': member.date_created ? moment(member.date_created).format('YYYY-MM-DD') : ''
      };
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 12 },  // Member ID
      { wch: 15 },  // First Name
      { wch: 15 },  // Last Name
      { wch: 15 },  // Middle Name
      { wch: 30 },  // Full Name
      { wch: 12 },  // Birthdate
      { wch: 5 },   // Age
      { wch: 10 },  // Gender
      { wch: 40 },  // Address
      { wch: 25 },  // Email
      { wch: 15 },  // Phone Number
      { wch: 15 },  // Civil Status
      { wch: 20 },  // Position
      { wch: 20 },  // Profession
      { wch: 20 },  // Spouse Name
      { wch: 12 },  // Marriage Date
      { wch: 30 },  // Children
      { wch: 20 },  // Desire Ministry
      { wch: 20 },  // Date Created
      { wch: 12 }   // Join Date
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    if (!excelBuffer || excelBuffer.length === 0) {
      throw new Error('Failed to generate Excel file buffer');
    }

    console.log(`Excel buffer generated: ${excelBuffer.length} bytes`);
    return excelBuffer;
  } catch (error) {
    console.error('Error exporting members to Excel:', error);
    throw error;
  }
}

// Create a function to get  Members without pastors on Select Elements
async function getAllMembersWithoutPastorsForSelect() {
  try {
    // Build query to get all members with fullname (excluding pastors)
    const sql = `SELECT 
      member_id,
      firstname,
      lastname,
      middle_name,
      gender,
      CONCAT(
        firstname,
        IF(middle_name IS NOT NULL AND middle_name != '', CONCAT(' ', middle_name), ''),
        ' ',
        lastname
      ) as fullname
    FROM tbl_members
    WHERE LOWER(position) NOT LIKE ?
    ORDER BY firstname ASC, lastname ASC`;

    const [rows] = await query(sql, ['%pastor%']);

    // Format data for select elements: [{ id, name }]
    const memberOptions = rows.map(member => ({
      id: member.member_id,
      name: member.fullname || `${member.firstname} ${member.lastname}`.trim(),
      gender: member.gender
    }));

    return {
      success: true,
      message: 'Members retrieved successfully for select',
      data: memberOptions
    };
  } catch (error) {
    console.error('Error fetching members for select:', error);
    throw error;
  }
}
/**
 * GET ALL FOR SELECT - Get all members for select/dropdown elements
 * Returns simplified member data (member_id and fullname) without pagination
 * Excludes members with position containing 'pastor' (e.g., 'Senior Pastor', 'Junior Pastor')
 * @returns {Promise<Object>} Object with member options array
 */
async function getAllMembersForSelect() {
  try {
    // Build query to get all members with fullname and position
    const sql = `SELECT 
      member_id,
      firstname,
      lastname,
      middle_name,
      email,
      position,
      CONCAT(
        firstname,
        IF(middle_name IS NOT NULL AND middle_name != '', CONCAT(' ', middle_name), ''),
        ' ',
        lastname
      ) as fullname
    FROM tbl_members
    where position != 'none'
    ORDER BY firstname ASC, lastname ASC`;

    const [rows] = await query(sql);

    // Format data for select elements: [{ id, name, position }]
    const memberOptions = rows.map(member => ({
      id: member.member_id,
      name: member.fullname || `${member.firstname} ${member.lastname}`.trim(),
      email: member.email,
      position: member.position
    }));

    return {
      success: true,
      message: 'Members retrieved successfully for select',
      data: memberOptions
    };
  } catch (error) {
    console.error('Error fetching members for select:', error);
    throw error;
  }
}

/**
 * GET ALL PASTORS FOR SELECT - Get all members with position containing 'pastor' for select/dropdown elements
 * Returns simplified member data (member_id and fullname) without pagination
 * Includes positions like 'Senior Pastor', 'Junior Pastor', etc.
 * @returns {Promise<Object>} Object with pastor options array
 */
async function getAllPastorsForSelect() {
  try {
    // Build query to get all pastors with fullname (including Senior Pastor, Junior Pastor, etc.)
    const sql = `SELECT 
      member_id,
      firstname,
      lastname,
      middle_name,
      CONCAT(
        firstname,
        IF(middle_name IS NOT NULL AND middle_name != '', CONCAT(' ', middle_name), ''),
        ' ',
        lastname
      ) as fullname
    FROM tbl_members
    WHERE LOWER(position) LIKE ?
    ORDER BY firstname ASC, lastname ASC`;

    const [rows] = await query(sql, ['%pastor%']);

    // Format data for select elements: [{ id, name }]
    const pastorOptions = rows.map(pastor => ({
      id: pastor.member_id,
      name: pastor.fullname || `${pastor.firstname} ${pastor.lastname}`.trim()
    }));

    return {
      success: true,
      message: 'Pastors retrieved successfully for select',
      data: pastorOptions
    };
  } catch (error) {
    console.error('Error fetching pastors for select:', error);
    throw error;
  }
}

/**
 * 
 * Get specific member by email and status is active
 * @param {String} email - Email to check
 * @returns {Promise<Object>} Object with member data
 */
async function getSpecificMemberByEmailAndStatus(email) {
  try {
    // tbl_members schema does not have a status column; check by email only
    const sql = 'SELECT * FROM tbl_members WHERE email = ?';
    const [rows] = await query(sql, [email]);
    if(rows.length === 0) {
      return null;
    }else{
      return rows[0];
    }
  }
  catch (error) {
    console.error('Error getting specific member by email and status:', error);
    throw error;
  }
}
/**
 * GET ALL DEPARTMENT MEMBERS FOR SELECT - Get all members with position = 'department' for select/dropdown elements
 * Returns simplified member data (member_id and fullname) without pagination
 * Filters by member position = 'department' from tbl_members
 * @returns {Promise<Object>} Object with department member options array
 */
async function getAllDepartmentMembersForSelect() {
  try {
    // Build query to get all members with position = 'department'
    const sql = `SELECT 
      member_id,
      firstname,
      lastname,
      middle_name,
      email,
      CONCAT(
        firstname,
        IF(middle_name IS NOT NULL AND middle_name != '', CONCAT(' ', middle_name), ''),
        ' ',
        lastname
      ) as fullname
    FROM tbl_members
    WHERE LOWER(position) != 'member' AND LOWER(position) != 'none'
    ORDER BY firstname ASC, lastname ASC`;

    const [rows] = await query(sql);

    // Format data for select elements: [{ id, name }]
    const memberOptions = rows.map(member => ({
      id: member.member_id,
      name: member.fullname || `${member.firstname} ${member.lastname}`.trim(),
      email: member.email
    }));

    return {
      success: true,
      message: 'Department members retrieved successfully for select',
      data: memberOptions
    };
  } catch (error) {
    console.error('Error fetching department members for select:', error);
    throw error;
  }
}




/**
 * GET MEMBERS WITHOUT BAPTISM - Get members who don't have baptism records
 * Returns members who don't have records in water_baptism table
 * @returns {Promise<Object>} Object with member options array
 */
async function getMembersWithoutBaptism() {
  try {
    // Query to get members who don't have baptism records
    const sql = `SELECT
      m.member_id,
      m.firstname,
      m.lastname,
      m.middle_name,
      m.email,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as name
    FROM tbl_members m
    LEFT JOIN tbl_waterbaptism wb ON m.member_id = wb.member_id
    WHERE wb.member_id IS NULL
    ORDER BY m.firstname ASC, m.lastname ASC`;

    const [rows] = await query(sql);

    // Format data for select elements: [{ id, name }]
    const memberOptions = rows.map(member => ({
      id: member.member_id,
      name: member.name || `${member.firstname} ${member.lastname}`.trim()
    }));

    return {
      success: true,
      message: 'Members without baptism retrieved successfully',
      data: memberOptions
    };
  } catch (error) {
    console.error('Error fetching members without baptism:', error);
    throw error;
  }
}

/**
 * IMPORT - Import member records from CSV/Excel file
 * @param {Array} memberDataArray - Array of member data objects
 * @param {Object} userInfo - User information for logging
 * @returns {Promise<Object>} Result object with import statistics
 */
async function importMembers(memberDataArray, userInfo) {
  try {
    let imported = 0
    let updated = 0
    let errors = 0
    const errorDetails = []

    // Process each member record
    for (const memberData of memberDataArray) {
      try {
        // Validate required fields
        const requiredFields = ['firstname', 'lastname', 'birthdate', 'gender', 'email', 'position']
        const missingFields = requiredFields.filter(field => !memberData[field] || memberData[field].toString().trim() === '')

        // Additional validation for birthdate format
        if (memberData.birthdate && !moment(memberData.birthdate).isValid()) {
          missingFields.push('birthdate (invalid format)')
        }

        if (missingFields.length > 0) {
          errors++
          errorDetails.push(`Row ${memberData._rowIndex || 'unknown'}: Missing or invalid required fields: ${missingFields.join(', ')}`)
          continue
        }

        // Check if member exists
        const existingMember = await checkExistingMember(memberData)

        if (existingMember.exists) {
          // Update existing member
          const updateResult = await updateMember(existingMember.member_id, memberData)
          if (updateResult.success) {
            updated++
          } else {
            errors++
            errorDetails.push(`Row ${memberData._rowIndex || 'unknown'}: Failed to update member: ${updateResult.message}`)
          }
        } else {
          // Create new member
          const createResult = await createMember(memberData)
          if (createResult.success) {
            imported++
          } else {
            errors++
            errorDetails.push(`Row ${memberData._rowIndex || 'unknown'}: Failed to create member: ${createResult.message}`)
          }
        }
      } catch (rowError) {
        errors++
        errorDetails.push(`Row ${memberData._rowIndex || 'unknown'}: ${rowError.message}`)
      }
    }

    // Log the import action
    try {
      const auditTrailRecords = require('../auditTrailRecords')
      await auditTrailRecords.createAuditLog({
        user_id: userInfo?.acc_id || 'system',
        user_email: userInfo?.email || 'system@church.com',
        user_name: userInfo?.name || 'System Admin',
        user_position: userInfo?.position || 'admin',
        action_type: 'IMPORT',
        module: 'Member Records',
        description: `Admin imported ${imported} new member records, updated ${updated} records`,
        entity_type: 'member',
        status: 'success'
      })
    } catch (logError) {
      console.error('Failed to log import action:', logError)
      // Don't fail the import if logging fails
    }

    return {
      success: true,
      message: `Import completed: ${imported} new records added, ${updated} records updated`,
      data: {
        imported,
        updated,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : null
      }
    }
  } catch (error) {
    console.error('Error importing members:', error)
    throw error
  }
}

/**
 * Check if a member exists based on email or name+birthdate combination
 * @param {Object} memberData - Member data to check
 * @returns {Promise<Object>} Object with exists flag and member_id if found
 */
async function checkExistingMember(memberData) {
  try {
    const { email, firstname, lastname, birthdate } = memberData

    // First check by email
    if (email) {
      const sql = 'SELECT member_id FROM tbl_members WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))'
      const [rows] = await query(sql, [email])
      if (rows.length > 0) {
        return { exists: true, member_id: rows[0].member_id }
      }
    }

    // Then check by name + birthdate combination
    if (firstname && lastname && birthdate) {
      try {
        const formattedBirthdate = moment(birthdate).format('YYYY-MM-DD')
        if (formattedBirthdate !== 'Invalid date') {
          const sql = 'SELECT member_id FROM tbl_members WHERE LOWER(TRIM(firstname)) = LOWER(TRIM(?)) AND LOWER(TRIM(lastname)) = LOWER(TRIM(?)) AND birthdate = ?'
          const [rows] = await query(sql, [firstname, lastname, formattedBirthdate])
          if (rows.length > 0) {
            return { exists: true, member_id: rows[0].member_id }
          }
        }
      } catch (dateError) {
        // Skip birthdate check if date is invalid
        console.warn('Invalid birthdate in checkExistingMember:', birthdate)
      }
    }

    return { exists: false }
  } catch (error) {
    console.error('Error checking existing member:', error)
    throw error
  }
}

module.exports = {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getNextMemberId,
  exportMembersToExcel,
  exportMembersToCSV,
  importMembers,
  getAllMembersForSelect,
  getAllDepartmentMembersForSelect,
  getAllPastorsForSelect,
  getAllMembersWithoutPastorsForSelect,
  getMembersWithoutBaptism,
  getSpecificMemberByEmailAndStatus
};


