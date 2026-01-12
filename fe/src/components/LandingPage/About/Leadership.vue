<template>
  <div class="leadership-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${leadershipData.heroImage || getImageUrl('/img/d.jpeg')})` }"
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
        <h1 class="hero-title fade-in-up">{{ leadershipData.heroTitle || 'Church Leadership' }}</h1>
        <p class="hero-subtitle fade-in-up-delay">
          {{ leadershipData.heroSubtitle || 'Dedicated men and women leading our church community with faith, wisdom, and service.' }}
        </p>
      </div>
    </section>

    <!-- Leadership Section -->
    <section class="py-20 bg-white">
      <v-container>
        <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-center text-grey-darken-3 mb-16" style="font-family: 'Georgia', serif; font-style: italic;">
          {{ leadershipData.sectionTitle || 'Meet Our Leaders' }}
        </h2>
        <v-row>
          <v-col
            v-for="(leader, index) in leadersData"
            :key="index"
            cols="12"
            md="6"
          >
            <v-card class="overflow-hidden" elevation="2" hover>
              <div class="aspect-square relative overflow-hidden">
                <v-img
                  :src="leader.image"
                  :alt="leader.name"
                  cover
                  height="100%"
                ></v-img>
              </div>
              <v-card-text class="text-center pa-8">
                <h3 class="text-h5 font-weight-bold text-grey-darken-3 mb-2" style="font-family: 'Georgia', serif; font-style: italic;">
                  {{ leader.name }}
                </h3>
                <p class="text-h6 text-teal mb-4 font-weight-semibold" style="font-family: 'Georgia', serif; font-style: italic;">
                  {{ leader.position }}
                </p>
                <p class="text-body-1 text-grey-darken-1" style="font-family: 'Georgia', serif; font-style: italic;">
                  {{ leader.bio }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Back Button -->
    <section class="py-12 text-center bg-grey-lighten-5">
      <v-btn
        :color="leadershipData.backButtonColor || '#14b8a6'"
        class="text-white"
        size="large"
        rounded
        @click="$router.push('/about')"
        style="font-family: 'Georgia', serif; font-style: italic;"
      >
        {{ leadershipData.backButtonText || 'Back to About' }}
      </v-btn>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

const defaultLeaders = [
  {
    name: "Rev. Fresco Q. Sulapas",
    position: "Senior Pastor",
    bio: "Serving our congregation with passion and commitment to the Word of God and the Great Commission.",
    image: "/img/sir.jpeg"
  },
  {
    name: "Rev. Rodolfo Mojica",
    position: "Sending Pastor",
    bio: "Leading our church with wisdom and dedication, guiding our congregation in spiritual growth.",
    image: "/img/n.jpg"
  }
]

const leadershipData = ref({
  heroTitle: 'Church Leadership',
  heroSubtitle: 'Dedicated men and women leading our church community with faith, wisdom, and service.',
  heroImage: null,
  sectionTitle: 'Meet Our Leaders',
  backButtonText: 'Back to About',
  backButtonColor: '#14b8a6'
})

const leadersData = ref(defaultLeaders)

// Fetch leadership data from CMS
const fetchLeadershipData = async () => {
  try {
    const response = await axios.get('/cms/churchleader/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Leadership:', { content, cmsImages })
      
      // Update leadership data from content
      if (content.heroTitle) leadershipData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) leadershipData.value.heroSubtitle = content.heroSubtitle
      if (content.sectionTitle) leadershipData.value.sectionTitle = content.sectionTitle
      if (content.backButtonText) leadershipData.value.backButtonText = content.backButtonText
      if (content.backButtonColor) {
        leadershipData.value.backButtonColor = content.backButtonColor
        console.log('Back button color from CMS:', content.backButtonColor)
      }
      
      // Handle hero image - images are stored as BLOB, returned as base64 in images object
      // The image is stored with field_name = 'heroImage' in tbl_cms_images
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          leadershipData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        } else {
          console.log('⚠️ Hero image in CMS is not a valid base64 image')
        }
      } else {
        console.log('ℹ️ No hero image found in CMS, using default')
      }
      
      // Handle leaders array
      if (content.leaders && Array.isArray(content.leaders) && content.leaders.length > 0) {
        leadersData.value = content.leaders.map((leader, index) => {
          // Images are stored with keys like: leaders[0].image, leaders[1].image, etc.
          // The composable merges them back into content, but we should check images object first
          const imageKey = `leaders[${index}].image`
          let leaderImage = ''
          
          // First check images object (BLOB converted to base64)
          if (cmsImages && typeof cmsImages === 'object' && cmsImages[imageKey]) {
            const imageBase64 = cmsImages[imageKey]
            if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image/')) {
              leaderImage = imageBase64
              console.log(`✅ Leader ${index} image loaded from CMS (BLOB converted to base64)`)
            }
          }
          
          // Fallback to leader.image if it's base64 (composable might have merged it)
          if (!leaderImage && leader.image && typeof leader.image === 'string' && leader.image.startsWith('data:image/')) {
            leaderImage = leader.image
            console.log(`✅ Leader ${index} image from merged content`)
          }
          
          return {
            name: leader.name || '',
            position: leader.position || '',
            bio: leader.bio || '',
            image: leaderImage
          }
        })
        console.log('✅ Leaders loaded from CMS:', leadersData.value.length, 'items')
      } else {
        console.log('ℹ️ No leaders found in CMS, using defaults')
      }
      
      console.log('✅ Leadership CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Leadership, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching leadership data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

onMounted(async () => {
  await fetchLeadershipData()
})
</script>

<style scoped>
.leadership-page {
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
  margin-top: 64px;
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
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3));
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
}

.hero-subtitle {
  font-size: 1.25rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s forwards;
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

.aspect-square {
  aspect-ratio: 1;
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

