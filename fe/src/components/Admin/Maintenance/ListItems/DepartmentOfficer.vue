<template>
  <div class="department-officer-list">
    <div class="cms-notice mb-6">
      <el-alert
        title="Page Settings"
        type="info"
        description="This section manages the header and visual settings for the Department Officers page. Individual officer profiles (names, roles, departments, images) are now managed in the 'Church Records > Department Officers' section."
        show-icon
        :closable="false"
      />
    </div>

    <!-- Hero Image -->
    <div class="list-item">
      <div class="item-label">Hero Image</div>
      <div class="item-preview">
        <el-image
          v-if="officersData.heroImage"
          :src="officersData.heroImage"
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

    <!-- Background Color -->
    <div class="list-item">
      <div class="item-label">Section Background Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: officersData.backgroundColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="officersData.backgroundColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Hero Title -->
    <div class="list-item">
      <div class="item-label">Hero Title</div>
      <div class="item-preview">
        <span class="text-bold">{{ officersData.heroTitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="officersData.heroTitle"
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
        <span class="text-grey">{{ officersData.heroSubtitle }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="officersData.heroSubtitle"
          type="textarea"
          :rows="3"
          size="small"
          placeholder="Enter hero subtitle"
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
          :style="{ backgroundColor: officersData.backButtonColor, borderColor: officersData.backButtonColor }"
          size="small"
          type="primary"
        >
          {{ officersData.backButtonText }}
        </el-button>
      </div>
      <div class="item-action">
        <el-input
          v-model="officersData.backButtonText"
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
          :style="{ backgroundColor: officersData.backButtonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="officersData.backButtonColor"
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
  officersData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'departmentOfficer'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('departmentofficer')

// Default data structure aligned with landing page
const defaultOfficersData = {
  heroImage: '',
  heroTitle: 'Department Officers',
  heroSubtitle: 'Dedicated leaders serving and growing together in Christ.',
  backgroundColor: '#ffffff',
  backButtonText: 'Back to About',
  backButtonColor: '#14b8a6',
  departments: [
    {
      name: 'Adult Ladies Department',
      officers: [
        { name: 'Sis. Danica Aldousari', role: 'President/Coordinator', image: '' },
        { name: 'Sis. Melody Bilog', role: 'Vice President', image: '' },
        { name: 'Sis. Espie Apelado', role: 'Secretary', image: '' },
        { name: 'Sis. Nancy Belleza', role: 'Treasurer', image: '' },
        { name: "Ma'am Gina Sulapas", role: 'Auditor', image: '' }
      ]
    },
    {
      name: 'Adult Men Department',
      officers: [
        { name: 'Bro. Danny Delos santos', role: 'President', image: '' },
        { name: 'Bro. Roland Santos', role: 'Vice President', image: '' },
        { name: 'Bro. Robert Apelado', role: 'Secretary', image: '' },
        { name: 'Bro. Rowel Bucayan', role: 'Treasurer', image: '' }
      ]
    },
    {
      name: 'Young People Department',
      officers: [
        { name: 'Sis. Jessica Las', role: 'President', image: '' },
        { name: 'Bro. Jessie Timuat', role: 'Vice President', image: '' },
        { name: 'Sis. Erica Villegas', role: 'Secretary', image: '' },
        { name: 'Sis. Selah Acojedo', role: 'Assistant Secretary', image: '' },
        { name: 'Sis. Frena May Sulapas', role: 'Treasurer', image: '' },
        { name: 'Sis. Camille Bucayan', role: 'PIO', image: '' },
        { name: 'Sis. Donita Sibugan', role: 'Social Media Coordinator', image: '' }
      ]
    }
  ]
}

// Initialize with defaults to ensure all fields are reactive
const officersData = reactive(JSON.parse(JSON.stringify(defaultOfficersData)))

// If props provide data, merge it
if (props.officersData) {
  const propData = JSON.parse(JSON.stringify(props.officersData))
  Object.keys(propData).forEach(key => {
    if (key === 'departments' && Array.isArray(propData[key])) {
      officersData.departments = propData[key].map(dept => ({
        name: dept.name || '',
        officers: (dept.officers || []).map(officer => ({ ...officer }))
      }))
    } else {
      officersData[key] = propData[key]
    }
  })
}

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'departmentOfficer') {
    console.log('Loading Department Officer CMS data...')
    const loadedData = await loadPageData()
    console.log('Loaded data from CMS:', loadedData)
    
    if (loadedData && typeof loadedData === 'object') {
      // Merge loaded data into reactive object, preserving defaults for missing fields
      Object.keys(defaultOfficersData).forEach(key => {
        if (loadedData.hasOwnProperty(key)) {
          // Special handling for heroImage - it should be base64 after composable merges
          if (key === 'heroImage' && loadedData[key]) {
            const heroImage = loadedData[key]
            if (typeof heroImage === 'string' && heroImage.startsWith('data:image/')) {
              officersData[key] = heroImage
              console.log(`Set ${key}: base64 image (length: ${heroImage.length})`)
            } else {
              console.log(`Hero image is not base64, keeping default`)
            }
          } else if (key === 'departments' && Array.isArray(loadedData[key])) {
            // Handle departments array with nested officers and images
            officersData.departments = loadedData[key].map((dept, deptIndex) => {
              const department = {
                name: dept.name || '',
                officers: []
              }
              
              if (dept.officers && Array.isArray(dept.officers)) {
                department.officers = dept.officers.map((officer, officerIndex) => {
                  const officerObj = {
                    name: officer.name || '',
                    role: officer.role || '',
                    image: ''
                  }
                  
                  // Check if officer has image (base64 after composable merges)
                  if (officer.image && typeof officer.image === 'string' && officer.image.startsWith('data:image/')) {
                    officerObj.image = officer.image
                    console.log(`Set departments[${deptIndex}].officers[${officerIndex}].image: base64 image`)
                  } else {
                    console.log(`Officer ${deptIndex}-${officerIndex} image is not base64`)
                  }
                  
                  return officerObj
                })
              }
              
              return department
            })
            console.log(`Set departments: ${officersData.departments.length} departments`)
          } else {
            officersData[key] = loadedData[key]
            console.log(`Set ${key}:`, loadedData[key])
          }
        } else {
          // Keep default value if not in loaded data
          console.log(`Keeping default for ${key}:`, defaultOfficersData[key])
        }
      })
      
      // Also handle any additional fields that might be in loaded data
      Object.keys(loadedData).forEach(key => {
        if (!defaultOfficersData.hasOwnProperty(key)) {
          officersData[key] = loadedData[key]
          console.log(`Set additional field ${key}:`, loadedData[key])
        }
      })
      
      console.log('Final officersData:', officersData)
    } else {
      console.log('No data loaded, using defaults')
    }
  }
})

// Watch for prop changes
watch(() => props.officersData, (newData) => {
  if (newData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    // Update departments array
    if (cloned.departments && Array.isArray(cloned.departments)) {
      officersData.departments = cloned.departments.map(dept => ({
        name: dept.name || '',
        officers: (dept.officers || []).map(officer => ({ ...officer }))
      }))
    }
    // Update other properties
    Object.keys(cloned).forEach(key => {
      if (key !== 'departments') {
        officersData[key] = cloned[key]
      }
    })
  }
}, { deep: true })

// Edit dialog state
const editDialogVisible = ref(false)
const editingDeptIndex = ref(-1)
const editingOfficerIndex = ref(-1)
const editingOfficer = reactive({
  name: '',
  role: '',
  image: ''
})

// Add dialog state
const addDialogVisible = ref(false)
const addOfficerDeptIndex = ref(-1)
const newOfficer = reactive({
  name: '',
  role: '',
  image: ''
})

// Add department dialog state
const addDepartmentDialogVisible = ref(false)
const newDepartment = reactive({
  name: ''
})

// Get initials for avatar placeholder
const getInitials = (name) => {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Handle hero image change
const handleHeroImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    officersData.heroImage = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle image change for officers
const handleImageChange = (file, deptIndex, officerIndex) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    officersData.departments[deptIndex].officers[officerIndex].image = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Handle image change in edit dialog
const handleEditImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    editingOfficer.image = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Edit department
const editDepartment = (deptIndex) => {
  const dept = officersData.departments[deptIndex]
  const newName = prompt('Enter new department name:', dept.name)
  if (newName && newName.trim()) {
    officersData.departments[deptIndex].name = newName.trim()
  }
}

// Delete department
const deleteDepartment = (deptIndex) => {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure you want to delete this department? All officers in this department will also be deleted.')) {
    officersData.departments.splice(deptIndex, 1)
  }
}

// Edit officer
const editOfficer = (deptIndex, officerIndex) => {
  editingDeptIndex.value = deptIndex
  editingOfficerIndex.value = officerIndex
  const officer = officersData.departments[deptIndex].officers[officerIndex]
  editingOfficer.name = officer.name || ''
  editingOfficer.role = officer.role || ''
  editingOfficer.image = officer.image || ''
  editDialogVisible.value = true
}

// Save officer edit
const saveOfficerEdit = () => {
  if (editingDeptIndex.value >= 0 && editingOfficerIndex.value >= 0) {
    officersData.departments[editingDeptIndex.value].officers[editingOfficerIndex.value].name = editingOfficer.name
    officersData.departments[editingDeptIndex.value].officers[editingOfficerIndex.value].role = editingOfficer.role
    officersData.departments[editingDeptIndex.value].officers[editingOfficerIndex.value].image = editingOfficer.image
  }
  closeEditDialog()
}

// Close edit dialog
const closeEditDialog = () => {
  editDialogVisible.value = false
  editingDeptIndex.value = -1
  editingOfficerIndex.value = -1
  editingOfficer.name = ''
  editingOfficer.role = ''
  editingOfficer.image = ''
}

// Delete officer
const deleteOfficer = (deptIndex, officerIndex) => {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure you want to delete this officer?')) {
    officersData.departments[deptIndex].officers.splice(officerIndex, 1)
  }
}

// Show add department dialog
const showAddDepartmentDialog = () => {
  addDepartmentDialogVisible.value = true
}

// Close add department dialog
const closeAddDepartmentDialog = () => {
  addDepartmentDialogVisible.value = false
  newDepartment.name = ''
}

// Add new department
const addNewDepartment = () => {
  if (newDepartment.name.trim()) {
    officersData.departments.push({
      name: newDepartment.name.trim(),
      officers: []
    })
    closeAddDepartmentDialog()
  } else {
    // eslint-disable-next-line no-alert
    alert('Please enter a department name')
  }
}

// Show add officer dialog
const showAddOfficerDialog = (deptIndex) => {
  addOfficerDeptIndex.value = deptIndex
  addDialogVisible.value = true
}

// Handle image change for new officer
const handleNewOfficerImageChange = (file) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    newOfficer.image = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Close add dialog
const closeAddDialog = () => {
  addDialogVisible.value = false
  addOfficerDeptIndex.value = -1
  newOfficer.name = ''
  newOfficer.role = ''
  newOfficer.image = ''
}

// Add new officer
const addNewOfficer = () => {
  if (newOfficer.name.trim() && addOfficerDeptIndex.value >= 0) {
    officersData.departments[addOfficerDeptIndex.value].officers.push({
      name: newOfficer.name.trim(),
      role: newOfficer.role.trim(),
      image: newOfficer.image
    })
    closeAddDialog()
  } else {
    // eslint-disable-next-line no-alert
    alert('Please enter an officer name')
  }
}

// Save changes to CMS
// Hero image and officer images are saved as BLOB in database (not in JSON)
// Flow: base64 in content → composable extracts → backend converts to Buffer → saves as BLOB
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    console.log('Saving Department Officer data:', officersData)
    const contentToSave = JSON.parse(JSON.stringify(officersData))
    
    // Keep hero image and officer images in content - composable will extract them and save as BLOB
    // The composable's extractImagesFromContent will automatically extract base64 images
    // Backend will convert base64 to Buffer and save as BLOB in tbl_cms_images
    if (contentToSave.heroImage && typeof contentToSave.heroImage === 'string' && contentToSave.heroImage.startsWith('data:image/')) {
      console.log('Hero image will be saved as BLOB (base64 length:', contentToSave.heroImage.length, ')')
    } else if (contentToSave.heroImage) {
      console.log('Hero image is not base64, keeping as is')
    }
    
    // Officer images are kept in the departments array - composable will extract them
    if (contentToSave.departments && Array.isArray(contentToSave.departments)) {
      contentToSave.departments.forEach((dept, deptIndex) => {
        if (dept.officers && Array.isArray(dept.officers)) {
          dept.officers.forEach((officer, officerIndex) => {
            if (officer.image && typeof officer.image === 'string' && officer.image.startsWith('data:image/')) {
              console.log(`Department ${deptIndex} Officer ${officerIndex} image will be saved as BLOB (base64 length: ${officer.image.length})`)
            }
          })
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
        Object.keys(defaultOfficersData).forEach(key => {
          if (loadedData.hasOwnProperty(key)) {
            // Special handling for heroImage
            if (key === 'heroImage' && loadedData[key] && typeof loadedData[key] === 'string' && loadedData[key].startsWith('data:image/')) {
              officersData[key] = loadedData[key]
            } else if (key === 'departments' && Array.isArray(loadedData[key])) {
              // Handle departments array with images
              officersData.departments = loadedData[key].map((dept) => ({
                name: dept.name || '',
                officers: (dept.officers || []).map((officer) => ({
                  name: officer.name || '',
                  role: officer.role || '',
                  image: (officer.image && typeof officer.image === 'string' && officer.image.startsWith('data:image/')) ? officer.image : ''
                }))
              }))
            } else if (key !== 'heroImage') {
              officersData[key] = loadedData[key]
            }
          }
        })
        
        // Handle additional fields
        Object.keys(loadedData).forEach(key => {
          if (!defaultOfficersData.hasOwnProperty(key)) {
            officersData[key] = loadedData[key]
          }
        })
        
        console.log('Updated officersData after reload:', officersData)
      }
    } else {
      console.error('Save failed')
    }
  } catch (error) {
    console.error('Error saving department officer page:', error)
  }
}
</script>

<style scoped>
.department-officer-list {
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

/* Officers Section Styles */
.departments-section {
  width: 100%;
  margin-top: 8px;
}

.departments-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.department-card {
  background: #f9fafb;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.department-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.department-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
}

.department-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.department-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.department-officer-count {
  font-size: 14px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 12px;
}

.department-actions {
  display: flex;
  gap: 8px;
}

.officers-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.officers-section {
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

.officers-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.officer-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.officer-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e4e7ed;
}

.officer-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e4e7ed;
}

.avatar-text {
  color: white;
  font-weight: 600;
  font-size: 24px;
}

.officer-details {
  text-align: center;
  width: 100%;
}

.officer-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.officer-position {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
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
