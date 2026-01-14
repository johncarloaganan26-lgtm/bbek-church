<template>
  <div class="dashboard-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-h3 font-weight-bold mb-2">Church Admin Dashboard</h1>
      <p class="text-body-1 grey--text">Welcome back! Here's what's happening at BBEK Church.</p>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Members</div>
              <div class="text-h4 font-weight-bold">{{ totalMembers }}</div>
              <div class="text-caption success--text">+{{ membersThisMonth }} this month</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-account-group icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Ongoing Events Today</div>
              <div class="text-h4 font-weight-bold">{{ activeEvents }}</div>
              <div class="text-caption grey--text">{{ upcomingEvents }} upcoming</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-calendar icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Donations</div>
              <div class="text-h4 font-weight-bold">{{ totalDonations }}</div>
              <div class="text-caption success--text">All-time total</div>
            </div>
            <v-avatar size="56" color="purple lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-gift icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">New Messages</div>
              <div class="text-h4 font-weight-bold">{{ totalMessages }}</div>
              <div class="text-caption warning--text">{{ unreadMessages }} unread</div>
            </div>
            <v-avatar size="56" color="orange lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-message icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Gender Breakdown Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="6">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Men</div>
              <div class="text-h4 font-weight-bold">{{ totalMen }}</div>
              <div class="text-caption info--text">{{ totalMembers > 0 ? Math.round((totalMen / totalMembers) * 100) : 0 }}% of total members</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-account icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="6">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Women</div>
              <div class="text-h4 font-weight-bold">{{ totalWomen }}</div>
              <div class="text-caption info--text">{{ totalMembers > 0 ? Math.round((totalWomen / totalMembers) * 100) : 0 }}% of total members</div>
            </div>
            <v-avatar size="56" color="pink lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-account-heart icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Recent Activities (Admin Only) -->
      <v-col v-if="isAdmin" cols="12" md="5">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">Recent Activities</h2>
            <v-icon icon="mdi-trending-up" color="success" size="20"></v-icon>
          </div>
          <v-list lines="three" class="pa-0">
            <v-list-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :prepend-icon="activity.icon"
              class="mb-2"
            >
              <v-list-item-title class="font-weight-medium">
                {{ activity.action }}
              </v-list-item-title>
              <v-list-item-subtitle class="mt-1">
                <div class="d-flex align-center ga-2">
                  <span>{{ activity.user }}</span>
                  <v-chip
                    :color="activity.statusColor"
                    size="x-small"
                    variant="flat"
                    class="ml-2"
                  >
                    {{ activity.status }}
                  </v-chip>
                </div>
                <div class="text-caption text-grey mt-1">
                  <span v-if="activity.entityId" class="mr-2">ID: {{ activity.entityId }}</span>
                  {{ activity.time }}
                </div>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-btn 
            variant="outlined" 
            block 
            class="mt-4"
            @click="$router.push('/admin/audit-trail')"
          >
            View All Activities
          </v-btn>
        </v-card>
      </v-col>

      <!-- Quick Actions -->
      <v-col :cols="isAdmin ? 7 : 12">
        <v-card class="pa-4" elevation="2">
          <h2 class="text-h6 font-weight-bold mb-4">Quick Actions</h2>
          <v-row>
            <v-col
              v-for="action in quickActions"
              :key="action.title"
              cols="12"
              sm="6"
            >
              <v-card
                class="pa-4 text-center cursor-pointer"
                elevation="1"
                hover
                @click="handleQuickAction(action)"
              >
                <v-icon :icon="action.icon" size="40" :color="action.color" class="mb-2"></v-icon>
                <div class="text-body-2 font-weight-medium">{{ action.title }}</div>
                <div class="text-caption grey--text mt-1">{{ action.description }}</div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Church Services Overview -->
    <v-row class="mt-6">
      <v-col cols="12">
        <h2 class="text-h6 font-weight-bold mb-4">Church Services Overview</h2>
        <v-row>
          <v-col cols="12" md="4">
            <v-card class="pa-4" elevation="2" :style="{ backgroundColor: '#E3F2FD' }">
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-water" size="32" color="blue" class="mr-3"></v-icon>
                <h3 class="text-h6 font-weight-bold">Water Baptism</h3>
              </div>
              <p class="text-body-2 mb-4">{{ waterBaptismCount }} scheduled this month</p>
              <v-btn variant="outlined" @click="$router.push('/admin/water-baptism')" color="blue" block>Manage</v-btn>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="pa-4" elevation="2" :style="{ backgroundColor: '#E8F5E9' }">
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-file-document-outline" size="32" color="green" class="mr-3"></v-icon>
                <h3 class="text-h6 font-weight-bold">Child Dedication</h3>
              </div>
              <p class="text-body-2 mb-4">{{ childDedicationCount }} scheduled this month</p>
              <v-btn variant="outlined" color="green" block @click="$router.push('/admin/child-dedication-admin')">Manage</v-btn>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="pa-4" elevation="2" :style="{ backgroundColor: '#F3E5F5' }">
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-coffin" size="32" color="purple" class="mr-3"></v-icon>
                <h3 class="text-h6 font-weight-bold">Burial Service</h3>
              </div>
              <p class="text-body-2 mb-4">{{ burialServiceCount }} scheduled this month</p>
              <v-btn variant="outlined" color="purple" block @click="$router.push('/admin/burial-service')">Manage</v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <MemberRecordDialog
      v-model="memberRecordDialog"
      :member-record-data="memberRecordData"
      @update:model-value="memberRecordDialog = $event"
    />
    <TithesOfferingsDialog
      v-model="tithesOfferingsDialog"
      :tithes-offerings-data="tithesOfferingsData"
      @update:model-value="tithesOfferingsDialog = $event"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuditTrailStore } from '@/stores/auditTrailStore'
import axios from '@/api/axios'
import MemberRecordDialog from '@/components/Dialogs/MemberDialog.vue'
import TithesOfferingsDialog from '@/components/Dialogs/TithesOfferingsDialog.vue'

const router = useRouter()
const auditTrailStore = useAuditTrailStore()

// Check if user is admin
const isAdmin = computed(() => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return userInfo?.account?.position === 'admin'
})

// Dashboard statistics
const totalMembers = ref(0)
const membersThisMonth = ref(0)
const totalMen = ref(0)
const totalWomen = ref(0)
const activeEvents = ref(0)
const upcomingEvents = ref(0)
const totalDonations = ref('₱0')
const donationChange = ref('All-time total')
const totalMessages = ref(0)
const unreadMessages = ref(0)
const waterBaptismCount = ref(0)
const childDedicationCount = ref(0)
const burialServiceCount = ref(0)
const loadingStats = ref(false)

/**
 * Timeout helper - wraps a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000 = 30 seconds)
 * @returns {Promise} Promise that rejects if timeout is reached
 */
const withTimeout = (promise, timeoutMs = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

const memberRecordDialog = ref(false)
const memberRecordData = ref(null)
const handleMemberRecordDialog = ( data ) => {
  memberRecordDialog.value = true
}
const tithesOfferingsDialog = ref(false)
const tithesOfferingsData = ref(null)
const handleTithesOfferingsDialog = ( data ) => {
  tithesOfferingsDialog.value = true
}

/**
 * Get icon based on action type and entity type
 */
const getActivityIcon = (actionType, entityType) => {
  const action = actionType?.toUpperCase() || ''
  const entity = entityType?.toLowerCase() || ''
  
  // Entity-specific icons
  if (entity.includes('member')) {
    return action === 'CREATE' ? 'mdi-account-plus' : action === 'UPDATE' ? 'mdi-account-edit' : 'mdi-account-remove'
  }
  if (entity.includes('baptism') || entity.includes('water')) {
    return 'mdi-water'
  }
  if (entity.includes('marriage')) {
    return 'mdi-heart'
  }
  if (entity.includes('burial')) {
    return 'mdi-cross'
  }
  if (entity.includes('event')) {
    return action === 'CREATE' ? 'mdi-calendar-plus' : action === 'UPDATE' ? 'mdi-calendar-edit' : 'mdi-calendar-remove'
  }
  if (entity.includes('transaction') || entity.includes('tithe') || entity.includes('offering')) {
    return 'mdi-cash'
  }
  if (entity.includes('form') || entity.includes('prayer')) {
    return 'mdi-form-select'
  }
  if (entity.includes('ministry')) {
    return 'mdi-handshake'
  }
  if (entity.includes('login') || entity.includes('logout')) {
    return action === 'LOGIN' ? 'mdi-login' : 'mdi-logout'
  }
  
  // Action-specific fallback icons
  if (action === 'CREATE') return 'mdi-plus-circle'
  if (action === 'UPDATE') return 'mdi-pencil'
  if (action === 'DELETE') return 'mdi-delete'
  if (action === 'VIEW') return 'mdi-eye'
  
  return 'mdi-information'
}

/**
 * Format time as relative (e.g., "2 hours ago", "1 day ago")
 */
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  
  // Convert to Philippine time (UTC+8)
  const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000))
  
  return phTime.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Format action type for display with descriptive message
 */
const formatAction = (log) => {
  const action = log.action_type?.toUpperCase() || ''
  const entity = log.entity_type?.toLowerCase() || ''
  
  // Create descriptive action message
  let actionMessage = ''
  switch (action) {
    case 'CREATE':
      actionMessage = 'Created'
      break
    case 'UPDATE':
      actionMessage = 'Updated'
      break
    case 'DELETE':
      actionMessage = 'Deleted'
      break
    case 'VIEW':
      actionMessage = 'Viewed'
      break
    case 'LOGIN':
      actionMessage = 'Logged in'
      break
    case 'LOGOUT':
      actionMessage = 'Logged out'
      break
    case 'APPROVE':
      actionMessage = 'Approved'
      break
    case 'REJECT':
      actionMessage = 'Rejected'
      break
    default:
      actionMessage = action || 'Performed action'
  }
  
  return actionMessage
}

/**
 * Get status color based on status value
 */
const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || ''
  if (statusLower === 'success') return 'success'
  if (statusLower === 'failed' || statusLower === 'error') return 'error'
  if (statusLower === 'pending') return 'warning'
  return 'info'
}

/**
 * Fetch recent audit trail activities
 */
const fetchRecentActivities = async () => {
  try {
    // Fetch recent activities (limit to 3 most recent) with timeout
    await withTimeout(auditTrailStore.fetchLogs({
      page: 1,
      pageSize: 3
    }), 15000)
  } catch (error) {
    console.error('Error fetching recent activities:', error)
  }
}

/**
 * Transform audit logs to activity format for display
 */
const recentActivities = computed(() => {
  return auditTrailStore.logs
    .slice(0, 3) // Limit to 3 most recent
    .map(log => ({
      id: log.id,
      action: formatAction(log),
      user: log.user_name || log.user_email || 'Unknown User',
      status: log.status?.toUpperCase() || 'UNKNOWN',
      statusColor: getStatusColor(log.status),
      time: formatDateTime(log.date_created),
      icon: getActivityIcon(log.action_type, log.entity_type),
      entityId: log.entity_id || null
    }))
})

/**
 * Fetch dashboard statistics from single backend endpoint
 */
const fetchDashboardStats = async () => {
  loadingStats.value = true
  try {
    const response = await withTimeout(
      axios.get('/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }),
      30000 // 30 second timeout
    )
    
    if (response.data.success && response.data.data) {
      const stats = response.data.data
      
      // Set members stats
      totalMembers.value = stats.members?.total || 0
      membersThisMonth.value = stats.members?.thisMonth || 0
      totalMen.value = stats.members?.men || 0
      totalWomen.value = stats.members?.women || 0
      
      // Set events stats
      activeEvents.value = stats.events?.active || 0
      upcomingEvents.value = stats.events?.upcoming || 0
      
      // Set donations stats - use total all-time donations from tithes
      const totalAllDonations = stats.donations?.totalAll || 0
      totalDonations.value = `₱${totalAllDonations.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      
      // Also fetch from tithes endpoint to get accurate total
      try {
        const tithesResponse = await axios.get('/church-records/tithes/getAllTithes', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
          params: { limit: 1, pageSize: 1 }
        })
        if (tithesResponse.data.success && tithesResponse.data.summaryStats) {
          const tithesTotal = tithesResponse.data.summaryStats.totalDonations || 0
          totalDonations.value = `₱${tithesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      } catch (tithesError) {
        console.error('Error fetching tithes:', tithesError)
      }
      
      // Set messages stats
      totalMessages.value = stats.messages?.total || 0
      unreadMessages.value = stats.messages?.unread || 0
      
      // Set church services stats
      waterBaptismCount.value = stats.churchServices?.waterBaptism || 0
      childDedicationCount.value = stats.churchServices?.childDedication || 0
      burialServiceCount.value = stats.churchServices?.burialService || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Set defaults on error
    totalMembers.value = 0
    membersThisMonth.value = 0
    totalMen.value = 0
    totalWomen.value = 0
    activeEvents.value = 0
    upcomingEvents.value = 0
    totalDonations.value = '₱0.00'
    totalMessages.value = 0
    unreadMessages.value = 0
    waterBaptismCount.value = 0
    childDedicationCount.value = 0
    burialServiceCount.value = 0
  } finally {
    loadingStats.value = false
  }
}

// Fetch activities and stats on mount
onMounted(async () => {
  try {
    // Fetch activities and stats in parallel
    await Promise.all([
      withTimeout(fetchRecentActivities(), 15000),
      withTimeout(fetchDashboardStats(), 30000)
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
})

const quickActions = ref([
  {
    title: 'Add New Member',
    description: 'Register a new church member',
    icon: 'mdi-account-plus',
    color: 'primary',
    action: `handleMemberRecordDialog`
  },
  {
    title: 'Create Event',
    description: 'Schedule a new church event',
    icon: 'mdi-plus-circle',
    color: 'success',
    action: `handleEventDialog`
  },
  {
    title: 'Record Donation',
    description: 'Add new tithe or offering',
    icon: 'mdi-gift',
    color: 'purple',
    action: `handleTithesOfferingsDialog`
  },
  {
    title: 'View Messages',
    description: 'Check member messages',
    icon: 'mdi-message',
    color: 'orange',
    action: `handleMessagesDialog`
  }
])

const handleQuickAction = (action) => {
  console.log('Quick action:', action.title)
  // Handle quick action logic here
  if(action.action==='handleMemberRecordDialog')  handleMemberRecordDialog(null)
  if(action.action==='handleTithesOfferingsDialog')  handleTithesOfferingsDialog(null)
  if(action.action==='handleEventDialog')  handleEventDialog(null)
  if(action.action==='handleMessagesDialog')  handleMessagesDialog(null)
}
const handleViewAllActivities = () => {
  router.push('/admin/audit-trail')
}
const handleEventDialog = ( data ) => {
  console.log('Event dialog:', data)
  router.push('/admin/events')
}
const handleMessagesDialog = ( data ) => {
  console.log('Messages dialog:', data)
  router.push('/admin/messages')
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  transition: transform 0.2s;
}

.icon-custom {
  font-size: 32px !important;
  line-height: 1 !important;
  display: inline-block !important;
  font-family: "Material Design Icons" !important;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-rendering: auto;
  -webkit-font-smoothing: antialiased;
}

@media (max-width: 960px) {
  .dashboard-view :deep(.text-h3) {
    font-size: 1.5rem !important;
  }

  .dashboard-view :deep(.v-card) {
    padding: 16px !important;
  }

  .dashboard-view :deep(.v-avatar) {
    width: 48px !important;
    height: 48px !important;
  }

  .dashboard-view :deep(.text-h4) {
    font-size: 1.5rem !important;
  }
}

@media (max-width: 640px) {
  .dashboard-view :deep(.text-h3) {
    font-size: 1.25rem !important;
  }

  .dashboard-view :deep(.v-row) {
    margin: 0 !important;
  }

  .dashboard-view :deep(.v-col) {
    padding: 8px !important;
  }

  .dashboard-view :deep(.v-card) {
    padding: 12px !important;
  }

  .dashboard-view :deep(.v-avatar) {
    width: 40px !important;
    height: 40px !important;
  }

  .dashboard-view :deep(.text-h4) {
    font-size: 1.25rem !important;
  }

  .dashboard-view :deep(.text-body-2) {
    font-size: 0.75rem !important;
  }
}
</style>
