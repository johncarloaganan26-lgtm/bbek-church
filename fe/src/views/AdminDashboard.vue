<template>
  <div class="admin-dashboard">
    <v-navigation-drawer 
      v-model="_drawerState"
      :temporary="isMobile"
      width="280" 
      color="white"
    >
      <div class="pa-4 cursor-pointer" @click="navigateTo('LandingPage')">
        <div class="d-flex align-center mb-4">
          <v-avatar size="40" color="primary" class="mr-3" >
            <!-- <v-icon icon="mdi-church" color="white"></v-icon> -->
            <img :src="headerData.logo" :alt="headerData.fullname || 'BBEK Church'" width="40" height="40">
          </v-avatar>
          <span class="text-h6 font-weight-bold">{{ headerData.acronym || 'BBEK' }} Church</span>
        </div>
        <div class="text-uppercase text-caption grey--text mb-6">{{ isAdmin ? 'ADMIN PANEL' : 'STAFF PANEL' }}</div>
        <div class="text-h6 font-weight-bold mb-4">Church Admin Dashboard</div>
      </div>

      <v-list nav density="compact" class="pa-0">
        <!-- Dashboard -->
        <v-list-item
          prepend-icon="mdi-home"
          title="DASHBOARD"
          value="dashboard"
          :active="$route.name === 'Dashboard'"
          :to="{ name: 'Dashboard' }"
          class="mb-2"
          @click="closeDrawerOnMobile"
        ></v-list-item>

        <!-- Church Records -->
        <v-list-group value="church-records" prepend-icon="mdi-database">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="CHURCH RECORDS"></v-list-item>
          </template>
          <v-list-item 
            prepend-icon="mdi-account" 
            title="Accounts"
            :to="{ name: 'Accounts' }"
            :active="$route.name === 'Accounts'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item 
            prepend-icon="mdi-office-building" 
            title="Departments"
            :to="{ name: 'Departments' }"
            :active="$route.name === 'Departments'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item 
            prepend-icon="mdi-account" 
            title="Member Record"
            :to="{ name: 'MemberRecord' }"
            :active="$route.name === 'MemberRecord'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item 
            prepend-icon="mdi-account-group" 
            title="Church Leaders"
            :to="{ name: 'ChurchLeaders' }"
            :active="$route.name === 'ChurchLeaders'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <!-- Department Officers menu item hidden - functionality integrated into Departments -->
          <!-- <v-list-item 
            prepend-icon="mdi-account-multiple" 
            title="Department Officers"
            :to="{ name: 'DepartmentOfficers' }"
            :active="$route.name === 'DepartmentOfficers'"
            @click="closeDrawerOnMobile"
          ></v-list-item> -->
          <v-list-item 
            prepend-icon="mdi-calendar" 
            title="Events Records"
            :to="{ name: 'EventsRecords' }"
            :active="$route.name === 'EventsRecords'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item 
            prepend-icon="mdi-gift" 
            title="Tithes & Offerings"
            :to="{ name: 'TithesOfferings' }"
            :active="$route.name === 'TithesOfferings'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item 
            prepend-icon="mdi-account-group" 
            title="Ministries"
            :to="{ name: 'Ministries' }"
            :active="$route.name === 'Ministries'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item 
            v-if="userInfo?.account?.position === 'admin'"
            prepend-icon="mdi-check" 
            title="Approvals"
            :to="{ name: 'Approvals' }"
            :active="$route.name === 'Approvals'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
        </v-list-group>

        <!-- Services -->
        <v-list-group value="services" prepend-icon="mdi-gift-outline">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="SERVICES"></v-list-item>
          </template>
           <v-list-item
            prepend-icon="mdi-water"
            title="Water Baptism"
            :to="{ name: 'WaterBaptism' }"
            :active="$route.name === 'WaterBaptism'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-baby-face"
            title="Child Dedication"
            :to="{ name: 'ChildDedicationAdmin' }"
            :active="$route.name === 'ChildDedicationAdmin'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-coffin"
            title="Burial Service"
            :to="{ name: 'BurialService' }"
            :active="$route.name === 'BurialService'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
        </v-list-group>

        <!-- Communication -->
        <v-list-group value="communication" prepend-icon="mdi-message">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="COMMUNICATION"></v-list-item>
          </template>
         <v-list-item 
            prepend-icon="mdi-message-text" 
            title="Messages"
            :to="{ name: 'Messages' }"
            :active="$route.name === 'Messages'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
        </v-list-group>

        <!-- Maintenance -->
        <v-list-group value="maintenance" prepend-icon="mdi-cog">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="MAINTENANCE"></v-list-item>
          </template>
          <v-list-item
            v-if="isAdmin"
            prepend-icon="mdi-folder"
            title="Archives"
            :to="{ name: 'Archive' }"
            :active="$route.name === 'Archive'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item
            v-if="isAdmin"
            prepend-icon="mdi-file-document"
            title="Audit Trail"
            :to="{ name: 'AuditTrail' }"
            :active="$route.name === 'AuditTrail'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            :to="{ name: 'Settings' }"
            :active="$route.name === 'Settings'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
          <v-list-item 
            v-if="userInfo?.account?.position === 'admin'" 
            prepend-icon="mdi-file-document" 
            title="Content Management" 
            :to="{ name: 'ContentManagement' }" 
            :active="$route.name === 'ContentManagement'"
            @click="closeDrawerOnMobile"
          ></v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="white" elevation="1">
      <v-app-bar-nav-icon
        @click="_drawerState = !_drawerState"
        class="menu-button"
      ></v-app-bar-nav-icon>
      <v-spacer></v-spacer>
      <v-menu location="bottom end" offset="8">
        <template v-slot:activator="{ props }">
          <div 
            v-bind="props"
            class="d-flex align-center mr-4 cursor-pointer user-menu-trigger"
          >
            <v-avatar size="32" color="primary" class="mr-2">
              <v-icon icon="mdi-account" color="white"></v-icon>
            </v-avatar>
            <div class="mr-2 user-info-text">
              <div class="text-body-2">{{ userInfo?.member ? `${userInfo.member.firstname || ''} ${userInfo.member.lastname || ''}`.trim() : 'User' }}</div>
              <div v-if="!isMobile" class="text-caption grey--text">{{ userInfo?.account?.email || '' }}</div>
              <div class="text-caption grey--text">{{ userInfo?.account?.position ? userInfo.account.position.charAt(0).toUpperCase() + userInfo.account.position.slice(1) : 'Admin' }}</div>
            </div>
            <v-icon icon="mdi-chevron-down" size="small"></v-icon>
          </div>
        </template>
        <v-list density="compact" class="pa-2">
          <v-list-item
            prepend-icon="mdi-lock-reset"
            title="Change Password"
            @click="handleChangePassword"
            class="menu-item"
          ></v-list-item>
          <v-divider class="my-1"></v-divider>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="handleLogout"
            class="menu-item"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main style="overflow-y: auto;">
      <v-container fluid class="pa-6 pb-12">
        <router-view />
      </v-container>
    </v-main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { checkAccessTokenValidity } from '@/utils/tokenValidation'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCmsStore } from '@/stores/cmsStore'
import { useDisplay } from 'vuetify'

const route = useRoute()
const router = useRouter()
const cmsStore = useCmsStore()
const { mobile } = useDisplay()

// User info from token
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || null)

// Check if user is admin
const isAdmin = computed(() => {
  return userInfo.value?.account?.position === 'admin'
})

// Loading state for CMS data
const isLoadingHeader = computed(() => cmsStore.isPageLoading('header'))

// Check if mobile
const isMobile = computed(() => mobile.value)

// Drawer state - can be toggled on both mobile and desktop
const _drawerState = ref(true) // Default to open

// Close drawer on mobile when menu item is clicked
const closeDrawerOnMobile = () => {
  if (isMobile.value) {
    _drawerState.value = false
  }
}

// Default/fallback header data
const defaultHeaderData = {
  logo: '/img/logobbek.png',
  acronym: 'BBEK',
  fullname: 'Bible Baptist Eklessia of Kawit'
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
      
      // Merge fetched data with defaults
      headerData.value = {
        logo: logoUrl,
        acronym: content.acronym || defaultHeaderData.acronym || 'BBEK',
        fullname: content.fullname || defaultHeaderData.fullname || 'Bible Baptist Eklessia of Kawit'
      }
      
      console.log('Header data loaded from CMS in AdminDashboard:', headerData.value)
    } else {
      console.warn('No header data found in CMS, using default')
    }
  } catch (error) {
    console.error('Error fetching header data from CMS:', error)
    // Keep default data on error
  }
}

const navigateTo = (name) => {
  router.push({ name: name })
}

// Handle change password
const handleChangePassword = () => {
  // Navigate to password management page
  // You can pass account ID or email as query param
  router.push({
    name: 'PasswordManagement',
    params: {
      isProfileChange: true, // Convert boolean to string for path parameter
      acc_id: userInfo.value?.account?.acc_id
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
    try {
      // Call logout API to record audit trail
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth_token') || localStorage.getItem('token')
      if (token) {
        await fetch('http://localhost:5000/api/church-records/accounts/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            logout_reason: 'User initiated logout from admin dashboard'
          })
        })
      }
    } catch (apiError) {
      console.warn('Logout API call failed, but proceeding with local logout:', apiError)
    }

    // Clear tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')

    // Clear any user data
    userInfo.value = null

    ElMessage.success('Logged out successfully')

    // Redirect to landing page
    router.push({ name: 'LandingPage' })
  } catch (error) {
    // User cancelled the logout
    // No action needed
  }
}

// Get user info on mount
onMounted(async () => {
  // Fetch header data from CMS API
  await fetchHeaderData()
  
  // Set initial drawer state - open by default
  _drawerState.value = true
})
</script>

<style scoped>
.admin-dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  transition: transform 0.2s;
}

.user-menu-trigger {
  transition: all 0.2s ease;
}

.user-menu-trigger:hover {
  opacity: 0.8;
}

.menu-item {
  border-radius: 4px;
  margin-bottom: 2px;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-button {
  margin-right: 8px;
}

.user-info-text {
  min-width: 0;
  flex: 1;
}

@media (max-width: 960px) {
  .admin-dashboard :deep(.v-navigation-drawer) {
    position: fixed !important;
  }

  .admin-dashboard :deep(.v-main) {
    margin-left: 0 !important;
    padding-top: 64px !important;
  }

  .admin-dashboard :deep(.v-app-bar) {
    padding-left: 8px;
    padding-right: 8px;
    position: fixed !important;
    top: 0;
    z-index: 1000;
  }

  .admin-dashboard :deep(.v-container) {
    padding: 16px !important;
  }

  .user-menu-trigger {
    padding: 4px 8px;
  }

  .user-info-text .text-body-2 {
    font-size: 0.875rem !important;
    line-height: 1.2;
  }

  .user-info-text .text-caption {
    font-size: 0.75rem !important;
    line-height: 1.2;
  }
}

@media (max-width: 600px) {
  .admin-dashboard :deep(.v-container) {
    padding: 12px !important;
  }

  .user-info-text {
    display: none;
  }

  .user-menu-trigger {
    padding: 4px;
  }
}
</style>

