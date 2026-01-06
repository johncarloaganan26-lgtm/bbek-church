<template>
  <div class="learn-more-event-page">
    
    <!-- Floating Elements -->
    <div class="floating-elements">
      <div
        v-for="(element, index) in floatingElements"
        :key="index"
        class="floating-element"
        :style="element.style"
      ></div>
    </div>

    <div class="w-full min-h-screen relative" :style="{ backgroundColor: learnMoreEventsData.backgroundColor || '#ffffff' }">
      <!-- Content Section -->
      <section class="content-section relative w-full py-20 pt-32">
        <v-container>
          <v-row>
            <!-- Left Side - Title and Description and Info -->
            <v-col cols="12" lg="6">
              <!-- Event Title -->
              <h1 class="text-4xl md:text-5xl lg:text-6xl font-weight-bold text-black mb-6" style="font-family: 'Georgia', serif; font-style: italic; text-transform: uppercase;">
                {{ eventModel?.eventName || 'Event Details' }}
              </h1>
              
              <div class="space-y-6">
                <p class="text-lg text-black leading-relaxed font-normal">
                  {{ eventModel?.description || learnMoreEventsData.noDescriptionText || "No description available" }}
                </p>

                <div class="d-flex align-start gap-3">
                  <v-icon color="black" size="24" class="mt-1">mdi-calendar</v-icon>
                  <div>
                    <p class="font-weight-bold text-black">Date & Time</p>
                    <p class="text-black font-normal">
                      <strong>Start Date:</strong> {{ formatDate(eventModel?.start_date)  || 'TBA' }} 
                    </p>
                    <p class="text-black font-normal">
                      <strong>End Date:</strong> {{ formatDate(eventModel?.end_date) || 'TBA' }}
                    </p>
                  </div>
                </div>

                <div class="d-flex align-start gap-3">
                  <v-icon color="black" size="24" class="mt-1">mdi-map-marker</v-icon>
                  <div>
                    <p class="font-weight-bold text-black">Location</p>
                    <p class="text-black font-normal">{{ eventModel?.location || 'TBA' }}</p>
                  </div>
                </div>

                <v-btn
                  v-if="userInfo?.member?.member_id"
                  :loading="loading"
                  size="large"
                  :class="hasAlreadyJoined ? 'disabled-btn' : 'join-btn'"
                  :style="hasAlreadyJoined 
                    ? { '--btn-bg': '#9ca3af', '--btn-color': 'white', '--btn-border': '#9ca3af' }
                    : { '--btn-bg': learnMoreEventsData.buttonColor || '#16a34a', '--btn-color': 'white', '--btn-border': learnMoreEventsData.buttonColor || '#16a34a' }"
                  :disabled="hasAlreadyJoined"
                  @click="handleJoinEvent"
                >
                  {{ hasAlreadyJoined ? (learnMoreEventsData.alreadyJoinedText || 'Already Joined') : (learnMoreEventsData.joinButtonText || 'Join Us') }}
                </v-btn>
                <v-btn
                  v-else
                  size="large"
                  class="join-btn"
                  :style="{ '--btn-bg': learnMoreEventsData.buttonColor || '#16a34a', '--btn-color': 'white', '--btn-border': learnMoreEventsData.buttonColor || '#16a34a' }"
                  @click="handleJoinAsGuest"
                >
                  {{ learnMoreEventsData.joinButtonText || 'Join Us' }}
                </v-btn>
              </div>
            </v-col>

            <!-- Right Side - Image -->
            <v-col cols="12" lg="6">
              <div class="relative overflow-hidden" style="box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                <v-img
                  :src="`${eventModel?.imageUrl}`"
                  :alt="eventModel?.eventName || 'Event'"
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
      :type="'event'" 
      :requestId="eventModel?.event_id || eventModel?.id"
      @update:modelValue="showJoinEvent = $event"
      @approval-created="handleApprovalCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import axios from '@/api/axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import AcceptJesusChristDialog from '../Dialog/AcceptJesusChristDialog.vue'

const route = useRoute()
const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
// In Vue Router, state is accessed via history.state or we can use query params
// For now, we'll use a ref that can be set from navigation
const eventModel = ref(route.query?.eventModel ? JSON.parse(decodeURIComponent(route.query.eventModel)) : {})
console.log(eventModel.value)
const isMemberLandPage = ref(false)
const showJoinEvent = ref(false)
const hasAlreadyJoined = ref(false)
const checkingStatus = ref(false)
const loading = ref(false)

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

const formatDate = (date) => {
  console.log(dayjs(date).format('MMMM D, YYYY - h:mm A') ,' date')
  // if (!date) return 'TBA'
  return dayjs(date).format(' MMMM D, YYYY - h:mm A')
}

const handleJoinEvent = async () => {
  // Don't allow joining if already has approval (pending, approved, or rejected)
  if (hasAlreadyJoined.value) {
    ElMessage.warning('You have already submitted a request for this event.')
    return
  }
  
  // Show confirmation dialog before submitting
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to join "${eventModel.value?.eventName || 'this event'}"? Your request will be reviewed by an admin.`,
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
      type: 'event',
      request_id: eventModel.value?.event_id || eventModel.value?.id,
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
  const eventId = eventModel.value?.event_id || eventModel.value?.id
  if (!userInfo.value?.account?.email || !eventId) {
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
        type: 'event',
        request_id: eventId
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

const learnMoreEventsData = ref({
  backgroundColor: '#ffffff',
  buttonColor: '#16a34a',
  aboutTitle: 'About This Event',
  noDescriptionText: 'No description available',
  detailsTitle: 'Event Details',
  joinButtonText: 'Join Us',
  alreadyJoinedText: 'Already Joined'
})

// Fetch learn more events data from CMS
const fetchLearnMoreEventsData = async () => {
  try {
    const response = await axios.get('/cms/learnmoreevents/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Learn More Events:', { content, cmsImages })
      
      // Update learn more events data from content
      // Handle all possible fields that might be in CMS
      if (content.aboutTitle) learnMoreEventsData.value.aboutTitle = content.aboutTitle
      if (content.noDescriptionText) learnMoreEventsData.value.noDescriptionText = content.noDescriptionText
      if (content.detailsTitle) learnMoreEventsData.value.detailsTitle = content.detailsTitle
      if (content.joinButtonText) learnMoreEventsData.value.joinButtonText = content.joinButtonText
      if (content.alreadyJoinedText) learnMoreEventsData.value.alreadyJoinedText = content.alreadyJoinedText
      
      // Handle background color and button color if they exist
      if (content.backgroundColor) {
        learnMoreEventsData.value.backgroundColor = content.backgroundColor
        console.log('Background color from CMS:', content.backgroundColor)
      }
      if (content.buttonColor) {
        learnMoreEventsData.value.buttonColor = content.buttonColor
        console.log('Button color from CMS:', content.buttonColor)
      }
      
      // Handle images if they exist (stored as BLOB, returned as base64)
      // Images are in cmsImages object with field names like "images[0].image"
      if (cmsImages && typeof cmsImages === 'object') {
        console.log('Images found in CMS:', Object.keys(cmsImages))
        // Process images if needed for this component
        // Currently this component doesn't use images, but we log them for debugging
      }
      
      console.log('✅ Learn More Events CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Learn More Events, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching learn more events data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

onMounted(async () => {
  await fetchLearnMoreEventsData()
  const isMember = sessionStorage.getItem('isMember') === 'true'
  isMemberLandPage.value = isMember
  
  // Check if member has already joined
  const eventId = eventModel.value?.event_id || eventModel.value?.id
  if (userInfo.value?.member?.member_id && eventId) {
    checkIfAlreadyJoined()
  }
})
</script>

<style scoped>
.learn-more-event-page {
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
