<template>
  <div class="approvals">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Approvals</h1>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Approvals</div>
              <div class="text-h5 font-weight-bold">{{ totalApprovals }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color:white !important;" class="mdi mdi-check-circle icon-custom icon-blue" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Pending</div>
              <div class="text-h5 font-weight-bold">{{ pendingApprovals }}</div>
            </div>
            <v-avatar size="56" color="orange lighten-5" class="d-flex align-center justify-center">
              <span style="color:white !important;" class="mdi mdi-clock-outline icon-custom icon-orange" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Approved</div>
              <div class="text-h5 font-weight-bold">{{ approvedApprovals }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <span style="color:white !important;" class="mdi mdi-check-circle-outline icon-custom icon-green" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Rejected</div>
              <div class="text-h5 font-weight-bold">{{ rejectedApprovals }}</div>
            </div>
            <v-avatar size="56" color="red lighten-5" class="d-flex align-center justify-center">
              <span style="color:white !important;" class="mdi mdi-close-circle-outline icon-custom icon-red" aria-hidden="true"></span>
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
              placeholder="Search approvals..."
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleSearchChange"
            ></v-text-field>
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
              v-model="filters.type"
              :items="typeOptions"
              label="Type"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleFilterChange"
            ></v-select>
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
          <v-col cols="12" md="3" class="d-flex align-center gap-2">
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
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Approval List -->
    <div class="mb-4">
      <h2 class="text-h6 font-weight-bold">Approval List</h2>
    </div>

    <!-- Table -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading approvals..." class="position-relative">
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Type</th>
            <th class="text-left font-weight-bold">Email</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Request ID</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && sortedApprovals.length === 0">
            <td colspan="6" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="approval in sortedApprovals" :key="approval.approval_id">
            <td>
              <v-chip
                color="info"
                size="small"
                variant="flat"
              >
                {{ approval.type || 'event' }}
              </v-chip>
            </td>
            <td>{{ approval.email }}</td>
            <td>
              <v-chip 
                :color="getStatusColor(approval.status)" 
                size="small"
                variant="flat"
              >
                {{ approval.status || 'pending' }}
              </v-chip>
            </td>
            <td>{{ approval.request_id }}</td>
            <td>{{ formatDateTime(approval.date_created) }}</td>
            <td>
              <v-tooltip v-if="approval.status === 'pending'" text="Approve Request" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-check" 
                    variant="text" 
                    size="small" 
                    color="success"
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="approveRequest(approval)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip v-if="approval.status === 'pending'" text="Reject Request" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-close" 
                    variant="text" 
                    size="small" 
                    color="error"
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="rejectRequest(approval)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Approval" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error"
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteApproval(approval.approval_id)"
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
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} approvals
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useApprovalsStore } from '@/stores/ChurchRecords/approvalsStore'
import { ElMessage, ElMessageBox } from 'element-plus'

const approvalsStore = useApprovalsStore()

// Computed properties from store
const approvals = computed(() => approvalsStore.approvals)

// Sort approvals with Pending status first, followed by other statuses in specified order
const sortedApprovals = computed(() => {
  const statusOrder = {
    'pending': 1,
    'approved': 2,
    'rejected': 3
  }
  
  return [...approvals.value].sort((a, b) => {
    const aOrder = statusOrder[a.status?.toLowerCase()] || 999
    const bOrder = statusOrder[b.status?.toLowerCase()] || 999
    
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

const loading = computed(() => approvalsStore.loading)
const totalApprovals = computed(() => approvalsStore.totalApprovals)
const pendingApprovals = computed(() => approvalsStore.pendingApprovals)
const approvedApprovals = computed(() => approvalsStore.approvedApprovals)
const rejectedApprovals = computed(() => approvalsStore.rejectedApprovals)
const currentPage = computed({
  get: () => approvalsStore.currentPage,
  set: (value) => approvalsStore.setCurrentPage(value)
})
const totalPages = computed(() => approvalsStore.totalPages)
const totalCount = computed(() => approvalsStore.totalCount)
const itemsPerPage = computed({
  get: () => approvalsStore.itemsPerPage,
  set: (value) => approvalsStore.setPageSize(value)
})
const pageSizeOptions = computed(() => approvalsStore.pageSizeOptions)
const searchQuery = computed({
  get: () => approvalsStore.searchQuery,
  set: (value) => approvalsStore.setSearchQuery(value)
})
const filters = computed({
  get: () => approvalsStore.filters,
  set: (value) => approvalsStore.setFilters(value)
})

// Options for dropdowns
const statusOptions = ['All Statuses', 'Pending', 'Approved', 'Rejected']
const typeOptions = ['All Types', 'event', 'ministry', 'baptism', 'marriage', 'burial', 'child-dedication']
const sortByOptions = [
  'Status (Pending First)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Status (A-Z)',
  'Type (A-Z)',
  'Email (A-Z)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Handlers
const handleSearchChange = (value) => {
  ElMessage.info('Searching approvals...')
  approvalsStore.setSearchQuery(value)
}

const handleFilterChange = () => {
  const statusText = filters.value.status || 'All Statuses'
  const typeText = filters.value.type || 'All Types'
  ElMessage.info(`Filtering by: ${statusText}, ${typeText}`)
  approvalsStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  approvalsStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  ElMessage.info(`Showing ${pageSize} items per page`)
  approvalsStore.setPageSize(pageSize)
}

const handleExportExcel = async () => {
  try {
    const result = await approvalsStore.exportApprovalsToExcel()
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

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'default'
  }
}

const approveRequest = async (approval) => {
  try {
    let scheduleDate = null;
    let scheduleTime = null;
    
    // For child dedications, ask admin to select approval date/time
    if (approval.type === 'child_dedication') {
      const scheduleInput = await ElMessageBox.prompt(
        `Enter the approved dedication date and time for this child dedication request (Format: YYYY-MM-DD HH:MM)`,
        'Schedule Approval',
        {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          inputPattern: /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/,
          inputErrorMessage: 'Please use format: YYYY-MM-DD HH:MM',
          inputValue: ''
        }
      );
      
      // Parse the input into date and time
      const [date, time] = scheduleInput.split(' ');
      scheduleDate = date;
      scheduleTime = time + ':00'; // Add seconds
    } else {
      // For non-child-dedications, just ask for confirmation
      await ElMessageBox.confirm(
        `Are you sure you want to approve this ${approval.type} request?`,
        'Confirm Approval',
        {
          confirmButtonText: 'Approve',
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
      );
    }

    const result = await approvalsStore.updateApprovalStatus(
      approval.approval_id, 
      'approved',
      scheduleDate,
      scheduleTime
    );
    
    if (result.success) {
      ElMessage.success('Approval request approved successfully');
      // Refresh the approvals list
      await approvalsStore.fetchApprovals();
    } else {
      ElMessage.error(result.error || 'Failed to approve request');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error approving request:', error);
      ElMessage.error('Failed to approve request');
    }
  }
}

const rejectRequest = async (approval) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to reject this ${approval.type} request?`,
      'Confirm Rejection',
      {
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await approvalsStore.updateApprovalStatus(approval.approval_id, 'rejected')
    if (result.success) {
      ElMessage.success('Approval request rejected successfully')
    } else {
      ElMessage.error(result.error || 'Failed to reject request')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error rejecting request:', error)
      ElMessage.error('Failed to reject request')
    }
  }
}

const deleteApproval = async (id) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this approval?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await approvalsStore.deleteApproval(id)
    if (result.success) {
      ElMessage.success('Approval deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete approval')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting approval:', error)
      ElMessage.error('Failed to delete approval')
    }
  }
}

const getStartIndex = () => {
  if (sortedApprovals.value.length === 0) return 0
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
  const tableHeaders = ['Type', 'Email', 'Status', 'Request ID', 'Date Created']
  
  let tableRows = ''
  sortedApprovals.value.forEach((approval) => {
    tableRows += `
      <tr>
        <td>${approval.type || 'event'}</td>
        <td>${approval.email || 'N/A'}</td>
        <td>${approval.status || 'pending'}</td>
        <td>${approval.request_id || 'N/A'}</td>
        <td>${formatDateTime(approval.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Approvals - Print</title>
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
            <h1>Approvals</h1>
            <div class="subtitle">Approvals Report</div>
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
          <div>Total Records: ${sortedApprovals.value.length}</div>
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
  await approvalsStore.fetchApprovals()
})
</script>

<style scoped>
.approvals {
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

.icon-orange {
  color: rgb(255, 152, 0) !important;
}

.icon-green {
  color: rgb(76, 175, 80) !important;
}

.icon-red {
  color: rgb(244, 67, 54) !important;
}
</style>

