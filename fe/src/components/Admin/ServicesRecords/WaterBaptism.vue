<template>
  <div class="water-baptism">
    <CertificateDialog
      v-model="certificateDialog"
      :certificate-type="certificateType"
      :certificate-data="certificateData"
    />
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Water Baptism Records</h1>
      
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
          prepend-icon="mdi-file-document" 
          size="small" 
          :disabled="loading"
          :loading="loading"
          @click="openBaptismDialog"
          class="h-100"
          style="min-height: 48px;"
        >
          New Baptism
        </v-btn>
      </div>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Baptisms</div>
              <div class="text-h5 font-weight-bold">{{ totalBaptisms }}</div>
            </div>
            <v-avatar size="56" color="blue-lighten-4" class="d-flex align-center justify-center">
              <v-icon color="blue-darken-2" size="large">mdi-water</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">This Year</div>
              <div class="text-h5 font-weight-bold">{{ thisYear }}</div>
            </div>
            <v-avatar size="56" color="blue-lighten-4" class="d-flex align-center justify-center">
              <v-icon color="blue-darken-2" size="large">mdi-calendar-check</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Certificates Issued</div>
              <div class="text-h5 font-weight-bold">{{ certificatesIssued }}</div>
            </div>
            <v-avatar size="56" color="green-lighten-4" class="d-flex align-center justify-center">
              <v-icon color="green-darken-2" size="large">mdi-file-document-check</v-icon>
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
              placeholder="Search records..."
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
          <v-col cols="12" md="4" class="d-flex align-center gap-2">
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
        <!-- Bulk Actions Row -->
        <v-row v-if="selectedBaptisms.length > 0" class="mt-2">
          <v-col cols="12">
            <v-alert
              type="info"
              variant="tonal"
              class="mb-0"
              density="compact"
            >
              <div class="d-flex align-center justify-space-between">
                <div class="text-body-2">
                  <strong>{{ selectedBaptisms.length }}</strong> baptism{{ selectedBaptisms.length > 1 ? 's' : '' }} selected
                </div>
                <div class="d-flex gap-2">
                  <v-btn
                    color="success"
                    variant="flat"
                    size="small"
                    :disabled="loading"
                    @click="bulkCompleteBaptisms"
                  >
                    <v-icon left>mdi-check-all</v-icon>
                    Mark as Completed
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="flat"
                    size="small"
                    :disabled="loading"
                    @click="bulkDeleteBaptisms"
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
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} baptisms</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading water baptisms..." class="position-relative">
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
             <!-- <th class="text-left font-weight-bold">Baptism ID</th> -->
             <th class="text-left font-weight-bold">Member</th>
             <th class="text-left font-weight-bold">Baptism Date & Time</th>
             <th class="text-left font-weight-bold">Status</th>
             <th class="text-left font-weight-bold">Date Created</th>
             <th class="text-left font-weight-bold">Actions</th>
           </tr>
         </thead>
        <tbody>
          <tr v-if="!loading && sortedBaptisms.length === 0">
            <td colspan="6" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="baptism in sortedBaptisms" :key="baptism.baptism_id">
            <td>
              <v-checkbox
                :model-value="isBaptismSelected(baptism)"
                @update:model-value="toggleBaptismSelection(baptism)"
                density="compact"
                hide-details
              ></v-checkbox>
            </td>
            <!-- <td>{{ baptism.baptism_id }}</td> -->
            <td>{{ baptism.fullname || baptism.member_id }}</td>
            <td>
              <div v-if="baptism.status === 'completed'" class="text-success font-weight-bold" style="font-size: 0.7rem; letter-spacing: 0.5px;">DATE GOT SAVED:</div>
              <div :class="{'font-weight-medium': baptism.status === 'completed'}">
                {{ formatBaptismDateTime(baptism.baptism_date, baptism.baptism_time, baptism.status) }}
              </div>
            </td>
            <td>
              <v-chip :color="getStatusColor(baptism.status)" size="small">
                {{ formatStatus(baptism.status) }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(baptism.date_created) }}</td>
            <td>
              <v-tooltip v-if="['pending', 'approved'].includes(baptism.status) && (baptism.status === 'approved' || settings.allow_complete_without_schedule)" text="Mark Completed" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-check" 
                    variant="text" 
                    size="small" 
                    color="success"
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="markIndividualComplete(baptism)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip v-if="baptism.status === 'completed'" text="Print Certificate" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-certificate" 
                    variant="text" 
                    size="small" 
                    color="success"
                    class="mr-2"
                    v-bind="props"
                    @click="printCertificate(baptism)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Edit Baptism Record" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="editBaptism(baptism)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Archive Baptism Record" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error"
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteBaptism(baptism.baptism_id)"
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
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} baptisms
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
    <WaterBaptismDialog 
      v-model="baptismDialog" 
      :baptism-data="baptismData" 
      @update:model-value="baptismDialog = $event"
      @submit="handleSubmit"
    />

    <!-- Bulk Complete Calendar Dialog -->
    <v-dialog v-model="bulkCompleteDialog" max-width="400px" persistent class="bulk-complete-dialog" style="overflow: visible;">
      <v-card class="pa-4" style="border-radius: 20px; overflow: visible; position: relative;">
        <v-btn
          icon="mdi-close"
          variant="text"
          color="grey-darken-2"
          class="position-absolute"
          style="top: 10px; right: 10px; z-index: 10;"
          @click="closeBulkCompleteDialog"
        ></v-btn>
        <div class="pa-4 text-center">
          <v-avatar color="success-lighten-5" size="80" class="mb-4">
            <v-icon color="success" size="40">mdi-calendar-check</v-icon>
          </v-avatar>
          <h2 class="text-h5 font-weight-bold mb-1">Set Completion Date</h2>
          <p class="text-body-2 text-grey-darken-1">
            Selected {{ selectedBaptismsToComplete?.length }} records to mark as completed.
          </p>
        </div>

        <v-card-text class="pt-0" style="overflow: visible;">  
          <v-divider class="mb-6"></v-divider>
          
          <div class="mb-5">
            <div class="d-flex align-center mb-2">
              <v-icon size="18" color="primary" class="mr-2">mdi-calendar</v-icon>
              <span class="text-subtitle-2 font-weight-bold text-uppercase" style="letter-spacing: 0.5px; font-size: 0.75rem;">Baptism Date (Sundays Only)</span>
            </div>
            <el-date-picker
              v-model="completionDate"
              type="date"
              placeholder="Select Sunday"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="disableNonSundays"
              class="w-100 custom-date-picker"
              size="large"
              popper-class="bulk-complete-date-picker-popper"
              teleport="body"
              :popper-options="{ strategy: 'fixed' }"
            />
          </div>

          <div class="mb-2">
            <div class="d-flex align-center mb-2">
              <v-icon size="18" color="primary" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-subtitle-2 font-weight-bold text-uppercase" style="letter-spacing: 0.5px; font-size: 0.75rem;">Baptism Time (1:00 PM onwards)</span>
            </div>
            <v-select
              v-model="completionTime"
              :items="timeOptions"
              label="Select Time"
              variant="outlined"
              density="comfortable"
              hide-details
              style="border-radius: 8px;"
            ></v-select>
            <div class="text-caption text-grey mt-2 d-flex align-center">
              <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
              Water baptism is held every Sunday at 1:00 PM.
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-btn
            variant="text"
            block
            class="mb-2 font-weight-bold text-grey-darken-1"
            style="border-radius: 12px; height: 48px;"
            @click="closeBulkCompleteDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="success"
            variant="flat"
            block
            class="font-weight-bold"
            style="border-radius: 12px; height: 52px; font-size: 1rem;"
            :disabled="!completionDate || !completionTime"
            @click="confirmBulkComplete"
          >
            Mark as Completed
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWaterBaptismStore } from '@/stores/ServicesRecords/waterBaptismStore'
import { useSystemSettingsStore } from '@/stores/admin/systemSettingsStore'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import WaterBaptismDialog from '@/components/Dialogs/WaterBaptismDialog.vue'
import CertificateDialog from '@/components/Dialogs/CertificateDialog.vue'

const waterBaptismStore = useWaterBaptismStore()
const settingsStore = useSystemSettingsStore()
const { settings, loading: settingsLoading } = storeToRefs(settingsStore)

// Selection state
const selectedBaptisms = ref([])

// Computed properties from store
const baptisms = computed(() => waterBaptismStore.baptisms)

// Sort baptisms with Pending status first, followed by other statuses in specified order
const sortedBaptisms = computed(() => {
const statusOrder = {
  'pending': 1,
  'approved': 2,
  'disapproved': 3,
  'completed': 4,
  'cancelled': 5
}
  
  return [...baptisms.value].sort((a, b) => {
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

const loading = computed(() => waterBaptismStore.loading)
const currentPage = computed({
  get: () => waterBaptismStore.currentPage,
  set: (value) => waterBaptismStore.setCurrentPage(value)
})
const totalPages = computed(() => waterBaptismStore.totalPages)
const totalCount = computed(() => waterBaptismStore.totalCount)
const totalBaptisms = computed(() => waterBaptismStore.totalBaptisms)
const thisYear = computed(() => waterBaptismStore.thisYear)
const certificatesIssued = computed(() => waterBaptismStore.certificatesIssued)
const itemsPerPage = computed({
  get: () => waterBaptismStore.itemsPerPage,
  set: (value) => waterBaptismStore.setPageSize(value)
})
const pageSizeOptions = computed(() => waterBaptismStore.pageSizeOptions)
const searchQuery = computed({
  get: () => waterBaptismStore.searchQuery,
  set: (value) => {
    // Update the store value without triggering search
    waterBaptismStore.searchQuery = value
  }
})
const filters = computed({
  get: () => waterBaptismStore.filters,
  set: (value) => waterBaptismStore.setFilters(value)
})

// Selection computed properties
const isAllSelected = computed(() => {
  return sortedBaptisms.value.length > 0 && selectedBaptisms.value.length === sortedBaptisms.value.length
})

const isIndeterminate = computed(() => {
  return selectedBaptisms.value.length > 0 && selectedBaptisms.value.length < sortedBaptisms.value.length
})


const sortByOptions = [
  'Status (Pending First)',
  'Baptism Date (Newest)',
  'Baptism Date (Oldest)',
  'Baptism ID (A-Z)',
  'Baptism ID (Z-A)',
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

const statusOptions = computed(() => waterBaptismStore.filters.statusOptions)

// Dialog state
const baptismDialog = ref(false)
const baptismData = ref(null)
const certificateDialog = ref(false)
const certificateType = ref('')
const certificateData = ref(null)

// Bulk Complete Dialog State
const bulkCompleteDialog = ref(false)
const completionDate = ref('')
const completionTime = ref('13:00:00')
const selectedBaptismsToComplete = ref([])

const disableNonSundays = (date) => {
  // getDay() returns 0 for Sunday
  return date.getDay() !== 0
}

const timeOptions = [
  { title: '1:00 PM', value: '13:00:00' },
  { title: '1:30 PM', value: '13:30:00' },
  { title: '2:00 PM', value: '14:00:00' },
  { title: '2:30 PM', value: '14:30:00' },
  { title: '3:00 PM', value: '15:00:00' },
  { title: '3:30 PM', value: '15:30:00' },
  { title: '4:00 PM', value: '16:00:00' },
  { title: '4:30 PM', value: '16:30:00' },
  { title: '5:00 PM', value: '17:00:00' }
]


// Handlers
const openBaptismDialog = () => {
  baptismData.value = null
  baptismDialog.value = true
}

const editBaptism = (baptism) => {
  baptismData.value = {
    baptism_id: baptism.baptism_id,
    member_id: baptism.member_id,
    baptism_date: baptism.baptism_date,
    baptism_time: baptism.baptism_time,
    location: baptism.location,
    pastor_name: baptism.pastor_name,
    status: baptism.status,
    guardian_name: baptism.guardian_name,
    guardian_contact: baptism.guardian_contact,
    guardian_relationship: baptism.guardian_relationship,
    // Personal info fields (for both member and non-member)
    firstname: baptism.firstname || '',
    middle_name: baptism.middle_name || '',
    lastname: baptism.lastname || '',
    birthdate: baptism.birthdate || '',
    age: baptism.age || '',
    gender: baptism.gender || '',
    civil_status: baptism.civil_status || '',
    profession: baptism.profession || '',
    spouse_name: baptism.spouse_name || '',
    marriage_date: baptism.marriage_date || null,
    children: baptism.children ? (typeof baptism.children === 'string' ? JSON.parse(baptism.children) : baptism.children) : [],
    desire_ministry: baptism.desire_ministry || '',
    address: baptism.address || '',
    email: baptism.email || '',
    phone_number: baptism.phone_number || ''
  }
  baptismDialog.value = true
}

const deleteBaptism = async (id) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      'Enter the reason for archiving this water baptism record:',
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

    const result = await waterBaptismStore.deleteBaptism(id, reason);
    if (result.success) {
      ElMessage.success('Water baptism record archived successfully');
    } else {
      ElMessage.error(result.error || 'Failed to archive water baptism record');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error archiving water baptism:', error);
      ElMessage.error('Failed to archive water baptism record');
    }
  }
}

// Selection methods
const isBaptismSelected = (baptism) => {
  return selectedBaptisms.value.some(selected => selected.baptism_id === baptism.baptism_id)
}

const toggleBaptismSelection = (baptism) => {
  const index = selectedBaptisms.value.findIndex(selected => selected.baptism_id === baptism.baptism_id)
  if (index > -1) {
    selectedBaptisms.value.splice(index, 1)
  } else {
    selectedBaptisms.value.push(baptism)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedBaptisms.value = []
  } else {
    selectedBaptisms.value = [...sortedBaptisms.value]
  }
}

const clearSelection = () => {
  selectedBaptisms.value = []
}

const bulkCompleteBaptisms = async () => {
  // Filter for eligible baptisms based on settings
  const targetBaptisms = selectedBaptisms.value.filter(b => {
    if (settings.value.allow_complete_without_schedule) {
      return ['approved', 'pending', 'scheduled'].includes(b.status);
    }
    return ['approved', 'scheduled'].includes(b.status);
  });
  
  if (targetBaptisms.length === 0) {
    ElMessage.warning(settings.value.allow_complete_without_schedule 
      ? 'No pending, approved or scheduled baptisms selected.' 
      : 'No approved or scheduled baptisms selected.');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validBaptisms = targetBaptisms.filter(b => {
    if (settings.value.allow_complete_without_schedule) return true;
    if (!b.baptism_date) return false;
    const baptismDate = new Date(b.baptism_date);
    baptismDate.setHours(0, 0, 0, 0);
    return baptismDate <= today;
  });

  const skippedCount = targetBaptisms.length - validBaptisms.length;

  if (validBaptisms.length === 0) {
    ElMessage.warning('Cannot mark future baptisms as completed. Please wait until the scheduled date or turn off Manual Completion restriction.');
    return;
  }
  
  // Set the baptisms to be completed and open the calendar dialog
  selectedBaptismsToComplete.value = validBaptisms;
  
  // Set default completion date to today if it's Sunday, or next Sunday
  const now = new Date();
  if (now.getDay() === 0) {
    completionDate.value = now.toISOString().split('T')[0];
  } else {
    // Just keep it empty for user to select
    completionDate.value = '';
  }
  completionTime.value = '13:00:00';
  bulkCompleteDialog.value = true;
};

const closeBulkCompleteDialog = () => {
  bulkCompleteDialog.value = false;
  completionDate.value = '';
  completionTime.value = '13:00:00';
  selectedBaptismsToComplete.value = [];
};

const confirmBulkComplete = async () => {
  try {
    const baptismIds = selectedBaptismsToComplete.value.map(b => b.baptism_id);
    
    const result = await waterBaptismStore.bulkCompleteWaterBaptisms(
      baptismIds, 
      completionDate.value, 
      completionTime.value
    );

    if (result.success) {
      const { completed, failed } = result.data || {};
      
      if (completed > 0) {
        ElMessage.success(`Successfully marked ${completed} water baptism record(s) as completed`);
      }
      
      if (failed > 0) {
        ElMessage.warning(`Failed to mark ${failed} water baptism record(s) as completed`);
      }
      
      bulkCompleteDialog.value = false;
      clearSelection();
    }
  } catch (error) {
    console.error('Error completing baptisms:', error);
    ElMessage.error('Failed to complete selected water baptism records');
  }
};

const markIndividualComplete = async (baptism) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (baptism.baptism_date && !settings.value.allow_complete_without_schedule) {
        const baptismDate = new Date(baptism.baptism_date);
        baptismDate.setHours(0, 0, 0, 0);
        if (baptismDate > today) {
            ElMessage.warning(`Cannot complete baptism scheduled for a future date (${baptism.baptism_date}) unless Manual Completion is ON.`);
            return;
        }
    }

    await ElMessageBox.confirm(
      `Mark water baptism for ${baptism.fullname || baptism.firstname + ' ' + baptism.lastname} as completed?`,
      'Mark Completed',
      {
        confirmButtonText: 'Yes, Complete',
        cancelButtonText: 'Cancel',
        type: 'success',
      }
    );
    
    const result = await waterBaptismStore.bulkCompleteWaterBaptisms([baptism.baptism_id]);
    if (result.success) {
      ElMessage.success('Water baptism marked as completed');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error completing individual baptism:', error);
      ElMessage.error('Failed to complete water baptism');
    }
  }
};

const bulkDeleteBaptisms = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `Enter the reason for deleting ${selectedBaptisms.value.length} selected water baptism record${selectedBaptisms.value.length > 1 ? 's' : ''}:`,
      'Confirm Bulk Delete',
      {
        confirmButtonText: 'Delete',
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

    // Extract baptism IDs
    const baptismIds = selectedBaptisms.value.map(baptism => baptism.baptism_id)

    // Use the new bulk delete endpoint with reason
    const result = await waterBaptismStore.bulkDeleteWaterBaptisms(baptismIds, reason)

    if (result.success) {
      const { deleted, failed } = result.data

      if (deleted > 0) {
        ElMessage.success(`Successfully deleted ${deleted} water baptism record${deleted > 1 ? 's' : ''}`)
      }

      if (failed > 0) {
        ElMessage.warning(`Failed to delete ${failed} water baptism record${failed > 1 ? 's' : ''}`)
      }
    }

    clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error bulk deleting baptisms:', error)
      ElMessage.error('Failed to delete selected water baptism records')
    }
  }
}

const handleSubmit = async (data) => {
  try {
    let result
    if (baptismData.value && baptismData.value.baptism_id) {
      // Update existing record
      result = await waterBaptismStore.updateBaptism(baptismData.value.baptism_id, data)
    } else {
      // Create new record for non-member
      const nonMemberData = {
        ...data,
        is_member: false,
        member_id: null
      }
      result = await waterBaptismStore.createBaptism(nonMemberData)
    }

    if (result.success) {
      ElMessage.success(baptismData.value ? 'Water baptism record updated successfully' : 'Water baptism record created successfully')
      baptismDialog.value = false
      baptismData.value = null
    } else {
      ElMessage.error(result.error || 'Failed to save water baptism record')
    }
  } catch (error) {
    console.error('Error submitting water baptism:', error)
    ElMessage.error('Failed to save water baptism record')
  }
}

const handleSearchChange = (value) => {
  // Clear previous timeout
  if (window.waterBaptismSearchTimeout) {
    clearTimeout(window.waterBaptismSearchTimeout)
  }

  // Set new timeout to trigger search after user stops typing (500ms delay)
  window.waterBaptismSearchTimeout = setTimeout(() => {
    waterBaptismStore.setSearchQuery(value)
  }, 500)
}

const handleFilterChange = () => {
  waterBaptismStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  waterBaptismStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  waterBaptismStore.setPageSize(pageSize)
}

const handleDateRangeChange = () => {
  waterBaptismStore.setFilters(filters.value)
}


const handleExportExcel = async () => {
  try {
    const result = await waterBaptismStore.exportBaptismsToExcel()
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
  if (sortedBaptisms.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, sortedBaptisms.value.length)
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const formatBaptismDateTime = (dateString, timeString, status) => {
  if (!dateString) return 'Not scheduled'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const datePart = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  // If status is completed, we want to show the full timestamp
  if (status === 'completed') {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // If explicit time string exists, use it
  if (timeString) {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    const formattedTime = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart} at ${formattedTime}`
  }

  // Check if date has a time component (not midnight)
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0
  if (hasTime) {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return datePart
}

const formatStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'scheduled': 'Scheduled',
    'approved': 'Approved',
    'disapproved': 'Disapproved',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colors = {
    'completed': 'success',
    'pending': 'warning',
    'approved': 'info',
    'disapproved': 'error',
    'cancelled': 'grey'
  }
  return colors[status] || 'default'
}

const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Member', 'Baptism Date & Time', 'Status', 'Date Created']
  
  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.middle_name || ''} ${userInfo.member.lastname || ''}`.trim()
    : userInfo?.account?.email || 'Admin'
  
  let tableRows = ''
  sortedBaptisms.value.forEach((baptism) => {
    tableRows += `
      <tr>
        <td>${baptism.fullname || baptism.member_id || 'N/A'}</td>
        <td>
          ${baptism.status === 'completed' ? '<div style="font-size: 10px; color: #4CAF50; font-weight: bold; margin-bottom: 2px;">DATE GOT SAVED:</div>' : ''}
          ${formatBaptismDateTime(baptism.baptism_date, baptism.baptism_time, baptism.status)}
        </td>
        <td>${formatStatus(baptism.status)}</td>
        <td>${formatDateTime(baptism.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Water Baptism Records - Print</title>
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
        <div class="report-title">Water Baptism Report</div>
        <table>
          <thead>
            <tr>
              \${tableHeaders.map(header => \`<th>\${header}</th>\`).join('')}
            </tr>
          </thead>
          <tbody>
            \${tableRows || '<tr><td colspan="' + tableHeaders.length + '" style="text-align: center;">No records found</td></tr>'}
          </tbody>
        </table>
        <div class="footer">
          <div>Total Records: \${sortedBaptisms.value.length}</div>
          <div class="footer-info">
            <div>Printed on: \${currentDate}</div>
            <div>Printed by: \${printedBy}</div>
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

const printCertificate = (baptism) => {
  certificateType.value = 'water_baptism'
  certificateData.value = {
    service: {
      ...baptism
    }
  }
  certificateDialog.value = true
}

// Watchers to clear selections when data changes
watch(() => baptisms.value, () => {
  clearSelection()
}, { deep: true })

watch(() => filters.value, () => {
  clearSelection()
}, { deep: true })

watch(() => currentPage.value, () => {
  clearSelection()
})

// Lifecycle
onMounted(() => {
    waterBaptismStore.fetchBaptisms()
    settingsStore.fetchSettings()
})

const toggleRestriction = async (val) => {
    await settingsStore.toggleAllowComplete(val)
}

// Cleanup timeout on unmount
onUnmounted(() => {
  if (window.waterBaptismSearchTimeout) {
    clearTimeout(window.waterBaptismSearchTimeout)
  }
})
</script>

<style scoped>
.water-baptism {
  padding: 24px;
}

.icon-custom {
  font-size: 32px !important;
  line-height: 1 !important;
  display: inline-block !important;
  font-family: "Material Design Icons" !important;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-rendering: auto;
  -webkit-font-smoothing: antialiased;
}

/* Ensure date picker calendar appears above dialogs */
:deep(.el-picker-panel) {
  z-index: 9999 !important;
}

:deep(.el-popper) {
  z-index: 9999 !important;
}

:deep(.el-picker-popper) {
  z-index: 9999 !important;
}

:deep(.bulk-complete-date-picker-popper) {
  z-index: 9999 !important;
}

/* Allow popper to overflow the card/dialog */
:deep(.v-card) {
  overflow: visible !important;
  position: relative;
}

:deep(.v-overlay__content) {
  overflow: visible !important;
}

:deep(.v-dialog__content) {
  overflow: visible !important;
}

:deep(.el-input__wrapper) {
  position: relative;
  z-index: auto !important;
}

/* Global popper z-index fix */
:deep(.bulk-complete-date-picker-popper.el-popper) {
  z-index: 9999 !important;
}
</style>

<!-- Non-scoped: targets the teleported popper which lives in <body> outside component scope -->
<style>
.bulk-complete-date-picker-popper.el-popper {
  z-index: 9999 !important;
}
.bulk-complete-date-picker-popper .el-picker-panel {
  z-index: 9999 !important;
}
</style>
