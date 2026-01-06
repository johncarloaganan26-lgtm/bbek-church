<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Water Baptism Record' : 'Add Water Baptism Record'"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="water-baptism-dialog"
    @close="handleClose"
    v-loading="loading"
    element-loading-text="Processing..."
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
    >

      <!-- Member -->
      <el-form-item label="Member" prop="member_id">
        <el-select
          v-model="formData.member_id"
          placeholder="Select member"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
          @change="onMemberChange"
        >
            <el-option
            v-for="option in waterBaptismStore.memberOptions"
            :key="option.id"
            :label="option.name"
            :value="option.id"
          />
        </el-select>
      </el-form-item>

      <!-- First Name -->
      <el-form-item label="First Name">
        <el-input
          v-model="formData.firstname"
          placeholder="First Name"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Middle Name -->
      <el-form-item label="Middle Name">
        <el-input
          v-model="formData.middle_name"
          placeholder="Middle Name"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Last Name -->
      <el-form-item label="Last Name">
        <el-input
          v-model="formData.lastname"
          placeholder="Last Name"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Birthdate -->
      <el-form-item label="Birthdate">
        <el-input
          v-model="formData.birthdate"
          placeholder="Birthdate"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Age -->
      <el-form-item label="Age">
        <el-input
          v-model="formData.age"
          placeholder="Age"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Gender -->
      <el-form-item label="Gender">
        <el-input
          v-model="formData.gender"
          placeholder="Gender"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Civil Status -->
      <el-form-item label="Civil Status">
        <el-input
          v-model="formData.civil_status"
          placeholder="Civil Status"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Address -->
      <el-form-item label="Address">
        <el-input
          v-model="formData.address"
          placeholder="Address"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Email -->
      <el-form-item label="Email">
        <el-input
          v-model="formData.email"
          placeholder="Email"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Phone Number -->
      <el-form-item label="Phone Number">
        <el-input
          v-model="formData.phone_number"
          placeholder="Phone Number"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Position -->
      <el-form-item label="Position">
        <el-input
          v-model="formData.position"
          placeholder="Position"
          size="large"
          style="width: 100%"
          readonly
          :disabled="loading"
        />
      </el-form-item>

      <!-- Baptism Date -->
      <el-form-item label="Baptism Date" prop="baptism_date">
        <el-date-picker
          v-model="formData.baptism_date"
          type="date"
          placeholder="Select baptism date"
          size="large"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled="loading"
          @change="updateStatusFromBaptismDate"
        />
      </el-form-item>

      <!-- Location -->
      <el-form-item label="Location" prop="location">
        <el-input
          v-model="formData.location"
          placeholder="Enter baptism location"
          size="large"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Pastor -->
      <el-form-item label="Pastor" prop="pastor_name">
        <el-select
          v-model="formData.pastor_name"
          placeholder="Select pastor"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
        >
          <el-option
            v-for="option in pastorOptions"
            :key="option.name"
            :label="option.name"
            :value="option.name"
          />
        </el-select>
      </el-form-item>

      <!-- Status -->
      <el-form-item label="Status" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="Select status"
          size="large"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.name"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- Guardian Name -->
      <el-form-item label="Guardian Name">
        <el-input
          v-model="formData.guardian_name"
          placeholder="Enter guardian's full name"
          size="large"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Guardian Contact -->
      <el-form-item label="Guardian Contact">
        <el-input
          v-model="formData.guardian_contact"
          placeholder="Enter guardian's contact number"
          size="large"
          :disabled="loading"
        >
          <template #prepend>+63</template>
        </el-input>
      </el-form-item>

      <!-- Guardian Relationship -->
      <el-form-item label="Guardian Relationship">
        <el-select
          v-model="formData.guardian_relationship"
          placeholder="Select relationship"
          size="large"
          style="width: 100%"
          :disabled="loading"
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
        <el-button @click="handleClose" size="large" :disabled="loading">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          size="large"
          :loading="loading"
          :disabled="loading"
        >
          {{ isEditMode ? 'Update' : 'Add' }} Record
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useWaterBaptismStore } from '@/stores/ServicesRecords/waterBaptismStore'

const waterBaptismStore = useWaterBaptismStore()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  baptismData: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'submit'])

// Refs
const formRef = ref(null)
const loading = ref(false)
const loadingInstanceRef = ref(null)

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

// Member options - will be fetched from API
const memberOptions = computed(() => waterBaptismStore.memberOptions || [])

// Pastor options - will be fetched from API
const pastorOptions = computed(() => waterBaptismStore.pastorOptions || [])

// Fetch member options and pastor options when component mounts
onMounted(async () => {
  await Promise.all([
    waterBaptismStore.fetchMemberOptions(),
    waterBaptismStore.fetchPastorOptions()
  ])
})
// Check if in edit mode
const isEditMode = computed(() => !!props.baptismData)

// Status options
const statusOptions = [
  { name: 'Pending', value: 'pending' },
  { name: 'Approved', value: 'approved' },
  { name: 'Disapproved', value: 'disapproved' },
  { name: 'Completed', value: 'completed' },
  { name: 'Cancelled', value: 'cancelled' }
]

// Form data
const formData = reactive({
  member_id: "",
  baptism_date: null,
  location: '',
  pastor_name: '',
  status: 'pending', // Default status
  // Member details (auto-populated from member table)
  firstname: '',
  middle_name: '',
  lastname: '',
  birthdate: '',
  age: '',
  gender: '',
  civil_status: '',
  address: '',
  email: '',
  phone_number: '',
  position: '',
  guardian_name: '',
  guardian_contact: '',
  guardian_relationship: ''
})

// Validation rules
const rules = {
  member_id: [
    { required: true, message: 'Member is required', trigger: 'change' }
  ],
  baptism_date: [
    { required: true, message: 'Baptism date is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('Baptism date is required'))
          return
        }
        const selectedDate = new Date(value)
        const today = new Date()
        // Allow future dates for scheduled baptisms
        // But not too far in the past (more than 100 years)
        const minDate = new Date()
        minDate.setFullYear(today.getFullYear() - 100)
        if (selectedDate < minDate) {
          callback(new Error('Baptism date is too far in the past'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  location: [
    { required: true, message: 'Location is required', trigger: 'blur' }
  ],
  pastor_name: [
    { required: true, message: 'Pastor is required', trigger: 'change' }
  ],
  status: [
    { required: true, message: 'Status is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        // Atomic validation: approved/completed requires baptism_date
        if ((value === 'approved' || value === 'completed') && (!formData.baptism_date || !formData.baptism_date.trim())) {
          callback(new Error('Baptism date is required for approved/completed status'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

// Update status based on baptism date - automatic status management
const updateStatusFromBaptismDate = () => {
  if (!formData.baptism_date) {
    formData.status = 'pending'
    return
  }

  const baptismDate = new Date(formData.baptism_date)
  const now = new Date()

  if (isNaN(baptismDate.getTime())) {
    formData.status = 'pending'
    return
  }

  // Auto-set status based on date
  if (baptismDate.getTime() > now.getTime()) {
    formData.status = 'approved'  // Future date = approved/scheduled
  } else if (Math.abs(baptismDate.getTime() - now.getTime()) < 2 * 60 * 60 * 1000) {
    // Within 2 hours window considered ongoing
    formData.status = 'approved'  // Ongoing = approved
  } else {
    formData.status = 'completed'  // Past date = completed
  }
}

// Watch for baptismData changes to populate form in edit mode
watch(() => props.baptismData, async (newData) => {
  if (newData && props.modelValue) {
    formData.member_id = newData.member_id || ''
    formData.baptism_date = newData.baptism_date || null
    formData.location = newData.location || ''
    formData.pastor_name = newData.pastor_name || ''
    formData.status = newData.status || 'pending'
    formData.guardian_name = newData.guardian_name || ''
    formData.guardian_contact = newData.guardian_contact || ''
    formData.guardian_relationship = newData.guardian_relationship || ''

    // Populate member details from the joined data
    formData.firstname = newData.firstname || ''
    formData.middle_name = newData.middle_name || ''
    formData.lastname = newData.lastname || ''
    formData.birthdate = newData.birthdate ? new Date(newData.birthdate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : ''
    formData.age = newData.age || ''
    formData.gender = newData.gender === 'M' ? 'Male' : newData.gender === 'F' ? 'Female' : newData.gender === 'O' ? 'Other' : newData.gender || ''
    formData.civil_status = newData.civil_status || ''
    formData.address = newData.address || ''
    formData.email = newData.email || ''
    formData.phone_number = newData.phone_number || ''
    formData.position = newData.position || ''

    // Update status based on baptism date if not explicitly set
    if (!newData.status && formData.baptism_date) {
      updateStatusFromBaptismDate()
    }
  }
}, { immediate: true })

// Watch for dialog open/close to reset or populate form
watch(() => props.modelValue, async (isOpen) => {
  if (!isOpen) {
    // Reset form when dialog closes
    resetForm()
    resetLoading() // Reset loading when dialog closes
  } else if (props.baptismData) {
    // Populate form when dialog opens in edit mode
    const data = props.baptismData
    formData.member_id = data.member_id || ''
    formData.baptism_date = data.baptism_date || null
    formData.location = data.location || ''
    formData.pastor_name = data.pastor_name || ''
    formData.status = data.status || 'pending'
    formData.guardian_name = data.guardian_name || ''
    formData.guardian_contact = data.guardian_contact || ''
    formData.guardian_relationship = data.guardian_relationship || ''

    // Populate member details from the joined data
    formData.firstname = data.firstname || ''
    formData.middle_name = data.middle_name || ''
    formData.lastname = data.lastname || ''
    formData.birthdate = data.birthdate ? new Date(data.birthdate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : ''
    formData.age = data.age || ''
    formData.gender = data.gender === 'M' ? 'Male' : data.gender === 'F' ? 'Female' : data.gender === 'O' ? 'Other' : data.gender || ''
    formData.civil_status = data.civil_status || ''
    formData.address = data.address || ''
    formData.email = data.email || ''
    formData.phone_number = data.phone_number || ''
    formData.position = data.position || ''

    // Update status based on baptism date if not explicitly set
    if (!data.status && formData.baptism_date) {
      updateStatusFromBaptismDate()
    }
  } else {
    // Reset form for add mode
    resetForm()
  }
})

// Handle member selection change
const onMemberChange = async (memberId) => {
  if (!memberId) {
    // Clear fields if no member selected
    formData.firstname = ''
    formData.middle_name = ''
    formData.lastname = ''
    formData.birthdate = ''
    formData.age = ''
    formData.gender = ''
    formData.civil_status = ''
    formData.address = ''
    formData.email = ''
    formData.phone_number = ''
    formData.position = ''
    return
  }

  try {
    const memberDetails = await waterBaptismStore.fetchMemberDetails(memberId)
    if (memberDetails) {
      formData.firstname = memberDetails.firstname || ''
      formData.middle_name = memberDetails.middle_name || ''
      formData.lastname = memberDetails.lastname || ''
      formData.birthdate = memberDetails.birthdate ? new Date(memberDetails.birthdate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : ''
      formData.age = memberDetails.age || ''
      formData.gender = memberDetails.gender === 'M' ? 'Male' : memberDetails.gender === 'F' ? 'Female' : memberDetails.gender === 'O' ? 'Other' : memberDetails.gender || ''
      formData.civil_status = memberDetails.civil_status || ''
      formData.address = memberDetails.address || ''
      formData.email = memberDetails.email || ''
      formData.phone_number = memberDetails.phone_number || ''
      formData.position = memberDetails.position || ''
    }
  } catch (error) {
    console.error('Error fetching member details:', error)
    ElMessage.error('Failed to load member details')
  }
}

// Reset form
const resetForm = () => {
  formData.member_id = ''
  formData.baptism_date = null
  formData.location = ''
  formData.pastor_name = ''
  formData.status = 'pending' // Reset to default
  // Member details
  formData.firstname = ''
  formData.middle_name = ''
  formData.lastname = ''
  formData.birthdate = ''
  formData.age = ''
  formData.gender = ''
  formData.civil_status = ''
  formData.address = ''
  formData.email = ''
  formData.phone_number = ''
  formData.position = ''
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

    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'

    await ElMessageBox.confirm(
      `Are you sure you want to ${actionText} this water baptism record?`,
      `Confirm ${actionTitle} Water Baptism`,
      {
        confirmButtonText: actionTitle,
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.water-baptism-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })
    
    // Prepare data for submission
    // Backend expects: { member_id, baptism_date, location, pastor_name, status?, guardian_name?, guardian_contact?, guardian_relationship? }
    // baptism_date is required and will be formatted by backend as DATETIME
    const submitData = {
      member_id: String(formData.member_id).trim(),
      baptism_date: formData.baptism_date, // Required - backend will format as DATETIME
      location: formData.location?.trim() || null,
      pastor_name: formData.pastor_name || null,
      status: formData.status || 'pending',
      guardian_name: formData.guardian_name?.trim() || null,
      guardian_contact: formData.guardian_contact?.trim() || null,
      guardian_relationship: formData.guardian_relationship || null
    }

    // Emit submit event with data
    emit('submit', submitData)
    
    // Safety timeout: reset loading after 30 seconds if still loading
    // This prevents loading state from getting stuck if parent component fails silently
    setTimeout(() => {
      if (loading.value) {
        resetLoading()
      }
    }, 30000)
  } catch (error) {
    // Reset loading state
    resetLoading()
    
    if (error !== 'cancel') {
      console.error('Validation failed or submission cancelled:', error)
      ElMessage.error('Please fill in all required fields correctly or operation cancelled.')
    }
  }
}

// Expose method to reset loading (can be called by parent component on API error)
const resetLoading = () => {
  loading.value = false
  // Close loading overlay if it exists
  if (loadingInstanceRef.value) {
    try {
      loadingInstanceRef.value.close()
    } catch (e) {
      // Ignore if already closed
    }
    loadingInstanceRef.value = null
  }
}

// Expose methods for parent component
defineExpose({
  resetLoading
})
</script>

<style scoped>
.water-baptism-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.water-baptism-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.water-baptism-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.water-baptism-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.water-baptism-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.water-baptism-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.water-baptism-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.water-baptism-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.water-baptism-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.water-baptism-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.water-baptism-dialog :deep(.el-date-editor.el-input) {
  width: 100%;
}

@media (max-width: 960px) {
  .water-baptism-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto !important;
    max-height: 90vh;
  }

  .water-baptism-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .water-baptism-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }

  .water-baptism-dialog :deep(.el-dialog__header) {
    padding: 16px;
  }

  .water-baptism-dialog :deep(.el-dialog__title) {
    font-size: 1rem;
  }

  .water-baptism-dialog :deep(.el-dialog__body) {
    padding: 12px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
  }

  .water-baptism-dialog :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .water-baptism-dialog :deep(.el-form-item__label) {
    font-size: 0.875rem;
    padding-bottom: 4px;
    line-height: 1.4;
  }

  .water-baptism-dialog :deep(.el-input),
  .water-baptism-dialog :deep(.el-select),
  .water-baptism-dialog :deep(.el-date-editor) {
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
</style>

