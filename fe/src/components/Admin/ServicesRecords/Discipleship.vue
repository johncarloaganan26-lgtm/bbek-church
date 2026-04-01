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
          height="48"
          class="px-6 rounded-lg font-weight-bold"
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
              label="Status"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="handleFilter"
            ></v-select>
          </v-col>
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
          <v-col cols="12" md="2" class="d-flex align-center gap-2">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-download"
                  variant="outlined"
                  v-bind="props"
                  :loading="loading"
                  :disabled="loading"
                ></v-btn>
              </template>
              <v-list>
                <v-list-item @click="handleExportExcel('xlsx')">
                  <v-list-item-title>Export to Excel (.xlsx)</v-list-item-title>
                </v-list-item>
                <v-list-item @click="handleExportExcel('csv')">
                  <v-list-item-title>Export to CSV (.csv)</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <div class="d-flex align-center gap-2">
              <v-tooltip text="Print" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-printer"
                    variant="outlined"
                    v-bind="props"
                    :loading="loading"
                    :disabled="loading"
                    @click="handlePrint"
                  ></v-btn>
                </template>
              </v-tooltip>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2">
      <!-- Selection Actions Bar -->
      <div v-if="selectedRequests.length > 0" class="bg-success-lighten-5 pa-2 d-flex align-center">
        <v-chip color="success" size="small" class="mr-2">{{ selectedRequests.length }} selected</v-chip>
        <v-btn size="small" color="primary" variant="outlined" @click="openBulkUpdateDialog" :loading="loading" class="mr-2">
          <v-icon left>mdi-update</v-icon>
          Bulk Edit
        </v-btn>
        <v-btn size="small" color="teal-darken-1" variant="outlined" @click="openBulkPromoteDialog" :loading="loading" class="mr-2">
          <v-icon left>mdi-book-plus</v-icon>
          Bulk Promote
        </v-btn>
        <v-btn size="small" color="error" variant="outlined" @click="bulkArchive" :loading="loading">
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
            <th class="text-left font-weight-bold">Type</th>
            <th class="text-left font-weight-bold">Email</th>
            <th class="text-left font-weight-bold">Request Type</th>
            <th class="text-left font-weight-bold">Status</th>
            <th class="text-left font-weight-bold">Assigned Pastors</th>
            <th class="text-left font-weight-bold">Scheduled Date</th>
            <th class="text-left font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
             <td colspan="8" class="text-center pa-4">Loading...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
             <td colspan="8" class="text-center pa-4">No requests found.</td>
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
            <td>
              <v-chip v-if="isGroup(item)" size="small" :color="getGroupColor(item)" variant="flat" class="text-white text-caption font-weight-bold">
                <v-icon left size="12" class="mr-1">mdi-account-group</v-icon> GROUP
              </v-chip>
              <v-chip v-else size="small" color="grey" variant="outlined" class="text-caption font-weight-bold">
                <v-icon left size="12" class="mr-1">mdi-account</v-icon> SOLO
              </v-chip>
            </td>
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
            <td>
              <div v-if="item.pastor_name_joined" class="text-body-2 font-weight-medium text-teal-darken-3">
                <v-icon size="small" class="mr-1">mdi-account-tie</v-icon>
                {{ item.pastor_name_joined }}
              </div>
              <div v-else class="text-caption text-grey">Unassigned</div>
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
          <span>{{ isBulkEditing ? 'Bulk Update ' + selectedRequests.length + ' Requests' : (isEditing ? 'Update' : 'Add') + ' Request' }}</span>
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
            <div v-else-if="availableSlots.length === 0" class="text-center pa-8 bg-grey-lighten-4 rounded-lg border-teal border-dashed">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-calendar-remove</v-icon>
              <div class="text-subtitle-2 font-weight-bold grey--text">No Slots Available</div>
              <div class="text-caption grey--text">Please add new time slots using the manager button above.</div>
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
                      variant="tonal"
                      size="small"
                      :color="isSlotSelected(slot.datetime) ? 'primary' : (slot.bookedCount >= (slot.maxCapacity || 1) ? 'error' : 'teal')"
                      :class="{ 'selected-slot': isSlotSelected(slot.datetime) }"
                      class="mb-2 mr-2 rounded-lg font-weight-bold"
                      @click="selectAvailableSlot(dateGroup.date, slot.time)"
                      :disabled="slot.bookedCount >= (slot.maxCapacity || 1) && !isSlotSelected(slot.datetime)"
                    >
                      <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                      {{ new Date(`${dateGroup.date} ${slot.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }}
                      <span class="ml-2 opacity-70" style="font-size: 10px">
                        ({{ slot.bookedCount }}/{{ slot.maxCapacity || 1 }})
                      </span>
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
            <div v-if="!isEditing && !isBulkEditing">
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
            <div class="d-flex align-center gap-2 mb-2">
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
              <v-btn
                icon="mdi-refresh"
                size="small"
                variant="tonal"
                color="primary"
                @click="fetchAvailableSlots(14)"
                :loading="slotsLoading"
              ></v-btn>
            </div>
            
            <div class="text-caption grey--text mt-1">{{ scheduleHelperText }}</div>



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
          <span v-if="isBulkPromoting" class="text-caption ml-2">({{ selectedRequests.length }} Candidates)</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <div v-if="!isPromotionScheduling">
            <p class="text-body-1 mb-2 text-center">{{ isBulkPromoting ? 'Bulk promote these candidates to Bible Study:' : 'Phase 1 (Salvation Talk) completed for:' }}</p>
            <p class="text-center text-h6 font-weight-bold mb-4">
              {{ isBulkPromoting ? selectedRequests.length + ' Selected Candidates' : (bibleStudyItem?.firstname + ' ' + bibleStudyItem?.lastname) }}
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
                            <span v-if="slot.bookedCount > 0" class="ml-1 text-caption font-weight-light" style="font-size: 0.7rem !important;">
                              ({{ slot.bookedCount }})
                            </span>
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
                  {{ isBulkPromoting ? 'Bulk Schedule (' + selectedRequests.length + ' Candidates)' : ('Schedule for ' + bibleStudyItem?.firstname + ' ' + bibleStudyItem?.lastname) }}
                </p>
                
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
                    <div v-if="!isBulkPromoting" class="text-caption text-grey-darken-1 px-1 mb-4">
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
    <!-- Availability Manager Dialog -->
    <v-dialog v-model="availabilityManagerVisible" max-width="1100px" persistent>
      <v-card class="rounded-xl overflow-hidden elevation-24">
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
            density="comfortable"
            color="white"
            variant="tonal"
            class="mr-4 bg-teal-darken-3 rounded-lg"
            @update:model-value="fetchSalvationSlots"
          >
            <v-btn value="salvation" class="px-4 font-weight-bold">SALVATION</v-btn>
            <v-btn value="bible_study" class="px-4 font-weight-bold">BIBLE STUDY</v-btn>
          </v-btn-toggle>

          <v-btn icon="mdi-close" variant="text" color="white" @click="availabilityManagerVisible = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-6 bg-grey-lighten-4">
          <v-row>
            <!-- Left: Creator Form (TEAL) -->
            <v-col cols="12" md="5" class="availability-creator">
              <v-card class="pa-6 rounded-xl elevation-2 bg-white h-100 border-teal flex-column d-flex">
                <div class="d-flex align-center mb-6">
                  <v-avatar color="teal-lighten-4" class="mr-3" size="48">
                    <v-icon color="teal-darken-2">{{ isEditingSlot ? 'mdi-pencil' : 'mdi-plus-box' }}</v-icon>
                  </v-avatar>
                  <div class="d-flex flex-column">
                    <span class="text-h6 font-weight-bold">{{ isEditingSlot ? 'Update Time Slot' : 'Create New Slots' }}</span>
                    <span class="text-caption grey--text">
                      {{ isEditingSlot ? 'Modify the selected slot details' : `Bulk create ${managerServiceType === 'salvation' ? 'Salvation' : 'Bible Study'} slots` }}
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
                    :disabled-date="(time) => time.getTime() < Date.now() - 8.64e7"
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
                    @click="addSalvationSlot"
                    :loading="savingSlot"
                    :prepend-icon="isEditingSlot ? 'mdi-content-save' : 'mdi-plus-circle'"
                  >
                    {{ isEditingSlot ? 'Confirm Save' : 'Generate Slots' }}
                  </v-btn>
                </div>
              </v-card>
            </v-col>

            <!-- Right: List (Grouped) -->
            <v-col cols="12" md="7">
              <v-card class="rounded-xl border elevation-0 overflow-hidden bg-white h-100 flex-column d-flex">
                <!-- Header with Sorting & Multi-select Toggle -->
                <div class="pa-4 d-flex align-center justify-space-between border-b bg-grey-lighten-5">
                  <div class="d-flex align-center">
                    <v-checkbox-btn
                      v-if="manualSalvationSlots.length > 0"
                      v-model="isAllSlotsSelected"
                      color="teal"
                      @click="toggleSelectAllSlots"
                      class="mr-2"
                    ></v-checkbox-btn>
                    <v-icon color="teal-darken-2" class="mr-2">{{ selectedManualSlotIds.length > 0 ? 'mdi-checkbox-multiple-marked' : 'mdi-sort-clock-ascending' }}</v-icon>
                    <span class="text-subtitle-1 font-weight-bold grey--text text--darken-3">Availability List</span>
                  </div>
                  
                  <div class="d-flex align-center gap-2">
                    <v-btn
                      v-if="selectedManualSlotIds.length > 0"
                      color="red-darken-2"
                      prepend-icon="mdi-trash-can"
                      size="small"
                      variant="flat"
                      class="rounded-lg mr-2"
                      @click="bulkDeleteSalvationSlots"
                    >
                      Delete ({{ selectedManualSlotIds.length }})
                    </v-btn>

                    <v-btn-toggle
                      v-model="slotsSortOrder"
                      mandatory
                      density="compact"
                      color="teal"
                      variant="outlined"
                      class="rounded-lg bg-white"
                      v-show="selectedManualSlotIds.length === 0"
                    >
                      <v-btn value="upcoming" size="x-small" class="px-2 font-weight-bold">UPCOMING</v-btn>
                      <v-btn value="newest" size="x-small" class="px-2 font-weight-bold">NEWEST</v-btn>
                    </v-btn-toggle>
                    
                    <v-btn icon="mdi-refresh" variant="text" size="small" color="teal" @click="fetchSalvationSlots" :loading="slotsListLoading"></v-btn>
                  </div>
                </div>
                
                <!-- Content -->
                <div class="slots-list-container flex-grow-1" style="max-height: 520px; overflow-y: auto; background-color: #fcfcfc;">
                  <div v-if="slotsListLoading" class="text-center pa-10">
                    <v-progress-circular indeterminate color="teal" size="40" width="3"></v-progress-circular>
                    <div class="text-caption mt-2 grey--text">Loading active schedules...</div>
                  </div>
                  <div v-else-if="manualSalvationSlots.length === 0" class="text-center pa-12 text-grey-darken-1">
                    <v-icon size="64" color="teal-lighten-4" class="mb-3">mdi-calendar-remove</v-icon>
                    <div class="text-h6 font-weight-bold opacity-80">Empty Schedule</div>
                    <div class="text-caption">Select dates and times on the left to start.</div>
                  </div>
                  
                  <v-expansion-panels v-else v-model="activeManualGroups" variant="popout" accordion class="pa-3">
                    <v-expansion-panel v-for="group in groupedManualSlots" :key="group.date" class="mb-3 rounded-lg border shadow-sm overflow-hidden">
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
                            {{ group.slots.length }} SESSIONS
                          </v-chip>
                        </div>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text class="pa-0">
                        <div class="pa-2">
                          <div v-for="slot in group.slots" :key="slot.slot_id" 
                               class="d-flex align-center justify-space-between pa-3 rounded-lg hover-bg mb-2 border border-dotted cursor-pointer"
                               :class="{'bg-yellow-lighten-4 border-teal border-solid shadow-sm': editingSlotId === slot.slot_id, 'bg-teal-lighten-5': selectedManualSlotIds.includes(slot.slot_id)}"
                               @click="toggleSelectSlot(slot.slot_id)">
                            <div class="d-flex align-center">
                              <v-checkbox-btn
                                :model-value="selectedManualSlotIds.includes(slot.slot_id)"
                                color="teal"
                                class="mr-2"
                                @click.stop="toggleSelectSlot(slot.slot_id)"
                              ></v-checkbox-btn>
                              <v-chip size="default" variant="flat" color="teal-lighten-4" class="text-teal-darken-4 font-weight-black px-4">
                                {{ formatTimeManual(slot.available_time) }}
                              </v-chip>
                              <div class="ml-4 d-flex align-center grey--text text-subtitle-2">
                                <v-icon size="16" class="mr-1">mdi-account-multiple</v-icon>
                                <span class="font-weight-bold">{{ slot.max_slots }} SEATS</span>
                              </div>
                            </div>
                            <!-- VISIBLE SOLID BUTTONS WITH WHITE ICONS -->
                            <div class="d-flex gap-2" v-show="selectedManualSlotIds.length === 0">
                              <v-btn 
                                icon 
                                variant="flat" 
                                color="teal-darken-1" 
                                size="small"
                                class="rounded-lg elevation-2 action-btn shadow-teal"
                                @click.stop="editSlot(slot)"
                              >
                                <v-icon color="white">mdi-pencil</v-icon>
                              </v-btn>

                              <v-btn 
                                icon 
                                variant="flat" 
                                color="red-darken-2" 
                                size="small"
                                class="rounded-lg elevation-2 action-btn shadow-red"
                                @click.stop="deleteOneSlotId(slot.slot_id)"
                              >
                                <v-icon color="white">mdi-trash-can</v-icon>
                              </v-btn>
                            </div>
                          </div>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
                
                <!-- Footer Info (REMOVED CROSS LINE) -->
                <div class="pa-3 bg-grey-lighten-4 d-flex justify-space-between border-t-0">
                    <div class="text-caption grey--text d-flex align-center">
                      <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
                      Managing manual overrides for {{ managerServiceType === 'salvation' ? 'Salvation Talk' : 'Bible Study' }} sessions.
                    </div>
                   <v-btn size="x-small" variant="text" color="grey-darken-1" @click="cancelSlotEdit" v-if="isEditingSlot">Cancel Selection</v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-white border-t">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-2" variant="tonal" class="rounded-lg px-8 py-2" @click="availabilityManagerVisible = false">Close Manager</v-btn>
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
import moment from 'moment';
import axios from '@/api/axios';

const store = useAdminDiscipleshipStore();
const settingsStore = useSystemSettingsStore();
const router = useRouter();
const { requests, loading, totalCount, currentPage, pageSize, pastors } = storeToRefs(store);
const { settings, loading: settingsLoading } = storeToRefs(settingsStore);
const user = JSON.parse(localStorage.getItem('user') || '{}');

onMounted(() => {
    store.fetchRequests();
    store.fetchPastors();
    settingsStore.fetchSettings();
});

const toggleRestriction = async (val) => {
    await settingsStore.toggleAllowComplete(val);
};

const search = ref('');
const statusFilter = ref('All Status');
const dateRange = ref([]);
const editDialogVisible = ref(false);
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
const isBulkPromoting = ref(false);
const activeDayPanel = ref(0);

// Salvation Availability Manager State
const availabilityManagerVisible = ref(false);
const manualSalvationSlots = ref([]);
const slotsListLoading = ref(false);
const savingSlot = ref(false);
const isEditingSlot = ref(false);
const editingSlotId = ref(null);
const managerServiceType = ref('salvation');

const newSlotForm = ref({
  dates: [moment().add(1, 'day').format('YYYY-MM-DD')],
  times: [],
  max_slots: 1
});

// Common 12-hr display times for quick selection
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

const toggleBulkTime = (timeValue) => {
  const idx = newSlotForm.value.times.indexOf(timeValue);
  if (idx > -1) newSlotForm.value.times.splice(idx, 1);
  else newSlotForm.value.times.push(timeValue);
};

const openAvailabilityManager = () => {
  availabilityManagerVisible.value = true;
  fetchSalvationSlots();
};

const fetchSalvationSlots = async () => {
  slotsListLoading.value = true;
  try {
    const response = await axios.get('/services/salvation-availability/salvation-slots', {
      params: { service_type: managerServiceType.value }
    });
    manualSalvationSlots.value = response.data.data;
  } catch (error) {
    console.error('Error fetching salvation slots:', error);
    ElMessage.error('Failed to load slots');
  } finally {
    slotsListLoading.value = false;
  }
};

// Group manual slots by date
const slotsSortOrder = ref('upcoming'); // 'upcoming' or 'newest'

const groupedManualSlots = computed(() => {
  const groups = {};
  manualSalvationSlots.value.forEach(slot => {
    const d = slot.available_date.substring(0, 10);
    if (!groups[d]) groups[d] = [];
    groups[d].push(slot);
  });
  
  // Sort dates: Upcoming first (ASC) or Newest created/latest (DESC)
  return Object.keys(groups)
    .sort((a, b) => slotsSortOrder.value === 'upcoming' ? a.localeCompare(b) : b.localeCompare(a))
    .map(date => ({
      date,
      slots: groups[date].sort((a,b) => a.available_time.localeCompare(b.available_time))
    }));
});

const activeManualGroups = ref([]);
const selectedManualSlotIds = ref([]);
const isAllSlotsSelected = computed({
  get: () => manualSalvationSlots.value.length > 0 && selectedManualSlotIds.value.length === manualSalvationSlots.value.length,
  set: (val) => toggleSelectAllSlots(val)
});

const toggleSelectSlot = (id) => {
  const index = selectedManualSlotIds.value.indexOf(id);
  if (index > -1) selectedManualSlotIds.value.splice(index, 1);
  else selectedManualSlotIds.value.push(id);
};

const toggleSelectAllSlots = () => {
  if (selectedManualSlotIds.value.length === manualSalvationSlots.value.length) {
    selectedManualSlotIds.value = [];
  } else {
    selectedManualSlotIds.value = manualSalvationSlots.value.map(s => s.slot_id);
  }
};

const isGroupFullySelected = (group) => {
  return group.slots.every(s => selectedManualSlotIds.value.includes(s.slot_id));
};

const toggleSelectGroup = (group) => {
  const groupIds = group.slots.map(s => s.slot_id);
  const allSelected = isGroupFullySelected(group);
  
  if (allSelected) {
    selectedManualSlotIds.value = selectedManualSlotIds.value.filter(id => !groupIds.includes(id));
  } else {
    groupIds.forEach(id => {
      if (!selectedManualSlotIds.value.includes(id)) {
        selectedManualSlotIds.value.push(id);
      }
    });
  }
};

const bulkDeleteSalvationSlots = async () => {
  if (selectedManualSlotIds.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete ${selectedManualSlotIds.value.length} selected slots?`,
      'Bulk Delete',
      {
        confirmButtonText: 'Yes, Delete All',
        cancelButtonText: 'Cancel',
        type: 'error'
      }
    );
    
    savingSlot.value = true;
    const response = await axios.post('/services/salvation-availability/bulk-delete', {
      slotIds: selectedManualSlotIds.value,
      service_type: managerServiceType.value
    });
    
    if (response.data.success) {
      ElMessage.success(response.data.message);
      selectedManualSlotIds.value = [];
      await fetchSalvationSlots();
    }
  } catch (err) {
    if (err !== 'cancel') console.error(err);
  } finally {
    savingSlot.value = false;
  }
};

const deleteOneSlotId = async (id) => {
  try {
    await ElMessageBox.confirm('Delete this time slot permanently?', 'Confirm Delete', {
      type: 'warning',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    const response = await axios.delete(`/services/salvation-availability/salvation-slots/${id}`, {
      params: { service_type: managerServiceType.value }
    });
    if (response.data.success) {
      ElMessage.success('Slot deleted');
      await fetchSalvationSlots();
    }
  } catch (err) {}
};

const addSalvationSlot = async () => {
  if (newSlotForm.value.dates.length === 0 || newSlotForm.value.times.length === 0) {
    ElMessage.warning('Please select at least one date and one time');
    return;
  }
  
  savingSlot.value = true;
  try {
    // If editing a single slot, we don't do bulk (though the UI should prevent it)
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
      // Bulk Create
      await axios.post('/services/salvation-availability/salvation-slots', {
        isBulk: true,
        dates: newSlotForm.value.dates,
        times: newSlotForm.value.times,
        max_slots: newSlotForm.value.max_slots || 1,
        service_type: managerServiceType.value
      });
      ElMessage.success('Slots created successfully');
      // Reset times but keep dates for convenience
      newSlotForm.value.times = [];
    }
    
    fetchSalvationSlots();
    refreshAdminSlots();
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
  // Scroll to top of creator form
  const el = document.querySelector('.availability-creator');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

const cancelSlotEdit = () => {
  isEditingSlot.value = false;
  editingSlotId.value = null;
  newSlotForm.value = {
    dates: [moment().add(1, 'day').format('YYYY-MM-DD')],
    times: [],
    max_slots: 1
  };
};

const deleteSalvationSlot = async (id) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this time slot? This cannot be undone.', 
      'Delete Confirmation', 
      {
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'No, Keep',
        type: 'warning',
        confirmButtonClass: 'bg-error'
      }
    );
    
    await axios.delete(`/services/salvation-availability/salvation-slots/${id}`, {
      params: { service_type: managerServiceType.value }
    });
    ElMessage.success('Slot deleted');
    fetchSalvationSlots();
    refreshAdminSlots();
  } catch (e) {}
};

const formatDateManual = (d) => moment(d).format('MMM DD, YYYY');
const formatTimeManual = (t) => moment(t, 'HH:mm:ss').format('h:mm A');

const refreshAdminSlots = () => {
  if (typeof fetchAvailableSlots === 'function') {
    fetchAvailableSlots();
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

const isGroup = (item) => {
  if (!item.notes) return false;
  try {
     const notesObj = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
     if (typeof notesObj !== 'object' || notesObj === null) return false;
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

const isBulkEditing = ref(false);

const openBulkUpdateDialog = () => {
  if (!selectedRequests.value.length) {
    ElMessage.warning('No requests selected');
    return;
  }
  isBulkEditing.value = true;
  isEditing.value = true;
  
  const firstId = selectedRequests.value[0];
  const firstItem = requests.value.find(r => r.request_id === firstId) || {};

  selectedRequest.value = {
    request_id: null,
    status: firstItem.status || 'Scheduled',
    request_type: firstItem.request_type || 'Salvation',
    scheduled_date: firstItem.scheduled_date || '',
    location: firstItem.location || firstItem.address || '',
    // Coerce pastor_id to number if numeric, to match v-select item-value type
    pastor_id: (() => { const p = firstItem.pastor_id; return p && !isNaN(p) ? Number(p) : (p || null); })(),
    notes: firstItem.notes || ''
  };
  
  // Ensure notes is a string and not [object Object]
  if (typeof selectedRequest.value.notes === 'object' && selectedRequest.value.notes !== null) {
    selectedRequest.value.notes = JSON.stringify(selectedRequest.value.notes);
  } else if (selectedRequest.value.notes === null || selectedRequest.value.notes === undefined) {
    selectedRequest.value.notes = '';
  }

  dialogVisible.value = true;
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

const handleDateRangeChange = (val) => {
    if (val && val.length === 2) {
        store.setFilters({ startDate: val[0], endDate: val[1] });
    } else {
        store.setFilters({ startDate: null, endDate: null });
    }
};

const handlePageChange = (page) => {
    store.setPage(page);
};

const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  const tableHeaders = ['Name', 'Type', 'Email', 'Request Type', 'Status', 'Schedule', 'Created'];
  const logoUrl = window.location.origin + '/logo.png';
  
  // Get current user info for printed by
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const printedBy = userInfo?.member 
    ? `${userInfo.member.firstname || ''} ${userInfo.member.lastname || ''}`.trim()
    : 'Admin';
    
  const tableRows = requests.value.map(item => `
    <tr>
      <td><strong>${item.firstname} ${item.lastname}</strong></td>
      <td>${isGroup(item) ? 'GROUP' : 'SOLO'}</td>
      <td>${item.email}</td>
      <td>${item.request_type}</td>
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
        <title>Salvation Requests Report - Print</title>
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
            font-size: 11px;
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
        <div class="report-title">Salvation Requests Activity Report</div>
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
  }, 500);
};

const handleExportExcel = async (format = 'xlsx') => {
    await store.exportToExcel({ ...store.filters, format });
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
  isBulkEditing.value = false;
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
  isBulkEditing.value = false;
  selectedRequest.value = { ...item };
  // Coerce pastor_id to number if numeric, to match v-select item-value type
  const pid = item.pastor_id;
  selectedRequest.value.pastor_id = pid && !isNaN(pid) ? Number(pid) : (pid || null);
  
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
  // Add seconds if not present so el-date-picker handles it correctly
  const fullTime = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
  selectedRequest.value.scheduled_date = `${date} ${fullTime}`;
  selectedSlotDisplay.value = formatSlotDisplay(date, fullTime);
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
    fetchAvailableSlots(60);
  }
});

const saveUpdate = async () => {
  if (isBulkEditing.value) {
    let successCount = 0;
    
    for (const id of selectedRequests.value) {
      const updatePayload = {
        status: selectedRequest.value.status,
        request_type: selectedRequest.value.request_type,
        scheduled_date: selectedRequest.value.scheduled_date,
        pastor_id: selectedRequest.value.pastor_id,
        location: selectedRequest.value.location
      };
      
      const success = await store.updateRequest(id, updatePayload);
      if (success) successCount++;
    }
    
    if (successCount > 0) {
      ElMessage.success(`Successfully bulk updated ${successCount} request(s)`);
      dialogVisible.value = false;
      clearSelection();
    }
    return;
  }

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
      pastor_id: selectedRequest.value.pastor_id,
      location: selectedRequest.value.location
    });
    
    if (success) {
        dialogVisible.value = false;
    }
  }
};




// ── Bible Study promotion ────────────────────────────────
const openBulkPromoteDialog = () => {
  if (selectedRequests.value.length === 0) {
    ElMessage.warning('No requests selected');
    return;
  }
  
  isBulkPromoting.value = true;
  bibleStudyItem.value = null;
  bibleStudyDialogVisible.value = true;
  isPromotionScheduling.value = false;
  
  const firstId = selectedRequests.value[0];
  const firstItem = requests.value.find(r => r.request_id === firstId) || {};
  
  promotionForm.value = {
    pastor_id: null,
    location: firstItem.address || firstItem.location || '',
    scheduled_date: '',
    notes: ''
  };

  fetchSlotsForBibleStudy();
};

const isPromotionScheduling = ref(false);
const promotionForm = ref({
  pastor_id: null,
  location: '',
  scheduled_date: '',
  notes: ''
});

const openBibleStudyDialog = (item) => {
  isBulkPromoting.value = false;
  bibleStudyItem.value = item;
  bibleStudyDialogVisible.value = true;
  isPromotionScheduling.value = false;
  
  promotionForm.value = {
    pastor_id: null,
    location: item.address || item.location || '',
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
  // Check if we have items to promote
  if (!isBulkPromoting.value && !bibleStudyItem.value) return;

  // If decided and we haven't shown the scheduling form yet, show it
  if (isDecided && !isPromotionScheduling.value) {
    isPromotionScheduling.value = true;
    return;
  }

  loadingBibleStudy.value = true;
  try {
    let promotePayload = {};
    if (isDecided) {
        // Extract group_id if exists
        let groupId = null;
        if (bibleStudyItem.value && bibleStudyItem.value.notes) {
            try {
                const existingNotes = typeof bibleStudyItem.value.notes === 'string' ? JSON.parse(bibleStudyItem.value.notes) : bibleStudyItem.value.notes;
                if (existingNotes && existingNotes.group_id) groupId = existingNotes.group_id;
            } catch (e) {}
        }

        // Create a JSON object for notes if we have a group_id
        let finalNotes = promotionForm.value.notes;
        if (groupId) {
            finalNotes = JSON.stringify({
                notes: promotionForm.value.notes,
                group_id: groupId
            });
        }

        promotePayload = {
            ...promotionForm.value,
            notes: finalNotes,
            isDecided: true
        };
    } else {
        promotePayload = { isDecided: false };
    }
    
    if (isBulkPromoting.value) {
      let successCount = 0;
      for (const id of selectedRequests.value) {
        const item = requests.value.find(r => r.request_id === id);
        let currentGroupId = null;
        if (item && item.notes) {
            try {
                const existingNotes = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
                if (existingNotes && existingNotes.group_id) currentGroupId = existingNotes.group_id;
            } catch (e) {}
        }

        let bulkFinalNotes = promotionForm.value.notes;
        if (currentGroupId) {
            bulkFinalNotes = JSON.stringify({
                notes: promotionForm.value.notes,
                group_id: currentGroupId
            });
        }

        const success = await store.promoteToBibleStudy(id, { ...promotePayload, notes: bulkFinalNotes });
        if (success) successCount++;
      }
      
      if (successCount > 0) {
        ElMessage.success(`Successfully promoted ${successCount} candidates to Bible Study`);
        bibleStudyDialogVisible.value = false;
        isPromotionScheduling.value = false;
        clearSelection();
      }
    } else {
      const success = await store.promoteToBibleStudy(bibleStudyItem.value.request_id, promotePayload);
      if (success) {
        bibleStudyDialogVisible.value = false;
        isPromotionScheduling.value = false;
      }
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
/* Global style to fix z-index for element-plus components in vuetify dialog */
.discipleship-date-picker,
.salvation-datepicker-popper,
.el-message-box__wrapper,
.el-message,
.el-overlay {
  z-index: 99999 !important;
}

.hover-bg:hover {
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}

.border-b-dotted {
  border-bottom: 1px dotted #e0e0e0;
}
</style>
