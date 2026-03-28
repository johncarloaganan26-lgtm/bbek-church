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
    <section class="main-content" style="padding: 100px 0 100px 0;">
      <v-container>
        <v-row class="align-stretch">
          <!-- Left Column - Contact Form (Bigger) -->
          <v-col cols="12" lg="7">
            <div class="form-wrapper pa-4 pa-md-12 border rounded-xl bg-white shadow-sm relative overflow-hidden">
               <!-- Structural Heavy Form Accents -->
               <div class="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 opacity-30"></div>
               
              <h2
                class="text-h3 font-weight-bold text-grey-darken-4 mb-4"
                style="font-family: 'Georgia', serif; font-style: italic; letter-spacing: -1px;"
              >
                Let's Connect
              </h2>
              <p
                class="text-h6 text-grey-darken-1 mb-10"
                style="font-family: 'Georgia', serif; font-style: italic; max-width: 540px; line-height: 1.6;"
              >
                Fill out the form below and our team will get back to you within 24 hours. We're excited to hear from you.
              </p>

              <!-- Success/Error Alert -->
              <el-alert
                v-if="alertMessage.show"
                :title="alertMessage.title"
                :type="alertMessage.type"
                :description="alertMessage.description"
                :closable="true"
                show-icon
                class="mb-8 modern-alert shadow-sm"
                @close="alertMessage.show = false"
              />

              <el-form
                ref="formRef"
                :model="formData"
                :rules="rules"
                label-position="top"
                @submit.prevent="handleSubmit"
                class="heavy-form-structure branding-font"
              >
                <!-- Section: Personal Information -->
                <div class="form-section-header d-flex align-center mb-8">
                  <span class="text-caption font-weight-bold text-teal-darken-3 mr-4 uppercase letter-spacing-2" style="font-family: 'Georgia', serif; font-style: italic;">01. Personal Details</span>
                  <v-divider class="flex-grow-1 border-opacity-25"></v-divider>
                </div>

                <el-row :gutter="32" class="mb-4">
                  <el-col :span="12">
                    <el-form-item prop="firstName" label="First Name">
                      <el-input
                        v-model="formData.firstName"
                        placeholder="e.g. John"
                        size="large"
                        :disabled="isDisabled"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item prop="lastName" label="Last Name">
                      <el-input
                        v-model="formData.lastName"
                        placeholder="e.g. Doe"
                        size="large"
                        :disabled="isDisabled"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item prop="email" label="Email Address">
                      <el-input
                        v-model="formData.email"
                        type="email"
                        placeholder="name@company.com"
                        size="large"
                        :disabled="isDisabled"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <!-- Section: Message Details -->
                <div class="form-section-header d-flex align-center mb-8 mt-12">
                  <span class="text-caption font-weight-bold text-teal-darken-3 mr-4 uppercase letter-spacing-2" style="font-family: 'Georgia', serif; font-style: italic;">02. Inquiry Details</span>
                  <v-divider class="flex-grow-1 border-opacity-25"></v-divider>
                </div>

                <el-row :gutter="32">
                  <el-col :span="24">
                    <el-form-item prop="subject" label="Subject of Inquiry">
                      <el-input
                        v-model="formData.subject"
                        placeholder="What are you interested in?"
                        size="large"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item prop="message" label="Your Message">
                      <el-input
                        v-model="formData.message"
                        type="textarea"
                        placeholder="Tell us more about your visit or how we can help..."
                        :rows="6"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24" class="pt-10">
                    <v-divider class="mb-10 border-opacity-25"></v-divider>
                    <div class="d-flex justify-end">
                      <el-button
                        type="primary"
                        size="large"
                        :loading="submitting"
                        :disabled="submitting"
                        class="submit-btn px-12"
                        @click="handleSubmit"
                      >
                        {{ submitting ? 'Sending Message...' : 'Submit Inquiry' }}
                      </el-button>
                    </div>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </v-col>

          <!-- Right Column - Church Info (Smaller) -->
          <v-col cols="12" lg="5">
            <div class="info-card-teal pa-8 pa-md-12 rounded-xl elevation-10 h-full d-flex flex-column branding-font">
              <div class="info-overlay-blobs">
                <div class="blob-1"></div>
                <div class="blob-2"></div>
              </div>
              
              <div class="relative z-10 space-y-12">
                <!-- Church Identity -->
                <div class="mb-10">
                  <h2
                    class="text-h4 font-weight-bold mb-6 white-glow-text leading-tight"
                    style="font-family: 'Georgia', serif; font-style: italic;"
                  >
                    {{ planVisitData.churchName }}
                  </h2>
                  <p
                    class="text-h6 font-weight-medium opacity-90 leading-relaxed"
                    style="font-family: 'Georgia', serif; font-style: italic;"
                  >
                    {{ planVisitData.churchDescription }}
                  </p>
                </div>

                <div class="space-y-12">
                  <!-- Service Times -->
                  <div class="info-section">
                    <div class="d-flex align-center mb-6">
                      <v-icon icon="mdi-calendar-clock" size="24" class="mr-3 op-80"></v-icon>
                      <span class="text-caption font-weight-bold uppercase letter-spacing-2 op-70" style="font-family: 'Georgia', serif; font-style: italic;">Weekly Services</span>
                    </div>
                    <div class="space-y-6">
                      <div class="time-item pa-5 rounded-lg bg-white-opacity-10 border-white-opacity-10 backdrop-blur-md">
                        <p class="font-weight-bold text-h6 mb-2" style="font-family: 'Georgia', serif; font-style: italic;">Sunday Worship</p>
                        <p class="text-body-1 op-80" style="font-family: 'Georgia', serif; font-style: italic;">
                          {{ planVisitData.sundayServiceTime }}
                        </p>
                      </div>
                      <div class="time-item pa-5 rounded-lg bg-white-opacity-10 border-white-opacity-10 backdrop-blur-md">
                        <p class="font-weight-bold text-h6 mb-2" style="font-family: 'Georgia', serif; font-style: italic;">Wednesday Service</p>
                        <p class="text-body-1 op-80" style="font-family: 'Georgia', serif; font-style: italic;">
                          {{ planVisitData.wednesdayServiceTime }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Location -->
                  <div class="info-section">
                    <div class="d-flex align-center mb-6">
                      <v-icon icon="mdi-map-marker-path" size="24" class="mr-3 op-80"></v-icon>
                      <span class="text-caption font-weight-bold uppercase letter-spacing-2 op-70" style="font-family: 'Georgia', serif; font-style: italic;">Find Us</span>
                    </div>
                    <div class="pa-6 rounded-lg bg-white-opacity-10 border-white-opacity-10 backdrop-blur-md mb-8">
                      <p class="text-h6 mb-6 leading-relaxed font-weight-bold" style="font-family: 'Georgia', serif; font-style: italic;">{{ planVisitData.location }}</p>
                      <v-btn
                        color="white"
                        variant="elevated"
                        block
                        size="large"
                        class="text-teal-darken-3 font-weight-bold"
                        prepend-icon="mdi-google-maps"
                        rounded="lg"
                        style="font-family: 'Georgia', serif; font-style: italic;"
                        @click="openGoogleMaps"
                      >
                        Navigate with Maps
                      </v-btn>
                    </div>

                    <div class="d-flex align-center mb-6 mt-12">
                      <v-icon icon="mdi-chat-question-outline" size="24" class="mr-3 op-80"></v-icon>
                      <span class="text-caption font-weight-bold uppercase letter-spacing-2 op-70" style="font-family: 'Georgia', serif; font-style: italic;">Quick Contact</span>
                    </div>
                    <div class="space-y-4">
                      <div class="d-flex align-center">
                        <v-icon color="white" icon="mdi-phone-outline" size="20" class="mr-3 op-70"></v-icon>
                        <a :href="`tel:${planVisitData.phone}`" class="text-white text-h6 font-weight-bold text-decoration-none hover-underline" style="font-family: 'Georgia', serif; font-style: italic;">
                          {{ planVisitData.phone }}
                        </a>
                      </div>
                      <div class="d-flex align-center">
                        <v-icon color="white" icon="mdi-email-outline" size="20" class="mr-3 op-70"></v-icon>
                        <a :href="`mailto:${planVisitData.email}`" class="text-white text-h6 font-weight-bold text-decoration-none hover-underline break-all" style="font-family: 'Georgia', serif; font-style: italic;">
                          {{ planVisitData.email }}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
  email: 'biblebaptistekklesiaofkawit@gmail.com',
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
  background-color: var(--page-bg, #ffffff);
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
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.7) 0%, rgba(13, 148, 136, 0.4) 100%);
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(15deg); }
}

.hero-content-wrapper {
  position: relative;
  z-index: 10;
  text-align: center;
  color: white;
  padding: 40px;
}

.hero-title {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: bold;
  margin-bottom: 1.5rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  letter-spacing: -1px;
  text-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.hero-subtitle {
  font-size: clamp(1rem, 3vw, 1.4rem);
  font-family: 'Georgia', serif;
  font-style: italic;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

/* Main Content Styles */
.main-content {
  background: #ffffff;
}

.form-wrapper {
  height: 100%;
}

.info-card-teal {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(13, 148, 136, 0.5) !important;
}

.info-overlay-blobs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.3;
}

.blob-1 {
  position: absolute;
  top: -10%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  border-radius: 50%;
}

.blob-2 {
  position: absolute;
  bottom: -20%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.white-glow-text {
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.bg-white-opacity-10 {
  background-color: rgba(255, 255, 255, 0.1);
}

.border-white-opacity-20 {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hover-bg-white-10:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.op-70 { opacity: 0.7; }
.op-80 { opacity: 0.8; }
.op-90 { opacity: 0.9; }

.space-y-4 > * + * { margin-top: 1rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }
.space-y-12 > * + * { margin-top: 3rem; }

.letter-spacing-2 { letter-spacing: 2px; }
.break-all { word-break: break-all; }

.branding-font {
  font-family: 'Georgia', serif !important;
  font-style: italic !important;
}

/* Element Plus Customization */
:deep(.el-form-item__label) {
  font-weight: bold;
  color: #0d9488;
  margin-bottom: 8px !important;
  text-transform: none;
  font-size: 1rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #ccdfde inset !important;
  border-radius: 6px;
  transition: all 0.2s;
  padding: 14px 18px !important;
  font-family: 'Georgia', serif;
  font-style: italic;
}

:deep(.el-input__wrapper:hover), :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #0d9488 inset !important;
}

:deep(.el-input.is-focus .el-input__wrapper), :deep(.el-textarea:focus .el-textarea__inner) {
  box-shadow: 0 0 0 2px #0d9488 inset !important;
}

.heavy-form-structure :deep(.el-form-item) {
  margin-bottom: 32px;
}

.submit-btn {
  background-color: #0d9488 !important;
  border-color: #0d9488 !important;
  height: 60px !important;
  border-radius: 6px !important;
  font-weight: bold !important;
  font-size: 1.1rem !important;
  text-transform: none;
  font-family: 'Georgia', serif;
  font-style: italic;
  letter-spacing: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.submit-btn:hover {
  background-color: #0c8276 !important;
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(13, 148, 136, 0.4) !important;
}

.modern-alert {
  border-radius: 12px;
  padding: 16px;
}

.hover-underline:hover {
  text-decoration: underline !important;
}

/* Map Section */
.map-section {
  width: 100%;
}

.map-container {
  width: 100%;
  height: 600px;
  filter: saturate(1.2) contrast(1.1);
}

@media (max-width: 960px) {
  .plan-visit-page {
    margin-top: 80px;
  }
  .map-container {
    height: 400px;
  }
  .info-card-teal {
    padding: 32px !important;
  }
}

.w-full { width: 100%; }
.leading-relaxed { line-height: 1.625; }
.leading-tight { line-height: 1.25; }
.uppercase { text-transform: uppercase; }

</style>

