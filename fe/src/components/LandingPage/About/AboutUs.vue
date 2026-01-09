<template>
  <div class="about-us-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${ourStoryData.heroImage || getImageUrl('/img/about us.jpg')})` }"
        @error="handleHeroImageError"
      ></div>
      <div class="hero-overlay-gradient"></div>
      
      <!-- Floating Elements -->
      <div class="floating-elements">
        <div
          v-for="(element, index) in floatingElements"
          :key="index"
          class="floating-element"
          :style="element.style"
        ></div>
      </div>

      <div class="hero-content-wrapper">
        <h1 class="hero-title fade-in-up">{{ ourStoryData.heroTitle || 'Our Story' }}</h1>
        <p class="hero-subtitle fade-in-up-delay">
          {{ ourStoryData.heroSubtitle || 'A community of believers dedicated to spreading the love and teachings of Jesus Christ.' }}
        </p>
      </div>
    </section>

    <!-- About Our Church -->
    <section class="py-16 bg-white">
      <v-container>
        <v-row align="center">
          <v-col cols="12" lg="6">
            <h2 class="text-h3 text-md-h4 font-weight-bold text-grey-darken-3 mb-6">
              {{ ourStoryData.aboutTitle || 'About Our Church' }}
            </h2>
            <p class="text-h6 text-grey-darken-1 mb-6">
              {{ ourStoryData.aboutSubtitle || 'We look forward to welcoming you into our family of faith. Our vision is to be a Christ-centered community that:' }}
            </p>
            <div class="space-y-4">
              <v-card class="pa-4" variant="flat" color="grey-lighten-5">
                <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">{{ ourStoryData.liveByFaithTitle || 'Live By Faith' }}</h3>
                <p class="text-body-2 text-grey-darken-1">
                  {{ ourStoryData.liveByFaithText || 'Boldly proclaim and practice the Gospel in daily life\nTrust God\'s promises with unwavering confidence' }}
                </p>
              </v-card>
              <v-card class="pa-4" variant="flat" color="grey-lighten-5">
                <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">{{ ourStoryData.knownByLoveTitle || 'Known By Love' }}</h3>
                <p class="text-body-2 text-grey-darken-1">
                  {{ ourStoryData.knownByLoveText || 'Extend grace without judgment — love first, listen deeply\nServe others sacrificially, going beyond what is expected' }}
                </p>
              </v-card>
              <v-card class="pa-4" variant="flat" color="grey-lighten-5">
                <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">{{ ourStoryData.voiceOfHopeTitle || 'A Voice of Hope' }}</h3>
                <p class="text-body-2 text-grey-darken-1">
                  {{ ourStoryData.voiceOfHopeText || 'Declare Jesus as our "Blessed Redeemer" (Galatians 3:13)\nKeep our eyes fixed on eternity, living with Kingdom perspective' }}
                </p>
              </v-card>
            </div>
          </v-col>
          <v-col cols="12" lg="6">
            <v-img
              :src="ourStoryData.aboutImage || '/img/hero2.jpg'"
              alt="Church community"
              cover
              height="400"
              class="rounded-lg"
            ></v-img>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Mission & Vision -->
    <section class="py-16 bg-white">
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <div class="text-center mb-8">
              <v-icon size="32" color="teal" class="mb-4">mdi-eye</v-icon>
              <h2 class="text-h4 font-weight-bold text-teal mb-4">Our Vision</h2>
            </div>
            <v-card class="pa-8" variant="flat" color="grey-lighten-5">
              <p class="text-h6 text-grey-darken-1 italic mb-4">
                "{{ ourStoryData.vision || vision }}"
              </p>
              <p class="text-body-2 text-grey-darken-1">{{ ourStoryData.visionVerse || 'Matthew 28:19-20' }}</p>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-center mb-8">
              <v-icon size="32" color="teal" class="mb-4">mdi-check-circle</v-icon>
              <h2 class="text-h4 font-weight-bold text-teal mb-4">Our Mission</h2>
            </div>
            <v-card class="pa-8" variant="flat" color="grey-lighten-5">
              <p class="text-h6 text-grey-darken-1 italic">
                "{{ ourStoryData.mission || mission }}"
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Our History Timeline -->
    <section class="py-20 bg-white">
      <v-container>
        <div class="text-center mb-16">
          <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-grey-darken-3 mb-6 fade-in-up">
            {{ ourStoryData.historyTitle || 'Our History' }}
          </h2>
          <p class="text-h6 text-grey-darken-1 max-width-4xl mx-auto fade-in-up-delay">
            {{ ourStoryData.historySubtitle || 'Celebrating our journey of faith, missions, and community from humble beginnings to a global vision.' }}
          </p>
        </div>

        <div class="timeline-container" ref="timelineContainer">
          <!-- Animated Progress Line -->
          <div class="timeline-progress-line" :style="{ height: `${scrollProgress}%` }"></div>
          <div
            v-for="(milestone, index) in timelineData"
            :key="index"
            :ref="el => timelineItemRefs[index] = el"
            :class="`timeline-item timeline-item-${index + 1} ${index % 2 === 1 ? 'timeline-item-right' : ''} ${visibleItems[index] ? 'timeline-item-visible' : ''}`"
          >
            <div class="timeline-marker" :class="{ 'marker-active': visibleItems[index], 'marker-past': scrollProgress > (index + 1) * 20 }"></div>
            <div class="timeline-content" :class="{ 'content-visible': visibleItems[index] }">
              <div class="timeline-year">{{ milestone.year }}</div>
              <v-card class="pa-6" elevation="2">
                <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-3">
                  {{ milestone.title }}
                </h3>
                <p class="text-body-2 text-grey-darken-1 mb-4">
                  {{ milestone.description }}
                </p>
                <v-img
                  v-if="milestone.image"
                  :src="milestone.image"
                  :alt="milestone.title"
                  cover
                  height="200"
                  class="rounded"
                ></v-img>
              </v-card>
            </div>
          </div>
        </div>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from '@/api/axios'

const getImageUrl = (imagePath) => {
  const parts = imagePath.split('/')
  const filename = parts.pop()
  const encodedFilename = encodeURIComponent(filename)
  return parts.join('/') + '/' + encodedFilename
}

const handleHeroImageError = (event) => {
  const target = event.target || event.currentTarget
  if (target) {
    target.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
}

// Timeline scroll animation refs
const timelineContainer = ref(null)
const timelineItemRefs = ref([])
const visibleItems = ref({})
const scrollProgress = ref(0)
let observer = null

// Setup scroll tracking for progress line
const handleScroll = () => {
  if (!timelineContainer.value) return
  
  const containerRect = timelineContainer.value.getBoundingClientRect()
  const containerTop = containerRect.top
  const containerHeight = containerRect.height
  const viewportHeight = window.innerHeight
  
  // Calculate how far we've scrolled through the timeline
  const startOffset = viewportHeight * 0.6
  const endOffset = containerHeight + 100
  
  let progress = (startOffset - containerTop) / endOffset * 100
  progress = Math.max(0, Math.min(100, progress))
  
  scrollProgress.value = progress
}

// Setup Intersection Observer for timeline scroll animations
const setupTimelineObserver = () => {
  const options = {
    root: null,
    rootMargin: '-50px 0px -50% 0px',
    threshold: 0.1
  }
  
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = timelineItemRefs.value.findIndex(el => el === entry.target)
        if (index !== -1) {
          visibleItems.value[index] = true
        }
      }
    })
  }, options)
  
  // Observe all timeline items
  timelineItemRefs.value.forEach((el) => {
    if (el) observer.observe(el)
  })
}

// Cleanup observer on unmount
const cleanupTimelineObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

const floatingElements = ref([
  { style: { top: '40px', left: '40px', width: '64px', height: '64px', animationDelay: '0s' } },
  { style: { top: '80px', right: '80px', width: '48px', height: '48px', animationDelay: '1s' } },
  { style: { bottom: '80px', left: '80px', width: '56px', height: '56px', animationDelay: '2s' } },
  { style: { bottom: '40px', right: '40px', width: '40px', height: '40px', animationDelay: '0.5s' } },
  { style: { top: '50%', left: '33%', width: '32px', height: '32px', animationDelay: '1.5s' } },
  { style: { top: '25%', left: '25%', width: '24px', height: '24px', animationDelay: '0.8s' } },
  { style: { bottom: '33%', left: '50%', width: '36px', height: '36px', animationDelay: '2.2s' } },
  { style: { top: '75%', left: '40px', width: '20px', height: '20px', animationDelay: '1.8s' } },
  { style: { bottom: '25%', right: '25%', width: '28px', height: '28px', animationDelay: '0.3s' } },
  { style: { top: '33%', right: '40px', width: '44px', height: '44px', animationDelay: '2.8s' } },
  { style: { top: '50%', right: '33%', width: '16px', height: '16px', animationDelay: '1.1s' } },
  { style: { bottom: '50%', left: '25%', width: '52px', height: '52px', animationDelay: '0.9s' } }
])

const mission = ref("To glorify God by making disciples of Jesus Christ through biblical preaching, authentic worship, and compassionate service to our community and the world.")
const vision = ref("To be a thriving church community that transforms lives, strengthens families, and impacts our city and beyond with the love and truth of Jesus Christ.")

const defaultTimeline = [
  {
    year: "2025",
    title: "10th Church Anniversary & 4th World Missions Conference",
    description: "We look forward to celebrating our 10th anniversary as a church and hosting our 4th World Missions Conference.",
    image: "/img/WORLD MISSIONS CONFERENCE & ANNIVERSARY/49051481_560890411093015_8729947205839880192_n.jpg"
  },
  {
    year: "2021",
    title: "1st World Missions Conference",
    description: "We hosted our first World Missions Conference, bringing together missionaries and supporters to further the Great Commission.",
    image: "/img/WORLD MISSIONS CONFERENCE & ANNIVERSARY/60940904_644013782780677_9060964737684078592_n.jpg"
  },
  {
    year: "2016",
    title: "1st Anniversary Celebration as an Organized Church",
    description: "We celebrated our first anniversary as an officially organized church, marking a significant milestone in our journey.",
    image: "/img/WORLD MISSIONS CONFERENCE & ANNIVERSARY/449756212_1962142897634419_3397048225149051857_n.jpg"
  },
  {
    year: "2015",
    title: "Started to Support Foreign Missionaries",
    description: "We expanded our mission work by beginning to support foreign missionaries, extending our reach globally.",
    image: "/img/Street Preaching-Evangelism/438203942_1607246523394267_2180404566761606927_n.jpg"
  },
  {
    year: "2006",
    title: "Started Mission Work in Kawit",
    description: "Our church began as a small mission work in Kawit, Cavite, with a vision to reach the community with the Gospel.",
    image: "/img/CHILDREN MINISTRY/438203864_2766158940200706_450215752701856802_n.jpg"
  }
]

const ourStoryData = ref({
  heroTitle: 'Our Story',
  heroSubtitle: 'A community of believers dedicated to spreading the love and teachings of Jesus Christ.',
  heroImage: null,
  aboutTitle: 'About Our Church',
  aboutSubtitle: 'We look forward to welcoming you into our family of faith. Our vision is to be a Christ-centered community that:',
  liveByFaithTitle: 'Live By Faith',
  liveByFaithText: 'Boldly proclaim and practice the Gospel in daily life\nTrust God\'s promises with unwavering confidence',
  knownByLoveTitle: 'Known By Love',
  knownByLoveText: 'Extend grace without judgment — love first, listen deeply\nServe others sacrificially, going beyond what is expected',
  voiceOfHopeTitle: 'A Voice of Hope',
  voiceOfHopeText: 'Declare Jesus as our "Blessed Redeemer" (Galatians 3:13)\nKeep our eyes fixed on eternity, living with Kingdom perspective',
  aboutImage: null,
  mission: null,
  vision: null,
  visionVerse: 'Matthew 28:19-20',
  historyTitle: 'Our History',
  historySubtitle: 'Celebrating our journey of faith, missions, and community from humble beginnings to a global vision.'
})

const timelineData = ref(defaultTimeline)

// Fetch our story data from CMS
const fetchOurStoryData = async () => {
  try {
    const response = await axios.get('/cms/ourstory/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Our Story:', { content, cmsImages })
      
      // Update our story data from content
      if (content.heroTitle) ourStoryData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) ourStoryData.value.heroSubtitle = content.heroSubtitle
      if (content.aboutTitle) ourStoryData.value.aboutTitle = content.aboutTitle
      if (content.aboutSubtitle) ourStoryData.value.aboutSubtitle = content.aboutSubtitle
      if (content.liveByFaithTitle) ourStoryData.value.liveByFaithTitle = content.liveByFaithTitle
      if (content.liveByFaithText) ourStoryData.value.liveByFaithText = content.liveByFaithText
      if (content.knownByLoveTitle) ourStoryData.value.knownByLoveTitle = content.knownByLoveTitle
      if (content.knownByLoveText) ourStoryData.value.knownByLoveText = content.knownByLoveText
      if (content.voiceOfHopeTitle) ourStoryData.value.voiceOfHopeTitle = content.voiceOfHopeTitle
      if (content.voiceOfHopeText) ourStoryData.value.voiceOfHopeText = content.voiceOfHopeText
      if (content.mission) ourStoryData.value.mission = content.mission
      if (content.vision) ourStoryData.value.vision = content.vision
      if (content.visionVerse) ourStoryData.value.visionVerse = content.visionVerse
      if (content.historyTitle) ourStoryData.value.historyTitle = content.historyTitle
      if (content.historySubtitle) ourStoryData.value.historySubtitle = content.historySubtitle
      
      // Handle hero image - images are stored as BLOB, returned as base64 in images object
      // The image is stored with field_name = 'heroImage' in tbl_cms_images
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          ourStoryData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        } else {
          console.log('⚠️ Hero image in CMS is not a valid base64 image')
        }
      } else {
        console.log('ℹ️ No hero image found in CMS, using default')
      }
      
      // Handle about image - images are stored as BLOB, returned as base64 in images object
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.aboutImage) {
        const aboutImageBase64 = cmsImages.aboutImage
        if (aboutImageBase64 && typeof aboutImageBase64 === 'string' && aboutImageBase64.startsWith('data:image/')) {
          ourStoryData.value.aboutImage = aboutImageBase64
          console.log('✅ About image loaded from CMS (BLOB converted to base64)')
        } else {
          console.log('⚠️ About image in CMS is not a valid base64 image')
        }
      } else {
        console.log('ℹ️ No about image found in CMS, using default')
      }
      
      // Handle timeline
      if (content.timeline && Array.isArray(content.timeline) && content.timeline.length > 0) {
        timelineData.value = content.timeline.map((item, index) => {
          // Images are stored with keys like: timeline[0].image, timeline[1].image, etc.
          const imageKey = `timeline[${index}].image`
          let timelineImage = ''
          
          // First check images object (BLOB converted to base64)
          if (cmsImages && typeof cmsImages === 'object' && cmsImages[imageKey]) {
            const imageBase64 = cmsImages[imageKey]
            if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image/')) {
              timelineImage = imageBase64
              console.log(`✅ Timeline ${index} image loaded from CMS (BLOB converted to base64)`)
            }
          }
          
          // Fallback to item.image if it's base64 (composable might have merged it)
          if (!timelineImage && item.image && typeof item.image === 'string' && item.image.startsWith('data:image/')) {
            timelineImage = item.image
            console.log(`✅ Timeline ${index} image from merged content`)
          }
          
          return {
            year: item.year || '',
            title: item.title || '',
            description: item.description || '',
            image: timelineImage
          }
        })
        console.log('✅ Timeline loaded from CMS:', timelineData.value.length, 'items')
      } else {
        console.log('ℹ️ No timeline found in CMS, using defaults')
      }
      
      console.log('✅ Our Story CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Our Story, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching our story data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

onMounted(async () => {
  await fetchOurStoryData()
  // Setup scroll observer after DOM is ready
  setTimeout(() => {
    setupTimelineObserver()
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
  }, 100)
})

onUnmounted(() => {
  cleanupTimelineObserver()
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.about-us-page {
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
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hero-overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(20, 184, 166, 0.4), rgba(20, 184, 166, 0.2));
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
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

.hero-content-wrapper {
  position: relative;
  z-index: 10;
  text-align: center;
  color: white;
  padding: 40px;
  max-width: 80rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.hero-subtitle {
  font-size: 1.25rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

.timeline-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 0;
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
  transform: translateX(-50%);
}

/* Animated Progress Line */
.timeline-progress-line {
  position: absolute;
  left: 50%;
  top: 0;
  width: 4px;
  background: linear-gradient(to bottom, #14b8a6, #0d9488);
  transform: translateX(-50%);
  z-index: 1;
  transition: height 0.1s linear;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(20, 184, 166, 0.5);
}

.timeline-item {
  position: relative;
  margin-bottom: 60px;
  display: flex;
  align-items: center;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease-out;
}

.timeline-item-visible {
  opacity: 1;
  transform: translateY(0);
}

.timeline-item-1 { transition-delay: 0ms; }
.timeline-item-2 { transition-delay: 100ms; }
.timeline-item-3 { transition-delay: 200ms; }
.timeline-item-4 { transition-delay: 300ms; }
.timeline-item-5 { transition-delay: 400ms; }

.timeline-item :deep(.v-card) {
  transition: all 0.3s ease;
}

.timeline-item:hover :deep(.v-card) {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.timeline-item-right {
  flex-direction: row-reverse;
}

.timeline-marker {
  position: absolute;
  left: 50%;
  width: 16px;
  height: 16px;
  background: #ccc;
  border: 4px solid white;
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 2;
  transition: all 0.4s ease;
  box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
}

.timeline-marker.marker-active {
  background: #14b8a6;
  box-shadow: 0 0 0 6px rgba(20, 184, 166, 0.3);
  transform: translateX(-50%) scale(1.3);
}

.timeline-marker.marker-past {
  background: #14b8a6;
  border-color: #14b8a6;
  transform: translateX(-50%) scale(1.2);
}

.timeline-content {
  width: 45%;
  padding: 0 20px;
  opacity: 0;
  transform: translateX(-20px);
  transition: all 0.5s ease-out 0.2s;
}

.timeline-item-right .timeline-content {
  transform: translateX(20px);
}

.timeline-content.content-visible {
  opacity: 1;
  transform: translateX(0);
}

.timeline-content {
  width: 45%;
  padding: 0 20px;
}

.timeline-year {
  font-size: 2rem;
  font-weight: bold;
  color: #14b8a6;
  margin-bottom: 12px;
}

.timeline-item-right .timeline-content {
  text-align: right;
}

@media (max-width: 960px) {
  .timeline-container::before {
    left: 20px;
    background: #e0e0e0;
  }
  
  .timeline-progress-line {
    left: 20px;
    transform: translateX(-50%);
  }
  
  .timeline-marker {
    left: 20px;
  }
  
  .timeline-content {
    width: calc(100% - 60px);
    margin-left: 60px;
  }
  
  .timeline-item-right .timeline-content {
    margin-left: 60px;
    text-align: left;
  }
  
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
</style>

