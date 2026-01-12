<template>
  <div class="burial-service-page" style="position: relative;">
    <!-- Loading overlay -->
    <v-overlay :model-value="loading" contained class="align-center justify-center" style="z-index: 1000;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div
          class="hero-background"
          :style="{ backgroundImage: `url(${burialServiceData.heroImage || '/img/burial.jpg'})` }"
        ></div>
        <div class="hero-overlay"></div>

        <!-- Floating elements -->
        <div class="floating-elements">
          <div class="floating-element float-1"></div>
          <div class="floating-element float-2"></div>
          <div class="floating-element float-3 clip-path-triangle"></div>
          <div class="floating-element float-4 clip-path-star"></div>
          <div class="floating-element float-5"></div>
          <div class="floating-element float-6"></div>
          <div class="floating-element float-7"></div>
          <div class="floating-element float-8 clip-path-diamond"></div>
          <div class="floating-element float-9"></div>
        </div>

        <div class="hero-content">
          <h1 class="hero-title fade-in-up">
            {{ burialServiceData.heroTitle }}
          </h1>
          <p class="hero-subtitle fade-in-up-delay">
            {{ burialServiceData.heroDescription }}
          </p>
        </div>
      </section>

      <!-- Content Section -->
      <section class="content-section" id="learn-more">
        <!-- Floating elements -->
        <div class="floating-elements">
          <div class="floating-element float-1"></div>
          <div class="floating-element float-2"></div>
          <div class="floating-element float-3"></div>
          <div class="floating-element float-4"></div>
          <div class="floating-element float-5"></div>
          <div class="floating-element float-6"></div>
          <div class="floating-element float-7 clip-path-star"></div>
          <div class="floating-element float-8 clip-path-triangle"></div>
          <div class="floating-element float-9"></div>
          <div class="floating-element float-10"></div>
          <div class="floating-element float-11"></div>
          <div class="floating-element float-12 clip-path-diamond"></div>
        </div>

        <v-container>
          <div class="content-grid">
            <!-- Left Column: What is Burial Service -->
            <div class="left-column">
              <h2 class="section-title fade-in" style="animation-delay: 200ms;">
                {{ burialServiceData.sectionTitle }}
              </h2>
              
              <div class="info-cards">
                <v-card class="info-card fade-in-up" style="animation-delay: 300ms;">
                  <v-card-title class="card-title">
                    {{ burialServiceData.biblicalFoundationTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p>
                      {{ burialServiceData.biblicalFoundationText }}
                    </p>
                  </v-card-text>
                </v-card>

                <v-card class="info-card fade-in-up" style="animation-delay: 400ms;">
                  <v-card-title class="card-title">
                    {{ burialServiceData.ourCommitmentTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p>
                      {{ burialServiceData.ourCommitmentText }}
                    </p>
                  </v-card-text>
                </v-card>
              </div>

              <v-card class="who-baptized-card fade-in" style="animation-delay: 500ms;">
                <v-card-title class="who-title">{{ burialServiceData.whatWeOfferTitle }}</v-card-title>
                <v-card-text>
                  <ul class="baptized-list">
                    <li class="baptized-item">
                      <v-icon color="green" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span>{{ burialServiceData.offerPoint1 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="green" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span>{{ burialServiceData.offerPoint2 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="green" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span>{{ burialServiceData.offerPoint3 }}</span>
                    </li>
                  </ul>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right Column: Register for Burial Service -->
            <div class="right-column" id="register">
              <h2 class="section-title fade-in" style="animation-delay: 700ms;">
                Request Burial Service Support
              </h2>
              
              <!-- <v-alert
                v-if="isLoggedIn"
                type="info"
                variant="tonal"
                class="welcome-alert fade-in"
              >
                <div class="alert-content">
                  <v-icon start>mdi-account</v-icon>
                  <div>
                    <strong>Welcome back, {{ userInfo.firstname }}!</strong>
                    <p class="alert-text">Your information has been pre-filled from your member profile. Please review and update any details as needed.</p>
                  </div>
                </div>
              </v-alert> -->

              <v-card class="registration-card fade-in-up" style="animation-delay: 800ms;" v-if="!userInfo.member">
                <v-card-title class="registration-title">
                  Burial Service Request Form
                </v-card-title>
                <v-card-subtitle class="registration-subtitle">
                  Please fill out this form to request burial service support during this difficult time.
                </v-card-subtitle>
                <v-card-text>
                  <form @submit.prevent="handleSubmit" class="registration-form">
                    <div class="form-row">
                      <div class="form-group">
                        <label for="first-name">
                          First Name <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="first-name"
                          v-model="firstname"
                          placeholder="Enter your first name"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="middle-name">Middle Name</label>
                        <v-text-field
                          id="middle-name"
                          v-model="middleName"
                          placeholder="Enter your middle name"
                          variant="outlined"
                          density="compact"
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="last-name">
                          Last Name <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="last-name"
                          v-model="lastname"
                          placeholder="Enter your last name"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="birthdate">
                          Birthdate <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="birthdate"
                          v-model="birthdate"
                          type="date"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="age">
                          Age <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="age"
                          v-model.number="age"
                          type="number"
                          placeholder="Enter your age"
                          variant="outlined"
                          density="compact"
                          required
                          readonly
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="gender">
                          Sex <span class="required-text">Required</span>
                        </label>
                        <el-select
                          v-model="gender"
                          placeholder="Select sex"
                          size="large"
                          style="width: 100%"
                          :disabled="burialServiceStore.loading"
                        >
                          <el-option label="Male" value="M" />
                          <el-option label="Female" value="F" />
                        </el-select>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="address">
                        Address <span class="required-text">Required</span>
                      </label>
                      <v-text-field
                        id="address"
                        v-model="address"
                        placeholder="Enter your address"
                        variant="outlined"
                        density="compact"
                        required
                        hide-details
                        :disabled="burialServiceStore.loading"
                      ></v-text-field>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="email">
                          Email <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="email"
                          v-model="email"
                          type="email"
                          placeholder="Enter your email"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="civil_status">Civil Status</label>
                        <el-select
                        v-model="civilStatus"
                        placeholder="Select civil status"
                        size="large"
                        style="width: 100%"
                        :disabled="burialServiceStore.loading"
                      >
                        <el-option label="Single" value="single" />
                        <el-option label="Married" value="married" />
                        <el-option label="Widowed" value="widowed" />
                        <el-option label="Divorced" value="divorced" />
                        <el-option label="Separated" value="separated" />
                      </el-select>
                      </div>
                      <div class="form-group">
                        <label for="phone">
                          Phone Number <span class="required-text">Required</span>
                        </label>
                        <el-input
                        v-model="phoneNumber"
                        type="tel"
                        placeholder="9XXXXXXXXX"
                        size="large"
                        :maxlength="10"
                        :disabled="burialServiceStore.loading"
                      >
                        <template #prepend>+63</template>
                      </el-input>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="relationship">
                          Relationship to Deceased <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="relationship"
                          v-model="relationship"
                          placeholder="e.g., Spouse, Child, Parent"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="deceased-name">
                          Deceased Name <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="deceased-name"
                          v-model="deceasedName"
                          placeholder="Enter deceased person's name"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                    </div>

                    <div class="form-row form-row-3">
                      <div class="form-group">
                        <label for="deceased-birthdate">
                          Deceased Birth Date <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="deceased-birthdate"
                          v-model="deceasedBirthDate"
                          type="date"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="deceased-age">
                          Deceased Age <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="deceased-age"
                          v-model.number="deceasedAge"
                          type="number"
                          placeholder="Auto-calculated"
                          variant="outlined"
                          density="compact"
                          required
                          readonly
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="deceased-deathdate">
                          Date of Death <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="deceased-deathdate"
                          v-model="deceasedDeathDate"
                          type="date"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                    </div>

                    <v-btn
                      type="submit"
                      color="teal"
                      size="large"
                      block
                      class="submit-btn"
                      :loading="isSubmitting"
                      :disabled="isSubmitting"
                    >
                      {{ isSubmitting ? 'Submitting...' : 'Submit Service Request' }}
                    </v-btn>

                  </form>
                </v-card-text>
              </v-card>
              <v-card class="registration-card fade-in-up" style="animation-delay: 800ms;" v-else>
                <v-card-title class="registration-title">
                  Request Burial Service
                </v-card-title>
                <v-card-subtitle class="registration-subtitle">
                  You are signed in as a member. Use the button below to submit a burial service request.
                </v-card-subtitle>
                <v-card-text class="d-flex flex-column gap-4">
                  <div class="d-flex flex-column gap-2">
                    <strong>{{ userInfo.member?.firstname }} {{ userInfo.member?.lastname }}</strong>
                    <span class="text-caption">Account: {{ userInfo.account?.email }}</span>
                  </div>
                  <v-btn color="teal" size="large" block @click="showBurialDialog = true">
                    Request Burial Service
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-container>
      </section>
    </main>
    <BurialServiceDialog
      ref="burialDialogRef"
      :model-value="showBurialDialog"
      @update:model-value="showBurialDialog = $event"
      :burial-service-data="null"
      @submit="handleBurialDialogSubmit"
    />

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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBurialServiceStore } from '@/stores/ServicesRecords/burialServiceStore'
import BurialServiceDialog from '@/components/Dialogs/BurialServiceDialog.vue'
import axios from '@/api/axios'
import { useCms } from '@/composables/useCms'

const router = useRouter()
const burialServiceStore = useBurialServiceStore()

// CMS Data
const burialServiceData = ref({
  heroImage: '/img/burial.jpg',
  heroTitle: 'Burial Service',
  heroDescription: 'During times of loss and grief, our burial services provide comfort and hope through sacred ceremonies that honor life and celebrate eternal life through Jesus Christ.',
  sectionTitle: 'What is Burial Service?',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText: 'Burial services honor the sacredness of life and provide comfort during times of loss. We believe in the resurrection and eternal life through Jesus Christ, offering hope and peace to those who mourn.',
  ourCommitmentTitle: 'Our Commitment',
  ourCommitmentText: 'We provide compassionate support, meaningful ceremonies, and spiritual guidance during difficult times. Our services reflect God\'s love and the promise of eternal life.',
  whatWeOfferTitle: 'What We Offer',
  offerPoint1: 'Compassionate pastoral care and counseling',
  offerPoint2: 'Meaningful memorial services and ceremonies',
  offerPoint3: 'Support for grieving families and loved ones'
})

const { loadPageData, loading } = useCms('burialservice')

// User info
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const isLoggedIn = computed(() => {
  return userInfo.value.account && userInfo.value.account.account_id && userInfo.value.account.account_id.trim() !== ''
})

// Form fields
const firstname = ref('')
const middleName = ref('')
const lastname = ref('')
const birthdate = ref('')
const address = ref('')
const email = ref('')
const phoneNumber = ref('')
const gender = ref('')
const age = ref(0)
const relationship = ref('')
const deceasedName = ref('')
const deceasedBirthDate = ref('')
const deceasedAge = ref(0)
const deceasedDeathDate = ref('')
const civilStatus = ref('')

// Form state
const submitMessage = ref('')
const submitError = ref('')
const isSubmitting = ref(false)
const showBurialDialog = ref(false)
const burialDialogRef = ref(null)

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

// Initialize form with user info if logged in
onMounted(async () => {
  // Load CMS data (includes images as base64 data URLs from /full endpoint)
  const loadedData = await loadPageData()
  if (loadedData) {
    Object.assign(burialServiceData.value, loadedData)
  }

  const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  userInfo.value = storedUserInfo

  if (isLoggedIn.value) {
    firstname.value = userInfo.value.member.firstname || ''
    middleName.value = userInfo.value.member.middle_name || ''
    lastname.value = userInfo.value.member.lastname || ''
    birthdate.value = userInfo.value.member.birthdate || ''
    address.value = userInfo.value.member.address || ''
    email.value = userInfo.value.account.email || ''
    phoneNumber.value = userInfo.value.member.phone_number || ''
    gender.value = userInfo.value.member.gender || ''
    age.value = userInfo.value.member.age || 0
  }
})

// Watch birthdate to calculate age
watch(birthdate, (newDate) => {
  if (!newDate) return

  const birth = new Date(newDate)
  const today = new Date()
  
  if (birth >= today) {
    alert('Invalid Dates.')
    birthdate.value = ''
    return
  }

  let calculatedAge = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    calculatedAge--
  }

  age.value = calculatedAge
})

// Watch deceased dates to calculate deceased age
watch([deceasedBirthDate, deceasedDeathDate], ([birthDate, deathDate]) => {
  if (!birthDate) return

  const birth = new Date(birthDate)
  const death = deathDate ? new Date(deathDate) : new Date()
  
  if (birth >= death) {
    alert('Deceased birth date cannot be after death date.')
    deceasedBirthDate.value = ''
    return
  }

  let calculatedAge = death.getFullYear() - birth.getFullYear()
  const monthDiff = death.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
    calculatedAge--
  }

  deceasedAge.value = calculatedAge
})

// Format phone number (remove non-digit characters)
const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

const handleSubmit = async (e) => {
  e.preventDefault()
  
  // Reset messages
  submitMessage.value = ''
  submitError.value = ''

  // Basic validation
  if (!firstname.value.trim() || !lastname.value.trim() || !birthdate.value || 
      !age.value || !gender.value || !address.value.trim() || !email.value.trim() || 
      !phoneNumber.value || !relationship.value.trim() || !deceasedName.value.trim() || 
      !deceasedBirthDate.value || !deceasedDeathDate.value) {
    submitError.value = 'Please fill in all required fields.'
    ElMessage.error('Please fill in all required fields.')
    return
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    submitError.value = 'Please enter a valid email address.'
    ElMessage.error('Please enter a valid email address.')
    return
  }

  try {
    // Show confirmation dialog
    await ElMessageBox.confirm(
      'Are you sure you want to submit this burial service request? This will create a burial service record without creating a member account.',
      'Confirm Submission',
      {
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    )

    isSubmitting.value = true

    // Prepare payload matching backend burial service expectations
    const payload = {
      requester_name: `${firstname.value.trim()} ${middleName.value.trim() || ''} ${lastname.value.trim()}`.trim(),
      requester_email: email.value.trim().toLowerCase(),
      relationship: relationship.value.trim(),
      location: 'To be determined',
      pastor_name: null,
      service_date: null,
      status: 'pending',
      deceased_name: deceasedName.value.trim(),
      deceased_birthdate: deceasedBirthDate.value,
      date_death: deceasedDeathDate.value,
      // No member_id - this is for non-member requests
      member_id: null
    }

    const result = await burialServiceStore.createService(payload)
    
    if (result.success) {
      showSuccessDialog('Success!', 'Burial service request submitted successfully! Our pastoral team will support you during this time. No member account was created.')
      
      // Clear form after successful submission
      resetForm()
    } else {
      submitError.value = result.error || 'An error occurred while submitting the request. Please try again.'
      ElMessage.error(submitError.value)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error submitting form:', error)
      submitError.value = 'An error occurred while submitting the request. Please try again.'
      ElMessage.error(submitError.value)
    }
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  firstname.value = ''
  middleName.value = ''
  lastname.value = ''
  birthdate.value = ''
  address.value = ''
  email.value = ''
  phoneNumber.value = ''
  gender.value = ''
  age.value = 0
  relationship.value = ''
  deceasedName.value = ''
  deceasedBirthDate.value = ''
  deceasedAge.value = 0
  deceasedDeathDate.value = ''
  submitMessage.value = ''
  submitError.value = ''
}

const handleBurialDialogSubmit = async (payload) => {
  if (!burialDialogRef.value) return
  try {
    const { success, error } = await burialServiceStore.createService(payload)
    if (success) {
      showSuccessDialog('Success!', 'Burial service request submitted successfully! Our pastoral team will support you during this time.')
      showBurialDialog.value = false
    } else {
      ElMessage.error(error || 'Failed to submit burial service request.')
    }
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to submit burial service request.')
  } finally {
    burialDialogRef.value?.resetLoading()
  }
}
</script>

<style scoped>
.burial-service-page {
  width: 100vw;
  min-height: 100vh;
  background: white;
  position: relative;
}

.main-content {
  width: 100%;
  flex: 1;
}

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  margin-top: 64px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(243, 244, 246, 0.4), rgba(229, 231, 235, 0.4));
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  background: rgba(63, 211, 194, 0.62);
  border-radius: 50%;
  animation: float 3.5s ease-in-out infinite;
}

.float-1 { top: 80px; left: 80px; width: 48px; height: 48px; animation-delay: 0s; }
.float-2 { top: 33%; right: 64px; width: 32px; height: 32px; animation-delay: 1.5s; animation-name: floatRotate; }
.float-3 { bottom: 33%; left: 64px; width: 40px; height: 40px; animation-delay: 2s; }
.float-4 { bottom: 80px; right: 80px; width: 24px; height: 24px; animation-delay: 0.8s; }
.float-5 { top: 50%; left: 25%; width: 28px; height: 28px; animation-delay: 1.2s; animation-name: floatRotate12; }
.float-6 { bottom: 25%; right: 33%; width: 36px; height: 36px; animation-delay: 2.5s; }
.float-7 { top: 25%; left: 33%; width: 16px; height: 16px; animation-delay: 1.8s; animation-name: floatRotate; }
.float-8 { top: 75%; right: 25%; width: 44px; height: 44px; animation-delay: 0.3s; }
.float-9 { bottom: 50%; left: 16%; width: 20px; height: 20px; animation-delay: 2.1s; }
.float-10 { top: 40px; left: 40px; width: 64px; height: 64px; animation-delay: 0s; }
.float-11 { top: 80px; right: 80px; width: 48px; height: 48px; animation-delay: 1s; }
.float-12 { bottom: 80px; left: 80px; width: 56px; height: 56px; animation-delay: 2s; animation-name: floatRotate; }

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes floatRotate {
  0%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  50% {
    transform: translateY(-20px) rotate(225deg);
  }
}

@keyframes floatRotate12 {
  0%, 100% {
    transform: translateY(0) rotate(12deg);
  }
  50% {
    transform: translateY(-20px) rotate(192deg);
  }
}

.clip-path-star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  border-radius: 0;
}

.clip-path-triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  border-radius: 0;
}

.clip-path-diamond {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  border-radius: 0;
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 16px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -0.025em;
  font-family: 'Georgia', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.125rem;
  color: white;
  font-weight: 300;
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s both;
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

@media (min-width: 768px) {
  .hero-title {
    font-size: 5rem;
  }
  .hero-subtitle {
    font-size: 1.25rem;
  }
}

@media (max-width: 640px) {
  .hero-section {
    min-height: 70vh;
    margin-top: 64px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    padding: 0 16px;
  }

  .hero-content {
    padding: 0 16px;
  }

  .content-section {
    padding: 32px 0;
  }

  .section-title {
    font-size: 1.5rem;
    margin-bottom: 24px;
  }

  .info-cards {
    gap: 16px;
    margin-bottom: 24px;
  }

  .card-title {
    font-size: 1.25rem;
  }

  .who-baptized-card {
    padding: 16px;
  }

  .who-title {
    font-size: 1.125rem;
  }

  .registration-card {
    margin-top: 24px;
  }

  .registration-title {
    font-size: 1.25rem;
  }

  .registration-subtitle {
    font-size: 0.8125rem;
  }

  .floating-element {
    display: none;
  }
}

/* Content Section */
.content-section {
  position: relative;
  padding: 64px 0;
  background: white;
  overflow: hidden;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  position: relative;
  z-index: 2;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.section-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 32px;
  font-family: 'Georgia', serif;
  color: #000;
}

.fade-in {
  animation: fadeIn 0.6s ease-out both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.info-cards {
  display: grid;
  gap: 24px;
  margin-bottom: 32px;
}

.info-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
}

.who-baptized-card {
  background: #f9fafb;
  padding: 24px;
  border-radius: 8px;
}

.who-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
  color: #000;
}

.baptized-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.baptized-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  transition: transform 0.5s;
}

.baptized-item:hover {
  transform: translateX(8px);
}

.check-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

/* Welcome Alert */
.welcome-alert {
  margin-bottom: 24px;
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alert-text {
  margin: 0;
  font-size: 0.875rem;
}

/* Registration Card */
.registration-card {
  border: 1px solid #5eead4;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.registration-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
}

.registration-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-row-3 {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
  .form-row-3 {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.required {
  color: #ef4444;
}

.required-text {
  color: #ef4444;
  font-size: 0.75rem;
  margin-left: 4px;
}

.submit-btn {
  margin-top: 8px;
}
</style>
