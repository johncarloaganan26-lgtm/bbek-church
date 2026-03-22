<template>
  <div class="church-leader-list">
    <div class="cms-notice mb-6">
      <el-alert
        title="Page Settings"
        type="info"
        description="This section manages the header and visual settings for the Church Leadership page. Individual leader profiles (names, bios, images) are now managed in the 'Church Records > Church Leaders' section."
        show-icon
        :closable="false"
      />
    </div>

    <!-- Hero Image -->
    <div class="list-item">
      <div class="item-label">Hero Image</div>
      <div class="item-preview">
        <el-image
          v-if="leaderData.heroImage"
          :src="leaderData.heroImage"
          fit="cover"
          class="preview-image"
        />
        <span v-else class="text-grey">No file chosen</span>
      </div>
      <div class="item-action">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleHeroImageChange"
        >
          <template #trigger>
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              Choose File
            </el-button>
          </template>
        </el-upload>
      </div>
    </div>
    <el-divider />

    <!-- Hero Title -->
    <div class="list-item">
      <div class="item-label">Hero Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ leaderData.heroTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="leaderData.heroTitle"
          size="small"
          placeholder="Enter hero title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Hero Subtitle -->
    <div class="list-item">
      <div class="item-label">Hero Subtitle</div>
      <div class="item-preview">
        <span class="text-grey">{{ leaderData.heroSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="leaderData.heroSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter hero subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Section Background Color -->
    <div class="list-item">
      <div class="item-label">Section Background Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: leaderData.sectionBackgroundColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="leaderData.sectionBackgroundColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Section Title -->
    <div class="list-item">
      <div class="item-label">Section Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ leaderData.sectionTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="leaderData.sectionTitle"
          size="small"
          placeholder="Enter section title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Back Button Text -->
    <div class="list-item">
      <div class="item-label">Back Button Text</div>
      <div class="item-preview">
        <el-button
          :style="{ backgroundColor: leaderData.backButtonColor, borderColor: leaderData.backButtonColor }"
          size="small"
          type="primary"
        >
          {{ leaderData.backButtonText }}
        </el-button>
      </div>
      <div class="item-action">
        <el-input
          v-model="leaderData.backButtonText"
          size="small"
          placeholder="Button text"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Back Button Color -->
    <div class="list-item">
      <div class="item-label">Back Button Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: leaderData.backButtonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="leaderData.backButtonColor"
          size="small"
        ></el-color-picker>
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
import { Upload, Plus } from '@element-plus/icons-vue'
import { useCms } from '@/composables/useCms'
import Loader from './Loader.vue'

const props = defineProps({
  leaderData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'churchLeaders'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('churchleader')

// Default data structure aligned with landing page
const defaultLeaderData = {
  heroImage: '',
  heroTitle: 'Church Leadership',
  heroSubtitle: 'Dedicated men and women leading our church community with faith, wisdom, and service.',
  sectionTitle: 'Meet Our Leaders',
  leaders: [
    {
      name: 'Rev. Fresco Q. Sulapas',
      position: 'Senior Pastor',
      bio: 'Serving our congregation with passion and commitment to the Word of God and the Great Commission.',
      image: ''
    },
    {
      name: 'Rev. Rodolfo Mojica',
      position: 'Sending Pastor',
      bio: 'Leading our church with wisdom and dedication, guiding our congregation in spiritual growth.',
      image: ''
    }
  ],
  backButtonText: 'Back to About',
  backButtonColor: '#14b8a6'
}

// Initialize with defaults to ensure all fields are reactive
const leaderData = reactive(JSON.parse(JSON.stringify(defaultLeaderData)))

// If props provide data, merge it
if (props.leaderData) {
  const propData = JSON.parse(JSON.stringify(props.leaderData))
  Object.keys(propData).forEach(key => {
    if (key === 'leaders' && Array.isArray(propData[key])) {
      leaderData.leaders = propData[key].map(leader => ({ ...leader }))
    } else {
      leaderData[key] = propData[key]
    }
  })
}

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'churchLeaders') {
    console.log('Loading Church Leader CMS data...')
    const loadedData = await loadPageData()
    console.log('Loaded data from CMS:', loadedData)
    
    if (loadedData && typeof loadedData === 'object') {
      // Merge loaded data into reactive object, preserving defaults for missing fields
      Object.keys(defaultLeaderData).forEach(key => {
        if (loadedData.hasOwnProperty(key)) {
          // Special handling for heroImage - it should be base64 after composable merges
          if (key === 'heroImage' && loadedData[key]) {
            const heroImage = loadedData[key]
            if (typeof heroImage === 'string' && heroImage.startsWith('data:image/')) {
              leaderData[key] = heroImage
              console.log(`Set ${key}: base64 image (length: ${heroImage.length})`)
            } else {
              console.log(`Hero image is not base64, keeping default`)
            }
          } else if (key === 'leaders' && Array.isArray(loadedData[key])) {
            // Handle leaders array with images
            leaderData.leaders = loadedData[key].map((leader, index) => {
              const leaderObj = {
                name: leader.name || '',
                position: leader.position || '',
                bio: leader.bio || '',
                image: ''
              }
              
              // Check if leader has image (base64 after composable merges)
              if (leader.image && typeof leader.image === 'string' && leader.image.startsWith('data:image/')) {
                leaderObj.image = leader.image
                console.log(`Set leaders[${index}].image: base64 image`)
              } else {
                console.log(`Leader ${index} image is not base64`)
              }
              
              return leaderObj
            })
            console.log(`Set leaders: ${leaderData.leaders.length} items`)
          } else {
            leaderData[key] = loadedData[key]
            console.log(`Set ${key}:`, loadedData[key])
          }
        } else {
          // Keep default value if not in loaded data
          console.log(`Keeping default for ${key}:`, defaultLeaderData[key])
        }
      })
      
      // Also handle any additional fields that might be in loaded data
      Object.keys(loadedData).forEach(key => {
        if (!defaultLeaderData.hasOwnProperty(key)) {
          leaderData[key] = loadedData[key]
          console.log(`Set additional field ${key}:`, loadedData[key])
        }
      })
      
      console.log('Final leaderData:', leaderData)
    } else {
      console.log('No data loaded, using defaults')
    }
  }
})

// Watch for prop changes
watch(() => props.leaderData, (newData) => {
  if (newData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    // Update leaders array
    if (cloned.leaders && Array.isArray(cloned.leaders)) {
      leaderData.leaders = cloned.leaders.map(leader => ({ ...leader }))
    }
    // Update other properties
    Object.keys(cloned).forEach(key => {
      if (key !== 'leaders') {
        leaderData[key] = cloned[key]
      }
    })
  }
}, { deep: true })

// Add dialog state
const addDialogVisible = ref(false)
const newLeader = reactive({
  name: '',
  position: '',
  bio: '',
  image: '',
  imagePath: ''
})

// Handle hero image change
const handleHeroImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    leaderData.heroImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle image change for leaders
const handleLeaderImageChange = (file, index) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    leaderData.leaders[index].image = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle image change for new leader
const handleNewLeaderImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    newLeader.image = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Show add leader dialog
const showAddLeaderDialog = () => {
  addDialogVisible.value = true
}

// Close add dialog
const closeAddDialog = () => {
  addDialogVisible.value = false
  newLeader.name = ''
  newLeader.position = ''
  newLeader.bio = ''
  newLeader.image = ''
}

// Add new leader
const addNewLeader = () => {
  if (newLeader.name.trim()) {
    leaderData.leaders.push({
      name: newLeader.name.trim(),
      position: newLeader.position.trim(),
      bio: newLeader.bio.trim(),
      image: newLeader.image
    })
    closeAddDialog()
  } else {
    // eslint-disable-next-line no-alert
    alert('Please enter a leader name')
  }
}

// Delete leader
const deleteLeader = (index) => {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure you want to delete this leader?')) {
    leaderData.leaders.splice(index, 1)
  }
}

// Save changes to CMS
// Hero image and leader images are saved as BLOB in database (not in JSON)
// Flow: base64 in content → composable extracts → backend converts to Buffer → saves as BLOB
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    console.log('Saving Church Leader data:', leaderData)
    const contentToSave = JSON.parse(JSON.stringify(leaderData))
    
    // Keep hero image and leader images in content - composable will extract them and save as BLOB
    // The composable's extractImagesFromContent will automatically extract base64 images
    // Backend will convert base64 to Buffer and save as BLOB in tbl_cms_images
    if (contentToSave.heroImage && typeof contentToSave.heroImage === 'string' && contentToSave.heroImage.startsWith('data:image/')) {
      console.log('Hero image will be saved as BLOB (base64 length:', contentToSave.heroImage.length, ')')
    } else if (contentToSave.heroImage) {
      console.log('Hero image is not base64, keeping as is')
    }
    
    // Leader images are kept in the leaders array - composable will extract them
    if (contentToSave.leaders && Array.isArray(contentToSave.leaders)) {
      contentToSave.leaders.forEach((leader, index) => {
        if (leader.image && typeof leader.image === 'string' && leader.image.startsWith('data:image/')) {
          console.log(`Leader ${index} image will be saved as BLOB (base64 length: ${leader.image.length})`)
        }
      })
    }
    
    console.log('Content to save:', Object.keys(contentToSave))
    
    // Save to CMS - the composable will automatically extract base64 images
    // Backend will convert base64 to Buffer and save as BLOB in tbl_cms_images
    const success = await savePageData(contentToSave, {})
    
    if (success) {
      console.log('Save successful, reloading data...')
      // Reload data to get updated version
      const loadedData = await loadPageData(true) // Force refresh
      console.log('Reloaded data after save:', loadedData)
      
      if (loadedData && typeof loadedData === 'object') {
        // Merge reloaded data
        Object.keys(defaultLeaderData).forEach(key => {
          if (loadedData.hasOwnProperty(key)) {
            // Special handling for heroImage
            if (key === 'heroImage' && loadedData[key] && typeof loadedData[key] === 'string' && loadedData[key].startsWith('data:image/')) {
              leaderData[key] = loadedData[key]
            } else if (key === 'leaders' && Array.isArray(loadedData[key])) {
              // Handle leaders array with images
              leaderData.leaders = loadedData[key].map((leader) => ({
                name: leader.name || '',
                position: leader.position || '',
                bio: leader.bio || '',
                image: (leader.image && typeof leader.image === 'string' && leader.image.startsWith('data:image/')) ? leader.image : ''
              }))
            } else if (key !== 'heroImage') {
              leaderData[key] = loadedData[key]
            }
          }
        })
        
        // Handle additional fields
        Object.keys(loadedData).forEach(key => {
          if (!defaultLeaderData.hasOwnProperty(key)) {
            leaderData[key] = loadedData[key]
          }
        })
        
        console.log('Updated leaderData after reload:', leaderData)
      }
    } else {
      console.error('Save failed')
    }
  } catch (error) {
    console.error('Error saving church leader page:', error)
  }
}
</script>

<style scoped>
.church-leader-list {
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

.text-grey {
  color: #909399;
  font-size: 12px;
}

.ml-2 {
  margin-left: 8px;
}

.preview-image {
  width: 300px;
  height: 180px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  object-fit: cover;
}

/* Leaders Section Styles */
.leaders-section {
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

.section-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
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

.leaders-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.leader-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.leader-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.leader-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.leader-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.leader-number-badge {
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

.leader-content {
  flex: 1;
  min-width: 0;
}

.leader-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.leader-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leader-field-label {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.leader-input {
  width: 100%;
  max-width: 400px;
}

.leader-textarea {
  width: 100%;
  max-width: 500px;
}

.leader-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  margin-top: 4px;
}

.leader-value {
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leader-position {
  color: #409eff;
}

.leader-image-preview {
  margin-bottom: 8px;
}

.leader-preview-image {
  width: 150px;
  height: 100px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.leader-actions {
  display: flex;
  gap: 8px;
}

.edit-dialog-content {
  padding: 8px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

