<template>
  <div class="department-categories-list">
    <!-- Department Categories Section -->
    <div class="department-categories-section">
      <div class="section-header">
        <div class="section-header-left">
          <h3 class="section-title">Our Departments</h3>
          <span class="section-count">Edit section content</span>
        </div>
      </div>

      <div class="content-form">
        <!-- Section Header -->
        <div class="form-section">
          <h4 class="form-section-title">Section Header</h4>
          <div class="form-group">
            <label>Section Title:</label>
            <el-input
              v-model="categoriesData.sectionTitle"
              placeholder="Enter section title"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Section Subtitle:</label>
            <el-input
              v-model="categoriesData.sectionSubtitle"
              type="textarea"
              :rows="2"
              placeholder="Enter section subtitle"
              style="margin-top: 8px;"
            ></el-input>
          </div>
        </div>

        <!-- Adult Card -->
        <div class="form-section">
          <h4 class="form-section-title">Adult Ministry Card</h4>
          <div class="form-group">
            <label>Adult Title:</label>
            <el-input
              v-model="categoriesData.adultTitle"
              placeholder="Enter adult ministry title"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Adult Description:</label>
            <el-input
              v-model="categoriesData.adultDescription"
              type="textarea"
              :rows="2"
              placeholder="Enter adult ministry description"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Adult Link Text:</label>
            <el-input
              v-model="categoriesData.adultLinkText"
              placeholder="Enter link text"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Adult Background Image:</label>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              @change="(file) => handleImageChange(file, 'adultBackgroundImage')"
              style="margin-top: 8px;"
            >
              <template #trigger>
                <el-button size="small" type="primary">
                  <el-icon><Upload /></el-icon>
                  Choose File
                </el-button>
              </template>
            </el-upload>
            <div v-if="categoriesData.adultBackgroundImage" class="image-preview">
              <el-image
                :src="categoriesData.adultBackgroundImage"
                fit="cover"
                class="preview-image"
              />
              <el-button
                type="danger"
                size="small"
                class="remove-image-btn"
                @click="removeImage('adultBackgroundImage')"
              >
                Remove
              </el-button>
            </div>
          </div>
        </div>

        <!-- Ladies Card -->
        <div class="form-section">
          <h4 class="form-section-title">Ladies Ministry Card</h4>
          <div class="form-group">
            <label>Ladies Title:</label>
            <el-input
              v-model="categoriesData.ladiesTitle"
              placeholder="Enter ladies ministry title"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Ladies Description:</label>
            <el-input
              v-model="categoriesData.ladiesDescription"
              type="textarea"
              :rows="2"
              placeholder="Enter ladies ministry description"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Ladies Link Text:</label>
            <el-input
              v-model="categoriesData.ladiesLinkText"
              placeholder="Enter link text"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Ladies Background Image:</label>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              @change="(file) => handleImageChange(file, 'ladiesBackgroundImage')"
              style="margin-top: 8px;"
            >
              <template #trigger>
                <el-button size="small" type="primary">
                  <el-icon><Upload /></el-icon>
                  Choose File
                </el-button>
              </template>
            </el-upload>
            <div v-if="categoriesData.ladiesBackgroundImage" class="image-preview">
              <el-image
                :src="categoriesData.ladiesBackgroundImage"
                fit="cover"
                class="preview-image"
              />
              <el-button
                type="danger"
                size="small"
                class="remove-image-btn"
                @click="removeImage('ladiesBackgroundImage')"
              >
                Remove
              </el-button>
            </div>
          </div>
        </div>

        <!-- Youth Card -->
        <div class="form-section">
          <h4 class="form-section-title">Youth Ministry Card</h4>
          <div class="form-group">
            <label>Youth Title:</label>
            <el-input
              v-model="categoriesData.youthTitle"
              placeholder="Enter youth ministry title"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Youth Description:</label>
            <el-input
              v-model="categoriesData.youthDescription"
              type="textarea"
              :rows="2"
              placeholder="Enter youth ministry description"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Youth Link Text:</label>
            <el-input
              v-model="categoriesData.youthLinkText"
              placeholder="Enter link text"
              style="margin-top: 8px;"
            ></el-input>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Youth Background Image:</label>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              @change="(file) => handleImageChange(file, 'youthBackgroundImage')"
              style="margin-top: 8px;"
            >
              <template #trigger>
                <el-button size="small" type="primary">
                  <el-icon><Upload /></el-icon>
                  Choose File
                </el-button>
              </template>
            </el-upload>
            <div v-if="categoriesData.youthBackgroundImage" class="image-preview">
              <el-image
                :src="categoriesData.youthBackgroundImage"
                fit="cover"
                class="preview-image"
              />
              <el-button
                type="danger"
                size="small"
                class="remove-image-btn"
                @click="removeImage('youthBackgroundImage')"
              >
                Remove
              </el-button>
            </div>
          </div>
        </div>

        <!-- Button Color -->
        <div class="form-section">
          <h4 class="form-section-title">Button Color</h4>
          <div class="form-group">
            <label>Button Color:</label>
            <el-color-picker
              v-model="categoriesData.buttonColor"
              style="margin-top: 8px;"
            />
          </div>
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

    <!-- Loader -->
    <Loader :loading="loading" />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import { useCms } from '@/composables/useCms'
import Loader from './Loader.vue'

const props = defineProps({
  activeSection: {
    type: String,
    required: true,
    default: 'departmentcategories'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('departmentcategories')

// Default data structure
const defaultCategoriesData = {
  sectionTitle: 'Our Departments',
  sectionSubtitle: 'Discover our various ministries designed to help you grow in faith and serve our community.',
  adultTitle: 'Adult Ministry',
  adultDescription: 'Join our adult fellowship for spiritual growth and community building.',
  adultLinkText: 'Learn More',
  adultBackgroundImage: '',
  ladiesTitle: 'Ladies Ministry',
  ladiesDescription: 'Empowering women through faith, fellowship, and service.',
  ladiesLinkText: 'Learn More',
  ladiesBackgroundImage: '',
  youthTitle: 'Youth Ministry',
  youthDescription: 'Building the next generation of leaders through Christ-centered activities.',
  youthLinkText: 'Learn More',
  youthBackgroundImage: '',
  buttonColor: '#14b8a6'
}

// Create reactive copy of data
const createReactiveCopy = (data) => {
  if (!data) return reactive(JSON.parse(JSON.stringify(defaultCategoriesData)))
  const cloned = JSON.parse(JSON.stringify(data))
  return reactive(cloned)
}

const categoriesData = createReactiveCopy(null)

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'departmentcategories') {
    const loadedData = await loadPageData()
    if (loadedData) {
      // Update categoriesData with loaded data
      Object.keys(loadedData).forEach(key => {
        if (categoriesData[key] !== undefined) {
          categoriesData[key] = loadedData[key]
        }
      })
    }
  }
})

// Handle image change
const handleImageChange = (file, field) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    categoriesData[field] = e.target.result
  }
  reader.readAsDataURL(fileObj)
}

// Remove image
const removeImage = (field) => {
  categoriesData[field] = ''
}

// Save changes to CMS
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    // Prepare content
    const contentToSave = JSON.parse(JSON.stringify(categoriesData))
    const imagesToSave = {}
    
    // Extract base64 images
    const imageFields = ['adultBackgroundImage', 'ladiesBackgroundImage', 'youthBackgroundImage']
    imageFields.forEach(field => {
      if (contentToSave[field] && typeof contentToSave[field] === 'string' && contentToSave[field].startsWith('data:')) {
        imagesToSave[field] = contentToSave[field]
        contentToSave[field] = '' // Clear from content
      }
    })
    
    // Save to CMS
    const success = await savePageData(contentToSave, imagesToSave)
    
    if (success) {
      // Force reload data with fresh fetch (bypass cache)
      const loadedData = await loadPageData(true) // forceRefresh = true
      if (loadedData) {
        Object.keys(loadedData).forEach(key => {
          if (categoriesData[key] !== undefined) {
            categoriesData[key] = loadedData[key]
          }
        })
      }
    }
  } catch (error) {
    console.error('Error saving department categories page:', error)
  }
}
</script>

<style scoped>
.department-categories-list {
  width: 100%;
  padding-bottom: 80px;
}

.department-categories-section {
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

.content-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.form-section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
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

.image-preview {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-image {
  width: 200px;
  height: 120px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.remove-image-btn {
  width: fit-content;
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
