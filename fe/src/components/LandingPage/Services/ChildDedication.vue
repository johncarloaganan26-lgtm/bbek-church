<template>
  <div class="child-dedication-page" style="position: relative; min-height: 100vh; background: white;">
    <!-- Loading overlay -->
    <v-overlay :model-value="loading" contained class="align-center justify-center" style="z-index: 1000;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <main class="main-content" style="min-height: 100vh; position: relative; z-index: 1;">
      <!-- Hero Section -->
      <section class="hero-section">
        <div
          class="hero-background"
          :style="{ backgroundImage: `url(${childDedicationData.heroImage || '/img/child-dedication.jpg'})` }"
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
            {{ childDedicationData.heroTitle }}
          </h1>
          <p class="hero-subtitle fade-in-up-delay">
            {{ childDedicationData.heroDescription }}
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
            <!-- Left Column: What is Child Dedication -->
            <div class="left-column">
              <h2 class="section-title fade-in" style="animation-delay: 200ms;">
                {{ childDedicationData.sectionTitle }}
              </h2>
              
              <div class="info-cards">
                <v-card class="info-card fade-in-up" style="animation-delay: 300ms;">
                  <v-card-title class="card-title">
                    {{ childDedicationData.biblicalFoundationTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p>
                      {{ childDedicationData.biblicalFoundationText }}
                    </p>
                  </v-card-text>
                </v-card>

                <v-card class="info-card fade-in-up" style="animation-delay: 400ms;">
                  <v-card-title class="card-title">
                    {{ childDedicationData.ourCommitmentTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p>
                      {{ childDedicationData.ourCommitmentText }}
                    </p>
                  </v-card-text>
                </v-card>
              </div>

              <v-card class="who-baptized-card fade-in" style="animation-delay: 500ms;">
                <v-card-title class="who-title">{{ childDedicationData.whatWeOfferTitle }}</v-card-title>
                <v-card-text>
                  <ul class="baptized-list">
                    <li class="baptized-item">
                      <v-icon color="green" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span>{{ childDedicationData.offerPoint1 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="green" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span>{{ childDedicationData.offerPoint2 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="green" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span>{{ childDedicationData.offerPoint3 }}</span>
                    </li>
                  </ul>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right Column: Register for Child Dedication (Only for logged in users) -->
            <div class="right-column" id="register" v-if="userInfo.account && userInfo.account.acc_id">
              <h2 class="section-title fade-in" style="animation-delay: 700ms;">
                Request Child Dedication
              </h2>
              
              <v-card class="registration-card fade-in-up" style="animation-delay: 800ms;">
                <v-card-title class="registration-title">
                  Child Dedication Request
                </v-card-title>
                <v-card-subtitle class="registration-subtitle">
                  You are signed in as a member. Use the dialog below to submit or update a child dedication request.
                </v-card-subtitle>
                <v-card-text class="d-flex flex-column gap-4">
                  <div class="d-flex flex-column gap-2">
                    <strong>{{ userInfo.member?.firstname }} {{ userInfo.member?.lastname }}</strong>
                    <span class="text-caption">Account: {{ userInfo.account?.email }}</span>
                  </div>
                  <v-btn color="teal" size="large" block @click="showChildDedicationDialog = true">
                    Request Child Dedication Service
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right Column: Login Prompt (For non-logged in users) -->
            <div class="right-column" id="register" v-else>
              <h2 class="section-title fade-in" style="animation-delay: 700ms;">
                Request Child Dedication
              </h2>
              
              <v-card class="registration-card fade-in-up" style="animation-delay: 800ms;">
                <v-card-title class="registration-title">
                  Child Dedication Request
                </v-card-title>
                <v-card-subtitle class="registration-subtitle">
                  Please log in to your account to request a child dedication.
                </v-card-subtitle>
                <v-card-text class="d-flex flex-column gap-4">
                  <v-alert
                    type="info"
                    variant="tonal"
                    class="login-alert"
                  >
                    <div class="alert-content">
                      <v-icon start>mdi-information</v-icon>
                      <div>
                        <strong>Login Required</strong>
                        <p class="alert-text">You need to be logged in as a member to request a child dedication. Please log in to continue.</p>
                      </div>
                    </div>
                  </v-alert>
                  <v-btn 
                    color="teal" 
                    size="large" 
                    block 
                    @click="openLoginDialog"
                  >
                    Go to Login
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-container>
      </section>
    </main>
    <LoginDialog
      :model-value="showLoginDialog"
      @update:model-value="showLoginDialog = $event"
      @close="showLoginDialog = false"
    />
    <ChildDedicationDialog
      ref="childDedicationDialogRef"
      :model-value="showChildDedicationDialog"
      @update:model-value="showChildDedicationDialog = $event"
      :dedication-data="selectedDedicationData"
      @submit="handleChildDedicationDialogSubmit"
      @switch-to-edit="handleSwitchToEdit"
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useChildDedicationStore } from '@/stores/ServicesRecords/childDedicationStore'
import ChildDedicationDialog from '@/components/Dialogs/ChildDedicationDialog.vue'
import LoginDialog from '@/components/Dialogs/LoginDialog.vue'
import axios from '@/api/axios'
import { useCms } from '@/composables/useCms'

const childDedicationStore = useChildDedicationStore()
const showLoginDialog = ref(false)

// CMS Data
const childDedicationData = ref({
  heroImage: '/img/child-dedication.jpg',
  heroTitle: 'Child Dedication',
  heroDescription: 'Dedicate your child to the Lord and commit to raising them in a Christ-centered home. Our child dedication service is a meaningful celebration of your family\'s commitment to God.',
  sectionTitle: 'What is Child Dedication?',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText: 'Child dedication is a public commitment by parents to raise their child according to God\'s Word and in the ways of the Lord. It is a beautiful expression of faith and a promise to guide your child in their spiritual journey.',
  ourCommitmentTitle: 'Our Commitment',
  ourCommitmentText: 'We are committed to supporting families in their journey of raising children in the faith. Through our dedication services, we join with parents in prayer and commitment to nurture the next generation in Christ.',
  whatWeOfferTitle: 'What We Offer',
  offerPoint1: 'Meaningful dedication ceremonies and celebrations',
  offerPoint2: 'Pastoral support and guidance for parents',
  offerPoint3: 'Ongoing resources and community for Christian families'
})

const { loadPageData, loading } = useCms('childdedication')

// User info
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// Dialog state
const showChildDedicationDialog = ref(false)
const childDedicationDialogRef = ref(null)
const selectedDedicationData = ref(null)

// Success dialog state
const successDialog = ref({
  show: false,
  title: '',
  message: ''
})

// Initialize on mount
onMounted(async () => {
  try {
    // Load CMS data (includes images as base64 data URLs from /full endpoint)
    const loadedData = await loadPageData()
    if (loadedData) {
      Object.assign(childDedicationData.value, loadedData)
    }
  } catch (error) {
    console.error('Error loading CMS data:', error)
    // Continue even if CMS loading fails - use default data
  }

  try {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    userInfo.value = storedUserInfo
  } catch (error) {
    console.error('Error loading user info:', error)
    userInfo.value = {}
  }
})

const openLoginDialog = () => {
  showLoginDialog.value = true
}

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

const handleChildDedicationDialogSubmit = async (payload) => {
  if (!childDedicationDialogRef.value) return
  try {
    const { success, error } = await childDedicationStore.createDedication(payload)
    if (success) {
      showSuccessDialog('Success!', 'Child dedication request submitted successfully. Our pastoral team will contact you soon.')
      showChildDedicationDialog.value = false
      selectedDedicationData.value = null // Clear selected data after successful submission
      // Refresh unavailable time slots in case new slots are now blocked
      if (childDedicationDialogRef.value) {
        childDedicationDialogRef.value.fetchUnavailableTimeSlots()
      }
    } else {
      ElMessage.error(error || 'Failed to submit child dedication request.')
      showChildDedicationDialog.value = false
    }
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to submit child dedication request.')
    showChildDedicationDialog.value = false
  } finally {
    childDedicationDialogRef.value?.resetLoading()
  }
}

// Handle switch to edit mode
const handleSwitchToEdit = (dedication) => {
  selectedDedicationData.value = dedication
  showChildDedicationDialog.value = true
}
</script>

<style scoped>
.child-dedication-page {
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
  background-color: #4b5563;
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

/* Login Alert */
.login-alert {
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
</style>

