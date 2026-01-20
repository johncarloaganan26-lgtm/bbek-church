<template>
  <div class="marriage-record">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Marriage Records</h1>
      <v-btn 
        color="success" 
        prepend-icon="mdi-plus" 
        size="small" 
        :disabled="loading"
        :loading="loading"
        @click="handleMarriageServiceDialog"
      >
        New Marriage
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Marriages</div>
              <div class="text-h5 font-weight-bold">{{ totalMarriages }}</div>
            </div>
            <v-avatar size="56" color="red lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-heart-outline icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Completed</div>
              <div class="text-h5 font-weight-bold">{{ completed }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-heart-outline icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Pending Approvals</div>
              <div class="text-h5 font-weight-bold">{{ pendingApprovals }}</div>
            </div>
            <v-avatar size="56" color="orange lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-heart-outline icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search records..."
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
          <v-col cols="12" md="2" class="d-flex align-center">
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
          <v-col cols="12" md="4" class="d-flex align-center gap-2">
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
            <v-tooltip text="Export Excel" location="top">
              <template v-slot:activator="{ props }">
                <v-btn 
                  icon="mdi-download"
                  variant="outlined"
                  v-bind="props"
                  :loading="loading"
                  :disabled="loading"
                  @click="handleExportExcel"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <!-- Bulk Actions Row -->
        <v-row v-if="selectedMarriages.length > 0" class="mt-2">
          <v-col cols="12">
            <v-alert
              type="info"
              variant="tonal"
              class="mb-0"
              density="compact"
            >
              <div class="d-flex align-center justify-space-between">
                <div class="text-body-2">
                  <strong>{{ selectedMarriages.length }}</strong> marriage{{ selectedMarriages.length > 1 ? 's' : '' }} selected
                </div>
                <div class="d-flex gap-2">
                  <v-btn
                    color="error"
                    variant="flat"
                    size="small"
                    :disabled="loading"
                    @click="bulkDeleteMarriages"
                  >
                    <v-icon left>mdi-delete</v-icon>
                    Delete Selected
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    size="small"
                    @click="clearSelection"
                  >
                    <v-icon left>mdi-close</v-icon>
                    Clear Selection
                  </v-btn>
                </div>
              </div>
            </v-alert>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="d-flex align-center">
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} marriages</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table Section -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading marriages..." class="position-relative">
      <v-card-title class="pb-2">
        <div>
          <h2 class="text-h6 font-weight-bold">Marriage Records</h2>
          <p class="text-body-2 grey--text mt-1 mb-0">View and manage all registered marriage records.</p>
        </div>
      </v-card-title>
      <v-table>
        <thead>
           <tr>
             <th class="text-left font-weight-bold" style="width: 50px;">
               <v-checkbox
                 :model-value="isAllSelected"
                 :indeterminate="isIndeterminate"
                 @update:model-value="toggleSelectAll"
                 density="compact"
                 hide-details
               ></v-checkbox>
             </th>
             <!-- <th class="text-left font-weight-bold">Marriage ID</th> -->
             <th class="text-left font-weight-bold">Groom</th>
            <th class="text-left font-weight-bold">Bride</th>
            <th class="text-left font-weight-bold">Guardians</th>
            <th class="text-left font-weight-bold">Pastor ID</th>
            <th class="text-left font-weight-bold">Location</th>
            <th class="text-left font-weight-bold">Marriage Date</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && sortedMarriages.length === 0">
            <td colspan="10" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="marriage in sortedMarriages" :key="marriage.marriage_id">
            <td>
              <v-checkbox
                :model-value="isMarriageSelected(marriage)"
                @update:model-value="toggleMarriageSelection(marriage)"
                density="compact"
                hide-details
              ></v-checkbox>
            </td>
            <!-- <td>{{ marriage.marriage_id }}</td> -->
            <td>{{ getGroomDisplayName(marriage) }}</td>
            <td>{{ getBrideDisplayName(marriage) }}</td>
            <td>{{ formatGuardians(marriage.guardians) }}</td>
            <td>{{ marriage.pastor_id }}</td>
            <td>{{ marriage.location }}</td>
            <td>{{ marriage.marriage_date ? formatDateTime(marriage.marriage_date) : 'Not scheduled' }}</td>
            <td>
              <v-chip :color="getStatusColor(marriage.status)" size="small">
                {{ formatStatus(marriage.status) }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(marriage.date_created) }}</td>
            <td>
              <v-tooltip text="Edit Marriage Record" location="top">
                <template v-slot:activator="{ props }">
              <v-btn 
                icon="mdi-pencil" 
                variant="text" 
                size="small" 
                class="mr-2"
                :disabled="loading"
                    v-bind="props"
                @click="editMarriage(marriage)"
              ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Marriage Record" location="top">
                <template v-slot:activator="{ props }">
              <v-btn 
                icon="mdi-delete" 
                variant="text" 
                size="small" 
                color="error"
                :disabled="loading"
                    v-bind="props"
                @click="deleteMarriage(marriage.marriage_id)"
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
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} marriages
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
    <MarriageServiceDialog
      v-model="marriageServiceDialog"
      :marriage-service-data="marriageServiceData"
      @update:model-value="marriageServiceDialog = $event"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMarriageServiceStore } from '@/stores/ServicesRecords/marriageServiceStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import MarriageServiceDialog from '@/components/Dialogs/MarriageServiceDialog.vue'

const marriageServiceStore = useMarriageServiceStore()

// Selection state
const selectedMarriages = ref([])

// Computed properties from store
const marriages = computed(() => marriageServiceStore.marriages)

// Sort marriages with Pending status first, followed by other statuses in specified order
const sortedMarriages = computed(() => {
  const statusOrder = {
    'pending': 1,
    'ongoing': 2,
    'completed': 3
  }
  
  return [...marriages.value].sort((a, b) => {
    const aOrder = statusOrder[a.status] || 999
    const bOrder = statusOrder[b.status] || 999
    
    // First sort by status order
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }
    
    // If same status, sort by date created (newest first)
    const aDate = new Date(a.date_created || 0)
    const bDate = new Date(b.date_created || 0)
    return bDate - aDate
  })
})

const loading = computed(() => marriageServiceStore.loading)
const currentPage = computed({
  get: () => marriageServiceStore.currentPage,
  set: (value) => marriageServiceStore.setCurrentPage(value)
})
const totalPages = computed(() => marriageServiceStore.totalPages)
const totalCount = computed(() => marriageServiceStore.totalCount)
const totalMarriages = computed(() => marriageServiceStore.totalMarriages)
const completed = computed(() => marriageServiceStore.completed)
const pendingApprovals = computed(() => marriageServiceStore.pendingApprovals)
const itemsPerPage = computed({
  get: () => marriageServiceStore.itemsPerPage,
  set: (value) => marriageServiceStore.setPageSize(value)
})
const pageSizeOptions = computed(() => marriageServiceStore.pageSizeOptions)
const searchQuery = computed({
  get: () => marriageServiceStore.searchQuery,
  set: (value) => marriageServiceStore.setSearchQuery(value)
})
const filters = computed({
  get: () => marriageServiceStore.filters,
  set: (value) => marriageServiceStore.setFilters(value)
})

// Selection computed properties
const isAllSelected = computed(() => {
  return sortedMarriages.value.length > 0 && selectedMarriages.value.length === sortedMarriages.value.length
})

const isIndeterminate = computed(() => {
  return selectedMarriages.value.length > 0 && selectedMarriages.value.length < sortedMarriages.value.length
})

// Sort options
const sortByOptions = [
  'Status (Pending First)',
  'Marriage Date (Newest)',
  'Marriage Date (Oldest)',
  'Marriage ID (A-Z)',
  'Marriage ID (Z-A)',
  'Groom Member ID (A-Z)',
  'Bride Member ID (A-Z)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Status (A-Z)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const statusOptions = ['All Statuses', 'Pending', 'Ongoing', 'Completed']

// Dialog state
const marriageServiceDialog = ref(false)
const marriageServiceData = ref(null)

// Handlers
const handleMarriageServiceDialog = () => {
  marriageServiceData.value = null
  marriageServiceDialog.value = true
}

const editMarriage = (marriage) => {
  marriageServiceData.value = {
    marriage_id: marriage.marriage_id,
    groom_member_id: marriage.groom_member_id,
    groom_name: marriage.groom_name,
    bride_member_id: marriage.bride_member_id,
    bride_name: marriage.bride_name,
    guardians: Array.isArray(marriage.guardians) ? marriage.guardians : [],
    pastor_id: marriage.pastor_id,
    location: marriage.location,
    marriage_date: marriage.marriage_date,
    status: marriage.status
  }
  marriageServiceDialog.value = true
}

const deleteMarriage = async (id) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this marriage record?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await marriageServiceStore.deleteMarriage(id)
    if (result.success) {
      ElMessage.success('Marriage record deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete marriage record')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting marriage:', error)
      ElMessage.error('Failed to delete marriage record')
    }
  }
}

// Selection methods
const isMarriageSelected = (marriage) => {
  return selectedMarriages.value.some(selected => selected.marriage_id === marriage.marriage_id)
}

const toggleMarriageSelection = (marriage) => {
  const index = selectedMarriages.value.findIndex(selected => selected.marriage_id === marriage.marriage_id)
  if (index > -1) {
    selectedMarriages.value.splice(index, 1)
  } else {
    selectedMarriages.value.push(marriage)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedMarriages.value = []
  } else {
    selectedMarriages.value = [...sortedMarriages.value]
  }
}

const clearSelection = () => {
  selectedMarriages.value = []
}

const bulkDeleteMarriages = async () => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete ${selectedMarriages.value.length} selected marriage record${selectedMarriages.value.length > 1 ? 's' : ''}?`,
      'Confirm Bulk Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const deletePromises = selectedMarriages.value.map(marriage =>
      marriageServiceStore.deleteMarriage(marriage.marriage_id)
    )

    const results = await Promise.allSettled(deletePromises)
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length
    const failed = results.length - successful

    if (successful > 0) {
      ElMessage.success(`Successfully deleted ${successful} marriage record${successful > 1 ? 's' : ''}`)
    }

    if (failed > 0) {
      ElMessage.warning(`Failed to delete ${failed} marriage record${failed > 1 ? 's' : ''}`)
    }

    clearSelection()
    await marriageServiceStore.fetchMarriages()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error bulk deleting marriages:', error)
      ElMessage.error('Failed to delete selected marriage records')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (marriageServiceData.value && marriageServiceData.value.marriage_id) {
      // Update
      result = await marriageServiceStore.updateMarriage(marriageServiceData.value.marriage_id, data)
    } else {
      // Create
      result = await marriageServiceStore.createMarriage(data)
    }

    if (result.success) {
      ElMessage.success(marriageServiceData.value ? 'Marriage record updated successfully' : 'Marriage record created successfully')
      marriageServiceDialog.value = false
      marriageServiceData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save marriage record')
    }
  } catch (error) {
    console.error('Error submitting marriage:', error)
    ElMessage.error('Failed to save marriage record')
  }
}

const handleSearchChange = (value) => {
  marriageServiceStore.setSearchQuery(value)
}

const handleFilterChange = () => {
  marriageServiceStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  marriageServiceStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  marriageServiceStore.setPageSize(pageSize)
}

const handleExportExcel = async () => {
  try {
    const result = await marriageServiceStore.exportMarriagesToExcel()
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
  if (sortedMarriages.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, sortedMarriages.value.length)
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

const formatGuardians = (guardians) => {
  if (!guardians) return 'N/A'
  if (Array.isArray(guardians)) {
    return guardians.map(g => {
      const parts = []
      if (g.firstname) parts.push(g.firstname)
      if (g.middle_name) parts.push(g.middle_name)
      if (g.lastname) parts.push(g.lastname)
      return parts.join(' ')
    }).join(', ') || 'N/A'
  }
  return 'N/A'
}

const getGroomDisplayName = (marriage) => {
  // Priority: groom_fullname > groom_name > groom_member_id
  if (marriage.groom_fullname) return marriage.groom_fullname
  if (marriage.groom_name) return marriage.groom_name
  if (marriage.groom_member_id) return marriage.groom_member_id
  return 'N/A'
}

const getBrideDisplayName = (marriage) => {
  // Priority: bride_fullname > bride_name > bride_member_id
  if (marriage.bride_fullname) return marriage.bride_fullname
  if (marriage.bride_name) return marriage.bride_name
  if (marriage.bride_member_id) return marriage.bride_member_id
  return 'N/A'
}

const formatStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'ongoing': 'Ongoing',
    'completed': 'Completed'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colors = {
    'completed': 'success',
    'pending': 'warning',
    'ongoing': 'info'
  }
  return colors[status] || 'default'
}

const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Groom', 'Bride', 'Guardians', 'Pastor ID', 'Location', 'Marriage Date', 'Status', 'Date Created']
  
  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.middle_name || ''} ${userInfo.member.lastname || ''}`.trim()
    : userInfo?.account?.email || 'Admin'
  
  let tableRows = ''
  sortedMarriages.value.forEach((marriage) => {
    tableRows += `
      <tr>
        <td>${getGroomDisplayName(marriage)}</td>
        <td>${getBrideDisplayName(marriage)}</td>
        <td>${formatGuardians(marriage.guardians)}</td>
        <td>${marriage.pastor_id || 'N/A'}</td>
        <td>${marriage.location || 'N/A'}</td>
        <td>${marriage.marriage_date ? formatDateTime(marriage.marriage_date) : 'Not scheduled'}</td>
        <td>${formatStatus(marriage.status)}</td>
        <td>${formatDateTime(marriage.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Marriage Records - Print</title>
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
            <h1>Marriage Records</h1>
            <div class="subtitle">Marriage Report</div>
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
          <div>Total Records: ${sortedMarriages.value.length}</div>
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

// Watchers to clear selections when data changes
watch(() => marriages.value, () => {
  clearSelection()
}, { deep: true })

watch(() => filters.value, () => {
  clearSelection()
}, { deep: true })

watch(() => currentPage.value, () => {
  clearSelection()
})

// Initialize on mount
onMounted(async () => {
  await marriageServiceStore.fetchMarriages()
})
</script>

<style scoped>
.marriage-record {
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
</style>
