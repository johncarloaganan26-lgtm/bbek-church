<template>
  <div class="biblestudy-records pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Bible Study Requests</h1>
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
              :items="['All Status', 'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected']"
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
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">ID</th>
            <th class="text-left font-weight-bold">Name</th>
            <th class="text-left font-weight-bold" style="min-width: 130px; color: #424242">Contact</th>
            <th class="text-left font-weight-bold" style="min-width: 150px; color: #424242">Address</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Schedule</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
             <td colspan="6" class="text-center pa-4">Loading...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
             <td colspan="6" class="text-center pa-4">No requests found.</td>
          </tr>
          <tr v-for="item in requests" :key="item.request_id">
            <td>{{ item.request_id }}</td>
            <td>{{ item.firstname }} {{ item.lastname }}</td>
            <td>
              <div class="text-caption">{{ item.email }}</div>
              <div v-if="item.phone_number" class="text-caption text-grey">{{ item.phone_number }}</div>
            </td>
            <td>
              <div class="text-caption text-grey-darken-2" style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="item.address || 'N/A'">
                {{ item.address || 'N/A' }}
              </div>
            </td>
            <td>
              <v-chip size="small" :color="getStatusColor(item.status)" class="text-white">
                {{ item.status }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(item.scheduled_date) }}</td>
            <td>
              <div class="d-flex gap-2">
                <v-btn
                  variant="tonal"
                  size="small"
                  color="primary"
                  @click="openEditDialog(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="top">Edit / Schedule</v-tooltip>
                </v-btn>

                <v-btn
                  variant="tonal"
                  size="small"
                  color="success"
                  @click="markCompleted(item)"
                  v-if="item.status === 'Scheduled'"
                >
                  <v-icon>mdi-check</v-icon>
                  <v-tooltip activator="parent" location="top">Mark Completed</v-tooltip>
                </v-btn>

                <v-btn
                  variant="tonal"
                  size="small"
                  color="teal-darken-3"
                  @click="promoteToBaptism(item)"
                  v-if="item.status === 'Completed'"
                >
                  <v-icon>mdi-water</v-icon>
                  <v-tooltip activator="parent" location="top">Promote to Water Baptism</v-tooltip>
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
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="editItem.location" label="Location" variant="outlined" density="compact"></v-text-field>
            </v-col>
          </v-row>

          <v-select
            v-model="editItem.status"
            :items="['Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected']"
            label="Status"
            variant="outlined"
            density="compact"
          ></v-select>

          <label class="text-caption grey--text mb-1 d-block">Schedule Date & Time</label>
          <el-date-picker
            v-model="editItem.scheduled_date"
            type="datetime"
            placeholder="Select schedule"
            style="width: 100%"
            :disabled-date="disabledDate"
            :disabled-time="disabledTime"
            format="YYYY-MM-DD hh:mm A"
            value-format="YYYY-MM-DD HH:mm:ss"
          />

          <v-textarea
            v-model="editItem.notes"
            label="Notes"
            variant="outlined"
            rows="3"
            class="mt-3"
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
import WaterBaptismRegistration from '@/components/LandingPage/Services/WaterBaptismRegistration.vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';

const store = useAdminBibleStudyStore();
const { requests, loading, totalCount, currentPage, pastors } = storeToRefs(store);

const search = ref('');
const statusFilter = ref('All Status');
const dialogVisible = ref(false);
const editItem = ref({});

const promotionDialogVisible = ref(false);
const adminWaterBaptismDialogVisible = ref(false);
const promotionData = ref(null);
const loadingPromotion = ref(false);

onMounted(() => {
    store.fetchRequests();
    store.fetchPastors();
});

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
  
  // Directly fall back to the address they input if no location was saved yet.
  if (!editItem.value.location && editItem.value.address) {
    editItem.value.location = editItem.value.address;
  }
  
  dialogVisible.value = true;
};

const saveEdit = async () => {
  const success = await store.updateRequest(editItem.value.request_id, editItem.value);
  if (success) dialogVisible.value = false;
};

const markCompleted = async (item) => {
  await store.updateRequest(item.request_id, { status: 'Completed' });
};

const promoteToBaptism = (item) => {
  // Pass the non-member details to pre-fill the water baptism form
  promotionData.value = {
    _activeItem: item,
    firstname: item.firstname,
    lastname: item.lastname,
    email: item.email,
    phone_number: item.phone_number,
    address: item.address
  };
  promotionDialogVisible.value = true;
};

const handlePromotionAction = async (isDecided) => {
  if (isDecided) {
    // If decided, open the "short form" inside a larger dialog
    promotionDialogVisible.value = false;
    adminWaterBaptismDialogVisible.value = true;
  } else {
    // If undecided, send the invitation form link
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
  return day === 0; // Sunday not allowed
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
