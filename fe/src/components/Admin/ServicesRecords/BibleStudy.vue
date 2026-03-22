<template>
  <div class="biblestudy-records pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Bible Study Requests</h1>
      
      <!-- Global Completion Toggle -->
      <v-card variant="outlined" class="pa-2 px-4 d-flex align-center" style="border-radius: 12px; border: 1px dashed #ccc;">
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
    </div>

    <!-- Filters & Bulk Actions -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row align="center">
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
              :items="['All Status', 'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected']"
              label="Filter Status"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleFilter"
            ></v-select>
          </v-col>
          <v-spacer></v-spacer>

        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Bulk Action Summary (Floating) -->
    <v-fade-transition>
      <div v-if="selectedRows.length > 0" class="bulk-selection-bar d-flex align-center justify-space-between pa-4 bg-primary text-white elevation-4">
        <div class="d-flex align-center">
          <v-icon class="mr-3">mdi-checkbox-multiple-marked</v-icon>
          <span class="text-subtitle-1 font-weight-bold">{{ selectedRows.length }} records selected</span>
        </div>
        <div class="d-flex gap-4">
          <v-btn variant="text" color="white" @click="selectedRows = []">Clear</v-btn>
          <v-btn color="success" variant="flat" prepend-icon="mdi-check" @click="handleBulkComplete">Mark Completed</v-btn>
        </div>
      </div>
    </v-fade-transition>

    <!-- Table -->
    <v-card elevation="2">
      <v-table hover>
        <thead>
          <tr>
            <th class="text-left" style="width: 50px;">
              <v-checkbox-btn
                :model-value="isAllSelected"
                :indeterminate="selectedRows.length > 0 && !isAllSelected"
                color="primary"
                @update:model-value="toggleSelectAll"
              ></v-checkbox-btn>
            </th>
            <th class="text-left font-weight-bold">ID</th>
            <th class="text-left font-weight-bold">Name</th>
            <th class="text-left font-weight-bold" style="min-width: 130px; color: #424242">Contact</th>
            <th class="text-left font-weight-bold" style="min-width: 150px; color: #424242">Address</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Schedule</th>
            <th class="text-left font-weight-bold" style="width: 120px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && requests.length === 0">
             <td colspan="8" class="text-center pa-4">Loading...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
             <td colspan="8" class="text-center pa-4">No requests found.</td>
          </tr>
          <tr v-for="item in requests" :key="item.request_id" :class="{'bg-blue-lighten-5': isSelected(item)}">
            <td>
              <v-checkbox-btn
                v-model="selectedRows"
                :value="item.request_id"
                color="primary"
              ></v-checkbox-btn>
            </td>
            <td>{{ item.request_id }}</td>
            <td class="font-weight-medium">{{ item.firstname }} {{ item.lastname }}</td>
            <td>
              <div class="text-caption font-weight-bold">{{ item.email }}</div>
              <div v-if="item.phone_number" class="text-caption text-grey">{{ item.phone_number }}</div>
            </td>
            <td>
              <div class="text-caption text-grey-darken-2" style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="item.location || item.address || ''">
                {{ item.location || item.address || '' }}
              </div>
            </td>
            <td>
              <v-chip size="small" :color="getStatusColor(item.status)" class="text-white font-weight-bold px-2">
                {{ item.status }}
              </v-chip>
            </td>
            <td>
               <div v-if="item.scheduled_date">
                 <div class="text-caption">{{ formatDateTime(item.scheduled_date).split(',')[0] }}</div>
                 <div class="text-caption text-grey font-italic">{{ formatDateTime(item.scheduled_date).split(',')[1] }}</div>
               </div>
               <span v-else class="text-caption text-grey">Not scheduled</span>
            </td>
            <td>
              <div class="d-flex gap-2">
                <v-btn
                  variant="tonal"
                  size="small"
                  color="primary"
                  @click="openEditDialog(item)"
                >
                  <v-icon size="18">mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="top">Edit / Schedule</v-tooltip>
                </v-btn>

                <v-btn
                  v-if="item.status === 'Completed'"
                  variant="tonal"
                  size="small"
                  color="teal-darken-3"
                  @click="promoteToBaptism(item)"
                >
                  <v-icon size="18">mdi-water</v-icon>
                  <v-tooltip activator="parent" location="top">Promote to Water Baptism</v-tooltip>
                </v-btn>

                <v-btn
                  v-if="['Pending', 'Scheduled'].includes(item.status)"
                  variant="tonal"
                  size="small"
                  color="error"
                  @click="rejectItem(item)"
                  :loading="rejectingId === item.request_id"
                >
                  <v-icon size="18">mdi-close-circle</v-icon>
                  <v-tooltip activator="parent" location="top">Reject / Suggest New Dates</v-tooltip>
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

    <!-- Edit Dialog -->
    <v-dialog v-model="dialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
           Update Bible Study Session
        </v-card-title>
        <v-card-text class="mt-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="editItem.pastor_id"
                :items="pastors"
                item-title="name"
                item-value="name"
                label="Assigned Pastor"
                variant="outlined"
                density="compact"
                clearable
                hide-details="auto"
                class="mb-3"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field 
                v-model="editItem.location" 
                label="Address" 
                variant="outlined" 
                density="compact"
                hide-details="auto"
                class="mb-3"
                persistent-hint
                hint="Defaults to the requester's home address."
              ></v-text-field>
              <div v-if="editItem.address" class="text-caption text-grey px-1 mb-2">
                Home Address: <b>{{ editItem.address }}</b>
              </div>
            </v-col>
          </v-row>

          <v-select
            v-model="editItem.status"
            :items="statusItemsWithRestriction"
            label="Status"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="mb-4"
          ></v-select>

          <label class="text-caption font-weight-bold grey--text mb-1 d-block">Select Schedule (Daily, Except Sunday)</label>
          
          <div v-if="slotsLoading" class="text-center pa-4 border rounded mb-4">
            <v-progress-circular indeterminate color="teal" size="24" class="mb-2" />
            <div class="text-caption">Loading available slots...</div>
          </div>

          <div v-else-if="availableSlots.length > 0" class="slots-selection-container mb-4">
            <transition-group name="fade">
              <v-expansion-panels variant="accordion" class="border rounded">
                <v-expansion-panel
                  v-for="dateGroup in availableSlots.slice(0, 8)"
                  :key="dateGroup.date"
                >
                  <v-expansion-panel-title class="py-2">
                    <div class="d-flex align-center justify-space-between w-100 pr-2">
                      <span class="text-subtitle-2">{{ formatBibleStudyDate(dateGroup.date) }}</span>
                      <v-chip size="x-small" color="teal" variant="flat">{{ dateGroup.availableSlots }} slots</v-chip>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="d-flex flex-wrap gap-1">
                      <v-chip
                        v-for="slot in dateGroup.timeSlots"
                        :key="slot.datetime"
                        size="small"
                        :variant="editItem.scheduled_date === slot.datetime ? 'flat' : 'outlined'"
                        :color="editItem.scheduled_date === slot.datetime ? 'teal' : 'grey-darken-1'"
                        @click="selectSlot(slot.datetime)"
                        class="cursor-pointer"
                      >
                        {{ formatTime(slot.time) }}
                      </v-chip>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </transition-group>
          </div>

          <v-alert v-else type="info" variant="tonal" density="compact" class="mb-4">
            No available slots found for the next 14 days.
          </v-alert>

          <div v-if="editItem.scheduled_date" class="selected-schedule-confirm pa-2 bg-teal-lighten-5 rounded border-teal mb-4 d-flex align-center">
            <v-icon color="teal" class="mr-2">mdi-calendar-check</v-icon>
            <span class="text-caption font-weight-bold text-teal-darken-2">
              Selected: {{ formatSelectedSchedule(editItem.scheduled_date) }}
            </span>
          </div>

          <v-textarea
            v-model="editItem.notes"
            label="Additional Notes / Remarks"
            variant="outlined"
            rows="2"
            class="mt-1"
            hide-details="auto"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialogVisible = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveEdit" :loading="loading">Save</v-btn>
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
            How would you like to proceed with <b>{{ promotionData?._activeItem?.firstname }} {{ promotionData?._activeItem?.lastname }}</b>?
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
              <div class="font-weight-bold">Schedule for Water Baptism</div>
              <div class="text-caption">Open the registration form to schedule directly</div>
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

    <!-- Water Baptism Admin Registration Dialog -->
    <v-dialog v-model="adminWaterBaptismDialogVisible" max-width="900px" persistent height="90vh">
      <v-card class="rounded-xl overflow-hidden position-relative d-flex flex-column" height="100%">
        <v-btn
          icon="mdi-close"
          variant="text"
          color="grey-darken-2"
          class="position-absolute z-10"
          style="top: 10px; right: 10px;"
          @click="adminWaterBaptismDialogVisible = false"
        ></v-btn>
        <v-card-text class="pa-0 flex-grow-1 overflow-y-auto">
          <WaterBaptismRegistration
            admin-mode
            :admin-data="promotionData"
            @success="handlePromotionSubmit"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAdminBibleStudyStore } from '@/stores/admin/biblestudyStore';
import { useSystemSettingsStore } from '@/stores/admin/systemSettingsStore';
import WaterBaptismRegistration from '@/components/LandingPage/Services/WaterBaptismRegistration.vue';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from '@/api/axios';

const store = useAdminBibleStudyStore();
const settingsStore = useSystemSettingsStore();
const { requests, loading, totalCount, currentPage, pastors } = storeToRefs(store);
const { settings, loading: settingsLoading } = storeToRefs(settingsStore);

const statusItemsWithRestriction = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledDate = editItem.value.scheduled_date ? new Date(editItem.value.scheduled_date) : null;
  if (scheduledDate) scheduledDate.setHours(0, 0, 0, 0);

  const isFuture = scheduledDate && scheduledDate > today;
  const isUnscheduled = !scheduledDate;

  return [
    { title: 'Pending', value: 'Pending' },
    { title: 'Scheduled', value: 'Scheduled' },
    { 
      title: 'Completed', 
      value: 'Completed', 
      props: { 
        disabled: (isFuture || isUnscheduled) && !settings.value.allow_complete_without_schedule && editItem.value._originalStatus !== 'Completed'
      }
    },
    { title: 'Cancelled', value: 'Cancelled' },
    { title: 'Rejected', value: 'Rejected' }
  ];
});

const search = ref('');
const statusFilter = ref('All Status');
const dialogVisible = ref(false);
const editItem = ref({});

// Selection state
const selectedRows = ref([]);
const isAllSelected = computed(() => {
  return requests.value.length > 0 && selectedRows.value.length === requests.value.length;
});

const isSelected = (item) => selectedRows.value.includes(item.request_id);

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRows.value = [];
  } else {
    selectedRows.value = requests.value.map(r => r.request_id);
  }
};

const promotionDialogVisible = ref(false);
const adminWaterBaptismDialogVisible = ref(false);
const promotionData = ref(null);
const loadingPromotion = ref(false);
const rejectingId = ref(null);

const availableSlots = ref([]);
const slotsLoading = ref(false);

onMounted(() => {
    store.fetchRequests();
    store.fetchPastors();
    settingsStore.fetchSettings();
});

const toggleRestriction = async (val) => {
    await settingsStore.toggleAllowComplete(val);
};

const handleBulkComplete = async () => {
  if (selectedRows.value.length === 0) return;
  
  // Filter for eligible records (must be Scheduled, or Pending if restriction is off)
  const eligibleIds = requests.value
    .filter(r => selectedRows.value.includes(r.request_id))
    .filter(r => {
      if (settings.value.allow_complete_without_schedule) {
        return ['Pending', 'Scheduled'].includes(r.status);
      }
      return r.status === 'Scheduled';
    })
    .map(r => r.request_id);

  if (eligibleIds.length === 0) {
    ElMessage.warning('None of the selected records are eligible for completion based on current restrictions.');
    return;
  }

  const result = await store.bulkCompleteRequests(eligibleIds);
  if (result) {
    selectedRows.value = [];
  }
};

const totalPages = computed(() => Math.ceil(totalCount.value / 10) || 1);

const handleSearch = (val) => {
    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        store.setFilters({ search: val });
    }, 500);
};

const handleFilter = (val) => {
    store.setFilters({ status: val === 'All Status' ? 'All' : val });
};

const handlePageChange = (page) => {
  store.setPage(page);
};

const getStatusColor = (status) => {
  switch(status) {
      case 'Pending': return 'warning';
      case 'Scheduled': return 'info';
      case 'Completed': return 'success';
      case 'Cancelled': return 'grey';
      case 'Rejected': return 'error';
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

const openEditDialog = (item) => {
  editItem.value = { ...item };
  editItem.value._originalStatus = item.status;
  
  // Directly fall back to the address they input if no location was saved yet.
  if (!editItem.value.location && editItem.value.address) {
    editItem.value.location = editItem.value.address;
  }
  
  dialogVisible.value = true;
  fetchAvailableSlots();
};

const fetchAvailableSlots = async () => {
  slotsLoading.value = true;
  availableSlots.value = [];
  try {
    const response = await axios.get('/services/discipleship-requests/available-slots', {
      params: { service: 'bible_study', days: 14 }
    });
    if (response.data.success) {
      availableSlots.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching slots:', error);
  } finally {
    slotsLoading.value = false;
  }
};

const selectSlot = (slotDateTime) => {
  editItem.value.scheduled_date = slotDateTime;
};

const formatBibleStudyDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
};

const formatSelectedSchedule = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return new Date(dateTimeStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const saveEdit = async () => {
  // Manual Completion Validation
  if (editItem.value.status === 'Completed' && !settings.value.allow_complete_without_schedule) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (editItem.value._originalStatus === 'Pending' || !editItem.value.scheduled_date) {
      ElMessage.warning('Completion restricted: This session must be scheduled before it can be marked as completed.');
      return;
    }

    const scheduledDate = new Date(editItem.value.scheduled_date);
    scheduledDate.setHours(0, 0, 0, 0);
    if (scheduledDate > today) {
      ElMessage.warning(`Completion restricted: This session is scheduled for a future date (${editItem.value.scheduled_date.split('T')[0]}).`);
      return;
    }
  }

  const success = await store.updateRequest(editItem.value.request_id, editItem.value);
  if (success) dialogVisible.value = false;
};

const markIndividualComplete = async (item) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Manual Completion Logic
    if (!settings.value.allow_complete_without_schedule) {
      if (item.status === 'Pending' || !item.scheduled_date) {
        ElMessage.warning('Completion restricted: This session must be scheduled before it can be marked as completed.');
        return;
      }
      
      const scheduledDate = new Date(item.scheduled_date);
      scheduledDate.setHours(0, 0, 0, 0);
      if (scheduledDate > today) {
        ElMessage.warning(`Completion restricted: This session is scheduled for a future date (${item.scheduled_date.split('T')[0]}).`);
        return;
      }
    }

    await ElMessageBox.confirm(
      `Mark request for ${item.firstname} ${item.lastname} as completed?`,
      'Mark Completed',
      {
        confirmButtonText: 'Yes, Complete',
        cancelButtonText: 'Cancel',
        type: 'success',
      }
    );
    
    await store.updateRequest(item.request_id, { status: 'Completed' });
  } catch {
    // User cancelled
  }
};

const rejectItem = async (item) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `Please provide a reason for rejecting the Bible Study request for ${item.firstname} ${item.lastname}. This will be sent to their email along with alternative suggested dates.`,
      'Reject Bible Study',
      {
        confirmButtonText: 'Send Rejection',
        cancelButtonText: 'Cancel',
        inputPattern: /.+/,
        inputPlaceholder: 'e.g., The assigned pastor is unavailable on this day. Please pick from the suggested dates below.',
        inputErrorMessage: 'Rejection reason is required',
        type: 'warning'
      }
    );

    if (reason) {
      rejectingId.value = item.request_id;
      await store.rejectRequest(item.request_id, reason);
      rejectingId.value = null;
    }
  } catch {
    // User cancelled
    rejectingId.value = null;
  }
};

const promoteToBaptism = (item) => {
  // Pass all the non-member details to pre-fill the water baptism form
  // Including age, birthdate, gender, civil_status, middle_name, and profession
  // so the admin does not have to re-enter them in the next step.
  promotionData.value = {
    _activeItem: item,
    firstname: item.firstname,
    middle_name: item.middle_name || '',
    lastname: item.lastname,
    email: item.email,
    phone_number: item.phone_number,
    address: item.address,
    age: item.age || null,
    birthdate: item.birthdate || '',
    gender: item.gender || '',
    civil_status: item.civil_status || '',
    profession: item.profession || '',
    guardian_name: item.guardian_name || '',
    guardian_contact: item.guardian_contact || '',
    guardian_relationship: item.guardian_relationship || ''
  };
  promotionDialogVisible.value = true;
};

const handlePromotionAction = async (isDecided) => {
  if (isDecided) {
    // If decided, open the "short form" inside a larger dialog
    promotionDialogVisible.value = false;
    adminWaterBaptismDialogVisible.value = true;
  } else {
    // If undecided/hesitant, send the invitation form link
    // This calls /invite-baptism which now only sends the email (no record created yet)
    loadingPromotion.value = true;
    try {
      const activeItem = promotionData.value._activeItem;
      const success = await store.inviteToBaptism(activeItem.request_id);
      if (success) {
        promotionDialogVisible.value = false;
      }
    } finally {
      loadingPromotion.value = false;
    }
  }
};

const handlePromotionSubmit = () => {
  // If the dialogue successfully schedules a baptism, close the prompt.
  adminWaterBaptismDialogVisible.value = false;
  store.fetchRequests(); // Refresh table
};

const disabledDate = (time) => {
  const day = time.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Disable Sunday OR if date is today/past
  return day === 0 || time <= today;
};

const disabledTime = (date) => {
  if (!date) return {};

  const day = date.getDay();
  const disabledHours = [];

  // Disallow all times on Sunday (safe fallback)
  if (day === 0) {
    for (let h = 0; h < 24; h++) disabledHours.push(h);
  } else {
    // Before 08:00
    for (let h = 0; h < 8; h++) disabledHours.push(h);

    // After 20:00 (start times)
    for (let h = 21; h < 24; h++) disabledHours.push(h);

    // Wednesday(3) and Saturday(6): disable evening hours (18:00+)
    if (day === 3 || day === 6) {
      for (let h = 18; h < 24; h++) {
        if (!disabledHours.includes(h)) disabledHours.push(h);
      }
    }
  }

  return {
    disabledHours: () => disabledHours,
    disabledMinutes: (hour) => {
      // Only allow 00 and 30 minutes for 30-min interval.
      const allowedMinutes = new Set([0, 30]);

      // For 20:00, only allow 00 (no 20:30 since our slot generator ends at 20:00).
      if (hour === 20) allowedMinutes.delete(30);

      const disabledMinutes = [];
      for (let m = 0; m < 60; m++) {
        if (!allowedMinutes.has(m)) disabledMinutes.push(m);
      }
      return disabledMinutes;
    },
    disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i),
  };
};
</script>

<style scoped>
.biblestudy-records { height: 100%; }
</style>
