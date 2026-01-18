<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Burial Service' : (userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff' ? 'New Burial Service' : 'Request Burial Service')"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="burial-service-dialog"
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

      <!-- Requester Name (Required for Admin/Staff when no member selected) -->
      <el-form-item label="Requester Name" prop="requester_name" v-if="userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff'">
        <template #label>
          <span>{{ isMemberSelected ? 'Member' : 'Requester Name' }}<span v-if="!isMemberSelected" class="required-text"></span></span>
        </template>
        <el-input
          v-model="formData.requester_name"
          :placeholder="formData.member_id ? 'Auto-filled from member' : 'Enter requester full name'"
          size="large"
          clearable
          :disabled="loading || (formData.member_id && formData.member_id !== '')"
        />
      </el-form-item>

      <!-- Requester Email (Required for Admin/Staff when no member selected) -->
      <el-form-item label="Requester Email" prop="requester_email" v-if="userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff'">
        <template #label>
          <span>{{ isMemberSelected ? 'Member Email' : 'Requester Email' }}<span v-if="!isMemberSelected" class="required-text"></span></span>
        </template>
        <el-input
          v-model="formData.requester_email"
          type="email"
          :placeholder="formData.member_id ? 'Auto-filled from member' : 'Enter requester email address'"
          size="large"
          clearable
          :disabled="loading || (formData.member_id && formData.member_id !== '')"
        />
      </el-form-item>

      <!-- Requester Name (For Member Users) -->
      <el-form-item prop="requester_name" v-else-if="isMember">
        <template #label>
          <span>Requester Name <span class="required-text">required</span></span>
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
          <span>Requester Email <span class="required-text">required</span></span>
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
          <span>Requester Name <span class="required-text">required</span></span>
        </template>
        <el-input
          v-model="formData.requester_name"
          placeholder="Enter your full name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Requester Email (For Non-Member Users) -->
      <el-form-item prop="requester_email" v-else-if="!userInfo?.account?.member_id">
        <template #label>
          <span>Requester Email <span class="required-text">required</span></span>
        </template>
        <el-input
          v-model="formData.requester_email"
          type="email"
          placeholder="Enter your email address"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

     <!-- Deceased Name -->
     <el-form-item prop="deceased_name">
       <template #label>
         <span>Deceased Name <span v-if="isMember" class="required-text">required</span></span>
       </template>
       <el-input
         v-model="formData.deceased_name"
         placeholder="Enter deceased full name"
         size="large"
         clearable
         :disabled="loading"
       />
     </el-form-item>

     <!-- Deceased Birthdate -->
     <el-form-item prop="deceased_birthdate">
       <template #label>
         <span>Deceased Birthdate <span v-if="isMember" class="required-text">required</span></span>
       </template>
       <el-date-picker
         v-model="formData.deceased_birthdate"
         type="date"
         placeholder="Select birthdate"
         size="large"
         format="YYYY-MM-DD"
         style="width: 100%"
         :disabled="loading"
       />
     </el-form-item>

     <!-- Date of Death -->
     <el-form-item prop="date_death">
       <template #label>
         <span>Date of Death <span v-if="isMember" class="required-text">required</span></span>
       </template>
       <el-date-picker
         v-model="formData.date_death"
         type="datetime"
         placeholder="Select date and time of death"
         size="large"
         format="YYYY-MM-DD HH:mm"
         style="width: 100%"
         :disabled="loading"
       />
     </el-form-item>

     <!-- Relationship -->
     <el-form-item prop="relationship">
       <template #label>
         <span>Relationship <span v-if="isMember" class="required-text">required</span></span>
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
         <span>Location <span v-if="isMember" class="required-text">required</span></span>
       </template>
       <el-input
         v-model="formData.location"
         placeholder="Enter service location"
         size="large"
         clearable
         :disabled="loading"
       />
     </el-form-item>

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

     <!-- Service Date & Time (Admin/Staff Only - Required) -->
     <el-form-item label="Service Date & Time" prop="service_date" v-if="userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff'">
       <template #label>
         <span>Service Date & Time</span>
       </template>
       <el-date-picker
         v-model="formData.service_date"
         type="datetime"
         placeholder="Select service date and time"
         size="large"
         format="YYYY-MM-DD HH:mm"
         style="width: 100%"
         :disabled="loading"
         :disabled-date="(date) => date < new Date()"
         @change="onServiceDateChange"
       />
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
         {{ isEditMode ? 'Update' : userInfo?.account?.position === 'admin' || userInfo?.account?.position === 'staff' ? 'Add' : 'Send' }} Request
       </el-button>
     </div>
   </template>
 </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useBurialServiceStore } from '@/stores/ServicesRecords/burialServiceStore'
import axios from '@/api/axios'

const burialServiceStore = useBurialServiceStore()

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

// Fetch options on mount
onMounted(async () => {
  await Promise.all([
    burialServiceStore.fetchMemberOptions(),
    burialServiceStore.fetchPastorOptions(),
    fetchUnavailableTimeSlots()
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

// Check if current user is a member (not admin/staff)
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
  relationship: '',
  location: '',
  pastor_name: null,
  service_date: null,
  status: 'pending'
})

// Status options - standardized: pending, approved, disapproved, completed, cancelled
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Disapproved', value: 'disapproved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

// Validation rules
const rules = computed(() => {
  const baseRules = {
    member_id: [
      { required: false, message: 'Member is optional for admin/staff', trigger: 'change' }
    ],
    deceased_name: [
      { required: true, message: 'Deceased name is required', trigger: 'blur' },
      { min: 2, max: 100, message: 'Deceased name must be between 2 and 100 characters', trigger: 'blur' }
    ],
    deceased_birthdate: [
      { required: true, message: 'Deceased birthdate is required', trigger: 'change' }
    ],
    date_death: [
      { required: true, message: 'Date of death is required', trigger: 'change' }
    ],
    relationship: [
      { required: true, message: 'Relationship is required', trigger: 'change' }
    ],
    location: [
      { required: true, message: 'Location is required', trigger: 'blur' },
      { min: 3, max: 150, message: 'Location must be between 3 and 150 characters', trigger: 'blur' }
    ],
    service_date: [
      { required: true, message: 'Service date is required', trigger: 'change' },
      {
        validator: async (rule, value, callback) => {
          // Only validate if date is provided
          if (value) {
            const isValid = await validateTimeSlot(
              value,
              isEditMode.value ? props.burialServiceData?.burial_id : null
            )

            if (!isValid) {
              callback(new Error('This date is already booked. Please choose a different date.'))
              return
            }
          }
          callback()
        },
        trigger: ['change', 'blur']
      }
    ],
    status: [
      { required: true, message: 'Status is required', trigger: 'change' },
      { max: 50, message: 'Status must not exceed 50 characters', trigger: 'blur' }
    ]
  };

  // Add requester validation rules based on user type
  if (userInfo.value?.account?.position === 'admin' || userInfo.value?.account?.position === 'staff') {
    // For admin/staff: required only when no member is selected
    baseRules.requester_name = [
      {
        required: !isMemberSelected.value,
        message: 'Requester name is required when no member is selected',
        trigger: 'blur'
      },
      { min: 2, max: 100, message: 'Requester name must be between 2 and 100 characters', trigger: 'blur' }
    ];
    baseRules.requester_email = [
      {
        required: !isMemberSelected.value,
        message: 'Requester email is required when no member is selected',
        trigger: 'blur'
      },
      { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
    ];
  } else if (!userInfo.value?.account?.member_id) {
    // For non-member users, requester fields are required
    baseRules.requester_name = [
      { required: true, message: 'Requester name is required', trigger: 'blur' },
      { min: 2, max: 100, message: 'Requester name must be between 2 and 100 characters', trigger: 'blur' }
    ];
    baseRules.requester_email = [
      { required: true, message: 'Requester email is required', trigger: 'blur' },
      { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
    ];
  } else {
    // For member users
    baseRules.requester_name = [
      { required: true, message: 'Requester name is required', trigger: 'blur' },
      { min: 2, max: 100, message: 'Requester name must be between 2 and 100 characters', trigger: 'blur' }
    ];
    baseRules.requester_email = [
      { required: true, message: 'Requester email is required', trigger: 'blur' },
      { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
    ];
  }

  return baseRules;
});

// Handle service date change - show immediate toast notification for conflicts and update status
const onServiceDateChange = async (date) => {
  // First update status based on date change
  updateStatusFromServiceDate()

  // Then check for time slot conflicts if date is selected
  if (date) {
    try {
      const isValid = await validateTimeSlot(
        date,
        isEditMode.value ? props.burialServiceData?.burial_id : null
      )

      if (!isValid) {
        // Show immediate toast notification
        ElMessage.error({
          message: `Service date conflict: ${date.split('T')[0]} is already booked. Please choose a different date.`,
          duration: 5000, // Show for 5 seconds
          showClose: true,
          dangerouslyUseHTMLString: false
        })
      }
    } catch (error) {
      console.error('Error validating service date:', error)
      // Don't show error to user for validation failures, just log
    }
  }
}

// Update status based on service date
const updateStatusFromServiceDate = () => {
  if (!formData.service_date) {
    formData.status = 'pending'
    return
  }

  const serviceDate = new Date(formData.service_date)
  const now = new Date()

  if (isNaN(serviceDate.getTime())) {
    formData.status = 'pending'
    return
  }

  // If service date is in the future, set to 'approved' (scheduled)
  if (serviceDate.getTime() > now.getTime()) {
    formData.status = 'approved'
  } else {
    // Past date - service should be completed
    formData.status = 'completed'
  }
}

// Watch for burialServiceData changes to populate form in edit mode
watch(
  () => props.burialServiceData,
  (newData) => {
    if (newData && props.modelValue) {
      console.log('Burial service data received:', newData)
      console.log('Requester name from data:', newData.requester_name)
      console.log('Requester email from data:', newData.requester_email)
      console.log('Deceased birthdate from data:', newData.deceased_birthdate)
      formData.member_id = newData.member_id ?? null
      formData.requester_name = newData.requester_name || ''
      formData.requester_email = newData.requester_email || ''
      formData.deceased_name = newData.deceased_name || ''
      formData.deceased_birthdate = newData.deceased_birthdate || null
      formData.date_death = newData.date_death ? new Date(newData.date_death.replace(' ', 'T')) : null
      formData.relationship = newData.relationship || ''
      formData.location = newData.location || ''
      formData.pastor_name = newData.pastor_name ?? null
      formData.service_date = newData.service_date && newData.service_date.includes(' ') ? new Date(newData.service_date.replace(' ', 'T')) : (newData.service_date ? new Date(newData.service_date) : null)
      formData.status = newData.status || 'pending'
    }
  },
  { immediate: true }
)

// Watch dialog open/close to reset or populate form
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      resetForm()
      resetLoading()
    } else {
      await Promise.all([
        burialServiceStore.fetchMemberOptions(),
        burialServiceStore.fetchPastorOptions(),
        fetchUnavailableTimeSlots()
      ])
      await fetchMemberInfo()
      
      if (props.burialServiceData) {
        const data = props.burialServiceData
        console.log('Dialog opened with data:', data)
        console.log('Requester name from dialog data:', data.requester_name)
        console.log('Requester email from dialog data:', data.requester_email)
        console.log('Deceased birthdate from dialog data:', data.deceased_birthdate)
        formData.member_id = data.member_id ?? null
        formData.requester_name = data.requester_name || ''
        formData.requester_email = data.requester_email || ''
        formData.deceased_name = data.deceased_name || ''
        formData.deceased_birthdate = data.deceased_birthdate || null
        formData.date_death = data.date_death ? new Date(data.date_death.replace(' ', 'T')) : null
        formData.relationship = data.relationship || ''
        formData.location = data.location || ''
        formData.pastor_name = data.pastor_name ?? null
        formData.service_date = data.service_date && data.service_date.includes(' ') ? new Date(data.service_date.replace(' ', 'T')) : (data.service_date ? new Date(data.service_date) : null)
        formData.status = data.status || 'pending'
      } else {
        resetForm()
        if (userInfo.value && userInfo.value.account && (userInfo.value.account.position === 'admin' || userInfo.value.account.position === 'staff')) {
          // For admin/staff users, clear requester info
          formData.requester_name = ''
          formData.requester_email = ''
        } else if (userInfo.value?.account?.member_id && userInfo.value.account.position !== 'admin' && userInfo.value.account.position !== 'staff') {
          // For member users, auto-populate their information
          const memberInfo = userInfo.value.member
          if (memberInfo) {
            formData.requester_name = `${memberInfo.firstname || ''} ${memberInfo.middle_name || ''} ${memberInfo.lastname || ''}`.trim()
            formData.requester_email = memberInfo.email || ''
          } else {
            // Fallback to account name if member info is not available
            formData.requester_name = `${userInfo.value.account.firstname || ''} ${userInfo.value.account.lastname || ''}`.trim() || userInfo.value.account.email || ''
            formData.requester_email = userInfo.value.account.email || ''
          }
        } else {
          // For non-member users, auto-populate with account info
          formData.requester_name = `${userInfo.value.account.firstname || ''} ${userInfo.value.account.lastname || ''}`.trim() || userInfo.value.account.email || ''
          formData.requester_email = userInfo.value.account.email || ''
        }
      }
    }
  }
)

// Handle member selection change
const handleMemberChange = (memberId) => {
  if (memberId && memberId !== '') {
    // Find the selected member
    const selectedMember = memberOptions.value.find(m => (m.id || m.member_id) === memberId)
    if (selectedMember) {
      // Auto-fill requester info from member
      formData.requester_name = selectedMember.name || `${selectedMember.firstname || ''} ${selectedMember.middle_name || ''} ${selectedMember.lastname || ''}`.trim()
      formData.requester_email = selectedMember.email || ''
    }
  } else {
    // Clear auto-filled info when no member selected
    formData.requester_name = ''
    formData.requester_email = ''
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
  formData.relationship = ''
  formData.location = ''
  formData.pastor_name = null
  formData.service_date = null
  formData.status = 'pending'

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// Handle close
const handleClose = () => {
  emit('update:modelValue', false)
}

// Handle submit
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // Check for duplicate burial service before validation
    // Check based on: member_id + deceased_name + deceased_birthdate
    if (formData.member_id && formData.deceased_name && formData.deceased_birthdate) {
      try {
        const birthdateStr = formData.deceased_birthdate instanceof Date && !isNaN(formData.deceased_birthdate.getTime())
          ? formData.deceased_birthdate.toISOString().split('T')[0]
          : null
        
        if (!birthdateStr) {
          console.error('Invalid deceased_birthdate for duplicate check')
        } else {
          const checkResponse = await axios.get('/church-records/burial-services/check-duplicate', {
            params: {
              member_id: String(formData.member_id),
              deceased_name: formData.deceased_name.trim(),
              deceased_birthdate: birthdateStr
            }
          })
        
          if (checkResponse.data.success && checkResponse.data.data && checkResponse.data.data.exists) {
            ElMessage.error(`A burial service request for "${formData.deceased_name}" (Birthdate: ${birthdateStr}) already exists from this member. Please check existing records or update the existing request instead.`)
            return
          }
        }
      } catch (checkError) {
        // If the error indicates duplicate exists, show the error message
        if (checkError.response?.data?.message && checkError.response.data.message.includes('already exists')) {
          ElMessage.error(checkError.response.data.message)
          return
        }
        // For other errors, log but continue with form validation
        console.error('Error checking for duplicates:', checkError)
      }
    }

    await formRef.value.validate()

    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'

    await ElMessageBox.confirm(
      `Are you sure you want to ${actionText} this burial service?`,
      `Confirm ${actionTitle} Burial Service`,
      {
        confirmButtonText: actionTitle,
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.burial-service-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })

    // Format dates properly for submission
    const formatDateForSubmission = (dateValue, isDateTime = false) => {
      if (!dateValue) return null
      try {
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) return null

        if (isDateTime) {
          // Format as YYYY-MM-DD HH:mm:ss in local timezone
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const seconds = String(date.getSeconds()).padStart(2, '0')
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        } else {
          // Format as YYYY-MM-DD
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
      } catch {
        return null
      }
    }

    const submitData = {}
    
    console.log('Form data before submit:', {
      member_id: formData.member_id,
      requester_name: formData.requester_name,
      requester_email: formData.requester_email,
      deceased_birthdate: formData.deceased_birthdate,
      date_death: formData.date_death,
      service_date: formData.service_date
    })
    
    // Get member_id: only from form selection (admin/staff) or for member users
    let finalMemberId = formData.member_id

    // For non-admin users, allow fetching member_id from their email if not already set
    if (!finalMemberId && userInfo.value?.account?.email &&
        userInfo.value.account.position !== 'admin' && userInfo.value.account.position !== 'staff') {
      // Fetch member_id in real-time from API using current logged-in user's email (only for member users)
      try {
        const memberResponse = await axios.get(`/church-records/members/getSpecificMemberByEmail/${userInfo.value.account.email}`)
        if (memberResponse.data?.success && memberResponse.data?.data?.member_id) {
          finalMemberId = String(memberResponse.data.data.member_id).trim()
          console.log('Real-time member_id fetched:', finalMemberId)
        }
      } catch (error) {
        console.warn('Could not fetch real-time member_id:', error.message)
        // Fallback to localStorage member_id if API call fails
        if (userInfo.value?.member?.member_id) {
          finalMemberId = String(userInfo.value.member.member_id).trim()
        }
      }
    }
    
    if (finalMemberId) submitData.member_id = finalMemberId

    // Always include requester info (required for backend processing)
    submitData.requester_name = formData.requester_name ? formData.requester_name.trim() : null
    submitData.requester_email = formData.requester_email ? formData.requester_email.trim() : null
    
    if (formData.deceased_name) submitData.deceased_name = formData.deceased_name.trim()
    if (formData.deceased_birthdate) {
      submitData.deceased_birthdate = formatDateForSubmission(formData.deceased_birthdate, false)
      console.log('Formatted deceased_birthdate:', submitData.deceased_birthdate)
    }
    if (formData.date_death) {
      submitData.date_death = formatDateForSubmission(formData.date_death, true)
      console.log('Formatted date_death:', submitData.date_death)
    }
    if (formData.relationship) submitData.relationship = formData.relationship
    if (formData.location) submitData.location = formData.location.trim()
    if (formData.pastor_name) submitData.pastor_name = String(formData.pastor_name).trim()
    if (formData.service_date) {
      submitData.service_date = formatDateForSubmission(formData.service_date, true)
      console.log('Formatted service_date:', submitData.service_date)
    }
    if (formData.status) submitData.status = formData.status
    
    console.log('Final submitData:', submitData)

    emit('submit', submitData)
    
    // Safety timeout: reset loading after 30 seconds if still loading
    // This prevents loading state from getting stuck if parent component fails silently
    setTimeout(() => {
      if (loading.value) {
        resetLoading()
      }
    }, 30000)
  } catch (error) {
    // Reset loading state
    resetLoading()
    
    if (error !== 'cancel') {
      console.error('Validation failed or submission cancelled:', error)
      ElMessage.error('Please fill in all required fields correctly or operation cancelled.')
    }
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
  resetLoading
})
</script>

<style scoped>
.burial-service-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.burial-service-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.burial-service-dialog :deep(.el-form-item__label) {
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
  margin-left: 4px;
}

.burial-service-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.burial-service-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.burial-service-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.burial-service-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.burial-service-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.burial-service-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.burial-service-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.burial-service-dialog :deep(.el-date-editor.el-input) {
  width: 100%;
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

@media (max-width: 960px) {
  .burial-service-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto !important;
    max-height: 90vh;
  }

  .burial-service-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .burial-service-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }

  .burial-service-dialog :deep(.el-dialog__header) {
    padding: 16px;
  }

  .burial-service-dialog :deep(.el-dialog__title) {
    font-size: 1rem;
  }

  .burial-service-dialog :deep(.el-dialog__body) {
    padding: 12px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
  }

  .burial-service-dialog :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .burial-service-dialog :deep(.el-form-item__label) {
    font-size: 0.875rem;
    padding-bottom: 4px;
    line-height: 1.4;
  }

  .burial-service-dialog :deep(.el-input),
  .burial-service-dialog :deep(.el-select),
  .burial-service-dialog :deep(.el-date-editor) {
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
}
</style>
