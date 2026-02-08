<template>
  <div class="plan-visit-list">
    <!-- Hero Image -->
    <div class="list-item">
      <div class="item-label">Hero Image</div>
      <div class="item-preview">
        <el-image
          v-if="planVisitData.heroImage"
          :src="planVisitData.heroImage"
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
        <span v-if="!planVisitData.heroImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- Hero Title -->
    <div class="list-item">
      <div class="item-label">Hero Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ planVisitData.heroTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.heroTitle"
          size="small"
          placeholder="Enter hero title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Hero Description -->
    <div class="list-item">
      <div class="item-label">Hero Description</div>
      <div class="item-preview">
        <span class="text-grey">{{ planVisitData.heroDescription }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.heroDescription"
          type="textarea"
          :rows="2"
          size="small"
          placeholder="Enter hero description"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Church Name -->
    <div class="list-item">
      <div class="item-label">Church Name</div>
      <div class="item-preview">
        <span class="text-bold">{{ planVisitData.churchName }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.churchName"
          size="small"
          placeholder="Enter church name"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Church Description -->
    <div class="list-item">
      <div class="item-label">Church Description</div>
      <div class="item-preview">
        <span class="text-grey">{{ planVisitData.churchDescription }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.churchDescription"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter church description"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Sunday Service Time -->
    <div class="list-item">
      <div class="item-label">Sunday Service Time</div>
      <div class="item-preview">
        <span>{{ planVisitData.sundayServiceTime }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.sundayServiceTime"
          size="small"
          placeholder="Enter Sunday service time"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Wednesday Service Time -->
    <div class="list-item">
      <div class="item-label">Wednesday Service Time</div>
      <div class="item-preview">
        <span>{{ planVisitData.wednesdayServiceTime }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.wednesdayServiceTime"
          size="small"
          placeholder="Enter Wednesday service time"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Location -->
    <div class="list-item">
      <div class="item-label">Location</div>
      <div class="item-preview">
        <span>{{ planVisitData.location }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.location"
          size="small"
          placeholder="Enter location"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Phone -->
    <div class="list-item">
      <div class="item-label">Phone</div>
      <div class="item-preview">
        <span>{{ planVisitData.phone }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.phone"
          size="small"
          placeholder="Enter phone number"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Email -->
    <div class="list-item">
      <div class="item-label">Email</div>
      <div class="item-preview">
        <span>{{ planVisitData.email }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="planVisitData.email"
          size="small"
          placeholder="Enter email address"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Background Color -->
    <div class="list-item">
      <div class="item-label">Background Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: planVisitData.backgroundColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="planVisitData.backgroundColor"
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
  planVisitData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'planVisit'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('planvisit')

// Default data structure
const defaultPlanVisitData = {
  heroImage: '',
  heroTitle: 'Plan Your Visit',
  heroDescription: "We're excited to welcome you to our church family",
  churchName: 'Bible Baptist Ekklesia of Kawit',
  churchDescription: 'An independent Baptist church proclaiming the Gospel of Jesus Christ and making disciples through Biblical teaching and authentic worship.',
  sundayServiceTime: '9:30 AM – 12:00 PM',
  wednesdayServiceTime: '7:00 PM – 9:00 PM',
  location: '485 Acacia St. Villa Ramirez, Kawit, Cavite',
  phone: '+63 912 345 6789',
  email: 'biblebaptistekklesiaofkawit@gmail.com',
  backgroundColor: '#ffffff'
}

// Create reactive copy of prop data or use default
const createReactiveCopy = (data) => {
  if (!data) return reactive(JSON.parse(JSON.stringify(defaultPlanVisitData)))
  return reactive(JSON.parse(JSON.stringify(data)))
}

// Initialize with defaults to ensure all fields are reactive
const planVisitData = reactive(JSON.parse(JSON.stringify(defaultPlanVisitData)))

// If props provide data, merge it
if (props.planVisitData) {
  const propData = createReactiveCopy(props.planVisitData)
  Object.keys(propData).forEach(key => {
    planVisitData[key] = propData[key]
  })
}

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'planVisit') {
    console.log('Loading Plan Visit CMS data...')
    const loadedData = await loadPageData()
    console.log('Loaded data from CMS:', loadedData)
    
    if (loadedData && typeof loadedData === 'object') {
      // Merge loaded data into reactive object, preserving defaults for missing fields
      Object.keys(defaultPlanVisitData).forEach(key => {
        if (loadedData.hasOwnProperty(key)) {
          // Special handling for heroImage - it should be base64 after composable merges
          if (key === 'heroImage' && loadedData[key]) {
            const heroImage = loadedData[key]
            if (typeof heroImage === 'string' && heroImage.startsWith('data:image/')) {
              planVisitData[key] = heroImage
              console.log(`Set ${key}: base64 image (length: ${heroImage.length})`)
            } else {
              console.log(`Hero image is not base64, keeping default`)
            }
          } else {
            planVisitData[key] = loadedData[key]
            console.log(`Set ${key}:`, loadedData[key])
          }
        } else {
          // Keep default value if not in loaded data
          console.log(`Keeping default for ${key}:`, defaultPlanVisitData[key])
        }
      })
      
      // Also handle any additional fields that might be in loaded data
      Object.keys(loadedData).forEach(key => {
        if (!defaultPlanVisitData.hasOwnProperty(key)) {
          planVisitData[key] = loadedData[key]
          console.log(`Set additional field ${key}:`, loadedData[key])
        }
      })
      
      console.log('Final planVisitData:', planVisitData)
    } else {
      console.log('No data loaded, using defaults')
    }
  }
})

// Watch for prop changes
watch(() => props.planVisitData, (newData) => {
  if (newData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    Object.keys(cloned).forEach(key => {
      planVisitData[key] = cloned[key]
    })
  }
}, { deep: true })

// Handle hero image change
const handleHeroImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    planVisitData.heroImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Save changes to CMS
// Hero image is saved as BLOB in database (not in JSON)
// Flow: base64 in content → composable extracts → backend converts to Buffer → saves as BLOB
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    console.log('Saving Plan Visit data:', planVisitData)
    const contentToSave = JSON.parse(JSON.stringify(planVisitData))
    
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
        Object.keys(defaultPlanVisitData).forEach(key => {
          if (loadedData.hasOwnProperty(key)) {
            planVisitData[key] = loadedData[key]
          }
        })
        
        // Handle additional fields
        Object.keys(loadedData).forEach(key => {
          if (!defaultPlanVisitData.hasOwnProperty(key)) {
            planVisitData[key] = loadedData[key]
          }
        })
        
        console.log('Updated planVisitData after reload:', planVisitData)
      }
    } else {
      console.error('Save failed')
    }
  } catch (error) {
    console.error('Error saving plan visit page:', error)
  }
}
</script>

<style scoped>
.plan-visit-list {
  width: 100%;
  padding-bottom: 80px;
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

