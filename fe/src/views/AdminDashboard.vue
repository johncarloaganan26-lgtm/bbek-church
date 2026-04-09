<template>
  <div class="admin-dashboard">
    <v-navigation-drawer 
      v-model="_drawerState"
      :rail="isRail && !isMobile"
      :temporary="isMobile"
      permanent
      width="280" 
      color="white"
      class="elevation-1 sidebar-drawer"
    >
      <div class="sidebar-header pa-4 cursor-pointer" @click="navigateTo('LandingPage')">
        <div class="d-flex align-center" :class="{ 'justify-center': isRail && !isMobile, 'mb-4': !isRail || isMobile }">
          <v-avatar size="40" color="primary" :class="{ 'mr-3': !isRail || isMobile }">
            <img :src="headerData.logo" :alt="headerData.fullname || 'BBEK Church'" width="40" height="40">
          </v-avatar>
          <span v-if="!isRail || isMobile" class="text-h6 font-weight-bold text-no-wrap">{{ headerData.acronym || 'BBEK' }} Church</span>
        </div>
        <div v-if="!isRail || isMobile" class="text-uppercase text-caption grey--text mb-0">{{ isAdmin ? 'ADMIN PANEL' : 'STAFF PANEL' }}</div>
      </div>

      <div class="sidebar-scroll-area">
        <v-list v-model:opened="openedGroups" nav density="compact" class="pa-0 sidebar-list" color="teal">
        <draggable 
          v-model="sidebarItems" 
          item-key="id"
          ghost-class="ghost-item"
          @change="saveSidebarOrder"
          :animation="300"
          :disabled="isRail && !isMobile"
        >
          <template #item="{ element }">
            <div class="sidebar-item-wrapper" :class="{ 'no-drag': isRail && !isMobile }">
              <!-- Drag Indicator (Visual only) - Hidden in Rail mode -->
              <div v-if="!isRail || isMobile" class="drag-indicator">
                <v-icon icon="mdi-drag-vertical" size="small" color="grey-lighten-1"></v-icon>
              </div>

              <!-- Individual Item (e.g., Dashboard) - Hidden in Rail mode as requested -->
              <v-list-item
                v-if="(!isRail || isMobile) && element.type === 'item' && (!element.adminOnly || isAdmin)"
                :prepend-icon="element.icon"
                :title="element.title"
                :value="element.id"
                :active="$route.name === element.activeName"
                :to="element.to"
                class="mb-2"
                @click="closeDrawerOnMobile"
              ></v-list-item>

              <!-- Group (e.g., Church Records) -->
              <template v-else-if="element.type === 'group'">
                <!-- Rail Mode: Simple Icon with Floating Menu -->
                <v-list-item
                  v-if="isRail && !isMobile"
                  :value="element.id"
                  class="rail-group-activator pa-0"
                  :class="{ 'activator-active': isGroupActive(element) }"
                  @click.stop.prevent="handleRailClick"
                >
                  <div class="d-flex justify-center align-center w-100">
                    <v-icon :icon="element.icon" size="24" :color="isGroupActive(element) ? 'teal' : 'grey-darken-1'"></v-icon>
                  </div>
                  
                  <v-menu
                    activator="parent"
                    location="end top"
                    :offset="[14, 0]"
                    open-on-hover
                    transition="slide-x-transition"
                  >
                    <v-paper class="pa-1 sidebar-popup-card">
                      <v-list density="compact" class="pa-0">
                        <v-list-item
                          v-for="subItem in element.items.filter(si => !si.adminOnly || isAdmin)"
                          :key="subItem.title"
                          :prepend-icon="subItem.icon"
                          :title="subItem.title"
                          :to="subItem.to"
                          @click="closeDrawerOnMobile"
                          class="sidebar-popup-item"
                        ></v-list-item>
                      </v-list>
                    </v-paper>
                  </v-menu>
                </v-list-item>

                <!-- Expanded Mode: Standard collapsible Group -->
                <v-list-group 
                  v-else
                  :value="element.id" 
                  :prepend-icon="element.icon"
                >
                  <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props" :title="element.title"></v-list-item>
                  </template>
                  
                  <draggable
                    v-if="!isRail || isMobile"
                    v-model="element.items"
                    item-key="title"
                    group="modules"
                    ghost-class="ghost-item"
                    @change="saveSidebarOrder"
                    :animation="250"
                    class="nested-draggable"
                    :disabled="true"
                  >
                    <template #item="{ element: subItem }">
                      <div v-if="!subItem.adminOnly || isAdmin" class="nested-item-wrapper">
                        <v-list-item 
                          :prepend-icon="subItem.icon" 
                          :title="subItem.title"
                          :to="subItem.to"
                          :active="$route.name === subItem.activeName"
                          @click="closeDrawerOnMobile"
                          class="sidebar-item"
                        ></v-list-item>
                      </div>
                    </template>
                  </draggable>
                </v-list-group>
              </template>
            </div>
          </template>
        </draggable>
        </v-list>
      </div>
    </v-navigation-drawer>

    <v-app-bar color="white" elevation="1">
      <v-app-bar-nav-icon
        @click="toggleSidebar"
        class="menu-button"
      ></v-app-bar-nav-icon>

      <div class="admin-search-wrapper">
        <v-autocomplete
          v-model="selectedAdminSearchItem"
          v-model:search="adminSearchQuery"
          :items="adminSearchItems"
          item-title="title"
          item-value="id"
          return-object
          variant="outlined"
          density="comfortable"
          hide-details
          no-filter
          :loading="isAdminSearchLoading"
          clearable
          prepend-inner-icon="mdi-magnify"
          placeholder="Search modules and records"
          :no-data-text="adminSearchNoDataText"
          class="admin-search"
          @update:model-value="handleAdminSearchSelect"
          @keydown.enter.prevent="handleAdminSearchEnter"
          @click:clear="clearAdminSearch"
        >
          <template #item="{ props, item }">
            <v-list-item
              v-bind="props"
              :prepend-icon="item.raw.icon"
              :title="item.raw.title"
              :subtitle="item.raw.subtitle"
            >
              <template #append>
                <span
                  class="admin-search-item-tag"
                  :class="{ 'admin-search-item-tag-module': item.raw.itemType === 'module' }"
                >
                  {{ item.raw.itemType === 'record' ? item.raw.moduleTitle : 'Module' }}
                </span>
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>
      </div>
      <v-spacer></v-spacer>

      <!-- Manage Availability Slots Button -->
      <v-btn
        prepend-icon="mdi-calendar-clock"
        variant="elevated"
        @click="availabilityManagerVisible = true"
        class="mr-4 px-4 font-weight-bold"
        color="teal-darken-1"
        style="border-radius: 8px; text-transform: none !important;"
      >
        Manage Availability Slots
      </v-btn>

      <!-- Notification Icon -->
      <NotificationIcon class="mr-4" />

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

    <!-- Global Availability Manager -->
    <AvailabilityManager v-model="availabilityManagerVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCmsStore } from '@/stores/cmsStore'
import { useDisplay } from 'vuetify'
import NotificationIcon from '@/components/NotificationIcon.vue'
import AvailabilityManager from '@/components/Admin/ServicesRecords/AvailabilityManager.vue'
import draggable from 'vuedraggable'
import axios from '@/api/axios'

const availabilityManagerVisible = ref(false)

const route = useRoute()
const router = useRouter()
const cmsStore = useCmsStore()
const { mobile } = useDisplay()

// --- Sidebar Reordering Feature ---
const SIDEBAR_STORAGE_KEY = 'bbek_sidebar_order'

const defaultSidebarItems = [
  {
    id: 'dashboard',
    type: 'item',
    title: 'DASHBOARD',
    icon: 'mdi-home',
    to: { name: 'Dashboard' },
    activeName: 'Dashboard'
  },
  {
    id: 'church-records',
    type: 'group',
    title: 'CHURCH RECORDS',
    icon: 'mdi-database',
    items: [
      { title: 'Accounts', icon: 'mdi-account', to: { name: 'Accounts' }, activeName: 'Accounts' },
      { title: 'Departments', icon: 'mdi-office-building', to: { name: 'Departments' }, activeName: 'Departments' },
      { title: 'Member Record', icon: 'mdi-account', to: { name: 'MemberRecord' }, activeName: 'MemberRecord' },
      { title: 'Events Records', icon: 'mdi-calendar', to: { name: 'EventsRecords' }, activeName: 'EventsRecords' },
      { title: 'Tithes & Offerings', icon: 'mdi-gift', to: { name: 'TithesOfferings' }, activeName: 'TithesOfferings' },
      { title: 'Ministries', icon: 'mdi-account-group', to: { name: 'Ministries' }, activeName: 'Ministries' }
    ]
  },
  {
    id: 'services',
    type: 'group',
    title: 'SERVICES',
    icon: 'mdi-gift-outline',
    items: [
      { title: 'Salvation Requests', icon: 'mdi-account-plus', to: { name: 'DiscipleshipAdmin' }, activeName: 'DiscipleshipAdmin' },
      { title: 'Bible Study', icon: 'mdi-book-open-variant', to: { name: 'BibleStudy' }, activeName: 'BibleStudy' },
      { title: 'Water Baptism', icon: 'mdi-water', to: { name: 'WaterBaptism' }, activeName: 'WaterBaptism' },
      { title: 'Child Dedication', icon: 'mdi-baby-face', to: { name: 'ChildDedicationAdmin' }, activeName: 'ChildDedicationAdmin' },
      { title: 'Burial Service', icon: 'mdi-coffin', to: { name: 'BurialService' }, activeName: 'BurialService' }
    ]
  },
  {
    id: 'communication',
    type: 'group',
    title: 'COMMUNICATION',
    icon: 'mdi-message',
    items: [
      { title: 'Messages', icon: 'mdi-message-text', to: { name: 'Messages' }, activeName: 'Messages' }
    ]
  },
  {
    id: 'maintenance',
    type: 'group',
    title: 'MAINTENANCE',
    icon: 'mdi-cog',
    items: [
      { title: 'Archives', icon: 'mdi-folder', to: { name: 'Archive' }, activeName: 'Archive', adminOnly: true },
      { title: 'Audit Trail', icon: 'mdi-file-document', to: { name: 'AuditTrail' }, activeName: 'AuditTrail', adminOnly: true },
      { title: 'Settings', icon: 'mdi-cog', to: { name: 'Settings' }, activeName: 'Settings' },
      { title: 'Content Management', icon: 'mdi-file-document', to: { name: 'ContentManagement' }, activeName: 'ContentManagement', adminOnly: true }
    ]
  }
]

const sidebarItems = ref([])

// Helper to find a module by title across all default items
const findModuleByTitle = (title) => {
  for (const group of defaultSidebarItems) {
    if (group.items) {
      const found = group.items.find(item => item.title === title)
      if (found) return { ...found }
    }
  }
  return null
}

const loadSidebarOrder = () => {
  const savedOrder = localStorage.getItem(SIDEBAR_STORAGE_KEY)
  if (savedOrder) {
    try {
      const parsed = JSON.parse(savedOrder)
      
      // 1. Reconstruct top-level structure
      const merged = parsed.map(savedItem => {
        const defItem = defaultSidebarItems.find(d => d.id === savedItem.id)
        if (!defItem) return null
        
        // Use a copy to avoid mutating defaultSidebarItems
        const newItem = JSON.parse(JSON.stringify(defItem))
        
        // 2. Restore custom sub-item order/grouping
        if (newItem.type === 'group' && savedItem.itemsOrder) {
          newItem.items = savedItem.itemsOrder.map(title => findModuleByTitle(title)).filter(Boolean)
        }
        
        return newItem
      }).filter(Boolean)
      
      // 3. Handle modules that were NOT in the saved order (new modules or default ones)
      // Check which default modules are missing from the entire merged structure
      const allActiveTitles = new Set()
      merged.forEach(mi => {
        if (mi.items) mi.items.forEach(si => allActiveTitles.add(si.title))
      })
      
      defaultSidebarItems.forEach(defItem => {
        // Add missing top-level categories
        if (!merged.find(m => m.id === defItem.id)) {
          merged.push(JSON.parse(JSON.stringify(defItem)))
        }
        
        // Add missing modules to their default parent
        if (defItem.items) {
          defItem.items.forEach(si => {
            if (!allActiveTitles.has(si.title)) {
              const targetGroup = merged.find(m => m.id === defItem.id)
              if (targetGroup && targetGroup.items) {
                targetGroup.items.push({ ...si })
              }
            }
          })
        }
      })
      
      sidebarItems.value = merged
    } catch (e) {
      console.warn('Failed to load sidebar order:', e)
      sidebarItems.value = JSON.parse(JSON.stringify(defaultSidebarItems))
    }
  } else {
    sidebarItems.value = JSON.parse(JSON.stringify(defaultSidebarItems))
  }
}

const saveSidebarOrder = () => {
  const orderToSave = sidebarItems.value.map(item => ({ 
    id: item.id,
    // Also save the order of inner items if it's a group
    itemsOrder: item.items ? item.items.map(si => si.title) : []
  }))
  localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(orderToSave))
}

const hasVisibleItems = (group) => {
  return group.items.some(item => !item.adminOnly || isAdmin.value)
}

// Initialize sidebar
loadSidebarOrder()
// --- End Sidebar Reordering Feature ---

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
const isRail = ref(false) // Mini sidebar state
const openedGroups = ref([])

const toggleSidebar = () => {
  if (isMobile.value) {
    _drawerState.value = !_drawerState.value
  } else {
    isRail.value = !isRail.value
    // Auto-collapse groups when moving to rail mode
    if (isRail.value) {
      openedGroups.value = []
    }
  }
}

const isGroupActive = (group) => {
  if (!group.items) return false
  return group.items.some(item => route.name === item.activeName)
}

const handleRailClick = (e) => {
  if (isRail.value && !isMobile.value) {
    e.preventDefault()
    e.stopPropagation()
  }
}

const selectedAdminSearchItem = ref(null)
const adminSearchQuery = ref('')
const adminSearchRemoteResults = ref([])
const isAdminSearchLoading = ref(false)
let adminSearchDebounceTimer = null

const MIN_ADMIN_RECORD_SEARCH_LENGTH = 2
const ADMIN_SEARCH_DEBOUNCE_MS = 320

const adminOnlyModules = new Set(['Archive', 'AuditTrail', 'ContentManagement'])
const excludedAdminSearchModules = new Set(['MarriageServiceAdmin', 'Transactions'])

const adminRouteMetadata = {
  Dashboard: {
    title: 'Dashboard',
    section: 'Overview',
    icon: 'mdi-home',
    keywords: ['home', 'overview', 'summary']
  },
  Accounts: {
    title: 'Accounts',
    section: 'Church Records',
    icon: 'mdi-account',
    keywords: ['users', 'roles', 'staff', 'members']
  },
  Departments: {
    title: 'Departments',
    section: 'Church Records',
    icon: 'mdi-office-building',
    keywords: ['teams', 'groups']
  },
  MemberRecord: {
    title: 'Member Record',
    section: 'Church Records',
    icon: 'mdi-account-group',
    keywords: ['members', 'profiles', 'records']
  },
  ImportMembers: {
    title: 'Import Members',
    section: 'Church Records',
    icon: 'mdi-file-import',
    keywords: ['upload', 'bulk', 'excel', 'csv']
  },

  EventsRecords: {
    title: 'Events Records',
    section: 'Church Records',
    icon: 'mdi-calendar',
    keywords: ['events']
  },
  TithesOfferings: {
    title: 'Tithes & Offerings',
    section: 'Church Records',
    icon: 'mdi-gift',
    keywords: ['tithes', 'offerings', 'donations', 'giving']
  },
  Ministries: {
    title: 'Ministries',
    section: 'Church Records',
    icon: 'mdi-account-group',
    keywords: ['ministry', 'groups']
  },
  Transactions: {
    title: 'Transactions',
    section: 'Church Records',
    icon: 'mdi-cash-multiple',
    keywords: ['payments', 'history']
  },
  DiscipleshipAdmin: {
    title: 'Salvation Requests',
    section: 'Services',
    icon: 'mdi-account-plus',
    keywords: ['discipleship', 'requests', 'salvation']
  },
  SalvationAvailability: {
    title: 'Salvation Slots',
    section: 'Services',
    icon: 'mdi-calendar-clock',
    keywords: ['salvation', 'slots', 'availability']
  },
  BibleStudy: {
    title: 'Bible Study',
    section: 'Services',
    icon: 'mdi-book-open-variant',
    keywords: ['bible', 'study', 'discipleship']
  },
  WaterBaptism: {
    title: 'Water Baptism',
    section: 'Services',
    icon: 'mdi-water',
    keywords: ['baptism']
  },
  ChildDedicationAdmin: {
    title: 'Child Dedication',
    section: 'Services',
    icon: 'mdi-baby-face',
    keywords: ['dedication']
  },
  BurialService: {
    title: 'Burial Service',
    section: 'Services',
    icon: 'mdi-coffin',
    keywords: ['burial', 'funeral']
  },
  MarriageServiceAdmin: {
    title: 'Marriage Service',
    section: 'Services',
    icon: 'mdi-ring',
    keywords: ['marriage', 'wedding']
  },
  Messages: {
    title: 'Messages',
    section: 'Communication',
    icon: 'mdi-message-text',
    keywords: ['communication', 'inbox', 'contacts']
  },
  Settings: {
    title: 'Settings',
    section: 'Maintenance',
    icon: 'mdi-cog',
    keywords: ['configuration', 'preferences']
  },
  ContentManagement: {
    title: 'Content Management',
    section: 'Maintenance',
    icon: 'mdi-file-document-edit',
    keywords: ['cms', 'website content', 'landing pages']
  },
  Archive: {
    title: 'Archives',
    section: 'Maintenance',
    icon: 'mdi-folder',
    keywords: ['archive', 'deleted', 'history']
  },
  AuditTrail: {
    title: 'Audit Trail',
    section: 'Maintenance',
    icon: 'mdi-file-document',
    keywords: ['audit', 'logs', 'activity']
  }
}

const sectionSortOrder = {
  Overview: 0,
  'Church Records': 1,
  Services: 2,
  Communication: 3,
  Maintenance: 4,
  Admin: 5
}

const formatRouteName = (name) => {
  if (!name) return ''

  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
}

const normalizeAdminSearchQuery = (value) => String(value || '').trim().toLowerCase()

const matchesAdminSearchQuery = (searchIndex, normalizedQuery) => {
  if (!normalizedQuery) return true
  return String(searchIndex || '').toLowerCase().includes(normalizedQuery)
}

const searchableAdminModules = computed(() => {
  const adminRoute = router.options.routes.find((routeItem) => routeItem.path === '/admin')
  const adminChildren = adminRoute?.children || []

  return adminChildren
    .filter((child) => child?.name)
    .filter((child) => !excludedAdminSearchModules.has(child.name))
    .filter((child) => isAdmin.value || !adminOnlyModules.has(child.name))
    .map((child) => {
      const metadata = adminRouteMetadata[child.name] || {}
      const title = metadata.title || formatRouteName(child.name)
      const section = metadata.section || 'Admin'
      const keywords = metadata.keywords || []
      const icon = metadata.icon || 'mdi-file-document-outline'

      return {
        id: `module:${child.name}`,
        itemType: 'module',
        name: child.name,
        title,
        subtitle: `${section} Module`,
        section,
        path: child.path,
        icon,
        searchIndex: [title, section, child.name, child.path, ...keywords].join(' ').toLowerCase()
      }
    })
    .sort((a, b) => {
      const sectionCompare = (sectionSortOrder[a.section] ?? 999) - (sectionSortOrder[b.section] ?? 999)
      if (sectionCompare !== 0) return sectionCompare
      return a.title.localeCompare(b.title)
    })
})

const filteredAdminModules = computed(() => {
  const normalizedQuery = normalizeAdminSearchQuery(adminSearchQuery.value)
  if (!normalizedQuery) return searchableAdminModules.value

  return searchableAdminModules.value.filter((moduleItem) =>
    matchesAdminSearchQuery(moduleItem.searchIndex, normalizedQuery)
  )
})

const adminSearchItems = computed(() => {
  const normalizedQuery = normalizeAdminSearchQuery(adminSearchQuery.value)
  const moduleItems = normalizedQuery ? filteredAdminModules.value : searchableAdminModules.value

  if (!normalizedQuery || normalizedQuery.length < MIN_ADMIN_RECORD_SEARCH_LENGTH) {
    return moduleItems
  }

  const seen = new Set()
  const recordItems = adminSearchRemoteResults.value.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })

  return [...recordItems, ...moduleItems]
})

const adminSearchNoDataText = computed(() => {
  const normalizedQuery = normalizeAdminSearchQuery(adminSearchQuery.value)
  if (!normalizedQuery) return 'No results found'
  if (normalizedQuery.length < MIN_ADMIN_RECORD_SEARCH_LENGTH) {
    return `Type at least ${MIN_ADMIN_RECORD_SEARCH_LENGTH} characters`
  }
  if (isAdminSearchLoading.value) return 'Searching records...'
  return 'No matching module or record'
})

const mapAdminRecordSearchResult = (item, index) => {
  const moduleKey = item?.module || 'record'
  const recordId = item?.recordId || index

  return {
    id: `record:${moduleKey}:${recordId}`,
    itemType: 'record',
    module: moduleKey,
    moduleTitle: item?.moduleTitle || item?.section || 'Record',
    routeName: item?.routeName || '',
    icon: item?.icon || 'mdi-file-document-outline',
    title: item?.title || item?.moduleTitle || 'Record',
    subtitle: item?.subtitle || item?.section || 'Record',
    matchScore: Number(item?.matchScore) || 0,
    searchIndex: String(item?.searchIndex || `${item?.title || ''} ${item?.subtitle || ''}`).toLowerCase()
  }
}

const fetchAdminGlobalSearchResults = async (queryText) => {
  const normalizedQuery = normalizeAdminSearchQuery(queryText)
  if (normalizedQuery.length < MIN_ADMIN_RECORD_SEARCH_LENGTH) {
    adminSearchRemoteResults.value = []
    return
  }

  isAdminSearchLoading.value = true

  try {
    const response = await axios.get('/dashboard/global-search', {
      params: {
        q: queryText,
        perModuleLimit: 4,
        limit: 36
      }
    })

    if (normalizeAdminSearchQuery(adminSearchQuery.value) !== normalizedQuery) return

    const apiResults = Array.isArray(response?.data?.data?.results)
      ? response.data.data.results
      : []

    adminSearchRemoteResults.value = apiResults.map(mapAdminRecordSearchResult)
  } catch (error) {
    if (normalizeAdminSearchQuery(adminSearchQuery.value) === normalizedQuery) {
      adminSearchRemoteResults.value = []
    }
    console.warn('Admin global search warning:', error)
  } finally {
    if (normalizeAdminSearchQuery(adminSearchQuery.value) === normalizedQuery) {
      isAdminSearchLoading.value = false
    }
  }
}

const clearAdminSearch = () => {
  if (adminSearchDebounceTimer) {
    clearTimeout(adminSearchDebounceTimer)
    adminSearchDebounceTimer = null
  }
  selectedAdminSearchItem.value = null
  adminSearchQuery.value = ''
  adminSearchRemoteResults.value = []
  isAdminSearchLoading.value = false
}

watch(adminSearchQuery, (queryText) => {
  const normalizedQuery = normalizeAdminSearchQuery(queryText)

  if (adminSearchDebounceTimer) {
    clearTimeout(adminSearchDebounceTimer)
    adminSearchDebounceTimer = null
  }

  if (normalizedQuery.length < MIN_ADMIN_RECORD_SEARCH_LENGTH) {
    adminSearchRemoteResults.value = []
    isAdminSearchLoading.value = false
    return
  }

  adminSearchDebounceTimer = setTimeout(() => {
    fetchAdminGlobalSearchResults(queryText)
  }, ADMIN_SEARCH_DEBOUNCE_MS)
})

const findBestAdminSearchMatch = (queryText) => {
  const normalizedQuery = normalizeAdminSearchQuery(queryText)
  if (!normalizedQuery) return null

  return adminSearchItems.value
    .map((item) => {
      const lowerTitle = String(item.title || '').toLowerCase()
      const lowerSubtitle = String(item.subtitle || '').toLowerCase()
      const lowerSearchIndex = String(item.searchIndex || '').toLowerCase()

      let score = item.itemType === 'record' ? Number(item.matchScore || 0) : 0
      if (lowerTitle === normalizedQuery) score += 180
      if (lowerTitle.startsWith(normalizedQuery)) score += 120
      if (lowerTitle.includes(normalizedQuery)) score += 80
      if (lowerSubtitle.includes(normalizedQuery)) score += 45
      if (lowerSearchIndex.includes(normalizedQuery)) score += 20
      if (item.itemType === 'record') score += 10

      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))[0]?.item || null
}

const navigateToAdminModule = async (moduleItem) => {
  if (!moduleItem?.name) return

  if (route.name === moduleItem.name) {
    clearAdminSearch()
    return
  }

  try {
    await router.push({ name: moduleItem.name })
  } catch (navigationError) {
    console.warn('Admin search navigation warning:', navigationError)
  } finally {
    closeDrawerOnMobile()
    clearAdminSearch()
  }
}

const navigateToAdminRecord = async (recordItem) => {
  if (!recordItem?.routeName) return

  if (route.name === recordItem.routeName) {
    clearAdminSearch()
    return
  }

  try {
    await router.push({ name: recordItem.routeName })
  } catch (navigationError) {
    console.warn('Admin record search navigation warning:', navigationError)
  } finally {
    closeDrawerOnMobile()
    clearAdminSearch()
  }
}

const navigateFromAdminSearchItem = async (searchItem) => {
  if (!searchItem) return

  if (searchItem.itemType === 'module') {
    await navigateToAdminModule(searchItem)
    return
  }

  await navigateToAdminRecord(searchItem)
}

const handleAdminSearchSelect = async (searchItem) => {
  if (!searchItem) return
  await navigateFromAdminSearchItem(searchItem)
}

const handleAdminSearchEnter = async () => {
  const selectedItem = selectedAdminSearchItem.value?.id
    ? selectedAdminSearchItem.value
    : findBestAdminSearchMatch(adminSearchQuery.value)

  if (!selectedItem) return
  await navigateFromAdminSearchItem(selectedItem)
}

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

watch(
  () => route.name,
  () => {
    clearAdminSearch()
  }
)

onUnmounted(() => {
  if (adminSearchDebounceTimer) {
    clearTimeout(adminSearchDebounceTimer)
    adminSearchDebounceTimer = null
  }
})
</script>

<style scoped>
.admin-dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Sidebar Sticky Header Layout */
:deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden !important;
}

.sidebar-header {
  flex-shrink: 0;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 20;
  min-height: 84px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  transition: all 0.2s ease;
}

.sidebar-scroll-area {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 32px;
}

/* Custom Scrollbar for Sidebar */
.sidebar-scroll-area::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.sidebar-scroll-area:hover::-webkit-scrollbar-thumb {
  background: rgba(20, 184, 166, 0.3);
}

/* Floating Rail Menu Styles */
.rail-group-activator {
  height: 48px !important;
  width: 100% !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  position: relative;
  cursor: default !important;
  padding: 0 !important;
}

.rail-group-activator :deep(.v-list-item__content),
.rail-group-activator :deep(.v-list-item__spacer) {
  display: none !important;
}

.activator-active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 4px;
  background: #14b8a6;
  border-radius: 0 4px 4px 0;
}

.sidebar-popup-card {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(0, 0, 0, 0.05);
  min-width: 220px;
}

.sidebar-popup-item {
  border-radius: 8px !important;
  margin-bottom: 2px;
  transition: all 0.2s ease;
}

.sidebar-popup-item:hover {
  background: rgba(20, 184, 166, 0.08) !important;
  color: #0d9488 !important;
}

.sidebar-popup-item :deep(.v-list-item-title) {
  font-size: 0.9rem !important;
  font-weight: 500;
}

.category-activator {
  transition: background 0.2s ease;
}

.sidebar-drawer :deep(.v-navigation-drawer--rail) .category-activator {
  cursor: default !important;
}

.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 4px;
}

/* Sidebar Draggable Styles */
.sidebar-list {
  padding-top: 0 !important;
}

.sidebar-item-wrapper {
  position: relative;
  transition: all 0.2s ease;
  cursor: grab;
}

.sidebar-item-wrapper.no-drag {
  cursor: default !important;
}

.sidebar-item-wrapper:active {
  cursor: grabbing;
}

.sidebar-item-wrapper.no-drag:active {
  cursor: default !important;
}

.drag-indicator {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.3;
  z-index: 10;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
}

.sidebar-item-wrapper:hover .drag-indicator {
  opacity: 0.8;
}

.nested-item-wrapper {
  position: relative;
  cursor: grab !important;
}

.nested-item-wrapper:active {
  cursor: grabbing !important;
}

.sidebar-item {
  margin-left: 0 !important;
}

.nested-draggable {
  min-height: 20px;
  padding-bottom: 4px;
}

.ghost-item {
  opacity: 0.3;
  background: rgba(20, 184, 166, 0.1) !important;
  border: 1px dashed #14b8a6;
  border-radius: 8px;
}

/* Premium Sidebar Active State */
:deep(.v-list-item--active) {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.25);
  margin-left: 4px !important;
  margin-right: 4px !important;
  border-radius: 5px !important;
}

:deep(.v-list-item--active .v-list-item__prepend .v-icon) {
  color: white !important;
}

:deep(.v-list-item--active .v-list-item-title) {
  font-weight: 600 !important;
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

.admin-search-wrapper {
  width: min(420px, 34vw);
  margin-right: 12px;
}

.admin-search :deep(.v-field) {
  border-radius: 10px;
  background-color: #f8fafc;
}

.admin-search :deep(.v-field__input) {
  min-height: 40px;
  font-size: 0.9rem;
}

.admin-search :deep(.v-list-item-title) {
  font-size: 0.9rem;
}

.admin-search :deep(.v-list-item-subtitle) {
  font-size: 0.75rem;
  opacity: 0.8;
}

.admin-search-item-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(20, 184, 166, 0.28);
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  white-space: nowrap;
}

.admin-search-item-tag-module {
  border-color: rgba(107, 114, 128, 0.28);
  background: rgba(107, 114, 128, 0.12);
  color: #4b5563;
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

  .admin-search-wrapper {
    width: min(56vw, 280px);
    margin-right: 8px;
  }

  .admin-search :deep(.v-field__input) {
    font-size: 0.85rem;
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

  .admin-search-wrapper {
    width: min(58vw, 210px);
    margin-right: 4px;
  }

  .admin-search :deep(.v-field__input) {
    min-height: 36px;
    font-size: 0.8rem;
  }

  .user-info-text {
    display: none;
  }

  .user-menu-trigger {
    padding: 4px;
  }
}
</style>

