<template>
  <v-app>
    <!-- Unified Loading Screen -->
    <PageLoader v-model="isLoading" viewport />

    <!-- Navigation should only display for Landing Page if page is in AdminDashboard and its children dont display it -->
    <Navigation v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <router-view />
    <Footer v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <SocialMediaIcons v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <MembershipJourneyBanner v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    
    <!-- AI Church Assistant (Public Only) -->
    <AIChatbot v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>

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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnnouncementStore } from '@/stores/announcementStore'
import AnnouncementDisplayDialog from '@/components/Dialogs/AnnouncementDisplayDialog.vue'
import { checkAccessTokenValidity } from '@/utils/tokenValidation'
import Navigation from './components/LandingPage/Navigation.vue'
import PageLoader from './components/Common/PageLoader.vue'
import Footer from './components/LandingPage/Footer.vue'
import SocialMediaIcons from './components/LandingPage/SocialMediaIcons.vue'
import MembershipJourneyBanner from './components/LandingPage/MembershipJourneyBanner.vue'
import AIChatbot from './components/Common/AIChatbot.vue'


const announcementStore = useAnnouncementStore()
const activeAnnouncements = ref([])
const announcementDialogs = reactive({})
const userInfo = ref(localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null)
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

// Inactivity timeout (1 hour)
const INACTIVITY_LIMIT = 1000 * 60 * 60
const lastActivity = ref(Date.now())
let inactivityInterval = null
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

const resetInactivityTimer = () => {
  lastActivity.value = Date.now()
  // Also store in localStorage to sync across tabs if needed
  localStorage.setItem('last_interaction', lastActivity.value.toString())
}

const performLogout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  userInfo.value = null
  router.push({ name: 'LandingPage' })
  
  // Force a reload to clear all state if we were on a protected route
  if (route.path.startsWith('/admin') || route.path.startsWith('/dashboard')) {
    window.location.reload()
  }
}

onMounted(async () => {
  // 1. Initial token check
  const initialValidation = checkAccessTokenValidity()
  if (!initialValidation.success && localStorage.getItem('userInfo')) {
    performLogout()
  }

  // 2. Set up inactivity listeners
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  activityEvents.forEach(event => {
    window.addEventListener(event, resetInactivityTimer)
  })

  // 3. Periodic check for inactivity and token validity
  // Check every 1 minute
  inactivityInterval = setInterval(() => {
    // A. Check for inactivity
    const lastInteraction = parseInt(localStorage.getItem('last_interaction') || lastActivity.value.toString())
    const now = Date.now()
    
    if (localStorage.getItem('userInfo') && (now - lastInteraction > INACTIVITY_LIMIT)) {
      console.log('Session expired due to inactivity')
      performLogout()
      return
    }

    // B. Check token validity (JWT exp claim)
    // Since we extended JWT to 7 days, this will rarely hit unless really old
    const tokenValidation = checkAccessTokenValidity()
    if (localStorage.getItem('userInfo') && !tokenValidation.success) {
      console.log('Session expired due to token expiration')
      performLogout()
    }
  }, 1000 * 60) // Check every minute

  // Fetch announcements when app loads for all users
  await fetchActiveAnnouncements()
  
  // Hide loading screen after content is loaded
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})

onUnmounted(() => {
  // Clean up activity listeners
  activityEvents.forEach(event => {
    window.removeEventListener(event, resetInactivityTimer)
  })
  
  // Clean up interval
  if (inactivityInterval) {
    clearInterval(inactivityInterval)
  }
})
</script>

<style scoped>
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
