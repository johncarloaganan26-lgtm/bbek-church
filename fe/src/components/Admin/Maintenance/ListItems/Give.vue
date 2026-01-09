<template>
  <div class="give-list">
    <!-- Hero Image -->
    <div class="list-item">
      <div class="item-label">Hero Image</div>
      <div class="item-preview">
        <el-image
          v-if="giveData.heroImage"
          :src="giveData.heroImage"
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
        <span v-if="!giveData.heroImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- Hero Title -->
    <div class="list-item">
      <div class="item-label">Hero Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ giveData.heroTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.heroTitle"
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
        <span class="text-grey">{{ giveData.heroSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.heroSubtitle"
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
        <span class="text-bold">{{ giveData.sectionTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.sectionTitle"
          size="small"
          placeholder="Enter section title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Biblical Foundation Title -->
    <div class="list-item">
      <div class="item-label">Biblical Foundation Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ giveData.biblicalFoundationTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.biblicalFoundationTitle"
          size="small"
          placeholder="Enter biblical foundation title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Biblical Foundation Text -->
    <div class="list-item">
      <div class="item-label">Biblical Foundation Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ giveData.biblicalFoundationText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.biblicalFoundationText"
          type="textarea"
          :rows="4"
          size="small"
          placeholder="Enter biblical foundation text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Purpose Title -->
    <div class="list-item">
      <div class="item-label">Purpose Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ giveData.purposeTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.purposeTitle"
          size="small"
          placeholder="Enter purpose title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Purpose Text -->
    <div class="list-item">
      <div class="item-label">Purpose Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ giveData.purposeText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.purposeText"
          type="textarea"
          :rows="4"
          size="small"
          placeholder="Enter purpose text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Choose Method Text -->
    <div class="list-item">
      <div class="item-label">Choose Method Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ giveData.chooseMethodText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.chooseMethodText"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter choose method text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- GCash Text -->
    <div class="list-item">
      <div class="item-label">GCash Text</div>
      <div class="item-preview">
        <span class="text-bold">{{ giveData.gcashText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.gcashText"
          size="small"
          placeholder="Enter GCash text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- GCash Number -->
    <div class="list-item">
      <div class="item-label">GCash Number</div>
      <div class="item-preview">
        <span>{{ giveData.gcashNumber }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.gcashNumber"
          size="small"
          placeholder="Enter GCash number"
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
          :style="{ backgroundColor: giveData.backButtonColor, borderColor: giveData.backButtonColor }"
          size="small"
          type="primary"
        >
          {{ giveData.backButtonText }}
        </el-button>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.backButtonText"
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
          :style="{ backgroundColor: giveData.backButtonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="giveData.backButtonColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Give In Person - Title -->
    <div class="list-item">
      <div class="item-label">Give In Person - Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ giveData.giveInPersonTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.giveInPersonTitle"
          size="small"
          placeholder="Enter title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Give In Person - Text -->
    <div class="list-item">
      <div class="item-label">Give In Person - Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ giveData.giveInPersonText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.giveInPersonText"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Sunday Services Label -->
    <div class="list-item">
      <div class="item-label">Sunday Services Label</div>
      <div class="item-preview">
        <span>{{ giveData.sundayServicesLabel }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.sundayServicesLabel"
          size="small"
          placeholder="Enter label"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Sunday Services Time -->
    <div class="list-item">
      <div class="item-label">Sunday Services Time</div>
      <div class="item-preview">
        <span>{{ giveData.sundayServicesTime }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.sundayServicesTime"
          size="small"
          placeholder="Enter time"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Scheduled Giving Title -->
    <div class="list-item">
      <div class="item-label">Scheduled Giving Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ giveData.scheduledGivingTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.scheduledGivingTitle"
          size="small"
          placeholder="Enter title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Scheduled Giving Text -->
    <div class="list-item">
      <div class="item-label">Scheduled Giving Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ giveData.scheduledGivingText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.scheduledGivingText"
          type="textarea"
          :rows="4"
          size="small"
          placeholder="Enter text"
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
import { Upload } from '@element-plus/icons-vue'
import { useCms } from '@/composables/useCms'
import Loader from './Loader.vue'

const props = defineProps({
  giveData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'give'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('give')

// Default data structure
const defaultGiveData = {
  heroImage: '',
  heroTitle: 'Give Generously',
  heroSubtitle: "Your generous donations help us share God's Word, serve our community, and support those in need. Every gift makes a lasting impact.",
  sectionTitle: 'Biblical Giving & Donation',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText: 'Biblical giving is an act of worship and obedience to God. The Bible teaches us that everything we have comes from God, and we are called to be faithful stewards of His blessings.',
  purposeTitle: 'Purpose of Giving',
  purposeText: "Your generous donations support our church's mission to spread the Gospel, serve our community, and help those in need. Every gift enables us to continue God's work in our midst.",
  chooseMethodText: 'Choose your preferred method of giving below. Every gift makes a lasting impact.',
  gcashText: 'GCash',
  gcashNumber: '09309224324',
  backButtonText: 'Back to Home',
  backButtonColor: '#00bcd4',
  // Give In Person Card fields
  giveInPersonTitle: 'Give in Person',
  giveInPersonText: 'You can give during any of our worship services by placing your donation in the offering box.',
  sundayServicesLabel: 'Sunday Services:',
  sundayServicesTime: '9:00 AM - 11:00 AM',
  scheduledGivingTitle: 'Scheduled Giving',
  scheduledGivingText: "If you'd like to set up regular, scheduled giving, please contact our church office for assistance. We can help you establish a consistent giving plan that works for you."
}

// Create reactive copy of prop data or use default
const createReactiveCopy = (data) => {
  if (!data) return reactive(JSON.parse(JSON.stringify(defaultGiveData)))
  return reactive(JSON.parse(JSON.stringify(data)))
}

// Initialize with defaults to ensure all fields are reactive
const giveData = reactive(JSON.parse(JSON.stringify(defaultGiveData)))

// If props provide data, merge it
if (props.giveData) {
  const propData = createReactiveCopy(props.giveData)
  Object.keys(propData).forEach(key => {
    giveData[key] = propData[key]
  })
}

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'give') {
    console.log('Loading Give CMS data...')
    const loadedData = await loadPageData()
    console.log('Loaded data from CMS:', loadedData)
    
    if (loadedData && typeof loadedData === 'object') {
      // Merge loaded data into reactive object, preserving defaults for missing fields
      Object.keys(defaultGiveData).forEach(key => {
        if (loadedData.hasOwnProperty(key)) {
          // Special handling for heroImage - it should be base64 after composable merges
          if (key === 'heroImage' && loadedData[key]) {
            const heroImage = loadedData[key]
            if (typeof heroImage === 'string' && heroImage.startsWith('data:image/')) {
              giveData[key] = heroImage
              console.log(`Set ${key}: base64 image (length: ${heroImage.length})`)
            } else {
              console.log(`Hero image is not base64, keeping default`)
            }
          } else {
            giveData[key] = loadedData[key]
            console.log(`Set ${key}:`, loadedData[key])
          }
        } else {
          // Keep default value if not in loaded data
          console.log(`Keeping default for ${key}:`, defaultGiveData[key])
        }
      })
      
      // Also handle any additional fields that might be in loaded data
      Object.keys(loadedData).forEach(key => {
        if (!defaultGiveData.hasOwnProperty(key)) {
          giveData[key] = loadedData[key]
          console.log(`Set additional field ${key}:`, loadedData[key])
        }
      })
      
      console.log('Final giveData:', giveData)
    } else {
      console.log('No data loaded, using defaults')
    }
  }
})

// Watch for prop changes
watch(() => props.giveData, (newData) => {
  if (newData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    Object.keys(cloned).forEach(key => {
      giveData[key] = cloned[key]
    })
  }
}, { deep: true })

// Handle hero image change
const handleHeroImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    giveData.heroImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Save changes to CMS
// Hero image is saved as BLOB in database (not in JSON)
// Flow: base64 in content → composable extracts → backend converts to Buffer → saves as BLOB
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    console.log('Saving Give data:', giveData)
    const contentToSave = JSON.parse(JSON.stringify(giveData))
    
    // Keep hero image in content - composable will extract it and save as BLOB
    // The composable's extractImagesFromContent will automatically extract base64 images
    // Backend will convert base64 to Buffer and save as BLOB in tbl_cms_images
    if (contentToSave.heroImage && typeof contentToSave.heroImage === 'string' && contentToSave.heroImage.startsWith('data:image/')) {
      console.log('Hero image will be saved as BLOB (base64 length:', contentToSave.heroImage.length, ')')
    } else if (contentToSave.heroImage) {
      console.log('Hero image is not base64, keeping as is')
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
        Object.keys(defaultGiveData).forEach(key => {
          if (loadedData.hasOwnProperty(key)) {
            // Special handling for heroImage
            if (key === 'heroImage' && loadedData[key] && typeof loadedData[key] === 'string' && loadedData[key].startsWith('data:image/')) {
              giveData[key] = loadedData[key]
            } else if (key !== 'heroImage') {
              giveData[key] = loadedData[key]
            }
          }
        })
        
        // Handle additional fields
        Object.keys(loadedData).forEach(key => {
          if (!defaultGiveData.hasOwnProperty(key)) {
            giveData[key] = loadedData[key]
          }
        })
        
        console.log('Updated giveData after reload:', giveData)
      }
    } else {
      console.error('Save failed')
    }
  } catch (error) {
    console.error('Error saving give page:', error)
  }
}
</script>

<style scoped>
.give-list {
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

