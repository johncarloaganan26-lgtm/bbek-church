<template>
  <div class="discipleship-records pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Salvation Request</h1>
      
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
          @click="openAddDialog"
          class="h-100"
          style="min-height: 48px;"
        >
          New Request
        </v-btn>
      </div>
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
                  @click="markIndividualComplete(item)"
                  v-if="['Pending', 'Scheduled'].includes(item.status) && (item.status === 'Scheduled' || settings.allow_complete_without_schedule)"
                >
                  <v-icon>mdi-check</v-icon>
                  <v-tooltip activator="parent" location="top">Mark Completed</v-tooltip>
                </v-btn>

                <v-btn
                  variant="tonal"
                  size="small"
                  color="teal-darken-1"
                  @click="openBibleStudyDialog(item)"
                  v-if="item.status === 'Completed' && item.request_type === 'Salvation'"
                >
                  <v-icon>mdi-book-open-variant</v-icon>
                  <v-tooltip activator="parent" location="top">Set Bible Study Schedule</v-tooltip>
                </v-btn>



                <v-btn
                  v-if="['Pending', 'Scheduled'].includes(item.status)"
                  variant="tonal"
                  size="small"
                  color="error"
                  @click="rejectItem(item)"
                  class="reject-btn"
                >
                  <v-icon>mdi-close-circle</v-icon>
                  <v-tooltip activator="parent" location="top">Reject / Suggest New Dates</v-tooltip>
                </v-btn>

                <v-btn
                  variant="tonal"
                  size="small"
                  color="grey"
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
    <v-dialog v-model="dialogVisible" :max-width="showAvailableSlots ? '900px' : '500px'">
      <v-card class="discipleship-dialog">
        <v-card-title class="bg-primary text-white d-flex align-center">
          <span>{{ isEditing ? 'Update' : 'Add' }} Request</span>
          <v-btn 
            icon="mdi-close"
            variant="text"
            size="small"
            @click="showAvailableSlots = !showAvailableSlots"
            class="ml-auto"
          >
            <v-tooltip activator="parent" location="top">{{ showAvailableSlots ? 'Hide' : 'Show' }} Time Slots</v-tooltip>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0 d-flex">
          <!-- Left Panel: Available Slots -->
          <div v-if="showAvailableSlots" class="pa-4" style="width: 35%; border-right: 1px solid #e0e0e0; overflow-y: auto; max-height: 60vh;">
            <div class="font-weight-bold mb-3">Available Time Slots</div>
            <div v-if="slotsLoading" class="text-center pa-4">
              <v-progress-circular indeterminate></v-progress-circular>
              <div class="text-caption mt-2">Loading time slots...</div>
            </div>
            <div v-else-if="availableSlots.length === 0" class="text-center text-caption grey--text pa-4">
              No available slots
            </div>
            <div v-else>
              <v-expansion-panels accordion>
                <v-expansion-panel v-for="dateGroup in availableSlots" :key="dateGroup.date">
                  <template #title>
                    <div>{{ formatDate(dateGroup.date) }}</div>
                    <v-chip size="small" color="success" class="ml-2">{{ dateGroup.availableSlots }}</v-chip>
                  </template>
                  <div class="pa-2">
                    <v-btn
                      v-for="slot in dateGroup.timeSlots"
                      :key="slot.datetime"
                      variant="outlined"
                      size="small"
                      :color="isSlotSelected(slot.datetime) ? 'primary' : 'default'"
                      :class="{ 'selected-slot': isSlotSelected(slot.datetime) }"
                      class="mb-2 mr-2"
                      @click="selectAvailableSlot(dateGroup.date, slot.time)"
                    >
                      {{ new Date(`${dateGroup.date} ${slot.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }}
                    </v-btn>
                  </div>
                </v-expansion-panel>
              </v-expansion-panels>
              <div v-if="selectedSlotDisplay" class="mt-3 pa-2 bg-teal-lighten-5 rounded">
                <div class="text-caption font-weight-bold teal--text">Selected: {{ selectedSlotDisplay }}</div>
              </div>
            </div>
          </div>
          <!-- Right Panel: Form -->
          <div :class="['flex-grow-1', 'pa-4']" style="overflow-y: auto; max-height: 60vh;">
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
                <v-text-field 
                  v-model="selectedRequest.location" 
                  label="Location" 
                  variant="outlined" 
                  density="compact"
                  persistent-hint
                  hint="Defaults to the church address."
                ></v-text-field>
              </v-col>
            </v-row>

            <v-select
              v-model="selectedRequest.status"
              :items="statusItems"
              label="Status"
              variant="outlined"
              density="compact"
            ></v-select>

            <v-select
              v-model="selectedRequest.request_type"
              :items="requestTypeItems"
              label="Stage (Request Type)"
              variant="outlined"
              density="compact"
            ></v-select>

            <label class="text-caption grey--text mb-1 d-block">Schedule Date & Time</label>
            <el-date-picker
              v-model="selectedRequest.scheduled_date"
              type="datetime"
              :placeholder="schedulePlaceholder"
              style="width: 100%"
              :disabled-date="disabledDate"
              format="YYYY-MM-DD hh:mm A"
              value-format="YYYY-MM-DD HH:mm:ss"
              :default-time="new Date(0, 0, 0, 9, 0, 0)"
              popper-class="discipleship-date-picker"
            />
            <div class="text-caption grey--text mt-1">{{ scheduleHelperText }}</div>

            <v-textarea
              v-model="selectedRequest.notes"
              label="Notes / Remarks"
              variant="outlined"
              rows="3"
              class="mt-3"
            ></v-textarea>

            <div v-if="formattedSchedulePreview" class="mt-4 pa-3 bg-teal-lighten-5 rounded border-teal">
              <div class="text-caption text-teal-darken-3 font-weight-bold">VALIDATED SCHEDULE ({{ selectedRequest.request_type || 'Salvation' }})</div>
              <div class="text-h6 text-teal-darken-4">{{ formattedSchedulePreview }}</div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialogVisible = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveUpdate" :loading="store.loading">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>



    <!-- Bible Study Promotion Dialog -->
    <v-dialog v-model="bibleStudyDialogVisible" :max-width="isPromotionScheduling ? '900px' : '460px'">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-teal-darken-2 text-white text-center py-4">
          <v-icon large class="mr-2">{{ isPromotionScheduling ? 'mdi-calendar-clock' : 'mdi-calendar-check' }}</v-icon>
          {{ isPromotionScheduling ? 'Schedule Bible Study Session' : 'Salvation Talk Result' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <div v-if="!isPromotionScheduling">
            <p class="text-body-1 mb-2 text-center">Phase 1 (Salvation Talk) completed for:</p>
            <p class="text-center text-h6 font-weight-bold mb-4">
              {{ bibleStudyItem?.firstname }} {{ bibleStudyItem?.lastname }}
            </p>
            <p class="text-body-2 text-grey-darken-1 text-center mb-5">
              Select how to proceed with this candidate's discipleship journey.
            </p>

            <v-btn
              block
              color="teal-darken-1"
              size="large"
              variant="tonal"
              class="mb-4 py-5"
              @click="handleBibleStudyAction(true)"
              :loading="loadingBibleStudy"
            >
              <div class="d-flex flex-column align-start" style="width: 100%">
                <div class="font-weight-bold">&#x1F4C5; Schedule Next Bible Study</div>
                <div class="text-caption">Candidate is ready. Proceed to set their next session schedule.</div>
              </div>
            </v-btn>

            <v-btn
              block
              color="grey-darken-1"
              size="large"
              variant="tonal"
              class="py-5"
              @click="handleBibleStudyAction(false)"
              :loading="loadingBibleStudy"
            >
              <div class="d-flex flex-column align-start" style="width: 100%">
                <div class="font-weight-bold">&#x2709;&#xFE0F; Send Bible Study Form Link</div>
                <div class="text-caption">Candidate is hesitant. Send them a link to choose their own schedule later.</div>
              </div>
            </v-btn>
          </div>

          <div v-else>
            <div class="d-flex flex-column flex-md-row">
              <!-- Left Column: Slots Selection -->
              <div class="pa-4 bg-grey-lighten-5 rounded-lg mr-md-4 mb-4 mb-md-0" style="flex: 1; max-height: 60vh; overflow-y: auto; border: 1px solid #e0e0e0;">
                <div class="d-flex align-center mb-4">
                  <v-icon color="teal-darken-2" class="mr-2">mdi-clock-outline</v-icon>
                  <span class="text-subtitle-1 font-weight-bold teal--text">Available Bible Study Slots</span>
                </div>
                
                <p class="text-caption text-grey-darken-1 mb-4">
                  <v-icon size="14">mdi-information-outline</v-icon>
                  Bible Study sessions are available <b>Daily (Mon-Sat)</b>. Wednesday and Saturday evenings are restricted.
                </p>

                <div v-if="slotsLoading" class="text-center pa-8">
                  <v-progress-circular indeterminate color="teal" size="32" class="mb-2" />
                  <div class="text-caption">Loading available schedules...</div>
                </div>

                <div v-else-if="availableSlots.length > 0">
                  <v-expansion-panels variant="accordion" class="border rounded shadow-sm">
                    <v-expansion-panel
                      v-for="(dateGroup, idx) in availableSlots.slice(0, 8)"
                      :key="dateGroup.date"
                      :value="idx"
                    >
                      <v-expansion-panel-title class="py-2">
                        <div class="d-flex align-center justify-space-between w-100 pr-2">
                          <span class="text-subtitle-2 font-weight-bold">{{ formatBibleStudyDate(dateGroup.date) }}</span>
                          <v-chip size="x-small" color="teal" variant="flat" class="text-white">{{ dateGroup.availableSlots }} slots</v-chip>
                        </div>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div class="d-flex flex-wrap gap-1 mt-2">
                          <v-chip
                            v-for="slot in dateGroup.timeSlots"
                            :key="slot.datetime"
                            size="small"
                            :variant="promotionForm.scheduled_date === slot.datetime ? 'flat' : 'outlined'"
                            :color="promotionForm.scheduled_date === slot.datetime ? 'teal' : 'grey-darken-1'"
                            @click="selectSlot(slot.datetime)"
                            class="cursor-pointer font-weight-medium"
                          >
                            {{ formatTime(slot.time) }}
                          </v-chip>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                  <p v-if="availableSlots.length > 8" class="text-center text-caption text-grey mt-2">
                    + {{ availableSlots.length - 8 }} more dates available
                  </p>
                </div>

                <v-alert v-else type="info" variant="tonal" density="compact" class="mt-4">
                  No slots found for the next 14 days.
                </v-alert>
              </div>

              <!-- Right Column: Form Details -->
              <div style="flex: 1.2;">
                <p class="text-h6 font-weight-bold mb-4 teal--text d-flex align-center">
                  <v-icon color="teal" class="mr-2">mdi-account-plus</v-icon>
                  Schedule for {{ bibleStudyItem?.firstname }} {{ bibleStudyItem?.lastname }}
                </p>
                
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="promotionForm.pastor_id"
                      :items="pastors"
                      item-title="name"
                      item-value="acc_id"
                      label="Assigned Pastor"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                      class="mb-4"
                      prepend-inner-icon="mdi-account-tie"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="promotionForm.location" 
                      label="Address" 
                      variant="outlined" 
                      density="comfortable"
                      hide-details="auto"
                      class="mb-1"
                      prepend-inner-icon="mdi-map-marker"
                      placeholder="e.g., Church, Online, or Home Address"
                      persistent-hint
                      hint="Defaults to the requester's home address."
                    ></v-text-field>
                    <div class="text-caption text-grey-darken-1 px-1 mb-4">
                      <v-icon size="12">mdi-home-city-outline</v-icon>
                      Registered Address: <b>{{ bibleStudyItem?.address || '' }}</b>
                    </div>
                  </v-col>
                </v-row>

                <div v-if="promotionForm.scheduled_date" class="selected-schedule-confirm pa-3 bg-teal-lighten-5 rounded border-teal mb-4 d-flex align-center">
                  <v-icon color="teal" class="mr-3">mdi-calendar-check</v-icon>
                  <div>
                    <div class="text-caption font-weight-bold text-teal-darken-2">CONFIRMED SCHEDULE:</div>
                    <div class="text-subtitle-1 font-weight-bold text-teal-darken-4">
                      {{ formatSelectedSchedule(promotionForm.scheduled_date) }}
                    </div>
                  </div>
                </div>
                
                <v-alert v-else type="warning" variant="tonal" density="compact" class="mb-4" icon="mdi-calendar-alert">
                  Please select a date and time slot from the left.
                </v-alert>

                <v-textarea
                  v-model="promotionForm.notes"
                  label="Additional Notes / Remarks"
                  variant="outlined"
                  rows="4"
                  class="mt-2"
                  hide-details="auto"
                  prepend-inner-icon="mdi-note-text-outline"
                  placeholder="Any specific instructions for this Bible Study session..."
                ></v-textarea>

                <div class="d-flex gap-2 mt-8">
                  <v-btn
                    variant="outlined"
                    color="grey-darken-1"
                    @click="isPromotionScheduling = false"
                    :disabled="loadingBibleStudy"
                    prepend-icon="mdi-arrow-left"
                  >Back</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="teal-darken-1"
                    size="large"
                    @click="handleBibleStudyAction(true)"
                    :loading="loadingBibleStudy"
                    :disabled="!promotionForm.scheduled_date"
                    prepend-icon="mdi-calendar-check"
                    class="px-6"
                  >Confirm & Schedule</v-btn>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4" v-if="!isPromotionScheduling">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="bibleStudyDialogVisible = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminDiscipleshipStore } from '@/stores/admin/discipleshipStore';
import { useSystemSettingsStore } from '@/stores/admin/systemSettingsStore';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from '@/api/axios';

const store = useAdminDiscipleshipStore();
const settingsStore = useSystemSettingsStore();
const router = useRouter();
const { requests, loading, totalCount, currentPage, pageSize, pastors } = storeToRefs(store);
const { settings, loading: settingsLoading } = storeToRefs(settingsStore);

onMounted(() => {
    store.fetchRequests();
    store.fetchPastors();
    settingsStore.fetchSettings();
});

const toggleRestriction = async (val) => {
    await settingsStore.toggleAllowComplete(val);
};

const search = ref('');
const statusFilter = ref('All Status'); // Standardized to 'All Status' for consistency across admin pages
const sortBy = ref('Date Created (Newest)'); // Added
const page = ref(1); // Added
// pageSize is already destructured from storeToRefs, so no need to declare here.
const dialogVisible = ref(false);
const selectedRequest = ref({});
// Available slots state
const availableSlots = ref([]);
const slotsLoading = ref(false);
const showAvailableSlots = ref(true);
const selectedSlotDisplay = ref(null);
// Bible Study promotion state
const bibleStudyDialogVisible = ref(false);
const bibleStudyItem = ref(null);
const loadingBibleStudy = ref(false);
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

const statusItems = computed(() => [
  { title: 'Pending', value: 'Pending' },
  { title: 'Scheduled', value: 'Scheduled' },
  { title: 'Completed', value: 'Completed' },
  { title: 'Cancelled', value: 'Cancelled' }
]);

const requestTypeItems = [
  { title: 'Salvation', value: 'Salvation' },
  { title: 'Bible Study', value: 'Bible Study' },
  { title: 'Both (Legacy)', value: 'Both' }
];

const schedulePlaceholder = computed(() => {
  if (selectedRequest.value?.request_type === 'Bible Study') {
    return 'Select Wednesday or Saturday date and time';
  }
  return 'Select date and time';
});

const scheduleHelperText = computed(() => {
  if (selectedRequest.value?.request_type === 'Bible Study') {
    return 'Bible Study schedules are limited to Wednesdays and Saturdays';
  }
  return 'Salvation Talk schedules are available every day, any time';
});

const clearSelection = () => {
  selectedRequests.value = [];
  selectAll.value = false;
};

// Bulk complete selected requests
const bulkComplete = async () => {
  if (selectedRequests.value.length === 0) {
    ElMessage.warning('No requests selected');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `Mark ${selectedRequests.value.length} request(s) as completed?`,
      'Bulk Complete Requests',
      {
        confirmButtonText: 'Yes, Complete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
    
    const result = await store.bulkCompleteRequests(selectedRequests.value);
    if (result.success) {
      const { completed, failed } = result.data || {};
      
      if (completed && completed.length > 0) {
        ElMessage.success(`Successfully marked ${completed.length} request(s) as completed`);
      } else {
        ElMessage.success('Requests marked as completed');
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
    request_type: 'Salvation',
    status: 'Pending',
    scheduled_date: '',
    location: '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite',
    notes: ''
  };
  dialogVisible.value = true;
};

const openScheduleDialog = (item) => {
  isEditing.value = true;
  selectedRequest.value = { ...item };
  
  // Default location to church address if blank
  if (!selectedRequest.value.location) {
    selectedRequest.value.location = '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite';
  }
  
  // Ensure notes is a string and not [object Object]
  if (typeof selectedRequest.value.notes === 'object' && selectedRequest.value.notes !== null) {
    selectedRequest.value.notes = JSON.stringify(selectedRequest.value.notes);
  } else if (selectedRequest.value.notes === null || selectedRequest.value.notes === undefined) {
    selectedRequest.value.notes = '';
  }
  
  dialogVisible.value = true;
};

// Fetch available slots for admin
const fetchAvailableSlots = async (days = 7) => {
  try {
    slotsLoading.value = true;
    const response = await axios.get('/services/discipleship-requests/available-slots', {
      params: { days, service: selectedRequest.value?.request_type || 'Salvation' }
    });
    
    if (response.data.success) {
      availableSlots.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching available slots:', error);
    ElMessage.error('Failed to load available time slots');
  } finally {
    slotsLoading.value = false;
  }
};

// Select an available slot
const selectAvailableSlot = (date, time) => {
  selectedRequest.value.scheduled_date = `${date} ${time}`;
  selectedSlotDisplay.value = formatSlotDisplay(date, time);
  ElMessage.success('Slot selected! Date and time have been filled.');
};

// Format slot for display
const formatSlotDisplay = (date, time) => {
  const dateObj = new Date(`${date} ${time}`);
  return dateObj.toLocaleString('en-US', { 
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Format date for display
const formatDate = (dateStr) => {
  return dateStr ? new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }) : '';
};

// Check if slot is selected
const isSlotSelected = (datetime) => {
  if (!selectedRequest.value.scheduled_date) return false;
  return selectedRequest.value.scheduled_date === datetime;
};

// Watch dialog visibility to fetch slots when it opens
watch(dialogVisible, async (isOpen) => {
  if (isOpen) {
    fetchAvailableSlots(7);
  }
});

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
      request_type: selectedRequest.value.request_type,
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




// ── Bible Study promotion ────────────────────────────────
const isPromotionScheduling = ref(false);
const promotionForm = ref({
  pastor_id: null,
  location: '',
  scheduled_date: '',
  notes: ''
});

const openBibleStudyDialog = (item) => {
  bibleStudyItem.value = item;
  bibleStudyDialogVisible.value = true;
  isPromotionScheduling.value = false;
  
  promotionForm.value = {
    pastor_id: null,
    location: item.location || item.address || '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite',
    scheduled_date: '',
    notes: ''
  };

  fetchSlotsForBibleStudy();
};

const fetchSlotsForBibleStudy = async () => {
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
  promotionForm.value.scheduled_date = slotDateTime;
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

const handleBibleStudyAction = async (isDecided) => {
  if (!bibleStudyItem.value) return;

  // If decided and we haven't shown the scheduling form yet, show it
  if (isDecided && !isPromotionScheduling.value) {
    isPromotionScheduling.value = true;
    return;
  }

  loadingBibleStudy.value = true;
  try {
    // Send form data if decided, otherwise just send hesitancy flag
    const payload = isDecided ? { ...promotionForm.value, isDecided: true } : { isDecided: false };
    const success = await store.promoteToBibleStudy(bibleStudyItem.value.request_id, payload);
    
    if (success) {
      bibleStudyDialogVisible.value = false;
      isPromotionScheduling.value = false;
    }
  } finally {
    loadingBibleStudy.value = false;
  }
};

const rejectItem = async (item) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `Please provide a reason for rejecting the request from ${item.firstname} ${item.lastname}. This will be sent to their email along with alternative suggestions.`,
      'Reject Request',
      {
        confirmButtonText: 'Send Rejection',
        cancelButtonText: 'Cancel',
        inputPattern: /.+/,
        inputPlaceholder: 'e.g., The assigned pastor is unavailable. Please check the suggested dates.',
        inputErrorMessage: 'Rejection reason is required',
        type: 'warning'
      }
    );

    if (reason) {
      const success = await store.rejectRequest(item.request_id, reason);
      if (success) {
        ElMessage.success('Rejection sent successfully');
      }
    }
  } catch {
    // User cancelled
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
  const day = time.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // General rule: No same-day scheduling
  if (time <= today) return true;

  // Specific rule: No Sunday for anyone except potentially Salvation which is managed elsewhere 
  // but keep it consistent with the user's request "no on sunday" for Bible Study
  const type = selectedRequest.value?.request_type;
  if ((type === 'Bible Study' || type === 'Salvation') && day === 0) {
    // Note: Salvation technically has a Noon slot in scheduling.js, 
    // but the user's latest request says "no on sunday" contextually for these.
    // I'll block Sunday for Bible Study here.
    if (type === 'Bible Study') return true;
  }

  return false;
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
