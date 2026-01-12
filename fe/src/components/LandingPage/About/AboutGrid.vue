<template>
  <div class="about-grid-page" style="position: relative;">
    <!-- Loading overlay -->
    <v-overlay :model-value="loading" contained class="align-center justify-center" style="z-index: 1000;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${aboutData.heroImage || '/img/servi.jpg'})` }"
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
        <h1 class="hero-title fade-in-up">
          {{ aboutData.heroTitle }}
        </h1>
        <p class="hero-subtitle fade-in-up-delay">
          {{ aboutData.heroSubtitle }}
        </p>
      </div>
    </section>

    <!-- Grid Section -->
    <section class="grid-section py-20">
      <v-container>
        <div class="text-center mb-16">
          <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-grey-darken-3 mb-6 fade-in-up" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ aboutData.gridTitle }}
          </h2>
          <p class="text-h6 text-grey-darken-1 max-width-3xl mx-auto fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ aboutData.gridSubtitle }}
          </p>
        </div>

        <v-row>
          <v-col
            v-for="(section, index) in aboutSections"
            :key="index"
            cols="12"
            md="6"
          >
            <router-link :to="section.link" class="text-decoration-none">
              <v-card
                :class="`section-card section-card-${index + 1}`"
                elevation="4"
                hover
              >
                <div class="section-image-container">
                  <v-img
                    :src="section.image && section.image.startsWith('data:') ? section.image : getImageUrl(section.image || section.fallback || '/img/default.jpg')"
                    :alt="section.title"
                    cover
                    height="320"
                    class="section-image"
                    @error="(event) => handleImageError(event, index)"
                    :lazy-src="section.fallback ? getImageUrl(section.fallback) : undefined"
                  >
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular
                          indeterminate
                          color="grey-lighten-5"
                        ></v-progress-circular>
                      </div>
                    </template>
                  </v-img>
                  <div class="section-overlay"></div>
                  <div class="section-content">
                    <h3 class="text-h4 text-md-h5 font-weight-bold text-white mb-3" style="font-family: 'Georgia', serif; font-style: italic;">
                      {{ section.title }}
                    </h3>
                    <p class="text-body-1 text-white opacity-90 mb-4" style="font-family: 'Georgia', serif; font-style: italic;">
                      {{ section.description }}
                    </p>
                    <div class="d-flex align-center text-white">
                      <span class="text-body-2 font-weight-semibold mr-2" style="font-family: 'Georgia', serif; font-style: italic;">Explore</span>
                      <v-icon color="white">mdi-arrow-right</v-icon>
                    </div>
                  </div>
                </div>
              </v-card>
            </router-link>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/api/axios'

const defaultAboutData = {
  heroImage: '/img/servi.jpg',
  heroTitle: 'About Bible Baptist Ekklesia of Kawit',
  heroSubtitle: 'Discover our faith community, leadership, and the heart of our mission to serve and grow together in Christ.',
  gridTitle: 'Explore Our Community',
  gridSubtitle: 'Dive deeper into what makes our church family special. Each section reveals a different aspect of our spiritual journey and community life.',
  aboutSections: [
    {
      title: "Our Story",
      image: "/img/about us.jpg",
      fallback: "/img/abt.jpg",
      link: "/about/aboutus",
      description: "Learn about our journey, values, and the foundation of our faith community"
    },
    {
      title: "Department Officers",
      image: "/img/churchdepartments.webp",
      fallback: "/img/departments.webp",
      link: "/about/departmentofficer",
      description: "Meet the dedicated leaders serving in our various church departments"
    },
    {
      title: "Church Leadership",
      image: "/img/d.jpeg",
      fallback: "/img/sir.jpeg",
      link: "/about/churchleaders",
      description: "Discover our pastors and leaders guiding our spiritual journey"
    },
    {
      title: "Beliefs",
      image: "/img/beliefs.jpg",
      fallback: "/img/beliefs.webp",
      link: "/about/beliefs",
      description: "Explore the core doctrines and principles that guide our faith"
    }
  ]
}

const aboutData = ref(JSON.parse(JSON.stringify(defaultAboutData)))
const aboutSections = ref(aboutData.value.aboutSections)
const loading = ref(false)

// Fetch about grid data from CMS
const fetchAboutGridData = async () => {
  loading.value = true
  try {
    const response = await axios.get('/cms/about/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - About Grid:', { content, cmsImages })
      
      // Update about data from content
      if (content.heroTitle) aboutData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) aboutData.value.heroSubtitle = content.heroSubtitle
      if (content.gridTitle) aboutData.value.gridTitle = content.gridTitle
      if (content.gridSubtitle) aboutData.value.gridSubtitle = content.gridSubtitle
      
      // Handle hero image - images are stored as BLOB, returned as base64 in images object
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          aboutData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        } else {
          console.log('⚠️ Hero image in CMS is not a valid base64 image')
        }
      } else {
        console.log('ℹ️ No hero image found in CMS, using default')
      }
      
      // Handle aboutSections array
      if (content.aboutSections && Array.isArray(content.aboutSections) && content.aboutSections.length > 0) {
        aboutSections.value = content.aboutSections.map((section, index) => {
          // Images are stored with keys like: aboutSections[0].image, aboutSections[1].image, etc.
          const imageKey = `aboutSections[${index}].image`
          let sectionImage = ''
          
          // First check images object (BLOB converted to base64)
          if (cmsImages && typeof cmsImages === 'object' && cmsImages[imageKey]) {
            const imageBase64 = cmsImages[imageKey]
            if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image/')) {
              sectionImage = imageBase64
              console.log(`✅ Section ${index} image loaded from CMS (BLOB converted to base64)`)
            }
          }
          
          // Fallback to section.image if it's base64 (composable might have merged it)
          if (!sectionImage && section.image && typeof section.image === 'string' && section.image.startsWith('data:image/')) {
            sectionImage = section.image
            console.log(`✅ Section ${index} image from merged content`)
          }
          
          return {
            title: section.title || '',
            description: section.description || '',
            link: section.link || '',
            image: sectionImage || section.image || '',
            fallback: section.fallback || ''
          }
        })
        aboutData.value.aboutSections = aboutSections.value
        console.log('✅ About sections loaded from CMS:', aboutSections.value.length, 'sections')
      } else {
        console.log('ℹ️ No about sections found in CMS, using defaults')
      }
      
      console.log('✅ About Grid CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for About Grid, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching about grid data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchAboutGridData()
})

const getImageUrl = (imagePath) => {
  // Properly encode the URL, handling spaces and special characters
  const parts = imagePath.split('/')
  const filename = parts.pop()
  const encodedFilename = encodeURIComponent(filename)
  return parts.join('/') + '/' + encodedFilename
}

const imageErrors = ref(new Map())

const handleImageError = (event, sectionIndex) => {
  const section = aboutSections.value[sectionIndex]
  if (!section) return
  
  // Track errors to prevent infinite loops
  const errorKey = `${sectionIndex}-${section.image}`
  if (imageErrors.value.has(errorKey)) return
  imageErrors.value.set(errorKey, true)
  
  // Try fallback image
  if (section.fallback) {
    const fallbackUrl = getImageUrl(section.fallback)
    // Update the src using the v-img component's internal structure
    const imgElement = event.target.closest('.v-img')?.querySelector('img')
    if (imgElement) {
      imgElement.src = fallbackUrl
    } else if (event.target.tagName === 'IMG') {
      event.target.src = fallbackUrl
    }
  } else {
    // Ultimate fallback - use a placeholder gradient
    const container = event.target.closest('.section-image-container')
    if (container) {
      container.style.background = 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)'
    }
  }
}

const handleHeroImageError = (event) => {
  // Fallback for hero background
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
</script>

<style scoped>
.about-grid-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #f9fafb, #ffffff);
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
  max-width: 64rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.5rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.grid-section {
  position: relative;
  background: linear-gradient(to bottom, #ffffff, #f9fafb);
}

.section-card {
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out both;
}

.section-card-1 {
  animation-delay: 200ms;
}

.section-card-2 {
  animation-delay: 300ms;
}

.section-card-3 {
  animation-delay: 400ms;
}

.section-card-4 {
  animation-delay: 500ms;
}

.section-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.section-card:hover .section-image-container :deep(.v-img) {
  transform: scale(1.1);
}

.section-image-container :deep(.v-img) {
  transition: transform 0.5s ease;
}

.section-image-container {
  position: relative;
  overflow: hidden;
}

.section-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3));
  z-index: 2;
}

.section-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px;
  z-index: 3;
}

@media (max-width: 960px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
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

