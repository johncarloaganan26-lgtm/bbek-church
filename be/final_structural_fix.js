const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'dbHelpers', 'services', 'waterBaptismRecords.js');
const content = fs.readFileSync(filePath, 'utf8');

// The problematic area is very specific
const brokenSpot = `        }
      }
    if (!email) {`;

const fixedSpot = `        }
      }
    } else {
      // Record already has a member_id - verify it exists
      const memberCheck = await getMemberById(memberId);
      if (!memberCheck.success || !memberCheck.data) {
        console.warn(\`Member \${memberId} assigned to baptism but record not found. Re-linking...\`);
        memberId = null; // Forces Part 1 to re-run in a real retry, but for now we just link correctly if search works
        // Try finding by email/phone again
        if (email && baptism.firstname && baptism.lastname) {
          const [rows] = await query('SELECT member_id FROM tbl_members WHERE email = ? AND firstname = ? AND lastname = ?', [email, baptism.firstname, baptism.lastname]);
          if (rows.length > 0) {
            memberId = rows[0].member_id;
            await query('UPDATE tbl_waterbaptism SET member_id = ?, is_member = 1 WHERE baptism_id = ?', [memberId, baptismId]);
          }
        }
      }
    }

    if (!email) {`;

if (content.includes(brokenSpot)) {
  fs.writeFileSync(filePath, content.replace(brokenSpot, fixedSpot));
  console.log('✅ BACKEND FIXED SUCCESSFULLY!');
} else {
  // If the previous string doesn't match exactly, try a more minimal one
  const minimalBroken = `        }
      }
    if (!email) {`;
  if (content.includes(minimalBroken)) {
      fs.writeFileSync(filePath, content.replace(minimalBroken, fixedSpot));
      console.log('✅ BACKEND FIXED (minimal match)!');
  } else {
      console.log('❌ Could not find the broken spot.');
  }
}
