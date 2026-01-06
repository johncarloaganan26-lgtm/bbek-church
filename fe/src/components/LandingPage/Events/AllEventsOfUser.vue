<template>
  <div class="all-events-user-page">
    
    <!-- Floating Elements -->
    <div class="floating-elements">
      <div
        v-for="(element, index) in floatingElements"
        :key="index"
        class="floating-element"
        :style="element.style"
      ></div>
    </div>

    <div class="w-screen h-auto relative overflow-hidden">
      <!-- Hero Section -->
      <section
        class="hero-section"
        :style="{ backgroundImage: eventsData.heroImage ? `url(${eventsData.heroImage})` : 'url(/img/events.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }"
      >
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title">{{ eventsData.heroTitle || 'JOINED EVENTS' }}</h1>
          <p class="hero-subtitle">
            {{ eventsData.heroSubtitle || 'Join us for exciting upcoming events that bring our community together in faith and fellowship.' }}
          </p>
        </div>
      </section>

      <!-- Events List Section -->
      <section class="events-section py-16 px-4 overflow-hidden relative" :style="{ backgroundColor: eventsData.sectionBackgroundColor || '#ffffff' }">
        <!-- Floating elements -->
        <div class="floating-elements">
          <div
            v-for="(element, index) in sectionFloatingElements"
            :key="index"
            class="floating-element"
            :style="element.style"
          ></div>
        </div>

        <div class="max-w-7xl mx-auto">
          <h2 class="text-4xl md:text-5xl font-weight-bold text-black mb-6 text-center" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            Joined Events
          </h2>
          <p class="text-lg md:text-xl text-black text-center leading-relaxed mb-8" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            {{ eventsData.sectionSubtitle || 'Join us for exciting upcoming events that bring our community together in faith and fellowship.' }}
          </p>

          <!-- Events Grid -->
          <div
            class="events-grid mt-16"
          >
            <v-card
              v-for="(event, index) in eventData"
              :key="index"
              class="event-card"
              elevation="4"
              hover
            >
              <div
                class="event-image"
                :style="{ backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : 'url(/img/events.jpg)' }"
              ></div>
              <div class="event-overlay"></div>
              <div class="event-content">
                <h3 class="event-title">{{ event.eventName }}</h3>
                <p class="event-description">
                  {{ event.description }}
                </p>
                <v-btn
                  color="white"
                  variant="outlined"
                  class="mt-4"
                  @click="goToLearnMore(event)"
                >
                  Learn More
                </v-btn>
              </div>
            </v-card>
          </div>

          <!-- Pagination -->
          <div class="w-full p-4 d-flex align-center justify-center relative mt-8">
            <v-btn
              variant="text"
              :disabled="pageNumber === 1"
              @click="previousPage"
            >
              &laquo; Previous
            </v-btn>
            <span class="mx-4">
              Page {{ pageNumber }} of {{ totalPage }}
            </span>
            <v-btn
              variant="text"
              :disabled="pageNumber >= totalPage"
              @click="nextPage"
            >
              Next &raquo;
            </v-btn>
          </div>
        </div>
      </section>

      <!-- Join Community Section -->
      <section class="join-section py-16 bg-white text-black">
        <v-container>
          <div class="text-center">
            <h2 class="text-4xl font-weight-bold mb-6 text-black" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              {{ eventsData.joinCommunityTitle || 'Join Our Community' }}
            </h2>
            <p class="text-xl mb-10 max-w-2xl mx-auto text-grey-darken-1" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              {{ eventsData.joinCommunityText || 'We invite you to be a part of our church family. Come worship with us and experience the love of Christ.' }}
            </p>
            <v-btn
              size="large"
              rounded
              class="text-white join-community-btn"
              :style="{ backgroundColor: eventsData.joinButtonColor || '#14b8a6', borderColor: eventsData.joinButtonColor || '#14b8a6', fontFamily: 'Georgia, serif', fontStyle: 'italic' }"
              @click="$router.push('/beoneofus/accept-jesus')"
            >
              {{ eventsData.joinButtonText || 'Become a Member' }}
            </v-btn>
          </div>
        </v-container>
      </section>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsRecordsStore } from '@/stores/ChurchRecords/eventsRecordsStore'
import axios from '@/api/axios'

const router = useRouter()
const eventsStore = useEventsRecordsStore()

const eventsData = ref({
  heroTitle: 'JOINED EVENTS',
  heroSubtitle: 'Join us for exciting upcoming events that bring our community together in faith and fellowship.',
  heroImage: null,
  sectionTitle: 'Joined Events',
  sectionSubtitle: 'Join us for exciting upcoming events that bring our community together in faith and fellowship.',
  sectionBackgroundColor: '#ffffff',
  joinCommunityTitle: 'Join Our Community',
  joinCommunityText: 'We invite you to be a part of our church family. Come worship with us and experience the love of Christ.',
  joinButtonText: 'Become a Member',
  joinButtonColor: '#14b8a6'
})

// Fetch events page data from CMS
const fetchEventsData = async () => {
  try {
    const response = await axios.get('/cms/events/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Events (User):', { content, cmsImages })
      
      // Update events data from content
      // Note: For user events page, we keep "Joined Events" as the section title (user-specific)
      // but use other CMS fields like hero image, colors, and join section
      if (content.heroTitle) eventsData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) eventsData.value.heroSubtitle = content.heroSubtitle
      // Don't override sectionTitle - keep it as "Joined Events" for user page
      // But use sectionSubtitle from CMS if available
      if (content.upcomingEventsText) eventsData.value.sectionSubtitle = content.upcomingEventsText
      if (content.sectionBackgroundColor) {
        eventsData.value.sectionBackgroundColor = content.sectionBackgroundColor
        console.log('Section background color from CMS:', content.sectionBackgroundColor)
      }
      if (content.joinCommunityTitle) eventsData.value.joinCommunityTitle = content.joinCommunityTitle
      if (content.joinCommunityText) eventsData.value.joinCommunityText = content.joinCommunityText
      if (content.joinButtonText) eventsData.value.joinButtonText = content.joinButtonText
      if (content.joinButtonColor) {
        eventsData.value.joinButtonColor = content.joinButtonColor
        console.log('Join button color from CMS:', content.joinButtonColor)
      }
      
      // Handle hero image - images are stored as BLOB, returned as base64 in images object
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          eventsData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        } else {
          console.log('⚠️ Hero image in CMS is not a valid base64 image')
        }
      } else {
        console.log('ℹ️ No hero image found in CMS, using default')
      }
      
      console.log('✅ Events CMS data loaded successfully (User page)')
    } else {
      console.log('⚠️ No CMS data found for Events, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching events data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

const eventData = ref([])
const pageNumber = ref(1)
const totalPage = ref(1)
const refresh = ref(true)
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
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

const sectionFloatingElements = ref([
  { style: { top: '40px', left: '40px', width: '64px', height: '64px', animationDelay: '0s' } },
  { style: { top: '80px', right: '80px', width: '48px', height: '48px', animationDelay: '1s' } },
  { style: { bottom: '80px', left: '80px', width: '56px', height: '56px', animationDelay: '2s' } },
  { style: { bottom: '40px', right: '40px', width: '40px', height: '40px', animationDelay: '0.5s' } },
  { style: { top: '50%', left: '33%', width: '32px', height: '32px', animationDelay: '1.5s' } },
  { style: { top: '25%', right: '25%', width: '24px', height: '24px', animationDelay: '0.8s' } },
  { style: { bottom: '33%', left: '50%', width: '36px', height: '36px', animationDelay: '2.2s' } },
  { style: { top: '75%', left: '40px', width: '20px', height: '20px', animationDelay: '1.8s' } },
  { style: { bottom: '25%', right: '25%', width: '28px', height: '28px', animationDelay: '0.3s' } },
  { style: { top: '33%', right: '40px', width: '44px', height: '44px', animationDelay: '2.8s' } },
  { style: { top: '50%', right: '33%', width: '16px', height: '16px', animationDelay: '1.1s' } },
  { style: { bottom: '50%', left: '25%', width: '52px', height: '52px', animationDelay: '0.9s' } }
])

const fetchEventData = async () => {
  try {
    // Check if user is logged in and has member ID
    if (!userInfo.value || !userInfo.value.member || !userInfo.value.member.member_id) {
      console.warn('User is not logged in or member ID not found')
      eventData.value = []
      totalPage.value = 1
      return
    }

    const memberId = userInfo.value.member.member_id
    loading.value = true

    const result = await eventsStore.fetchUserEvents(memberId, {
      page: pageNumber.value,
      pageSize: 10 // Adjust page size as needed
    })

    if (result.success) {
      eventData.value = result.data || []
      totalPage.value = result.totalPages || 1
      
      // Reset to page 1 if current page exceeds total pages
      if (pageNumber.value > totalPage.value && totalPage.value > 0) {
        pageNumber.value = 1
      }
    } else {
      console.error('Failed to fetch user events:', result.error)
      eventData.value = []
      totalPage.value = 1
    }
  } catch (e) {
    console.error('Error fetching user events:', e)
    eventData.value = []
    totalPage.value = 1
  } finally {
    loading.value = false
  }
}

const goToLearnMore = (event) => {
  router.push({
    name: 'LearnMoreEvent',
    query: { eventModel: encodeURIComponent(JSON.stringify(event)) }
  })
}

const previousPage = () => {
  if (pageNumber.value > 1) {
    pageNumber.value--
    refresh.value = true
  }
}

const nextPage = () => {
  if (pageNumber.value < totalPage.value) {
    pageNumber.value++
    refresh.value = true
  }
}

watch([refresh, pageNumber], () => {
  if (refresh.value) {
    fetchEventData()
    refresh.value = false
  }
})

onMounted(async () => {
  // Load user info from localStorage
  const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  userInfo.value = storedUserInfo
  
  // Fetch CMS data first
  await fetchEventsData()
  
  // Fetch events on mount
  if (userInfo.value?.member?.member_id) {
    fetchEventData()
  }
})
</script>

<style scoped>
.all-events-user-page {
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

.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 64px;
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
  color: black;
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

.events-section {
  position: relative;
}

.events-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: flex-start;
}

.event-card {
  position: relative;
  height: 384px;
  overflow: hidden;
  border-radius: 1rem;
  animation: fadeInUp 0.6s ease-out both;
  transition: all 0.3s ease;
  flex: 0 0 calc(33.333% - 1rem);
  min-width: 0;
}

@media (max-width: 1024px) {
  .event-card {
    flex: 0 0 calc(50% - 0.75rem);
  }
}

@media (max-width: 640px) {
  .all-events-user-page {
    margin-top: 64px;
  }

  .hero-section {
    height: 60vh;
    min-height: 400px;
  }

  .hero-content {
    padding: 24px 16px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    max-width: 100%;
  }

  .event-card {
    flex: 0 0 100%;
    height: 320px;
  }

  .events-grid {
    gap: 1rem;
  }

  .floating-element {
    display: none;
  }
}

.event-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.event-card:hover .event-image {
  transform: scale(1.1);
}

.event-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
}

.event-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(55, 65, 81, 0.7), rgba(75, 85, 99, 0.2), transparent);
  z-index: 1;
}

.event-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: 1.5rem;
  color: white;
}

.event-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-family: 'Poppins', 'Inter', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.event-description {
  color: white;
  line-height: 1.5;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  font-family: 'Poppins', 'Inter', sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.join-section {
  position: relative;
  z-index: 2;
}

@media (max-width: 960px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>


