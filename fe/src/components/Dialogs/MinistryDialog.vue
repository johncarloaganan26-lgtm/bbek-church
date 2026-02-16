  <template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Ministry' : 'Add Ministry'"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="ministry-dialog"
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
      <!-- Ministry Name -->
      <el-form-item label="Ministry Name" prop="ministry_name">
        <el-input
          v-model="formData.ministry_name"
          placeholder="Enter ministry name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Schedule -->
      <el-form-item label="Schedule" prop="schedule">
        <el-date-picker
          v-model="formData.schedule"
          type="datetime"
          placeholder="Select schedule date and time"
          size="large"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Leader -->
      <el-form-item label="Leader" prop="leader_id">
        <el-select
          v-model="formData.leader_id"
          placeholder="Select leader"
          size="large"
          style="width: 100%"
          clearable
          filterable
          :disabled="loading"
        >
          <el-option
            v-for="leader in leaderOptions"
            :key="leader.id"
            :label="leader.name"
            :value="leader.id"
          >
            <div class="option-item">
              <span class="option-name">{{ leader.name }}</span>
              <span v-if="leader.email" class="option-email">({{ leader.email }})</span>
              <span v-if="leader.position" class="option-position">{{ leader.position }}</span>
            </div>
          </el-option>
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
          :disabled="loading"
        >
          <el-option
            v-for="dept in departmentOptions"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
      </el-form-item>

      <!-- Members (Multi-select, searchable) -->
      <el-form-item label="Members (Optional)" prop="members">
        <el-select
          v-model="formData.members"
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
          >
            <div class="option-item">
              <span class="option-name">{{ member.name }}</span>
              <span v-if="member.email" class="option-email">({{ member.email }})</span>
              <span v-if="member.position" class="option-position">{{ member.position }}</span>
            </div>
          </el-option>
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
          <el-option label="Active" value="active" />
          <el-option label="Not Active" value="not_active" />
        </el-select>
      </el-form-item>

      <!-- Description -->
      <el-form-item label="Description" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="Enter ministry description (optional)"
          size="large"
          clearable
          maxlength="1000"
          show-word-limit
          :disabled="loading"
        />
      </el-form-item>

      <!-- Live Service Link -->
      <el-form-item label="Live Service Link" prop="link">
        <el-input
          v-model="formData.link"
          placeholder="Enter live streaming URL (YouTube Live, Facebook Live, etc.)"
          size="large"
          clearable
          :disabled="loading"
        >
          <template #prefix>
            <el-icon><VideoCamera /></el-icon>
          </template>
        </el-input>
        <div class="form-item-hint">
          Add a link to stream this ministry's live services (e.g., YouTube Live, Facebook Live)
        </div>
      </el-form-item>

      <!-- Tags -->
      <el-form-item label="Tags" prop="tags">
        <el-input
          v-model="formData.tags"
          placeholder="Enter tags separated by commas (e.g., Ministry, Worship, Teaching)"
          size="large"
          clearable
          :disabled="loading"
        >
          <template #prefix>
            <el-icon><PriceTag /></el-icon>
          </template>
        </el-input>
        <div class="form-item-hint">
          Use tags like: Ministry, Worship, Teaching, Youth, Adult
        </div>
      </el-form-item>

      <!-- Image Upload -->
      <el-form-item label="Ministry Image" prop="image">
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
              <img :src="imagePreview" alt="Ministry preview" class="image-preview" />
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
          {{ isEditMode ? 'Update' : 'Add' }} Ministry
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Upload, Delete, VideoCamera, PriceTag } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  ministryData: {
    type: Object,
    default: null
  },
  // Church leaders for leader select: [{ id, name }]
  leaderOptions: {
    type: Array,
    default: () => []
  },
  // Departments for department select: [{ id, name }]
  departmentOptions: {
    type: Array,
    default: () => []
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
const isEditMode = computed(() => !!props.ministryData)

// Form data
const formData = reactive({
  ministry_name: '',
  schedule: '',
  leader_id: null,
  department_id: null,
  members: [],
  status: 'active',
  description: '',
  image: null,
  link: '',
  tags: ''
})

// Validation rules
const rules = {
  ministry_name: [
    { required: true, message: 'Ministry name is required', trigger: 'blur' },
    { min: 2, max: 100, message: 'Ministry name must be between 2 and 100 characters', trigger: 'blur' }
  ],
  schedule: [
    // Schedule is optional (nullable in schema)
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback() // Schedule is optional
          return
        }
        const selected = new Date(value)
        const minDate = new Date()
        minDate.setFullYear(minDate.getFullYear() - 1)
        const maxDate = new Date()
        maxDate.setFullYear(maxDate.getFullYear() + 2)
        if (selected < minDate) {
          callback(new Error('Schedule is too far in the past'))
          return
        }
        if (selected > maxDate) {
          callback(new Error('Schedule is too far in the future'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  leader_id: [
    { required: true, message: 'Leader is required', trigger: 'change' }
  ],
  department_id: [
    { required: true, message: 'Department is required', trigger: 'change' }
  ],
  members: [
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
  status: [
    { required: true, message: 'Status is required', trigger: 'change' }
  ],
  description: [
    {
      validator: (rule, value, callback) => {
        if (value && value.trim().length > 1000) {
          callback(new Error('Description must not exceed 1000 characters'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  image: [
    {
      validator: (rule, value, callback) => {
        // Image is optional, but if provided, validate it
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
  ],
  link: [
    {
      validator: (rule, value, callback) => {
        if (value && value.trim().length > 500) {
          callback(new Error('Link must not exceed 500 characters'))
          return
        }
        // Basic URL validation if provided
        if (value && value.trim()) {
          try {
            new URL(value.trim())
          } catch {
            callback(new Error('Please enter a valid URL'))
            return
          }
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  tags: [
    {
      validator: (rule, value, callback) => {
        if (value && value.trim().length > 500) {
          callback(new Error('Tags must not exceed 500 characters'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// Watch for ministryData changes to populate form in edit mode
watch(
  () => props.ministryData,
  (newData) => {
    console.log('MinistryDialog - ministryData changed:', newData)
    if (newData && props.modelValue) {
      console.log('MinistryDialog - Populating form with link:', newData.link, 'tags:', newData.tags)
      formData.ministry_name = newData.ministry_name || ''
      formData.schedule = newData.schedule || ''
      formData.leader_id = newData.leader_id ?? null
      formData.department_id = newData.department_id ?? null
      formData.members = Array.isArray(newData.members) ? [...newData.members] : []
      formData.status = newData.status || 'active'
      formData.description = newData.description || ''
      formData.link = newData.link || ''
      formData.tags = newData.tags || ''
      
      // Handle existing image (base64 from API)
      if (newData && newData.image) {
        // Backend returns base64 string without data URL prefix
        // Add prefix for display if not already present
        if (newData.image.startsWith && newData.image.startsWith('data:')) {
          imagePreview.value = newData.image
        } else {
          imagePreview.value = `data:image/jpeg;base64,${newData.image}`
        }
        imageFile.value = null
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
    } else if (props.ministryData) {
      const data = props.ministryData
      formData.ministry_name = data.ministry_name || ''
      formData.schedule = data.schedule || ''
      formData.leader_id = data.leader_id ?? null
      formData.department_id = data.department_id ?? null
      formData.members = Array.isArray(data.members) ? [...data.members] : []
      formData.status = data.status || 'active'
      formData.description = data.description || ''
      formData.link = data.link || ''
      formData.tags = data.tags || ''
      
      // Handle existing image (base64 from API)
      if (data && data.image) {
        // Backend returns base64 string without data URL prefix
        // Add prefix for display if not already present
        if (data.image.startsWith && data.image.startsWith('data:')) {
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
  formData.ministry_name = ''
  formData.schedule = ''
  formData.leader_id = null
  formData.department_id = null
  formData.members = []
  formData.status = 'active'
  formData.description = ''
  formData.image = null
  formData.link = ''
  formData.tags = ''
  
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
  console.log('handleImageChange - imageFile set:', imageFile.value?.name, imageFile.value?.size, 'bytes')
  
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

// Handle submit
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'

    await ElMessageBox.confirm(
      `Are you sure you want to ${actionText} this ministry?`,
      `Confirm ${actionTitle} Ministry`,
      {
        confirmButtonText: actionTitle,
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.ministry-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })

    // Prepare submit data - send file object directly for FormData
    const submitData = {
      ministry_name: formData.ministry_name.trim(),
      schedule: formData.schedule,
      leader_id: formData.leader_id,
      department_id: parseInt(formData.department_id), // Ensure department_id is an integer
      members: [...formData.members],
      status: formData.status,
      description: formData.description ? formData.description.trim() : null,
      link: formData.link ? formData.link.trim() : null,
      tags: formData.tags ? formData.tags.trim() : null
    }

    // Include image file if a new file is selected (for FormData)
    console.log('submitForm - imageFile.value:', imageFile.value?.name, 'imagePreview.value:', imagePreview.value ? 'set' : 'null')
    if (imageFile.value) {
      // imageFile.value is already the actual File object (set in handleImageChange)
      submitData.imageFile = imageFile.value
      console.log('submitForm - added imageFile to submitData')
    } else if (imagePreview.value && !imageFile.value && isEditMode.value) {
      // Existing image (from edit mode) - extract base64 string for FormData
      let imageBase64 = null
      if (imagePreview.value.startsWith && imagePreview.value.startsWith('data:')) {
        // Extract base64 string from data URL
        imageBase64 = imagePreview.value.includes(',') 
          ? imagePreview.value.split(',')[1] 
          : imagePreview.value.replace('data:image/jpeg;base64,', '').replace('data:image/png;base64,', '').replace('data:image/gif;base64,', '').replace('data:image/webp;base64,', '')
      } else if (imagePreview.value) {
        // Already a base64 string (shouldn't happen, but handle it)
        imageBase64 = imagePreview.value
      }
      
      if (imageBase64) {
        // Pass base64 string - store will convert to blob/file for FormData
        submitData.image = imageBase64
      }
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
.ministry-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.ministry-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.ministry-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.ministry-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.ministry-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.ministry-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.ministry-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.ministry-dialog :deep(.el-date-editor.el-input) {
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

.form-item-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.4;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.option-name {
  font-weight: 500;
  color: #303133;
}

.option-email {
  font-size: 12px;
  color: #909399;
}

.option-position {
  margin-left: auto;
  font-size: 11px;
  color: #14b8a6;
  background-color: #f0fdfa;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ccfbf1;
}
</style>


