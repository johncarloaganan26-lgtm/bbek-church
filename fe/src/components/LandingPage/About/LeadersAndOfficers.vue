 <template>
  <div class="leaders-officers-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${leadersOfficersData.heroImage || getImageUrl('/img/d.jpeg')})` }"
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
        <h1 class="hero-title fade-in-up">{{ leadersOfficersData.heroTitle || 'Our Leadership' }}</h1>
        <p class="hero-subtitle fade-in-up-delay">
          {{ leadersOfficersData.heroSubtitle || 'Dedicated men and women leading our church community with faith, wisdom, and service.' }}
        </p>
      </div>
    </section>

    <!-- Church Leaders Section -->
    <section class="py-20 bg-white">
      <v-container>
        <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-center text-teal mb-16">
          {{ leadersOfficersData.leadersSectionTitle || 'Church Leaders' }}
        </h2>
        <v-row>
          <v-col
            v-for="(leader, index) in leadersData"
            :key="index"
            cols="12"
            md="6"
            class="d-flex"
          >
            <v-card class="flex-1 overflow-hidden" elevation="2" hover>
              <div class="aspect-square relative overflow-hidden">
                <v-img
                  :src="leader.image"
                  :alt="leader.name"
                  cover
                  height="100%"
                ></v-img>
              </div>
              <v-card-text class="text-center pa-8">
                <h3 class="text-h5 font-weight-bold text-grey-darken-3 mb-2">
                  {{ leader.name }}
                </h3>
                <p class="text-h6 text-teal mb-4 font-weight-semibold">
                  {{ leader.position }}
                </p>
                <p class="text-body-1 text-grey-darken-1">
                  {{ leader.bio }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Department Officers Section -->
    <section class="py-20 bg-grey-lighten-5">
      <v-container>
        <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-center text-teal mb-16">
          {{ leadersOfficersData.officersSectionTitle || 'Department Officers' }}
        </h2>
        <v-row>
          <v-col
            v-for="(dept, index) in departmentsData"
            :key="index"
            cols="12"
            md="4"
          >
            <v-card class="pa-8" elevation="2">
              <h3 class="text-h5 font-weight-bold text-teal mb-6 text-center">
                {{ dept.name }}
              </h3>
              <ul class="space-y-3">
                <li
                  v-for="(officer, idx) in dept.officers"
                  :key="idx"
                  class="d-flex justify-space-between text-body-2 mb-3"
                >
                  <span class="font-weight-semibold">{{ officer.role }}:</span>
                  <span>{{ officer.name }}</span>
                </li>
              </ul>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Join Our Community Section -->
    <section class="py-20 bg-teal-lighten-5">
      <v-container>
        <div class="text-center max-width-6xl mx-auto">
          <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-teal mb-8">
            {{ leadersOfficersData.joinSectionTitle || 'Join Our Faith Community' }}
          </h2>
          <p class="text-h6 text-grey-darken-1 mb-12 max-width-4xl mx-auto">
            {{ leadersOfficersData.joinSectionText || "We'd love to have you join us this Sunday. Come experience the love, fellowship, and spiritual growth at Bible Baptist Ekklesia of Kawit." }}
          </p>
          <div class="d-flex flex-column flex-sm-row gap-4 justify-center">
            <v-btn
              :color="leadersOfficersData.planVisitButtonColor || '#14b8a6'"
              class="text-white"
              size="large"
              rounded
              @click="$router.push('/plan-your-visit')"
            >
              {{ leadersOfficersData.planVisitButtonText || 'Plan Your Visit' }}
            </v-btn>
            <v-btn
              variant="outlined"
              :color="leadersOfficersData.learnMoreButtonColor || '#14b8a6'"
              size="large"
              rounded
              @click="$router.push('/new')"
            >
              {{ leadersOfficersData.learnMoreButtonText || 'Learn More' }}
            </v-btn>
          </div>
        </div>
      </v-container>
    </section>

    <!-- Back Button -->
    <section class="py-12 text-center bg-white">
      <v-btn
        :color="leadersOfficersData.backButtonColor || '#14b8a6'"
        class="text-white"
        size="large"
        rounded
        @click="$router.push('/about')"
      >
        {{ leadersOfficersData.backButtonText || 'Back to About' }}
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
    image: "/img/d.jpeg"
  }
]

const defaultDepartments = [
  {
    name: "Adult Ladies Department",
    officers: [
      { name: "Sis. Danica Aldousari", role: "President/Coordinator" },
      { name: "Sis. Melody Bilog", role: "Vice President" },
      { name: "Sis. Espie Apelado", role: "Secretary" },
      { name: "Sis. Nancy Belleza", role: "Treasurer" },
      { name: "Ma'am Gina Sulapas", role: "Auditor" }
    ]
  },
  {
    name: "Adult Men Department",
    officers: [
      { name: "Bro. Danny Delos santos", role: "President" },
      { name: "Bro. Roland Santos", role: "Vice President" },
      { name: "Bro. Robert Apelado", role: "Secretary" },
      { name: "Bro. Rowel Bucayan", role: "Treasurer" }
    ]
  },
  {
    name: "Young People Department",
    officers: [
      { name: "Sis. Jessica Las", role: "President" },
      { name: "Bro. Jessie Timuat", role: "Vice President" },
      { name: "Sis. Erica Villegas", role: "Secretary" },
      { name: "Sis. Selah Acojedo", role: "Assistant Secretary" },
      { name: "Sis. Frena May Sulapas", role: "Treasurer" },
      { name: "Sis. Camille Bucayan", role: "PIO" },
      { name: "Sis. Donita Sibugan", role: "Social Media Coordinator" }
    ]
  }
]

const leadersOfficersData = ref({
  heroTitle: 'Our Leadership',
  heroSubtitle: 'Dedicated men and women leading our church community with faith, wisdom, and service.',
  heroImage: null,
  leadersSectionTitle: 'Church Leaders',
  officersSectionTitle: 'Department Officers',
  joinSectionTitle: 'Join Our Faith Community',
  joinSectionText: "We'd love to have you join us this Sunday. Come experience the love, fellowship, and spiritual growth at Bible Baptist Ekklesia of Kawit.",
  planVisitButtonText: 'Plan Your Visit',
  planVisitButtonColor: '#14b8a6',
  learnMoreButtonText: 'Learn More',
  learnMoreButtonColor: '#14b8a6',
  backButtonText: 'Back to About',
  backButtonColor: '#14b8a6'
})

const leadersData = ref(defaultLeaders)
const departmentsData = ref(defaultDepartments)

// Fetch leaders and officers data from CMS
const fetchLeadersOfficersData = async () => {
  try {
    // Fetch church leaders data
    const leadersResponse = await axios.get('/cms/churchleader/full')
    if (leadersResponse.data.success && leadersResponse.data.data) {
      const { page: leadersPage, images: leadersImages } = leadersResponse.data.data
      const leadersContent = leadersPage?.content || {}
      
      if (leadersContent.heroTitle) leadersOfficersData.value.heroTitle = leadersContent.heroTitle
      if (leadersContent.heroSubtitle) leadersOfficersData.value.heroSubtitle = leadersContent.heroSubtitle
      if (leadersContent.sectionTitle) leadersOfficersData.value.leadersSectionTitle = leadersContent.sectionTitle
      
      if (leadersImages?.heroImage) {
        leadersOfficersData.value.heroImage = leadersImages.heroImage
      }
      
      if (leadersContent.leaders && Array.isArray(leadersContent.leaders) && leadersContent.leaders.length > 0) {
        leadersData.value = leadersContent.leaders.map(leader => ({
          name: leader.name || '',
          position: leader.position || '',
          bio: leader.bio || '',
          image: leader.image || ''
        }))
      }
    }
    
    // Fetch department officers data
    const deptResponse = await axios.get('/cms/departmentofficer/full')
    if (deptResponse.data.success && deptResponse.data.data) {
      const { page: deptPage, images: deptImages } = deptResponse.data.data
      const deptContent = deptPage?.content || {}
      
      if (deptContent.sectionTitle) leadersOfficersData.value.officersSectionTitle = deptContent.sectionTitle
      
      if (deptContent.departments && Array.isArray(deptContent.departments) && deptContent.departments.length > 0) {
        departmentsData.value = deptContent.departments.map(dept => ({
          name: dept.name || '',
          officers: (dept.officers || []).map(officer => ({
            name: officer.name || '',
            role: officer.role || ''
          }))
        }))
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching leaders and officers data from CMS:', error)
    }
  }
}

onMounted(async () => {
  await fetchLeadersOfficersData()
})
</script>

<style scoped>
.leaders-officers-page {
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

