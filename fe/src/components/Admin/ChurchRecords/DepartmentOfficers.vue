<template>
  <div class="department-officers">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Department Officers</h1>
      <v-btn 
        color="success" 
        prepend-icon="mdi-account-plus" 
        size="small" 
        :disabled="loading"
        :loading="loading"
        @click="openDepartmentOfficersDialog"
      >
        Add New Officer
      </v-btn>
    </div>

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search by member ID or name..."
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.sortBy"
              :items="sortByOptions"
              label="Sort By"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center gap-2">
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
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" class="position-relative">
      <!-- Loading Overlay -->
      <v-overlay :model-value="loading" class="align-center justify-center" contained>
        <div class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
          ></v-progress-circular>
          <div class="mt-4 text-body-1">Loading department officers...</div>
        </div>
      </v-overlay>

      <v-table>
        <thead>
          <tr>
            <!-- <th class="text-left font-weight-bold">Officer ID</th> -->
            <th class="text-left font-weight-bold">Member ID</th>
            <th class="text-left font-weight-bold">Full Name</th>
            <th class="text-left font-weight-bold">Joined Date</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && officers.length === 0">
            <td colspan="6" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-if="loading">
            <td colspan="6" class="text-center py-12">
              <v-progress-circular
                indeterminate
                color="primary"
                size="48"
              ></v-progress-circular>
            </td>
          </tr>
          <tr v-for="officer in officers" :key="officer.officer_id" v-show="!loading">
            <!-- <td>{{ officer.officer_id }}</td> -->
            <td>{{ officer.member_id }}</td>
            <td>{{ officer.fullname || 'N/A' }}</td>
            <td>{{ officer.joined_date }}</td>
            <td>{{ officer.date_created }}</td>
            <td>
              <v-tooltip text="Edit Officer" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2" 
                    :disabled="loading"
                    v-bind="props"
                    @click="editOfficer(officer)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Officer" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error" 
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteOfficer(officer)"
                  ></v-btn>
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Pagination -->
      <div class="d-flex justify-space-between align-center pa-4">
        <div class="d-flex align-center">
          <span class="text-body-2 mr-2">Items per page:</span>
          <v-select
            v-model="itemsPerPage"
            :items="pageSizeOptions"
            density="compact"
            variant="outlined"
            hide-details
            :disabled="loading"
            style="width: 80px;"
            @update:model-value="handlePageSizeChange"
          ></v-select>
          <span class="ml-4 text-body-2">
            Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }}
          </span>
        </div>
        <div class="d-flex align-center">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            :disabled="loading"
            density="compact"
          ></v-pagination>
        </div>
      </div>
    </v-card>
    <DepartmentOfficersDialog 
      v-model="departmentOfficersDialog" 
      :officerData="departmentOfficersData" 
      :memberOptions="memberOptions"
      @update:model-value="departmentOfficersDialog = $event" 
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DepartmentOfficersDialog from '../../Dialogs/DepartmentOfficersDialog.vue'
import { useDepartmentOfficersStore } from '@/stores/ChurchRecords/departmentOfficersStore'

const departmentOfficersStore = useDepartmentOfficersStore()

const departmentOfficersDialog = ref(false)
const departmentOfficersData = ref(null)

// Computed properties from store
const officers = computed(() => departmentOfficersStore.paginatedOfficers)
const loading = computed(() => departmentOfficersStore.loading)
const searchQuery = computed({
  get: () => departmentOfficersStore.searchQuery,
  set: (value) => departmentOfficersStore.setSearchQuery(value)
})
const filters = computed(() => departmentOfficersStore.filters)
const currentPage = computed({
  get: () => departmentOfficersStore.currentPage,
  set: (value) => departmentOfficersStore.setCurrentPage(value)
})
const totalPages = computed(() => departmentOfficersStore.totalPages)
const totalCount = computed(() => departmentOfficersStore.totalCount)
const itemsPerPage = computed({
  get: () => departmentOfficersStore.itemsPerPage,
  set: (value) => departmentOfficersStore.setPageSize(value)
})
const pageSizeOptions = computed(() => departmentOfficersStore.pageSizeOptions)
const memberOptions = computed(() => departmentOfficersStore.memberOptions)

const sortByOptions = [
  'Member ID (A-Z)',
  'Member ID (Z-A)',
  'Joined Date (Newest)',
  'Joined Date (Oldest)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Watch for filter changes
watch(() => filters.value.sortBy, (newSortBy) => {
  departmentOfficersStore.setFilters({ sortBy: newSortBy })
})

const openDepartmentOfficersDialog = () => {
  departmentOfficersData.value = null
  departmentOfficersDialog.value = true
}

const editOfficer = (officer) => {
  departmentOfficersData.value = officer
  departmentOfficersDialog.value = true
}

const deleteOfficer = async (officer) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete this department officer?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await departmentOfficersStore.deleteOfficer(officer.officer_id)
    if (result.success) {
      ElMessage.success('Department officer deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete department officer')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting department officer:', error)
      ElMessage.error('Failed to delete department officer')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (departmentOfficersData.value) {
      // Update existing officer
      const officerId = departmentOfficersData.value.officer_id
      result = await departmentOfficersStore.updateOfficer(officerId, data)
    } else {
      // Create new officer
      result = await departmentOfficersStore.createOfficer(data)
    }

    if (result.success) {
      ElMessage.success(
        departmentOfficersData.value 
          ? 'Department officer updated successfully' 
          : 'Department officer created successfully'
      )
      departmentOfficersDialog.value = false
      departmentOfficersData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save department officer')
    }
  } catch (error) {
    console.error('Error submitting department officer:', error)
    ElMessage.error('Failed to save department officer')
  }
}

const handlePageSizeChange = (pageSize) => {
  departmentOfficersStore.setPageSize(pageSize)
}

const getStartIndex = () => {
  if (officers.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, totalCount.value)
}

// Handle Excel export
const handleExportExcel = async () => {
  try {
    const result = await departmentOfficersStore.exportDepartmentOfficersToExcel()
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
  const tableHeaders = ['Member ID', 'Full Name', 'Joined Date', 'Date Created']
  
  let tableRows = ''
  officers.value.forEach((officer) => {
    tableRows += `
      <tr>
        <td>${officer.member_id || 'N/A'}</td>
        <td>${officer.fullname || 'N/A'}</td>
        <td>${officer.joined_date || 'N/A'}</td>
        <td>${officer.date_created || 'N/A'}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Department Officers - Print</title>
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
            <h1>Department Officers</h1>
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
          <div>Total Records: ${officers.value.length}</div>
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
  await departmentOfficersStore.fetchOfficers()
  await departmentOfficersStore.fetchMemberOptions()
})
</script>

<style scoped>
.department-officers {
  padding: 24px;
}
</style>

