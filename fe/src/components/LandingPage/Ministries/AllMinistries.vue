<template>
  <div class="all-ministries-page">
    
    <!-- Floating Elements -->
    <div class="floating-elements">
      <div
        v-for="(element, index) in floatingElements"
        :key="index"
        class="floating-element"
        :style="element.style"
      ></div>
    </div>

    <div class="w-screen h-auto items-center flex flex-col justify-center">
      <!-- Hero Section -->
      <section
        class="hero-section"
        :style="{ backgroundImage: ministriesData.heroImage ? `url(${ministriesData.heroImage})` : `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/img/youth (4).jpg')` }"
      >
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title">{{ ministriesData.heroTitle || 'ALL MINISTRIES' }}</h1>
          <p class="hero-subtitle">
            {{ ministriesData.heroSubtitle || 'Our ministries are dedicated to meeting spiritual and practical needs, helping people grow in faith, and sharing God\'s love in our community.' }}
          </p>
        </div>
      </section>

      <!-- Ministries List Section -->
      <section class="ministries-section relative py-16 px-4 bg-white overflow-hidden">
        <!-- Floating elements -->
        <div class="floating-elements">
          <div
            v-for="(element, index) in sectionFloatingElements"
            :key="index"
            class="floating-element"
            :style="element.style"
          ></div>
        </div>

        <div class="max-w-7xl mx-auto flex flex-col">
          <h2 class="text-4xl md:text-5xl font-weight-bold text-black mb-6 text-center" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            {{ ministriesData.sectionTitle || 'Our Ministries' }}
          </h2>
          <p class="text-lg md:text-xl text-black text-center leading-relaxed mb-8" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            {{ ministriesData.sectionSubtitle || 'Discover our various ministries designed to help you grow in faith and serve our community.' }}
          </p>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-16 flex flex-col items-center justify-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-4 text-grey">Loading ministries...</p>
          </div>

          <!-- Ministries Grid -->
          <div
            v-else
            class="ministries-grid mt-16"
          >
            <v-card
              v-for="(ministry, index) in ministryData"
              :key="ministry.ministry_id || index"
              class="ministry-card"
              elevation="4"
              hover
            >
              <div
                class="ministry-image"
                :style="{ backgroundImage: ministry.imageUrl ? `url(${ministry.imageUrl})` : 'url(/img/events.jpg)' }"
              ></div>
              <div class="ministry-overlay"></div>
              <div class="ministry-content">
                <h3 class="ministry-title">{{ ministry.ministry_name }}</h3>
                <v-btn
                  size="small"
                  variant="outlined"
                  class="mt-4 learn-more-btn"
                  :style="{ color: ministriesData.learnMoreButtonColor || '#ffffff', borderColor: ministriesData.learnMoreButtonColor || '#ffffff' }"
                  @click="goToLearnMore(ministry)"
                >
                  Learn More
                </v-btn>
              </div>
            </v-card>
          </div>

          <!-- Pagination -->
          <div v-if="!loading && ministryData.length > 0" class="w-full p-4 d-flex align-center justify-center relative mt-8">
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

          <!-- Empty State -->
          <div v-if="!loading && ministryData.length === 0" class="text-center py-16 flex flex-col items-center justify-center">
            <p class="text-lg text-grey">No ministries found.</p>
          </div>
        </div>
      </section>

      <!-- Join Community Section -->
      <section class="join-section py-16 bg-white text-black">
        <v-container>
          <div class="text-center flex flex-col items-center justify-center">
            <h2 class="text-4xl font-weight-bold mb-6 text-black" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              {{ ministriesData.joinCommunityTitle || 'Join Our Faith Community' }}
            </h2>
            <p class="text-xl mb-10 max-w-2xl mx-auto text-grey-darken-1" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              {{ ministriesData.joinCommunityText || 'We invite you to be a part of our church family. Come worship with us and experience the love of Christ.' }}
            </p>
            <v-btn
              size="large"
              rounded
              class="text-white join-community-btn"
              :style="{ backgroundColor: ministriesData.joinButtonColor || '#14b8a6', borderColor: ministriesData.joinButtonColor || '#14b8a6', fontFamily: 'Georgia, serif', fontStyle: 'italic' }"
              @click="$router.push('/beoneofus/accept-jesus')"
            >
              {{ ministriesData.joinButtonText || 'Become a Member' }}
            </v-btn>
          </div>
        </v-container>
      </section>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMinistriesStore } from '@/stores/ChurchRecords/ministriesStore'
import axios from '@/api/axios'

const router = useRouter()
const route = useRoute()
const ministriesStore = useMinistriesStore()

const ministriesData = ref({
  heroTitle: 'ALL MINISTRIES',
  heroSubtitle: 'Our ministries are dedicated to meeting spiritual and practical needs, helping people grow in faith, and sharing God\'s love in our community.',
  heroImage: null,
  sectionTitle: 'Our Ministries',
  sectionSubtitle: 'Discover our various ministries designed to help you grow in faith and serve our community.',
  learnMoreButtonColor: '#ffffff',
  joinCommunityTitle: 'Join Our Faith Community',
  joinCommunityText: 'We invite you to be a part of our church family. Come worship with us and experience the love of Christ.',
  joinButtonText: 'Become a Member',
  joinButtonColor: '#14b8a6'
})

// Fetch ministries page data from CMS
const fetchMinistriesData = async () => {
  try {
    const response = await axios.get('/cms/ministries/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Ministries:', { content, cmsImages })
      
      if (content.heroTitle) ministriesData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) ministriesData.value.heroSubtitle = content.heroSubtitle
      if (content.sectionTitle) ministriesData.value.sectionTitle = content.sectionTitle
      if (content.sectionSubtitle) ministriesData.value.sectionSubtitle = content.sectionSubtitle
      if (content.learnMoreButtonColor) ministriesData.value.learnMoreButtonColor = content.learnMoreButtonColor
      if (content.joinCommunityTitle) ministriesData.value.joinCommunityTitle = content.joinCommunityTitle
      if (content.joinCommunityText) ministriesData.value.joinCommunityText = content.joinCommunityText
      if (content.joinButtonText) ministriesData.value.joinButtonText = content.joinButtonText
      if (content.joinButtonColor) ministriesData.value.joinButtonColor = content.joinButtonColor
      
      // Handle hero image
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          ministriesData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        }
      }
      
      console.log('✅ Ministries CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Ministries, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching ministries data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

const ministryData = ref([])
const pageNumber = ref(1)
const totalPage = ref(1)
const refresh = ref(true)
const isMemberLandPage = ref(false)
const departmentList = ref([])
const departmentId = computed(() => route.params.departmentId)
const loading = ref(false)

const departmentName = computed(() => {
  if (!departmentId.value) return null
  const dept = departmentList.value.find((d) => d.department_id === Number(departmentId.value))
  return dept?.department_name || null
})

const floatingElements = ref([
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

const getAllMinistryList = async () => {
  try {
    loading.value = true
    
    // Build query parameters
    const params = new URLSearchParams()
    params.append('status', 'active') // Only show active ministries on landing page
    params.append('page', pageNumber.value.toString())
    params.append('pageSize', '11')
    
    if (departmentId.value) {
      params.append('department_id', departmentId.value)
    }
    
    params.append('sortBy', 'Date Created (Newest)')
    
    const response = await axios.get(`/church-records/ministries/getAllMinistries?${params}`)
    
    if (response.data.success) {
      ministryData.value = response.data.data || []
      totalPage.value = response.data.pagination?.totalPages || 1
    } else {
      console.error('Failed to fetch ministries:', response.data.message)
      ministryData.value = []
      totalPage.value = 1
    }
  } catch (e) {
    console.error('Error fetching ministries:', e)
    ministryData.value = []
    totalPage.value = 1
  } finally {
    loading.value = false
  }
}

const fetchDepartmentList = async () => {
  try {
    const response = await axios.get('/church-records/departments/getAllDepartmentsForSelect')
    if (response.data.success && response.data.data) {
      departmentList.value = response.data.data
    }
  } catch (e) {
    console.error('Error fetching departments:', e)
    departmentList.value = []
  }
}

const goToLearnMore = (ministry) => {
  router.push({
    name: 'LearnMoreMinistry',
    params: { id: ministry.ministry_id },
    query: { ministryModel: encodeURIComponent(JSON.stringify(ministry)) }
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

watch([refresh, pageNumber, departmentId], () => {
  if (refresh.value) {
    getAllMinistryList()
    refresh.value = false
  }
})

onMounted(async () => {
  // Fetch CMS data first
  await fetchMinistriesData()
  
  const isMember = sessionStorage.getItem('isMember') === 'true'
  isMemberLandPage.value = isMember
  
  fetchDepartmentList()
  getAllMinistryList()
})
</script>

<style scoped>
.all-ministries-page {
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

.ministries-section {
  position: relative;
}

.ministries-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: flex-start;
}

.ministry-card {
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
  .ministry-card {
    flex: 0 0 calc(50% - 0.75rem);
  }
}

@media (max-width: 640px) {
  .all-ministries-page {
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

  .ministry-card {
    flex: 0 0 100%;
    height: 320px;
  }

  .ministries-grid {
    gap: 1rem;
  }

  .floating-element {
    display: none;
  }
}

.ministry-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.ministry-card:hover .ministry-image {
  transform: scale(1.1);
}

.ministry-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
}

.ministry-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(55, 65, 81, 0.7), rgba(75, 85, 99, 0.2), transparent);
  z-index: 1;
}

.ministry-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: 1.5rem;
  color: white;
}

.ministry-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-family: 'Poppins', 'Inter', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
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
}
</style>
