<template>
  <div class="learn-more-ministry-page">
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
      <section class="content-section relative w-full py-20">
        <v-container>
          <v-row align="center" class="gap-12">
            <!-- Left Side - Description and Info -->
            <v-col cols="12" lg="6">
              <div class="space-y-6">
                <h2 class="text-3xl md:text-4xl font-weight-bold text-black mb-4" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                  {{ model?.ministryName || model?.ministry_name || 'Ministry Details' }}
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
                  class="mb-4 ministry-card ministry-card-2a"
                  variant="flat"
                  color="teal-lighten-5"
                >
                  <v-card-text>
                    <div class="d-flex align-start gap-3">
                      <v-icon color="teal-darken-3" size="24" class="mt-1">mdi-domain</v-icon>
                      <div>
                        <h3 class="text-h6 font-weight-bold text-teal-darken-3 mb-2">Department</h3>
                        <p class="text-teal-darken-2">{{ model?.department_name || model?.department || 'TBA' }}</p>
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
                        <p class="text-teal-darken-2">{{ model?.leader_fullname || model?.leader || 'TBA' }}</p>
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
                    <div class="d-flex flex-column gap-3">
                      <v-menu v-if="model?.schedule && userInfo?.member?.member_id" location="bottom">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            size="large"
                            block
                            class="calendar-btn"
                            prepend-icon="mdi-calendar-plus"
                            color="teal-darken-1"
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
                        v-else-if="model?.schedule && !userInfo?.member?.member_id"
                        size="large"
                        block
                        class="calendar-btn"
                        prepend-icon="mdi-login"
                        color="secondary"
                        @click="showLoginDialog = true"
                      >
                        Login to Add to Calendar
                      </v-btn>
                    </div>
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
    </div>
    <LoginGuest v-model="showLoginDialog" @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/api/axios'
import dayjs from 'dayjs'
import { useCms } from '@/composables/useCms'
import LoginDialog from '@/components/Dialogs/LoginDialog.vue'

const route = useRoute()
const router = useRouter()
const showLoginDialog = ref(false)

const contactEmailLink = computed(() => {
  const ministryName = model.value?.ministry_name || model.value?.ministryName || 'Ministry'
  const subject = encodeURIComponent(`Inquiry about ${ministryName}`)
  const body = encodeURIComponent(`Hi, I would like to know more about the ${ministryName}.`)
  // Use leader's email if available, otherwise fallback to general church email
  const email = model.value?.leader_email || 'church@example.com' 
  return `mailto:${email}?subject=${subject}&body=${body}`
})

const googleCalendarLink = computed(() => {
  if (!model.value?.schedule) return '#'
  
  const scheduleDate = dayjs(model.value.schedule)
  // Format: YYYYMMDDTHHmmss
  const start = scheduleDate.format('YYYYMMDDTHHmmss')
  const end = scheduleDate.add(1, 'hour').format('YYYYMMDDTHHmmss')
  
  const title = encodeURIComponent(model.value.ministry_name || 'Ministry Meeting')
  const details = encodeURIComponent(model.value.description || '')
  const location = encodeURIComponent('Church')
  
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}&sf=true&output=xml`
})

const outlookCalendarLink = computed(() => {
  if (!model.value?.schedule) return '#'
  
  const scheduleDate = dayjs(model.value.schedule)
  const start = scheduleDate.format('YYYY-MM-DDTHH:mm:ss')
  const end = scheduleDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss')
  
  const title = encodeURIComponent(model.value.ministry_name || 'Ministry Meeting')
  const details = encodeURIComponent(model.value.description || '')
  const location = encodeURIComponent('Church')
  
  return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${start}&enddt=${end}`
})

const downloadICal = () => {
  if (!model.value?.schedule) return

  const scheduleDate = dayjs(model.value.schedule)
  const start = scheduleDate.format('YYYYMMDDTHHmmss')
  const end = scheduleDate.add(1, 'hour').format('YYYYMMDDTHHmmss')
  const now = dayjs().format('YYYYMMDDTHHmmss') + 'Z'

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'prodid:-//My Church//Ministries//EN',
    'BEGIN:VEVENT',
    `UID:${model.value.ministry_id || 'ministry'}-${now}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${model.value.ministry_name || 'Ministry Meeting'}`,
    `DESCRIPTION:${model.value.description || ''}`,
    `LOCATION:Church`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${model.value.ministry_name || 'ministry'}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const isMemberLandPage = ref(false)
const model = ref(null)
const loading = ref(false)

// In Vue Router, state is accessed via query params
const ministryModelFromState = ref(
  route.query?.ministryId ? { ministry_id: route.query.ministryId } : null
)

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
    
    // Try to get ministry ID from query params first
    const ministryIdFromQuery = route.query?.ministryId
    const ministryIdFromParams = route.params?.id
    const ministryId = ministryIdFromQuery || ministryIdFromParams
    
    console.log('📍 Looking for ministry with ID:', ministryId)
    
    if (ministryId) {
      try {
        console.log(`🔄 Fetching ministry data from API: /church-records/ministries/getMinistryById/${ministryId}`)
        const response = await axios.get(`/church-records/ministries/getMinistryById/${ministryId}`)
        console.log('📦 API Response:', response)
        
        if (response.data?.success || response.status === 200) {
          const ministryData = response.data?.data || response.data
          console.log('✅ Ministry data retrieved:', ministryData)
          
          model.value = {
            ministry_id: ministryData.ministry_id,
            ministry_name: ministryData.ministry_name,
            description: ministryData.description,
            schedule: ministryData.schedule,
            leader_id: ministryData.leader_id,
            department_id: ministryData.department_id,
            members: ministryData.members,
            status: ministryData.status,
            imageUrl: ministryData.imageUrl,
            image: ministryData.image,
            department_name: ministryData.department_name,
            leader_fullname: ministryData.leader_fullname,
            leader_email: ministryData.leader_email || ministryData.email || ministryData.leader_email_address || ministryData.email_address
          }
        } else {
          console.warn('⚠️ Unexpected response format:', response.data)
          model.value = null
        }
      } catch (apiError) {
        console.error('❌ Error fetching ministry from API:', apiError)
        model.value = null
      }
    } else {
      console.warn('⚠️ No ministry ID in route params')
      model.value = null
    }
    
    loading.value = false
  } catch (error) {
    console.error('❌ Error in fetchMinistryData:', error)
    loading.value = false
    model.value = null
  }
}

const handleLoginSuccess = () => {
  userInfo.value = JSON.parse(localStorage.getItem('userInfo') || '{}')
  showLoginDialog.value = false
}

watch(() => route.query.ministryId || route.params.id, () => {
  const ministryId = route.query?.ministryId || route.params?.id
  if (ministryId) {
    fetchMinistryData()
  }
})

const learnMoreMinistryData = reactive({
  backgroundColor: '#ffffff',
  aboutTitle: 'About This Ministry',
  defaultDescription: "This ministry is designed to help believers grow in faith, connect with community, and discover God's purpose for their lives.",
  detailsTitle: 'Ministry Details',
  heroSubtitle: 'Discover more about this ministry and join us in serving God.',
  joinCommunityTitle: 'Join Our Community',
  joinCommunityText: 'We invite you to be a part of our church family. Come worship with us and experience the love of Christ.'
})

// Load CMS data
const { loading: cmsLoading, loadPageData } = useCms('learnmoreministry')

onMounted(async () => {
  const isMember = sessionStorage.getItem('isMember') === 'true'
  isMemberLandPage.value = isMember

  const ministryId = route.query?.ministryId || route.params?.id
  if (ministryId) {
    await fetchMinistryData()
  } else {
    loading.value = false
    model.value = null
  }
  
  // Load CMS data
  const cmsData = await loadPageData()
  if (cmsData) {
    console.log('CMS data loaded:', cmsData)
    Object.assign(learnMoreMinistryData, cmsData)
    console.log('Updated learnMoreMinistryData:', learnMoreMinistryData)
  } else {
    console.log('No CMS data found, using defaults')
  }
})
</script>

<style scoped>
.learn-more-ministry-page {
  min-height: 100vh;
  background: white;
  margin-top: 64px;
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

.ministry-card-2a {
  animation-delay: 350ms;
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
  .content-section {
    padding: 48px 0;
  }
}

@media (max-width: 640px) {
  .content-section {
    padding: 32px 0;
  }
}
</style>
