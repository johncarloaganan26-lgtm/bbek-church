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
          label="Activity Details"
          min-width="300"
        >
          <template #default="{ row }">
            <div class="description-cell">
              <span class="human-description">{{ getCleanDescription(row.description) }}</span>
              <el-tag 
                v-if="row.description.includes('FAILED ATTEMPT:')" 
                type="danger" 
                size="small" 
                class="ml-2"
              >
                Failed
              </el-tag>
            </div>
          </template>
        </el-table-column>

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
      width="800px"
      :before-close="handleDialogClose"
      class="log-details-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="log-summary">
            <el-icon class="mr-2" :color="getActionColor(selectedLog?.action_type)"><View /></el-icon>
            <span class="module-name">Details for {{ selectedLog?.module || 'Action' }}</span>
          </div>
        </div>
      </template>
      
      <div v-if="selectedLog" class="log-details">
        <!-- Quick Info Row -->
        <el-row :gutter="20" class="quick-info mb-4">
          <el-col :span="8">
            <div class="info-card">
              <el-icon class="info-icon"><User /></el-icon>
              <div class="info-content">
                <div class="info-label">User</div>
                <div class="info-value">{{ selectedLog.user_name }}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-card">
              <el-icon class="info-icon"><Clock /></el-icon>
              <div class="info-content">
                <div class="info-label">Date & Time</div>
                <div class="info-value">{{ formatDateTime(selectedLog.date_created) }}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-card">
              <el-icon class="info-icon"><Location /></el-icon>
              <div class="info-content">
                <div class="info-label">IP Address</div>
                <div class="info-value">{{ selectedLog.ip_address }}</div>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- Detailed Information -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="User ID">
            {{ selectedLog.user_id }}
          </el-descriptions-item>
          <el-descriptions-item label="User Position">
            <el-tag :type="getRoleTagType(selectedLog.user_position)" size="small">
              {{ selectedLog.user_position }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="User Email" :span="2">
            {{ selectedLog.user_email }}
          </el-descriptions-item>
          <el-descriptions-item label="Entity Type">
            {{ selectedLog.entity_type || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Entity ID">
            {{ selectedLog.entity_id || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="selectedLog.status === 'success' ? 'success' : 'danger'">
              {{ selectedLog.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Log ID">
            {{ selectedLog.log_id }}
          </el-descriptions-item>
          <el-descriptions-item label="Description" :span="2">
            <div class="description-wrapper">
              <div v-if="selectedLog.description.includes('FAILED ATTEMPT:')" class="failure-indicator mb-2">
                <el-tag type="danger" effect="dark" size="small">
                  <el-icon><Warning /></el-icon> FAILED ATTEMPT
                </el-tag>
              </div>

              <div class="description-header mb-2">
                <span class="plain-description">{{ parsedDescription.text }}</span>
              </div>

              <div class="description-toolbar mt-2">
                <el-button-group>
                  <el-button 
                    :type="!showRawDescription ? 'primary' : 'default'" 
                    size="small"
                    @click="showRawDescription = false"
                  >
                    <el-icon><Document /></el-icon> Structured
                  </el-button>
                  <el-button 
                    :type="showRawDescription ? 'primary' : 'default'" 
                    size="small"
                    @click="showRawDescription = true"
                  >
                    <el-icon><DocumentCopy /></el-icon> Raw
                  </el-button>
                </el-button-group>
                <el-button 
                  type="primary" 
                  size="small"
                  variant="text"
                  @click="copyDescription"
                  :icon="CopyDocument"
                >
                  Copy
                </el-button>
              </div>

              <div class="description-content">
                <pre v-if="showRawDescription" class="raw-description">{{ selectedLog.description }}</pre>
                <div v-else class="structured-content">
                  <!-- Update Diff View -->
                  <div v-if="parsedDescription.type === 'update'" class="diff-view">
                    <div class="section-label mb-2">Changes Detected:</div>
                    <el-table :data="parsedDescription.diff" border size="small" stripe class="diff-table">
                      <el-table-column prop="field" label="Field" width="150" font-weight="bold">
                        <template #default="{ row }">
                          <code class="field-name">{{ row.field }}</code>
                        </template>
                      </el-table-column>
                      <el-table-column label="From" class-name="old-value-col">
                        <template #default="{ row }">
                          <span class="old-value">{{ row.old || '—' }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="To" class-name="new-value-col">
                        <template #default="{ row }">
                          <span class="new-value">{{ row.new || '—' }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>

                  <!-- Data View -->
                  <div v-else-if="parsedDescription.type === 'data'" class="data-view">
                    <div class="section-label mb-2">{{ parsedDescription.label }}:</div>
                    <pre class="json-description">{{ formatJson(parsedDescription.data) }}</pre>
                  </div>

                  <!-- Fallback to formatted JSON if plain string contains JSON -->
                  <div v-else-if="isJsonDescription(selectedLog.description)" class="data-view">
                    <pre class="json-description">{{ formatJsonDescription(selectedLog.description) }}</pre>
                  </div>
                  
                  <!-- Plain fallback -->
                  <div v-else-if="!parsedDescription.text.includes(selectedLog.description)" class="plain-data-fallback mt-2">
                    <span class="text-caption text-grey">Additional info exists in raw view.</span>
                  </div>
                </div>
              </div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedLog.error_message" label="Error Message" :span="2">
            <div class="error-message">
              <el-alert
                :title="selectedLog.error_message"
                type="error"
                :closable="false"
                show-icon
              />
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- Raw Database Value -->
        <div class="raw-data-section mt-4">
          <el-collapse>
            <el-collapse-item title="Raw Database Values" name="raw">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="date_created">
                  <code>{{ selectedLog.date_created }}</code>
                </el-descriptions-item>
                <el-descriptions-item label="user_id">
                  <code>{{ selectedLog.user_id }}</code>
                </el-descriptions-item>
                <el-descriptions-item label="entity_id">
                  <code>{{ selectedLog.entity_id }}</code>
                </el-descriptions-item>
              </el-descriptions>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogClose" icon="Close">Close</el-button>
          <el-button type="primary" @click="copyAllDetails" icon="CopyDocument">
            Copy All Details
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Filter, Refresh, Download, View, Printer, Close, CopyDocument, User, Clock, Location, Document, DocumentCopy, Warning } from '@element-plus/icons-vue'
import { useAuditTrailStore } from '@/stores/auditTrailStore'

// Store
const auditTrailStore = useAuditTrailStore()

// Reactive data
const loading = ref(false)
const logs = ref([])
const uniqueUsers = ref([])
const selectedLog = ref(null)
const detailsDialogVisible = ref(false)
const showRawDescription = ref(false)

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
  const tableHeaders = ['#', 'User', 'Action', 'Module/Page', 'Description', 'Date & Time', 'IP Address', 'Status']

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
      <td style="text-align: center;"><input type="checkbox" /></td>
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
          .church-header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
          }
          .church-header img {
            width: 50px;
            height: 50px;
            margin-right: 15px;
          }
          .org-name { 
            text-align: center; 
            color: #1a365d; 
            font-weight: bold; 
            font-size: 18px;
            margin-bottom: 10px;
          }
          .report-title {
            text-align: center;
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
            font-weight: bold;
          }
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
        <div class="church-header">
          <img src="/logo.png" alt="Church Logo" />
          <div class="org-name">Bible Baptist Ekklesia of Kawit</div>
        </div>
        <div class="report-title">Activity Logs Report</div>
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

const showLogDetails = (log) => {
  selectedLog.value = log
  detailsDialogVisible.value = true
}

const handleDialogClose = () => {
  detailsDialogVisible.value = false
  selectedLog.value = null
  showRawDescription.value = false
}

const copyDescription = async () => {
  if (!selectedLog.value?.description) return
  
  try {
    await navigator.clipboard.writeText(selectedLog.value.description)
    ElMessage.success('Description copied to clipboard')
  } catch (error) {
    ElMessage.error('Failed to copy description')
  }
}

const copyAllDetails = async () => {
  if (!selectedLog.value) return
  
  const details = `
Audit Trail Log Details
=======================
Log ID: ${selectedLog.value.log_id}
Date: ${formatDateTime(selectedLog.value.date_created)}
Raw Date: ${selectedLog.value.date_created}

User Information:
- User ID: ${selectedLog.value.user_id}
- User Name: ${selectedLog.value.user_name}
- User Email: ${selectedLog.value.user_email}
- User Position: ${selectedLog.value.user_position}

Action Details:
- Action Type: ${selectedLog.value.action_type}
- Module: ${selectedLog.value.module}
- Entity Type: ${selectedLog.value.entity_type || 'N/A'}
- Entity ID: ${selectedLog.value.entity_id || 'N/A'}
- Status: ${selectedLog.value.status}
- IP Address: ${selectedLog.value.ip_address}

Description:
${selectedLog.value.description}

${selectedLog.value.error_message ? `Error Message:
${selectedLog.value.error_message}` : ''}
  `.trim()
  
  try {
    await navigator.clipboard.writeText(details)
    ElMessage.success('All details copied to clipboard')
  } catch (error) {
    ElMessage.error('Failed to copy details')
  }
}

const getCleanDescription = (description) => {
  if (!description) return ''
  // Remove "FAILED ATTEMPT: " if present
  let clean = description.replace('FAILED ATTEMPT: ', '')
  // Split at " - Record Data", " - Complete Data", " - Before:", etc.
  const splitters = [' - Record Data:', ' - Complete Data:', ' - Before:', ' - Updated Data:', ' - Removed Data:']
  for (const s of splitters) {
    if (clean.includes(s)) {
      clean = clean.split(s)[0]
    }
  }
  return clean.trim()
}

const getActionColor = (type) => {
  const colors = {
    'CREATE': '#67c23a',
    'UPDATE': '#409eff',
    'DELETE': '#f56c6c',
    'VIEW': '#909399',
    'LOGIN': '#e6a23c',
    'LOGOUT': '#909399'
  }
  return colors[type] || '#409eff'
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
  return description.includes('Complete Data: {') || 
         description.includes('Updated Data: {') || 
         description.includes('Before: {')
}

const formatJsonDescription = (description) => {
  if (!description) return ''
  const jsonMatch = description.match(/(?:Complete Data|Updated Data|record): (\{.*\})$/) || 
                    description.match(/Before: (\{.*\})/)
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

const formatJson = (obj) => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return String(obj)
  }
}

const parsedDescription = computed(() => {
  const description = selectedLog.value?.description
  if (!description) return { text: '', type: 'plain' }

  // 1. Check for update diff pattern
  const updateMatch = description.match(/Before: (\{.*\}) \| After: (\{.*\})$/)
  if (updateMatch) {
    try {
      const before = JSON.parse(updateMatch[1])
      const after = JSON.parse(updateMatch[2])
      const text = description.split(' - Before:')[0].replace('FAILED ATTEMPT: ', '')
      
      // Calculate diff
      const diff = []
      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
      
      allKeys.forEach(key => {
        // Skip some system fields
        if (['created_at', 'updated_at', 'id', 'date_created'].includes(key)) return
        
        const oldVal = before[key]
        const newVal = after[key]
        
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          diff.push({
            field: key.split('_').map(word => word.charAt(0)).join('').toUpperCase() === key ? key : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            old: oldVal,
            new: newVal
          })
        }
      })

      return { text, type: 'update', diff }
    } catch (e) {
      console.error('Error parsing update diff:', e)
    }
  }

  // 2. Check for single JSON block patterns
  const patterns = [
    { label: 'Complete Data', regex: /Complete Data: (\{.*\})$/ },
    { label: 'Updated Data', regex: /Updated Data: (\{.*\})$/ },
    { label: 'Record Data', regex: /record: (\{.*\})$/ }
  ]

  for (const p of patterns) {
    const match = description.match(p.regex)
    if (match) {
      try {
        const data = JSON.parse(match[1])
        const text = description.split(new RegExp(` - ${p.label}|: ${p.label}`))[0].replace('FAILED ATTEMPT: ', '')
        return { text, type: 'data', data, label: p.label }
      } catch (e) {}
    }
  }

  // Clean text for plain display
  const cleanText = description.replace('FAILED ATTEMPT: ', '')
  return { text: cleanText, type: 'plain' }
})

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

.log-details-dialog {
  border-radius: 12px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.log-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.module-name {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.quick-info {
  margin-bottom: 20px;
}

.info-card {
  display: flex;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.info-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 12px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  word-break: break-all;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Descriptions Layout */
.description-cell {
  line-height: 1.4;
}

.human-description {
  font-weight: 500;
  color: #303133;
}

.section-label {
  font-weight: 600;
  font-size: 13px;
  color: #606266;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.failure-indicator {
  display: inline-block;
}

.description-header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.plain-description {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
}

.structured-content {
  margin-top: 8px;
}

.diff-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.field-name {
  color: #409eff;
  background-color: #f0f9eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}

.old-value {
  color: #f56c6c;
  text-decoration: line-through;
  font-size: 13px;
}

.new-value {
  color: #67c23a;
  font-weight: 600;
  font-size: 13px;
}

.old-value-col {
  background-color: #fff5f5 !important;
}

.new-value-col {
  background-color: #f0f9eb !important;
}

.json-description {
  background-color: #f8f9fa;
  border: 1px solid #e4e7ed;
  color: #303133;
  border-radius: 4px;
  padding: 12px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.raw-description {
  background-color: #2b2b2b;
  color: #a9b7c6;
  padding: 15px;
  border-radius: 8px;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.raw-date {
  font-family: monospace;
  opacity: 0.7;
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