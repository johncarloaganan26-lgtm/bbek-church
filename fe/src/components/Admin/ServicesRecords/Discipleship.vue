<template>
  <div class="discipleship-records pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Discipleship Requests</h1>
      <v-btn
        color="success"
        prepend-icon="mdi-plus"
        size="small"
        @click="openAddDialog"
      >
        New Request
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search Name/Email"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleSearch"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="['All Status', 'Pending', 'Scheduled', 'Completed', 'Promoted', 'Cancelled']"
              label="Filter Status"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleFilter"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2">
      <!-- Selection Actions Bar -->
      <div v-if="selectedRequests.length > 0" class="bg-success-lighten-5 pa-2 d-flex align-center">
        <v-chip color="success" size="small" class="mr-2">{{ selectedRequests.length }} selected</v-chip>
        <v-btn size="small" color="success" variant="outlined" @click="bulkComplete" :loading="loading">
          <v-icon left>mdi-check-all</v-icon>
          Mark as Completed
        </v-btn>
        <v-btn size="small" color="error" variant="outlined" class="ml-2" @click="bulkArchive">
          <v-icon left>mdi-archive</v-icon>
          Archive Selected
        </v-btn>
        <v-btn size="small" variant="text" class="ml-2" @click="clearSelection">Clear</v-btn>
        <v-spacer></v-spacer>
        <span class="text-caption text-grey-darken-1 mr-4" v-if="hasNonScheduled">
          <v-icon size="small" color="warning">mdi-alert</v-icon>
          Only "Scheduled" records can be completed
        </span>
      </div>
      <v-table>
        <thead>
          <tr>
            <th class="text-center" style="width: 50px;">
              <v-checkbox
                v-model="selectAll"
                density="compact"
                hide-details
                @update:model-value="toggleSelectAll"
              ></v-checkbox>
            </th>
            <th class="text-left font-weight-bold">Name</th>
            <th class="text-left font-weight-bold">Email</th>
            <th class="text-left font-weight-bold">Request Type</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Schedule</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
             <td colspan="7" class="text-center pa-4">Loading...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
             <td colspan="7" class="text-center pa-4">No requests found.</td>
          </tr>
          <tr v-for="item in requests" :key="item.request_id">
            <td class="text-center">
              <v-checkbox
                v-model="selectedRequests"
                :value="item.request_id"
                density="compact"
                hide-details
              ></v-checkbox>
            </td>
            <td>{{ item.firstname }} {{ item.lastname }}</td>
            <td>{{ item.email }}</td>
            <td>
              <v-chip size="small" :color="getRequestTypeColor(item.request_type)" class="text-white">
                {{ item.request_type }}
              </v-chip>
            </td>
            <td>
              <v-chip size="small" :color="getStatusColor(item.status)" class="text-white">
                {{ item.status }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(item.scheduled_date) }}</td>
            <td>
              <div class="d-flex gap-2 align-center">
                <v-btn
                  variant="tonal"
                  size="small"
                  color="primary"
                  @click="openScheduleDialog(item)"
                  v-if="item.status !== 'Promoted'"
                >
                  <v-icon>mdi-calendar-clock</v-icon>
                  <v-tooltip activator="parent" location="top">Update Status / Schedule</v-tooltip>
                </v-btn>

                <v-btn
                  variant="tonal"
                  size="small"
                  color="success"
                  @click="promoteRequest(item)"
                  v-if="item.status === 'Completed'"
                >
                  <v-icon>mdi-water</v-icon>
                  <v-tooltip activator="parent" location="top">Promote to Water Baptism</v-tooltip>
                </v-btn>

                <v-btn
                  variant="tonal"
                  size="small"
                  color="error"
                  @click="deleteItem(item)"
                >
                  <v-icon>mdi-archive</v-icon>
                  <v-tooltip activator="parent" location="top">Archive Request</v-tooltip>
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <!-- Pagination -->
      <div class="d-flex justify-end pa-4">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"
          density="compact"
          @update:model-value="handlePageChange"
        ></v-pagination>
      </div>
    </v-card>

    <!-- Update Dialog -->
    <v-dialog v-model="dialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
           Update Request
        </v-card-title>
        <v-card-text class="mt-4">
          <div v-if="!isEditing">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="selectedRequest.firstname" label="First Name" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="selectedRequest.lastname" label="Last Name" variant="outlined" density="compact"></v-text-field>
              </v-col>
            </v-row>
            <v-text-field v-model="selectedRequest.email" label="Email Address" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="selectedRequest.phone_number" label="Phone Number" variant="outlined" density="compact"></v-text-field>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="selectedRequest.birthdate" label="Birthday" type="date" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="selectedRequest.age" label="Age" type="number" variant="outlined" density="compact" readonly></v-text-field>
              </v-col>
            </v-row>
          </div>

          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedRequest.pastor_id"
                :items="pastors"
                item-title="name"
                item-value="acc_id"
                label="Assigned Pastor"
                variant="outlined"
                density="compact"
                clearable
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="selectedRequest.location" label="Location" variant="outlined" density="compact"></v-text-field>
            </v-col>
          </v-row>

          <v-select
            v-model="selectedRequest.status"
            :items="statusItems"
            label="Status"
            variant="outlined"
            density="compact"
          ></v-select>

          <label class="text-caption grey--text mb-1 d-block">Schedule Date & Time</label>
          <el-date-picker
            v-model="selectedRequest.scheduled_date"
            type="datetime"
            placeholder="Select Sunday date and time"
            style="width: 100%"
            :disabled-date="disabledDate"
            format="YYYY-MM-DD hh:mm A"
            value-format="YYYY-MM-DD HH:mm:ss"
            :default-time="new Date(0, 0, 0, 9, 0, 0)"
            popper-class="discipleship-date-picker"
          />
          <div class="text-caption grey--text mt-1">Schedules are strictly limited to Sundays</div>

          <v-textarea
            v-model="selectedRequest.notes"
            label="Notes / Remarks"
            variant="outlined"
            rows="3"
            class="mt-3"
          ></v-textarea>

          <div v-if="formattedSchedulePreview" class="mt-4 pa-3 bg-teal-lighten-5 rounded border-teal">
            <div class="text-caption text-teal-darken-3 font-weight-bold">VALIDATED SCHEDULE (SUNDAY)</div>
            <div class="text-h6 text-teal-darken-4">{{ formattedSchedulePreview }}</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialogVisible = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveUpdate" :loading="store.loading">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Promotion Choice Dialog -->
    <v-dialog v-model="promotionDialogVisible" max-width="450px">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-teal text-white text-center py-4">
          <v-icon large class="mr-2">mdi-water-check</v-icon>
          Water Baptism Promotion
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="text-body-1 mb-6 text-center">
            How would you like to proceed with <b>{{ promotingItem?.firstname }} {{ promotingItem?.lastname }}</b>?
          </p>
          
          <v-btn
            block
            color="teal-darken-1"
            size="large"
            variant="tonal"
            class="mb-4 py-6"
            @click="handlePromotionAction(true)"
            :loading="loadingPromotion"
          >
            <div class="d-flex flex-column align-start" style="width: 100%">
              <div class="font-weight-bold">Candidate Decided</div>
              <div class="text-caption">Promote directly to Water Baptism module</div>
            </div>
          </v-btn>

          <v-btn
            block
            color="grey-darken-2"
            size="large"
            variant="tonal"
            class="py-6"
            @click="handlePromotionAction(false)"
            :loading="loadingPromotion"
          >
            <div class="d-flex flex-column align-start" style="width: 100%">
              <div class="font-weight-bold">Requester Undecided</div>
              <div class="text-caption">Send invitation link for consideration</div>
            </div>
          </v-btn>
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="promotionDialogVisible = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminDiscipleshipStore } from '@/stores/admin/discipleshipStore';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';

const store = useAdminDiscipleshipStore();
const router = useRouter();
const { requests, loading, totalCount, currentPage, pageSize, pastors } = storeToRefs(store);

onMounted(() => {
    store.fetchRequests();
    store.fetchPastors();
});

const search = ref('');
const statusFilter = ref('All Status'); // Standardized to 'All Status' for consistency across admin pages
const sortBy = ref('Date Created (Newest)'); // Added
const page = ref(1); // Added
// pageSize is already destructured from storeToRefs, so no need to declare here.
const dialogVisible = ref(false);
const promotionDialogVisible = ref(false);
const promotingItem = ref(null);
const loadingPromotion = ref(false);
const selectedRequest = ref({});
const isEditing = ref(false);
const deleteReason = ref('');
const showDeleteReasonDialog = ref(false);
const itemToDelete = ref(null);
const selectedRequests = ref([]);
const selectAll = ref(false);

const toggleSelectAll = (value) => {
  if (value) {
    selectedRequests.value = requests.value.map(r => r.request_id);
  } else {
    selectedRequests.value = [];
  }
};

const statusItems = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let isFutureOrMissing = true;
  if (selectedRequest.value.scheduled_date) {
    const scheduledDate = new Date(selectedRequest.value.scheduled_date);
    scheduledDate.setHours(0, 0, 0, 0);
    isFutureOrMissing = scheduledDate > today;
  }
  
  return [
    { title: 'Pending', value: 'Pending' },
    { title: 'Scheduled', value: 'Scheduled' },
    { title: 'Completed', value: 'Completed', props: { disabled: isFutureOrMissing } },
    { title: 'Cancelled', value: 'Cancelled' }
  ];
});

const clearSelection = () => {
  selectedRequests.value = [];
  selectAll.value = false;
};

// Check if selected requests contain non-Scheduled records
const hasNonScheduled = computed(() => {
  if (selectedRequests.value.length === 0) return false;
  return requests.value
    .filter(r => selectedRequests.value.includes(r.request_id))
    .some(r => r.status !== 'Scheduled');
});

// Bulk complete selected requests (only Scheduled status can be completed)
const bulkComplete = async () => {
  if (selectedRequests.value.length === 0) {
    ElMessage.warning('No requests selected');
    return;
  }
  
  // Get selected records
  const selectedRecords = requests.value.filter(r => selectedRequests.value.includes(r.request_id));
  
  // Check if any selected record is not in Scheduled status
  const nonScheduledRecords = selectedRecords.filter(r => r.status !== 'Scheduled');
  
  if (nonScheduledRecords.length > 0) {
    ElMessage.error(`Cannot complete ${nonScheduledRecords.length} record(s) that are not in "Scheduled" status. Only "Scheduled" records can be marked as completed.`);
    return;
  }
  
  // Check dates: cannot complete future scheduled requests
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validRecords = selectedRecords.filter(r => {
    // If no scheduled date, allow completion (admin discretion)
    if (!r.scheduled_date) return true;
    const scheduledDate = new Date(r.scheduled_date);
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate <= today;
  });

  const skippedCount = selectedRecords.length - validRecords.length;

  if (validRecords.length === 0) {
    ElMessage.warning('Cannot mark future scheduled requests as completed. Please wait until the scheduled date.');
    return;
  }
  
  try {
    let confirmMessage = `Are you sure you want to mark ${validRecords.length} scheduled request(s) as completed?`;
    if (skippedCount > 0) {
      confirmMessage += `\n\n(${skippedCount} record(s) were skipped because their scheduled date is in the future.)`;
    }

    await ElMessageBox.confirm(
      confirmMessage,
      'Bulk Complete Requests',
      {
        confirmButtonText: 'Yes, Complete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
    
    // Only complete valid records (past scheduled dates)
    const validRequestIds = validRecords.map(r => r.request_id);
    const result = await store.bulkCompleteRequests(validRequestIds);
    if (result.success) {
      const { completed, failed } = result.data || {};
      
      if (completed && completed.length > 0) {
        ElMessage.success(`Successfully marked ${completed.length} request(s) as completed`);
      }
      
      if (failed && failed.length > 0) {
        ElMessage.warning(`${failed.length} request(s) failed to complete`);
      }
      
      clearSelection();
    } else if (result.message) {
      ElMessage.error(result.message);
    }
  } catch {
    // User cancelled
  }
};

const bulkArchive = async () => {
  if (selectedRequests.value.length === 0) {
    ElMessage.warning('No requests selected');
    return;
  }
  
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `Enter the reason for archiving ${selectedRequests.value.length} selected requests:`,
      'Bulk Archive Requests',
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
    
    const result = await store.bulkArchiveRequests(selectedRequests.value, reason);
    if (result.success) {
      clearSelection();
    }
  } catch {
    // User cancelled
  }
};

// Watch for selection changes
watch(selectedRequests, (newVal) => {
  selectAll.value = newVal.length === requests.value.length && requests.value.length > 0;
}, { deep: true });

// Auto-calculate age from birthdate in Admin dialog
watch(() => selectedRequest.value?.birthdate, (newDate) => {
  if (newDate) {
    const today = new Date();
    const birthDate = new Date(newDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    selectedRequest.value.age = age;
  }
}, { deep: true });

const formattedSchedulePreview = computed(() => {
  if (!selectedRequest.value.scheduled_date) return '';
  const d = new Date(selectedRequest.value.scheduled_date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

const headers = [
  { title: 'Name', key: 'fullname', align: 'start' },
  { title: 'Email', key: 'email' },
  { title: 'Pastor', key: 'pastor_id' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const totalPages = computed(() => {
    return Math.ceil((totalCount.value || 0) / pageSize.value) || 1;
});

const fetchData = () => {
    store.fetchRequests();
};

onMounted(() => {
  fetchData();
});

const handleSearch = (val) => {
    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        store.setFilters({ search: val });
    }, 500);
};

const handleFilter = (val) => {
    store.setFilters({ status: val });
};

const handlePageChange = (page) => {
  store.setPage(page);
};

const getRequestTypeColor = (type) => {
  if (type === 'Salvation') return 'orange';
  if (type === 'Bible Study') return 'blue';
  return 'purple'; // Both
};

const getStatusColor = (status) => {
  switch(status) {
      case 'Pending': return 'warning';
      case 'Scheduled': return 'info';
      case 'Completed': return 'success';
      case 'Promoted': return 'teal';
      case 'Cancelled': return 'grey';
      default: return 'grey';
  }
};

const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const openAddDialog = () => {
  isEditing.value = false;
  selectedRequest.value = {
    firstname: '',
    lastname: '',
    email: '',
    phone_number: '',
    request_type: 'Both',
    status: 'Pending',
    scheduled_date: '',
    notes: ''
  };
  dialogVisible.value = true;
};

const openScheduleDialog = (item) => {
  isEditing.value = true;
  selectedRequest.value = { ...item };
  
  // Ensure notes is a string and not [object Object]
  if (typeof selectedRequest.value.notes === 'object' && selectedRequest.value.notes !== null) {
    selectedRequest.value.notes = JSON.stringify(selectedRequest.value.notes);
  } else if (selectedRequest.value.notes === null || selectedRequest.value.notes === undefined) {
    selectedRequest.value.notes = '';
  }
  
  dialogVisible.value = true;
};

const saveUpdate = async () => {
  if (!isEditing.value) {
    if (!selectedRequest.value.firstname || !selectedRequest.value.lastname || !selectedRequest.value.email) {
      ElMessage.warning('Please fill in required fields (Name and Email)');
      return;
    }
    const success = await store.createRequest(selectedRequest.value); 
    if (success) {
        dialogVisible.value = false;
    }
  } else {
    const success = await store.updateRequest(selectedRequest.value.request_id, {
      firstname: selectedRequest.value.firstname,
      lastname: selectedRequest.value.lastname,
      email: selectedRequest.value.email,
      status: selectedRequest.value.status,
      scheduled_date: selectedRequest.value.scheduled_date,
      notes: selectedRequest.value.notes,
      pastor_id: selectedRequest.value.pastor_id,
      location: selectedRequest.value.location
    });
    
    if (success) {
        dialogVisible.value = false;
    }
  }
};

const promoteRequest = (item) => {
  promotingItem.value = item;
  promotionDialogVisible.value = true;
};

const handlePromotionAction = async (isDecided) => {
  if (!promotingItem.value) return;
  
  loadingPromotion.value = true;
  try {
    const success = await store.inviteToBaptism(promotingItem.value.request_id, isDecided);
    if (success) {
      promotionDialogVisible.value = false;
    }
  } finally {
    loadingPromotion.value = false;
  }
};

const deleteItem = async (item) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `Enter the reason for archiving the request from ${item.firstname} ${item.lastname}:`,
      'Archive Request',
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
    
    // Proceed with deletion and reason
    const result = await store.deleteRequest(item.request_id, reason);
    if (result.success) {
      ElMessage.success('Request archived successfully');
    } else {
      ElMessage.error(result.message || 'Failed to archive request');
    }
  } catch {
    // User cancelled
  }
};

const disabledDate = (time) => {
  // 0 is Sunday
  return time.getDay() !== 0;
};
</script>

<style scoped>
.discipleship-records {
  height: 100%;
}
</style>

<style>
/* Global style to fix z-index for element-plus date picker popper in vuetify dialog */
.discipleship-date-picker {
  z-index: 3000 !important;
}
</style>
