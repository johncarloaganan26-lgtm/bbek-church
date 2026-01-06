<template>
  <div class="home-list">
    <!-- Background Type Selector -->
    <div class="list-item">
      <div class="item-label">Background Type</div>
      <div class="item-preview">
        <span class="text-bold">{{ getBackgroundTypeLabel(homeData.backgroundType) }}</span>
      </div>
      <div class="item-action">
        <el-select
          v-model="homeData.backgroundType"
          placeholder="Select background type"
          size="small"
          style="width: 200px;"
        >
          <el-option label="Background Image" value="image" />
          <el-option label="Video" value="video" />
          <el-option label="None (Gradient)" value="none" />
        </el-select>
      </div>
    </div>
    <el-divider />

    <!-- Home Background Image -->
    <div class="list-item" v-if="homeData.backgroundType === 'image'">
      <div class="item-label">Home Background Image</div>
      <div class="item-preview">
        <el-image
          v-if="homeData.homeBackgroundImage"
          :src="homeData.homeBackgroundImage"
          fit="cover"
          class="preview-image"
        />
        <span v-else class="text-grey">No image selected</span>
      </div>
      <div class="item-action">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleBackgroundImageChange"
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
    <el-divider v-if="homeData.backgroundType === 'image'" />

    <!-- Home Video -->
    <div class="list-item" v-if="homeData.backgroundType === 'video'">
      <div class="item-label">Home Video</div>
      <div class="item-preview">
        <div class="video-preview">
          <div v-if="uploadingVideo" class="upload-status">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span class="ml-2">Processing video...</span>
          </div>
          <div v-else-if="homeData.homeVideo" class="video-status">
            <el-icon class="success-icon"><CircleCheck /></el-icon>
            <span class="ml-2 text-success">Video ready</span>
            <span class="text-grey ml-2">({{ formatVideoSize(homeData.homeVideo) }})</span>
          </div>
          <span v-else class="text-grey">No file chosen</span>
        </div>
      </div>
      <div class="item-action">
        <div class="action-buttons">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :disabled="uploadingVideo"
            accept="video/*"
            @change="handleVideoChange"
          >
            <template #trigger>
              <el-button size="small" type="primary" :loading="uploadingVideo" :disabled="uploadingVideo">
                <el-icon v-if="!uploadingVideo"><Upload /></el-icon>
                {{ uploadingVideo ? 'Processing...' : 'Choose File' }}
              </el-button>
            </template>
          </el-upload>
          <el-button
            v-if="homeData.homeVideo && !uploadingVideo"
            size="small"
            type="danger"
            @click="handleDeleteVideo"
            style="margin-left: 8px;"
          >
            <el-icon><Delete /></el-icon>
            Delete Video
          </el-button>
        </div>
        <span v-if="!homeData.homeVideo && !uploadingVideo" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider v-if="homeData.backgroundType === 'video'" />

    <!-- Home Welcome Text -->
    <div class="list-item">
      <div class="item-label">Home Welcome Text</div>
      <div class="item-preview">
        <span>{{ homeData.welcomeText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.welcomeText"
          size="small"
          placeholder="Enter welcome text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Sunday Service Time -->
    <div class="list-item">
      <div class="item-label">Sunday Service</div>
      <div class="item-preview">
        <span>{{ homeData.sundayService }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.sundayService"
          size="small"
          placeholder="e.g., Sunday Worship 9:30 AM - 12:00 PM"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Wednesday Service Time -->
    <div class="list-item">
      <div class="item-label">Wednesday Service</div>
      <div class="item-preview">
        <span>{{ homeData.wednesdayService }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.wednesdayService"
          size="small"
          placeholder="e.g., Wednesday Service 7:00 PM - 9:00 PM"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Plan Your Visit Button Text -->
    <div class="list-item">
      <div class="item-label">Plan Your Visit Button Text</div>
      <div class="item-preview">
        <el-button
          :style="{ backgroundColor: homeData.planVisitButtonColor, borderColor: homeData.planVisitButtonColor }"
          size="small"
          type="primary"
        >
          {{ homeData.planVisitButtonText }}
        </el-button>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.planVisitButtonText"
          size="small"
          placeholder="Button text"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Plan Your Visit Button Color -->
    <div class="list-item">
      <div class="item-label">Plan Your Visit Button Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: homeData.planVisitButtonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="homeData.planVisitButtonColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Be One Of Us Button Text -->
    <div class="list-item">
      <div class="item-label">Be One Of Us Button Text</div>
      <div class="item-preview">
        <el-button
          :style="{ backgroundColor: homeData.beOneOfUsButtonColor, borderColor: homeData.beOneOfUsButtonColor }"
          size="small"
          type="primary"
        >
          {{ homeData.beOneOfUsButtonText }}
        </el-button>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.beOneOfUsButtonText"
          size="small"
          placeholder="Button text"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Be One Of Us Button Color -->
    <div class="list-item">
      <div class="item-label">Be One Of Us Button Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: homeData.beOneOfUsButtonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="homeData.beOneOfUsButtonColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Services Section Title -->
    <div class="list-item">
      <div class="item-label">Services Section Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ homeData.servicesTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.servicesTitle"
          size="small"
          placeholder="Section title"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Services Section Subtitle -->
    <div class="list-item">
      <div class="item-label">Services Section Subtitle</div>
      <div class="item-preview">
        <span class="text-grey">{{ homeData.servicesSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.servicesSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Section subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Services Section -->
    <div class="services-section">
      <div class="section-header">
        <h3 class="section-title">Services</h3>
        <span class="section-count">{{ homeData.services?.length || 0 }} items</span>
      </div>

      <div class="services-container">
        <div
          v-for="(service, idx) in homeData.services"
          :key="`service-${idx}`"
          class="service-card"
        >
          <div class="service-header">
            <div class="service-main">
              <div class="service-number-badge">{{ idx + 1 }}</div>
              <div class="service-content">
                <div class="service-fields">
                  <div class="service-field">
                    <label class="service-field-label">Title</label>
                    <el-input
                      v-model="service.title"
                      size="default"
                      placeholder="Service title"
                      class="service-input"
                    />
                    <div class="service-meta">
                      <span class="service-value">{{ service.title }}</span>
                    </div>
                  </div>
                  <div class="service-field">
                    <label class="service-field-label">Description</label>
                    <el-input
                      v-model="service.description"
                      type="textarea"
                      :rows="2"
                      size="small"
                      placeholder="Service description"
                      class="service-textarea"
                    />
                    <div class="service-meta">
                      <span class="service-value">{{ service.description }}</span>
                    </div>
                  </div>
                  <div class="service-field">
                    <label class="service-field-label">Image</label>
                    <div class="service-image-preview">
                      <el-image
                        v-if="service.image"
                        :src="service.image"
                        fit="cover"
                        class="service-preview-image"
                      />
                      <span v-else class="text-grey">No image selected</span>
                    </div>
                    <el-upload
                      :auto-upload="false"
                      :show-file-list="false"
                      accept="image/*"
                      @change="(file) => handleServiceImageChange(file, idx)"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-divider />

    <!-- Vision Section Title -->
    <div class="list-item">
      <div class="item-label">Vision Section Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ homeData.visionTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.visionTitle"
          size="small"
          placeholder="Vision section title"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Vision Subtitle -->
    <div class="list-item">
      <div class="item-label">Vision Subtitle</div>
      <div class="item-preview">
        <span class="text-grey">{{ homeData.visionSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.visionSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Vision subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Live By Faith -->
    <div class="list-item">
      <div class="item-label">Live By Faith</div>
      <div class="item-preview">
        <span class="text-grey">{{ homeData.liveByFaith }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.liveByFaith"
          type="textarea"
          :rows="2"
          size="small"
          placeholder="Live By Faith description"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Known By Love -->
    <div class="list-item">
      <div class="item-label">Known By Love</div>
      <div class="item-preview">
        <span class="text-grey">{{ homeData.knownByLove }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.knownByLove"
          type="textarea"
          :rows="2"
          size="small"
          placeholder="Known By Love description"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- A Vision of Hope -->
    <div class="list-item">
      <div class="item-label">A Vision of Hope</div>
      <div class="item-preview">
        <span class="text-grey">{{ homeData.visionOfHope }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.visionOfHope"
          type="textarea"
          :rows="2"
          size="small"
          placeholder="A Vision of Hope description"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Vision Background Color -->
    <div class="list-item">
      <div class="item-label">Vision Background Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: homeData.visionBgColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="homeData.visionBgColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Vision Image -->
    <div class="list-item">
      <div class="item-label">Vision Image</div>
      <div class="item-preview">
        <el-image
          v-if="homeData.visionImage"
          :src="homeData.visionImage"
          fit="cover"
          class="preview-image"
        />
        <span v-else class="text-grey">No image selected</span>
      </div>
      <div class="item-action">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleVisionImageChange"
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

    <!-- Events Section Title -->
    <div class="list-item">
      <div class="item-label">Events Section Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ homeData.eventsTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.eventsTitle"
          size="small"
          placeholder="Events section title"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Events Subtitle -->
    <div class="list-item">
      <div class="item-label">Events Subtitle</div>
      <div class="item-preview">
        <span class="text-grey">{{ homeData.eventsSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.eventsSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Events subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- All Events Button Text -->
    <div class="list-item">
      <div class="item-label">All Events Button Text</div>
      <div class="item-preview">
        <el-button
          :style="{ backgroundColor: homeData.allEventsButtonColor, borderColor: homeData.allEventsButtonColor }"
          size="small"
          type="primary"
        >
          {{ homeData.allEventsButtonText }}
        </el-button>
      </div>
      <div class="item-action">
        <el-input
          v-model="homeData.allEventsButtonText"
          size="small"
          placeholder="Button text"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- All Events Button Color -->
    <div class="list-item">
      <div class="item-label">All Events Button Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: homeData.allEventsButtonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="homeData.allEventsButtonColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

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
import { Upload, Loading, CircleCheck, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCms } from '@/composables/useCms'
import Loader from './Loader.vue'

// Use props if provided, otherwise use mock data
const props = defineProps({
  homeData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'home'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData, fileToBase64 } = useCms('home')

// Video upload state
const uploadingVideo = ref(false)
const videoUploadProgress = ref(0)

// Default data structure
const defaultHomeData = {
  backgroundType: 'none', // 'image', 'video', or 'none'
  homeBackgroundImage: '',
  homeBackgroundImageFile: null,
  homeVideo: null,
  homeVideoFile: null,
  welcomeText: 'Welcome to Bible Baptist Church of Kwali',
  sundayService: 'Sunday Worship 9:30 AM - 12:00 PM',
  wednesdayService: 'Wednesday Service 7:00 PM - 9:00 PM',
  planVisitButtonText: 'Plan Your Visit',
  planVisitButtonColor: '#14b8a6',
  beOneOfUsButtonText: 'Be One Of Us',
  beOneOfUsButtonColor: '#14b8a6',
  servicesTitle: 'Our Services',
  servicesSubtitle: 'We offer various services to support our community in their spiritual journey.',
  services: [
    {
      title: 'Water Baptism',
      description: 'A sacred ceremony marking your commitment to Christ.',
      image: ''
    },
    {
      title: 'Marriage',
      description: 'Celebrate your union in the presence of God and community.',
      image: ''
    },
    {
      title: 'Child Dedication',
      description: 'Dedicate your child to God and commit to raising them in faith.',
      image: ''
    },
    {
      title: 'Burial Service',
      description: 'Honor the life of your loved one with a meaningful service.',
      image: ''
    }
  ],
  visionTitle: 'We look forward to meeting you',
  visionSubtitle: 'We look forward to welcoming you into our family of faith. Our vision is to be a Christ-centered community that...',
  liveByFaith: 'Live by Faith - Boldly proclaim and position the Gospel in daily life. Trust God\'s promises with unwavering confidence.',
  knownByLove: 'Known by Love - Extend grace without judgment - love God, love people. Serve others sacrificially, going beyond what is expected.',
  visionOfHope: 'A Vision of Hope - Declare Jesus as our \'Blessed Redeemer\' (Colossians 3:12). Keep our eyes fixed on eternity, living with Kingdom perspective.',
  visionBgColor: '#ffffff',
  visionImage: '',
  visionImageFile: null,
  eventsTitle: 'Upcoming Events',
  eventsSubtitle: 'Join us for exciting upcoming events that bring our community together in faith and fellowship.',
  allEventsButtonText: 'All Events',
  allEventsButtonColor: '#14b8a6'
}

// Create reactive data
const createReactiveCopy = (data) => {
  if (!data) return reactive(JSON.parse(JSON.stringify(defaultHomeData)))
  const cloned = JSON.parse(JSON.stringify(data))
  // Ensure services array is reactive
  if (cloned.services && Array.isArray(cloned.services)) {
    cloned.services = cloned.services.map(service => ({ ...service }))
  }
  return reactive(cloned)
}

// Initialize homeData with props or default
const homeData = props.homeData 
  ? createReactiveCopy(props.homeData) 
  : reactive(JSON.parse(JSON.stringify(defaultHomeData)))

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'home') {
    const loadedData = await loadPageData()
    if (loadedData) {
      console.log('Loaded data from CMS:', {
        keys: Object.keys(loadedData),
        hasHomeVideo: !!loadedData.homeVideo,
        homeVideoType: typeof loadedData.homeVideo,
        homeVideoLength: loadedData.homeVideo ? loadedData.homeVideo.length : 0
      })
      // Merge loaded data into homeData
      Object.keys(loadedData).forEach(key => {
        if (key === 'services' && Array.isArray(loadedData[key])) {
          // Ensure services array has proper structure
          homeData.services = loadedData[key].map((service, index) => ({
            title: service.title || '',
            description: service.description || '',
            image: service.image || '',
            ...service
          }))
        } else if (key === 'homeVideo' || key === 'visionImage') {
          // These are handled by images, but set them if they exist
          // Explicitly check if the value is valid (not null, not empty, is a valid data URL)
          const value = loadedData[key]
          if (value && 
              typeof value === 'string' && 
              value.length > 0 &&
              (value.startsWith('data:image/') || value.startsWith('data:video/'))) {
            homeData[key] = value
            console.log(`Set ${key} from loaded data:`, {
              length: value.length,
              startsWith: value.substring(0, 30)
            })
          } else {
            // Explicitly clear if video/image is deleted or invalid
            console.log(`Clearing ${key} - value is deleted or invalid:`, {
              exists: !!value,
              type: typeof value,
              length: value ? value.length : 0,
              isValid: value && typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('data:video/'))
            })
            homeData[key] = null
            if (key === 'homeVideo') {
              homeData.homeVideoFile = null
            } else if (key === 'visionImage') {
              homeData.visionImageFile = null
            }
          }
        } else {
          homeData[key] = loadedData[key]
        }
      })
    }
  }
})

// Watch for prop changes
watch(() => props.homeData, (newData) => {
  if (newData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    if (cloned.services && Array.isArray(cloned.services)) {
      homeData.services = cloned.services.map(service => ({ ...service }))
    }
    Object.keys(cloned).forEach(key => {
      if (key !== 'services') {
        homeData[key] = cloned[key]
      }
    })
  }
}, { deep: true })

const handleVideoChange = async (file) => {
  if (!file || !file.raw) return
  
  const fileObj = file.raw
  const fileSize = fileObj.size
  const maxSize = 15 * 1024 * 1024 // 15MB limit
  
  // Check file size
  if (fileSize > maxSize) {
    ElMessage.error(`Video file is too large. Maximum size is ${formatFileSize(maxSize)}`)
    return
  }
  
  uploadingVideo.value = true
  videoUploadProgress.value = 0
  homeData.homeVideoFile = fileObj
  
  try {
    const reader = new FileReader()
    
    // Show progress during read
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        videoUploadProgress.value = Math.round((event.loaded / event.total) * 100)
      }
    }
    
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (result) {
        homeData.homeVideo = result
        console.log('Video converted to base64, length:', result.length)
        console.log('Video MIME type:', result.substring(0, 30))
        ElMessage.success('Video processed successfully! Click "Save Changes" to upload.')
        videoUploadProgress.value = 100
      } else {
        console.error('Failed to convert video to base64')
        ElMessage.error('Failed to process video file')
      }
      uploadingVideo.value = false
    }
    
    reader.onerror = (error) => {
      console.error('Error reading video file:', error)
      ElMessage.error('Error processing video file. Please try again.')
      uploadingVideo.value = false
      videoUploadProgress.value = 0
    }
    
    // Start reading the file
    reader.readAsDataURL(fileObj)
  } catch (error) {
    console.error('Error handling video change:', error)
    ElMessage.error('Error processing video file. Please try again.')
    uploadingVideo.value = false
    videoUploadProgress.value = 0
  }
}

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Helper function to estimate video size from base64
const formatVideoSize = (base64String) => {
  if (!base64String) return '0 Bytes'
  // Base64 is approximately 4/3 the size of the original
  const estimatedBytes = (base64String.length * 3) / 4
  return formatFileSize(estimatedBytes)
}

// Handle video deletion
const handleDeleteVideo = async () => {
  try {
    // Clear local state immediately
    homeData.homeVideo = null
    homeData.homeVideoFile = null
    
    // Prepare to save with null video (will trigger deletion)
    const contentToSave = JSON.parse(JSON.stringify(homeData))
    delete contentToSave.homeVideoFile
    delete contentToSave.visionImageFile
    if (contentToSave.services) {
      contentToSave.services.forEach(service => {
        delete service.imageFile
      })
    }
    
    // Mark video for deletion
    const imagesToSave = {
      homeVideo: null // null will trigger deletion in backend
    }
    
    console.log('Deleting video from CMS')
    
    // Save to CMS (this will delete the video)
    const success = await savePageData(contentToSave, imagesToSave)
    
    if (success) {
      ElMessage.success('Video deleted successfully!')
      // Reload data to confirm deletion
      await new Promise(resolve => setTimeout(resolve, 500))
      const loadedData = await loadPageData(true)
      if (loadedData) {
        // Explicitly clear video if it's deleted
        if (!loadedData.homeVideo || 
            (typeof loadedData.homeVideo === 'string' && loadedData.homeVideo.length === 0) ||
            !loadedData.homeVideo.startsWith('data:video/')) {
          homeData.homeVideo = null
          homeData.homeVideoFile = null
          console.log('Video cleared after deletion')
        }
      }
    } else {
      ElMessage.error('Failed to delete video. Please try again.')
    }
  } catch (error) {
    console.error('Error deleting video:', error)
    ElMessage.error('Error deleting video. Please try again.')
  }
}

const getBackgroundTypeLabel = (type) => {
  switch (type) {
    case 'image': return 'Background Image'
    case 'video': return 'Video'
    case 'none': return 'None (Gradient)'
    default: return 'None (Gradient)'
  }
}

const handleBackgroundImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw

  homeData.homeBackgroundImageFile = fileObj
  const reader = new FileReader()
  reader.onload = (ev) => {
    homeData.homeBackgroundImage = ev.target?.result || homeData.homeBackgroundImage
  }
  reader.readAsDataURL(fileObj)
}

const handleVisionImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw

  homeData.visionImageFile = fileObj
  const reader = new FileReader()
  reader.onload = (ev) => {
    homeData.visionImage = ev.target?.result || homeData.visionImage
  }
  reader.readAsDataURL(fileObj)
}

const handleServiceImageChange = (file, index) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    homeData.services[index].image = ev.target?.result || homeData.services[index].image
    homeData.services[index].imageFile = fileObj
  }
  reader.readAsDataURL(fileObj)
}

// Save changes to CMS
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    // Prepare content (remove file objects and keep only base64 images)
    const contentToSave = JSON.parse(JSON.stringify(homeData))
    
    // Remove file objects
    delete contentToSave.homeVideoFile
    delete contentToSave.visionImageFile
    delete contentToSave.homeBackgroundImageFile
    if (contentToSave.services) {
      contentToSave.services.forEach(service => {
        delete service.imageFile
      })
    }
    
    // Prepare images object
    const imagesToSave = {}
    
    // Extract images and videos from content
    // Handle homeVideo (can be video or image)
    if (contentToSave.homeVideo && typeof contentToSave.homeVideo === 'string' && (contentToSave.homeVideo.startsWith('data:image/') || contentToSave.homeVideo.startsWith('data:video/'))) {
      imagesToSave.homeVideo = contentToSave.homeVideo
      console.log('Extracting homeVideo to save:', {
        length: contentToSave.homeVideo.length,
        mimeType: contentToSave.homeVideo.substring(0, 50),
        isVideo: contentToSave.homeVideo.startsWith('data:video/')
      })
      delete contentToSave.homeVideo
    } else {
      // If homeVideo is null, empty, or invalid, only delete if it was explicitly cleared
      // Don't delete if it's just not in contentToSave (might be in images already)
      console.log('homeVideo not found in contentToSave:', {
        exists: !!contentToSave.homeVideo,
        type: typeof contentToSave.homeVideo,
        value: contentToSave.homeVideo ? contentToSave.homeVideo.substring(0, 20) : 'N/A',
        inHomeData: !!homeData.homeVideo,
        homeDataType: typeof homeData.homeVideo
      })
      // Only mark for deletion if homeData.homeVideo is explicitly null/empty
      // Otherwise, it might already be saved and we don't want to delete it
      if (!homeData.homeVideo || 
          (typeof homeData.homeVideo === 'string' && homeData.homeVideo.length === 0)) {
        console.log('homeVideo is empty in homeData - marking for deletion')
        imagesToSave.homeVideo = null
      } else {
        console.log('homeVideo exists in homeData but not in contentToSave - keeping existing video')
        // Don't include it in imagesToSave, which means it won't be updated or deleted
      }
      delete contentToSave.homeVideo
    }
    
    // Handle visionImage
    if (contentToSave.visionImage && typeof contentToSave.visionImage === 'string' && contentToSave.visionImage.startsWith('data:image/')) {
      imagesToSave.visionImage = contentToSave.visionImage
      delete contentToSave.visionImage
    }

    // Handle homeBackgroundImage
    if (contentToSave.homeBackgroundImage && typeof contentToSave.homeBackgroundImage === 'string' && contentToSave.homeBackgroundImage.startsWith('data:image/')) {
      imagesToSave.homeBackgroundImage = contentToSave.homeBackgroundImage
      delete contentToSave.homeBackgroundImage
    }
    
    // Handle service images
    if (contentToSave.services && Array.isArray(contentToSave.services)) {
      contentToSave.services.forEach((service, index) => {
        if (service.image && typeof service.image === 'string' && service.image.startsWith('data:')) {
          imagesToSave[`services[${index}].image`] = service.image
          service.image = '' // Clear from content, will be loaded from images
        }
      })
    }
    
    // Debug: Log what we're about to save
    console.log('Saving to CMS:', {
      contentKeys: Object.keys(contentToSave),
      imageKeys: Object.keys(imagesToSave),
      homeVideoInImages: !!imagesToSave.homeVideo,
      homeVideoLength: imagesToSave.homeVideo ? imagesToSave.homeVideo.length : 0
    })
    
    // Save to CMS
    const success = await savePageData(contentToSave, imagesToSave)
    
    if (success) {
      // Wait a moment for database to update and commit transaction
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Force refresh to bypass any caching
      const loadedData = await loadPageData(true)
      if (loadedData) {
        Object.keys(loadedData).forEach(key => {
          if (key === 'services' && Array.isArray(loadedData[key])) {
            homeData.services = loadedData[key].map(service => ({ ...service }))
          } else if (key === 'homeVideo' || key === 'visionImage') {
            // Explicitly handle video/image - clear if deleted
            const value = loadedData[key]
            if (value && 
                typeof value === 'string' && 
                value.length > 0 &&
                (value.startsWith('data:image/') || value.startsWith('data:video/'))) {
              homeData[key] = value
            } else {
              // Clear if deleted or invalid
              console.log(`Clearing ${key} after save - value is deleted or invalid`)
              homeData[key] = null
              if (key === 'homeVideo') {
                homeData.homeVideoFile = null
              } else if (key === 'visionImage') {
                homeData.visionImageFile = null
              }
            }
          } else {
            homeData[key] = loadedData[key]
          }
        })
        
        // Verify video was saved or deleted
        if (imagesToSave.homeVideo === null) {
          // Video was marked for deletion
          if (!loadedData.homeVideo || 
              (typeof loadedData.homeVideo === 'string' && loadedData.homeVideo.length === 0)) {
            ElMessage.success('Video deleted successfully!')
          } else {
            ElMessage.warning('Video may not have been deleted. Please try again.')
          }
        } else if (imagesToSave.homeVideo && loadedData.homeVideo) {
          // Video was saved - verify size
          const savedLength = loadedData.homeVideo.length
          const sentLength = imagesToSave.homeVideo.length
          console.log('Video save verification:', {
            sentLength,
            savedLength,
            match: savedLength === sentLength
          })
          
          if (Math.abs(savedLength - sentLength) > 100) {
            ElMessage.warning('Video may not have been saved correctly. Please try saving again.')
          } else {
            ElMessage.success('Video saved successfully!')
          }
        }
      }
    } else {
      ElMessage.error('Failed to save changes. Please check the console for details.')
    }
  } catch (error) {
    console.error('Error saving home page:', error)
  }
}
</script>

<style scoped>
.home-list {
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
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
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

.video-preview {
  width: 300px;
  min-height: 60px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border: 1px solid #dcdfe6;
}

.upload-status {
  display: flex;
  align-items: center;
  color: #409eff;
  font-size: 14px;
}

.video-status {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.success-icon {
  color: #67c23a;
  font-size: 18px;
}

.text-success {
  color: #67c23a;
  font-weight: 500;
}

.preview-image {
  width: 120px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

/* Services Section Styles */
.services-section {
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

.services-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.service-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.service-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.service-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.service-number-badge {
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

.service-content {
  flex: 1;
  min-width: 0;
}

.service-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-field-label {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.service-input {
  width: 100%;
  max-width: 400px;
}

.service-textarea {
  width: 100%;
  max-width: 500px;
}

.service-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  margin-top: 4px;
}

.service-value {
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

.service-image-preview {
  margin-bottom: 8px;
}

.service-preview-image {
  width: 150px;
  height: 100px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
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

