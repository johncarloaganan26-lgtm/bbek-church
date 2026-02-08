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
    <el-divider />

    <!-- GCash Instruction Text -->
    <div class="list-item">
      <div class="item-label">GCash Instruction Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ giveData.gcashInstructionText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.gcashInstructionText"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter instruction text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- GCash Logo -->
    <div class="list-item">
      <div class="item-label">GCash Logo</div>
      <div class="item-preview">
        <el-image
          v-if="giveData.gcashLogoImage"
          :src="giveData.gcashLogoImage"
          fit="contain"
          class="preview-image"
          style="max-width: 100px; max-height: 100px;"
        />
        <span v-else class="text-grey">No file chosen</span>
      </div>
      <div class="item-action">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleGcashLogoChange"
        >
          <template #trigger>
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              Choose File
            </el-button>
          </template>
        </el-upload>
        <el-button 
          v-if="giveData.gcashLogoImage" 
          size="small" 
          type="danger" 
          plain
          @click="deleteGcashLogo"
          class="ml-2"
        >
          <el-icon><Delete /></el-icon>
          Delete
        </el-button>
        <span v-if="!giveData.gcashLogoImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- GCash QR Code -->
    <div class="list-item">
      <div class="item-label">GCash QR Code</div>
      <div class="item-preview">
        <el-image
          v-if="giveData.gcashQrImage"
          :src="giveData.gcashQrImage"
          fit="contain"
          class="preview-image"
          style="max-width: 150px; max-height: 150px;"
        />
        <span v-else class="text-grey">No file chosen</span>
      </div>
      <div class="item-action">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleGcashQrChange"
        >
          <template #trigger>
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              Choose File
            </el-button>
          </template>
        </el-upload>
        <el-button 
          v-if="giveData.gcashQrImage" 
          size="small" 
          type="danger" 
          plain
          @click="deleteGcashQr"
          class="ml-2"
        >
          <el-icon><Delete /></el-icon>
          Delete
        </el-button>
        <span v-if="!giveData.gcashQrImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- Maya Text -->
    <div class="list-item">
      <div class="item-label">Maya Text</div>
      <div class="item-preview">
        <span class="text-bold">{{ giveData.mayaText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.mayaText"
          size="small"
          placeholder="Enter Maya text"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Maya Number -->
    <div class="list-item">
      <div class="item-label">Maya Number</div>
      <div class="item-preview">
        <span>{{ giveData.mayaNumber }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.mayaNumber"
          size="small"
          placeholder="Enter Maya number"
          style="max-width: 400px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Maya Logo -->
    <div class="list-item">
      <div class="item-label">Maya Logo</div>
      <div class="item-preview">
        <el-image
          v-if="giveData.mayaLogoImage"
          :src="giveData.mayaLogoImage"
          fit="contain"
          class="preview-image"
          style="max-width: 100px; max-height: 100px;"
        />
        <span v-else class="text-grey">No file chosen</span>
      </div>
      <div class="item-action">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleMayaLogoChange"
        >
          <template #trigger>
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              Choose File
            </el-button>
          </template>
        </el-upload>
        <el-button 
          v-if="giveData.mayaLogoImage" 
          size="small" 
          type="danger" 
          plain
          @click="deleteMayaLogo"
          class="ml-2"
        >
          <el-icon><Delete /></el-icon>
          Delete
        </el-button>
        <span v-if="!giveData.mayaLogoImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- Maya QR Code -->
    <div class="list-item">
      <div class="item-label">Maya QR Code</div>
      <div class="item-preview">
        <el-image
          v-if="giveData.mayaQrImage"
          :src="giveData.mayaQrImage"
          fit="contain"
          class="preview-image"
          style="max-width: 150px; max-height: 150px;"
        />
        <span v-else class="text-grey">No file chosen</span>
      </div>
      <div class="item-action">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleMayaQrChange"
        >
          <template #trigger>
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              Choose File
            </el-button>
          </template>
        </el-upload>
        <el-button 
          v-if="giveData.mayaQrImage" 
          size="small" 
          type="danger" 
          plain
          @click="deleteMayaQr"
          class="ml-2"
        >
          <el-icon><Delete /></el-icon>
          Delete
        </el-button>
        <span v-if="!giveData.mayaQrImage" class="text-grey ml-2">No file chosen</span>
      </div>
    </div>
    <el-divider />

    <!-- Maya Instruction Text -->
    <div class="list-item">
      <div class="item-label">Maya Instruction Text</div>
      <div class="item-preview">
        <span class="text-grey">{{ giveData.mayaInstructionText }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="giveData.mayaInstructionText"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter Maya instruction text"
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
import { Upload, Delete } from '@element-plus/icons-vue'
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
  gcashLogoImage: '/img/gcash.png',
  gcashQrImage: '/img/gcash-qr.png',
  gcashInstructionText: 'Send your donation to this GCash account',
  mayaText: 'Maya',
  mayaNumber: '',
  mayaLogoImage: '',
  mayaQrImage: '',
  mayaInstructionText: 'Send your donation to this Maya account',
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

// Handle GCash logo change
const handleGcashLogoChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    giveData.gcashLogoImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle GCash QR code change
const handleGcashQrChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    giveData.gcashQrImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle Maya logo change
const handleMayaLogoChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    giveData.mayaLogoImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle Maya QR code change
const handleMayaQrChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    giveData.mayaQrImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Delete functions for images
const deleteGcashLogo = () => {
  giveData.gcashLogoImage = null
}

const deleteGcashQr = () => {
  giveData.gcashQrImage = null
}

const deleteMayaLogo = () => {
  giveData.mayaLogoImage = null
}

const deleteMayaQr = () => {
  giveData.mayaQrImage = null
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
        // Merge reloaded data - accept all values including empty strings
        Object.keys(defaultGiveData).forEach(key => {
          if (loadedData.hasOwnProperty(key)) {
            const newValue = loadedData[key]
            // Always merge - this ensures empty strings from delete are reflected
            if (key === 'heroImage') {
              // Special handling for heroImage - only set if it's base64
              if (newValue && typeof newValue === 'string' && newValue.startsWith('data:image/')) {
                giveData[key] = newValue
              }
              // If heroImage is empty, keep existing (hero shouldn't be deleted)
            } else {
              giveData[key] = newValue
              console.log(`Updated ${key} from reload:`, newValue)
            }
          } else {
            console.log(`Key ${key} not in loadedData, keeping current value:`, giveData[key])
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

