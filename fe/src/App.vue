<template>
  <v-app>
    <!-- Loading Screen -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-screen">
        <div class="loading-content">
          <img src="/logo-watermark.png" alt="BBEK Logo" class="loading-logo" />
          <div class="loading-spinner"></div>
        </div>
      </div>
    </transition>

    <!-- Navigation should only display for Landing Page if page is in AdminDashboard and its children dont display it -->
    <Navigation v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <router-view />
    <Footer v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <SocialMediaIcons v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <MembershipJourneyBanner v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <!-- Announcement Display for all users -->
    <AnnouncementDisplayDialog
      v-for="announcement in activeAnnouncements"
      :key="announcement.announcement_id"
      v-model="announcementDialogs[announcement.announcement_id]"
      :announcement="announcement"
      @viewed="handleAnnouncementViewed"
    />
  </v-app>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnnouncementStore } from '@/stores/announcementStore'
import AnnouncementDisplayDialog from '@/components/Dialogs/AnnouncementDisplayDialog.vue'
import { checkAccessTokenValidity } from '@/utils/tokenValidation'
import Navigation from './components/LandingPage/Navigation.vue'
import Footer from './components/LandingPage/Footer.vue'
import SocialMediaIcons from './components/LandingPage/SocialMediaIcons.vue'
import MembershipJourneyBanner from './components/LandingPage/MembershipJourneyBanner.vue'

const announcementStore = useAnnouncementStore()
const activeAnnouncements = ref([])
const announcementDialogs = reactive({})
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || '{}' || null)
const route = useRoute()
const router = useRouter()

// Loading screen state
const isLoading = ref(true)

const fetchActiveAnnouncements = async () => {
  try {
    const announcements = await announcementStore.fetchActiveAnnouncementsForUser()
    activeAnnouncements.value = announcements || []
    
    // Open dialogs for each announcement (one at a time, with delay)
    activeAnnouncements.value.forEach((announcement, index) => {
      setTimeout(() => {
        announcementDialogs[announcement.announcement_id] = true
      }, index * 500) // Stagger dialogs by 500ms
    })
  } catch (error) {
    console.error('Error fetching active announcements:', error)
    // Don't show error for non-authenticated users
    if (error.response?.status !== 401) {
      console.error('Failed to fetch announcements:', error)
    }
  }
}

const handleAnnouncementViewed = (announcementId) => {
  // Remove from active announcements
  activeAnnouncements.value = activeAnnouncements.value.filter(
    a => a.announcement_id !== announcementId
  )
  // Close the dialog
  announcementDialogs[announcementId] = false
}

onMounted(async () => {
  // check token expiry every 1 hour and refresh it
  setInterval(async() => {
    const tokenValidation = checkAccessTokenValidity()
    if (!tokenValidation.success) {
      // Token is invalid or expired, clear it
      localStorage.removeItem('accessToken')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      userInfo.value = null
      router.push({ name: 'LandingPage' })
    }
  }, 1000 * 60 * 60)
  // Fetch announcements when app loads for all users
  await fetchActiveAnnouncements()
  
  // Hide loading screen after content is loaded
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})
</script>

<style>
/* Loading Screen Styles */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.loading-logo {
  width: 200px;
  height: 200px;
  object-fit: contain;
  animation: pulse 2s ease-in-out infinite;
}

/* Responsive sizes for different devices */
@media (max-width: 768px) {
  .loading-logo {
    width: 150px;
    height: 150px;
  }
}

@media (max-width: 480px) {
  .loading-logo {
    width: 120px;
    height: 120px;
  }
}

/* Larger screens */
@media (min-width: 1200px) {
  .loading-logo {
    width: 250px;
    height: 250px;
  }
}

/* Extra large screens */
@media (min-width: 1600px) {
  .loading-logo {
    width: 300px;
    height: 300px;
  }
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-top-color: #0cbdaa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@media (max-width: 480px) {
  .loading-spinner {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }
}

@media (min-width: 1200px) {
  .loading-spinner {
    width: 60px;
    height: 60px;
    border-width: 5px;
  }
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
