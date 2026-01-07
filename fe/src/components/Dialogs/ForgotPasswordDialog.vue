<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="false"
    class="forgot-password-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="logo-section">
          <el-image
            src="/img/logobbek.png"
            alt="BBEK Logo"
            class="logo-image"
            fit="contain"
          ></el-image>
          <div class="logo-text">
            <h2 class="logo-title">BBEK</h2>
            <p class="logo-subtitle">Bible Baptist Ekklesia of Kawit</p>
          </div>
        </div>
        <el-button
          text
          circle
          @click="closeDialog"
          class="close-btn"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </template>

    <el-form
      ref="forgotPasswordFormRef"
      :model="forgotPasswordForm"
      :rules="rules"
      label-position="top"
      size="large"
      @submit.prevent="handleForgotPassword"
    >
      <div class="form-header">
        <h2 class="form-title">Forgot Password</h2>
        <p class="form-subtitle">Enter your email address and we'll send you a link to reset your password</p>
      </div>

      <el-form-item label="Email" prop="email">
        <el-input
          v-model="forgotPasswordForm.email"
          type="email"
          placeholder="Enter your email"
          clearable
        >
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item>
        <el-button
          type="success"
          class="submit-btn"
          :loading="loading"
          native-type="submit"
        >
          Send Reset Link
        </el-button>
      </el-form-item>

      <div class="form-footer">
        <el-link
          type="primary"
          :underline="false"
          @click="handleBackToLogin"
        >
          <el-icon><ArrowLeft /></el-icon>
          Back to Login
        </el-link>
      </div>
    </el-form>

    <!-- Success/Error Message Popup -->
    <el-dialog
      v-model="successDialog.show"
      width="450px"
      center
      :show-close="false"
      :class="['success-dialog', successDialog.isError ? 'error-dialog' : '']"
    >
      <div class="text-center">
        <div :class="['success-icon-container', 'mb-4', successDialog.isError ? 'error-icon-container' : '']">
          <el-icon v-if="successDialog.isError" size="48" color="#f56c6c"><CircleCloseFilled /></el-icon>
          <el-icon v-else size="48" color="#67c23a"><CircleCheckFilled /></el-icon>
        </div>
        <h3 class="text-h6 font-weight-bold mb-2">{{ successDialog.title }}</h3>
        <p class="text-body-2">{{ successDialog.message }}</p>
      </div>
      <template #footer>
        <el-button :type="successDialog.isError ? 'danger' : 'success'" @click="closeSuccessDialog">OK</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Close, Message, ArrowLeft, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useAccountsStore } from '@/stores/ChurchRecords/accountsStore'

const accountsStore = useAccountsStore()

// Props
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'back-to-login'])

// Form ref
const forgotPasswordFormRef = ref(null)

// Loading state
const loading = ref(false)

// Success dialog state
const successDialog = ref({
  show: false,
  title: '',
  message: '',
  isError: false
})

// Show success dialog
const showSuccessDialog = (title, message, isError = false) => {
  successDialog.value = {
    show: true,
    title,
    message,
    isError
  }
}

// Close success dialog
const closeSuccessDialog = () => {
  successDialog.value.show = false
}

// Form data
const forgotPasswordForm = reactive({
  email: ''
})

// Validation rules
const rules = {
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
  ]
}

// Methods
const closeDialog = () => {
  // Reset form when closing
  forgotPasswordFormRef.value?.resetFields()
  forgotPasswordForm.email = ''
  loading.value = false
  emit('update:modelValue', false)
}

const handleForgotPassword = async () => {
  if (!forgotPasswordFormRef.value) {
    console.error('Form ref is not available')
    return
  }

  // Validate form
  const valid = await forgotPasswordFormRef.value.validate().catch(err => {
    console.error('Validation error:', err)
    return false
  })
  
  if (!valid) {
    return
  }

  loading.value = true

  try {
    console.log('Calling forgotPassword API for:', forgotPasswordForm.email)
    const result = await accountsStore.forgotPassword(forgotPasswordForm.email)
    console.log('Forgot password result:', result)
    
    if (result) {
      showSuccessDialog('Success!', 'Password reset link has been sent to your email address')
      // Reset form but keep dialog open to show the success message
      forgotPasswordFormRef.value?.resetFields()
      forgotPasswordForm.email = ''
      loading.value = false
    } else {
      showSuccessDialog('Error', accountsStore.error || 'Failed to send reset link. Please try again.', true)
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    showSuccessDialog('Error', 'An error occurred. Please try again.', true)
  } finally {
    loading.value = false
  }
}

const handleBackToLogin = () => {
  closeDialog()
  emit('closeForgotPasswordDialog', false)
}
</script>

<style scoped>
.forgot-password-dialog :deep(.el-dialog__header) {
  padding: 20px 20px 0 20px;
  margin-bottom: 0;
}

.forgot-password-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.forgot-password-dialog :deep(.el-overlay) {
  backdrop-filter: blur(8px);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-image {
  width: 48px;
  height: 48px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
  line-height: 1.2;
}

.logo-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.2;
}

.close-btn {
  color: var(--el-text-color-regular);
}

.close-btn:hover {
  color: var(--el-text-color-primary);
}

.form-header {
  text-align: center;
  margin-bottom: 24px;
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.form-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.5;
}

.forgot-password-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.forgot-password-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-regular);
  padding-bottom: 8px;
}

.forgot-password-dialog :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.submit-btn {
  width: 100%;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.form-footer {
  text-align: center;
  margin-top: 16px;
}

.form-footer .el-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

/* Success Dialog styles */
.success-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.success-dialog :deep(.el-dialog__header) {
  padding: 20px 20px 0 20px;
  margin-bottom: 0;
}

.success-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.success-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f0f9eb;
  margin: 0 auto;
}

.error-icon-container {
  background-color: #fef0f0 !important;
}

.error-dialog :deep(.el-dialog) {
  border-radius: 12px;
}
</style>

