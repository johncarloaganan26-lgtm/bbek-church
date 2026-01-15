<template>
  <div class="water-baptism-page">
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div
          class="hero-background"
          :style="{ backgroundImage: `url(${waterBaptismData.heroImage || '/img/waterbap.jpg'})` }"
        ></div>
        <div class="hero-overlay"></div>

        <!-- Floating elements -->
        <div class="floating-elements">
          <div class="floating-element float-1"></div>
          <div class="floating-element float-2"></div>
          <div class="floating-element float-3 clip-path-triangle"></div>
          <div class="floating-element float-4 clip-path-star"></div>
          <div class="floating-element float-5"></div>
          <div class="floating-element float-6"></div>
          <div class="floating-element float-7"></div>
          <div class="floating-element float-8 clip-path-diamond"></div>
          <div class="floating-element float-9"></div>
        </div>

        <div class="hero-content">
          <h1 class="hero-title fade-in-up" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ waterBaptismData.heroTitle }}
          </h1>
          <p class="hero-subtitle fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ waterBaptismData.heroDescription }}
          </p>
        </div>
      </section>

      <!-- Content Section -->
      <section class="content-section" id="learn-more">
        <!-- Floating elements -->
        <div class="floating-elements">
          <div class="floating-element float-1"></div>
          <div class="floating-element float-2"></div>
          <div class="floating-element float-3"></div>
          <div class="floating-element float-4"></div>
          <div class="floating-element float-5"></div>
          <div class="floating-element float-6"></div>
          <div class="floating-element float-7 clip-path-star"></div>
          <div class="floating-element float-8 clip-path-triangle"></div>
          <div class="floating-element float-9"></div>
          <div class="floating-element float-10"></div>
          <div class="floating-element float-11"></div>
          <div class="floating-element float-12 clip-path-diamond"></div>
        </div>

        <v-container>
          <div class="content-grid">
            <!-- Left Column: What is Water Baptism -->
            <div class="left-column">
              <h2 class="section-title fade-in" style="animation-delay: 200ms; font-family: 'Georgia', serif; font-style: italic;">
                {{ waterBaptismData.sectionTitle }}
              </h2>
              
              <div class="info-cards">
                <v-card class="info-card fade-in-up" style="animation-delay: 300ms;" variant="flat" color="teal-lighten-5">
                  <v-card-title class="card-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                    {{ waterBaptismData.biblicalFoundationTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                      {{ waterBaptismData.biblicalFoundationText }}
                    </p>
                  </v-card-text>
                </v-card>

                <v-card class="info-card fade-in-up" style="animation-delay: 400ms;" variant="flat" color="teal-lighten-5">
                  <v-card-title class="card-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                    {{ waterBaptismData.significanceTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                      {{ waterBaptismData.significanceText }}
                    </p>
                  </v-card-text>
                </v-card>
              </div>

              <v-card class="who-baptized-card fade-in" style="animation-delay: 500ms;" variant="flat" color="teal-lighten-5">
                <v-card-title class="who-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">{{ waterBaptismData.whoShouldBeBaptizedTitle }}</v-card-title>
                <v-card-text>
                  <ul class="baptized-list">
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ waterBaptismData.whoPoint1 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ waterBaptismData.whoPoint2 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ waterBaptismData.whoPoint3 }}</span>
                    </li>
                  </ul>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right Column: Register for Baptism or Member Certificate -->
            <div class="right-column" id="register">
              <template v-if="isMember">
                <template v-if="loadingCertificate">
                  <div class="loading-container">
                    <v-progress-circular indeterminate color="teal" size="48"></v-progress-circular>
                    <span class="loading-text" style="font-family: 'Georgia', serif; font-style: italic;">Loading your certificate...</span>
                  </div>
                </template>
                <template v-else-if="memberBaptismData">
                  <v-card class="welcome-card fade-in-up" style="animation-delay: 700ms;">
                    <div class="welcome-content">
                      <div class="welcome-icon">
                        <v-icon icon="mdi-hand-heart" size="60" color="white"></v-icon>
                      </div>
                      <h2 class="welcome-title">Thank You and Welcome to BBek!</h2>
                      <p class="welcome-message" style="font-family: 'Georgia', serif; font-style: italic;">
                        {{ memberBaptismData.firstname }}, we are grateful that you have taken the step
                        of water baptism. You are now part of our church family.
                      </p>
                      <p class="welcome-submessage" style="font-family: 'Georgia', serif; font-style: italic;">
                        May God bless you as you continue your journey with Him.
                      </p>
                      <v-btn color="teal" @click="$router.push('/services')" class="welcome-btn">
                        <v-icon start>mdi-church</v-icon>
                        Explore Our Services
                      </v-btn>
                    </div>
                  </v-card>
                </template>
                <template v-else>
                  <h2 class="section-title fade-in" style="animation-delay: 700ms; font-family: 'Georgia', serif; font-style: italic;">
                    Welcome Back, Beloved Member!
                  </h2>
                  <v-card class="member-card">
                    <v-card-title class="member-title" style="font-family: 'Georgia', serif; font-style: italic;">
                      You Are Already a Member of Our Church Family
                    </v-card-title>
                    <v-card-text>
                      <p class="member-text" style="font-family: 'Georgia', serif; font-style: italic;">
                        Thank you for being part of our community! As a baptized member,
                        we invite you to continue your spiritual journey with us.
                      </p>
                      <div class="services-info">
                        <h3 class="services-title" style="font-family: 'Georgia', serif; font-style: italic;">Join Our Sunday Services</h3>
                        <p class="services-text" style="font-family: 'Georgia', serif; font-style: italic;">
                          We warmly invite you to join us for our Sunday worship services where we gather
                          to praise, pray, and grow in faith together.
                        </p>
                        <div class="services-list">
                          <div class="service-item">
                            <v-icon color="teal" size="16">mdi-check</v-icon>
                            <span style="font-family: 'Georgia', serif; font-style: italic;">Sunday Morning Service: 9:00 AM</span>
                          </div>
                          <div class="service-item">
                            <v-icon color="teal" size="16">mdi-check</v-icon>
                            <span style="font-family: 'Georgia', serif; font-style: italic;">Sunday Evening Service: 5:00 PM</span>
                          </div>
                        </div>
                        <v-btn color="teal" @click="$router.push('/services')" class="services-btn">
                          Explore Our Services
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </template>
              </template>
              <template v-else>
                <h2 class="section-title fade-in" style="animation-delay: 700ms; font-family: 'Georgia', serif; font-style: italic;">
                  Register for Baptism and Become Part of Our Family
                </h2>
                <el-card class="registration-card fade-in-up" style="animation-delay: 800ms;" shadow="hover">
                  <template #header>
                    <div class="registration-header">
                      <h3 class="registration-title" style="font-family: 'Georgia', serif; font-style: italic;">Baptism Registration Form</h3>
                      <p class="registration-subtitle" style="font-family: 'Georgia', serif; font-style: italic;">
                        Please fill out this form to register for an upcoming baptism service.
                      </p>
                    </div>
                  </template>
                  <el-form
                    ref="formRef"
                    :model="formData"
                    :rules="rules"
                    label-width="0"
                    label-position="top"
                    :hide-required-asterisk="true"
                    class="registration-form"
                  >
                    <div class="form-row">
                      <el-form-item label="First Name" prop="firstname" class="form-group">
                        <template #label>
                          <span>First Name <span class="required-text">Required</span></span>
                        </template>
                        <el-input
                          v-model="formData.firstname"
                          placeholder="Enter your first name"
                          size="large"
                          :disabled="memberRegistrationStore.loading"
                        />
                      </el-form-item>
                      <el-form-item label="Middle Name" prop="middleName" class="form-group">
                        <template #label>
                          <span>Middle Name</span>
                        </template>
                        <el-input
                          v-model="formData.middleName"
                          placeholder="Enter your middle name"
                          size="large"
                          :disabled="memberRegistrationStore.loading"
                        />
                      </el-form-item>
                    </div>

                    <div class="form-row">
                      <el-form-item label="Last Name" prop="lastname" class="form-group">
                        <template #label>
                          <span>Last Name <span class="required-text">Required</span></span>
                        </template>
                        <el-input
                          v-model="formData.lastname"
                          placeholder="Enter your last name"
                          size="large"
                          :disabled="memberRegistrationStore.loading"
                        />
                      </el-form-item>
                      <el-form-item label="Birthdate" prop="birthdate" class="form-group">
                        <template #label>
                          <span>Birthdate <span class="required-text">Required</span></span>
                        </template>
                        <el-date-picker
                          v-model="formData.birthdate"
                          type="date"
                          placeholder="Select birthdate"
                          size="large"
                          format="YYYY-MM-DD"
                          value-format="YYYY-MM-DD"
                          style="width: 100%"
                          :disabled="memberRegistrationStore.loading"
                        />
                      </el-form-item>
                    </div>

                    <div class="form-row">
                      <el-form-item label="Age" prop="age" class="form-group">
                        <template #label>
                          <span>Age <span class="required-text">Required (12+ years old)</span></span>
                        </template>
                        <el-input
                          v-model.number="formData.age"
                          type="number"
                          placeholder="Enter your age"
                          size="large"
                          readonly
                          :disabled="memberRegistrationStore.loading"
                        />
                      </el-form-item>
                      <el-form-item label="Sex" prop="gender" class="form-group">
                        <template #label>
                          <span>Sex <span class="required-text">Required</span></span>
                        </template>
                        <el-select
                          v-model="formData.gender"
                          placeholder="Select sex"
                          size="large"
                          style="width: 100%"
                          :disabled="memberRegistrationStore.loading"
                        >
                          <el-option label="Male" value="M" />
                          <el-option label="Female" value="F" />
                        </el-select>
                      </el-form-item>
                    </div>

                    <el-form-item label="Address" prop="address" class="form-group">
                      <template #label>
                        <span>Address <span class="required-text">Required</span></span>
                      </template>
                      <el-input
                        v-model="formData.address"
                        type="textarea"
                        :rows="3"
                        placeholder="Enter your address"
                        size="large"
                        :disabled="memberRegistrationStore.loading"
                      />
                    </el-form-item>

                    <el-form-item label="Email" prop="email" class="form-group">
                      <template #label>
                        <span>Email <span class="required-text">Required</span></span>
                      </template>
                      <el-input
                        v-model="formData.email"
                        type="email"
                        placeholder="Enter your email"
                        size="large"
                        :disabled="memberRegistrationStore.loading"
                      />
                    </el-form-item>

                    <el-form-item label="Phone Number" prop="phoneNumber" class="form-group">
                      <template #label>
                        <span>Phone Number <span class="required-text">Required</span></span>
                      </template>
                      <el-input
                        v-model="formData.phoneNumber"
                        type="tel"
                        placeholder="9XXXXXXXXX"
                        size="large"
                        :maxlength="10"
                        :disabled="memberRegistrationStore.loading"
                      >
                        <template #prepend>+63</template>
                      </el-input>
                    </el-form-item>

                    <el-form-item label="Civil Status" prop="civilStatus" class="form-group">
                      <template #label>
                        <span>Civil Status <span class="required-text">Required</span></span>
                      </template>
                      <el-select
                        v-model="formData.civilStatus"
                        placeholder="Select civil status"
                        size="large"
                        style="width: 100%"
                        :disabled="memberRegistrationStore.loading"
                      >
                        <el-option label="Single" value="single" />
                        <el-option label="Married" value="married" />
                        <el-option label="Widowed" value="widowed" />
                        <el-option label="Divorced" value="divorced" />
                        <el-option label="Separated" value="separated" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="Profession" prop="profession" class="form-group">
                      <template #label>
                        <span>Profession</span>
                      </template>
                      <el-input
                        v-model="formData.profession"
                        placeholder="Enter your profession"
                        size="large"
                        :disabled="memberRegistrationStore.loading"
                      />
                    </el-form-item>


                    <!-- Spouse and Children fields - shown only if married -->
                    <template v-if="formData.civilStatus === 'married'">
                      <el-form-item label="Spouse Name" prop="spouseName" class="form-group">
                        <template #label>
                          <span>Spouse Name</span>
                        </template>
                        <el-input
                          v-model="formData.spouseName"
                          placeholder="Enter spouse's full name"
                          size="large"
                          :disabled="memberRegistrationStore.loading"
                        />
                      </el-form-item>

                      <el-form-item label="Marriage Date" prop="marriageDate" class="form-group">
                        <template #label>
                          <span>Marriage Date</span>
                        </template>
                        <el-date-picker
                          v-model="formData.marriageDate"
                          type="date"
                          placeholder="Select marriage date"
                          size="large"
                          format="YYYY-MM-DD"
                          value-format="YYYY-MM-DD"
                          style="width: 100%"
                          :disabled="memberRegistrationStore.loading"
                        />
                      </el-form-item>
                    </template>

                    <!-- Children Section -->
                    <div class="children-section">
                      <h4 class="children-title" style="font-family: 'Georgia', serif; font-style: italic;">Children Information</h4>
                      <p class="children-subtitle" style="font-family: 'Georgia', serif; font-style: italic;">You can add information about your children at any time (optional)</p>

                      <div v-for="(child, index) in formData.children" :key="index" class="child-item">
                        <div class="child-header">
                          <span class="child-number">Child {{ index + 1 }}</span>
                          <el-button
                            type="danger"
                            size="small"
                            @click="removeChild(index)"
                            :disabled="memberRegistrationStore.loading"
                          >
                            Remove
                          </el-button>
                        </div>

                        <div class="form-row">
                          <el-form-item :label="`Child ${index + 1} Name`" :prop="`children.${index}.name`" class="form-group">
                            <el-input
                              v-model="child.name"
                              :placeholder="`Enter child ${index + 1} name`"
                              size="large"
                              :disabled="memberRegistrationStore.loading"
                            />
                          </el-form-item>
                          <el-form-item :label="`Child ${index + 1} Age`" :prop="`children.${index}.age`" class="form-group">
                            <el-input
                              v-model.number="child.age"
                              type="number"
                              :placeholder="`Enter child ${index + 1} age`"
                              size="large"
                              :disabled="memberRegistrationStore.loading"
                            />
                          </el-form-item>
                        </div>

                        <div class="form-row">
                          <el-form-item :label="`Child ${index + 1} Gender`" :prop="`children.${index}.gender`" class="form-group">
                            <el-select
                              v-model="child.gender"
                              :placeholder="`Select child ${index + 1} gender`"
                              size="large"
                              style="width: 100%"
                              :disabled="memberRegistrationStore.loading"
                            >
                              <el-option label="Male" value="M" />
                              <el-option label="Female" value="F" />
                            </el-select>
                          </el-form-item>
                          <el-form-item :label="`Child ${index + 1} Birthday`" :prop="`children.${index}.birthday`" class="form-group">
                            <el-date-picker
                              v-model="child.birthday"
                              type="date"
                              :placeholder="`Select child ${index + 1} birthday`"
                              size="large"
                              format="YYYY-MM-DD"
                              value-format="YYYY-MM-DD"
                              style="width: 100%"
                              :disabled="memberRegistrationStore.loading"
                            />
                          </el-form-item>
                        </div>
                      </div>

                      <el-button
                        type="primary"
                        size="large"
                        @click="addChild"
                        :disabled="memberRegistrationStore.loading"
                        class="add-child-btn"
                      >
                        <v-icon start>add</v-icon>
                        Add Child
                      </el-button>
                    </div>

                    <el-form-item label="Guardian Name" prop="guardianName" class="form-group">
                      <template #label>
                        <span>Guardian Name (Optional)</span>
                      </template>
                      <el-input
                        v-model="formData.guardianName"
                        placeholder="Enter guardian's full name"
                        size="large"
                        :disabled="memberRegistrationStore.loading"
                      />
                    </el-form-item>

                    <el-form-item label="Guardian Contact" prop="guardianContact" class="form-group">
                      <template #label>
                        <span>Guardian Contact (Optional)</span>
                      </template>
                      <el-input
                        v-model="formData.guardianContact"
                        type="tel"
                        placeholder="9XXXXXXXXX"
                        size="large"
                        :maxlength="10"
                        :disabled="memberRegistrationStore.loading"
                      >
                        <template #prepend>+63</template>
                      </el-input>
                    </el-form-item>

                    <el-form-item label="Guardian Relationship" prop="guardianRelationship" class="form-group">
                      <template #label>
                        <span>Guardian Relationship (Optional)</span>
                      </template>
                      <el-select
                        v-model="formData.guardianRelationship"
                        placeholder="Select relationship"
                        size="large"
                        style="width: 100%"
                        :disabled="memberRegistrationStore.loading"
                      >
                        <el-option label="Parent" value="parent" />
                        <el-option label="Grandparent" value="grandparent" />
                        <el-option label="Sibling" value="sibling" />
                        <el-option label="Guardian" value="guardian" />
                        <el-option label="Other" value="other" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="Your Testimony" prop="testimony" class="form-group">
                      <template #label>
                        <span>Your Testimony (Optional)</span>
                      </template>
                      <el-input
                        v-model="formData.testimony"
                        type="textarea"
                        :rows="4"
                        placeholder="Share your journey to faith in Christ"
                        :disabled="memberRegistrationStore.loading"
                      />
                    </el-form-item>

                    <el-form-item>
                      <el-button
                        type="primary"
                        size="large"
                        class="submit-btn"
                        :loading="memberRegistrationStore.loading"
                        :disabled="memberRegistrationStore.loading"
                        @click="handleSubmit"
                      >
                        Submit Registration
                      </el-button>
                    </el-form-item>

                    <el-alert
                      v-if="submitMessage"
                      type="success"
                      :closable="false"
                      show-icon
                      class="mt-4"
                    >
                      {{ submitMessage }}
                    </el-alert>
                    <el-alert
                      v-if="submitError"
                      type="error"
                      :closable="false"
                      show-icon
                      class="mt-4"
                    >
                      {{ submitError }}
                    </el-alert>
                  </el-form>
                </el-card>
              </template>
            </div>
          </div>
        </v-container>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMemberRegistrationStore } from '@/stores/memberRegistrationStore'
import { useWaterBaptismStore } from '@/stores/ServicesRecords/waterBaptismStore'
import { useChurchLeadersStore } from '@/stores/ChurchRecords/churchLeadersStore'
import axios from '@/api/axios'

const router = useRouter()
const memberRegistrationStore = useMemberRegistrationStore()
const waterBaptismStore = useWaterBaptismStore()
const churchLeadersStore = useChurchLeadersStore()

const user = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const pastors = ref([])
const churchLeaders = ref([])
// Form ref
const formRef = ref(null)

// Form data
const formData = reactive({
  firstname: '',
  middleName: '',
  lastname: '',
  birthdate: null,
  age: 0,
  gender: '',
  address: '',
  email: '',
  phoneNumber: '',
  civilStatus: '',
  profession: '',
  spouseName: '',
  marriageDate: null,
  children: [],
  testimony: '',
  preferredDate: null,
  guardianName: '',
  guardianContact: '',
  guardianRelationship: ''
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
    { required: true, message: 'Birthdate is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('Birthdate is required'))
          return
        }
        const birth = new Date(value)
        const today = new Date()
        if (birth >= today) {
          callback(new Error('Birthdate cannot be today or in the future'))
          return
        }
        // Check if too far in the past (more than 100 years)
        const minDate = new Date()
        minDate.setFullYear(today.getFullYear() - 100)
        if (birth < minDate) {
          callback(new Error('Birthdate is too far in the past'))
          return
        }
        // Check if person is at least 12 years old
        let calculatedAge = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          calculatedAge--
        }
        if (calculatedAge < 12) {
          callback(new Error('You must be at least 12 years old to be baptized'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  age: [
    { required: true, message: 'Age is required', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: 'Sex is required', trigger: 'change' }
  ],
  address: [
    { required: true, message: 'Address is required', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  phoneNumber: [
    { required: true, message: 'Phone number is required', trigger: 'blur' },
    { min: 10, max: 10, message: 'Phone number must be 10 digits', trigger: 'blur' }
  ],
  civilStatus: [
    { required: true, message: 'Civil status is required', trigger: 'change' }
  ],
  guardianContact: [
    {
      pattern: /^(\d{10})?$/,
      message: 'Guardian contact must be 10 digits if provided',
      trigger: 'blur'
    }
  ]
}

const isMember = ref(false)
const memberBaptismData = ref(null)
const loadingCertificate = ref(false)
const submitMessage = ref('')
const submitError = ref('')

// Water Baptism CMS data
const waterBaptismData = ref({
  heroImage: '/img/waterbap.jpg',
  heroTitle: 'Water Baptism',
  heroDescription: 'Take the next step in your faith journey through water baptism, a public declaration of your commitment to follow Jesus Christ.',
  sectionTitle: 'What is Water Baptism?',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText: 'Water baptism is an act of obedience symbolizing the believer\'s faith in a crucified, buried, and risen Savior. It is a public declaration of one\'s faith and commitment to Christ.',
  significanceTitle: 'Significance',
  significanceText: 'Baptism illustrates Christ\'s death, burial, and resurrection. When you are immersed in water, you identify with Christ\'s death and burial, and when you come out of the water, you identify with His resurrection.',
  whoShouldBeBaptizedTitle: 'Who Should Be Baptized?',
  whoPoint1: 'Those who have accepted Jesus Christ as their personal Savior',
  whoPoint2: 'Those who understand the meaning and significance of baptism',
  whoPoint3: 'Those who are willing to publicly profess their faith in Christ'
})

// Fetch water baptism data from CMS
const fetchWaterBaptismData = async () => {
  try {
    const response = await axios.get('/cms/waterbaptism/full')
    if (response.data.success && response.data.data) {
      const { page, images } = response.data.data
      const content = page?.content || {}
      
      // Update water baptism data
      waterBaptismData.value.heroTitle = content.heroTitle || waterBaptismData.value.heroTitle
      waterBaptismData.value.heroDescription = content.heroDescription || waterBaptismData.value.heroDescription
      waterBaptismData.value.sectionTitle = content.sectionTitle || waterBaptismData.value.sectionTitle
      waterBaptismData.value.biblicalFoundationTitle = content.biblicalFoundationTitle || waterBaptismData.value.biblicalFoundationTitle
      waterBaptismData.value.biblicalFoundationText = content.biblicalFoundationText || waterBaptismData.value.biblicalFoundationText
      waterBaptismData.value.significanceTitle = content.significanceTitle || waterBaptismData.value.significanceTitle
      waterBaptismData.value.significanceText = content.significanceText || waterBaptismData.value.significanceText
      waterBaptismData.value.whoShouldBeBaptizedTitle = content.whoShouldBeBaptizedTitle || waterBaptismData.value.whoShouldBeBaptizedTitle
      waterBaptismData.value.whoPoint1 = content.whoPoint1 || waterBaptismData.value.whoPoint1
      waterBaptismData.value.whoPoint2 = content.whoPoint2 || waterBaptismData.value.whoPoint2
      waterBaptismData.value.whoPoint3 = content.whoPoint3 || waterBaptismData.value.whoPoint3
      
      // Handle hero image
      if (images?.heroImage) {
        waterBaptismData.value.heroImage = images.heroImage
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching water baptism data from CMS:', error)
    }
  }
}

// Watch birthdate to calculate age
watch(() => formData.birthdate, (newDate) => {
  if (!newDate) {
    formData.age = 0
    return
  }

  const birth = new Date(newDate)
  const today = new Date()
  
  if (birth >= today) {
    ElMessage.error('Invalid birthdate. Birthdate cannot be today or in the future.')
    formData.birthdate = null
    formData.age = 0
    return
  }

  let calculatedAge = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    calculatedAge--
  }

  // Check if person is at least 12 years old
  if (calculatedAge < 12) {
    ElMessage.error('You must be at least 12 years old to be baptized')
    formData.birthdate = null
    formData.age = 0
    return
  }

  formData.age = calculatedAge
})

// Normalize phone number input to digits only and cap at 10 digits (Philippines local without country code)
watch(() => formData.phoneNumber, (val) => {
  const digits = (val || '').replace(/\D/g, '').slice(0, 10)
  if (digits !== val) {
    formData.phoneNumber = digits
  }
})

// Format phone number with +63 country code
const formatPhoneNumber = (raw) => {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  // If user includes leading 0, drop it for international format
  const trimmed = digits.startsWith('0') ? digits.slice(1) : digits
  const withoutPrefix = trimmed.startsWith('63') ? trimmed.slice(2) : trimmed
  return `+63${withoutPrefix}`
}

// Check if user is member and fetch data
onMounted(async () => {
  await fetchWaterBaptismData()
  await churchLeadersStore.fetchLeaders()
  churchLeaders.value = churchLeadersStore.leaders
  console.log('Church Leaders:', churchLeaders.value)
  await churchLeadersStore.fetchMemberOptions()
  pastors.value = churchLeadersStore.memberOptions
  await fetchMemberBaptismData()
})

const fetchMemberBaptismData = async () => {
  loadingCertificate.value = true
  try {
    // Check if user has member data
    if (!user.value || !user.value.member || !user.value.member.member_id) {
      console.log('User is not a member or member_id not found')
      isMember.value = false
      return
    }
    const memberId = user.value.member.member_id
    console.log('Fetching baptism data for member ID:', memberId)
    
    const baptismData = await waterBaptismStore.fetchBaptismByMemberId(memberId)
    console.log('Baptism data received:', baptismData)
    
    if (baptismData) {
      isMember.value = true
      memberBaptismData.value = baptismData
      console.log('Member baptism data set:', memberBaptismData.value)
    } else {
      isMember.value = true // User is a member but no baptism record found
      memberBaptismData.value = null
    }
  } catch (error) {
    console.error('Error fetching member baptism data:', error)
    isMember.value = false
  } finally {
    loadingCertificate.value = false
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Format member baptism data for CertificatePreview
const formattedCertificateData = computed(() => {
  if (!memberBaptismData.value) return null
  
  const data = memberBaptismData.value
  const fullName = data.fullname || `${data.firstname || ''} ${data.middle_name || ''} ${data.lastname || ''}`.trim()
  
  return {
    service: {
      member_fullname: fullName,
      member_birthdate: data.birthdate || '',
      member_address: data.address || '',
      baptism_date: data.baptism_date || '',
      baptism_location: data.baptism_location || data.location || '',
      member_id: data.member_id || data.member_member_id || '',
      member_date_created: data.member_date_created || data.date_created || '',
      pastor_fullname: pastors.value && pastors.value.length > 0 
        ? pastors.value[pastors.value.length - 1].name 
        : 'Rev. Fresco Q. Sulapas',
      minister_fullname: pastors.value && pastors.value.length > 0 
        ? pastors.value[pastors.value.length - 1].name 
        : 'Rev. Fresco Q. Sulapas',
      witness_fullname: data.witness_fullname || data.witness_name || '',
      civil_status: data.civil_status || '',
      member_civil_status: data.civil_status || '',
      desire_ministry: data.desire_ministry || '',
      if_married: data.if_married || '',
      spouse_name: data.spouse_name || '',
      marriage_date: data.marriage_date || '',
      fited_date: data.fited_date || data.fitted_date || data.date_fited || data.baptism_date || '',
      date_created: data.date_created || ''
    }
  }
})

const openCertificatePreview = () => {
  if (memberBaptismData.value) {
    // Store certificate data in sessionStorage as fallback
    sessionStorage.setItem('certificateData', JSON.stringify(formattedCertificateData.value))
    
    // Navigate to certificate preview page with data
    router.push({
      name: 'CertificatePreview',
      params: { type: 'baptism' },
      state: {
        certificateData: formattedCertificateData.value
      }
    })
  } else {
    ElMessage.error('Certificate data not available')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  submitMessage.value = ''
  submitError.value = ''

  try {
    // Validate form
    await formRef.value.validate()
    
    await ElMessageBox.confirm(
      'Please confirm you want to submit your baptism registration. You will receive an email with account setup details after submission.',
      'Confirm Submission',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    // Prepare payload - use snake_case to match database columns
    const payload = {
      firstname: formData.firstname.trim(),
      middle_name: formData.middleName.trim() || null,
      lastname: formData.lastname.trim(),
      birthdate: formData.birthdate,
      age: formData.age,
      gender: formData.gender,
      address: formData.address.trim(),
      email: formData.email.trim(),
      phone_number: formatPhoneNumber(formData.phoneNumber),
      civil_status: formData.civilStatus,
      profession: formData.profession.trim() || null,
      spouse_name: formData.spouseName.trim() || null,
      marriage_date: formData.marriageDate || null,
      children: formData.children.length > 0 ? JSON.stringify(formData.children) : null,
      testimony: formData.testimony.trim() || null,
      preferred_date: formData.preferredDate || null,
      guardian_name: formData.guardianName.trim() || null,
      guardian_contact: formData.guardianContact ? formatPhoneNumber(formData.guardianContact) : null,
      guardian_relationship: formData.guardianRelationship || null
    }
    console.log(payload ,'register water baptism')
    const result = await memberRegistrationStore.registerNonMemberWaterBaptism(payload)
    
    if (result.success) {
      submitMessage.value = 'Registration submitted successfully!'
      ElMessage.success('Registration submitted successfully!')
      // Clear form
      resetForm()
    } else {
      // Enhanced error trapping for common issues
      const errorMsg = result.error || result.message || ''
      const errors = result.errors || []
      
      // Check for duplicate email
      if (errorMsg.toLowerCase().includes('email') && 
          (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('duplicate') || 
           errorMsg.toLowerCase().includes('registered'))) {
        submitError.value = 'This email address is already registered. Please use a different email or contact support.'
        ElMessage.error('This email address is already registered')
      }
      // Check for duplicate phone
      else if (errorMsg.toLowerCase().includes('phone') && 
               (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('duplicate'))) {
        submitError.value = 'This phone number is already registered. Please use a different number or contact support.'
        ElMessage.error('This phone number is already registered')
      }
      // Check for member already exists
      else if (errorMsg.toLowerCase().includes('duplicate member') || 
               errorMsg.toLowerCase().includes('member already')) {
        submitError.value = 'A member with the same name and birthdate already exists in our system. Please contact the church office for assistance.'
        ElMessage.error('Member already exists in our system')
      }
      // Check for account already exists
      else if (errorMsg.toLowerCase().includes('account') && 
               (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists'))) {
        submitError.value = 'An account with this email already exists. Please use a different email or login to your existing account.'
        ElMessage.error('An account with this email already exists')
      }
      // Display all errors from the errors array if available
      else if (errors.length > 0) {
        submitError.value = errors.join(', ')
        ElMessage.error(errors[0])
      }
      // Default error message
      else {
        submitError.value = result.error || 'An error occurred. Please try again.'
        ElMessage.error(result.error || 'An error occurred. Please try again.')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Validation failed or submission cancelled:', error)
      if (error !== 'Validation failed') {
        ElMessage.error('Please fill in all required fields correctly.')
      }
    }
  }
}

const addChild = () => {
  formData.children.push({
    name: '',
    age: null,
    gender: '',
    birthday: null
  })
}

const removeChild = (index) => {
  formData.children.splice(index, 1)
}

const resetForm = () => {
  formData.firstname = ''
  formData.middleName = ''
  formData.lastname = ''
  formData.birthdate = null
  formData.age = 0
  formData.gender = ''
  formData.address = ''
  formData.email = ''
  formData.phoneNumber = ''
  formData.civilStatus = ''
  formData.profession = ''
  formData.spouseName = ''
  formData.marriageDate = null
  formData.children = []
  formData.testimony = ''
  formData.preferredDate = null
  formData.guardianName = ''
  formData.guardianContact = ''
  formData.guardianRelationship = ''

  // Clear validation
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}
</script>

<style scoped>
.water-baptism-page {
  width: 100vw;
  min-height: 100vh;
  background: white;
  position: relative;
}

.main-content {
  width: 100%;
  flex: 1;
}

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  margin-top: 64px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3));
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  background: rgba(63, 211, 194, 0.62);
  border-radius: 50%;
  animation: float 3.5s ease-in-out infinite;
}

.float-1 { top: 80px; left: 80px; width: 48px; height: 48px; animation-delay: 0s; }
.float-2 { top: 33%; right: 64px; width: 32px; height: 32px; animation-delay: 1.5s; animation-name: floatRotate; }
.float-3 { bottom: 33%; left: 64px; width: 40px; height: 40px; animation-delay: 2s; }
.float-4 { bottom: 80px; right: 80px; width: 24px; height: 24px; animation-delay: 0.8s; }
.float-5 { top: 50%; left: 25%; width: 28px; height: 28px; animation-delay: 1.2s; animation-name: floatRotate12; }
.float-6 { bottom: 25%; right: 33%; width: 36px; height: 36px; animation-delay: 2.5s; }
.float-7 { top: 25%; left: 33%; width: 16px; height: 16px; animation-delay: 1.8s; animation-name: floatRotate; }
.float-8 { top: 75%; right: 25%; width: 44px; height: 44px; animation-delay: 0.3s; }
.float-9 { bottom: 50%; left: 16%; width: 20px; height: 20px; animation-delay: 2.1s; }
.float-10 { top: 40px; left: 40px; width: 64px; height: 64px; animation-delay: 0s; }
.float-11 { top: 80px; right: 80px; width: 48px; height: 48px; animation-delay: 1s; }
.float-12 { bottom: 80px; left: 80px; width: 56px; height: 56px; animation-delay: 2s; animation-name: floatRotate; }

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes floatRotate {
  0%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  50% {
    transform: translateY(-20px) rotate(225deg);
  }
}

@keyframes floatRotate12 {
  0%, 100% {
    transform: translateY(0) rotate(12deg);
  }
  50% {
    transform: translateY(-20px) rotate(192deg);
  }
}

.clip-path-star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  border-radius: 0;
}

.clip-path-triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  border-radius: 0;
}

.clip-path-diamond {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  border-radius: 0;
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 16px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -0.025em;
  font-family: 'Georgia', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.125rem;
  color: white;
  font-weight: 300;
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 5rem;
  }
  .hero-subtitle {
    font-size: 1.25rem;
  }
}

@media (max-width: 640px) {
  .hero-section {
    min-height: 70vh;
    margin-top: 64px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    padding: 0 16px;
  }

  .hero-content {
    padding: 0 16px;
  }

  .content-section {
    padding: 32px 0;
  }

  .section-title {
    font-size: 1.5rem;
    margin-bottom: 24px;
  }

  .info-cards {
    gap: 16px;
    margin-bottom: 24px;
  }

  .card-title {
    font-size: 1.25rem;
  }

  .who-baptized-card {
    padding: 16px;
  }

  .who-title {
    font-size: 1.125rem;
  }

  .registration-card {
    margin-top: 24px;
  }

  .registration-title {
    font-size: 1.25rem;
  }

  .registration-subtitle {
    font-size: 0.8125rem;
  }

  .floating-element {
    display: none;
  }
}

/* Content Section */
.content-section {
  position: relative;
  padding: 64px 0;
  background: white;
  overflow: hidden;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  position: relative;
  z-index: 2;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.section-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 32px;
  font-family: 'Georgia', serif;
  color: #000;
}

.fade-in {
  animation: fadeIn 0.6s ease-out both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.info-cards {
  display: grid;
  gap: 24px;
  margin-bottom: 32px;
}

.info-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-left: 4px solid #14b8a6;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left-width: 6px;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
}

.who-baptized-card {
  padding: 24px;
  border-radius: 8px;
  border-left: 4px solid #14b8a6;
  transition: all 0.3s ease;
}

.who-baptized-card:hover {
  transform: translateX(8px);
  border-left-width: 6px;
}

.who-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
  color: #000;
}

.baptized-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.baptized-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  transition: transform 0.5s;
}

.baptized-item:hover {
  transform: translateX(8px);
}

.check-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

/* Loading */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 12px;
}

.loading-text {
  color: #4b5563;
  margin-left: 12px;
}

/* Certificate Card */
.certificate-card {
  background: linear-gradient(to bottom right, #eff6ff, #f0fdfa);
  padding: 32px;
  border-radius: 12px;
  border: 2px solid #5eead4;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.certificate-header {
  text-align: center;
  margin-bottom: 32px;
}

.certificate-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: #0d9488;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.certificate-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.certificate-church {
  color: #0d9488;
  font-weight: 500;
}

.certificate-body {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #5eead4;
  margin-bottom: 24px;
}

.certificate-text {
  text-align: center;
  margin-bottom: 24px;
}

.certificate-italic {
  color: #4b5563;
  font-style: italic;
  margin-bottom: 16px;
}

.certificate-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.certificate-description {
  color: #4b5563;
}

.certificate-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.certificate-detail {
  text-align: center;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
}

.certificate-verse {
  text-align: center;
  margin-bottom: 24px;
}

.verse-text {
  font-size: 0.875rem;
  color: #4b5563;
  font-style: italic;
  margin-bottom: 4px;
}

.verse-reference {
  font-size: 0.75rem;
  color: #6b7280;
}

.certificate-footer {
  text-align: center;
}

.signature-lines {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 16px;
}

.signature-line {
  text-align: center;
}

.line {
  border-top: 1px solid #9ca3af;
  width: 128px;
  margin: 0 auto 8px;
}

.signature-line p {
  font-size: 0.875rem;
  color: #4b5563;
}

.issued-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.certificate-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* Welcome Card */
.welcome-card {
  background: linear-gradient(to bottom right, #eff6ff, #f0fdfa);
  padding: 48px 32px;
  border-radius: 12px;
  border: 2px solid #5eead4;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: #0d9488;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
}

.welcome-message {
  font-size: 1rem;
  color: #4b5563;
  margin-bottom: 12px;
  line-height: 1.6;
}

.welcome-submessage {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
  margin-bottom: 8px;
}

.welcome-btn {
  width: 100%;
  margin-top: 24px;
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.welcome-btn:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

/* Member Card */
.member-card {
  border: 1px solid #5eead4;
  background: #f0fdfa;
}

.member-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f766e;
}

.member-text {
  color: #0f766e;
  margin-bottom: 16px;
}

.services-info {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #5eead4;
}

.services-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f766e;
  margin-bottom: 12px;
}

.services-text {
  color: #0f766e;
  margin-bottom: 16px;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #0f766e;
}

.services-btn {
  width: 100%;
  margin-top: 16px;
}

/* Registration Card */
.registration-card {
  border: 1px solid #5eead4;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.registration-header {
  padding-bottom: 8px;
}

.registration-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.registration-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.registration-form {
  padding: 0;
}

.registration-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.registration-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
  padding-bottom: 8px;
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

.registration-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.registration-form :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.registration-form :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.registration-form :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.registration-form :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.registration-form :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.registration-form :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.registration-form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
    gap: 0 20px;
  }
}

.form-group {
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.submit-btn:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

.mt-4 {
  margin-top: 16px;
}

/* Children Section Styles */
.children-section {
  margin-top: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.children-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.children-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 20px;
}

.child-item {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.child-number {
  font-weight: 600;
  color: #1f2937;
}

.add-child-btn {
  width: 100%;
  margin-top: 16px;
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.add-child-btn:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}
</style>

