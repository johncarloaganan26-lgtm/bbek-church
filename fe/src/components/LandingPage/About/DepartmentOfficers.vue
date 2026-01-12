<template>
  <div class="department-officers-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${deptOfficersData.heroImage || getImageUrl('/img/churchdepartments.webp')})` }"
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
        <h1 class="hero-title fade-in-up">{{ deptOfficersData.heroTitle || 'Department Officers' }}</h1>
        <p class="hero-subtitle fade-in-up-delay">
          {{ deptOfficersData.heroSubtitle || 'Dedicated leaders serving and growing together in Christ.' }}
        </p>
      </div>
    </section>

    <!-- Department Officers Section -->
    <section class="py-20" :style="{ backgroundColor: deptOfficersData.backgroundColor || '#ffffff' }">
      <v-container>
        <div
          v-for="(dept, deptIndex) in departmentsData"
          :key="deptIndex"
          class="mb-16"
        >
          <h2 class="text-h4 font-weight-bold text-center text-teal mb-8" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ dept.name }}
          </h2>
          <v-row>
            <v-col
              v-for="(officer, index) in dept.officers"
              :key="index"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card class="text-center pa-6" elevation="2" hover style="border-left: 4px solid #14b8a6; background: linear-gradient(to bottom, rgba(15, 118, 110, 0.05), rgba(17, 94, 89, 0.1)); transition: all 0.3s ease;">
                <v-avatar size="160" class="mb-4">
                  <v-img
                    :src="officer.image && officer.image.startsWith('data:') ? officer.image : getImageUrl(officer.image)"
                    :alt="officer.name"
                    cover
                    @error="(event) => handleImageError(event, officer)"
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
                </v-avatar>
                <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2" style="font-family: 'Georgia', serif; font-style: italic;">
                  {{ officer.name }}
                </h3>
                <p class="text-body-2 text-teal font-weight-semibold" style="font-family: 'Georgia', serif; font-style: italic;">
                  {{ officer.role }}
                </p>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </section>

    <!-- Back Button -->
    <section class="py-12 text-center bg-grey-lighten-5">
      <v-btn
        :color="deptOfficersData.backButtonColor || '#14b8a6'"
        class="text-white"
        size="large"
        rounded
        @click="$router.push('/about')"
        style="font-family: 'Georgia', serif; font-style: italic;"
      >
        {{ deptOfficersData.backButtonText || 'Back to About' }}
      </v-btn>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/api/axios'

const getImageUrl = (imagePath) => {
  // Properly encode the URL, handling spaces and special characters
  const parts = imagePath.split('/')
  const filename = parts.pop()
  const encodedFilename = encodeURIComponent(filename)
  return parts.join('/') + '/' + encodedFilename
}

const imageErrors = ref(new Map())

const handleImageError = (event, officer) => {
  // Track errors to prevent infinite loops
  const errorKey = officer.image
  if (imageErrors.value.has(errorKey)) return
  imageErrors.value.set(errorKey, true)
  
  // Use a placeholder gradient
  const imgElement = event.target.closest('.v-avatar')?.querySelector('img')
  if (imgElement) {
    imgElement.style.background = 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)'
    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTRiOGE2Ii8+PC9zdmc+'
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

const defaultDepartments = [
  {
    name: "Adult Ladies Department",
    officers: [
      { name: "Sis. Danica Aldousari", role: "President/Coordinator", image: "/img/officers/adult_ladies_president.png" },
      { name: "Sis. Melody Bilog", role: "Vice President", image: "/img/officers/adult_ladies_vice_president.png" },
      { name: "Sis. Espie Apelado", role: "Secretary", image: "/img/officers/adult_ladies_secretary.png" },
      { name: "Sis. Nancy Belleza", role: "Treasurer", image: "/img/officers/adult_ladies_treasurer.png" },
      { name: "Ma'am Gina Sulapas", role: "Auditor", image: "/img/officers/adult_ladies_auditor.jpg" }
    ]
  },
  {
    name: "Adult Men Department",
    officers: [
      { name: "Bro. Danny Delos santos", role: "President", image: "/img/officers/adult_men_president.jpg" },
      { name: "Bro. Roland Santos", role: "Vice President", image: "/img/officers/adult_men_vice_president.jpg" },
      { name: "Bro. Robert Apelado", role: "Secretary", image: "/img/officers/adult_men_secretary.jpg" },
      { name: "Bro. Rowel Bucayan", role: "Treasurer", image: "/img/officers/adult_men_treasurer.png" }
    ]
  },
  {
    name: "Young People Department",
    officers: [
      { name: "Sis. Jessica Las", role: "President", image: "/img/officers/yp_president.jpg" },
      { name: "Bro. Jessie Timuat", role: "Vice President", image: "/img/officers/yp_vice_president.jpg" },
      { name: "Sis. Erica Villegas", role: "Secretary", image: "/img/officers/yp_secretary.jpg" },
      { name: "Sis. Selah Acojedo", role: "Assistant Secretary", image: "/img/officers/yp_assistant_secretary.jpg" },
      { name: "Sis. Frena May Sulapas", role: "Treasurer", image: "/img/officers/yp_treasurer.jpg" },
      { name: "Sis. Camille Bucayan", role: "PIO", image: "/img/officers/yp_pio.jpg" },
      { name: "Sis. Donita Sibugan", role: "Social Media Coordinator", image: "/img/officers/yp_socmed.jpg" }
    ]
  }
]

const deptOfficersData = ref({
  heroTitle: 'Department Officers',
  heroSubtitle: 'Dedicated leaders serving and growing together in Christ.',
  heroImage: null,
  backgroundColor: '#ffffff',
  backButtonText: 'Back to About',
  backButtonColor: '#14b8a6'
})

const departmentsData = ref(defaultDepartments)

// Fetch department officers data from CMS
const fetchDeptOfficersData = async () => {
  try {
    const response = await axios.get('/cms/departmentofficer/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Department Officers:', { content, cmsImages })
      
      // Update department officers data from content
      if (content.heroTitle) deptOfficersData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) deptOfficersData.value.heroSubtitle = content.heroSubtitle
      if (content.backgroundColor) {
        deptOfficersData.value.backgroundColor = content.backgroundColor
        console.log('Background color from CMS:', content.backgroundColor)
      }
      if (content.backButtonText) deptOfficersData.value.backButtonText = content.backButtonText
      if (content.backButtonColor) {
        deptOfficersData.value.backButtonColor = content.backButtonColor
        console.log('Back button color from CMS:', content.backButtonColor)
      }
      
      // Handle hero image - images are stored as BLOB, returned as base64 in images object
      // The image is stored with field_name = 'heroImage' in tbl_cms_images
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          deptOfficersData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        } else {
          console.log('⚠️ Hero image in CMS is not a valid base64 image')
        }
      } else {
        console.log('ℹ️ No hero image found in CMS, using default')
      }
      
      // Handle departments array
      if (content.departments && Array.isArray(content.departments) && content.departments.length > 0) {
        departmentsData.value = content.departments.map((dept, deptIndex) => {
          const department = {
            name: dept.name || '',
            officers: []
          }
          
          // Process officers for this department
          if (dept.officers && Array.isArray(dept.officers)) {
            department.officers = dept.officers.map((officer, officerIndex) => {
              // Images are stored with keys like: departments[0].officers[0].image, etc.
              const imageKey = `departments[${deptIndex}].officers[${officerIndex}].image`
              let officerImage = ''
              
              // First check images object (BLOB converted to base64)
              if (cmsImages && typeof cmsImages === 'object' && cmsImages[imageKey]) {
                const imageBase64 = cmsImages[imageKey]
                if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image/')) {
                  officerImage = imageBase64
                  console.log(`✅ Officer ${deptIndex}-${officerIndex} image loaded from CMS (BLOB converted to base64)`)
                }
              }
              
              // Fallback to officer.image if it's base64 (composable might have merged it)
              if (!officerImage && officer.image && typeof officer.image === 'string' && officer.image.startsWith('data:image/')) {
                officerImage = officer.image
                console.log(`✅ Officer ${deptIndex}-${officerIndex} image from merged content`)
              }
              
              return {
                name: officer.name || '',
                role: officer.role || '',
                image: officerImage
              }
            })
          }
          
          return department
        })
        console.log('✅ Departments loaded from CMS:', departmentsData.value.length, 'departments')
      } else {
        console.log('ℹ️ No departments found in CMS, using defaults')
      }
      
      console.log('✅ Department Officers CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Department Officers, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching department officers data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

onMounted(async () => {
  await fetchDeptOfficersData()
})
</script>

<style scoped>
.department-officers-page {
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

.department-officers-page :deep(.v-card:hover) {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border-left-width: 6px;
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

