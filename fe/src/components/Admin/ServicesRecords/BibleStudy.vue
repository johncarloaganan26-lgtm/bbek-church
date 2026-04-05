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
        <div v-if="selectedRows.length > 0" class="bulk-actions-bar mt-3 pa-3 d-flex align-center gap-2">
          <v-chip color="primary" size="small" class="mr-2 font-weight-bold px-3" label>
            <v-icon start size="14">mdi-checkbox-marked</v-icon>
            {{ selectedRows.length }} SELECTED
          </v-chip>
          <v-btn v-if="hasPendingSelection" color="error" variant="outlined" size="small" class="bulk-action-btn font-weight-bold text-uppercase" @click="handleBulkReject">
            <v-icon start size="16">mdi-close-octagon</v-icon>
            Reject Selected
          </v-btn>
          <v-btn color="success" variant="outlined" size="small" class="bulk-action-btn font-weight-bold text-uppercase" @click="handleBulkComplete">
            <v-icon start size="16">mdi-check-all</v-icon>
            Complete Selected
          </v-btn>
          <v-btn color="error" variant="outlined" size="small" class="bulk-action-btn font-weight-bold text-uppercase" @click="handleBulkArchive">
            <v-icon start size="16">mdi-archive</v-icon>
            Archive Selected
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" size="small" color="grey-darken-1" class="text-none" @click="selectedRows = []">
            <v-icon start size="14">mdi-close</v-icon>
            Clear
          </v-btn>
        </div>
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
            <th class="text-left font-weight-bold">Assigned Pastor</th>
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
              <div class="d-flex align-center">
                <div class="text-caption text-grey-darken-2 text-truncate" style="max-width: 150px;" :title="item.location || item.address || ''">
                  <v-icon size="12" class="mr-1">mdi-map-marker</v-icon>{{ item.location || item.address || '' }}
                </div>
                <v-chip v-if="isGroup(item)" size="x-small" color="teal" variant="flat" class="ml-2 font-weight-black shadow-sm" style="font-size: 9px; height: 16px;">
                  +{{ getGroupSize(item) }} COMPANIONS
                </v-chip>
              </div>
            </td>
            <td>{{ getPastorName(item.pastor_id) }}</td>
            <td>
              <div class="d-flex align-center">
                <v-chip size="small" :color="getStatusColor(item.status)" class="text-white font-weight-bold px-2">
                  {{ item.status === 'Completed' && isBaptismInvited(item) ? 'Completed | Invited' : item.status }}
                </v-chip>
              </div>
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
                  v-if="isGroup(item)"
                  variant="outlined"
                  size="small"
                  color="teal"
                  @click="openCompanionsDialog(item)"
                >
                  <v-icon>mdi-account-group</v-icon>
                  <v-tooltip activator="parent" location="top">View Companions ({{ getGroupSize(item) }})</v-tooltip>
                </v-btn>

                <v-btn
                  v-if="!isGroup(item)"
                  variant="outlined"
                  size="small"
                  color="primary"
                  @click="openEditDialog(item)"
                >
                  <v-icon size="18">mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="top">Edit / Schedule</v-tooltip>
                </v-btn>

                <v-btn
                  v-if="!isGroup(item) && ['Pending', 'Scheduled'].includes(item.status) && (item.status === 'Scheduled' || settings.allow_complete_without_schedule)"
                  variant="outlined"
                  size="small"
                  color="success"
                  @click="markIndividualComplete(item)"
                >
                  <v-icon size="20">mdi-check-circle-outline</v-icon>
                  <v-tooltip activator="parent" location="top">Mark Completed</v-tooltip>
                </v-btn>

                <v-btn
                  v-if="item.status === 'Completed' && !isGroup(item)"
                  variant="outlined"
                  size="small"
                  color="teal-darken-3"
                  @click="promoteToBaptism(item)"
                >
                  <v-icon size="18">mdi-water</v-icon>
                  <v-tooltip activator="parent" location="top">Promote to Water Baptism</v-tooltip>
                </v-btn>

                <v-btn
                  v-if="item.status === 'Pending'"
                  variant="outlined"
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
    <v-dialog v-model="dialogVisible" max-width="900px" persistent>
      <v-card class="rounded-xl overflow-hidden d-flex flex-column" style="max-height: 90vh;">
        <v-card-title class="bg-primary text-white d-flex align-center flex-shrink-0">
           <v-icon class="mr-2">mdi-pencil</v-icon>
           Update Bible Study Session
        </v-card-title>
        <v-card-text class="mt-4 flex-grow-1 overflow-y-auto scrollbar-thin">
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
                      ({{ slot.bookedCount || 0 }}/{{ slot.maxCapacity || 10 }})
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
    <v-dialog v-model="promotionDialogVisible" :max-width="isBulkPromoting && showScheduleFields ? '1000px' : (isBulkPromoting ? '650px' : '480px')" scrollable transition="dialog-bottom-transition">
      <v-card class="rounded-xl overflow-hidden elevation-24 d-flex flex-column" style="max-height: 90vh;">
        <v-card-title class="bg-teal-darken-3 text-white text-center py-6 d-flex flex-column align-center flex-shrink-0 relative">
          <v-btn icon="mdi-close" variant="text" color="white" class="position-absolute" style="top: 10px; right: 10px;" @click="promotionDialogVisible = false"></v-btn>
          <v-avatar color="white" size="64" class="mb-3 elevation-4">
            <v-icon color="teal-darken-3" size="36">mdi-water-check</v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-bold letter-spacing-1">Water Baptism Promotion</div>
          <span v-if="isBulkPromoting" class="text-subtitle-2 font-weight-medium opacity-90 mt-1" style="color: white !important;">
            Group Action ({{ promotingCompanions.length > 0 ? promotingCompanions.length : selectedRows.length }} Selected Candidates)
          </span>
        </v-card-title>
        
        <v-card-text class="pa-0 bg-grey-lighten-4 overflow-y-auto flex-grow-1 position-relative shadow-inner">
          <!-- Premium Loading Overlay -->
          <v-overlay v-model="loadingPromotion" contained persistent class="align-center justify-center backdrop-blur-sm" scrim="teal-darken-4" opacity="0.3">
            <div class="d-flex flex-column align-center pa-12 bg-white rounded-xl elevation-24 border-teal border-sm">
              <div class="loading-animation-container mb-6">
                <v-progress-circular indeterminate color="teal-darken-2" size="100" width="10">
                  <v-icon color="teal-darken-2" size="48" class="pulse-animation">mdi-water-sync</v-icon>
                </v-progress-circular>
              </div>
              <div class="text-h5 font-weight-black text-teal-darken-4 mb-2 letter-spacing-1">Promoting Candidates</div>
              <div class="text-subtitle-2 text-grey-darken-1 font-weight-medium text-center" style="max-width: 250px;">
                Securely synchronizing records and preparing baptism entries...
              </div>
            </div>
          </v-overlay>

          <!-- Bulk Promotion Main View -->
          <div v-if="showScheduleFields" class="pa-6">
            <v-row>
              <!-- LEFT COLUMN: Candidates & Settings -->
              <v-col cols="12" md="5" class="border-e-md">
                <div class="pe-md-4">
                  <!-- Selected Candidates Section -->
                  <div class="mb-6">
                    <label class="text-overline font-weight-black d-block mb-3 text-teal-darken-4 d-flex align-center">
                      <v-icon size="18" class="mr-2">mdi-account-group</v-icon>
                      Selected Candidates ({{ promotingCompanions.length > 0 ? promotingCompanions.length : selectedRows.length }})
                    </label>
                    <v-card variant="outlined" class="pa-3 bg-white rounded-lg border-teal border-dashed" style="max-height: 140px; overflow-y: auto;">
                      <div class="d-flex flex-wrap gap-2">
                        <template v-if="promotingCompanions.length > 0">
                          <v-chip v-for="(person, idx) in promotingCompanions" :key="idx" size="small" color="teal-lighten-5" class="text-teal-darken-3 font-weight-bold border-teal">
                            <v-icon start size="14">mdi-account-check</v-icon>
                            {{ person.firstname }} {{ person.lastname }}
                          </v-chip>
                        </template>
                        <template v-else>
                          <v-chip v-for="id in selectedRows" :key="id" size="small" color="teal-lighten-5" class="text-teal-darken-3 font-weight-bold border-teal">
                            <v-icon start size="14">mdi-account-check</v-icon>
                            {{ requests.find(r => r.request_id === id)?.firstname }} {{ requests.find(r => r.request_id === id)?.lastname }}
                          </v-chip>
                        </template>
                      </div>
                    </v-card>
                  </div>

                  <v-divider class="mb-6"></v-divider>

                  <!-- Schedule Settings -->
                  <div class="mb-4">
                    <h3 class="text-subtitle-1 font-weight-bold mb-4 teal--text d-flex align-center">
                      <v-icon class="mr-2" color="teal">mdi-cog-outline</v-icon>
                      Common Baptism Schedule
                    </h3>
                    
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
                      class="mb-4"
                      hide-details="auto"
                    ></v-select>

                    <v-text-field
                      v-model="bulkPromotionData.location"
                      label="Location"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-map-marker"
                      bg-color="white"
                      hide-details="auto"
                    ></v-text-field>
                  </div>

                  <!-- Selected Confirmation Box (Moved here for better visibility) -->
                  <v-fade-transition>
                    <div v-if="bulkPromotionData.baptism_date" class="mt-8 pa-4 bg-teal-darken-3 text-white rounded-xl elevation-4 d-flex align-center">
                      <v-avatar color="white" size="40" class="mr-3">
                        <v-icon color="teal-darken-3">mdi-check-bold</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-caption font-weight-bold white--text opacity-80" style="color: white !important;">Selected Schedule</div>
                        <div class="text-subtitle-1 font-weight-bold">
                          {{ moment(bulkPromotionData.baptism_date).format('MMMM D, YYYY') }} at {{ formatTime(bulkPromotionData.baptism_time) }}
                        </div>
                      </div>
                    </div>
                  </v-fade-transition>
                </div>
              </v-col>

              <!-- RIGHT COLUMN: Slot Selection -->
              <v-col cols="12" md="7">
                <div class="ps-md-4">
                  <div class="d-flex align-center justify-space-between mb-4">
                    <label class="text-overline font-weight-black text-grey-darken-2 d-block">Available Water Baptism Slots (30 Days)</label>
                    <v-btn icon="mdi-refresh" variant="text" size="small" :loading="slotsLoading" @click="fetchWaterBaptismSlots"></v-btn>
                  </div>
                  
                  <div v-if="slotsLoading" class="d-flex flex-column align-center justify-center pa-12 bg-white rounded-xl border border-dashed">
                    <v-progress-circular indeterminate color="teal" size="48" width="4" class="mb-4" />
                    <div class="text-subtitle-1 font-weight-bold grey--text">Loading baptism dates...</div>
                  </div>

                  <div v-else-if="waterBaptismSlots.length > 0" class="slots-selection-container pa-4 bg-white rounded-xl border elevation-2" style="height: 400px; overflow-y: auto;">
                    <div v-for="dateGroup in waterBaptismSlots" :key="dateGroup.date" class="mb-5 pb-2">
                      <div class="text-subtitle-2 font-weight-bold grey--text text-uppercase mb-3 d-flex align-center">
                        <v-icon size="18" color="teal" class="mr-2">mdi-calendar-range</v-icon>
                        {{ dateGroup.displayDate }}
                      </div>
                      <div class="d-flex flex-wrap gap-3">
                         <v-btn
                          v-for="slot in dateGroup.timeSlots"
                          :key="slot.datetime"
                          variant="flat"
                          size="large"
                          :color="bulkPromotionData.baptism_date === dateGroup.date && bulkPromotionData.baptism_time === slot.time ? 'teal-darken-1' : 'grey-lighten-4'"
                          :class="['rounded-lg transition-swing', bulkPromotionData.baptism_date === dateGroup.date && bulkPromotionData.baptism_time === slot.time ? 'text-white' : 'text-teal-darken-2 font-weight-bold shadow-sm']"
                          @click="bulkPromotionData.baptism_date = dateGroup.date; bulkPromotionData.baptism_time = slot.time"
                          style="min-width: 140px;"
                        >
                          <v-icon size="20" class="mr-2">mdi-clock-outline</v-icon>
                          {{ formatTime(slot.time) }}
                          <span class="ml-2 opacity-70 font-weight-medium" style="font-size: 0.7em !important;">
                            ({{ slot.bookedCount || 0 }}/{{ slot.maxCapacity || 10 }})
                          </span>
                        </v-btn>
                      </div>
                    </div>
                  </div>

                  <v-alert v-else type="info" variant="tonal" density="compact" class="mb-4 rounded-lg">
                    No baptism slots found. Use the Availability Manager to create some first.
                  </v-alert>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Initial Action Selection View -->
          <div v-else class="pa-6">
            <p v-if="!isBulkPromoting" class="text-h6 mb-8 text-center text-grey-darken-3 px-8 line-height-1-6">
              How would you like to proceed with <b>{{ promotionData?.firstname }} {{ promotionData?.lastname }}</b>?
            </p>
            <p v-else class="text-h6 mb-8 text-center text-grey-darken-3 px-8 line-height-1-6">
              How would you like to proceed with the <b>{{ promotingCompanions.length > 0 ? promotingCompanions.length : selectedRows.length }}</b> selected candidates?
            </p>
            
            <v-row dense class="px-4 pb-4">
              <v-col cols="12">
                <v-btn
                  block
                  color="teal-darken-2"
                  size="x-large"
                  variant="flat"
                  class="mb-4 py-8 rounded-xl elevation-3 text-none hover-scale transition-swing"
                  @click="handlePromotionAction(true)"
                  :loading="loadingPromotion && !isBulkPromoting"
                >
                  <div class="d-flex align-center justify-start w-100 px-4">
                    <v-avatar color="white" rounded size="48" class="mr-4 elevation-2">
                      <v-icon color="teal-darken-2" size="28">mdi-calendar-edit</v-icon>
                    </v-avatar>
                    <div class="d-flex flex-column align-start">
                      <div class="font-weight-black text-subtitle-1">Direct Schedule & Promote</div>
                      <div class="text-caption opacity-90 text-white font-weight-medium">
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
                  class="py-8 rounded-xl elevation-1 border-teal-lighten-2 text-none border-sm hover-scale transition-swing"
                  @click="handlePromotionAction(false)"
                  :loading="loadingPromotion"
                >
                  <div class="d-flex align-center justify-start w-100 px-4">
                    <v-avatar color="teal-lighten-5" rounded size="48" class="mr-4">
                      <v-icon color="teal-darken-2" size="28">mdi-email-send</v-icon>
                    </v-avatar>
                    <div class="d-flex flex-column align-start">
                      <div class="font-weight-black text-subtitle-1 teal--text text-teal-darken-2">Send Invitation Forms</div>
                      <div class="text-caption text-grey-darken-1 font-weight-medium">
                        {{ isBulkPromoting ? 'Send registration links to all selected group members.' : 'Candidate is hesitant. Send a link for self-scheduling.' }}
                      </div>
                    </div>
                  </div>
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        <v-card-actions class="pa-6 bg-white border-t flex-shrink-0">
          <v-btn color="grey-darken-1" variant="text" size="large" class="px-8 font-weight-bold rounded-lg" @click="promotionDialogVisible = false">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn 
            v-if="showScheduleFields"
            color="teal-darken-2" 
            variant="flat" 
            size="large"
            class="px-10 font-weight-bold rounded-lg elevation-4 hover-scale" 
            @click="submitBulkPromotion"
            :loading="loadingPromotion"
            :disabled="!bulkPromotionData.baptism_date || !bulkPromotionData.baptism_time || !bulkPromotionData.pastor_name"
          >
            <v-icon start class="mr-2">mdi-check-circle</v-icon>
            Confirm Promotion
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!-- Water Baptism Admin Registration Dialog -->
    <v-dialog v-model="adminWaterBaptismDialogVisible" max-width="1100px" persistent>
      <v-card class="rounded-xl bg-white overflow-y-auto" style="max-height: 90vh;">
        <!-- Dialog Header (Fixed via sticky) -->
        <div class="bg-teal-darken-3 text-white d-flex align-center py-4 px-6 shadow-sm sticky-top" style="z-index: 10;">
          <div class="d-flex align-center">
            <v-icon icon="mdi-water" class="mr-3" size="28"></v-icon>
            <div>
              <div class="font-weight-bold text-h6">Water Baptism Promotion</div>
              <div class="text-caption">Complete registration for {{ promotionData?.firstname }} {{ promotionData?.lastname }}</div>
            </div>
          </div>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="adminWaterBaptismDialogVisible = false"
          ></v-btn>
        </div>

        <div class="pa-4">
          <WaterBaptismRegistration
            admin-mode
            :admin-data="promotionData"
            @success="handlePromotionSubmit"
          />
        </div>
      </v-card>
    </v-dialog>

    <!-- Companion Management Console -->
    <v-dialog v-model="companionsDialogVisible" max-width="1100px" persistent>
      <v-card class="rounded-xl overflow-hidden shadow-2xl d-flex flex-column" style="max-height: 90vh;">
        <div class="bg-teal-darken-3 text-white d-flex align-center py-4 px-6 flex-shrink-0">
          <div class="d-flex align-center">
            <v-avatar color="teal-lighten-4" size="40" class="mr-3">
              <v-icon color="teal-darken-3">mdi-account-group</v-icon>
            </v-avatar>
            <div class="d-flex flex-column">
              <span class="text-h6 font-weight-bold">Group Management Console (Bible Study)</span>
              <span class="text-caption" style="opacity: 0.9">Managing discipleship group for <b>{{ selectedGroup?.firstname }} {{ selectedGroup?.lastname }}</b></span>
            </div>
          </div>
          <v-spacer></v-spacer>
          <div class="d-flex gap-2">
            <v-chip color="teal-lighten-4" text-color="teal-darken-4" size="small" class="font-weight-bold mr-2 px-4 shadow-sm">
              <v-icon start size="14">mdi-account-multiple</v-icon>
              {{ getGroupSize(selectedGroup) + 1 }} PARTICIPANTS
            </v-chip>
            <v-btn icon="mdi-close" variant="text" color="white" @click="companionsDialogVisible = false"></v-btn>
          </div>
        </div>

        <v-card-text class="pa-0 flex-grow-1 overflow-y-auto bg-white">
          <!-- Selection Actions Bar -->
          <v-expand-transition>
            <div v-if="selectedInGroup.length > 0" class="bulk-actions-bar pa-3 d-flex align-center gap-2 sticky-top border-b" style="z-index: 5; border-radius: 0;">
              <v-chip color="teal-darken-2" size="small" class="mr-2 font-weight-black px-4">
                {{ selectedInGroup.length }} SELECTED
              </v-chip>
              
              <div class="d-flex gap-2">
                <v-btn v-if="allSelectedArePending" size="small" color="error" variant="outlined" @click="bulkActionInGroup('Rejected')" class="bulk-action-btn font-weight-bold text-uppercase">
                  <v-icon start size="16">mdi-close-circle-outline</v-icon>
                  Reject
                </v-btn>
                <v-divider vertical class="mx-1"></v-divider>
                <v-btn size="small" color="teal-darken-2" variant="outlined" @click="openBulkEdit" class="bulk-action-btn font-weight-bold text-uppercase">
                  <v-icon start size="16">mdi-pencil-box-multiple</v-icon>
                  Bulk Edit
                </v-btn>
                <v-btn 
                  size="small" 
                  color="teal-darken-2" 
                  variant="outlined" 
                  @click="handleConsoleBulkPromote" 
                  v-if="canBulkPromote"
                  class="bulk-action-btn font-weight-bold text-uppercase"
                >
                  <v-icon start size="16">mdi-water</v-icon>
                  Promote to Baptism
                </v-btn>
                <v-btn 
                  size="small" 
                  color="success" 
                  variant="outlined" 
                  @click="bulkActionInGroup('Completed')" 
                  v-if="canBulkCompleteInConsole"
                  class="bulk-action-btn font-weight-bold text-uppercase ml-1"
                >
                  <v-icon start size="16">mdi-check-circle-outline</v-icon>
                  Mark Completed
                </v-btn>
              </div>

              <v-spacer></v-spacer>
              
              <v-btn size="small" variant="text" color="grey-darken-2" @click="selectedInGroup = []" class="text-none">
                <v-icon start size="14">mdi-selection-off</v-icon>
                Clear Selection
              </v-btn>
            </div>
          </v-expand-transition>

          <v-table hover fixed-header class="companion-management-table">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="text-center" style="width: 40px;">
                  <v-checkbox
                    v-model="groupSelectAll"
                    density="compact"
                    hide-details
                    color="teal"
                    @update:model-value="toggleGroupSelectAll"
                  ></v-checkbox>
                </th>
                <th class="font-weight-bold text-uppercase py-4" style="font-size: 11px; letter-spacing: 0.5px;">Name</th>
                <th class="font-weight-bold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Role / Info</th>
                <th class="font-weight-bold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Email / Phone</th>
                <th class="font-weight-bold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Assigned Pastor</th>
                <th class="font-weight-bold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Schedule / Venue</th>
                <th class="font-weight-bold text-uppercase text-center" style="font-size: 11px; letter-spacing: 0.5px;">Status</th>
                <th class="text-center font-weight-bold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Edit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(person, idx) in companionsInGroup" :key="idx" :class="{ 'role-primary-row': person.type === 'primary' }">
                <td class="text-center">
                  <v-checkbox
                    v-model="selectedInGroup"
                    :value="idx"
                    density="compact"
                    hide-details
                    color="teal"
                  ></v-checkbox>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <v-avatar :color="person.type === 'primary' ? 'teal-darken-1' : 'grey-lighten-2'" size="32" class="mr-3">
                      <span class="text-caption font-weight-bold" :class="person.type === 'primary' ? 'text-white' : 'text-grey-darken-2'">
                        {{ person.firstname.charAt(0) }}{{ person.lastname.charAt(0) }}
                      </span>
                    </v-avatar>
                    <div>
                      <div class="font-weight-bold text-body-2">{{ person.firstname }} {{ person.lastname }}</div>
                      <div class="text-caption text-grey">{{ person.type === 'primary' ? 'Group Leader' : 'Companion' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column gap-1">
                    <v-chip size="x-small" :color="person.type === 'primary' ? 'teal' : 'blue-grey'" variant="flat" class="text-uppercase font-weight-black" style="font-size: 9px;">
                      {{ person.type }}
                    </v-chip>
                  </div>
                </td>
                <td>
                  <div class="text-body-2">{{ person.email || 'No Email' }}</div>
                  <div class="text-caption text-grey">{{ person.phone_number || 'No Phone' }}</div>
                </td>
                <td>
                  <div class="text-caption font-weight-bold text-grey-darken-3">
                    <v-icon size="14" color="teal" class="mr-1">mdi-account-tie</v-icon>
                    {{ getPastorName(person.pastor_id) }}
                  </div>
                </td>
                <td>
                  <div v-if="person.scheduled_date" class="text-caption font-weight-bold text-teal-darken-2">
                    <v-icon size="12" class="mr-1">mdi-calendar-clock</v-icon>
                    {{ formatDateTime(person.scheduled_date) }}
                  </div>
                  <div v-else class="text-caption text-grey font-italic">No schedule set</div>
                  <div v-if="person.location" class="text-caption text-truncate" style="max-width: 150px;">
                    <v-icon size="12" class="mr-1">mdi-map-marker</v-icon>
                    {{ person.location }}
                  </div>
                </td>
                <td class="text-center">
                  <v-chip 
                    size="small" 
                    :color="getStatusColor(person.status)" 
                    class="text-white font-weight-bold"
                  >
                     {{ person.status === 'Completed' && isBaptismInvited(person) ? 'Completed | Invited' : person.status }}
                  </v-chip>
                </td>
                 <td class="text-center">
                  <v-btn size="x-small" variant="text" color="teal-darken-1" @click="openCompanionSchedule(idx)" class="mr-1">
                    <v-icon size="20">mdi-calendar-edit</v-icon>
                    <v-tooltip activator="parent" location="top">Schedule / Update Candidate</v-tooltip>
                  </v-btn>
                  <v-btn v-if="person.status === 'Scheduled'" size="x-small" variant="text" color="success" @click="markConsoleParticipantComplete(idx)" class="mr-1">
                    <v-icon size="20">mdi-check-circle-outline</v-icon>
                    <v-tooltip activator="parent" location="top">Mark as Completed</v-tooltip>
                  </v-btn>
                  <v-btn v-if="person.status === 'Completed'" size="x-small" variant="text" color="teal-darken-3" @click="promoteToBaptism(person)">
                    <v-icon size="20">mdi-water-check</v-icon>
                    <v-tooltip activator="parent" location="top">Promote to Water Baptism</v-tooltip>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        
        <v-card-actions class="pa-4 bg-grey-lighten-4 border-t d-flex justify-space-between align-center">
            <div class="d-flex align-center">
            <v-icon color="grey-darken-1" size="18" class="mr-2">mdi-information-outline</v-icon>
            <span class="text-caption grey--text font-italic">
                Bible Study groups are synchronized with the lead's record.
            </span>
            </div>
            <v-btn color="grey-darken-2" variant="outlined" size="small" @click="companionsDialogVisible = false" class="px-6 rounded-lg">
            Close Console
            </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Edit Dialog (Console Context) -->
    <v-dialog v-model="bulkEditVisible" max-width="900px">
      <v-card class="rounded-xl overflow-hidden shadow-xl">
        <v-card-title class="bg-teal-darken-2 text-white py-4 px-6 d-flex align-center">
          <v-icon class="mr-3">mdi-pencil-box-multiple</v-icon>
          <span class="text-h6 font-weight-bold font-heading">Update {{ selectedInGroup.length }} Candidates</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="bulkEditVisible = false" class="ml-auto"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-0 d-flex bg-white flex-column flex-md-row position-relative">
          <v-overlay v-model="bulkLoading" contained persistent class="align-center justify-center rounded-xl" scrim="white" opacity="0.8">
            <v-progress-circular indeterminate color="teal-darken-2" size="64" width="6" class="mb-4"></v-progress-circular>
          </v-overlay>

          <div class="pa-6 flex-grow-1" style="overflow-y: auto; max-height: 65vh;">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="bulkForm.pastor_id"
                  :items="pastors"
                  item-title="name"
                  item-value="id"
                  label="Assigned Pastor"
                  variant="outlined"
                  density="compact"
                  placeholder="Keep Current"
                  clearable
                  class="mb-2"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="bulkForm.location" label="Location" variant="outlined" density="compact" placeholder="Keep Current"></v-text-field>
              </v-col>
            </v-row>

            <v-select v-model="bulkForm.status" :items="['Pending', 'Scheduled', 'Completed', 'Cancelled']" label="New Status" variant="outlined" density="compact" class="mt-2"></v-select>

            <div v-if="slotsLoading" class="text-center pa-4">
              <v-progress-circular indeterminate color="teal"></v-progress-circular>
            </div>
            <div v-else class="mt-4">
                <label class="text-caption font-weight-bold grey--text d-block mb-2">New Schedule (Daily)</label>
                <div class="bg-grey-lighten-5 rounded pa-3 border shadow-inner overflow-y-auto" style="max-height: 300px;">
                <div v-for="dateGroup in availableSlots" :key="dateGroup.date" class="mb-4">
                    <div class="text-caption font-weight-bold teal--text mb-2">{{ formatBibleStudyDate(dateGroup.date) }}</div>
                    <div class="d-flex flex-wrap gap-2">
                    <v-chip
                        v-for="slot in dateGroup.timeSlots" :key="slot.datetime"
                        size="small" variant="flat"
                        :color="bulkForm.scheduled_date === slot.datetime ? 'teal' : 'white'"
                        :class="[bulkForm.scheduled_date === slot.datetime ? 'text-white' : 'text-teal border']"
                        @click="bulkForm.scheduled_date = slot.datetime"
                    >
                      <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                      {{ formatTime(slot.time) }}
                      <span class="ml-1 opacity-70" style="font-size: 0.75em !important;">
                        ({{ slot.bookedCount || 0 }}/{{ slot.maxCapacity || 10 }})
                      </span>
                    </v-chip>
                    </div>
                </div>
                </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4 border-t">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="bulkEditVisible = false">Cancel</v-btn>
          <v-btn color="teal-darken-2" variant="flat" class="px-6" @click="applyBulkEdit">Apply Updates</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Complete Confirmation Dialog -->
    <v-dialog v-model="bulkCompleteDialog" max-width="400px" persistent>
      <v-card class="pa-4 rounded-xl">
        <div class="pa-4 text-center">
          <v-avatar color="success-lighten-5" size="80" class="mb-4">
            <v-icon color="success" size="40">mdi-check-circle</v-icon>
          </v-avatar>
          <h2 class="text-h5 font-weight-bold mb-1">Mark as Completed?</h2>
          <p class="text-body-2 text-grey-darken-1">
            Selected {{ selectedRequestsToComplete.length }} records to mark as completed. This will also send confirmation emails.
          </p>
        </div>
        <v-card-actions class="pa-4 pt-0">
          <v-btn block color="success" size="large" variant="flat" class="rounded-lg font-weight-bold" @click="confirmBulkComplete" :loading="loading">
            Yes, Mark Completed
          </v-btn>
        </v-card-actions>
        <v-btn variant="text" color="grey" block @click="bulkCompleteDialog = false" :disabled="loading">Cancel</v-btn>
      </v-card>
    </v-dialog>

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

// New states for companion console
const hasPendingSelection = computed(() => {
  return selectedRows.value.some(id => {
    const row = requests.value.find(r => r.request_id === id);
    return row && row.status === 'Pending';
  });
});

const handleBulkReject = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      'Please provide a reason for rejecting the selected pending requests.',
      'Bulk Reject Requests',
      {
        confirmButtonText: 'Reject All',
        cancelButtonText: 'Cancel',
        inputType: 'textarea',
        inputPlaceholder: 'Reason for rejection...',
        inputValidator: (val) => !!val || 'Reason is required',
      }
    );

    if (reason) {
      const pendingIds = selectedRows.value.filter(id => {
        const row = requests.value.find(r => r.request_id === id);
        return row && row.status === 'Pending';
      });

      if (pendingIds.length === 0) return;

      const response = await axios.post('/services/biblestudy/bulk-reject', {
        request_ids: pendingIds,
        reason
      });

      if (response.data.success) {
        ElMessage.success(`${pendingIds.length} requests rejected successfully`);
        selectedRows.value = [];
        store.fetchRequests();
      }
    }
  } catch (e) {
    if (e !== 'cancel') console.error('Bulk reject error:', e);
  }
};

const bulkCompleteDialog = ref(false);
const selectedRequestsToComplete = ref([]);

const openCompletionDialog = (items) => {
  selectedRequestsToComplete.value = items;
  bulkCompleteDialog.value = true;
};

const confirmBulkComplete = async () => {
  try {
    const ids = selectedRequestsToComplete.value.map(r => r.request_id);
    const success = await store.bulkCompleteRequests(ids);
    if (success) {
      bulkCompleteDialog.value = false;
      selectedRows.value = [];
    }
  } catch (error) {
    console.error('Error in confirmBulkComplete:', error);
  }
};
const bulkEditVisible = ref(false);
const bulkLoading = ref(false);
const bulkForm = ref({ status: '', pastor_id: null, location: '', scheduled_date: null });

const companionEditVisible = ref(false);
const editingCompanionIndex = ref(-1);
const companionForm = ref({ 
  firstname: '', 
  lastname: '', 
  email: '', 
  phone_number: '', 
  age: '', 
  gender: '',
  status: '',
  pastor_id: null,
  location: '',
  scheduled_date: null
});

const openBulkEdit = () => {
  if (selectedInGroup.value.length === 0) return;
  const selectedPeople = selectedInGroup.value.map(idx => companionsInGroup.value[idx]);
  
  const getCommon = (key) => {
    const values = selectedPeople.map(p => p[key]);
    const first = values[0];
    const allSame = values.every(v => v === first);
    return allSame ? first : null;
  };

  bulkForm.value = { 
    status: getCommon('status') || '', 
    pastor_id: getCommon('pastor_id') || null, 
    location: getCommon('location') || '', 
    scheduled_date: getCommon('scheduled_date') || null 
  };
  bulkEditVisible.value = true;
  fetchAvailableSlots();
};

const applyBulkEdit = async () => {
  bulkLoading.value = true;
  try {
    selectedInGroup.value.forEach(idx => {
      const person = companionsInGroup.value[idx];
      if (bulkForm.value.status) {
        companionsInGroup.value[idx].status = bulkForm.value.status;
        if (bulkForm.value.status === 'Pending') companionsInGroup.value[idx].pastor_id = null;
      }
      if (bulkForm.value.pastor_id !== null) companionsInGroup.value[idx].pastor_id = bulkForm.value.pastor_id;
      if (bulkForm.value.location) companionsInGroup.value[idx].location = bulkForm.value.location;
      if (bulkForm.value.scheduled_date) companionsInGroup.value[idx].scheduled_date = bulkForm.value.scheduled_date;
    });

    // Pass information about what was actually changed to avoid aggressive sync
    const changesMade = {
      status: !!bulkForm.value.status,
      pastor: bulkForm.value.pastor_id !== null,
      schedule: !!bulkForm.value.scheduled_date,
      location: !!bulkForm.value.location
    };

    const success = await saveCompanionsUpdate(changesMade);
    if (success) {
      bulkEditVisible.value = false;
      selectedInGroup.value = [];
      groupSelectAll.value = false;
      ElMessage.success('Bulk updates applied successfully');
    }
  } catch (e) {
    console.error(e);
  } finally { bulkLoading.value = false; }
};

const openCompanionSchedule = (idx) => {
  editingCompanionIndex.value = idx;
  const person = companionsInGroup.value[idx];
  
  isEditingFromConsole.value = true;
  isBulkEditing.value = false;
  
  editItem.value = { ...person };
  editItem.value._originalStatus = person.status;

  // Find the matching pastor from the reactive list to ensure perfect v-select pairing
  editItem.value.pastor_id = matchPastorId(person.pastor_id);
  
  dialogVisible.value = true;
  fetchAvailableSlots();
};

const isGroup = (item) => {
  if (!item?.notes) return false;
  try {
    const notesData = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
    // Must have the group flag/id AND actual companions to show management
    const hasGroupFlag = !!(notesData.is_group || notesData.group_id);
    const hasCompanions = Array.isArray(notesData.companions) && notesData.companions.length > 0;
    return hasGroupFlag && hasCompanions;
  } catch (e) {
    return false;
  }
};

const getCompanions = (item) => {
  if (!item?.notes) return [];
  try {
    const notesData = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
    return notesData.companions || [];
  } catch (e) {
    return [];
  }
};

const getGroupSize = (item) => {
  return getCompanions(item).length;
};

const companionsDialogVisible = ref(false);
const selectedGroup = ref(null);
const companionsInGroup = ref([]);
const selectedInGroup = ref([]);
const groupSelectAll = ref(false);
// Snapshot of which companions were selected when the promotion dialog was opened
const promotingCompanions = ref([]);

const openCompanionsDialog = (item) => {
  selectedGroup.value = item;
  
  // Normalize Primary Requester pastor_id
  let primaryId = item.pastor_id;
  if (primaryId !== null && primaryId !== undefined) {
    primaryId = String(primaryId).replace(/^0+/, '');
    if (primaryId === '') primaryId = null;
  }

  const primary = {
    firstname: item.firstname,
    lastname: item.lastname,
    email: item.email,
    phone_number: item.phone_number || '',
    age: item.age,
    gender: item.gender,
    type: 'primary',
    status: item.status,
    pastor_id: primaryId,
    location: item.location,
    request_type: 'Bible Study',
    scheduled_date: item.scheduled_date
  };

  // Map Companions
  const companions = getCompanions(item).map(c => {
    const isPending = (c.status || 'Pending') === 'Pending';
    let pId = c.pastor_id || item.pastor_id;
    // Normalize pastor_id
    if (pId !== null && pId !== undefined) {
      pId = String(pId).replace(/^0+/, '');
      if (pId === '') pId = null;
    }

    return {
      ...c,
      type: 'companion',
      status: c.status || 'Pending',
      scheduled_date: c.scheduled_date || item.scheduled_date,
      pastor_id: isPending ? (c.pastor_id || null) : pId,
      location: c.location || item.location,
      request_type: 'Bible Study'
    };
  });

  companionsInGroup.value = [primary, ...companions];
  selectedInGroup.value = [];
  groupSelectAll.value = false;
  companionsDialogVisible.value = true;
};

const toggleGroupSelectAll = () => {
  if (groupSelectAll.value) {
    selectedInGroup.value = companionsInGroup.value.map((_, i) => i);
  } else {
    selectedInGroup.value = [];
  }
};

const saveCompanionsUpdate = async (changesMade = null) => {
  if (!selectedGroup.value) return false;
  
  try {
    const primary = companionsInGroup.value.find(p => p.type === 'primary');
    const companions = companionsInGroup.value.filter(p => p.type === 'companion');
    
    // 1. Prepare updated notes for primary record
    const updatedNotes = {
      is_group: true,
      group_size: companionsInGroup.value.length,
      companions: companions.map(c => ({
        firstname: c.firstname,
        lastname: c.lastname,
        email: c.email,
        phone_number: c.phone_number,
        age: c.age,
        gender: c.gender,
        status: c.status,
        pastor_id: c.pastor_id,
        location: c.location,
        scheduled_date: c.scheduled_date
      }))
    };

    // 2. Update Primary Record in DB
    const updatePayload = {
      ...primary,
      notes: JSON.stringify(updatedNotes)
    };

    const success = await store.updateRequest(selectedGroup.value.request_id, updatePayload);

    if (success) {
      // Sync local main table data
      const idx = requests.value.findIndex(r => r.request_id === selectedGroup.value.request_id);
      if (idx !== -1) {
        requests.value[idx] = { ...requests.value[idx], ...updatePayload };
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Save companions error:', error);
    return false;
  }
};

const bulkActionInGroup = async (newStatus) => {
  if (selectedInGroup.value.length === 0) return;
  
  selectedInGroup.value.forEach(idx => {
    // Note: status transition rules are relaxed in group console to allow manual fixes
    companionsInGroup.value[idx].status = newStatus;
  });
  
  const success = await saveCompanionsUpdate();
  if (success) {
    ElMessage.success(`Status updated for ${selectedInGroup.value.length} group members`);
    selectedInGroup.value = [];
    groupSelectAll.value = false;
  }
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
const isEditingFromConsole = ref(false);
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
    promotingCompanions.value = [];
    bulkPromotionData.value = {
      pastor_name: '',
      location: '',
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
  location: '',
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
  const eligibleItems = requests.value
    .filter(r => selectedRows.value.includes(r.request_id))
    .filter(r => {
      if (settings.value.allow_complete_without_schedule) {
        return ['Pending', 'Scheduled', 'Completed'].includes(r.status) && r.status !== 'Completed';
      }
      return r.status === 'Scheduled';
    });

  if (eligibleItems.length === 0) {
    ElMessage.warning('None of the selected records are eligible for completion based on current restrictions.');
    return;
  }

  openCompletionDialog(eligibleItems);
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
    pastor_id: matchPastorId(firstItem.pastor_id),
    scheduled_date: commonSchedule,
    notes: ''
  };
  dialogVisible.value = true;
  fetchAvailableSlots();
};

const handleBulkPromote = () => {
  if (selectedRows.value.length === 0) return;
  isBulkPromoting.value = true;
  
  const firstId = selectedRows.value[0];
  const firstItem = requests.value.find(r => r.request_id === firstId) || {};
  
  // Pre-fill location from the first selected record
  bulkPromotionData.value.location = firstItem.location || firstItem.address || '';
  
  promotionData.value = {
    firstname: '',
    lastname: ''
  };
  promotionDialogVisible.value = true;
};

const handleConsoleBulkPromote = () => {
  if (selectedInGroup.value.length === 0) return;
  isBulkPromoting.value = true;
  
  // Snapshot the exact companions that are selected so the backend
  // only promotes those specific members — not the entire notes group.
  promotingCompanions.value = selectedInGroup.value.map(idx => companionsInGroup.value[idx]);

  // Use current group leader's location as default
  const leader = selectedGroup.value;
  bulkPromotionData.value.location = leader.location || leader.address || '';
  
  promotionDialogVisible.value = true;
};

const totalPages = computed(() => Math.ceil(totalCount.value / 10) || 1);

const canBulkPromote = computed(() => {
  if (selectedInGroup.value.length === 0) return false;
  return selectedInGroup.value.every(idx => companionsInGroup.value[idx].status === 'Completed');
});

const allSelectedArePending = computed(() => {
  if (selectedInGroup.value.length === 0) return false;
  return selectedInGroup.value.every(idx => companionsInGroup.value[idx].status === 'Pending');
});

const canBulkCompleteInConsole = computed(() => {
  if (selectedInGroup.value.length === 0) return false;
  return selectedInGroup.value.every(idx => companionsInGroup.value[idx].status === 'Scheduled');
});

const markConsoleParticipantComplete = async (idx) => {
  const person = companionsInGroup.value[idx];
  try {
    await ElMessageBox.confirm(
      `Mark ${person.firstname} ${person.lastname} as completed?`,
      'Confirm Completion',
      { confirmButtonText: 'Yes, Complete', cancelButtonText: 'Cancel', type: 'success' }
    );
    
    companionsInGroup.value[idx].status = 'Completed';
    const success = await saveCompanionsUpdate();
    if (success) ElMessage.success('Candidate marked as completed');
  } catch (e) { /* Cancelled */ }
};

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
    case 'Promoted': return 'teal-darken-1';
    case 'Rejected': return 'error';
    default: return 'grey';
  }
};

const isBaptismInvited = (item) => {
  if (!item || !item.notes) return false;
  
  // Notes can be a stringified object or regular string
  try {
    const notesData = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
    // Check for "invited to water baptism" or similar in notes
    return (notesData.invitedToBaptism === true) || 
           (notesData.status === 'invited') ||
           (typeof item.notes === 'string' && item.notes.toLowerCase().includes('invited to water baptism'));
  } catch (e) {
    return typeof item.notes === 'string' && item.notes.toLowerCase().includes('invited to water baptism');
  }
};

const submitBulkPromotion = () => {
  handlePromotionAction(true);
};

const promotionTimeOptions = [
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
  '7:00 PM', '7:30 PM', '8:00 PM'
];

const handlePromotionTimeInput = (val) => {
  if (!val) return;
  const timeStr = String(val).toUpperCase().trim();
  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;
  const match = timeStr.match(timeRegex);

  if (match) {
    let [_, hours, minutes, ampm] = match;
    let h = parseInt(hours);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    
    if (h < 13) {
      ElMessage.warning('Baptism time must be 1:00 PM onwards.');
      bulkPromotionData.value.baptism_time = '13:00:00';
      return;
    }
    bulkPromotionData.value.baptism_time = `${String(h).padStart(2, '0')}:${minutes}:00`;
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
  isEditingFromConsole.value = false;
  editItem.value = { ...item };
  editItem.value._originalStatus = item.status;
  
  // Find the matching pastor from the reactive list to ensure perfect v-select pairing
  editItem.value.pastor_id = matchPastorId(item.pastor_id);
  
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
    success = await store.bulkUpdateRequest(payload);
    if (success) {
      selectedRows.value = [];
      isBulkEditing.value = false;
    }
  } else if (isEditingFromConsole.value) {
    // Update the specific companion in the local group reactive array
    companionsInGroup.value[editingCompanionIndex.value] = { ...editItem.value };
    
    if (editItem.value.status === 'Pending') {
      companionsInGroup.value[editingCompanionIndex.value].pastor_id = null;
    }
    
    // Perform sync to primary record in DB
    success = await saveCompanionsUpdate();
    if (success) {
      isEditingFromConsole.value = false;
      ElMessage.success('Candidate updated and synchronized');
    }
  } else {
    if (editItem.value.status === 'Pending') {
      editItem.value.pastor_id = null;
    }
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

    openCompletionDialog([item]);
  } catch (error) {
    console.error('Error in markIndividualComplete:', error);
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
    address: item.location || item.address,
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
        // If promoting from console, pass the exact selected companions snapshot.
        // Otherwise fall back to selectedRows from main table.
        const isFromConsole = isBulkPromoting.value && promotingCompanions.value.length > 0;
        const promotionIds = isFromConsole
          ? [selectedGroup.value.request_id]
          : selectedRows.value;

        // Build companion payload so backend knows exactly who to promote
        const selectedCompanionsPayload = isFromConsole ? promotingCompanions.value.map(p => ({
          firstname: p.firstname,
          lastname: p.lastname,
          middle_name: p.middle_name || '',
          email: p.email || '',
          phone_number: p.phone_number || '',
          age: p.age || null,
          gender: p.gender || '',
          birthdate: p.birthdate || null,
          civil_status: p.civil_status || 'Single',
          address: p.location || p.address || selectedGroup.value?.location || selectedGroup.value?.address || '',
          pastor_id: p.pastor_id || null,
          type: p.type  // 'primary' or 'companion'
        })) : null;

        const success = await store.bulkPromoteToBaptism(
          promotionIds,
          true,
          bulkPromotionData.value,
          selectedCompanionsPayload
        );
        if (success) {
          ElMessage.success(`${promotionIds.length} candidate(s) promoted to Water Baptism`);
          
          // Update main records status locally
          promotionIds.forEach(id => {
            const idx = requests.value.findIndex(r => r.request_id === id);
            if (idx !== -1) requests.value[idx].status = 'Promoted';
          });

          // Sync group console if needed
          if (isFromConsole) {
             promotingCompanions.value.forEach(p => {
               const cIdx = companionsInGroup.value.findIndex(c => c.firstname === p.firstname && c.lastname === p.lastname);
               if (cIdx !== -1) companionsInGroup.value[cIdx].status = 'Promoted';
             });
             saveCompanionsUpdate(); // Sync companions status into main record's notes
          }

          promotionDialogVisible.value = false;
          selectedRows.value = [];
          selectedInGroup.value = [];
          promotingCompanions.value = [];
          store.fetchRequests(); // Refresh to ensure final state consistency
        }
      } finally {
        loadingPromotion.value = false;
      }
      return;
    }
    // Individual direct schedule
    const activeItem = promotionData.value._activeItem;
    // IF it's a group, we MUST use the promotion API to bring companions along
    // Registration form is better for truly individual requests
    if (isGroup(activeItem)) {
       showScheduleFields.value = true;
       fetchWaterBaptismSlots();
       return;
    }

    promotionDialogVisible.value = false;
    adminWaterBaptismDialogVisible.value = true;
  } else {
    // Send invitation links
    loadingPromotion.value = true;
    try {
      if (isBulkPromoting.value) {
          const isFromConsole = promotingCompanions.value.length > 0;
          const promotionIds = isFromConsole
            ? [selectedGroup.value.request_id]
            : selectedRows.value;

          const selectedCompanionsPayload = isFromConsole ? promotingCompanions.value.map(p => ({
            firstname: p.firstname,
            lastname: p.lastname,
            email: p.email || '',
            phone_number: p.phone_number || '',
            age: p.age || null,
            gender: p.gender || '',
            type: p.type
          })) : null;

          const success = await store.bulkPromoteToBaptism(
            promotionIds,
            false,
            {},
            selectedCompanionsPayload
          );
          if (success) {
            ElMessage.success(`${promotionIds.length} invitation(s) sent successfully`);
            
            // Update status to 'Promoted' (or 'Invited' if preferred, but user said promotion status)
            promotionIds.forEach(id => {
              const idx = requests.value.findIndex(r => r.request_id === id);
              if (idx !== -1) requests.value[idx].status = 'Promoted';
            });

            if (isFromConsole) {
              promotingCompanions.value.forEach(p => {
                const cIdx = companionsInGroup.value.findIndex(c => c.firstname === p.firstname && c.lastname === p.lastname);
                if (cIdx !== -1) companionsInGroup.value[cIdx].status = 'Promoted';
              });
              saveCompanionsUpdate();
            }

            promotionDialogVisible.value = false;
            selectedRows.value = [];
            selectedInGroup.value = [];
            promotingCompanions.value = [];
            store.fetchRequests();
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
  adminWaterBaptismDialogVisible.value = false;
  
  // Important: Since the manual registration form might not trigger the companion loop,
  // we do a final sync if it was a group record.
  const activeItem = promotionData.value._activeItem;
  if (activeItem && isGroup(activeItem)) {
     // Mark it as promoted in BS table if the registration form succeeded
     store.updateRequest(activeItem.request_id, { status: 'Promoted' });
  }

  store.fetchRequests(); 
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

const matchPastorId = (rawId) => {
    if (!rawId) return null;
    const cleanRaw = String(rawId).replace(/^0+/, '').trim();
    const found = pastors.value.find(p => String(p.id).replace(/^0+/, '').trim() === cleanRaw);
    return found ? found.id : rawId;
};

const getPastorName = (id) => {
  if (!id) return 'Unassigned';
  
  // Create a clean normalized ID for comparison (removing leading zeros)
  const normalizeId = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).replace(/^0+/, '').trim();
  };

  const targetId = normalizeId(id);
  
  // Find match in the reactive pastors list
  const p = pastors.value.find(pastor => normalizeId(pastor.id) === targetId);
  
  // Return the name if found, otherwise return the normalized ID
  return p ? p.name : targetId;
};

onMounted(() => {
  store.fetchRequests();
  store.fetchPastors();
});
</script>

<style scoped>
.biblestudy-records { height: 100%; }

.premium-overlay {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

.companion-management-table :deep(thead th) {
  background-color: #f8fafc !important;
  color: #475569 !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0 !important;
}

.role-primary-row {
  background-color: #f0fdfa !important; /* Extremely light teal */
}

.role-primary-row:hover {
  background-color: #ccfbf1 !important;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
}

.border-b {
  border-bottom: 1px solid #e2e8f0;
}

.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.border-teal {
  border-color: #0d9488 !important;
}

.border-dashed {
  border-style: dashed !important;
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.hover-scale:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}
</style>
