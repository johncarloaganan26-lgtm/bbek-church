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
      <div v-if="selectedRequests.length > 0" class="bulk-actions-bar pa-3 d-flex align-center gap-2">
        <v-chip color="primary" size="small" class="mr-2 font-weight-bold px-3" label>
          <v-icon start size="14">mdi-checkbox-marked</v-icon>
          {{ selectedRequests.length }} SELECTED
        </v-chip>
        <v-btn v-if="hasScheduledSelectionMain" size="small" color="success" variant="outlined" @click="bulkComplete" :loading="loading" class="bulk-action-btn font-weight-bold text-uppercase">
          <v-icon start size="16">mdi-check-all</v-icon>
          Mark Completed
        </v-btn>
        <v-btn v-if="hasPendingSelectionMain" size="small" color="error" variant="outlined" @click="bulkRejectMain" :loading="loading" class="bulk-action-btn font-weight-bold text-uppercase">
          <v-icon start size="16">mdi-close-circle-outline</v-icon>
          Reject Selected
        </v-btn>
        <v-btn size="small" color="error" variant="outlined" @click="bulkArchive" class="bulk-action-btn font-weight-bold text-uppercase">
          <v-icon start size="16">mdi-archive</v-icon>
          Archive Selected
        </v-btn>
        <v-btn size="small" color="teal-darken-1" variant="outlined" @click="bulkPromoteToBibleStudyMain" v-if="canBulkPromoteMain" class="bulk-action-btn font-weight-bold text-uppercase">
          <v-icon start size="16">mdi-book-arrow-up</v-icon>
          Promote to Bible Study
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn size="small" variant="text" color="grey-darken-1" @click="clearSelection" class="text-none">
          <v-icon start size="14">mdi-close</v-icon>
          Clear
        </v-btn>
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
            <th class="text-left font-weight-bold">Assigned Pastor</th>
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
              <div class="d-flex align-center gap-1 flex-wrap">
                <v-chip size="small" :color="getRequestTypeColor(item.request_type)" class="text-white">
                  {{ item.request_type }}
                </v-chip>
                <v-chip
                  size="x-small"
                  :color="isGroup(item) ? 'deep-purple-darken-1' : 'blue-grey-lighten-1'"
                  variant="flat"
                  class="text-white font-weight-bold"
                  style="font-size: 10px;"
                >
                  <v-icon start size="12">{{ isGroup(item) ? 'mdi-account-group' : 'mdi-account' }}</v-icon>
                  {{ isGroup(item) ? 'GROUP' : 'SOLO' }}
                </v-chip>
              </div>
            </td>
            <td>{{ item.pastor_name || getPastorName(item.pastor_id) }}</td>
            <td>
              <div class="d-flex align-center gap-1 flex-wrap">
                <v-chip size="small" :color="getStatusColor(item.status)" class="text-white">
                  {{ item.status }}
                </v-chip>
                <v-chip
                  v-if="isBibleStudyInvited(item) && item.status === 'Completed'"
                  size="x-small"
                  color="teal-darken-1"
                  variant="flat"
                  class="text-white font-weight-bold"
                  style="font-size: 9px;"
                >
                  <v-icon start size="10">mdi-email-fast</v-icon>
                  Invited
                </v-chip>
                <v-chip
                  v-else-if="isBibleStudyInvited(item)"
                  size="x-small"
                  color="teal-darken-1"
                  variant="flat"
                  class="text-white font-weight-bold"
                  style="font-size: 9px;"
                >
                  <v-icon start size="10">mdi-email-fast</v-icon>
                  Invited
                </v-chip>
              </div>
            </td>
            <td>{{ formatDateTime(item.scheduled_date) }}</td>
            <td>
              <div class="d-flex gap-2 align-center">
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
                  variant="outlined"
                  size="small"
                  color="primary"
                  @click="openScheduleDialog(item)"
                  v-if="item.status !== 'Promoted' && !isGroup(item)"
                >
                  <v-icon>mdi-calendar-clock</v-icon>
                  <v-tooltip activator="parent" location="top">Update Status / Schedule</v-tooltip>
                </v-btn>

                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="success"
                  @click="markIndividualComplete(item)"
                  v-if="['Pending', 'Scheduled'].includes(item.status) && (item.status === 'Scheduled' || settings.allow_complete_without_schedule) && !isGroup(item)"
                >
                  <v-icon>mdi-check-circle-outline</v-icon>
                  <v-tooltip activator="parent" location="top">Mark Completed</v-tooltip>
                </v-btn>

                <v-btn
                  variant="outlined"
                  size="small"
                  color="teal-darken-1"
                  @click="openBibleStudyDialog(item)"
                  v-if="!isGroup(item) && item.status === 'Completed' && item.request_type === 'Salvation'"
                >
                  <v-icon>mdi-book-open-variant</v-icon>
                  <v-tooltip activator="parent" location="top">Set Bible Study Schedule</v-tooltip>
                </v-btn>



                <v-btn
                  v-if="!isGroup(item) && item.status === 'Pending'"
                  variant="outlined"
                  size="small"
                  color="error"
                  @click="rejectItem(item)"
                  class="reject-btn"
                >
                  <v-icon>mdi-close-circle</v-icon>
                  <v-tooltip activator="parent" location="top">Reject / Suggest New Dates</v-tooltip>
                </v-btn>

                <v-btn
                  variant="outlined"
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
                      class="mb-2 mr-2 px-2"
                      @click="selectAvailableSlot(dateGroup.date, slot.time)"
                    >
                      <div class="d-flex align-center">
                        <span style="font-size: 11px;">{{ new Date(`${dateGroup.date} ${slot.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }}</span>
                        <v-chip v-if="slot.bookedCount !== undefined && slot.maxCapacity" size="x-small" :color="isSlotSelected(slot.datetime) ? 'primary' : 'grey'" class="ml-1 px-1" style="height: 16px; min-width: 16px; font-weight: bold;">
                          {{ slot.maxCapacity - slot.bookedCount }}
                        </v-chip>
                      </div>
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
                  item-value="id"
                  label="Assigned Pastor"
                  placeholder="Select a pastor"
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
              @update:model-value="handleIndividualStatusChange"
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
          {{ isPromotionScheduling ? (isBulkPromotion ? 'Bulk Schedule Bible Study' : 'Schedule Bible Study Session') : 'Salvation Talk Result' }}
        </v-card-title>
        <v-card-text class="pa-6 position-relative">
          <!-- Loading Overlay -->
          <v-overlay
            v-model="loadingBibleStudy"
            contained
            persistent
            class="align-center justify-center rounded-xl"
            scrim="white"
            opacity="0.8"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="teal-darken-2" size="64" width="6" class="mb-4"></v-progress-circular>
              <div class="text-h6 font-weight-black text-teal-darken-3">{{ isBulkPromotion ? 'BULK PROMOTING' : 'PROMOTING CANDIDATE' }}</div>
              <div class="text-caption text-grey-darken-1">Sending notifications and creating records...</div>
            </div>
          </v-overlay>

          <div v-if="!isPromotionScheduling">
            <p class="text-body-1 mb-2 text-center">Phase 1 (Salvation Talk) completed for:</p>
            <p class="text-center text-h6 font-weight-bold mb-4" v-if="!isBulkPromotion">
              {{ bibleStudyItem?.firstname }} {{ bibleStudyItem?.lastname }}
            </p>
            <p class="text-center text-h6 font-weight-bold mb-4" v-else>
              <v-chip color="teal" size="large" class="px-6">{{ selectedInGroup.length }} Selected Participants</v-chip>
            </p>
            <p class="text-body-2 text-grey-darken-1 text-center mb-5">
              Select how to proceed with {{ isBulkPromotion ? 'these candidates\'' : 'this candidate\'s' }} discipleship journey.
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
                            {{ formatTime(slot.time) }} ({{ slot.bookedCount || 0 }}/{{ slot.maxCapacity || 10 }})
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
                <div class="mb-4">
                  <p class="text-h6 font-weight-bold mb-1 teal--text d-flex align-center">
                    <v-icon color="teal" class="mr-2">mdi-account-plus</v-icon>
                    {{ isBulkPromotion ? `Group Promotion (${bulkPromoteTargetNames.length} members)` : `Schedule for ${bibleStudyItem?.firstname} ${bibleStudyItem?.lastname}` }}
                  </p>
                  <p v-if="isBulkPromotion" class="text-caption text-grey-darken-1 ml-8">
                    Promoting: <span class="font-weight-bold">{{ bulkPromoteTargetNames.join(', ') }}</span>
                  </p>
                </div>
                
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="promotionForm.pastor_id"
                      :items="pastors"
                      item-title="name"
                      item-value="id"
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

    <!-- Companion Management Console -->
    <v-dialog v-model="companionsDialogVisible" max-width="1100px" persistent>
      <v-card class="rounded-xl overflow-hidden shadow-2xl">
        <v-card-title class="bg-teal-darken-3 text-white d-flex align-center py-4 px-6">
          <div class="d-flex align-center">
            <v-avatar color="teal-lighten-4" size="40" class="mr-3">
              <v-icon color="teal-darken-3">mdi-account-group</v-icon>
            </v-avatar>
            <div class="d-flex flex-column">
              <span class="text-h6 font-weight-bold">Group Management Console</span>
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
        </v-card-title>

        <v-card-text class="pa-0 position-relative">
          <!-- Loading Overlay -->
          <v-overlay
            v-model="groupActionLoading"
            contained
            persistent
            class="align-center justify-center rounded-xl"
            scrim="white"
            opacity="0.8"
            style="z-index: 100;"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="teal-darken-3" size="64" width="6" class="mb-4"></v-progress-circular>
              <div class="text-h6 font-weight-black text-teal-darken-3">PROCESSING ACTION</div>
              <div class="text-caption text-grey-darken-1">Updating participant records and sending notifications...</div>
            </div>
          </v-overlay>

          <!-- Selection Actions Bar (Modern Style) -->
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
                <v-btn v-if="allSelectedAreScheduled" size="small" color="success" variant="outlined" @click="bulkCompleteInGroup" class="bulk-action-btn font-weight-bold text-uppercase">
                  <v-icon start size="16">mdi-check-all</v-icon>
                  Mark Completed
                </v-btn>
                <v-divider v-if="allSelectedAreScheduled" vertical class="mx-1"></v-divider>
                <v-btn size="small" color="teal-darken-2" variant="outlined" @click="openBulkEdit" class="bulk-action-btn font-weight-bold text-uppercase">
                  <v-icon start size="16">mdi-pencil-box-multiple</v-icon>
                  Bulk Edit
                </v-btn>
                <v-btn 
                  size="small" 
                  color="teal-darken-1" 
                  variant="outlined" 
                  @click="bulkPromoteToBibleStudy" 
                  v-if="canBulkPromote"
                  class="bulk-action-btn font-weight-bold text-uppercase"
                >
                  <v-icon start size="16">mdi-book-open-variant</v-icon>
                  Promote to Bible Study
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
                <th class="font-weight-bold text-uppercase text-center" style="font-size: 11px; letter-spacing: 0.5px;">Actions</th>
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
                    <div class="d-flex gap-1 mt-1">
                      <span class="text-caption text-grey-darken-1">{{ person.age }}y, {{ person.gender }}</span>
                    </div>
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
                  <div class="d-flex flex-column align-center gap-1">
                    <v-chip 
                      size="small" 
                      :color="getStatusDisplayColor(person.status)" 
                      variant="flat" 
                      class="text-uppercase font-weight-black shadow-sm"
                      style="font-size: 10px; min-width: 90px;"
                    >
                      {{ getStatusDisplayText(person.status) }}
                    </v-chip>
                    <v-chip
                      v-if="isBibleStudyInvitedIndiv(person)"
                      size="x-small"
                      color="teal-darken-1"
                      variant="flat"
                      class="text-white font-weight-bold"
                      style="font-size: 9px;"
                    >
                      <v-icon start size="10">mdi-email-check</v-icon>
                      INVITED
                    </v-chip>
                  </div>
                </td>
                <td class="text-center">
                  <div class="d-flex gap-2 justify-center">
                    <v-btn
                      variant="outlined"
                      size="small"
                      color="primary"
                      @click="openCompanionEdit(idx)"
                      v-if="person.status !== 'Promoted'"
                    >
                      <v-icon>mdi-calendar-clock</v-icon>
                      <v-tooltip activator="parent" location="top">Update Status / Schedule</v-tooltip>
                    </v-btn>

                    <v-btn
                      variant="outlined"
                      size="small"
                      color="success"
                      @click="markCompanionComplete(idx)"
                      v-if="person.status === 'Scheduled'"
                    >
                      <v-icon>mdi-check</v-icon>
                      <v-tooltip activator="parent" location="top">Mark Completed</v-tooltip>
                    </v-btn>

                    <v-btn
                      v-if="person.status === 'Completed'"
                      variant="outlined"
                      size="small"
                      color="teal-darken-3"
                      @click="promoteCompanionToBibleStudy(idx)"
                    >
                      <v-icon size="18">mdi-book-open-variant</v-icon>
                      <v-tooltip activator="parent" location="top">Promote to Bible Study</v-tooltip>
                    </v-btn>

                    <v-btn
                      v-if="person.status === 'Pending'"
                      variant="outlined"
                      size="small"
                      color="error"
                      @click="rejectCompanion(idx)"
                    >
                      <v-icon>mdi-close-circle</v-icon>
                      <v-tooltip activator="parent" location="top">Reject</v-tooltip>
                    </v-btn>

                    <v-btn
                      v-if="person.type !== 'primary' && person.status !== 'Scheduled' && person.status !== 'Completed' && person.status !== 'Promoted'"
                      variant="outlined"
                      size="small"
                      color="grey"
                      @click="removeCompanionFromGroup(idx)"
                    >
                      <v-icon>mdi-close</v-icon>
                      <v-tooltip activator="parent" location="top">Remove Participant</v-tooltip>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        
        <v-card-actions class="pa-4 bg-grey-lighten-4 border-t d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <v-icon color="grey-darken-1" size="18" class="mr-2">mdi-information-outline</v-icon>
            <span class="text-caption grey--text font-italic">
              Changes performed here are synchronized with the primary requester's metadata. 
              <span class="text-teal-darken-3 font-weight-bold">Primary requester governs overall group status.</span>
            </span>
          </div>
          <v-btn color="grey-darken-2" variant="outlined" size="small" @click="companionsDialogVisible = false" class="px-6 rounded-lg">
            Close Console
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Edit Dialog (Inside Console Context) -->
    <v-dialog v-model="bulkEditVisible" max-width="900px">
      <v-card class="rounded-xl overflow-hidden shadow-xl">
        <v-card-title class="bg-teal-darken-2 text-white py-4 px-6 d-flex align-center">
          <v-icon class="mr-3">mdi-pencil-box-multiple</v-icon>
          <span class="text-h6 font-weight-bold font-heading">Update {{ selectedInGroup.length }} Group Requests</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="bulkEditVisible = false" class="ml-auto"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-0 d-flex bg-white flex-column flex-md-row position-relative">
          <!-- Loading Overlay -->
          <v-overlay
            v-model="bulkLoading"
            contained
            persistent
            class="align-center justify-center rounded-xl"
            scrim="white"
            opacity="0.8"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="teal-darken-2" size="64" width="6" class="mb-4"></v-progress-circular>
              <div class="text-h6 font-weight-black text-teal-darken-3">PROCESSING UPDATES</div>
              <div class="text-caption text-grey-darken-1">Please wait while we sync the group data...</div>
            </div>
          </v-overlay>

          <!-- Left Panel: Available Slots -->
          <div class="pa-4 flex-shrink-0" style="width: 35%; border-right: 1px solid #e0e0e0; overflow-y: auto; max-height: 65vh; background-color: #f8fafc;">
            <div class="d-flex align-center mb-4">
              <v-icon color="teal-darken-2" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-subtitle-2 font-weight-black text-teal-darken-3 text-uppercase letter-spacing-1">Available Time Slots</span>
            </div>
            
            <div v-if="slotsLoading" class="text-center pa-8">
              <v-progress-circular indeterminate color="teal" />
              <div class="text-caption mt-2">Loading slots...</div>
            </div>
            
            <div v-else-if="availableSlots.length === 0" class="text-center pa-8 text-grey">
              No available slots found.
            </div>
            
            <v-expansion-panels v-else variant="accordion" class="border rounded-lg overflow-hidden bg-white">
              <v-expansion-panel v-for="dateGroup in availableSlots.slice(0, 7)" :key="dateGroup.date">
                <template #title>
                  <div class="d-flex align-center justify-space-between w-100">
                    <span class="font-weight-bold text-body-2">{{ formatDate(dateGroup.date) }}</span>
                    <v-chip size="x-small" color="teal" class="ml-2 font-weight-bold">{{ dateGroup.availableSlots }}</v-chip>
                  </div>
                </template>
                <v-card-text class="pa-2 bg-grey-lighten-5">
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      v-for="slot in dateGroup.timeSlots"
                      :key="slot.datetime"
                      variant="outlined"
                      size="small"
                      :color="isSlotSelected(slot.datetime) ? 'teal' : 'grey-darken-2'"
                      :class="{ 'bg-teal-lighten-5': isSlotSelected(slot.datetime) }"
                      @click="selectAvailableSlot(dateGroup.date, slot.time)"
                    >
                      <div class="d-flex align-center">
                        <span style="font-size: 11px;">{{ new Date(`${dateGroup.date} ${slot.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }}</span>
                        <v-chip v-if="slot.maxCapacity" size="x-small" :color="isSlotSelected(slot.datetime) ? 'teal' : 'grey'" class="ml-1 px-1" style="height: 16px; min-width: 16px; font-weight: bold;">
                          ({{ slot.bookedCount || 0 }}/{{ slot.maxCapacity }})
                        </v-chip>
                      </div>
                    </v-btn>
                  </div>
                </v-card-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <!-- Right Panel: Form Fields -->
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
                <v-text-field
                  v-model="bulkForm.location"
                  label="Location"
                  variant="outlined"
                  density="compact"
                  persistent-hint
                  hint="Defaults to the church address."
                  clearable
                  class="mb-2"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-select
              v-model="bulkForm.status"
              :items="statusItems"
              label="Update Status"
              @update:model-value="handleBulkStatusChange"
              variant="outlined"
              density="compact"
              placeholder="Keep Current"
              clearable
              class="mb-3"
            ></v-select>

            <v-select
              v-model="bulkForm.request_type"
              :items="requestTypeItems"
              label="Stage (Request Type)"
              variant="outlined"
              density="compact"
              placeholder="Keep Current"
              clearable
              class="mb-3"
            ></v-select>

            <label class="text-caption grey--text mb-1 d-block font-weight-bold">Schedule Date & Time</label>
            <el-date-picker
              v-model="bulkForm.scheduled_date"
              type="datetime"
              placeholder="Select date and time"
              style="width: 100%"
              format="YYYY-MM-DD hh:mm A"
              value-format="YYYY-MM-DD HH:mm:ss"
              popper-class="discipleship-date-picker"
            />
            <p class="text-caption text-grey mt-1">Salvation Talk / Bible Study schedules are available daily.</p>

            <v-textarea
              v-model="bulkForm.notes"
              label="Notes / Remarks"
              variant="outlined"
              rows="3"
              class="mt-4"
              placeholder="Internal record notes..."
            ></v-textarea>

            <transition name="fade">
              <div v-if="bulkFormattedSchedulePreview" class="mt-4 pa-4 bg-teal-lighten-5 rounded-lg border-teal shadow-sm border">
                <div class="text-caption text-teal-darken-3 font-weight-black text-uppercase letter-spacing-1">VALIDATED SCHEDULE ({{ bulkForm.request_type || 'Salvation' }})</div>
                <div class="text-h6 text-teal-darken-4 mt-1 font-weight-bold">{{ bulkFormattedSchedulePreview }}</div>
              </div>
            </transition>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-white">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey-darken-1" @click="bulkEditVisible = false" class="px-6 font-weight-bold">CANCEL</v-btn>
          <v-btn variant="flat" color="teal-darken-2" class="px-8 font-weight-bold shadow-md" @click="applyBulkEdit" :loading="bulkLoading">SAVE CHANGES</v-btn>
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

    <!-- Individual Edit Dialog (for Companions) -->
    <v-dialog v-model="companionEditVisible" max-width="900px">
      <v-card class="rounded-xl overflow-hidden shadow-xl">
        <v-card-title class="bg-teal-darken-2 text-white py-4 px-6 d-flex align-center">
          <v-icon class="mr-3">mdi-account-edit</v-icon>
          <span class="text-h6 font-weight-bold font-heading">Edit Participant Details</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="companionEditVisible = false" class="ml-auto"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-0 d-flex bg-white flex-column flex-md-row">
          <!-- Left Panel: Available Slots -->
          <div class="pa-4 flex-shrink-0" style="width: 35%; border-right: 1px solid #e0e0e0; overflow-y: auto; max-height: 70vh; background-color: #f8fafc;">
            <div class="d-flex align-center mb-4">
              <v-icon color="teal-darken-2" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-subtitle-2 font-weight-black text-teal-darken-3 text-uppercase letter-spacing-1">Available Schedules</span>
            </div>
            
            <div v-if="slotsLoading" class="text-center pa-8">
              <v-progress-circular indeterminate color="teal" />
            </div>
            
            <v-expansion-panels v-else variant="accordion" class="border rounded-lg overflow-hidden bg-white">
              <v-expansion-panel v-for="dateGroup in availableSlots.slice(0, 7)" :key="dateGroup.date">
                <template #title>
                  <div class="d-flex align-center justify-space-between w-100">
                    <span class="font-weight-bold text-body-2">{{ formatDate(dateGroup.date) }}</span>
                    <v-chip size="x-small" color="teal" class="font-weight-bold">{{ dateGroup.availableSlots }}</v-chip>
                  </div>
                </template>
                <v-card-text class="pa-2 bg-grey-lighten-5">
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      v-for="slot in dateGroup.timeSlots"
                      :key="slot.datetime"
                      variant="outlined"
                      size="small"
                      :color="isSlotSelected(slot.datetime) ? 'teal' : 'grey-darken-2'"
                      :class="{ 'bg-teal-lighten-5': isSlotSelected(slot.datetime), 'px-2': true }"
                      @click="selectAvailableSlot(dateGroup.date, slot.time)"
                    >
                      <div class="d-flex align-center">
                        <span style="font-size: 11px;">{{ new Date(`${dateGroup.date} ${slot.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }}</span>
                        <v-chip v-if="slot.maxCapacity" size="x-small" :color="isSlotSelected(slot.datetime) ? 'teal' : 'grey'" class="ml-1 px-1" style="height: 16px; min-width: 16px; font-weight: bold;">
                          ({{ slot.bookedCount || 0 }}/{{ slot.maxCapacity }})
                        </v-chip>
                      </div>
                    </v-btn>
                  </div>
                </v-card-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <!-- Right Panel: Form Fields -->
          <div class="pa-6 flex-grow-1" style="overflow-y: auto; max-height: 70vh;">
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-4 d-flex align-center">
              <v-icon size="18" class="mr-2">mdi-account-details</v-icon>
              PERSONAL INFORMATION
            </div>
            
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="companionForm.firstname" label="First Name" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="companionForm.lastname" label="Last Name" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="companionForm.email" label="Email Address" variant="outlined" density="compact" type="email"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="companionForm.phone_number" label="Phone Number" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <div class="d-flex gap-2">
                  <v-text-field v-model="companionForm.age" label="Age" type="number" variant="outlined" density="compact" class="flex-grow-1"></v-text-field>
                  <v-select v-model="companionForm.gender" :items="['Male', 'Female']" label="Gender" variant="outlined" density="compact" style="width: 120px;"></v-select>
                </div>
              </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>
            
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-4 d-flex align-center">
              <v-icon size="18" class="mr-2">mdi-shield-edit</v-icon>
              ADMINISTRATIVE DETAILS
            </div>

            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="companionForm.status"
                  :items="statusItems"
                  label="Status"
                  @update:model-value="handleCompanionStatusChange"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="companionForm.pastor_id"
                  :items="pastors"
                  item-title="name"
                  item-value="id"
                  label="Assigned Pastor"
                  placeholder="Select a pastor"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field 
                  v-model="companionForm.location" 
                  label="Location" 
                  variant="outlined" 
                  density="compact"
                  persistent-hint
                  hint="Defaults to the church address."
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="companionForm.request_type"
                  :items="requestTypeItems"
                  label="Stage"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <el-date-picker
                  v-model="companionForm.scheduled_date"
                  type="datetime"
                  placeholder="Set Schedule"
                  style="width: 100%"
                  format="YYYY-MM-DD hh:mm A"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  popper-class="discipleship-date-picker"
                ></el-date-picker>
              </v-col>
            </v-row>
            
            <transition name="fade">
              <div v-if="companionFormattedSchedulePreview" class="mt-6 pa-4 bg-teal-lighten-5 rounded-lg border-teal border shadow-sm">
                <div class="text-caption text-teal-darken-3 font-weight-black text-uppercase letter-spacing-1">VALIDATED SCHEDULE ({{ companionForm.request_type || 'Selected' }})</div>
                <div class="text-h6 text-teal-darken-4 mt-1 font-weight-bold">{{ companionFormattedSchedulePreview }}</div>
              </div>
            </transition>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-white">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey-darken-1" @click="companionEditVisible = false" class="px-6 font-weight-bold uppercase">Cancel</v-btn>
          <v-btn variant="flat" color="teal-darken-2" class="px-8 font-weight-bold uppercase shadow-md" @click="saveCompanionEdit">Save Changes</v-btn>
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
const isBulkPromotion = ref(false);
const bulkPromoteTargetNames = computed(() => {
  if (!isBulkPromotion.value) return [];
  const isMainTable = selectedRequests.value.length > 0 && selectedInGroup.value.length === 0;
  const targets = isMainTable 
    ? selectedRequests.value.map(id => requests.value.find(r => r.request_id === id))
    : selectedInGroup.value.map(idx => companionsInGroup.value[idx]);
  return targets.map(t => `${t.firstname} ${t.lastname}`);
});
const isPromotionScheduling = ref(false);
const promotionForm = ref({
  pastor_id: null,
  location: '',
  scheduled_date: '',
  notes: ''
});
const isEditing = ref(false);
const deleteReason = ref('');
const showDeleteReasonDialog = ref(false);
const itemToDelete = ref(null);
const selectedRequests = ref([]);
const bulkCompleteDialog = ref(false);
const selectedRequestsToComplete = ref([]);

const openCompletionDialog = (items) => {
  selectedRequestsToComplete.value = items;
  bulkCompleteDialog.value = true;
};

const confirmBulkComplete = async () => {
  try {
    const ids = selectedRequestsToComplete.value.map(r => r.request_id);
    const result = await store.bulkCompleteRequests(ids);
    if (result.success) {
      bulkCompleteDialog.value = false;
      selectedRequests.value = [];
      fetchData();
    }
  } catch (error) {
    console.error('Error in confirmBulkComplete:', error);
  }
};
const selectAll = ref(false);

// Companion Console State
const companionsDialogVisible = ref(false);
const selectedGroup = ref(null);
const companionsInGroup = ref([]); 
const selectedInGroup = ref([]);
const groupActionLoading = ref(false); // To track bulk actions inside the group console
const groupSelectAll = ref(false);

const bulkEditVisible = ref(false);
const bulkLoading = ref(false);
const bulkForm = ref({ status: '', pastor_id: null, location: '', request_type: '', scheduled_date: null, notes: '' });
const bulkFormattedSchedulePreview = computed(() => {
  if (!bulkForm.value.scheduled_date) return '';
  const d = new Date(bulkForm.value.scheduled_date);
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
  request_type: '',
  scheduled_date: null
});
const companionFormattedSchedulePreview = computed(() => {
  if (!companionForm.value.scheduled_date) return '';
  const d = new Date(companionForm.value.scheduled_date);
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

const canBulkPromote = computed(() => {
  if (selectedInGroup.value.length === 0) return false;
  // All selected must be 'Completed' to promote
  return selectedInGroup.value.every(idx => companionsInGroup.value[idx].status === 'Completed');
});

const allSelectedAreScheduled = computed(() => {
  if (selectedInGroup.value.length === 0) return false;
  return selectedInGroup.value.every(idx => {
    const person = companionsInGroup.value[idx];
    return person && person.status === 'Scheduled';
  });
});

const bulkCompleteInGroup = async () => {
  if (selectedInGroup.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `Mark ${selectedInGroup.value.length} selected participant(s) as completed? This will trigger completion email notifications.`,
      'Bulk Mark Completed',
      {
        confirmButtonText: 'Yes, Complete',
        cancelButtonText: 'Cancel',
        type: 'success',
      }
    );
    
    groupActionLoading.value = true;
    await bulkActionInGroup('Completed');
    selectedInGroup.value = [];
  } catch (e) {
    // User cancelled
  } finally {
    groupActionLoading.value = false;
  }
};

const allSelectedArePending = computed(() => {
  if (selectedInGroup.value.length === 0) return false;
  return selectedInGroup.value.every(idx => companionsInGroup.value[idx].status === 'Pending');
});

const canBulkPromoteMain = computed(() => {
  if (selectedRequests.value.length === 0) return false;
  return selectedRequests.value.every(id => {
    const req = requests.value.find(r => r.request_id === id);
    return req && req.status === 'Completed' && req.request_type === 'Salvation';
  });
});

const hasPendingSelectionMain = computed(() => {
  if (selectedRequests.value.length === 0) return false;
  return selectedRequests.value.some(id => {
    const req = requests.value.find(r => r.request_id === id);
    return req && req.status === 'Pending';
  });
});

const hasScheduledSelectionMain = computed(() => {
  if (selectedRequests.value.length === 0) return false;
  return selectedRequests.value.some(id => {
    const req = requests.value.find(r => r.request_id === id);
    return req && req.status === 'Scheduled';
  });
});

const isGroup = (item) => {
  if (!item?.notes) return false;
  try {
    const notesData = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
    // Must have the flag AND at least one companion to show the management button
    return !!notesData.is_group && Array.isArray(notesData.companions) && notesData.companions.length > 0;
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

const openCompanionsDialog = (item) => {
  selectedGroup.value = item;
  
  // Normalize Primary requester pastor ID
  let primaryId = item.pastor_id;
  if (primaryId && /^[0-9]+$/.test(primaryId)) primaryId = String(Number(primaryId));

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
    address: item.address,
    bible_study_invited: isBibleStudyInvited(item),
    request_type: item.request_type,
    scheduled_date: item.scheduled_date
  };

  // Map Companions
  const companions = getCompanions(item).map(c => {
    const isPending = (c.status || 'Pending') === 'Pending';
    let pId = c.pastor_id || item.pastor_id;
    // Normalize pastor_id
    if (pId && /^[0-9]+$/.test(pId)) pId = String(Number(pId));

    return {
      ...c,
      type: 'companion',
      status: c.status || 'Pending',
      scheduled_date: c.scheduled_date || item.scheduled_date,
      pastor_id: isPending ? (c.pastor_id || null) : pId,
      location: c.location || item.location,
      address: c.address || item.address,
      bible_study_invited: !!c.bible_study_invited,
      request_type: c.request_type || item.request_type
    };
  });

  companionsInGroup.value = [primary, ...companions];
  selectedInGroup.value = [];
  groupSelectAll.value = false;
  companionsDialogVisible.value = true;
};

const openBulkEdit = () => {
  if (selectedInGroup.value.length === 0) return;
  
  const selectedPeople = selectedInGroup.value.map(idx => companionsInGroup.value[idx]);
  
  // Helper to find common value if all items share it
  const getCommon = (key) => {
    const values = selectedPeople.map(p => p[key]);
    const first = values[0];
    const allSame = values.every(v => v === first);
    return allSame ? first : null;
  };

  bulkForm.value = { 
    status: getCommon('status') || '', 
    pastor_id: getCommon('pastor_id') || null,
    location: getCommon('location') || '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite', 
    request_type: getCommon('request_type') || '', 
    scheduled_date: getCommon('scheduled_date') || null,
    notes: '' 
  };

  // Normalize Pastor ID
  if (bulkForm.value.pastor_id !== null && bulkForm.value.pastor_id !== undefined) {
    bulkForm.value.pastor_id = String(bulkForm.value.pastor_id).replace(/^0+/, '');
    if (bulkForm.value.pastor_id === '') bulkForm.value.pastor_id = null;
  }
  
  bulkEditVisible.value = true;
  fetchAvailableSlots();
};

const applyBulkEdit = async () => {
  bulkLoading.value = true;
  try {
    selectedInGroup.value.forEach(idx => {
      const person = companionsInGroup.value[idx];
      
      if (bulkForm.value.status) {
        if (person.type === 'primary') {
          companionsInGroup.value[idx].status = bulkForm.value.status === 'Approved' ? 'Scheduled' : 
                                               bulkForm.value.status === 'Rejected' ? 'Cancelled' : 
                                               bulkForm.value.status;
        } else {
          companionsInGroup.value[idx].status = bulkForm.value.status;
        }

        // Rule: If status is Pending, clear the pastor
        if (companionsInGroup.value[idx].status === 'Pending') {
          companionsInGroup.value[idx].pastor_id = null;
        }
      }
      
      if (bulkForm.value.pastor_id !== null) {
        companionsInGroup.value[idx].pastor_id = bulkForm.value.pastor_id;
      }
      if (bulkForm.value.location && bulkForm.value.location.trim() !== '') {
        companionsInGroup.value[idx].location = bulkForm.value.location;
      }
      if (bulkForm.value.request_type) {
        companionsInGroup.value[idx].request_type = bulkForm.value.request_type;
      }
      if (bulkForm.value.scheduled_date) {
        companionsInGroup.value[idx].scheduled_date = bulkForm.value.scheduled_date;
      }
      if (bulkForm.value.notes && bulkForm.value.notes.trim() !== '') {
        companionsInGroup.value[idx].notes = bulkForm.value.notes;
      }
    });

    const success = await saveCompanionsUpdate();
    if (success) {
      bulkEditVisible.value = false;
      selectedInGroup.value = [];
      groupSelectAll.value = false;
      ElMessage.success('Bulk updates applied successfully');
    }
  } catch (e) {
    console.error('Apply Bulk Edit error:', e);
  } finally {
    bulkLoading.value = false;
  }
};

const promoteCompanionToBibleStudy = (idx) => {
  selectedInGroup.value = [idx];
  bulkPromoteToBibleStudy();
};

const bulkPromoteToBibleStudy = () => {
  if (selectedInGroup.value.length === 0) return;
  
  // Find first selected to use as reference for location etc
  const firstIdx = selectedInGroup.value[0];
  const person = companionsInGroup.value[firstIdx];
  
  if (!person) {
    ElMessage.error('Participant record not found.');
    return;
  }
  
  bibleStudyItem.value = person; // Use first person as representative for item details in dialog
  isBulkPromotion.value = true;
  isPromotionScheduling.value = false;
  bibleStudyDialogVisible.value = true;
  
  promotionForm.value = {
    pastor_id: person.pastor_id ? String(person.pastor_id).replace(/^0+/, '') : null,
    location: person.address || person.location || '', // Prioritize home address
    scheduled_date: '',
    notes: person.notes || '' 
  };

  fetchSlotsForBibleStudy();
};

const bulkPromoteToBibleStudyMain = () => {
  if (selectedRequests.value.length === 0) return;
  
  const firstId = selectedRequests.value[0];
  const req = requests.value.find(r => r.request_id === firstId);
  
  if (!req) return;
  
  bibleStudyItem.value = req;
  isBulkPromotion.value = true;
  isPromotionScheduling.value = false;
  bibleStudyDialogVisible.value = true;
  
  promotionForm.value = {
    pastor_id: req.pastor_id ? String(req.pastor_id).replace(/^0+/, '') : null,
    location: req.address || req.location || '', // Prioritize home address for promotion
    scheduled_date: '',
    notes: req.notes || ''
  };

  fetchSlotsForBibleStudy();
};

const editCompanionDetails = (idx) => {
  editingCompanionIndex.value = idx;
  const person = companionsInGroup.value[idx];
  companionForm.value = { ...person };
  
  // Force Pastor ID to String for perfect v-select label matching
  if (companionForm.value.pastor_id !== null && companionForm.value.pastor_id !== undefined) {
    companionForm.value.pastor_id = String(companionForm.value.pastor_id).replace(/^0+/, '');
    if (companionForm.value.pastor_id === '') companionForm.value.pastor_id = null;
  }
  
  companionEditVisible.value = true;
  fetchAvailableSlots();
};

const saveCompanionEdit = async () => {
  if (editingCompanionIndex.value === -1) return;
  
  companionsInGroup.value[editingCompanionIndex.value] = {
    ...companionsInGroup.value[editingCompanionIndex.value],
    ...companionForm.value
  };

  // Rule: If status is Pending, clear the pastor
  if (companionsInGroup.value[editingCompanionIndex.value].status === 'Pending') {
    companionsInGroup.value[editingCompanionIndex.value].pastor_id = null;
  }
  
  await saveCompanionsUpdate();
  companionEditVisible.value = false;
  ElMessage.success('Participant details updated');
};

const promoteCompanion = (idx) => {
  const person = companionsInGroup.value[idx];
  if (person.status !== 'Completed') return;
  
  bibleStudyItem.value = person;
  isBulkPromotion.value = false;
  isPromotionScheduling.value = false;
  bibleStudyDialogVisible.value = true;
  
  promotionForm.value = {
    pastor_id: null,
    location: person.location || person.address || '',
    scheduled_date: '',
    notes: ''
  };

  fetchSlotsForBibleStudy();
};

const openCompanionEdit = (idx) => {
  selectedInGroup.value = [idx];
  openBulkEdit();
};

const markCompanionComplete = async (idx) => {
  groupActionLoading.value = true;
  try {
    selectedInGroup.value = [idx];
    await bulkActionInGroup('Completed');
    selectedInGroup.value = [];
  } finally {
    groupActionLoading.value = false;
  }
};

const rejectCompanion = async (idx) => {
  groupActionLoading.value = true;
  try {
    selectedInGroup.value = [idx];
    await bulkActionInGroup('Rejected');
    selectedInGroup.value = [];
  } finally {
    groupActionLoading.value = false;
  }
};

const removeCompanionFromGroup = async (idx) => {
  const person = companionsInGroup.value[idx];
  if (person.type === 'primary') return;
  
  try {
    await ElMessageBox.confirm(`Remove ${person.firstname} from this group? This action only removes them from the companion list.`, 'Remove Participant');
    companionsInGroup.value.splice(idx, 1);
    await saveCompanionsUpdate();
    // After splice, we should clear selections as indices changed
    selectedInGroup.value = [];
    groupSelectAll.value = false;
    ElMessage.success('Participant removed from group');
  } catch (e) {}
};

const getStatusDisplayColor = (status) => {
  if (['Approved', 'Scheduled', 'Completed'].includes(status)) return 'success';
  if (['Rejected', 'Cancelled'].includes(status)) return 'error';
  return 'warning';
};

const getStatusDisplayText = (status) => {
  if (status === 'Cancelled') return 'Rejected';
  if (status === 'Scheduled') return 'Scheduled';
  return status || 'Pending';
};

const toggleGroupSelectAll = (val) => {
  if (val) {
    selectedInGroup.value = companionsInGroup.value.map((_, idx) => idx);
  } else {
    selectedInGroup.value = [];
  }
};

const updateCompanionStatus = async (index, newStatus) => {
  companionsInGroup.value[index].status = newStatus;
  await saveCompanionsUpdate();
};

const bulkActionInGroup = async (newStatus) => {
  try {
    let actionLabel = '';
    switch(newStatus) {
      case 'Approved': actionLabel = 'Approve'; break;
      case 'Rejected': 
      case 'Cancelled': actionLabel = 'Reject'; break;
      case 'Completed': actionLabel = 'Complete'; break;
      default: actionLabel = 'Update';
    }
    
    // Check if scheduling requirements are met for primary if approving
    if (newStatus === 'Approved') {
      const primaryIdx = companionsInGroup.value.findIndex(p => p.type === 'primary');
      if (primaryIdx !== -1) {
        const primary = companionsInGroup.value[primaryIdx];
        if (!primary.scheduled_date || !primary.pastor_id) {
          await ElMessageBox.alert(
            'The group leader must have an assigned pastor and schedule before you can mark the group as Scheduled.',
            'Schedule Required',
            { type: 'warning' }
          );
          return;
        }
      }
    }

    // Individual confirmations are handled by the caller (like bulkCompleteInGroup) if needed
    // But for general internal calls, we'll keep a basic check if this wasn't called by a UI action that already confirmed
    
    selectedInGroup.value.forEach(idx => {
      const person = companionsInGroup.value[idx];
      if (person.type === 'primary') {
        if (newStatus === 'Approved') {
           companionsInGroup.value[idx].status = 'Scheduled';
        } else if (newStatus === 'Rejected') {
           companionsInGroup.value[idx].status = 'Cancelled';
        } else {
           companionsInGroup.value[idx].status = newStatus;
        }
      } else {
        companionsInGroup.value[idx].status = newStatus;
      }
    });
    
    await saveCompanionsUpdate();
    selectedInGroup.value = [];
    groupSelectAll.value = false;
    ElMessage.success(`Participants updated successfully`);
  } catch (e) {
    if (e !== 'cancel') console.error('Bulk Action error:', e);
  }
};

const saveCompanionsUpdate = async () => {
  if (!selectedGroup.value) return;
  
  try {
    const primaryEntry = companionsInGroup.value.find(p => p.type === 'primary');
    const companionEntries = companionsInGroup.value.filter(p => p.type === 'companion');

    // Robust JSON parsing for notes
    let currentNotes = {};
    try {
      const rawNotes = selectedGroup.value.notes;
      currentNotes = typeof rawNotes === 'string' 
        ? (rawNotes.startsWith('{') ? JSON.parse(rawNotes) : { text: rawNotes }) 
        : (rawNotes || {});
    } catch (e) {
      console.warn('Failed to parse notes as JSON');
    }
    
    currentNotes.companions = companionEntries.map(({ type, ...rest }) => rest);
    currentNotes.is_group = true;
    currentNotes.group_size = companionEntries.length + 1;

    const updatePayload = {
      notes: currentNotes
    };

    if (primaryEntry) {
      updatePayload.status = primaryEntry.status;
      updatePayload.pastor_id = primaryEntry.pastor_id;
      updatePayload.location = primaryEntry.location;
      updatePayload.request_type = primaryEntry.request_type;
      updatePayload.scheduled_date = primaryEntry.scheduled_date;
    }
    
    const success = await store.updateRequest(selectedGroup.value.request_id, updatePayload);
    
    if (success) {
      // Sync local state so it reflects in the UI immediately
      selectedGroup.value.notes = JSON.stringify(currentNotes);
      if (updatePayload.status) selectedGroup.value.status = updatePayload.status;
      if (updatePayload.pastor_id) selectedGroup.value.pastor_id = updatePayload.pastor_id;
      if (updatePayload.location) selectedGroup.value.location = updatePayload.location;
      if (updatePayload.request_type) selectedGroup.value.request_type = updatePayload.request_type;
      if (updatePayload.scheduled_date) selectedGroup.value.scheduled_date = updatePayload.scheduled_date;
      
      // Update the main requests list too
      const idx = requests.value.findIndex(r => r.request_id === selectedGroup.value.request_id);
      if (idx !== -1) {
        requests.value[idx] = { ...requests.value[idx], ...updatePayload, notes: JSON.stringify(currentNotes) };
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Save companions error:', error);
    ElMessage.error('Failed to update group information');
    return false;
  }
};

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
    const scheduledIds = selectedRequests.value.filter(id => {
      const req = requests.value.find(r => r.request_id === id);
      return req && req.status === 'Scheduled';
    });

    if (scheduledIds.length === 0) {
      ElMessage.warning('Only scheduled requests can be marked as completed in bulk.');
      return;
    }

    openCompletionDialog(requests.value.filter(r => scheduledIds.includes(r.request_id)));
  } catch {
    // User cancelled
  }
};

const markIndividualComplete = async (item) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Manual Completion logic match from BibleStudy/WaterBaptism
    if (!settings.value.allow_complete_without_schedule) {
      if (item.status === 'Pending' || !item.scheduled_date) {
        ElMessage.warning('This session must be scheduled before it can be marked as completed.');
        return;
      }
      const scheduledDate = new Date(item.scheduled_date);
      scheduledDate.setHours(0, 0, 0, 0);
      if (scheduledDate > today) {
        ElMessage.warning(`Wait until the scheduled date (${item.scheduled_date.split('T')[0]}) or turn off Manual Completion restriction.`);
        return;
      }
    }

    openCompletionDialog([item]);
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

// Handle status changes across different forms
const handleBulkStatusChange = (val) => {
  if (val === 'Pending') {
    bulkForm.value.pastor_id = null;
    bulkForm.value.scheduled_date = null;
  }
};

const handleIndividualStatusChange = (val) => {
  if (val === 'Pending') {
    selectedRequest.value.pastor_id = null;
    selectedRequest.value.scheduled_date = null;
  }
};

const handleCompanionStatusChange = (val) => {
  if (val === 'Pending') {
    companionForm.value.pastor_id = null;
    companionForm.value.scheduled_date = null;
  }
};

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
    pastor_id: null,
    scheduled_date: '',
    location: '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite',
    notes: ''
  };
  dialogVisible.value = true;
};

const openScheduleDialog = (item) => {
  isEditing.value = true;
  selectedRequest.value = { ...item };
  
  // Force Pastor ID to String for perfect v-select label matching
  if (selectedRequest.value.pastor_id !== null && selectedRequest.value.pastor_id !== undefined) {
    selectedRequest.value.pastor_id = String(selectedRequest.value.pastor_id).replace(/^0+/, '');
    if (selectedRequest.value.pastor_id === '') selectedRequest.value.pastor_id = null;
  }
  
  // Default location to church address if blank for Salvation Talk
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
    
    // Determine which service type to use based on the active dialog
    const service = bulkEditVisible.value ? (bulkForm.value.request_type || 'Salvation') :
                   companionEditVisible.value ? (companionForm.value.request_type || 'Salvation') :
                   (selectedRequest.value?.request_type || 'Salvation');

    const response = await axios.get('/services/discipleship-requests/available-slots', {
      params: { days, service }
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
  const finalDatetime = `${date} ${time}`;
  if (bulkEditVisible.value) {
    bulkForm.value.scheduled_date = finalDatetime;
    // Auto-update status to Scheduled if it's currently Pending or blank
    if (!bulkForm.value.status || bulkForm.value.status === 'Pending') {
      bulkForm.value.status = 'Scheduled';
    }
    selectedSlotDisplay.value = formatSlotDisplay(date, time);
    return;
  }

  if (companionEditVisible.value) {
    companionForm.value.scheduled_date = finalDatetime;
    if (!companionForm.value.status || companionForm.value.status === 'Pending') {
      companionForm.value.status = 'Scheduled';
    }
    selectedSlotDisplay.value = formatSlotDisplay(date, time);
    return;
  }
  
  selectedRequest.value.scheduled_date = finalDatetime;
  // Auto-update status for individual request
  if (selectedRequest.value.status === 'Pending' || !selectedRequest.value.status) {
    selectedRequest.value.status = 'Scheduled';
  }
  
  selectedSlotDisplay.value = formatSlotDisplay(date, time);
  ElMessage.success('Slot selected! Schedule and status updated.');
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
  if (bulkEditVisible.value) {
     return bulkForm.value.scheduled_date === datetime;
  }
  if (companionEditVisible.value) {
     return companionForm.value.scheduled_date === datetime;
  }
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
    // Rule: If status is Pending, clear the pastor
    if (selectedRequest.value.status === 'Pending') {
      selectedRequest.value.pastor_id = null;
    }

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





const openBibleStudyDialog = (item) => {
  bibleStudyItem.value = item;
  bibleStudyDialogVisible.value = true;
  isPromotionScheduling.value = false;
  
  promotionForm.value = {
    pastor_id: item.pastor_id ? String(item.pastor_id).replace(/^0+/, '') : null,
    location: item.address || item.location || '',
    scheduled_date: '',
    notes: item.notes || ''
  };
  if (promotionForm.value.pastor_id === '') promotionForm.value.pastor_id = null;

  fetchSlotsForBibleStudy();
};

const isBibleStudyInvited = (item) => {
  if (!item?.notes) return false;
  try {
    const notes = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
    return typeof notes === 'object' && notes !== null && !!notes.bible_study_invited;
  } catch {
    // Fallback if not valid JSON: Check if the string contains the invited flag substring
    if (typeof item.notes === 'string') {
      return item.notes.includes('"bible_study_invited":true') || item.notes.includes("'bible_study_invited':true");
    }
    return false;
  }
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

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
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

const formatSelectedSchedule = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const isBibleStudyInvitedIndiv = (person) => {
  return !!person?.bible_study_invited;
};

const handleBibleStudyAction = async (isDecided) => {
  if (!isBulkPromotion.value && !bibleStudyItem.value) return;

  if (isDecided && !isPromotionScheduling.value) {
    isPromotionScheduling.value = true;
    return;
  }

  loadingBibleStudy.value = true;
  try {
    const isMainTable = selectedRequests.value.length > 0 && selectedInGroup.value.length === 0;
    const targets = isBulkPromotion.value 
      ? (isMainTable ? selectedRequests.value.map(id => requests.value.find(r => r.request_id === id)) : selectedInGroup.value.map(idx => companionsInGroup.value[idx]))
      : [bibleStudyItem.value];

    if (targets.length === 0) return;

    // 1. Prepare Group Logic
    const isConsoleBulk = isBulkPromotion.value && !isMainTable;
    const lead = isConsoleBulk ? selectedGroup.value : targets[0];
    const leadId = lead.request_id;
    
    let companions = [];
    
    if (isConsoleBulk) {
      // ONLY include companions that were actually selected for promotion
      companions = getCompanions(lead).filter(c => {
        return selectedInGroup.value.some(idx => {
          const p = companionsInGroup.value[idx];
          return p.type === 'companion' && p.email === c.email;
        });
      }).map(c => {
        return { 
          ...c, 
          status: isDecided ? 'Scheduled' : 'Promoted',
          pastor_id: promotionForm.value.pastor_id,
          location: promotionForm.value.location,
          scheduled_date: promotionForm.value.scheduled_date
        };
      });
    }

    // Rule: Two or more people = GROUP. One person = SOLO.
    // The group_size includes the lead + the proceeding companions.
    // We check if the lead of this record is actually among the selected targets.
    const leadSelected = targets.some(t => t.email === lead.email);
    const totalProceeding = companions.length + (leadSelected ? 1 : 0);

    const groupNotes = {
      is_group: totalProceeding >= 2,
      group_size: totalProceeding,
      companions: companions
    };

    let successCount = 0;
    
    if (!isDecided) {
      for (const target of targets) {
        let tId = target.request_id || (isMainTable ? target.request_id : selectedGroup.value.request_id);
        const tPayload = { 
          firstname: target.firstname,
          lastname: target.lastname,
          email: target.email,
          isDecided: false 
        };
        const ok = await store.promoteToBibleStudy(tId, tPayload);
        if (ok) successCount++;
      }
    } else {
      if (isConsoleBulk) {
        const leadPayload = { 
          ...promotionForm.value, 
          notes: JSON.stringify(groupNotes),
          isDecided: true 
        };
        const ok = await store.promoteToBibleStudy(leadId, leadPayload);
        if (ok) successCount = targets.length;
      } else {
        for (const target of targets) {
          const tPayload = { 
            ...promotionForm.value, 
            isDecided: true 
          };
          const ok = await store.promoteToBibleStudy(target.request_id, tPayload);
          if (ok) successCount++;
        }
      }
    }
      
    if (successCount > 0) {
      if (isMainTable) {
        clearSelection();
      } else {
        // Update local status/flags
        targets.forEach(t => {
          const idx = companionsInGroup.value.findIndex(p => p.email === t.email);
          if (idx !== -1) {
            if (isDecided) {
              companionsInGroup.value[idx].status = 'Promoted';
            } else {
              companionsInGroup.value[idx].bible_study_invited = true;
            }
          }
        });
        await saveCompanionsUpdate();
        selectedInGroup.value = [];
        groupSelectAll.value = false;
      }
      ElMessage.success(`${isDecided ? 'Group promoted' : 'Invitations sent'} successfully!`);
    } else if (!isBulkPromotion.value) {
      // Single Promotion
      const target = bibleStudyItem.value;
      
      // If promoting a single person (lead or companion) as Scheduled, 
      // ensure we send their identity and strip old group notes to make them "Solo"
      let finalNotes = promotionForm.value.notes;
      try {
        let notesObj = typeof finalNotes === 'string' ? JSON.parse(finalNotes) : finalNotes;
        if (notesObj && typeof notesObj === 'object') {
          // Rule: If promoting alone, it's Solo
          notesObj.is_group = false;
          notesObj.companions = [];
          notesObj.group_size = 1;
          finalNotes = JSON.stringify(notesObj);
        }
      } catch (e) {
        // Not JSON, leave as is
      }

      const payload = {
        ...promotionForm.value,
        firstname: target.firstname,
        lastname: target.lastname,
        email: target.email,
        notes: finalNotes,
        isDecided: isDecided
      };

      const success = await store.promoteToBibleStudy(target.request_id, payload);
      
      if (success && !isMainTable && companionsDialogVisible.value) {
        const compIdx = companionsInGroup.value.findIndex(p => p.email === target.email);
        if (compIdx !== -1) {
          if (isDecided) {
            companionsInGroup.value[compIdx].status = 'Promoted';
          } else {
            companionsInGroup.value[compIdx].bible_study_invited = true;
          }
          await saveCompanionsUpdate();
        }
      }
    }
    
    bibleStudyDialogVisible.value = false;
    isPromotionScheduling.value = false;
    isBulkPromotion.value = false;
    await store.fetchRequests();
  } catch (error) {
    if (error && error !== 'cancel') {
        console.error('Promotion error:', error);
        ElMessage.error(error.message || 'An error occurred during promotion');
    }
  } finally {
    loadingBibleStudy.value = false;
  }
};

const bulkRejectMain = async () => {
    const pendingIds = selectedRequests.value.filter(id => {
        const req = requests.value.find(r => r.request_id === id);
        return req && req.status === 'Pending';
    });

    if (pendingIds.length === 0) {
        ElMessage.warning('Only pending requests can be rejected.');
        return;
    }

    try {
        const { value: reason } = await ElMessageBox.prompt(
            `Please provide a reason for rejecting ${pendingIds.length} selected request(s). This will be sent via email with alternative suggestions.`,
            'Bulk Reject Requests',
            {
                confirmButtonText: 'Send Rejection',
                cancelButtonText: 'Cancel',
                inputPattern: /.+/,
                inputPlaceholder: 'Reason for rejection...',
                inputErrorMessage: 'Rejection reason is required',
                type: 'warning'
            }
        );

        if (reason) {
            let successCount = 0;
            for (const id of pendingIds) {
                const ok = await store.rejectRequest(id, reason);
                if (ok) successCount++;
            }
            
            if (successCount > 0) {
                ElMessage.success(`Successfully rejected ${successCount} request(s).`);
                clearSelection();
            }
        }
    } catch (e) {
        // User cancelled
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

const getPastorName = (id) => {
  if (!id) return 'Unassigned';
  const cleanId = String(id).replace(/^0+/, '');
  const p = pastors.value.find(p => String(p.id).replace(/^0+/, '') === cleanId);
  return p ? p.name : `Pastor (ID: ${cleanId})`;
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
