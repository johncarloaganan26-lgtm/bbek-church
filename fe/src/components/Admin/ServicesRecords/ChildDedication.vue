<template>
  <div class="child-dedication">
    <CertificateDialog
      v-model="certificateDialog"
      :certificate-type="certificateType"
      :certificate-data="certificateData"
    />
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Child Dedication Records</h1>
      
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
          @click="handleDedicationDialog"
          class="h-100"
          style="min-height: 48px;"
        >
          New Child Dedication
        </v-btn>
      </div>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Total Dedications</div>
              <div class="text-h5 font-weight-bold">{{ totalDedications }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-water icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">Dedicated</div>
              <div class="text-h5 font-weight-bold">{{ dedicated }}</div>
            </div>
            <v-avatar size="56" color="blue lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-water icon-custom" aria-hidden="true"></span>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption grey--text mb-1">New</div>
              <div class="text-h5 font-weight-bold">{{ newDedications }}</div>
            </div>
            <v-avatar size="56" color="green lighten-5" class="d-flex align-center justify-center">
              <span style="color: white !important;" class="mdi mdi-file-document icon-custom" aria-hidden="true"></span>
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
          <v-col cols="12" md="5" class="d-flex align-center gap-2">
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
        <div v-if="selectedDedications.length > 0" class="bulk-actions-bar mt-3 pa-3 d-flex align-center gap-2">
          <v-chip color="primary" size="small" class="mr-2 font-weight-bold px-3" label>
            <v-icon start size="14">mdi-checkbox-marked</v-icon>
            {{ selectedDedications.length }} SELECTED
          </v-chip>
          <v-btn
            color="success"
            variant="outlined"
            size="small"
            :disabled="loading"
            class="bulk-action-btn font-weight-bold text-uppercase"
            @click="bulkCompleteDedications"
          >
            <v-icon start size="16">mdi-check-all</v-icon>
            Mark Completed
          </v-btn>
          <v-btn
            color="error"
            variant="outlined"
            size="small"
            :disabled="loading"
            class="bulk-action-btn font-weight-bold text-uppercase"
            @click="bulkDeleteDedications"
          >
            <v-icon start size="16">mdi-archive</v-icon>
            Archive Selected
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            size="small"
            color="grey-darken-1"
            class="text-none"
            @click="clearSelection"
          >
            <v-icon start size="14">mdi-close</v-icon>
            Clear Selection
          </v-btn>
        </div>
        <v-row>
          <v-col cols="12" class="d-flex align-center">
            <span class="text-body-2">Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} dedications</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" v-loading="loading" loading-text="Loading child dedications..." class="position-relative">
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
             <!-- <th class="text-left font-weight-bold">Child ID</th> -->
             <th class="text-left font-weight-bold">Child Name</th>
            <th class="text-left font-weight-bold">Requester</th>
            <th class="text-left font-weight-bold">Preferred Date & Time</th>
            <th class="text-left font-weight-bold">Pastor</th>
            <th class="text-left font-weight-bold">Location</th>
            <th class="text-left font-weight-bold">Father</th>
            <th class="text-left font-weight-bold">Mother</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Date Created</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && sortedDedications.length === 0">
            <td colspan="10" class="text-center py-12">
              <div class="text-h6 font-weight-bold">No Record Found</div>
            </td>
          </tr>
          <tr v-for="dedication in sortedDedications" :key="dedication.child_id">
            <td>
              <v-checkbox
                :model-value="isDedicationSelected(dedication)"
                @update:model-value="toggleDedicationSelection(dedication)"
                density="compact"
                hide-details
              ></v-checkbox>
            </td>
            <!-- <td>{{ dedication.child_id }}</td> -->
            <td>{{ dedication.child_fullname || `${dedication.child_firstname || ''} ${dedication.child_lastname || ''}`.trim() }}</td>
            <td>{{ dedication.requester_fullname || dedication.requested_by }}</td>
            <td>
              <div v-if="dedication.status === 'completed'" class="text-success font-weight-bold" style="font-size: 0.7rem; letter-spacing: 0.5px;">DATE GOT DEDICATED:</div>
              <div :class="{'font-weight-medium': dedication.status === 'completed'}">
                {{ formatDateTimeWithTime(dedication.preferred_dedication_date, dedication.preferred_dedication_time, dedication.status) }}
              </div>
            </td>
            <td>{{ dedication.pastor || 'N/A' }}</td>
            <td>{{ dedication.location || 'N/A' }}</td>
            <td>{{ getFatherDisplayName(dedication) }}</td>
            <td>{{ getMotherDisplayName(dedication) }}</td>
            <td>
              <v-chip :color="getStatusColor(dedication.status)" size="small">
                {{ formatStatus(dedication.status) }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(dedication.date_created) }}</td>
            <td>
              <v-tooltip v-if="['pending', 'approved'].includes(dedication.status) && (dedication.status === 'approved' || settings.allow_complete_without_schedule)" text="Mark Completed" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-check" 
                    variant="text" 
                    size="small" 
                    color="success"
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="markIndividualComplete(dedication)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip v-if="dedication.status === 'completed'" text="Print Certificate" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-certificate" 
                    variant="text" 
                    size="small" 
                    color="success"
                    class="mr-2"
                    v-bind="props"
                    @click="printCertificate(dedication)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Edit Child Dedication" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    size="small" 
                    class="mr-2"
                    :disabled="loading"
                    v-bind="props"
                    @click="editDedication(dedication)"
                  ></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Archive Child Dedication" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small" 
                    color="error"
                    :disabled="loading"
                    v-bind="props"
                    @click="deleteDedication(dedication.child_id)"
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
          Showing {{ getStartIndex() }} - {{ getEndIndex() }} of {{ totalCount }} dedications
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
    <ChildDedicationDialog
      v-model="childDedicationDialog"
      :dedication-data="dedicationData"
      @update:model-value="childDedicationDialog = $event"
      @submit="handleSubmit"
    />

    <!-- Bulk Complete Calendar Dialog -->
    <v-dialog v-model="bulkCompleteDialog" max-width="450px" persistent class="bulk-complete-dialog" style="overflow: visible;">
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
          <h2 class="text-h5 font-weight-bold mb-1">Set Dedication Completion Date</h2>
          <p class="text-body-2 text-grey-darken-1">
            Selected {{ selectedDedications?.length }} child dedication{{ selectedDedications?.length > 1 ? 's' : '' }} to mark as completed.
          </p>
        </div>

        <v-card-text class="pt-0" style="overflow: visible;">  
          <v-divider class="mb-6"></v-divider>
          
          <div class="mb-5">
            <div class="d-flex align-center mb-2">
              <v-icon size="18" color="primary" class="mr-2">mdi-calendar</v-icon>
              <span class="text-subtitle-2 font-weight-bold text-uppercase" style="letter-spacing: 0.5px; font-size: 0.75rem;">Dedication Date (Sundays Only)</span>
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

          <div class="mb-5">
            <div class="d-flex align-center mb-2">
              <v-icon size="18" color="primary" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-subtitle-2 font-weight-bold text-uppercase" style="letter-spacing: 0.5px; font-size: 0.75rem;">Dedication Time</span>
            </div>
            <v-select
              v-model="completionTime"
              :items="timeOptions"
              label="Select Time"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 gap-2">
          <v-btn
            variant="outlined"
            color="grey"
            @click="closeBulkCompleteDialog"
            :disabled="isCompletingBulk"
          >
            Cancel
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            variant="flat"
            @click="confirmBulkComplete"
            :loading="isCompletingBulk"
            :disabled="!completionDate || !completionTime"
          >
            <v-icon left>mdi-check</v-icon>
            Mark as Completed
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useChildDedicationStore } from '@/stores/ServicesRecords/childDedicationStore'
import { useSystemSettingsStore } from '@/stores/admin/systemSettingsStore'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChildDedicationDialog from '@/components/Dialogs/ChildDedicationDialog.vue'
import CertificateDialog from '@/components/Dialogs/CertificateDialog.vue'

const childDedicationStore = useChildDedicationStore()
const settingsStore = useSystemSettingsStore()
const { settings, loading: settingsLoading } = storeToRefs(settingsStore)

// Selection state
const selectedDedications = ref([])

// Computed properties from store
const dedications = computed(() => childDedicationStore.dedications)

// Sort dedications with Pending status first, followed by other statuses in specified order
const sortedDedications = computed(() => {
  const statusOrder = {
    'pending': 1,
    'approved': 2,
    'disapproved': 3,
    'completed': 4,
    'cancelled': 5
  }
  
  return [...dedications.value].sort((a, b) => {
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

const loading = computed(() => childDedicationStore.loading)
const currentPage = computed({
  get: () => childDedicationStore.currentPage,
  set: (value) => childDedicationStore.setCurrentPage(value)
})
const totalPages = computed(() => childDedicationStore.totalPages)
const totalCount = computed(() => childDedicationStore.totalCount)
const totalDedications = computed(() => childDedicationStore.totalDedications)
const dedicated = computed(() => childDedicationStore.dedicated)
const newDedications = computed(() => childDedicationStore.newDedications)
const itemsPerPage = computed({
  get: () => childDedicationStore.itemsPerPage,
  set: (value) => childDedicationStore.setPageSize(value)
})
const pageSizeOptions = computed(() => childDedicationStore.pageSizeOptions)
const searchQuery = computed({
  get: () => childDedicationStore.searchQuery,
  set: (value) => {
    // Update the store value without triggering search
    childDedicationStore.searchQuery = value
  }
})
const filters = computed({
  get: () => childDedicationStore.filters,
  set: (value) => childDedicationStore.setFilters(value)
})

// Selection computed properties
const isAllSelected = computed(() => {
  return sortedDedications.value.length > 0 && selectedDedications.value.length === sortedDedications.value.length
})

const isIndeterminate = computed(() => {
  return selectedDedications.value.length > 0 && selectedDedications.value.length < sortedDedications.value.length
})

const sortByOptions = [
  'Status (Pending First)',
  'Dedication Date (Newest)',
  'Dedication Date (Oldest)',
  'Child ID (A-Z)',
  'Child ID (Z-A)',
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
const childDedicationDialog = ref(false)
const dedicationData = ref(null)
const certificateDialog = ref(false)
const certificateType = ref('')
const certificateData = ref(null)

// Bulk complete dialog state
const bulkCompleteDialog = ref(false)
const completionDate = ref('')
const completionTime = ref('')
const isCompletingBulk = ref(false)
const selectedDedicationsToComplete = ref([])

// Time options for dedication
const timeOptions = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM'
]

// Handlers
const handleDedicationDialog = () => {
  dedicationData.value = null
  childDedicationDialog.value = true
}

const editDedication = (dedication) => {
  dedicationData.value = {
    child_id: dedication.child_id,
    requested_by: dedication.requested_by,
    requester_relationship: dedication.requester_relationship,
    child_firstname: dedication.child_firstname,
    child_lastname: dedication.child_lastname,
    child_middle_name: dedication.child_middle_name,
    date_of_birth: dedication.date_of_birth,
    place_of_birth: dedication.place_of_birth,
    gender: dedication.gender,
    preferred_dedication_date: dedication.preferred_dedication_date,
    preferred_dedication_time: dedication.preferred_dedication_time,
    contact_phone_number: dedication.contact_phone_number,
    contact_email: dedication.contact_email,
    contact_address: dedication.contact_address,
    father_firstname: dedication.father_firstname,
    father_lastname: dedication.father_lastname,
    father_middle_name: dedication.father_middle_name,
    father_phone_number: dedication.father_phone_number,
    father_email: dedication.father_email,
    father_address: dedication.father_address,
    mother_firstname: dedication.mother_firstname,
    mother_lastname: dedication.mother_lastname,
    mother_middle_name: dedication.mother_middle_name,
    mother_phone_number: dedication.mother_phone_number,
    mother_email: dedication.mother_email,
    mother_address: dedication.mother_address,
    pastor: dedication.pastor,
    location: dedication.location,
    status: dedication.status
  }
  childDedicationDialog.value = true
}

const deleteDedication = async (id) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      'Enter the reason for archiving this child dedication:',
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

    const result = await childDedicationStore.deleteDedication(id, reason);
    if (result.success) {
      ElMessage.success('Child dedication archived successfully');
    } else {
      ElMessage.error(result.error || 'Failed to archive child dedication');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error archiving child dedication:', error);
      ElMessage.error('Failed to archive child dedication');
    }
  }
}

// Selection methods
const isDedicationSelected = (dedication) => {
  return selectedDedications.value.some(selected => selected.child_id === dedication.child_id)
}

const toggleDedicationSelection = (dedication) => {
  const index = selectedDedications.value.findIndex(selected => selected.child_id === dedication.child_id)
  if (index > -1) {
    selectedDedications.value.splice(index, 1)
  } else {
    selectedDedications.value.push(dedication)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedDedications.value = []
  } else {
    selectedDedications.value = [...sortedDedications.value]
  }
}

const clearSelection = () => {
  selectedDedications.value = []
}

const bulkCompleteDedications = async () => {
  // Filter for approved/pending dedications based on settings
  const targetDedications = selectedDedications.value.filter(d => {
    if (settings.value.allow_complete_without_schedule) {
      return d.status === 'approved' || d.status === 'pending';
    }
    return d.status === 'approved';
  });
  
  if (targetDedications.length === 0) {
    ElMessage.warning(settings.value.allow_complete_without_schedule 
      ? 'No pending or approved dedications selected.' 
      : 'No approved dedications selected.');
    return;
  }

  // Check dates: cannot complete future dedications (if restriction is enabled)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validDedications = targetDedications.filter(d => {
    if (settings.value.allow_complete_without_schedule) return true;
    if (!d.preferred_dedication_date) return false;
    const dedicationDate = new Date(d.preferred_dedication_date);
    dedicationDate.setHours(0, 0, 0, 0);
    return dedicationDate <= today;
  });

  const skippedCount = targetDedications.length - validDedications.length;

  if (validDedications.length === 0) {
    ElMessage.warning('Cannot mark future dedications as completed. Please wait until the scheduled date or turn off Completion Restriction.');
    return;
  }
  
  // Show calendar dialog for selecting completion date and time
  selectedDedicationsToComplete.value = validDedications;
  completionDate.value = '';
  completionTime.value = '';
  bulkCompleteDialog.value = true;
}

// Bulk complete dialog functions
const closeBulkCompleteDialog = () => {
  bulkCompleteDialog.value = false;
  completionDate.value = '';
  completionTime.value = '';
  selectedDedicationsToComplete.value = [];
};

const confirmBulkComplete = async () => {
  if (!completionDate.value || !completionTime.value) {
    ElMessage.warning('Please select both date and time');
    return;
  }

  try {
    isCompletingBulk.value = true;

    const childIds = selectedDedicationsToComplete.value.map(d => d.child_id);
    const result = await childDedicationStore.bulkCompleteChildDedications(childIds, {
      completion_date: completionDate.value,
      completion_time: completionTime.value
    });

    if (result.success) {
      const { completed, failed, message } = result.data || {};
      if (completed > 0) {
        ElMessage.success(`Successfully marked ${completed} child dedication(s) as completed`);
      }
      if (failed > 0) {
        ElMessage.warning(`Failed to mark ${failed} child dedication(s) as completed`);
      }
      if (message) {
        ElMessage.info(message);
      }
      clearSelection();
      closeBulkCompleteDialog();
    }
  } catch (error) {
    console.error('Error completing child dedications:', error);
    ElMessage.error('Failed to complete child dedications');
  } finally {
    isCompletingBulk.value = false;
  }
};

// Disable non-Sunday dates
const disableNonSundays = (time) => {
  const date = new Date(time);
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0; // 0 = Sunday
};

const markIndividualComplete = async (dedication) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dedication.preferred_dedication_date && !settings.value.allow_complete_without_schedule) {
        const dedicationDate = new Date(dedication.preferred_dedication_date);
        dedicationDate.setHours(0, 0, 0, 0);
        if (dedicationDate > today) {
            ElMessage.warning(`Cannot complete dedication scheduled for a future date (${dedication.preferred_dedication_date}) unless Manual Completion is ON.`);
            return;
        }
    }

    await ElMessageBox.confirm(
      `Mark child dedication for ${dedication.child_fullname || dedication.child_firstname + ' ' + dedication.child_lastname} as completed?`,
      'Mark Completed',
      {
        confirmButtonText: 'Yes, Complete',
        cancelButtonText: 'Cancel',
        type: 'success',
      }
    );
    
    const result = await childDedicationStore.bulkCompleteChildDedications([dedication.child_id]);
    if (result.success) {
      ElMessage.success('Child dedication marked as completed');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error completing individual dedication:', error);
      ElMessage.error('Failed to complete child dedication');
    }
  }
};

const bulkDeleteDedications = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `Enter the reason for deleting ${selectedDedications.value.length} selected child dedication${selectedDedications.value.length > 1 ? 's' : ''}:`,
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

    // Extract child IDs
    const childIds = selectedDedications.value.map(dedication => dedication.child_id)

    // Use the new bulk delete endpoint with reason
    const result = await childDedicationStore.bulkDeleteChildDedications(childIds, reason)

    if (result.success) {
      const { deleted, failed } = result.data

      if (deleted > 0) {
        ElMessage.success(`Successfully deleted ${deleted} child dedication${deleted > 1 ? 's' : ''}`)
      }

      if (failed > 0) {
        ElMessage.warning(`Failed to delete ${failed} child dedication${failed > 1 ? 's' : ''}`)
      }
    }

    clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error bulk deleting dedications:', error)
      ElMessage.error('Failed to delete selected child dedications')
    }
  }
}

const handleSubmit = async (payload) => {
  const { data, remember } = payload
  try {
    let result
    if (dedicationData.value && dedicationData.value.child_id) {
      // Update
      result = await childDedicationStore.updateDedication(dedicationData.value.child_id, data)
    } else {
      // Create
      result = await childDedicationStore.createDedication(data)
    }

    if (result.success) {
      ElMessage.success(dedicationData.value ? 'Child dedication updated successfully' : 'Child dedication created successfully')
      
      // If remember is true, don't close the dialog and don't reset dedicationData (which would be null anyway for new)
      if (!remember) {
        childDedicationDialog.value = false
        dedicationData.value = null
      }
      
      // Refresh the list
      await childDedicationStore.fetchDedications()
    } else {
      ElMessage.error(result.error || 'Failed to save child dedication')
    }
  } catch (error) {
    console.error('Error submitting child dedication:', error)
    ElMessage.error('Failed to save child dedication')
  }
}

const handleSearchChange = (value) => {
  // Clear previous timeout
  if (window.childDedicationSearchTimeout) {
    clearTimeout(window.childDedicationSearchTimeout)
  }

  // Set new timeout to trigger search after user stops typing (500ms delay)
  window.childDedicationSearchTimeout = setTimeout(() => {
    childDedicationStore.setSearchQuery(value)
  }, 500)
}

const handleFilterChange = () => {
  childDedicationStore.setFilters(filters.value)
}

const handleDateRangeChange = () => {
  childDedicationStore.setFilters(filters.value)
}

const handlePageChange = (page) => {
  childDedicationStore.setCurrentPage(page)
}

const handlePageSizeChange = (pageSize) => {
  childDedicationStore.setPageSize(pageSize)
}

const handleExportExcel = async () => {
  try {
    const result = await childDedicationStore.exportDedicationsToExcel()
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
  if (sortedDedications.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
}

const getEndIndex = () => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, sortedDedications.value.length)
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

const formatDateTimeWithTime = (dateString, timeString, status) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const formattedDate = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  
  if (timeString) {
    // Convert 24-hour format to 12-hour format with AM/PM (ignoring seconds)
    const parts = timeString.split(':')
    const hours = parseInt(parts[0], 10)
    const minutes = parts[1] || '00'
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHour = hours % 12 || 12
    const formattedTime = `${displayHour}:${minutes} ${ampm}`
    return `${formattedDate} • ${formattedTime}`
  }
  
  return formattedDate
}

const getFatherDisplayName = (dedication) => {
  if (dedication?.father_fullname && dedication.father_fullname.trim()) {
    return dedication.father_fullname.trim()
  }
  if (dedication?.father_firstname && dedication?.father_lastname) {
    const middleName = dedication.father_middle_name ? ` ${dedication.father_middle_name} ` : ' '
    const fullName = `${dedication.father_firstname}${middleName}${dedication.father_lastname}`.trim()
    if (fullName) return fullName
  }
  // Fallback: if requester is male, show requester name
  if (dedication?.requester_gender === 'M' && dedication?.requester_fullname) {
    return dedication.requester_fullname
  }
  return 'N/A'
}

const getMotherDisplayName = (dedication) => {
  if (dedication?.mother_fullname && dedication.mother_fullname.trim()) {
    return dedication.mother_fullname.trim()
  }
  if (dedication?.mother_firstname && dedication?.mother_lastname) {
    const middleName = dedication.mother_middle_name ? ` ${dedication.mother_middle_name} ` : ' '
    const fullName = `${dedication.mother_firstname}${middleName}${dedication.mother_lastname}`.trim()
    if (fullName) return fullName
  }
  // Fallback: if requester is female, show requester name
  if (dedication?.requester_gender === 'F' && dedication?.requester_fullname) {
    return dedication.requester_fullname
  }
  return 'N/A'
}

const formatGuardians = (guardians) => {
  // Deprecated: kept for backward compatibility, but should use getFatherDisplayName/getMotherDisplayName
  if (!guardians) return 'N/A'
  if (Array.isArray(guardians)) {
    return guardians.map(g => {
      const parts = []
      if (g.firstname) parts.push(g.firstname)
      if (g.middle_name) parts.push(g.middle_name)
      if (g.lastname) parts.push(g.lastname)
      return parts.join(' ')
    }).join(', ') || 'N/A'
  }
  return 'N/A'
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
    'completed': 'success',
    'pending': 'warning',
    'ongoing': 'info'
  }
  return colors[status] || 'default'
}

const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  const tableHeaders = ['Child Name', 'Requester', 'Preferred Date & Time', 'Pastor', 'Location', 'Father', 'Mother', 'Status', 'Date Created']

  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.middle_name || ''} ${userInfo.member.lastname || ''}`.trim()
    : userInfo?.account?.email || 'Admin'

  let tableRows = ''
  sortedDedications.value.forEach((dedication) => {
    const childName = dedication.child_fullname || `${dedication.child_firstname || ''} ${dedication.child_lastname || ''}`.trim() || 'N/A'
    const requesterName = dedication.requester_fullname || dedication.requested_by || 'N/A'
    const pastorName = dedication.pastor || 'N/A'
    const locationName = dedication.location || 'N/A'
    tableRows += `
      <tr>
        <td>${childName}</td>
        <td>${requesterName}</td>
        <td>
          ${dedication.status === 'completed' ? '<div style="font-size: 10px; color: #4CAF50; font-weight: bold; margin-bottom: 2px;">DATE GOT DEDICATED:</div>' : ''}
          ${formatDateTimeWithTime(dedication.preferred_dedication_date, dedication.preferred_dedication_time, dedication.status)}
        </td>
        <td>${pastorName}</td>
        <td>${locationName}</td>
        <td>${getFatherDisplayName(dedication)}</td>
        <td>${getMotherDisplayName(dedication)}</td>
        <td>${formatStatus(dedication.status)}</td>
        <td>${formatDateTime(dedication.date_created)}</td>
      </tr>
    `
  })
  
  const currentDate = new Date().toLocaleString()
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Child Dedication Records - Print</title>
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
        <div class="report-title">Child Dedication Report</div>
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
          <div>Total Records: ${sortedDedications.value.length}</div>
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

const printCertificate = (dedication) => {
  certificateType.value = 'child_dedication'
  certificateData.value = {
    service: {
      ...dedication
    }
  }
  certificateDialog.value = true
}

// Watchers to clear selections when data changes
watch(() => dedications.value, () => {
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
    childDedicationStore.fetchDedications()
    settingsStore.fetchSettings()
})

const toggleRestriction = async (val) => {
    await settingsStore.toggleAllowComplete(val)
}

// Cleanup timeout on unmount
onUnmounted(() => {
  if (window.childDedicationSearchTimeout) {
    clearTimeout(window.childDedicationSearchTimeout)
  }
})
</script>

<style scoped>
.child-dedication {
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
</style>
