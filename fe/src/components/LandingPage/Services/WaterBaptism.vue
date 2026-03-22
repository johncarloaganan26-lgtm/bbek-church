<template>
  <div class="water-baptism-page">
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div
          class="hero-background"
          :style="{ backgroundImage: `url(${waterBaptismData.heroImage || '/img/waterbap.jpg'})` }"
        ></div>
        <div class="hero-overlay"></div>

        <!-- Floating elements -->
        <div class="floating-elements">
          <div class="floating-element float-1"></div>
          <div class="floating-element float-2"></div>
          <div class="floating-element float-3 clip-path-triangle"></div>
          <div class="floating-element float-4 clip-path-star"></div>
          <div class="floating-element float-5"></div>
          <div class="floating-element float-6"></div>
          <div class="floating-element float-7"></div>
          <div class="floating-element float-8 clip-path-diamond"></div>
          <div class="floating-element float-9"></div>
        </div>

        <div class="hero-content">
          <h1 class="hero-title fade-in-up" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ waterBaptismData.heroTitle }}
          </h1>
          <p class="hero-subtitle fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ waterBaptismData.heroDescription }}
          </p>
        </div>
      </section>

      <!-- Content Section -->
      <section class="content-section" id="learn-more">
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
          <div class="content-grid">
            <!-- Left Column: What is Water Baptism -->
            <div class="left-column">
              <h2 class="section-title fade-in" style="animation-delay: 200ms; font-family: 'Georgia', serif; font-style: italic;">
                {{ waterBaptismData.sectionTitle }}
              </h2>
              
              <div class="info-cards">
                <v-card class="info-card fade-in-up" style="animation-delay: 300ms;" variant="flat" color="teal-lighten-5">
                  <v-card-title class="card-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                    {{ waterBaptismData.biblicalFoundationTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                      {{ waterBaptismData.biblicalFoundationText }}
                    </p>
                  </v-card-text>
                </v-card>

                <v-card class="info-card fade-in-up" style="animation-delay: 400ms;" variant="flat" color="teal-lighten-5">
                  <v-card-title class="card-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                    {{ waterBaptismData.significanceTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                      {{ waterBaptismData.significanceText }}
                    </p>
                  </v-card-text>
                </v-card>
              </div>

              <v-card class="who-baptized-card fade-in" style="animation-delay: 500ms;" variant="flat" color="teal-lighten-5">
                <v-card-title class="who-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">{{ waterBaptismData.whoShouldBeBaptizedTitle }}</v-card-title>
                <v-card-text>
                  <ul class="baptized-list">
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ waterBaptismData.whoPoint1 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ waterBaptismData.whoPoint2 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ waterBaptismData.whoPoint3 }}</span>
                    </li>
                  </ul>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right Column: Register for Baptism or Member Certificate -->
            <div class="right-column" id="register">
              <template v-if="isMember">
                <template v-if="loadingCertificate">
                  <div class="loading-container">
                    <v-progress-circular indeterminate color="teal" size="48"></v-progress-circular>
                    <span class="loading-text" style="font-family: 'Georgia', serif; font-style: italic;">Loading your certificate...</span>
                  </div>
                </template>
                <template v-else-if="memberBaptismData">
                  <v-card class="welcome-card fade-in-up" style="animation-delay: 700ms;">
                    <div class="welcome-content">
                      <div class="welcome-icon">
                        <v-icon icon="mdi-hand-heart" size="60" color="white"></v-icon>
                      </div>
                      <h2 class="welcome-title">Thank You and Welcome to BBek!</h2>
                      <p class="welcome-message" style="font-family: 'Georgia', serif; font-style: italic;">
                        {{ memberBaptismData.firstname }}, we are grateful that you have taken the step
                        of water baptism. You are now part of our church family.
                      </p>
                      <p class="welcome-submessage" style="font-family: 'Georgia', serif; font-style: italic;">
                        May God bless you as you continue your journey with Him.
                      </p>
                      <v-btn color="teal" @click="$router.push('/services')" class="welcome-btn">
                        <v-icon start>mdi-church</v-icon>
                        Explore Our Services
                      </v-btn>
                    </div>
                  </v-card>
                </template>
                <template v-else>
                  <h2 class="section-title fade-in" style="animation-delay: 700ms; font-family: 'Georgia', serif; font-style: italic;">
                    Welcome Back, Beloved Member!
                  </h2>
                  <v-card class="member-card">
                    <v-card-title class="member-title" style="font-family: 'Georgia', serif; font-style: italic;">
                      You Are Already a Member of Our Church Family
                    </v-card-title>
                    <v-card-text>
                      <p class="member-text" style="font-family: 'Georgia', serif; font-style: italic;">
                        Thank you for being part of our community! As a baptized member,
                        we invite you to continue your spiritual journey with us.
                      </p>
                      <div class="services-info">
                        <h3 class="services-title" style="font-family: 'Georgia', serif; font-style: italic;">Join Our Sunday Services</h3>
                        <p class="services-text" style="font-family: 'Georgia', serif; font-style: italic;">
                          We warmly invite you to join us for our Sunday worship services where we gather
                          to praise, pray, and grow in faith together.
                        </p>
                        <div class="services-list">
                          <div class="service-item">
                            <v-icon color="teal" size="16">mdi-check</v-icon>
                            <span style="font-family: 'Georgia', serif; font-style: italic;">Sunday Morning Service: 9:00 AM</span>
                          </div>
                          <div class="service-item">
                            <v-icon color="teal" size="16">mdi-check</v-icon>
                            <span style="font-family: 'Georgia', serif; font-style: italic;">Sunday Evening Service: 5:00 PM</span>
                          </div>
                        </div>
                        <v-btn color="teal" @click="$router.push('/services')" class="services-btn">
                          Explore Our Services
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </template>
              </template>
              <template v-else>
                <div class="journey-info fade-in-up" style="animation-delay: 700ms;">
                  <h2 class="section-title" style="font-family: 'Georgia', serif; font-style: italic;">
                    Your Journey Towards Baptism
                  </h2>
                  
                  <v-card class="journey-card pb-6" variant="elevated">
                    <v-card-text>
                      <p class="mb-6" style="font-family: 'Georgia', serif; font-style: italic; font-size: 1.1rem; line-height: 1.6;">
                        Baptism is more than just a ceremony; it is a public declaration of your new life in Christ. At Bible Baptist Ekklesia of Kawit, we want to walk with you through every step of this spiritual commitment.
                      </p>

                      <div class="roadmap">
                        <div class="roadmap-item">
                          <div class="roadmap-icon">1</div>
                          <div class="roadmap-content">
                            <h3 style="font-family: 'Georgia', serif; font-style: italic;">Salvation Talk</h3>
                            <p style="font-family: 'Georgia', serif; font-style: italic;">Start with a short Salvation Talk (about 5-10 minutes). Salvation Talk schedules are available every day, any time.</p>
                          </div>
                        </div>

                        <div class="roadmap-connector"></div>

                        <div class="roadmap-item">
                          <div class="roadmap-icon">2</div>
                          <div class="roadmap-content">
                            <h3 style="font-family: 'Georgia', serif; font-style: italic;">Bible Study</h3>
                            <p style="font-family: 'Georgia', serif; font-style: italic;">After the Salvation Talk, we will help you schedule Bible Study. Bible Study schedules are on Wednesdays and Saturdays only.</p>
                          </div>
                        </div>

                        <div class="roadmap-connector"></div>

                        <div class="roadmap-item final">
                          <div class="roadmap-icon bg-teal">
                            <v-icon color="white">mdi-water</v-icon>
                          </div>
                          <div class="roadmap-content">
                            <h3 style="font-family: 'Georgia', serif; font-style: italic;">Water Baptism</h3>
                            <p style="font-family: 'Georgia', serif; font-style: italic;">After Bible Study is completed, you will be scheduled for Water Baptism. Water Baptism is on Sundays only.</p>
                          </div>
                        </div>
                      </div>

                      <div class="cta-section mt-8 text-center">
                        <p class="mb-4" style="font-family: 'Georgia', serif; font-style: italic; font-weight: bold;">
                          Ready to take the first step?
                        </p>
                        <v-btn
                          color="teal"
                          size="x-large"
                          @click="$router.push('/beoneofus/discipleship')"
                          class="action-btn"
                          elevation="4"
                        >
                          Request Salvation Talk
                          <v-icon end>mdi-arrow-right</v-icon>
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </template>
            </div>
          </div>
        </v-container>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMemberRegistrationStore } from '@/stores/memberRegistrationStore'
import { useWaterBaptismStore } from '@/stores/ServicesRecords/waterBaptismStore'
import { useChurchLeadersStore } from '@/stores/ChurchRecords/churchLeadersStore'
import axios from '@/api/axios'

const router = useRouter()
const memberRegistrationStore = useMemberRegistrationStore()
const waterBaptismStore = useWaterBaptismStore()
const churchLeadersStore = useChurchLeadersStore()

const user = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const pastors = ref([])

const isMember = ref(false)
const memberBaptismData = ref(null)
const loadingCertificate = ref(false)

// Water Baptism CMS data
const waterBaptismData = ref({
  heroImage: '/img/waterbap.jpg',
  heroTitle: 'Water Baptism',
  heroDescription: 'Take the next step in your faith journey through water baptism, a public declaration of your commitment to follow Jesus Christ.',
  sectionTitle: 'What is Water Baptism?',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText: 'Water baptism is an act of obedience symbolizing the believer\'s faith in a crucified, buried, and risen Savior. It is a public declaration of one\'s faith and commitment to Christ.',
  significanceTitle: 'Significance',
  significanceText: 'Baptism illustrates Christ\'s death, burial, and resurrection. When you are immersed in water, you identify with Christ\'s death and burial, and when you come out of the water, you identify with His resurrection.',
  whoShouldBeBaptizedTitle: 'Who Should Be Baptized?',
  whoPoint1: 'Those who have accepted Jesus Christ as their personal Savior',
  whoPoint2: 'Those who understand the meaning and significance of baptism',
  whoPoint3: 'Those who are willing to publicly profess their faith in Christ'
})

// Fetch water baptism data from CMS
const fetchWaterBaptismData = async () => {
  try {
    const response = await axios.get('/cms/waterbaptism/full')
    if (response.data.success && response.data.data) {
      const { page, images } = response.data.data
      const content = page?.content || {}
      
      // Update water baptism data
      waterBaptismData.value.heroTitle = content.heroTitle || waterBaptismData.value.heroTitle
      waterBaptismData.value.heroDescription = content.heroDescription || waterBaptismData.value.heroDescription
      waterBaptismData.value.sectionTitle = content.sectionTitle || waterBaptismData.value.sectionTitle
      waterBaptismData.value.biblicalFoundationTitle = content.biblicalFoundationTitle || waterBaptismData.value.biblicalFoundationTitle
      waterBaptismData.value.biblicalFoundationText = content.biblicalFoundationText || waterBaptismData.value.biblicalFoundationText
      waterBaptismData.value.significanceTitle = content.significanceTitle || waterBaptismData.value.significanceTitle
      waterBaptismData.value.significanceText = content.significanceText || waterBaptismData.value.significanceText
      waterBaptismData.value.whoShouldBeBaptizedTitle = content.whoShouldBeBaptizedTitle || waterBaptismData.value.whoShouldBeBaptizedTitle
      waterBaptismData.value.whoPoint1 = content.whoPoint1 || waterBaptismData.value.whoPoint1
      waterBaptismData.value.whoPoint2 = content.whoPoint2 || waterBaptismData.value.whoPoint2
      waterBaptismData.value.whoPoint3 = content.whoPoint3 || waterBaptismData.value.whoPoint3
      
      // Handle hero image
      if (images?.heroImage) {
        waterBaptismData.value.heroImage = images.heroImage
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching water baptism data from CMS:', error)
    }
  }
}

// Check if user is member and fetch data
onMounted(async () => {
  await fetchWaterBaptismData()


  await churchLeadersStore.fetchMemberOptions()
  pastors.value = churchLeadersStore.memberOptions
  await fetchMemberBaptismData()
})

const fetchMemberBaptismData = async () => {
  loadingCertificate.value = true
  try {
    // Check if user has member data
    if (!user.value || !user.value.member || !user.value.member.member_id) {
      isMember.value = false
      return
    }
    const memberId = user.value.member.member_id
    
    const baptismData = await waterBaptismStore.fetchBaptismByMemberId(memberId)
    
    if (baptismData) {
      isMember.value = true
      memberBaptismData.value = baptismData
    } else {
      isMember.value = true // User is a member but no baptism record found
      memberBaptismData.value = null
    }
  } catch (error) {
    console.error('Error fetching member baptism data:', error)
    isMember.value = false
  } finally {
    loadingCertificate.value = false
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Format member baptism data for CertificatePreview
const formattedCertificateData = computed(() => {
  if (!memberBaptismData.value) return null
  
  const data = memberBaptismData.value
  const fullName = data.fullname || `${data.firstname || ''} ${data.middle_name || ''} ${data.lastname || ''}`.trim()
  
  return {
    service: {
      member_fullname: fullName,
      member_birthdate: data.birthdate || '',
      member_address: data.address || '',
      baptism_date: data.baptism_date || '',
      baptism_location: data.baptism_location || data.location || '',
      member_id: data.member_id || data.member_member_id || '',
      member_date_created: data.member_date_created || data.date_created || '',
      pastor_fullname: pastors.value && pastors.value.length > 0 
        ? pastors.value[pastors.value.length - 1].name 
        : 'Rev. Fresco Q. Sulapas',
      minister_fullname: pastors.value && pastors.value.length > 0 
        ? pastors.value[pastors.value.length - 1].name 
        : 'Rev. Fresco Q. Sulapas',
      witness_fullname: data.witness_fullname || data.witness_name || '',
      civil_status: data.civil_status || '',
      member_civil_status: data.civil_status || '',
      desire_ministry: data.desire_ministry || '',
      if_married: data.if_married || '',
      spouse_name: data.spouse_name || '',
      marriage_date: data.marriage_date || '',
      fited_date: data.fited_date || data.fitted_date || data.date_fited || data.baptism_date || '',
      date_created: data.date_created || ''
    }
  }
})

const openCertificatePreview = () => {
  if (memberBaptismData.value) {
    // Store certificate data in sessionStorage as fallback
    sessionStorage.setItem('certificateData', JSON.stringify(formattedCertificateData.value))
    
    // Navigate to certificate preview page with data
    router.push({
      name: 'CertificatePreview',
      params: { type: 'baptism' },
      state: {
        certificateData: formattedCertificateData.value
      }
    })
  } else {
    ElMessage.error('Certificate data not available')
  }
}
</script>

<style scoped>
.water-baptism-page {
  width: 100vw;
  min-height: 100vh;
  background: white;
  position: relative;
}

.main-content {
  width: 100%;
  flex: 1;
}

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  margin-top: 64px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  background-attachment: fixed;
}

.hero-overlay {
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
  background: rgba(63, 211, 194, 0.62);
  border-radius: 50%;
  animation: float 3.5s ease-in-out infinite;
}

.float-1 { top: 80px; left: 80px; width: 48px; height: 48px; animation-delay: 0s; }
.float-2 { top: 33%; right: 64px; width: 32px; height: 32px; animation-delay: 1.5s; animation-name: floatRotate; }
.float-3 { bottom: 33%; left: 64px; width: 40px; height: 40px; animation-delay: 2s; }
.float-4 { bottom: 80px; right: 80px; width: 24px; height: 24px; animation-delay: 0.8s; }
.float-5 { top: 50%; left: 25%; width: 28px; height: 28px; animation-delay: 1.2s; animation-name: floatRotate12; }
.float-6 { bottom: 25%; right: 33%; width: 36px; height: 36px; animation-delay: 2.5s; }
.float-7 { top: 25%; left: 33%; width: 16px; height: 16px; animation-delay: 1.8s; animation-name: floatRotate; }
.float-8 { top: 75%; right: 25%; width: 44px; height: 44px; animation-delay: 0.3s; }
.float-9 { bottom: 50%; left: 16%; width: 20px; height: 20px; animation-delay: 2.1s; }
.float-10 { top: 40px; left: 40px; width: 64px; height: 64px; animation-delay: 0s; }
.float-11 { top: 80px; right: 80px; width: 48px; height: 48px; animation-delay: 1s; }
.float-12 { bottom: 80px; left: 80px; width: 56px; height: 56px; animation-delay: 2s; animation-name: floatRotate; }

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

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 16px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -0.025em;
  font-family: 'Georgia', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.125rem;
  color: white;
  font-weight: 300;
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

@media (max-width: 640px) {
  .hero-section {
    min-height: 70vh;
    margin-top: 64px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    padding: 0 16px;
  }

  .hero-content {
    padding: 0 16px;
  }

  .content-section {
    padding: 32px 0;
  }

  .section-title {
    font-size: 1.5rem;
    margin-bottom: 24px;
  }

  .info-cards {
    gap: 16px;
    margin-bottom: 24px;
  }

  .card-title {
    font-size: 1.25rem;
  }

  .who-baptized-card {
    padding: 16px;
  }

  .who-title {
    font-size: 1.125rem;
  }

  .registration-card {
    margin-top: 24px;
  }

  .registration-title {
    font-size: 1.25rem;
  }

  .registration-subtitle {
    font-size: 0.8125rem;
  }

  .floating-element {
    display: none;
  }
}

/* Content Section */
.content-section {
  position: relative;
  padding: 64px 0;
  background: white;
  overflow: hidden;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  position: relative;
  z-index: 2;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.section-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 32px;
  font-family: 'Georgia', serif;
  color: #000;
}

.fade-in {
  animation: fadeIn 0.6s ease-out both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.info-cards {
  display: grid;
  gap: 24px;
  margin-bottom: 32px;
}

.info-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-left: 4px solid #14b8a6;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left-width: 6px;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
}

.who-baptized-card {
  padding: 24px;
  border-radius: 8px;
  border-left: 4px solid #14b8a6;
  transition: all 0.3s ease;
}

.who-baptized-card:hover {
  transform: translateX(8px);
  border-left-width: 6px;
}

.who-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
  color: #000;
}

.baptized-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.baptized-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  transition: transform 0.5s;
}

.baptized-item:hover {
  transform: translateX(8px);
}

.check-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

/* Loading */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 12px;
}

.loading-text {
  color: #4b5563;
  margin-left: 12px;
}

/* Roadmap Styles */
.journey-card {
  border-radius: 12px;
  border-top: 4px solid #14b8a6;
}

.roadmap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
}

.roadmap-item {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.roadmap-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0fdfa;
  border: 2px solid #14b8a6;
  color: #0d9488;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  z-index: 2;
}

.roadmap-icon.bg-teal {
  background: #14b8a6;
  border-color: #14b8a6;
}

.roadmap-connector {
  width: 2px;
  height: 30px;
  background: #ccfbf1;
  margin-left: 17px;
}

.roadmap-content h3 {
  font-size: 1.1rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 4px;
}

.roadmap-content p {
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.4;
}

.action-btn {
  font-weight: bold;
  letter-spacing: 0.5px;
  transition: transform 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-4px);
}

/* Certificate Card */
.certificate-card {
  background: linear-gradient(to bottom right, #eff6ff, #f0fdfa);
  padding: 32px;
  border-radius: 12px;
  border: 2px solid #5eead4;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.certificate-header {
  text-align: center;
  margin-bottom: 32px;
}

.certificate-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: #0d9488;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.certificate-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.certificate-church {
  color: #0d9488;
  font-weight: 500;
}

.certificate-body {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #5eead4;
  margin-bottom: 24px;
}

.certificate-text {
  text-align: center;
  margin-bottom: 24px;
}

.certificate-italic {
  color: #4b5563;
  font-style: italic;
  margin-bottom: 16px;
}

.certificate-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.certificate-description {
  color: #4b5563;
}

.certificate-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.certificate-detail {
  text-align: center;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
}

.certificate-verse {
  text-align: center;
  margin-bottom: 24px;
}

.verse-text {
  font-size: 0.875rem;
  color: #4b5563;
  font-style: italic;
  margin-bottom: 4px;
}

.verse-reference {
  font-size: 0.75rem;
  color: #6b7280;
}

.certificate-footer {
  text-align: center;
}

.signature-lines {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 16px;
}

.signature-line {
  text-align: center;
}

.line {
  border-top: 1px solid #9ca3af;
  width: 128px;
  margin: 0 auto 8px;
}

.signature-line p {
  font-size: 0.875rem;
  color: #4b5563;
}

.issued-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.certificate-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* Welcome Card */
.welcome-card {
  background: linear-gradient(to bottom right, #eff6ff, #f0fdfa);
  padding: 48px 32px;
  border-radius: 12px;
  border: 2px solid #5eead4;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: #0d9488;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
}

.welcome-message {
  font-size: 1rem;
  color: #4b5563;
  margin-bottom: 12px;
  line-height: 1.6;
}

.welcome-submessage {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
  margin-bottom: 8px;
}

.welcome-btn {
  width: 100%;
  margin-top: 24px;
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.welcome-btn:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

/* Member Card */
.member-card {
  border: 1px solid #5eead4;
  background: #f0fdfa;
}

.member-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f766e;
}

.member-text {
  color: #0f766e;
  margin-bottom: 16px;
}

.services-info {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #5eead4;
}

.services-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f766e;
  margin-bottom: 12px;
}

.services-text {
  color: #0f766e;
  margin-bottom: 16px;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #0f766e;
}

.services-btn {
  width: 100%;
  margin-top: 16px;
}

/* Registration Card */
.registration-card {
  border: 1px solid #5eead4;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.registration-header {
  padding-bottom: 8px;
}

.registration-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.registration-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.registration-form {
  padding: 0;
}

.registration-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.registration-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
  padding-bottom: 8px;
}

.required {
  color: #ef4444;
}

.required-text {
  color: #ef4444;
  font-size: 0.6rem;
  font-weight: 500;
  margin-left: 4px;
}

.registration-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.registration-form :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.registration-form :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.registration-form :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.registration-form :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.registration-form :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.registration-form :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.registration-form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
    gap: 0 20px;
  }
}

.form-group {
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.submit-btn:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

.mt-4 {
  margin-top: 16px;
}

/* Children Section Styles */
.children-section {
  margin-top: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.children-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.children-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 20px;
}

.child-item {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.child-number {
  font-weight: 600;
  color: #1f2937;
}

.add-child-btn {
  width: 100%;
  margin-top: 16px;
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.add-child-btn:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}
</style>

