g<template>
  <div class="transactions">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Transactions</h1>
      <v-btn
        color="success"
        prepend-icon="mdi-plus"
        size="small"
        :disabled="loading"
        :loading="loading"
        @click="handleTransactionDialog"
      >
        Create Transaction
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <!-- <v-row class="mb-4">
      <v-col
        v-for="total in totalsByServiceType"
        :key="total.type_of_service"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card
          elevation="3"
          :color="getServiceTypeColor(total.type_of_service)"
          class="summary-card"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-white text-uppercase mb-1">
                  {{ formatServiceType(total.type_of_service) }}
                </div>
                <div class="text-h5 font-weight-bold text-white">
                  ₱{{ formatCurrency(total.total_amount) }}
                </div>
                <div class="text-caption text-white mt-1">
                  {{ total.transaction_count }} transaction{{ total.transaction_count !== 1 ? 's' : '' }}
                </div>
              </div>
              <v-icon
                :icon="getServiceTypeIcon(total.type_of_service)"
                size="48"
                color="white"
                class="opacity-75"
              ></v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card
          elevation="3"
          color="primary"
          class="summary-card"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-white text-uppercase mb-1">
                  Grand Total
                </div>
                <div class="text-h5 font-weight-bold text-white">
                  ₱{{ formatCurrency(summaryStats.grand_total) }}
                </div>
                <div class="text-caption text-white mt-1">
                  {{ summaryStats.total_transactions }} total transaction{{ summaryStats.total_transactions !== 1 ? 's' : '' }}
                </div>
              </div>
              <v-icon
                icon="mdi-cash-multiple"
                size="48"
                color="white"
                class="opacity-75"
              ></v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row> -->

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search transactions..."
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.type_of_service"
              :items="serviceTypeOptions"
              label="Service Type"
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
          <v-col cols="12" md="3" class="d-flex align-center gap-2">
            
            <v-select
              v-model="itemsPerPage"
              :items="transactionsStore.pageSizeOptions"
              density="compact"
              variant="outlined"
              hide-details
              label="Items per page"
              style="max-width: 150px;"
              @update:model-value="handlePageSizeChange"
              :disabled="loading"
            ></v-select>
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
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="d-flex align-center">
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} transactions</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" :loading="loading">
      <v-overlay :model-value="loading" contained class="align-center justify-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="text-body-1 mt-4">Loading transactions...</p>
      </v-overlay>
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Transaction ID</th>
            <th class="text-left font-weight-bold">Service Type</th>
            <th class="text-left font-weight-bold">Service ID</th>
            <th class="text-left font-weight-bold">Total Amount</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && transactions.length === 0">
            <td colspan="6" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="transaction in transactions" :key="transaction.transaction_id">
            <td>{{ transaction.transaction_id }}</td>
            <td>
              <v-chip size="small" :color="getServiceTypeColor(transaction.type_of_service)">
                {{ formatServiceType(transaction.type_of_service) }}
              </v-chip>
            </td>
            <td>{{ transaction.service_id }}</td>
            <td class="font-weight-bold">₱{{ formatCurrency(transaction.total) }}</td>
            <td>{{ formatDateTime(transaction.date_created) }}</td>
            <td>
              <v-tooltip text="View Certificate" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-certificate"
                    variant="text"
                    size="small"
                    class="mr-2"
                    color="primary"
                    v-bind="props"
                    @click="viewCertificate(transaction)"
                    :disabled="loading"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Edit Transaction" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    class="mr-2"
                    v-bind="props"
                    @click="editTransaction(transaction)"
                    :disabled="loading"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Transaction" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    v-bind="props"
                    @click="deleteTransaction(transaction)"
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
            :items="transactionsStore.pageSizeOptions"
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

    <!-- Transaction Dialog -->
    <TransactionDialog
      v-model="transactionDialog"
      :transaction-data="transactionData"
      @update:model-value="transactionDialog = $event"
      @submit="handleSubmit"
    />

    <!-- Certificate Dialog -->
    <CertificateDialog
      v-model="certificateDialog"
      :certificate-data="certificateData"
      :certificate-type="certificateType"
      @update:model-value="certificateDialog = $event"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTransactionsStore } from '@/stores/ChurchRecords/transactionsStore'
import TransactionDialog from '@/components/Dialogs/TransactionDialog.vue'
import CertificateDialog from '@/components/Dialogs/CertificateDialog.vue'
import axios from '@/api/axios'

// Pinia Store
const transactionsStore = useTransactionsStore()

// Computed properties from store
const transactions = computed(() => transactionsStore.transactions)
const loading = computed(() => transactionsStore.loading)
const totalsByServiceType = computed(() => transactionsStore.totalsByServiceType)
const summaryStats = computed(() => transactionsStore.summaryStats)
const searchQuery = computed({
  get: () => transactionsStore.searchQuery,
  set: (value) => transactionsStore.setSearchQuery(value)
})
const filters = computed(() => transactionsStore.filters)
const currentPage = computed({
  get: () => transactionsStore.currentPage,
  set: (value) => transactionsStore.setCurrentPage(value)
})
const totalPages = computed(() => transactionsStore.totalPages)
const totalCount = computed(() => transactionsStore.totalCount)
const itemsPerPage = computed({
  get: () => transactionsStore.itemsPerPage,
  set: (value) => transactionsStore.setPageSize(value)
})

// Service type options
const serviceTypeOptions = [
  'All Services',
  'marriage',
  'burial',
  'child_dedication',
  'water_baptism'
]

// Sort options
const sortByOptions = [
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Total (High to Low)',
  'Total (Low to High)',
  'Service Type (A-Z)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Dialog state
const transactionDialog = ref(false)
const transactionData = ref(null)
const certificateDialog = ref(false)
const certificateData = ref(null)
const certificateType = ref(null)

// Watch for filter changes
watch(
  () => filters.value.type_of_service,
  (newType) => {
    transactionsStore.setFilters({ type_of_service: newType })
  }
)

watch(
  () => filters.value.sortBy,
  (newSortBy) => {
    transactionsStore.setFilters({ sortBy: newSortBy })
  }
)

// Debounce search query
let searchTimeout = null
watch(
  () => searchQuery.value,
  (newQuery) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      transactionsStore.setSearchQuery(newQuery)
    }, 500)
  }
)

// Handle dialog
const handleTransactionDialog = () => {
  transactionData.value = null
  transactionDialog.value = true
}

// Edit transaction
const editTransaction = (transaction) => {
  transactionData.value = {
    transaction_id: transaction.transaction_id,
    type_of_service: transaction.type_of_service,
    service_id: transaction.service_id,
    total: transaction.total,
    date_created: transaction.date_created
  }
  transactionDialog.value = true
}

// Handle submit from dialog
const handleSubmit = async (submitData) => {
  try {
    let result
    if (transactionData.value && transactionData.value.transaction_id) {
      // Update existing transaction
      result = await transactionsStore.updateTransaction(
        transactionData.value.transaction_id,
        submitData
      )
    } else {
      // Create new transaction
      result = await transactionsStore.createTransaction(submitData)
    }

    if (result.success) {
      ElMessage.success(
        transactionData.value
          ? 'Transaction updated successfully'
          : 'Transaction created successfully'
      )
      transactionDialog.value = false
      transactionData.value = null
      // Refresh totals after creating/updating transaction
      await transactionsStore.fetchTotalsByServiceType()
    } else {
      ElMessage.error(result.error || 'Failed to save transaction')
    }
  } catch (error) {
    console.error('Error saving transaction:', error)
    ElMessage.error('An error occurred while saving the transaction')
  }
}

// View certificate
const viewCertificate = async (transaction) => {
  try {
    const accessToken = localStorage.getItem('accessToken')
    const response = await axios.get(`/transactions/getCertificateData/${transaction.transaction_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.data && response.data.success) {
      certificateData.value = response.data.data
      certificateType.value = response.data.data.type
      certificateDialog.value = true
    } else {
      ElMessage.error(response.data?.message || 'Failed to load certificate data')
    }
  } catch (error) {
    console.error('Error fetching certificate data:', error)
    ElMessage.error('Failed to load certificate data')
  }
}

// Handle delete
const deleteTransaction = async (transaction) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete transaction "${transaction.transaction_id}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await transactionsStore.deleteTransaction(transaction.transaction_id)
    if (result.success) {
      ElMessage.success('Transaction deleted successfully')
      // Refresh totals after deleting transaction
      await transactionsStore.fetchTotalsByServiceType()
    } else {
      ElMessage.error(result.error || 'Failed to delete transaction')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting transaction:', error)
      ElMessage.error('An error occurred while deleting the transaction')
    }
  }
}

// Handle page change
const handlePageChange = (page) => {
  transactionsStore.setCurrentPage(page)
}

// Handle page size change
const handlePageSizeChange = (pageSize) => {
  transactionsStore.setPageSize(pageSize)
}

// Get pagination display values
const getStartIndex = () => {
  return transactions.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return end > totalCount.value ? totalCount.value : end
}

// Format functions
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

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatServiceType = (type) => {
  const typeMap = {
    'marriage': 'Marriage Service',
    'burial': 'Burial Service',
    'child_dedication': 'Child Dedication',
    'water_baptism': 'Water Baptism'
  }
  return typeMap[type] || type
}

const getServiceTypeColor = (type) => {
  const colorMap = {
    'marriage': 'pink',
    'burial': 'grey',
    'child_dedication': 'blue',
    'water_baptism': 'cyan'
  }
  return colorMap[type] || 'default'
}

const getServiceTypeIcon = (type) => {
  const iconMap = {
    'marriage': 'mdi-heart',
    'burial': 'mdi-cross',
    'child_dedication': 'mdi-baby-face-outline',
    'water_baptism': 'mdi-water'
  }
  return iconMap[type] || 'mdi-circle'
}

const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Transaction ID', 'Service Type', 'Service ID', 'Total Amount', 'Date Created']
  
  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.middle_name || ''} ${userInfo.member.lastname || ''}`.trim()
    : userInfo?.account?.email || 'Admin'
  
  let tableRows = ''
  transactions.value.forEach((transaction) => {
    tableRows += `
      <tr>
        <td>${transaction.transaction_id}</td>
        <td>${formatServiceType(transaction.type_of_service)}</td>
        <td>${transaction.service_id}</td>
        <td>₱${formatCurrency(transaction.total)}</td>
        <td>${formatDateTime(transaction.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Transactions - Print</title>
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
            <h1>Transactions</h1>
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
          <div>Total Records: ${transactions.value.length}</div>
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

// Fetch transactions and totals on mount
onMounted(async () => {
  await Promise.all([
    transactionsStore.fetchTransactions(),
    transactionsStore.fetchTotalsByServiceType()
  ])
})
</script>

<style scoped>
.transactions {
  padding: 24px;
}

.summary-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.summary-card :deep(.v-card-text) {
  padding: 20px;
}
</style>

