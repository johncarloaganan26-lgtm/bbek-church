<template>
  <div class="header-list">
    <!-- Logo -->
    <div class="list-item">
      <div class="item-label">Logo</div>
      <div class="item-preview">
        <!-- <el-avatar :size="48" class="mr-2">
          <el-image v-if="headerData.logo" :src="headerData.logo" alt="logo" fit="cover"></el-image>
          <el-icon v-else :size="24"><Picture /></el-icon>
        </el-avatar>
        <span v-if="!headerData.logo" class="text-grey">No logo selected</span> -->
      </div>
      <div class="item-action">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleLogoChange"
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

    <!-- Acronym -->
    <div class="list-item">
      <div class="item-label">Acronym</div>
      <div class="item-preview">
        <span class="text-bold text-lg">{{ headerData.acronym }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="headerData.acronym"
          size="small"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Full Name -->
    <div class="list-item">
      <div class="item-label">Full Name</div>
      <div class="item-preview">
        <span class="text-grey">{{ headerData.fullname }}</span>
      </div>
      <div class="item-action">
        <el-input
          v-model="headerData.fullName"
          size="small"
          style="max-width: 300px;"
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
          :style="{ backgroundColor: headerData.bgColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="headerData.bgColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Menu Items Section -->
    <div class="menu-section">
      <div class="section-header">
        <h3 class="section-title">Menu Items</h3>
        <span class="section-count">{{ headerData.menus?.length || 0 }} items</span>
      </div>

      <div class="menu-items-container">
        <div
          v-for="(item, idx) in headerData.menus"
          :key="`menu-${idx}`"
          class="menu-item-card"
          :class="{ 'has-children': item.children && item.children.length }"
        >
          <!-- Main Menu Item -->
          <div class="menu-item-header">
            <div class="menu-item-main">
              <div class="menu-number-badge">{{ idx + 1 }}</div>
              <div class="menu-content">
                <div class="menu-label-section">
                  <el-input
                    v-model="item.label"
                    size="default"
                    placeholder="Menu label"
                    class="menu-input"
                  />
                  <div class="menu-meta">
                    <span class="menu-value">{{ item.label }}</span>
                    <span class="menu-path">{{ item.to }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="menu-actions">
              <el-badge
                v-if="item.children && item.children.length"
                :value="item.children.length"
                class="children-badge"
              >
                <el-button
                  size="small"
                  circle
                  @click="toggleMenuExpand(idx)"
                >
                  <el-icon>
                    <ArrowUp v-if="expandedMenus[idx]" />
                    <ArrowDown v-else />
                  </el-icon>
                </el-button>
              </el-badge>
            </div>
          </div>

          <!-- Children Items (Collapsible) -->
          <el-collapse-transition>
            <div
              v-if="item.children && item.children.length && expandedMenus[idx]"
              class="children-section"
            >
              <div class="children-header">
                <el-icon class="children-icon"><Menu /></el-icon>
                <span class="children-title">Sub-menu Items</span>
              </div>
              <div class="children-list">
                <div
                  v-for="(child, cIdx) in item.children"
                  :key="`menu-${idx}-child-${cIdx}`"
                  class="child-item-card"
                >
                  <div class="child-number-badge">{{ cIdx + 1 }}</div>
                  <div class="child-content">
                    <el-input
                      v-model="child.label"
                      size="small"
                      placeholder="Sub-menu label"
                      class="child-input"
                    />
                    <div class="child-meta">
                      <span class="child-value">{{ child.label }}</span>
                      <span class="child-path">{{ child.to }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>
    </div>
    <el-divider />

    <!-- Menu Hover Color -->
    <div class="list-item">
      <div class="item-label">Menu Hover Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: headerData.hoverColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="headerData.hoverColor"
          size="small"
        ></el-color-picker>
      </div>
    </div>
    <el-divider />

    <!-- Button Text -->
    <div class="list-item">
      <div class="item-label">Button Text</div>
      <div class="item-preview">
        <el-button
          :style="{ backgroundColor: headerData.buttonColor, borderColor: headerData.buttonColor }"
          size="small"
          type="primary"
        >
          {{ headerData.buttonText }}
        </el-button>
      </div>
      <div class="item-action">
        <el-input
          v-model="headerData.buttonText"
          size="small"
          style="max-width: 300px;"
        ></el-input>
      </div>
    </div>
    <el-divider />

    <!-- Button Color -->
    <div class="list-item">
      <div class="item-label">Button Color</div>
      <div class="item-preview">
        <div
          class="color-preview"
          :style="{ backgroundColor: headerData.buttonColor }"
        ></div>
      </div>
      <div class="item-action">
        <el-color-picker
          v-model="headerData.buttonColor"
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
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { Picture, Upload, Menu, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { useCms } from '@/composables/useCms'
import Loader from './Loader.vue'

// Use props if provided, otherwise use mock data
const props = defineProps({
  headerData: {
    type: Object,
    required: false,
    default: () => null
  },
  activeSection: {
    type: String,
    required: true,
    default: 'header'
  }
})

// Initialize CMS composable
const { loading, saving, loadPageData, savePageData } = useCms('header')

// Default data structure
const defaultHeaderData = {
  logo: '',
  logoFile: null,
  acronym: 'BBEK',
  fullname: 'Bible Baptist Eklessia of Kawit',
  bgColor: '#ffffff',
  menus: [
    {label: 'Home', value: 'home' ,to:'/'},
    {label: "I'm New", value: 'im-new',to:'/new'},
    {label: 'About', value: 'about',to:'/about' , children:[
        {label: 'Our Story', value: 'our-story',to:'/about/aboutus'},
        {label: 'Church Leadership', value: 'leadership',to:'/about/churchleaders'},
        {label: 'Department Officers', value: 'department-officers',to:'/about/departmentofficer'},
        {label: 'Beliefs', value: 'beliefs',to:'/about/beliefs'},
    ]},
    {label: 'Give', value: 'give',to:'/give'},
    {label: 'Events', value: 'events',to:'/events',children:[
        { label:'My Events', value: 'my-events',to:'/events/my-events'},
        { label:'All Events', value: 'all-events',to:'/events/all-events'},
    ]},
    {label: 'Ministry', value: 'ministries',to:'/ministries'},
    {label: 'Services', value: 'services',to:'/services' , children:[
        {label: 'Water Baptism', value: 'water-baptism',to:'/services/water-baptism'},
        {label: 'Burial Service', value: 'burial-service',to:'/services/burial-service'},
        {label: 'Marriage Service', value: 'marriage-service',to:'/services/marriage-service'},
        {label: 'Child Dedication', value: 'child-dedication',to:'/services/child-dedication'},
        
    ]},
    {label: 'Sermons', value: 'sermons',to:'/live'}
  ],
  hoverColor: '#14b8a6',
  buttonText: 'Dashboard',
  buttonColor: '#14b8a6'
}

// Create a reactive copy of prop data to allow mutations
const createReactiveCopy = (data) => {
  if (!data) return reactive(JSON.parse(JSON.stringify(defaultHeaderData)))
  const cloned = JSON.parse(JSON.stringify(data))
  // Ensure menus array and its items are reactive
  if (cloned.menus && Array.isArray(cloned.menus)) {
    cloned.menus = cloned.menus.map(menu => {
      const menuItem = { ...menu }
      if (menuItem.children && Array.isArray(menuItem.children)) {
        menuItem.children = menuItem.children.map(child => ({ ...child }))
      }
      return menuItem
    })
  }
  return reactive(cloned)
}

// Initialize headerData with props or default
const headerData = props.headerData 
  ? createReactiveCopy(props.headerData) 
  : reactive(JSON.parse(JSON.stringify(defaultHeaderData)))

// Load data from CMS on mount
onMounted(async () => {
  if (props.activeSection === 'header') {
    const loadedData = await loadPageData()
    if (loadedData) {
      // Merge loaded data into headerData
      Object.keys(loadedData).forEach(key => {
        if (key === 'menus' && Array.isArray(loadedData[key])) {
          headerData.menus = loadedData[key].map(menu => {
            const menuItem = { ...menu }
            if (menuItem.children && Array.isArray(menuItem.children)) {
              menuItem.children = menuItem.children.map(child => ({ ...child }))
            }
            return menuItem
          })
        } else {
          headerData[key] = loadedData[key]
        }
      })
    }
  }
})

// Watch for prop changes and update reactive copy
watch(() => props.headerData, (newData) => {
  if (newData && props.headerData) {
    const cloned = JSON.parse(JSON.stringify(newData))
    // Update menus array
    if (cloned.menus && Array.isArray(cloned.menus)) {
      headerData.menus = cloned.menus.map(menu => {
        const menuItem = { ...menu }
        if (menuItem.children && Array.isArray(menuItem.children)) {
          menuItem.children = menuItem.children.map(child => ({ ...child }))
        }
        return menuItem
      })
    }
    // Update other properties
    Object.keys(cloned).forEach(key => {
      if (key !== 'menus') {
        headerData[key] = cloned[key]
      }
    })
  }
}, { deep: true })

// Track expanded state for menu items with children
const expandedMenus = ref({})

// Toggle menu expansion
const toggleMenuExpand = (idx) => {
  expandedMenus.value[idx] = !expandedMenus.value[idx]
}

// Initialize expanded state for items with children
watch(() => headerData.menus, (menus) => {
  if (menus) {
    menus.forEach((item, idx) => {
      if (item.children && item.children.length) {
        // Default to expanded
        if (expandedMenus.value[idx] === undefined) {
          expandedMenus.value[idx] = true
        }
      }
    })
  }
}, { immediate: true, deep: true })

const handleLogoChange = (file, fileList) => {
  if (!file || !file.raw) return
  const fileObj = file.raw
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    headerData.logo = ev.target?.result || headerData.logo
    headerData.logoFile = fileObj
  }
  reader.readAsDataURL(fileObj)
}

// Save changes to CMS
const saveChanges = async () => {
  if (saving.value) return
  
  try {
    // Prepare content (remove file objects)
    const contentToSave = JSON.parse(JSON.stringify(headerData))
    delete contentToSave.logoFile
    
    // Prepare images object
    const imagesToSave = {}
    
    // Extract logo image
    if (contentToSave.logo && typeof contentToSave.logo === 'string' && contentToSave.logo.startsWith('data:')) {
      imagesToSave.logo = contentToSave.logo
      delete contentToSave.logo
    }
    
    // Save to CMS
    const success = await savePageData(contentToSave, imagesToSave)
    
    if (success) {
      // Reload data to get updated version
      const loadedData = await loadPageData()
      if (loadedData) {
        Object.keys(loadedData).forEach(key => {
          if (key === 'menus' && Array.isArray(loadedData[key])) {
            headerData.menus = loadedData[key].map(menu => {
              const menuItem = { ...menu }
              if (menuItem.children && Array.isArray(menuItem.children)) {
                menuItem.children = menuItem.children.map(child => ({ ...child }))
              }
              return menuItem
            })
          } else {
            headerData[key] = loadedData[key]
          }
        })
      }
    }
  } catch (error) {
    console.error('Error saving header:', error)
  }
}
</script>

<style scoped>
.header-list {
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

.text-lg {
  font-size: 18px;
}

.text-medium {
  font-weight: 500;
}

.text-grey {
  color: #909399;
  font-size: 12px;
}

.mr-2 {
  margin-right: 8px;
}

/* Menu Section Styles */
.menu-section {
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

.menu-items-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.menu-item-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.menu-item-card.has-children {
  border-left: 3px solid #409eff;
}

.menu-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.menu-item-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.menu-number-badge {
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

.menu-content {
  flex: 1;
  min-width: 0;
}

.menu-label-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-input {
  width: 100%;
  max-width: 400px;
}

.menu-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
}

.menu-value {
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.menu-path {
  color: #606266;
  font-family: monospace;
}

.menu-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.children-badge {
  cursor: pointer;
}

/* Children Section Styles */
.children-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.children-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #606266;
}

.children-icon {
  font-size: 16px;
}

.children-title {
  font-size: 14px;
  font-weight: 500;
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 44px;
}

.child-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
}

.child-item-card:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
}

.child-number-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.child-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.child-input {
  width: 100%;
  max-width: 350px;
}

.child-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 11px;
}

.child-value {
  color: #909399;
  background: #ffffff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.child-path {
  color: #606266;
  font-family: monospace;
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

