<template>
  <v-footer
    class="footer-container position-relative"
    :style="{ backgroundColor: footerData.bgColor || '#14b8a6' }"
  >
    <!-- Background Watermark -->
    <div class="footer-watermark">
      <v-img
        v-if="headerLogo"
        :src="headerLogo"
        alt="Footer Watermark"
        class="watermark-image"
        cover
      ></v-img>
    </div>

    <v-container>
      <v-row class="py-8">
        <!-- Church Identity -->
        <v-col cols="12" md="4" class="text-center text-md-left">
          <div class="d-flex align-center justify-center justify-md-start mb-4">
            <div class="logo-container mr-3">
              <div class="logo-circle">
                <v-img
                  v-if="headerLogo"
                  :src="headerLogo"
                  alt="Footer Logo"
                  cover
                  class="logo-image"
                ></v-img>
                <img v-else  src="/img/logobbek.png" alt="BBEK Logo" />
              </div>
            </div>
            <div>
              <h3 class="church-name text-white mb-1">{{ footerData.churchName || 'Bible Baptist' }}</h3>
              <p class="church-subtitle text-white mb-2">
                {{ footerData.churchSubname || 'Ekklesia of Kawit' }}
              </p>
              <p class="bible-verse text-white-80 mb-0">
                "{{ footerData.bibleVerse || 'For where two or three gather in my name, there am I with them.' }}" - {{ footerData.bibleReference || 'Matthew 18:20' }}
              </p>
            </div>
          </div>
        </v-col>

        <!-- Service Times & Ministries -->
        <v-col cols="12" md="4" class="text-center">
          <h4 class="footer-heading text-white mb-4">{{ footerData.worshipSectionTitle || 'Worship With Us' }}</h4>

          <div class="service-info mb-4">
            <div class="mb-3">
              <v-icon icon="mdi-church" size="18" color="white" class="mr-2"></v-icon>
              <span class="text-body-2 font-weight-medium text-white">Sunday: {{ footerData.sundayService || '9:30 AM - 12:00 PM' }}</span>
            </div>
            <div class="mb-3">
              <v-icon icon="mdi-candle" size="18" color="white" class="mr-2"></v-icon>
              <span class="text-body-2 font-weight-medium text-white">Wednesday: {{ footerData.wednesdayService || '7:00 PM - 9:00 PM' }}</span>
            </div>
          </div>

          <div class="ministries-section">
            <p class="text-body-2 text-white-80 mb-2">{{ footerData.ministriesTitle || 'Our Ministries' }}: {{ footerData.ministriesList || 'Youth • Worship • Outreach • Children' }}</p>
          </div>
        </v-col>

        <!-- Contact & Connect -->
        <v-col cols="12" md="4" class="text-center text-md-right">
          <h4 class="footer-heading text-white mb-4">{{ footerData.connectSectionTitle || 'Connect With Us' }}</h4>

          <div class="contact-details mb-4">
            <div class="mb-2">
              <v-icon icon="mdi-map-marker" size="16" color="white" class="mr-2"></v-icon>
              <span class="text-body-2 text-white">{{ footerData.address || '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite' }}</span>
            </div>
            <div class="mb-2">
              <v-icon icon="mdi-phone" size="16" color="white" class="mr-2"></v-icon>
              <span class="text-body-2 text-white">{{ footerData.phone || '09615996049' }}</span>
            </div>
            <div class="mb-2">
              <v-icon icon="mdi-email" size="16" color="white" class="mr-2"></v-icon>
              <a
                :href="`mailto:${footerData.email || 'biblebaptistekklesiaofkawit@gmail.com'}`"
                class="text-body-2 text-white text-decoration-none"
              >
                {{ footerData.email || 'biblebaptistekklesiaofkawit@gmail.com' }}
              </a>
            </div>
          </div>

          <!-- Social Media -->
          <div class="social-media">
            <v-btn
              icon
              size="small"
              variant="text"
              color="white"
              :href="footerData.facebookUrl || 'https://www.facebook.com/biblebaptist.ekklesiaofkawit'"
              target="_blank"
              class="social-btn mr-2"
            >
              <v-icon>mdi-facebook</v-icon>
            </v-btn>
            <v-btn
              v-if="footerData.youtubeUrl"
              icon
              size="small"
              variant="text"
              color="white"
              :href="footerData.youtubeUrl"
              target="_blank"
              class="social-btn"
            >
              <v-icon>mdi-youtube</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Quick Links Row -->
      <v-row class="py-4 border-top">
        <v-col cols="12" class="text-center">
          <div class="quick-links">
            <v-btn
              v-for="link in footerData.quickLinks || []"
              :key="link.label"
              :to="link.to"
              variant="text"
              size="small"
              color="white"
              class="quick-link-btn mx-2"
            >
              {{ link.label }}
            </v-btn>
          </div>
        </v-col>
      </v-row>

    </v-container>

    <!-- Watch Live Button -->
    <v-btn
      class="watch-live-btn"
      color="grey-darken-4"
      size="x-large"
      rounded="lg"
      elevation="6"
      @click="$router.push('/live')"
    >
      <v-icon color="red" size="large" class="mr-2">mdi-play</v-icon>
      <span class="text-white font-weight-bold">Watch Live</span>
    </v-btn>
  </v-footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/api/axios'
import { useCmsStore } from '@/stores/cmsStore'

const cmsStore = useCmsStore()

// Default footer data
const defaultFooterData = {
  bgColor: '#14b8a6',
  logo: '',
  acronym: 'BBEK',
  churchName: 'Bible Baptist',
  churchSubname: 'Ekklesia of Kawit',
  missionStatement: '',
  visionStatement: '',
  website: '',
  bibleVerse: 'For where two or three gather in my name, there am I with them.',
  bibleReference: 'Matthew 18:20',
  worshipSectionTitle: 'Worship With Us',
  connectSectionTitle: 'Connect With Us',
  ministriesTitle: 'Our Ministries',
  ministriesList: 'Youth • Worship • Outreach • Children',
  quickLinks: [
    { label: 'About Us', to: '/about/aboutus' },
    { label: 'Ministries', to: '/ministries' },
    { label: 'Events', to: '/events' },
    { label: 'Give', to: '/give' },
    { label: 'Be One of Us', to: '/beoneofus/accept-jesus' }
  ],
  sundayService: '9:30 AM - 12:00 PM',
  wednesdayService: '7:00 PM - 9:00 PM',
  address: '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite',
  phone: '09615996049',
  email: 'biblebaptistekklesiaofkawit@gmail.com',
  facebookUrl: 'https://www.facebook.com/biblebaptist.ekklesiaofkawit',
  youtubeUrl: ''
}

// Initialize footerData with default values
const footerData = ref({ ...defaultFooterData })

// Header logo (from tbl_cms_header)
const headerLogo = ref('')

// Fetch header logo from CMS API (tbl_cms_header)
const fetchHeaderLogo = async () => {
  try {
    // Check if header data is already cached in store
    const cachedHeaderData = cmsStore.getPageData('header')
    
    let headerImages
    
    if (cachedHeaderData && cachedHeaderData.images) {
      // Use cached data from store
      headerImages = cachedHeaderData.images
    } else {
      // Not cached, fetch directly
      const response = await axios.get('/cms/header/full')
      
      if (response.data.success && response.data.data) {
        headerImages = response.data.data.images
        
        // Cache it for future use (if store method exists)
        if (cmsStore.pageCache && !cmsStore.pageCache.header) {
          cmsStore.pageCache.header = {
            page: response.data.data.page,
            images: headerImages
          }
        }
      }
    }
    
    // Get logo from header images (base64 data URL)
    if (headerImages?.logo) {
      headerLogo.value = headerImages.logo
    }
  } catch (error) {
    // If 404 or error, use default (empty)
    if (error.response?.status !== 404) {
      console.error('Error fetching header logo from CMS:', error)
    }
  }
}

// Fetch footer data from CMS API
// First checks cmsStore cache (populated by LandingPage sequential load)
// If not cached, fetches directly
const fetchFooterData = async () => {
  try {
    // Check if footer data is already cached in store (from LandingPage sequential load)
    const cachedData = cmsStore.getPageData('footer')
    
    let page, images, content
    
    if (cachedData) {
      // Use cached data from sequential load
      console.log('✅ Using cached footer data from store')
      page = cachedData.page
      images = cachedData.images
      content = cachedData.content || {}
    } else {
      // Not cached, fetch directly
      console.log('📥 Fetching footer data directly...')
      const response = await axios.get('/cms/footer/full')
      
      if (response.data.success && response.data.data) {
        page = response.data.data.page
        images = response.data.data.images
        content = page?.content || {}
        
        // Cache it for future use
        cmsStore.pageCache.footer = {
          page,
          images,
          content
        }
      } else {
        // No data in response
        page = null
        images = null
        content = {}
      }
    }
    
    if (page && images) {
      // Parse quickLinks - ensure it's an array with proper structure
      let quickLinks = content.quickLinks || defaultFooterData.quickLinks
      if (!Array.isArray(quickLinks)) {
        quickLinks = defaultFooterData.quickLinks
      } else {
        // Ensure each link has at least a label
        quickLinks = quickLinks.map(link => ({
          label: link.label || '',
          to: link.to || link.route || null,
          ...link
        })).filter(link => link.label) // Remove links without labels
      }
      
      // Merge fetched data with defaults (note: logo is now from header, not footer)
      footerData.value = {
        bgColor: content.bgColor || defaultFooterData.bgColor,
        logo: '', // Logo comes from header, not footer
        acronym: content.acronym || defaultFooterData.acronym,
        churchName: content.churchName || defaultFooterData.churchName,
        churchSubname: content.churchSubname || defaultFooterData.churchSubname,
        missionStatement: content.missionStatement || defaultFooterData.missionStatement,
        visionStatement: content.visionStatement || defaultFooterData.visionStatement,
        website: content.website || defaultFooterData.website,
        bibleVerse: content.bibleVerse || defaultFooterData.bibleVerse,
        bibleReference: content.bibleReference || defaultFooterData.bibleReference,
        worshipSectionTitle: content.worshipSectionTitle || defaultFooterData.worshipSectionTitle,
        connectSectionTitle: content.connectSectionTitle || defaultFooterData.connectSectionTitle,
        ministriesTitle: content.ministriesTitle || defaultFooterData.ministriesTitle,
        ministriesList: content.ministriesList || defaultFooterData.ministriesList,
        quickLinks: quickLinks,
        sundayService: content.sundayService || defaultFooterData.sundayService,
        wednesdayService: content.wednesdayService || defaultFooterData.wednesdayService,
        address: content.address || defaultFooterData.address,
        phone: content.phone || defaultFooterData.phone,
        email: content.email || defaultFooterData.email,
        facebookUrl: content.facebookUrl || defaultFooterData.facebookUrl,
        youtubeUrl: content.youtubeUrl || defaultFooterData.youtubeUrl
      }
      
      console.log('Footer data loaded from CMS:', footerData.value)
    } else {
      console.warn('No footer data found in CMS, using default')
    }
  } catch (error) {
    // If 404, that's okay - use default data
    if (error.response?.status === 404) {
      console.log('Footer data not found in CMS, using default')
    } else {
      console.error('Error fetching footer data from CMS:', error)
    }
    // Keep default data on error
  }
}

onMounted(async () => {
  // Fetch header logo from CMS API (tbl_cms_header)
  await fetchHeaderLogo()
  
  // Fetch footer data from CMS API
  await fetchFooterData()
})
</script>

<style scoped>
.footer-container {
  position: relative;
  padding-bottom: 80px !important;
  overflow: hidden;
}

/* Background Watermark */
.footer-watermark {
  position: absolute;
  right: -100px;
  top: 50%;
  transform: translateY(-50%);
  width: 600px;
  height: 600px;
  opacity: 0.15;
  pointer-events: none;
  z-index: 0;
}

.watermark-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Logo and Church Identity */
.logo-container {
  position: relative;
}

.logo-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 2px solid #14b8a6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.logo-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* Church Name Styling */
.church-name {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 4px !important;
}

.church-subtitle {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 14px;
  font-weight: 400;
  font-style: italic;
  letter-spacing: 0.3px;
  opacity: 0.9;
}

.bible-verse {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 12px;
  font-style: italic;
  line-height: 1.4;
  opacity: 0.8;
  border-left: 3px solid rgba(255, 255, 255, 0.3);
  padding-left: 8px;
  margin-top: 8px !important;
}

/* Footer Headings */
.footer-heading {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Georgia', 'Times New Roman', serif;
  text-decoration: none;
  letter-spacing: 1px;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
  color: #ffffff;
}

.footer-heading::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ffffff, transparent);
}

/* Service Info */
.service-info {
  margin-bottom: 16px;
}

.service-info .text-body-2 {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}

/* Ministries Section */
.ministries-section {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 12px;
}

.ministries-section .text-body-2 {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Contact Details */
.contact-details {
  margin-bottom: 16px;
}

.contact-details .text-body-2 {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 14px;
  line-height: 1.5;
}

/* Social Media */
.social-media {
  margin-top: 8px;
}

.social-btn {
  transition: all 0.3s ease;
}

.social-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  transform: translateY(-1px);
}

/* Quick Links */
.quick-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.quick-link-btn {
  text-transform: none !important;
  font-size: 12px !important;
  padding: 4px 12px !important;
  min-height: auto !important;
  border-radius: 16px !important;
}

.quick-link-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

/* Border Top */
.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* Watch Live Button */
.watch-live-btn {
  position: absolute;
  bottom: 32px;
  right: 32px;
  z-index: 10;
  background-color: rgba(33, 33, 33, 0.95) !important;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s ease;
  min-width: 160px !important;
  height: 56px !important;
  font-size: 16px !important;
}

.watch-live-btn:hover {
  background-color: rgba(33, 33, 33, 1) !important;
  transform: translateY(-6px) scale(1.08);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.4) !important;
}

/* Copyright Text */
.copyright-text {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 12px;
  font-style: italic;
  letter-spacing: 0.3px;
  line-height: 1.5;
}

/* Text Colors */
.text-white-70 {
  color: rgba(255, 255, 255, 0.7) !important;
}

.text-white-80 {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .footer-container {
    padding-bottom: 100px !important;
  }

  .footer-watermark {
    right: -150px;
    width: 400px;
    height: 400px;
  }

  .watch-live-btn {
    bottom: 20px;
    right: 20px;
    min-width: 140px !important;
    height: 48px !important;
    font-size: 14px !important;
  }

  .watch-live-btn .v-icon {
    font-size: 18px !important;
  }

  .quick-links {
    gap: 4px;
  }

  .quick-link-btn {
    font-size: 11px !important;
    padding: 2px 8px !important;
  }
}

/* Ensure proper z-indexing */
:deep(.v-col) {
  position: relative;
  z-index: 1;
}

:deep(.text-body-2),
:deep(.text-caption) {
  color: white !important;
}

:deep(h3),
:deep(h4),
:deep(p) {
  color: white !important;
}

/* Social media button transitions */
:deep(.v-btn) {
  transition: all 0.3s ease;
}

:deep(.v-btn:hover) {
  transform: scale(1.1);
}

@media (max-width: 960px) {
  .floating-social-icons {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    flex-direction: row;
    justify-content: center;
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .watch-live-btn {
    position: relative;
    bottom: auto;
    right: auto;
    margin-top: 16px;
    width: 100%;
  }

  .footer-watermark {
    display: none;
  }

  .footer-container {
    padding-bottom: 100px !important;
  }
}

@media (max-width: 640px) {
  .footer-container {
    padding-bottom: 120px !important;
  }

  .footer-container :deep(.v-container) {
    padding: 24px 16px !important;
  }

  .footer-container :deep(.v-col) {
    margin-bottom: 24px;
  }

  .logo-circle {
    width: 48px !important;
    height: 48px !important;
  }

  .footer-heading {
    font-size: 11px !important;
  }

  .footer-container :deep(.text-h6) {
    font-size: 1rem !important;
  }

  .footer-container :deep(.text-body-2) {
    font-size: 0.8125rem !important;
  }

  .watch-live-btn {
    position: fixed;
    bottom: 16px;
    right: 16px;
    left: auto;
    width: auto;
    min-width: 120px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>

