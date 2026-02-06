<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Church Leader' : 'Add Church Leader'"
    width="700px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    class="church-leader-dialog"
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

      <!-- Joined Date -->
      <el-form-item label="Joined Date" prop="joined_date">
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

      <!-- Status -->
      <el-form-item label="Status" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="Select status"
          size="large"
          style="width: 100%"
        >
          <el-option label="Active" value="active" />
          <el-option label="Inactive" value="inactive" />
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
          {{ isEditMode ? 'Update' : 'Add' }} Church Leader
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  leaderData: {
    type: Object,
    default: null
  },
  // Members for selection: [{ id, name }]
  memberOptions: {
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
const isEditMode = computed(() => !!props.leaderData)

// Form data
const formData = reactive({
  member_id: null,
  joined_date: '',
  status: 'active'
})

// Validation rules
const rules = {
  member_id: [
    { required: true, message: 'Member is required', trigger: 'change' }
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
        // Allow joined date to be in the future (for scheduled appointments)
        // But not too far in the past (more than 100 years)
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
  ],
  status: [
    { required: true, message: 'Status is required', trigger: 'change' }
  ]
}



// Watch for leaderData changes to populate form in edit mode
watch(() => props.leaderData, (newData) => {
  if (newData && props.modelValue) {
    formData.member_id = newData.member_id ?? null
    formData.joined_date = newData.joined_date || ''
    formData.status = newData.status || 'active'
  }
}, { immediate: true })

// Watch for dialog open/close to reset form
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    // Reset form when dialog closes
    resetForm()
  } else if (props.leaderData) {
    // Populate form when dialog opens in edit mode
    const data = props.leaderData
    formData.member_id = data.member_id ?? null
    formData.joined_date = data.joined_date || ''
    formData.status = data.status || 'active'
  } else {
    // Reset form for add mode
    resetForm()
  }
})

// Reset form
const resetForm = () => {
  formData.member_id = null
  formData.joined_date = ''
  formData.status = 'active'
  
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
        `Are you sure you want to ${actionText} this church leader?`,
        `Confirm ${actionTitle} Church Leader`,
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
        joined_date: formData.joined_date,
        status: formData.status
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
.church-leader-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.church-leader-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.church-leader-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.church-leader-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.church-leader-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.church-leader-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.church-leader-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.church-leader-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.church-leader-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.church-leader-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.church-leader-dialog :deep(.el-date-editor.el-input) {
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

.church-leader-dialog :deep(.el-dialog__body) {
  position: relative;
}
</style>

