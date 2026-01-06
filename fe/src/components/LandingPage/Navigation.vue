<template>
  <header
    v-loading="isLoadingHeader"
    element-loading-text="Loading..."
    :style="{
      backgroundColor: headerData.bgColor || '#ffffff',
      boxShadow: scrolled ? '0 2px 12px 0 rgba(0, 0, 0, 0.1)' : 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      transition: 'all 0.3s ease',
      minHeight: '80px',
      padding: 0,
      width: '100%'
    }"
    class="navigation-header"
  >
    <div class="navigation-container">
      <div class="navigation-content">
        <!-- Logo and Church Name -->
        <router-link to="/" class="logo-section">
          <el-avatar :size="64" class="logo-avatar" :src="headerData.logo">
            <img v-if="!headerData.logo" src="/img/logobbek.png" alt="BBEK Logo" />
          </el-avatar>
          <div class="logo-text">
            <h1 class="logo-title">{{ headerData.acronym || 'BBEK' }}</h1>
            <p class="logo-subtitle">
              {{ headerData.fullname || 'Bible Baptist Eklessia of Kawit' }}
            </p>
          </div>
        </router-link>

        <!-- Desktop Menu -->
        <div class="desktop-menu">
          <template v-for="menu in headerData.menus" :key="menu.value">
            <!-- Menu with children (dropdown) -->
            <el-dropdown
              v-if="menu.children && Array.isArray(menu.children) && menu.children.length > 0"
              trigger="hover"
              placement="bottom"
              class="menu-dropdown"
            >
              <el-button
                text
                class="menu-button"
                :style="{ '--hover-color': headerData.hoverColor || '#14b8a6' }"
                @click="navigateTo(menu.to)"
              >
                {{ menu.label }}
                <el-icon class="ml-1"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <template v-for="child in menu.children" :key="child.value || child.label">
                    <el-dropdown-item
                      v-if="child"
                      @click="redirectToChildrenPage(child)"
                      class="menu-dropdown-item"
                      :style="{ '--hover-color': headerData.hoverColor || '#14b8a6' }"
                    >
                      {{ child.label }}
                    </el-dropdown-item>
                  </template>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- Menu without children (simple button) -->
            <el-button
              v-else
              text
              class="menu-button"
              :style="{ '--hover-color': headerData.hoverColor || '#14b8a6' }"
              @click="navigateTo(menu.to)"
            >
              {{ menu.label }}
            </el-button>
          </template>
         
          <!-- Login Button -->
          <el-button
            v-if="(user?.account?.position === 'admin' || user?.account?.position === 'staff' || user?.account?.position !== 'member') || !user"
            :type="'primary'"
            :style="{ backgroundColor: headerData.buttonColor || '#14b8a6', borderColor: headerData.buttonColor || '#14b8a6' }"
            class="login-button"
            @click="openLoginDialog"
          >
            {{ user?.account?.position === 'admin' || user?.account?.position === 'staff' ? headerData.buttonText : 'Login' }}
          </el-button>
          <el-dropdown
            v-else
            trigger="click"
            placement="bottom-end"
            :offset="8"
            class="user-menu-dropdown"
          >
            <div class="user-menu-trigger">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-info">
                <div class="user-name">{{ user?.member ? `${user.member.firstname || ''} ${user.member.lastname || ''}`.trim() : 'User' }}</div>
                <div class="user-position">{{ user?.account?.position ? user.account.position.charAt(0).toUpperCase() + user.account.position.slice(1) : 'Member' }}</div>
              </div>
              <el-icon class="chevron-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleChangePassword" class="menu-item">
                  <el-icon><Lock /></el-icon>
                  <span>Change Password</span>
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/landpage/transactions')" class="menu-item">
                  <el-icon><Clock /></el-icon>
                  <span>View Transactions</span>
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/events/my-events')" class="menu-item">
                  <el-icon><Calendar /></el-icon>
                  <span>Joined Events</span>
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/ministries/my-ministry')" class="menu-item">
                  <el-icon><Guide /></el-icon>
                  <span>Joined Ministries</span>
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/schedule-change')" class="menu-item">
                  <el-icon><Calendar /></el-icon>
                  <span>Request Schedule Change</span>
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/beoneofus/send-prayer')" class="menu-item">
                  <el-icon><Message /></el-icon>
                  <span>Submit Prayer Request</span>
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout" class="menu-item">
                  <el-icon><SwitchButton /></el-icon>
                  <span>Logout</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- Mobile Menu Button -->
        <el-button
          text
          circle
          class="mobile-menu-button"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <el-icon v-if="mobileMenuOpen"><Close /></el-icon>
          <el-icon v-else><MenuIcon /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Mobile Menu Drawer -->
    <el-drawer
      v-model="mobileMenuOpen"
      :with-header="false"
      direction="rtl"
      size="280px"
      class="mobile-menu-drawer"
    >
      <div class="mobile-menu-content">
        <div class="mobile-menu-header">
          <div class="d-flex align-center mb-4">
            <el-avatar :size="48" class="logo-avatar" :src="headerData.logo">
              <img v-if="!headerData.logo" src="/img/logobbek.png" alt="BBEK Logo" />
            </el-avatar>
            <div class="logo-text ml-3">
              <h3 class="logo-title">{{ headerData.acronym || 'BBEK' }}</h3>
              <p class="logo-subtitle">{{ headerData.fullname || 'Bible Baptist Eklessia of Kawit' }}</p>
            </div>
          </div>
        </div>

        <div class="mobile-menu-items">
          <template v-for="menu in headerData.menus" :key="menu?.value || menu?.label || Math.random()">
            <!-- Menu with children -->
            <div v-if="menu && menu.children && Array.isArray(menu.children) && menu.children.length > 0" class="mobile-menu-group">
              <div class="mobile-menu-item" @click="toggleMobileSubmenu(menu?.value)">
                <span>{{ menu?.label || '' }}</span>
                <el-icon :class="{ 'rotated': openSubmenus[menu?.value] }"><ArrowDown /></el-icon>
              </div>
              <div v-show="openSubmenus[menu?.value]" class="mobile-submenu">
                <template v-for="child in menu.children" :key="child?.value || child?.label || Math.random()">
                <div
                    v-if="child"
                  class="mobile-submenu-item"
                  @click="handleMobileMenuClick(child)"
                >
                    {{ child?.label || '' }}
                </div>
                </template>
              </div>
            </div>
            <!-- Menu without children -->
            <div v-else-if="menu" class="mobile-menu-item" @click="handleMobileMenuClick(menu)">
              {{ menu.label }}
            </div>
          </template>

          <!-- Login/User Section -->
          <div class="mobile-menu-divider"></div>
          <el-button
            v-if="(user?.account?.position === 'admin' || user?.account?.position === 'staff' || user?.account?.position !== 'member') || !user"
            :type="'primary'"
            :style="{ backgroundColor: headerData.buttonColor || '#14b8a6', borderColor: headerData.buttonColor || '#14b8a6', width: '100%' }"
            class="mobile-login-button"
            @click="openLoginDialog"
          >
            {{ user?.account?.position === 'admin' || user?.account?.position === 'staff' ? headerData.buttonText : 'Login' }}
          </el-button>
          <div v-else class="mobile-user-section">
            <div class="mobile-user-info">
              <el-avatar :size="40" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-info">
                <div class="user-name">{{ user?.member ? `${user.member.firstname || ''} ${user.member.lastname || ''}`.trim() : 'User' }}</div>
                <div class="user-position">{{ user?.account?.position ? user.account.position.charAt(0).toUpperCase() + user.account.position.slice(1) : 'Member' }}</div>
              </div>
            </div>
            <div class="mobile-user-menu">
              <div class="mobile-menu-item" @click="handleChangePassword">
                <el-icon><Lock /></el-icon>
                <span>Change Password</span>
              </div>
              <div class="mobile-menu-item" @click="handleMobileMenuClick({ to: '/landpage/transactions' })">
                <el-icon><Clock /></el-icon>
                <span>View Transactions</span>
              </div>
              <div class="mobile-menu-item" @click="handleMobileMenuClick({ to: '/events/my-events' })">
                <el-icon><Calendar /></el-icon>
                <span>Joined Events</span>
              </div>
              <div class="mobile-menu-item" @click="handleMobileMenuClick({ to: '/ministries/my-ministry' })">
                <el-icon><Guide /></el-icon>
                <span>Joined Ministries</span>
              </div>
              <div class="mobile-menu-item" @click="handleMobileMenuClick({ to: '/schedule-change' })">
                <el-icon><Calendar /></el-icon>
                <span>Request Schedule Change</span>
              </div>
              <div class="mobile-menu-item" @click="handleMobileMenuClick({ to: '/beoneofus/send-prayer' })">
                <el-icon><Message /></el-icon>
                <span>Submit Prayer Request</span>
              </div>
              <div class="mobile-menu-item mobile-menu-item-danger" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                <span>Logout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </header>

  <LoginDialog v-model="loginDialog" @update:model-value="loginDialog = $event" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import LoginDialog from '../Dialogs/LoginDialog.vue'
import { useMinistriesStore } from '../../stores/ChurchRecords/ministriesStore'
import { useCmsStore } from '../../stores/cmsStore'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  ArrowDown,
  User,
  Lock,
  Coin,
  Clock,
  Message,
  Calendar,
  SwitchButton,
  Close,
  Menu as MenuIcon,
  Guide
} from '@element-plus/icons-vue'
import axios from '@/api/axios'

const router = useRouter()
const ministriesStore = useMinistriesStore()
const cmsStore = useCmsStore()

// Loading state for CMS data
const isLoadingHeader = computed(() => cmsStore.isPageLoading('header'))

const scrolled = ref(false)
const mobileMenuOpen = ref(false)
const openSubmenus = ref({})
const departmentList = ref([])

const loginDialog = ref(false)
const user = ref(JSON.parse(localStorage.getItem('userInfo')) || null)

const toggleMobileSubmenu = (menuValue) => {
  if (menuValue !== undefined && menuValue !== null) {
  openSubmenus.value[menuValue] = !openSubmenus.value[menuValue]
  }
}

const handleMobileMenuClick = (menuItem) => {
  if (!menuItem) {
    console.warn('handleMobileMenuClick: menuItem is undefined')
    mobileMenuOpen.value = false
    return
  }
  
  if (menuItem.isMinistry && menuItem.data) {
    router.push({
      path: '/ministries/ministry-data',
      query: {
        ministryData: encodeURIComponent(JSON.stringify(menuItem.data))
      }
    })
  } else if (menuItem.to) {
    router.push(menuItem.to)
  }
  mobileMenuOpen.value = false
}

// Default/fallback header data
const defaultHeaderData = {
  logo: '/img/logobbek.png',
  acronym: 'BBEK',
  fullname: 'Bible Baptist Eklessia of Kawit',
  bgColor: '#ffffff',
  menus: [
    {label: 'Home', value: 'home' ,to:'/'},
    {label: 'About', value: 'about',to:'/about' , children:[
        {label: 'Our Story', value: 'our-story',to:'/about/aboutus'},
        {label: 'Church Leadership', value: 'church-leadership',to:'/about/churchleaders'},
        {label: 'Department Officers', value: 'department-officers',to:'/about/departmentofficer'},
     
    ]},
    {label: 'Give', value: 'give',to:'/give'},
    {label: 'Events', value: 'events',to:'/events/all-events'},
    {label: 'Ministry', value: 'ministry',to:'/ministries', children:[
        { label:'All Ministries', value: 'all-ministries',to:'/ministries'},
    ]},
    {label: 'Services', value: 'services',to:'/services'},
    {label: 'Sermons', value: 'sermons',to:'/live'}
  ],
  hoverColor: '#14b8a6',
  buttonText: 'Dashboard',
  buttonColor: '#14b8a6'
}

// Initialize headerData with default values
const headerData = ref({ ...defaultHeaderData })

// Fetch header data from CMS API using shared store
const fetchHeaderData = async () => {
  try {
    const cmsData = await cmsStore.fetchPageData('header')
    
    if (cmsData) {
      const { page, images } = cmsData
      
      // Get content from page
      const content = page?.content || {}
      
      // Get logo from images (base64 data URL)
      const logoUrl = images?.logo || defaultHeaderData.logo
      
      // Parse menus - they should already be an object from JSON column
      let menus = content.menus || defaultHeaderData.menus
      if (typeof menus === 'string') {
        try {
          menus = JSON.parse(menus)
        } catch (e) {
          console.error('Error parsing menus JSON:', e)
          menus = defaultHeaderData.menus
        }
      }
      
      // Ensure menus is an array
      if (!Array.isArray(menus)) {
        menus = defaultHeaderData.menus
      }
      
      // Ensure each menu item has proper structure and children array if needed
      menus = menus.map(menu => {
        const menuItem = { ...menu }
        // Ensure children is an array if it exists
        if (menuItem.children && !Array.isArray(menuItem.children)) {
          menuItem.children = []
        }
        // Filter out any null/undefined children
        if (menuItem.children && Array.isArray(menuItem.children)) {
          menuItem.children = menuItem.children.filter(child => child && (typeof child === 'object'))
          // Remove "Beliefs" item from About submenu
          menuItem.children = menuItem.children.filter(child => !(child.label === 'Beliefs' || child.value === 'beliefs'))
          // Remove Marriage service from Services submenu
          if (menuItem.value === 'services' || menuItem.label === 'Services') {
            menuItem.children = menuItem.children.filter(child =>
              !(child.label === 'Marriage Service' || child.value === 'marriage-service')
            )
          }
        }
        return menuItem
      })

      // Filter out "I'm New" menu item
      menus = menus.filter(menu => menu.label !== "I'm New" && menu.value !== 'im-new')
      
      // Force Events menu to be a single button (no dropdown) - override CMS data
      menus = menus.map(menu => {
        if (menu.value === 'events' || menu.label === 'Events') {
          return { label: 'Events', value: 'events', to: '/events/all-events' }
        }
        return menu
      })
      
      // Merge fetched data with defaults
      headerData.value = {
        logo: logoUrl,
        logoFile: null,
        acronym: content.acronym || defaultHeaderData.acronym || 'BBEK',
        fullname: content.fullname || defaultHeaderData.fullname || 'Bible Baptist Eklessia of Kawit',
        bgColor: content.bgColor || defaultHeaderData.bgColor || '#ffffff',
        menus: menus,
        hoverColor: content.hoverColor || defaultHeaderData.hoverColor || '#14b8a6',
        buttonText: content.buttonText || defaultHeaderData.buttonText || 'Dashboard',
        buttonColor: content.buttonColor || defaultHeaderData.buttonColor || '#14b8a6'
      }
      
      console.log('Header data loaded from CMS:', headerData.value)
    } else {
      console.warn('No header data found in CMS, using default')
    }
  } catch (error) {
      console.error('Error fetching header data from CMS:', error)
    // Keep default data on error
  }
} 
const navigateTo = (path) => {
  if (path) {
    router.push(path)
  }
}

const handleScroll = () => {
  scrolled.value = window.scrollY > 50
}

onMounted(async() => {
  window.addEventListener('scroll', handleScroll)
  
  // Fetch header data from CMS API
  await fetchHeaderData()
  
  // Fetch public ministries for the Ministry menu
  await ministriesStore.fetchPublicMinistries()
  
  // Merge ministry data into menus (update existing menus from CMS or default)
  headerData.value.menus = headerData.value.menus.map(menu => {
    if (menu.value === 'ministry' || menu.value === 'ministries') {
      // Safety check: ensure publicMinistries is an array before calling map
      const publicMinistries = Array.isArray(ministriesStore.publicMinistries) 
        ? ministriesStore.publicMinistries 
        : []
      
      const ministryChildren = publicMinistries.map(ministry => ({
        label: ministry.ministry_name,
        value: ministry.ministry_id || ministry.id,
        data: ministry,
        isMinistry: true,
        to: `/ministries/ministry-data?ministryData=${encodeURIComponent(JSON.stringify(ministry))}`
      }))
      // Removed "My Ministry" from menu - joined ministries will reflect in "My Services"
      
      return {
        ...menu,
        children: ministryChildren.length > 0 ? ministryChildren : (menu.children || [])
      }
    }
    // Ensure other menus with children have proper structure
    if (menu.children && !Array.isArray(menu.children)) {
      menu.children = []
    }
    return menu
  })
  
  console.log('Final header data with ministries:', headerData.value)
  console.log('Menus with children:', headerData.value.menus.filter(m => m.children && m.children.length > 0))
})
const redirectToChildrenPage = (child) => {
  console.log('Redirecting to child page:', child)
  
  if (!child) {
    console.error('Child menu item is undefined')
    return
  }
  
  if (child.isMinistry && child.data) {
    router.push({
      path: '/ministries/ministry-data',
      query: {
        ministryData: encodeURIComponent(JSON.stringify(child.data))
      }
    })
  } else if (child.to) {
    router.push(child.to)
  } else {
    console.warn('Child menu item has no route:', child)
  }
}
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const openLoginDialog = () => {
  console.log(user.value , 'user.value')
  if(user.value){
    if(user.value?.account?.position === 'admin' || user.value?.account?.position === 'staff'){
    router.push('/admin')
  }
  }else{
    loginDialog.value = true
  }
}

// Handle change password
const handleChangePassword = () => {
  console.log(user.value)
  // Navigate to password management page
  // Path parameters should be passed using params, not query
  router.push({
    name: 'PasswordManagement',
    params: {
      isProfileChange: true, // Convert boolean to string for path parameter
      acc_id: user.value?.account?.acc_id
    }
  })
}

// Handle logout
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to logout?',
      'Confirm Logout',
      {
        confirmButtonText: 'Logout',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // User confirmed logout
    // Clear tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    
    // Clear any user data
    user.value = null
    
    ElMessage.success('Logged out successfully')
    
    // Redirect to landing page
    router.push({ name: 'LandingPage' })
  } catch (error) {
    // User cancelled the logout
    // No action needed
  }
}
</script>

<style scoped>
/* Navigation Header */
.navigation-header {
  width: 100%;
  max-width: 100%;
  padding: 0 !important;
  display: block;
  visibility: visible;
  background-color: #ffffff;
}

.navigation-container {
  width: 100%;
  max-width: 100%;
  padding: 0;
  margin: 0;
  display: block;
}

.navigation-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 24px;
  min-height: 64px;
  box-sizing: border-box;
}

/* Logo Section */
.logo-section {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.logo-section:hover {
  opacity: 0.8;
  transform: scale(1.02);
}

.logo-avatar {
  margin-right: 12px;
  transition: transform 0.3s ease;
}

.logo-section:hover .logo-avatar {
  transform: scale(1.05);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #424242;
  margin: 0;
  line-height: 1.2;
  display: block;
}

.logo-subtitle {
  font-size: 0.75rem;
  font-weight: 600;
  color: #757575;
  margin: 0;
  line-height: 1.2;
  display: block;
}

/* Desktop Menu */
.desktop-menu {
  display: none;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

@media (min-width: 1024px) {
  .desktop-menu {
    display: flex;
  }
}

.menu-button {
  margin: 0 4px;
  text-transform: capitalize;
  transition: all 0.3s ease;
  color: #424242;
}

.menu-button:hover {
  color: var(--hover-color, #14b8a6) !important;
  background-color: rgba(0, 0, 0, 0.05) !important;
  transform: translateY(-2px);
}

.menu-button :deep(.el-icon) {
  transition: transform 0.3s ease;
}

.menu-button:hover :deep(.el-icon) {
  color: var(--hover-color, #14b8a6) !important;
  transform: translateY(-1px);
}

.login-button {
  margin-left: 16px;
  color: white;
}

/* User Menu */
.user-menu-trigger {
  display: flex;
  align-items: center;
  margin-right: 16px;
  padding-left: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-menu-trigger:hover {
  opacity: 0.8;
}

.user-avatar {
  margin-right: 8px;
  background-color: var(--el-color-primary);
  color: white;
}

.user-info {
  margin-right: 8px;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  line-height: 1.2;
}

.user-position {
  font-size: 0.75rem;
  color: #757575;
  line-height: 1.2;
}

.chevron-icon {
  font-size: 0.875rem;
}

/* Menu Items */
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.menu-item:hover {
  transform: translateX(4px);
}

.menu-dropdown-item {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.menu-dropdown-item:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
  color: var(--hover-color, #14b8a6) !important;
}

/* Mobile Menu Button */
.mobile-menu-button {
  display: block;
  margin-left: auto;
}

@media (min-width: 1024px) {
  .mobile-menu-button {
    display: none;
  }
}

/* Utility Classes */
.ml-1 {
  margin-left: 4px;
}

.cursor-pointer {
  cursor: pointer;
}

/* Arrow Right for nested menu */
.arrow-right {
  margin-left: auto;
}

/* Mobile Menu Drawer */
.mobile-menu-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.mobile-menu-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-menu-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.mobile-menu-items {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.mobile-menu-group {
  border-bottom: 1px solid #f3f4f6;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #424242;
  font-size: 0.9375rem;
}

.mobile-menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--hover-color, #14b8a6);
}

.mobile-menu-item-danger {
  color: #ef4444;
}

.mobile-menu-item-danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.mobile-menu-item .el-icon {
  transition: transform 0.3s ease;
}

.mobile-menu-item .el-icon.rotated {
  transform: rotate(180deg);
}

.mobile-submenu {
  background-color: #f9fafb;
}

.mobile-submenu-item {
  padding: 12px 20px 12px 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280;
  font-size: 0.875rem;
}

.mobile-submenu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--hover-color, #14b8a6);
}

.mobile-menu-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 16px 0;
}

.mobile-login-button {
  margin: 16px 20px;
  color: white;
}

.mobile-user-section {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.mobile-user-info .user-avatar {
  margin-right: 12px;
  background-color: var(--el-color-primary);
  color: white;
}

.mobile-user-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-user-menu .mobile-menu-item {
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-user-menu .mobile-menu-item .el-icon {
  font-size: 18px;
}

@media (min-width: 1024px) {
  .mobile-menu-drawer {
    display: none;
  }
}

</style>

<style>
/* Global style for dropdown menus - must be higher than header z-index (9999) */
.el-dropdown-menu {
  z-index: 10001 !important;
}

.el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px !important; /* Reduced padding for tighter spacing */
}

/* Ensure nested dropdowns also have proper z-index */
.el-dropdown .el-dropdown-menu {
  z-index: 10002 !important;
}
</style>
