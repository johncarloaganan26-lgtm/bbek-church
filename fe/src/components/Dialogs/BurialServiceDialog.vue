<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Burial Service' : 'Add Burial Service'"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="burial-service-dialog"
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
          :disabled="loading || (userInfo.account.position !== 'admin' && userInfo.account.position !== 'staff')"
        >
          <el-option
            v-for="member in memberOptions"
            :key="member.id || member.member_id"
            :label="member.name || (member.firstname + ' ' + member.lastname)"
            :value="member.id || member.member_id"
          />
        </el-select>
      </el-form-item>

      <!-- Deceased Name -->
      <el-form-item label="Deceased Name" prop="deceased_name">
        <template #label>
          <span>Deceased Name <span class="required">*</span> <span class="required-text">Required</span></span>
        </template>
        <el-input
          v-model="formData.deceased_name"
          placeholder="Enter deceased full name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Deceased Birthdate -->
      <el-form-item label="Deceased Birthdate" prop="deceased_birthdate">
        <template #label>
          <span>Deceased Birthdate <span class="required">*</span> <span class="required-text">Required</span></span>
        </template>
        <el-date-picker
          v-model="formData.deceased_birthdate"
          type="date"
          placeholder="Select birthdate"
          size="large"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Date of Death -->
      <el-form-item label="Date of Death" prop="date_death">
        <template #label>
          <span>Date of Death <span class="required">*</span> <span class="required-text">Required</span></span>
        </template>
        <el-date-picker
          v-model="formData.date_death"
          type="datetime"
          placeholder="Select date and time of death"
          size="large"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Relationship -->
      <el-form-item label="Relationship" prop="relationship">
        <template #label>
          <span>Relationship <span class="required">*</span> <span class="required-text">Required</span></span>
        </template>
        <el-select
          v-model="formData.relationship"
          placeholder="Select relationship"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
        >
          <el-option
            v-for="rel in relationshipOptions"
            :key="rel"
            :label="rel"
            :value="rel"
          />
        </el-select>
      </el-form-item>

      <!-- Location -->
      <el-form-item label="Location" prop="location" >
        <template #label>
          <span>Location <span class="required">*</span> <span class="required-text">Required</span></span>
        </template>
        <el-input
          v-model="formData.location"
          placeholder="Enter service location"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Pastor -->
      <el-form-item label="Pastor" prop="pastor_name" v-if="userInfo.account.position === 'admin' || userInfo.account.position === 'staff'">
        <template #label>
          <span>Pastor <span class="required">*</span> <span class="required-text">Required</span></span>
        </template>
        <el-select
          v-model="formData.pastor_name"
          placeholder="Select pastor"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
        >
          <el-option
            v-for="pastor in pastorOptions"
            :key="pastor.name"
            :label="pastor.name"
            :value="pastor.name"
          />
        </el-select>
      </el-form-item>

      <!-- Service Date & Time -->
      <el-form-item label="Service Date & Time" prop="service_date" v-if="userInfo.account.position === 'admin' || userInfo.account.position === 'staff'">
        <template #label>
          <span>Service Date & Time <span class="required">*</span> <span class="required-text">Required</span></span>
        </template>
        <el-date-picker
          v-model="formData.service_date"
          type="datetime"
          placeholder="Select service date and time"
          size="large"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="loading"
          @change="updateStatusFromServiceDate"
        />
      </el-form-item>

      <!-- Status -->
      <el-form-item label="Status" prop="status" v-if="userInfo.account.position === 'admin' || userInfo.account.position === 'staff'">
        <template #label>
          <span>Status <span class="required">*</span> <span class="required-text">Required</span></span>
        </template>
        <el-select
          v-model="formData.status"
          placeholder="Status"
          size="large"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
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
          {{ isEditMode ? 'Update' : userInfo.account.position === 'admin' || userInfo.account.position === 'staff' ? 'Add' : 'Send' }} Record
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useBurialServiceStore } from '@/stores/ServicesRecords/burialServiceStore'
const burialServiceStore = useBurialServiceStore()
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  burialServiceData: {
    type: Object,
    default: null
  }
})

// Computed properties from store
const memberOptions = computed(() => burialServiceStore.memberOptions)
const pastorOptions = computed(() => burialServiceStore.pastorOptions)

// Fetch options on mount
onMounted(async () => {
  await Promise.all([
    burialServiceStore.fetchMemberOptions(),
    burialServiceStore.fetchPastorOptions()
  ])

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
  return '900px'
})

// Responsive label width
const labelWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '100px'
  } else if (window.innerWidth <= 960) {
    return '130px'
  }
  return '160px'
})

// Responsive label position
const labelPosition = computed(() => {
  return window.innerWidth <= 600 ? 'top' : 'left'
})

// Check if in edit mode
const isEditMode = computed(() => !!props.burialServiceData)

// Relationship options
const relationshipOptions = [
  'Parent',
  'Child',
  'Sibling',
  'Spouse',
  'Grandparent',
  'Grandchild',
  'Relative',
  'Friend',
  'Church Member',
  'Other'
]

// Form data
const formData = reactive({
  member_id: null,
  deceased_name: '',
  deceased_birthdate: '',
  date_death: '',
  relationship: '',
  location: '',
  pastor_name: null,
  service_date: null,
  status: 'pending'
})

// Status options - standardized: pending, approved, disapproved, completed, cancelled
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Disapproved', value: 'disapproved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

// Validation rules
const rules = {
  member_id: [
    { required: true, message: 'Member is required', trigger: 'change' }
  ],
  deceased_name: [
    { required: true, message: 'Deceased name is required', trigger: 'blur' },
    { min: 2, max: 100, message: 'Deceased name must be between 2 and 100 characters', trigger: 'blur' }
  ],
  relationship: [
    { required: true, message: 'Relationship is required', trigger: 'change' }
  ],
  location: [
    { required: true, message: 'Location is required', trigger: 'blur' },
    { min: 3, max: 150, message: 'Location must be between 3 and 150 characters', trigger: 'blur' }
  ],

  status: [
    { required: true, message: 'Status is required', trigger: 'change' },
    { max: 50, message: 'Status must not exceed 50 characters', trigger: 'blur' }
  ]
}

// Update status based on service date
const updateStatusFromServiceDate = () => {
  if (!formData.service_date) {
    formData.status = 'pending'
    return
  }

  const serviceDate = new Date(formData.service_date)
  const now = new Date()

  if (isNaN(serviceDate.getTime())) {
    formData.status = 'pending'
    return
  }

  // If service date is in the future, set to 'approved' (scheduled)
  if (serviceDate.getTime() > now.getTime()) {
    formData.status = 'approved'
  } else {
    // Past date - service should be completed
    formData.status = 'completed'
  }
}

// Watch for burialServiceData changes to populate form in edit mode
watch(
  () => props.burialServiceData,
  (newData) => {
    if (newData && props.modelValue) {
      formData.member_id = newData.member_id ?? null
      formData.deceased_name = newData.deceased_name || ''
      formData.deceased_birthdate = newData.deceased_birthdate || ''
      formData.date_death = newData.date_death || ''
      formData.relationship = newData.relationship || ''
      formData.location = newData.location || ''
      formData.pastor_name = newData.pastor_name ?? null
      formData.service_date = (newData.service_date === null || newData.service_date === '' || !newData.service_date) ? null : newData.service_date
      

      // Derive status from date if not explicitly set
      if (newData.status) {
        formData.status = newData.status
      } else {
        updateStatusFromServiceDate()
      }
    }
  },
  { immediate: true }
)

// Watch dialog open/close to reset or populate form
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      resetForm()
      resetLoading() // Reset loading when dialog closes
    } else {
      // Fetch options when dialog opens
      await Promise.all([
        burialServiceStore.fetchMemberOptions(),
        burialServiceStore.fetchPastorOptions()
      ])
      
      if (props.burialServiceData) {
        const data = props.burialServiceData
        formData.member_id = data.member_id ?? null
        formData.deceased_name = data.deceased_name || ''
        formData.deceased_birthdate = data.deceased_birthdate || ''
        formData.date_death = data.date_death || ''
        formData.relationship = data.relationship || ''
        formData.location = data.location || ''
        formData.pastor_name = data.pastor_name ?? null
        formData.service_date = data.service_date || null

        if (data.status) {
          formData.status = data.status
        } else {
          updateStatusFromServiceDate()
        }
      } else {
        resetForm()
        if (userInfo.value.account.position !== 'admin' || userInfo.value.account.position !== 'staff') {
          formData.member_id = userInfo.value.member.member_id
        }
      }
    }
  }
)

// Reset form
const resetForm = () => {
  formData.member_id = null
  formData.deceased_name = ''
  formData.deceased_birthdate = ''
  formData.date_death = ''
  formData.relationship = ''
  formData.location = ''
  formData.pastor_name = null
  formData.service_date = null
  formData.status = 'pending'

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
    await formRef.value.validate()

    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'

    await ElMessageBox.confirm(
      `Are you sure you want to ${actionText} this burial service?`,
      `Confirm ${actionTitle} Burial Service`,
      {
        confirmButtonText: actionTitle,
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.burial-service-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })

    const submitData = {
      member_id: String(formData.member_id).trim(),
      deceased_name: formData.deceased_name.trim(),
      deceased_birthdate: formData.deceased_birthdate || null,
      date_death: formData.date_death || null,
      relationship: formData.relationship,
      location: formData.location.trim(),
      pastor_name: formData.pastor_name ? String(formData.pastor_name).trim() : null, // pastor_name is a string or null
      service_date: (formData.service_date === null || formData.service_date === '' || !formData.service_date) ? null : formData.service_date, // Handle null, empty string, or falsy values as null
      status: formData.status
    }

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
.burial-service-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.burial-service-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.burial-service-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.required {
  color: #ef4444;
}

.required-text {
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 4px;
}

.burial-service-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.burial-service-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.burial-service-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.burial-service-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.burial-service-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.burial-service-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.burial-service-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.burial-service-dialog :deep(.el-date-editor.el-input) {
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

@media (max-width: 960px) {
  .burial-service-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto !important;
    max-height: 90vh;
  }

  .burial-service-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .burial-service-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }

  .burial-service-dialog :deep(.el-dialog__header) {
    padding: 16px;
  }

  .burial-service-dialog :deep(.el-dialog__title) {
    font-size: 1rem;
  }

  .burial-service-dialog :deep(.el-dialog__body) {
    padding: 12px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
  }

  .burial-service-dialog :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .burial-service-dialog :deep(.el-form-item__label) {
    font-size: 0.875rem;
    padding-bottom: 4px;
    line-height: 1.4;
  }

  .burial-service-dialog :deep(.el-input),
  .burial-service-dialog :deep(.el-select),
  .burial-service-dialog :deep(.el-date-editor) {
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


