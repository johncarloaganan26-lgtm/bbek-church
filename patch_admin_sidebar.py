
import re

filepath = r'c:\Users\John Carlo\OneDrive\Desktop\bbek-app\fe\src\views\AdminDashboard.vue'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace sidebar item
sidebar_old = r'<v-list-item\s*prepend-icon="mdi-account-plus"\s*title="Discipleship Requests"\s*:to="{ name: \'DiscipleshipAdmin\' }"\s*:active="\$route\.name === \'DiscipleshipAdmin\'"\s*@click="closeDrawerOnMobile"\s*></v-list-item>'
sidebar_new = r"""<v-list-item
            prepend-icon="mdi-account-plus"
            title="Salvation Requests"
            :to="{ name: 'DiscipleshipAdmin' }"
            :active="$route.name === 'DiscipleshipAdmin'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-book-open-variant"
            title="Bible Study"
            :to="{ name: 'BibleStudy' }"
            :active="$route.name === 'BibleStudy'"
            @click="closeDrawerOnMobile"
          ></v-list-item>"""

content = re.sub(sidebar_old, sidebar_new, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Sidebar patched')
