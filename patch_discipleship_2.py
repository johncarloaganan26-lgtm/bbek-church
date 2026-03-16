
import sys
import re

filepath = r'c:\Users\John Carlo\OneDrive\Desktop\bbek-app\fe\src\components\LandingPage\BeOneOfUs\Discipleship.vue'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add availability fields to reactive formData
form_data_old = r'request_type: \'Salvation\''
form_data_new = r"request_type: 'Salvation',\n  availability_id: null"
if form_data_old in content and 'availability_id' not in content:
    content = content.replace(form_data_old, form_data_new)

# Add onMounted and formatAvailability helper
helper_addition = r"""
onMounted(async () => {
  const result = await discipleshipStore.fetchSalvationAvailability();
  if (result.success) {
    availabilities.value = result.data;
  }
});

const formatAvailability = (item) => {
  const date = moment(item.available_date).format('MMMM D, YYYY');
  const time = moment(item.available_time, 'HH:mm:ss').format('h:mm A');
  return `${date} at ${time}`;
};
"""
if 'onMounted(async () =>' not in content:
    content = content.replace('const isBibleStudy = computed(() => {', helper_addition + '\nconst isBibleStudy = computed(() => {')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Second patch applied')
