<template>
  <div class="password-management">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card elevation="3" class="password-card">
          <v-card-title class="text-center pa-6">
            <div class="d-flex flex-column align-center">
              <v-icon 
                :icon="type === 'new_account' || pageType === 'change' ? 'mdi-lock-reset' : 'mdi-key-variant'" 
                size="48" 
                :color="type === 'new_account' || pageType === 'change' ? 'primary' : 'warning'"
                class="mb-4"
              ></v-icon>
              <h1 class="text-h4 font-weight-bold mb-2">
                {{ pageTitle }}
              </h1>
              <p class="text-body-2 text-grey">
                {{ pageSubtitle }}
              </p>
            </div>
          </v-card-title>

          <v-card-text class="pa-6">
            <!-- Loading State -->
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="text-body-1 mt-4">Verifying your request...</p>
            </div>

            <!-- Invalid Link State -->
            <div v-else-if="!isValidToken" class="text-center py-8">
              <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4"></v-icon>
              <h2 class="text-h6 font-weight-bold mb-2">Invalid Link</h2>
              <p class="text-body-2 text-grey mb-4">
                This password reset link is invalid. Please request a new one.
              </p>
              <v-btn color="primary" @click="requestNewLink">
                Request New Link
              </v-btn>
            </div>

            <!-- Password Reset Form -->
            <v-form 
              v-else
              ref="passwordFormRef" 
              v-model="formValid"
              @submit.prevent="handleSubmitPassword"
            >
              <!-- Email Display (if available from token) -->
              <v-alert
                v-if="userEmail"
                type="info"
                variant="tonal"
                class="mb-4"
                closable
              >
                <div class="d-flex align-center">
                  <v-icon icon="mdi-email" class="mr-2"></v-icon>
                  <span>Reset password for: <strong>{{ userEmail }}</strong></span>
                </div>
              </v-alert>

              <!-- Success Message -->
              <v-alert
                v-if="successMessage"
                type="success"
                class="mb-4"
                closable
                @click:close="successMessage = ''"
              >
                {{ successMessage }}
              </v-alert>

              <!-- Error Message -->
              <v-alert
                v-if="errorMessage"
                type="error"
                variant="outlined"
                class="mb-4"
                closable
                @click:close="errorMessage = ''"
              >
                {{ errorMessage }}
              </v-alert>

              <!-- New Password Field -->
              <v-text-field
                v-model="formData.newPassword"
                label="New Password"
                :type="showNewPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-plus"
                variant="outlined"
                :rules="newPasswordRules"
                :append-inner-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showNewPassword = !showNewPassword"
                placeholder="Enter your new password"
                class="mb-2"
                required
              ></v-text-field>

              <!-- Password Requirements Indicator -->
              <div class="password-requirements mb-4">
                <div class="text-caption font-weight-medium mb-2">Password Requirements:</div>
                <ul class="text-caption pa-0 ml-4">
                  <li :class="{ 'text-success': passwordHasMinLength, 'text-grey': !passwordHasMinLength }">
                    At least 8 characters
                  </li>
                  <li :class="{ 'text-success': passwordHasLowercase, 'text-grey': !passwordHasLowercase }">
                    One lowercase letter
                  </li>
                  <li :class="{ 'text-success': passwordHasUppercase, 'text-grey': !passwordHasUppercase }">
                    One uppercase letter
                  </li>
                  <li :class="{ 'text-success': passwordHasNumber, 'text-grey': !passwordHasNumber }">
                    One number
                  </li>
                  <li :class="{ 'text-success': passwordHasSpecial, 'text-grey': !passwordHasSpecial }">
                    One special character (@$!%*?&#)
                  </li>
                </ul>
              </div>

              <!-- Confirm Password Field -->
              <v-text-field
                v-model="formData.confirmPassword"
                label="Confirm New Password"
                :type="showConfirmPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-check"
                variant="outlined"
                :rules="confirmPasswordRules"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                placeholder="Confirm your new password"
                class="mb-4"
                required
              ></v-text-field>

              <!-- Submit Button -->
              <v-btn
                color="primary"
                size="large"
                block
                :prepend-icon="type === 'new_account' || pageType === 'change' ? 'mdi-lock-reset' : 'mdi-key-variant'"
                :loading="submitting"
                :disabled="!formValid || passwordChanged"
                type="submit"
                class="mb-4"
              >
                {{ passwordChanged ? 'Password Changed Successfully' : (type === 'new_account' || pageType === 'change' ? 'Change Password' : 'Reset Password') }}
              </v-btn>

              <!-- Additional Info for Change Password -->
              <div v-if="type === 'new_account'" class="text-center">
                <p class="text-body-2 text-grey mb-2">
                  This link was sent to your email for security verification.
                </p>
                <v-btn
                  variant="text"
                  size="small"
                  @click="goToLogin"
                >
                  {{  userInfo?.account ? 'Back to Page'  :  'Back to Login' }}
                </v-btn>
              </div>

              <!-- Additional Info for Forgot Password -->
              <div v-else class="text-center">
                <p class="text-body-2 text-grey mb-2">
                  Remember your password?
                </p>
                <v-btn
                  variant="text"
                  size="small"
                  @click="goToLogin"
                >
                  Back to Login
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsStore } from '../stores/ChurchRecords/accountsStore'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const accountsStore = useAccountsStore()

// Form refs
const passwordFormRef = ref(null)

// States
const loading = ref(true)
const submitting = ref(false)
const formValid = ref(false)
const isValidToken = ref(false)
const passwordChanged = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const userEmail = ref('')
const pageType = ref('forgot')
const mockResponse = ref(null)
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || null)

// Password visibility toggles
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Form data
const formData = ref({
  newPassword: '',
  confirmPassword: ''
})

// Computed properties
const pageTitle = computed(() => {
  console.log(passwordChanged.value ,'passwordChanged' ,type.value)
  if (passwordChanged.value) {
    return 'Password Changed Successfully!'
  }
  return  pageType.value === 'change' || type.value === 'new_account' ? 'Change Your Password' : 'Reset Your Password'
})

const pageSubtitle = computed(() => {
  if (passwordChanged.value) {
    return 'Your password has been changed successfully. You can now login with your new password.'
  }
  return  pageType.value === 'change' || type.value === 'new_account'
    ? 'Enter your new password below to change your account password.' 
    : 'Enter your new password below to reset your account password.'
})

// Password strength indicators
const passwordHasMinLength = computed(() => {
  return formData.value.newPassword?.length >= 8
})

const passwordHasLowercase = computed(() => {
  return /(?=.*[a-z])/.test(formData.value.newPassword || '')
})

const passwordHasUppercase = computed(() => {
  return /(?=.*[A-Z])/.test(formData.value.newPassword || '')
})

const passwordHasNumber = computed(() => {
  return /(?=.*\d)/.test(formData.value.newPassword || '')
})

const passwordHasSpecial = computed(() => {
  return /(?=.*[@$!%*?&#])/.test(formData.value.newPassword || '')
})

// Validation Rules
const newPasswordRules = [
  v => !!v || 'New password is required',
  v => (v && v.length >= 8) || 'Password must be at least 8 characters',
  v => /(?=.*[a-z])/.test(v) || 'Password must contain at least one lowercase letter',
  v => /(?=.*[A-Z])/.test(v) || 'Password must contain at least one uppercase letter',
  v => /(?=.*\d)/.test(v) || 'Password must contain at least one number',
  v => /(?=.*[@$!%*?&#])/.test(v) || 'Password must contain at least one special character (@$!%*?&#)'
]

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === formData.value.newPassword || 'Passwords do not match'
]

// Get token and type from URL query parameters
const token = computed(() => route.query.token || route.query.t || route.params.token)
const type = computed(() => route.query.type || route.params.type)
const isProfileChange = computed(() => route.query.isProfileChange || route.params.isProfileChange)


async function fetchAccountById(accountId) {
  // Get parameters from URL
  const urlType = type.value?.toLowerCase()

  // Do not allow token-based password change when invoked from profile
  if (isProfileChange.value) {
    isValidToken.value = true
    loading.value = false
    pageType.value = 'change'
    return
  }

  // For all cases (new_account, forgot_password, or any other), just validate account exists
  try {
    const accountId = route.params.acc_id || route.query.acc_id
    console.log('🔍 Processing password reset/change, accountId:', accountId)

    if (!accountId) {
      console.log('❌ No account ID found in URL')
      isValidToken.value = false
      errorMessage.value = 'Invalid link. Account ID is missing.'
      loading.value = false
      return
    }

    const account = await accountsStore.fetchAccountById(accountId)
    console.log('🔍 Account fetch result:', account)

    if (account && account.acc_id) {
      isValidToken.value = true
      userEmail.value = account.email || ''
      mockResponse.value = {
        valid: true,
        email: account.email,
        acc_id: account.acc_id,
        position: account.position,
        status: account.status,
        type: urlType
      }

      // Set page type based on URL type
      if (urlType === 'new_account') {
        pageType.value = 'change'
      } else {
        pageType.value = 'forgot'
      }

      console.log('✅ Password reset/change link is valid')
    } else {
      console.log('❌ Account not found or fetch failed')
      isValidToken.value = false
      errorMessage.value = 'Account not found. Please request a new password reset link.'
    }
  } catch (error) {
    console.error('❌ Error fetching account:', error)
    isValidToken.value = false
    errorMessage.value = 'Failed to load account information. Please try again or contact support.'
  } finally {
    loading.value = false
  }
}

// Verify token on mount
onMounted(async () => {
 await fetchAccountById(route.params.acc_id || route.query.acc_id)
})

// Handle password submission
const handleSubmitPassword = async () => {
  if (!passwordFormRef.value) return

  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return

  // No token validation needed for the original system

  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if(formData.value.newPassword !== formData.value.confirmPassword){
      errorMessage.value = 'Passwords do not match.'
      return
    }

    const urlType = type.value?.toLowerCase()

    if (urlType === 'new_account') {
      // For account setup, update password directly
      const response = await accountsStore.updateAccount(mockResponse.value.acc_id, {
        password: formData.value.newPassword,
        email: mockResponse.value.email,
        position: mockResponse.value.position,
        status: mockResponse.value.status
      })

      if (response && response.success) {
        const msg = response.message || 'Account setup completed successfully.'
        ElMessage.success(msg)
        successMessage.value = msg
        passwordChanged.value = true
      } else {
        const err = response?.error || 'Failed to set up account.'
        ElMessage.error(err)
        errorMessage.value = err
        return
      }
    } else {
      // For password reset, update password directly using account ID
      const response = await accountsStore.updateAccount(mockResponse.value.acc_id, {
        password: formData.value.newPassword,
        email: mockResponse.value.email,
        position: mockResponse.value.position,
        status: mockResponse.value.status
      })

      if (response && response.success) {
        const msg = response.message || 'Password reset successfully.'
        ElMessage.success(msg)
        successMessage.value = msg
        passwordChanged.value = true
      } else {
        const err = response?.error || response?.message || 'Failed to reset password.'
        ElMessage.error(err)
        errorMessage.value = err
        return
      }
    }
    // Reset form
    formData.value = {
      newPassword: '',
      confirmPassword: ''
    }
    passwordFormRef.value?.resetValidation()

    // Optional: Auto redirect after 3 seconds
    setTimeout(() => {
      goToLogin()
    }, 3000)

  } catch (error) {
    console.error('Error changing password:', error)
    errorMessage.value = `Failed to ${type.value === 'new_account' ? 'change' : 'reset'} password. Please try again.`
  } finally {
    submitting.value = false
  }
}

// Request new link
const requestNewLink = () => {
  // TODO: Navigate to forgot password request page or show dialog
  router.push('/login')
}

// Navigate to login
const goToLogin = () => {
  router.push({ name: 'LandingPage' })
}
</script>

<style scoped>
.password-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
}

.password-card {
  border-radius: 16px;
  overflow: hidden;
}

.password-requirements {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid #14b8a6;
}

.password-requirements ul {
  list-style-type: disc;
  margin: 0;
}

.password-requirements li {
  margin-bottom: 4px;
  transition: color 0.2s ease;
}

.fill-height {
  min-height: calc(100vh - 48px);
}
</style>
