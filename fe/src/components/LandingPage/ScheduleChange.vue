<template>
  <div class="schedule-change-page">
    
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: 'url(/img/comm.jpg)' }"
      ></div>
      <div class="hero-overlay-gradient"></div>
      
      <div class="hero-content-wrapper">
        <h1 class="hero-title">Schedule Change Request</h1>
        <p class="hero-subtitle">
          Request changes to your scheduled service dates
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="main-content py-20">
      <v-container>
        <!-- Back Button -->
        <div class="mb-6">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            @click="$router.push('/')"
            class="mb-4"
          >
            Back to Home
          </v-btn>
        </div>

        <v-row>
          <!-- Request Form -->
          <v-col cols="12" lg="6">
            <v-card class="pa-6" elevation="2">
              <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-6">
                Submit New Request
              </h2>

              <v-form @submit.prevent="handleSubmit" ref="formRef">
                <v-select
                  v-model="formData.serviceType"
                  label="Service Type *"
                  :items="serviceTypeOptions"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Service type is required']"
                  class="mb-4"
                  @update:model-value="onServiceTypeChange"
                ></v-select>

                <!-- Loading state while fetching services -->
                <div v-if="formData.serviceType && loadingServices" class="mb-4">
                  <v-progress-linear indeterminate color="primary"></v-progress-linear>
                  <p class="text-caption text-grey-darken-1 mt-2">Loading available services...</p>
                </div>

                <!-- Service selection dropdown -->
                <v-select
                  v-if="formData.serviceType && !loadingServices && availableServices.length > 0"
                  v-model="formData.serviceId"
                  label="Select Your Service *"
                  :items="availableServices"
                  item-title="label"
                  item-value="service_id"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Please select a service']"
                  class="mb-4"
                  @update:model-value="onServiceSelected"
                  prepend-inner-icon="mdi-calendar-check"
                  hint="Select the specific service you want to reschedule"
                  persistent-hint
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-avatar size="40" :color="getStatusColorForService(item.raw.status)" variant="tonal">
                          <v-icon :color="getStatusColorForService(item.raw.status)">
                            {{ getServiceIcon(item.raw.service_type || formData.serviceType) }}
                          </v-icon>
                        </v-avatar>
                      </template>
                      <v-list-item-title class="font-weight-medium">
                        {{ item.raw.service_date ? formatDate(item.raw.service_date) : 'Date TBD' }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip size="x-small" :color="getStatusColorForService(item.raw.status)" variant="flat" class="mr-2">
                          {{ item.raw.status ? item.raw.status.charAt(0).toUpperCase() + item.raw.status.slice(1) : 'Unknown' }}
                        </v-chip>
                        Service ID: {{ item.raw.service_id }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <span class="text-body-1">
                      <v-icon size="small" class="mr-2">{{ getServiceIcon(item.raw.service_type || formData.serviceType) }}</v-icon>
                      {{ item.raw.service_date ? formatDate(item.raw.service_date) : 'Date TBD' }}
                      <span class="text-grey-darken-1 ml-2">({{ item.raw.status }})</span>
                    </span>
                  </template>
                </v-select>

                <!-- No services available message -->
                <v-alert
                  v-if="formData.serviceType && !loadingServices && availableServices.length === 0"
                  type="info"
                  variant="tonal"
                  class="mb-4"
                  icon="mdi-information"
                >
                  <div class="text-body-2">
                    <strong>No available services found</strong>
                    <p class="mt-1 mb-0">
                      You don't have any {{ getServiceTypeLabel(formData.serviceType).toLowerCase() }} services 
                      that can be rescheduled (only non-completed services can be changed).
                    </p>
                  </div>
                </v-alert>

                <v-text-field
                  v-if="formData.serviceId && selectedService"
                  v-model="formData.originalDate"
                  label="Original Scheduled Date *"
                  type="date"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Original date is required']"
                  class="mb-4"
                  readonly
                  prepend-inner-icon="mdi-calendar-lock"
                  hint="This is the original scheduled date for your service"
                  persistent-hint
                ></v-text-field>

                <!-- Date and Time Picker for Requested New Date -->
                <div class="mb-4">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="requestedDatePart"
                        label="Requested New Date *"
                        type="date"
                        variant="outlined"
                        required
                        :rules="[v => !!v || 'Requested date is required']"
                        @update:model-value="validateDateTime"
                        prepend-inner-icon="mdi-calendar"
                        :min="minDate"
                        :error-messages="dateError"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="requestedTimePart"
                        label="Requested New Time *"
                        type="time"
                        variant="outlined"
                        required
                        :rules="[v => !!v || 'Requested time is required']"
                        @update:model-value="validateDateTime"
                        prepend-inner-icon="mdi-clock-outline"
                        :error-messages="timeError"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>

                <v-textarea
                  v-model="formData.reason"
                  label="Reason for Change *"
                  variant="outlined"
                  rows="4"
                  placeholder="Please explain why you need to change the schedule..."
                  required
                  :rules="[v => !!v || 'Reason is required']"
                  class="mb-6"
                ></v-textarea>

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="submitting"
                >
                  Submit Request
                </v-btn>
              </v-form>
            </v-card>
          </v-col>

          <!-- Previous Requests -->
          <v-col cols="12" lg="6">
            <v-card class="pa-6" elevation="2">
              <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-6">
                Previous Requests
              </h2>

              <div v-if="loadingRequests" class="text-center py-12">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <p class="text-body-2 text-grey-darken-1 mt-4">Loading requests...</p>
              </div>
              <div v-else-if="submittedRequests.length === 0" class="text-center py-12">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-file-document-outline</v-icon>
                <h3 class="text-h6 font-weight-medium text-grey-darken-2 mb-2">
                  No previous requests
                </h3>
                <p class="text-body-2 text-grey-darken-1">
                  Your schedule change requests will appear here.
                </p>
              </div>

              <div v-else class="requests-container">
                <v-card
                  v-for="request in displayedRequests"
                  :key="request.id"
                  variant="outlined"
                  class="mb-4"
                >
                  <v-card-text>
                    <div class="d-flex justify-space-between align-start mb-3">
                      <div class="flex-grow-1">
                        <h4 class="font-weight-medium text-grey-darken-3 mb-2">
                          {{ getServiceTypeLabel(request.serviceType) }}
                        </h4>
                        <p class="text-body-2 text-grey-darken-1 mb-1">
                          Original: {{ formatDateTime(request.originalDate) }} →
                          Requested: {{ formatDateTime(request.requestedDate) }}
                        </p>
                        <p class="text-body-2 text-grey-darken-2 mt-2">
                          {{ request.reason }}
                        </p>
                      </div>
                      <v-chip
                        :color="getStatusColor(request.status)"
                        size="small"
                        variant="flat"
                      >
                        {{ request.status }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-grey-darken-1">
                      Submitted: {{ formatDate(request.submittedDate) }}
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFormsStore } from '@/stores/formsStore'

const router = useRouter()
const formsStore = useFormsStore()
const formRef = ref(null)
const submitting = ref(false)
const loadingServices = ref(false)

// User info for form submission
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || null)
  
const loadingRequests = computed(() => formsStore.loading)

// Form data
const formData = reactive({
  serviceType: '',
  serviceId: '',
  originalDate: '',
  requestedDate: '',
  reason: ''
})

// Separate date and time parts for datetime picker
const requestedDatePart = ref('')
const requestedTimePart = ref('')
const dateError = ref('')
const timeError = ref('')

// Minimum date (today) to prevent selecting past dates
const minDate = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// Validate date and time based on service type
const validateDateTime = () => {
  dateError.value = ''
  timeError.value = ''
  
  if (!requestedDatePart.value || !requestedTimePart.value) {
    return false
  }
  
  const selectedDate = new Date(requestedDatePart.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check if date is in the past
  if (selectedDate < today) {
    dateError.value = 'Cannot select past dates'
    return false
  }
  
  // Child Dedication: Only allow Sundays
  if (formData.serviceType === 'child-dedication') {
    if (selectedDate.getDay() !== 0) {
      dateError.value = 'Child dedication can only be scheduled on Sundays'
      return false
    }
  }
  
  // Burial: Only allow night hours (6 PM - 10 PM)
  if (formData.serviceType === 'burial') {
    const hour = parseInt(requestedTimePart.value.split(':')[0], 10)
    if (hour < 18 || hour >= 22) {
      timeError.value = 'Burial services must be between 6:00 PM and 10:00 PM'
      return false
    }
  }
  
  updateRequestedDateTime()
  return true
}

// Update the combined datetime value when date or time changes
const updateRequestedDateTime = () => {
  if (requestedDatePart.value && requestedTimePart.value) {
    // Combine date and time into ISO datetime string
    const dateTimeString = `${requestedDatePart.value}T${requestedTimePart.value}:00`
    formData.requestedDate = dateTimeString
  } else {
    formData.requestedDate = ''
  }
}

// Initialize date and time parts from formData.requestedDate if it exists
const initializeDateTimeParts = () => {
  if (formData.requestedDate) {
    const date = new Date(formData.requestedDate)
    if (!isNaN(date.getTime())) {
      // Extract date part (YYYY-MM-DD)
      requestedDatePart.value = date.toISOString().split('T')[0]
      // Extract time part (HH:MM)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      requestedTimePart.value = `${hours}:${minutes}`
    }
  }
}

// Available services for the selected service type
const availableServices = computed(() => {
  if (!formData.serviceType) return []
  const services = formsStore.memberServices[formData.serviceType] || []
  return services.map(service => {
    const dateStr = service.service_date ? formatDate(service.service_date) : 'Date TBD'
    const statusStr = service.status ? service.status.charAt(0).toUpperCase() + service.status.slice(1) : 'Unknown'
    return {
      service_id: service.service_id,
      label: `${dateStr} - ${statusStr}`,
      fullLabel: `${getServiceTypeLabel(formData.serviceType)} scheduled for ${dateStr} (Status: ${statusStr})`,
      ...service
    }
  })
})

// Selected service details
const selectedService = computed(() => {
  if (!formData.serviceId || !formData.serviceType) return null
  return availableServices.value.find(s => s.service_id === formData.serviceId)
})

// Watch for changes in selectedService and update originalDate
watch(selectedService, (newService) => {
  if (newService && newService.service_date) {
    // Ensure the date is in YYYY-MM-DD format for the date input
    const serviceDate = newService.service_date
    if (serviceDate.includes('T')) {
      formData.originalDate = serviceDate.split('T')[0]
    } else if (serviceDate.includes(' ')) {
      formData.originalDate = serviceDate.split(' ')[0]
    } else {
      formData.originalDate = serviceDate
    }
    console.log('Selected service changed - Original date set to:', formData.originalDate)
  } else if (!newService) {
    formData.originalDate = ''
  }
}, { immediate: true })

// Handle service type change
const onServiceTypeChange = async () => {
  formData.serviceId = ''
  formData.originalDate = ''
  formData.requestedDate = ''
  requestedDatePart.value = ''
  requestedTimePart.value = ''
  
  // Refresh userInfo from localStorage
  const freshUserInfo = JSON.parse(localStorage.getItem('userInfo')) || null
  userInfo.value = freshUserInfo
  
  // Extract memberId from multiple possible paths
  const memberId = freshUserInfo?.member?.member_id 
    || freshUserInfo?.member_id 
    || userInfo.value?.member?.member_id 
    || userInfo.value?.member_id
  
  console.log('=== Service Type Change Debug ===')
  console.log('Service Type:', formData.serviceType)
  console.log('Fresh UserInfo:', freshUserInfo)
  console.log('Extracted Member ID:', memberId)
  console.log('===============================')
  
  if (!memberId) {
    console.warn('No member ID found! Cannot fetch services.')
    ElMessage.warning('Unable to identify your member account. Please ensure you are logged in.')
    return
  }
  
  if (memberId && formData.serviceType) {
    loadingServices.value = true
    try {
      console.log(`Fetching services for memberId: ${memberId}, serviceType: ${formData.serviceType}`)
      const result = await formsStore.fetchMemberServices(memberId)
      console.log('Fetched services result:', result)
      console.log('Services for type:', formData.serviceType, ':', formsStore.memberServices[formData.serviceType])
      console.log('Available services count:', availableServices.value.length)
      
      if (availableServices.value.length === 0) {
        console.warn('No services found for member:', memberId, 'type:', formData.serviceType)
        console.warn('All member services:', formsStore.memberServices)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      ElMessage.error('Failed to load available services. Please try again.')
    } finally {
      loadingServices.value = false
    }
  }
}

// Handle service selection
const onServiceSelected = () => {
  if (selectedService.value) {
    // Ensure the date is in YYYY-MM-DD format for the date input
    const serviceDate = selectedService.value.service_date
    if (serviceDate) {
      // If it's already in YYYY-MM-DD format, use it directly
      // If it's a datetime string, extract just the date part
      if (serviceDate.includes('T')) {
        formData.originalDate = serviceDate.split('T')[0]
      } else if (serviceDate.includes(' ')) {
        formData.originalDate = serviceDate.split(' ')[0]
      } else {
        formData.originalDate = serviceDate
      }
    } else {
      formData.originalDate = ''
    }
    console.log('Service selected - Original date set to:', formData.originalDate)
  }
}

// Service type options
const serviceTypeOptions = [
  { title: 'Select a service', value: '' },
  { title: 'Child Dedication', value: 'child-dedication' },
  { title: 'Marriage Ceremony', value: 'marriage' },
  { title: 'Burial Service', value: 'burial' },
  // { title: 'Water Baptism', value: 'water-baptism' }
]

// Submitted requests - computed from store
const submittedRequests = computed(() => {
  return formsStore.myForms.map(form => ({
    id: form.form_id,
    serviceType: form.form_data?.serviceType,
    serviceId: form.form_data?.serviceId,
    originalDate: form.form_data?.originalDate,
    requestedDate: form.form_data?.requestedDate,
    reason: form.form_data?.reason,
    status: form.status,
    submittedDate: form.created_at,
    email: userInfo.value?.account?.email,
    name: userInfo.value?.member?.firstname + ' ' + userInfo.value?.member?.lastname,
    phone: userInfo.value?.member?.phone_number || userInfo.value?.member?.contactNo,
    submittedBy:  userInfo.value?.account?.acc_id
  }))
})

// Display only first 4 requests with scrolling
const displayedRequests = computed(() => {
  return submittedRequests.value.slice(0, 4)
})

// Fetch user's schedule change requests
const fetchRequests = async () => {
  // Only fetch if user is authenticated
  const freshUserInfo = JSON.parse(localStorage.getItem('userInfo')) || null
  if (!freshUserInfo?.account?.acc_id && !freshUserInfo?.acc_id) {
    // User not authenticated, skip fetch
    return
  }
  
  try {
    await formsStore.fetchMyForms('schedule_change')
  } catch (error) {
    // Error is already handled in the store
    console.error('Error fetching requests:', error)
  }
}

onMounted(async () => {
  // Check if we're actually on the schedule-change route
  // This prevents fetching when component is preloaded but route hasn't changed yet
  if (router.currentRoute.value.name !== 'ScheduleChange') {
    return
  }
  
  // Refresh userInfo from localStorage on mount
  const freshUserInfo = JSON.parse(localStorage.getItem('userInfo')) || null
  userInfo.value = freshUserInfo
  
  // Only fetch requests if user is authenticated
  // This prevents unnecessary API calls when component is preloaded or user is not logged in
  if (freshUserInfo?.account?.acc_id || freshUserInfo?.acc_id) {
  await fetchRequests()
  }
  
  // Initialize datetime parts if formData has a value
  initializeDateTimeParts()
  
  // Note: Services will be fetched when user selects a service type
  // This avoids unnecessary API calls on mount
})

// Handle form submit
const handleSubmit = async () => {
  if (!formRef.value) return

  // Validate that both date and time are provided
  if (!requestedDatePart.value || !requestedTimePart.value) {
    ElMessage.warning('Please provide both date and time for the requested schedule')
    return
  }

  // Validate date and time based on service type
  if (!validateDateTime()) {
    return
  }

  const { valid } = await formRef.value.validate()
  if (!valid) {
    ElMessage.warning('Please fill in all required fields correctly')
    return
  }

  // Show confirmation dialog
  try {
    const serviceTypeLabel = getServiceTypeLabel(formData.serviceType)
    const originalDateStr = formatDateTime(formData.originalDate)
    const requestedDateStr = formatDateTime(formData.requestedDate)

    await ElMessageBox.confirm(
      `<div style="text-align: left;">
        <p><strong>Please confirm your schedule change request:</strong></p>
        <p style="margin: 8px 0;"><strong>Service Type:</strong> ${serviceTypeLabel}</p>
        <p style="margin: 8px 0;"><strong>Original Date:</strong> ${originalDateStr}</p>
        <p style="margin: 8px 0;"><strong>Requested New Date:</strong> ${requestedDateStr}</p>
        <p style="margin: 8px 0;"><strong>Reason:</strong> ${formData.reason}</p>
        <p style="margin-top: 12px; color: #666; font-size: 0.9em;">
          Your request will be reviewed by the administration. You will be notified once it's processed.
        </p>
      </div>`,
      'Confirm Schedule Change Request',
      {
        confirmButtonText: 'Submit Request',
        cancelButtonText: 'Cancel',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        customClass: 'schedule-change-confirm-dialog'
      }
    )
  } catch (error) {
    // User cancelled the confirmation
    if (error === 'cancel') {
      return
    }
    console.error('Error showing confirmation:', error)
    return
  }

  // Proceed with submission
  submitting.value = true
  try {
    // Refresh userInfo from localStorage to ensure we have the latest data
    const freshUserInfo = JSON.parse(localStorage.getItem('userInfo')) || null
    userInfo.value = freshUserInfo
    
    // Get userId from multiple possible paths (check all possible field names)
    const userId = freshUserInfo?.account?.acc_id 
      || freshUserInfo?.account?.account_id
      || freshUserInfo?.account?.id
      || freshUserInfo?.acc_id 
      || freshUserInfo?.account_id
      || freshUserInfo?.id
      || userInfo.value?.account?.acc_id
      || userInfo.value?.account?.account_id
      || userInfo.value?.account?.id
      || userInfo.value?.acc_id
      || userInfo.value?.account_id
      || userInfo.value?.id
      || null
    
    // Debug logging - log the full structure to help identify the issue
    console.log('=== Form Submission Debug ===')
    console.log('Full userInfo from localStorage:', JSON.stringify(freshUserInfo, null, 2))
    console.log('Account object:', freshUserInfo?.account)
    console.log('Account keys:', freshUserInfo?.account ? Object.keys(freshUserInfo.account) : 'No account object')
    console.log('Extracted userId:', userId)
    console.log('============================')

    // Build user name from member info (use freshUserInfo)
    let userName = null
    const memberInfo = freshUserInfo?.member || userInfo.value?.member
    if (memberInfo) {
      const nameParts = []
      if (memberInfo.firstname) nameParts.push(memberInfo.firstname)
      if (memberInfo.middle_name) nameParts.push(memberInfo.middle_name)
      if (memberInfo.lastname) nameParts.push(memberInfo.lastname)
      if (nameParts.length > 0) {
        userName = nameParts.join(' ')
      }
    }
    
    // Get email and phone (use freshUserInfo)
    const userEmail = freshUserInfo?.account?.email || freshUserInfo?.member?.email || userInfo.value?.account?.email || userInfo.value?.member?.email || null
    const userPhone = freshUserInfo?.member?.phone_number || freshUserInfo?.member?.contactNo || userInfo.value?.member?.phone_number || userInfo.value?.member?.contactNo || null

    const payload = {
      form_type: 'schedule_change',
      submitted_by: userId,
      name: userName,
      email: userEmail,
      phone: userPhone,
      form_data: {
        serviceType: formData.serviceType,
        serviceId: formData.serviceId,
        originalDate: formData.originalDate,
        requestedDate: formData.requestedDate,
        reason: formData.reason
      },
      status: 'pending'
    }

    // Add user info if authenticated
    if (userId) {
      payload.submitted_by = userId
      console.log('Setting submitted_by to:', userId)
    } else {
      console.warn('No userId found! userInfo structure:', freshUserInfo)
      console.warn('This may cause the form submission to fail if user authentication is required.')
      // Don't show warning message - let backend handle it
      // The backend will accept the form if name/email are provided
    }
    
    // Log the final payload for debugging
    console.log('Final payload being sent:', JSON.stringify(payload, null, 2))
    
    // Add name, email, and phone for email notifications
    if (userName) {
      payload.name = userName
    }
    if (userEmail) {
      payload.email = userEmail
    }
    if (userPhone) {
      payload.phone = userPhone
    }

    await formsStore.createForm(payload)
    
    // Show success message
    ElMessage({
      message: 'Schedule change request submitted successfully! Your request is now pending review.',
      type: 'success',
      duration: 5000,
      showClose: true
    })
    
    // Reset form
    formData.serviceType = ''
    formData.serviceId = ''
    formData.originalDate = ''
    formData.requestedDate = ''
    formData.reason = ''
    requestedDatePart.value = ''
    requestedTimePart.value = ''
    formRef.value.resetValidation()
    
    // Refresh requests list
    await fetchRequests()
    
    // Show additional info message
    setTimeout(() => {
      ElMessage({
        message: 'You can view the status of your request in the "Previous Requests" section.',
        type: 'info',
        duration: 4000,
        showClose: true
      })
    }, 1000)
  } catch (error) {
    // Show error message if not already shown by interceptor
    const errorMessage = error.message || 'Failed to submit schedule change request'
    ElMessage({
      message: errorMessage,
      type: 'error',
      duration: 5000,
      showClose: true
    })
    console.error('Error submitting form:', error)
  } finally {
    submitting.value = false
  }
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format datetime (date and time)
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get status color
const getStatusColor = (status) => {
  const normalizedStatus = status.toLowerCase().replace(/[_-]/g, ' ').trim()
  
  if (normalizedStatus === 'approved') {
    return 'success'
  } else if (normalizedStatus === 'pending review' || normalizedStatus === 'pending') {
    return 'warning'
  } else if (normalizedStatus === 'rejected') {
    return 'error'
  } else {
    return 'info'
  }
}

// Get service type label
const getServiceTypeLabel = (value) => {
  const option = serviceTypeOptions.find(opt => opt.value === value)
  return option ? option.title : value
}

// Get service icon based on service type
const getServiceIcon = (serviceType) => {
  const icons = {
    'water-baptism': 'mdi-water',
    'marriage': 'mdi-heart',
    'burial': 'mdi-cross',
    'child-dedication': 'mdi-baby-face-outline'
  }
  return icons[serviceType] || 'mdi-calendar'
}

// Get status color for service
const getStatusColorForService = (status) => {
  const normalizedStatus = status?.toLowerCase() || ''
  if (normalizedStatus === 'pending') {
    return 'warning'
  } else if (normalizedStatus === 'approved' || normalizedStatus === 'ongoing') {
    return 'info'
  } else {
    return 'grey'
  }
}
</script>

<style scoped>
.schedule-change-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.hero-section {
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: 64px;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

.hero-overlay-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(20, 184, 166, 0.9) 0%,
    rgba(6, 182, 212, 0.9) 100%
  );
  z-index: 2;
}

.hero-content-wrapper {
  position: relative;
  z-index: 3;
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.95;
  max-width: 600px;
  margin: 0 auto;
}

.main-content {
  background: #f5f5f5;
  min-height: 60vh;
}

.space-y-4 > * + * {
  margin-top: 16px;
}

.requests-container {
  max-height: 407px;
  overflow-y: auto;
  padding-right: 8px;
}

/* Custom scrollbar styling */
.requests-container::-webkit-scrollbar {
  width: 8px;
}

.requests-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.requests-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.requests-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

@media (max-width: 960px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}

/* Custom styles for confirmation dialog */
:deep(.schedule-change-confirm-dialog) {
  max-width: 500px;
}

:deep(.schedule-change-confirm-dialog .el-message-box__message) {
  padding: 10px 0;
}

:deep(.schedule-change-confirm-dialog .el-message-box__message p) {
  margin: 4px 0;
  line-height: 1.6;
}
</style>

