<template>
  <main class="services-main">
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${servicesData.heroImage || '/img/servi.jpg'})` }"
      ></div>

      <!-- Floating elements -->
      <div class="floating-bounce floating-1"></div>
      <div class="floating-bounce floating-2"></div>
      <div class="floating-bounce floating-3"></div>
      <div class="floating-bounce floating-4"></div>

      <div class="hero-content">
        <h1 class="hero-title fade-in-up">
          {{ servicesData.heroTitle || 'Church Services' }}
        </h1>
        <p class="hero-subtitle fade-in-up-delay">
          {{ servicesData.heroSubtitle || 'Our church offers a variety of uplifting services designed to nurture your faith and strengthen your community. From inspiring worship sessions to meaningful teaching, every service is an opportunity to connect with God and fellow believers.' }}
        </p>
      </div>
    </section>

    <!-- Services Detail Section -->
    <section id="location" class="services-detail-section">
      <!-- Floating elements -->
      <div class="floating-elements">
        <div class="floating-element float-1"></div>
        <div class="floating-element float-2"></div>
        <div class="floating-element float-3"></div>
        <div class="floating-element float-4"></div>
        <div class="floating-element float-5"></div>
        <div class="floating-element float-6"></div>
        <div class="floating-element float-7 clip-path-star"></div>
        <div class="floating-element float-8 clip-path-triangle"></div>
        <div class="floating-element float-9"></div>
        <div class="floating-element float-10"></div>
        <div class="floating-element float-11"></div>
        <div class="floating-element float-12 clip-path-diamond"></div>
      </div>
      
      <v-container>
        <div class="services-detail-container">
          <div
            v-for="(service, index) in servicesList"
            :key="index"
            :class="`service-item ${index % 2 === 1 ? 'service-item-reverse' : ''}`"
          >
            <!-- Image on Left (even indices) -->
            <div v-if="index % 2 === 0" class="service-image-wrapper">
              <img
                :src="service.image && service.image.startsWith('data:') ? service.image : (service.image || '/img/default.jpg')"
                :alt="service.title"
                class="service-image"
                @error="handleImageError"
              />
              <div class="service-icon-overlay">
                <v-icon :icon="service.icon || 'mdi-circle'" size="48" color="white"></v-icon>
              </div>
            </div>
            
            <!-- Text Content -->
            <div class="service-text">
              <h2 class="service-title">{{ service.title }}</h2>
              <p class="service-description">{{ service.description }}</p>
            </div>
            
            <!-- Image on Right (odd indices) -->
            <div v-if="index % 2 === 1" class="service-image-wrapper">
              <img
                :src="service.image && service.image.startsWith('data:') ? service.image : (service.image || '/img/default.jpg')"
                :alt="service.title"
                class="service-image"
                @error="handleImageError"
              />
              <div class="service-icon-overlay">
                <v-icon :icon="service.icon || 'mdi-circle'" size="48" color="white"></v-icon>
              </div>
            </div>
          </div>
        </div>
      </v-container>
    </section>

    <!-- Services Cards Section -->
    <section class="services-cards-section">
      <!-- Floating elements -->
      <div class="floating-elements">
        <div class="floating-element float-1"></div>
        <div class="floating-element float-2"></div>
        <div class="floating-element float-3"></div>
        <div class="floating-element float-4"></div>
        <div class="floating-element float-5"></div>
        <div class="floating-element float-6"></div>
        <div class="floating-element float-7 clip-path-star"></div>
        <div class="floating-element float-8 clip-path-triangle"></div>
        <div class="floating-element float-9"></div>
        <div class="floating-element float-10"></div>
        <div class="floating-element float-11"></div>
        <div class="floating-element float-12 clip-path-diamond"></div>
      </div>
      
      <v-container>
        <div class="services-cards-grid">
          <v-card
            v-for="(service, index) in servicesList"
            :key="index"
            :class="`service-card-item service-card-${index + 1}`"
            @mouseenter="handleHover"
            @mouseleave="handleLeave"
          >
            <div class="service-card-content">
              <div class="service-card-icon-wrapper">
                <v-icon :icon="service.icon || 'mdi-circle'" size="32" color="teal-darken-1"></v-icon>
              </div>
              <div class="service-card-title">
                {{ service.title }}
              </div>
              <div class="service-card-description">
                <p>
                  {{ service.shortDescription || service.description }}
                </p>
              </div>
            </div>
          </v-card>
        </div>
      </v-container>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/api/axios'

const handleImageError = (event) => {
  event.target.src = '/img/default_burial.jpg'
}

const handleHover = (event) => {
  event.currentTarget.style.transform = 'scale(1.05) translateY(-5px)'
}

const handleLeave = (event) => {
  event.currentTarget.style.transform = 'scale(1) translateY(0)'
}

const defaultServices = [
  {
    title: "Marriage",
    description: "Celebrate your love and commitment in a sacred ceremony that honors God's design for marriage. Join us as we witness your covenant before God and community.",
    shortDescription: "Celebrate your love and commitment in a sacred ceremony that honors God's design for marriage. Join us as we witness your covenant before God and community.",
    image: "/img/marriage.jpg",
    icon: "mdi-ring"
  },
  {
    title: "Child Dedication",
    description: "Present your precious child to God in a meaningful ceremony where we commit to partner with you in raising them in faith and guiding them toward Christ.",
    shortDescription: "Present your precious child to God in a meaningful ceremony where we commit to partner with you in raising them in faith and guiding them toward Christ.",
    image: "/img/childdedication.jpg",
    icon: "mdi-baby-face-outline"
  },
  {
    title: "Water Baptism",
    description: "Experience the transformative power of God through our water baptism service. This sacred ceremony symbolizes a new beginning, cleansing from sin, and a public declaration of faith in Jesus Christ. Surrounded by family, friends, and our church community, participants receive prayers, blessings, and spiritual guidance as they take this important step in their faith journey. Join us in celebrating this joyous milestone and the commitment to a life devoted to God.",
    shortDescription: "Publicly declare your faith in Jesus Christ through water baptism, symbolizing a fresh start and spiritual renewal.",
    image: "/img/waterbap.jpg",
    icon: "mdi-water"
  },
  {
    title: "Burial Service",
    description: "During times of loss and grief, our burial services provide comfort and hope through sacred ceremonies that honor the life of the departed and celebrate the promise of eternal life through Jesus Christ. We offer compassionate support to families, meaningful tributes, and spiritual guidance during this difficult time. Our services reflect God's love and the hope of resurrection, bringing peace and comfort to those who mourn.",
    shortDescription: "Compassionate burial services providing comfort and hope during times of loss, honoring life and celebrating eternal life through Jesus Christ.",
    image: "/img/burial.jpg",
    icon: "mdi-cross"
  }
]

const servicesData = ref({
  heroTitle: 'Church Services',
  heroSubtitle: 'Our church offers a variety of uplifting services designed to nurture your faith and strengthen your community. From inspiring worship sessions to meaningful teaching, every service is an opportunity to connect with God and fellow believers.',
  heroImage: null
})

const servicesList = ref(defaultServices)

// Fetch services data from CMS
const fetchServicesData = async () => {
  try {
    const response = await axios.get('/cms/services/full')
    if (response.data.success && response.data.data) {
      const { page, images } = response.data.data
      const content = page?.content || {}
      
      // Update services data
      if (content.heroTitle) servicesData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) servicesData.value.heroSubtitle = content.heroSubtitle
      
      // Handle hero image
      if (images?.heroImage) {
        servicesData.value.heroImage = images.heroImage
      }
      
      // Handle services array
      if (content.services && Array.isArray(content.services) && content.services.length > 0) {
        servicesList.value = content.services.map((service, idx) => {
          // Check if service image exists in images object (using bracket notation)
          const imageKey = `services[${idx}].image`
          const serviceImage = images?.[imageKey] || service.image || ''
          return {
            title: service.title || '',
            description: service.description || '',
            shortDescription: service.shortDescription || service.description || '',
            image: serviceImage,
            icon: service.icon || 'mdi-circle'
          }
        })
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching services data from CMS:', error)
    }
  }
}

onMounted(async () => {
  await fetchServicesData()
})
</script>

<style scoped>
.services-main {
  width: 100%;
  flex: 1;
}

/* Hero Section */
.hero-section {
  position: relative;
  background: linear-gradient(to bottom right, #4b5563, #1f2937);
  color: white;
  padding: 80px 0;
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
  opacity: 0.3;
}

.hero-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
  z-index: 1;
}

.floating-bounce {
  position: absolute;
  border-radius: 50%;
  animation: bounce 3.5s ease-in-out infinite;
}

.floating-1 {
  top: 40px;
  left: 40px;
  width: 64px;
  height: 64px;
  background: rgba(191, 219, 254, 0.3);
  animation-delay: 0s;
  animation-duration: 3.5s;
}

.floating-2 {
  top: 80px;
  right: 80px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.25);
  animation-delay: 1s;
  animation-duration: 4s;
}

.floating-3 {
  bottom: 80px;
  left: 80px;
  width: 56px;
  height: 56px;
  background: rgba(219, 234, 254, 0.35);
  animation-delay: 2s;
  animation-duration: 3.8s;
}

.floating-4 {
  bottom: 40px;
  right: 40px;
  width: 40px;
  height: 40px;
  background: rgba(147, 197, 253, 0.3);
  animation-delay: 0.5s;
  animation-duration: 4.2s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.hero-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  padding: 0 16px;
  z-index: 10;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -0.025em;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: white;
  font-weight: 300;
  font-family: 'Georgia', serif;
  font-style: italic;
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

@media (min-width: 768px) {
  .hero-title {
    font-size: 5rem;
  }
  .hero-subtitle {
    font-size: 1.25rem;
  }
}

/* Services Detail Section */
.services-detail-section {
  position: relative;
  background: white;
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
  background: rgba(63, 211, 194, 0.62);
  border-radius: 50%;
  animation: float 3.5s ease-in-out infinite;
}

.float-1 { top: 40px; left: 40px; width: 64px; height: 64px; animation-delay: 0s; }
.float-2 { top: 80px; right: 80px; width: 48px; height: 48px; animation-delay: 1s; }
.float-3 { bottom: 80px; left: 80px; width: 56px; height: 56px; animation-delay: 2s; animation-name: floatRotate; }
.float-4 { bottom: 40px; right: 40px; width: 40px; height: 40px; animation-delay: 0.5s; }
.float-5 { top: 50%; left: 33%; width: 32px; height: 32px; animation-delay: 1.5s; animation-name: floatRotate; }
.float-6 { top: 25%; left: 25%; width: 24px; height: 24px; animation-delay: 0.8s; animation-name: floatRotate; }
.float-7 { top: 75%; right: 33%; width: 36px; height: 36px; animation-delay: 2.2s; }
.float-8 { bottom: 33%; left: 50%; width: 20px; height: 20px; animation-delay: 1.8s; }
.float-9 { top: 33%; right: 40px; width: 28px; height: 28px; animation-delay: 0.3s; animation-name: floatRotate12; }
.float-10 { bottom: 25%; left: 16%; width: 44px; height: 44px; animation-delay: 2.8s; }
.float-11 { top: 50%; right: 25%; width: 16px; height: 16px; animation-delay: 1.1s; animation-name: floatRotate; }
.float-12 { bottom: 50%; left: 20%; width: 52px; height: 52px; animation-delay: 0.9s; }

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes floatRotate {
  0%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  50% {
    transform: translateY(-20px) rotate(225deg);
  }
}

@keyframes floatRotate12 {
  0%, 100% {
    transform: translateY(0) rotate(12deg);
  }
  50% {
    transform: translateY(-20px) rotate(192deg);
  }
}

.clip-path-star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  border-radius: 0;
}

.clip-path-triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  border-radius: 0;
}

.clip-path-diamond {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  border-radius: 0;
}

.services-detail-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  gap: 64px;
  position: relative;
  z-index: 2;
}

.service-item {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  align-items: center;
}

@media (min-width: 768px) {
  .service-item {
    grid-template-columns: 1fr 1fr;
  }
  
  .service-item-reverse .service-image-wrapper {
    order: 2;
  }
  
  .service-item-reverse .service-text {
    order: 1;
  }
}

.service-image-wrapper {
  position: relative;
  width: 100%;
  height: 384px;
}

.service-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.5s;
}

.service-image:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.service-icon-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 2.25rem;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.service-text {
  padding: 0 16px;
}

.service-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 16px;
  color: #1f2937;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.service-description {
  color: #4b5563;
  font-size: 1.125rem;
  line-height: 1.75;
  font-family: 'Georgia', serif;
  font-style: italic;
}

@media (min-width: 768px) {
  .service-item {
    grid-template-columns: 1fr 1fr;
  }
  
  .service-item-reverse .service-image-wrapper {
    order: 2;
  }
  
  .service-item-reverse .service-text {
    order: 1;
  }
}

/* Services Cards Section */
.services-cards-section {
  position: relative;
  background: white;
  padding: 64px 0;
  overflow: hidden;
}

.services-cards-grid {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.service-card-item {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  text-align: center;
  cursor: pointer;
  transition: all 0.5s;
  animation: fadeInUp 0.6s ease-out both;
}

.service-card-1 {
  animation-delay: 400ms;
}

.service-card-2 {
  animation-delay: 500ms;
}

.service-card-3 {
  animation-delay: 600ms;
}

.service-card-4 {
  animation-delay: 700ms;
}

.service-card-item:hover {
  background: #f0fdfa;
  transform: scale(1.05) translateY(-5px);
}

.service-card-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.service-card-icon-wrapper {
  margin: 0 auto;
  background: #f3e8ff;
  padding: 12px;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transform: scale(1);
  transition: all 0.5s;
}

.service-card-item:hover .service-card-icon-wrapper {
  background: #ccfbf1;
  transform: scale(1.1);
}

.service-card-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
  color: #1f2937;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.service-card-description {
  padding: 24px;
  padding-top: 0;
}

.service-card-description p {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
  font-family: 'Georgia', serif;
  font-style: italic;
}

@media (min-width: 768px) {
  .services-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .services-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

