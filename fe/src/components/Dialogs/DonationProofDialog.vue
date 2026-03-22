<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Submit Donation Proof"
    width="650px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    class="donation-proof-dialog"
    @close="handleClose"
    destroy-on-close
  >
    <!-- Loading Overlay -->
    <div v-if="loading" class="dialog-loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p class="loading-text">Submitting your donation...</p>
    </div>

    <!-- Success State -->
    <div v-if="submitted" class="success-state">
      <div class="success-icon-wrapper">
        <svg class="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="11" stroke="#14b8a6" stroke-width="2"/>
          <path d="M7 12.5L10 15.5L17 8.5" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="success-title">Donation Confirmed!</h3>
      <p class="success-message">
        Thank you for your generous donation. Your donation has been received and confirmed.
        A confirmation email has been sent. The admin may publish a transparency proof later.
      </p>
      <el-button type="primary" size="large" @click="handleClose" class="success-btn">
        Close
      </el-button>
    </div>

    <!-- Form -->
    <el-form
      v-else
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="150px"
      label-position="top"
      :disabled="loading"
      class="donation-form"
    >
      <!-- Info Banner -->
      <div class="info-banner">
        <div class="info-icon">ℹ️</div>
        <p>After sending your donation via GCash or Maya, upload a screenshot of your receipt below.</p>
      </div>

      <!-- Donor Name & Anonymous Toggle -->
      <el-form-item label="Your Name" prop="donor_name">
        <el-input
          v-model="formData.donor_name"
          placeholder="Enter your full name"
          size="large"
          :disabled="formData.is_anonymous"
          clearable
        >
          <template #prefix>
            <span style="font-size: 16px;">👤</span>
          </template>
        </el-input>
        <div class="form-hint">
          <el-checkbox v-model="formData.is_anonymous" @change="handleAnonymousChange">
            I prefer to donate anonymously
          </el-checkbox>
        </div>
      </el-form-item>

      <!-- Amount -->
      <el-form-item label="Donation Amount (₱)" prop="amount">
        <el-input-number
          v-model="formData.amount"
          :min="1"
          :max="100000000"
          :step="100"
          :precision="2"
          size="large"
          style="width: 100%"
          placeholder="0.00"
          controls-position="right"
        />
      </el-form-item>

      <!-- Donation Type -->
      <el-form-item label="Donation Type" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="Select donation type"
          size="large"
          style="width: 100%"
        >
          <el-option label="Tithe" value="tithe">
            <span>Tithe</span>
            <span class="option-desc">- 10% of income</span>
          </el-option>
          <el-option label="Offering" value="offering">
            <span>Offering</span>
            <span class="option-desc">- General offering</span>
          </el-option>
          <el-option label="Missions" value="missions">
            <span>Missions</span>
            <span class="option-desc">- Mission work support</span>
          </el-option>
          <el-option label="Love Gift" value="love_gift">
            <span>Love Gift</span>
            <span class="option-desc">- Special occasions</span>
          </el-option>
          <el-option label="Building Fund" value="building_fund">
            <span>Building Fund</span>
            <span class="option-desc">- Church building</span>
          </el-option>
          <el-option label="Donation" value="donation">
            <span>Donation</span>
            <span class="option-desc">- General donation</span>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- Payment Method -->
      <el-form-item label="Payment Method" prop="donation_method">
        <el-radio-group v-model="formData.donation_method" size="large" class="payment-method-group">
          <el-radio-button value="gcash">
            <span class="method-label">GCash</span>
          </el-radio-button>
          <el-radio-button value="maya">
            <span class="method-label">Maya</span>
          </el-radio-button>
          <el-radio-button value="others">
            <span class="method-label">Others</span>
          </el-radio-button>
        </el-radio-group>
        <el-input
          v-if="formData.donation_method === 'others'"
          v-model="formData.donation_method_other"
          placeholder="Specify payment method"
          size="large"
          class="mt-2"
          clearable
        />
      </el-form-item>

      <!-- Proof Image Upload -->
      <el-form-item label="Receipt Screenshot" prop="proof_image" class="upload-form-item">
        <div class="upload-area" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            style="display: none;"
          />
          
          <!-- Preview -->
          <div v-if="imagePreview" class="image-preview-wrapper">
            <img :src="imagePreview" alt="Receipt Preview" class="image-preview" />
            <div class="image-overlay">
              <el-button type="danger" size="small" circle @click.stop="removeImage">
                <span style="font-size: 14px;">✕</span>
              </el-button>
            </div>
          </div>
          
          <!-- Upload Placeholder -->
          <div v-else class="upload-placeholder">
            <div class="upload-icon">📷</div>
            <p class="upload-text">Click or drag your receipt screenshot here</p>
            <p class="upload-hint">Supports: JPG, PNG, WEBP (max 10MB)</p>
          </div>
        </div>
      </el-form-item>

      <!-- Donor Email -->
      <el-form-item label="Email Address" prop="email">
        <el-input 
          v-model="formData.email" 
          placeholder="Enter your email to receive confirmation"
          type="email"
          size="large"
        >
          <template #prefix>
            <span style="font-size: 16px;">✉️</span>
          </template>
        </el-input>
        <div class="form-hint">Confirmation and receipt will be sent here</div>
      </el-form-item>

      <!-- Donation Date -->
      <el-form-item label="Date of Donation" prop="donation_date">
        <el-date-picker
          v-model="formData.donation_date"
          type="date"
          placeholder="Select donation date"
          size="large"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <!-- Notes -->
      <el-form-item label="Notes (Optional)" prop="notes">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="2"
          placeholder="Any additional notes or comments"
          size="large"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer v-if="!submitted">
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large" :disabled="loading">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          size="large"
          :loading="loading"
          :disabled="loading"
          class="submit-btn"
        >
          <span v-if="!loading">🙏</span>
          Submit Donation Proof
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '@/api/axios'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'submitted'])

// Refs
const formRef = ref(null)
const fileInputRef = ref(null)
const loading = ref(false)
const submitted = ref(false)
const imagePreview = ref(null)

// Form data
const formData = reactive({
  donor_name: '',
  is_anonymous: false,
  email: '', // Added email field
  amount: 0, // Changed from null to 0
  type: 'tithe', // Changed from 'donation' to 'tithe'
  donation_method: 'gcash',
  donation_method_other: '',
  proof_image: null,
  proof_image_type: null,
  notes: '',
  donation_date: new Date().toISOString().split('T')[0]
})

// Validation rules
const rules = {
  donor_name: [
    {
      validator: (rule, value, callback) => {
        if (!formData.is_anonymous && (!value || value.trim() === '')) {
          callback(new Error('Please enter your name or choose to donate anonymously'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [ // Added email validation rules
    { required: true, message: 'Email is required for confirmation', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
  ],
  amount: [
    { required: true, message: 'Please enter the donation amount', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value <= 0) {
          callback(new Error('Amount must be greater than 0'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  type: [
    { required: true, message: 'Please select a donation type', trigger: 'change' }
  ],
  donation_method: [
    { required: true, message: 'Please select a payment method', trigger: 'change' }
  ],
  proof_image: [
    {
      validator: (rule, value, callback) => {
        if (!formData.proof_image) {
          callback(new Error('Please upload a screenshot of your payment receipt'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// Disable future dates
const disabledDate = (time) => {
  return time.getTime() > Date.now()
}

// Handle anonymous toggle
const handleAnonymousChange = (val) => {
  if (val) {
    formData.donor_name = ''
  }
}

// Trigger file input
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// Handle file selection
const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    processFile(file)
  }
}

// Handle drag and drop
const handleDrop = (event) => {
  const file = event.dataTransfer.files?.[0]
  if (file) {
    processFile(file)
  }
}

// Process the selected file
const processFile = (file) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('Please upload an image file (JPG, PNG, WEBP, or GIF)')
    return
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('File size must be less than 10MB')
    return
  }

  // Read file as base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target.result
    imagePreview.value = dataUrl
    formData.proof_image = dataUrl
    formData.proof_image_type = file.type
    
    // Manually trigger validation for proof_image
    if (formRef.value) {
      formRef.value.validateField('proof_image')
    }
  }
  reader.readAsDataURL(file)
}

// Remove uploaded image
const removeImage = () => {
  imagePreview.value = null
  formData.proof_image = null
  formData.proof_image_type = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Reset form
const resetForm = () => {
  formData.donor_name = ''
  formData.is_anonymous = false
  formData.email = '' // Reset email field
  formData.amount = 0 // Reset amount to 0
  formData.type = 'tithe' // Reset type to 'tithe'
  formData.donation_method = 'gcash'
  formData.donation_method_other = ''
  formData.proof_image = null
  formData.proof_image_type = null
  formData.notes = ''
  formData.donation_date = new Date().toISOString().split('T')[0]
  imagePreview.value = null
  submitted.value = false
  loading.value = false

  if (formRef.value) {
    formRef.value.clearValidate()
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Handle close
const handleClose = () => {
  resetForm()
  emit('update:modelValue', false)
}

// Handle submit
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // Show confirmation
    const amount = parseFloat(formData.amount || 0).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP'
    })

    await ElMessageBox.confirm(
      `Are you sure you want to submit this donation proof?\n\nAmount: ${amount}\nMethod: ${formData.donation_method === 'others' ? formData.donation_method_other : formData.donation_method.toUpperCase()}`,
      'Confirm Submission',
      {
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    )

    loading.value = true

    const submitData = {
      donor_name: formData.is_anonymous ? null : formData.donor_name.trim(),
      is_anonymous: formData.is_anonymous,
      amount: parseFloat(formData.amount),
      type: formData.type,
      donation_method: formData.donation_method,
      donation_method_other: formData.donation_method === 'others' ? formData.donation_method_other : null,
      proof_image: formData.proof_image,
      proof_image_type: formData.proof_image_type,
      notes: formData.notes.trim() || null,
      donation_date: formData.donation_date,
      // Ensure email is trimmed
      email: formData.email.trim()
    }
    
    console.log('🚀 [Frontend] Submitting Donation Payload:', submitData)

    const response = await axios.post(
      '/church-records/tithes/submitOnlineDonation',
      submitData)

    if (response.data.success) {
      submitted.value = true
      emit('submitted', response.data.data)
    }
  } catch (error) {
    if (error === 'cancel') return
    
    if (error?.response?.data?.errors) {
      // Server validation errors are already displayed via axios interceptor
    } else if (error?.response?.data?.message) {
      // Already displayed via axios interceptor
    } else if (error?.message && !error.response) {
      // Validation error from el-form
      ElMessage.warning('Please fill in all required fields correctly')
    }
  } finally {
    loading.value = false
  }
}

// Watch dialog open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      // Delay reset to avoid visual flicker
      setTimeout(() => {
        resetForm()
      }, 300)
    } else {
      // Auto-fill from logged in user
      try {
        const userInfoStr = localStorage.getItem('userInfo')
        if (userInfoStr) {
          const rawUser = JSON.parse(userInfoStr)
          // userInfo might be { account: {...}, member: {...} } or just flat object
          // prioritizing member info, then account info, then raw object
          const user = rawUser.member || rawUser.account || rawUser
          
          // Pre-fill Name
          if (!formData.donor_name) {
            const firstName = user.firstname || user.first_name || ''
            const lastName = user.lastname || user.last_name || ''
            
            if (firstName || lastName) {
              formData.donor_name = `${firstName} ${lastName}`.trim()
            } else if (user.name) {
              formData.donor_name = user.name
            } else if (user.member_name) {
              formData.donor_name = user.member_name
            } else if (rawUser.account && rawUser.account.username) {
              // Fallback to username if no name found
              formData.donor_name = rawUser.account.username
            }
          }
          
          // Pre-fill Email
          if (!formData.email) {
            if (user.email) {
              formData.email = user.email
            } else if (user.contact_email) {
              formData.email = user.contact_email
            } else if (rawUser.account && rawUser.account.email) {
               formData.email = rawUser.account.email
            }
          }
        }
      } catch (err) {
        console.error('Error auto-filling user info:', err)
      }
    }
  }
)
</script>

<style scoped>
.donation-proof-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
  max-height: 70vh;
  overflow-y: auto;
  position: relative;
}

.donation-proof-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  padding: 16px 24px;
  margin: 0;
}

.donation-proof-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.donation-proof-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: #e0f7fa;
  border: 1px solid #80deea;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 20px;
}

.info-banner .info-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.info-banner p {
  margin: 0;
  font-size: 13px;
  color: #00695c;
  line-height: 1.5;
}

.donation-proof-dialog :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 13px;
}

.donation-proof-dialog :deep(.el-input__wrapper),
.donation-proof-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.donation-proof-dialog :deep(.el-input.is-focus .el-input__wrapper),
.donation-proof-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.payment-method-group {
  width: 100%;
}

.payment-method-group :deep(.el-radio-button) {
  flex: 1;
}

.payment-method-group :deep(.el-radio-button__inner) {
  width: 100%;
  border-radius: 0;
}

.payment-method-group :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 8px 0 0 8px;
}

.payment-method-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 8px 8px 0;
}

.payment-method-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #14b8a6;
  border-color: #14b8a6;
  box-shadow: -1px 0 0 0 #14b8a6;
}

.method-label {
  font-weight: 500;
}

.mt-2 {
  margin-top: 8px;
}

/* Upload Area */
.upload-area {
  width: 100%;
  min-height: 160px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.upload-area:hover {
  border-color: #14b8a6;
  background-color: #f0fdfa;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  min-height: 160px;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 10px;
  opacity: 0.7;
}

.upload-text {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.upload-hint {
  color: #9ca3af;
  font-size: 12px;
  margin: 0;
}

.image-preview-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  min-height: 160px;
}

.image-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
}

.image-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* Form Hint */
.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.option-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
  min-width: 120px;
}

.submit-btn {
  background-color: #14b8a6 !important;
  border-color: #14b8a6 !important;
}

.submit-btn:hover {
  background-color: #0d9488 !important;
  border-color: #0d9488 !important;
}

/* Loading Overlay */
.dialog-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
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

.loading-text {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

/* Success State */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.success-icon-wrapper {
  width: 72px;
  height: 72px;
  margin-bottom: 20px;
  animation: scaleIn 0.5s ease-out;
}

.success-icon {
  width: 100%;
  height: 100%;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title {
  font-size: 20px;
  font-weight: 700;
  color: #0d9488;
  margin-bottom: 12px;
}

.success-message {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  max-width: 400px;
  margin-bottom: 24px;
}

.success-btn {
  background-color: #14b8a6 !important;
  border-color: #14b8a6 !important;
  border-radius: 8px !important;
  min-width: 120px;
}

.success-btn:hover {
  background-color: #0d9488 !important;
  border-color: #0d9488 !important;
}
</style>
