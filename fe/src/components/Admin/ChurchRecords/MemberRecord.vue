  a<template>
  <div class="member-record">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Church Members</h1>
      <div class="d-flex gap-2">
        <v-btn color="success" prepend-icon="mdi-account-plus" size="small" @click="openMemberDialog">
          Add New Member
        </v-btn>
      </div>
    </div>

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search members..."
              variant="outlined"
              density="compact"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="memberStore.filters.ageRange"
              :items="ageRangeOptions"
              label="Age Range"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleFilterChange('ageRange', $event)"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="memberStore.filters.gender"
              :items="genderOptions"
              label="Gender"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleFilterChange('gender', $event)"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="memberStore.filters.joinMonth"
              :items="joinMonthOptions"
              label="Join Month"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleFilterChange('joinMonth', $event)"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="memberStore.filters.sortBy"
              :items="sortByOptions"
              label="Sort By"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleFilterChange('sortBy', $event)"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center gap-2">
            <v-tooltip text="Print" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-printer"
                  variant="outlined"
                  v-bind="props"
                  :disabled="memberStore.loading"
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
                  :loading="memberStore.loading"
                  :disabled="memberStore.loading"
                  @click="handleExportExcel"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Import Members" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-upload"
                  variant="outlined"
                  v-bind="props"
                  @click="goToImport"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2">
      <v-progress-linear v-if="memberStore.loading" indeterminate color="primary"></v-progress-linear>
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Name</th>
            <th class="text-left font-weight-bold">Age</th>
            <th class="text-left font-weight-bold">Address</th>
            <th class="text-left font-weight-bold">Email</th>
            <th class="text-left font-weight-bold">Phone</th>
            <th class="text-left font-weight-bold">Civil Status</th>
            <th class="text-left font-weight-bold">Join Date</th>
            <th class="text-left font-weight-bold">Position</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!memberStore.loading && memberStore.members.length === 0">
            <td colspan="9" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="member in memberStore.members" :key="member.member_id">
            <td>{{ getMemberName(member) }}</td>
            <td>{{ member.age }}</td>
            <td>{{ member.address }}</td>
            <td>{{ member.email }}</td>
            <td>{{ member.phone_number }}</td>
            <td>{{ formatCivilStatus(member.civil_status) }}</td>
            <td>{{ formatDate(member.date_created) }}</td>
            <td>{{ member.position }}</td>
            <td>
              <v-tooltip text="Edit Member" location="top">
                <template v-slot:activator="{ props }">
              <v-btn 
                icon="mdi-pencil" 
                variant="text" 
                size="small" 
                class="mr-2"
                    v-bind="props"
                @click="editMember(member)"
              ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Member" location="top">
                <template v-slot:activator="{ props }">
              <v-btn 
                icon="mdi-delete" 
                variant="text" 
                size="small" 
                color="error"
                    v-bind="props"
                @click="deleteMember(member)"
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
            v-model="memberStore.itemsPerPage"
            :items="memberStore.pageSizeOptions"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 80px;"
            @update:model-value="handlePageSizeChange"
          ></v-select>
          <span class="ml-4 text-body-2">
            Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ memberStore.totalCount }}
          </span>
        </div>
        <div class="d-flex align-center">
          <v-pagination
            v-model="memberStore.currentPage"
            :length="memberStore.totalPages"
            :total-visible="7"
            density="compact"
            @update:model-value="handlePageChange"
          ></v-pagination>
        </div>
      </div>
    </v-card>
    <MemberDialog
      v-model="memberDialog"
      :memberData="memberData"
      @update:model-value="memberDialog = $event"
      @success="handleMemberSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMemberRecordStore } from '@/stores/ChurchRecords/memberRecordStore'
import MemberDialog from '../../Dialogs/MemberDialog.vue'
import axios from '@/api/axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// Pinia Store
const memberStore = useMemberRecordStore()

// Component state
const memberDialog = ref(false)
const memberData = ref(null)

// Filter options
const ageRangeOptions = ['All Ages', '0-18', '19-30', '31-50', '51+']
const genderOptions = ['All Genders', 'Male', 'Female']
const joinMonthOptions = ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const sortByOptions = [
  'Name (A-Z)',
  'Name (Z-A)',
  'Join Date (Newest)',
  'Join Date (Oldest)',
  'Join Month (Jan-Dec)',
  'Join Month (Dec-Jan)',
  'Age (Low to High)',
  'Age (High to Low)',
  'Gender (Male First)',
  'Gender (Female First)'
]

// Computed properties for two-way binding with store
const searchQuery = computed({
  get: () => memberStore.searchQuery,
  set: (value) => {
    memberStore.setSearchQuery(value)
  }
})


const currentPage = computed({
  get: () => memberStore.currentPage,
  set: (value) => {
    memberStore.setCurrentPage(value)
  }
})

// Watch for search query changes with debounce
let searchTimeout = null
watch(() => searchQuery.value, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    memberStore.setSearchQuery(newValue)
  }, 500) // 500ms debounce
})

// Handle filter changes
const handleFilterChange = (filterName, value) => {
  memberStore.setFilters({ [filterName]: value })
}

// Methods
const openMemberDialog = () => {
  memberData.value = null
  memberDialog.value = true
}

const goToImport = () => {
  router.push('/admin/members/import')
}

const editMember = (member) => {
  memberData.value = member
  memberDialog.value = true
}

const deleteMember = async (member) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete ${getMemberName(member)}?`,
      'Delete Member',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    const result = await memberStore.deleteMember(member.member_id)
    if (result.success) {
      ElMessage.success('Member deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete member')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
    }
  }
}

const handleMemberSuccess = () => {
  // Refresh the member list after successful create/update
  memberStore.fetchMembers({
    page: memberStore.currentPage,
    pageSize: memberStore.itemsPerPage,
    search: memberStore.searchQuery,
    ageRange: memberStore.filters.ageRange,
    gender: memberStore.filters.gender,
    joinMonth: memberStore.filters.joinMonth,
    sortBy: memberStore.filters.sortBy
  })
}


const handlePageChange = (page) => {
  memberStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  memberStore.setPageSize(pageSize)
}

const getMemberName = (member) => {
  const parts = []
  if (member.firstname) parts.push(member.firstname)
  if (member.middle_name) parts.push(member.middle_name)
  if (member.lastname) parts.push(member.lastname)
  return parts.join(' ') || 'N/A'
}

const formatCivilStatus = (civilStatus) => {
  if (!civilStatus) return 'N/A'
  const statusMap = {
    'single': 'Single',
    'married': 'Married',
    'widowed': 'Widowed',
    'divorced': 'Divorced',
    'separated': 'Separated'
  }
  return statusMap[civilStatus.toLowerCase()] || civilStatus
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}


const getStartIndex = () => {
  if (memberStore.members.length === 0) return 0
  return (memberStore.currentPage - 1) * memberStore.itemsPerPage + 1
}

const getEndIndex = () => {
  const end = memberStore.currentPage * memberStore.itemsPerPage
  return Math.min(end, memberStore.totalCount)
}

const handleExportExcel = async () => {
  try {
    const result = await memberStore.exportMembersToExcel({
      search: memberStore.searchQuery,
      ageRange: memberStore.filters.ageRange,
      gender: memberStore.filters.gender,
      joinMonth: memberStore.filters.joinMonth,
      sortBy: memberStore.filters.sortBy
    })
    
    if (result.success) {
      ElMessage.success('Excel file downloaded successfully')
    } else {
      ElMessage.error(result.error || 'Failed to export Excel file')
    }
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('Failed to export Excel file')
  }
}

const handlePrint = async () => {
  try {
    // Show loading state
    memberStore.loading = true
    console.log('Print: Starting to fetch all data...')
    
    // Fetch all members (use a large page size to get all data)
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      throw new Error('No access token found')
    }
    
    const params = new URLSearchParams()
    params.append('limit', '10000') // Large limit to get all data
    params.append('offset', '0')
    
    // Add current filters to get the filtered data
    if (memberStore.searchQuery) {
      params.append('search', memberStore.searchQuery)
    }
    if (memberStore.filters.ageRange && memberStore.filters.ageRange !== 'All Ages') {
      params.append('ageRange', memberStore.filters.ageRange)
    }
    if (memberStore.filters.gender && memberStore.filters.gender !== 'All Genders') {
      params.append('gender', memberStore.filters.gender)
    }
    if (memberStore.filters.joinMonth && memberStore.filters.joinMonth !== 'All Months') {
      params.append('joinMonth', memberStore.filters.joinMonth)
    }
    if (memberStore.filters.sortBy) {
      params.append('sortBy', memberStore.filters.sortBy)
    }
    
    console.log('Print: Fetching with params:', params.toString())
    
    const response = await axios.get(`/church-records/members/getAllMembers?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Print: Response received:', response.data)
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Failed to fetch members')
    }
    
    const allMembers = response.data?.data || []
    console.log('Print: Total members fetched:', allMembers.length)
    
    // Sort the members locally to match the selected sort option
    allMembers.sort((a, b) => {
      switch (memberStore.filters.sortBy) {
        case 'Name (A-Z)':
          return (getMemberName(a) || '').localeCompare(getMemberName(b) || '')
        case 'Name (Z-A)':
          return (getMemberName(b) || '').localeCompare(getMemberName(a) || '')
        case 'Join Date (Newest)':
          return new Date(b.date_created || 0) - new Date(a.date_created || 0)
        case 'Join Date (Oldest)':
          return new Date(a.date_created || 0) - new Date(b.date_created || 0)
        case 'Join Month (Jan-Dec)':
          const dateA = new Date(a.date_created || 0)
          const dateB = new Date(b.date_created || 0)
          if (dateA.getFullYear() === dateB.getFullYear()) {
            return dateA.getMonth() - dateB.getMonth()
          }
          return dateA.getFullYear() - dateB.getFullYear()
        case 'Join Month (Dec-Jan)':
          const dateC = new Date(b.date_created || 0)
          const dateD = new Date(a.date_created || 0)
          if (dateC.getFullYear() === dateD.getFullYear()) {
            return dateC.getMonth() - dateD.getMonth()
          }
          return dateC.getFullYear() - dateD.getFullYear()
        case 'Age (Low to High)':
          return (a.age || 0) - (b.age || 0)
        case 'Age (High to Low)':
          return (b.age || 0) - (a.age || 0)
        case 'Gender (Male First)':
          const genderOrder = { 'Male': 1, 'Female': 2 }
          return (genderOrder[a.gender] || 3) - (genderOrder[b.gender] || 3)
        case 'Gender (Female First)':
          const genderOrder2 = { 'Female': 1, 'Male': 2 }
          return (genderOrder2[a.gender] || 3) - (genderOrder2[b.gender] || 3)
        default:
          return 0
      }
    })
    
    console.log('Print: Opening print window with', allMembers.length, 'members')
    
    if (allMembers.length === 0) {
      ElMessage.warning('No members to print')
      return
    }
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups for this site.')
    }
    
    const tableHeaders = ['Name', 'Age', 'Address', 'Email', 'Phone', 'Join Date', 'Position']
    
    // Get current user info for printed by
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const printedBy = userInfo?.member 
      ? `${userInfo.member.firstname || ''} ${userInfo.member.middle_name || ''} ${userInfo.member.lastname || ''}`.trim()
      : userInfo?.account?.email || 'Admin'
    
    let tableRows = ''
    allMembers.forEach((member) => {
      const name = getMemberName(member)
      const joinDate = formatDate(member.date_created)
      
      tableRows += `
        <tr>
          <td>${name}</td>
          <td>${member.age || 'N/A'}</td>
          <td>${member.address || 'N/A'}</td>
          <td>${member.email || 'N/A'}</td>
          <td>${member.phone_number || 'N/A'}</td>
          <td>${joinDate}</td>
          <td>${member.position || 'N/A'}</td>
        </tr>
      `
    })
    
    const currentDate = new Date().toLocaleString()
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Church Members - Print</title>
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
            <img src="/logo.png" alt="Church Logo" onerror="this.style.display='none'" />
            <div>
              <h1>Church Members</h1>
              <div class="subtitle">Membership Report</div>
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
            <div>Total Records: ${allMembers.length}</div>
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
      try {
        printWindow.print()
      } catch (e) {
        console.error('Print error:', e)
      }
    }, 250)
    
  } catch (error) {
    console.error('Print error:', error)
    ElMessage.error('Failed to print: ' + (error.message || 'Please try again.'))
  } finally {
    memberStore.loading = false
  }
}

// Fetch data on mount
onMounted(() => {
  memberStore.fetchMembers({
    page: memberStore.currentPage,
    pageSize: memberStore.itemsPerPage,
    search: memberStore.searchQuery,
    ageRange: memberStore.filters.ageRange,
    gender: memberStore.filters.gender,
    joinMonth: memberStore.filters.joinMonth,
    sortBy: memberStore.filters.sortBy
  })
})
</script>

<style scoped>
.member-record {
  padding: 24px;
}
</style>

