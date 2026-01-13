<template>
  <div class="system-logs">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">System Logs / Audit Trail</h1>
        <p class="text-body-1 text-medium-emphasis">Monitor all user actions and system activities for security and compliance</p>
      </div>
      <div class="d-flex gap-3">
        <el-button
          type="primary"
          @click="refreshLogs"
          :loading="loading"
          icon="Refresh"
        >
          Refresh
        </el-button>
        <el-button
          type="success"
          @click="exportLogs"
          icon="Download"
        >
          Export CSV
        </el-button>
        <el-button
          type="info"
          @click="printLogs"
          icon="Printer"
        >
          Print Logs
        </el-button>
        <el-button
          type="warning"
          @click="cleanupOldLogs"
          icon="Delete"
        >
          Delete Old Logs
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="mb-6">
      <template #header>
        <div class="d-flex align-center">
          <el-icon class="mr-2"><Filter /></el-icon>
          <span>Filters</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="4">
          <el-input
            v-model="filters.search"
            placeholder="Search by name, action, page..."
            clearable
            class="w-100"
            @input="debouncedSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>

        <el-col :span="4">
          <el-select
            v-model="filters.action"
            placeholder="Action Type"
            clearable
            class="w-100"
          >
            <el-option
              v-for="action in actionTypes"
              :key="action"
              :label="action"
              :value="action"
            />
          </el-select>
        </el-col>

        <el-col :span="4">
          <el-select
            v-model="filters.role"
            placeholder="User Role"
            clearable
            class="w-100"
          >
            <el-option
              v-for="role in filterOptions.uniqueRoles"
              :key="role"
              :label="role"
              :value="role"
            />
          </el-select>
        </el-col>

        <el-col :span="4">
          <el-select
            v-model="filters.page"
            placeholder="Page/Module"
            clearable
            filterable
            class="w-100"
          >
            <el-option
              v-for="page in filterOptions.uniquePages"
              :key="page"
              :label="page"
              :value="page"
            />
          </el-select>
        </el-col>

        <el-col :span="4">
          <el-select
            v-model="filters.userId"
            placeholder="Specific User"
            clearable
            filterable
            class="w-100"
          >
            <el-option
              v-for="user in filterOptions.uniqueUsers"
              :key="user.user_id"
              :label="user.user_name"
              :value="user.user_id"
            />
          </el-select>
        </el-col>

        <el-col :span="4">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="to"
            start-placeholder="Start date"
            end-placeholder="End date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="w-100"
          />
        </el-col>
      </el-row>

      <div class="mt-4">
        <el-button type="primary" @click="applyFilters" :loading="loading">
          Apply Filters
        </el-button>
        <el-button @click="clearFilters" class="ml-2">
          Clear Filters
        </el-button>
      </div>
    </el-card>

    <!-- System Logs Table -->
    <el-card>
      <template #header>
        <div class="d-flex justify-space-between align-center">
          <span>System Activity Logs ({{ pagination.total }} total)</span>
          <el-text size="small" type="info">
            Showing {{ logs.length }} of {{ pagination.total }} entries
          </el-text>
        </div>
      </template>

      <el-table
        :data="logs"
        style="width: 100%"
        :loading="loading"
        stripe
        height="600"
      >
        <el-table-column
          type="index"
          label="#"
          width="60"
        />

        <el-table-column
          prop="user_name"
          label="User"
          width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div>
              <div class="font-weight-medium">{{ row.user_name }}</div>
              <el-tag size="small" :type="getRoleTagType(row.role)">
                {{ row.role }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="action"
          label="Action"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)">
              {{ row.action }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="page"
          label="Page/Module"
          width="150"
          show-overflow-tooltip
        />

        <el-table-column
          prop="description"
          label="Description"
          min-width="250"
          show-overflow-tooltip
        />

        <el-table-column
          prop="date_time"
          label="Date & Time"
          width="180"
          sortable
        >
          <template #default="{ row }">
            {{ formatDateTime(row.date_time) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="ip_address"
          label="IP Address"
          width="130"
        />
      </el-table>

      <!-- Pagination -->
      <div class="d-flex justify-center mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Cleanup Dialog -->
    <el-dialog
      v-model="cleanupDialogVisible"
      title="Delete Old System Logs"
      width="400px"
    >
      <p>Enter the number of days to keep logs. Logs older than this will be permanently deleted.</p>
      <el-input-number
        v-model="daysToKeep"
        :min="30"
        :max="3650"
        controls-position="right"
        class="w-100 mt-3"
        placeholder="Days to keep (minimum 30)"
      />
      <template #footer>
        <el-button @click="cleanupDialogVisible = false">Cancel</el-button>
        <el-button type="danger" @click="confirmCleanup" :loading="cleanupLoading">
          Delete Old Logs
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Filter, Refresh, Download, Printer, Delete, Search } from '@element-plus/icons-vue'
import { useSystemLogsStore } from '@/stores/systemLogsStore'
import { debounce } from 'lodash-es'

// Store
const systemLogsStore = useSystemLogsStore()

// Reactive data
const loading = ref(false)
const cleanupLoading = ref(false)
const cleanupDialogVisible = ref(false)
const daysToKeep = ref(365)

// Computed
const logs = computed(() => systemLogsStore.logs)
const pagination = computed(() => systemLogsStore.pagination)
const filters = computed(() => systemLogsStore.filters)
const filterOptions = computed(() => systemLogsStore.filterOptions)

// Action types for filter dropdown
const actionTypes = [
  'Login', 'Logout', 'View', 'Create', 'Update', 'Delete', 'Print', 'Export'
]

// Debounced search
const debouncedSearch = debounce(() => {
  applyFilters()
}, 500)

// Methods
const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...filters.value
    }

    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (!params[key] || (Array.isArray(params[key]) && params[key].length === 0)) {
        delete params[key]
      }
    })

    await systemLogsStore.fetchLogs(params)
  } catch (error) {
    console.error('Error fetching system logs:', error)
    ElMessage.error('Failed to fetch system logs')
  } finally {
    loading.value = false
  }
}

const refreshLogs = () => {
  fetchLogs()
}

const applyFilters = () => {
  pagination.value.page = 1 // Reset to first page when applying filters
  fetchLogs()
}

const clearFilters = () => {
  systemLogsStore.resetFilters()
  pagination.value.page = 1
  fetchLogs()
}

const exportLogs = async () => {
  try {
    const params = { ...filters.value }
    Object.keys(params).forEach(key => {
      if (!params[key] || (Array.isArray(params[key]) && params[key].length === 0)) {
        delete params[key]
      }
    })

    const response = await systemLogsStore.exportLogs(params)

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    ElMessage.success('System logs exported successfully')
  } catch (error) {
    console.error('Error exporting logs:', error)
    ElMessage.error('Failed to export system logs')
  }
}

const printLogs = () => {
  // Open print dialog
  window.print()
}

const cleanupOldLogs = () => {
  cleanupDialogVisible.value = true
}

const confirmCleanup = async () => {
  if (!daysToKeep.value || daysToKeep.value < 30) {
    ElMessage.error('Please enter a valid number of days (minimum 30)')
    return
  }

  try {
    cleanupLoading.value = true
    const result = await systemLogsStore.cleanupOldLogs(daysToKeep.value)

    ElMessage.success(`Successfully deleted ${result.data.deletedCount} old log entries`)
    cleanupDialogVisible.value = false
    fetchLogs() // Refresh the logs
  } catch (error) {
    console.error('Error cleaning up logs:', error)
    ElMessage.error('Failed to cleanup old logs')
  } finally {
    cleanupLoading.value = false
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)

  // Convert to Philippine time (UTC+8)
  const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000))

  return phTime.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getActionTagType = (action) => {
  const types = {
    'Login': 'success',
    'Logout': 'info',
    'View': 'primary',
    'Create': 'success',
    'Update': 'warning',
    'Delete': 'danger',
    'Print': 'primary',
    'Export': 'primary'
  }
  return types[action] || 'primary'
}

const getRoleTagType = (role) => {
  const types = {
    'Admin': 'danger',
    'Staff': 'warning',
    'Member': 'primary'
  }
  return types[role] || 'primary'
}

const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize
  pagination.value.page = 1
  fetchLogs()
}

const handleCurrentChange = (newPage) => {
  pagination.value.page = newPage
  fetchLogs()
}

// Lifecycle
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.system-logs {
  padding: 20px;
}

.gap-3 {
  gap: 12px;
}

.w-100 {
  width: 100%;
}

.font-weight-medium {
  font-weight: 500;
}

.text-medium-emphasis {
  color: rgba(0, 0, 0, 0.6);
}
</style>