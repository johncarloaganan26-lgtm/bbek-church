<template>
  <div class="department-officers-page">
    <!-- Hero Section -->
    <header class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${resolveImage(deptOfficersData.heroImage, '/img/officers/default.png')})` }"
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
    </header>

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
          <v-row class="officers-grid">
            <v-col
              v-for="(officer, index) in dept.officers"
              :key="index"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              xl="2"
            >
              <v-card class="officer-card" elevation="2" hover>
                <div class="officer-image-wrapper">
                  <v-img
                    :src="resolveImage(officer.image, '/img/officers/default.png')"
                    :alt="officer.name"
                    cover
                    @error="(event) => handleImageError(event, officer)"
                    class="officer-image"
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
                </div>
                <v-card-text class="officer-info text-center pa-4">
                  <h3 class="officer-name" :title="officer.name">{{ officer.name }}</h3>
                  <p class="officer-role" :title="officer.role">{{ officer.role }}</p>
                </v-card-text>
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
import { ref, onMounted, computed } from 'vue'
import axios from '@/api/axios'
import { useMemberRecordStore } from '@/stores/ChurchRecords/memberRecordStore'
import { useDepartmentsStore } from '@/stores/ChurchRecords/departmentsStore'

const memberStore = useMemberRecordStore()
const departmentsStore = useDepartmentsStore()

const imageErrors = ref(new Map())

const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return ''
  // If it's already an absolute or base64 URL, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath
  
  const parts = imagePath.split('/')
  const filename = parts.pop()
  if (!filename) return imagePath
  const encodedFilename = encodeURIComponent(filename)
  return (parts.length > 0 ? parts.join('/') + '/' : '') + encodedFilename
}

const handleImageError = (event, officer) => {
  // Track errors to prevent infinite loops
  const errorKey = officer.image
  if (!errorKey || imageErrors.value.has(errorKey)) return
  imageErrors.value.set(errorKey, true)
  
  // Use a placeholder gradient if possible
  if (event && event.target && typeof event.target.closest === 'function') {
    const imgElement = event.target.closest('.v-avatar')?.querySelector('img')
    if (imgElement) {
      imgElement.style.background = 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)'
      imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTRiOGE2Ii8+PC9zdmc+'
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

const defaultDepartments = []

const deptOfficersData = ref({
  heroTitle: 'Department Officers',
  heroSubtitle: 'Dedicated leaders serving and growing together in Christ.',
  heroImage: null,
  backgroundColor: '#ffffff',
  backButtonText: 'Back to About',
  backButtonColor: '#14b8a6'
})

const departmentsData = computed(() => {
  const grouped = {}

  // Sorting priority for positions
  const positionPriority = {
    'president': 1,
    'vice_president': 2,
    'secretary': 3,
    'assistant_secretary': 4,
    'treasurer': 5,
    'auditor': 6,
    'coordinator': 7,
    'pio': 8,
    'socmed_coordinator': 9,
    'member': 10
  }
  
  // Map ALL existing departments exactly as they appear in the admin records
  departmentsStore.departments.forEach(dept => {
    const deptName = dept.name || dept.department_name
    if (deptName) {
      grouped[deptName] = {
        name: deptName,
        officers: []
      }
    }
  })
  
  // Only show these specific officer positions
  const officerPositions = [
    'president', 'vice_president', 'secretary', 'assistant_secretary',
    'treasurer', 'auditor', 'coordinator', 'pio', 'socmed_coordinator'
  ]

  // Get active members who have a designated leadership position AND a department explicitly matched
  const activeMembersWithPosition = (memberStore.members || []).filter(m => 
    m.position && 
    m.position !== 'none' && 
    m.position !== 'member' && 
    officerPositions.includes(m.position.toLowerCase()) &&
    m.department_id // Must have a mapped department
  )
  
  activeMembersWithPosition.forEach(member => {
    // Resolve department name and drop unmapped/lost references
    const dept = departmentsStore.departments.find(d => (d.id || d.department_id) === member.department_id)
    if (!dept) return
    
    const deptName = dept.name || dept.department_name
    
    if (grouped[deptName]) {
      // Format the role for display (e.g., 'vice_president' -> 'Vice President')
      let position = member.position || 'member'
      let formattedRole = position.replace(/_/g, ' ')
      formattedRole = formattedRole.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  
      grouped[deptName].officers.push({
        name: `${member.firstname} ${member.lastname}`.trim(),
        role: formattedRole,
        priority: positionPriority[member.position] || 99,
        image: member.profileImage || member.profile_image || member.image || '/img/officers/default.png',
        bio: member.testimony || ''
      })
    }
  })
  
  // Convert map to array and sort officers in each department
  const result = Object.values(grouped).map(dept => {
    dept.officers.sort((a, b) => {
      return (a.priority || 99) - (b.priority || 99)
    })
    return dept
  })

  // Group priority map for departments
  const departmentPriorityMap = {
    'Adult Men': 1,
    'Men': 1,
    'Adult Ladies': 2,
    'Ladies': 2,
    'Young People': 3,
    'Youth': 3
  }

  // Sort departments by priority map, then alphabetically
  return result.sort((a, b) => {
    const priorityA = departmentPriorityMap[a.name] || (a.name.includes('Men') ? 1 : a.name.includes('Ladies') ? 2 : a.name.includes('Youth') || a.name.includes('Young') ? 3 : 99)
    const priorityB = departmentPriorityMap[b.name] || (b.name.includes('Men') ? 1 : b.name.includes('Ladies') ? 2 : b.name.includes('Youth') || b.name.includes('Young') ? 3 : 99)

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    return a.name.localeCompare(b.name)
  })
})

// Safe image resolver helper
const resolveImage = (image, fallback) => {
  if (!image) return getImageUrl(fallback)
  
  // If image is a string, check format
  if (typeof image === 'string') {
    if (image.startsWith('data:') || image.startsWith('http')) {
      return image
    }
    return getImageUrl(image)
  }
  
  // If it's a buffer object (from backend)
  if (typeof image === 'object' && image && image.type === 'Buffer' && Array.isArray(image.data)) {
    // This shouldn't happen with updated typeCast, but as a fallback:
    return `data:image/jpeg;base64,${btoa(String.fromCharCode.apply(null, image.data))}`
  }
  
  return getImageUrl(fallback)
}

// Fetch department officers hero data from CMS
const fetchDeptOfficersHeroData = async () => {
  try {
    // 1. Fetch content (text fields)
    const pageResponse = await axios.get('/cms/departmentofficer')
    if (pageResponse.data.success && pageResponse.data.data) {
      const content = pageResponse.data.data.content || {}
      
      // Update data from content
      if (content.heroTitle) deptOfficersData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) deptOfficersData.value.heroSubtitle = content.heroSubtitle
      if (content.backgroundColor) deptOfficersData.value.backgroundColor = content.backgroundColor
      if (content.backButtonText) deptOfficersData.value.backButtonText = content.backButtonText
      if (content.backButtonColor) deptOfficersData.value.backButtonColor = content.backButtonColor
      
      console.log('✅ Dept Officers Hero CMS content loaded successfully')
    }

    // 2. Fetch only the hero image specifically (avoiding the 17+ slow CMS images)
    try {
      const imgResponse = await axios.get('/cms/departmentofficer/image/heroImage')
      if (imgResponse.data.success && imgResponse.data.data?.imageBase64) {
        deptOfficersData.value.heroImage = imgResponse.data.data.imageBase64
        console.log('✅ Dept Officers Hero image loaded from CMS specifically')
      }
    } catch (imgErr) {
      console.log('ℹ️ No Dept Officers hero image found in CMS, using default')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching dept officers hero data from CMS:', error)
    }
  }
}

onMounted(() => {
  // Fetch both in parallel to avoid blocking
  Promise.all([
    fetchDeptOfficersHeroData(),
    memberStore.fetchMembers({ pageSize: 1000 }),
    departmentsStore.fetchDepartments({ pageSize: 1000 })
  ])
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

/* Officer Card Styles - Church Leader Style */
.officers-grid {
  justify-content: center;
}

.officer-card {
  overflow: hidden;
  transition: all 0.3s ease;
}

.officer-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* Square aspect ratio */
  overflow: hidden;
}

.officer-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.officer-info {
  padding: 12px 16px !important;
}

.officer-name {
  font-family: 'Georgia', serif;
  font-style: italic;
  font-size: 0.9rem;
  font-weight: bold;
  color: #37474f;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.officer-role {
  font-family: 'Georgia', serif;
  font-style: italic;
  font-size: 0.8rem;
  color: #14b8a6;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive */
@media (max-width: 600px) {
  .officer-name {
    font-size: 0.85rem;
  }

  .officer-role {
    font-size: 0.75rem;
  }
}
</style>

