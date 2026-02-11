<template>
  <div class="discipleship-page">
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-background" style="background-image: url('/img/bible.jpg')"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title fade-in-up" style="font-family: 'Georgia', serif; font-style: italic;">
            Start Your Spiritual Journey
          </h1>
          <p class="hero-subtitle fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
            "But grow in the grace and knowledge of our Lord and Savior Jesus Christ." - 2 Peter 3:18
          </p>
        </div>
      </section>

      <!-- Content Section -->
      <section class="content-section">
        <v-container>
          <div class="content-grid">
            <!-- Left: Information -->
            <div class="left-column">
              <h2 class="section-title fade-in" style="font-family: 'Georgia', serif; font-style: italic;">
                Why Take This Step?
              </h2>
              
              <v-card class="info-card fade-in-up" variant="flat" color="teal-lighten-5">
                <v-card-title class="card-title d-flex align-center" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                  <v-icon color="teal" class="mr-2">mdi-shield-check</v-icon>
                  Assurance of Salvation
                </v-card-title>
                <v-card-text>
                  <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                    Understand God's plan for your life and secure your eternal future. Learn what it means to be saved by grace through faith.
                  </p>
                </v-card-text>
              </v-card>

              <v-card class="info-card fade-in-up" variant="flat" color="teal-lighten-5">
                <v-card-title class="card-title d-flex align-center" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                  <v-icon color="teal" class="mr-2">mdi-book-open-variant</v-icon>
                  Bible Studies
                </v-card-title>
                <v-card-text>
                  <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                    Deepen your understanding of God's Word. Our Bible studies are designed to help you grow spiritually and prepare you for baptism.
                  </p>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right: Application Form -->
            <div class="right-column">
              <h2 class="section-title fade-in" style="font-family: 'Georgia', serif; font-style: italic;">
                {{ isLoggedIn ? "Member's Growth & Service" : "I Want to Know More" }}
              </h2>
              
              <el-card class="registration-card fade-in-up" shadow="hover">
                <template #header>
                  <div class="registration-header-content d-flex align-center">
                    <img src="/img/logobbek.png" alt="BBEK Logo" class="registration-logo mr-4">
                    <div>
                      <h3 class="registration-title" style="font-family: 'Georgia', serif; font-style: italic; margin-bottom: 0;">Discipleship Request Form</h3>
                      <p class="registration-subtitle" style="font-family: 'Georgia', serif; font-style: italic; margin-bottom: 0;">
                        {{ isLoggedIn ? 'Select your area of interest below.' : 'Please fill out your details below.' }}
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

                  <el-form-item label="I am interested in:" required>
                    <div class="text-caption grey--text">
                      <v-icon size="small" color="teal">mdi-check-circle</v-icon>
                      Salvation Talk & Bible Study (Included)
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
import { ref, reactive, watch, computed } from 'vue';
import { useDiscipleshipStore } from '@/stores/discipleshipStore';
import { ElMessage, ElMessageBox } from 'element-plus';

const discipleshipStore = useDiscipleshipStore();
const formRef = ref(null);

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
  request_type: 'Both'
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

const selectedinterests = ref(['Salvation Talk', 'Bible Study']);

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
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  formData.request_type = 'Both';
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const success = await discipleshipStore.submitDiscipleshipRequest(formData);
      if (success) {
        ElMessageBox.alert(
          'Your discipleship request has been successfully sent! Our team will review your information and reach out to you via email or phone to schedule your session. Thank you!',
          'Request Submitted',
          {
            confirmButtonText: 'OK',
            type: 'success',
            callback: () => {
              formRef.value.resetFields();
              selectedinterests.value = ['Salvation Talk', 'Bible Study'];
            }
          }
        );
      }
    }
  });
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
</style>
