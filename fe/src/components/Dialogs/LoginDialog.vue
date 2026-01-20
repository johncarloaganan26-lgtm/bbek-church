<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="false"
    @close="closeDialog"
    class="login-dialog"
    align-center
  >
    <div class="login-container">
      <!-- Close Button -->
      <button
        type="button"
        class="close-button"
        @click="closeDialog"
      >
        <el-icon><Close /></el-icon>
        <span class="sr-only">Close</span>
      </button>

      <!-- Logo Section -->
      <div class="logo-container">
        <el-avatar :size="64" class="logo-avatar">
          <el-image
            src="/logo.png"
            alt="BBEK Logo"
            fit="contain"
          />
        </el-avatar>
      </div>

      <!-- Form Header -->
      <div class="form-header">
        <h2 class="form-title">Login to your account</h2>
        <p class="form-subtitle">Enter your credentials to access your account</p>
      </div>

      <!-- Login Form -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
        class="login-form"
      >
        <el-form-item label="Email" prop="email">
          <el-input
            v-model="loginForm.email"
            type="email"
            placeholder="Enter your email"
            clearable
            size="large"
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Enter your password"
            show-password
            clearable
            size="large"
          />
        </el-form-item>

        <!-- Remember Me & Forgot Password -->
        <div class="form-options">
          <!-- <el-checkbox v-model="loginForm.rememberMe" class="remember-checkbox">
            Remember me
          </el-checkbox> -->
          <el-link
            type="primary"
            :underline="false"
            @click="handleForgotPassword(true)"
            class="forgot-link"
          >
            Forgot password?
          </el-link>
        </div>

        <!-- Login Button -->
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            native-type="submit"
            size="large"
          >
            Login
          </el-button>
        </el-form-item>

        <!-- Footer -->
        <div class="form-footer">
          <span class="footer-text">Join Our Faith Community </span>
          <el-link
            type="primary"
            :underline="false"
            @click="handleBecomeMember"
            class="member-link"
          >
            Become a member
          </el-link>
        </div>
      </el-form>
    </div>
  </el-dialog>
  <ForgotPasswordDialog
    v-model="isForgotPassword"
    @closeForgotPasswordDialog="handleForgotPassword"
  />
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAccountsStore } from '@/stores/ChurchRecords/accountsStore'
import ForgotPasswordDialog from './ForgotPasswordDialog.vue'

const router = useRouter()
const accountsStore = useAccountsStore()

const isForgotPassword = ref(false)
// Props
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue' ,'close'])

// Form ref
const loginFormRef = ref(null)

// Loading state
const loading = ref(false)

// Form data
// Responsive dialog width
const dialogWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '95%'
  } else if (window.innerWidth <= 960) {
    return '90%'
  }
  return '500px'
})

const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false
})

// Validation rules
const rules = {
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ]
}


// Methods
const closeDialog = () => {
  emit('update:modelValue', false)
  emit('close')
  // Reset form when closing
  loginFormRef.value?.resetFields()
  loginForm.email = ''
  loginForm.password = ''
  loginForm.rememberMe = false
  loading.value = false
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  // Validate form
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) {
      return false
    }

    loading.value = true

    try {
      const result = await accountsStore.login(loginForm.email, loginForm.password)
      console.log(result , 'result')
      if (result.success) {
        const memberName = result.data.member
          ? `${result.data.member.firstname} ${result.data.member.lastname}`
          : result.data.account.email || 'User'
        ElMessage.success('Welcome ' + memberName)
   
        
        // Close dialog after successful login
        closeDialog()
        emit('update:modelValue', false)

        if(result.data.account.position === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
        
        // Optionally reload the page or redirect
        // router.push('/dashboard')
      } else {
        ElMessage.error(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      ElMessage.error('An error occurred during login. Please try again.')
    } finally {
      loading.value = false
    }
  })
}

const handleForgotPassword = (value) => {
  isForgotPassword.value = value
}

const handleBecomeMember = () => {
  closeDialog()
  router.push({ name: 'WaterBaptismService' })
}
</script>

<style scoped>
.login-dialog :deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

.login-dialog :deep(.el-dialog__header) {
  display: none;
}

.login-dialog :deep(.el-dialog__body) {
  padding: 12px;
}

.login-dialog :deep(.el-overlay) {
  backdrop-filter: blur(8px);
}

.login-container {
  position: relative;
  background: white;
  width: 100%;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #424242;
  opacity: 0.7;
  transition: opacity 0.2s;
  z-index: 10;
}

.close-button:hover {
  opacity: 1;
}

.close-button :deep(.el-icon) {
  font-size: 16px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-avatar {
  border-radius: 50%;
  overflow: hidden;
}

.logo-avatar :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.form-header {
  text-align: center;
  margin-bottom: 16px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: #000000;
  margin: 0 0 6px 0;
}

.form-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.login-form {
  width: 100%;
}

.login-dialog :deep(.el-form-item) {
  margin-bottom: 16px;
}

.login-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  font-size: 14px;
  color: #424242;
  padding-bottom: 8px;
  line-height: 1.5;
}

.login-dialog :deep(.el-input) {
  font-size: 14px;
}

.login-dialog :deep(.el-input__wrapper) {
  border-radius: 6px;
  padding: 0 12px;
  min-height: 40px;
}

.login-dialog :deep(.el-input__inner) {
  font-size: 14px;
  height: 40px;
  line-height: 40px;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.remember-checkbox {
  font-size: 14px;
  font-weight: 400;
  color: #000000;
}

.login-dialog :deep(.remember-checkbox .el-checkbox__input) {
  border-radius: 4px;
}

.login-dialog :deep(.remember-checkbox .el-checkbox__inner) {
  border-color: #d1d5db;
  border-radius: 4px;
}

.login-dialog :deep(.remember-checkbox.is-checked .el-checkbox__inner) {
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.login-dialog :deep(.remember-checkbox .el-checkbox__label) {
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  padding-left: 8px;
}

.forgot-link {
  font-size: 14px;
  color: #14b8a6;
}

.forgot-link:hover {
  color: #0d9488;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  height: 40px;
  font-weight: 500;
  font-size: 14px;
  background-color: #14b8a6;
  border-color: #14b8a6;
  transition: all 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.login-btn:hover {
  background-color: #0d9488;
  border-color: #0d9488;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.login-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.login-dialog :deep(.login-btn.is-loading) {
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.form-footer {
  text-align: center;
  margin-top: 16px;
  padding-top: 8px;
}

.footer-text {
  font-size: 14px;
  color: #6b7280;
}

.member-link {
  font-size: 14px;
  color: #14b8a6;
  margin-left: 4px;
}

.member-link:hover {
  color: #0d9488;
  text-decoration: underline;
}

/* Responsive - reduced width for more compact design */
@media (max-width: 640px) {
  .login-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }

  .login-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(90vh - 100px);
    overflow-y: auto;
  }

  .login-container {
    padding: 8px;
  }

  .form-title {
    font-size: 1.25rem;
  }

  .form-subtitle {
    font-size: 0.875rem;
  }
}

@media (min-width: 641px) and (max-width: 960px) {
  .login-dialog :deep(.el-dialog) {
    width: 90% !important;
    max-width: 500px;
  }
}

@media (min-width: 961px) {
  .login-dialog :deep(.el-dialog) {
    width: 500px !important;
  }
}

@media (min-width: 1024px) {
  .login-dialog :deep(.el-dialog) {
    width: 340px !important;
  }
}
</style>
