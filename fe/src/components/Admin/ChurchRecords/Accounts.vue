<template>
  <div class="accounts">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Accounts</h1>
      <v-btn 
        color="success" 
        prepend-icon="mdi-account-plus" 
        size="small" 
        :disabled="loading"
        :loading="loading"
        @click="openAccountDialog"
      >
        Add New Account
      </v-btn>
    </div>

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search accounts..."
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
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
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.position"
              :items="positionOptions"
              label="Position"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
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
          <div class="mt-4 text-body-1">Loading accounts...</div>
        </div>
      </v-overlay>

      <v-table>
        <thead>
          <tr>
            <!-- <th class="text-left font-weight-bold">Account ID</th> -->
            <th class="text-left font-weight-bold">Email</th>
            <th class="text-left font-weight-bold">Position</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && accounts.length === 0">
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
          <tr v-for="account in accounts" :key="account.acc_id || account.id" v-show="!loading">
            <!-- <td>{{ account.acc_id }}</td> -->
            <td>{{ account.email }}</td>
            <td>
              <v-chip
                color="info"
                size="small"
                variant="flat"
              >
                {{ account.position }}
              </v-chip>
            </td>
            <td>
              <v-chip
                :color="account.status === 'active' ? 'success' : 'error'"
                size="small"
                variant="flat"
              >
                {{ account.status }}
              </v-chip>
            </td>
            <td>{{ account.date_created }}</td>
            <td>
              <v-tooltip text="Edit Account" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2" 
                    :disabled="loading"
                    v-bind="props"
                    @click="editAccount(account)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Account" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error" 
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteAccount(account)"
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
    <AccountDialog 
      v-model="accountDialog" 
      :accountData="accountData" 
      :emailOptions="emailOptions"
      @update:model-value="accountDialog = $event" 
      @submit="handleSubmit" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AccountDialog from '../../Dialogs/AccountDialog.vue'
import { useAccountsStore } from '@/stores/ChurchRecords/accountsStore'

const accountsStore = useAccountsStore()

const accountDialog = ref(false)
const accountData = ref(null)

// Computed properties from store
const accounts = computed(() => accountsStore.paginatedAccounts)
const loading = computed(() => accountsStore.loading)
const searchQuery = computed({
  get: () => accountsStore.searchQuery,
  set: (value) => accountsStore.setSearchQuery(value)
})
const filters = computed(() => accountsStore.filters)
const currentPage = computed({
  get: () => accountsStore.currentPage,
  set: (value) => accountsStore.setCurrentPage(value)
})
const totalPages = computed(() => accountsStore.totalPages)
const totalCount = computed(() => accountsStore.totalCount)
const itemsPerPage = computed({
  get: () => accountsStore.itemsPerPage,
  set: (value) => accountsStore.setPageSize(value)
})
const pageSizeOptions = computed(() => accountsStore.pageSizeOptions)
const emailOptions = computed(() => accountsStore.emailOptions)

const statusOptions = ['All Statuses', 'active', 'inactive']
const positionOptions = ['All Positions', 'admin', 'staff', 'member']
const createdMonthOptions = ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const sortByOptions = [
  'Email (A-Z)',
  'Email (Z-A)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Position (A-Z)',
  'Status (A-Z)',
  'Group by Member',
  'Group by Staff',
  'Group by Admin'
]

// Watch for filter changes
watch(() => filters.value.status, (newStatus) => {
  accountsStore.setFilters({ status: newStatus })
})

watch(() => filters.value.position, (newPosition) => {
  accountsStore.setFilters({ position: newPosition })
})

watch(() => filters.value.sortBy, (newSortBy) => {
  accountsStore.setFilters({ sortBy: newSortBy })
})

const openAccountDialog = () => {
  accountData.value = null
  accountDialog.value = true
}

const editAccount = (account) => {
  accountData.value = account
  accountDialog.value = true
}

const deleteAccount = async (account) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the account for ${account.email}?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await accountsStore.deleteAccount(account.acc_id || account.id)
    if (result.success) {
      ElMessage.success('Account deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete account')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting account:', error)
      ElMessage.error('Failed to delete account')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (accountData.value) {
      // Update existing account
      const accId = accountData.value.acc_id || accountData.value.id
      result = await accountsStore.updateAccount(accId, data)
    } else {
      // Create new account
      result = await accountsStore.createAccount(data)
    }

    if (result.success) {
      ElMessage.success(
        accountData.value 
          ? 'Account updated successfully' 
          : 'Account created successfully'
      )
      accountDialog.value = false
      accountData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save account')
    }
  } catch (error) {
    console.error('Error submitting account:', error)
    ElMessage.error('Failed to save account')
  }
}

const handleExportExcel = async () => {
  try {
    const result = await accountsStore.exportAccountsToExcel()
    if (result.success) {
      ElMessage.success('Accounts exported successfully')
    } else {
      ElMessage.error(result.error || 'Failed to export accounts')
    }
  } catch (error) {
    console.error('Error exporting accounts:', error)
    ElMessage.error('Failed to export accounts')
  }
}

const handlePageSizeChange = (pageSize) => {
  accountsStore.setPageSize(pageSize)
}

const getStartIndex = () => {
  if (accounts.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, totalCount.value)
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
  const tableHeaders = ['Email', 'Position', 'Status', 'Date Created']
  
  let tableRows = ''
  accounts.value.forEach((account) => {
    tableRows += `
      <tr>
        <td>${account.email || 'N/A'}</td>
        <td>${account.position || 'N/A'}</td>
        <td>${account.status || 'N/A'}</td>
        <td>${account.date_created || 'N/A'}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Accounts - Print</title>
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
            <h1>Accounts</h1>
            <div class="subtitle">User Accounts Report</div>
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
          <div>Total Records: ${accounts.value.length}</div>
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
  await accountsStore.fetchAccounts()
  await accountsStore.fetchEmailOptions()
})
</script>

<style scoped>
.accounts {
  padding: 24px;
}
</style>

