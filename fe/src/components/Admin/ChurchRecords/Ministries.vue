<template>
  <div class="ministries">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Ministries</h1>
      <v-btn 
        color="success" 
        prepend-icon="mdi-plus" 
        size="small" 
        :disabled="loading"
        :loading="loading"
        @click="handleMinistryDialog"
      >
        Create Ministry
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Ministries</div>
              <div class="text-h5 font-weight-bold">{{ totalMinistries }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color:white !important;" class="mdi mdi-account-group icon-custom icon-blue" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Active Ministries</div>
              <div class="text-h5 font-weight-bold">{{ activeMinistries }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <span style="color:white !important;" class="mdi mdi-account-group icon-custom icon-blue" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Members</div>
              <div class="text-h5 font-weight-bold">{{ totalMembers }}</div>
            </div>
            <v-avatar size="56" color="purple lighten-5" class="d-flex align-center justify-center">
              <span style="color:white !important;" class="mdi mdi-account-group icon-custom icon-blue" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search ministries..."
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleSearchChange"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.sortBy"
              :items="sortByOptions"
              label="Sort By"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleFilterChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleFilterChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              label="Category"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleCategoryChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center">
            <v-select
              v-model="itemsPerPage"
              :items="pageSizeOptions"
              label="Items per page"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              style="max-width: 150px;"
              @update:model-value="handlePageSizeChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center gap-2">
            <v-tooltip text="Export Excel" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-download"
                  variant="outlined"
                  v-bind="props"
                  :disabled="loading"
                  @click="handleExportExcel"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Print" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-printer"
                  variant="outlined"
                  v-bind="props"
                  :disabled="loading"
                  @click="handlePrint"
                ></v-btn>
              </template>
            </v-tooltip>
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }}</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Ministry List -->
    <div class="mb-4">
      <h2 class="text-h6 font-weight-bold">Ministry List</h2>
    </div>

    <!-- Table -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading ministries..." class="position-relative">
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Ministry Name</th>
            <th class="text-left font-weight-bold">Schedule</th>
            <th class="text-left font-weight-bold">Leader</th>
            <th class="text-left font-weight-bold">Department</th>
            <th class="text-left font-weight-bold">Category</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Members</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && ministries.length === 0">
            <td colspan="8" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="ministry in ministries" :key="ministry.ministry_id">
            <td>{{ ministry.ministry_name }}</td>
            <td>{{ formatDateTime(ministry.schedule) }}</td>
            <td>{{ ministry.leader_fullname || ministry.leader_id || 'N/A' }}</td>
            <td>{{ ministry.department_name || ministry.department_id || 'N/A' }}</td>
            <td>
              <v-chip 
                :color="getCategoryColor(ministry.department_name)" 
                size="small"
                variant="flat"
              >
                {{ getCategoryLabel(ministry.department_name) }}
              </v-chip>
            </td>
            <td>
              <v-chip 
                :color="ministry.status === 'active' ? 'success' : 'default'" 
                size="small"
              >
                {{ ministry.status === 'active' ? 'Active' : 'Not Active' }}
              </v-chip>
            </td>
            <td>{{ Array.isArray(ministry.members) ? ministry.members.length : 0 }}</td>
            <td>{{ formatDateTime(ministry.date_created) }}</td>
            <td>
              <v-tooltip text="Edit Ministry" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="editMinistry(ministry)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Ministry" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error"
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteMinistry(ministry.ministry_id)"
                  ></v-btn>
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Pagination -->
      <div class="d-flex justify-space-between align-center pa-4">
        <div class="text-body-2">
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} ministries
        </div>
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="compact"
          :disabled="loading"
          @update:model-value="handlePageChange"
        ></v-pagination>
      </div>
    </v-card>

    <MinistryDialog
      v-model="ministryDialog"
      :ministry-data="ministryData"
      :leader-options="leaderOptions"
      :department-options="departmentOptions"
      :member-options="memberOptions"
      @update:model-value="ministryDialog = $event"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMinistriesStore } from '@/stores/ChurchRecords/ministriesStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import MinistryDialog from '@/components/Dialogs/MinistryDialog.vue'

const ministriesStore = useMinistriesStore()

// Computed properties from store
const ministries = computed(() => ministriesStore.ministries)
const loading = computed(() => ministriesStore.loading)
const totalMinistries = computed(() => ministriesStore.totalMinistries)
const activeMinistries = computed(() => ministriesStore.activeMinistries)
const totalMembers = computed(() => ministriesStore.totalMembers)
const currentPage = computed({
  get: () => ministriesStore.currentPage,
  set: (value) => ministriesStore.setCurrentPage(value)
})
const totalPages = computed(() => ministriesStore.totalPages)
const totalCount = computed(() => ministriesStore.totalCount)
const itemsPerPage = computed({
  get: () => ministriesStore.itemsPerPage,
  set: (value) => ministriesStore.setPageSize(value)
})
const pageSizeOptions = computed(() => ministriesStore.pageSizeOptions)
const searchQuery = computed({
  get: () => ministriesStore.searchQuery,
  set: (value) => ministriesStore.setSearchQuery(value)
})
const filters = computed({
  get: () => ministriesStore.filters,
  set: (value) => ministriesStore.setFilters(value)
})

// Options for dropdowns
const leaderOptions = computed(() => ministriesStore.leaderOptions)
const departmentOptions = computed(() => ministriesStore.departmentOptions)
const memberOptions = computed(() => ministriesStore.memberOptions)

// Sort options
const sortByOptions = [
  'Ministry Name (A-Z)',
  'Ministry Name (Z-A)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Schedule (A-Z)',
  'Status (A-Z)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const statusOptions = ['All Statuses', 'active', 'not_active']

// Category options for filtering
const categoryOptions = [
  { title: 'All Categories', value: '' },
  { title: 'Adult', value: 'Adult' },
  { title: 'Ladies', value: 'Ladies' },
  { title: 'Youth', value: 'Youth' }
]

// Category filter state
const selectedCategory = ref('')

// Dialog state
const ministryDialog = ref(false)
const ministryData = ref(null)

// Handlers
const handleMinistryDialog = () => {
  ministryData.value = null
  ministryDialog.value = true
}

const editMinistry = (ministry) => {
  ministryData.value = {
    ministry_id: ministry.ministry_id,
    ministry_name: ministry.ministry_name,
    schedule: ministry.schedule,
    leader_id: ministry.leader_id,
    department_id: ministry.department_id,
    members: Array.isArray(ministry.members) ? ministry.members : [],
    status: ministry.status,
    description: ministry.description || null,
    image: ministry.image || null // Include image if available
  }
  ministryDialog.value = true
}

const deleteMinistry = async (id) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this ministry?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await ministriesStore.deleteMinistry(id)
    if (result.success) {
      ElMessage.success('Ministry deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete ministry')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting ministry:', error)
      ElMessage.error('Failed to delete ministry')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (ministryData.value && ministryData.value.ministry_id) {
      // Update
      result = await ministriesStore.updateMinistry(ministryData.value.ministry_id, data)
    } else {
      // Create
      result = await ministriesStore.createMinistry(data)
    }

    if (result.success) {
      ElMessage.success(ministryData.value ? 'Ministry updated successfully' : 'Ministry created successfully')
      ministryDialog.value = false
      ministryData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save ministry')
    }
  } catch (error) {
    console.error('Error submitting ministry:', error)
    ElMessage.error('Failed to save ministry')
  }
}

const handleSearchChange = (value) => {
  ministriesStore.setSearchQuery(value)
}

const handleFilterChange = () => {
  ministriesStore.setFilters(filters.value)
}

// Handle category filter change
const handleCategoryChange = () => {
  // Convert category to department_name_pattern
  const pattern = selectedCategory.value 
    ? `%${selectedCategory.value}%` 
    : ''
  
  // Update filters and refetch
  filters.value.departmentNamePattern = pattern
  ministriesStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  ministriesStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  ministriesStore.setPageSize(pageSize)
}

const handleExportExcel = async () => {
  try {
    const result = await ministriesStore.exportMinistriesToExcel()
    if (result.success) {
      ElMessage.success(result.message || 'Excel file downloaded successfully')
    } else {
      ElMessage.error(result.error || 'Failed to export Excel file')
    }
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    ElMessage.error('An error occurred while exporting to Excel')
  }
}

const getStartIndex = () => {
  if (ministries.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, totalCount.value)
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Ministry Name', 'Schedule', 'Leader', 'Department', 'Status', 'Members', 'Date Created']
  
  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.middle_name || ''} ${userInfo.member.lastname || ''}`.trim()
    : userInfo?.account?.email || 'Admin'
  
  let tableRows = ''
  ministries.value.forEach((ministry) => {
    tableRows += `
      <tr>
        <td>${ministry.ministry_name || 'N/A'}</td>
        <td>${formatDateTime(ministry.schedule)}</td>
        <td>${ministry.leader_fullname || ministry.leader_id || 'N/A'}</td>
        <td>${ministry.department_name || ministry.department_id || 'N/A'}</td>
        <td>${ministry.status === 'active' ? 'Active' : 'Not Active'}</td>
        <td>${Array.isArray(ministry.members) ? ministry.members.length : 0}</td>
        <td>${formatDateTime(ministry.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ministries - Print</title>
        <style>
          @media print {
            @page { margin: 1cm; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            position: relative;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            opacity: 0.08;
            z-index: -1;
            pointer-events: none;
          }
          .watermark img {
            width: 100%;
            height: auto;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          .header img {
            width: 60px;
            height: 60px;
            margin-right: 15px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #1a365d;
          }
          .header .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .org-name {
            text-align: center;
            color: #1a365d;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #1a365d;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #666;
          }
          .footer-info {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          <img src="/logo.png" alt="Watermark" />
        </div>
        <div class="header">
          <img src="/logo.png" alt="Church Logo" />
          <div>
            <h1>Ministries</h1>
            <div class="subtitle">Ministries Report</div>
          </div>
        </div>
        <div class="org-name">Bible Baptist Ekklesia of Kawit</div>
        <table>
          <thead>
            <tr>
              ${tableHeaders.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="' + tableHeaders.length + '" style="text-align: center;">No records found</td></tr>'}
          </tbody>
        </table>
        <div class="footer">
          <div>Total Records: ${ministries.value.length}</div>
          <div class="footer-info">
            <div>Printed on: ${currentDate}</div>
            <div>Printed by: ${printedBy}</div>
          </div>
        </div>
      </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

// Initialize on mount
onMounted(async () => {
  await ministriesStore.fetchMinistries()
  await ministriesStore.fetchLeaderOptions()
  await ministriesStore.fetchDepartmentOptions()
  await ministriesStore.fetchMemberOptions()
})

// Get category color based on department name
const getCategoryColor = (departmentName) => {
  if (!departmentName) return 'grey'
  const name = departmentName.toLowerCase()
  if (name.includes('adult')) return 'blue'
  if (name.includes('ladies')) return 'pink'
  if (name.includes('youth')) return 'orange'
  return 'grey'
}

// Get category label based on department name
const getCategoryLabel = (departmentName) => {
  if (!departmentName) return 'Other'
  const name = departmentName.toLowerCase()
  if (name.includes('adult')) return 'Adult'
  if (name.includes('ladies')) return 'Ladies'
  if (name.includes('youth')) return 'Youth'
  return 'Other'
}
</script>

<style scoped>
.ministries {
  padding: 24px;
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

.icon-blue {
  color: rgb(25, 118, 210) !important;
}

.icon-green {
  color: rgb(76, 175, 80) !important;
}

.icon-purple {
  color: rgb(156, 39, 176) !important;
}
</style>
