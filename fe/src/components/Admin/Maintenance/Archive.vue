<template>
  <div class="archive-page">
    <div class="page-header">
      <h1>Archive</h1>
      <p class="page-subtitle">View and restore archived records</p>
    </div>

    <!-- Summary Cards -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card">
          <div class="card-content">
            <el-icon :size="40" color="#409EFF" class="card-icon">
              <Folder />
            </el-icon>
            <div class="card-info">
              <div class="card-label">Total Archived</div>
              <div class="card-value">{{ summaryStats?.total_count || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card">
          <div class="card-content">
            <el-icon :size="40" color="#E6A23C" class="card-icon">
              <Document />
            </el-icon>
            <div class="card-info">
              <div class="card-label">Not Restored</div>
              <div class="card-value">{{ summaryStats?.not_restored_count || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card">
          <div class="card-content">
            <el-icon :size="40" color="#67C23A" class="card-icon">
              <RefreshRight />
            </el-icon>
            <div class="card-info">
              <div class="card-label">Restored</div>
              <div class="card-value">{{ summaryStats?.restored_count || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card">
          <div class="card-content">
            <el-icon :size="40" color="#909399" class="card-icon">
              <Folder />
            </el-icon>
            <div class="card-info">
              <div class="card-label">Tables</div>
              <div class="card-value">{{ summaryStats?.by_table?.length || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Filters -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Filters</span>
          <div class="header-actions">
            <el-button type="success" @click="exportToCSV">
              <el-icon><Download /></el-icon>
              Export CSV
            </el-button>
            <el-button type="info" @click="printData">
              <el-icon><Printer /></el-icon>
              Print
            </el-button>
            <el-button type="primary" text @click="resetFilters" :disabled="loading">
              Reset Filters
            </el-button>
          </div>
        </div>
      </template>
      <el-form :model="filters" :inline="true" class="filter-form">
        <el-form-item label="Search">
          <el-input
            v-model="searchQuery"
            placeholder="Search by table, ID, data..."
            clearable
            @input="handleSearch"
            @clear="handleSearch"
            :disabled="loading"
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Table">
          <el-select
            v-model="filters.original_table"
            placeholder="Select table"
            @change="handleFilterChange"
            :disabled="loading"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="table in tableOptions"
              :key="table"
              :label="formatTableName(table)"
              :value="table"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Status">
          <el-select
            v-model="filters.restored"
            placeholder="Select status"
            @change="handleFilterChange"
            :disabled="loading"
            clearable
            style="width: 150px"
          >
            <el-option label="All" :value="null" />
            <el-option label="Archived" :value="false" />
            <el-option label="Restored" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item label="Date Range">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="To"
            start-placeholder="Start date"
            end-placeholder="End date"
            @change="handleDateRangeChange"
            :disabled="loading"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item label="Sort By">
          <el-select
            v-model="sortBy"
            placeholder="Select sort"
            @change="handleFilterChange"
            :disabled="loading"
            style="width: 180px"
          >
            <el-option label="Date (Newest)" value="Date (Newest)" />
            <el-option label="Date (Oldest)" value="Date (Oldest)" />
            <el-option label="Table (A-Z)" value="Table (A-Z)" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Bulk Actions Row -->
    <el-alert
      v-if="selectedArchives.length > 0"
      title=""
      :description="`${selectedArchives.length} archive${selectedArchives.length > 1 ? 's' : ''} selected`"
      type="info"
      show-icon
      class="mb-4"
      :closable="false"
    >
      <template #title>
        <div class="d-flex justify-content-between align-items-center">
          <span>{{ selectedArchives.length }} archive{{ selectedArchives.length > 1 ? 's' : '' }} selected</span>
          <div>
            <el-button
              type="danger"
              size="small"
              :disabled="loading"
              @click="bulkDeleteArchives"
            >
              <el-icon><Delete /></el-icon>
              Delete Selected
            </el-button>
            <el-button
              size="small"
              @click="clearSelection"
            >
              <el-icon><Close /></el-icon>
              Clear Selection
            </el-button>
          </div>
        </div>
      </template>
    </el-alert>

    <!-- Archive Table -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Archived Records</span>
          <div class="header-actions">
            <el-select
              v-model="itemsPerPage"
              @change="handlePageSizeChange"
              :disabled="loading"
              style="width: 120px; margin-right: 10px"
            >
              <el-option
                v-for="size in pageSizeOptions"
                :key="size"
                :label="`${size} / page`"
                :value="size"
              />
            </el-select>
            <el-button
              :icon="RefreshRight"
              circle
              @click="fetchArchives"
              :loading="loading"
              :disabled="loading"
            />
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <el-empty v-if="loading && archives.length === 0" description="Loading archives..." />
      <div v-else-if="loading" class="loading-overlay">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="archives"
          stripe
          style="width: 100%"
          empty-text="No archived records found"
          table-layout="auto"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="archived_at" label="Archived Date" min-width="160" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.archived_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="original_table" label="Original Table" min-width="150" width="180">
            <template #default="{ row }">
              <el-tag type="info" size="small">
                {{ formatTableName(row.original_table) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="original_id" label="Original ID" min-width="100" width="120" />
          <el-table-column prop="archived_by" label="Archived By" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row.archived_by_name">{{ row.archived_by_name }}</div>
              <div v-else-if="row.archived_by_email">{{ row.archived_by_email }}</div>
              <div v-else-if="row.archived_by">User ID: {{ row.archived_by }}</div>
              <div v-else>System</div>
            </template>
          </el-table-column>
          <el-table-column prop="restored" label="Status" min-width="120" width="140">
            <template #default="{ row }">
              <el-tag :type="row.restored ? 'success' : 'warning'" size="small">
                {{ row.restored ? 'Restored' : 'Archived' }}
              </el-tag>
              <div v-if="row.restored && row.restored_at" class="text-caption">
                Restored: {{ formatDateTime(row.restored_at) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <el-tooltip content="View Details" placement="top">
                <el-button
                  :icon="View"
                  circle
                  size="small"
                  @click="viewDetails(row)"
                  type="primary"
                  text
                />
              </el-tooltip>
              <el-tooltip v-if="!row.restored" content="Restore Record" placement="top">
                <el-button
                  :icon="RefreshRight"
                  circle
                  size="small"
                  @click="handleRestore(row)"
                  :disabled="loading"
                  type="success"
                  text
                />
              </el-tooltip>
              <el-tooltip v-if="!row.restored" content="Delete Permanently" placement="top">
                <el-button
                  :icon="Delete"
                  circle
                  size="small"
                  @click="handleDelete(row)"
                  :disabled="loading"
                  type="danger"
                  text
                />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination-container" v-if="totalPages > 1">
        <div class="pagination-info">
          Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to
          {{ Math.min(currentPage * itemsPerPage, totalCount) }} of {{ totalCount }} entries
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="itemsPerPage"
          :total="totalCount"
          :page-sizes="pageSizeOptions"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
          :disabled="loading"
        />
      </div>
    </el-card>

    <!-- Details Dialog -->
    <el-dialog
      v-model="detailsDialog"
      title="Archive Details"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedArchive" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Original Table">
            {{ formatTableName(selectedArchive.original_table) }}
          </el-descriptions-item>
          <el-descriptions-item label="Original ID">
            {{ selectedArchive.original_id }}
          </el-descriptions-item>
          <el-descriptions-item label="Archived Date">
            {{ formatDateTime(selectedArchive.archived_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="Archived By">
            <span v-if="selectedArchive.archived_by_name">
              {{ selectedArchive.archived_by_name }}
            </span>
            <span v-else-if="selectedArchive.archived_by_email">
              {{ selectedArchive.archived_by_email }}
            </span>
            <span v-else-if="selectedArchive.archived_by">
              User ID: {{ selectedArchive.archived_by }}
            </span>
            <span v-else>System</span>
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="selectedArchive.restored ? 'success' : 'warning'" size="small">
              {{ selectedArchive.restored ? 'Restored' : 'Archived' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Restored Date" v-if="selectedArchive.restored">
            {{ formatDateTime(selectedArchive.restored_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="Restore Notes" :span="2" v-if="selectedArchive.restore_notes">
            {{ selectedArchive.restore_notes }}
          </el-descriptions-item>
          <el-descriptions-item label="Archived Data" :span="2">
            <pre class="json-preview">{{ JSON.stringify(selectedArchive.archived_data, null, 2) }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailsDialog = false">Close</el-button>
          <el-button
            v-if="selectedArchive && !selectedArchive.restored"
            type="success"
            @click="handleRestore(selectedArchive)"
            :loading="restoring"
          >
            Restore
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Restore Confirmation Dialog -->
    <el-dialog
      v-model="restoreDialog"
      title="Restore Archive"
      width="500px"
      :close-on-click-modal="false"
    >
      <div>
        <p>Are you sure you want to restore this record back to <strong>{{ restoreTarget?.table }}</strong>?</p>
        <el-form-item label="Restore Notes (Optional)" class="mt-4">
          <el-input
            v-model="restoreNotes"
            type="textarea"
            :rows="3"
            placeholder="Enter restore notes..."
          />
        </el-form-item>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="restoreDialog = false">Cancel</el-button>
          <el-button type="success" @click="confirmRestore" :loading="restoring">
            Restore
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Permanent Delete Confirmation Dialog -->
    <el-dialog
      v-model="deleteDialog"
      title="Permanently Delete Archive"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="delete-warning">
        <el-icon :size="48" color="#F56C6C" class="mb-4"><Delete /></el-icon>
        <p class="delete-title">Are you sure you want to permanently delete this archive?</p>
        <p class="delete-message">This action <strong>cannot be undone</strong>. The archive record will be permanently removed from the database.</p>
        <el-descriptions :column="1" border class="mt-4">
          <el-descriptions-item label="Table">
            {{ deleteTarget?.table }}
          </el-descriptions-item>
          <el-descriptions-item label="Original ID">
            {{ deleteTarget?.id }}
          </el-descriptions-item>
          <el-descriptions-item label="Archive ID">
            {{ deleteTarget?.archive_id }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialog = false">Cancel</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleting">
           Delete Permanently
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArchiveStore } from '@/stores/archiveStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  RefreshRight,
  Folder,
  Search,
  View,
  Loading,
  Refresh,
  Download,
  Printer,
  Delete,
  Close
} from '@element-plus/icons-vue'

const archiveStore = useArchiveStore()
const route = useRoute()
const router = useRouter()

// Selection state
const selectedArchives = ref([])
const selectAll = ref(false)

// Computed properties
const archives = computed(() => archiveStore.archives)
const loading = computed(() => archiveStore.loading)
const searchQuery = computed({
  get: () => archiveStore.searchQuery,
  set: (value) => archiveStore.setSearchQuery(value)
})
const filters = computed(() => archiveStore.filters)
const currentPage = computed({
  get: () => archiveStore.currentPage,
  set: (value) => archiveStore.setCurrentPage(value)
})
const totalPages = computed(() => archiveStore.totalPages)
const totalCount = computed(() => archiveStore.totalCount)
const itemsPerPage = computed({
  get: () => archiveStore.itemsPerPage,
  set: (value) => archiveStore.setPageSize(value)
})
const pageSizeOptions = computed(() => archiveStore.pageSizeOptions)
const summaryStats = computed(() => archiveStore.summaryStats)

// Local state
const detailsDialog = ref(false)
const selectedArchive = ref(null)
const dateRange = ref([])
const restoreDialog = ref(false)
const restoreTarget = ref(null)
const restoreNotes = ref('')
const restoring = ref(false)
const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
const sortBy = computed({
  get: () => archiveStore.filters.sortBy || 'Date (Newest)',
  set: (value) => archiveStore.setFilters({ sortBy: value })
})

// Options
const tableOptions = computed(() => {
  const tables = ['All Tables']
  if (summaryStats.value?.by_table) {
    summaryStats.value.by_table.forEach(item => {
      if (!tables.includes(item.original_table)) {
        tables.push(item.original_table)
      }
    })
  }
  // Add common tables
  const commonTables = [
    'tbl_members',
    'tbl_accounts',
    'tbl_departments',
    'tbl_ministry',
    'tbl_events',
    'tbl_approval',
    'tbl_tithes',
    'tbl_churchleaders',
    'tbl_departmentofficers',
    'tbl_waterbaptism',
    'tbl_marriageservice',
    'tbl_burialservice',
    'tbl_childdedications',
    'tbl_transactions'
  ]
  commonTables.forEach(table => {
    if (!tables.includes(table)) {
      tables.push(table)
    }
  })
  return tables
})

// Methods
const fetchArchives = async () => {
  await archiveStore.fetchArchives()
}

const fetchSummaryStats = async () => {
  await archiveStore.fetchSummaryStats()
}

const handleSearch = () => {
  // Clear previous timeout
  if (window.archiveSearchTimeout) {
    clearTimeout(window.archiveSearchTimeout)
  }

  // Set new timeout to trigger search after user stops typing (500ms delay)
  window.archiveSearchTimeout = setTimeout(() => {
    fetchArchives()
  }, 500)
}

const handleFilterChange = () => {
  fetchArchives()
}

const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    archiveStore.setFilters({
      date_from: dateRange.value[0],
      date_to: dateRange.value[1]
    })
  } else {
    archiveStore.setFilters({
      date_from: null,
      date_to: null
    })
  }
  fetchArchives()
}

const handlePageChange = (page) => {
  archiveStore.setCurrentPage(page)
  fetchArchives()
}

const handlePageSizeChange = () => {
  fetchArchives()
}

// Selection methods
const handleSelectionChange = (selection) => {
  selectedArchives.value = selection
}

const clearSelection = () => {
  selectedArchives.value = []
}

const bulkDeleteArchives = async () => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to permanently delete ${selectedArchives.value.length} selected archive${selectedArchives.value.length > 1 ? 's' : ''}? This action cannot be undone.`,
      'Confirm Bulk Delete',
      {
        confirmButtonText: 'Delete Permanently',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    // Extract archive IDs
    const archiveIds = selectedArchives.value.map(archive => archive.archive_id)

    // Use the new bulk delete endpoint
    const result = await archiveStore.bulkDeleteArchivesPermanently(archiveIds)

    if (result.success) {
      const { deleted, failed } = result.data

      if (deleted > 0) {
        ElMessage.success(`Successfully deleted ${deleted} archive${deleted > 1 ? 's' : ''}`)
      }

      if (failed > 0) {
        ElMessage.warning(`Failed to delete ${failed} archive${failed > 1 ? 's' : ''}`)
      }
    }

    clearSelection()
    // fetchArchives() is already called in the store method
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error bulk deleting archives:', error)
      ElMessage.error('Failed to delete selected archives')
    }
  }
}

const resetFilters = () => {
  archiveStore.resetFilters()
  dateRange.value = []
  fetchArchives()
}

const viewDetails = async (item) => {
  try {
    // Fetch full archive record with archived_data for details view
    const fullArchive = await archiveStore.fetchArchiveById(item.archive_id)
    selectedArchive.value = fullArchive
    detailsDialog.value = true
  } catch (error) {
    ElMessage.error('Failed to load archive details')
    console.error('Error loading archive details:', error)
  }
}

const handleRestore = (item) => {
  restoreTarget.value = {
    archive_id: item.archive_id,
    table: formatTableName(item.original_table),
    id: item.original_id
  }
  restoreNotes.value = ''
  restoreDialog.value = true
}

const confirmRestore = async () => {
  if (!restoreTarget.value) return

  restoring.value = true
  try {
    await archiveStore.restoreArchive(restoreTarget.value.archive_id, restoreNotes.value)
    ElMessage.success('Record restored successfully')
    restoreDialog.value = false
    detailsDialog.value = false
    restoreTarget.value = null
    restoreNotes.value = ''
    // Refresh the archives list to show updated status
    await fetchArchives()
    await fetchSummaryStats()
  } catch (error) {
    console.error('Error restoring archive:', error)
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to restore record'
    ElMessage.error(errorMessage)
  } finally {
    restoring.value = false
  }
}

const handleDelete = (item) => {
  deleteTarget.value = {
    archive_id: item.archive_id,
    table: formatTableName(item.original_table),
    id: item.original_id
  }
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return

  deleting.value = true
  try {
    await archiveStore.deleteArchivePermanently(deleteTarget.value.archive_id)
    ElMessage.success('Archive permanently deleted')
    deleteDialog.value = false
    deleteTarget.value = null
    // Refresh the archives list
    await fetchArchives()
    await fetchSummaryStats()
  } catch (error) {
    console.error('Error deleting archive:', error)
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete archive'
    ElMessage.error(errorMessage)
  } finally {
    deleting.value = false
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  // Handle MySQL DATETIME format "YYYY-MM-DD HH:mm:ss"
  // Replace space with 'T' for proper ISO parsing
  const formattedDate = String(dateString).replace(' ', 'T')
  const date = new Date(formattedDate)
  if (isNaN(date.getTime())) return dateString // Fallback to original string
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const formatTableName = (tableName) => {
  if (!tableName) return 'N/A'
  // Remove 'tbl_' prefix and format
  const name = tableName.replace('tbl_', '')
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const exportToCSV = () => {
  const headers = ['Archived Date', 'Original Table', 'Original ID', 'Archived By', 'Status', 'Restored Date']
  const rows = archives.value.map(archive => [
    formatDateTime(archive.archived_at),
    formatTableName(archive.original_table),
    archive.original_id,
    archive.archived_by_name || archive.archived_by_email || archive.archived_by || 'System',
    archive.restored ? 'Restored' : 'Archived',
    archive.restored ? formatDateTime(archive.restored_at) : '-'
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `archives_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('Archives exported successfully')
}

const printData = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Archived Date', 'Original Table', 'Original ID', 'Archived By', 'Status']
  
  // Get current user info for print footer
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const printedBy = currentUser.email || currentUser.name || 'Admin'
  
  const rows = archives.value.map(archive => `
    <tr>
      <td>${formatDateTime(archive.archived_at)}</td>
      <td>${formatTableName(archive.original_table)}</td>
      <td>${archive.original_id}</td>
      <td>${archive.archived_by_name || archive.archived_by_email || archive.archived_by || 'System'}</td>
      <td>${archive.restored ? 'Restored' : 'Archived'}</td>
    </tr>
  `).join('')
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Archives - Print</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
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
          .header-logo {
            display: block;
            margin: 0 auto 10px;
            max-width: 80px;
          }
          h1 { color: #1a365d; text-align: center; margin: 5px 0; }
          .subtitle { text-align: center; color: #666; margin-bottom: 15px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
          th { background-color: #1a365d; color: white; }
          .print-info { 
            text-align: right; 
            color: #666; 
            font-size: 10px; 
            margin-bottom: 10px;
          }
          .org-name { text-align: center; color: #1a365d; font-weight: bold; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="watermark">
          <img src="/logo.png" alt="Watermark" />
        </div>
        <img src="/logo.png" alt="Logo" class="header-logo" />
        <div class="org-name">Bible Baptist Ekklesia of Kawit</div>
        <h1>Archives</h1>
        <p class="subtitle">Archived Records Report</p>
        <div class="print-info">
          Printed on: ${new Date().toLocaleString()}<br/>
          Printed by: ${printedBy}
        </div>
        <table>
          <thead>
            <tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5" style="text-align:center">No records found</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 500)
}

// Lifecycle
onMounted(async () => {
  // Check for query parameters from System Logs
  const { table, search: searchParam, action } = route.query

  if (table) {
    // Set table filter
    archiveStore.setFilters({ original_table: table })
  }

  if (searchParam) {
    // Set search query
    archiveStore.setSearchQuery(searchParam)
  }

  if (action === 'restore') {
    // Show restore hint
    ElMessage.info('Click the restore button on any archived record to restore it')
    // Clear the query param
    router.replace({ query: { ...route.query, action: undefined } })
  }

  await Promise.all([
    fetchArchives(),
    fetchSummaryStats()
  ])
})

// Cleanup timeout on unmount
onUnmounted(() => {
  if (window.archiveSearchTimeout) {
    clearTimeout(window.archiveSearchTimeout)
  }
})
</script>

<style scoped>
.archive-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.page-subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.summary-cards {
  margin-bottom: 24px;
}

.summary-card {
  height: 100%;
}

.card-content {
  display: flex;
  align-items: center;
}

.card-icon {
  margin-right: 16px;
}

.card-info {
  flex: 1;
}

.card-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.card-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.filter-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-form {
  margin-top: 0;
}

.table-card {
  margin-bottom: 24px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-info {
  font-size: 14px;
  color: #909399;
}

.detail-content {
  padding: 0;
}

.json-preview {
  background: #F5F7FA;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 400px;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.text-caption {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.delete-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.delete-title {
  font-size: 18px;
  font-weight: 600;
  color: #F56C6C;
  margin: 16px 0 8px 0;
}

.delete-message {
  color: #606266;
  margin: 0;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-form {
    display: flex;
    flex-direction: column;
  }

  .filter-form :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 16px;
  }
}
</style>
