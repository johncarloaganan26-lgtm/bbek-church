
import sys
import re

filepath = r'c:\Users\John Carlo\OneDrive\Desktop\bbek-app\fe\src\components\LandingPage\BeOneOfUs\Discipleship.vue'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports and isBibleStudy
imports_old = r"import { ref, reactive, watch, computed } from 'vue';\s*import { useDiscipleshipStore } from '@/stores/discipleshipStore';\s*import { ElMessage, ElMessageBox } from 'element-plus';\s*const discipleshipStore = useDiscipleshipStore\(\);\s*const formRef = ref\(null\);"

imports_new = r"""import { ref, reactive, watch, computed, onMounted } from 'vue';
import { useDiscipleshipStore } from '@/stores/discipleshipStore';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute } from 'vue-router';
import moment from 'moment';

const discipleshipStore = useDiscipleshipStore();
const formRef = ref(null);
const route = useRoute();

const availabilities = ref([]);

const isBibleStudy = computed(() => {
  return route.query.stage === 'bible_study' || route.query.type === 'bible_study';
});"""

content = re.sub(imports_old, imports_new, content)

# 2. Update form fields
form_fields_old = r'<el-form-item label="Address" prop="address">\s*<el-input v-model="formData\.address" type="textarea" placeholder="Your Address" />\s*</el-form-item>'
form_fields_new = r"""<el-form-item label="Address" prop="address">
                      <el-input v-model="formData.address" type="textarea" placeholder="Your Address" />
                    </el-form-item>

                    <el-form-item label="Preferred Salvation Talk Schedule" prop="availability_id" required v-if="!isBibleStudy && !isLoggedIn">
                      <el-select v-model="formData.availability_id" placeholder="Select an available date/time" style="width: 100%">
                        <el-option
                          v-for="item in availabilities"
                          :key="item.availability_id"
                          :label="formatAvailability(item)"
                          :value="item.availability_id"
                        />
                        <template #empty>
                          <div class="pa-4 text-center">
                            <v-icon color="grey">mdi-calendar-clock</v-icon>
                            <p class="text-caption grey--text">No slots available right now. Please check back later.</p>
                          </div>
                        </template>
                      </el-select>
                      <p class="text-caption text-teal-darken-3 mt-1">
                        Pick a date and time that works best for you.
                      </p>
                    </el-form-item>"""

content = re.sub(form_fields_old, form_fields_new, content)

# 3. Update button text
btn_old = r'<el-button type="primary" size="large" @click="handleSubmit" :loading="discipleshipStore\.loading" style="width: 100%;">\s*Send Request\s*</el-button>'
btn_new = r"""<el-button type="primary" size="large" @click="handleSubmit" :loading="discipleshipStore.loading" style="width: 100%;">
                      {{ isBibleStudy ? 'Confirm Bible Study Interest' : 'Send Request' }}
                    </el-button>"""

content = re.sub(btn_old, btn_new, content)

# 4. Update rules
rules_old = r"gender: \[{ required: true, message: 'Gender is required', trigger: 'change' }\],\s*address: \[{ required: true, message: 'Address is required', trigger: 'blur' }\],"
rules_new = r"""gender: [{ required: true, message: 'Gender is required', trigger: 'change' }],
  address: [{ required: true, message: 'Address is required', trigger: 'blur' }],
  availability_id: [{ 
    required: true, 
    validator: (rule, value, callback) => {
      if (!isLoggedIn.value && !isBibleStudy.value && !value) {
        callback(new Error('Please select a preferred schedule'));
      } else {
        callback();
      }
    }, 
    trigger: 'change' 
  }],"""

content = re.sub(rules_old, rules_new, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Replacements applied successfully')
