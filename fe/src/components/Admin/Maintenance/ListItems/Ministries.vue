<template>
  <div class="ministries-list">
    <!-- Hero Image -->
    <div class="list-item">
      <div class="item-label">Hero Image</div>
      <div class="item-preview">
        <el-image
          v-if="ministriesData.heroImage"
          :src="ministriesData.heroImage"
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
        <span v-if="!ministriesData.heroImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- Hero Title -->
    <div class="list-item">
      <div class="item-label">Hero Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ ministriesData.heroTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="ministriesData.heroTitle"
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
        <span class="text-grey">{{ ministriesData.heroSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="ministriesData.heroSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter hero subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Section Title -->
    <div class="list-item">
      <div class="item-label">Section Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ ministriesData.sectionTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="ministriesData.sectionTitle"
          size="small"
          placeholder="Enter section title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Section Subtitle -->
    <div class="list-item">
      <div class="item-label">Section Subtitle</div>
      <div class="item-preview">
        <span class="text-grey">{{ ministriesData.sectionSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="ministriesData.sectionSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter section subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Learn More Button Color -->
    <div class="list-item">
      <div class="item-label">Learn More Button Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: ministriesData.learnMoreButtonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="ministriesData.learnMoreButtonColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Join Community Title -->
    <div class="list-item">
      <div class="item-label">Join Community Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ ministriesData.joinCommunityTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="ministriesData.joinCommunityTitle"
          size="small"
          placeholder="Enter join community title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Join Community Text -->
    <div class="list-item">
      <div class="item-label">Join Community Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ ministriesData.joinCommunityText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="ministriesData.joinCommunityText"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter join community text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Join Button Text -->
    <div class="list-item">
      <div class="item-label">Join Button Text</div>
      <div class="item-preview">
        <el-button
          :style="{ backgroundColor: ministriesData.joinButtonColor, borderColor: ministriesData.joinButtonColor }"
          size="small"
          type="primary"
        >
          {{ ministriesData.joinButtonText }}
        </el-button>
      </div>
      <div class="item-action">
        <el-input
          v-model="ministriesData.joinButtonText"
          size="small"
          placeholder="Button text"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Join Button Color -->
    <div class="list-item">
      <div class="item-label">Join Button Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: ministriesData.joinButtonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="ministriesData.joinButtonColor"
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
import { Upload } from '@element-plus/icons-vue'
import { useCms } from '@/composables/useCms'
import Loader from './Loader.vue'

const props = defineProps({
  ministriesData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'ministries'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('ministries')

// Default data structure
const defaultMinistriesData = {
  heroImage: '',
  heroTitle: 'ALL MINISTRIES',
  heroSubtitle: 'Our ministries are dedicated to meeting spiritual and practical needs, helping people grow in faith, and sharing God\'s love in our community.',
  sectionTitle: 'Our Ministries',
  sectionSubtitle: 'Discover our various ministries designed to help you grow in faith and serve our community.',
  learnMoreButtonColor: '#ffffff',
  joinCommunityTitle: 'Join Our Faith Community',
  joinCommunityText: 'We invite you to be a part of our church family. Come worship with us and experience the love of Christ.',
  joinButtonText: 'Become a Member',
  joinButtonColor: '#14b8a6'
}

// Create reactive copy of prop data or use default
const createReactiveCopy = (data) => {
  if (!data) return reactive(JSON.parse(JSON.stringify(defaultMinistriesData)))
  return reactive(JSON.parse(JSON.stringify(data)))
}

// Initialize with defaults to ensure all fields are reactive
const ministriesData = reactive(JSON.parse(JSON.stringify(defaultMinistriesData)))

// If props provide data, merge it
if (props.ministriesData) {
  const propData = createReactiveCopy(props.ministriesData)
  Object.keys(propData).forEach(key => {
    ministriesData[key] = propData[key]
  })
}

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'ministries') {
    console.log('Loading Ministries CMS data...')
    const loadedData = await loadPageData()
    console.log('Loaded data from CMS:', loadedData)
    
    if (loadedData && typeof loadedData === 'object') {
      // Merge loaded data into reactive object, preserving defaults for missing fields
      Object.keys(defaultMinistriesData).forEach(key => {
        if (loadedData.hasOwnProperty(key)) {
          // Special handling for heroImage - it should be base64 after composable merges
          if (key === 'heroImage' && loadedData[key]) {
            const heroImage = loadedData[key]
            if (typeof heroImage === 'string' && heroImage.startsWith('data:image/')) {
              ministriesData[key] = heroImage
              console.log(`Set ${key}: base64 image (length: ${heroImage.length})`)
            } else {
              console.log(`Hero image is not base64, keeping default`)
            }
          } else {
            ministriesData[key] = loadedData[key]
            console.log(`Set ${key}:`, loadedData[key])
          }
        } else {
          // Keep default value if not in loaded data
          console.log(`Keeping default for ${key}:`, defaultMinistriesData[key])
        }
      })
      
      // Also handle any additional fields that might be in loaded data
      Object.keys(loadedData).forEach(key => {
        if (!defaultMinistriesData.hasOwnProperty(key)) {
          ministriesData[key] = loadedData[key]
          console.log(`Set additional field ${key}:`, loadedData[key])
        }
      })
      
      console.log('Final ministriesData:', ministriesData)
    } else {
      console.log('No data loaded, using defaults')
    }
  }
})

// Watch for prop changes
watch(() => props.ministriesData, (newData) => {
  if (newData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    Object.keys(cloned).forEach(key => {
      ministriesData[key] = cloned[key]
    })
  }
}, { deep: true })

// Handle hero image change
const handleHeroImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    ministriesData.heroImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Save changes to CMS
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    console.log('Saving Ministries data:', ministriesData)
    const contentToSave = JSON.parse(JSON.stringify(ministriesData))
    
    // Keep hero image in content - composable will extract it and save as BLOB
    if (contentToSave.heroImage && typeof contentToSave.heroImage === 'string' && contentToSave.heroImage.startsWith('data:image/')) {
      console.log('Hero image will be saved as BLOB (base64 length:', contentToSave.heroImage.length, ')')
    } else if (contentToSave.heroImage) {
      console.log('Hero image is not base64, keeping as is')
    }
    
    console.log('Content to save:', Object.keys(contentToSave))
    
    // Save to CMS - the composable will automatically extract base64 images
    const success = await savePageData(contentToSave, {})
    
    if (success) {
      console.log('Save successful, reloading data...')
      // Reload data to get updated version
      const loadedData = await loadPageData(true) // Force refresh
      console.log('Reloaded data after save:', loadedData)
      
      if (loadedData && typeof loadedData === 'object') {
        // Merge reloaded data
        Object.keys(defaultMinistriesData).forEach(key => {
          if (loadedData.hasOwnProperty(key)) {
            // Special handling for heroImage
            if (key === 'heroImage' && loadedData[key] && typeof loadedData[key] === 'string' && loadedData[key].startsWith('data:image/')) {
              ministriesData[key] = loadedData[key]
            } else if (key !== 'heroImage') {
              ministriesData[key] = loadedData[key]
            }
          }
        })
        
        // Handle additional fields
        Object.keys(loadedData).forEach(key => {
          if (!defaultMinistriesData.hasOwnProperty(key)) {
            ministriesData[key] = loadedData[key]
          }
        })
        
        console.log('Updated ministriesData after reload:', ministriesData)
      }
    } else {
      console.error('Save failed')
    }
  } catch (error) {
    console.error('Error saving ministries page:', error)
  }
}
</script>

<style scoped>
.ministries-list {
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
