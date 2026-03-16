<template>
  <div class="discipleship-page">
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-background" style="background-image: url('/img/bible.jpg')"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title fade-in-up" style="font-family: 'Georgia', serif; font-style: italic;">
            The Road to Discipleship
          </h1>
          <p class="hero-subtitle fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
            "For by grace are ye saved through faith..." - Ephesians 2:8
          </p>

          <v-btn
            color="teal-darken-1"
            size="large"
            class="mt-6"
            @click="scrollToSchedule"
          >
            Schedule a Discipleship Talk
          </v-btn>
        </div>
      </section>

      <!-- Content Section -->
      <section class="content-section" id="schedule-section">
        <v-container>
          <div class="content-grid">
            <!-- Left: Information -->
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
                  <p class="text-subtitle-2 text-teal-darken-3 mb-4" style="font-family: 'Georgia', serif; font-style: italic;">
                    Pick a date and time for your 5-10 minute Discipleship Talk.
                  </p>
                  
                  <div v-if="slotsLoading" class="text-center pa-8">
                    <v-progress-circular indeterminate color="teal" class="mb-3" />
                    <p class="mt-2 grey--text">Loading available slots...</p>
                  </div>

                  <div v-else-if="availableScheduleDates && availableScheduleDates.length > 0">
                    <p class="text-body-2 text-teal-darken-2 mb-3" style="font-family: 'Georgia', serif; font-style: italic;">
                      <v-icon size="16" color="teal-darken-2">mdi-information</v-icon>
                      Select a date and time slot for your Discipleship Talk
                    </p>

                    <v-expansion-panels variant="accordion" class="dates-panel">
                      <v-expansion-panel
                        v-for="dateGroup in availableScheduleDates.slice(0, 4)"
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
                              :variant="formData.scheduled_date === slot.datetime ? 'flat' : 'outlined'"
                              :color="formData.scheduled_date === slot.datetime ? 'teal' : 'teal-darken-2'"
                              class="ma-1 time-slot-chip"
                              @click="selectSlot(slot.datetime)"
                            >
                              {{ formatTime(slot.time) }}
                            </v-chip>
                          </div>
                          <p v-else style="font-family: 'Georgia', serif; color: #115e59;">
                            No time slots available for this date.
                          </p>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>

                    <p v-if="availableScheduleDates.length > 4" class="text-caption text-grey mt-2" style="font-family: 'Georgia', serif;">
                      + {{ availableScheduleDates.length - 4 }} more dates available
                    </p>
                  </div>

                  <div v-else class="text-center pa-8">
                    <v-icon size="48" color="teal-lighten-3">mdi-calendar-blank</v-icon>
                    <p class="mt-2 grey--text">No slots currently available. Please check back later.</p>
                  </div>

                  <div v-if="formData.scheduled_date" class="mt-4">
                    <div class="selected-slot-badge">
                      <v-icon size="18" class="mr-2">mdi-calendar-check</v-icon>
                      Selected: {{ formatSelectedSchedule(formData.scheduled_date) }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <v-card class="info-card fade-in-up mt-6" variant="flat" color="teal-lighten-5">
                <v-card-title class="card-title d-flex align-center" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                  <v-icon color="teal" class="mr-2">mdi-book-open-variant</v-icon>
                  The Next Steps
                </v-card-title>
                <v-card-text>
                  <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                    After your Salvation Talk, our team will guide you through the next steps in your faith journey.
                  </p>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right: Application Form -->
            <div class="right-column">
              <h2 class="section-title fade-in" style="font-family: 'Georgia', serif; font-style: italic;">I Want to Know More</h2>
              
              <el-card class="registration-card fade-in-up" shadow="hover">
                <template #header>
                  <div class="registration-header-content d-flex align-center">
                    <img src="/img/logobbek.png" alt="BBEK Logo" class="registration-logo mr-4">
                    <div>
                      <h3 class="registration-title" style="font-family: 'Georgia', serif; font-style: italic; margin-bottom: 0;">
                        Discipleship Request Form
                      </h3>
                      <p class="registration-subtitle" style="font-family: 'Georgia', serif; font-style: italic; margin-bottom: 0;">
                        {{ isLoggedIn ? 'Please confirm your details below.' : 'Please fill out your details below.' }}
                      </p>
                    </div>
                  </div>
                </template>

                <div v-if="isLoggedIn" class="text-center mb-6 pt-4">
                   <h3 class="text-h6 font-weight-bold mb-2" style="color: #0d9488;">Welcome Back, {{ userInfo?.member?.firstname || 'Member' }}!</h3>
                   <p class="text-caption text-grey-darken-1">Your personal details have been pre-filled from your membership record.</p>
                   <v-divider class="mx-auto my-3" style="width: 60px;"></v-divider>
                </div>

                <el-form
                  ref="formRef"
                  :model="formData"
                  :rules="rules"
                  label-position="top"
                  v-loading="discipleshipStore.loading"
                >
                  <template v-if="!isLoggedIn">
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
                    
                    <el-form-item label="Personal Details">
                       <div style="display: flex; gap: 10px;">
                          <el-form-item prop="birthdate" style="flex: 2; margin-bottom: 0;">
                             <el-date-picker
                                v-model="formData.birthdate"
                                type="date"
                                placeholder="Birthday"
                                style="width: 100%"
                             />
                          </el-form-item>
                          <el-form-item prop="age" style="flex: 1; margin-bottom: 0;">
                             <el-input v-model.number="formData.age" type="number" placeholder="Age" />
                          </el-form-item>
                          <el-form-item prop="gender" style="flex: 1; margin-bottom: 0;">
                             <el-select v-model="formData.gender" placeholder="Gender">
                                <el-option label="Male" value="Male" />
                                <el-option label="Female" value="Female" />
                             </el-select>
                          </el-form-item>
                       </div>
                    </el-form-item>
                    
                    <el-form-item label="Address" prop="address">
                      <el-input v-model="formData.address" type="textarea" placeholder="Your Address" />
                    </el-form-item>
                  </template>

                  <el-form-item label="Selected Schedule" prop="scheduled_date" required>
                    <el-input v-model="formData.scheduled_date" placeholder="Select a slot from the left" readonly />
                    <div v-if="formData.scheduled_date" class="text-caption text-teal-darken-3 mt-1">
                      {{ formatSelectedSchedule(formData.scheduled_date) }}
                    </div>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" size="large" @click="handleSubmit" :loading="discipleshipStore.loading" style="width: 100%;">
                      Send Request
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
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { useDiscipleshipStore } from '@/stores/discipleshipStore';
import { ElMessageBox } from 'element-plus';
import moment from 'moment';

const discipleshipStore = useDiscipleshipStore();
const formRef = ref(null);

const slotsLoading = ref(false);
const availableScheduleDates = ref([]);

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('accessToken')
})

const userInfo = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}')
  } catch (e) {
    return {}
  }
})

const formData = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone_number: '',
  birthdate: '',
  age: null,
  gender: '',
  address: '',
  request_type: 'Salvation',
  scheduled_date: null
});

const fetchSlots = async () => {
  slotsLoading.value = true;
  availableScheduleDates.value = [];
  formData.scheduled_date = null;

  const result = await discipleshipStore.fetchAvailableSlots({
    service: 'salvation',
    days: 14
  });

  if (result.success) {
    availableScheduleDates.value = result.data || [];
  }

  slotsLoading.value = false;
};

onMounted(async () => {
  await fetchSlots();
});

const selectSlot = (slotDateTime) => {
  formData.scheduled_date = slotDateTime;
};

const formatDate = (dateStr) => moment(dateStr, 'YYYY-MM-DD').format('MMMM D, YYYY');
const formatTime = (timeStr) => moment(timeStr, 'HH:mm').format('h:mm A');
const formatSelectedSchedule = (dateTimeStr) => moment(dateTimeStr, 'YYYY-MM-DD HH:mm:ss').format('MMMM D, YYYY [at] h:mm A');

// Auto-calculate age from birthdate
watch(() => formData.birthdate, (newDate) => {
  if (newDate) {
    const today = new Date();
    const birthDate = new Date(newDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    formData.age = age;
  } else {
    formData.age = null;
  }
});

// Watch userInfo to populate form data
watch(() => userInfo.value, (newVal) => {
  if (isLoggedIn.value && newVal && newVal.member) {
    const m = newVal.member;
    const account = newVal.account || {}; 
    
    formData.firstname = m.firstname || '';
    formData.lastname = m.lastname || '';
    // Use member email, fallback to account email
    formData.email = m.email || account.email || '';
    formData.phone_number = m.phone_number || '';
    
    // Handle birthdate
    if (m.birthdate) {
      // Ensure birthdate handles ISO strings or other formats correctly if needed
      // Assuming naive string assignment works for ELDatePicker if formatted YYYY-MM-DD
      formData.birthdate = m.birthdate;
    }
    
    formData.gender = m.gender || '';
    formData.address = m.address || '';
  }
}, { immediate: true });

const rules = {
  firstname: [{ required: true, message: 'First name is required', trigger: 'blur' }],
  lastname: [{ required: true, message: 'Last name is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
  ],
  phone_number: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
  birthdate: [{ required: true, message: 'Birthday is required', trigger: 'change' }],
  age: [
    { required: true, message: 'Age is required', trigger: 'blur' },
    { type: 'number', min: 12, message: 'Age must be at least 12', trigger: 'blur' }
  ],
  gender: [{ required: true, message: 'Gender is required', trigger: 'change' }],
  address: [{ required: true, message: 'Address is required', trigger: 'blur' }],
  scheduled_date: [{ required: true, message: 'Please select an available schedule slot', trigger: 'change' }],
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  formData.request_type = 'Salvation';
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const success = await discipleshipStore.submitDiscipleshipRequest(formData);
      if (success) {
        const msg = 'Your Discipleship Talk request has been successfully sent! Your schedule is pending approval. Our team will email you to confirm the approved time, location, and assigned pastor.';
        
        ElMessageBox.alert(
          msg,
          'Request Submitted',
          {
            confirmButtonText: 'OK',
            type: 'success',
            callback: () => {
              formRef.value.resetFields();
              fetchSlots();
            }
          }
        );
      }
    }
  });
};

const scrollToSchedule = () => {
  const el = document.getElementById('schedule-section');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth' });
};
</script>

<style scoped>
.discipleship-page {
  min-height: 100vh;
  margin-top: 64px;
}
.hero-section {
  position: relative;
  height: 400px;
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
  font-size: 1.5rem;
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
  .content-grid {
    grid-template-columns: 1fr;
  }
}
.info-card {
  margin-bottom: 20px;
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
.slot-item {
  border: 1px solid #e0f2f1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: white;
}
.slot-item:hover {
  border-color: #4db6ac;
  background-color: #f0fdfa;
  transform: translateX(5px);
}
.slot-item.v-list-item--active {
  border-color: #0b9387;
  background-color: #e0f2f1;
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
