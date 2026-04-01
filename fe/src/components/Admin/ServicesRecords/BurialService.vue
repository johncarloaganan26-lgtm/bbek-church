<template>
  <div class="burial-service">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Burial Services</h1>
      
      <div class="d-flex align-center gap-4">
        <!-- Global Completion Toggle -->
        <v-card variant="outlined" class="pa-2 px-4 d-flex align-center mr-2" style="border-radius: 12px; border: 1px dashed #ccc;">
          <div class="mr-4">
            <div class="text-caption font-weight-bold grey--text text-uppercase" style="font-size: 10px; letter-spacing: 1px;">Manual Completion</div>
            <div class="text-h6 font-weight-bold" :class="settings.allow_complete_without_schedule ? 'text-success' : 'text-grey'">{{ settings.allow_complete_without_schedule ? 'ON' : 'OFF' }}</div>
          </div>
          <v-switch
            v-model="settings.allow_complete_without_schedule"
            color="success"
            hide-details
            inset
            density="compact"
            @update:model-value="toggleRestriction"
            :loading="settingsLoading"
          ></v-switch>
          <v-tooltip activator="parent" location="bottom">
            {{ settings.allow_complete_without_schedule 
              ? 'RESTRICTION OFF: You can mark any record as completed regardless of schedule.' 
              : 'RESTRICTION ON: Records must be scheduled before they can be marked as completed.' 
            }}
          </v-tooltip>
        </v-card>

        <v-btn 
          color="success" 
          prepend-icon="mdi-plus" 
          size="small" 
          :disabled="loading"
          :loading="loading"
          @click="handleBurialServiceDialog"
          class="h-100"
          style="min-height: 48px;"
        >
          New Burial Service
        </v-btn>
      </div>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Services</div>
              <div class="text-h5 font-weight-bold">{{ totalServices }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <v-icon color="blue" size="32">mdi-calendar-clock</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Scheduled Services</div>
              <div class="text-h5 font-weight-bold">{{ scheduledServices }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <v-icon color="blue" size="32">mdi-coffin</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Completed Services</div>
              <div class="text-h5 font-weight-bold">{{ completedServices }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <v-icon color="green" size="32">mdi-check-circle</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Pending Services</div>
              <div class="text-h5 font-weight-bold">{{ pendingServices }}</div>
            </div>
            <v-avatar size="56" color="orange lighten-5" class="d-flex align-center justify-center">
              <v-icon color="orange" size="32">mdi-clock-outline</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtering and Sorting Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search services..."
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
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              :disabled="loading"
              hide-details
              @update:model-value="handleFilterChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              start-placeholder="Start date"
              end-placeholder="End date"
              range-separator="to"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled="loading"
              @change="handleDateRangeChange"
              class="w-100"
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
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
            <v-tooltip text="Print" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-printer"
                  variant="outlined"
                  v-bind="props"
                  :loading="loading"
                  :disabled="loading"
                  @click="handlePrint"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <!-- Bulk Actions Row -->
        <v-row v-if="selectedServices.length > 0" class="mt-2">
          <v-col cols="12">
            <v-alert
              type="info"
              variant="tonal"
              class="mb-0"
              density="compact"
            >
              <div class="d-flex align-center justify-space-between">
                <div class="text-body-2">
                  <strong>{{ selectedServices.length }}</strong> service{{ selectedServices.length > 1 ? 's' : '' }} selected
                </div>
                <div class="d-flex gap-2">
                  <v-btn
                    color="success"
                    variant="flat"
                    size="small"
                    :disabled="loading"
                    @click="bulkCompleteServices"
                  >
                    <v-icon left>mdi-check-all</v-icon>
                    Mark as Completed
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="flat"
                    size="small"
                    :disabled="loading"
                    @click="bulkDeleteServices"
                  >
                    <v-icon left>mdi-delete</v-icon>
                    Archive Selected
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    size="small"
                    @click="clearSelection"
                  >
                    <v-icon left>mdi-close</v-icon>
                    Clear Selection
                  </v-btn>
                </div>
              </div>
            </v-alert>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="d-flex align-center">
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} services</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading burial services..." class="position-relative">
      <v-table>
        <thead>
           <tr>
             <th class="text-left font-weight-bold" style="width: 50px;">
               <v-checkbox
                 :model-value="isAllSelected"
                 :indeterminate="isIndeterminate"
                 @update:model-value="toggleSelectAll"
                 density="compact"
                 hide-details
               ></v-checkbox>
             </th>
             <!-- <th class="text-left font-weight-bold">Burial ID</th> -->
             <th class="text-left font-weight-bold">Member</th>
            <th class="text-left font-weight-bold">Requester Name</th>
            <th class="text-left font-weight-bold">Requester Email</th>
            <th class="text-left font-weight-bold">Deceased Name</th>
            <th class="text-left font-weight-bold">Birthdate</th>
            <th class="text-left font-weight-bold">Date of Death</th>
            <th class="text-left font-weight-bold">Relationship</th>
            <th class="text-left font-weight-bold">Location</th>
            <th class="text-left font-weight-bold">Pastor Name</th>
            <th class="text-left font-weight-bold">Service Date</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && sortedServices.length === 0">
            <td colspan="12" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="service in sortedServices" :key="service.burial_id">
            <td>
              <v-checkbox
                :model-value="isServiceSelected(service)"
                @update:model-value="toggleServiceSelection(service)"
                density="compact"
                hide-details
              ></v-checkbox>
            </td>
            <!-- <td>{{ service.burial_id }}</td> -->
            <td>{{ service.member_id ? 'Member' : 'Non-Member' }}</td>
            <td>{{ service.member_id ? (service.fullname || service.member_id) : (service.requester_name || 'N/A') }}</td>
            <td>{{ service.member_id ? (service.member_email || service.requester_email || 'N/A') : (service.requester_email || 'N/A') }}</td>
            <td>{{ service.deceased_name }}</td>
            <td>{{ formatDate(service.deceased_birthdate) }}</td>
            <td>{{ formatDateTime(service.date_death) }}</td>
            <td>{{ service.relationship }}</td>
            <td>{{ service.location }}</td>
            <td>
              <div v-if="service.pastor_name_joined" class="text-body-2 font-weight-medium">
                <v-icon size="small" class="mr-1" color="primary">mdi-account-tie</v-icon>
                {{ service.pastor_name_joined }}
                <div v-if="service.pastor_position" class="text-caption text-grey font-italic ml-6">
                  {{ service.pastor_position }}
                </div>
              </div>
              <div v-else class="text-caption text-grey">{{ service.pastor_name || 'Unassigned' }}</div>
            </td>
            <td>
              <div v-if="service.status === 'completed'" class="text-success font-weight-bold" style="font-size: 0.7rem; letter-spacing: 0.5px;">DATE GOT COMPLETED:</div>
              <div :class="{'font-weight-medium': service.status === 'completed'}">
                {{ service.service_date ? formatDateTime(service.service_date) : 'Not scheduled' }}
              </div>
            </td>
            <td>
              <v-chip :color="getStatusColor(service.status)" size="small">
                {{ formatStatus(service.status) }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(service.date_created) }}</td>
            <td>
              <v-tooltip text="Edit Burial Service" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="editService(service)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Archive Burial Service" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteService(service.burial_id)"
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
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} services
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
    <BurialServiceDialog
      v-model="burialServiceDialog"
      :burial-service-data="burialServiceData"
      @update:model-value="burialServiceDialog = $event"
      @submit="handleSubmit"
    />

    <!-- Availability Manager Dialog -->
    <AvailabilityManager 
      v-model="availabilityManagerVisible" 
      initial-service="burial" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useBurialServiceStore } from '@/stores/ServicesRecords/burialServiceStore'
import { useSystemSettingsStore } from '@/stores/admin/systemSettingsStore'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import BurialServiceDialog from '@/components/Dialogs/BurialServiceDialog.vue'
import AvailabilityManager from '@/components/admin/ServicesRecords/AvailabilityManager.vue'

const burialServiceStore = useBurialServiceStore()
const settingsStore = useSystemSettingsStore()
const { settings, loading: settingsLoading } = storeToRefs(settingsStore)

// Selection state
const selectedServices = ref([])
const availabilityManagerVisible = ref(false)

// Computed properties from store
const services = computed(() => burialServiceStore.services)

// Sort services with Pending status first, followed by other statuses in specified order
const sortedServices = computed(() => {
  const statusOrder = {
    'pending': 1,
    'approved': 2,
    'disapproved': 3,
    'completed': 4,
    'cancelled': 5
  }
  
  return [...services.value].sort((a, b) => {
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

const loading = computed(() => burialServiceStore.loading)
const currentPage = computed({
  get: () => burialServiceStore.currentPage,
  set: (value) => burialServiceStore.setCurrentPage(value)
})
const totalPages = computed(() => burialServiceStore.totalPages)
const totalCount = computed(() => burialServiceStore.totalCount)
const totalServices = computed(() => burialServiceStore.totalServices)
const scheduledServices = computed(() => burialServiceStore.scheduledServices)
const completedServices = computed(() => burialServiceStore.completedServices)
const pendingServices = computed(() => burialServiceStore.pendingServices)
const itemsPerPage = computed({
  get: () => burialServiceStore.itemsPerPage,
  set: (value) => burialServiceStore.setPageSize(value)
})
const pageSizeOptions = computed(() => burialServiceStore.pageSizeOptions)
const searchQuery = computed({
  get: () => burialServiceStore.searchQuery,
  set: (value) => {
    // Update the store value without triggering search
    burialServiceStore.searchQuery = value
  }
})
const filters = computed({
  get: () => burialServiceStore.filters,
  set: (value) => burialServiceStore.setFilters(value)
})

// Selection computed properties
const isAllSelected = computed(() => {
  return sortedServices.value.length > 0 && selectedServices.value.length === sortedServices.value.length
})

const isIndeterminate = computed(() => {
  return selectedServices.value.length > 0 && selectedServices.value.length < sortedServices.value.length
})

const sortByOptions = [
  'Status (Pending First)',
  'Service Date (Newest)',
  'Service Date (Oldest)',
  'Burial ID (A-Z)',
  'Burial ID (Z-A)',
  'Date Created (Newest)',
  'Date Created (Oldest)',
  'Status (A-Z)',
  'This Month',
  'Last Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
  'Date Range (Newest)',
  'Date Range (Oldest)'
]

const statusOptions = ['All Status', 'Pending', 'Approved', 'Disapproved', 'Completed', 'Cancelled']

// Dialog state
const burialServiceDialog = ref(false)
const burialServiceData = ref(null)

// Handlers
const handleBurialServiceDialog = () => {
  burialServiceData.value = null
  burialServiceDialog.value = true
}

const editService = async (service) => {
  try {
    // Fetch full service details from backend to ensure we have all data
    const fullService = await burialServiceStore.fetchServiceById(service.burial_id)
    
    if (fullService) {
      burialServiceData.value = {
        burial_id: fullService.burial_id,
        member_id: fullService.member_id,
        _originalStatus: fullService.status,
        requester_name: fullService.requester_name,
        requester_email: fullService.requester_email,
        deceased_name: fullService.deceased_name,
        deceased_birthdate: fullService.deceased_birthdate,
        date_death: fullService.date_death,
        reason_of_death: fullService.reason_of_death,
        relationship: fullService.relationship,
        location: fullService.location,
        pastor_name: fullService.pastor_name,
        service_date: fullService.service_date,
        preferred_service_time: fullService.preferred_service_time,
        status: fullService.status
      }
      burialServiceDialog.value = true
    } else {
      ElMessage.error('Failed to load burial service details')
    }
  } catch (error) {
    console.error('Error loading burial service:', error)
    ElMessage.error('Failed to load burial service details')
  }
}

const deleteService = async (id) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      'Enter the reason for archiving this burial service:',
      'Confirm Archive',
      {
        confirmButtonText: 'Archive',
        cancelButtonText: 'Cancel',
        inputType: 'textarea',
        inputPlaceholder: 'e.g., Duplicate entry, Wrong data, etc.',
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return 'Reason is required';
          }
        },
      }
    );

    const result = await burialServiceStore.deleteService(id, reason)
    if (result.success) {
      ElMessage.success('Burial service archived successfully')
    } else {
      ElMessage.error(result.error || 'Failed to archive burial service')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error archiving burial service:', error)
      ElMessage.error('Failed to archive burial service')
    }
  }
}

// Selection methods
const isServiceSelected = (service) => {
  return selectedServices.value.some(selected => selected.burial_id === service.burial_id)
}

const toggleServiceSelection = (service) => {
  const index = selectedServices.value.findIndex(selected => selected.burial_id === service.burial_id)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
  } else {
    selectedServices.value.push(service)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedServices.value = []
  } else {
    selectedServices.value = [...sortedServices.value]
  }
}

const clearSelection = () => {
  selectedServices.value = []
}

const bulkCompleteServices = async () => {
  // Filter for approved/pending services based on settings
  const targetServices = selectedServices.value.filter(s => {
    if (settings.value.allow_complete_without_schedule) {
      return s.status === 'approved' || s.status === 'pending';
    }
    return s.status === 'approved';
  });
  
  if (targetServices.length === 0) {
    ElMessage.warning(settings.value.allow_complete_without_schedule 
      ? 'No pending or approved burial services selected.' 
      : 'No approved burial services selected.');
    return;
  }

  // Check dates: cannot complete future services
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validServices = targetServices.filter(s => {
    if (settings.value.allow_complete_without_schedule) return true;
    
    // Restriction ON: Must be approved AND date must be today or past
    if (s.status === 'pending' || !s.service_date) return false;
    
    const serviceDate = new Date(s.service_date);
    serviceDate.setHours(0, 0, 0, 0);
    return serviceDate <= today;
  });

  if (validServices.length === 0) {
    ElMessage.warning('Completion restricted: Records must be scheduled for today or a past date unless Manual Completion is ON.');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to mark ${validServices.length} burial service(s) as completed?`,
      'Confirm Bulk Complete',
      {
        confirmButtonText: 'Yes, Mark as Completed',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    )

    // Extract burial IDs for only approved services with past dates
    const burialIds = validServices.map(s => s.burial_id)

    // Use the bulk complete endpoint
    const result = await burialServiceStore.bulkCompleteBurialServices(burialIds)

    if (result.success) {
      const { completed, failed, message } = result.data || {}
      
      if (completed > 0) {
        ElMessage.success(`Successfully marked ${completed} burial service(s) as completed`)
      }
      
      if (failed > 0) {
        ElMessage.warning(`Failed to mark ${failed} burial service(s) as completed`)
      }
      
      if (message) {
        ElMessage.info(message)
      }
    }

    clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error completing services:', error)
      ElMessage.error('Failed to complete selected burial services')
    }
  }
}

const markIndividualComplete = async (service) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Manual Completion Logic
    if (!settings.value.allow_complete_without_schedule) {
        if (service.status === 'pending' || !service.service_date) {
            ElMessage.warning('Completion restricted: This record must be scheduled before it can be marked as completed.');
            return;
        }

        const serviceDate = new Date(service.service_date);
        serviceDate.setHours(0, 0, 0, 0);
        if (serviceDate > today) {
            ElMessage.warning(`Completion restricted: This record is scheduled for a future date (${service.service_date.split('T')[0]}).`);
            return;
        }
    }

    await ElMessageBox.confirm(
      `Mark burial service for ${service.deceased_name} as completed?`,
      'Mark Completed',
      {
        confirmButtonText: 'Yes, Complete',
        cancelButtonText: 'Cancel',
        type: 'success',
      }
    );
    
    const result = await burialServiceStore.bulkCompleteBurialServices([service.burial_id]);
    if (result.success) {
      ElMessage.success('Burial service marked as completed');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error completing individual service:', error);
      ElMessage.error('Failed to complete burial service');
    }
  }
};

const bulkDeleteServices = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      'Enter the reason for archiving these burial services:',
      'Confirm Bulk Archive',
      {
        confirmButtonText: 'Archive',
        cancelButtonText: 'Cancel',
        inputType: 'textarea',
        inputPlaceholder: 'e.g., Duplicate entries, Wrong data, etc.',
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return 'Reason is required';
          }
        },
      }
    );

    // Extract burial IDs
    const burialIds = selectedServices.value.map(service => service.burial_id)

    // Use the new bulk delete endpoint with reason
    const result = await burialServiceStore.bulkDeleteBurialServices(burialIds, reason)

    if (result.success) {
      const { deleted, failed } = result.data

      if (deleted > 0) {
        ElMessage.success(`Successfully archived ${deleted} burial service${deleted > 1 ? 's' : ''}`)
      }

      if (failed > 0) {
        ElMessage.warning(`Failed to archive ${failed} burial service${failed > 1 ? 's' : ''}`)
      }
    }

    clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error bulk archiving services:', error)
      ElMessage.error('Failed to archive selected burial services')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    // Manual Completion Validation
    if (data.status === 'completed' && !settings.value.allow_complete_without_schedule) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (burialServiceData.value?._originalStatus === 'pending' || !data.service_date) {
        ElMessage.warning('Completion restricted: This record must be scheduled before it can be marked as completed.');
        return;
      }

      const serviceDate = new Date(data.service_date);
      serviceDate.setHours(0, 0, 0, 0);
      if (serviceDate > today) {
        ElMessage.warning(`Completion restricted: This record is scheduled for a future date (${data.service_date.split('T')[0]}).`);
        return;
      }
    }

    let result
    if (burialServiceData.value && burialServiceData.value.burial_id) {
      result = await burialServiceStore.updateService(burialServiceData.value.burial_id, data)
    } else {
      result = await burialServiceStore.createService(data)
    }

    if (result.success) {
      ElMessage.success(burialServiceData.value ? 'Burial service updated successfully' : 'Burial service created successfully')
      burialServiceDialog.value = false
      burialServiceData.value = null
      // Force refresh the table data
      await new Promise(resolve => setTimeout(resolve, 500))
      await burialServiceStore.fetchServices()
    } else {
      ElMessage.error(result.error || 'Failed to save burial service')
    }
  } catch (error) {
    console.error('Error submitting burial service:', error)
    ElMessage.error('Failed to save burial service')
  }
}

const handleSearchChange = (value) => {
  // Clear previous timeout
  if (window.burialSearchTimeout) {
    clearTimeout(window.burialSearchTimeout)
  }

  // Set new timeout to trigger search after user stops typing (500ms delay)
  window.burialSearchTimeout = setTimeout(() => {
    burialServiceStore.setSearchQuery(value)
  }, 500)
}

const handleFilterChange = () => {
  const statusText = filters.value.status || 'All Status'
  ElMessage.info(`Filtering by: ${statusText}`)
  burialServiceStore.setFilters(filters.value)
}

const handleDateRangeChange = () => {
  burialServiceStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  burialServiceStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  ElMessage.info(`Showing ${pageSize} items per page`)
  burialServiceStore.setPageSize(pageSize)
}

const handleExportExcel = async () => {
  try {
    const result = await burialServiceStore.exportServicesToExcel()
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
  if (sortedServices.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, sortedServices.value.length)
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  
  console.log('formatDateTime input:', dateString, 'type:', typeof dateString)

  try {
    let date

    if (dateString instanceof Date) {
      date = dateString
    }
    else if (typeof dateString === 'string') {
      // Handle YYYY-MM-DD HH:mm:ss format - preserve exact time
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
        // Parse as local time to preserve the exact time from database
        const [datePart, timePart] = dateString.split(' ')
        const [year, month, day] = datePart.split('-')
        const [hours, minutes, seconds] = timePart.split(':')
        date = new Date(year, month - 1, day, hours, minutes, seconds)
      }
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateString)) {
        date = new Date(dateString)
      }
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        date = new Date(dateString + 'T00:00:00')
      }
      else {
        date = new Date(dateString)
      }
    }
    else if (typeof dateString === 'number') {
      date = new Date(dateString)
    }
    else {
      return ''
    }

    if (isNaN(date.getTime())) {
      console.warn('Invalid datetime detected:', dateString, 'parsed as:', date)
      return ''
    }

    const result = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    console.log('formatDateTime output:', result)
    return result
  } catch (error) {
    console.warn('Error formatting datetime:', dateString, error)
    return ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''

  try {
    // Handle different date formats
    let date

    // If it's already a Date object
    if (dateString instanceof Date) {
      date = dateString
    }
    // If it's a string, try to parse it
    else if (typeof dateString === 'string') {
      // Handle YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        date = new Date(dateString + 'T00:00:00')
      }
      // Handle YYYY-MM-DD HH:mm:ss format (extract date part)
      else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
        const datePart = dateString.split(' ')[0]
        date = new Date(datePart + 'T00:00:00')
      }
      // Handle YYYY-MM-DDTHH:mm:ss format (extract date part)
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateString)) {
        const datePart = dateString.split('T')[0]
        date = new Date(datePart + 'T00:00:00')
      }
      // Handle other formats
      else {
        date = new Date(dateString)
      }
    }
    // If it's a number (timestamp)
    else if (typeof dateString === 'number') {
      date = new Date(dateString)
    }
    else {
      return ''
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date detected:', dateString, 'parsed as:', date)
      return ''
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.warn('Error formatting date:', dateString, error)
    return ''
  }
}

const formatStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'approved': 'Approved',
    'disapproved': 'Disapproved',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'ongoing': 'Ongoing',
    'scheduled': 'Scheduled'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colors = {
    'approved': 'info',
    'disapproved': 'error',
    'scheduled': 'info',
    'completed': 'success',
    'pending': 'warning',
    'ongoing': 'warning',
    'cancelled': 'error'
  }
  return colors[status] || 'default'
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
  const tableHeaders = ['Member', 'Requester Name', 'Requester Email', 'Deceased Name', 'Birthdate', 'Date of Death', 'Relationship', 'Location', 'Pastor Name', 'Service Date', 'Status', 'Date Created']
  
  let tableRows = ''
  sortedServices.value.forEach((service) => {
    tableRows += `
      <tr>
        <td>${service.member_id ? 'Member' : 'Non-Member'}</td>
        <td>${service.member_id ? (service.fullname || service.member_id) : (service.requester_name || 'N/A')}</td>
        <td>${service.member_id ? (service.member_email || service.requester_email || 'N/A') : (service.requester_email || 'N/A')}</td>
        <td>${service.deceased_name || 'N/A'}</td>
        <td>${formatDate(service.deceased_birthdate)}</td>
        <td>${formatDateTime(service.date_death)}</td>
        <td>${service.relationship || 'N/A'}</td>
        <td>${service.location || 'N/A'}</td>
        <td>${service.pastor_name || 'N/A'}</td>
        <td>
          ${service.status === 'completed' ? '<div style="color: #27ae60; font-weight: bold; font-size: 10px;">DATE GOT COMPLETED:</div>' : ''}
          <span style="${service.status === 'completed' ? 'font-weight: bold;' : ''}">
            ${service.service_date ? formatDateTime(service.service_date) : 'Not scheduled'}
          </span>
        </td>
        <td>${formatStatus(service.status)}</td>
        <td>${formatDateTime(service.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Burial Services - Print</title>
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
             font-size: 22px;
             margin-bottom: 20px;
             margin-top: 10px;
           }
           .church-header {
             display: flex;
             align-items: center;
             justify-content: center;
             margin-bottom: 15px;
           }
           .church-header img {
             width: 50px;
             height: 50px;
             margin-right: 15px;
           }
           .report-title {
             text-align: center;
             font-size: 18px;
             color: #333;
             margin-bottom: 20px;
             font-weight: bold;
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
        <div class="church-header">
          <img src="/logo.png" alt="Church Logo" />
          <div class="org-name">Bible Baptist Ekklesia of Kawit</div>
        </div>
        <div class="report-title">Burial Services Report</div>
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
          <div>Total Records: ${sortedServices.value.length}</div>
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

// Watchers to clear selections when data changes
watch(() => services.value, () => {
  clearSelection()
}, { deep: true })

watch(() => filters.value, () => {
  clearSelection()
}, { deep: true })

watch(() => currentPage.value, () => {
  clearSelection()
})

// Maintenance Actions
onMounted(() => {
    burialServiceStore.fetchServices()
    settingsStore.fetchSettings()
})

onUnmounted(() => {
  if (window.burialSearchTimeout) {
    clearTimeout(window.burialSearchTimeout)
  }
})

const toggleRestriction = async (val) => {
    await settingsStore.toggleAllowComplete(val)
}
</script>

<style scoped>
.burial-service {
  padding: 24px;
}
</style>
