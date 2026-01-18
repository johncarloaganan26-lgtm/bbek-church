 hre<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Child Dedication Request' : (!isMemberUser ? 'New Child Dedication' : 'Request Child Dedication Service')"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="child-dedication-dialog"
    @close="handleClose"
    v-loading="loading"
    element-loading-text="Processing..."
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :hide-required-asterisk="true"
    >
      <!-- Requested By (Member) - Hidden for member users, auto-filled -->
      <el-form-item v-if="!isMemberUser" prop="requested_by">
        <template #label>
          <span><span class="required-text"></span> Requested By (Member)</span>
        </template>
        <el-select
          v-model="formData.requested_by"
          placeholder="Select member"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
          @change="onMemberChange"
        >
          <el-option
            v-for="option in memberOptions"
            :key="option.id"
            :label="option.name"
            :value="option.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-else label="Requested By" prop="requested_by">
        <el-input
          v-model="requesterDisplayName"
          size="large"
          disabled
          style="width: 100%"
        />
        <input type="hidden" v-model="formData.requested_by" />
      </el-form-item>

      <!-- Child's Full Name Section -->
      <el-divider content-position="left">Child's Information</el-divider>

      <!-- Child First Name -->
      <el-form-item prop="child_firstname">
        <template #label>
          <span>Child's First Name <span class="required-text">{{ !isMemberUser ? '*' : 'required' }}</span></span>
        </template>
        <el-input
          v-model="formData.child_firstname"
          placeholder="Enter child's first name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Child Last Name -->
      <el-form-item prop="child_lastname">
        <template #label>
          <span>Child's Last Name <span class="required-text">{{ !isMemberUser ? '*' : 'required' }}</span></span>
        </template>
        <el-input
          v-model="formData.child_lastname"
          placeholder="Enter child's last name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Child Middle Name -->
      <el-form-item label="Child's Middle Name" prop="child_middle_name">
        <el-input
          v-model="formData.child_middle_name"
          placeholder="Enter child's middle name (optional)"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Date of Birth -->
      <el-form-item prop="date_of_birth">
        <template #label>
          <span>Date of Birth <span class="required-text">{{ !isMemberUser ? '*' : 'required' }}</span></span>
        </template>
        <el-date-picker
          v-model="formData.date_of_birth"
          type="date"
          placeholder="Select date of birth"
          size="large"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled="loading"
          :disabled-date="(date) => date > new Date()"
        />
      </el-form-item>

      <!-- Place of Birth -->
      <el-form-item prop="place_of_birth">
        <template #label>
          <span>Place of Birth <span class="required-text">{{ !isMemberUser ? '*' : 'required' }}</span></span>
        </template>
        <el-input
          v-model="formData.place_of_birth"
          placeholder="Enter place of birth"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Gender -->
      <el-form-item prop="gender">
        <template #label>
          <span>Gender <span class="required-text">{{ !isMemberUser ? '*' : 'required' }}</span></span>
        </template>
        <el-radio-group v-model="formData.gender" size="large" :disabled="loading">
          <el-radio label="M">Male</el-radio>
          <el-radio label="F">Female</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- Relationship to Child -->
      <el-form-item prop="requester_relationship">
        <template #label>
          <span>Your Relationship to the Child</span>
        </template>
        <el-select
          v-model="formData.requester_relationship"
          placeholder="Select your relationship to the child"
          size="large"
          style="width: 100%"
          :disabled="loading"
          @change="onRelationshipChange"
        >
          <el-option label="Father" value="father" />
          <el-option label="Mother" value="mother" />
          <el-option label="Grandparent" value="grandparent" />
          <el-option label="Guardian" value="guardian" />
          <el-option label="Other Family Member" value="other_family" />
          <el-option label="Other" value="other" />
        </el-select>
      </el-form-item>

      <!-- Preferred Dedication Date and Time - Only for Admin/Staff users -->
      <el-form-item v-if="!isMemberUser" prop="preferred_dedication_date">
        <template #label>
          <span> Preferred Dedication Date<span class="required-text">*</span></span>
        </template>
        <el-date-picker
          v-model="formData.preferred_dedication_date"
          type="date"
          placeholder="Select preferred dedication date"
          size="large"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled="loading"
          :disabled-date="isDateDisabled"
          @change="onDateChange"
        />
      </el-form-item>

      <!-- Preferred Dedication Time - Only for Admin/Staff users -->
      <el-form-item v-if="!isMemberUser" prop="preferred_dedication_time">
        <template #label>
          <span>Preferred Dedication Time<span class="required-text">*</span></span>
        </template>
        <el-time-picker
          v-model="formData.preferred_dedication_time"
          placeholder="Select preferred dedication time"
          size="large"
          format="hh:mm A"
          value-format="HH:mm"
          style="width: 100%"
          :disabled="loading"
          :disabled-hours="getDisabledHours"
          :disabled-minutes="getDisabledMinutes"
          start="08:00"
          end="18:00"
          step="30"
        />
      </el-form-item>

      <!-- Father Details Section -->
      <el-divider content-position="left">Father's Information (Optional)</el-divider>

      <!-- Father First Name -->
      <el-form-item label="Father's First Name" prop="father_firstname">
        <el-input
          v-model="formData.father_firstname"
          placeholder="Enter father's first name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Father Last Name -->
      <el-form-item label="Father's Last Name" prop="father_lastname">
        <el-input
          v-model="formData.father_lastname"
          placeholder="Enter father's last name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Father Middle Name -->
      <el-form-item label="Father's Middle Name" prop="father_middle_name">
        <el-input
          v-model="formData.father_middle_name"
          placeholder="Enter father's middle name (optional)"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Father Phone Number -->
      <el-form-item label="Father's Phone Number" prop="father_phone_number">
        <el-input
          v-model="formData.father_phone_number"
          placeholder="Enter father's phone number"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Father Email -->
      <el-form-item label="Father's Email" prop="father_email">
        <el-input
          v-model="formData.father_email"
          placeholder="Enter father's email (optional)"
          size="large"
          clearable
          :disabled="loading"
          type="email"
        />
      </el-form-item>

      <!-- Father Address -->
      <el-form-item label="Father's Address" prop="father_address">
        <el-input
          v-model="formData.father_address"
          type="textarea"
          :rows="2"
          placeholder="Enter father's address"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Mother Details Section -->
      <el-divider content-position="left">Mother's Information (Optional)</el-divider>

      <!-- Mother First Name -->
      <el-form-item label="Mother's First Name" prop="mother_firstname">
        <el-input
          v-model="formData.mother_firstname"
          placeholder="Enter mother's first name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Mother Last Name -->
      <el-form-item label="Mother's Last Name" prop="mother_lastname">
        <el-input
          v-model="formData.mother_lastname"
          placeholder="Enter mother's last name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Mother Middle Name -->
      <el-form-item label="Mother's Middle Name" prop="mother_middle_name">
        <el-input
          v-model="formData.mother_middle_name"
          placeholder="Enter mother's middle name (optional)"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Mother Phone Number -->
      <el-form-item label="Mother's Phone Number" prop="mother_phone_number">
        <el-input
          v-model="formData.mother_phone_number"
          placeholder="Enter mother's phone number"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Mother Email -->
      <el-form-item label="Mother's Email" prop="mother_email">
        <el-input
          v-model="formData.mother_email"
          placeholder="Enter mother's email (optional)"
          size="large"
          clearable
          :disabled="loading"
          type="email"
        />
      </el-form-item>

      <!-- Mother Address -->
      <el-form-item label="Mother's Address" prop="mother_address">
        <el-input
          v-model="formData.mother_address"
          type="textarea"
          :rows="2"
          placeholder="Enter mother's address"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Sponsors Section -->
      <el-divider content-position="left">Sponsors (Optional)</el-divider>

      <el-form-item label="Sponsors" prop="sponsors">
        <div class="sponsors-table-wrapper">
          <el-table
            :data="formData.sponsors"
            border
            size="small"
            class="sponsors-table"
            max-height="300"
          >
            <el-table-column
              label="#"
              type="index"
              width="50"
            />

            <el-table-column label="First Name" min-width="140">
              <template #default="{ row }">
                <el-input
                  v-model="row.firstname"
                  placeholder="First name"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onSponsorsChange"
                  @blur="onSponsorsChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Last Name" min-width="140">
              <template #default="{ row }">
                <el-input
                  v-model="row.lastname"
                  placeholder="Last name"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onSponsorsChange"
                  @blur="onSponsorsChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Middle Name" min-width="140">
              <template #default="{ row }">
                <el-input
                  v-model="row.middle_name"
                  placeholder="Middle name (optional)"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onSponsorsChange"
                  @blur="onSponsorsChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Phone Number" min-width="150">
              <template #default="{ row }">
                <el-input
                  v-model="row.phone_number"
                  placeholder="Phone number"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onSponsorsChange"
                  @blur="onSponsorsChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Address" min-width="200">
              <template #default="{ row }">
                <el-input
                  v-model="row.address"
                  placeholder="Address"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onSponsorsChange"
                  @blur="onSponsorsChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="90" align="center" fixed="right">
              <template #default="{ $index }">
                <el-button
                  v-if="formData.sponsors.length > 0"
                  type="danger"
                  circle
                  text
                  size="small"
                  :disabled="loading"
                  @click="removeSponsor($index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="sponsor-add-row">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="loading"
              @click="addSponsor"
            >
              + Add Sponsor
            </el-button>
          </div>
        </div>
      </el-form-item>

      <!-- Contact Details Section -->
      <el-divider content-position="left">Contact Details</el-divider>

      <!-- Contact Phone Number -->
      <el-form-item label="Contact Phone Number" prop="contact_phone_number">
        <el-input
          v-model="formData.contact_phone_number"
          placeholder="Enter contact phone number (optional)"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Contact Email -->
      <el-form-item label="Contact Email" prop="contact_email">
        <el-input
          v-model="formData.contact_email"
          placeholder="Enter contact email (optional)"
          size="large"
          clearable
          :disabled="loading"
          type="email"
        />
      </el-form-item>

      <!-- Contact Address -->
      <el-form-item label="Contact Address" prop="contact_address">
        <el-input
          v-model="formData.contact_address"
          type="textarea"
          :rows="3"
          placeholder="Enter contact address (optional)"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Pastor (Admin/Staff only) -->
      <el-form-item v-if="!isMemberUser" prop="pastor">
        <template #label>
          <span>Pastor <span class="required-text">*</span></span>
        </template>
        <el-select
          v-model="formData.pastor"
          placeholder="Select pastor"
          size="large"
          style="width: 100%"
          clearable
          filterable
          :disabled="loading"
          @change="onPastorChange"
        >
          <el-option
            v-for="option in pastorOptions"
            :key="option.id"
            :label="option.name"
            :value="option.name"
          />
        </el-select>
      </el-form-item>

      <!-- Location (Admin/Staff only) -->
      <el-form-item v-if="!isMemberUser" prop="location">
        <template #label>
          <span>Location <span class="required-text">*</span></span>
        </template>
        <el-input
          v-model="formData.location"
          placeholder="Enter dedication location"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Status (Admin/Staff only) -->
      <el-form-item v-if="!isMemberUser" prop="status" label="Status">
        <el-select
          v-model="formData.status"
          placeholder="Select status"
          size="large"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

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
          {{ isEditMode ? 'Update' : (!isMemberUser ? 'Add' : 'Submit') }} Request
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import axios from '@/api/axios'

const userInfo = ref(null)
const selectedMemberData = ref(null) // Store selected member data for admin/staff users

// Function to get user from localStorage safely
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

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dedicationData: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'submit', 'switch-to-edit'])

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
    return '140px'
  }
  return '180px'
})

// Responsive label position
const labelPosition = computed(() => {
  return window.innerWidth <= 600 ? 'top' : 'left'
})

// Check if in edit mode
const isEditMode = computed(() => !!props.dedicationData)

// Member options - will be fetched from API
const memberOptions = ref([])

// Pastor options - will be fetched from API
const pastorOptions = ref([])

// Unavailable dates and time slots for scheduling
const unavailableDates = ref([])
const unavailableTimeSlots = ref([]) // Array of {date: 'YYYY-MM-DD', time: 'HH:mm'} objects

// Check if user is a member (has member object and is not admin/staff)
const isMemberUser = computed(() => {
  // Member user has a member object and is not admin or staff
  return userInfo.value?.member?.member_id && 
         userInfo.value?.account?.position !== 'admin' && 
         userInfo.value?.account?.position !== 'staff'
})

// Requester display name for member users
const requesterDisplayName = computed(() => {
  if (userInfo.value?.member) {
    const m = userInfo.value.member
    return `${m.firstname || ''} ${m.middle_name ? m.middle_name + ' ' : ''}${m.lastname || ''}`.trim()
  }
  return ''
})

// Fetch member options on mount
const fetchMemberOptions = async () => {
  try {
    const response = await axios.get('/church-records/members/getAllMembersWithoutPastorsForSelect')
    if (response.data.success && response.data.data) {
      memberOptions.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching member options:', error)
  }
}

// Fetch pastor options on mount
const fetchPastorOptions = async () => {
  try {
    const response = await axios.get('/church-records/church-leaders/getAllChurchLeadersForSelect')
    if (response.data.success && response.data.data) {
      pastorOptions.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching pastor options:', error)
  }
}

// Fetch unavailable time slots for scheduling (same day allowed, same time blocked)
const fetchUnavailableTimeSlots = async () => {
  try {
    // Get all child dedications with preferred dates and times (only approved status)
    const response = await axios.get('/church-records/child-dedications/getAllChildDedications', {
      params: {
        status: 'approved', // Only get approved dedications to block time slots
        limit: 1000 // Get enough records to cover scheduling
      }
    })

    if (response.data.success && response.data.data) {
      // Extract time slots that are already approved/scheduled
      const scheduledTimeSlots = []

      response.data.data.forEach(dedication => {
        if (dedication.preferred_dedication_date && dedication.preferred_dedication_time && dedication.status === 'approved') {
          // Add time slot for blocking (same day allowed, same time blocked)
          scheduledTimeSlots.push({
            date: dedication.preferred_dedication_date,
            time: dedication.preferred_dedication_time,
            id: dedication.child_id // For edit mode exception
          })
        }
      })

      // Store time slots for blocking logic
      unavailableTimeSlots.value = scheduledTimeSlots

      // Note: We don't block entire dates anymore - same day is allowed
      unavailableDates.value = []
    }
  } catch (error) {
    console.error('Error fetching unavailable time slots:', error)
    // Don't show error to user, just allow all slots if fetch fails
  }
}

// Enhanced time slot validation function
const validateTimeSlot = async (date, time, excludeId = null) => {
  if (!date || !time) return true

  try {
    const response = await axios.get('/church-records/child-dedications/check-time-slot', {
      params: {
        preferred_dedication_date: date,
        preferred_dedication_time: time,
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

// Date analyzer function - only checks for past dates (same day allowed, only time slots blocked)
const isDateDisabled = (date) => {
  // Only check: date cannot be in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return date < today // Disable past dates only
}

// Get disabled hours for time picker based on selected date
const getDisabledHours = () => {
  // No longer disable hours - allow selection and show warnings instead
  return []
}

// Get disabled minutes for time picker based on selected date and hour
const getDisabledMinutes = (hour) => {
  if (!formData.preferred_dedication_date || hour === undefined) return []

  const selectedDateStr = formData.preferred_dedication_date
  const bookedTimesForDateAndHour = unavailableTimeSlots.value
    .filter(slot => {
      // Allow current dedication's time slot if editing
      if (isEditMode.value && props.dedicationData?.child_id === slot.id) {
        return false
      }
      return slot.date === selectedDateStr && parseInt(slot.time.split(':')[0]) === hour
    })
    .map(slot => parseInt(slot.time.split(':')[1]))

  // Return array of minutes that are booked for this hour
  return bookedTimesForDateAndHour
}

// Handle pastor selection change
const onPastorChange = (pastorName) => {
  // Optional: Could auto-fill location based on pastor, but keeping it simple for now
  console.log('Pastor selected:', pastorName)
}

// Handle date change - NO error trapping for dates (multiple services allowed on same date)
const onDateChange = async (date) => {
  // Only validate for admin/staff users and if time is already selected
  if (isMemberUser.value || !date || !formData.preferred_dedication_time) return

  try {
    const isValid = await validateTimeSlot(date, formData.preferred_dedication_time, isEditMode.value ? props.dedicationData?.child_id : null)

    if (!isValid) {
      // Show immediate toast notification for time slot conflict only
      ElMessage.warning({
        message: `Time slot conflict: ${date} at ${formData.preferred_dedication_time} is already booked. You can still proceed.`,
        duration: 5000, // Show for 5 seconds
        showClose: true,
        dangerouslyUseHTMLString: false
      })
    }
  } catch (error) {
    console.error('Error validating time slot on date change:', error)
    // Don't show error to user for validation failures, just log
  }
}

// Handle time change - show immediate toast notification for conflicts
const onTimeChange = async (time) => {
  // Only validate for admin/staff users
  if (isMemberUser.value || !formData.preferred_dedication_date || !time) return

  try {
    const isValid = await validateTimeSlot(formData.preferred_dedication_date, time, isEditMode.value ? props.dedicationData?.child_id : null)

    if (!isValid) {
      // Show immediate toast notification
      ElMessage.error({
        message: `Time slot conflict: ${formData.preferred_dedication_date} at ${time} is already booked. Please choose a different time.`,
        duration: 5000, // Show for 5 seconds
        showClose: true,
        dangerouslyUseHTMLString: false
      })
    }
  } catch (error) {
    console.error('Error validating time slot on change:', error)
    // Don't show error to user for validation failures, just log
  }
}

// Handle member selection change - auto-fill contact details
const onMemberChange = async (memberId) => {
  if (!memberId) {
    // Clear contact fields and selected member data if no member selected
    formData.contact_phone_number = ''
    formData.contact_email = ''
    formData.contact_address = ''
    selectedMemberData.value = null
    return
  }

  try {
    const response = await axios.get(`/church-records/members/getMemberById/${memberId}`)
    if (response.data.data) {
      const member = response.data.data
      // Store selected member data for relationship auto-population
      selectedMemberData.value = member
      // Auto-fill contact details from member info
      formData.contact_phone_number = member.phone_number || ''
      formData.contact_email = member.email || ''
      formData.contact_address = member.address || ''
    }
  } catch (error) {
    console.error('Error fetching member details:', error)
    ElMessage.error('Failed to load member details')
  }
}

// Handle relationship change - auto-populate parent fields
const onRelationshipChange = (relationship) => {
  // Determine which member data to use: selected member for admin/staff, or logged-in member for member users
  const memberData = !isMemberUser.value ? selectedMemberData.value : userInfo.value?.member

  // Clear all parent fields first
  formData.father_firstname = ''
  formData.father_lastname = ''
  formData.father_middle_name = ''
  formData.father_phone_number = ''
  formData.father_email = ''
  formData.father_address = ''

  formData.mother_firstname = ''
  formData.mother_lastname = ''
  formData.mother_middle_name = ''
  formData.mother_phone_number = ''
  formData.mother_email = ''
  formData.mother_address = ''

  // Clear contact fields if they were auto-populated from member data
  const memberPhone = memberData?.phone_number
  const memberEmail = userInfo.value?.account?.email || memberData?.email
  const memberAddress = memberData?.address

  if (formData.contact_phone_number === memberPhone) {
    formData.contact_phone_number = ''
  }
  if (formData.contact_email === memberEmail) {
    formData.contact_email = ''
  }
  if (formData.contact_address === memberAddress) {
    formData.contact_address = ''
  }

  // Auto-populate based on relationship
  if (relationship === 'father' && memberData) {
    formData.father_firstname = memberData.firstname || ''
    formData.father_lastname = memberData.lastname || ''
    formData.father_middle_name = memberData.middle_name || ''
    formData.father_phone_number = memberData.phone_number || ''
    formData.father_email = memberData.email || userInfo.value?.account?.email || ''
    formData.father_address = memberData.address || ''
    // For father/mother relationships, do NOT populate contact details
  } else if (relationship === 'mother' && memberData) {
    formData.mother_firstname = memberData.firstname || ''
    formData.mother_lastname = memberData.lastname || ''
    formData.mother_middle_name = memberData.middle_name || ''
    formData.mother_phone_number = memberData.phone_number || ''
    formData.mother_email = memberData.email || userInfo.value?.account?.email || ''
    formData.mother_address = memberData.address || ''
    // For father/mother relationships, do NOT populate contact details
  } else {
    // For other relationships, populate contact details
    if (memberData) {
      formData.contact_phone_number = memberData.phone_number || ''
      formData.contact_email = memberData.email || userInfo.value?.account?.email || ''
      formData.contact_address = memberData.address || ''
    }
  }
}

// Form data
const formData = reactive({
  requested_by: '',
  requester_relationship: '',
  child_firstname: '',
  child_lastname: '',
  child_middle_name: '',
  date_of_birth: '',
  place_of_birth: '',
  gender: '',
  preferred_dedication_date: '',
  preferred_dedication_time: '',
  contact_phone_number: '',
  contact_email: '',
  contact_address: '',
  father_firstname: '',
  father_lastname: '',
  father_middle_name: '',
  father_phone_number: '',
  father_email: '',
  father_address: '',
  mother_firstname: '',
  mother_lastname: '',
  mother_middle_name: '',
  mother_phone_number: '',
  mother_email: '',
  mother_address: '',
  sponsors: [],
  pastor: '',
  location: '',
  status: 'pending'
})

// Status options
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Disapproved', value: 'disapproved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

// Validation rules
const rules = {
  requested_by: [
    { required: true, message: 'Requested by (member) is required', trigger: 'change' }
  ],
  requester_relationship: [
    {
      validator: (rule, value, callback) => {
        // Only require relationship for new requests, not for updating pending requests
        if (!isEditMode.value && (!value || !value.trim())) {
          callback(new Error('Relationship to the child is required'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  child_firstname: [
    { required: true, message: 'Child\'s first name is required', trigger: 'blur' },
    { min: 1, max: 100, message: 'First name must be between 1 and 100 characters', trigger: 'blur' }
  ],
  child_lastname: [
    { required: true, message: 'Child\'s last name is required', trigger: 'blur' },
    { min: 1, max: 100, message: 'Last name must be between 1 and 100 characters', trigger: 'blur' }
  ],
  child_middle_name: [
    { max: 100, message: 'Middle name must not exceed 100 characters', trigger: 'blur' }
  ],
  date_of_birth: [
    { required: true, message: 'Date of birth is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('Date of birth is required'))
          return
        }
        const birthDate = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (birthDate > today) {
          callback(new Error('Date of birth cannot be in the future'))
          return
        }
        // Check if too old (more than 150 years)
        const minDate = new Date()
        minDate.setFullYear(today.getFullYear() - 150)
        if (birthDate < minDate) {
          callback(new Error('Date of birth is too far in the past'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  place_of_birth: [
    { required: true, message: 'Place of birth is required', trigger: 'blur' },
    { min: 1, max: 255, message: 'Place of birth must be between 1 and 255 characters', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: 'Gender is required', trigger: 'change' }
  ],
  preferred_dedication_date: [
    {
      validator: (rule, value, callback) => {
        // Only required for admin/staff users
        if (!isMemberUser.value && (!value || !value.trim())) {
          callback(new Error('Preferred dedication date is required'))
          return
        }
        // If value is provided, validate it's not in the past
        if (value && value.trim()) {
          const preferredDate = new Date(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          preferredDate.setHours(0, 0, 0, 0)
          
          if (preferredDate < today) {
            callback(new Error('Preferred dedication date cannot be in the past'))
            return
          }
          
          // Check if date is too far in the future (more than 1 year)
          const maxDate = new Date()
          maxDate.setFullYear(today.getFullYear() + 1)
          if (preferredDate > maxDate) {
            callback(new Error('Preferred dedication date cannot be more than 1 year in the future'))
            return
          }
        }
        callback()
      },
      trigger: ['change', 'blur']
    }
  ],
  preferred_dedication_time: [
    {
      validator: async (rule, value, callback) => {
        // Only required for admin/staff users
        if (!isMemberUser.value && (!value || !value.trim())) {
          callback(new Error('Preferred dedication time is required'))
          return
        }
        // If value is provided, validate it's within business hours
        if (value && value.trim()) {
          const [hours, minutes] = value.split(':').map(Number)
          const totalMinutes = hours * 60 + minutes

          // Business hours: 8:00 AM to 6:00 PM
          const startMinutes = 8 * 60 // 8:00 AM
          const endMinutes = 18 * 60 // 6:00 PM

          if (totalMinutes < startMinutes || totalMinutes > endMinutes) {
            callback(new Error('Preferred dedication time must be between 8:00 AM and 6:00 PM'))
            return
          }

          // Additional validation: check if time slot is already booked
          if (formData.preferred_dedication_date) {
            const isValid = await validateTimeSlot(
              formData.preferred_dedication_date,
              value,
              isEditMode.value ? props.dedicationData?.child_id : null
            )
            
            if (!isValid) {
              callback(new Error('This time slot is already booked. Please choose a different time.'))
              return
            }
          }
        }
        callback()
      },
      trigger: ['change', 'blur']
    }
  ],
  contact_phone_number: [
    // Contact phone is optional - no validation required
  ],
  contact_email: [
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' },
    { max: 255, message: 'Email must not exceed 255 characters', trigger: 'blur' }
  ],
  contact_address: [
    // Contact address is optional - no validation required
  ],
  sponsors: [
    {
      validator: (rule, value, callback) => {
        if (!Array.isArray(value)) {
          callback()
          return
        }

        // Sponsors are optional, but if provided, validate each entry
        for (let i = 0; i < value.length; i++) {
          const s = value[i] || {}
          // If any field is filled, require firstname, lastname, phone_number, and address
          if (s.firstname || s.lastname || s.phone_number || s.address) {
            if (!s.firstname || !s.firstname.trim() || !s.lastname || !s.lastname.trim() || !s.phone_number || !s.phone_number.trim() || !s.address || !s.address.trim()) {
              callback(new Error(`Sponsor ${i + 1}: firstname, lastname, phone number, and address are required if sponsor is added`))
              return
            }
          }
        }

        callback()
      },
      trigger: 'change'
    }
  ],
  pastor: [
    {
      validator: (rule, value, callback) => {
        // Only require pastor for admin/staff users
        if (!isMemberUser.value && (!value || !value.trim())) {
          callback(new Error('Pastor is required'))
          return
        }
        if (value && value.length > 255) {
          callback(new Error('Pastor name must not exceed 255 characters'))
          return
        }
        callback()
      },
      trigger: ['change', 'blur']
    }
  ],
  location: [
    {
      validator: (rule, value, callback) => {
        // Only require location for admin/staff users
        if (!isMemberUser.value && (!value || !value.trim())) {
          callback(new Error('Location is required'))
          return
        }
        if (value && value.length > 255) {
          callback(new Error('Location must not exceed 255 characters'))
          return
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  status: [
    {
      validator: (rule, value, callback) => {
        // Only require status for admin/staff users
        if (!isMemberUser.value && (!value || !value.trim())) {
          callback(new Error('Status is required'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

// Watch for dedicationData changes to populate form in edit mode
watch(() => props.dedicationData, (newData) => {
  if (newData && props.modelValue) {
    formData.requested_by = newData.requested_by || ''
    formData.child_firstname = newData.child_firstname || ''
    formData.child_lastname = newData.child_lastname || ''
    formData.child_middle_name = newData.child_middle_name || ''
    // Ensure date_of_birth is in YYYY-MM-DD format
    formData.date_of_birth = newData.date_of_birth ? (() => {
      try {
        const date = new Date(newData.date_of_birth)
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
      } catch (e) {
        return ''
      }
    })() : ''
    formData.place_of_birth = newData.place_of_birth || ''
    formData.gender = newData.gender || ''
    formData.preferred_dedication_date = newData.preferred_dedication_date || ''
    formData.preferred_dedication_time = newData.preferred_dedication_time || ''
    formData.contact_phone_number = newData.contact_phone_number || ''
    formData.contact_email = newData.contact_email || ''
    formData.contact_address = newData.contact_address || ''
    formData.father_firstname = newData.father_firstname || ''
    formData.father_lastname = newData.father_lastname || ''
    formData.father_middle_name = newData.father_middle_name || ''
    formData.father_phone_number = newData.father_phone_number || ''
    formData.father_email = newData.father_email || ''
    formData.father_address = newData.father_address || ''
    formData.mother_firstname = newData.mother_firstname || ''
    formData.mother_lastname = newData.mother_lastname || ''
    formData.mother_middle_name = newData.mother_middle_name || ''
    formData.mother_phone_number = newData.mother_phone_number || ''
    formData.mother_email = newData.mother_email || ''
    formData.mother_address = newData.mother_address || ''
    formData.sponsors = Array.isArray(newData.sponsors) && newData.sponsors.length > 0
      ? newData.sponsors.map(s => ({
          firstname: s.firstname || '',
          lastname: s.lastname || '',
          middle_name: s.middle_name || '',
          phone_number: s.phone_number || '',
          address: s.address || ''
        }))
      : []
    formData.pastor = newData.pastor || ''
    formData.location = newData.location || ''
    formData.status = newData.status || 'pending'
  }
}, { immediate: true })

// Watch for dialog open/close to reset or populate form
watch(() => props.modelValue, async (isOpen) => {
  if (!isOpen) {
    // Reset form when dialog closes
    resetForm()
    resetLoading()
  } else {
    // Refresh userInfo from localStorage using the helper function
    userInfo.value = getUserFromStorage()
    console.log('ChildDedicationDialog - User info:', userInfo.value)
    console.log('ChildDedicationDialog - User position:', userInfo.value?.account?.position)

    // Fetch member options, pastor options, and unavailable time slots when dialog opens
    await fetchMemberOptions()
    await fetchPastorOptions()
    await fetchUnavailableTimeSlots()

    if (props.dedicationData) {
      // Populate form when dialog opens in edit mode
      const data = props.dedicationData
      formData.requested_by = data.requested_by || ''
      formData.requester_relationship = data.requester_relationship || ''
      formData.child_firstname = data.child_firstname || ''
      formData.child_lastname = data.child_lastname || ''
      formData.child_middle_name = data.child_middle_name || ''
      // Ensure date_of_birth is in YYYY-MM-DD format
      formData.date_of_birth = data.date_of_birth ? (() => {
        try {
          const date = new Date(data.date_of_birth)
          return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
        } catch (e) {
          return ''
        }
      })() : ''
      formData.place_of_birth = data.place_of_birth || ''
      formData.gender = data.gender || ''
      formData.preferred_dedication_date = data.preferred_dedication_date || ''
      formData.preferred_dedication_time = data.preferred_dedication_time || ''
      formData.contact_phone_number = data.contact_phone_number || ''
      formData.contact_email = data.contact_email || ''
      formData.contact_address = data.contact_address || ''
      formData.father_firstname = data.father_firstname || ''
      formData.father_lastname = data.father_lastname || ''
      formData.father_middle_name = data.father_middle_name || ''
      formData.father_phone_number = data.father_phone_number || ''
      formData.father_email = data.father_email || ''
      formData.father_address = data.father_address || ''
      formData.mother_firstname = data.mother_firstname || ''
      formData.mother_lastname = data.mother_lastname || ''
      formData.mother_middle_name = data.mother_middle_name || ''
      formData.mother_phone_number = data.mother_phone_number || ''
      formData.mother_email = data.mother_email || ''
      formData.mother_address = data.mother_address || ''
      formData.sponsors = Array.isArray(data.sponsors) && data.sponsors.length > 0
        ? data.sponsors.map(s => ({
            firstname: s.firstname || '',
            lastname: s.lastname || '',
            middle_name: s.middle_name || '',
            phone_number: s.phone_number || '',
            address: s.address || ''
          }))
        : []
      formData.pastor = data.pastor || ''
      formData.location = data.location || ''
      formData.status = data.status || 'pending'

      // For edit mode, if admin/staff user, fetch the selected member's data
      if (!isMemberUser.value && data.requested_by) {
        try {
          const response = await axios.get(`/church-records/members/getMemberById/${data.requested_by}`)
          if (response.data.data) {
            selectedMemberData.value = response.data.data
          }
        } catch (error) {
          console.error('Error fetching member details for edit:', error)
        }
      }
    } else {
      // Reset form for add mode
      resetForm()

      // Auto-fill requested_by if user is a member
      if (isMemberUser.value && userInfo.value?.member?.member_id) {
        formData.requested_by = userInfo.value.member.member_id

        // Check if member already has a pending child dedication request
        try {
          const response = await axios.get(`/church-records/child-dedications/getChildDedicationsByRequester/${userInfo.value.member.member_id}`)
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            // Find the most recent pending request
            const pendingDedication = response.data.data.find(d => d.status === 'pending')
            if (pendingDedication) {
              // Instead of pre-populating in add mode, emit an event to switch to edit mode
              // This will allow the parent component to reopen the dialog in edit mode
              emit('switch-to-edit', pendingDedication)
              return // Exit early, dialog will be reopened in edit mode
            }
          }
        } catch (error) {
          console.error('Error checking for existing child dedication:', error)
          // Continue with empty form if check fails
        }
      }
    }
  }
})

// Fetch member and pastor options when component mounts
onMounted(async () => {
  // Initialize userInfo from localStorage
  userInfo.value = getUserFromStorage()

  await fetchMemberOptions()
  await fetchPastorOptions()
  await fetchUnavailableTimeSlots()
})

// Reset form
const resetForm = () => {
  formData.requested_by = ''
  formData.requester_relationship = ''
  formData.child_firstname = ''
  formData.child_lastname = ''
  formData.child_middle_name = ''
  formData.date_of_birth = ''
  formData.place_of_birth = ''
  formData.gender = ''
  formData.preferred_dedication_date = ''
  formData.preferred_dedication_time = ''
  formData.contact_phone_number = ''
  formData.contact_email = ''
  formData.contact_address = ''
  formData.father_firstname = ''
  formData.father_lastname = ''
  formData.father_middle_name = ''
  formData.father_phone_number = ''
  formData.father_email = ''
  formData.father_address = ''
  formData.mother_firstname = ''
  formData.mother_lastname = ''
  formData.mother_middle_name = ''
  formData.mother_phone_number = ''
  formData.mother_email = ''
  formData.mother_address = ''
  formData.sponsors = []
  formData.pastor = ''
  formData.location = ''
  formData.status = 'pending'

  // Clear selected member data
  selectedMemberData.value = null

  // Clear validation
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// Handle close
const handleClose = () => {
  emit('update:modelValue', false)
}

// Handle submit - Comprehensive error trapping that stops process on any error
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    console.log('Starting child dedication submission process...')

    // STEP 1: Check for duplicate child dedication - STOP PROCESS if found
    console.log('Step 1: Checking for duplicate child dedication...')
    if (formData.requested_by && formData.child_firstname && formData.child_lastname && formData.date_of_birth) {
      try {
        const checkResponse = await axios.get('/church-records/child-dedications/check-duplicate', {
          params: {
            requested_by: formData.requested_by,
            child_firstname: formData.child_firstname.trim(),
            child_lastname: formData.child_lastname.trim(),
            date_of_birth: formData.date_of_birth,
            exclude_child_id: isEditMode.value ? props.dedicationData?.child_id : null
          }
        })

        if (checkResponse.data.success && checkResponse.data.data && checkResponse.data.data.exists) {
          const existingDedication = checkResponse.data.data.dedication
          ElMessage.error({
            message: `Duplicate Found: A child dedication request for "${formData.child_firstname} ${formData.child_lastname}" (DOB: ${formData.date_of_birth}) already exists from this member. Process stopped.`,
            duration: 8000,
            showClose: true
          })
          console.log('Process STOPPED: Duplicate child dedication found')
          return // STOP PROCESS - Do not proceed with submission
        }
      } catch (checkError) {
        // If the error indicates duplicate exists, show the error message and stop
        if (checkError.response?.data?.message && checkError.response.data.message.includes('already exists')) {
          ElMessage.error({
            message: `Duplicate Error: ${checkError.response.data.message}. Process stopped.`,
            duration: 8000,
            showClose: true
          })
          console.log('Process STOPPED: Duplicate error from server')
          return // STOP PROCESS - Do not proceed with submission
        }
        // For other errors, log but continue with form validation
        console.error('Error checking for duplicates:', checkError)
      }
    }
    console.log('Step 1 completed: No duplicates found')

    // STEP 2: Time slot validation for admin/staff users - STOP PROCESS if booked
    console.log('Step 2: Checking time slot availability...')
    if (!isMemberUser.value && formData.preferred_dedication_date && formData.preferred_dedication_time) {
      try {
        const timeCheckResponse = await axios.get('/church-records/child-dedications/check-time-slot', {
          params: {
            preferred_dedication_date: formData.preferred_dedication_date,
            preferred_dedication_time: formData.preferred_dedication_time,
            exclude_id: isEditMode.value ? props.dedicationData?.child_id : null
          }
        })

        if (timeCheckResponse.data.success && timeCheckResponse.data.data && timeCheckResponse.data.data.isBooked) {
          const conflictingDedication = timeCheckResponse.data.data.conflictingDedication
          ElMessage.warning({
            message: `Time Slot Conflict: The selected time slot (${formData.preferred_dedication_date} at ${formData.preferred_dedication_time}) is already booked. Proceeding with submission.`,
            duration: 8000,
            showClose: true
          })
          console.log('Warning: Time slot already booked, but proceeding')
          // Continue with submission
        }
      } catch (timeError) {
        console.error('Error checking time slot availability:', timeError)
        // Continue with submission even if time check fails
      }
    }
    console.log('Step 2 completed: Time slot available')

    // STEP 3: Form validation - STOP PROCESS if validation fails
    console.log('Step 3: Validating form data...')
    try {
      await formRef.value.validate()
      console.log('Step 3 completed: Form validation passed')
    } catch (validationError) {
      console.log('Process STOPPED: Form validation failed')
      throw validationError // Re-throw to be caught by outer catch block
    }

    // STEP 4: User confirmation - STOP PROCESS if cancelled
    console.log('Step 4: Waiting for user confirmation...')
    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'

    try {
      await ElMessageBox.confirm(
        `Are you sure you want to ${actionText} this child dedication request?`,
        `Confirm ${actionTitle} Child Dedication Request`,
        {
          confirmButtonText: actionTitle,
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
      )
      console.log('Step 4 completed: User confirmed submission')
    } catch (confirmError) {
      console.log('Process STOPPED: User cancelled submission')
      throw confirmError // Re-throw to be caught by outer catch block
    }

    // STEP 5: Prepare and submit data
    console.log('Step 5: Preparing and submitting data...')
    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.child-dedication-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })

    // Prepare data for submission
    const submitData = {
      requested_by: formData.requested_by.trim(),
      requester_relationship: formData.requester_relationship,
      child_firstname: formData.child_firstname.trim(),
      child_lastname: formData.child_lastname.trim(),
      child_middle_name: formData.child_middle_name ? formData.child_middle_name.trim() : null,
      date_of_birth: formData.date_of_birth,
      place_of_birth: formData.place_of_birth.trim(),
      gender: formData.gender,
      preferred_dedication_date: formData.preferred_dedication_date || null,
      preferred_dedication_time: formData.preferred_dedication_time || null,
      contact_phone_number: formData.contact_phone_number.trim(),
      contact_email: formData.contact_email ? formData.contact_email.trim() : null,
      contact_address: formData.contact_address.trim(),
      father_firstname: formData.father_firstname ? formData.father_firstname.trim() : null,
      father_lastname: formData.father_lastname ? formData.father_lastname.trim() : null,
      father_middle_name: formData.father_middle_name ? formData.father_middle_name.trim() : null,
      father_phone_number: formData.father_phone_number ? formData.father_phone_number.trim() : null,
      father_email: formData.father_email ? formData.father_email.trim() : null,
      father_address: formData.father_address ? formData.father_address.trim() : null,
      mother_firstname: formData.mother_firstname ? formData.mother_firstname.trim() : null,
      mother_lastname: formData.mother_lastname ? formData.mother_lastname.trim() : null,
      mother_middle_name: formData.mother_middle_name ? formData.mother_middle_name.trim() : null,
      mother_phone_number: formData.mother_phone_number ? formData.mother_phone_number.trim() : null,
      mother_email: formData.mother_email ? formData.mother_email.trim() : null,
      mother_address: formData.mother_address ? formData.mother_address.trim() : null,
      sponsors: formData.sponsors && formData.sponsors.length > 0
        ? formData.sponsors.map(s => ({
            firstname: s.firstname ? s.firstname.trim() : '',
            lastname: s.lastname ? s.lastname.trim() : '',
            middle_name: s.middle_name ? s.middle_name.trim() : '',
            phone_number: s.phone_number ? s.phone_number.trim() : '',
            address: s.address ? s.address.trim() : ''
          })).filter(s => s.firstname && s.lastname && s.phone_number && s.address) // Only include complete sponsors
        : [],
      status: formData.status
    }

    // Only include pastor and location for admin/staff users
    if (!isMemberUser.value) {
      submitData.pastor = formData.pastor ? formData.pastor.trim() : null
      submitData.location = formData.location ? formData.location.trim() : null
    }

    // Emit submit event with data
    console.log('Submitting child dedication data...')
    emit('submit', submitData)

    // Reset form fields after submission
    // Parent component will handle API call and close dialog on success
    resetForm()
    console.log('Process COMPLETED: Child dedication submitted successfully')

  } catch (error) {
    // Reset loading state
    resetLoading()

    if (error !== 'cancel') {
      console.error('Process STOPPED due to error:', error)
      ElMessage.error({
        message: 'Submission failed: Please check all required fields and try again. Process stopped.',
        duration: 6000,
        showClose: true
      })
    } else {
      console.log('Process STOPPED: User cancelled submission')
    }
  }
}

// Sponsor helpers
const addSponsor = () => {
  formData.sponsors.push({
    firstname: '',
    lastname: '',
    middle_name: '',
    phone_number: '',
    address: ''
  })

  if (formRef.value) {
    formRef.value.validateField('sponsors')
  }
}

const removeSponsor = (index) => {
  if (formData.sponsors.length > 0) {
    formData.sponsors.splice(index, 1)

    if (formRef.value) {
      formRef.value.validateField('sponsors')
    }
  }
}

const onSponsorsChange = () => {
  if (formRef.value) {
    formRef.value.validateField('sponsors')
  }
}

// Expose method to reset loading (can be called by parent component on API error)
const resetLoading = () => {
  loading.value = false
  // Close loading overlay if it exists
  if (loadingInstanceRef.value) {
    try {
      loadingInstanceRef.value.close()
    } catch (e) {
      // Ignore if already closed
    }
    loadingInstanceRef.value = null
  }
}

// Expose methods for parent component
defineExpose({
  resetLoading,
  resetForm,
  fetchUnavailableTimeSlots,
  validateTimeSlot
})
</script>

<style scoped>
.child-dedication-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.child-dedication-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.child-dedication-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.required {
  color: #ef4444;
}

.required-text {
  color: #ef4444;
  font-size: 0.6rem;
  font-weight: 500;
  margin-left: 0px;
}

.child-dedication-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.child-dedication-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.child-dedication-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.child-dedication-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.child-dedication-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.child-dedication-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.child-dedication-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.child-dedication-dialog :deep(.el-date-editor.el-input) {
  width: 100%;
}

.child-dedication-dialog :deep(.el-radio-group) {
  display: flex;
  gap: 24px;
}

.child-dedication-dialog :deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 600;
  color: #14b8a6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
  min-width: 100px;
}

.dialog-footer .el-button--primary {
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.dialog-footer .el-button--primary:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

.sponsors-table-wrapper {
  width: 100%;
  margin-top: 8px;
}

.sponsors-table {
  width: 100%;
}

.sponsors-table :deep(.el-table__body-wrapper) {
  max-height: 300px;
  overflow-y: auto;
}

.sponsors-table :deep(.el-table__header-wrapper) {
  background-color: #f5f7fa;
}

.sponsors-table :deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  text-align: left;
}

.sponsors-table :deep(.el-table td) {
  padding: 8px 0;
}

.sponsors-table :deep(.el-table .el-input__wrapper) {
  border-radius: 4px;
}

.sponsors-table :deep(.el-table .el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.sponsors-table :deep(.el-table .el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.sponsor-add-row {
  margin-top: 12px;
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 960px) {
  .child-dedication-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto !important;
    max-height: 90vh;
  }

  .child-dedication-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .child-dedication-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }

  .child-dedication-dialog :deep(.el-dialog__header) {
    padding: 16px;
  }

  .child-dedication-dialog :deep(.el-dialog__title) {
    font-size: 1rem;
  }

  .child-dedication-dialog :deep(.el-dialog__body) {
    padding: 12px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
  }

  .child-dedication-dialog :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .child-dedication-dialog :deep(.el-form-item__label) {
    font-size: 0.875rem;
    padding-bottom: 4px;
    line-height: 1.4;
  }

  .child-dedication-dialog :deep(.el-input),
  .child-dedication-dialog :deep(.el-select),
  .child-dedication-dialog :deep(.el-date-editor) {
    width: 100%;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
    padding: 12px 0;
  }

  .dialog-footer .el-button {
    width: 100%;
    min-width: auto;
    margin: 0;
  }

  .sponsors-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .sponsors-table :deep(.el-table) {
    font-size: 0.75rem;
    min-width: 600px;
  }

  .sponsors-table :deep(.el-table th),
  .sponsors-table :deep(.el-table td) {
    padding: 4px 2px;
    font-size: 0.75rem;
  }
}
</style>
