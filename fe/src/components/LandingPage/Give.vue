<template>
  <div class="give-page" style="position: relative;">
    <!-- Loading overlay -->
    <v-overlay :model-value="isLoadingGive" contained class="align-center justify-center" style="z-index: 1000;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${giveData.heroImage})` }"
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
        <h1 class="hero-title">{{ giveData.heroTitle }}</h1>
        <p class="hero-subtitle">
          {{ giveData.heroSubtitle }}
        </p>
      </div>
    </section>

    <!-- Giving Section -->
    <section class="giving-section py-20">
      <v-container>
        <div class="text-center mb-16">
          <h2 class="text-h3 text-md-h4 font-weight-bold text-grey-darken-3 mb-4 fade-in-up" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ giveData.sectionTitle }}
          </h2>
        </div>

        <div class="giving-content">
          <v-card class="pa-8 mb-8" elevation="2">
            <p class="text-h6 text-grey-darken-1 text-center mb-8" style="font-family: 'Georgia', serif; font-style: italic;">
              Biblical giving is an act of worship and obedience to God. The Bible teaches us that everything we have comes from God, and we are called to be faithful stewards of His blessings.
            </p>
            <div class="space-y-6">
              <v-card
                class="mb-4"
                variant="flat"
                color="grey-lighten-5"
                hover
              >
                <v-card-text>
                  <h3 class="text-h6 font-weight-bold mb-3" style="font-family: 'Georgia', serif; font-style: italic;">{{ giveData.biblicalFoundationTitle }}</h3>
                  <p class="text-body-2 text-grey-darken-1" style="font-family: 'Georgia', serif; font-style: italic;">
                    {{ giveData.biblicalFoundationText }}
                  </p>
                </v-card-text>
              </v-card>
              <v-card
                class="mb-4"
                variant="flat"
                color="grey-lighten-5"
                hover
              >
                <v-card-text>
                  <h3 class="text-h6 font-weight-bold mb-3" style="font-family: 'Georgia', serif; font-style: italic;">{{ giveData.purposeTitle }}</h3>
                  <p class="text-body-2 text-grey-darken-1" style="font-family: 'Georgia', serif; font-style: italic;">
                    {{ giveData.purposeText }}
                  </p>
                </v-card-text>
              </v-card>
            </div>
          </v-card>

          <v-card class="pa-6" elevation="2">
            <p class="text-h6 text-grey-darken-1 text-center mb-8" style="font-family: 'Georgia', serif; font-style: italic;">
              {{ giveData.chooseMethodText }}
            </p>

            <v-row class="give-methods-row">
              <v-col cols="12" md="6" class="give-online-col">
                <h4 class="text-h6 font-weight-bold mb-2" style="font-family: 'Georgia', serif; font-style: italic;">Give Online</h4>
                <GiveOnlineForm 
                  :gcash-logo-image="giveData.gcashLogoImage"
                  :gcash-qr-image="giveData.gcashQrImage"
                  :gcash-instruction-text="giveData.gcashInstructionText"
                  :maya-logo-image="giveData.mayaLogoImage"
                  :maya-qr-image="giveData.mayaQrImage"
                  :maya-instruction-text="giveData.mayaInstructionText"
                />
              </v-col>
              <v-col cols="12" md="6" class="give-in-person-col">
                <h4 class="text-h6 font-weight-bold mb-2" style="font-family: 'Georgia', serif; font-style: italic;">Other Ways to Give</h4>
                <GiveInPersonCard :giveInPersonData="giveInPersonData" />
              </v-col>
            </v-row>

            <!-- Submit Donation Proof Section -->
            <div class="donation-proof-section">
              <div class="donation-proof-divider">
                <span class="divider-text">Already paid via GCash or Maya?</span>
              </div>
              <div class="donation-proof-cta">
                <p class="cta-description">
                  After completing your payment, submit your receipt screenshot so the church can verify and record your donation.
                </p>
                <v-btn
                  color="#14b8a6"
                  class="text-white donation-proof-btn"
                  size="large"
                  rounded
                  elevation="3"
                  @click="showDonationProofDialog = true"
                >
                  <v-icon start>mdi-receipt-text-outline</v-icon>
                  Submit Donation Proof
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>
      </v-container>
    </section>

    <!-- Back Button -->
    <section class="py-12 text-center bg-white">
      <v-btn
        :color="giveData.backButtonColor"
        class="text-white"
        size="large"
        rounded
        @click="$router.push('/')"
        style="font-family: 'Georgia', serif; font-style: italic;"
      >
        {{ giveData.backButtonText }}
      </v-btn>
    </section>

    <!-- Donation Proof Dialog -->
    <DonationProofDialog
      v-model="showDonationProofDialog"
      @submitted="handleDonationSubmitted"
    />
    
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GiveOnlineForm from './GiveOnlineForm.vue'
import GiveInPersonCard from './GiveInPersonCard.vue'
import DonationProofDialog from '../Dialogs/DonationProofDialog.vue'
import axios from '@/api/axios'

// Donation proof dialog state
const showDonationProofDialog = ref(false)

// Handle successful donation submission
const handleDonationSubmitted = (data) => {
  console.log('Donation submitted successfully:', data)
}


const giveData = ref({
  heroImage: '/img/give.jpg',
  heroTitle: 'Give Generously',
  heroSubtitle: "Your generous donations help us share God's Word, serve our community, and support those in need. Every gift makes a lasting impact.",
  sectionTitle: 'Biblical Giving & Donation',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText: 'Biblical giving is an act of worship and obedience to God. The Bible teaches us that everything we have comes from God, and we are called to be faithful stewards of His blessings.',
  purposeTitle: 'Purpose of Giving',
  purposeText: "Your generous donations support our church's mission to spread the Gospel, serve our community, and help those in need. Every gift enables us to continue God's work in our midst.",
  chooseMethodText: 'Choose your preferred method of giving below. Every gift makes a lasting impact.',
  gcashText: 'GCash',
  gcashNumber: '09309224324',
  gcashLogoImage: '/img/gcash.png',
  gcashQrImage: '/img/gcash-qr.png',
  gcashInstructionText: 'Send your donation to this GCash account',
  mayaText: 'Maya',
  mayaNumber: '',
  mayaLogoImage: '',
  mayaQrImage: '',
  mayaInstructionText: 'Send your donation to this Maya account',
  backButtonText: 'Back to Home',
  backButtonColor: '#00bcd4'
})

const giveInPersonData = ref({
  giveInPersonTitle: 'Give in Person',
  giveInPersonText: 'You can give during any of our worship services by placing your donation in the offering box.',
  sundayServicesLabel: 'Sunday Services:',
  sundayServicesTime: '9:00 AM - 11:00 AM',
  scheduledGivingTitle: 'Scheduled Giving',
  scheduledGivingText: "If you'd like to set up regular, scheduled giving, please contact our church office for assistance. We can help you establish a consistent giving plan that works for you."
})

const floatingElements = ref([
  { style: { top: '80px', left: '80px', width: '48px', height: '48px', animationDelay: '0s' } },
  { style: { top: '33%', right: '64px', width: '32px', height: '32px', animationDelay: '1.5s' } },
  { style: { bottom: '33%', left: '64px', width: '40px', height: '40px', animationDelay: '2s' } },
  { style: { bottom: '80px', right: '80px', width: '24px', height: '24px', animationDelay: '0.8s' } },
  { style: { top: '50%', left: '25%', width: '28px', height: '28px', animationDelay: '1.2s' } },
  { style: { bottom: '25%', right: '33%', width: '36px', height: '36px', animationDelay: '2.5s' } },
  { style: { top: '25%', left: '33%', width: '16px', height: '16px', animationDelay: '1.8s' } },
  { style: { top: '75%', right: '25%', width: '44px', height: '44px', animationDelay: '0.3s' } },
  { style: { bottom: '50%', left: '16%', width: '20px', height: '20px', animationDelay: '2.1s' } }
])

// Loading state for CMS data
const isLoadingGive = ref(false)

// Fetch give data from CMS
const fetchGiveData = async () => {
  isLoadingGive.value = true
  try {
    const response = await axios.get('/cms/give/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Give:', { content, cmsImages })
      
      // Update give data from content
      if (content.heroTitle) giveData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) giveData.value.heroSubtitle = content.heroSubtitle
      if (content.sectionTitle) giveData.value.sectionTitle = content.sectionTitle
      if (content.biblicalFoundationTitle) giveData.value.biblicalFoundationTitle = content.biblicalFoundationTitle
      if (content.biblicalFoundationText) giveData.value.biblicalFoundationText = content.biblicalFoundationText
      if (content.purposeTitle) giveData.value.purposeTitle = content.purposeTitle
      if (content.purposeText) giveData.value.purposeText = content.purposeText
      if (content.chooseMethodText) giveData.value.chooseMethodText = content.chooseMethodText
      if (content.gcashText) giveData.value.gcashText = content.gcashText
      if (content.gcashNumber) giveData.value.gcashNumber = content.gcashNumber
      if (content.gcashInstructionText) giveData.value.gcashInstructionText = content.gcashInstructionText
      if (content.mayaText) giveData.value.mayaText = content.mayaText
      if (content.mayaNumber) giveData.value.mayaNumber = content.mayaNumber
      if (content.mayaInstructionText) giveData.value.mayaInstructionText = content.mayaInstructionText
      if (content.backButtonText) giveData.value.backButtonText = content.backButtonText
      if (content.backButtonColor) {
        giveData.value.backButtonColor = content.backButtonColor
        console.log('Back button color from CMS:', content.backButtonColor)
      }
      
      // Update giveInPerson data from content
      if (content.giveInPersonTitle) giveInPersonData.value.giveInPersonTitle = content.giveInPersonTitle
      if (content.giveInPersonText) giveInPersonData.value.giveInPersonText = content.giveInPersonText
      if (content.sundayServicesLabel) giveInPersonData.value.sundayServicesLabel = content.sundayServicesLabel
      if (content.sundayServicesTime) giveInPersonData.value.sundayServicesTime = content.sundayServicesTime
      if (content.scheduledGivingTitle) giveInPersonData.value.scheduledGivingTitle = content.scheduledGivingTitle
      if (content.scheduledGivingText) giveInPersonData.value.scheduledGivingText = content.scheduledGivingText
      
      // Handle images - images are stored as BLOB, returned as base64 in images object
      // The images are stored with field_name in tbl_cms_images
      if (cmsImages && typeof cmsImages === 'object') {
        // Handle GCash Logo
        if (cmsImages.gcashLogoImage) {
          const logoBase64 = cmsImages.gcashLogoImage
          if (logoBase64 && typeof logoBase64 === 'string' && logoBase64.startsWith('data:image/')) {
            giveData.value.gcashLogoImage = logoBase64
            console.log('✅ GCash logo loaded from CMS')
          }
        }
        // Handle GCash QR Code
        if (cmsImages.gcashQrImage) {
          const qrBase64 = cmsImages.gcashQrImage
          if (qrBase64 && typeof qrBase64 === 'string' && qrBase64.startsWith('data:image/')) {
            giveData.value.gcashQrImage = qrBase64
            console.log('✅ GCash QR code loaded from CMS')
          }
        }
        // Handle Maya Logo
        if (cmsImages.mayaLogoImage) {
          const logoBase64 = cmsImages.mayaLogoImage
          if (logoBase64 && typeof logoBase64 === 'string' && logoBase64.startsWith('data:image/')) {
            giveData.value.mayaLogoImage = logoBase64
            console.log('✅ Maya logo loaded from CMS')
          }
        }
        // Handle Maya QR Code
        if (cmsImages.mayaQrImage) {
          const qrBase64 = cmsImages.mayaQrImage
          if (qrBase64 && typeof qrBase64 === 'string' && qrBase64.startsWith('data:image/')) {
            giveData.value.mayaQrImage = qrBase64
            console.log('✅ Maya QR code loaded from CMS')
          }
        }
        // Handle hero image
        if (cmsImages.heroImage) {
          const heroImageBase64 = cmsImages.heroImage
          if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
            giveData.value.heroImage = heroImageBase64
            console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
          } else {
            console.log('⚠️ Hero image in CMS is not a valid base64 image')
          }
        }
      } else {
        console.log('ℹ️ No images found in CMS, using defaults')
      }
      
      console.log('✅ Give CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Give, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching give data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  } finally {
    isLoadingGive.value = false
  }
}

onMounted(async () => {
  await fetchGiveData()
})
</script>

<style scoped>
.give-page {
  min-height: 100vh;
  background: white;
  margin-top: 64px;
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
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3));
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
  max-width: 80rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.hero-subtitle {
  font-size: 1.25rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.giving-section {
  background: white;
  position: relative;
}

.giving-section :deep(.v-card) {
  transition: all 0.3s ease;
}

.giving-section :deep(.v-card:hover) {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.giving-section :deep(.v-btn) {
  transition: all 0.3s ease;
}

.giving-section :deep(.v-btn:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
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

@media (max-width: 960px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}

/* Donation Proof Section */
.donation-proof-section {
  margin-top: 32px;
  padding-top: 0;
}

.donation-proof-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.donation-proof-divider::before,
.donation-proof-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider-text {
  padding: 0 16px;
  color: #757575;
  font-size: 14px;
  font-family: 'Georgia', serif;
  font-style: italic;
  white-space: nowrap;
}

.donation-proof-cta {
  text-align: center;
  padding: 8px 0 16px;
}

.cta-description {
  color: #757575;
  font-size: 14px;
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
  font-style: italic;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.donation-proof-btn {
  font-family: 'Georgia', serif;
  font-style: italic;
  letter-spacing: 0.5px;
  padding: 12px 32px !important;
  font-size: 15px !important;
  transition: all 0.3s ease;
}

.donation-proof-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.35) !important;
}
</style>


