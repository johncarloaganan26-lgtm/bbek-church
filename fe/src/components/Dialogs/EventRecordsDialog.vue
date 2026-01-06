<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Event' : 'Add Event'"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="event-records-dialog"
    @close="handleClose"
    v-loading="loading"
    element-loading-text="Processing..."
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="150px"
      label-position="left"
    >
      <!-- Title -->
      <el-form-item label="Title" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="Enter event title"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Description -->
      <el-form-item label="Description" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="Enter event description"
          size="large"
          clearable
          maxlength="500"
          show-word-limit
          :disabled="loading"
        />
      </el-form-item>

      <!-- Start Date -->
      <el-form-item label="Start Date & Time" prop="start_date">
        <el-date-picker
          v-model="formData.start_date"
          type="datetime"
          placeholder="Select start date and time"
          size="large"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- End Date -->
      <el-form-item label="End Date & Time" prop="end_date">
        <el-date-picker
          v-model="formData.end_date"
          type="datetime"
          placeholder="Select end date and time"
          size="large"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Location -->
      <el-form-item label="Location" prop="location">
        <el-input
          v-model="formData.location"
          placeholder="Enter event location"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Link (optional) -->
      <el-form-item label="Live Link" prop="link">
        <el-input
          v-model="formData.link"
          placeholder="Enter live stream link (optional)"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Type -->
      <el-form-item label="Type" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="Select event type"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
        >
          <el-option
            v-for="opt in typeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
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
          clearable
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

      <!-- Members (Optional) -->
      <el-form-item label="Members (Optional)" prop="joined_members">
        <el-select
          v-model="formData.joined_members"
          placeholder="Select members"
          size="large"
          style="width: 100%"
          clearable
          filterable
          multiple
          collapse-tags
          collapse-tags-tooltip
          :reserve-keyword="false"
          :disabled="loading"
        >
          <el-option
            v-for="member in memberOptions"
            :key="member.id"
            :label="member.name"
            :value="member.id"
          />
        </el-select>
      </el-form-item>

      <!-- Image Upload -->
      <el-form-item label="Event Image" prop="image">
        <div class="image-upload-container">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            :before-upload="beforeImageUpload"
            accept="image/*"
            :disabled="loading"
            class="image-uploader"
          >
            <el-button type="primary" size="large" :disabled="loading">
              <el-icon><Upload /></el-icon>
              Choose Image
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                Supported formats: JPG, PNG, GIF, WEBP (Max 10MB)
              </div>
            </template>
          </el-upload>
          
          <!-- Image Preview -->
          <div v-if="imagePreview" class="image-preview-container">
            <div class="image-preview-wrapper">
              <img :src="imagePreview" alt="Event preview" class="image-preview" />
              <div class="image-preview-overlay">
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="removeImage"
                  :disabled="loading"
                />
              </div>
            </div>
            <div v-if="imageFile" class="image-info">
              <span class="image-name">{{ imageFile.name }}</span>
              <span class="image-size">({{ formatFileSize(imageFile.size) }})</span>
            </div>
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
          {{ isEditMode ? 'Update' : 'Add' }} Event
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Upload, Delete } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  eventRecordsData: {
    type: Object,
    default: null
  },
  // Members for multi-select: [{ id, name }]
  memberOptions: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'submit'])

// Refs
const formRef = ref(null)
const uploadRef = ref(null)
const loading = ref(false)
const loadingInstanceRef = ref(null)
const imageFile = ref(null)
const imagePreview = ref(null)

// Check if in edit mode
const isEditMode = computed(() => !!props.eventRecordsData)

// Type options (event categories)
const typeOptions = [
  { label: 'Worship Service', value: 'worship_service' },
  { label: 'Prayer Meeting', value: 'prayer_meeting' },
  { label: 'Bible Study', value: 'bible_study' },
  { label: 'Youth Fellowship', value: 'youth_fellowship' },
  { label: 'Conference', value: 'conference' },
  { label: 'Seminar / Training', value: 'seminar' },
  { label: 'Outreach', value: 'outreach' },
  { label: 'Sermon', value: 'sermon' },
  { label: 'Other', value: 'other' }
]

// Status options - standardized: pending, approved, completed, cancelled
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

// Form data
const formData = reactive({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  location: '',
  link: '',
  type: '',
  status: 'pending',
  joined_members: [],
  image: null
})

// Validation rules
const rules = {
  title: [
    { required: true, message: 'Title is required', trigger: 'blur' },
    { min: 3, max: 45, message: 'Title must be between 3 and 45 characters', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },
    { min: 10, max: 1000, message: 'Description must be between 10 and 500 characters', trigger: 'blur' }
  ],
  start_date: [
    { required: true, message: 'Start date is required', trigger: 'change' }
  ],
  end_date: [
    { required: true, message: 'End date is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('End date is required'))
          return
        }
        if (!formData.start_date) {
          callback()
          return
        }
        const start = new Date(formData.start_date)
        const end = new Date(value)
        if (end < start) {
          callback(new Error('End date cannot be before start date'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  location: [
    { required: true, message: 'Location is required', trigger: 'blur' },
    { min: 3, max: 45, message: 'Location must be between 3 and 45 characters', trigger: 'blur' }
  ],
  link: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/
        if (!urlPattern.test(value)) {
          callback(new Error('Please enter a valid URL'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  type: [
    { required: true, message: 'Event type is required', trigger: 'change' }
  ],
  status: [
    { required: true, message: 'Status is required', trigger: 'change' }
  ],
  joined_members: [
    {
      validator: (rule, value, callback) => {
        // Members are optional - allow empty array or no selection
        if (!value || (Array.isArray(value) && value.length === 0)) {
          callback() // Empty is fine
          return
        }
        if (!Array.isArray(value)) {
          callback(new Error('Members must be an array'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  image: [
    {
      validator: (rule, value, callback) => {
        // Image is optional, but if provided, validate it
        if (!imageFile.value && !imagePreview.value) {
          callback() // No image is fine
          return
        }
        
        if (imageFile.value) {
          // Check file size (10MB = 10 * 1024 * 1024 bytes)
          const maxSize = 10 * 1024 * 1024
          if (imageFile.value.size > maxSize) {
            callback(new Error('Image size must be less than 10MB'))
            return
          }
          
          // Check file type (imageFile.value is already the actual File object)
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
          if (!allowedTypes.includes(imageFile.value.type)) {
            callback(new Error('Only JPG, PNG, GIF, and WEBP images are allowed'))
            return
          }
        }
        
        callback()
      },
      trigger: 'change'
    }
  ]
}

// Watch for eventRecordsData changes to populate form in edit mode
watch(
  () => props.eventRecordsData,
  (newData) => {
    if (newData && props.modelValue) {
      formData.title = newData.title || ''
      formData.description = newData.description || ''
      formData.start_date = newData.start_date || ''
      formData.end_date = newData.end_date || ''
      formData.location = newData.location || ''
      formData.link = newData.link || ''
      formData.type = newData.type || ''
      formData.status = newData.status || 'pending'
      
      // Handle joined_members (parse JSON string to array if needed)
      if (newData.joined_members) {
        if (Array.isArray(newData.joined_members)) {
          formData.joined_members = [...newData.joined_members]
        } else if (typeof newData.joined_members === 'string') {
          try {
            formData.joined_members = JSON.parse(newData.joined_members)
          } catch (e) {
            formData.joined_members = []
          }
        } else {
          formData.joined_members = []
        }
      } else {
        formData.joined_members = []
      }
      
      // Handle existing image (base64 from API)
      if (newData.image) {
        imagePreview.value = `data:image/jpeg;base64,${newData.image}`
        imageFile.value = null // No new file selected
      } else {
        imagePreview.value = null
        imageFile.value = null
      }
    }
  },
  { immediate: true }
)

// Watch dialog open/close to reset or populate form
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
      resetLoading() // Reset loading when dialog closes
    } else if (props.eventRecordsData) {
      const data = props.eventRecordsData
      formData.title = data.title || ''
      formData.description = data.description || ''
      formData.start_date = data.start_date || ''
      formData.end_date = data.end_date || ''
      formData.location = data.location || ''
      formData.link = data.link || ''
      formData.type = data.type || ''
      formData.status = data.status || 'pending'
      
      // Handle joined_members (parse JSON string to array if needed)
      if (data.joined_members) {
        if (Array.isArray(data.joined_members)) {
          formData.joined_members = [...data.joined_members]
        } else if (typeof data.joined_members === 'string') {
          try {
            formData.joined_members = JSON.parse(data.joined_members)
          } catch (e) {
            formData.joined_members = []
          }
        } else {
          formData.joined_members = []
        }
      } else {
        formData.joined_members = []
      }
      
      // Handle existing image (base64 from API)
      if (data.image) {
        // Backend returns base64 string without data URL prefix
        // Add prefix for display if not already present
        if (data.image.startsWith('data:')) {
          imagePreview.value = data.image
        } else {
          imagePreview.value = `data:image/jpeg;base64,${data.image}`
        }
        imageFile.value = null
      } else {
        imagePreview.value = null
        imageFile.value = null
      }
    } else {
      resetForm()
    }
  }
)

// Reset form
const resetForm = () => {
  formData.title = ''
  formData.description = ''
  formData.start_date = ''
  formData.end_date = ''
  formData.location = ''
  formData.link = ''
  formData.type = ''
  formData.status = 'pending'
  formData.joined_members = []
  formData.image = null
  
  imageFile.value = null
  imagePreview.value = null

  if (formRef.value) {
    formRef.value.clearValidate()
  }
  
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// Handle close
const handleClose = () => {
  emit('update:modelValue', false)
}

// Handle image file change
const handleImageChange = (file) => {
  // Get the actual File object from the upload component
  const actualFile = file.raw || file
  
  // Validate file size
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (actualFile.size > maxSize) {
    ElMessage.error('Image size must be less than 10MB')
    imageFile.value = null
    imagePreview.value = null
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    return
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(actualFile.type)) {
    ElMessage.error('Only JPG, PNG, GIF, and WEBP images are allowed')
    imageFile.value = null
    imagePreview.value = null
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    return
  }
  
  // Store the actual File object
  imageFile.value = actualFile
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(actualFile)
  
  // Trigger validation
  if (formRef.value) {
    formRef.value.validateField('image')
  }
}

// Before image upload validation
const beforeImageUpload = (file) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('Only JPG, PNG, GIF, and WEBP images are allowed')
    return false
  }
  
  if (file.size > maxSize) {
    ElMessage.error('Image size must be less than 10MB')
    return false
  }
  
  return true
}

// Remove image
const removeImage = () => {
  imageFile.value = null
  imagePreview.value = null
  formData.image = null
  
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  
  // Trigger validation
  if (formRef.value) {
    formRef.value.validateField('image')
  }
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Convert image file to base64
const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove data URL prefix if present
      const base64String = reader.result.includes(',') 
        ? reader.result.split(',')[1] 
        : reader.result
      resolve(base64String)
    }
    reader.onerror = reject
    reader.readAsDataURL(file.raw || file)
  })
}

// Handle submit
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'

    await ElMessageBox.confirm(
      `Are you sure you want to ${actionText} this event?`,
      `Confirm ${actionTitle} Event`,
      {
        confirmButtonText: actionTitle,
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.event-records-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })

    // Prepare submit data - send file object directly for FormData
    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      location: formData.location.trim(),
      link: formData.link ? formData.link.trim() : null,
      type: formData.type,
      status: formData.status,
      joined_members: Array.isArray(formData.joined_members) && formData.joined_members.length > 0 
        ? formData.joined_members 
        : []
    }

    // Include image file if a new file is selected (for FormData)
    if (imageFile.value) {
      // imageFile.value is already the actual File object (set in handleImageChange)
      submitData.imageFile = imageFile.value
    } else if (imagePreview.value && !imageFile.value && isEditMode.value) {
      // Existing image (from edit mode) - extract base64 string for FormData
      let imageBase64 = null
      if (imagePreview.value.startsWith('data:')) {
        // Extract base64 string from data URL
        imageBase64 = imagePreview.value.includes(',') 
          ? imagePreview.value.split(',')[1] 
          : imagePreview.value.replace('data:image/jpeg;base64,', '').replace('data:image/png;base64,', '').replace('data:image/gif;base64,', '').replace('data:image/webp;base64,', '')
      } else {
        // Already a base64 string (shouldn't happen, but handle it)
        imageBase64 = imagePreview.value
      }
      
      if (imageBase64) {
        // Pass base64 string - store will convert to blob/file for FormData
        submitData.image = imageBase64
      }
    } else if (!isEditMode.value) {
      // For create, image is required
      ElMessage.error('Image is required. Please upload an event image.')
      resetLoading()
      return
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
.event-records-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.event-records-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.event-records-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.event-records-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.event-records-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.event-records-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.event-records-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.event-records-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.event-records-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.event-records-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.event-records-dialog :deep(.el-date-editor.el-input) {
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

.image-upload-container {
  width: 100%;
}

.image-uploader {
  width: 100%;
}

.image-uploader :deep(.el-upload) {
  width: 100%;
}

.image-uploader :deep(.el-button) {
  width: 100%;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
  display: block;
}

.image-preview-container {
  margin-top: 16px;
  width: 100%;
}

.image-preview-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

.image-preview {
  width: 100%;
  height: auto;
  display: block;
  max-height: 300px;
  object-fit: contain;
}

.image-preview-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview-wrapper:hover .image-preview-overlay {
  opacity: 1;
}

.image-info {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.image-size {
  font-size: 12px;
  color: #909399;
}
</style>


