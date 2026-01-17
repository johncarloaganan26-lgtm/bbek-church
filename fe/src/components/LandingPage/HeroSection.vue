u<template>
  <section class="hero-section" style="position: relative;">
    <!-- Loading overlay -->
    <v-overlay :model-value="isLoadingHome" contained class="align-center justify-center" style="z-index: 10;">
      <v-progress-circular indeterminate color="white" size="64"></v-progress-circular>
    </v-overlay>
    
    <!-- Floating Elements -->
    <div class="floating-elements">
      <div
        v-for="(element, index) in floatingElements"
        :key="index"
        class="floating-element"
        :style="element.style"
      ></div>
    </div>

    <!-- Background Container -->
    <div
      class="background-container"
      @mouseenter="showControlsOnHover"
      @mouseleave="hideControls"
      @mousemove="showControlsOnHover"
    >
      <!-- Background Image -->
      <div
        v-if="homeData.backgroundType === 'image' && homeData.homeBackgroundImage"
        class="hero-background-image"
        :style="{ backgroundImage: `url(${homeData.homeBackgroundImage})` }"
      ></div>
      <!-- Carousel Background -->
      <v-carousel
        v-else-if="homeData.backgroundType === 'carousel' && homeData.carouselImages && homeData.carouselImages.length > 0"
        class="hero-carousel"
        height="100%"
        hide-delimiters
        show-arrows="hover"
        cycle
        interval="5000"
      >
        <v-carousel-item
          v-for="(image, index) in homeData.carouselImages"
          :key="`carousel-${index}`"
          :src="image"
          cover
        />
      </v-carousel>
      <!-- Fallback Background -->
      <div
        v-else
        class="hero-video hero-fallback"
        :style="{ backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }"
      ></div>

      <!-- Overlay -->
      <div class="hero-overlay" :class="{ 'dark-overlay': homeData.backgroundType === 'image' || homeData.backgroundType === 'carousel' }"></div>

    </div>

    <!-- Content -->
    <div class="hero-content">
      <div class="hero-text-container">
        <h1 class="hero-title fade-in-up">
          {{ homeData.welcomeText || `Welcome to ${churchName || 'BBEK Church'}` }}
        </h1>
        <div class="hero-schedule mb-6 fade-in-up-delay">
          <h2 class="hero-subtitle">Service Schedule</h2>
          <p class="hero-text">{{ homeData.sundayService || 'Sunday Worship: 9:30 AM - 12:00 PM' }}</p>
          <p class="hero-text">{{ homeData.wednesdayService || 'Wednesday Service: 7:00 PM - 9:00 PM' }}</p>
        </div>
        <div class="hero-buttons fade-in-up-delay-2">
          <!-- Button 1 -->
          <v-btn
            :variant="homeData.button1Variant === 'outlined' ? 'outlined' : 'flat'"
            :style="{
              '--button-color': homeData.buttonColor || '#14b8a6',
              color: homeData.button1Variant === 'outlined' ? (homeData.buttonColor || '#14b8a6') : 'white',
              backgroundColor: homeData.button1Variant === 'outlined' ? 'transparent' : (homeData.buttonColor || '#14b8a6'),
              borderColor: homeData.buttonColor || '#14b8a6'
            }"
            :class="[
              'mr-4 mb-2 hero-btn hero-btn-custom-radius',
              homeData.button1Variant === 'outlined' ? 'hero-btn-dynamic-outlined' : 'hero-btn-dynamic-filled'
            ]"
            size="large"
            @click="$router.push(homeData.button1Link || '/plan-your-visit')"
          >
            {{ homeData.button1Text || 'Plan Your Visit' }}
          </v-btn>

          <!-- Button 2 -->
          <v-btn
            :variant="homeData.button2Variant === 'outlined' ? 'outlined' : 'flat'"
            :style="{
              '--button-color': homeData.buttonColor || '#14b8a6',
              color: homeData.button2Variant === 'outlined' ? (homeData.buttonColor || '#14b8a6') : 'white',
              backgroundColor: homeData.button2Variant === 'outlined' ? 'transparent' : (homeData.buttonColor || '#14b8a6'),
              borderColor: homeData.buttonColor || '#14b8a6'
            }"
            :class="[
              'mb-2 hero-btn hero-btn-custom-radius',
              homeData.button2Variant === 'outlined' ? 'hero-btn-dynamic-outlined' : 'hero-btn-dynamic-filled'
            ]"
            size="large"
            @click="$router.push(homeData.button2Link || '/services/water-baptism')"
          >
            {{ homeData.button2Text || 'Be One Of Us' }}
          </v-btn>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useCmsStore } from '@/stores/cmsStore'

const cmsStore = useCmsStore()

// Loading state for CMS data
const isLoadingHome = computed(() => cmsStore.isPageLoading('home'))

const videoRef = ref(null)
const isPlaying = ref(true)
const isMuted = ref(true)
const currentTime = ref(0)
const duration = ref(0)
const showControls = ref(false)
const churchName = ref('Bible Baptist Ekklesia of Kawit')
const videoExists = ref(true)
const videoSrc = ref(null)
const videoKey = ref(0) // Force video element recreation
const playbackRate = ref(1)
const playbackSpeeds = ref([0.5, 0.75, 1, 1.25, 1.5, 2])
let controlsTimeout = null

// Home page data from CMS
const homeData = ref({
  backgroundType: 'none',
  welcomeText: 'Welcome to Bible Baptist Church of Kwali',
  sundayService: 'Sunday Worship 9:30 AM - 12:00 PM',
  wednesdayService: 'Wednesday Service 7:00 PM - 9:00 PM',
  // Shared button color for both buttons
  buttonColor: '#14b8a6',
  // Button 1 (Plan Your Visit)
  button1Text: 'Plan Your Visit',
  button1HoverColor: '#0d9488',
  button1Link: '/plan-your-visit',
  button1Variant: 'filled', // 'filled' or 'outlined'
  // Button 2 (Be One Of Us)
  button2Text: 'Be One Of Us',
  button2HoverColor: '#0d9488',
  button2Link: '/services/water-baptism',
  button2Variant: 'filled', // 'filled' or 'outlined'
  homeVideo: null,
  homeBackgroundImage: null,
  carouselImages: []
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

const togglePlay = () => {
  if (videoRef.value) {
    if (isPlaying.value) {
      videoRef.value.pause()
    } else {
      videoRef.value.play()
    }
    isPlaying.value = !isPlaying.value
  }
}

const toggleMute = () => {
  if (videoRef.value) {
    videoRef.value.muted = !isMuted.value
    isMuted.value = !isMuted.value
  }
}

const changePlaybackRate = (rate) => {
  if (videoRef.value) {
    videoRef.value.playbackRate = rate
    playbackRate.value = rate
  }
}

const onVideoLoaded = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
  }
}

const onVideoError = () => {
  videoExists.value = false
}

const onTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

const formatTime = (time) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}


const showControlsOnHover = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }
  showControls.value = true
}

const hideControls = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }
  controlsTimeout = setTimeout(() => {
    showControls.value = false
  }, 2000)
}

// Fetch home data from CMS
const fetchHomeData = async (forceRefresh = false) => {
  try {
    // First, clear the video completely to force refresh
    if (videoRef.value) {
      videoRef.value.pause()
      videoRef.value.src = ''
      videoRef.value.load()
    }
    videoSrc.value = null
    videoExists.value = false
    homeData.value.homeVideo = null

    // Wait for DOM to update and clear
    await nextTick()

    const cmsData = await cmsStore.fetchPageData('home', forceRefresh)
    if (cmsData) {
      const { page, images } = cmsData
      const content = page?.content || {}

      // Update home data
      homeData.value.backgroundType = content.backgroundType || homeData.value.backgroundType
      homeData.value.welcomeText = content.welcomeText || homeData.value.welcomeText
      homeData.value.sundayService = content.sundayService || homeData.value.sundayService
      homeData.value.wednesdayService = content.wednesdayService || homeData.value.wednesdayService

      // Update shared button color
      homeData.value.buttonColor = content.buttonColor || homeData.value.buttonColor

      // Update button 1 (Plan Your Visit)
      homeData.value.button1Text = content.button1Text || homeData.value.button1Text
      homeData.value.button1HoverColor = content.button1HoverColor || homeData.value.button1HoverColor
      homeData.value.button1Link = content.button1Link || homeData.value.button1Link
      homeData.value.button1Variant = content.button1Variant || homeData.value.button1Variant

      // Update button 2 (Be One Of Us)
      homeData.value.button2Text = content.button2Text || homeData.value.button2Text
      homeData.value.button2HoverColor = content.button2HoverColor || homeData.value.button2HoverColor
      homeData.value.button2Link = content.button2Link || homeData.value.button2Link
      homeData.value.button2Variant = content.button2Variant || homeData.value.button2Variant

      // Handle home background image
      if (images?.homeBackgroundImage) {
        homeData.value.homeBackgroundImage = images.homeBackgroundImage
      }

      // Handle carousel images - reconstruct array from individual image keys
      const carouselImages = [];
      for (const [key, value] of Object.entries(images || {})) {
        if (key.startsWith('carouselImages[') && key.endsWith(']')) {
          const match = key.match(/carouselImages\[(\d+)\]/);
          if (match) {
            const index = parseInt(match[1]);
            carouselImages[index] = value;
          }
        }
      }
      // Remove undefined entries and assign
      homeData.value.carouselImages = carouselImages.filter(img => img);
      
      // Handle video - wait a bit more to ensure DOM is cleared
      await nextTick()
      
      if (images?.homeVideo) {
        homeData.value.homeVideo = images.homeVideo
        // Increment key to force video element recreation
        videoKey.value++
        // Set new video source - the :key attribute will force video element to re-render
        videoSrc.value = images.homeVideo
        videoExists.value = true
        
        // Wait for video element to be created and then load it
        await nextTick()
        await nextTick() // Double nextTick to ensure element is ready
        
        if (videoRef.value) {
          videoRef.value.load()
          if (isPlaying.value) {
            videoRef.value.play().catch(err => {
              console.warn('Video autoplay prevented:', err)
            })
          }
        }
      } else {
        // No video in CMS - show fallback background
        videoKey.value++ // Increment to force removal
        videoSrc.value = null
        videoExists.value = false
      }
    } else {
      // No data from CMS - show fallback
      videoSrc.value = null
      videoExists.value = false
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching home data from CMS:', error)
    }
    // On error, show fallback
    videoSrc.value = null
    videoExists.value = false
  }
}

// Watch for video source changes and reload video
// Note: The :key attribute on the video element should handle most of the recreation
// This watch is mainly for ensuring the video plays after being created
watch([videoSrc, videoExists], async ([newSrc, exists], [oldSrc, oldExists]) => {
  // Only handle if we have a new valid source and video should exist
  if (newSrc && exists && newSrc !== oldSrc) {
    // Wait for DOM to update and video element to be created (key change forces recreation)
    await nextTick()
    await nextTick() // Double nextTick to ensure element is ready
    
    // Retry a few times in case the element isn't ready yet
    let retries = 0
    const maxRetries = 5
    
    const tryLoadVideo = async () => {
      if (videoRef.value && videoRef.value.load) {
        try {
          videoRef.value.load()
          if (isPlaying.value && videoRef.value.play) {
            videoRef.value.play().catch(err => {
              console.warn('Video autoplay prevented:', err)
            })
          }
        } catch (error) {
          console.error('Error loading video:', error)
        }
      } else if (retries < maxRetries) {
        retries++
        await new Promise(resolve => setTimeout(resolve, 100))
        await tryLoadVideo()
      }
    }
    
    await tryLoadVideo()
  }
}, { flush: 'post' }) // Use 'post' flush to ensure DOM has updated

// Listen for CMS updates
const handleCmsUpdate = async (event) => {
  if (event.detail?.page === 'home') {
    console.log('CMS home page updated, refreshing HeroSection')
    console.log('Current buttonColor before refresh:', homeData.value.buttonColor)

    // Wait for database transaction to commit
    await new Promise(resolve => setTimeout(resolve, 1500))

    await fetchHomeData(true) // Force refresh
    console.log('HeroSection refreshed, new buttonColor:', homeData.value.buttonColor)
  }
}

onMounted(async () => {
  await fetchHomeData()

  // Listen for CMS update events
  window.addEventListener('cms-page-updated', handleCmsUpdate)
})

onUnmounted(() => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }

  // Remove event listener
  window.removeEventListener('cms-page-updated', handleCmsUpdate)
})
</script>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: white;
}

.background-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  cursor: pointer;
}

.hero-background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.hero-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-fallback {
  background-size: cover;
  background-position: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(55, 65, 81, 0.4), rgba(75, 85, 99, 0.3), rgba(156, 163, 175, 0.2));
  z-index: 2;
  pointer-events: none;
}

.hero-overlay.dark-overlay {
  background: rgba(0, 0, 0, 0.6) !important;
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding: 40px;
  pointer-events: none;
}

.hero-content > * {
  pointer-events: auto;
}

.hero-text-container {
  max-width: 550px;
  background: rgba(1, 1, 1, 0.58);
  border: 20px solid rgba(253, 253, 253, 0);
  color: white;
  padding: 1.25rem 2rem;
  line-height: 1.5;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
} 

.hero-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.2rem;
  font-weight: 500;
  color: white;
  margin-bottom: 0.5rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-text {
  color: white;
  font-weight: bold;
  margin-bottom: 0.25rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.floating-elements {
  position: absolute;
  inset: 0;
  z-index: 5;
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

.video-controls {
  position: absolute;
  bottom: 24px;
  right: 24px;
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: 25;
  opacity: 1;
  pointer-events: auto;
}

.video-controls-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background-color: rgba(55, 65, 81, 0.9);
  border: 1px solid rgba(156, 163, 175, 0.5);
  border-radius: 24px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.time-display {
  color: white;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  min-width: 80px;
  text-align: center;
}

.speed-menu {
  background-color: white;
  backdrop-filter: blur(8px);
}

.speed-menu :deep(.v-list-item) {
  color: black;
}

.speed-menu :deep(.v-list-item--active) {
  background-color: rgba(20, 184, 166, 0.3);
  color: #14b8a6;
}

.speed-menu :deep(.v-list-subheader) {
  color: rgba(0, 0, 0, 0.6);
}

.hero-buttons :deep(.hero-btn) {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.hero-buttons :deep(.hero-btn:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.hero-buttons :deep(.hero-btn-black:hover) {
  background-color: #14b8a6 !important;
}

.hero-buttons :deep(.hero-btn:not(.hero-btn-black):hover) {
  /* background-color: #000000 !important; */
}

/* Reverse hover effects for hero buttons - start filled, become outlined on hover */
.hero-buttons :deep(.hero-btn-reverse) {
  position: relative;
  overflow: hidden;
  color: white !important;
  background: #14b8a6 !important;
  border-color: #14b8a6 !important;
  transition: all 0.3s ease;
  z-index: 1;
}

.hero-buttons :deep(.hero-btn-reverse)::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #14b8a6;
  transition: height 0.3s ease;
  z-index: -1;
}

.hero-buttons :deep(.hero-btn-reverse:hover) {
  /* color: #14b8a6 !important; */
  background: transparent !important;
  border-color: #fbffff !important;
}

.hero-buttons :deep(.hero-btn-reverse:hover)::before {
  height: 0%;
}

/* Custom border radius for hero buttons */
.hero-buttons :deep(.hero-btn-custom-radius) {
  border-radius: 5px !important;
  height: 40px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-transform: none !important;
}

/* Dynamic filled button styles */
.hero-buttons :deep(.hero-btn-dynamic-filled) {
  /* Let inline styles handle the colors */
  transition: all 0.3s ease;
}

.hero-buttons :deep(.hero-btn-dynamic-filled:hover) {
  border-color: white !important;
  color: white !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Dynamic outlined button styles */
.hero-buttons :deep(.hero-btn-dynamic-outlined) {
  /* Let inline styles handle the colors */
  transition: all 0.3s ease;
}

.hero-buttons :deep(.hero-btn-dynamic-outlined:hover) {
  background: var(--button-color) !important;
  color: white !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.fade-in-up-delay-2 {
  animation: fadeInUp 0.8s ease-out 0.4s both;
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
  
  .hero-text-container {
    max-width: 100%;
    padding: 1rem;
  }

  .hero-content {
    padding: 24px;
  }

  .hero-buttons {
    flex-direction: column;
  }

  .hero-buttons :deep(.v-btn) {
    width: 100%;
    margin-right: 0 !important;
  }
}

@media (max-width: 640px) {
  .hero-section {
    height: 100vh;
    min-height: 600px;
  }

  .hero-title {
    font-size: 1.75rem;
    line-height: 1.2;
  }

  .hero-subtitle {
    font-size: 1rem;
    line-height: 1.3;
  }

  .hero-text {
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .hero-text-container {
    padding: 1rem;
    border-width: 8px;
    max-width: 100%;
    margin: 0 auto;
  }

  .hero-content {
    padding: 16px;
  }

  .hero-buttons {
    gap: 0.5rem;
  }

  .hero-buttons :deep(.v-btn) {
    padding: 12px 16px;
    font-size: 0.9rem;
    min-height: 44px;
  }

  .video-controls {
    bottom: 16px;
    right: 16px;
  }

  .video-controls-bar {
    padding: 6px 12px;
    gap: 8px;
  }

  .time-display {
    font-size: 12px;
    min-width: 60px;
  }

  .floating-element {
    display: none;
  }
}
</style>

