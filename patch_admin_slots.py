
import re

filepath = r'c:\Users\John Carlo\OneDrive\Desktop\bbek-app\fe\src\views\AdminDashboard.vue'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace sidebar item to add Salvation Slots
sidebar_old = r'<v-list-item\s*prepend-icon="mdi-account-plus"\s*title="Salvation Requests"\s*:to="{ name: \'DiscipleshipAdmin\' }"\s*:active="\$route\.name === \'DiscipleshipAdmin\'"\s*@click="closeDrawerOnMobile"\s*></v-list-item>'
sidebar_new = r"""<v-list-item
            prepend-icon="mdi-account-plus"
            title="Salvation Requests"
            :to="{ name: 'DiscipleshipAdmin' }"
            :active="$route.name === 'DiscipleshipAdmin'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-calendar-clock"
            title="Salvation Slots"
            :to="{ name: 'SalvationAvailability' }"
            :active="$route.name === 'SalvationAvailability'"
            @click="closeDrawerOnMobile"
          ></v-list-item>"""

content = re.sub(sidebar_old, sidebar_new, content)

# Update metadata for search
metadata_old = r"BibleStudy: {"
metadata_new = r"""SalvationAvailability: {
    title: 'Salvation Slots',
    section: 'Services',
    icon: 'mdi-calendar-clock',
    keywords: ['salvation', 'slots', 'availability']
  },
  BibleStudy: {"""

if 'SalvationAvailability:' not in content:
    content = content.replace(metadata_old, metadata_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Sidebar and Metadata patched')
