<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Department Officer' : 'Add Department Officer'"
    width="700px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    class="department-officers-dialog"
    @close="handleClose"
  >
    <!-- Loading Overlay -->
    <div v-if="loading" class="dialog-loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p class="loading-text">Processing...</p>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      label-position="left"
      :disabled="loading"
    >
      <!-- Member -->
      <el-form-item label="Member" prop="member_id">
        <el-select
          v-model="formData.member_id"
          placeholder="Select member"
          size="large"
          style="width: 100%"
          clearable
          filterable
        >
          <el-option
            v-for="member in memberOptions"
            :key="member.id"
            :label="member.name"
            :value="member.id"
          />
        </el-select>
      </el-form-item>

      <!-- Department -->
      <el-form-item label="Department" prop="department_id">
        <el-select
          v-model="formData.department_id"
          placeholder="Select department"
          size="large"
          style="width: 100%"
          clearable
          filterable
        >
          <el-option
            v-for="dept in departmentOptions"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
      </el-form-item>

      <!-- Role -->
      <el-form-item label="Role" prop="role">
        <el-select
          v-model="formData.role"
          placeholder="Select role"
          size="large"
          style="width: 100%"
          clearable
        >
          <el-option label="President" value="President" />
          <el-option label="Vice President" value="Vice President" />
          <el-option label="Secretary" value="Secretary" />
          <el-option label="Assistant Secretary" value="Assistant Secretary" />
          <el-option label="Treasurer" value="Treasurer" />
          <el-option label="Auditor" value="Auditor" />
          <el-option label="Coordinator" value="Coordinator" />
          <el-option label="PIO" value="PIO" />
          <el-option label="Social Media Coordinator" value="Social Media Coordinator" />
        </el-select>
      </el-form-item>

      <!-- Status -->
      <el-form-item label="Status" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="Select status"
          size="large"
          style="width: 100%"
        >
          <el-option label="Active" value="Active" />
          <el-option label="Inactive" value="Inactive" />
        </el-select>
      </el-form-item>

      <!-- Date Created -->
      <el-form-item label="Date Created" prop="joined_date">
        <el-date-picker
          v-model="formData.joined_date"
          type="datetime"
          placeholder="Select joined date and time"
          size="large"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>

      <!-- Bio -->
      <el-form-item label="Bio" prop="bio">
        <el-input
          v-model="formData.bio"
          type="textarea"
          :rows="4"
          placeholder="Enter officer biography"
          size="large"
          style="width: 100%"
        />
      </el-form-item>

      <!-- Image -->
      <el-form-item label="Profile Image" prop="image">
        <div class="image-upload-container">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            @change="handleImageChange"
          >
            <img v-if="formData.image" :src="formData.image" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div v-if="formData.image" class="image-actions">
            <el-button type="danger" size="small" @click="formData.image = null">Remove Image</el-button>
          </div>
        </div>
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
          {{ isEditMode ? 'Update' : 'Add' }} Department Officer
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  officerData: {
    type: Object,
    default: null
  },
  // Members for selection: [{ id, name }]
  memberOptions: {
    type: Array,
    default: () => []
  },
  // Departments for selection: [{ id, name }]
  departmentOptions: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'submit'])

// Refs
const formRef = ref(null)
const loading = ref(false)

// Check if in edit mode
const isEditMode = computed(() => !!props.officerData)

// Form data
const formData = reactive({
  member_id: null,
  department_id: null,
  role: '',
  status: 'Active',
  joined_date: '',
  bio: '',
  image: null
})

// Validation rules
const rules = {
  member_id: [
    { required: true, message: 'Member is required', trigger: 'change' }
  ],
  department_id: [
    { required: true, message: 'Department is required', trigger: 'change' }
  ],
  role: [
    { required: true, message: 'Role is required', trigger: 'blur' }
  ],
  joined_date: [
    { required: true, message: 'Joined date is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('Joined date is required'))
          return
        }
        const selectedDate = new Date(value)
        const today = new Date()
        // Allow joined date to be in the future, but not more than 100 years in the past
        const minDate = new Date()
        minDate.setFullYear(today.getFullYear() - 100)
        if (selectedDate < minDate) {
          callback(new Error('Joined date is too far in the past'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}


// Watch for officerData changes to populate form in edit mode
watch(() => props.officerData, (newData) => {
  if (newData && props.modelValue) {
    formData.member_id = newData.member_id ?? null
    formData.department_id = newData.department_id ?? null
    formData.role = newData.role || ''
    formData.status = newData.status || 'Active'
    formData.joined_date = newData.joined_date || ''
    formData.bio = newData.bio || ''
    formData.image = newData.image || null
  }
}, { immediate: true })

// Watch for dialog open/close to reset or populate form
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    // Reset form when dialog closes
    resetForm()
  } else if (props.officerData) {
    // Populate form when dialog opens in edit mode
    const data = props.officerData
    formData.member_id = data.member_id ?? null
    formData.department_id = data.department_id ?? null
    formData.role = data.role || ''
    formData.joined_date = data.joined_date || ''
    formData.bio = data.bio || ''
    formData.image = data.image || null
  } else {
    // Reset form for add mode
    resetForm()
  }
})

// Reset form
const resetForm = () => {
  formData.member_id = null
  formData.department_id = null
  formData.role = ''
  formData.status = 'Active'
  formData.joined_date = ''
  formData.bio = ''
  formData.image = null

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
    
    // Show confirmation dialog before submitting
    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'
    
    try {
      await ElMessageBox.confirm(
        `Are you sure you want to ${actionText} this department officer?`,
        `Confirm ${actionTitle} Department Officer`,
        {
          confirmButtonText: actionTitle,
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
      )
      
      // User confirmed, proceed with submission
      loading.value = true

      // Prepare data for submission
      const submitData = {
        member_id: formData.member_id,
        department_id: formData.department_id,
        role: formData.role,
        status: formData.status,
        joined_date: formData.joined_date,
        bio: formData.bio,
        image: formData.image
      }

      // Emit submit event with data
      emit('submit', submitData)
      
      // Safety timeout: reset loading after 30 seconds if still loading
      // This prevents loading state from getting stuck if parent component fails silently
      setTimeout(() => {
        if (loading.value) {
          loading.value = false
        }
      }, 30000)
      
    } catch (confirmError) {
      // User cancelled the confirmation dialog
      if (confirmError === 'cancel') {
        // Do nothing, user cancelled
        return
      }
      throw confirmError
    }
    
  } catch (error) {
    // Validation failed or other error
    if (error !== 'cancel') {
      console.error('Validation failed:', error)
      ElMessage.error('Please fill in all required fields correctly')
    }
  } finally {
    loading.value = false
  }
}

// Handle image change
const handleImageChange = (file) => {
  if (!file || !file.raw) return
  
  const isImage = file.raw.type.startsWith('image/')
  const isLt2M = file.raw.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('Avatar picture must be image format!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('Avatar picture size can not exceed 2MB!')
    return false
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    formData.image = e.target.result
  }
  reader.readAsDataURL(file.raw)
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
.department-officers-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.department-officers-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.department-officers-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.department-officers-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.department-officers-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.department-officers-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.department-officers-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.department-officers-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.department-officers-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.department-officers-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.department-officers-dialog :deep(.el-date-editor.el-input) {
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

.dialog-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 4px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  position: relative;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #14b8a6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dialog-loading-overlay .loading-text {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

.department-officers-dialog :deep(.el-dialog__body) {
  position: relative;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: #14b8a6;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.image-upload-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>


