<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1100px" persistent>
    <v-card class="rounded-xl overflow-hidden elevation-24" style="overflow-x: hidden !important;">
      <v-card-title class="bg-teal-darken-2 text-white pa-6 d-flex align-center">
        <v-icon size="32" class="mr-3">mdi-calendar-multiselect</v-icon>
        <div class="d-flex flex-column">
          <span class="text-h5 font-weight-bold">Availability Manager</span>
          <span class="text-caption opacity-80" style="color: white !important;">Control the church's discipleship talk schedule manually.</span>
        </div>
        
        <v-spacer></v-spacer>
        
        <!-- Service Selector Toggle -->
        <v-btn-toggle
          v-model="managerServiceType"
          mandatory
          density="compact"
          color="white"
          variant="tonal"
          class="mr-4 bg-teal-darken-3 rounded-lg no-scrollbar"
          @update:model-value="fetchSlots"
          style="overflow-x: auto; white-space: nowrap;"
        >
          <v-btn value="salvation" class="px-2 font-weight-bold" style="font-size: 0.7rem !important;">SALVATION</v-btn>
          <v-btn value="bible_study" class="px-2 font-weight-bold" style="font-size: 0.7rem !important;">BIBLE STUDY</v-btn>
          <v-btn value="water_baptism" class="px-2 font-weight-bold" style="font-size: 0.7rem !important;">WATER BAPTISM</v-btn>
          <v-btn value="burial" class="px-2 font-weight-bold" style="font-size: 0.7rem !important;">BURIAL</v-btn>
          <v-btn value="child_dedication" class="px-2 font-weight-bold" style="font-size: 0.7rem !important;">DEDICATION</v-btn>
        </v-btn-toggle>

        <v-btn icon="mdi-close" variant="text" color="white" @click="$emit('update:modelValue', false)"></v-btn>
      </v-card-title>

      <v-card-text class="pa-6 bg-grey-lighten-4 no-scrollbar" style="overflow-x: hidden !important;">
        <v-row>
          <!-- Left: Creator Form (TEAL) -->
          <v-col v-if="can('ManageAvailability')" cols="12" md="5" class="availability-creator">
            <v-card class="pa-6 rounded-xl elevation-2 bg-white h-100 border-teal flex-column d-flex no-scrollbar" style="overflow-y: auto;">
              <div class="d-flex align-center mb-6">
                <v-avatar color="teal-lighten-4" class="mr-3" size="48">
                  <v-icon color="teal-darken-2">{{ isEditingSlot ? 'mdi-pencil' : 'mdi-plus-box' }}</v-icon>
                </v-avatar>
                <div class="d-flex flex-column">
                  <span class="text-h6 font-weight-bold">{{ isEditingSlot ? 'Update Time Slot' : 'Create New Slots' }}</span>
                  <span class="text-caption grey--text">
                    {{ isEditingSlot ? 'Modify the selected slot details' : `Bulk create ${serviceTitle} slots` }}
                  </span>
                </div>
              </div>

              <v-divider class="mb-6"></v-divider>

              <!-- Date Selection -->
              <div class="mb-4">
                <label class="text-subtitle-2 font-weight-bold d-block mb-2 text-teal-darken-2">Step 1: Select Date(s)</label>
                <el-date-picker
                  v-model="newSlotForm.dates"
                  :type="isEditingSlot ? 'date' : 'dates'"
                  placeholder="Pick dates"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                  popper-class="salvation-datepicker-popper"
                  :append-to-body="true"
                  :disabled-date="(time) => time.getTime() <= Date.now()"
                />
                <div v-if="!isEditingSlot" class="text-caption grey--text mt-1 italic">Select multiple dates to apply these time slots to all of them.</div>
              </div>

              <!-- Time Selection -->
              <div class="mb-6">
                <label class="text-subtitle-2 font-weight-bold d-block mb-2 text-teal-darken-2">Step 2: Select Time Slots</label>
                
                <div v-if="isEditingSlot">
                  <v-text-field
                    v-model="newSlotForm.times[0]"
                    type="time"
                    variant="outlined"
                    density="comfortable"
                    color="teal"
                    class="rounded-lg"
                  ></v-text-field>
                </div>
                <div v-else class="d-flex flex-wrap gap-2">
                  <v-chip
                    v-for="time in commonTimes"
                    :key="time.value"
                    :color="newSlotForm.times.includes(time.value) ? 'teal' : 'grey-lighten-2'"
                    :variant="newSlotForm.times.includes(time.value) ? 'flat' : 'outlined'"
                    class="pa-4 font-weight-bold cursor-pointer"
                    @click="toggleBulkTime(time.value)"
                  >
                    <v-icon v-if="newSlotForm.times.includes(time.value)" size="14" class="mr-1">mdi-check</v-icon>
                    {{ time.label }}
                  </v-chip>
                  
                  <v-menu :close-on-content-click="false">
                    <template v-slot:activator="{ props }">
                      <v-chip variant="dashed" color="teal" v-bind="props" class="pa-4">
                        <v-icon size="20" class="mr-1">mdi-plus</v-icon> Custom
                      </v-chip>
                    </template>
                    <v-card min-width="200" class="pa-4 rounded-lg">
                      <v-text-field
                        label="Custom Time"
                        type="time"
                        variant="outlined"
                        density="compact"
                        color="teal"
                        @change="(val) => {if(val.target.value) toggleBulkTime(val.target.value)}"
                      ></v-text-field>
                    </v-card>
                  </v-menu>
                </div>
              </div>

              <!-- Capacity -->
              <div class="mb-6">
                <label class="text-subtitle-2 font-weight-bold d-block mb-2 text-teal-darken-2">Step 3: Set Capacity</label>
                <v-text-field
                  v-model.number="newSlotForm.max_slots"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  color="teal"
                  placeholder="Seats per slot"
                  prepend-inner-icon="mdi-account-group"
                  class="rounded-lg"
                  min="1"
                ></v-text-field>
              </div>
              
              <v-spacer></v-spacer>

              <div class="d-flex gap-2">
                <v-btn
                  v-if="isEditingSlot"
                  variant="tonal"
                  color="grey-darken-1"
                  size="large"
                  class="rounded-lg"
                  @click="cancelSlotEdit"
                >Cancel</v-btn>
                <v-btn
                  block
                  color="teal-darken-1"
                  size="large"
                  class="font-weight-bold rounded-lg elevation-2 flex-grow-1"
                  @click="saveSlots"
                  :loading="savingSlot"
                  :prepend-icon="isEditingSlot ? 'mdi-content-save' : 'mdi-plus-circle'"
                >
                  {{ isEditingSlot ? 'Confirm Save' : 'Generate Slots' }}
                </v-btn>
              </div>
            </v-card>
          </v-col>

          <!-- Right: List (Grouped) -->
          <v-col cols="12" :md="can('ManageAvailability') ? 7 : 12">
            <v-card class="rounded-xl border elevation-0 overflow-hidden bg-white h-100 flex-column d-flex">
              <!-- Header with Sorting & Multi-select Toggle -->
              <div class="pa-4 d-flex align-center justify-space-between border-b bg-grey-lighten-5">
                <div class="d-flex align-center">
                  <v-checkbox-btn
                    v-if="manualSlots.length > 0"
                    v-model="isAllSlotsSelected"
                    color="teal"
                    class="mr-2"
                  ></v-checkbox-btn>
                  <v-icon color="teal-darken-2" class="mr-2">{{ selectedSlotIds.length > 0 ? 'mdi-checkbox-multiple-marked' : 'mdi-sort-clock-ascending' }}</v-icon>
                  <span class="text-subtitle-1 font-weight-bold grey--text text--darken-3">Current Active Schedule</span>
                </div>
                
                <div class="d-flex align-center gap-2">
                  <v-btn
                    v-if="can('ManageAvailability') && selectedSlotIds.length > 0"
                    color="red-darken-2"
                    prepend-icon="mdi-trash-can"
                    size="small"
                    variant="flat"
                    class="rounded-lg mr-2 shadow-red"
                    @click="bulkDeleteSlots"
                  >
                    Delete ({{ selectedSlotIds.length }})
                  </v-btn>

                  <v-btn-toggle
                    v-model="slotsSortOrder"
                    mandatory
                    density="compact"
                    color="teal"
                    variant="outlined"
                    class="rounded-lg bg-white"
                    v-show="selectedSlotIds.length === 0"
                  >
                    <v-btn value="upcoming" size="x-small" class="px-2 font-weight-bold">UPCOMING</v-btn>
                    <v-btn value="newest" size="x-small" class="px-2 font-weight-bold">NEWEST</v-btn>
                  </v-btn-toggle>
                  
                  <v-btn icon="mdi-refresh" variant="text" size="small" color="teal" @click="fetchSlots" :loading="slotsListLoading"></v-btn>
                </div>
              </div>
              
              <!-- Content -->
              <div class="slots-list-container flex-grow-1 no-scrollbar" style="max-height: 520px; overflow-y: auto; overflow-x: hidden; background-color: #fcfcfc;">
                <div v-if="slotsListLoading" class="text-center pa-10">
                  <v-progress-circular indeterminate color="teal" size="40" width="3"></v-progress-circular>
                  <div class="text-caption mt-2 grey--text">Loading active schedules...</div>
                </div>
                <div v-else-if="manualSlots.length === 0" class="text-center pa-12 text-grey-darken-1">
                  <v-icon size="64" color="teal-lighten-4" class="mb-3">mdi-calendar-remove</v-icon>
                  <div class="text-h6 font-weight-bold opacity-80">Empty Schedule</div>
                  <div class="text-caption">Select dates and times on the left to start.</div>
                </div>
                
                <v-expansion-panels v-else v-model="activePanelGroups" variant="popout" accordion class="pa-3 no-scrollbar" style="overflow-x: hidden;">
                  <v-expansion-panel v-for="group in groupedSlots" :key="group.date" class="mb-3 rounded-lg border shadow-sm overflow-hidden">
                    <v-expansion-panel-title class="py-2 px-4 bg-teal-darken-2">
                      <div class="d-flex align-center justify-space-between w-100 pr-2">
                        <div class="d-flex align-center">
                          <v-checkbox-btn
                            :model-value="isGroupFullySelected(group)"
                            @click.stop="toggleSelectGroup(group)"
                            color="white"
                            class="mr-2"
                            theme="dark"
                          ></v-checkbox-btn>
                          <v-icon color="white" size="20" class="mr-2">mdi-calendar-star</v-icon>
                          <span class="font-weight-bold text-white">{{ formatDateManual(group.date) }}</span>
                        </div>
                        <v-chip size="x-small" color="white" variant="flat" class="font-weight-black text-teal-darken-2 px-2">
                          {{ group.slots.length }} SESSION{{ group.slots.length > 1 ? 'S' : '' }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text class="pa-0">
                      <div class="pa-2">
                        <div v-for="slot in group.slots" :key="slot.slot_id" 
                             class="d-flex align-center justify-space-between pa-3 rounded-lg hover-bg mb-2 border border-dotted cursor-pointer"
                             :class="{'bg-yellow-lighten-4 border-teal border-solid shadow-sm': editingSlotId === slot.slot_id, 'bg-teal-lighten-5': selectedSlotIds.includes(slot.slot_id)}"
                             @click="toggleSelectSlot(slot.slot_id)">
                          <div class="d-flex align-center">
                            <v-checkbox-btn
                              :model-value="selectedSlotIds.includes(slot.slot_id)"
                              color="teal"
                              class="mr-2"
                              @click.stop="toggleSelectSlot(slot.slot_id)"
                            ></v-checkbox-btn>
                            <v-chip 
                              size="default" 
                              variant="flat" 
                              :color="slot.bookedCount >= slot.max_slots ? 'red-lighten-4' : 'teal-lighten-4'" 
                              class="font-weight-black px-4"
                              :class="slot.bookedCount >= slot.max_slots ? 'text-red-darken-4' : 'text-teal-darken-4'"
                            >
                              {{ formatTimeManual(slot.available_time) }}
                            </v-chip>
                            <div class="ml-4 d-flex align-center grey--text text-subtitle-2">
                              <v-icon size="16" class="mr-1">mdi-account-multiple</v-icon>
                              <span class="font-weight-black" :class="slot.bookedCount > 0 ? 'text-teal-darken-2' : ''">
                                ({{ slot.bookedCount || 0 }}/{{ slot.max_slots }}) SEATS
                              </span>
                            </div>
                          </div>
                          
                          <div v-if="can('ManageAvailability')" class="d-flex gap-2" v-show="selectedSlotIds.length === 0">
                            <v-btn icon variant="flat" color="teal-darken-1" size="small" class="rounded-lg shadow-sm" @click.stop="editSlot(slot)">
                              <v-icon color="white">mdi-pencil</v-icon>
                            </v-btn>
                            <v-btn icon variant="flat" color="red-darken-2" size="small" class="rounded-lg shadow-sm" @click.stop="deleteOneSlot(slot.slot_id)">
                              <v-icon color="white">mdi-trash-can</v-icon>
                            </v-btn>
                          </div>
                        </div>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
              
              <!-- Footer Info -->
              <div class="pa-3 bg-grey-lighten-4 d-flex justify-space-between border-t text-caption grey--text">
                <div class="d-flex align-center">
                   <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
                   Managing availability for {{ serviceTitle }}. Use checkboxes for bulk actions.
                </div>
                <v-btn v-if="isEditingSlot" size="x-small" variant="text" color="primary" @click="cancelSlotEdit">Cancel Selection</v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-card-actions class="pa-4 bg-white border-t">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-2" variant="tonal" class="rounded-lg px-8" @click="$emit('update:modelValue', false)">Close Manager</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import moment from 'moment';
import axios from '@/api/axios';

// Permission Logic
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const isAdmin = computed(() => userInfo.value?.account?.position === 'admin')
const userPermissions = computed(() => {
  try {
    const perms = userInfo.value?.account?.permissions || []
    return typeof perms === 'string' ? JSON.parse(perms) : perms
  } catch (e) {
    return []
  }
})

const can = (action) => {
  if (isAdmin.value) return true
  return userPermissions.value.includes(`ServicesGroup:${action}`)
}

const props = defineProps({
  modelValue: Boolean,
  initialService: {
    type: String,
    default: 'salvation'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Global Manager State
const managerServiceType = ref(props.initialService);
const manualSlots = ref([]);
const slotsListLoading = ref(false);
const savingSlot = ref(false);
const isEditingSlot = ref(false);
const editingSlotId = ref(null);
const activePanelGroups = ref([]);
const selectedSlotIds = ref([]);
const slotsSortOrder = ref('upcoming');

const newSlotForm = ref({
  dates: [moment().add(1, 'day').format('YYYY-MM-DD')],
  times: [],
  max_slots: 10
});

const commonTimes = [
  { label: '08:00 AM', value: '08:00' },
  { label: '09:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '11:00 AM', value: '11:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '01:00 PM', value: '13:00' },
  { label: '02:00 PM', value: '14:00' },
  { label: '03:00 PM', value: '15:00' },
  { label: '04:00 PM', value: '16:00' },
  { label: '05:00 PM', value: '17:00' }
];

const serviceTitle = computed(() => {
  const map = {
    'salvation': 'Salvation Talk',
    'bible_study': 'Bible Study',
    'water_baptism': 'Water Baptism',
    'burial': 'Burial Service',
    'child_dedication': 'Child Dedication'
  };
  return map[managerServiceType.value] || 'Service';
});

// Watch for external opens to refresh
watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.initialService !== managerServiceType.value) {
        managerServiceType.value = props.initialService;
    }
    fetchSlots();
  }
});

// Data Fetching
const fetchSlots = async () => {
  slotsListLoading.value = true;
  try {
    const response = await axios.get('/services/salvation-availability/salvation-slots', {
      params: { service_type: managerServiceType.value }
    });
    manualSlots.value = response.data.data;
    selectedSlotIds.value = [];
  } catch (error) {
    console.error('Error fetching slots:', error);
    ElMessage.error('Failed to load slots');
  } finally {
    slotsListLoading.value = false;
  }
};

// Grouping Logic
const groupedSlots = computed(() => {
  const groups = {};
  const tomorrow = moment().add(1, 'day').startOf('day');
  
  manualSlots.value.forEach(slot => {
    const dStr = slot.available_date.substring(0, 10);
    const slotDay = moment(dStr, 'YYYY-MM-DD');
    
    // Only include slots from tomorrow onwards to exclude "Same Day"
    if (slotDay.isSameOrAfter(tomorrow)) {
      if (!groups[dStr]) groups[dStr] = [];
      groups[dStr].push(slot);
    }
  });
  
  return Object.keys(groups)
    .sort((a, b) => slotsSortOrder.value === 'upcoming' ? a.localeCompare(b) : b.localeCompare(a))
    .map(date => ({
      date,
      slots: groups[date].sort((a,b) => a.available_time.localeCompare(b.available_time))
    }));
});

// Selection Logic
const isAllSlotsSelected = computed({
  get: () => manualSlots.value.length > 0 && selectedSlotIds.value.length === manualSlots.value.length,
  set: (val) => {
    if (val) selectedSlotIds.value = manualSlots.value.map(s => s.slot_id);
    else selectedSlotIds.value = [];
  }
});

const isGroupFullySelected = (group) => group.slots.every(s => selectedSlotIds.value.includes(s.slot_id));

const toggleSelectSlot = (id) => {
  const index = selectedSlotIds.value.indexOf(id);
  if (index > -1) selectedSlotIds.value.splice(index, 1);
  else selectedSlotIds.value.push(id);
};

const toggleSelectGroup = (group) => {
  const groupIds = group.slots.map(s => s.slot_id);
  const allSelected = isGroupFullySelected(group);
  if (allSelected) {
    selectedSlotIds.value = selectedSlotIds.value.filter(id => !groupIds.includes(id));
  } else {
    groupIds.forEach(id => {
      if (!selectedSlotIds.value.includes(id)) selectedSlotIds.value.push(id);
    });
  }
};

// Actions
const toggleBulkTime = (timeValue) => {
  const idx = newSlotForm.value.times.indexOf(timeValue);
  if (idx > -1) newSlotForm.value.times.splice(idx, 1);
  else newSlotForm.value.times.push(timeValue);
};

const saveSlots = async () => {
  if (newSlotForm.value.dates.length === 0 || newSlotForm.value.times.length === 0) {
    ElMessage.warning('Please select at least one date and one time');
    return;
  }
  
  savingSlot.value = true;
  try {
    if (isEditingSlot.value) {
      await axios.put(`/services/salvation-availability/salvation-slots/${editingSlotId.value}`, {
        available_date: newSlotForm.value.dates[0],
        available_time: newSlotForm.value.times[0],
        max_slots: newSlotForm.value.max_slots || 1,
        service_type: managerServiceType.value
      });
      ElMessage.success('Slot updated successfully');
      cancelSlotEdit();
    } else {
      await axios.post('/services/salvation-availability/salvation-slots', {
        isBulk: true,
        dates: newSlotForm.value.dates,
        times: newSlotForm.value.times,
        max_slots: newSlotForm.value.max_slots || 1,
        service_type: managerServiceType.value
      });
      ElMessage.success('Slots created successfully');
      newSlotForm.value.times = [];
    }
    fetchSlots();
    emit('change', managerServiceType.value);
  } catch (error) {
    console.error('Error saving slot:', error);
    ElMessage.error('Failed to save slots');
  } finally {
    savingSlot.value = false;
  }
};

const editSlot = (slot) => {
  isEditingSlot.value = true;
  editingSlotId.value = slot.slot_id;
  newSlotForm.value = {
    dates: [moment(slot.available_date).format('YYYY-MM-DD')],
    times: [slot.available_time.substring(0, 5)],
    max_slots: slot.max_slots
  };
  const el = document.querySelector('.availability-creator');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

const cancelSlotEdit = () => {
  isEditingSlot.value = false;
  editingSlotId.value = null;
  newSlotForm.value = {
    dates: [moment().add(1, 'day').format('YYYY-MM-DD')],
    times: [],
    max_slots: 10
  };
};

const deleteOneSlot = async (id) => {
  try {
    await ElMessageBox.confirm('Delete this time slot permanently?', 'Confirm Delete', { type: 'warning' });
    const response = await axios.delete(`/services/salvation-availability/salvation-slots/${id}`, {
      params: { service_type: managerServiceType.value }
    });
    if (response.data.success) {
      ElMessage.success('Slot deleted');
      fetchSlots();
      emit('change', managerServiceType.value);
    }
  } catch (err) {}
};

const bulkDeleteSlots = async () => {
  if (selectedSlotIds.value.length === 0) return;
  try {
    await ElMessageBox.confirm(`Delete ${selectedSlotIds.value.length} selected slots?`, 'Bulk Delete', { type: 'error' });
    savingSlot.value = true;
    const response = await axios.post('/services/salvation-availability/bulk-delete', {
      slotIds: selectedSlotIds.value,
      service_type: managerServiceType.value
    });
    if (response.data.success) {
      ElMessage.success(response.data.message);
      selectedSlotIds.value = [];
      fetchSlots();
      emit('change', managerServiceType.value);
    }
  } catch (err) {} finally {
    savingSlot.value = false;
  }
};

const formatDateManual = (d) => moment(d).format('MMM DD, YYYY');
const formatTimeManual = (t) => moment(t, 'HH:mm:ss').format('h:mm A');

onMounted(() => {
  if (props.modelValue) fetchSlots();
});
</script>

<style scoped>
.border-teal { border: 1px solid #009688 !important; }
.hover-bg:hover { background-color: #f5f5f5; }
.shadow-red { box-shadow: 0 4px 10px rgba(211, 47, 47, 0.2) !important; }
.italic { font-style: italic; }

/* Hide scrollbars but keep functionality */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* Ensure no horizontal scroll */
.v-dialog > .v-overlay__content > .v-card {
  overflow-x: hidden !important;
}
</style>
