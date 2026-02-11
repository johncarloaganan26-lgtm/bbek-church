<template>
  <div class="learn-more-event-page">
    <section class="event-section" :style="{ position: 'relative', backgroundColor: learnMoreEventsData.backgroundColor || '#ffffff' }">
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
              <!-- Event Status -->
              <v-card
                class="mb-4 event-card event-card-0"
                variant="flat"
                :color="eventModel?.status === 'completed' ? 'grey-lighten-4' : 'teal-lighten-5'"
              >
                <v-card-text>
                  <div class="d-flex align-start gap-3">
                    <v-icon :color="eventModel?.status === 'completed' ? 'grey-darken-1' : 'teal-darken-3'" size="24" class="mt-1">
                      {{ eventModel?.status === 'completed' ? 'mdi-check-circle' : 'mdi-information' }}
                    </v-icon>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-2" :style="{ color: eventModel?.status === 'completed' ? '#374151' : '#0f766e' }">
                        Event Status
                      </h3>
                      <v-chip
                        :color="eventStatusColor"
                        size="small"
                        variant="flat"
                      >
                        {{ eventStatusText }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

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

              <!-- Add to Calendar Button -->
              <v-card
                class="mb-4 event-card event-card-3"
                variant="flat"
                color="teal-lighten-5"
              >
                <v-card-text>
                  <v-menu v-if="eventStatus !== 'completed' && userInfo?.member?.member_id" location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        size="large"
                        block
                        class="calendar-btn"
                        prepend-icon="mdi-calendar-plus"
                        color="primary"
                        append-icon="mdi-chevron-down"
                      >
                        Add to Calendar
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item :href="googleCalendarLink" target="_blank" prepend-icon="mdi-google">
                        <v-list-item-title>Google Calendar</v-list-item-title>
                      </v-list-item>
                      <v-list-item :href="outlookCalendarLink" target="_blank" prepend-icon="mdi-microsoft-outlook">
                        <v-list-item-title>Outlook Calendar</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="downloadICal" prepend-icon="mdi-apple">
                        <v-list-item-title>Download iCal (.ics)</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                  <v-btn
                    v-else-if="eventStatus !== 'completed' && !userInfo?.member?.member_id"
                    size="large"
                    block
                    class="calendar-btn"
                    prepend-icon="mdi-login"
                    color="secondary"
                    @click="showLoginDialog = true"
                  >
                    Login to Add to Calendar
                  </v-btn>
                  <v-btn
                    v-else
                    size="large"
                    block
                    disabled
                    class="disabled-btn"
                    color="grey"
                  >
                    Event Completed
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
    <LoginDialog v-model="showLoginDialog" @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import axios from '@/api/axios'
import { ElMessage } from 'element-plus'
import { useCms } from '@/composables/useCms'
import LoginDialog from '@/components/Dialogs/LoginDialog.vue'

const route = useRoute()
const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const eventModel = ref({})
const loading = ref(true)
const showLoginDialog = ref(false)

const fetchEventData = async () => {
  try {
    const eventId = route.query?.eventId
    if (!eventId) {
      ElMessage.error('Event ID is required')
      return
    }
    
    const response = await axios.get(`/church-records/events/getEventById/${eventId}`)
    if (response.data.success && response.data.data) {
      eventModel.value = response.data.data
    } else {
      ElMessage.error(response.data.message || 'Failed to fetch event details')
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    ElMessage.error('An error occurred while loading the event')
  } finally {
    loading.value = false
  }
}

const handleLoginSuccess = () => {
  userInfo.value = JSON.parse(localStorage.getItem('userInfo') || '{}')
  showLoginDialog.value = false
}

const learnMoreEventsData = reactive({
  backgroundColor: '#ffffff',
  buttonColor: '#14b8a6',
  aboutTitle: 'About This Event',
  noDescriptionText: 'No description available',
  detailsTitle: 'Event Details',
  pendingText: 'Pending',
  approvedText: 'You Already Joined'
})

// Load CMS data
const { loading: cmsLoading, loadPageData } = useCms('learnmoreevents')

onMounted(async () => {
  await fetchEventData()
  
  // Load CMS data
  const cmsData = await loadPageData()
  if (cmsData) {
    console.log('CMS data loaded:', cmsData)
    Object.assign(learnMoreEventsData, cmsData)
    console.log('Updated learnMoreEventsData:', learnMoreEventsData)
  } else {
    console.log('No CMS data found, using defaults')
  }
})

const formatDate = (date) => {
  return dayjs(date).format('MMMM D, YYYY - h:mm A')
}

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'grey'
    case 'ongoing':
      return 'green'
    case 'upcoming':
      return 'blue'
    default:
      return 'grey'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'ongoing':
      return 'Ongoing'
    case 'upcoming':
      return 'Upcoming'
    default:
      return 'Unknown'
  }
}

const eventStatus = computed(() => {
  // Use the admin-set status from the database, not calculated from dates
  return eventModel.value?.status || 'unknown'
})

const eventStatusColor = computed(() => {
  return getStatusColor(eventStatus.value)
})

const eventStatusText = computed(() => {
  return getStatusText(eventStatus.value)
})

const googleCalendarLink = computed(() => {
  if (!eventModel.value?.start_date) return '#'
  
  const event = eventModel.value
  const start = dayjs(event.start_date).format('YYYYMMDDTHHmmss')
  const end = event.end_date ? dayjs(event.end_date).format('YYYYMMDDTHHmmss') : dayjs(event.start_date).add(1, 'hour').format('YYYYMMDDTHHmmss')
  
  const title = encodeURIComponent(event.eventName || 'Church Event')
  const details = encodeURIComponent(event.description || '')
  const location = encodeURIComponent(event.location || '')
  
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}&sf=true&output=xml`
})

const outlookCalendarLink = computed(() => {
  if (!eventModel.value?.start_date) return '#'
  
  const event = eventModel.value
  const start = dayjs(event.start_date).format('YYYY-MM-DDTHH:mm:ss')
  const end = event.end_date ? dayjs(event.end_date).format('YYYY-MM-DDTHH:mm:ss') : dayjs(event.start_date).add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss')
  
  const title = encodeURIComponent(event.eventName || 'Church Event')
  const details = encodeURIComponent(event.description || '')
  const location = encodeURIComponent(event.location || '')
  
  return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${start}&enddt=${end}`
})

const downloadICal = () => {
  if (!eventModel.value?.start_date) return

  const event = eventModel.value
  const start = dayjs(event.start_date).format('YYYYMMDDTHHmmss')
  const end = event.end_date ? dayjs(event.end_date).format('YYYYMMDDTHHmmss') : dayjs(event.start_date).add(1, 'hour').format('YYYYMMDDTHHmmss')
  const now = dayjs().format('YYYYMMDDTHHmmss') + 'Z'

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'prodid:-//My Church//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.event_id || 'event'}-${now}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.eventName || 'Church Event'}`,
    `DESCRIPTION:${event.description || ''}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${event.eventName || 'event'}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

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

.event-card-0 {
  animation-delay: 100ms;
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

.calendar-btn {
  transition: all 0.3s ease;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.calendar-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.disabled-btn {
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

