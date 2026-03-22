<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Department' : 'Add Department'"
    width="600px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    class="department-dialog"
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
      <!-- Department Name -->
      <el-form-item label="Department Name" prop="department_name">
        <el-input
          v-model="formData.department_name"
          placeholder="Enter department name"
          size="large"
          clearable
        />
      </el-form-item>

      <!-- Status -->
      <el-form-item label="Status" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="Select status"
          size="large"
          style="width: 100%"
          clearable
        >
          <el-option label="Active" value="active" />
          <el-option label="Not Active" value="not_active" />
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
          {{ isEditMode ? 'Update' : 'Add' }} Department
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  departmentData: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Refs
const formRef = ref(null)
const loading = ref(false)
const loadingInstanceRef = ref(null)

// Check if in edit mode
const isEditMode = computed(() => !!props.departmentData)

// Form data
const formData = reactive({
  department_name: '',
  status: 'active'
})

// Validation rules
const rules = {
  department_name: [
    { required: true, message: 'Department name is required', trigger: 'blur' },
    { min: 2, max: 100, message: 'Department name must be between 2 and 100 characters', trigger: 'blur' }
  ],
  status: [
    { required: true, message: 'Status is required', trigger: 'change' }
  ]
}

// Reset form
const resetForm = () => {
  formData.department_name = ''
  formData.status = 'active'

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// Watch dialog open/close to reset or populate form
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
      loading.value = false // Reset loading when dialog closes
      // Close any loading overlay
      if (loadingInstanceRef.value) {
        try {
          loadingInstanceRef.value.close()
          loadingInstanceRef.value = null
        } catch (e) {
          // Ignore if already closed
          loadingInstanceRef.value = null
        }
      }
    } else if (props.departmentData) {
      const data = props.departmentData
      formData.department_name = data.department_name || ''
      formData.status = data.status || 'active'
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

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
      `Are you sure you want to ${actionText} this department?`,
      `Confirm ${actionTitle} Department`,
      {
        confirmButtonText: actionTitle,
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.department-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })

    const submitData = {
      department_name: formData.department_name.trim(),
      status: formData.status
    }

    emit('submit', submitData)
    
    // Safety timeout: reset loading after 30 seconds if still loading
    // This prevents loading state from getting stuck if parent component fails silently
    setTimeout(() => {
      if (loading.value) {
        loading.value = false
        if (loadingInstanceRef.value) {
          try {
            loadingInstanceRef.value.close()
          } catch (e) {
            // Ignore if already closed
          }
          loadingInstanceRef.value = null
        }
      }
    }, 30000)
  } catch (error) {
    // Reset loading state
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
    
    if (error !== 'cancel') {
      console.error('Validation failed or submission cancelled:', error)
      ElMessage.error('Please fill in all required fields correctly or operation cancelled.')
    }
  }
}

// Expose method to reset loading (can be called by parent component on API error)
const resetLoading = () => {
  loading.value = false
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
.department-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.department-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.department-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.department-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.department-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.department-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.department-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.department-dialog :deep(.el-date-editor.el-input) {
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
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  border-radius: 4px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #14b8a6;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}
</style>


