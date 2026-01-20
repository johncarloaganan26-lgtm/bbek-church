<template>
  <div class="audit-trail">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Audit Trail</h1>
        <p class="text-body-1 text-medium-emphasis">Monitor all system activities and user actions</p>
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
          Print
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
        <el-col :span="6">
          <el-select
            v-model="filters.actionType"
            placeholder="Action Type"
            clearable
            class="w-100"
          >
            <el-option
              v-for="action in actionTypes"
              :key="action.value"
              :label="action.label"
              :value="action.value"
            />
          </el-select>
        </el-col>

        <el-col :span="6">
          <el-select
            v-model="filters.userId"
            placeholder="User"
            clearable
            filterable
            class="w-100"
          >
            <el-option
              v-for="user in uniqueUsers"
              :key="user.user_id"
              :label="`${user.user_name} (${user.user_email})`"
              :value="user.user_id"
            />
          </el-select>
        </el-col>

        <el-col :span="6">
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

        <el-col :span="6">
          <el-select
            v-model="filters.status"
            placeholder="Status"
            clearable
            class="w-100"
          >
            <el-option label="Success" value="success" />
            <el-option label="Failed" value="failed" />
          </el-select>
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

    <!-- Audit Trail Table -->
    <el-card>
      <template #header>
        <div class="d-flex justify-space-between align-center">
          <span>Activity Logs ({{ pagination.total }} total)</span>
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
          prop="user_name"
          label="User"
          width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div>
              <div class="font-weight-medium">{{ row.user_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ row.user_email }}</div>
              <el-tag size="small" :type="getRoleTagType(row.user_position)">
                {{ row.user_position }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="action_type"
          label="Action"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action_type)">
              {{ row.action_type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="module"
          label="Module/Page"
          width="150"
          show-overflow-tooltip
        />

        <el-table-column
          prop="description"
          label="Description"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column
          prop="date_created"
          label="Date & Time"
          width="180"
          sortable
        >
          <template #default="{ row }">
            <div>
              <div class="font-weight-medium">{{ formatDateTime(row.date_created) }}</div>
              <div class="text-caption text-medium-emphasis raw-date" title="Raw database value">
                {{ row.date_created }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="ip_address"
          label="IP Address"
          width="130"
        />

        <el-table-column
          prop="status"
          label="Status"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="Details"
          width="100"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="showLogDetails(row)"
              icon="View"
            >
              View
            </el-button>
          </template>
        </el-table-column>
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

    <!-- Log Details Dialog -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="Log Details"
      width="800px"
      :before-close="handleDialogClose"
    >
      <div v-if="selectedLog" class="log-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="User ID">
            {{ selectedLog.user_id }}
          </el-descriptions-item>
          <el-descriptions-item label="User Name">
            {{ selectedLog.user_name }}
          </el-descriptions-item>
          <el-descriptions-item label="User Email">
            {{ selectedLog.user_email }}
          </el-descriptions-item>
          <el-descriptions-item label="User Position">
            {{ selectedLog.user_position }}
          </el-descriptions-item>
          <el-descriptions-item label="Action Type">
            {{ selectedLog.action_type }}
          </el-descriptions-item>
          <el-descriptions-item label="Module">
            {{ selectedLog.module }}
          </el-descriptions-item>
          <el-descriptions-item label="Description" class="description-item">
            <div class="description-content">
              <pre v-if="isJsonDescription(selectedLog.description)" class="json-description">{{ formatJsonDescription(selectedLog.description) }}</pre>
              <span v-else>{{ selectedLog.description }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="Date Created">
            <div>
              <div class="font-weight-medium">{{ formatDateTime(selectedLog.date_created) }}</div>
              <div class="text-caption text-medium-emphasis">Raw: {{ selectedLog.date_created }}</div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="IP Address">
            {{ selectedLog.ip_address }}
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            {{ selectedLog.status }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedLog.error_message" label="Error Message">
            {{ selectedLog.error_message }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Filter, Refresh, Download, View, Printer, Close } from '@element-plus/icons-vue'
import { useAuditTrailStore } from '@/stores/auditTrailStore'

// Store
const auditTrailStore = useAuditTrailStore()

// Reactive data
const loading = ref(false)
const logs = ref([])
const uniqueUsers = ref([])
const selectedLog = ref(null)
const detailsDialogVisible = ref(false)

// Filters
const filters = ref({
  actionType: '',
  userId: '',
  dateRange: [],
  status: ''
})

// Pagination
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// Action types for filter dropdown
const actionTypes = [
  { label: 'Login', value: 'LOGIN' },
  { label: 'Logout', value: 'LOGOUT' },
  { label: 'View', value: 'VIEW' },
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Restore', value: 'RESTORE' },
  { label: 'Print', value: 'PRINT' },
  { label: 'Export', value: 'EXPORT' }
]

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

    const response = await auditTrailStore.fetchLogs(params)
    logs.value = response.data.logs || []
    pagination.value.total = response.data.pagination?.total || 0

    // Extract unique users for filter dropdown
    if (response.data.uniqueUsers) {
      uniqueUsers.value = response.data.uniqueUsers
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    ElMessage.error('Failed to fetch audit logs')
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
  filters.value = {
    actionType: '',
    userId: '',
    dateRange: [],
    status: ''
  }
  pagination.value.page = 1
  fetchLogs()
}

const exportLogs = async () => {
  try {
    const params = { ...filters.value, export: true }
    Object.keys(params).forEach(key => {
      if (!params[key] || (Array.isArray(params[key]) && params[key].length === 0)) {
        delete params[key]
      }
    })

    const response = await auditTrailStore.exportLogs(params)

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    ElMessage.success('Audit logs exported successfully')
  } catch (error) {
    console.error('Error exporting logs:', error)
    ElMessage.error('Failed to export audit logs')
  }
}

const printLogs = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['User', 'Action', 'Module/Page', 'Description', 'Date & Time', 'IP Address', 'Status']

  // Get current filter information for the header
  const filterInfo = []
  if (filters.value.actionType) filterInfo.push(`Action: ${filters.value.actionType}`)
  if (filters.value.userId) {
    const user = uniqueUsers.value.find(u => u.user_id === filters.value.userId)
    if (user) filterInfo.push(`User: ${user.user_name}`)
  }
  if (filters.value.dateRange && filters.value.dateRange.length === 2) {
    filterInfo.push(`Date Range: ${filters.value.dateRange[0]} to ${filters.value.dateRange[1]}`)
  }
  if (filters.value.status) filterInfo.push(`Status: ${filters.value.status}`)

  const filterText = filterInfo.length > 0 ? `Filters Applied: ${filterInfo.join(', ')}` : 'No filters applied'

  // Get current user info for print footer
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const printedBy = currentUser?.account?.email || currentUser?.account?.name || 'Admin'

  const rows = logs.value.map(log => `
    <tr>
      <td>
        <div><strong>${log.user_name}</strong></div>
        <div style="font-size: 11px; color: #666;">${log.user_email}</div>
        <div style="font-size: 10px; color: #999;">${log.user_position}</div>
      </td>
      <td>${log.action_type}</td>
      <td>${log.module || ''}</td>
      <td>${log.description || ''}</td>
      <td>${formatDateTime(log.date_created)}</td>
      <td>${log.ip_address || ''}</td>
      <td>${log.status}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <html>
      <head>
        <title>Audit Trail - Print</title>
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
          .filters {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          <img src="/logo.png" alt="Watermark" />
        </div>
        <img src="/logo.png" alt="Logo" class="header-logo" />
        <div class="org-name">Bible Baptist Ekklesia of Kawit</div>
        <h1>Audit Trail</h1>
        <p class="subtitle">Activity Logs Report</p>
        <div class="print-info">
          Printed on: ${new Date().toLocaleString()}<br/>
          Printed by: ${printedBy}<br/>
          Total Records: ${pagination.value.total}
        </div>
        <div class="filters">
          <strong>Applied Filters:</strong> ${filterText}
        </div>
        <table>
          <thead>
            <tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7" style="text-align:center">No records found</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 500)
}

const showLogDetails = (log) => {
  selectedLog.value = log
  detailsDialogVisible.value = true
}

const handleDialogClose = () => {
  detailsDialogVisible.value = false
  selectedLog.value = null
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

const getActionTagType = (actionType) => {
  const types = {
    'LOGIN': 'success',
    'LOGOUT': 'info',
    'VIEW': 'primary',
    'CREATE': 'success',
    'UPDATE': 'warning',
    'DELETE': 'danger',
    'RESTORE': 'success',
    'PRINT': 'primary',
    'EXPORT': 'primary'
  }
  return types[actionType] || 'primary'
}

const getRoleTagType = (position) => {
  const types = {
    'admin': 'danger',
    'staff': 'warning',
    'member': 'primary'
  }
  return types[position] || 'primary'
}

const handleCurrentChange = (newPage) => {
  pagination.value.page = newPage
  fetchLogs()
}

const isJsonDescription = (description) => {
  if (!description) return false
  // Check if description contains JSON data (Complete Data: {...})
  return description.includes('Complete Data: {')
}

const formatJsonDescription = (description) => {
  if (!description) return ''
  // Extract and pretty-print the JSON part
  const jsonMatch = description.match(/Complete Data: (\{.*\})$/)
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[1])
      return JSON.stringify(jsonData, null, 2)
    } catch (e) {
      return jsonMatch[1]
    }
  }
  return description
}

// Pagination handlers
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  fetchLogs()
}

// Dialog handlers

// Lifecycle
onMounted(() => {
  fetchLogs()
})

// Watch for filter changes (optional auto-apply)
watch(filters.value, () => {
  // Could auto-apply filters here if desired
}, { deep: true })
</script>

<style scoped>
.audit-trail {
  padding: 20px;
}

.gap-3 {
  gap: 12px;
}

.w-100 {
  width: 100%;
}

.text-break {
  word-break: break-all;
}

.font-weight-medium {
  font-weight: 500;
}

.text-caption {
  font-size: 0.75rem;
  line-height: 1.2;
}

.text-medium-emphasis {
  color: rgba(0, 0, 0, 0.6);
}

/* Dialog styling */
.log-details {
  max-height: 70vh;
  overflow-y: auto;
}

.description-item :deep(.el-descriptions__content) {
  max-width: none;
}

.description-content {
  width: 100%;
  max-width: 100%;
}

.json-description {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
}

/* Ensure dialog doesn't overflow viewport */
:deep(.el-dialog) {
  margin-top: 5vh !important;
  margin-bottom: 5vh !important;
}

:deep(.el-dialog__body) {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}
</style>