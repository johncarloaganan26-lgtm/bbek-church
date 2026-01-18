<template>
  <div class="plan-visit-page" :style="{ backgroundColor: planVisitData.backgroundColor || '#ffffff' }">
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${planVisitData.heroImage})` }"
      ></div>
      <div class="hero-overlay-gradient"></div>
      
      <!-- Floating Elements -->
      <div class="floating-elements">
        <div
          v-for="(element, index) in floatingElements"
          :key="index"
          class="floating-element"
          :style="element.style"
        ></div>
      </div>

      <div class="hero-content-wrapper">
        <h1 class="hero-title">{{ planVisitData.heroTitle }}</h1>
        <p class="hero-subtitle">
          {{ planVisitData.heroDescription }}
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="main-content" style="padding: 100px 0 80px 0;">
      <v-container>
        <v-row>
          <!-- Left Column - Church Info -->
          <v-col cols="12" lg="6">
            <div class="space-y-12">
              <!-- Church Identity -->
              <div>
                <h2
                  class="text-h4 font-weight-bold text-grey-darken-3 mb-4"
                  style="font-family: 'Georgia', serif; font-style: italic;"
                >
                  {{ planVisitData.churchName }}
                </h2>
                <p
                  class="text-body-1 text-grey-darken-1"
                  style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.6;"
                >
                  {{ planVisitData.churchDescription }}
                </p>
              </div>

              <!-- Service Times -->
              <div>
                <h3
                  class="text-h5 font-weight-bold text-grey-darken-3 mb-4"
                  style="font-family: 'Georgia', serif; font-style: italic;"
                >
                  Service Times
                </h3>
                <div class="space-y-3">
                  <div class="d-flex align-center gap-4">
                    <div class="w-12 h-12 bg-blue rounded-circle"></div>
                    <div>
                      <p
                        class="font-weight-semibold text-grey-darken-3"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                      >
                        Sunday Worship
                      </p>
                      <p
                        class="text-grey-darken-1"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                      >
                        {{ planVisitData.sundayServiceTime }}
                      </p>
                    </div>
                  </div>
                  <div class="d-flex align-center gap-4">
                    <div class="w-12 h-12 bg-blue rounded-circle"></div>
                    <div>
                      <p
                        class="font-weight-semibold text-grey-darken-3"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                      >
                        Wednesday Service
                      </p>
                      <p
                        class="text-grey-darken-1"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                      >
                        {{ planVisitData.wednesdayServiceTime }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Location -->
              <div>
                <h3
                  class="text-h5 font-weight-bold text-grey-darken-3 mb-4"
                  style="font-family: 'Georgia', serif; font-style: italic;"
                >
                  Location
                </h3>
                <div class="d-flex align-start gap-4">
                  <v-avatar size="48" color="blue-lighten-5">
                    <v-icon color="blue">mdi-map-marker</v-icon>
                  </v-avatar>
                  <p
                    class="text-body-1 text-grey-darken-1"
                    style="font-family: 'Georgia', serif; font-style: italic;"
                  >
                    {{ planVisitData.location }}
                  </p>
                </div>
                <v-btn
                  color="primary"
                  class="mt-4"
                  @click="openGoogleMaps"
                >
                  Get Directions
                </v-btn>
              </div>

              <!-- Contact Info -->
              <div>
                <h3
                  class="text-h5 font-weight-bold text-grey-darken-3 mb-4"
                  style="font-family: 'Georgia', serif; font-style: italic;"
                >
                  Contact Info
                </h3>
                <div class="space-y-3">
                  <div class="d-flex align-center gap-4">
                    <v-avatar size="48" color="blue-lighten-5">
                      <v-icon color="blue">mdi-phone</v-icon>
                    </v-avatar>
                    <div>
                      <p
                        class="font-weight-semibold text-grey-darken-3"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                      >
                        Phone
                      </p>
                      <a
                        :href="`tel:${planVisitData.phone}`"
                        class="text-blue text-decoration-none"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                      >
                        {{ planVisitData.phone }}
                      </a>
                    </div>
                  </div>
                  <div class="d-flex align-center gap-4">
                    <v-avatar size="48" color="blue-lighten-5">
                      <v-icon color="blue">mdi-email</v-icon>
                    </v-avatar>
                    <div>
                      <p
                        class="font-weight-semibold text-grey-darken-3"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                      >
                        Email
                      </p>
                      <a
                        :href="`mailto:${planVisitData.email}`"
                        class="text-blue text-decoration-none"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                      >
                        {{ planVisitData.email }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Right Column - Contact Form -->
          <v-col cols="12" lg="6">
            <v-card class="pa-8" variant="flat" color="rgba(255, 255, 255, 0.5)">
              <h2
                class="text-h4 font-weight-bold text-grey-darken-3 mb-4"
                style="font-family: 'Georgia', serif; font-style: italic;"
              >
                Get In Touch With Us
              </h2>
              <p
                class="text-body-1 text-grey-darken-1 mb-8"
                style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.6;"
              >
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <!-- Success/Error Alert -->
              <el-alert
                v-if="alertMessage.show"
                :title="alertMessage.title"
                :type="alertMessage.type"
                :description="alertMessage.description"
                :closable="true"
                show-icon
                class="mb-6"
                @close="alertMessage.show = false"
              />

              <el-form
                ref="formRef"
                :model="formData"
                :rules="rules"
                label-width="0"
                @submit.prevent="handleSubmit"
              >
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item prop="firstName">
                      <el-input
                      v-model="formData.firstName"
                        placeholder="First Name *"
                        size="large"
                        :disabled="isDisabled"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item prop="lastName">
                      <el-input
                      v-model="formData.lastName"
                        placeholder="Last Name"
                        size="large"
                        :disabled="isDisabled"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item prop="email">
                      <el-input
                      v-model="formData.email"
                      type="email"
                        placeholder="Email *"
                        size="large"
                        :disabled="isDisabled"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item prop="subject">
                      <el-input
                      v-model="formData.subject"
                        placeholder="Subject *"
                        size="large"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item prop="message">
                      <el-input
                      v-model="formData.message"
                        type="textarea"
                        placeholder="Message *"
                        :rows="6"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item>
                      <el-button
                        type="primary"
                      size="large"
                        :loading="submitting"
                        :disabled="submitting"
                      class="submit-btn"
                        style="width: 100%;"
                        @click="handleSubmit"
                      >
                        {{ submitting ? 'Sending...' : 'Send Message' }}
                      </el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Map Section -->
    <section class="map-section w-full">
      <div class="map-container">
        <iframe
          :src="mapEmbedUrl"
          width="100%"
          height="100%"
          style="border: 0;"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Church Location Map"
          aria-label="Interactive map showing Bible Baptist Ekklesia of Kawit location"
        ></iframe>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from '@/api/axios'
import { useFormsStore } from '@/stores/formsStore'

const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const formsStore = useFormsStore()
const submitting = ref(false)
const formRef = ref(null)
const alertMessage = ref({
  show: false,
  type: 'success',
  title: '',
  description: ''
})

const floatingElements = ref([
  { style: { top: '40px', right: '40px', width: '56px', height: '56px', animationDelay: '0.5s' } },
  { style: { bottom: '80px', left: '40px', width: '48px', height: '48px', animationDelay: '1.5s' } },
  { style: { top: '50%', left: '50%', width: '40px', height: '40px', animationDelay: '2.5s' } },
  { style: { top: '25%', right: '25%', width: '32px', height: '32px', animationDelay: '1s' } },
  { style: { bottom: '25%', left: '25%', width: '24px', height: '24px', animationDelay: '2s' } },
  { style: { top: '33%', left: '16%', width: '36px', height: '36px', animationDelay: '0.8s' } },
  { style: { bottom: '33%', right: '16%', width: '44px', height: '44px', animationDelay: '2.8s' } }
])

const planVisitData = ref({
  heroImage: '/img/planvisit.jpg',
  heroTitle: 'Plan Your Visit',
  heroDescription: "We're excited to welcome you to our church family",
  churchName: 'Bible Baptist Ekklesia of Kawit',
  churchDescription: 'An independent Baptist church proclaiming the Gospel of Jesus Christ and making disciples through Biblical teaching and authentic worship.',
  sundayServiceTime: '9:30 AM – 12:00 PM',
  wednesdayServiceTime: '7:00 PM – 9:00 PM',
  location: '485 Acacia St. Villa Ramirez, Kawit, Cavite',
  phone: '+63 912 345 6789',
  email: 'bbekawit@gmail.com',
  backgroundColor: '#ffffff'
})

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: ''
})

// Validation rules
const rules = {
  firstName: [
    { required: true, message: 'First name is required', trigger: 'blur' },
    { min: 2, max: 50, message: 'First name must be between 2 and 50 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z\s'-]+$/, message: 'First name can only contain letters, spaces, hyphens, and apostrophes', trigger: 'blur' }
  ],
  lastName: [
    { max: 50, message: 'Last name must not exceed 50 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z\s'-]*$/, message: 'Last name can only contain letters, spaces, hyphens, and apostrophes', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' },
    { max: 100, message: 'Email must not exceed 100 characters', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: 'Subject is required', trigger: 'blur' },
    { min: 3, max: 200, message: 'Subject must be between 3 and 200 characters', trigger: 'blur' }
  ],
  message: [
    { required: true, message: 'Message is required', trigger: 'blur' },
    { min: 10, max: 2000, message: 'Message must be between 10 and 2000 characters', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) {
    console.error('Form ref is not available')
    return
  }

  // Validate form using Element Plus validation
  try {
    await formRef.value.validate()
  } catch (error) {
    // Validation failed - error messages are shown automatically by Element Plus
    console.log('Form validation failed:', error)
    return
  }

  // Submit form directly without confirmation
  submitting.value = true
  try {
    const userId = userInfo.value?.account?.acc_id || userInfo.value?.acc_id
    const fullName = `${formData.value.firstName}${formData.value.lastName ? ' ' + formData.value.lastName : ''}`.trim()

    const payload = {
      form_type: 'message',
      form_data: {
        firstName: formData.value.firstName.trim(),
        lastName: formData.value.lastName.trim() || '',
        subject: formData.value.subject.trim(),
        message: formData.value.message.trim()
      },
      name: fullName,
      email: formData.value.email.trim(),
      status: 'pending'
    }

    // Add user info if authenticated
    if (userId) {
      payload.submitted_by = userId
    }

    console.log('Submitting form with payload:', payload)
    await formsStore.createForm(payload)
    console.log('Form submitted successfully')
    
    // Show success alert
    alertMessage.value = {
      show: true,
      type: 'success',
      title: 'Success!',
      description: 'Message sent successfully! We will get back to you soon.'
    }
    
    // Auto-hide alert after 5 seconds
    setTimeout(() => {
      alertMessage.value.show = false
    }, 5000)
    
    // Reset form (but keep user info if logged in)
    if (userId && isDisabled.value) {
      // Keep pre-filled data for logged-in users
      formData.value.subject = 'Plan Your Visit'
      formData.value.message = 'I would like to plan a visit to your church. Please contact me as soon as possible.'
    } else {
      // Clear all fields for non-logged-in users
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
      }
    }
    
    // Clear form validation state
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Failed to send message. Please try again.'
    
    // Show error alert
    alertMessage.value = {
      show: true,
      type: 'error',
      title: 'Error',
      description: errorMessage
    }
    
    // Auto-hide alert after 5 seconds
    setTimeout(() => {
      alertMessage.value.show = false
    }, 5000)
  } finally {
    submitting.value = false
  }
}

const openGoogleMaps = () => {
  const address = planVisitData.value.location || "485 Acacia St, Villa Ramirez, Kawit, Cavite"
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  window.open(url, '_blank')
}

// Generate Google Maps embed URL
const mapEmbedUrl = computed(() => {
  const address = planVisitData.value.location || "485 Acacia St, Villa Ramirez, Kawit, Cavite"
  // Use Google Maps embed URL with address query parameter
  // This format works without requiring an API key
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
})

const isDisabled = ref(false)
// Fetch plan visit data from CMS
const fetchPlanVisitData = async () => {
  const userId = userInfo.value?.account?.acc_id || userInfo.value?.acc_id
  if(userId && userInfo.value?.member) {
    formData.value.firstName = userInfo.value.member.firstname || ''
    formData.value.lastName = userInfo.value.member.lastname || ''
    formData.value.email = userInfo.value.member.email || userInfo.value.account?.email || ''
    formData.value.subject = 'Plan Your Visit'
    formData.value.message = 'I would like to plan a visit to your church. Please contact me as soon as possible.'
    isDisabled.value = true
  } else {
    isDisabled.value = false
  }
  try {
    const response = await axios.get('/cms/planvisit/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Plan Visit:', { content, cmsImages })
      
      // Update plan visit data from content
      if (content.heroTitle) planVisitData.value.heroTitle = content.heroTitle
      if (content.heroDescription) planVisitData.value.heroDescription = content.heroDescription
      if (content.churchName) planVisitData.value.churchName = content.churchName
      if (content.churchDescription) planVisitData.value.churchDescription = content.churchDescription
      if (content.sundayServiceTime) planVisitData.value.sundayServiceTime = content.sundayServiceTime
      if (content.wednesdayServiceTime) planVisitData.value.wednesdayServiceTime = content.wednesdayServiceTime
      if (content.location) planVisitData.value.location = content.location
      if (content.phone) planVisitData.value.phone = content.phone
      if (content.email) planVisitData.value.email = content.email
      if (content.backgroundColor) {
        planVisitData.value.backgroundColor = content.backgroundColor
        console.log('Background color from CMS:', content.backgroundColor)
      }
      
      // Handle hero image - images are stored as BLOB, returned as base64 in images object
      // The image is stored with field_name = 'heroImage' in tbl_cms_images
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          planVisitData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        } else {
          console.log('⚠️ Hero image in CMS is not a valid base64 image')
        }
      } else {
        console.log('ℹ️ No hero image found in CMS, using default')
      }
      
      console.log('✅ Plan Visit CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Plan Visit, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching plan visit data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

onMounted(async () => {
  // Refresh userInfo from localStorage
  userInfo.value = JSON.parse(localStorage.getItem('userInfo') || '{}')
  await fetchPlanVisitData()
})

</script>

<style scoped>
.plan-visit-page {
  min-height: 100vh;
  margin-top: 120px;
  background-color: var(--page-bg, white);
}

.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hero-overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(20, 184, 166, 0.4), rgba(20, 184, 166, 0.2));
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  background: rgba(63, 211, 194, 0.62);
  border-radius: 50%;
  animation: float 3.5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.hero-content-wrapper {
  position: relative;
  z-index: 10;
  text-align: center;
  color: white;
  padding: 40px;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.hero-subtitle {
  font-size: 1.25rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.main-content {
  background: white;
  position: relative;
}

.main-content :deep(.v-card) {
  transition: all 0.3s ease;
}

.main-content :deep(.v-card:hover) {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.main-content :deep(.v-text-field),
.main-content :deep(.v-textarea) {
  transition: all 0.3s ease;
}

.main-content :deep(.v-text-field:focus-within),
.main-content :deep(.v-textarea:focus-within) {
  transform: translateY(-2px);
}

.submit-btn {
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background-color: #14b8a6 !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.main-content :deep(.v-btn) {
  transition: all 0.3s ease;
}

.main-content :deep(.v-btn:hover) {
  transform: translateY(-2px);
}

@media (max-width: 960px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}

/* Element Plus form styles */
:deep(.el-form) {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  position: absolute;
  top: 100%;
  left: 0;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  border-radius: 4px;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  border-radius: 4px;
}

:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-textarea.is-focus .el-textarea__inner) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-button) {
  border-radius: 4px;
  font-weight: 500;
}

:deep(.el-button--primary) {
  background-color: #14b8a6;
  border-color: #14b8a6;
}

:deep(.el-button--primary:hover) {
  background-color: #0d9488;
  border-color: #0d9488;
}

/* Alert styles */
:deep(.el-alert) {
  margin-bottom: 20px;
}

:deep(.el-alert--success) {
  background-color: #f0f9ff;
  border: 1px solid #67c23a;
}

:deep(.el-alert--error) {
  background-color: #fef0f0;
  border: 1px solid #f56c6c;
}

/* Map Section */
.map-section {
  width: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 600px;
  position: relative;
  overflow: hidden;
}

.map-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 960px) {
  .map-container {
    height: 400px;
  }
}
</style>

