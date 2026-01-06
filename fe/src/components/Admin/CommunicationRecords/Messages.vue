<template>
  <div class="messages">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">Messages & Prayer Requests</h1>
    </div>

    <!-- Search and Filter Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search messages..."
              variant="outlined"
              density="compact"
              hide-details
              @input="debouncedSearch"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Filter by Status"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="fetchForms"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="formTypeFilter"
              :items="formTypeOptions"
              label="Filter by Type"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="fetchForms"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="sortBy"
              :items="sortByOptions"
              label="Sort By"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="fetchForms"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center gap-2">
            <v-tooltip text="Export CSV" location="top">
              <template v-slot:activator="{ props }">
                <v-btn 
                  icon="mdi-file-export"
                  variant="outlined"
                  v-bind="props"
                  @click="exportToCSV"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Print" location="top">
              <template v-slot:activator="{ props }">
                <v-btn 
                  icon="mdi-printer"
                  variant="outlined"
                  v-bind="props"
                  @click="printData"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Refresh" location="top">
              <template v-slot:activator="{ props }">
                <v-btn 
                  icon="mdi-refresh"
                  variant="outlined"
                  v-bind="props"
                  :loading="loading"
                  @click="fetchForms"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Messages Table -->
    <v-card elevation="2">
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Name</th>
            <th class="text-left font-weight-bold">Email</th>
            <th class="text-left font-weight-bold">Type</th>
            <th class="text-left font-weight-bold">Subject/Details</th>
            <th class="text-left font-weight-bold">Date</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="text-center py-12">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </td>
          </tr>
          <tr v-else-if="forms.length === 0">
            <td colspan="7" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="form in forms" :key="form.form_id">
            <td>{{ form.name || form.submitted_by_name || 'Anonymous' }}</td>
            <td>{{ form.email || form.submitted_by_email || '-' }}</td>
            <td>
              <v-chip :color="getCategoryColor(form.form_type)" size="small">
                {{ getFormTypeLabel(form.form_type) }}
              </v-chip>
            </td>
            <td>
              <div v-if="form.form_type === 'prayer_request'">
                {{ truncateText(form.form_data?.request || '', 50) }}
              </div>
              <div v-else-if="form.form_type === 'schedule_change'">
                {{ getFormTypeLabel(form.form_data?.serviceType) }}: 
                {{ formatDate(form.form_data?.originalDate) }} → 
                {{ formatDate(form.form_data?.requestedDate) }}
              </div>
              <div v-else>-</div>
            </td>
            <td>{{ formatDate(form.created_at) }}</td>
            <td>
              <v-chip :color="getStatusColor(form.status)" size="small">
                {{ formatStatus(form.status) }}
              </v-chip>
            </td>
            <td>
              <v-btn
                icon="mdi-eye"
                variant="text"
                size="small"
                class="mr-2"
                @click="viewForm(form)"
              ></v-btn>
              <v-btn
                v-if="form.status === 'pending'"
                icon="mdi-check"
                variant="text"
                size="small"
                color="success"
                class="mr-2"
                @click="approveForm(form.form_id)"
                :loading="approvingId === form.form_id"
              ></v-btn>
              <v-btn
                v-if="form.status === 'pending'"
                icon="mdi-close"
                variant="text"
                size="small"
                color="error"
                @click="rejectForm(form.form_id)"
                :loading="rejectingId === form.form_id"
              ></v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Pagination -->
      <div class="d-flex justify-center align-center pa-4">
          <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="compact"
        ></v-pagination>
        <span class="ml-4 text-body-2">{{ currentPage }} of {{ totalPages }}</span>
      </div>
    </v-card>

    <!-- View Form Dialog -->
    <v-dialog v-model="showViewDialog" max-width="600">
      <v-card v-if="selectedForm">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Form Details</span>
          <v-btn icon="mdi-close" variant="text" @click="showViewDialog = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <strong>Type:</strong> {{ getFormTypeLabel(selectedForm.form_type) }}
            </v-col>
            <v-col cols="12">
              <strong>Name:</strong> {{ selectedForm.name || selectedForm.submitted_by_name || 'Anonymous' }}
            </v-col>
            <v-col cols="12">
              <strong>Email:</strong> {{ selectedForm.email || selectedForm.submitted_by_email || '-' }}
            </v-col>
            <v-col cols="12" v-if="selectedForm.phone">
              <strong>Phone:</strong> {{ selectedForm.phone }}
            </v-col>
            <v-col cols="12">
              <strong>Status:</strong> 
              <v-chip :color="getStatusColor(selectedForm.status)" size="small" class="ml-2">
                {{ formatStatus(selectedForm.status) }}
              </v-chip>
            </v-col>
            <v-col cols="12" v-if="selectedForm.form_type === 'prayer_request'">
              <strong>Prayer Request:</strong>
              <p class="mt-2">{{ selectedForm.form_data?.request }}</p>
            </v-col>
            <v-col cols="12" v-if="selectedForm.form_type === 'schedule_change'">
              <strong>Service Type:</strong> {{ getFormTypeLabel(selectedForm.form_data?.serviceType) }}
            </v-col>
            <v-col cols="12" v-if="selectedForm.form_type === 'schedule_change'">
              <strong>Original Date:</strong> {{ formatDate(selectedForm.form_data?.originalDate) }}
            </v-col>
            <v-col cols="12" v-if="selectedForm.form_type === 'schedule_change'">
              <strong>Requested Date:</strong> {{ formatDate(selectedForm.form_data?.requestedDate) }}
            </v-col>
            <v-col cols="12" v-if="selectedForm.form_type === 'schedule_change'">
              <strong>Reason:</strong>
              <p class="mt-2">{{ selectedForm.form_data?.reason }}</p>
            </v-col>
            <v-col cols="12" v-if="selectedForm.admin_notes">
              <strong>Admin Notes:</strong>
              <p class="mt-2">{{ selectedForm.admin_notes }}</p>
            </v-col>
            <v-col cols="12">
              <strong>Submitted:</strong> {{ formatDate(selectedForm.created_at) }}
            </v-col>
            <v-col cols="12" v-if="selectedForm.reviewed_at">
              <strong>Reviewed:</strong> {{ formatDate(selectedForm.reviewed_at) }} 
              by {{ selectedForm.reviewed_by_name || '-' }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions v-if="selectedForm.status === 'pending'">
          <v-spacer></v-spacer>
          <v-btn color="error" @click="rejectForm(selectedForm.form_id)" :loading="rejectingId === selectedForm.form_id">
            Reject
          </v-btn>
          <v-btn color="success" @click="approveForm(selectedForm.form_id)" :loading="approvingId === selectedForm.form_id">
            Approve
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFormsStore } from '@/stores/formsStore'

const formsStore = useFormsStore()

const searchQuery = computed({
  get: () => formsStore.searchQuery,
  set: (value) => formsStore.setSearchQuery(value)
})

const statusFilter = computed({
  get: () => formsStore.filters.status,
  set: (value) => formsStore.setFilters({ status: value })
})

const formTypeFilter = computed({
  get: () => formsStore.filters.form_type,
  set: (value) => formsStore.setFilters({ form_type: value })
})

const loading = computed(() => formsStore.loading)
const forms = computed(() => formsStore.forms)
const currentPage = computed({
  get: () => formsStore.currentPage,
  set: (value) => formsStore.setCurrentPage(value)
})
const totalPages = computed(() => formsStore.totalPages)
const pageSize = computed({
  get: () => formsStore.itemsPerPage,
  set: (value) => formsStore.setPageSize(value)
})

const approvingId = ref(null)
const rejectingId = ref(null)
const showViewDialog = ref(false)
const selectedForm = computed(() => formsStore.selectedForm)
const sortBy = ref(null)

const sortByOptions = [
  'Date (Newest)',
  'Date (Oldest)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Status (A-Z)',
  'Type (A-Z)',
  'Name (A-Z)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Approved', value: 'approved' },
  { title: 'Rejected', value: 'rejected' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' }
]

const formTypeOptions = [
  { title: 'Prayer Request', value: 'prayer_request' },
  { title: 'Schedule Change', value: 'schedule_change' }
]

let searchTimeout = null

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    fetchForms()
  }, 500)
}

const fetchForms = async () => {
  try {
    await formsStore.fetchForms({
      search: searchQuery.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      status: statusFilter.value,
      form_type: formTypeFilter.value,
      sortBy: sortBy.value
    })
  } catch (error) {
    // Error is already handled in the store
    console.error('Error fetching forms:', error)
  }
}

const viewForm = async (form) => {
  try {
    await formsStore.fetchFormById(form.form_id)
    showViewDialog.value = true
  } catch (error) {
    // Error is already handled in the store
    console.error('Error fetching form details:', error)
  }
}

const approveForm = async (formId) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to approve this form? For schedule changes, this will update the service date.',
      'Approve Form',
      {
        confirmButtonText: 'Approve',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    approvingId.value = formId
    await formsStore.approveForm(formId)
    ElMessage.success('Form approved successfully')
    await fetchForms()
  } catch (error) {
    if (error !== 'cancel') {
      // Error message is already shown by the store/axios interceptor
      console.error('Error approving form:', error)
    }
  } finally {
    approvingId.value = null
  }
}

const rejectForm = async (formId) => {
  try {
    const { value: notes } = await ElMessageBox.prompt(
      'Please provide a reason for rejection (optional):',
      'Reject Form',
      {
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        inputType: 'textarea',
        inputPlaceholder: 'Reason for rejection...'
      }
    )

    rejectingId.value = formId
    await formsStore.rejectForm(formId, notes || null)
    ElMessage.success('Form rejected successfully')
    await fetchForms()
  } catch (error) {
    if (error !== 'cancel') {
      // Error message is already shown by the store/axios interceptor
      console.error('Error rejecting form:', error)
    }
  } finally {
    rejectingId.value = null
  }
}

// Watch for filter changes and refetch
watch([statusFilter, formTypeFilter, sortBy], () => {
  fetchForms()
})

const getCategoryColor = (formType) => {
  const colors = {
    'prayer_request': 'purple',
    'schedule_change': 'blue'
  }
  return colors[formType] || 'grey'
}

const getFormTypeLabel = (formType) => {
  const labels = {
    'prayer_request': 'Prayer Request',
    'schedule_change': 'Schedule Change',
    'water-baptism': 'Water Baptism',
    'marriage': 'Marriage Ceremony',
    'burial': 'Burial Service',
    'child-dedication': 'Child Dedication'
  }
  return labels[formType] || formType
}

const getStatusColor = (status) => {
  const colors = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'error',
    'completed': 'info',
    'cancelled': 'grey'
  }
  return colors[status] || 'default'
}

const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const truncateText = (text, length) => {
  if (!text) return '-'
  return text.length > length ? text.substring(0, length) + '...' : text
}

const exportToCSV = () => {
  const headers = ['Name', 'Email', 'Type', 'Subject/Details', 'Date', 'Status']
  const rows = forms.value.map(form => [
    form.name || form.submitted_by_name || 'Anonymous',
    form.email || form.submitted_by_email || '-',
    getFormTypeLabel(form.form_type),
    form.form_data?.request || form.form_data?.serviceType || '-',
    formatDate(form.created_at),
    formatStatus(form.status)
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `messages_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('Messages exported successfully')
}

const printData = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Name', 'Email', 'Type', 'Subject/Details', 'Date', 'Status']
  
  const rows = forms.value.map(form => `
    <tr>
      <td>${form.name || form.submitted_by_name || 'Anonymous'}</td>
      <td>${form.email || form.submitted_by_email || '-'}</td>
      <td>${getFormTypeLabel(form.form_type)}</td>
      <td>${form.form_data?.request || form.form_data?.serviceType || '-'}</td>
      <td>${formatDate(form.created_at)}</td>
      <td>${formatStatus(form.status)}</td>
    </tr>
  `).join('')
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Messages & Prayer Requests - Print</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1a365d; text-align: center; }
          .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1a365d; color: white; }
          .print-date { text-align: right; color: #666; font-size: 12px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
        <h1>Messages & Prayer Requests</h1>
        <p class="subtitle">Bible Baptist Ekklesia of Kawit</p>
        <table>
          <thead>
            <tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" style="text-align:center">No records found</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 500)
}

// Watch for page changes
watch(currentPage, () => {
  fetchForms()
})

onMounted(() => {
  fetchForms()
})
</script>

<style scoped>
.messages {
  padding: 24px;
}
</style>

