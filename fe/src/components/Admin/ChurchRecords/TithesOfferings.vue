<template>
  <div class="tithes-offerings">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Tithes & Offerings</h1>
      <v-btn 
        color="success" 
        prepend-icon="mdi-cash-plus" 
        size="small" 
        :disabled="loading"
        :loading="loading"
        @click="handleTithesOfferingsDialog"
      >
        Record New Donation
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Donations</div>
              <div class="text-h5 font-weight-bold">P{{ totalDonations.toLocaleString() }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-gift icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Tithes</div>
              <div class="text-h5 font-weight-bold">P{{ totalTithes.toLocaleString() }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color:white !important;" class="mdi mdi-gift icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Offerings</div>
              <div class="text-h5 font-weight-bold">P{{ totalOfferings.toLocaleString() }}</div>
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
              <div class="text-caption grey--text mb-1">Special Offerings</div>
              <div class="text-h5 font-weight-bold">P{{ totalSpecialOfferings.toLocaleString() }}</div>
            </div>
            <v-avatar size="56" color="yellow lighten-5" class="d-flex align-center justify-center">
              <span style="color: green !important;" class="mdi mdi-gift icon-custom" aria-hidden="true"></span>
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
              placeholder="Search by member ID or name..."
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleSearchChange"
            ></v-text-field>
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
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.donationType"
              :items="donationTypeOptions"
              label="Donation Type"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
            ></v-select>
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
          <div class="mt-4 text-body-1">Loading donations...</div>
        </div>
      </v-overlay>

      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Member Name</th>
            <th class="text-left font-weight-bold">Donation Type</th>
            <th class="text-left font-weight-bold">Amount/Items</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Type</th>
            <th class="text-left font-weight-bold">Payment Method</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && donations.length === 0">
            <td colspan="7" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-if="loading">
            <td colspan="7" class="text-center py-12">
              <v-progress-circular
                indeterminate
                color="primary"
                size="48"
              ></v-progress-circular>
            </td>
          </tr>
          <tr v-for="donation in donations" :key="donation.tithes_id" v-show="!loading">
            <td>
              <div v-if="donation.is_anonymous" class="d-flex align-center">
                <v-icon size="small" class="mr-1" color="grey">mdi-incognito</v-icon>
                <span class="text-grey">Anonymous</span>
              </div>
              <span v-else>{{ donation.fullname || 'N/A' }}</span>
            </td>
            <td>
              <v-chip :color="donation.donation_type === 'money' ? 'green' : 'blue'" size="small" variant="flat">
                <v-icon start size="small">{{ donation.donation_type === 'money' ? 'mdi-cash' : 'mdi-package-variant' }}</v-icon>
                {{ donation.donation_type === 'money' ? 'Money' : 'In-Kind' }}
              </v-chip>
            </td>
            <td>
              <div v-if="donation.donation_type === 'money'" class="font-weight-bold">
                P{{ parseFloat(donation.amount || 0).toLocaleString() }}
              </div>
              <div v-else class="text-body-2">
                <v-tooltip :text="formatDonationItems(donation.donation_items)" location="top">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props" class="text-truncate d-inline-block" style="max-width: 150px;">
                      {{ formatDonationItems(donation.donation_items) || 'N/A' }}
                    </span>
                  </template>
                </v-tooltip>
              </div>
            </td>
            <td>{{ donation.date_created }}</td>
            <td>
              <v-chip :color="getTypeColor(donation.type)" size="small" variant="flat">
                {{ formatType(donation.type) }}
              </v-chip>
            </td>
            <td>
              <div v-if="donation.donation_type === 'money'">
                {{ donation.payment_method }}
              </div>
              <div v-else class="text-grey">
                -
              </div>
            </td>
            <td>
              <v-tooltip text="Edit Donation" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2" 
                    :disabled="loading"
                    v-bind="props"
                    @click="editDonation(donation)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Donation" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error" 
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteDonation(donation)"
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
    <TithesOfferingsDialog
      v-model="tithesOfferingsDialog"
      :tithesData="tithesOfferingsData"
      :memberOptions="memberOptions"
      @update:model-value="tithesOfferingsDialog = $event"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TithesOfferingsDialog from '@/components/Dialogs/TithesOfferingsDialog.vue'
import { useTithesOfferingsStore } from '@/stores/ChurchRecords/tithesOfferingsStore'

const tithesOfferingsStore = useTithesOfferingsStore()

const tithesOfferingsDialog = ref(false)
const tithesOfferingsData = ref(null)

// Computed properties from store
const donations = computed(() => tithesOfferingsStore.paginatedDonations)
const loading = computed(() => tithesOfferingsStore.loading)
const searchQuery = computed({
  get: () => tithesOfferingsStore.searchQuery,
  set: (value) => tithesOfferingsStore.setSearchQuery(value)
})
const filters = computed(() => tithesOfferingsStore.filters)
const currentPage = computed({
  get: () => tithesOfferingsStore.currentPage,
  set: (value) => tithesOfferingsStore.setCurrentPage(value)
})
const totalPages = computed(() => tithesOfferingsStore.totalPages)
const totalCount = computed(() => tithesOfferingsStore.totalCount)
const itemsPerPage = computed({
  get: () => tithesOfferingsStore.itemsPerPage,
  set: (value) => tithesOfferingsStore.setPageSize(value)
})
const pageSizeOptions = computed(() => tithesOfferingsStore.pageSizeOptions)
const memberOptions = computed(() => tithesOfferingsStore.memberOptions)

// Summary totals from store
const totalDonations = computed(() => tithesOfferingsStore.totalDonations)
const totalTithes = computed(() => tithesOfferingsStore.totalTithes)
const totalOfferings = computed(() => tithesOfferingsStore.totalOfferings)
const totalSpecialOfferings = computed(() => tithesOfferingsStore.totalSpecialOfferings)

const sortByOptions = [
  'Tithes ID (Low to High)',
  'Tithes ID (High to Low)',
  'Amount (Low to High)',
  'Amount (High to Low)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Type (A-Z)',
  'Name (A-Z)',
  'Name (Z-A)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const typeOptions = [
  'All Types',
  // Money donation types
  'tithe', 'offering', 'missions', 'love_gift', 'building_fund', 'donation', 'other',
  // In-kind donation types
  'food', 'clothing', 'medical', 'school', 'furniture', 'electronics', 'household'
]

const donationTypeOptions = ['all', 'money', 'inkind']

// Watch for filter changes with toast notifications
watch(() => filters.value.sortBy, (newSortBy) => {
  ElMessage.info(`Sorted by: ${newSortBy || 'Default'}`)
  tithesOfferingsStore.setFilters({ sortBy: newSortBy })
})

watch(() => filters.value.type, (newType) => {
  ElMessage.info(`Filtering by type: ${newType === 'All Types' ? 'All Types' : formatType(newType)}`)
  tithesOfferingsStore.setFilters({ type: newType })
})

watch(() => filters.value.donationType, (newDonationType) => {
  ElMessage.info(`Filtering by donation type: ${newDonationType === 'all' ? 'All Types' : newDonationType === 'money' ? 'Money' : 'In-Kind'}`)
  tithesOfferingsStore.setFilters({ donationType: newDonationType })
})

const handleTithesOfferingsDialog = () => {
  tithesOfferingsData.value = null
  tithesOfferingsDialog.value = true
}

const handleSearchChange = (value) => {
  ElMessage.info('Searching donations...')
  tithesOfferingsStore.setSearchQuery(value)
}

const editDonation = (donation) => {
  tithesOfferingsData.value = donation
  tithesOfferingsDialog.value = true
}

const deleteDonation = async (donation) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete this donation record?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await tithesOfferingsStore.deleteDonation(donation.tithes_id)
    if (result.success) {
      ElMessage.success('Donation deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete donation')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting donation:', error)
      ElMessage.error('Failed to delete donation')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (tithesOfferingsData.value) {
      // Update existing donation
      const tithesId = tithesOfferingsData.value.tithes_id
      result = await tithesOfferingsStore.updateDonation(tithesId, data)
    } else {
      // Create new donation
      result = await tithesOfferingsStore.createDonation(data)
    }

    if (result.success) {
      ElMessage.success(
        tithesOfferingsData.value 
          ? 'Donation updated successfully' 
          : 'Donation created successfully'
      )
      tithesOfferingsDialog.value = false
      tithesOfferingsData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save donation')
    }
  } catch (error) {
    console.error('Error submitting donation:', error)
    ElMessage.error('Failed to save donation')
  }
}

const handlePageSizeChange = (pageSize) => {
  ElMessage.info(`Showing ${pageSize} items per page`)
  tithesOfferingsStore.setPageSize(pageSize)
}

const getStartIndex = () => {
  if (donations.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, totalCount.value)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getTypeColor = (type) => {
  const colors = {
    'tithe': 'primary',
    'offering': 'success',
    'missions': 'warning',
    'love_gift': 'info',
    'building_fund': 'purple',
    'donation': 'orange',
    'other': 'grey'
  }
  return colors[type] || 'default'
}

const formatType = (type) => {
  const typeMap = {
    // Money donation types
    'tithe': 'Tithe',
    'offering': 'Offering',
    'missions': 'Missions',
    'love_gift': 'Love Gift',
    'building_fund': 'Building Fund',
    'donation': 'Donation',
    'other': 'Other',
    // In-kind donation types
    'food': 'Food Items',
    'clothing': 'Clothing',
    'medical': 'Medical Supplies',
    'school': 'School Supplies',
    'furniture': 'Furniture',
    'electronics': 'Electronics',
    'household': 'Household Items'
  }
  return typeMap[type] || type
}

// Safely format donation items (handle Buffer or object)
const formatDonationItems = (items) => {
  if (!items) return ''
  if (typeof items === 'string') return items
  if (typeof items === 'object') {
    // Check if it's a Buffer-like object
    if (items.type === 'Buffer' && Array.isArray(items.data)) {
      return String.fromCharCode(...items.data)
    }
    return JSON.stringify(items)
  }
  return String(items)
}

// Handle Excel export
const handleExportExcel = async () => {
  try {
    const result = await tithesOfferingsStore.exportTithesToExcel()
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
  const tableHeaders = ['Member Name', 'Donation Type', 'Amount/Items', 'Date Created', 'Type/Category']
  
  let tableRows = ''
  donations.value.forEach((donation) => {
    const memberName = donation.is_anonymous ? 'Anonymous' : (donation.fullname || 'N/A')
    const amountOrItems = donation.donation_type === 'money' 
      ? `P${parseFloat(donation.amount || 0).toLocaleString()}`
      : (formatDonationItems(donation.donation_items) || 'N/A')
    
    tableRows += `
      <tr>
        <td>${memberName}</td>
        <td>${donation.donation_type === 'money' ? 'Money' : 'In-Kind'}</td>
        <td>${amountOrItems}</td>
        <td>${donation.date_created || 'N/A'}</td>
        <td>${formatType(donation.type)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tithes & Offerings - Print</title>
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
            <h1>Tithes & Offerings</h1>
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
          <div>Total Records: ${donations.value.length}</div>
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
  await tithesOfferingsStore.fetchDonations()
  await tithesOfferingsStore.fetchMemberOptions()
})
</script>

<style scoped>
.tithes-offerings {
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

