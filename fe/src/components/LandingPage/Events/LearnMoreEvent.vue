<template>
  <div class="learn-more-event-page">
    <section class="event-section" style="position: relative;">
      <!-- Loading overlay -->
      <v-overlay :model-value="loading" contained class="align-center justify-center" style="z-index: 10;">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </v-overlay>
      
      <v-container>
        <v-row align="center" class="gap-12">
          <!-- Left Side - Event Details -->
          <v-col cols="12" md="6">
            <!-- Event Title -->
            <h2 class="text-h3 text-md-h4 font-weight-bold text-grey-darken-3 mb-6" style="font-family: 'Georgia', serif; font-style: italic;">
              {{ eventModel?.eventName || 'Event Details' }}
            </h2>
            
            <!-- Event Description -->
            <p class="text-h6 text-grey-darken-1 mb-6">
              {{ eventModel?.description || learnMoreEventsData.noDescriptionText || "No description available" }}
            </p>

            <!-- Event Info Cards -->
            <div class="event-items">
              <!-- Date & Time -->
              <v-card
                class="mb-4 event-card event-card-1"
                variant="flat"
                color="teal-lighten-5"
              >
                <v-card-text>
                  <div class="d-flex align-start gap-3">
                    <v-icon color="teal-darken-3" size="24" class="mt-1">mdi-calendar</v-icon>
                    <div>
                      <h3 class="text-h6 font-weight-bold text-teal-darken-3 mb-2">Date & Time</h3>
                      <p class="text-teal-darken-2">
                        <strong>Start:</strong> {{ formatDate(eventModel?.start_date) || 'TBA' }}
                      </p>
                      <p class="text-teal-darken-2">
                        <strong>End:</strong> {{ formatDate(eventModel?.end_date) || 'TBA' }}
                      </p>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Location -->
              <v-card
                class="mb-4 event-card event-card-2"
                variant="flat"
                color="teal-lighten-5"
              >
                <v-card-text>
                  <div class="d-flex align-start gap-3">
                    <v-icon color="teal-darken-3" size="24" class="mt-1">mdi-map-marker</v-icon>
                    <div>
                      <h3 class="text-h6 font-weight-bold text-teal-darken-3 mb-2">Location</h3>
                      <p class="text-teal-darken-2">{{ eventModel?.location || 'TBA' }}</p>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Join Button -->
              <v-card
                class="mb-4 event-card event-card-3"
                variant="flat"
                color="teal-lighten-5"
              >
                <v-card-text>
                  <v-btn
                    v-if="userInfo?.member?.member_id"
                    :loading="loading"
                    :class="getButtonClass"
                    :style="{ '--btn-bg': getButtonColor, '--btn-color': 'white', '--btn-border': getButtonColor }"
                    :disabled="getButtonDisabled"
                    @click="handleJoinEvent"
                    size="large"
                    block
                  >
                    {{ getButtonText }}
                  </v-btn>
                  <v-btn
                    v-else
                    size="large"
                    block
                    :style="{ '--btn-bg': learnMoreEventsData.buttonColor || '#14b8a6', '--btn-color': 'white', '--btn-border': learnMoreEventsData.buttonColor || '#14b8a6' }"
                    class="join-btn"
                    @click="handleJoinAsGuest"
                  >
                    {{ learnMoreEventsData.joinButtonText || 'Join Us' }}
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </v-col>

          <!-- Right Side - Image -->
          <v-col cols="12" md="6">
            <v-img
              :src="`${eventModel?.imageUrl}`"
              :alt="eventModel?.eventName || 'Event'"
              height="80vh"
              cover
              class="rounded-lg event-image"
            ></v-img>
          </v-col>
        </v-row>
      </v-container>
    </section>

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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import axios from '@/api/axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import AcceptJesusChristDialog from '../Dialog/AcceptJesusChristDialog.vue'

const route = useRoute()
const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const eventModel = ref(route.query?.eventModel ? JSON.parse(decodeURIComponent(route.query.eventModel)) : {})

const showJoinEvent = ref(false)
const approvalStatus = ref(null)
const loading = ref(false)

const formatDate = (date) => {
  return dayjs(date).format('MMMM D, YYYY - h:mm A')
}

const handleJoinEvent = async () => {
  if (approvalStatus.value !== null) {
    ElMessage.warning('You have already submitted a request for this event.')
    return
  }
  
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
    return
  }
  
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
  showJoinEvent.value = true
}

const handleApprovalCreated = () => {
  approvalStatus.value = 'pending'
  checkIfAlreadyJoined()
}

const checkIfAlreadyJoined = async () => {
  const eventId = eventModel.value?.event_id || eventModel.value?.id
  if (!userInfo.value?.account?.email || !eventId) {
    return
  }

  if (approvalStatus.value !== null) {
    return
  }

  try {
    const response = await axios.get('/church-records/approvals/checkMemberApprovalStatus', {
      params: {
        email: userInfo.value.account.email,
        type: 'event',
        request_id: eventId
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
  }
}

const learnMoreEventsData = ref({
  backgroundColor: '#ffffff',
  buttonColor: '#14b8a6',
  aboutTitle: 'About This Event',
  noDescriptionText: 'No description available',
  detailsTitle: 'Event Details',
  joinButtonText: 'Join Us',
  pendingText: 'Pending Request',
  approvedText: 'You Already Join'
})

// Computed properties for button states
const getButtonText = computed(() => {
  if (approvalStatus.value === 'pending') {
    return learnMoreEventsData.value.pendingText || 'Pending Request'
  } else if (approvalStatus.value === 'approved') {
    return learnMoreEventsData.value.approvedText || 'You Already Join'
  } else if (approvalStatus.value === 'rejected') {
    return 'Request Rejected'
  }
  return learnMoreEventsData.value.joinButtonText || 'Join Us'
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
  return learnMoreEventsData.value.buttonColor || '#14b8a6'
})

const getButtonDisabled = computed(() => {
  return approvalStatus.value !== null
})

onMounted(async () => {
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

.event-section {
  padding: 80px 0;
  margin-bottom: 80px;
  background-color: #ffffff;
}

.event-card {
  border-left: 4px solid #14b8a6;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
}

.event-card-1 {
  animation-delay: 200ms;
}

.event-card-2 {
  animation-delay: 300ms;
}

.event-card-3 {
  animation-delay: 400ms;
}

.event-card:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left-width: 6px;
}

.event-image {
  transition: transform 0.5s ease;
}

.event-image:hover {
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
  .event-section {
    padding: 48px 0;
    margin-bottom: 48px;
  }

  .event-image {
    height: 400px !important;
    margin-top: 24px;
  }
}

@media (max-width: 640px) {
  .event-section {
    padding: 32px 0;
    margin-bottom: 32px;
  }

  .event-image {
    height: 300px !important;
  }
}
</style>
