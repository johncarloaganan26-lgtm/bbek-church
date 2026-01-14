<template>
  <v-app>
    <!-- Navigation should only display for Landing Page if page is in AdminDashboard and its children dont display it -->
    <Navigation v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <router-view />
    <Footer v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
    <SocialMediaIcons v-if=" !route.path.startsWith('/admin') && !route.path.startsWith('/change-password')"/>
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

const announcementStore = useAnnouncementStore()
const activeAnnouncements = ref([])
const announcementDialogs = reactive({})
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || '{}' || null)
const route = useRoute()
const router = useRouter()

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
    
    // Fetch announcements for all users (logged-in and visitors)
    await fetchActiveAnnouncements()
  }, 1000 * 60 * 60)
  // Fetch announcements when app loads for all users
  await fetchActiveAnnouncements()
})
</script>
