<template>
  <div class="accept-jesus-page">
    <!-- Floating Elements -->
    <div class="floating-elements">
      <div
        v-for="(element, index) in floatingElements"
        :key="index"
        class="floating-element"
        :style="element.style"
      ></div>
    </div>

    <!-- Main Content Section -->
    <section class="main-content py-16">
      <v-container>
        <v-row align="center">
          <!-- Left Side - Image Gallery -->
          <v-col cols="12" lg="6" class="order-2 order-lg-1">
            <div class="image-gallery">
              <v-img
                :src="images[currentImage]"
                :alt="`Bible ${currentImage + 1}`"
                height="600"
                cover
                class="rounded-lg"
              ></v-img>
              <!-- Image Navigation Dots -->
              <div v-if="images.length > 1" class="image-dots mt-4 d-flex justify-center gap-3">
                <v-btn
                  v-for="(img, index) in images"
                  :key="index"
                  :color="index === currentImage ? '#14b8a6' : 'grey'"
                  size="x-small"
                  :variant="index === currentImage ? 'flat' : 'outlined'"
                  @click="currentImage = index"
                  class="rounded-circle"
                  :style="{ width: '16px', height: '16px', minWidth: '16px' }"
                ></v-btn>
              </div>
            </div>
          </v-col>

          <!-- Right Side - Content -->
          <v-col cols="12" lg="6" class="order-1 order-lg-2">
            <div class="content-wrapper">
              <h1 class="text-h3 text-md-h4 text-lg-h2 font-weight-bold text-grey-darken-3 mb-4 fade-in-up" style="font-family: 'Georgia', serif; font-style: italic;">
                Accept Jesus Christ
              </h1>
              <p class="text-h6 text-grey-darken-1 mb-8 fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
                Begin your journey of faith with Jesus Christ
              </p>

              <div class="space-y-6 mb-8">
                <v-card 
                  v-for="(section, index) in contentSections" 
                  :key="index"
                  variant="flat" 
                  color="teal-lighten-5" 
                  class="pa-4 accept-card"
                  :class="`accept-card-${index + 1}`"
                >
                  <h3 class="text-h6 font-weight-bold mb-2" style="font-family: 'Georgia', serif; font-style: italic;">{{ section.title }}</h3>
                  <ol v-if="hasNumberedList(section.text)" class="text-body-2 pl-4" style="font-family: 'Georgia', serif; font-style: italic;">
                    <li v-for="(line, lineIndex) in parseTextWithList(section.text)" :key="lineIndex">
                      {{ line.replace(/^\d+\.\s*/, '') }}
                    </li>
                  </ol>
                  <p v-else class="text-body-2" style="font-family: 'Georgia', serif; font-style: italic;">
                    {{ section.text }}
                  </p>
                </v-card>
              </div>

              <v-btn
                :color="nextButton.color"
                size="large"
                rounded
                class="text-white"
                @click="$router.push(nextButton.route)"
              >
                {{ nextButton.text }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Worship Services Section -->
    <section class="worship-services-section py-16">
      <v-container>
        <h2 class="text-h3 text-md-h4 text-lg-h2 font-weight-bold text-center text-grey-darken-3 mb-12" style="font-family: 'Georgia', serif; font-style: italic;">
          Join Our Worship Services
        </h2>
        <v-row>
          <!-- Sunday Services Card -->
          <v-col cols="12" md="4">
            <v-card class="service-card" elevation="2">
              <v-card-title class="service-card-title">
                Sunday Services
              </v-card-title>
              <v-card-text class="service-card-content">
                <div class="service-item">
                  <span class="service-time">8:00 AM</span>
                  <span class="service-dash"> - </span>
                  <span class="service-description">Sunday School</span>
                </div>
                <div class="service-item">
                  <span class="service-time">9:30 AM</span>
                  <span class="service-dash"> - </span>
                  <span class="service-description">Morning Worship</span>
                </div>
                <div class="service-item">
                  <span class="service-time">6:00 PM</span>
                  <span class="service-dash"> - </span>
                  <span class="service-description">Evening Worship</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Wednesday Prayer Card -->
          <v-col cols="12" md="4">
            <v-card class="service-card" elevation="2">
              <v-card-title class="service-card-title">
                Wednesday Prayer
              </v-card-title>
              <v-card-text class="service-card-content">
                <div class="service-item">
                  <span class="service-time">6:00 PM</span>
                  <span class="service-dash"> - </span>
                  <span class="service-description">Prayer Meeting</span>
                </div>
                <div class="service-item">
                  <span class="service-time">7:00 PM</span>
                  <span class="service-dash"> - </span>
                  <span class="service-description">Bible Study</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Special Events Card -->
          <v-col cols="12" md="4">
            <v-card class="service-card" elevation="2">
              <v-card-title class="service-card-title">
                Special Events
              </v-card-title>
              <v-card-text class="service-card-content">
                <div class="service-item">
                  <span class="service-time">4:00 PM</span>
                  <span class="service-dash"> - </span>
                  <span class="service-description">Street Preaching</span>
                </div>
                <div class="service-item">
                  <span class="service-time">Various</span>
                  <span class="service-dash"> - </span>
                  <span class="service-description">Ministry Activities</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from '@/api/axios'

// Default images fallback
const defaultImages = [
  "/img/bible 1.jpg",
  "/img/bible.jpg",
  "/img/bible 3.jpg",
  "/img/bile.jpg"
]

const images = ref([...defaultImages])
const currentImage = ref(0)

// Default content sections
const contentSections = ref([
  {
    title: 'What Does It Mean?',
    text: 'Accepting Jesus Christ means acknowledging that you are a sinner in need of a Savior, believing that Jesus died for your sins and rose again, and committing to follow Him as Lord of your life.'
  },
  {
    title: 'How to Accept Jesus',
    text: '1. Recognize your need for salvation\n2. Believe in Jesus Christ as your Savior\n3. Repent of your sins\n4. Confess Jesus as Lord\n5. Commit to following Him'
  }
])

// Default button
const nextButton = ref({
  text: 'Next: Water Baptism',
  color: '#14b8a6',
  route: '/services/water-baptism'
})

const floatingElements = ref([
  { style: { top: '80px', left: '80px', width: '48px', height: '48px', animationDelay: '0s' } },
  { style: { top: '33%', right: '64px', width: '32px', height: '32px', animationDelay: '1.5s' } },
  { style: { bottom: '33%', left: '64px', width: '40px', height: '40px', animationDelay: '2s' } },
  { style: { bottom: '80px', right: '80px', width: '24px', height: '24px', animationDelay: '0.8s' } }
])

let imageInterval = null

// Fetch AcceptJesus data from CMS
const fetchAcceptJesusData = async () => {
  try {
    const response = await axios.get('/cms/acceptjesus/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Content keys:', Object.keys(content))
      console.log('CMS Response - Images keys:', cmsImages ? Object.keys(cmsImages) : 'No images object')
      console.log('CMS Response - Images object:', cmsImages)
      
      // Update images from CMS
      // Images are stored as BLOB in database and returned as base64 in images object
      // Field names are like: images[0].image, images[1].image, etc.
      const imageUrls = []
      
      if (cmsImages && typeof cmsImages === 'object') {
        // Look for images[0].image, images[1].image, etc. in the extracted images object
        // These come from the BLOB storage converted to base64
        let index = 0
        let foundImages = 0
        
        // Check up to 20 images (reasonable limit)
        while (index < 20) {
          const fieldName = `images[${index}].image`
          const base64Image = cmsImages[fieldName]
          
          if (base64Image) {
            if (typeof base64Image === 'string' && base64Image.startsWith('data:image/')) {
              imageUrls.push(base64Image)
              foundImages++
              console.log(`Found image ${index + 1} at field: ${fieldName}`)
            } else {
              console.log(`Image ${index + 1} at ${fieldName} is not a valid base64 image string`)
            }
          } else {
            // No more images found, break
            break
          }
          index++
        }
        
        console.log(`Found ${foundImages} images in cmsImages object (BLOB converted to base64)`)
      }
      
      // Fallback: Check if images are already merged into content.images array
      // This shouldn't happen with /full endpoint, but handle it just in case
      if (imageUrls.length === 0 && content.images && Array.isArray(content.images) && content.images.length > 0) {
        console.log('Fallback: Checking content.images array')
        content.images.forEach((img, index) => {
          // Check if image is already base64 string
          if (typeof img === 'string' && img.startsWith('data:image/')) {
            imageUrls.push(img)
          }
          // Check if image is object with image property (merged by composable)
          else if (img && typeof img === 'object' && img.image && typeof img.image === 'string' && img.image.startsWith('data:image/')) {
            imageUrls.push(img.image)
          }
        })
        console.log(`Found ${imageUrls.length} images in content.images array (fallback)`)
      }
      
      // Update images if we found any
      if (imageUrls.length > 0) {
        images.value = imageUrls
        console.log('✅ Updated images array with', imageUrls.length, 'images from CMS (BLOB)')
      } else {
        console.log('⚠️ No images found in CMS, using default images')
        // Keep default images if no CMS images found
      }
      
      // Update content sections from CMS
      if (content.contentSections && Array.isArray(content.contentSections) && content.contentSections.length > 0) {
        contentSections.value = content.contentSections.map(section => ({
          title: section.title || '',
          text: section.text || ''
        }))
      }
      
      // Update button from CMS
      if (content.buttons && Array.isArray(content.buttons) && content.buttons.length > 0) {
        const firstButton = content.buttons[0]
        nextButton.value = {
          text: firstButton.text || nextButton.value.text,
          color: firstButton.color || nextButton.value.color,
          route: firstButton.route || '/services/water-baptism' // Default route if not provided
        }
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching AcceptJesus data from CMS:', error)
    }
    // Use default values if CMS fetch fails
  }
}

// Parse text with numbered list items
const parseTextWithList = (text) => {
  if (!text) return []
  const lines = text.split('\n').filter(line => line.trim())
  return lines.map(line => line.trim())
}

// Check if text contains numbered list format
const hasNumberedList = (text) => {
  if (!text) return false
  return text.split('\n').some(line => /^\d+\./.test(line.trim()))
}

onMounted(async () => {
  // Fetch CMS data first
  await fetchAcceptJesusData()
  
  // Ensure we have at least default images if CMS didn't provide any
  if (images.value.length === 0) {
    images.value = [...defaultImages]
  }
  
  // Reset current image if it's out of bounds
  if (currentImage.value >= images.value.length) {
    currentImage.value = 0
  }
  
  // Start image rotation if we have multiple images
  if (images.value.length > 1) {
    imageInterval = setInterval(() => {
      currentImage.value = (currentImage.value + 1) % images.value.length
    }, 4000)
  }
})

onUnmounted(() => {
  if (imageInterval) {
    clearInterval(imageInterval)
  }
})
</script>

<style scoped>
.accept-jesus-page {
  min-height: 100vh;
  background: white;
  margin-top: 64px;
  position: relative;
  overflow: hidden;
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  background: rgba(20, 184, 166, 0.1);
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

.main-content {
  position: relative;
  z-index: 2;
}

.image-gallery {
  position: relative;
}

.content-wrapper {
  padding: 24px;
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.accept-card {
  animation: fadeInUp 0.6s ease-out both;
  transition: all 0.3s ease;
}

.accept-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.accept-card-1 {
  animation-delay: 200ms;
}

.accept-card-2 {
  animation-delay: 300ms;
}

.image-gallery :deep(.v-img) {
  transition: transform 0.5s ease;
}

.image-gallery:hover :deep(.v-img) {
  transform: scale(1.02);
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

.worship-services-section {
  position: relative;
  z-index: 2;
  background: white;
}

.service-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.3s ease;
  height: 100%;
  background: white !important;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
}

.service-card-title {
  color: #14b8a6 !important;
  font-weight: bold !important;
  font-size: 1.25rem !important;
  padding: 20px 20px 12px 20px !important;
}

.service-card-content {
  padding: 0 20px 20px 20px !important;
}

.service-item {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
  line-height: 1.6;
}

.service-item:last-child {
  margin-bottom: 0;
}

.service-time {
  font-weight: bold;
  color: #212121;
  font-size: 0.95rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.service-dash {
  margin: 0 4px;
  color: #212121;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.service-description {
  color: #212121;
  font-size: 0.95rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}
</style>

