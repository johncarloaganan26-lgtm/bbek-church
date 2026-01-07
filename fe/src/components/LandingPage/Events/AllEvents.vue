<template>
  <div class="all-events-page">
    
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
        :style="{ backgroundImage: `url(${eventsData.heroImage || '/img/events.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center' }"
      >
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title fade-in-up">{{ eventsData.heroTitle || 'OUR EVENTS' }}</h1>
          <p class="hero-subtitle fade-in-up-delay">
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
          <h2 class="text-4xl md:text-5xl font-weight-bold text-black mb-6 text-center fade-in-up" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            {{ eventsData.sectionTitle || 'Upcoming Events' }}
          </h2>
          <p class="text-lg md:text-xl text-black text-center leading-relaxed mb-8 fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            {{ eventsData.sectionSubtitle || 'Join us for exciting upcoming events that bring our community together in faith and fellowship.' }}
          </p>


          <!-- Loading State -->
          <div v-if="eventsStore.loading" class="text-center py-16">
            <v-progress-circular
              indeterminate
              color="#14b8a6"
              size="64"
            ></v-progress-circular>
            <p class="mt-4 text-lg">Loading events...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="!eventsStore.loading && eventData.length === 0" class="text-center py-16">
            <p class="text-xl text-grey-darken-1">No events found.</p>
            <p class="text-md text-grey mt-2">Please check back later for upcoming events.</p>
          </div>

          <!-- Events Grid -->
          <div
            v-else
            class="events-grid mt-16"
          >
            <v-card
              v-for="(event, index) in eventData"
              :key="event.event_id || index"
              :class="`event-card event-card-${index + 1}`"
              elevation="4"
              hover
            >
              <div
                class="event-image"
                :style="{ backgroundImage: event.imageUrl ? `url('${event.imageUrl}')` : 'url(/img/events.jpg)' }"
              ></div>
              <div class="event-overlay"></div>
              <div class="event-content">
                <h3 class="event-title">{{ event.eventName || event.title }}</h3>
                <p class="event-date">{{ event.start_date }} - {{ event.end_date }}</p>
                <p class="event-location">{{ event.location }}</p>
                <v-btn
                  size="small"
                  variant="outlined"
                  class="mt-4 learn-more-btn"
                  :style="{ color: eventsData.learnMoreButtonColor || '#ffffff', borderColor: eventsData.learnMoreButtonColor || '#ffffff' }"
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
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsRecordsStore } from '@/stores/ChurchRecords/eventsRecordsStore'
import axios from '@/api/axios'

let searchTimeout = null

const router = useRouter()
const eventsStore = useEventsRecordsStore()

const eventsData = ref({
  heroTitle: 'OUR EVENTS',
  heroSubtitle: 'Join us for exciting upcoming events that bring our community together in faith and fellowship.',
  heroImage: null,
  sectionTitle: 'Upcoming Events',
  sectionSubtitle: 'Join us for exciting upcoming events that bring our community together in faith and fellowship.',
  sectionBackgroundColor: '#ffffff',
  learnMoreButtonColor: '#ffffff',
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
      
      console.log('CMS Response - Events:', { content, cmsImages })
      
      // Update events data from content
      if (content.heroTitle) eventsData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) eventsData.value.heroSubtitle = content.heroSubtitle
      if (content.upcomingEventsTitle) eventsData.value.sectionTitle = content.upcomingEventsTitle
      if (content.upcomingEventsText) eventsData.value.sectionSubtitle = content.upcomingEventsText
      if (content.sectionBackgroundColor) {
        eventsData.value.sectionBackgroundColor = content.sectionBackgroundColor
        console.log('Section background color from CMS:', content.sectionBackgroundColor)
      }
      if (content.learnMoreButtonColor) {
        eventsData.value.learnMoreButtonColor = content.learnMoreButtonColor
        console.log('Learn More button color from CMS:', content.learnMoreButtonColor)
      }
      if (content.joinCommunityTitle) eventsData.value.joinCommunityTitle = content.joinCommunityTitle
      if (content.joinCommunityText) eventsData.value.joinCommunityText = content.joinCommunityText
      if (content.joinButtonText) eventsData.value.joinButtonText = content.joinButtonText
      if (content.joinButtonColor) {
        eventsData.value.joinButtonColor = content.joinButtonColor
        console.log('Join button color from CMS:', content.joinButtonColor)
      }
      
      // Handle hero image - images are stored as BLOB, returned as base64 in images object
      // The image is stored with field_name = 'heroImage' in tbl_cms_images
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
      
      console.log('✅ Events CMS data loaded successfully')
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
    const result = await eventsStore.fetchPublicEvents({
      page: pageNumber.value,
      pageSize: 9
    })

    if (result.success) {
      // Sort events: ongoing first, then completed
      eventData.value = result.data.sort((a, b) => {
        if (a.status === 'ongoing' && b.status !== 'ongoing') return -1
        if (a.status !== 'ongoing' && b.status === 'ongoing') return 1
        return 0
      })
      totalPage.value = result.totalPages

      // Reset to page 1 if current page exceeds total pages
      if (pageNumber.value > totalPage.value && totalPage.value > 0) {
        pageNumber.value = 1
        // Don't call fetchEventData again here to avoid infinite loop
        // The watch will handle it
      }
    } else {
      console.error('Failed to fetch events:', result.error)
      eventData.value = []
      totalPage.value = 1
    }
  } catch (e) {
    console.error('Error fetching events:', e)
    eventData.value = []
    totalPage.value = 1
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


onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})

onMounted(async () => {
  await fetchEventsData()
  fetchEventData()
})
</script>

<style scoped>
.all-events-page {
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
  animation: fadeInUp 0.6s ease-out both, horizontalMove 8s ease-in-out infinite;
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
  .all-events-page {
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
  transform: translateY(-8px) translateX(0);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  animation-play-state: paused;
}

.event-card:hover .event-image {
  transform: scale(1.1);
}

.event-card-1 { 
  animation-delay: 200ms, 0s; 
}
.event-card-2 { 
  animation-delay: 300ms, 1.33s; 
}
.event-card-3 { 
  animation-delay: 400ms, 2.66s; 
}
.event-card-4 { 
  animation-delay: 500ms, 4s; 
}
.event-card-5 { 
  animation-delay: 600ms, 5.33s; 
}
.event-card-6 { 
  animation-delay: 700ms, 6.66s; 
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

.event-date {
  color: white;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  font-family: 'Poppins', 'Inter', sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.event-location {
  color: white;
  font-size: 0.875rem;
  margin-bottom: 1rem;
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

@keyframes horizontalMove {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(20px);
  }
}

.join-community-btn {
  transition: all 0.3s ease;
}

.join-community-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
</style>

