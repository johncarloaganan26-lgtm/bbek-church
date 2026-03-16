
import re

filepath = r'c:\Users\John Carlo\OneDrive\Desktop\bbek-app\be\dbHelpers\services\discipleshipRecords.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Combining scheduled_date and scheduled_time for better email display
old_email_call = r"""            await sendDiscipleshipDetails\({
                email,
                firstname,
                status: initialStatus,
                request_type,
                scheduled_date,
                scheduled_time
            }\);"""

new_email_call = r"""            const emailSchedule = (scheduled_date && scheduled_time) 
                ? moment(`${scheduled_date} ${scheduled_time}`).format('YYYY-MM-DD HH:mm:ss')
                : scheduled_date;

            await sendDiscipleshipDetails({
                email,
                firstname,
                status: initialStatus,
                request_type,
                scheduled_date: emailSchedule
            });"""

if re.search(old_email_call, content):
    content = re.sub(old_email_call, new_email_call, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Email call patched successfully")
else:
    print("Email call block not found")
