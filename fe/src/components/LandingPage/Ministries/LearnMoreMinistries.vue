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
      <!-- Content Section -->
      <section class="content-section relative w-full py-20 pt-32">
        <v-container>
          <!-- Ministry Title -->
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-weight-bold text-black mb-6" style="font-family: 'Georgia', serif; font-style: italic; text-transform: uppercase;">
            {{ model?.ministryName || 'Ministry Details' }}
          </h1>

          <v-row>
            <!-- Left Side - Description and Info -->
            <v-col cols="12" lg="6">
              <div class="space-y-6">
                <p class="text-lg text-black leading-relaxed font-normal">
                  {{ model?.description || learnMoreMinistryData.defaultDescription || "This ministry is designed to help believers grow in faith, connect with community, and discover God's purpose for their lives." }}
                </p>

                <div class="d-flex align-start gap-3">
                  <v-icon color="black" size="24" class="mt-1">mdi-calendar</v-icon>
                  <div>
                    <p class="font-weight-bold text-black">Schedule</p>
                    <p class="text-black font-normal">{{ formatDate(model?.schedule) || 'Weekly meetings' }}</p>
                  </div>
                </div>

                <div class="d-flex align-start gap-3">
                  <v-icon color="black" size="24" class="mt-1">mdi-clock-outline</v-icon>
                  <div>
                    <p class="font-weight-bold text-black">Time</p>
                    <p class="text-black font-normal">{{ formatTime(model?.schedule) }}</p>
                  </div>
                </div>

                <div class="d-flex align-start gap-3">
                  <v-icon color="black" size="24" class="mt-1">mdi-account</v-icon>
                  <div>
                    <p class="font-weight-bold text-black">Leader</p>
                    <p class="text-black font-normal">{{ model?.leader || 'Ministry Leader' }}</p>
                  </div>
                </div>

                <v-btn
                  v-if="userInfo?.member?.member_id"
                  :loading="loading"
                  size="large"
                  :class="hasAlreadyJoined ? 'disabled-btn' : 'join-btn'"
                  :style="hasAlreadyJoined 
                    ? { '--btn-bg': '#9ca3af', '--btn-color': 'white', '--btn-border': '#9ca3af' }
                    : { '--btn-bg': learnMoreMinistryData.buttonColor || '#ffffff', '--btn-color': 'white', '--btn-border': learnMoreMinistryData.buttonColor || '#ffffff' }"
                  :disabled="hasAlreadyJoined"
                  @click="handleJoinMinistry"
                >
                  {{ hasAlreadyJoined ? (learnMoreMinistryData.alreadyJoinedText || 'Already Joined') : (learnMoreMinistryData.joinButtonText || 'Join Us') }}
                </v-btn>
                <v-btn
                  v-else
                  size="large"
                  class="join-btn"
                  :style="{ '--btn-bg': learnMoreMinistryData.buttonColor || '#ffffff', '--btn-color': 'white', '--btn-border': learnMoreMinistryData.buttonColor || '#ffffff' }"
                  @click="handleJoinAsGuest"
                >
                  {{ learnMoreMinistryData.joinButtonText || 'Join Us' }}
                </v-btn>
              </div>
            </v-col>

            <!-- Right Side - Image -->
            <v-col cols="12" lg="6">
              <div class="relative overflow-hidden" style="box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                <v-img
                  :src="`${model?.imageUrl}`"
                  :alt="model?.ministry_name || 'Ministry'"
                  height="500"
                  cover
                ></v-img>
              </div>
            </v-col>
          </v-row>
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
import { ref, onMounted, watch } from 'vue'
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
const loading = ref(true)
const hasAlreadyJoined = ref(false)
const checkingStatus = ref(false)
// In Vue Router, state is accessed via query params
const ministryModelFromState = ref(
  route.query?.ministryModel ? JSON.parse(decodeURIComponent(route.query.ministryModel)) : null
)
console.log(ministryModelFromState.value ,'ministryModelFromState')
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
  return dayjs(date).format(' MMMM D, YYYY')
}
const fetchMinistryData = async () => {
  try {
    loading.value = true
    // TODO: Replace with actual API call
    // const response = await MinistryRepo().getMinistryById(parseInt(id))
    // if (response && response.data) {
    //   model.value = response.data
    // } else {
    //   router.push('/ministries')
    //   return
    // }
    
    // For now, use the model from state if available
    if (ministryModelFromState.value) {
      model.value = ministryModelFromState.value
      loading.value = false
    } else {
      // If no state, would fetch from API
      // For now, set loading to false and model to null to show error
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
  if (hasAlreadyJoined.value) {
    ElMessage.warning('You have already submitted a request for this ministry.')
    return
  }
  
  // Show confirmation dialog before submitting
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to join "${model.value?.ministryName || 'this ministry'}"? Your request will be reviewed by an admin.`,
      'Confirm Join Request',
      {
        confirmButtonText: 'Join',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    )
  } catch (error) {
    // User cancelled the confirmation
    if (error === 'cancel') {
      return
    }
    console.error('Error showing confirmation:', error)
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
      hasAlreadyJoined.value = true
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
  hasAlreadyJoined.value = true
  // Re-check to get the latest approval info
  checkIfAlreadyJoined()
}

const checkIfAlreadyJoined = async () => {
  const ministryId = model.value?.ministry_id || model.value?.id
  if (!userInfo.value?.account?.email || !ministryId) {
    return
  }

  // Don't check if already marked as joined
  if (hasAlreadyJoined.value) {
    return
  }

  checkingStatus.value = true
  try {
    const response = await axios.get('/church-records/approvals/checkMemberApprovalExists', {
      params: {
        email: userInfo.value.account.email,
        type: 'ministry',
        request_id: ministryId
      }
    })

    if (response.data.success && response.data.data?.exists) {
      hasAlreadyJoined.value = true
    } else {
      // Explicitly set to false if no approval exists
      hasAlreadyJoined.value = false
    }
  } catch (error) {
    console.error('Error checking approval status:', error)
    // Don't block the UI if check fails, just log the error
    // Keep hasAlreadyJoined as false on error to allow user to try
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
  alreadyJoinedText: 'Already Joined'
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
      // Handle all possible fields that might be in CMS
      if (content.aboutTitle) learnMoreMinistryData.value.aboutTitle = content.aboutTitle
      if (content.defaultDescription) learnMoreMinistryData.value.defaultDescription = content.defaultDescription
      if (content.detailsTitle) learnMoreMinistryData.value.detailsTitle = content.detailsTitle
      if (content.joinButtonText) learnMoreMinistryData.value.joinButtonText = content.joinButtonText
      if (content.alreadyJoinedText) learnMoreMinistryData.value.alreadyJoinedText = content.alreadyJoinedText
      
      // Handle background color and button color if they exist
      if (content.backgroundColor) {
        learnMoreMinistryData.value.backgroundColor = content.backgroundColor
        console.log('Background color from CMS:', content.backgroundColor)
      }
      if (content.buttonColor) {
        learnMoreMinistryData.value.buttonColor = content.buttonColor
        console.log('Button color from CMS:', content.buttonColor)
      }
      
      // Handle images if they exist (stored as BLOB, returned as base64)
      // Images are in cmsImages object with field names like "images[0].image"
      if (cmsImages && typeof cmsImages === 'object') {
        console.log('Images found in CMS:', Object.keys(cmsImages))
        // Process images if needed for this component
        // Currently this component doesn't use images, but we log them for debugging
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

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  background: rgba(20, 184, 166, 0.1);
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

.join-btn {
  transition: all 0.3s ease;
  background-color: var(--btn-bg) !important;
  color: var(--btn-color) !important;
  border: 1px solid var(--btn-border) !important;
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
}
</style>

