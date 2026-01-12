<template>
  <section class="services-section" style="position: relative;">
    <!-- Loading overlay -->
    <v-overlay :model-value="isLoadingHome" contained class="align-center justify-center" style="z-index: 10;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
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

    <v-container>
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h1 class="text-h3 text-md-h4 font-weight-bold text-black mb-4 fade-in-up" style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
          {{ servicesTitle }}
        </h1>
        <p class="text-h6 text-grey-darken-1 max-width-3xl mx-auto fade-in-up-delay">
          {{ servicesSubtitle }}
        </p>
      </div>

      <!-- Services Grid -->
      <v-row justify="center">
        <v-col
          v-for="(service, index) in services"
          :key="index"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            :class="`service-card service-card-${index + 1}`"
            height="384"
            @click="$router.push(service.route)"
          >
            <div
              class="service-background"
              :style="{ backgroundImage: `url(${service.image})` }"
            ></div>
            <div class="service-overlay"></div>
            <div class="service-content">
              <v-icon
                :icon="service.icon"
                size="48"
                color="white"
                class="mb-4"
              ></v-icon>
              <h3 class="text-h5 font-weight-bold text-white mb-4 text-center">
                {{ service.title }}
              </h3>
              <p class="text-white mb-6 text-body-2 text-center">
                {{ service.description }}
              </p>
              <v-btn
                color="rgba(255, 255, 255, 0.2)"
                variant="outlined"
                class="text-white"
                rounded
                @click.stop="$router.push(service.route)"
              >
                Learn More
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCmsStore } from '@/stores/cmsStore'

const cmsStore = useCmsStore()

// Loading state for CMS data
const isLoadingHome = computed(() => cmsStore.isPageLoading('home'))

const floatingElements = ref([
  { style: { top: '40px', left: '40px', width: '64px', height: '64px', animationDelay: '0s' } },
  { style: { top: '80px', right: '80px', width: '48px', height: '48px', animationDelay: '1s' } },
  { style: { bottom: '80px', left: '80px', width: '56px', height: '56px', animationDelay: '2s' } },
  { style: { bottom: '40px', right: '40px', width: '40px', height: '40px', animationDelay: '0.5s' } },
  { style: { top: '50%', left: '33%', width: '32px', height: '32px', animationDelay: '1.5s' } },
  { style: { top: '25%', left: '25%', width: '24px', height: '24px', animationDelay: '0.8s' } },
  { style: { top: '75%', right: '33%', width: '36px', height: '36px', animationDelay: '2.2s' } },
  { style: { bottom: '33%', left: '50%', width: '20px', height: '20px', animationDelay: '1.8s' } },
  { style: { top: '33%', right: '40px', width: '28px', height: '28px', animationDelay: '0.3s' } },
  { style: { bottom: '25%', left: '16%', width: '44px', height: '44px', animationDelay: '2.8s' } },
  { style: { top: '50%', right: '25%', width: '16px', height: '16px', animationDelay: '1.1s' } },
  { style: { bottom: '50%', left: '20%', width: '52px', height: '52px', animationDelay: '0.9s' } }
])

const servicesTitle = ref('Our Services')
const servicesSubtitle = ref('Discover the meaningful ways you can participate in our faith community and grow in your relationship with Christ.')

const services = ref([
  {
    title: 'Water Baptism',
    description: 'Take the next step in your faith journey through water baptism, a beautiful public declaration of your commitment to follow Jesus Christ and join our faith community.',
    icon: 'mdi-water',
    image: '/img/waterbap.jpg',
    route: '/services/water-baptism'
  },
  {
    title: 'Burial Service',
    description: 'Compassionate burial services providing comfort and hope during times of loss, honoring life and celebrating eternal life through Jesus Christ.',
    icon: 'mdi-cross',
    image: '/img/burial.jpg',
    route: '/services/burial-service'
  },
  {
    title: 'Child Dedication',
    description: 'Present your precious child to God in a meaningful ceremony where we commit to partner with you in raising them in faith and guiding them toward Christ.',
    icon: 'mdi-baby-face-outline',
    image: '/img/childdedication.jpg',
    route: '/services/child-dedication'
  }
])

// Fetch home data from CMS using shared store
const fetchHomeData = async () => {
  try {
    const cmsData = await cmsStore.fetchPageData('home')
    if (cmsData) {
      const { page, images } = cmsData
      const content = page?.content || {}
      
      // Update services section data
      servicesTitle.value = content.servicesTitle || servicesTitle.value
      servicesSubtitle.value = content.servicesSubtitle || servicesSubtitle.value
      
      // Update services array
      if (content.services && Array.isArray(content.services) && content.services.length > 0) {
        content.services.forEach((service, index) => {
          if (services.value[index]) {
            services.value[index].title = service.title || services.value[index].title
            services.value[index].description = service.description || services.value[index].description
            services.value[index].icon = service.icon || services.value[index].icon
            // Handle service images from CMS
            const imageKey = `services[${index}].image`
            if (images?.[imageKey]) {
              services.value[index].image = images[imageKey]
            }
          }
        })
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching home data from CMS:', error)
    }
  }
}

onMounted(async () => {
  await fetchHomeData()
})
</script>

<style scoped>
.services-section {
  position: relative;
  padding: 80px 0;
  background: white;
  overflow: hidden;
}

.floating-elements {
  position: absolute;
  inset: 0;
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

.service-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
}

.service-card-1 {
  animation-delay: 200ms;
}

.service-card-2 {
  animation-delay: 300ms;
}

.service-card-3 {
  animation-delay: 400ms;
}

.service-card-4 {
  animation-delay: 500ms;
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.service-card:hover .service-background {
  transform: scale(1.1);
}

.service-card:hover .service-overlay {
  background: linear-gradient(to top, rgba(55, 65, 81, 0.85), rgba(75, 85, 99, 0.3), transparent);
}

.service-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 1;
  transition: transform 0.5s ease;
}

.service-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(55, 65, 81, 0.7), rgba(75, 85, 99, 0.2), transparent);
  z-index: 2;
  transition: background 0.3s ease;
}

.service-content {
  transition: transform 0.3s ease;
}

.service-card:hover .service-content {
  transform: translateY(-4px);
}

.service-content {
  position: relative;
  z-index: 3;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px;
  color: white;
}

.service-content :deep(.v-btn) {
  transition: all 0.3s ease;
}

.service-content :deep(.v-btn:hover) {
  transform: scale(1.05);
  background-color: rgba(255, 255, 255, 0.3) !important;
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

@media (max-width: 960px) {
  .services-section {
    padding: 48px 0;
  }

  .services-section :deep(.text-h3) {
    font-size: 1.75rem !important;
  }

  .services-section :deep(.text-h6) {
    font-size: 1rem !important;
  }

  .service-card {
    height: 320px !important;
    margin-bottom: 16px;
  }

  .service-content {
    padding: 20px;
  }

  .service-content :deep(.v-icon) {
    font-size: 40px !important;
  }

  .service-content :deep(.text-h5) {
    font-size: 1.1rem !important;
  }

  .service-content :deep(.text-body-2) {
    font-size: 0.9rem !important;
    line-height: 1.5;
  }

  .floating-element {
    display: none;
  }
}

@media (max-width: 640px) {
  .services-section {
    padding: 24px 0;
  }

  .services-section :deep(.text-h3) {
    font-size: 1.4rem !important;
  }

  .services-section :deep(.text-h6) {
    font-size: 0.95rem !important;
  }

  .service-card {
    height: 260px !important;
    margin-bottom: 12px;
  }

  .service-content {
    padding: 14px;
  }

  .service-content :deep(.v-icon) {
    font-size: 32px !important;
  }

  .service-content :deep(.text-h5) {
    font-size: 1.1rem !important;
  }

  .service-content :deep(.text-body-2) {
    font-size: 0.85rem !important;
    line-height: 1.5;
  }

  .service-content :deep(.v-btn) {
    padding: 8px 16px;
    font-size: 0.85rem;
    min-height: 36px;
  }
}
</style>

