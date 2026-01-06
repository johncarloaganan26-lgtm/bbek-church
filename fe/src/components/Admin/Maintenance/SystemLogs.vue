<template>
  <div class="system-logs-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Document /></el-icon>
          System Logs
        </h1>
        <p class="page-subtitle">Track all user actions and system activities (v2 - Raw Data)</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          Refresh
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
      <el-table
        :data="logs"
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

        <el-table-column prop="error_message" label="Error" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.error_message" type="danger" size="small">
              {{ row.error_message }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 25, 50, 100]"
          :total="pagination.totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Document, Refresh, Search, CircleCheck, CircleClose, Calendar, RefreshRight, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSystemLogsStore } from '@/stores/Admin/systemLogsStore'

const systemLogsStore = useSystemLogsStore()

// State
const loading = ref(false)
const logs = ref([])
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
  dateRange: null
})

// Pagination
const pagination = reactive({
  page: 1,
  pageSize: 25,
  totalCount: 0
})

// Computed
const getStatusCount = (status) => {
  const found = stats.by_status.find(s => s.status === status)
  return found ? found.count : 0
}

// Methods
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  // Handle MySQL DATETIME format "YYYY-MM-DD HH:mm:ss"
  // Replace space with 'T' for proper ISO parsing
  const formattedDate = String(dateStr).replace(' ', 'T')
  const date = new Date(formattedDate)
  if (isNaN(date.getTime())) return dateStr // Fallback to original string
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
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
    pagination.page = 1
    fetchData()
  }, 300)
}

const handleDateChange = () => {
  pagination.page = 1
  fetchData()
}

const resetFilters = () => {
  filters.search = ''
  filters.action_type = ''
  filters.entity_type = ''
  filters.status = ''
  filters.dateRange = null
  pagination.page = 1
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: filters.search || undefined,
      action_type: filters.action_type || undefined,
      entity_type: filters.entity_type || undefined,
      status: filters.status || undefined,
      date_from: filters.dateRange ? filters.dateRange[0] : undefined,
      date_to: filters.dateRange ? filters.dateRange[1] : undefined
    }

    const result = await systemLogsStore.fetchLogs(params)
    
    if (result && result.success) {
      logs.value = result.data || []
      pagination.totalCount = result.totalCount || 0
    }

    await fetchStats()
  } catch (error) {
    console.error('Error fetching system logs:', error)
    ElMessage.error('Failed to fetch system logs')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const result = await systemLogsStore.getStats()
    if (result && result.success) {
      stats.total_count = result.data?.total_count || 0
      stats.by_status = result.data?.by_status || []
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const refreshData = () => {
  pagination.page = 1
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.system-logs-container {
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
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .filter-row {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
}
</style>
