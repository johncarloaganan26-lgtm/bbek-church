
import re

filepath = r'c:\Users\John Carlo\OneDrive\Desktop\bbek-app\be\dbHelpers\services\discipleshipRecords.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = r"""        const sql = `
      INSERT INTO tbl_discipleship_requests \(
        request_id, firstname, lastname, middle_name, email, phone_number,
        birthdate, age, gender, address, civil_status, profession,
        spouse_name, marriage_date, children, request_type, notes, pastor_id, location
      \) VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)
    `;

        const formattedBirth = birthdate \? moment\(birthdate\)\.format\('YYYY-MM-DD'\) : null;
        const formattedMarriage = marriage_date \? moment\(marriage_date\)\.format\('YYYY-MM-DD'\) : null;
        const childrenStr = \(children && typeof children === 'object'\) \? JSON\.stringify\(children\) : \(children || null\);
        const notesStr = \(notes && typeof notes === 'object'\) \? JSON\.stringify\(notes\) : \(notes || null\);

        const params = \[
            request_id, firstname, lastname, middle_name \|\| null, email, phone_number \|\| null,
            formattedBirth, age \|\| null, gender \|\| null, address \|\| null, civil_status \|\| null, profession \|\| null,
            spouse_name \|\| null, formattedMarriage, childrenStr, request_type, notesStr, pastor_id, location
        \];

        await query\(sql, params\);

        // Send Email Notification
        try {
            await sendDiscipleshipDetails\({
                email,
                firstname,
                status: 'Pending',
                request_type
            }\);
        } catch \(emailError\) {
            console\.error\('Email notification failed for discipleship request:', emailError\);
        }"""

new_block = r"""        let scheduled_date = null;
        let scheduled_time = null;
        let initialStatus = 'Pending';

        if (availability_id) {
            const [slots] = await query('SELECT available_date, available_time FROM tbl_salvation_availability WHERE availability_id = ?', [availability_id]);
            if (slots.length > 0) {
                scheduled_date = moment(slots[0].available_date).format('YYYY-MM-DD');
                scheduled_time = slots[0].available_time;
                initialStatus = 'Scheduled';
            }
        }

        const sql = `
          INSERT INTO tbl_discipleship_requests (
            request_id, firstname, lastname, middle_name, email, phone_number,
            birthdate, age, gender, address, civil_status, profession,
            spouse_name, marriage_date, children, request_type, notes, pastor_id, location,
            availability_id, scheduled_date, scheduled_time, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const formattedBirth = birthdate ? moment(birthdate).format('YYYY-MM-DD') : null;
        const formattedMarriage = marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null;
        const childrenStr = (children && typeof children === 'object') ? JSON.stringify(children) : (children || null);
        const notesStr = (notes && typeof notes === 'object') ? JSON.stringify(notes) : (notes || null);

        const params = [
            request_id, firstname, lastname, middle_name || null, email, phone_number || null,
            formattedBirth, age || null, gender || null, address || null, civil_status || null, profession || null,
            spouse_name || null, formattedMarriage, childrenStr, request_type, notesStr, pastor_id, location,
            availability_id || null, scheduled_date, scheduled_time, initialStatus
        ];

        await query(sql, params);

        // Send Email Notification
        try {
            await sendDiscipleshipDetails({
                email,
                firstname,
                status: initialStatus,
                request_type,
                scheduled_date,
                scheduled_time
            });
        } catch (emailError) {
            console.error('Email notification failed for discipleship request:', emailError);
        }"""

# Use non-regex replacement if possible or escapable regex
if re.search(old_block, content):
    content = re.sub(old_block, new_block, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Block not found")
