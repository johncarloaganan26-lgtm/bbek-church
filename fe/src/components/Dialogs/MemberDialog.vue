<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Member' : 'Add Member'"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="member-dialog"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
    >
      <!-- First Name -->
      <el-form-item label="First Name" prop="firstname">
        <el-input
          v-model="formData.firstname"
          placeholder="Enter first name"
          size="large"
          clearable
        />
      </el-form-item>

      <!-- Last Name -->
      <el-form-item label="Last Name" prop="lastname">
        <el-input
          v-model="formData.lastname"
          placeholder="Enter last name"
          size="large"
          clearable
        />
      </el-form-item>

      <!-- Middle Name -->
      <el-form-item label="Middle Name" prop="middle_name">
        <el-input
          v-model="formData.middle_name"
          placeholder="Enter middle name"
          size="large"
          clearable
        />
      </el-form-item>

      <!-- Birthdate -->
      <el-form-item label="Birthdate" prop="birthdate">
        <el-date-picker
          v-model="formData.birthdate"
          type="date"
          placeholder="Select birthdate"
          size="large"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          @change="calculateAge"
        />
      </el-form-item>

      <!-- Age (auto-calculated) -->
      <el-form-item label="Age" prop="age">
        <el-input-number
          v-model="formData.age"
          :min="0"
          :max="150"
          placeholder="Age will be calculated from birthdate"
          size="large"
          style="width: 100%"
          :disabled="!!formData.birthdate"
        />
      </el-form-item>

      <!-- Gender -->
      <el-form-item label="Gender" prop="gender">
        <el-select
          v-model="formData.gender"
          placeholder="Select gender"
          size="large"
          style="width: 100%"
          clearable
        >
          <el-option label="Male" value="M" />
          <el-option label="Female" value="F" />
          <el-option label="Other" value="O" />
        </el-select>
      </el-form-item>

      <!-- Address -->
      <el-form-item label="Address" prop="address">
        <el-input
          v-model="formData.address"
          type="textarea"
          :rows="3"
          placeholder="Enter address"
          size="large"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <!-- Email -->
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="Enter email address"
          size="large"
          clearable
        />
      </el-form-item>

      <!-- Phone Number -->
      <el-form-item label="Phone Number" prop="phone_number">
        <el-input
          v-model="formData.phone_number"
          placeholder="Enter phone number"
          size="large"
          clearable
        >
          <template #prepend>+63</template>
        </el-input>
      </el-form-item>

      <!-- Civil Status -->
      <el-form-item label="Civil Status" prop="civil_status">
        <el-select
          v-model="formData.civil_status"
          placeholder="Select civil status"
          size="large"
          style="width: 100%"
          clearable
        >
          <el-option label="Single" value="single" />
          <el-option label="Married" value="married" />
          <el-option label="Widowed" value="widowed" />
          <el-option label="Divorced" value="divorced" />
          <el-option label="Separated" value="separated" />
        </el-select>
      </el-form-item>

      <!-- Position -->
      <el-form-item label="Position" prop="position">
        <el-select
          v-model="formData.position"
          placeholder="Select position"
          size="large"
          style="width: 100%"
          clearable
          filterable
        >
          <el-option
            v-for="position in churchPositions"
            :key="position.value"
            :label="position.label"
            :value="position.value"
          />
        </el-select>
      </el-form-item>

      <!-- Profession -->
      <el-form-item label="Profession" prop="profession">
        <el-input
          v-model="formData.profession"
          placeholder="Enter profession/occupation"
          size="large"
          clearable
        />
      </el-form-item>

      <!-- Spouse Name (only show if married) -->
      <el-form-item v-if="formData.civil_status === 'married'" label="Spouse Name" prop="spouse_name">
        <el-input
          v-model="formData.spouse_name"
          placeholder="Enter spouse's full name"
          size="large"
          clearable
        />
      </el-form-item>

      <!-- Marriage Date (only show if married) -->
      <el-form-item v-if="formData.civil_status === 'married'" label="Marriage Date" prop="marriage_date">
        <el-date-picker
          v-model="formData.marriage_date"
          type="date"
          placeholder="Select marriage date"
          size="large"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <!-- Children -->
      <el-form-item label="Children">
        <div class="children-section">
          <div class="children-header">
            <span class="children-count">{{ formData.children.length }} Child(ren)</span>
            <el-button
              type="primary"
              size="large"
              @click="addChild"
              class="add-child-btn"
            >
              + Add Child
            </el-button>
          </div>
          <p class="children-subtitle" style="font-family: 'Georgia', serif; font-style: italic; margin-bottom: 16px; color: #6b7280; font-size: 0.875rem;">You can add information about your children at any time (optional)</p>
          
          <div v-for="(child, index) in formData.children" :key="index" class="child-item">
            <el-divider content-position="left">
              Child {{ index + 1 }}
              <el-button
                v-if="formData.children.length > 1"
                type="danger"
                size="small"
                @click="removeChild(index)"
                class="remove-child-btn"
                circle
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-divider>
            
            <div class="child-grid">
              <el-form-item label="Full Name" :prop="`children.${index}.name`" :rules="childNameRules">
                <el-input
                  v-model="child.name"
                  placeholder="Enter child's full name"
                  size="large"
                  clearable
                />
              </el-form-item>
              
              <el-form-item label="Age" :prop="`children.${index}.age`" :rules="childAgeRules">
                <el-input-number
                  v-model="child.age"
                  :min="0"
                  :max="100"
                  placeholder="Enter age"
                  size="large"
                  style="width: 100%;"
                />
              </el-form-item>
              
              <el-form-item label="Gender" :prop="`children.${index}.gender`" :rules="childGenderRules">
                <el-select
                  v-model="child.gender"
                  placeholder="Select gender"
                  size="large"
                  style="width: 100%;"
                  clearable
                >
                  <el-option label="Male" value="M" />
                  <el-option label="Female" value="F" />
                  <el-option label="Other" value="O" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="Birthday" :prop="`children.${index}.birthday`" :rules="childBirthdayRules">
                <el-date-picker
                  v-model="child.birthday"
                  type="date"
                  placeholder="Select birthday"
                  size="large"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                  :max-date="new Date()"
                />
              </el-form-item>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- Desire Ministry (only for admin/staff positions) -->
      <el-form-item v-if="isAdminOrStaffPosition" label="Desire Ministry" prop="desire_ministry">
        <el-input
          v-model="formData.desire_ministry"
          type="textarea"
          :rows="3"
          placeholder="Enter desired ministry or service"
          size="large"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>

      <!-- Guardian Name -->
      <el-form-item label="Guardian Name" prop="guardian_name">
        <el-input
          v-model="formData.guardian_name"
          placeholder="Enter guardian's full name"
          size="large"
          clearable
        />
      </el-form-item>

      <!-- Guardian Contact -->
      <el-form-item label="Guardian Contact" prop="guardian_contact">
        <el-input
          v-model="formData.guardian_contact"
          placeholder="Enter guardian's contact number"
          size="large"
          clearable
        >
          <template #prepend>+63</template>
        </el-input>
      </el-form-item>

      <!-- Guardian Relationship -->
      <el-form-item label="Guardian Relationship" prop="guardian_relationship">
        <el-select
          v-model="formData.guardian_relationship"
          placeholder="Select relationship"
          size="large"
          style="width: 100%"
          clearable
        >
          <el-option label="Parent" value="parent" />
          <el-option label="Grandparent" value="grandparent" />
          <el-option label="Sibling" value="sibling" />
          <el-option label="Guardian" value="guardian" />
          <el-option label="Other" value="other" />
        </el-select>
      </el-form-item>

    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          size="large"
          :loading="loading"
        >
          {{ isEditMode ? 'Update' : 'Add' }} Member
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useMemberRecordStore } from '@/stores/ChurchRecords/memberRecordStore'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  memberData: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', false])

// Pinia Store
const memberStore = useMemberRecordStore()

// Refs
const formRef = ref(null)
const loading = computed(() => memberStore.loading)

// Responsive dialog width
const dialogWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '95%'
  } else if (window.innerWidth <= 960) {
    return '90%'
  }
  return '700px'
})

// Responsive label width
const labelWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '100px'
  } else if (window.innerWidth <= 960) {
    return '120px'
  }
  return '140px'
})

// Responsive label position
const labelPosition = computed(() => {
  return window.innerWidth <= 600 ? 'top' : 'left'
})

// Check if in edit mode
const isEditMode = computed(() => !!props.memberData)

// Check if current position is admin/staff (not regular member or none)
const isAdminOrStaffPosition = computed(() => {
  const staffPositions = [
    'president', 'vice_president', 'secretary', 'assistant_secretary',
    'treasurer', 'auditor', 'coordinator', 'pio', 'socmed_coordinator',
    'senior_pastor', 'sending_pastor', 'department'
  ]
  return staffPositions.includes(formData.position)
})

// Church positions based on organization structure
const churchPositions = [
  { label: 'President', value: 'president' },
  { label: 'Vice President', value: 'vice_president' },
  { label: 'Secretary', value: 'secretary' },
  { label: 'Assistant Secretary', value: 'assistant_secretary' },
  { label: 'Treasurer', value: 'treasurer' },
  { label: 'Auditor', value: 'auditor' },
  { label: 'Coordinator', value: 'coordinator' },
  { label: 'PIO', value: 'pio' },
  { label: 'Social Media Coordinator', value: 'socmed_coordinator' },
  { label: 'Senior Pastor', value: 'senior_pastor' },
  { label: 'Sending Pastor', value: 'sending_pastor' },
  { label: 'Department', value: 'department' },
  { label: 'Member', value: 'member' },
  { label: 'None', value: 'none' }
]

// Form data
const formData = reactive({
  firstname: '',
  lastname: '',
  middle_name: '',
  birthdate: '',
  age: null,
  gender: '',
  address: '',
  email: '',
  phone_number: '',
  civil_status: '',
  position: 'none',
  profession: '',
  spouse_name: '',
  marriage_date: '',
  children: [],
  desire_ministry: '',
  guardian_name: '',
  guardian_contact: '',
  guardian_relationship: ''
})

// Validation rules
const rules = {
  firstname: [
    { required: true, message: 'First name is required', trigger: 'blur' },
    { min: 2, max: 50, message: 'First name must be between 2 and 50 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z\s'-]+$/, message: 'First name can only contain letters, spaces, hyphens, and apostrophes', trigger: 'blur' }
  ],
  lastname: [
    { required: true, message: 'Last name is required', trigger: 'blur' },
    { min: 2, max: 50, message: 'Last name must be between 2 and 50 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z\s'-]+$/, message: 'Last name can only contain letters, spaces, hyphens, and apostrophes', trigger: 'blur' }
  ],
  middle_name: [
    { max: 50, message: 'Middle name must not exceed 50 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z\s'-]*$/, message: 'Middle name can only contain letters, spaces, hyphens, and apostrophes', trigger: 'blur' }
  ],
  birthdate: [
    { required: true, message: 'Birthdate is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('Birthdate is required'))
          return
        }
        const selectedDate = new Date(value)
        const today = new Date()
        if (selectedDate > today) {
          callback(new Error('Birthdate cannot be in the future'))
          return
        }
        // Check if age is reasonable (not more than 150 years ago)
        const minDate = new Date()
        minDate.setFullYear(today.getFullYear() - 150)
        if (selectedDate < minDate) {
          callback(new Error('Birthdate is too far in the past'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  age: [
    { required: true, message: 'Age is required', trigger: 'blur' },
    { type: 'number', min: 0, max: 150, message: 'Age must be between 0 and 150', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: 'Gender is required', trigger: 'change' }
  ],
  address: [
    { required: true, message: 'Address is required', trigger: 'blur' },
    { min: 10, max: 500, message: 'Address must be between 10 and 500 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' },
    { max: 100, message: 'Email must not exceed 100 characters', trigger: 'blur' }
  ],
  phone_number: [
    { required: true, message: 'Phone number is required', trigger: 'blur' },
    {
      pattern: /^[0-9]{10}$/,
      message: 'Phone number must be exactly 10 digits (without +63)',
      trigger: 'blur'
    }
  ],
  civil_status: [
    { required: true, message: 'Civil status is required', trigger: 'change' }
  ],
  position: [
    { required: true, message: 'Position is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('Position is required'))
          return
        }
        const validValues = churchPositions.map(p => p.value)
        if (!validValues.includes(value)) {
          callback(new Error('Please select a valid position'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  guardian_name: [
    { max: 100, message: 'Guardian name must not exceed 100 characters', trigger: 'blur' }
  ],
  guardian_contact: [
    { max: 20, message: 'Guardian contact must not exceed 20 characters', trigger: 'blur' }
  ],
  profession: [
    { max: 100, message: 'Profession must not exceed 100 characters', trigger: 'blur' }
  ],
  spouse_name: [
    { max: 100, message: 'Spouse name must not exceed 100 characters', trigger: 'blur' }
  ],
  desire_ministry: [
    { max: 255, message: 'Desire ministry must not exceed 255 characters', trigger: 'blur' }
  ],
  // Child validation rules
  childNameRules: [
    { required: true, message: 'Child name is required', trigger: 'blur' },
    { min: 2, max: 100, message: 'Child name must be between 2 and 100 characters', trigger: 'blur' }
  ],
  childAgeRules: [
    { required: true, message: 'Child age is required', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: 'Age must be between 0 and 100', trigger: 'blur' }
  ],
  childGenderRules: [
    { required: true, message: 'Child gender is required', trigger: 'change' }
  ],
  childBirthdayRules: [
    { required: true, message: 'Child birthday is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('Birthday is required'))
          return
        }
        const selectedDate = new Date(value)
        const today = new Date()
        if (selectedDate > today) {
          callback(new Error('Birthday cannot be in the future'))
          return
        }
        // Check if age is reasonable (not more than 150 years ago)
        const minDate = new Date()
        minDate.setFullYear(today.getFullYear() - 150)
        if (selectedDate < minDate) {
          callback(new Error('Birthday is too far in the past'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

// Calculate age from birthdate
const calculateAge = () => {
  if (formData.birthdate) {
    const birthDate = new Date(formData.birthdate)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    formData.age = age
  }
}

// Add child
const addChild = () => {
  formData.children.push({
    name: '',
    age: null,
    gender: '',
    birthday: ''
  })
}

// Remove child
const removeChild = (index) => {
  formData.children.splice(index, 1)
}

// Watch for memberData changes to populate form in edit mode
watch(() => props.memberData, (newData) => {
  if (newData && props.modelValue) {
    formData.firstname = newData.firstname || ''
    formData.lastname = newData.lastname || ''
    formData.middle_name = newData.middle_name || ''
    formData.birthdate = newData.birthdate || ''
    formData.age = newData.age || null
    formData.gender = newData.gender || ''
    formData.address = newData.address || ''
    formData.email = newData.email || ''
    // Remove +63 prefix if present
    formData.phone_number = newData.phone_number ? newData.phone_number.replace(/^\+63/, '') : ''
    formData.civil_status = newData.civil_status || ''
    formData.position = newData.position || 'none'
    formData.profession = newData.profession || ''
    formData.spouse_name = newData.spouse_name || ''
    formData.marriage_date = newData.marriage_date || ''
    formData.children = Array.isArray(newData.children) ? [...newData.children] : []
    formData.desire_ministry = newData.desire_ministry || ''
    formData.testimony = newData.testimony || ''
    formData.guardian_name = newData.guardian_name || ''
    formData.guardian_contact = newData.guardian_contact || ''
    formData.guardian_relationship = newData.guardian_relationship || ''

    // Calculate age if birthdate exists
    if (formData.birthdate) {
      calculateAge()
    }
  }
}, { immediate: true })

// Watch for dialog open/close to reset form
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    // Reset form when dialog closes
    resetForm()
  } else if (props.memberData) {
    // Populate form when dialog opens in edit mode
    const data = props.memberData
    formData.firstname = data.firstname || ''
    formData.lastname = data.lastname || ''
    formData.middle_name = data.middle_name || ''
    formData.birthdate = data.birthdate || ''
    formData.age = data.age || null
    formData.gender = data.gender || ''
    formData.address = data.address || ''
    formData.email = data.email || ''
    formData.phone_number = data.phone_number ? data.phone_number.replace(/^\+63/, '') : ''
    formData.civil_status = data.civil_status || ''
    formData.position = data.position || 'none'
    formData.profession = data.profession || ''
    formData.spouse_name = data.spouse_name || ''
    formData.marriage_date = data.marriage_date || ''
    formData.children = Array.isArray(data.children) ? [...data.children] : []
    formData.desire_ministry = data.desire_ministry || ''
    formData.testimony = data.testimony || ''
    formData.guardian_name = data.guardian_name || ''
    formData.guardian_contact = data.guardian_contact || ''
    formData.guardian_relationship = data.guardian_relationship || ''

    if (formData.birthdate) {
      calculateAge()
    }
  } else {
    // Reset form for add mode
    resetForm()
  }
})

// Reset form
const resetForm = () => {
  formData.firstname = ''
  formData.lastname = ''
  formData.middle_name = ''
  formData.birthdate = ''
  formData.age = null
  formData.gender = ''
  formData.address = ''
  formData.email = ''
  formData.phone_number = ''
  formData.civil_status = ''
  formData.position = 'none'
  formData.profession = ''
  formData.spouse_name = ''
  formData.marriage_date = ''
  formData.children = []
  formData.desire_ministry = ''
  formData.testimony = ''
  formData.guardian_name = ''
  formData.guardian_contact = ''
  formData.guardian_relationship = ''

  // Clear validation
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// Handle close
const handleClose = () => {
  emit('update:modelValue', false)
}

// Handle submit
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // Validate form
    await formRef.value.validate()
    
    // Show confirmation dialog
    const action = isEditMode.value ? 'update' : 'save'
    const actionText = isEditMode.value ? 'update' : 'save'
    const memberName = `${formData.firstname} ${formData.lastname}`.trim()
    
    await ElMessageBox.confirm(
      `Are you sure you want to ${actionText} ${isEditMode.value ? 'the changes for' : ''} member "${memberName}"?`,
      `Confirm ${action === 'update' ? 'Update' : 'Save'}`,
      {
        confirmButtonText: action === 'update' ? 'Update' : 'Save',
        cancelButtonText: 'Cancel',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )
    
    // Prepare data for submission
    const submitData = {
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      middle_name: formData.middle_name.trim(),
      birthdate: formData.birthdate,
      age: formData.age,
      gender: formData.gender,
      address: formData.address.trim(),
      email: formData.email.trim().toLowerCase(),
      phone_number: `+63${formData.phone_number}`, // Add +63 prefix
      civil_status: formData.civil_status,
      position: formData.position,
      profession: formData.profession?.trim() || null,
      spouse_name: formData.spouse_name?.trim() || null,
      marriage_date: formData.marriage_date || null,
      children: formData.children?.length > 0 ? formData.children : null,
      desire_ministry: formData.desire_ministry?.trim() || null,
      testimony: formData.testimony?.trim() || '',
      guardian_name: formData.guardian_name?.trim() || null,
      guardian_contact: formData.guardian_contact?.trim() || null,
      guardian_relationship: formData.guardian_relationship || null
    }

    let result

    // Get member ID (handle both 'id' and 'member_id' field names)
    const memberId =  props.memberData?.member_id

    if (isEditMode.value && memberId) {
      // Update existing member
      result = await memberStore.updateMember(memberId, submitData)
      
      if (result.success) {
        ElMessage.success('Member updated successfully')
        emit('update:modelValue', false)
        handleClose()
      } else {
        ElMessage.error(result.error || 'Failed to update member')
      }
    } else {
      // Create new member
      result = await memberStore.createMember(submitData)
      
      if (result.success) {
        ElMessage.success('Member created successfully')
        emit('update:modelValue', false)
      } else {
        ElMessage.error(result.error || 'Failed to create member')
      }
    }
    
  } catch (error) {
    // Handle cancellation (user clicked cancel or closed the dialog)
    if (error === 'cancel' || error === 'close') {
      return // User cancelled, do nothing
    }
    console.error('Validation failed:', error)
    ElMessage.error('Please fill in all required fields correctly')
  } finally {
    // Ensure loading state is reset
    loading.value = false
  }
}

// Expose method to reset loading (can be called by parent component on API error)
const resetLoading = () => {
  loading.value = false
}

// Expose methods for parent component
defineExpose({
  resetLoading
})
</script>

<style scoped>
.member-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.member-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.member-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.member-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.member-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.member-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.member-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.member-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.member-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.member-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.member-dialog :deep(.el-date-editor.el-input) {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
  min-width: 100px;
}

.dialog-footer .el-button--primary {
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.dialog-footer .el-button--primary:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

.children-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.child-item {
  margin-bottom: 12px;
}

.child-item:last-child {
  margin-bottom: 0;
}

.child-fields {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .child-fields {
    flex-direction: column;
    align-items: stretch;
  }

  .child-fields .el-input,
  .child-fields .el-select,
  .child-fields .el-date-editor {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 8px;
  }

  .child-fields .el-button {
    align-self: flex-end;
  }
}

@media (max-width: 960px) {
  .member-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto !important;
    max-height: 90vh;
  }

  .member-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .member-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }

  .member-dialog :deep(.el-dialog__header) {
    padding: 16px;
  }

  .member-dialog :deep(.el-dialog__title) {
    font-size: 1rem;
  }

  .member-dialog :deep(.el-dialog__body) {
    padding: 12px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
  }

  .member-dialog :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .member-dialog :deep(.el-form-item__label) {
    font-size: 0.875rem;
    padding-bottom: 4px;
    line-height: 1.4;
  }

  .member-dialog :deep(.el-input),
  .member-dialog :deep(.el-select),
  .member-dialog :deep(.el-date-editor) {
    width: 100%;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
    padding: 12px 0;
  }

  .dialog-footer .el-button {
    width: 100%;
    min-width: auto;
    margin: 0;
  }
}
</style>


