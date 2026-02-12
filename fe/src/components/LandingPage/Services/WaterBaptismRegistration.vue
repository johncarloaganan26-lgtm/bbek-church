<template>
  <div class="registration-container">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card elevation="4" class="pa-6 registration-card">
            <div class="text-center mb-6">
              <v-img src="/logo.png" height="80" contain class="mb-4"></v-img>
              <h1 class="text-h4 font-weight-bold teal--text">Water Baptism Registration</h1>
              <p class="text-subtitle-1 grey--text">Please complete your details to proceed with your baptism</p>
            </div>

            <!-- Loading overlay when fetching registration data from discipleship -->
            <div v-if="loadingRegistrationData" class="text-center mb-4">
              <v-progress-circular indeterminate color="teal" size="24"></v-progress-circular>
              <p class="text-subtitle-2 grey--text mt-2">Loading your information from discipleship form...</p>
            </div>

            <v-form v-if="!loadingRegistrationData" ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
              <!-- Personal Information -->
              <h3 class="text-h6 mb-4 teal--text">Personal Information</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.firstname"
                    label="First Name"
                    variant="outlined"
                    density="comfortable"
                    required
                    :rules="[v => !!v || 'First name is required']"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.middle_name"
                    label="Middle Name"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Middle Name"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="formData.lastname"
                    label="Last Name"
                    variant="outlined"
                    density="comfortable"
                    required
                    :rules="[v => !!v || 'Last name is required']"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="formData.birthdate"
                    label="Birthday"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    required
                    :rules="[v => !!v || 'Birthday is required']"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="formData.age"
                    label="Age"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    required
                    :rules="[v => !!v || 'Age is required']"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.gender"
                    :items="['Male', 'Female']"
                    label="Gender"
                    variant="outlined"
                    density="comfortable"
                    required
                    :rules="[v => !!v || 'Gender is required']"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.civil_status"
                    :items="['Single', 'Married', 'Widowed', 'Separated']"
                    label="Civil Status"
                    variant="outlined"
                    density="comfortable"
                    required
                    :rules="[v => !!v || 'Civil status is required']"
                  ></v-select>
                </v-col>
              </v-row>

              <v-textarea
                v-model="formData.address"
                label="Full Address"
                variant="outlined"
                rows="2"
                density="comfortable"
                required
                :rules="[v => !!v || 'Address is required']"
              ></v-textarea>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.email"
                    label="Email Address"
                    variant="outlined"
                    density="comfortable"
                    required
                    :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.phone_number"
                    label="Phone Number"
                    variant="outlined"
                    density="comfortable"
                    required
                    :rules="[v => !!v || 'Phone number is required']"
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Guardian Section (for minors or as standard requirement) -->
              <h3 class="text-h6 mt-6 mb-4 teal--text">Guardian Information</h3>
              <v-text-field
                v-model="formData.guardian_name"
                label="Guardian Name"
                variant="outlined"
                density="comfortable"
                placeholder="Full Name of Guardian"
              ></v-text-field>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.guardian_contact"
                    label="Guardian Contact"
                    variant="outlined"
                    density="comfortable"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.guardian_relationship"
                    label="Relationship"
                    variant="outlined"
                    density="comfortable"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-btn
                block
                color="teal-darken-2"
                size="x-large"
                type="submit"
                :loading="submitting"
                class="mt-6"
                elevation="2"
              >
                Submit Registration
              </v-btn>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWaterBaptismStore } from '@/stores/ServicesRecords/waterBaptismStore';
import { ElMessage, ElMessageBox } from 'element-plus';
import publicAxios from '@/api/publicAxios';

const route = useRoute();
const router = useRouter();
const waterBaptismStore = useWaterBaptismStore();
const loadingRegistrationData = ref(false);

const formRef = ref(null);
const formValid = ref(false);
const submitting = ref(false);
const requestId = ref(route.query.reqId);

const formData = reactive({
  firstname: '',
  lastname: '',
  middle_name: '',
  birthdate: '',
  age: null,
  gender: '',
  civil_status: '',
  address: '',
  email: '',
  phone_number: '',
  guardian_name: '',
  guardian_contact: '',
  guardian_relationship: '',
  is_member: false,
  status: 'pending'
});

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

onMounted(async () => {
  // If reqId is provided (from discipleship invitation), fetch the data
  if (requestId.value) {
    loadingRegistrationData.value = true;
    try {
      const response = await publicAxios.get(`/services/discipleship-requests/registration-data/${requestId.value}`);
      const data = response.data.success ? response.data.data : null;
      if (data) {
        formData.firstname = data.firstname || '';
        formData.lastname = data.lastname || '';
        formData.email = data.email || '';
        formData.phone_number = data.phone_number || '';
        formData.birthdate = data.birthdate ? data.birthdate.split('T')[0] : '';
        formData.age = data.age || null;
        formData.gender = data.gender || '';
        formData.address = data.address || '';
      }
    } catch (error) {
      console.error('Error fetching registration data:', error);
      // Don't show error to user - form will be empty and they can fill it in
    } finally {
      loadingRegistrationData.value = false;
    }
  }
  // If no reqId, the form is empty and ready for public registration
});

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  submitting.value = true;
  try {
    // Include requestId if coming from discipleship invitation
    const submissionData = {
      ...formData,
      ...(requestId.value && { request_id: requestId.value })
    };
    
    console.log('Submitting water baptism registration with request_id:', requestId.value);
    const result = await waterBaptismStore.createPublicBaptism(submissionData);
    console.log('Water baptism registration result:', result);

    if (result.success) {
      await ElMessageBox.alert(
        'Thank you! Your water baptism registration has been submitted. Our pastor/staff will reach out to you once the schedule is finalized.',
        'Registration Successful',
        { type: 'success' }
      );
      router.push('/');
    } else {
      ElMessage.error(result.error || 'Failed to submit registration. Please try again.');
    }
  } catch (error) {
    console.error('Registration error:', error);
    ElMessage.error('Failed to submit registration. Please try again.');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.registration-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  padding: 40px 0;
}
.registration-card {
  border-radius: 16px;
  border-top: 6px solid #0d9488;
}
.teal--text {
  color: #0d9488 !important;
}
</style>
