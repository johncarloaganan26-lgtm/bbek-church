<template>
  <div class="send-prayer-page">
    <!-- Hero Section -->
    <section class="hero-section py-20 bg-teal-darken-2 text-white position-relative">
      <v-container>
        <div class="text-center">
          <h1 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold mb-6 fade-in-up">
            Send a Prayer Request
          </h1>
          <p class="text-h6 text-white opacity-90 max-width-3xl mx-auto mb-8 fade-in-up-delay">
            "Do not be anxious about anything, but in every situation, by prayer and
            petition, with thanksgiving, present your requests to God." - Philippians 4:6
          </p>
        </div>
      </v-container>
      <div class="wave-divider">
        <svg viewBox="0 0 1440 120" class="w-100">
          <path
            fill="#ffffff"
            fill-opacity="1"
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
          ></path>
        </svg>
      </div>
    </section>

    <!-- Prayer Ministry Info -->
    <section class="py-16 bg-white">
      <v-container>
        <div class="text-center mb-12 max-width-4xl mx-auto">
          <h2 class="text-h4 font-weight-bold mb-6 fade-in-up">Our Prayer Ministry</h2>
          <p class="text-h6 text-grey-darken-1 fade-in-up-delay">
            Our dedicated prayer team is committed to lifting your needs before
            God. We believe in the power of prayer and stand with you in faith
            for God's intervention in your situation.
          </p>
        </div>

        <v-row>
          <v-col cols="12" md="4">
            <v-card class="text-center pa-6 prayer-card prayer-card-1" elevation="2">
              <v-avatar size="64" color="teal-lighten-5" class="mb-4">
                <v-icon size="32" color="teal">mdi-lock</v-icon>
              </v-avatar>
              <h3 class="text-h6 font-weight-bold mb-2">Confidential</h3>
              <p class="text-body-2">
                Your prayer requests are kept confidential and shared only with
                our prayer team members.
              </p>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="text-center pa-6 prayer-card prayer-card-2" elevation="2">
              <v-avatar size="64" color="teal-lighten-5" class="mb-4">
                <v-icon size="32" color="teal">mdi-heart</v-icon>
              </v-avatar>
              <h3 class="text-h6 font-weight-bold mb-2">Compassionate</h3>
              <p class="text-body-2">
                Our team prays with compassion and understanding for every request we receive.
              </p>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="text-center pa-6 prayer-card prayer-card-3" elevation="2">
              <v-avatar size="64" color="teal-lighten-5" class="mb-4">
                <v-icon size="32" color="teal">mdi-clock-outline</v-icon>
              </v-avatar>
              <h3 class="text-h6 font-weight-bold mb-2">24/7 Available</h3>
              <p class="text-body-2">
                Submit your prayer requests anytime, and our team will pray for you.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Prayer Request Form -->
    <section class="py-16 bg-grey-lighten-5">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-card class="pa-8" elevation="2">
              <h2 class="text-h5 font-weight-bold mb-6">Submit Your Prayer Request</h2>
              <v-form @submit.prevent="handleSubmit" ref="formRef">
                <v-text-field
                  v-model="formData.name"
                  label="Your Name *"
                  variant="outlined"
                  required
                  class="mb-4"
                ></v-text-field>
                <v-text-field
                  v-model="formData.email"
                  label="Email *"
                  type="email"
                  variant="outlined"
                  required
                  class="mb-4"
                ></v-text-field>
                <v-text-field
                  v-model="formData.phone"
                  label="Phone (Optional)"
                  variant="outlined"
                  class="mb-4"
                ></v-text-field>
                <v-textarea
                  v-model="formData.request"
                  label="Prayer Request *"
                  variant="outlined"
                  rows="6"
                  required
                  class="mb-4"
                ></v-textarea>
                <v-checkbox
                  v-model="formData.anonymous"
                  label="Submit anonymously"
                  hide-details
                  class="mb-4"
                ></v-checkbox>
                <v-btn
                  type="submit"
                  color="teal"
                  size="large"
                  block
                  class="text-white mt-4"
                  :loading="submitting"
                >
                  Submit Prayer Request
                </v-btn>
              </v-form>

              <!-- Success Message Popup -->
              <v-dialog v-model="successDialog.show" max-width="500" persistent>
                <v-card class="text-center pa-6">
                  <v-avatar color="success" size="80" class="mb-4">
                    <v-icon size="48" color="white">mdi-check</v-icon>
                  </v-avatar>
                  <v-card-title class="text-h5 font-weight-bold">
                    {{ successDialog.title }}
                  </v-card-title>
                  <v-card-text class="text-body-1">
                    {{ successDialog.message }}
                  </v-card-text>
                  <v-card-actions class="justify-center">
                    <v-btn color="teal" variant="flat" @click="closeSuccessDialog">
                      OK
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFormsStore } from '@/stores/formsStore'

const formsStore = useFormsStore()

const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || null)
const submitting = ref(false)
const formRef = ref(null)

// Success dialog state
const successDialog = ref({
  show: false,
  title: '',
  message: ''
})

// Show success dialog
const showSuccessDialog = (title, message) => {
  successDialog.value = {
    show: true,
    title,
    message
  }
}

// Close success dialog
const closeSuccessDialog = () => {
  successDialog.value.show = false
}

const formData = ref({
  name: '',
  email: '',
  phone: '',
  request: '',
  anonymous: false
})

// Initialize form with user info if available
onMounted(() => {
  if (userInfo.value?.member) {
    // Build full name from firstname, middle_name, and lastname
    const nameParts = []
    if (userInfo.value.member.firstname) {
      nameParts.push(userInfo.value.member.firstname)
    }
    if (userInfo.value.member.middle_name) {
      nameParts.push(userInfo.value.member.middle_name)
    }
    if (userInfo.value.member.lastname) {
      nameParts.push(userInfo.value.member.lastname)
    }
    formData.value.name = nameParts.join(' ').trim()

    // Get email from account or member
    formData.value.email = userInfo.value.account?.email || userInfo.value.member.email || ''

    // Get phone number
    formData.value.phone = userInfo.value.member.phone_number || userInfo.value.member.contactNo || ''
  }
})

const handleSubmit = async () => {
  if (!formRef.value) return

  // Basic validation
  if (!formData.value.request || formData.value.request.trim() === '') {
    showSuccessDialog('Validation Error', 'Please enter your prayer request')
    return
  }

  // For non-anonymous requests, validate name and email
  if (!formData.value.anonymous) {
    if (!formData.value.name || formData.value.name.trim() === '') {
      showSuccessDialog('Validation Error', 'Please enter your name')
      return
    }
    if (!formData.value.email || formData.value.email.trim() === '') {
      showSuccessDialog('Validation Error', 'Please enter your email')
      return
    }
  }

  submitting.value = true
  try {
    const userId = userInfo.value?.account?.acc_id || userInfo.value?.acc_id

    const payload = {
      form_type: 'prayer_request',
      form_data: {
        request: formData.value.request.trim(),
        anonymous: formData.value.anonymous
      },
      status: 'pending'
    }

    // Add user info if authenticated
    if (userId) {
      payload.submitted_by = userId
    }

    // Add name, email, phone if not anonymous or if user is not authenticated
    // Always include email for notification purposes, even for anonymous requests
    if (!formData.value.anonymous || !userId) {
      payload.name = formData.value.name.trim()
      payload.email = formData.value.email.trim()
      if (formData.value.phone) {
        payload.phone = formData.value.phone.trim()
      }
    } else if (formData.value.anonymous && userId) {
      // For anonymous requests from authenticated users, still include email for notifications
      payload.email = formData.value.email.trim()
    }

    const result = await formsStore.createForm(payload)
    showSuccessDialog('Success!', result?.message || 'Prayer request submitted successfully! We will pray for you.')

    // Reset form (but keep user info if not anonymous)
    if (formData.value.anonymous) {
    formData.value = {
      name: '',
      email: '',
      phone: '',
      request: '',
      anonymous: false
    }
      // Re-initialize with user info if available
      if (userInfo.value?.member) {
        const nameParts = []
        if (userInfo.value.member.firstname) {
          nameParts.push(userInfo.value.member.firstname)
        }
        if (userInfo.value.member.middle_name) {
          nameParts.push(userInfo.value.member.middle_name)
        }
        if (userInfo.value.member.lastname) {
          nameParts.push(userInfo.value.member.lastname)
        }
        formData.value.name = nameParts.join(' ').trim()
        formData.value.email = userInfo.value.account?.email || userInfo.value.member.email || ''
        formData.value.phone = userInfo.value.member.phone_number || userInfo.value.member.contactNo || ''
      }
  } else {
    // Keep name, email, phone but clear request
    formData.value.request = ''
    }
  } catch (error) {
    // Error message is already shown by the store/axios interceptor
    console.error('Error submitting prayer request:', error)
    showSuccessDialog('Error', 'Failed to submit prayer request. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.send-prayer-page {
  min-height: 100vh;
  background: white;
  margin-top: 64px;
}

.hero-section {
  position: relative;
}

.wave-divider {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  overflow: hidden;
}

.wave-divider svg {
  display: block;
  width: 100%;
  height: 100%;
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.prayer-card {
  animation: fadeInUp 0.6s ease-out both;
  transition: all 0.3s ease;
}

.prayer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.prayer-card-1 {
  animation-delay: 200ms;
}

.prayer-card-2 {
  animation-delay: 300ms;
}

.prayer-card-3 {
  animation-delay: 400ms;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
