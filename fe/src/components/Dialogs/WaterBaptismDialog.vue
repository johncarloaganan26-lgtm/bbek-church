<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Water Baptism Record' : 'Add Water Baptism Record'"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="water-baptism-dialog"
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
    >
       <!-- Member Selection (Admin/Staff only) -->
       <el-form-item label="Member Name" prop="selected_member_id" v-if="!isEditMode">
         <el-select
           v-model="formData.selected_member_id"
           placeholder="Select existing member (optional)"
           size="large"
           style="width: 100%"
           clearable
           :disabled="loading"
           @change="onMemberSelect"
         >
           <el-option
             v-for="member in membersWithoutBaptism"
             :key="member.id"
             :label="member.name"
             :value="member.id"
           />
         </el-select>
       </el-form-item>

       <!-- Personal Information Section -->
       <el-divider content-position="left">Personal Information</el-divider>

      <!-- First Name -->
      <el-form-item label="First Name" prop="firstname">
        <el-input
          v-model="formData.firstname"
          placeholder="First Name"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Middle Name -->
      <el-form-item label="Middle Name">
        <el-input
          v-model="formData.middle_name"
          placeholder="Middle Name"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Last Name -->
      <el-form-item label="Last Name" prop="lastname">
        <el-input
          v-model="formData.lastname"
          placeholder="Last Name"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Birthdate -->
      <el-form-item label="Birthdate" prop="birthdate">
        <el-date-picker
          v-model="formData.birthdate"
          type="date"
          placeholder="Select birthdate"
          size="large"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Age -->
      <el-form-item label="Age">
        <el-input
          v-model.number="formData.age"
          type="number"
          placeholder="Age"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Gender -->
      <el-form-item label="Gender" prop="gender">
        <el-select
          v-model="formData.gender"
          placeholder="Select gender"
          size="large"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option label="Male" value="M" />
          <el-option label="Female" value="F" />
        </el-select>
      </el-form-item>

      <!-- Civil Status -->
      <el-form-item label="Civil Status">
        <el-select
          v-model="formData.civil_status"
          placeholder="Select civil status"
          size="large"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option label="Single" value="single" />
          <el-option label="Married" value="married" />
          <el-option label="Widowed" value="widowed" />
          <el-option label="Divorced" value="divorced" />
          <el-option label="Separated" value="separated" />
        </el-select>
      </el-form-item>

      <!-- Profession -->
      <el-form-item label="Profession">
        <el-input
          v-model="formData.profession"
          placeholder="Enter profession"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Desire Ministry -->
      <el-form-item label="Desire Ministry">
        <el-select
          v-model="formData.desire_ministry"
          placeholder="Select desired ministry"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
        >
          <el-option
            v-for="ministry in ministryOptions"
            :key="ministry.ministry_id"
            :label="ministry.ministry_name"
            :value="ministry.ministry_name"
          />
        </el-select>
      </el-form-item>

      <!-- Spouse Name (shown only if married) -->
      <el-form-item v-if="formData.civil_status === 'married'" label="Spouse Name">
        <el-input
          v-model="formData.spouse_name"
          placeholder="Enter spouse's full name"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Marriage Date (shown only if married) -->
      <el-form-item v-if="formData.civil_status === 'married'" label="Marriage Date">
        <el-date-picker
          v-model="formData.marriage_date"
          type="date"
          placeholder="Select marriage date"
          size="large"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Children Section (shown only if married) -->
      <template v-if="formData.civil_status === 'married'">
        <el-divider>Children Information</el-divider>
        <div class="children-section">
          <div v-for="(child, index) in formData.children" :key="index" class="child-item">
            <div class="child-header">
              <span class="child-number">Child {{ index + 1 }}</span>
              <el-button
                type="danger"
                size="small"
                @click="removeChild(index)"
                :disabled="loading"
              >
                Remove
              </el-button>
            </div>

            <el-form-item :label="`Name`" class="child-form-item">
              <el-input
                v-model="child.name"
                :placeholder="`Enter child ${index + 1} name`"
                size="large"
                :disabled="loading"
              />
            </el-form-item>

            <div class="child-row">
              <el-form-item label="Age" class="child-form-item">
                <el-input
                  v-model.number="child.age"
                  type="number"
                  placeholder="Age"
                  size="large"
                  :disabled="loading"
                />
              </el-form-item>

              <el-form-item label="Gender" class="child-form-item">
                <el-select
                  v-model="child.gender"
                  placeholder="Gender"
                  size="large"
                  :disabled="loading"
                >
                  <el-option label="Male" value="M" />
                  <el-option label="Female" value="F" />
                </el-select>
              </el-form-item>
            </div>

            <el-form-item label="Birthday" class="child-form-item">
              <el-date-picker
                v-model="child.birthday"
                type="date"
                placeholder="Select birthday"
                size="large"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled="loading"
              />
            </el-form-item>
          </div>

          <el-button
            type="primary"
            size="large"
            @click="addChild"
            :disabled="loading"
            class="add-child-btn"
          >
            <v-icon>add</v-icon>
            Add Child
          </el-button>
        </div>
      </template>

      <!-- Address -->
      <el-form-item label="Address" prop="address">
        <el-input
          v-model="formData.address"
          type="textarea"
          :rows="2"
          placeholder="Address"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Email -->
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          placeholder="Email"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Phone Number -->
      <el-form-item label="Phone Number">
        <el-input
          v-model="formData.phone_number"
          placeholder="Phone Number"
          size="large"
          style="width: 100%"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Baptism Details Section -->
      <el-divider content-position="left">Baptism Details</el-divider>

      <!-- Baptism Date and Time -->
      <div class="baptism-datetime-row">
        <el-form-item label="Baptism Date" prop="baptism_date" class="baptism-date-item">
          <el-date-picker
            v-model="formData.baptism_date"
            type="date"
            placeholder="Select baptism date"
            size="large"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            :disabled="loading"
            :disabled-date="(date) => date < new Date()"
            @change="onDateTimeChange"
          />
        </el-form-item>

        <el-form-item label="Baptism Time" class="baptism-time-item">
          <el-time-picker
            v-model="formData.baptism_time"
            placeholder="Select baptism time"
            size="large"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            style="width: 100%"
            :disabled="loading"
            clearable
            @change="onDateTimeChange"
          />
        </el-form-item>
      </div>

      <!-- Location -->
      <el-form-item label="Location" prop="location">
        <el-input
          v-model="formData.location"
          placeholder="Enter baptism location"
          size="large"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Pastor -->
      <el-form-item label="Pastor" prop="pastor_name">
        <el-select
          v-model="formData.pastor_name"
          placeholder="Select pastor"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
        >
          <el-option
            v-for="option in pastorOptions"
            :key="option.name"
            :label="option.name"
            :value="option.name"
          />
        </el-select>
      </el-form-item>

      <!-- Status -->
      <el-form-item label="Status" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="Select status"
          size="large"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.name"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- Guardian Name -->
      <el-form-item label="Guardian Name">
        <el-input
          v-model="formData.guardian_name"
          placeholder="Enter guardian's full name"
          size="large"
          :disabled="loading"
        />
      </el-form-item>

      <!-- Guardian Contact -->
      <el-form-item label="Guardian Contact">
        <el-input
          v-model="formData.guardian_contact"
          placeholder="Enter guardian's contact number"
          size="large"
          :disabled="loading"
        >
          <template #prepend>+63</template>
        </el-input>
      </el-form-item>

      <!-- Guardian Relationship -->
      <el-form-item label="Guardian Relationship">
        <el-select
          v-model="formData.guardian_relationship"
          placeholder="Select relationship"
          size="large"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option label="Parent" value="parent" />
          <el-option label="Grandparent" value="grandparent" />
          <el-option label="Sibling" value="sibling" />
          <el-option label="Guardian" value="guardian" />
          <el-option label="Other" value="other" />
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
          {{ isEditMode ? 'Update' : 'Add' }} Record
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useWaterBaptismStore } from '@/stores/ServicesRecords/waterBaptismStore'
import axios from '@/api/axios'

const waterBaptismStore = useWaterBaptismStore()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  baptismData: {
    type: Object,
    default: null
  }
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
  return '700px'
})

// Responsive label width
const labelWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '100px'
  } else if (window.innerWidth <= 960) {
    return '120px'
  }
  return '140px'
})

// Responsive label position
const labelPosition = computed(() => {
  return window.innerWidth <= 600 ? 'top' : 'left'
})

// Pastor options - will be fetched from API
const pastorOptions = computed(() => waterBaptismStore.pastorOptions || [])

// Ministry options - will be fetched from API
const ministryOptions = ref([])

// Members without baptism records
const membersWithoutBaptism = ref([])

// Unavailable time slots for scheduling
const unavailableTimeSlots = ref([])

// Fetch members without baptism records
const fetchMembersWithoutBaptism = async () => {
  try {
    const response = await axios.get('/church-records/members/getMembersWithoutBaptism')
    if (response.data.success && response.data.data) {
      membersWithoutBaptism.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching members without baptism:', error)
  }
}

// Fetch unavailable time slots for scheduling (same day allowed, same time blocked)
const fetchUnavailableTimeSlots = async () => {
  try {
    // Get all water baptisms with approved status to block time slots
    const response = await axios.get('/services/water-baptisms/getAllWaterBaptisms', {
      params: {
        status: 'approved', // Only get approved baptisms to block time slots
        limit: 1000 // Get enough records to cover scheduling
      }
    })

    if (response.data.success && response.data.data) {
      // Extract time slots that are already approved/scheduled
      const scheduledTimeSlots = []

      response.data.data.forEach(baptism => {
        if (baptism.baptism_date && baptism.baptism_time && baptism.status === 'approved') {
          // Add time slot for blocking (same day allowed, same time blocked)
          scheduledTimeSlots.push({
            date: baptism.baptism_date,
            time: baptism.baptism_time,
            id: baptism.baptism_id // For edit mode exception
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

// Enhanced time slot validation function
const validateTimeSlot = async (date, time, excludeId = null) => {
  if (!date || !time) return true

  try {
    const response = await axios.get('/services/water-baptisms/check-time-slot', {
      params: {
        baptism_date: date,
        baptism_time: time,
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

// Fetch ministry options
const fetchMinistryOptions = async () => {
  try {
    const response = await axios.get('/church-records/ministries/getAllMinistriesForSelect')
    if (response.data.success && response.data.data) {
      ministryOptions.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching ministry options:', error)
  }
}

// Fetch options when component mounts
onMounted(async () => {
  await Promise.all([
    waterBaptismStore.fetchPastorOptions(),
    fetchMembersWithoutBaptism(),
    fetchMinistryOptions(),
    fetchUnavailableTimeSlots()
  ])
})

// Check if in edit mode
const isEditMode = computed(() => !!props.baptismData)

// Status options
const statusOptions = [
  { name: 'Pending', value: 'pending' },
  { name: 'Approved', value: 'approved' },
  { name: 'Disapproved', value: 'disapproved' },
  { name: 'Completed', value: 'completed' },
  { name: 'Cancelled', value: 'cancelled' }
]

// Form data
const formData = reactive({
  baptism_id: '',
  selected_member_id: null, // For member selection
  baptism_date: null,
  baptism_time: null,
  location: '',
  pastor_name: '',
  status: 'pending', // Default status
  // Personal info (for both member and non-member)
  firstname: '',
  middle_name: '',
  lastname: '',
  birthdate: '',
  age: '',
  gender: '',
  civil_status: '',
  profession: '',
  spouse_name: '',
  marriage_date: null,
  children: [],
  desire_ministry: '',
  address: '',
  email: '',
  phone_number: '',
  guardian_name: '',
  guardian_contact: '',
  guardian_relationship: ''
})

// Validation rules
const rules = {
  firstname: [
    { required: true, message: 'First name is required', trigger: 'blur' }
  ],
  lastname: [
    { required: true, message: 'Last name is required', trigger: 'blur' }
  ],
  birthdate: [
    { required: true, message: 'Birthdate is required', trigger: 'change' }
  ],
  gender: [
    { required: true, message: 'Gender is required', trigger: 'change' }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' },
    {
      validator: async (rule, value, callback) => {
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          callback(new Error('Please enter a valid email'))
          return
        }
        
        // Check if email already exists in accounts
        try {
          const response = await axios.get(`/services/water-baptisms/check-email-exists?email=${encodeURIComponent(value)}`)
          if (!response.data.success && response.data.data?.exists) {
            callback(new Error('An account with this email already exists. Please use a different email.'))
          } else {
            callback()
          }
        } catch (error) {
          // If the check fails, allow the submission (backend will do final validation)
          console.error('Email check failed:', error)
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  address: [
    { required: true, message: 'Address is required', trigger: 'blur' }
  ],
  baptism_date: [
    { required: true, message: 'Baptism date is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('Baptism date is required'))
          return
        }
        const selectedDate = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        selectedDate.setHours(0, 0, 0, 0)
        
        // Check if date is in the past
        if (selectedDate < today) {
          callback(new Error('Baptism date cannot be in the past'))
          return
        }
        
        // Check if date is too far in the future (more than 5 years)
        const maxDate = new Date()
        maxDate.setFullYear(today.getFullYear() + 5)
        if (selectedDate > maxDate) {
          callback(new Error('Baptism date cannot be more than 5 years in the future'))
          return
        }
        
        callback()
      },
      trigger: 'change'
    }
  ],
  location: [
    { required: true, message: 'Location is required', trigger: 'blur' }
  ],
  pastor_name: [
    { required: true, message: 'Pastor is required', trigger: 'change' }
  ],
  baptism_time: [
    {
      validator: async (rule, value, callback) => {
        // Only validate if both date and time are provided
        if (formData.baptism_date && value) {
          const isValid = await validateTimeSlot(
            formData.baptism_date,
            value,
            isEditMode.value ? props.baptismData?.baptism_id : null
          )

          if (!isValid) {
            callback(new Error('This time slot is already booked. Please choose a different time.'))
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
    {
      validator: (rule, value, callback) => {
        if ((value === 'approved' || value === 'completed') && (!formData.baptism_date || !formData.baptism_date.trim())) {
          callback(new Error('Baptism date is required for approved/completed status'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

// Update status based on baptism date - automatic status management
const updateStatusFromBaptismDate = () => {
  if (!formData.baptism_date) {
    formData.status = 'pending'
    return
  }

  const baptismDate = new Date(formData.baptism_date)
  const now = new Date()

  if (isNaN(baptismDate.getTime())) {
    formData.status = 'pending'
    return
  }

  // Auto-set status based on date
  if (baptismDate.getTime() > now.getTime()) {
    formData.status = 'approved'  // Future date = approved/scheduled
  } else if (Math.abs(baptismDate.getTime() - now.getTime()) < 2 * 60 * 60 * 1000) {
    // Within 2 hours window considered ongoing
    formData.status = 'approved'  // Ongoing = approved
  } else {
    formData.status = 'completed'  // Past date = completed
  }
}

// Handle date/time change - show immediate toast notification for conflicts and update status
const onDateTimeChange = async (value) => {
  // First update status based on date change
  updateStatusFromBaptismDate()

  // Then check for time slot conflicts if both date and time are selected
  if (formData.baptism_date && formData.baptism_time) {
    try {
      const isValid = await validateTimeSlot(formData.baptism_date, formData.baptism_time, isEditMode.value ? props.baptismData?.baptism_id : null)

      if (!isValid) {
        // Show immediate toast notification
        ElMessage.error({
          message: `Time slot conflict: ${formData.baptism_date} at ${formData.baptism_time} is already booked. Please choose a different time.`,
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
}

// Handle member selection - auto-fill form
const onMemberSelect = async (memberId) => {
  if (!memberId) {
    // Clear form when no member selected
    clearMemberData()
    return
  }

  try {
    console.log('Fetching member details for ID:', memberId)
    // Fetch member details
    const response = await axios.get(`/church-records/members/getMemberById/${memberId}`)
    console.log('Member API response:', response.data)

    if (response.data.data) {
      const member = response.data.data
      console.log('Member data received:', member)

      // Auto-fill form with member data
      formData.firstname = member.firstname || ''
      formData.middle_name = member.middle_name || ''
      formData.lastname = member.lastname || ''
      formData.birthdate = member.birthdate || ''
      formData.age = member.age || ''
      formData.gender = member.gender || ''
      formData.civil_status = member.civil_status || ''
      formData.profession = member.profession || ''
      formData.spouse_name = member.spouse_name || ''
      formData.marriage_date = member.marriage_date || null
      formData.children = member.children ? (typeof member.children === 'string' ? JSON.parse(member.children) : member.children) : []
      formData.desire_ministry = member.desire_ministry || ''
      formData.address = member.address || ''
      formData.email = member.email || ''
      formData.phone_number = member.phone_number || ''

      console.log('Form data after auto-fill:', {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        birthdate: formData.birthdate
      })

      // Calculate age if birthdate exists but age is missing
      if (formData.birthdate && !formData.age) {
        calculateAge()
      }

      ElMessage.success('Member information loaded successfully')
    } else {
      console.error('API response has no data:', response.data)
      ElMessage.error('Failed to load member details - no data received')
    }
  } catch (error) {
    console.error('Error fetching member details:', error)
    console.error('Error response:', error.response?.data)
    ElMessage.error('Failed to load member details: ' + (error.response?.data?.error || error.message))
  }
}

// Clear member data when selection is cleared
const clearMemberData = () => {
  formData.firstname = ''
  formData.middle_name = ''
  formData.lastname = ''
  formData.birthdate = ''
  formData.age = ''
  formData.gender = ''
  formData.civil_status = ''
  formData.profession = ''
  formData.spouse_name = ''
  formData.marriage_date = null
  formData.children = []
  formData.desire_ministry = ''
  formData.address = ''
  formData.email = ''
  formData.phone_number = ''
}

// Calculate age based on birthdate
const calculateAge = () => {
  if (!formData.birthdate) {
    formData.age = ''
    return
  }

  const birthDate = new Date(formData.birthdate)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  formData.age = age >= 0 ? age : ''
}

// Add child
const addChild = () => {
  formData.children.push({
    name: '',
    age: null,
    gender: '',
    birthday: null
  })
}

// Remove child
const removeChild = (index) => {
  formData.children.splice(index, 1)
}

// Watch for birthdate changes to auto-calculate age
watch(() => formData.birthdate, () => {
  calculateAge()
})

// Watch for baptismData changes to populate form in edit mode
watch(() => props.baptismData, async (newData) => {
  if (newData && props.modelValue) {
    formData.baptism_id = newData.baptism_id || ''
    formData.baptism_date = newData.baptism_date || null
    formData.baptism_time = newData.baptism_time || null
    formData.location = newData.location || ''
    formData.pastor_name = newData.pastor_name || ''
    formData.status = newData.status || 'pending'
    formData.guardian_name = newData.guardian_name || ''
    formData.guardian_contact = newData.guardian_contact || ''
    formData.guardian_relationship = newData.guardian_relationship || ''

    // Populate personal info from the joined data (works for both member and non-member)
    formData.firstname = newData.firstname || ''
    formData.middle_name = newData.middle_name || ''
    formData.lastname = newData.lastname || ''
    formData.birthdate = newData.birthdate || ''
    formData.age = newData.age || ''
    formData.gender = newData.gender || ''
    formData.civil_status = newData.civil_status || ''
    formData.profession = newData.profession || ''
    formData.spouse_name = newData.spouse_name || ''
    formData.marriage_date = newData.marriage_date || null
    formData.children = newData.children ? (typeof newData.children === 'string' ? JSON.parse(newData.children) : newData.children) : []
    formData.desire_ministry = newData.desire_ministry || ''
    formData.address = newData.address || ''
    formData.email = newData.email || ''
    formData.phone_number = newData.phone_number || ''

    // Update status based on baptism date if not explicitly set
    if (!newData.status && formData.baptism_date) {
      updateStatusFromBaptismDate()
    }
  }
}, { immediate: true })

// Watch for dialog open/close to reset or populate form
watch(() => props.modelValue, async (isOpen) => {
  if (!isOpen) {
    // Reset form when dialog closes
    resetForm()
    resetLoading() // Reset loading when dialog closes
  } else {
    // Refresh options when dialog opens
    await Promise.all([
      waterBaptismStore.fetchPastorOptions(),
      fetchMembersWithoutBaptism(),
      fetchMinistryOptions(),
      fetchUnavailableTimeSlots()
    ])

    if (props.baptismData) {
      // Populate form when dialog opens in edit mode
      const data = props.baptismData
      formData.baptism_id = data.baptism_id || ''
      formData.baptism_date = data.baptism_date || null
      formData.baptism_time = data.baptism_time || null
      formData.location = data.location || ''
      formData.pastor_name = data.pastor_name || ''
      formData.status = data.status || 'pending'
      formData.guardian_name = data.guardian_name || ''
      formData.guardian_contact = data.guardian_contact || ''
      formData.guardian_relationship = data.guardian_relationship || ''

      // Populate personal info from the joined data (works for both member and non-member)
      formData.firstname = data.firstname || ''
      formData.middle_name = data.middle_name || ''
      formData.lastname = data.lastname || ''
      formData.birthdate = data.birthdate || ''
      formData.age = data.age || ''
      formData.gender = data.gender || ''
      formData.civil_status = data.civil_status || ''
      formData.profession = data.profession || ''
      formData.spouse_name = data.spouse_name || ''
      formData.marriage_date = data.marriage_date || null
      formData.children = data.children ? (typeof data.children === 'string' ? JSON.parse(data.children) : data.children) : []
      formData.desire_ministry = data.desire_ministry || ''
      formData.address = data.address || ''
      formData.email = data.email || ''
      formData.phone_number = data.phone_number || ''

      // Update status based on baptism date if not explicitly set
      if (!data.status && formData.baptism_date) {
        updateStatusFromBaptismDate()
      }
    } else {
      // Reset form for add mode
      resetForm()
    }
  }
})

// Reset form
const resetForm = () => {
  formData.baptism_id = ''
  formData.selected_member_id = null
  formData.baptism_date = null
  formData.baptism_time = null
  formData.location = ''
  formData.pastor_name = ''
  formData.status = 'pending' // Reset to default
  // Personal info
  formData.firstname = ''
  formData.middle_name = ''
  formData.lastname = ''
  formData.birthdate = ''
  formData.age = ''
  formData.gender = ''
  formData.civil_status = ''
  formData.profession = ''
  formData.spouse_name = ''
  formData.marriage_date = null
  formData.children = []
  formData.desire_ministry = ''
  formData.address = ''
  formData.email = ''
  formData.phone_number = ''
  formData.guardian_name = ''
  formData.guardian_contact = ''
  formData.guardian_relationship = ''

  // Clear validation
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
    // Validate form
    await formRef.value.validate()

    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'

    // Build confirmation message
    let confirmMessage = `Are you sure you want to ${actionText} this water baptism record?`
    if (formData.status === 'completed' && !isEditMode.value) {
      confirmMessage += '\n\nNote: Setting status to "Completed" will automatically create a member record and account for this person.'
    }

    await ElMessageBox.confirm(
      confirmMessage,
      `Confirm ${actionTitle} Water Baptism`,
      {
        confirmButtonText: actionTitle,
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.water-baptism-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })
    
    // Prepare data for submission
    const submitData = {
      baptism_id: formData.baptism_id || null,
      baptism_date: formData.baptism_date, // Required
      baptism_time: formData.baptism_time || null,
      location: formData.location?.trim() || null,
      pastor_name: formData.pastor_name || null,
      status: formData.status || 'pending',
      guardian_name: formData.guardian_name?.trim() || null,
      guardian_contact: formData.guardian_contact?.trim() || null,
      guardian_relationship: formData.guardian_relationship || null,
      // Personal info fields
      firstname: formData.firstname?.trim() || null,
      middle_name: formData.middle_name?.trim() || null,
      lastname: formData.lastname?.trim() || null,
      birthdate: formData.birthdate || null,
      age: formData.age || null,
      gender: formData.gender || null,
      civil_status: formData.civil_status || null,
      profession: formData.profession?.trim() || null,
      spouse_name: formData.spouse_name?.trim() || null,
      marriage_date: formData.marriage_date || null,
      children: formData.children.length > 0 ? JSON.stringify(formData.children) : null,
      desire_ministry: formData.desire_ministry?.trim() || null,
      address: formData.address?.trim() || null,
      email: formData.email?.trim() || null,
      phone_number: formData.phone_number?.trim() || null
    }


    // Emit submit event with data
    emit('submit', submitData)
    
    // Safety timeout: reset loading after 30 seconds if still loading
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
.water-baptism-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.water-baptism-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.water-baptism-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.water-baptism-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.water-baptism-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.water-baptism-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.water-baptism-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.water-baptism-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.water-baptism-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.water-baptism-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.water-baptism-dialog :deep(.el-date-editor.el-input) {
  width: 100%;
}

@media (max-width: 960px) {
  .water-baptism-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto !important;
    max-height: 90vh;
  }

  .water-baptism-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .water-baptism-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }

  .water-baptism-dialog :deep(.el-dialog__header) {
    padding: 16px;
  }

  .water-baptism-dialog :deep(.el-dialog__title) {
    font-size: 1rem;
  }

  .water-baptism-dialog :deep(.el-dialog__body) {
    padding: 12px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
  }

  .water-baptism-dialog :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .water-baptism-dialog :deep(.el-form-item__label) {
    font-size: 0.875rem;
    padding-bottom: 4px;
    line-height: 1.4;
  }

  .water-baptism-dialog :deep(.el-input),
  .water-baptism-dialog :deep(.el-select),
  .water-baptism-dialog :deep(.el-date-editor) {
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

/* Children Section Styles */
.children-section {
  margin-top: 16px;
}

.child-item {
  background: #f8fafc;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.child-number {
  font-weight: 600;
  color: #1f2937;
}

.child-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.child-form-item {
  margin-bottom: 12px;
}

.add-child-btn {
  width: 100%;
  margin-top: 12px;
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.add-child-btn:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

/* Baptism DateTime Row Styles */
.baptism-datetime-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.baptism-date-item {
  flex: 1;
}

.baptism-time-item {
  flex: 1;
}

@media (max-width: 640px) {
  .baptism-datetime-row {
    flex-direction: column;
    gap: 12px;
  }

  .baptism-date-item,
  .baptism-time-item {
    flex: none;
    width: 100%;
  }
}
</style>

