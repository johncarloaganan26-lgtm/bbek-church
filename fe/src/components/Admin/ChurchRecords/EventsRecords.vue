<template>
  <div class="events-records">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Church Events</h1>
      <v-btn 
        color="success" 
        prepend-icon="mdi-calendar-plus" 
        size="small" 
        :disabled="loading"
        :loading="loading"
        @click="handleEventRecordsDialog"
      >
        Create New Event
      </v-btn>
    </div>

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search events..."
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleSearchChange"
            ></v-text-field>
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
              @update:model-value="handleFilterChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.type"
              :items="typeOptions"
              label="Type"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleFilterChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <el-date-picker
              v-model="localDateRange"
              type="daterange"
              start-placeholder="Start date"
              end-placeholder="End date"
              range-separator="to"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled="loading"
              @change="handleDateRangeChange"
              style="width: 100%;"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="itemsPerPage"
              :items="pageSizeOptions"
              label="Items per page"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              style="max-width: 150px;"
              @update:model-value="handlePageSizeChange"
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
        <v-row>
          <v-col cols="12" class="d-flex align-center">
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} events</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading events..." class="position-relative">
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Event Title</th>
            <th class="text-left font-weight-bold">Start Date</th>
            <th class="text-left font-weight-bold">End Date</th>
            <th class="text-left font-weight-bold">Location</th>
            <th class="text-left font-weight-bold">Type</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Joined Members</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && sortedEvents.length === 0">
            <td colspan="9" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="event in sortedEvents" :key="event.event_id">
            <td>{{ event.title }}</td>
            <td>{{ formatDateTime(event.start_date) }}</td>
            <td>{{ formatDateTime(event.end_date) }}</td>
            <td>{{ event.location }}</td>
            <td>{{ formatType(event.type) }}</td>
            <td>
              <v-chip :color="getStatusColor(event.status)" size="small">
                {{ formatStatus(event.status) }}
              </v-chip>
            </td>
            <td>{{ getJoinedMembersCount(event.joined_members) }}</td>
            <td>{{ formatDateTime(event.date_created) }}</td>
            <td>
              <v-tooltip text="Edit Event" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="editEvent(event)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete Event" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error"
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteEvent(event.event_id)"
                  ></v-btn>
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Pagination -->
      <div class="d-flex justify-space-between align-center pa-4">
        <div class="text-body-2">
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} events
        </div>
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="compact"
          :disabled="loading"
          @update:model-value="handlePageChange"
        ></v-pagination>
      </div>
    </v-card>

    <EventRecordsDialog
      v-model="eventRecordsDialog"
      :event-records-data="eventRecordsData"
      :member-options="memberOptions"
      @update:model-value="eventRecordsDialog = $event"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useEventsRecordsStore } from '@/stores/ChurchRecords/eventsRecordsStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import EventRecordsDialog from '@/components/Dialogs/EventRecordsDialog.vue'

const eventsRecordsStore = useEventsRecordsStore()

// Computed properties from store
const events = computed(() => eventsRecordsStore.paginatedEvents)

// Sort events with Pending status first, followed by ongoing and completed
const sortedEvents = computed(() => {
  const statusOrder = {
    'pending': 1,
    'ongoing': 2,
    'completed': 3
  }
  
  return [...events.value].sort((a, b) => {
    const aOrder = statusOrder[a.status] || 999
    const bOrder = statusOrder[b.status] || 999
    
    // First sort by status order
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }
    
    // If same status, sort by date created (newest first)
    const aDate = new Date(a.date_created || 0)
    const bDate = new Date(b.date_created || 0)
    return bDate - aDate
  })
})

const memberOptions = computed(() => eventsRecordsStore.memberOptions)
const loading = computed(() => eventsRecordsStore.loading)
const currentPage = computed({
  get: () => eventsRecordsStore.currentPage,
  set: (value) => eventsRecordsStore.setCurrentPage(value)
})
const totalPages = computed(() => eventsRecordsStore.totalPages)
const totalCount = computed(() => eventsRecordsStore.totalCount)
const itemsPerPage = computed({
  get: () => eventsRecordsStore.itemsPerPage,
  set: (value) => eventsRecordsStore.setPageSize(value)
})
const pageSizeOptions = computed(() => eventsRecordsStore.pageSizeOptions)
const searchQuery = computed({
  get: () => eventsRecordsStore.searchQuery,
  set: (value) => eventsRecordsStore.setSearchQuery(value)
})
const filters = computed({
  get: () => eventsRecordsStore.filters,
  set: (value) => eventsRecordsStore.setFilters(value)
})

// Sort options - Month-based sorting
const sortByOptions = [
  'Status (Pending First)',
  'Title (A-Z)',
  'Title (Z-A)',
  'Start Date (Newest)',
  'Start Date (Oldest)',
  'End Date (Newest)',
  'End Date (Oldest)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Type (A-Z)',
  'Status (A-Z)',
  'This Month',
  'Last Month',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const typeOptions = [
  'All Types',
  'worship_service',
  'prayer_meeting',
  'bible_study',
  'youth_fellowship',
  'conference',
  'seminar',
  'outreach',
  'other'
]

const statusOptions = ['All Statuses', 'Pending', 'Ongoing', 'Completed']

// Dialog state
const eventRecordsDialog = ref(false)
const eventRecordsData = ref(null)

// Date range handling
const localDateRange = ref([])
watch(() => filters.value.dateRangeStart, (newStart) => {
  localDateRange.value = newStart && filters.value.dateRangeEnd ? [newStart, filters.value.dateRangeEnd] : []
}, { immediate: true })

watch(() => filters.value.dateRangeEnd, (newEnd) => {
  localDateRange.value = filters.value.dateRangeStart && newEnd ? [filters.value.dateRangeStart, newEnd] : []
}, { immediate: true })

const handleDateRangeChange = (value) => {
  // Update store filters and trigger fetch
  eventsRecordsStore.setFilters({
    dateRangeStart: value && value[0] ? value[0] : null,
    dateRangeEnd: value && value[1] ? value[1] : null
  })
}

// Handlers
const handleEventRecordsDialog = () => {
  eventRecordsData.value = null
  eventRecordsDialog.value = true
}

const editEvent = (event) => {
  eventRecordsData.value = {
    event_id: event.event_id,
    title: event.title,
    description: event.description,
    start_date: event.start_date,
    end_date: event.end_date,
    location: event.location,
    link: event.link || '',
    type: event.type,
    status: event.status,
    joined_members: event.joined_members || [],
    image: event.image || null // Include image if available
  }
  eventRecordsDialog.value = true
}

const deleteEvent = async (id) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this event?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const result = await eventsRecordsStore.deleteEvent(id)
    if (result.success) {
      ElMessage.success('Event deleted successfully')
    } else {
      ElMessage.error(result.error || 'Failed to delete event')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting event:', error)
      ElMessage.error('Failed to delete event')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (eventRecordsData.value && eventRecordsData.value.event_id) {
      // Update
      result = await eventsRecordsStore.updateEvent(eventRecordsData.value.event_id, data)
    } else {
      // Create
      result = await eventsRecordsStore.createEvent(data)
    }

    if (result.success) {
      ElMessage.success(eventRecordsData.value ? 'Event updated successfully' : 'Event created successfully')
      eventRecordsDialog.value = false
      eventRecordsData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save event')
    }
  } catch (error) {
    console.error('Error submitting event:', error)
    ElMessage.error('Failed to save event')
  }
}

const handleSearchChange = (value) => {
  ElMessage.info('Searching events...')
  eventsRecordsStore.setSearchQuery(value)
}

const handleFilterChange = () => {
  const statusText = filters.value.status || 'All Statuses'
  const typeText = filters.value.type || 'All Types'
  ElMessage.info(`Filtering by: ${statusText}, ${typeText}`)
  eventsRecordsStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  eventsRecordsStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  ElMessage.info(`Showing ${pageSize} items per page`)
  eventsRecordsStore.setPageSize(pageSize)
}

const handleExportExcel = async () => {
  try {
    const result = await eventsRecordsStore.exportEventsToExcel()
    if (result.success) {
      ElMessage.success(result.message || 'Excel file downloaded successfully')
    } else {
      ElMessage.error(result.error || 'Failed to export Excel file')
    }
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    ElMessage.error('An error occurred while exporting to Excel')
  }
}

const getStartIndex = () => {
  if (sortedEvents.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, totalCount.value)
}

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

const formatType = (type) => {
  const typeMap = {
    'worship_service': 'Worship Service',
    'prayer_meeting': 'Prayer Meeting',
    'bible_study': 'Bible Study',
    'youth_fellowship': 'Youth Fellowship',
    'conference': 'Conference',
    'seminar': 'Seminar / Training',
    'outreach': 'Outreach',
    'other': 'Other'
  }
  return typeMap[type] || type
}

const formatStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'ongoing': 'Ongoing',
    'completed': 'Completed'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colors = {
    'pending': 'warning',
    'ongoing': 'info',
    'completed': 'success'
  }
  return colors[status] || 'default'
}

const getJoinedMembersCount = (joined_members) => {
  if (!joined_members) return 0
  try {
    if (Array.isArray(joined_members)) {
      return joined_members.length
    } else if (typeof joined_members === 'string') {
      const parsed = JSON.parse(joined_members)
      return Array.isArray(parsed) ? parsed.length : 0
    }
    return 0
  } catch (e) {
    return 0
  }
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
  const tableHeaders = ['Event Title', 'Start Date', 'End Date', 'Location', 'Type', 'Status', 'Joined Members', 'Date Created']
  
  let tableRows = ''
  sortedEvents.value.forEach((event) => {
    tableRows += `
      <tr>
        <td>${event.title || 'N/A'}</td>
        <td>${formatDateTime(event.start_date)}</td>
        <td>${formatDateTime(event.end_date)}</td>
        <td>${event.location || 'N/A'}</td>
        <td>${formatType(event.type)}</td>
        <td>${formatStatus(event.status)}</td>
        <td>${getJoinedMembersCount(event.joined_members)}</td>
        <td>${formatDateTime(event.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Church Events - Print</title>
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
            <h1>Church Events</h1>
            <div class="subtitle">Church Events Report</div>
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
          <div>Total Records: ${sortedEvents.value.length}</div>
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
  await eventsRecordsStore.fetchEvents()
  await eventsRecordsStore.fetchMemberOptions()
})
</script>

<style scoped>
.events-records {
  padding: 24px;
}
</style>
