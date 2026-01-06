<template>
  <div class="burial-service">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Burial Services</h1>
      <v-btn 
        color="success" 
        prepend-icon="mdi-plus" 
        size="small" 
        :disabled="loading"
        :loading="loading"
        @click="handleBurialServiceDialog"
      >
        New Burial Service
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Services</div>
              <div class="text-h5 font-weight-bold">{{ totalServices }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <v-icon color="blue" size="32">mdi-calendar-clock</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Scheduled Services</div>
              <div class="text-h5 font-weight-bold">{{ scheduledServices }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <v-icon color="blue" size="32">mdi-coffin</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Completed Services</div>
              <div class="text-h5 font-weight-bold">{{ completedServices }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <v-icon color="green" size="32">mdi-check-circle</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Pending Services</div>
              <div class="text-h5 font-weight-bold">{{ pendingServices }}</div>
            </div>
            <v-avatar size="56" color="orange lighten-5" class="d-flex align-center justify-center">
              <v-icon color="orange" size="32">mdi-clock-outline</v-icon>
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
              placeholder="Search services..."
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
          <v-col cols="12" md="5" class="d-flex align-center gap-2">
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
        <v-row>
          <v-col cols="12" class="d-flex align-center">
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} services</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading burial services..." class="position-relative">
      <v-table>
        <thead>
          <tr>
            <!-- <th class="text-left font-weight-bold">Burial ID</th> -->
            <th class="text-left font-weight-bold">Member</th>
            <th class="text-left font-weight-bold">Deceased Name</th>
            <th class="text-left font-weight-bold">Birthdate</th>
            <th class="text-left font-weight-bold">Date of Death</th>
            <th class="text-left font-weight-bold">Relationship</th>
            <th class="text-left font-weight-bold">Location</th>
            <th class="text-left font-weight-bold">Pastor ID</th>
            <th class="text-left font-weight-bold">Service Date</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && sortedServices.length === 0">
            <td colspan="10" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="service in sortedServices" :key="service.burial_id">
            <!-- <td>{{ service.burial_id }}</td> -->
            <td>{{ service.fullname || service.member_id }}</td>
            <td>{{ service.deceased_name }}</td>
            <td>{{ formatDate(service.deceased_birthdate) }}</td>
            <td>{{ formatDateTime(service.date_death) }}</td>
            <td>{{ service.relationship }}</td>
            <td>{{ service.location }}</td>
            <td>{{ service.pastor_name }}</td>
            <td>{{ service.service_date ? formatDateTime(service.service_date) : 'Not scheduled' }}</td>
            <td>
              <v-chip :color="getStatusColor(service.status)" size="small">
                {{ formatStatus(service.status) }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(service.date_created) }}</td>
            <td>
              <v-tooltip text="Edit Burial Service" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="editService(service)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Burial Service" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error"
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteService(service.burial_id)"
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
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} services
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
    <BurialServiceDialog
      v-model="burialServiceDialog"
      :burial-service-data="burialServiceData"
      @update:model-value="burialServiceDialog = $event"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBurialServiceStore } from '@/stores/ServicesRecords/burialServiceStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import BurialServiceDialog from '@/components/Dialogs/BurialServiceDialog.vue'

const burialServiceStore = useBurialServiceStore()

// Computed properties from store
const services = computed(() => burialServiceStore.services)

// Sort services with Pending status first, followed by other statuses in specified order
const sortedServices = computed(() => {
  const statusOrder = {
    'pending': 1,
    'approved': 2,
    'disapproved': 3,
    'completed': 4,
    'cancelled': 5
  }
  
  return [...services.value].sort((a, b) => {
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

const loading = computed(() => burialServiceStore.loading)
const currentPage = computed({
  get: () => burialServiceStore.currentPage,
  set: (value) => burialServiceStore.setCurrentPage(value)
})
const totalPages = computed(() => burialServiceStore.totalPages)
const totalCount = computed(() => burialServiceStore.totalCount)
const totalServices = computed(() => burialServiceStore.totalServices)
const scheduledServices = computed(() => burialServiceStore.scheduledServices)
const completedServices = computed(() => burialServiceStore.completedServices)
const pendingServices = computed(() => burialServiceStore.pendingServices)
const itemsPerPage = computed({
  get: () => burialServiceStore.itemsPerPage,
  set: (value) => burialServiceStore.setPageSize(value)
})
const pageSizeOptions = computed(() => burialServiceStore.pageSizeOptions)
const searchQuery = computed({
  get: () => burialServiceStore.searchQuery,
  set: (value) => burialServiceStore.setSearchQuery(value)
})
const filters = computed({
  get: () => burialServiceStore.filters,
  set: (value) => burialServiceStore.setFilters(value)
})

const sortByOptions = [
  'Status (Pending First)',
  'Service Date (Newest)',
  'Service Date (Oldest)',
  'Burial ID (A-Z)',
  'Burial ID (Z-A)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Status (A-Z)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const statusOptions = ['All Statuses', 'Pending', 'Approved', 'Disapproved', 'Completed', 'Cancelled']

// Dialog state
const burialServiceDialog = ref(false)
const burialServiceData = ref(null)

// Handlers
const handleBurialServiceDialog = () => {
  burialServiceData.value = null
  burialServiceDialog.value = true
}

const editService = (service) => {
  burialServiceData.value = {
    burial_id: service.burial_id,
    member_id: service.member_id,
    deceased_name: service.deceased_name,
    deceased_birthdate: service.deceased_birthdate,
    date_death: service.date_death,
    relationship: service.relationship,
    location: service.location,
    pastor_name: service.pastor_name,
    service_date: service.service_date,
    status: service.status
  }
  burialServiceDialog.value = true
}

const deleteService = async (id) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this burial service?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await burialServiceStore.deleteService(id)
    if (result.success) {
      ElMessage.success('Burial service deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete burial service')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting burial service:', error)
      ElMessage.error('Failed to delete burial service')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (burialServiceData.value && burialServiceData.value.burial_id) {
      // Update
      result = await burialServiceStore.updateService(burialServiceData.value.burial_id, data)
    } else {
      // Create
      result = await burialServiceStore.createService(data)
    }

    if (result.success) {
      ElMessage.success(burialServiceData.value ? 'Burial service updated successfully' : 'Burial service created successfully')
      burialServiceDialog.value = false
      burialServiceData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save burial service')
    }
  } catch (error) {
    console.error('Error submitting burial service:', error)
    ElMessage.error('Failed to save burial service')
  }
}

const handleSearchChange = (value) => {
  ElMessage.info('Searching records...')
  burialServiceStore.setSearchQuery(value)
}

const handleFilterChange = () => {
  const statusText = filters.value.status || 'All Statuses'
  ElMessage.info(`Filtering by: ${statusText}`)
  burialServiceStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  burialServiceStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  ElMessage.info(`Showing ${pageSize} items per page`)
  burialServiceStore.setPageSize(pageSize)
}

const handleExportExcel = async () => {
  try {
    const result = await burialServiceStore.exportServicesToExcel()
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
  if (sortedServices.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, sortedServices.value.length)
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

const formatStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'approved': 'Approved',
    'disapproved': 'Disapproved',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'ongoing': 'Ongoing',
    'scheduled': 'Scheduled'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colors = {
    'approved': 'info',
    'disapproved': 'error',
    'scheduled': 'info',
    'completed': 'success',
    'pending': 'warning',
    'ongoing': 'warning',
    'cancelled': 'error'
  }
  return colors[status] || 'default'
}

const handlePrint = () => {
  ElMessage.info('Preparing print preview...')
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('Could not open print preview. Check browser pop-up settings.')
    return
  }
  
  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.middle_name || ''} ${userInfo.member.lastname || ''}`.trim()
    : userInfo?.account?.email || 'Admin'
  
  ElMessage.success('Print preview opened. Please check your browser tabs.')
  const tableHeaders = ['Member', 'Deceased Name', 'Birthdate', 'Date of Death', 'Relationship', 'Location', 'Pastor ID', 'Service Date', 'Status', 'Date Created']
  
  let tableRows = ''
  sortedServices.value.forEach((service) => {
    tableRows += `
      <tr>
        <td>${service.fullname || service.member_id || 'N/A'}</td>
        <td>${service.deceased_name || 'N/A'}</td>
        <td>${formatDate(service.deceased_birthdate)}</td>
        <td>${formatDateTime(service.date_death)}</td>
        <td>${service.relationship || 'N/A'}</td>
        <td>${service.location || 'N/A'}</td>
        <td>${service.pastor_name || 'N/A'}</td>
        <td>${service.service_date ? formatDateTime(service.service_date) : 'Not scheduled'}</td>
        <td>${formatStatus(service.status)}</td>
        <td>${formatDateTime(service.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Burial Services - Print</title>
        <style>
          @media print {
            @page { margin: 1cm; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
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
          }
          .header .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
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
            background-color: #f2f2f2;
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
        <div class="header">
          <img src="/logo.png" alt="Church Logo" />
          <div>
            <h1>Burial Services</h1>
            <div class="subtitle">Biblical Bread Ministries</div>
          </div>
        </div>
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
          <div>Total Records: ${sortedServices.value.length}</div>
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
  await burialServiceStore.fetchServices()
})
</script>

<style scoped>
.burial-service {
  padding: 24px;
}
</style>
