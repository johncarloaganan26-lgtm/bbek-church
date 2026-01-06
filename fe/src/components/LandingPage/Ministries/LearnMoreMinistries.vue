<template>
  <div class="learn-more-ministry-page">
    
    <!-- Floating Elements -->
    <div class="floating-elements">
      <div
        v-for="(element, index) in floatingElements"
        :key="index"
        class="floating-element"
        :style="element.style"
      ></div>
    </div>

    <div v-if="loading" class="w-100 h-auto d-flex flex-column align-center justify-center">
      <div class="min-h-screen bg-grey-lighten-5">
        <div class="bg-white border-b border-grey-lighten-2 pa-6">
          <div class="text-center">
            <v-progress-circular
              indeterminate
              color="teal"
              size="48"
              class="mb-4"
            ></v-progress-circular>
            <p class="mt-4 text-grey-darken-1">Loading ministry details...</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!model" class="w-100 h-auto d-flex flex-column align-center justify-center">
      <div class="min-h-screen bg-grey-lighten-5">
        <div class="bg-white border-b border-grey-lighten-2 pa-6">
          <div class="text-center">
            <h2 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">Ministry Not Found</h2>
            <p class="text-grey-darken-1">The ministry you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="w-full min-h-screen relative" :style="{ backgroundColor: learnMoreMinistryData.backgroundColor || '#ffffff' }">
      <!-- Hero Section -->
      <section
        class="hero-section"
        :style="{ backgroundImage: learnMoreMinistryData.heroImage ? `url(${learnMoreMinistryData.heroImage})` : `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/img/youth (4).jpg')` }"
      >
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title">{{ model?.ministryName || model?.ministry_name || 'Ministry Details' }}</h1>
          <p class="hero-subtitle">
            {{ learnMoreMinistryData.heroSubtitle || 'Discover more about this ministry and join us in serving God.' }}
          </p>
        </div>
      </section>

      <!-- Content Section -->
      <section class="content-section relative w-full py-20">
        <v-container>
          <v-row align="center" class="gap-12">
            <!-- Left Side - Description and Info -->
            <v-col cols="12" lg="6">
              <div class="space-y-6">
                <h2 class="text-3xl md:text-4xl font-weight-bold text-black mb-4" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                  {{ learnMoreMinistryData.aboutTitle || 'About This Ministry' }}
                </h2>
                <p class="text-lg text-black leading-relaxed font-normal">
                  {{ model?.description || learnMoreMinistryData.defaultDescription || "This ministry is designed to help believers grow in faith, connect with community, and discover God's purpose for their lives." }}
                </p>

                <v-card
                  class="mb-4 ministry-card ministry-card-1"
                  variant="flat"
                  color="teal-lighten-5"
                >
                  <v-card-text>
                    <div class="d-flex align-start gap-3">
                      <v-icon color="teal-darken-3" size="24" class="mt-1">mdi-calendar</v-icon>
                      <div>
                        <h3 class="text-h6 font-weight-bold text-teal-darken-3 mb-2">Schedule</h3>
                        <p class="text-teal-darken-2">{{ formatDate(model?.schedule) || 'Weekly meetings' }}</p>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <v-card
                  class="mb-4 ministry-card ministry-card-2"
                  variant="flat"
                  color="teal-lighten-5"
                >
                  <v-card-text>
                    <div class="d-flex align-start gap-3">
                      <v-icon color="teal-darken-3" size="24" class="mt-1">mdi-clock-outline</v-icon>
                      <div>
                        <h3 class="text-h6 font-weight-bold text-teal-darken-3 mb-2">Time</h3>
                        <p class="text-teal-darken-2">{{ formatTime(model?.schedule) }}</p>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <v-card
                  class="mb-4 ministry-card ministry-card-3"
                  variant="flat"
                  color="teal-lighten-5"
                >
                  <v-card-text>
                    <div class="d-flex align-start gap-3">
                      <v-icon color="teal-darken-3" size="24" class="mt-1">mdi-account</v-icon>
                      <div>
                        <h3 class="text-h6 font-weight-bold text-teal-darken-3 mb-2">Leader</h3>
                        <p class="text-teal-darken-2">{{ model?.leader || 'Ministry Leader' }}</p>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <v-card
                  class="mb-4 ministry-card ministry-card-4"
                  variant="flat"
                  color="teal-lighten-5"
                >
                  <v-card-text>
                    <v-btn
                      v-if="userInfo?.member?.member_id"
                      :loading="loading"
                      size="large"
                      :class="getButtonClass"
                      :style="{ '--btn-bg': getButtonColor, '--btn-color': 'white', '--btn-border': getButtonColor }"
                      :disabled="getButtonDisabled"
                      @click="handleJoinMinistry"
                      block
                    >
                      {{ getButtonText }}
                    </v-btn>
                    <v-btn
                      v-else
                      size="large"
                      class="join-btn"
                      :style="{ '--btn-bg': learnMoreMinistryData.buttonColor || '#16a34a', '--btn-color': 'white', '--btn-border': learnMoreMinistryData.buttonColor || '#16a34a' }"
                      @click="handleJoinAsGuest"
                      block
                    >
                      Become a Member
                    </v-btn>
                  </v-card-text>
                </v-card>
              </div>
            </v-col>

            <!-- Right Side - Image -->
            <v-col cols="12" lg="6">
              <v-img
                :src="`${model?.imageUrl}`"
                :alt="model?.ministry_name || 'Ministry'"
                height="80vh"
                cover
                class="rounded-lg ministry-image"
              ></v-img>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- Join Community Section -->
      <section class="join-section py-16 bg-white text-black">
        <v-container>
          <div class="text-center">
            <h2 class="text-4xl font-weight-bold mb-6 text-black" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              {{ learnMoreMinistryData.joinCommunityTitle || 'Join Our Community' }}
            </h2>
            <p class="text-xl mb-10 max-w-2xl mx-auto text-grey-darken-1" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              {{ learnMoreMinistryData.joinCommunityText || 'We invite you to be a part of our church family. Come worship with us and experience the love of Christ.' }}
            </p>
            <v-btn
              size="large"
              rounded
              class="text-white join-community-btn"
              :style="{ backgroundColor: learnMoreMinistryData.joinButtonColor || '#14b8a6', borderColor: learnMoreMinistryData.joinButtonColor || '#14b8a6', fontFamily: 'Georgia, serif', fontStyle: 'italic' }"
              @click="$router.push('/beoneofus/accept-jesus')"
            >
              Become a Member
            </v-btn>
          </div>
        </v-container>
      </section>
    </div>
    
    <AcceptJesusChristDialog 
      :modelValue="showJoinEvent" 
      :type="'ministry'" 
      :requestId="model?.ministry_id || model?.id"
      @update:modelValue="showJoinEvent = $event"
      @approval-created="handleApprovalCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/api/axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import AcceptJesusChristDialog from '../Dialog/AcceptJesusChristDialog.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const isMemberLandPage = ref(false)
const showJoinEvent = ref(false)
const model = ref(null)
const loading = ref(false)
const approvalStatus = ref(null)
const checkingStatus = ref(false)

// In Vue Router, state is accessed via query params
const ministryModelFromState = ref(
  route.query?.ministryModel ? JSON.parse(decodeURIComponent(route.query.ministryModel)) : null
)

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

const formatTime = (time) => {
  if(!time) return 'TBA'
  return dayjs(time).format('h:mm A')
}

const formatDate = (date) => {
  if (!date) return 'TBA'
  return dayjs(date).format('MMMM D, YYYY')
}

const fetchMinistryData = async () => {
  try {
    loading.value = true
    // For now, use the model from state if available
    if (ministryModelFromState.value) {
      model.value = ministryModelFromState.value
      loading.value = false
    } else {
      loading.value = false
      model.value = null
    }
  } catch (error) {
    console.error('Error fetching ministry:', error)
    router.push('/ministries')
  }
}

const handleJoinMinistry = async () => {
  // Don't allow joining if already has approval (pending, approved, or rejected)
  if (approvalStatus.value !== null) {
    ElMessage.warning('You have already submitted a request for this ministry.')
    return
  }
  
  // Show confirmation dialog before submitting
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to join "${model.value?.ministryName || model?.ministry_name || 'this ministry'}"? Your request will be reviewed by an admin.`,
      'Confirm Join Request',
      {
        confirmButtonText: 'Join',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    )
  } catch (error) {
    return
  }
  
  // create approval
  try {
    loading.value = true
    const approvalData = {
      email: userInfo.value.account.email,
      type: 'ministry',
      request_id: model.value?.ministry_id || model.value?.id,
      status: 'pending'
    }
    const response = await axios.post('/church-records/approvals/createApproval', approvalData)
    if (response.data.success) {
      ElMessage.success('Your request to join has been submitted. An admin will review and approve your request.')
      approvalStatus.value = 'pending'
    } else {
      ElMessage.error(response.data.message || 'Failed to submit join request')
    }
  } catch (error) {
    console.error('Error creating approval:', error)
    ElMessage.error('An error occurred while submitting your request. Please try again.')
  } finally {
    loading.value = false
  }
}

const handleJoinAsGuest = () => {
  // Navigate to Accept Jesus Christ page for non-logged in users
  showJoinEvent.value = true
}

const handleApprovalCreated = () => {
  // When approval is created in dialog, update the status
  approvalStatus.value = 'pending'
  // Re-check to get the latest approval info
  checkIfAlreadyJoined()
}

const checkIfAlreadyJoined = async () => {
  const ministryId = model.value?.ministry_id || model.value?.id
  if (!userInfo.value?.account?.email || !ministryId) {
    return
  }

  // Don't check if already have a status
  if (approvalStatus.value !== null) {
    return
  }

  checkingStatus.value = true
  try {
    const response = await axios.get('/church-records/approvals/checkMemberApprovalStatus', {
      params: {
        email: userInfo.value.account.email,
        type: 'ministry',
        request_id: ministryId
      }
    })

    if (response.data.success && response.data.data?.status) {
      approvalStatus.value = response.data.data.status
    } else {
      approvalStatus.value = null
    }
  } catch (error) {
    console.error('Error checking approval status:', error)
    approvalStatus.value = null
  } finally {
    checkingStatus.value = false
  }
}

watch(() => route.params.id, () => {
  if (!ministryModelFromState.value && route.params.id) {
    fetchMinistryData()
  }
})

watch(() => model.value, (newModel) => {
  // When model is loaded, check if member has already joined
  if (newModel && userInfo.value?.member?.member_id) {
    checkIfAlreadyJoined()
  }
})

const learnMoreMinistryData = ref({
  backgroundColor: '#ffffff',
  buttonColor: '#16a34a',
  aboutTitle: 'About This Ministry',
  defaultDescription: "This ministry is designed to help believers grow in faith, connect with community, and discover God's purpose for their lives.",
  detailsTitle: 'Ministry Details',
  joinButtonText: 'Join Us',
  pendingText: 'Pending Request',
  approvedText: 'You Already Join',
  rejectedText: 'Request Rejected',
  heroImage: null,
  heroSubtitle: 'Discover more about this ministry and join us in serving God.',
  joinCommunityTitle: 'Join Our Community',
  joinCommunityText: 'We invite you to be a part of our church family. Come worship with us and experience the love of Christ.',
  joinButtonColor: '#14b8a6'
})

// Computed properties for button states
const getButtonText = computed(() => {
  if (approvalStatus.value === 'pending') {
    return learnMoreMinistryData.value.pendingText || 'Pending Request'
  } else if (approvalStatus.value === 'approved') {
    return learnMoreMinistryData.value.approvedText || 'You Already Join'
  } else if (approvalStatus.value === 'rejected') {
    return learnMoreMinistryData.value.rejectedText || 'Request Rejected'
  }
  return learnMoreMinistryData.value.joinButtonText || 'Join Us'
})

const getButtonClass = computed(() => {
  if (approvalStatus.value === null) {
    return 'join-btn'
  }
  return 'disabled-btn'
})

const getButtonColor = computed(() => {
  if (approvalStatus.value === 'pending') {
    return '#f59e0b'
  } else if (approvalStatus.value === 'approved') {
    return '#10b981'
  } else if (approvalStatus.value === 'rejected') {
    return '#ef4444'
  }
  return learnMoreMinistryData.value.buttonColor || '#16a34a'
})

const getButtonDisabled = computed(() => {
  return approvalStatus.value !== null
})

// Fetch learn more ministry data from CMS
const fetchLearnMoreMinistryData = async () => {
  try {
    const response = await axios.get('/cms/learnmoreministry/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Learn More Ministry:', { content, cmsImages })
      
      // Update learn more ministry data from content
      if (content.aboutTitle) learnMoreMinistryData.value.aboutTitle = content.aboutTitle
      if (content.defaultDescription) learnMoreMinistryData.value.defaultDescription = content.defaultDescription
      if (content.detailsTitle) learnMoreMinistryData.value.detailsTitle = content.detailsTitle
      if (content.joinButtonText) learnMoreMinistryData.value.joinButtonText = content.joinButtonText
      if (content.alreadyJoinedText) learnMoreMinistryData.value.alreadyJoinedText = content.alreadyJoinedText
      if (content.heroSubtitle) learnMoreMinistryData.value.heroSubtitle = content.heroSubtitle
      if (content.joinCommunityTitle) learnMoreMinistryData.value.joinCommunityTitle = content.joinCommunityTitle
      if (content.joinCommunityText) learnMoreMinistryData.value.joinCommunityText = content.joinCommunityText
      
      if (content.backgroundColor) {
        learnMoreMinistryData.value.backgroundColor = content.backgroundColor
      }
      if (content.buttonColor) {
        learnMoreMinistryData.value.buttonColor = content.buttonColor
      }
      if (content.joinButtonColor) {
        learnMoreMinistryData.value.joinButtonColor = content.joinButtonColor
      }
      
      // Handle hero image
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          learnMoreMinistryData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        }
      }
      
      console.log('✅ Learn More Ministry CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Learn More Ministry, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching learn more ministry data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

onMounted(async () => {
  await fetchLearnMoreMinistryData()
  const isMember = sessionStorage.getItem('isMember') === 'true'
  isMemberLandPage.value = isMember

  if (ministryModelFromState.value) {
    model.value = ministryModelFromState.value
    loading.value = false
  } else if (route.params.id) {
    fetchMinistryData()
  } else {
    loading.value = false
    model.value = null
  }

  // Check if member has already joined after model is loaded
  if (model.value && userInfo.value?.member?.member_id) {
    checkIfAlreadyJoined()
  }
})
</script>

<style scoped>
.learn-more-ministry-page {
  min-height: 100vh;
  background: white;
  margin-top: 64px;
}

.hero-section {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
}

@media (min-width: 960px) {
  .hero-section {
    height: 70vh;
    min-height: 500px;
  }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(20, 184, 166, 0.4), rgba(20, 184, 166, 0.2));
}

.hero-content {
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
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.125rem;
  max-width: 42rem;
  margin: 0 auto;
  font-family: 'Poppins', 'Inter', sans-serif;
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

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.content-section {
  position: relative;
  z-index: 2;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.ministry-card {
  border-left: 4px solid #14b8a6;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
}

.ministry-card-1 {
  animation-delay: 200ms;
}

.ministry-card-2 {
  animation-delay: 300ms;
}

.ministry-card-3 {
  animation-delay: 400ms;
}

.ministry-card-4 {
  animation-delay: 500ms;
}

.ministry-card:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left-width: 6px;
}

.ministry-image {
  transition: transform 0.5s ease;
}

.ministry-image:hover {
  transform: scale(1.05);
}

.join-btn {
  transition: all 0.3s ease;
  background-color: var(--btn-bg) !important;
  color: var(--btn-color) !important;
  border: 1px solid var(--btn-border) !important;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.disabled-btn {
  background-color: var(--btn-bg) !important;
  color: var(--btn-color) !important;
  border: 1px solid var(--btn-border) !important;
  cursor: not-allowed !important;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.join-section {
  position: relative;
  z-index: 2;
}

.join-community-btn {
  transition: all 0.3s ease;
}

.join-community-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
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
  
  .content-section {
    padding: 48px 0;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }
  
  .hero-section {
    height: 50vh;
    min-height: 350px;
  }
  
  .hero-content {
    padding: 24px 16px;
  }
  
  .content-section {
    padding: 32px 0;
  }
}
</style>
