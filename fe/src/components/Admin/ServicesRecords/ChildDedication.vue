<template>
  <div class="child-dedication">
    <CertificateDialog
      v-model="certificateDialog"
      :certificate-type="certificateType"
      :certificate-data="certificateData"
    />
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Child Dedication Records</h1>
      <v-btn 
        color="success" 
        prepend-icon="mdi-file-document" 
        size="small" 
        :disabled="loading"
        :loading="loading"
        @click="handleDedicationDialog"
      >
        New Child Dedication
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Dedications</div>
              <div class="text-h5 font-weight-bold">{{ totalDedications }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-water icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Dedicated</div>
              <div class="text-h5 font-weight-bold">{{ dedicated }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-water icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">New</div>
              <div class="text-h5 font-weight-bold">{{ newDedications }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-file-document icon-custom" aria-hidden="true"></span>
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
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} dedications</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading child dedications..." class="position-relative">
      <v-table>
        <thead>
          <tr>
            <!-- <th class="text-left font-weight-bold">Child ID</th> -->
            <th class="text-left font-weight-bold">Child Name</th>
            <th class="text-left font-weight-bold">Requester</th>
            <th class="text-left font-weight-bold">Preferred Date & Time</th>
            <th class="text-left font-weight-bold">Pastor</th>
            <th class="text-left font-weight-bold">Location</th>
            <th class="text-left font-weight-bold">Father</th>
            <th class="text-left font-weight-bold">Mother</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && sortedDedications.length === 0">
            <td colspan="10" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="dedication in sortedDedications" :key="dedication.child_id">
            <!-- <td>{{ dedication.child_id }}</td> -->
            <td>{{ dedication.child_fullname || `${dedication.child_firstname || ''} ${dedication.child_lastname || ''}`.trim() }}</td>
            <td>{{ dedication.requester_fullname || dedication.requested_by }}</td>
            <td>{{ formatDateTimeWithTime(dedication.preferred_dedication_date, dedication.preferred_dedication_time) }}</td>
            <td>{{ dedication.pastor || 'N/A' }}</td>
            <td>{{ dedication.location || 'N/A' }}</td>
            <td>{{ getFatherDisplayName(dedication) }}</td>
            <td>{{ getMotherDisplayName(dedication) }}</td>
            <td>
              <v-chip :color="getStatusColor(dedication.status)" size="small">
                {{ formatStatus(dedication.status) }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(dedication.date_created) }}</td>
            <td>
              <v-tooltip v-if="dedication.status === 'completed'" text="Print Certificate" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-certificate" 
                    variant="text" 
                    size="small" 
                    color="success"
                    class="mr-2"
                    v-bind="props"
                    @click="printCertificate(dedication)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Edit Child Dedication" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="editDedication(dedication)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Child Dedication" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error"
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteDedication(dedication.child_id)"
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
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} dedications
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
    <ChildDedicationDialog
      v-model="childDedicationDialog"
      :dedication-data="dedicationData"
      @update:model-value="childDedicationDialog = $event"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useChildDedicationStore } from '@/stores/ServicesRecords/childDedicationStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChildDedicationDialog from '@/components/Dialogs/ChildDedicationDialog.vue'
import CertificateDialog from '@/components/Dialogs/CertificateDialog.vue'

const childDedicationStore = useChildDedicationStore()

// Computed properties from store
const dedications = computed(() => childDedicationStore.dedications)

// Sort dedications with Pending status first, followed by other statuses in specified order
const sortedDedications = computed(() => {
  const statusOrder = {
    'pending': 1,
    'approved': 2,
    'disapproved': 3,
    'completed': 4,
    'cancelled': 5
  }
  
  return [...dedications.value].sort((a, b) => {
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

const loading = computed(() => childDedicationStore.loading)
const currentPage = computed({
  get: () => childDedicationStore.currentPage,
  set: (value) => childDedicationStore.setCurrentPage(value)
})
const totalPages = computed(() => childDedicationStore.totalPages)
const totalCount = computed(() => childDedicationStore.totalCount)
const totalDedications = computed(() => childDedicationStore.totalDedications)
const dedicated = computed(() => childDedicationStore.dedicated)
const newDedications = computed(() => childDedicationStore.newDedications)
const itemsPerPage = computed({
  get: () => childDedicationStore.itemsPerPage,
  set: (value) => childDedicationStore.setPageSize(value)
})
const pageSizeOptions = computed(() => childDedicationStore.pageSizeOptions)
const searchQuery = computed({
  get: () => childDedicationStore.searchQuery,
  set: (value) => childDedicationStore.setSearchQuery(value)
})
const filters = computed({
  get: () => childDedicationStore.filters,
  set: (value) => childDedicationStore.setFilters(value)
})

const sortByOptions = [
  'Status (Pending First)',
  'Dedication Date (Newest)',
  'Dedication Date (Oldest)',
  'Child ID (A-Z)',
  'Child ID (Z-A)',
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
const childDedicationDialog = ref(false)
const dedicationData = ref(null)
const certificateDialog = ref(false)
const certificateType = ref('')
const certificateData = ref(null)

// Handlers
const handleDedicationDialog = () => {
  dedicationData.value = null
  childDedicationDialog.value = true
}

const editDedication = (dedication) => {
  dedicationData.value = {
    child_id: dedication.child_id,
    requested_by: dedication.requested_by,
    requester_relationship: dedication.requester_relationship,
    child_firstname: dedication.child_firstname,
    child_lastname: dedication.child_lastname,
    child_middle_name: dedication.child_middle_name,
    date_of_birth: dedication.date_of_birth,
    place_of_birth: dedication.place_of_birth,
    gender: dedication.gender,
    preferred_dedication_date: dedication.preferred_dedication_date,
    preferred_dedication_time: dedication.preferred_dedication_time,
    contact_phone_number: dedication.contact_phone_number,
    contact_email: dedication.contact_email,
    contact_address: dedication.contact_address,
    father_firstname: dedication.father_firstname,
    father_lastname: dedication.father_lastname,
    father_middle_name: dedication.father_middle_name,
    father_phone_number: dedication.father_phone_number,
    father_email: dedication.father_email,
    father_address: dedication.father_address,
    mother_firstname: dedication.mother_firstname,
    mother_lastname: dedication.mother_lastname,
    mother_middle_name: dedication.mother_middle_name,
    mother_phone_number: dedication.mother_phone_number,
    mother_email: dedication.mother_email,
    mother_address: dedication.mother_address,
    pastor: dedication.pastor,
    location: dedication.location,
    status: dedication.status
  }
  childDedicationDialog.value = true
}

const deleteDedication = async (id) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this child dedication?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await childDedicationStore.deleteDedication(id)
    if (result.success) {
      ElMessage.success('Child dedication deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete child dedication')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting child dedication:', error)
      ElMessage.error('Failed to delete child dedication')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (dedicationData.value && dedicationData.value.child_id) {
      // Update
      result = await childDedicationStore.updateDedication(dedicationData.value.child_id, data)
    } else {
      // Create
      result = await childDedicationStore.createDedication(data)
    }

    if (result.success) {
      ElMessage.success(dedicationData.value ? 'Child dedication updated successfully' : 'Child dedication created successfully')
      childDedicationDialog.value = false
      dedicationData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save child dedication')
    }
  } catch (error) {
    console.error('Error submitting child dedication:', error)
    ElMessage.error('Failed to save child dedication')
  }
}

const handleSearchChange = (value) => {
  childDedicationStore.setSearchQuery(value)
}

const handleFilterChange = () => {
  childDedicationStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  childDedicationStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  childDedicationStore.setPageSize(pageSize)
}

const handleExportExcel = async () => {
  try {
    const result = await childDedicationStore.exportDedicationsToExcel()
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
  if (sortedDedications.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, sortedDedications.value.length)
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

const formatDateTimeWithTime = (dateString, timeString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const formattedDate = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  
  if (timeString) {
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    const formattedTime = `${displayHour}:${minutes} ${ampm}`
    return `${formattedDate} • ${formattedTime}`
  }
  
  return formattedDate
}

const getFatherDisplayName = (dedication) => {
  if (dedication?.father_fullname && dedication.father_fullname.trim()) {
    return dedication.father_fullname.trim()
  }
  if (dedication?.father_firstname && dedication?.father_lastname) {
    const middleName = dedication.father_middle_name ? ` ${dedication.father_middle_name} ` : ' '
    const fullName = `${dedication.father_firstname}${middleName}${dedication.father_lastname}`.trim()
    if (fullName) return fullName
  }
  // Fallback: if requester is male, show requester name
  if (dedication?.requester_gender === 'M' && dedication?.requester_fullname) {
    return dedication.requester_fullname
  }
  return 'N/A'
}

const getMotherDisplayName = (dedication) => {
  if (dedication?.mother_fullname && dedication.mother_fullname.trim()) {
    return dedication.mother_fullname.trim()
  }
  if (dedication?.mother_firstname && dedication?.mother_lastname) {
    const middleName = dedication.mother_middle_name ? ` ${dedication.mother_middle_name} ` : ' '
    const fullName = `${dedication.mother_firstname}${middleName}${dedication.mother_lastname}`.trim()
    if (fullName) return fullName
  }
  // Fallback: if requester is female, show requester name
  if (dedication?.requester_gender === 'F' && dedication?.requester_fullname) {
    return dedication.requester_fullname
  }
  return 'N/A'
}

const formatGuardians = (guardians) => {
  // Deprecated: kept for backward compatibility, but should use getFatherDisplayName/getMotherDisplayName
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
  const tableHeaders = ['Child Name', 'Requester', 'Preferred Date & Time', 'Pastor', 'Location', 'Father', 'Mother', 'Status', 'Date Created']

  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.middle_name || ''} ${userInfo.member.lastname || ''}`.trim()
    : userInfo?.account?.email || 'Admin'

  let tableRows = ''
  sortedDedications.value.forEach((dedication) => {
    const childName = dedication.child_fullname || `${dedication.child_firstname || ''} ${dedication.child_lastname || ''}`.trim() || 'N/A'
    const requesterName = dedication.requester_fullname || dedication.requested_by || 'N/A'
    const pastorName = dedication.pastor || 'N/A'
    const locationName = dedication.location || 'N/A'
    tableRows += `
      <tr>
        <td>${childName}</td>
        <td>${requesterName}</td>
        <td>${formatDateTimeWithTime(dedication.preferred_dedication_date, dedication.preferred_dedication_time)}</td>
        <td>${pastorName}</td>
        <td>${locationName}</td>
        <td>${getFatherDisplayName(dedication)}</td>
        <td>${getMotherDisplayName(dedication)}</td>
        <td>${formatStatus(dedication.status)}</td>
        <td>${formatDateTime(dedication.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Child Dedication Records - Print</title>
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
            <h1>Child Dedication Records</h1>
            <div class="subtitle">Child Dedication Report</div>
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
          <div>Total Records: ${sortedDedications.value.length}</div>
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

const printCertificate = (dedication) => {
  certificateType.value = 'child_dedication'
  certificateData.value = {
    service: {
      ...dedication
    }
  }
  certificateDialog.value = true
}

// Initialize on mount
onMounted(async () => {
  await childDedicationStore.fetchDedications()
})
</script>

<style scoped>
.child-dedication {
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
