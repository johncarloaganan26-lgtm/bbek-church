<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Burial Service' : (userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff' ? 'New Burial Service' : 'Request Burial Service')"
    :width="showAvailableSlots ? '1000px' : (dialogWidth)"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="burial-service-dialog"
    @close="handleClose"
    v-loading="loading"
    element-loading-text="Processing..."
  >
    <!-- Main Container: Two Columns Layout -->
    <div class="dialog-content-wrapper">
      <!-- LEFT COLUMN: Available Slots Panel -->
      <div v-if="showAvailableSlots" class="available-slots-panel">
        <div class="slots-header">
          <h4>Available Time Slots</h4>
          <el-button link type="primary" size="small" @click="showAvailableSlots = false">
            <i class="el-icon-arrow-left"></i> Hide
          </el-button>
        </div>
        <div v-if="slotsLoading" class="slots-loading">
          <el-progress type="circle" :percentage="0" indeterminate></el-progress>
          <p>Loading available dates...</p>
        </div>
        <div v-else-if="availableSlots && availableSlots.length > 0" class="slots-content">
          <el-collapse accordion>
            <el-collapse-item
              v-for="dateGroup in availableSlots"
              :key="dateGroup.date"
              :title="`${dateGroup.dayName}, ${formatDate(dateGroup.date)} (${dateGroup.availableSlots} available)`"
              :name="dateGroup.date"
              class="slot-date-group"
            >
              <div class="time-slots-grid">
                <el-button
                  v-for="timeSlot in dateGroup.timeSlots"
                  :key="timeSlot.datetime"
                  size="small"
                  :type="isSlotSelected(timeSlot.datetime) ? 'primary' : (timeSlot.isBooked ? 'danger' : 'default')"
                  :plain="!isSlotSelected(timeSlot.datetime)"
                  :disabled="timeSlot.isBooked"
                  @click="selectAvailableSlot(dateGroup.date, timeSlot.time, timeSlot.display)"
                  class="time-slot-button"
                >
                  {{ timeSlot.display }} {{ timeSlot.isBooked ? '(Booked)' : '' }}
                </el-button>
              </div>
            </el-collapse-item>
          </el-collapse>
          <div v-if="selectedSlotDisplay" class="selected-slot-info">
            <el-tag type="success" closable @close="clearSlotSelection">
              Selected: {{ selectedSlotDisplay }}
            </el-tag>
          </div>
        </div>
        <div v-else class="slots-empty">
          <el-empty description="No available slots"></el-empty>
        </div>
      </div>

      <!-- Show/Hide Slots Button (when slots are hidden) -->
      <div v-if="!showAvailableSlots" class="show-slots-button">
        <el-button text @click="showAvailableSlots = true" class="toggle-slots-btn">
          <i class="el-icon-arrow-right"></i> View Available Slots
        </el-button>
      </div>

      <!-- RIGHT COLUMN: Form -->
      <div :class="['form-panel', { 'form-panel-full': !showAvailableSlots }]">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          :label-width="labelWidth"
          :label-position="labelPosition"
          :hide-required-asterisk="isMember"
        >
      <!-- Member (Optional for Admin/Staff) -->
      <el-form-item label="Member" prop="member_id" v-if="userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff'">
        <template #label>
          <span>Member</span>
        </template>
        <el-select
          v-model="formData.member_id"
          placeholder="Select member (optional)"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
          @change="handleMemberChange"
        >
          <el-option
            v-for="member in memberOptions"
            :key="member.id || member.member_id"
            :label="member.name || (member.firstname + ' ' + member.lastname)"
            :value="member.id || member.member_id"
          />
        </el-select>
      </el-form-item>

      <!-- Requester Section -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">Requesder Information</span>
        </div>

        <!-- Requester Name (Required for Admin/Staff when no member selected) -->
        <el-form-item label="Requester Name" prop="requester_name" v-if="userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff'">
          <template #label>
            <span>{{ isMemberSelected ? 'Member' : 'Requester Name' }}</span>
          </template>
          <el-input
            v-model="formData.requester_name"
            :placeholder="formData.member_id ? 'Auto-filled' : 'Full name'"
            size="large"
            clearable
            :disabled="loading || (formData.member_id && formData.member_id !== '')"
          />
        </el-form-item>

        <!-- Requester Email (Required for Admin/Staff when no member selected) -->
        <el-form-item label="Requester Email" prop="requester_email" v-if="userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff'">
          <template #label>
            <span>{{ isMemberSelected ? 'Member Email' : 'Requester Email' }}</span>
          </template>
          <el-input
            v-model="formData.requester_email"
            type="email"
            :placeholder="formData.member_id ? 'Auto-filled' : 'Email'"
            size="large"
            clearable
            :disabled="loading || (formData.member_id && formData.member_id !== '')"
          />
        </el-form-item>

        <!-- Requester Name (For Member Users) -->
        <el-form-item prop="requester_name" v-else-if="isMember">
          <template #label>
            <span>Requester Name</span>
          </template>
          <el-input
            v-model="formData.requester_name"
            placeholder="Your full name"
            size="large"
            :disabled="true"
          />
        </el-form-item>

        <!-- Requester Email (For Member Users) -->
        <el-form-item prop="requester_email" v-else-if="isMember">
          <template #label>
            <span>Requester Email</span>
          </template>
          <el-input
            v-model="formData.requester_email"
            type="email"
            placeholder="Your email address"
            size="large"
            :disabled="true"
          />
        </el-form-item>

        <!-- Requester Name (For Non-Member Users) -->
        <el-form-item prop="requester_name" v-else-if="!userInfo?.account?.member_id">
          <template #label>
            <span>Requester Name</span>
          </template>
          <el-input
            v-model="formData.requester_name"
            placeholder="Your full name"
            size="large"
            clearable
            :disabled="loading"
          />
        </el-form-item>

        <!-- Requester Email (For Non-Member Users) -->
        <el-form-item prop="requester_email" v-else-if="!userInfo?.account?.member_id">
          <template #label>
            <span>Requester Email</span>
          </template>
          <el-input
            v-model="formData.requester_email"
            type="email"
            placeholder="Your email"
            size="large"
            clearable
            :disabled="loading"
          />
        </el-form-item>

        <!-- Relationship -->
        <el-form-item prop="relationship">
          <template #label>
            <span>Relationship</span>
          </template>
          <el-select
            v-model="formData.relationship"
            placeholder="Select relationship"
            size="large"
            style="width: 100%"
            clearable
            :disabled="loading"
          >
            <el-option
              v-for="rel in relationshipOptions"
              :key="rel"
              :label="rel"
              :value="rel"
            />
          </el-select>
        </el-form-item>

        <!-- Location -->
        <el-form-item prop="location">
          <template #label>
            <span>Location</span>
          </template>
          <el-input
            v-model="formData.location"
            placeholder="Service location"
            size="large"
            clearable
            :disabled="loading"
          />
        </el-form-item>
      </div>

      <!-- Deceased Section -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">Deceased Information</span>
        </div>

        <!-- Deceased Name -->
        <el-form-item prop="deceased_name">
          <template #label>
            <span>Deceased Name</span>
          </template>
          <el-input
            v-model="formData.deceased_name"
            placeholder="Deceased name"
            size="large"
            clearable
            :disabled="loading"
          />
        </el-form-item>

        <!-- Reason of Death -->
        <el-form-item prop="reason_of_death">
          <template #label>
            <span>Reason of Death</span>
          </template>
          <el-input
            v-model="formData.reason_of_death"
            placeholder="Cause of death"
            size="large"
            clearable
            :disabled="loading"
            maxlength="255"
          />
        </el-form-item>

        <!-- Deceased Birthdate -->
        <el-form-item prop="deceased_birthdate">
          <template #label>
            <span>Deceased Birthdate</span>
          </template>
          <el-date-picker
            v-model="formData.deceased_birthdate"
            type="date"
            placeholder="Birthdate"
            size="large"
            format="YYYY-MM-DD"
            style="width: 100%"
            :disabled="loading"
            @change="calculateDeceasedAge"
          />
        </el-form-item>

        <!-- Date of Death -->
        <el-form-item prop="date_death">
          <template #label>
            <span>Date of Death</span>
          </template>
          <el-date-picker
            v-model="formData.date_death"
            type="datetime"
            placeholder="Date/time of death"
            size="large"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            :disabled="loading"
            :picker-options="{ disabledDate: time => time.getTime() > Date.now() }"
            @change="calculateDeceasedAge"
          />
        </el-form-item>
      </div>

      <!-- Service Details Section -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">Service Details</span>
        </div>

        <!-- Pastor -->
        <el-form-item label="Pastor" prop="pastor_name" v-if="userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff'">
          <template #label>
            <span>Pastor</span>
          </template>
          <el-select
            v-model="formData.pastor_name"
            placeholder="Select pastor"
            size="large"
            style="width: 100%"
            clearable
            :disabled="loading"
          >
            <el-option
              v-for="pastor in pastorOptions"
              :key="pastor.name"
              :label="pastor.name"
              :value="pastor.name"
            />
          </el-select>
        </el-form-item>

        <!-- Service Date & Time (Required) -->
        <el-form-item label="Service Date & Time" prop="service_date">
          <template #label>
            <span>Service Date & Time</span>
          </template>
          <el-date-picker
            v-model="formData.service_date"
            type="datetime"
            placeholder="Select date and time"
            size="large"
            format="MM/DD/YYYY hh:mm A"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            :disabled="loading"
            :disabled-date="disabledFutureDate"
            :disabled-hours="disabledHours"
            :default-value="defaultNightTime"
            @change="onServiceDateChange"
          />
          <div class="form-hint" v-if="userInfo?.account?.position !== 'admin' && userInfo?.account?.position !== 'staff'">
            <el-icon><InfoFilled /></el-icon>
            <span>Burial services are typically conducted in the evening. Default time is 8:00 PM.</span>
          </div>
          <div class="form-hint" v-else>
            <el-icon><InfoFilled /></el-icon>
            <span>Burial services are typically conducted in the evening (6:00 PM - 10:00 PM).</span>
          </div>
        </el-form-item>

        <!-- Status -->
        <el-form-item label="Status" prop="status" v-if="userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff'">
          <template #label>
            <span>Status</span>
          </template>
          <el-select
            v-model="formData.status"
            placeholder="Status"
            size="large"
            style="width: 100%"
            :disabled="loading"
            @change="handleStatusChange"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <!-- Rejection Reason (shown when disapproved or cancelled) -->
        <el-form-item v-if="formData.status === 'disapproved' || formData.status === 'cancelled'" label="Rejection Reason" prop="rejection_reason" :rules="[{ required: true, message: 'Please provide a reason for rejection', trigger: 'blur' }]">
          <el-input
            v-model="formData.rejection_reason"
            type="textarea"
            placeholder="Please provide a reason for rejection/cancellation"
            size="large"
            :rows="3"
            :disabled="loading"
          />
        </el-form-item>
      </div>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large" :disabled="loading">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          size="large"
          :loading="loading"
          :disabled="loading"
        >
          {{ isEditMode ? 'Update' : userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff' ? 'Add' : 'Send' }} Request
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { useBurialServiceStore } from '@/stores/ServicesRecords/burialServiceStore'
import axios from '@/api/axios'

const burialServiceStore = useBurialServiceStore()

// Function to get from localStorage safely
const getUserFromStorage = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr && userInfoStr !== '{}') {
      return JSON.parse(userInfoStr)
    }
    return null
  } catch (e) {
    console.error('Error parsing userInfo:', e)
    return null
  }
}

const userInfo = ref(getUserFromStorage())
const fetchMemberInfo = async () => {
  if (userInfo.value?.account?.member_id && !userInfo.value.member) {
    try {
      const response = await axios.get(`/church-records/members/getMemberById/${userInfo.value.account.member_id}`)
      if (response.data.data) {
        userInfo.value.member = response.data.data
      }
    } catch (error) {
      console.error('Error fetching member info:', error)
    }
  }
}
// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  burialServiceData: {
    type: Object,
    default: null
  }
})

// Computed properties from store
const memberOptions = computed(() => burialServiceStore.memberOptions)
const pastorOptions = computed(() => burialServiceStore.pastorOptions)

// ============================================
// AVAILABLE SLOTS FUNCTIONALITY
// ============================================

// Available slots state
const showAvailableSlots = ref(true)
const slotsLoading = ref(false)
const availableSlots = ref([])
const selectedSlotDisplay = ref(null)

// Fetch available burial service slots
const fetchAvailableSlots = async (days = 14) => {
  slotsLoading.value = true
  try {
    const response = await axios.get('/services/burial-services/available-slots', {
      params: { days }
    })
    
    if (response.data.success && response.data.data) {
      availableSlots.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching available slots:', error)
    ElMessage.error('Failed to fetch available slots')
  } finally {
    slotsLoading.value = false
  }
}

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Check if a slot is selected
const isSlotSelected = (datetime) => {
  if (!formData.service_date || !formData.preferred_service_time) return false
  const selectedDatetime = `${formData.service_date} ${formData.preferred_service_time}:00`
  return datetime === selectedDatetime
}

// Select an available slot and populate the form
const selectAvailableSlot = (date, time, displayTime) => {
  formData.service_date = date
  formData.preferred_service_time = time
  selectedSlotDisplay.value = `${formatDate(date)} at ${displayTime}`
  ElMessage.success('Slot selected! Date and time have been filled.')
}

// Clear slot selection
const clearSlotSelection = () => {
  selectedSlotDisplay.value = null
}

// Fetch options on mount
onMounted(async () => {
  await Promise.all([
    burialServiceStore.fetchMemberOptions(),
    burialServiceStore.fetchPastorOptions(),
    fetchUnavailableTimeSlots(),
    fetchAvailableSlots(14)  // Fetch available slots for the next 14 days
  ])
})
// Emits
const emit = defineEmits(['update:modelValue', 'submit'])

// Refs
const formRef = ref(null)
const loading = ref(false)
const loadingInstanceRef = ref(null)

// Responsive dialog width
const dialogWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '95%'
  } else if (window.innerWidth <= 960) {
    return '90%'
  }
  return '900px'
})

// Responsive label width
const labelWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '100px'
  } else if (window.innerWidth <= 960) {
    return '130px'
  }
  return '160px'
})

// Responsive label position
const labelPosition = computed(() => {
  return window.innerWidth <= 600 ? 'top' : 'left'
})

// Check if in edit mode
const isEditMode = computed(() => !!props.burialServiceData)

// Check if current is a member (not admin/staff)
const isMember = computed(() => {
  return userInfo.value && userInfo.value.account &&
         userInfo.value.account.position !== 'admin' &&
         userInfo.value.account.position !== 'staff'
})

// Check if a member is selected (for conditional validation)
const isMemberSelected = computed(() => {
  return !!(formData.member_id && formData.member_id !== '')
})

// Unavailable time slots for scheduling
const unavailableTimeSlots = ref([])

// Default night time for burial services (6:00 PM)
// Get tomorrow's date at 6:00 PM as default
const getDefaultNightTime = () => {
  const date = new Date()
  date.setDate(date.getDate() + 1) // Tomorrow
  date.setHours(20, 0, 0, 0) // 8:00 PM
  return date
}

const defaultNightTime = computed(() => getDefaultNightTime())

// Disable future dates (allow selecting today and future dates)
const disabledFutureDate = (date) => {
  if (isEditMode.value) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date <= today
}

// Disable hours - only allow night hours (6 PM - 10 PM)
const disabledHours = () => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 23]
}

// Fetch unavailable time slots for scheduling (same day allowed, same time blocked)
const fetchUnavailableTimeSlots = async () => {
  try {
    // Get all burial services with approved status to block time slots
    const response = await axios.get('/church-records/burial-services/getAllBurialServices', {
      params: {
        status: 'approved', // Only get approved burial services to block time slots
        limit: 1000 // Get enough records to cover scheduling
      }
    })

    if (response.data.success && response.data.data) {
      // Extract time slots that are already approved/scheduled
      const scheduledTimeSlots = []

      response.data.data.forEach(burial => {
        if (burial.service_date && burial.status === 'approved') {
          // Add time slot for blocking (same day allowed, same time blocked)
          scheduledTimeSlots.push({
            date: burial.service_date.split(' ')[0], // Extract date part only
            id: burial.burial_id // For edit mode exception
          })
        }
      })

      // Store time slots for blocking logic
      unavailableTimeSlots.value = scheduledTimeSlots
    }
  } catch (error) {
    console.error('Error fetching unavailable time slots:', error)
    // Don't show error to user, just allow all slots if fetch fails
  }
}

// Validate time slot availability
const validateTimeSlot = async (dateTime, excludeId = null) => {
  if (!dateTime) return true

  try {
    // Extract date and time from datetime value
    const date = new Date(dateTime)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = date.toTimeString().split(' ')[0] // HH:MM:SS

    const response = await axios.get('/church-records/burial-services/check-time-slot', {
      params: {
        service_date: dateStr,
        service_time: timeStr,
        exclude_id: excludeId
      }
    })

    if (response.data.success && response.data.data) {
      return !response.data.data.isBooked
    }
  } catch (error) {
    console.error('Error validating time slot:', error)
    // If validation fails, allow the time slot
    return true
  }

  return true
}

// Relationship options
const relationshipOptions = [
  'Parent',
  'Child',
  'Sibling',
  'Spouse',
  'Grandparent',
  'Grandchild',
  'Relative',
  'Friend',
  'Church Member',
  'Other'
]

// Form data
const formData = reactive({
  member_id: null,
  requester_name: '',
  requester_email: '',
  deceased_name: '',
  deceased_birthdate: null,
  date_death: null,
  reason_of_death: '',
  relationship: '',
  location: '',
  pastor_name: '',
  service_date: null,
  preferred_service_date: null,
  status: 'pending',
  rejection_reason: ''
})

// Status options
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

// Validation rules
const rules = computed(() => {
  const baseRules = {
    requester_name: [
      { required: true, message: 'Requester name is required', trigger: 'blur' }
    ],
    requester_email: [
      { required: true, message: 'Requester email is required', trigger: 'blur' },
      { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
    ],
    deceased_name: [
      { required: true, message: 'Deceased name is required', trigger: 'blur' }
    ],
    deceased_birthdate: [
      { required: true, message: 'Deceased birthdate is required', trigger: 'change' }
    ],
    date_death: [
      { required: true, message: 'Date of death is required', trigger: 'change' },
      {
        validator: (rule, value, callback) => {
          if (value) {
            const selectedDate = new Date(value)
            const now = new Date()
            // Compare dates only (not time) to prevent future dates
            const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
            const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            
            if (selectedDateOnly > nowDateOnly) {
              callback(new Error('Date of death cannot be in the future'))
              return
            }
          }
          callback()
        },
        trigger: 'change'
      }
    ],
    reason_of_death: [
      { required: true, message: 'Reason of death is required', trigger: 'blur' }
    ],
    relationship: [
      { required: true, message: 'Relationship is required', trigger: 'change' }
    ],
    location: [
      { required: true, message: 'Location is required', trigger: 'blur' }
    ]
  }

  if (userInfo.value?.account?.position === 'admin' || userInfo.value?.account?.position === 'staff') {
    // Admin/Staff specific required fields
    baseRules.pastor_name = [
      { required: true, message: 'Pastor is required', trigger: 'change' }
    ]
    baseRules.service_date = [
      { required: true, message: 'Service date and time is required', trigger: 'change' }
    ]
    baseRules.status = [
      { required: true, message: 'Status is required', trigger: 'change' }
    ]

    if (!formData.member_id) {
      baseRules.requester_name = [
        { required: true, message: 'Requester name is required', trigger: 'blur' }
      ]
      baseRules.requester_email = [
        { required: true, message: 'Requester email is required', trigger: 'blur' },
        { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
      ]
    }
  }

  return baseRules
})

// Calculate deceased age
const calculateDeceasedAge = () => {
  if (formData.deceased_birthdate && formData.date_death) {
    const birthDate = new Date(formData.deceased_birthdate)
    const deathDate = new Date(formData.date_death)
    const age = deathDate.getFullYear() - birthDate.getFullYear()
    const monthDiff = deathDate.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && deathDate.getDate() < birthDate.getDate())) {
      formData.deceased_age = age - 1
    } else {
      formData.deceased_age = age
    }
  }
}

// Handle member selection
const handleMemberChange = async (memberId) => {
  if (memberId) {
    try {
      const response = await axios.get(`/church-records/members/getMemberById/${memberId}`)
      if (response.data.data) {
        const member = response.data.data
        formData.requester_name = member.name || (member.firstname + ' ' + member.lastname)
        formData.requester_email = member.email || ''
      }
    } catch (error) {
      console.error('Error fetching member details:', error)
    }
  } else {
    formData.requester_name = ''
    formData.requester_email = ''
  }
}

// Handle status change - clear reason when status changes from rejected/cancelled
const handleStatusChange = () => {
  if (formData.status !== 'disapproved' && formData.status !== 'cancelled') {
    formData.rejection_reason = ''
  }
}

// Reset form
const resetForm = () => {
  formData.member_id = null
  formData.requester_name = ''
  formData.requester_email = ''
  formData.deceased_name = ''
  formData.deceased_birthdate = null
  formData.date_death = null
  formData.reason_of_death = ''
  formData.relationship = ''
  formData.location = ''
  formData.pastor_name = ''
  formData.service_date = null
  formData.preferred_service_date = null
  formData.status = 'pending'
  formData.rejection_reason = ''

  // Clear validation
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// Watch for burial service data changes (edit mode)
watch(() => props.burialServiceData, (newData) => {
  console.log('burialServiceData received:', newData)
  if (newData) {
    console.log('service_date:', newData.service_date)
    console.log('preferred_service_time:', newData.preferred_service_time)
    formData.member_id = newData.member_id || null
    formData.requester_name = newData.requester_name || ''
    formData.requester_email = newData.requester_email || ''
    formData.deceased_name = newData.deceased_name || ''
    formData.deceased_birthdate = newData.deceased_birthdate ? new Date(newData.deceased_birthdate) : null
    formData.date_death = newData.date_death ? new Date(newData.date_death) : null
    formData.reason_of_death = newData.reason_of_death || ''
    formData.relationship = newData.relationship || ''
    formData.location = newData.location || ''
    formData.pastor_name = newData.pastor_name || ''
    formData.service_date = newData.service_date || newData.preferred_service_time || null
    // Convert preferred_service_time to datetime if available
    if (newData.preferred_service_time) {
      formData.preferred_service_date = newData.preferred_service_time
    } else {
      formData.preferred_service_date = getDefaultNightTime()
    }
    formData.status = newData.status || 'pending'
    formData.rejection_reason = newData.rejection_reason || ''
  } else {
    // Reset form when dialog is opened for new request
    resetForm()
  }
}, { immediate: true })

// Handle service date change
const onServiceDateChange = async (dateTime) => {
  if (dateTime && props.burialServiceData?.burial_id) {
    const isAvailable = await validateTimeSlot(dateTime, props.burialServiceData.burial_id)
    if (!isAvailable) {
      ElMessage.warning('This time slot is already booked. Please select a different time.')
      formData.service_date = null
    }
  } else if (dateTime) {
    const isAvailable = await validateTimeSlot(dateTime)
    if (!isAvailable) {
      ElMessage.warning('This time slot is already booked. Please select a different time.')
      formData.service_date = null
    }
  }
}

// Copy preferred service date/time to actual service date/time
const copyPreferredToServiceDate = async () => {
  if (formData.preferred_service_date) {
    // Check if the preferred time slot is available
    const isAvailable = await validateTimeSlot(formData.preferred_service_date)
    if (!isAvailable) {
      ElMessage.warning('The preferred time slot is already booked. Please select a different time.')
      return
    }
    formData.service_date = formData.preferred_service_date
    ElMessage.success('Preferred date & time copied to Service Date & Time')
  }
}

// Handle close
const handleClose = () => {
  emit('update:modelValue', false)
  resetForm()
}

// Handle submit
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // Helper function to convert date to ISO string
    const toISODate = (value) => {
      if (!value) return null
      if (value instanceof Date) {
        return !isNaN(value) ? value.toISOString() : null
      }
      // If it's already a string, check if it's in valid format
      if (typeof value === 'string') {
        const date = new Date(value)
        return !isNaN(date) ? date.toISOString() : null
      }
      return null
    }
    
    // Prepare data
    const data = {
      member_id: formData.member_id,
      requester_name: formData.requester_name,
      requester_email: formData.requester_email,
      deceased_name: formData.deceased_name,
      deceased_birthdate: toISODate(formData.deceased_birthdate) ? toISODate(formData.deceased_birthdate).split('T')[0] : null,
      date_death: toISODate(formData.date_death),
      reason_of_death: formData.reason_of_death,
      relationship: formData.relationship,
      location: formData.location,
      pastor_name: formData.pastor_name,
      service_date: toISODate(formData.service_date),
      preferred_service_time: formData.service_date && formData.preferred_service_time 
        ? `${formData.service_date} ${formData.preferred_service_time}`
        : toISODate(formData.preferred_service_time),
      status: formData.status,
      rejection_reason: formData.rejection_reason || null,
      rejected_by: (() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        return userInfo?.account?.acc_id || userInfo?.acc_id || null
      })()
    }
    
    let response
    
    if (isEditMode.value) {
      // Update existing record
      response = await axios.put(`/church-records/burial-services/updateBurialService/${props.burialServiceData.burial_id}`, data)
    } else {
      // Create new record
      response = await axios.post('/church-records/burial-services/createBurialService', data)
    }
    
    if (response.data.success) {
      ElMessage.success(isEditMode.value ? 'Burial service updated successfully!' : 'Burial service request submitted successfully!')
      emit('submit', response.data.data)
      handleClose()
    } else {
      ElMessage.error(response.data.message || 'Failed to submit burial service request')
    }
  } catch (error) {
    console.error('Error submitting burial service:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error === 'cancel') {
        // do nothing
    } else {
      const errorDetail = error.message || (typeof error === 'object' ? 'Validation failed' : String(error))
      ElMessage.error(`Failed to submit burial service request: ${errorDetail}`)
    }
  } finally {
    loading.value = false
  }
}

// Watch for user info changes and fetch member info if needed
watch(userInfo, async (newUserInfo) => {
  if (newUserInfo?.account?.member_id && !newUserInfo.member) {
    await fetchMemberInfo()
  }
}, { immediate: true })

</script>

<style scoped>
/* Main dialog content wrapper */
.dialog-content-wrapper {
  display: flex;
  gap: 16px;
  width: 100%;
}

/* Available Slots Panel (Left Column) */
.available-slots-panel {
  flex: 0 0 320px;
  border-right: 1px solid #dcdfe6;
  padding-right: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 60vh;
}

.available-slots-panel::-webkit-scrollbar {
  width: 6px;
}

.available-slots-panel::-webkit-scrollbar-track {
  background: transparent;
}

.available-slots-panel::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.available-slots-panel::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* Slots Header */
.slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.slots-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* Loading State */
.slots-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  gap: 12px;
  color: #909399;
}

.slots-loading p {
  margin: 0;
  font-size: 12px;
}

/* Slots Content */
.slots-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
}

.slot-date-group :deep(.el-collapse-item__header) {
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
}

.slot-date-group :deep(.el-collapse-item__content) {
  padding: 12px;
}

/* Time Slots Grid */
.time-slots-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.time-slot-button {
  font-size: 11px;
  padding: 6px 8px;
  min-width: auto;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.time-slot-button:hover {
  transform: translateY(-2px);
}

/* Selected Slot Info */
.selected-slot-info {
  margin-top: 12px;
  padding: 12px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #b3d8ff;
}

.selected-slot-info :deep(.el-tag) {
  width: 100%;
  justify-content: space-between;
}

/* Empty State */
.slots-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

/* Show/Hide Slots Button */
.show-slots-button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0;
}

.toggle-slots-btn {
  font-size: 12px;
  color: #409eff;
  padding: 4px 8px;
}

.toggle-slots-btn:hover {
  color: #66b1ff;
}

/* Form Panel (Right Column) */
.form-panel {
  flex: 1;
  overflow-y: auto;
  max-height: 60vh;
}

.form-panel-full {
  flex: 1;
}

/* Responsive Design */
@media (max-width: 1000px) {
  .dialog-content-wrapper {
    flex-direction: column;
  }

  .available-slots-panel {
    flex: 0 0 auto;
    border-right: none;
    border-bottom: 1px solid #dcdfe6;
    padding-right: 0;
    padding-bottom: 16px;
    max-height: none;
  }

  .form-panel {
    max-height: none;
  }
}

@media (max-width: 600px) {
  .time-slots-grid {
    grid-template-columns: 1fr;
  }
}

.burial-service-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
  }

  :deep(.el-dialog__header) {
    margin-right: 0;
    padding-bottom: 20px;
    border-bottom: 1px solid #dcdfe6;
  }

  :deep(.el-dialog__body) {
    padding: 20px 24px;
  }

  :deep(.el-dialog__footer) {
    padding-top: 20px;
    border-top: 1px solid #dcdfe6;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select .el-input__wrapper),
  :deep(.el-date-editor .el-input__wrapper) {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }

  .required-text {
    color: #f56c6c;
    margin-left: 4px;
  }

  .optional-text {
    color: #909399;
    font-size: 12px;
    margin-left: 4px;
  }

  .form-section {
    background: #fafafa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid #ebeef5;
  }

  .section-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e4e7ed;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .section-divider {
    margin: 24px 0;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  :deep(.el-button--primary) {
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    border: none;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);
    }
  }
}

@media (max-width: 600px) {
  .burial-service-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 10px auto;
    }

    :deep(.el-dialog__body) {
      padding: 16px;
    }

    .dialog-footer {
      flex-direction: column-reverse;

      .el-button {
        width: 100%;
        margin-left: 0;
      }
    }
  }
}
</style>
