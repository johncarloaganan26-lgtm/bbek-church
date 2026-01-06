<template>
  <div class="departments">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Departments</h1>
      <v-btn
        color="success"
        prepend-icon="mdi-plus"
        size="small"
        @click="handleDepartmentDialog()"
      >
        Create Department
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Departments</div>
              <div class="text-h5 font-weight-bold">{{ totalDepartments }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5">
              <v-icon icon="mdi-office-building" size="32" color="blue"></v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Active Departments</div>
              <div class="text-h5 font-weight-bold">{{ activeDepartments }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5">
              <v-icon icon="mdi-check-circle" size="32" color="green"></v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Inactive Departments</div>
              <div class="text-h5 font-weight-bold">{{ inactiveDepartments }}</div>
            </div>
            <v-avatar size="56" color="grey lighten-4">
              <v-icon icon="mdi-close-circle" size="32" color="grey"></v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Joined Members</div>
              <div class="text-h5 font-weight-bold">{{ totalJoinedMembers }}</div>
            </div>
            <v-avatar size="56" color="purple lighten-5">
              <v-icon icon="mdi-account-group" size="32" color="purple"></v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search departments..."
              variant="outlined"
              density="compact"
              hide-details
              :disabled="loading"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="loading"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.sortBy"
              :items="sortByOptions"
              label="Sort By"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="loading"
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

    <!-- Department List Title -->
    <div class="mb-4">
      <h2 class="text-h6 font-weight-bold">Department List</h2>
    </div>

    <!-- Table -->
    <v-card elevation="2" :loading="loading">
      <v-overlay :model-value="loading" contained class="align-center justify-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="text-body-1 mt-4">Loading departments...</p>
      </v-overlay>
      <v-table>
        <thead>
          <tr>
            <!-- <th class="text-left font-weight-bold">Department ID</th> -->
            <th class="text-left font-weight-bold">Department Name</th>
            <th class="text-left font-weight-bold">Department Lead</th>
            <th class="text-left font-weight-bold">Joined Members</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && departments.length === 0">
            <td colspan="7" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="department in departments" :key="department.department_id">
            <!-- <td>{{ department.department_id }}</td> -->
            <td>{{ department.department_name }}</td>
            <td>{{ department.member_fullname || '-' }}</td>
            <td>{{ department.joined_members_count || 0 }}</td>
            <td>
              <v-chip
                :color="department.status === 'active' ? 'success' : 'default'"
                size="small"
              >
                {{ department.status === 'active' ? 'Active' : 'Not Active' }}
              </v-chip>
            </td>
            <td>{{ department.date_created ? new Date(department.date_created).toLocaleDateString() : '-' }}</td>
            <td>
              <v-tooltip text="Edit Department" location="top">
                <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                class="mr-2"
                    v-bind="props"
                @click="handleDepartmentDialog(department)"
                :disabled="loading"
              ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Department" location="top">
                <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                    v-bind="props"
                @click="deleteDepartment(department)"
                :disabled="loading"
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
            :items="departmentsStore.pageSizeOptions"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 80px;"
            @update:model-value="handlePageSizeChange"
            :disabled="loading"
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
            density="compact"
            @update:model-value="handlePageChange"
            :disabled="loading"
          ></v-pagination>
        </div>
      </div>
    </v-card>

    <!-- Department Dialog -->
    <DepartmentDialog
      v-model="departmentDialog"
      :department-data="departmentData"
      :member-options="memberOptions"
      @update:model-value="departmentDialog = $event"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDepartmentsStore } from '@/stores/ChurchRecords/departmentsStore'
import DepartmentDialog from '@/components/Dialogs/DepartmentDialog.vue'

// Pinia Store
const departmentsStore = useDepartmentsStore()

// Options for dropdowns
const memberOptions = computed(() => departmentsStore.memberOptions)

// Component state
const departmentDialog = ref(false)
const departmentData = ref(null)

// Computed properties from store
const departments = computed(() => departmentsStore.departments)
const loading = computed(() => departmentsStore.loading)
const searchQuery = computed({
  get: () => departmentsStore.searchQuery,
  set: (value) => departmentsStore.setSearchQuery(value)
})
const filters = computed(() => departmentsStore.filters)
const currentPage = computed({
  get: () => departmentsStore.currentPage,
  set: (value) => departmentsStore.setCurrentPage(value)
})
const totalPages = computed(() => departmentsStore.totalPages)
const totalCount = computed(() => departmentsStore.totalCount)
const itemsPerPage = computed({
  get: () => departmentsStore.itemsPerPage,
  set: (value) => departmentsStore.setPageSize(value)
})

// Summary totals
const totalDepartments = computed(() => departmentsStore.totalDepartments)
const activeDepartments = computed(() => departmentsStore.activeDepartments)
const inactiveDepartments = computed(() => departmentsStore.inactiveDepartments)
const totalJoinedMembers = computed(() => departmentsStore.totalJoinedMembers)

// Filter options
const statusOptions = [
  { title: 'All Statuses', value: 'All Statuses' },
  { title: 'Active', value: 'active' },
  { title: 'Not Active', value: 'not_active' }
]
const sortByOptions = [
  'Department Name (A-Z)',
  'Department Name (Z-A)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Status (A-Z)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Watch for filter changes
watch(
  () => filters.value.status,
  (newStatus) => {
    departmentsStore.setFilters({ status: newStatus })
  }
)

watch(
  () => filters.value.sortBy,
  (newSortBy) => {
    departmentsStore.setFilters({ sortBy: newSortBy })
  }
)

// Debounce search query
let searchTimeout = null
watch(
  () => searchQuery.value,
  (newQuery) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      departmentsStore.setSearchQuery(newQuery)
    }, 500)
  }
)

// Handle dialog
const handleDepartmentDialog = (data = null) => {
  if (data) {
    departmentData.value = {
      department_id: data.department_id,
      department_name: data.department_name,
      status: data.status,
      member_id: data.member_id || null,
      joined_members: data.joined_members || null
    }
  } else {
    departmentData.value = null
  }
  departmentDialog.value = true
}

// Handle submit from dialog
const handleSubmit = async (submitData) => {
  try {
    let result
    if (departmentData.value) {
      // Update existing department
      result = await departmentsStore.updateDepartment(departmentData.value.department_id, submitData)
    } else {
      // Create new department
      result = await departmentsStore.createDepartment(submitData)
    }

    if (result.success) {
      ElMessage.success(
        departmentData.value
          ? 'Department updated successfully'
          : 'Department created successfully'
      )
      departmentDialog.value = false
      departmentData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save department')
    }
  } catch (error) {
    console.error('Error saving department:', error)
    ElMessage.error('An error occurred while saving the department')
  }
}

// Handle delete
const deleteDepartment = async (department) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${department.department_name}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await departmentsStore.deleteDepartment(department.department_id)
    if (result.success) {
      ElMessage.success('Department deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete department')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting department:', error)
      ElMessage.error('An error occurred while deleting the department')
    }
  }
}

// Handle page change
const handlePageChange = (page) => {
  departmentsStore.setCurrentPage(page)
}

// Handle page size change
const handlePageSizeChange = (pageSize) => {
  departmentsStore.setPageSize(pageSize)
}

// Get pagination display values
const getStartIndex = () => {
  return departments.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return end > totalCount.value ? totalCount.value : end
}

// Handle Excel export
const handleExportExcel = async () => {
  try {
    const result = await departmentsStore.exportDepartmentsToExcel()
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
  const tableHeaders = ['Department Name', 'Department Lead', 'Joined Members', 'Status', 'Date Created']
  
  let tableRows = ''
  departments.value.forEach((department) => {
    tableRows += `
      <tr>
        <td>${department.department_name || 'N/A'}</td>
        <td>${department.member_fullname || '-'}</td>
        <td>${department.joined_members_count || 0}</td>
        <td>${department.status === 'active' ? 'Active' : 'Not Active'}</td>
        <td>${department.date_created ? new Date(department.date_created).toLocaleDateString() : '-'}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Departments - Print</title>
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
            <h1>Departments</h1>
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
          <div>Total Records: ${departments.value.length}</div>
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

// Fetch departments and member options on mount
onMounted(() => {
  departmentsStore.fetchDepartments()
  departmentsStore.fetchMemberOptions()
})
</script>

<style scoped>
.departments {
  padding: 24px;
}
</style>
