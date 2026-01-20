<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>Settings</h1>
      <p class="page-subtitle">Manage system announcements for users</p>
    </div>

    <!-- Summary Cards -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card">
          <div class="card-content">
            <el-icon :size="40" color="#409EFF" class="card-icon">
              <Bell />
            </el-icon>
            <div class="card-info">
              <div class="card-label">Total Announcements</div>
              <div class="card-value">{{ summaryStats?.total_count || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card">
          <div class="card-content">
            <el-icon :size="40" color="#67C23A" class="card-icon">
              <CircleCheck />
            </el-icon>
            <div class="card-info">
              <div class="card-label">Active</div>
              <div class="card-value">{{ summaryStats?.active_count || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card">
          <div class="card-content">
            <el-icon :size="40" color="#E6A23C" class="card-icon">
              <Warning />
            </el-icon>
            <div class="card-info">
              <div class="card-label">Urgent</div>
              <div class="card-value">{{ summaryStats?.urgent_count || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card">
          <div class="card-content">
            <el-icon :size="40" color="#909399" class="card-icon">
              <User />
            </el-icon>
            <div class="card-info">
              <div class="card-label">All Audience</div>
              <div class="card-value">{{ summaryStats?.all_audience_count || 0 }}</div>
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
            placeholder="Search by title, content..."
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
        <el-form-item label="Type">
          <el-select
            v-model="filters.type"
            placeholder="Select type"
            @change="handleFilterChange"
            :disabled="loading"
            clearable
            style="width: 150px"
          >
            <el-option label="All Types" value="All Types" />
            <el-option label="Info" value="info" />
            <el-option label="Success" value="success" />
            <el-option label="Warning" value="warning" />
            <el-option label="Error" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="Priority">
          <el-select
            v-model="filters.priority"
            placeholder="Select priority"
            @change="handleFilterChange"
            :disabled="loading"
            clearable
            style="width: 180px"
          >
            <el-option label="All Priorities" value="All Priorities" />
            <el-option label="Low" value="low" />
            <el-option label="Normal" value="normal" />
            <el-option label="High" value="high" />
            <el-option label="Urgent" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="Status">
          <el-select
            v-model="filters.is_active"
            placeholder="Select status"
            @change="handleFilterChange"
            :disabled="loading"
            clearable
            style="width: 150px"
          >
            <el-option label="All" :value="null" />
            <el-option label="Active" :value="true" />
            <el-option label="Inactive" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="Date Range">
          <el-date-picker
            v-model="dateRangeValue"
            type="daterange"
            start-placeholder="Start date"
            end-placeholder="End date"
            range-separator="to"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled="loading"
            @change="handleDateRangeChange"
            style="width: 250px"
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
            <el-option label="Title (A-Z)" value="Title (A-Z)" />
            <el-option label="Priority (High to Low)" value="Priority (High to Low)" />
            <el-option label="Date Range (Newest)" value="Date Range (Newest)" />
            <el-option label="Date Range (Oldest)" value="Date Range (Oldest)" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Bulk Actions Row -->
    <el-alert
      v-if="selectedAnnouncements.length > 0"
      title=""
      :description="`${selectedAnnouncements.length} announcement${selectedAnnouncements.length > 1 ? 's' : ''} selected`"
      type="info"
      show-icon
      class="mb-4"
      :closable="false"
    >
      <template #title>
        <div class="d-flex justify-content-between align-items-center">
          <span>{{ selectedAnnouncements.length }} announcement{{ selectedAnnouncements.length > 1 ? 's' : '' }} selected</span>
          <div>
            <el-button
              type="danger"
              size="small"
              :disabled="loading"
              @click="bulkDeleteAnnouncements"
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

    <!-- Announcements Table -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Announcements</span>
          <div class="header-actions">
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleAnnouncementDialog"
              :disabled="loading"
            >
              Create Announcement
            </el-button>
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
              :icon="Refresh"
              circle
              @click="fetchAnnouncements"
              :loading="loading"
              :disabled="loading"
            />
          </div>
        </div>
      </template>

      <!-- Table -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="announcements"
          stripe
          style="width: 100%"
          empty-text="No announcements found"
          table-layout="auto"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="Title" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="Type" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type" size="small">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="Priority" width="120">
            <template #default="{ row }">
              <el-tag
                :type="getPriorityColor(row.priority)"
                size="small"
              >
                {{ row.priority }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="is_active" label="Status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
                {{ row.is_active ? 'Active' : 'Inactive' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="members_only" label="Audience" width="120">
            <template #default="{ row }">
              <el-tag :type="row.members_only ? 'warning' : 'success'" size="small">
                {{ row.members_only ? 'Members Only' : 'All Users' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="Created Date" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_by_name" label="Created By" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.created_by_name || row.created_by_email || 'System' }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                :icon="View"
                circle
                size="small"
                @click="viewDetails(row)"
                type="primary"
                text
              />
              <el-button
                :icon="Edit"
                circle
                size="small"
                @click="editAnnouncement(row)"
                type="warning"
                text
              />
              <el-button
                :icon="Delete"
                circle
                size="small"
                @click="handleDelete(row)"
                :disabled="loading"
                type="danger"
                text
              />
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

    <!-- Announcement Dialog -->
    <AnnouncementDialog
      v-model="announcementDialog"
      :announcement-data="selectedAnnouncement"
      @submit="handleSubmit"
    />

    <!-- Details Dialog -->
    <el-dialog
      v-model="detailsDialog"
      title="Announcement Details"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedAnnouncement" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Title" :span="2">
            {{ selectedAnnouncement.title }}
          </el-descriptions-item>
          <el-descriptions-item label="Content" :span="2">
            <div class="content-text">{{ selectedAnnouncement.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="Type">
            <el-tag :type="selectedAnnouncement.type" size="small">
              {{ selectedAnnouncement.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Priority">
            <el-tag :type="getPriorityColor(selectedAnnouncement.priority)" size="small">
              {{ selectedAnnouncement.priority }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="selectedAnnouncement.is_active ? 'success' : 'info'" size="small">
              {{ selectedAnnouncement.is_active ? 'Active' : 'Inactive' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Audience">
            <el-tag :type="selectedAnnouncement.members_only ? 'warning' : 'success'" size="small">
              {{ selectedAnnouncement.members_only ? 'Members Only' : 'All Users' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Start Date" v-if="selectedAnnouncement.start_date">
            {{ formatDateTime(selectedAnnouncement.start_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="End Date" v-if="selectedAnnouncement.end_date">
            {{ formatDateTime(selectedAnnouncement.end_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="Created Date">
            {{ formatDateTime(selectedAnnouncement.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="Created By">
            {{ selectedAnnouncement.created_by_name || selectedAnnouncement.created_by_email || 'System' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailsDialog = false">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  CircleCheck,
  Warning,
  User,
  Search,
  Plus,
  Refresh,
  View,
  Edit,
  Delete,
  Close,
  Download,
  Printer
} from '@element-plus/icons-vue'
import AnnouncementDialog from '@/components/Dialogs/AnnouncementDialog.vue'

const announcementStore = useAnnouncementStore()

// Selection state
const selectedAnnouncements = ref([])

// Computed properties
const announcements = computed(() => announcementStore.announcements)
const loading = computed(() => announcementStore.loading)
const searchQuery = computed({
  get: () => announcementStore.searchQuery,
  set: (value) => announcementStore.setSearchQuery(value)
})
const filters = computed({
  get: () => announcementStore.filters,
  set: (value) => announcementStore.setFilters(value)
})
const currentPage = computed({
  get: () => announcementStore.currentPage,
  set: (value) => announcementStore.setCurrentPage(value)
})
const totalPages = computed(() => announcementStore.totalPages)
const totalCount = computed(() => announcementStore.totalCount)
const itemsPerPage = computed({
  get: () => announcementStore.itemsPerPage,
  set: (value) => announcementStore.setPageSize(value)
})
const pageSizeOptions = computed(() => announcementStore.pageSizeOptions)
const summaryStats = computed(() => announcementStore.summaryStats)

// Local state
const announcementDialog = ref(false)
const selectedAnnouncement = ref(null)
const detailsDialog = ref(false)
const sortBy = computed({
  get: () => announcementStore.filters.sortBy || 'Date (Newest)',
  set: (value) => announcementStore.setFilters({ sortBy: value })
})
const dateRangeValue = computed({
  get: () => announcementStore.filters.dateRange || [],
  set: (value) => announcementStore.setFilters({ dateRange: value })
})

// Methods
const fetchAnnouncements = async () => {
  await announcementStore.fetchAnnouncements()
}

const fetchSummaryStats = async () => {
  await announcementStore.fetchSummaryStats()
}

const handleSearch = () => {
  // Clear previous timeout
  if (window.settingsSearchTimeout) {
    clearTimeout(window.settingsSearchTimeout)
  }

  // Set new timeout to trigger search after user stops typing (500ms delay)
  window.settingsSearchTimeout = setTimeout(() => {
    fetchAnnouncements()
  }, 500)
}

const handleFilterChange = () => {
  fetchAnnouncements()
}

const handleDateRangeChange = (value) => {
  announcementStore.setFilters({ dateRange: value })
  fetchAnnouncements()
}

const handlePageChange = (page) => {
  announcementStore.setCurrentPage(page)
  fetchAnnouncements()
}

const handlePageSizeChange = () => {
  fetchAnnouncements()
}

const resetFilters = () => {
  announcementStore.resetFilters()
  fetchAnnouncements()
}

const handleAnnouncementDialog = () => {
  selectedAnnouncement.value = null
  announcementDialog.value = true
}

const editAnnouncement = (announcement) => {
  selectedAnnouncement.value = { ...announcement }
  announcementDialog.value = true
}

const viewDetails = (announcement) => {
  selectedAnnouncement.value = announcement
  detailsDialog.value = true
}

const handleSubmit = async () => {
  await fetchAnnouncements()
  await fetchSummaryStats()
  announcementDialog.value = false
  selectedAnnouncement.value = null
}

const handleDelete = async (announcement) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the announcement "${announcement.title}"?`,
      'Delete Announcement',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    await announcementStore.deleteAnnouncement(announcement.announcement_id)
    ElMessage.success('Announcement deleted successfully')
    await fetchAnnouncements()
    await fetchSummaryStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || 'Failed to delete announcement')
    }
  }
}

// Selection methods
const handleSelectionChange = (selection) => {
  selectedAnnouncements.value = selection
}

const clearSelection = () => {
  selectedAnnouncements.value = []
}

const bulkDeleteAnnouncements = async () => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete ${selectedAnnouncements.value.length} selected announcement${selectedAnnouncements.value.length > 1 ? 's' : ''}?`,
      'Bulk Delete Announcements',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const deletePromises = selectedAnnouncements.value.map(announcement =>
      announcementStore.deleteAnnouncement(announcement.announcement_id)
    )

    const results = await Promise.allSettled(deletePromises)
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.length - successful

    if (successful > 0) {
      ElMessage.success(`Successfully deleted ${successful} announcement${successful > 1 ? 's' : ''}`)
    }

    if (failed > 0) {
      ElMessage.warning(`Failed to delete ${failed} announcement${failed > 1 ? 's' : ''}`)
    }

    clearSelection()
    await fetchAnnouncements()
    await fetchSummaryStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error bulk deleting announcements:', error)
      ElMessage.error('Failed to delete selected announcements')
    }
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatAudience = (audience) => {
  try {
    // Handle JSON array format
    if (typeof audience === 'string' && audience.startsWith('[')) {
      const audienceArray = JSON.parse(audience);
      if (Array.isArray(audienceArray)) {
        return audienceArray
          .map(item => {
            if (item === 'staff') return 'Staff';
            return item.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          })
          .join(', ');
      }
    }
    // Fallback for old string format
    if (audience === 'staff') return 'Staff';
    return audience
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch (error) {
    return audience || 'All Users';
  }
}

const getPriorityColor = (priority) => {
  const colorMap = {
    urgent: 'danger',
    high: 'warning',
    normal: 'info',
    low: ''
  }
  return colorMap[priority] || 'info'
}

const exportToCSV = () => {
  const headers = ['Title', 'Type', 'Priority', 'Status', 'Audience', 'Created Date', 'Created By']
  const rows = announcements.value.map(announcement => [
    announcement.title,
    announcement.type,
    announcement.priority,
    announcement.is_active ? 'Active' : 'Inactive',
    announcement.members_only ? 'Members Only' : 'All Users',
    formatDateTime(announcement.created_at),
    announcement.created_by_name || announcement.created_by_email || 'System'
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `announcements_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('Announcements exported successfully')
}

const printData = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Title', 'Type', 'Priority', 'Status', 'Audience', 'Created Date']

  // Get current user info for print footer
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const printedBy = currentUser.email || currentUser.name || 'Admin'

  const rows = announcements.value.map(announcement => `
    <tr>
      <td>${announcement.title}</td>
      <td>${announcement.type}</td>
      <td>${announcement.priority}</td>
      <td>${announcement.is_active ? 'Active' : 'Inactive'}</td>
      <td>${announcement.members_only ? 'Members Only' : 'All Users'}</td>
      <td>${formatDateTime(announcement.created_at)}</td>
    </tr>
  `).join('')
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Announcements - Print</title>
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
        <h1>Announcements</h1>
        <p class="subtitle">System Announcements Report</p>
        <div class="print-info">
          Printed on: ${new Date().toLocaleString()}<br/>
          Printed by: ${printedBy}
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

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchAnnouncements(),
    fetchSummaryStats()
  ])
})

// Cleanup timeout on unmount
onUnmounted(() => {
  if (window.settingsSearchTimeout) {
    clearTimeout(window.settingsSearchTimeout)
  }
})
</script>

<style scoped>
.settings-page {
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

.content-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background: #F5F7FA;
  border-radius: 4px;
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

