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
          <!-- Search -->
          <v-col cols="12" md="3">
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

          <!-- Status Filter -->
          <v-col cols="12" md="2">
            <v-select
              v-model="statusFilter"
              :items="['All Status', 'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected']"
              label="Status"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleFilter"
            ></v-select>
          </v-col>

          <!-- Date Range Filter -->
          <v-col cols="12" md="3">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              start-placeholder="Start date"
              end-placeholder="End date"
              range-separator="to"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled="loading"
              @change="handleDateRangeChange"
              class="w-100"
              style="height: 40px !important;"
            />
          </v-col>

          <v-spacer></v-spacer>
          
          <div class="d-flex align-center gap-2">
            <!-- Printing & Exporting -->
            <v-tooltip text="Print Report" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-printer"
                  variant="outlined"
                  v-bind="props"
                  :loading="loading"
                  @click="handlePrint"
                  class="rounded-lg"
                ></v-btn>
              </template>
            </v-tooltip>

            <v-menu transition="scale-transition">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-download"
                  variant="outlined"
                  v-bind="props"
                  :loading="loading"
                  :disabled="loading"
                  class="rounded-lg mr-2"
                ></v-btn>
              </template>
              <v-list density="compact" class="pa-2 rounded-lg">
                <v-list-item @click="handleExportExcel('xlsx')" prepend-icon="mdi-file-excel" class="rounded-lg mb-1">
                  <v-list-item-title>Excel (.xlsx)</v-list-item-title>
                </v-list-item>
                <v-list-item @click="handleExportExcel('csv')" prepend-icon="mdi-file-delimited" class="rounded-lg">
                  <v-list-item-title>CSV (.csv)</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-row>

        <!-- Bulk Action Summary (Tonal Alert Style) -->
        <v-row v-if="selectedRows.length > 0" class="mt-4">
          <v-col cols="12">
            <v-alert
              type="info"
              variant="tonal"
              class="mb-0"
              density="compact"
            >
              <div class="d-flex align-center justify-space-between">
                <div class="text-body-2">
                  <strong>{{ selectedRows.length }}</strong> record{{ selectedRows.length > 1 ? 's' : '' }} selected
                </div>
                <div class="d-flex gap-2">
                  <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-pencil" @click="handleBulkEdit">
                    Bulk Edit
                  </v-btn>
                  <v-btn color="teal-darken-1" variant="flat" size="small" prepend-icon="mdi-water" @click="handleBulkPromote">
                    Bulk Promote
                  </v-btn>
                  <v-btn color="success" variant="flat" size="small" prepend-icon="mdi-check" @click="handleBulkComplete">
                    Mark Completed
                  </v-btn>
                  <v-btn color="error" variant="flat" size="small" prepend-icon="mdi-archive" @click="handleBulkArchive">
                    Archive
                  </v-btn>
                  <v-btn variant="outlined" size="small" prepend-icon="mdi-close" @click="selectedRows = []">
                    Clear
                  </v-btn>
                </div>
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

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
            <th class="text-left font-weight-bold">Type</th>
            <th class="text-left font-weight-bold" style="min-width: 130px; color: #424242">Contact</th>
            <th class="text-left font-weight-bold" style="min-width: 150px; color: #424242">Address</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Schedule</th>
            <th class="text-left font-weight-bold" style="width: 120px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && requests.length === 0">
             <td colspan="9" class="text-center pa-4">Loading...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
             <td colspan="9" class="text-center pa-4">No requests found.</td>
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
              <v-chip v-if="isGroup(item)" size="x-small" :color="getGroupColor(item)" variant="flat" class="text-white text-caption font-weight-bold">
                <v-icon left size="12" class="mr-1">mdi-account-group</v-icon> GROUP
              </v-chip>
              <v-chip v-else size="x-small" color="grey" variant="outlined" class="text-caption font-weight-bold">
                <v-icon left size="12" class="mr-1">mdi-account</v-icon> SOLO
              </v-chip>
            </td>
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
        <v-card-title class="bg-primary text-white d-flex align-center">
           <v-icon class="mr-2">{{ isBulkEditing ? 'mdi-account-group' : 'mdi-pencil' }}</v-icon>
           {{ isBulkEditing ? `Bulk Update ${selectedRows.length} Sessions` : 'Update Bible Study Session' }}
        </v-card-title>
        <v-card-text class="mt-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
              v-model="editItem.pastor_id"
                :items="pastors"
                item-title="name"
                item-value="id"
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

          <div v-else-if="availableSlots.length > 0" class="slots-selection-container mb-4 pa-4 bg-grey-lighten-5 rounded-xl border">
            <div v-for="dateGroup in availableSlots.slice(0, 6)" :key="dateGroup.date" class="mb-4 pb-2 border-bottom">
              <div class="d-flex align-center flex-wrap">
                <div class="text-subtitle-2 font-weight-bold grey--text text-uppercase mr-3 mb-1" style="font-size: 0.7rem; letter-spacing: 0.5px; min-width: 140px;">
                  <v-icon size="14" color="teal" class="mr-1">mdi-calendar</v-icon>
                  {{ formatBibleStudyDate(dateGroup.date) }}:
                </div>
                <div class="d-flex flex-wrap gap-2 mb-1">
                  <v-chip
                    v-for="slot in dateGroup.timeSlots"
                    :key="slot.datetime"
                    size="small"
                    variant="flat"
                    :color="isSameSchedule(editItem.scheduled_date, slot.datetime) ? 'teal' : 'white'"
                    :class="['elevation-1 border-teal', isSameSchedule(editItem.scheduled_date, slot.datetime) ? 'text-white' : 'text-teal font-weight-bold']"
                    @click="selectSlot(slot.datetime)"
                    style="cursor: pointer;"
                  >
                    <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                    {{ formatTime(slot.time) }}
                    <span class="ml-1 opacity-70" style="font-size: 0.75em !important;">
                      ({{ slot.bookedCount || 0 }}{{ slot.maxCapacity ? '/' + slot.maxCapacity : '' }})
                    </span>
                  </v-chip>
                </div>
              </div>
            </div>
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
          <v-btn color="primary" variant="flat" @click="saveEdit" :loading="loading">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Promotion Choice Dialog (Enhanced for Bulk Support) -->
    <v-dialog v-model="promotionDialogVisible" :max-width="isBulkPromoting ? '650px' : '480px'">
      <v-card class="rounded-xl overflow-hidden elevation-24">
        <v-card-title class="bg-teal-darken-2 text-white text-center py-5 d-flex flex-column align-center">
          <v-avatar color="white" size="56" class="mb-2 elevation-2">
            <v-icon color="teal-darken-2" size="32">mdi-water-check</v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-bold">Water Baptism Promotion</div>
          <span v-if="isBulkPromoting" class="text-caption opacity-80" style="color: white !important;">Group Action ({{ selectedRows.length }} Selected Candidates)</span>
        </v-card-title>
        
        <v-card-text class="pa-6 bg-grey-lighten-4">
          <div v-if="isBulkPromoting" class="mb-4">
            <label class="text-subtitle-2 font-weight-bold d-block mb-2 text-teal-darken-3 d-flex align-center">
              <v-icon size="18" class="mr-2">mdi-account-group</v-icon>
              Selected Candidates ({{ selectedRows.length }})
            </label>
            <v-card variant="outlined" class="pa-2 bg-white rounded-lg border-teal border-dashed" style="max-height: 120px; overflow-y: auto;">
              <div class="d-flex flex-wrap gap-1">
                <v-chip v-for="id in selectedRows" :key="id" size="x-small" color="teal-lighten-4" class="teal--text font-weight-bold">
                  {{ requests.find(r => r.request_id === id)?.firstname }} {{ requests.find(r => r.request_id === id)?.lastname }}
                </v-chip>
              </div>
            </v-card>
          </div>

          <v-expand-transition>
            <div v-if="showScheduleFields" class="mb-4">
              <v-divider class="mb-6"></v-divider>
              <h3 class="text-subtitle-1 font-weight-bold mb-4 teal--text d-flex align-center">
                <v-icon class="mr-2">mdi-calendar-plus</v-icon>
                Common Baptism Schedule
              </h3>
              
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="bulkPromotionData.pastor_name"
                    :items="pastors"
                    item-title="name"
                    item-value="id"
                    label="Assigned Pastor"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account-tie"
                    bg-color="white"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="bulkPromotionData.location"
                    label="Location"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-map-marker"
                    bg-color="white"
                  ></v-text-field>
                </v-col>
              </v-row>

              <div class="mt-2">
                <label class="text-caption font-weight-bold grey--text mb-2 d-block">Available Water Baptism Slots (30 Days)</label>
                
                <div v-if="slotsLoading" class="text-center pa-4 border rounded-xl bg-white mb-2">
                  <v-progress-circular indeterminate color="teal" size="24" class="mb-2" />
                  <div class="text-caption">Loading baptism dates...</div>
                </div>

                <div v-else-if="waterBaptismSlots.length > 0" class="slots-selection-container pa-4 bg-white rounded-xl border elevation-1 mb-2" style="max-height: 250px; overflow-y: auto;">
                  <div v-for="dateGroup in waterBaptismSlots" :key="dateGroup.date" class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold grey--text text-uppercase mb-2" style="font-size: 0.7rem; letter-spacing: 0.5px;">
                      <v-icon size="14" color="teal" class="mr-1">mdi-calendar</v-icon>
                      {{ dateGroup.displayDate }}
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                      <v-chip
                        v-for="slot in dateGroup.timeSlots"
                        :key="slot.datetime"
                        size="small"
                        variant="flat"
                        :color="bulkPromotionData.baptism_date === dateGroup.date && bulkPromotionData.baptism_time === slot.time ? 'teal' : 'grey-lighten-4'"
                        :class="['elevation-1', bulkPromotionData.baptism_date === dateGroup.date && bulkPromotionData.baptism_time === slot.time ? 'text-white' : 'text-teal font-weight-bold']"
                        @click="bulkPromotionData.baptism_date = dateGroup.date; bulkPromotionData.baptism_time = slot.time"
                        style="cursor: pointer;"
                      >
                        <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                        {{ formatTime(slot.time) }}
                        <span class="ml-1 opacity-70" style="font-size: 0.75em !important;">
                          ({{ slot.bookedCount || 0 }}{{ slot.maxCapacity ? '/' + slot.maxCapacity : '' }})
                        </span>
                      </v-chip>
                    </div>
                  </div>
                </div>
                
                <v-alert v-else type="info" variant="tonal" density="compact" class="mb-2">
                  No baptism slots found. Use the Availability Manager to create some first.
                </v-alert>

                <div v-if="bulkPromotionData.baptism_date" class="selected-schedule-confirm pa-3 bg-teal-lighten-5 rounded-lg border-teal mb-2 d-flex align-center">
                  <v-icon color="teal" class="mr-2">mdi-check-circle</v-icon>
                  <span class="text-caption font-weight-bold text-teal-darken-3">
                    Selected: {{ moment(bulkPromotionData.baptism_date).format('MMMM D, YYYY') }} at {{ formatTime(bulkPromotionData.baptism_time) }}
                  </span>
                </div>
              </div>
            </div>
          </v-expand-transition>
          
          <div v-if="!showScheduleFields">
            <p v-if="!isBulkPromoting" class="text-body-1 mb-6 text-center text-grey-darken-3">
              How would you like to proceed with <b>{{ promotionData?.firstname }} {{ promotionData?.lastname }}</b>?
            </p>
            
            <v-row dense>
              <v-col cols="12">
                <v-btn
                  block
                  color="teal-darken-1"
                  size="x-large"
                  variant="flat"
                  class="mb-4 py-8 rounded-xl elevation-2 text-none"
                  @click="handlePromotionAction(true)"
                  :loading="loadingPromotion && !isBulkPromoting"
                >
                  <div class="d-flex align-center justify-start w-100 px-4">
                    <v-avatar color="white" rounded size="48" class="mr-4 elevation-1">
                      <v-icon color="teal-darken-1" size="24">mdi-calendar-edit</v-icon>
                    </v-avatar>
                    <div class="d-flex flex-column align-start">
                      <div class="font-weight-bold text-subtitle-1">Direct Schedule & Promote</div>
                      <div class="text-caption opacity-90 white--text" style="color: white !important;">
                        {{ isBulkPromoting ? 'Set schedule for the entire group now.' : 'Candidate is ready. Open form to set schedule.' }}
                      </div>
                    </div>
                  </div>
                </v-btn>
              </v-col>

              <v-col cols="12">
                <v-btn
                  block
                  color="white"
                  size="x-large"
                  variant="flat"
                  class="py-8 rounded-xl elevation-1 border-teal-lighten-3 text-none"
                  @click="handlePromotionAction(false)"
                  :loading="loadingPromotion"
                >
                  <div class="d-flex align-center justify-start w-100 px-4">
                    <v-avatar color="teal-lighten-5" rounded size="48" class="mr-4">
                      <v-icon color="teal-darken-1" size="24">mdi-email-send</v-icon>
                    </v-avatar>
                    <div class="d-flex flex-column align-start">
                      <div class="font-weight-bold text-subtitle-1 teal--text text-teal-darken-2">Send Invitation Forms</div>
                      <div class="text-caption text-grey-darken-1">
                        {{ isBulkPromoting ? 'Send registration links to all selected group members.' : 'Candidate is hesitant. Send a link for self-scheduling.' }}
                      </div>
                    </div>
                  </div>
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 bg-white border-top">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" class="px-6 font-weight-bold" @click="promotionDialogVisible = false">Cancel</v-btn>
          <v-btn 
            v-if="showScheduleFields" 
            color="teal-darken-1" 
            variant="flat" 
            class="px-8 font-weight-bold rounded-lg" 
            height="44"
            :loading="loadingPromotion"
            @click="handlePromotionAction(true)"
          >
            Confirm Promotion
          </v-btn>
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

    <!-- Availability Manager Dialog -->
    <AvailabilityManager 
      v-model="availabilityManagerVisible" 
      initial-service="bible_study" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import moment from 'moment';
import { useAdminBibleStudyStore } from '@/stores/admin/biblestudyStore';
import { useSystemSettingsStore } from '@/stores/admin/systemSettingsStore';
import WaterBaptismRegistration from '@/components/LandingPage/Services/WaterBaptismRegistration.vue';
import AvailabilityManager from '@/components/Admin/ServicesRecords/AvailabilityManager.vue';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from '@/api/axios';

const store = useAdminBibleStudyStore();
const settingsStore = useSystemSettingsStore();
const { requests, loading, totalCount, currentPage, pastors } = storeToRefs(store);
const { settings, loading: settingsLoading } = storeToRefs(settingsStore);

const isGroup = (item) => {
  if (!item.notes) return false;
  try {
     const notesObj = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
     if (typeof notesObj !== 'object' || notesObj === null) return false;
     
     // The structure can vary: { group_id } or { notes: { group_id } }
     return !!(notesObj.group_id || (notesObj.notes && typeof notesObj.notes === 'object' && notesObj.notes.group_id));
  } catch (e) { return false; }
};

const getGroupColor = (item) => {
  if (!item.notes) return '#0d9488';
  try {
     const notesObj = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
     if (typeof notesObj !== 'object' || notesObj === null) return '#0d9488';
     
     const groupId = notesObj.group_id || (notesObj.notes && typeof notesObj.notes === 'object' ? notesObj.notes.group_id : null);
     if (!groupId) return '#0d9488';
     
     let hash = 0;
     for (let i = 0; i < groupId.length; i++) {
        hash = groupId.charCodeAt(i) + ((hash << 5) - hash);
     }
     const colors = ['#059669', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#c026d3', '#be123c', '#4f46e5'];
     return colors[Math.abs(hash) % colors.length];
  } catch (e) { return '#0d9488'; }
};

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
const dateRange = ref([]);
const dialogVisible = ref(false);
const editItem = ref({});

// Sorting & Bulk Action State
const sortBy = ref('Date Created (Newest)');
const isBulkEditing = ref(false);
const isBulkPromoting = ref(false);

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
const availabilityManagerVisible = ref(false);
const promotionData = ref(null);

// Reset bulk state when dialog closes
watch(promotionDialogVisible, (newVal) => {
  if (!newVal) {
    isBulkPromoting.value = false;
    showScheduleFields.value = false;
    bulkPromotionData.value = {
      pastor_name: '',
      location: 'Church Pool',
      baptism_date: '',
      baptism_time: ''
    };
  }
});
const loadingPromotion = ref(false);
const rejectingId = ref(null);

const availableSlots = ref([]);
const waterBaptismSlots = ref([]);
const slotsLoading = ref(false);
const showScheduleFields = ref(false);
const bulkPromotionData = ref({
  pastor_name: '',
  location: 'Church Pool',
  baptism_date: '',
  baptism_time: ''
});

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

const handleBulkArchive = async () => {
  if (selectedRows.value.length === 0) return;

  try {
    const { value: reason } = await ElMessageBox.prompt(
      `You are about to archive ${selectedRows.value.length} selected record(s). Please provide a reason for this action.`,
      'Bulk Archive Bible Study',
      {
        confirmButtonText: 'Archive Records',
        cancelButtonText: 'Cancel',
        inputPattern: /.+/,
        inputPlaceholder: 'e.g., Records are outdated or duplicate',
        inputErrorMessage: 'Archive reason is required',
        type: 'warning'
      }
    );

    if (reason) {
      const success = await store.bulkArchiveRequests(selectedRows.value, reason);
      if (success) {
        selectedRows.value = [];
      }
    }
  } catch {
    // User cancelled
  }
};

const handleBulkEdit = () => {
  if (selectedRows.value.length === 0) return;
  isBulkEditing.value = true;
  const firstId = selectedRows.value[0];
  const firstItem = requests.value.find(r => r.request_id === firstId) || {};
  // Coerce pastor_id to number if numeric, to match v-select item-value type
  const pid = firstItem.pastor_id;
  const coercedPastorId = pid && !isNaN(pid) ? Number(pid) : (pid || null);
  // Check if all selected items share the same scheduled date
  const allSchedules = selectedRows.value.map(id => {
    const r = requests.value.find(req => req.request_id === id);
    return r ? r.scheduled_date : null;
  });
  const uniqueSchedules = [...new Set(allSchedules)];
  const commonSchedule = uniqueSchedules.length === 1 ? uniqueSchedules[0] : null;

  editItem.value = {
    request_id: null,
    status: firstItem.status || 'Scheduled',
    location: firstItem.location || firstItem.address || '',
    pastor_id: coercedPastorId,
    scheduled_date: commonSchedule,
    notes: ''
  };
  dialogVisible.value = true;
  fetchAvailableSlots();
};

const handleBulkPromote = () => {
  if (selectedRows.value.length === 0) return;
  isBulkPromoting.value = true;
  
  // For bulk mode, we don't pre-set promotionData to a single item.
  // Instead, the dialog will use selectedRows.
  promotionData.value = {
    firstname: '',
    lastname: ''
  };
  promotionDialogVisible.value = true;
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

const handleSort = (val) => {
  const sortMap = {
    'Date Created (Newest)': 'date_created_desc',
    'Date Created (Oldest)': 'date_created_asc',
    'Status (A-Z)': 'status_asc',
    'Name (A-Z)': 'name_asc'
  };
  store.setFilters({ sortBy: sortMap[val] || 'date_created_desc' });
};

const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  const tableHeaders = ['ID', 'Name', 'Email', 'Type', 'Status', 'Schedule', 'Created'];
  const logoUrl = window.location.origin + '/logo.png';
  
  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.lastname || ''}`.trim()
    : 'Admin';
    
  const tableRows = requests.value.map(item => `
    <tr>
      <td>${item.request_id}</td>
      <td><strong>${item.firstname} ${item.lastname}</strong></td>
      <td>${item.email}</td>
      <td>${isGroup(item) ? 'GROUP' : 'SOLO'}</td>
      <td>${item.status}</td>
      <td>${item.scheduled_date ? moment(item.scheduled_date).format('MMM DD, YYYY hh:mm A') : 'Not Scheduled'}</td>
      <td>${moment(item.date_created).format('MMM DD, YYYY')}</td>
    </tr>
  `).join('');

  const currentDate = new Date().toLocaleString();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bible Study Requests Report - Print</title>
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
            font-size: 12px;
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
            font-size: 11px;
            color: #666;
          }
          .footer-info {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          <img src="${logoUrl}" alt="Watermark" />
        </div>
        <div class="church-header">
          <img src="${logoUrl}" alt="Church Logo" />
          <div class="org-name">Bible Baptist Ekklesia of Kawit</div>
        </div>
        <div class="report-title">Bible Study Requests Report</div>
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
          <div>Total Records: ${requests.value.length}</div>
          <div class="footer-info">
            <div>Printed on: ${currentDate}</div>
            <div>Printed by: ${printedBy}</div>
          </div>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

const handleDateRangeChange = (val) => {
    if (val && val.length === 2) {
        store.setFilters({ startDate: val[0], endDate: val[1] });
    } else {
        store.setFilters({ startDate: null, endDate: null });
    }
};

const handleExportExcel = async (format = 'xlsx') => {
  await store.exportToExcel({ ...store.filters, format });
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
  // Coerce pastor_id to number if numeric, to match v-select item-value type
  const pid = item.pastor_id;
  editItem.value.pastor_id = pid && !isNaN(pid) ? Number(pid) : (pid || null);
  
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
      params: { service: 'bible_study', days: 30 }
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

const fetchWaterBaptismSlots = async () => {
  slotsLoading.value = true;
  waterBaptismSlots.value = [];
  try {
    const response = await axios.get('/services/water-baptisms/available-slots', {
      params: { days: 30 }
    });
    if (response.data.success) {
      // Map the response to include a display date
      waterBaptismSlots.value = (response.data.data || []).map(group => ({
        ...group,
        displayDate: moment(group.date).format('MMMM D, YYYY (dddd)')
      }));
    }
  } catch (error) {
    console.error('Error fetching water baptism slots:', error);
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

const isSameSchedule = (d1, d2) => {
  if (!d1 || !d2) return false;
  const f1 = moment(d1).format('YYYY-MM-DD HH:mm:ss');
  const f2 = moment(d2).format('YYYY-MM-DD HH:mm:ss');
  return f1 === f2;
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

  let success = false;
  if (isBulkEditing.value) {
    const payload = {
      requestIds: selectedRows.value,
      ...editItem.value
    };
    // Don't overwrite individual locations/notes if they were blank in bulk edit?
    // Usually bulk edit means "update all selected to these values"
    success = await store.bulkUpdateRequest(payload);
    if (success) {
      selectedRows.value = [];
      isBulkEditing.value = false;
    }
  } else {
    success = await store.updateRequest(editItem.value.request_id, editItem.value);
  }
  
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
    if (isBulkPromoting.value) {
      if (!showScheduleFields.value) {
        showScheduleFields.value = true;
        fetchWaterBaptismSlots();
        return;
      }
      
      // Perform Bulk Promotion with Schedule
      if (!bulkPromotionData.value.pastor_name || !bulkPromotionData.value.baptism_date) {
        ElMessage.warning('Please select a pastor and a time slot.');
        return;
      }

      loadingPromotion.value = true;
      try {
        const success = await store.bulkPromoteToBaptism(selectedRows.value, true, bulkPromotionData.value);
        if (success) {
          promotionDialogVisible.value = false;
          selectedRows.value = [];
        }
      } finally {
        loadingPromotion.value = false;
      }
      return;
    }
    // Individual direct schedule
    promotionDialogVisible.value = false;
    adminWaterBaptismDialogVisible.value = true;
  } else {
    // Send invitation links
    loadingPromotion.value = true;
    try {
      if (isBulkPromoting.value) {
          const success = await store.bulkPromoteRequests(selectedRows.value, false);
          if (success) {
            promotionDialogVisible.value = false;
            selectedRows.value = [];
          }
      } else {
          const activeItem = promotionData.value._activeItem;
          const success = await store.inviteToBaptism(activeItem.request_id);
          if (success) {
            promotionDialogVisible.value = false;
          }
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
