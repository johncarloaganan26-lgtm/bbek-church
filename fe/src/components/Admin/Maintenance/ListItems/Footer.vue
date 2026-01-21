<template>
  <div class="footer-list">
    <!-- Background Color -->
    <div class="list-item">
      <div class="item-label">Background Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: footerData.bgColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="footerData.bgColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Logo -->
    <div class="list-item">
      <div class="item-label">Logo</div>
      <div class="item-preview">
        <span class="text-grey">Managed in database</span>
      </div>
      <div class="item-action">
        <span class="text-grey">Managed in database</span>
      </div>
    </div>
    <el-divider />

    <!-- Church Name -->
    <div class="list-item">
      <div class="item-label">Church Name</div>
      <div class="item-preview">
        <div class="church-name-preview">
          <span class="text-bold">{{ footerData.churchName }}</span>
          <span class="text-grey text-sm">{{ footerData.churchSubname }}</span>
        </div>
      </div>
      <div class="item-action">
        <div class="church-name-inputs">
          <el-input
            v-model="footerData.churchName"
            size="small"
            placeholder="Church name"
            style="max-width: 300px; margin-bottom: 8px;"
          ></el-input>
          <el-input
            v-model="footerData.churchSubname"
            size="small"
            placeholder="Church subname"
            style="max-width: 300px;"
          ></el-input>
        </div>
      </div>
    </div>
    <el-divider />

    <!-- Mission Statement -->
    <div class="list-item">
      <div class="item-label">Mission Statement</div>
      <div class="item-preview">
        <span class="text-grey">{{ footerData.missionStatement || 'Loading...' }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.missionStatement"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter mission statement"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Vision Statement -->
    <div class="list-item">
      <div class="item-label">Vision Statement</div>
      <div class="item-preview">
        <span class="text-grey">{{ footerData.visionStatement || 'Loading...' }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.visionStatement"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter vision statement"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Website -->
    <div class="list-item">
      <div class="item-label">Website</div>
      <div class="item-preview">
        <span class="text-grey">{{ footerData.website || 'Loading...' }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.website"
          size="small"
          placeholder="Enter website URL"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Quick Links Section -->
    <div class="quick-links-section">
      <div class="section-header">
        <h3 class="section-title">Quick Links</h3>
        <span class="section-count">{{ footerData.quickLinks?.length || 0 }} items</span>
      </div>

      <div class="quick-links-container">
        <div
          v-for="(link, idx) in footerData.quickLinks"
          :key="`link-${idx}`"
          class="quick-link-card"
        >
          <div class="quick-link-header">
            <div class="quick-link-main">
              <div class="link-number-badge">{{ idx + 1 }}</div>
              <div class="link-content">
                <div class="link-fields">
                  <el-input
                    v-model="link.label"
                    size="default"
                    placeholder="Quick link label"
                    class="link-input"
                  />
                  <el-input
                    v-model="link.to"
                    size="default"
                    placeholder="Route (e.g., /about/aboutus)"
                    class="link-input"
                    style="margin-top: 8px;"
                  />
                </div>
                <div class="link-meta">
                  <span class="link-value">{{ link.label }}</span>
                  <span class="link-value">{{ link.to || 'No route' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-divider />

    <!-- Sunday Service -->
    <div class="list-item">
      <div class="item-label">Sunday Service</div>
      <div class="item-preview">
        <span>{{ footerData.sundayService }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.sundayService"
          size="small"
          placeholder="e.g., 9:30 AM - 12:00 PM"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Wednesday Service -->
    <div class="list-item">
      <div class="item-label">Wednesday Service</div>
      <div class="item-preview">
        <span>{{ footerData.wednesdayService }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.wednesdayService"
          size="small"
          placeholder="e.g., 7:00 PM - 9:00 PM"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Address -->
    <div class="list-item">
      <div class="item-label">Address</div>
      <div class="item-preview">
        <span>{{ footerData.address }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.address"
          type="textarea"
          :rows="2"
          size="small"
          placeholder="Enter address"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Phone -->
    <div class="list-item">
      <div class="item-label">Phone</div>
      <div class="item-preview">
        <span>{{ footerData.phone }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.phone"
          size="small"
          placeholder="Enter phone number"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Email -->
    <div class="list-item">
      <div class="item-label">Email</div>
      <div class="item-preview">
        <span>{{ footerData.email }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.email"
          size="small"
          placeholder="Enter email address"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Bible Verse -->
    <div class="list-item">
      <div class="item-label">Bible Verse</div>
      <div class="item-preview">
        <div class="bible-verse-preview">
          <span class="text-grey">"{{ footerData.bibleVerse || 'Loading...' }}"</span>
          <span class="text-grey text-sm">- {{ footerData.bibleReference || 'Loading...' }}</span>
        </div>
      </div>
      <div class="item-action">
        <div class="bible-verse-inputs">
          <el-input
            v-model="footerData.bibleVerse"
            size="small"
            placeholder="Enter Bible verse text"
            style="max-width: 400px; margin-bottom: 8px;"
          ></el-input>
          <el-input
            v-model="footerData.bibleReference"
            size="small"
            placeholder="Enter Bible reference (e.g., Matthew 18:20)"
            style="max-width: 300px;"
          ></el-input>
        </div>
      </div>
    </div>
    <el-divider />

    <!-- Worship Section Title -->
    <div class="list-item">
      <div class="item-label">Worship Section Title</div>
      <div class="item-preview">
        <span class="text-grey">{{ footerData.worshipSectionTitle || 'Loading...' }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.worshipSectionTitle"
          size="small"
          placeholder="Enter worship section title"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Connect Section Title -->
    <div class="list-item">
      <div class="item-label">Connect Section Title</div>
      <div class="item-preview">
        <span class="text-grey">{{ footerData.connectSectionTitle || 'Loading...' }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.connectSectionTitle"
          size="small"
          placeholder="Enter connect section title"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Ministries Title -->
    <div class="list-item">
      <div class="item-label">Ministries Title</div>
      <div class="item-preview">
        <span class="text-grey">{{ footerData.ministriesTitle || 'Loading...' }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.ministriesTitle"
          size="small"
          placeholder="Enter ministries section title"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Ministries List -->
    <div class="list-item">
      <div class="item-label">Ministries List</div>
      <div class="item-preview">
        <span class="text-grey">{{ footerData.ministriesList || 'Loading...' }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.ministriesList"
          size="small"
          placeholder="Enter ministries list (e.g., Youth • Worship • Outreach • Children)"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Facebook URL -->
    <div class="list-item">
      <div class="item-label">Facebook URL</div>
      <div class="item-preview">
        <a
          v-if="footerData.facebookUrl"
          :href="footerData.facebookUrl"
          target="_blank"
          class="link-preview"
        >
          Facebook Page
        </a>
        <span v-else class="text-grey">No URL set</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="footerData.facebookUrl"
          size="small"
          placeholder="Enter Facebook URL"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
  </div>

  <!-- Fixed Actions Bar -->
  <div class="actions-row-fixed">
    <div class="actions-container">
      <el-button type="primary" size="default" :loading="saving" :disabled="saving" @click="saveChanges">
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </el-button>
    </div>
  </div>

  <!-- Loader Dialog -->
  <Loader :loading="loading || saving" />
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useCms } from '@/composables/useCms'
import Loader from './Loader.vue'

// Use props if provided, otherwise use mock data
const props = defineProps({
  footerData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'footer'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('footer')

// Default data structure
const defaultFooterData = {
  bgColor: '#000000',
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
  facebookUrl: 'https://www.facebook.com/biblebaptist.ekklesiaofkawit'
}

// Create reactive copy of prop data or use default
const createReactiveCopy = (data) => {
  if (!data) return reactive(JSON.parse(JSON.stringify(defaultFooterData)))
  const cloned = JSON.parse(JSON.stringify(data))
  // Ensure quickLinks array is reactive
  if (cloned.quickLinks && Array.isArray(cloned.quickLinks)) {
    cloned.quickLinks = cloned.quickLinks.map(link => ({ ...link }))
  }
  return reactive(cloned)
}

const footerData = props.footerData
  ? createReactiveCopy(props.footerData)
  : reactive(JSON.parse(JSON.stringify(defaultFooterData)))

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'footer') {
    const loadedData = await loadPageData()
    if (loadedData) {
      // Merge loaded data into footerData
      Object.keys(loadedData).forEach(key => {
        if (key === 'quickLinks' && Array.isArray(loadedData[key])) {
          footerData.quickLinks = loadedData[key].map(link => ({ ...link }))
        } else {
          footerData[key] = loadedData[key]
        }
      })
    }
  }
})

// Watch for prop changes
watch(() => props.footerData, (newData) => {
  if (newData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    // Update quickLinks array
    if (cloned.quickLinks && Array.isArray(cloned.quickLinks)) {
      footerData.quickLinks = cloned.quickLinks.map(link => ({ ...link }))
    }
    // Update other properties
    Object.keys(cloned).forEach(key => {
      if (key !== 'quickLinks') {
        footerData[key] = cloned[key]
      }
    })
  }
}, { deep: true })

// Save changes to CMS
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    // Prepare content (remove logo if it's base64, handle separately)
    const contentToSave = JSON.parse(JSON.stringify(footerData))
    const imagesToSave = {}
    
    // Extract logo image if it's base64
    if (contentToSave.logo && typeof contentToSave.logo === 'string' && contentToSave.logo.startsWith('data:')) {
      imagesToSave.logo = contentToSave.logo
      delete contentToSave.logo
    }
    
    // Ensure quickLinks have proper structure
    if (contentToSave.quickLinks && Array.isArray(contentToSave.quickLinks)) {
      contentToSave.quickLinks = contentToSave.quickLinks.map(link => ({
        label: link.label || '',
        to: link.to || link.route || null
      })).filter(link => link.label) // Remove links without labels
    }
    
    // Save to CMS
    const success = await savePageData(contentToSave, imagesToSave)
    
    if (success) {
      // Reload data to get updated version
      const loadedData = await loadPageData()
      if (loadedData) {
        Object.keys(loadedData).forEach(key => {
          if (key === 'quickLinks' && Array.isArray(loadedData[key])) {
            footerData.quickLinks = loadedData[key].map(link => ({ ...link }))
          } else {
            footerData[key] = loadedData[key]
          }
        })
      }
    }
  } catch (error) {
    console.error('Error saving footer page:', error)
  }
}
</script>

<style scoped>
.footer-list {
  width: 100%;
  padding-bottom: 80px; /* Add padding to prevent content from being hidden behind fixed button */
}

.list-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  gap: 16px;
}

.item-label {
  font-weight: 500;
  min-width: 150px;
  color: #606266;
}

.item-preview {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-action {
  min-width: 300px;
  display: flex;
  justify-content: flex-end;
}

.color-preview {
  width: 80px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.text-bold {
  font-weight: 600;
}

.text-lg {
  font-size: 18px;
}

.text-sm {
  font-size: 14px;
}

.text-grey {
  color: #909399;
  font-size: 12px;
}

.church-name-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.church-name-inputs {
  display: flex;
  flex-direction: column;
}

.link-preview {
  color: #409eff;
  text-decoration: none;
}

.link-preview:hover {
  text-decoration: underline;
}

/* Quick Links Section Styles */
.quick-links-section {
  width: 100%;
  margin-top: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.section-count {
  font-size: 14px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 12px;
}

.quick-links-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-link-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.quick-link-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.quick-link-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.quick-link-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.link-number-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.link-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-input {
  width: 100%;
  max-width: 400px;
}

.link-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
}

.link-value {
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.actions-row-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid #e4e7ed;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 16px 24px;
}

.actions-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>

