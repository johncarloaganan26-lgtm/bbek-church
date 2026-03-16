<template>
  <div class="salvation-availability pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Salvation Talk Slots</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Add Available Slot
      </v-btn>
    </div>

    <v-card elevation="2">
      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Date</th>
            <th class="text-left font-weight-bold">Time</th>
            <th class="text-left font-weight-bold">Max Slots</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="text-center pa-4">Loading slots...</td>
          </tr>
          <tr v-else-if="slots.length === 0">
            <td colspan="5" class="text-center pa-4">No slots found.</td>
          </tr>
          <tr v-for="slot in slots" :key="slot.availability_id">
            <td>{{ formatDate(slot.available_date) }}</td>
            <td>{{ formatTime(slot.available_time) }}</td>
            <td>{{ slot.max_slots }}</td>
            <td>
              <v-chip size="small" :color="slot.status === 'Available' ? 'success' : 'grey'" class="text-white">
                {{ slot.status }}
              </v-chip>
            </td>
            <td>
              <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteSlot(slot.availability_id)">
                <v-tooltip activator="parent" location="top">Delete Slot</v-tooltip>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="400px">
      <v-card>
        <v-card-title class="bg-primary text-white">Add Salvation Talk Slot</v-card-title>
        <v-card-text class="mt-4">
          <v-text-field v-model="form.date" label="Date" type="date" variant="outlined" density="compact" class="mb-2"></v-text-field>
          <v-text-field v-model="form.time" label="Time" type="time" variant="outlined" density="compact" class="mb-2"></v-text-field>
          <v-text-field v-model.number="form.max_slots" label="Max Slots" type="number" variant="outlined" density="compact"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveSlot" :loading="saving">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import moment from 'moment';

const slots = ref([]);
const loading = ref(false);
const dialog = ref(false);
const saving = ref(false);
const form = ref({
  date: '',
  time: '',
  max_slots: 1
});

const fetchSlots = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/services/salvation-availability/salvation-slots');
    slots.value = response.data.data;
  } catch (error) {
    console.error('Error fetching slots:', error);
    ElMessage.error('Failed to load availability slots');
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  form.value = {
    date: moment().format('YYYY-MM-DD'),
    time: '09:00',
    max_slots: 1
  };
  dialog.value = true;
};

const saveSlot = async () => {
  if (!form.value.date || !form.value.time) {
    ElMessage.warning('Please select date and time');
    return;
  }
  
  saving.value = true;
  try {
    await axios.post('/services/salvation-availability/salvation-slots', {
      available_date: form.value.date,
      available_time: form.value.time,
      max_slots: form.value.max_slots
    });
    ElMessage.success('Slot added successfully');
    dialog.value = false;
    fetchSlots();
  } catch (error) {
    console.error('Error saving slot:', error);
    ElMessage.error('Failed to add slot');
  } finally {
    saving.value = false;
  }
};

const deleteSlot = async (id) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this slot?', 'Delete Slot', {
      type: 'warning',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    
    await axios.delete(`/services/salvation-availability/salvation-slots/${id}`);
    ElMessage.success('Slot deleted');
    fetchSlots();
  } catch {
    // Cancelled
  }
};

const formatDate = (date) => moment(date).format('MMMM D, YYYY');
const formatTime = (time) => moment(time, 'HH:mm:ss').format('h:mm A');

onMounted(fetchSlots);
</script>

<style scoped>
.salvation-availability { height: 100%; }
</style>
