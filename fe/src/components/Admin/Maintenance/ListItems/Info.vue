<template>
  <div class="info-list pa-4">
    <!-- Background Image -->
    <v-card class="mb-4" elevation="2">
      <v-card-title class="text-h6 font-weight-bold">
        Background Image
      </v-card-title>
      <v-card-text>
        <!-- Upload Button -->
        <v-btn
          color="primary"
          prepend-icon="mdi-upload"
          class="mb-2"
          @click="triggerFileUpload"
        >
          Upload Image
        </v-btn>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleImageUpload"
        />
        
        <!-- Current Image Path -->
        <v-text-field
          v-model="infoData.backgroundImage"
          label="Background Image Path"
          placeholder="/img/your-image.jpg"
          hint="Enter the image path or upload a new image"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-2"
        />
        
        <div v-if="infoData.backgroundImage" class="mt-2">
          <p class="text-body-2 text-grey mb-2">Preview:</p>
          <v-img
            :src="infoData.backgroundImage"
            max-height="200"
            contain
            class="bg-grey-lighten-3"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Column 1 Settings -->
    <v-card class="mb-4" elevation="2">
      <v-card-title class="text-h6 font-weight-bold">
        Column 1 - Sunday Service
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="infoData.column1Icon"
          label="Icon Name"
          placeholder="mdi-clock-outline"
          hint="Use Material Design Icons names"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <v-text-field
          v-model="infoData.column1Title"
          label="Title"
          placeholder="SUNDAY SERVICE"
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <v-textarea
          v-model="infoData.column1Text"
          label="Text"
          placeholder="Enter text (use <br> for line breaks)"
          variant="outlined"
          rows="3"
          auto-grow
        />
      </v-card-text>
    </v-card>

    <!-- Column 2 Settings -->
    <v-card class="mb-4" elevation="2">
      <v-card-title class="text-h6 font-weight-bold">
        Column 2 - Watch Online
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="infoData.column2Icon"
          label="Icon Name"
          placeholder="mdi-laptop"
          hint="Use Material Design Icons names"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <v-text-field
          v-model="infoData.column2Title"
          label="Title"
          placeholder="WATCH ONLINE"
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <v-textarea
          v-model="infoData.column2Text"
          label="Text"
          placeholder="Enter text (use <br> for line breaks)"
          variant="outlined"
          rows="3"
          auto-grow
          class="mb-2"
        />

        <v-text-field
          v-model="infoData.watchLiveButtonText"
          label="Button Text"
          placeholder="WATCH LIVE"
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <v-text-field
          v-model="infoData.watchLiveLink"
          label="Button Link"
          placeholder="/live"
          variant="outlined"
          density="compact"
        />
      </v-card-text>
    </v-card>

    <!-- Column 3 Settings -->
    <v-card class="mb-4" elevation="2">
      <v-card-title class="text-h6 font-weight-bold">
        Column 3 - Give
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="infoData.column3Icon"
          label="Icon Name"
          placeholder="mdi-cash"
          hint="Use Material Design Icons names"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <v-text-field
          v-model="infoData.column3Title"
          label="Title"
          placeholder="GIVE"
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <v-textarea
          v-model="infoData.column3Text"
          label="Text"
          placeholder="Enter text (use <br> for line breaks)"
          variant="outlined"
          rows="3"
          auto-grow
          class="mb-2"
        />

        <v-text-field
          v-model="infoData.giveButtonText"
          label="Button Text"
          placeholder="GIVE"
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <v-text-field
          v-model="infoData.giveLink"
          label="Button Link"
          placeholder="/give"
          variant="outlined"
          density="compact"
        />
      </v-card-text>
    </v-card>

    <!-- Button Color -->
    <v-card class="mb-4" elevation="2">
      <v-card-title class="text-h6 font-weight-bold">
        Button Color
      </v-card-title>
      <v-card-text>
        <div class="d-flex align-center">
          <v-color-picker
            v-model="infoData.buttonColor"
            hide-inputs
            hide-canvas
            show-swatches
            swatches-max-height="100"
          />
          <div class="ml-4">
            <v-text-field
              v-model="infoData.buttonColor"
              label="Hex Color"
              variant="outlined"
              density="compact"
              style="width: 150px;"
            />
            <v-btn
              :color="infoData.buttonColor"
              class="text-white mt-2"
            >
              Preview Button
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Save Button -->
    <div class="d-flex align-center">
      <v-btn
        color="primary"
        size="large"
        :loading="saving"
        @click="saveInfoData"
      >
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </v-btn>
      <v-chip
        v-if="saveStatus"
        :color="saveStatus.type === 'success' ? 'success' : 'error'"
        class="ml-2"
      >
        {{ saveStatus.message }}
      </v-chip>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import axios from '@/api/axios'

const props = defineProps({
  infoData: {
    type: Object,
    default: () => ({})
  },
  activeSection: {
    type: String,
    required: true,
    default: 'info'
  }
})

// File input ref
const fileInput = ref(null)

// Saving state
const saving = ref(false)

// Save status
const saveStatus = ref(null)

// Default data structure
const defaultInfoData = {
  backgroundImage: '/img/abt.jpg',
  column1Icon: 'mdi-clock-outline',
  column1Title: 'SUNDAY SERVICE',
  column1Text: 'Bible Baptist Ekklesia of Kawit<br>Time: 10:00am<br>Location: 485 Acacia St., Villa Ramirez, Tabon 1, Kawit, Cavite',
  column2Icon: 'mdi-laptop',
  column2Title: 'WATCH ONLINE',
  column2Text: 'Sunday: 10:00am<br>Wednesday: 7:00pm',
  watchLiveButtonText: 'WATCH LIVE',
  watchLiveLink: '/live',
  column3Icon: 'mdi-cash',
  column3Title: 'GIVE',
  column3Text: 'Support the ministry and missions of our church.<br>Be a part of what God is doing.',
  giveButtonText: 'GIVE',
  giveLink: '/give',
  buttonColor: '#008080'
}

// Initialize reactive data with defaults
const infoData = reactive(JSON.parse(JSON.stringify(defaultInfoData)))

// Create a reactive copy of the data
const createReactiveCopy = (data) => {
  if (!data) return reactive(JSON.parse(JSON.stringify(defaultInfoData)))
  return reactive(JSON.parse(JSON.stringify(data)))
}

// Trigger file upload dialog
const triggerFileUpload = () => {
  fileInput.value?.click()
}

// Handle image upload
const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) {
    console.log('No file selected')
    return
  }
  
  console.log('=== Image Upload ===')
  console.log('File:', file.name, file.size, file.type)
  
  try {
    saving.value = true
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', 'info')
    
    console.log('Uploading to /cms/upload-image...')
    const response = await axios.post('/cms/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    console.log('Upload response:', response.data)
    
    if (response.data.success) {
      infoData.backgroundImage = response.data.imagePath
      console.log('Updated backgroundImage to:', response.data.imagePath)
      saveStatus.value = { type: 'success', message: 'Image uploaded!' }
    } else {
      saveStatus.value = { type: 'error', message: response.data.message || 'Upload failed' }
    }
  } catch (error) {
    console.error('Upload error:', error)
    console.error('Response:', error.response)
    saveStatus.value = { type: 'error', message: 'Upload failed' }
  } finally {
    saving.value = false
  }
}

// Load function - using direct axios call
const loadInfoData = async () => {
  try {
    const response = await axios.get('/cms/info')
    if (response.data.success && response.data.data) {
      const content = response.data.data.content
      if (content) {
        Object.keys(defaultInfoData).forEach(key => {
          if (content.hasOwnProperty(key)) {
            infoData[key] = content[key]
          }
        })
        console.log('Info data loaded:', infoData)
        return content
      }
    }
    return null
  } catch (error) {
    console.log('No existing info data, using defaults')
    return null
  }
}

// Save function - using direct axios call
const saveInfoData = async () => {
  try {
    saving.value = true
    saveStatus.value = null
    console.log('=== Starting Save ===')
    console.log('Current infoData:', JSON.stringify(infoData, null, 2))
    
    const contentToSave = JSON.parse(JSON.stringify(infoData))
    console.log('Content to save:', JSON.stringify(contentToSave, null, 2))
    
    // Direct save to /api/cms/info endpoint
    console.log('Sending POST to /cms/info...')
    const response = await axios.post('/cms/info', {
      content: contentToSave
    })
    
    console.log('=== Response Details ===')
    console.log('Full response object:', response)
    console.log('response.status:', response.status)
    console.log('response.statusText:', response.statusText)
    console.log('response.data:', response.data)
    console.log('response.data.success:', response.data?.success)
    console.log('typeof response.data:', typeof response.data)
    
    if (response.data && response.data.success) {
      saveStatus.value = { type: 'success', message: 'Saved successfully!' }
      console.log('✅ Save successful!')
      
      // Reload the data
      setTimeout(async () => {
        console.log('=== Reloading Data ===')
        const loadedData = await loadInfoData()
        console.log('Loaded data:', loadedData)
        if (loadedData) {
          Object.keys(defaultInfoData).forEach(key => {
            if (loadedData.hasOwnProperty(key)) {
              infoData[key] = loadedData[key]
              console.log(`Updated ${key}:`, loadedData[key])
            }
          })
        }
      }, 500)
    } else {
      saveStatus.value = { type: 'error', message: response.data?.message || response.data?.error || 'Failed to save' }
      console.error('❌ Save failed:', response.data)
    }
  } catch (error) {
    console.error('=== Save Error ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
    saveStatus.value = { type: 'error', message: error.response?.data?.message || error.message || 'Error saving' }
  } finally {
    saving.value = false
  }
}

// Watch for prop changes
watch(() => props.infoData, (newData) => {
  if (newData) {
    const cloned = createReactiveCopy(newData)
    Object.keys(cloned).forEach(key => {
      infoData[key] = cloned[key]
    })
  }
}, { deep: true })

onMounted(async () => {
  if (props.activeSection === 'info') {
    console.log('Loading Info CMS data...')
    const loadedData = await loadInfoData()
    if (loadedData) {
      // Merge loaded data into reactive object, preserving defaults for missing fields
      Object.keys(defaultInfoData).forEach(key => {
        if (loadedData.hasOwnProperty(key)) {
          infoData[key] = loadedData[key]
          console.log(`Set ${key}:`, loadedData[key])
        } else {
          // Keep default value if not in loaded data
          console.log(`Keeping default for ${key}:`, defaultInfoData[key])
        }
      })
      
      // Also merge any additional fields that might have been added
      Object.keys(loadedData).forEach(key => {
        if (!defaultInfoData.hasOwnProperty(key)) {
          infoData[key] = loadedData[key]
          console.log(`Set additional field ${key}:`, loadedData[key])
        }
      })
      
      console.log('Final infoData:', infoData)
    } else {
      console.log('No CMS data loaded, using defaults')
    }
  }
})
</script>

<style scoped>
.info-list {
  width: 100%;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-4 {
  margin-left: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.mt-2 {
  margin-top: 8px;
}
</style>
