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
      <v-row>
        <!-- Church Info -->
        <v-col cols="12" md="6" lg="3">
          <div class="d-flex align-center mb-4">
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
              <h3 class="text-h6 font-weight-bold text-white mb-0">{{ footerData.churchName || 'Bible Baptist' }}</h3>
              <p class="text-body-2 text-white font-weight-medium mb-0">
                {{ footerData.churchSubname || 'Ekklesia of Kawit' }}
              </p>
              <p class="text-caption text-white mb-0" style="text-transform: lowercase;">
                bible
              </p>
            </div>
          </div>
        </v-col>

        <!-- Quick Links -->
        <v-col cols="12" md="6" lg="3">
          <h4 class="footer-heading text-white text-uppercase mb-4">
            QUICK LINKS
          </h4>
          <v-list density="compact" class="pa-0 quick-links-list" color="transparent">
            <v-list-item
              v-for="link in footerData.quickLinks"
              :key="link.label || link.to || link.value"
              :to="link.to"
              class="text-white footer-link"
            >
              {{ link.label }}
            </v-list-item>
          </v-list>
        </v-col>

        <!-- Service Times -->
        <v-col cols="12" md="6" lg="3">
          <h4 class="footer-heading text-white text-uppercase mb-4">
            SERVICE TIMES
          </h4>
          <div class="mb-3">
            <p class="text-body-2 text-white mb-1">Sunday Worship</p>
            <p class="text-body-2 text-white mb-1">{{ footerData.sundayService || '9:30 AM - 12:00 PM' }}</p>
          </div>
          <div>
            <p class="text-body-2 text-white mb-1">Wednesday Service</p>
            <p class="text-body-2 text-white mb-1">{{ footerData.wednesdayService || '7:00 PM - 9:00 PM' }}</p>
          </div>
        </v-col>

        <!-- Contact & Social -->
        <v-col cols="12" md="6" lg="3">
          <h4 class="footer-heading text-white text-uppercase mb-4">
            CONNECT
          </h4>
          <div class="mb-3">
            <div class="d-flex align-start mb-2">
              <v-icon icon="mdi-map-marker" size="20" color="white" class="mr-2 mt-1"></v-icon>
              <p class="text-body-2 text-white">
                {{ footerData.address || '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite' }}
              </p>
            </div>
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-phone" size="20" color="white" class="mr-2"></v-icon>
              <p class="text-body-2 text-white">
                {{ footerData.phone || '09615996049' }}
              </p>
            </div>
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-email" size="20" color="white" class="mr-2"></v-icon>
              <a
                :href="`mailto:${footerData.email || 'biblebaptistekklesiaofkawit@gmail.com'}`"
                class="text-body-2 text-white text-decoration-none"
              >
                {{ footerData.email || 'biblebaptistekklesiaofkawit@gmail.com' }}
              </a>
            </div>
            <div class="d-flex align-center mt-3">
              <v-btn
                icon
                size="small"
                color="grey-darken-3"
                variant="flat"
                :href="footerData.facebookUrl || 'https://www.facebook.com/biblebaptist.ekklesiaofkawit'"
                target="_blank"
                class="facebook-btn"
              >
                <v-icon color="white">mdi-facebook</v-icon>
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>


    <!-- Watch Live Button -->
    <v-btn
      class="watch-live-btn"
      color="grey-darken-4"
      size="large"
      rounded="lg"
      @click="$router.push('/live')"
    >
      <v-icon color="red" class="mr-2">mdi-play</v-icon>
      <span class="text-white">Watch Live</span>
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
}

.logo-text {
  position: relative;
  z-index: 2;
  color: #14b8a6;
  font-weight: bold;
  font-size: 14px;
}

.logo-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.footer-heading {
  font-size: 12px;
  font-weight: bold;
  text-decoration: underline;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.quick-links-list {
  background-color: transparent !important;
  overflow: visible !important;
}

.quick-links-list :deep(.v-list) {
  background-color: transparent !important;
  overflow: visible !important;
}

.quick-links-list :deep(.v-list__wrapper) {
  overflow: visible !important;
}

.quick-links-list :deep(.v-list__container) {
  overflow: visible !important;
}

/* Hide scrollbars */
.quick-links-list :deep(.v-list__wrapper::-webkit-scrollbar) {
  display: none !important;
}

.quick-links-list :deep(.v-list__wrapper) {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.quick-links-list :deep(.v-list__container::-webkit-scrollbar) {
  display: none !important;
}

.quick-links-list :deep(.v-list__container) {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.v-list-item {
  min-height: 32px;
  padding: 4px 0;
  position: relative;
  z-index: 1;
  background-color: transparent !important;
}

.v-list-item :deep(.v-list-item-title) {
  color: white !important;
}

.v-list-item :deep(.v-list-item__prepend),
.v-list-item :deep(.v-list-item__content),
.v-list-item :deep(.v-list-item__append) {
  background-color: transparent !important;
}

/* Floating Social Media Icons */
.floating-social-icons {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.social-icon-btn {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
}

.watch-live-btn {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 10;
  background-color: rgba(33, 33, 33, 0.9) !important;
  border: 1px solid rgba(33, 33, 33, 0.9);
  transition: all 0.3s ease;
}

.watch-live-btn:hover {
  background-color: rgba(33, 33, 33, 1) !important;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.facebook-btn {
  width: 40px !important;
  height: 40px !important;
}

/* Footer link transitions */
:deep(.v-list-item) {
  transition: all 0.3s ease;
}

:deep(.v-list-item:hover) {
  transform: translateX(4px);
  color: #0d9488 !important;
}

/* Ensure text is white in footer columns */
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

