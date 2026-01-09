<template>
  <div class="audit-trail-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Document /></el-icon>
          Audit Trail
        </h1>
        <p class="page-subtitle">Track all user actions and system activities (v2 - Raw Data)</p>
      </div>
      <div class="header-actions">
        <el-button type="success" @click="exportToCSV">
          <el-icon><Download /></el-icon>
          Export CSV
        </el-button>
        <el-button type="info" @click="printData">
          <el-icon><Printer /></el-icon>
          Print
        </el-button>
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          Refreshdd
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-row">
        <el-input
          v-model="filters.search"
          placeholder="Search descriptions, entity names, emails..."
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="filters.action_type" placeholder="Action Type" clearable @change="fetchData">
          <el-option label="CREATE" value="CREATE" />
          <el-option label="UPDATE" value="UPDATE" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="LOGIN" value="LOGIN" />
          <el-option label="LOGOUT" value="LOGOUT" />
          <el-option label="EXPORT" value="EXPORT" />
          <el-option label="VIEW_LIST" value="VIEW_LIST" />
        </el-select>

        <el-select v-model="filters.entity_type" placeholder="Entity Type" clearable @change="fetchData">
          <el-option label="Member" value="Member" />
          <el-option label="Account" value="Account" />
          <el-option label="Department" value="Department" />
          <el-option label="Ministry" value="Ministry" />
          <el-option label="Event" value="Event" />
          <el-option label="Water Baptism" value="Water Baptism" />
          <el-option label="Burial Service" value="Burial Service" />
          <el-option label="Marriage Service" value="Marriage Service" />
          <el-option label="Child Dedication" value="Child Dedication" />
          <el-option label="Transaction" value="Transaction" />
          <el-option label="System" value="System" />
        </el-select>

        <el-select v-model="filters.status" placeholder="Status" clearable @change="fetchData">
          <el-option label="Success" value="success" />
          <el-option label="Failed" value="failed" />
          <el-option label="Error" value="error" />
        </el-select>

        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="to"
          start-placeholder="Start Date"
          end-placeholder="End Date"
          @change="handleDateChange"
        />

        <el-select v-model="filters.sortBy" placeholder="Sort By" clearable @change="fetchData">
          <el-option label="Date (Newest)" value="Date (Newest)" />
          <el-option label="Date (Oldest)" value="Date (Oldest)" />
          <el-option label="Action (A-Z)" value="Action (A-Z)" />
          <el-option label="Entity (A-Z)" value="Entity (A-Z)" />
        </el-select>

        <el-button @click="resetFilters" :disabled="loading">
          <el-icon><RefreshRight /></el-icon>
          Reset
        </el-button>
      </div>
    </el-card>

    <!-- Stats Cards -->
    <div class="stats-row">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <el-icon class="stat-icon total"><Document /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_count || 0 }}</div>
            <div class="stat-label">Total Logs</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <el-icon class="stat-icon success"><CircleCheck /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ getStatusCount('success') }}</div>
            <div class="stat-label">Success</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <el-icon class="stat-icon failed"><CircleClose /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ getStatusCount('failed') + getStatusCount('error') }}</div>
            <div class="stat-label">Failed/Error</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <el-icon class="stat-icon today"><Calendar /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ stats.today_count || 0 }}</div>
            <div class="stat-label">Today's Logs</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Data Table -->
    <el-card class="data-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Audit Trail Records</span>
          <div class="header-actions">
            <!-- Page Size Select -->
            <el-select
              v-model="itemsPerPage"
              @change="handlePageSizeChange"
              :disabled="loading"
              style="width: 120px; margin-right: 10px"
            >
              <el-option
                v-for="size in pageSizeOptions"
                :key="size"
                :label="size === -1 ? 'All' : `${size} / page`"
                :value="size"
              />
            </el-select>
            <el-button
              :icon="Refresh"
              circle
              @click="fetchData"
              :loading="loading"
              :disabled="loading"
            />
          </div>
        </div>
      </template>

      <el-table
        :data="auditLogs"
        v-loading="loading"
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'date_created', order: 'descending' }"
      >
        <el-table-column prop="date_created" label="Date & Time" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.date_created) }}
          </template>
        </el-table-column>

        <el-table-column prop="user_email" label="User Email" width="200" sortable>
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.user_email || 'System' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="action_type" label="Action" width="120" sortable>
          <template #default="{ row }">
            <el-tag :type="getActionTypeColor(row.action_type)" size="small">
              {{ row.action_type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="entity_type" label="Entity" width="150" sortable>
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.entity_type }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="entity_name" label="Entity Name" width="180">
          <template #default="{ row }">
            {{ row.entity_name || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="description" label="Description" min-width="300">
          <template #default="{ row }">
            <code class="description-text">{{ row.description }}</code>
          </template>
        </el-table-column>

        <el-table-column prop="ip_address" label="IP Address" width="140">
          <template #default="{ row }">
            {{ row.ip_address || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="error_message" label="Error" width="200">
          <template #default="{ row }">
            <el-tag v-if="row.error_message" type="danger" size="small">
              {{ row.error_message }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container" v-if="totalPages > 1 && itemsPerPage !== -1">
        <div class="pagination-info">
          Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to
          {{ Math.min(currentPage * itemsPerPage, totalCount) }} of {{ totalCount }} entries
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="itemsPerPage"
          :total="totalCount"
          :page-sizes="pageSizeOptions.filter(s => s !== -1)"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
          :disabled="loading"
        />
      </div>
      <!-- Show All Info -->
      <div class="pagination-container" v-else-if="itemsPerPage === -1">
        <div class="pagination-info">
          Showing all {{ totalCount }} entries
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Document, Refresh, Search, CircleCheck, CircleClose, Calendar, RefreshRight, Download, Printer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuditTrailStore } from '@/stores/Admin/auditTrailStore'

const auditTrailStore = useAuditTrailStore()

// State
const loading = ref(false)
const auditLogs = ref([])
const stats = reactive({
  total_count: 0,
  by_status: [],
  today_count: 0
})

// Filters
const filters = reactive({
  search: '',
  action_type: '',
  entity_type: '',
  status: '',
  dateRange: null,
  sortBy: 'Date (Newest)'
})

// Pagination - Using computed like Archive
const currentPage = computed({
  get: () => auditTrailStore.pagination?.page || 1,
  set: (value) => { auditTrailStore.pagination.page = value }
})

const totalPages = computed(() => auditTrailStore.pagination?.totalPages || 1)

const totalCount = computed(() => auditTrailStore.pagination?.totalCount || 0)

const itemsPerPage = computed({
  get: () => auditTrailStore.pagination?.pageSize || 100,
  set: (value) => { 
    auditTrailStore.pagination.pageSize = value
    auditTrailStore.pagination.page = 1
  }
})

const pageSizeOptions = computed(() => auditTrailStore.pagination?.pageSizeOptions || [25, 50, 100, 200])

// Computed
const getStatusCount = (status) => {
  const found = stats.by_status.find(s => s.status === status)
  return found ? found.count : 0
}

// Methods
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getActionTypeColor = (action) => {
  const colors = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'danger',
    LOGIN: 'info',
    LOGOUT: 'info',
    EXPORT: 'primary',
    VIEW_LIST: ''
  }
  return colors[action] || ''
}

const getStatusColor = (status) => {
  const colors = {
    success: 'success',
    failed: 'danger',
    error: 'danger'
  }
  return colors[status] || 'info'
}

const handleSearch = () => {
  clearTimeout(window.searchTimeout)
  window.searchTimeout = setTimeout(() => {
    auditTrailStore.pagination.page = 1
    fetchData()
  }, 300)
}

const handlePageChange = (page) => {
  auditTrailStore.pagination.page = page
  fetchData()
}

const handlePageSizeChange = () => {
  fetchData()
}

const handleDateChange = () => {
  auditTrailStore.pagination.page = 1
  fetchData()
}

const resetFilters = () => {
  filters.search = ''
  filters.action_type = ''
  filters.entity_type = ''
  filters.status = ''
  filters.dateRange = null
  filters.sortBy = 'Date (Newest)'
  auditTrailStore.pagination.page = 1
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: itemsPerPage.value === -1 ? 1 : auditTrailStore.pagination.page,
      pageSize: itemsPerPage.value === -1 ? -1 : auditTrailStore.pagination.pageSize,
      search: filters.search || undefined,
      action_type: filters.action_type || undefined,
      entity_type: filters.entity_type || undefined,
      status: filters.status || undefined,
      date_from: filters.dateRange ? filters.dateRange[0] : undefined,
      date_to: filters.dateRange ? filters.dateRange[1] : undefined,
      sortBy: filters.sortBy || 'Date (Newest)',
      // Send showAll when pageSize is -1
      showAll: itemsPerPage.value === -1 || undefined
    }

    const result = await auditTrailStore.fetchAuditLogs(params)
    
    if (result && result.success) {
      auditLogs.value = result.data || []
    }

    // Fetch stats
    await fetchStats()
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    ElMessage.error('Failed to fetch audit logs')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const result = await auditTrailStore.getAuditStats()
    if (result && result.success) {
      stats.total_count = result.data?.total_count || 0
      stats.by_status = result.data?.by_status || []
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const refreshData = () => {
  auditTrailStore.pagination.page = 1
  fetchData()
}

const exportToCSV = () => {
  const headers = ['Date & Time', 'User Email', 'Action', 'Entity', 'Entity Name', 'Description', 'IP Address', 'Status', 'Error']
  const rows = auditLogs.value.map(log => [
    formatDate(log.date_created),
    log.user_email || 'System',
    log.action_type,
    log.entity_type,
    log.entity_name || '-',
    log.description,
    log.ip_address || '-',
    log.status,
    log.error_message || '-'
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('Audit trail exported successfully')
}

const printData = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Date & Time', 'User Email', 'Action', 'Entity', 'Entity Name', 'Description', 'IP Address', 'Status']
  
  const rows = auditLogs.value.map(log => `
    <tr>
      <td>${formatDate(log.date_created)}</td>
      <td>${log.user_email || 'System'}</td>
      <td>${log.action_type}</td>
      <td>${log.entity_type}</td>
      <td>${log.entity_name || '-'}</td>
      <td>${log.description}</td>
      <td>${log.ip_address || '-'}</td>
      <td>${log.status}</td>
    </tr>
  `).join('')
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Audit Trail - Print</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1a365d; text-align: center; }
          .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #1a365d; color: white; }
          .print-date { text-align: right; color: #666; font-size: 12px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
        <h1>Audit Trail</h1>
        <p class="subtitle">Bible Baptist Ekklesia of Kawit</p>
        <table>
          <thead>
            <tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="8" style="text-align:center">No records found</td></tr>'}
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
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.audit-trail-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 8px 0 0 0;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 300px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
}

.stat-icon.total { color: #409eff; }
.stat-icon.success { color: #67c23a; }
.stat-icon.failed { color: #f56c6c; }
.stat-icon.today { color: #e6a23c; }

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

.data-card {
  border-radius: 12px;
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

.description-text {
  font-size: 12px;
  color: #606266;
  background-color: #f4f4f5;
  padding: 4px 8px;
  border-radius: 4px;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template: 1fr;
  }
  
  .filter-row {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
}
</style>
