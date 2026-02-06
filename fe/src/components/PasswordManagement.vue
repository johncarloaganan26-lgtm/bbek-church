<template>
  <div class="password-management">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card elevation="3" class="password-card">
          <v-card-title class="text-center pa-6">
            <div class="d-flex flex-column align-center">
              <v-icon icon="mdi-lock-reset" size="48" color="primary" class="mb-4"></v-icon>
              <h1 class="text-h4 font-weight-bold mb-2">Change Password</h1>
            </div>
          </v-card-title>

          <v-card-text class="pa-6">
            <!-- Loading -->
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="text-body-1 mt-4">Loading...</p>
            </div>

            <!-- Success -->
            <div v-else-if="success" class="text-center py-4">
              <v-icon icon="mdi-check-circle" size="64" color="success" class="mb-4"></v-icon>
              <h2 class="text-h5 font-weight-bold mb-2">Success!</h2>
              <p class="text-body-1 text-grey mb-6">{{ success }}</p>
              <v-btn color="primary" size="large" to="/login">
                Back to Login
              </v-btn>
            </div>

            <!-- Form -->
            <v-form v-else @submit.prevent="handleSubmit">
              <p class="text-body-2 text-grey mb-4">
                Enter your new password below.
              </p>

              <v-text-field
                v-model="password"
                label="New Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                class="mb-4"
                required
              ></v-text-field>

              <v-text-field
                v-model="confirmPassword"
                label="Confirm Password"
                :type="showConfirmPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-check"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                variant="outlined"
                class="mb-6"
                required
              ></v-text-field>

              <v-btn color="primary" size="large" block type="submit" :loading="submitting">
                Change Password
              </v-btn>

              <div class="text-center mt-4">
                <v-btn variant="text" to="/login" color="grey">
                  <v-icon icon="mdi-arrow-left" class="mr-1"></v-icon>
                  Back to Login
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar for toast messages -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/api/axios'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const accId = ref('')
const email = ref('')
const success = ref('')

// Snackbar state
const snackbar = ref({
  show: false,
  message: '',
  color: 'error'
})

function showToast(message, color = 'error') {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

async function init() {
  accId.value = route.params.acc_id || route.query.acc_id
  console.log('accId:', accId.value)
  
  if (!accId.value) {
    showToast('Invalid link: Missing account ID')
    router.push('/login')
    return
  }

  // Fetch account to verify it exists
  try {
    const response = await axios.get(`/church-records/accounts/getAccountById/${accId.value}`)
    console.log('Account response:', response.data)
    
    if (response.data.success && response.data.data) {
      email.value = response.data.data.email
      loading.value = false
    } else {
      showToast('Account not found. Link may be invalid.')
      router.push('/login')
    }
  } catch (err) {
    console.error('Error fetching account:', err)
    showToast('Failed to load account. Please try again.')
    router.push('/login')
  }
}

async function handleSubmit() {
  if (!password.value) {
    showToast('Password is required')
    return
  }

  if (password.value.length < 8) {
    showToast('Password must be at least 8 characters')
    return
  }

  if (password.value !== confirmPassword.value) {
    showToast('Passwords do not match')
    return
  }

  submitting.value = true

  try {
    const updateData = {
      password: password.value
    }
    
    // Only send email if we have it
    if (email.value && email.value.trim() !== '') {
      updateData.email = email.value
    }
    
    console.log('Sending update request:', updateData)
    
    const response = await axios.put(`/church-records/accounts/updateAccount/${accId.value}`, updateData)
    console.log('Update response:', response.data)
    
    if (response.data.success) {
      success.value = response.data.message || 'Password changed successfully!'
    } else {
      showToast(response.data.message || 'Failed to update password')
    }
  } catch (err) {
    console.error('Error updating password:', err)
    showToast(err.response?.data?.message || 'Failed to update password')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  console.log('PasswordManagement mounted')
  init()
})
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

.fill-height {
  min-height: calc(100vh - 48px);
}
</style>
