<template>
  <section class="department-categories-section py-16 bg-white" style="position: relative;">
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
        <h1 
          class="text-h3 text-md-h4 font-weight-bold text-black mb-4 fade-in-up"
          style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"
        >
          {{ cmsData.sectionTitle || 'Our Departments' }}
        </h1>
        <p class="text-h6 text-grey-darken-1 max-width-3xl mx-auto fade-in-up-delay">
          {{ cmsData.sectionSubtitle || 'Discover our various ministries designed to help you grow in faith and serve our community.' }}
        </p>
      </div>

      <!-- Department Categories Grid -->
      <v-row justify="center">
        <v-col cols="12" md="6" lg="4">
          <v-card
            class="department-card department-card-1"
            height="384"
            @click="navigateToCategory('adult')"
          >
            <div
              class="department-background"
              :style="{ backgroundImage: adultBgImage || 'url(/img/events.jpg)' }"
            ></div>
            <div class="department-overlay"></div>
            <div class="department-content">
              <v-icon icon="mdi-account-group" size="48" color="white" class="mb-4"></v-icon>
              <h3 class="text-h5 font-weight-bold text-white mb-4 text-center">
                {{ cmsData.adultTitle || 'Adult Ministry' }}
              </h3>
              <p class="text-white mb-6 text-body-2 text-center">
                {{ cmsData.adultDescription || 'Join our adult fellowship for spiritual growth and community building.' }}
              </p>
              <v-btn color="rgba(255,255,255,0.2)" variant="outlined" class="text-white" rounded>
                {{ cmsData.adultLinkText || 'Learn More' }}
              </v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="4">
          <v-card
            class="department-card department-card-2"
            height="384"
            @click="navigateToCategory('ladies')"
          >
            <div
              class="department-background"
              :style="{ backgroundImage: ladiesBgImage || 'url(/img/beliefs.jpg)' }"
            ></div>
            <div class="department-overlay"></div>
            <div class="department-content">
              <v-icon icon="mdi-account-heart" size="48" color="white" class="mb-4"></v-icon>
              <h3 class="text-h5 font-weight-bold text-white mb-4 text-center">
                {{ cmsData.ladiesTitle || 'Ladies Ministry' }}
              </h3>
              <p class="text-white mb-6 text-body-2 text-center">
                {{ cmsData.ladiesDescription || 'Empowering women through faith, fellowship, and service.' }}
              </p>
              <v-btn color="rgba(255,255,255,0.2)" variant="outlined" class="text-white" rounded>
                {{ cmsData.ladiesLinkText || 'Learn More' }}
              </v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="4">
          <v-card
            class="department-card department-card-3"
            height="384"
            @click="navigateToCategory('youth')"
          >
            <div
              class="department-background"
              :style="{ backgroundImage: youthBgImage || 'url(/img/CHILDREN%20MINISTRY/480913749_2154533405062033_2452182531715777334_n.jpg)' }"
            ></div>
            <div class="department-overlay"></div>
            <div class="department-content">
              <v-icon icon="mdi-account-star" size="48" color="white" class="mb-4"></v-icon>
              <h3 class="text-h5 font-weight-bold text-white mb-4 text-center">
                {{ cmsData.youthTitle || 'Youth Ministry' }}
              </h3>
              <p class="text-white mb-6 text-body-2 text-center">
                {{ cmsData.youthDescription || 'Building the next generation of leaders through Christ-centered activities.' }}
              </p>
              <v-btn color="rgba(255,255,255,0.2)" variant="outlined" class="text-white" rounded>
                {{ cmsData.youthLinkText || 'Learn More' }}
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
import { useRouter } from 'vue-router'
import { useCms } from '@/composables/useCms'

const router = useRouter()

// Use CMS composable for proper caching and cross-tab sync
const { loadPageData } = useCms('departmentcategories')

// CMS Data
const cmsData = ref({
  sectionTitle: 'Our Departments',
  sectionSubtitle: 'Discover our various ministries designed to help you grow in faith and serve our community.',
  adultTitle: 'Adult Ministry',
  adultDescription: 'Join our adult fellowship for spiritual growth and community building.',
  adultLinkText: 'Learn More',
  ladiesTitle: 'Ladies Ministry',
  ladiesDescription: 'Empowering women through faith, fellowship, and service.',
  ladiesLinkText: 'Learn More',
  youthTitle: 'Youth Ministry',
  youthDescription: 'Building the next generation of leaders through Christ-centered activities.',
  youthLinkText: 'Learn More',
  buttonColor: '#14b8a6',
  adultBackgroundImage: null,
  ladiesBackgroundImage: null,
  youthBackgroundImage: null
})

// Floating elements
const floatingElements = ref([
  { style: { top: '40px', left: '40px', width: '64px', height: '64px', animationDelay: '0s' } },
  { style: { top: '80px', right: '80px', width: '48px', height: '48px', animationDelay: '1s' } },
  { style: { bottom: '80px', left: '80px', width: '56px', height: '56px', animationDelay: '2s' } },
  { style: { bottom: '40px', right: '40px', width: '40px', height: '40px', animationDelay: '0.5s' } },
  { style: { top: '50%', left: '33%', width: '32px', height: '32px', animationDelay: '1.5s' } },
  { style: { top: '25%', right: '25%', width: '24px', height: '24px', animationDelay: '0.8s' } },
  { style: { bottom: '33%', left: '50%', width: '36px', height: '36px', animationDelay: '2.2s' } },
  { style: { top: '75%', right: '33%', width: '20px', height: '20px', animationDelay: '1.8s' } },
  { style: { top: '33%', right: '40px', width: '28px', height: '28px', animationDelay: '0.3s' } },
  { style: { bottom: '25%', left: '16%', width: '44px', height: '44px', animationDelay: '2.8s' } },
  { style: { top: '50%', right: '25%', width: '16px', height: '16px', animationDelay: '1.1s' } },
  { style: { bottom: '50%', left: '20%', width: '52px', height: '52px', animationDelay: '0.9s' } }
])

// Computed background images
const adultBgImage = computed(() => {
  if (cmsData.value.adultBackgroundImage) {
    return `url(${cmsData.value.adultBackgroundImage})`
  }
  return null
})

const ladiesBgImage = computed(() => {
  if (cmsData.value.ladiesBackgroundImage) {
    return `url(${cmsData.value.ladiesBackgroundImage})`
  }
  return null
})

const youthBgImage = computed(() => {
  if (cmsData.value.youthBackgroundImage) {
    return `url(${cmsData.value.youthBackgroundImage})`
  }
  return null
})

// Fetch CMS data using useCms composable for proper caching
const fetchCmsData = async () => {
  try {
    const cmsContent = await loadPageData()
    
    if (cmsContent) {
      console.log('CMS Data loaded for Department Categories:', cmsContent)
      
      // Update cmsData with loaded content
      if (cmsContent.sectionTitle) cmsData.value.sectionTitle = cmsContent.sectionTitle
      if (cmsContent.sectionSubtitle) cmsData.value.sectionSubtitle = cmsContent.sectionSubtitle
      if (cmsContent.adultTitle) cmsData.value.adultTitle = cmsContent.adultTitle
      if (cmsContent.adultDescription) cmsData.value.adultDescription = cmsContent.adultDescription
      if (cmsContent.adultLinkText) cmsData.value.adultLinkText = cmsContent.adultLinkText
      if (cmsContent.ladiesTitle) cmsData.value.ladiesTitle = cmsContent.ladiesTitle
      if (cmsContent.ladiesDescription) cmsData.value.ladiesDescription = cmsContent.ladiesDescription
      if (cmsContent.ladiesLinkText) cmsData.value.ladiesLinkText = cmsContent.ladiesLinkText
      if (cmsContent.youthTitle) cmsData.value.youthTitle = cmsContent.youthTitle
      if (cmsContent.youthDescription) cmsData.value.youthDescription = cmsContent.youthDescription
      if (cmsContent.youthLinkText) cmsData.value.youthLinkText = cmsContent.youthLinkText
      if (cmsContent.buttonColor) cmsData.value.buttonColor = cmsContent.buttonColor
      if (cmsContent.adultBackgroundImage) cmsData.value.adultBackgroundImage = cmsContent.adultBackgroundImage
      if (cmsContent.ladiesBackgroundImage) cmsData.value.ladiesBackgroundImage = cmsContent.ladiesBackgroundImage
      if (cmsContent.youthBackgroundImage) cmsData.value.youthBackgroundImage = cmsContent.youthBackgroundImage
      
      console.log('✅ Department Categories CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Department Categories, using defaults')
    }
  } catch (error) {
    console.error('Error fetching department categories CMS data:', error)
  }
}

// Navigate to category
const navigateToCategory = (category) => {
  router.push({
    path: '/ministries',
    query: { category }
  })
}

onMounted(async () => {
  await fetchCmsData()
})
</script>

<style scoped>
.department-categories-section {
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
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.department-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
}

.department-card-1 { animation-delay: 200ms; }
.department-card-2 { animation-delay: 300ms; }
.department-card-3 { animation-delay: 400ms; }

.department-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.department-card:hover .department-background {
  transform: scale(1.1);
}

.department-card:hover .department-overlay {
  background: linear-gradient(to top, rgba(55, 65, 81, 0.85), rgba(75, 85, 99, 0.3), transparent);
}

.department-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 1;
  transition: transform 0.5s ease;
}

.department-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(55, 65, 81, 0.7), rgba(75, 85, 99, 0.2), transparent);
  z-index: 2;
  transition: background 0.3s ease;
}

.department-content {
  position: relative;
  z-index: 3;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px;
  color: white;
}

.fade-in-up { animation: fadeInUp 0.8s ease-out; }
.fade-in-up-delay { animation: fadeInUp 0.8s ease-out 0.2s both; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 960px) {
  .department-categories-section { padding: 48px 0; }
  .department-card { height: 320px !important; }
  .department-content { padding: 24px; }
  .floating-element { display: none; }
}

@media (max-width: 640px) {
  .department-categories-section { padding: 32px 0; }
  .department-card { height: 280px !important; }
  .department-content { padding: 16px; }
}
</style>
