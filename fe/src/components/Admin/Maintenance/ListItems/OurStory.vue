<template>
  <div class="our-story-list">
    <!-- Hero Image -->
    <div class="list-item">
      <div class="item-label">Hero Image</div>
      <div class="item-preview">
        <el-image
          v-if="storyData.heroImage"
          :src="storyData.heroImage"
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
        <span v-if="!storyData.heroImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- Hero Title -->
    <div class="list-item">
      <div class="item-label">Hero Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ storyData.heroTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.heroTitle"
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
        <span class="text-grey">{{ storyData.heroSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.heroSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter hero subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- About Title -->
    <div class="list-item">
      <div class="item-label">About Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ storyData.aboutTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.aboutTitle"
          size="small"
          placeholder="Enter about title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- About Subtitle -->
    <div class="list-item">
      <div class="item-label">About Subtitle</div>
      <div class="item-preview">
        <span class="text-grey">{{ storyData.aboutSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.aboutSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter about subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Live By Faith Title -->
    <div class="list-item">
      <div class="item-label">Live By Faith Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ storyData.liveByFaithTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.liveByFaithTitle"
          size="small"
          placeholder="Enter live by faith title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Live By Faith Text -->
    <div class="list-item">
      <div class="item-label">Live By Faith Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ storyData.liveByFaithText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.liveByFaithText"
          type="textarea"
          :rows="4"
          size="small"
          placeholder="Enter live by faith text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Known By Love Title -->
    <div class="list-item">
      <div class="item-label">Known By Love Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ storyData.knownByLoveTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.knownByLoveTitle"
          size="small"
          placeholder="Enter known by love title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Known By Love Text -->
    <div class="list-item">
      <div class="item-label">Known By Love Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ storyData.knownByLoveText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.knownByLoveText"
          type="textarea"
          :rows="4"
          size="small"
          placeholder="Enter known by love text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Voice Of Hope Title -->
    <div class="list-item">
      <div class="item-label">Voice Of Hope Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ storyData.voiceOfHopeTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.voiceOfHopeTitle"
          size="small"
          placeholder="Enter voice of hope title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Voice Of Hope Text -->
    <div class="list-item">
      <div class="item-label">Voice Of Hope Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ storyData.voiceOfHopeText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.voiceOfHopeText"
          type="textarea"
          :rows="4"
          size="small"
          placeholder="Enter voice of hope text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- About Image -->
    <div class="list-item">
      <div class="item-label">About Image</div>
      <div class="item-preview">
        <el-image
          v-if="storyData.aboutImage"
          :src="storyData.aboutImage"
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
          @change="handleAboutImageChange"
        >
          <template #trigger>
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              Choose File
            </el-button>
          </template>
        </el-upload>
        <span v-if="!storyData.aboutImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- Vision -->
    <div class="list-item">
      <div class="item-label">Vision</div>
      <div class="item-preview">
        <span class="text-grey">{{ storyData.vision }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.vision"
          type="textarea"
          :rows="4"
          size="small"
          placeholder="Enter vision statement"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Mission -->
    <div class="list-item">
      <div class="item-label">Mission</div>
      <div class="item-preview">
        <span class="text-grey">{{ storyData.mission }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.mission"
          type="textarea"
          :rows="4"
          size="small"
          placeholder="Enter mission statement"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Vision Verse -->
    <div class="list-item">
      <div class="item-label">Vision Verse</div>
      <div class="item-preview">
        <span class="text-grey">{{ storyData.visionVerse }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.visionVerse"
          size="small"
          placeholder="Enter vision verse"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- History Title -->
    <div class="list-item">
      <div class="item-label">History Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ storyData.historyTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.historyTitle"
          size="small"
          placeholder="Enter history title"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- History Subtitle -->
    <div class="list-item">
      <div class="item-label">History Subtitle</div>
      <div class="item-preview">
        <span class="text-grey">{{ storyData.historySubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="storyData.historySubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter history subtitle"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Timeline Section -->
    <div class="timeline-section">
      <div class="section-header">
        <div class="section-header-left">
          <h3 class="section-title">Timeline</h3>
          <span class="section-count">{{ storyData.timeline?.length || 0 }} items</span>
        </div>
        <el-button type="primary" size="default" @click="showAddTimelineDialog">
          <el-icon><Plus /></el-icon>
          Add Timeline Item
        </el-button>
      </div>

      <div class="timeline-container">
        <template v-for="(item, index) in storyData.timeline" :key="`timeline-${index}`">
          <div class="timeline-card">
            <div class="timeline-header">
              <div class="timeline-number-badge">{{ index + 1 }}</div>
              <div class="timeline-content">
                <div class="timeline-fields">
                  <div class="timeline-field">
                    <label class="timeline-field-label">Year</label>
                    <el-input
                      v-model="item.year"
                      size="default"
                      placeholder="Year"
                      class="timeline-input"
                    />
                    <div class="timeline-meta">
                      <span class="timeline-value text-bold">{{ item.year }}</span>
                    </div>
                  </div>
                  <div class="timeline-field">
                    <label class="timeline-field-label">Title</label>
                    <el-input
                      v-model="item.title"
                      size="default"
                      placeholder="Timeline title"
                      class="timeline-input"
                    />
                    <div class="timeline-meta">
                      <span class="timeline-value text-bold">{{ item.title }}</span>
                    </div>
                  </div>
                  <div class="timeline-field">
                    <label class="timeline-field-label">Description</label>
                    <el-input
                      v-model="item.description"
                      type="textarea"
                      :rows="3"
                      size="small"
                      placeholder="Timeline description"
                      class="timeline-textarea"
                    />
                    <div class="timeline-meta">
                      <span class="timeline-value">{{ item.description }}</span>
                    </div>
                  </div>
                  <div class="timeline-field">
                    <label class="timeline-field-label">Image</label>
                    <div class="timeline-image-preview">
                      <el-image
                        v-if="item.image"
                        :src="item.image"
                        fit="cover"
                        class="timeline-preview-image"
                      />
                      <span v-else class="text-grey">No image selected</span>
                    </div>
                    <el-upload
                      :auto-upload="false"
                      :show-file-list="false"
                      accept="image/*"
                      @change="(file) => handleTimelineImageChange(file, index)"
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
              <div class="timeline-actions">
                <el-button
                  type="danger"
                  size="small"
                  @click="deleteTimelineItem(index)"
                >
                  Delete
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Add Timeline Dialog -->
    <el-dialog
      v-model="addTimelineDialogVisible"
      title="Add New Timeline Item"
      width="500px"
      @close="closeAddTimelineDialog"
    >
      <div class="edit-dialog-content">
        <div class="form-group">
          <label>Year:</label>
          <el-input
            v-model="newTimelineItem.year"
            placeholder="Enter year"
            style="margin-top: 8px;"
          ></el-input>
        </div>
        <div class="form-group" style="margin-top: 16px;">
          <label>Title:</label>
          <el-input
            v-model="newTimelineItem.title"
            placeholder="Enter title"
            style="margin-top: 8px;"
          ></el-input>
        </div>
        <div class="form-group" style="margin-top: 16px;">
          <label>Description:</label>
          <el-input
            v-model="newTimelineItem.description"
            type="textarea"
            :rows="3"
            placeholder="Enter description"
            style="margin-top: 8px;"
          ></el-input>
        </div>
        <div class="form-group" style="margin-top: 16px;">
          <label>Image:</label>
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleNewTimelineImageChange"
            style="margin-top: 8px;"
          >
            <template #trigger>
              <el-button size="small" type="primary">
                <el-icon><Upload /></el-icon>
                Choose File
              </el-button>
            </template>
          </el-upload>
          <span v-if="!newTimelineItem.image" class="text-grey ml-2">No file chosen</span>
          <span v-else class="text-grey ml-2">Image selected</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeAddTimelineDialog">Cancel</el-button>
          <el-button type="primary" @click="addNewTimelineItem">Add Timeline Item</el-button>
        </span>
      </template>
    </el-dialog>
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
  storyData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'ourStory'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('ourstory')

// Default data structure aligned with landing page
const defaultStoryData = {
  heroImage: '',
  heroTitle: 'Our Story',
  heroSubtitle: 'A community of believers dedicated to spreading the love and teachings of Jesus Christ.',
  aboutTitle: 'About Our Church',
  aboutSubtitle: 'We look forward to welcoming you into our family of faith. Our vision is to be a Christ-centered community that:',
  liveByFaithTitle: 'Live By Faith',
  liveByFaithText: 'Boldly proclaim and practice the Gospel in daily life\nTrust God\'s promises with unwavering confidence',
  knownByLoveTitle: 'Known By Love',
  knownByLoveText: 'Extend grace without judgment — love first, listen deeply\nServe others sacrificially, going beyond what is expected',
  voiceOfHopeTitle: 'A Voice of Hope',
  voiceOfHopeText: 'Declare Jesus as our "Blessed Redeemer" (Galatians 3:13)\nKeep our eyes fixed on eternity, living with Kingdom perspective',
  aboutImage: '',
  mission: 'To glorify God by making disciples of Jesus Christ through biblical preaching, authentic worship, and compassionate service to our community and the world.',
  vision: 'To be a thriving church community that transforms lives, strengthens families, and impacts our city and beyond with the love and truth of Jesus Christ.',
  visionVerse: 'Matthew 28:19-20',
  historyTitle: 'Our History',
  historySubtitle: 'Celebrating our journey of faith, missions, and community from humble beginnings to a global vision.',
  timeline: [
    {
      year: '2025',
      title: '10th Church Anniversary & 4th World Missions Conference',
      description: 'We look forward to celebrating our 10th anniversary as a church and hosting our 4th World Missions Conference.',
      image: ''
    },
    {
      year: '2021',
      title: '1st World Missions Conference',
      description: 'We hosted our first World Missions Conference, bringing together missionaries and supporters to further the Great Commission.',
      image: ''
    },
    {
      year: '2016',
      title: '1st Anniversary Celebration as an Organized Church',
      description: 'We celebrated our first anniversary as an officially organized church, marking a significant milestone in our journey.',
      image: ''
    },
    {
      year: '2015',
      title: 'Started to Support Foreign Missionaries',
      description: 'We expanded our mission work by beginning to support foreign missionaries, extending our reach globally.',
      image: ''
    },
    {
      year: '2006',
      title: 'Started Mission Work in Kawit',
      description: 'Our church began as a small mission work in Kawit, Cavite, with a vision to reach the community with the Gospel.',
      image: ''
    }
  ]
}

// Initialize with defaults to ensure all fields are reactive
const storyData = reactive(JSON.parse(JSON.stringify(defaultStoryData)))

// If props provide data, merge it
if (props.storyData) {
  const propData = JSON.parse(JSON.stringify(props.storyData))
  Object.keys(propData).forEach(key => {
    if (key === 'timeline' && Array.isArray(propData[key])) {
      storyData.timeline = propData[key].map(item => ({ ...item }))
    } else {
      storyData[key] = propData[key]
    }
  })
}

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'ourStory') {
    console.log('Loading Our Story CMS data...')
    const loadedData = await loadPageData()
    console.log('Loaded data from CMS:', loadedData)
    
    if (loadedData && typeof loadedData === 'object') {
      // Merge loaded data into reactive object, preserving defaults for missing fields
      Object.keys(defaultStoryData).forEach(key => {
        if (loadedData.hasOwnProperty(key)) {
          // Special handling for heroImage and aboutImage - they should be base64 after composable merges
          if ((key === 'heroImage' || key === 'aboutImage') && loadedData[key]) {
            const image = loadedData[key]
            if (typeof image === 'string' && image.startsWith('data:image/')) {
              storyData[key] = image
              console.log(`Set ${key}: base64 image (length: ${image.length})`)
            } else {
              console.log(`${key} is not base64, keeping default`)
            }
          } else if (key === 'timeline' && Array.isArray(loadedData[key])) {
            // Handle timeline array with images
            storyData.timeline = loadedData[key].map((item, index) => {
              const timelineItem = {
                year: item.year || '',
                title: item.title || '',
                description: item.description || '',
                image: ''
              }
              
              // Check if timeline item has image (base64 after composable merges)
              if (item.image && typeof item.image === 'string' && item.image.startsWith('data:image/')) {
                timelineItem.image = item.image
                console.log(`Set timeline[${index}].image: base64 image`)
              } else {
                console.log(`Timeline ${index} image is not base64`)
              }
              
              return timelineItem
            })
            console.log(`Set timeline: ${storyData.timeline.length} items`)
          } else {
            storyData[key] = loadedData[key]
            console.log(`Set ${key}:`, loadedData[key])
          }
        } else {
          // Keep default value if not in loaded data
          console.log(`Keeping default for ${key}:`, defaultStoryData[key])
        }
      })
      
      // Also handle any additional fields that might be in loaded data
      Object.keys(loadedData).forEach(key => {
        if (!defaultStoryData.hasOwnProperty(key)) {
          storyData[key] = loadedData[key]
          console.log(`Set additional field ${key}:`, loadedData[key])
        }
      })
      
      console.log('Final storyData:', storyData)
    } else {
      console.log('No data loaded, using defaults')
    }
  }
})

// Watch for prop changes
watch(() => props.storyData, (newData) => {
  if (newData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    // Update timeline array
    if (cloned.timeline && Array.isArray(cloned.timeline)) {
      storyData.timeline = cloned.timeline.map(item => ({ ...item }))
    }
    // Update other properties
    Object.keys(cloned).forEach(key => {
      if (key !== 'timeline') {
        storyData[key] = cloned[key]
      }
    })
  }
}, { deep: true })

// Add timeline dialog state
const addTimelineDialogVisible = ref(false)
const newTimelineItem = reactive({
  year: '',
  title: '',
  description: '',
  image: ''
})

// Handle hero image change
const handleHeroImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    storyData.heroImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle about image change
const handleAboutImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    storyData.aboutImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle timeline image change
const handleTimelineImageChange = (file, index) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    storyData.timeline[index].image = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle new timeline image change
const handleNewTimelineImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    newTimelineItem.image = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Show add timeline dialog
const showAddTimelineDialog = () => {
  addTimelineDialogVisible.value = true
}

// Close add timeline dialog
const closeAddTimelineDialog = () => {
  addTimelineDialogVisible.value = false
  newTimelineItem.year = ''
  newTimelineItem.title = ''
  newTimelineItem.description = ''
  newTimelineItem.image = ''
}

// Add new timeline item
const addNewTimelineItem = () => {
  if (newTimelineItem.year.trim() && newTimelineItem.title.trim()) {
    storyData.timeline.push({
      year: newTimelineItem.year.trim(),
      title: newTimelineItem.title.trim(),
      description: newTimelineItem.description.trim(),
      image: newTimelineItem.image
    })
    closeAddTimelineDialog()
  } else {
    // eslint-disable-next-line no-alert
    alert('Please enter a year and title')
  }
}

// Delete timeline item
const deleteTimelineItem = (index) => {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure you want to delete this timeline item?')) {
    storyData.timeline.splice(index, 1)
  }
}

// Save changes to CMS
// Hero image, about image, and timeline images are saved as BLOB in database (not in JSON)
// Flow: base64 in content → composable extracts → backend converts to Buffer → saves as BLOB
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    console.log('Saving Our Story data:', storyData)
    const contentToSave = JSON.parse(JSON.stringify(storyData))
    
    // Keep images in content - composable will extract them and save as BLOB
    // The composable's extractImagesFromContent will automatically extract base64 images
    // Backend will convert base64 to Buffer and save as BLOB in tbl_cms_images
    if (contentToSave.heroImage && typeof contentToSave.heroImage === 'string' && contentToSave.heroImage.startsWith('data:image/')) {
      console.log('Hero image will be saved as BLOB (base64 length:', contentToSave.heroImage.length, ')')
    } else if (contentToSave.heroImage) {
      console.log('Hero image is not base64, keeping as is')
    }
    
    if (contentToSave.aboutImage && typeof contentToSave.aboutImage === 'string' && contentToSave.aboutImage.startsWith('data:image/')) {
      console.log('About image will be saved as BLOB (base64 length:', contentToSave.aboutImage.length, ')')
    }
    
    // Timeline images are kept in the timeline array - composable will extract them
    if (contentToSave.timeline && Array.isArray(contentToSave.timeline)) {
      contentToSave.timeline.forEach((item, index) => {
        if (item.image && typeof item.image === 'string' && item.image.startsWith('data:image/')) {
          console.log(`Timeline ${index} image will be saved as BLOB (base64 length: ${item.image.length})`)
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
        Object.keys(defaultStoryData).forEach(key => {
          if (loadedData.hasOwnProperty(key)) {
            // Special handling for heroImage and aboutImage
            if ((key === 'heroImage' || key === 'aboutImage') && loadedData[key] && typeof loadedData[key] === 'string' && loadedData[key].startsWith('data:image/')) {
              storyData[key] = loadedData[key]
            } else if (key === 'timeline' && Array.isArray(loadedData[key])) {
              // Handle timeline array with images
              storyData.timeline = loadedData[key].map((item) => ({
                year: item.year || '',
                title: item.title || '',
                description: item.description || '',
                image: (item.image && typeof item.image === 'string' && item.image.startsWith('data:image/')) ? item.image : ''
              }))
            } else if (key !== 'heroImage' && key !== 'aboutImage') {
              storyData[key] = loadedData[key]
            }
          }
        })
        
        // Handle additional fields
        Object.keys(loadedData).forEach(key => {
          if (!defaultStoryData.hasOwnProperty(key)) {
            storyData[key] = loadedData[key]
          }
        })
        
        console.log('Updated storyData after reload:', storyData)
      }
    } else {
      console.error('Save failed')
    }
  } catch (error) {
    console.error('Error saving our story page:', error)
  }
}
</script>

<style scoped>
.our-story-list {
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

/* Timeline Section Styles */
.timeline-section {
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

.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.timeline-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.timeline-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.timeline-number-badge {
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

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-field-label {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.timeline-input {
  width: 100%;
  max-width: 400px;
}

.timeline-textarea {
  width: 100%;
  max-width: 500px;
}

.timeline-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  margin-top: 4px;
}

.timeline-value {
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

.timeline-actions {
  display: flex;
  gap: 8px;
}

.timeline-image-preview {
  margin-bottom: 8px;
}

.timeline-preview-image {
  width: 150px;
  height: 100px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
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
