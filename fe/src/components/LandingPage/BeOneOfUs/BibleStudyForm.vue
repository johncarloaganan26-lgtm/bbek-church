<template>
  <div class="bible-study-page">
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-background" style="background-image: url('/img/bible.jpg')"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title fade-in-up" style="font-family: 'Georgia', serif; font-style: italic;">
            Bible Study Form
          </h1>
          <p class="hero-subtitle fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
            Choose your preferred schedule and submit your request.
          </p>
        </div>
      </section>

      <!-- Content Section -->
      <section class="content-section" id="bible-study-form">
        <v-container>
          <div class="content-grid">
            <!-- Left: Available slots -->
            <div class="left-column">
              <h2 class="section-title fade-in" style="font-family: 'Georgia', serif; font-style: italic;">
                Available Schedule Slots
              </h2>

              <v-card class="slots-card fade-in-up" variant="flat" color="teal-lighten-5">
                <v-card-title
                  class="card-title"
                  style="font-size: 1.25rem; font-weight: 600; background-color: #0d9488; color: white; padding: 16px;"
                >
                  <v-icon color="white" class="mr-2">mdi-calendar-clock</v-icon>
                  Available Dates
                </v-card-title>
                <v-card-text>
                  <p class="text-body-2 text-teal-darken-2 mb-3" style="font-family: 'Georgia', serif; font-style: italic;">
                    <v-icon size="16" color="teal-darken-2">mdi-information</v-icon>
                    The availability of slots is subject to the assigned pastor's schedule. Please select an available slot below.
                  </p>

                  <div v-if="slotsLoading" class="text-center pa-8">
                    <v-progress-circular indeterminate color="teal" class="mb-3" />
                    <p class="mt-2 grey--text">Loading available slots...</p>
                  </div>

                  <div v-else-if="availableScheduleDates && availableScheduleDates.length > 0">
                    <v-expansion-panels variant="accordion" class="dates-panel">
                      <v-expansion-panel
                        v-for="dateGroup in availableScheduleDates"
                        :key="dateGroup.date"
                        variant="flat"
                        class="mb-2"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center justify-space-between w-100 pr-2">
                            <div>
                              <v-icon color="teal-darken-2" class="mr-2">mdi-calendar</v-icon>
                              <span class="font-weight-medium text-teal-darken-3">{{ formatDate(dateGroup.date) }}</span>
                            </div>
                            <v-chip size="small" color="teal" variant="flat" style="color: white !important;">
                              {{ dateGroup.availableSlots }} slots
                            </v-chip>
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div v-if="dateGroup.timeSlots && dateGroup.timeSlots.length > 0" class="time-slots-grid">
                            <v-chip
                              v-for="slot in dateGroup.timeSlots"
                              :key="slot.datetime"
                              size="small"
                              :variant="formData.scheduled_date === slot.datetime ? 'flat' : (slot.bookedCount > 0 ? 'tonal' : 'outlined')"
                              :color="formData.scheduled_date === slot.datetime ? 'teal' : (slot.bookedCount > 0 ? 'teal-darken-1' : 'teal-darken-2')"
                              class="ma-1 time-slot-chip"
                              @click="selectSlot(slot.datetime)"
                            >
                              {{ formatTime(slot.time) }}
                              <span class="ml-1 text-caption font-weight-bold" style="font-size: 0.7rem !important; opacity: 0.8 !important;">
                                ({{ slot.bookedCount }}/{{ slot.maxCapacity || 1 }})
                              </span>
                            </v-chip>
                          </div>
                          <p v-else style="font-family: 'Georgia', serif; color: #115e59;">
                            No time slots available for this date.
                          </p>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>


                  </div>

                  <div v-else class="text-center pa-10 bg-white rounded-xl border-dashed border-2 mt-4" style="border-color: #fca5a5 !important; background-color: #fef2f2 !important;">
                    <v-icon size="64" color="red-lighten-3" class="mb-4">mdi-calendar-remove</v-icon>
                    <h3 class="text-h6 font-weight-bold text-red-darken-3 mb-1" style="font-family: 'Georgia', serif;">No Slots Available</h3>
                    <p class="text-body-2 text-red-darken-2" style="font-family: 'Georgia', serif; font-style: italic;">
                      We are currently fully booked or no schedules have been set. Please contact the church office or check back soon!
                    </p>
                  </div>

                  <div v-if="formData.scheduled_date" class="mt-4">
                    <div class="selected-slot-badge">
                      <v-icon size="18" class="mr-2">mdi-calendar-check</v-icon>
                      Selected: {{ formatSelectedSchedule(formData.scheduled_date) }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right: Form -->
            <div class="right-column">
              <h2 class="section-title fade-in" style="font-family: 'Georgia', serif; font-style: italic;">
                Bible Study Request
              </h2>

              <el-card class="registration-card fade-in-up" shadow="hover">
                <template #header>
                  <div class="registration-header-content d-flex align-center">
                    <img src="/img/logobbek.png" alt="BBEK Logo" class="registration-logo mr-4">
                    <div>
                      <h3 class="registration-title" style="font-family: 'Georgia', serif; font-style: italic; margin-bottom: 0;">
                        Bible Study Form
                      </h3>
                      <p class="registration-subtitle" style="font-family: 'Georgia', serif; font-style: italic; margin-bottom: 0;">
                        Please fill out your details below.
                      </p>
                    </div>
                  </div>
                </template>

                <div v-if="referenceId" class="mb-4 text-caption text-grey-darken-1">
                  Reference ID: <b>{{ referenceId }}</b>
                </div>

                <el-form
                  ref="formRef"
                  :model="formData"
                  :rules="rules"
                  label-position="top"
                  v-loading="discipleshipStore.loading"
                >
                  <el-form-item label="Full Name" required>
                    <div style="display: flex; gap: 10px;">
                      <el-form-item prop="firstname" style="flex: 1; margin-bottom: 0;">
                        <el-input v-model="formData.firstname" placeholder="First Name" />
                      </el-form-item>
                      <el-form-item prop="lastname" style="flex: 1; margin-bottom: 0;">
                        <el-input v-model="formData.lastname" placeholder="Last Name" />
                      </el-form-item>
                    </div>
                  </el-form-item>

                  <el-form-item label="Contact Information" required>
                    <el-form-item prop="email" style="margin-bottom: 10px;">
                      <el-input v-model="formData.email" placeholder="Email Address" />
                    </el-form-item>
                    <el-form-item prop="phone_number">
                      <el-input v-model="formData.phone_number" placeholder="Phone Number" />
                    </el-form-item>
                  </el-form-item>

                  <el-form-item label="Address" prop="address" required>
                    <el-input v-model="formData.address" type="textarea" placeholder="Your Address" />
                  </el-form-item>

                  <el-form-item label="Preferred Schedule" prop="scheduled_date" required>
                    <el-input v-model="formData.scheduled_date" placeholder="Select a slot from the left" readonly />
                    <div v-if="formData.scheduled_date" class="text-caption text-teal-darken-3 mt-1">
                      {{ formatSelectedSchedule(formData.scheduled_date) }}
                    </div>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" size="large" @click="handleSubmit" :loading="discipleshipStore.loading" style="width: 100%;">
                      Submit Bible Study Request
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </div>
          </div>
        </v-container>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import moment from 'moment'
import axios from '@/api/axios'
import { ElMessageBox } from 'element-plus'
import { useDiscipleshipStore } from '@/stores/discipleshipStore'

const route = useRoute()
const router = useRouter()
const discipleshipStore = useDiscipleshipStore()
const formRef = ref(null)

const referenceId = computed(() => String(route.query.ref || '').trim() || null)

const slotsLoading = ref(false)
const availableScheduleDates = ref([])

const formData = reactive({
  salvation_id: null,
  firstname: '',
  lastname: '',
  email: '',
  phone_number: '',
  address: '',
  scheduled_date: null,
  middle_name: '',
  birthdate: '',
  age: null,
  gender: '',
  civil_status: '',
  profession: '',
  spouse_name: '',
  marriage_date: '',
  children: '',
  guardian_name: '',
  guardian_contact: '',
  guardian_relationship: ''
})

const rules = {
  firstname: [{ required: true, message: 'First name is required', trigger: 'blur' }],
  lastname: [{ required: true, message: 'Last name is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
  ],
  phone_number: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
  address: [{ required: true, message: 'Address is required', trigger: 'blur' }],
  scheduled_date: [{ required: true, message: 'Please select an available schedule slot', trigger: 'change' }]
}

const fetchSlots = async () => {
  slotsLoading.value = true
  availableScheduleDates.value = []
  formData.scheduled_date = null

  const result = await discipleshipStore.fetchAvailableSlots({
    service: 'bible_study',
    days: 30
  })

  if (result.success) {
    const rawDates = result.data || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    availableScheduleDates.value = rawDates.filter(dateGroup => {
      const slotDate = new Date(dateGroup.date);
      slotDate.setHours(0, 0, 0, 0);
      // Allow today and future dates. Backend will handle filtering past times for today.
      return slotDate >= today;
    });
  }

  slotsLoading.value = false
}

const hydrateFromReference = async () => {
  if (!referenceId.value) return

  try {
    const response = await axios.get(`/services/discipleship-requests/registration-data/${referenceId.value}`)

    if (response.data?.success) {
      const d = response.data.data || {}
      formData.salvation_id = d.salvation_id || referenceId.value
      formData.firstname = d.firstname || ''
      formData.lastname = d.lastname || ''
      formData.email = d.email || ''
      formData.phone_number = d.phone_number || ''
      formData.address = d.address || ''
      formData.middle_name = d.middle_name || ''
      formData.birthdate = d.birthdate ? moment(d.birthdate).format('YYYY-MM-DD') : ''
      formData.age = d.age || null
      formData.gender = d.gender || ''
      formData.civil_status = d.civil_status || ''
      formData.profession = d.profession || ''
      formData.spouse_name = d.spouse_name || ''
      formData.marriage_date = d.marriage_date ? moment(d.marriage_date).format('YYYY-MM-DD') : ''
      formData.children = d.children || ''
      formData.guardian_name = d.guardian_name || ''
      formData.guardian_contact = d.guardian_contact || ''
      formData.guardian_relationship = d.guardian_relationship || ''
      
      // Select slot section and scroll
      setTimeout(() => {
        const el = document.getElementById('bible-study-form')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  } catch (e) {
    console.warn('Failed to fetch reference data:', e.message)
  }
}

onMounted(async () => {
  await fetchSlots()
  await hydrateFromReference()
})

const selectSlot = (slotDateTime) => {
  formData.scheduled_date = slotDateTime
}

const formatDate = (dateStr) => moment(dateStr, 'YYYY-MM-DD').format('MMMM D, YYYY')
const formatTime = (timeStr) => moment(timeStr, 'HH:mm').format('h:mm A')
const formatSelectedSchedule = (dateTimeStr) => moment(dateTimeStr, 'YYYY-MM-DD HH:mm:ss').format('MMMM D, YYYY [at] h:mm A')

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    const payload = {
      salvation_id: formData.salvation_id,
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      phone_number: formData.phone_number,
      address: formData.address,
      scheduled_date: formData.scheduled_date,
      middle_name: formData.middle_name,
      birthdate: formData.birthdate,
      age: formData.age,
      gender: formData.gender,
      civil_status: formData.civil_status,
      profession: formData.profession,
      spouse_name: formData.spouse_name,
      marriage_date: formData.marriage_date,
      children: formData.children,
      guardian_name: formData.guardian_name,
      guardian_contact: formData.guardian_contact,
      guardian_relationship: formData.guardian_relationship
    }

    const success = await discipleshipStore.submitBibleStudyRequest(payload)
    if (success) {
      ElMessageBox.alert(
        'Your Bible Study request has been submitted and is pending approval. Our team will email you to confirm the approved schedule, location, and assigned pastor.',
        'Request Submitted',
        {
          confirmButtonText: 'OK',
          type: 'success',
          callback: () => {
            // Reset form and navigate back to landing page
            formRef.value.resetFields()
            router.push('/')
          }
        }
      )
    }
  })
}
</script>

<style scoped>
.bible-study-page {
  min-height: 100vh;
  margin-top: 64px;
}
.hero-section {
  position: relative;
  height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}
.hero-background {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-size: cover;
  background-position: center;
  filter: brightness(0.6);
  z-index: 1;
}
.hero-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 1;
}
.hero-content {
  position: relative;
  z-index: 2;
  padding: 20px;
}
.hero-title {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.hero-subtitle {
  font-size: 1.25rem;
}
.content-section {
  padding: 60px 0;
}
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}
@media (max-width: 960px) {
  .content-grid { grid-template-columns: 1fr; }
}
.slots-card {
  max-height: 600px;
  overflow-y: auto;
}
.registration-card {
  border-radius: 8px;
}
.registration-title {
  color: #0f766e;
  margin-bottom: 5px;
}
.registration-logo {
  height: 50px;
  width: auto;
  object-fit: contain;
}
.registration-header-content {
  padding: 5px 0;
}
.time-slots-grid {
  display: flex;
  flex-wrap: wrap;
}
.time-slot-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}
.time-slot-chip:hover {
  transform: translateY(-1px);
}
.selected-slot-badge {
  background-color: #0d9488;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}
</style>

