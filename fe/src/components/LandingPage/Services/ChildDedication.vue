<template>
  <div class="child-dedication-page" style="position: relative; min-height: 100vh; background: white;">
    <!-- Loading overlay -->
    <v-overlay :model-value="loading" contained class="align-center justify-center" style="z-index: 1000;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <main class="main-content" style="min-height: 100vh; position: relative; z-index: 1;">
      <!-- Hero Section -->
      <section class="hero-section">
        <div
          class="hero-background"
          :style="{ backgroundImage: `url(${childDedicationData.heroImage || '/img/child-dedication.jpg'})` }"
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
            {{ childDedicationData.heroTitle }}
          </h1>
          <p class="hero-subtitle fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ childDedicationData.heroDescription }}
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
            <!-- Left Column: What is Child Dedication -->
            <div class="left-column">
              <!-- Available Dates Section -->
              <div class="availability-section">
                <h2 class="section-title fade-in" style="animation-delay: 100ms;">
                  Select Available Dates
                </h2>
                
                <v-card 
                  class="mb-4 fade-in-up schedule-card" 
                  style="animation-delay: 200ms;" 
                  variant="flat"
                >
                <v-card-title class="card-title" style="font-size: 1.25rem; font-weight: 600; background-color: #0d9488; color: white; padding: 16px;">
                  <v-icon color="white" class="mr-2">mdi-calendar-clock</v-icon>
                  Available Dates
                </v-card-title>
                <v-card-text>
                  <div v-if="loadingAvailableDates" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
                    <p class="mt-2 text-teal-darken-1" style="font-family: 'Georgia', serif;">Loading available dates...</p>
                  </div>
                  <div v-else-if="availableDates.length === 0" class="text-center py-4">
                    <v-icon color="grey" size="48">mdi-calendar-remove</v-icon>
                    <p class="mt-2 text-grey-darken-1" style="font-family: 'Georgia', serif;">No available dates at this time</p>
                  </div>
                  <div v-else class="available-dates-list">
                    <p class="text-body-2 text-teal-darken-2 mb-3" style="font-family: 'Georgia', serif; font-style: italic;">
                      <v-icon size="16" color="teal-darken-2">mdi-information</v-icon>
                      Select an available date for your child dedication
                    </p>
                    <v-expansion-panels variant="accordion" class="dates-panel">
                      <v-expansion-panel
                        v-for="(dateSpec, index) in availableDates"
                        :key="dateSpec.date"
                        variant="flat"
                        class="mb-2 date-panel"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center justify-space-between w-100 pr-2">
                            <div>
                              <v-icon color="teal-darken-2" class="mr-2">mdi-calendar</v-icon>
                              <span class="font-weight-medium text-teal-darken-3">{{ dateSpec.displayDate }}</span>
                            </div>
                            <v-chip 
                              size="small" 
                              color="teal" 
                              variant="flat"
                              class="mr-2"
                              style="color: white !important;"
                            >
                              {{ dateSpec.requestCount }}/{{ dateSpec.timeSlots.reduce((sum, s) => sum + (s.maxCapacity || 0), 0) }} total booked
                            </v-chip>
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div class="time-slots-grid">
                            <v-chip
                              v-for="slot in dateSpec.timeSlots"
                              :key="slot.time"
                              size="small"
                              variant="outlined"
                              color="teal-darken-2"
                              class="ma-1 time-slot-chip"
                              @click="selectDedicationTimeSlot(dateSpec.date, slot.time)"
                              :title="slot.bookedMembers?.length > 0 ? 'Booked by: ' + slot.bookedMembers.join(', ') : 'No bookings yet'"
                            >
                              {{ slot.displayTime }} ({{ slot.requestCount }}/{{ slot.maxCapacity }})
                            </v-chip>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>

                  </div> <!-- available-dates-list -->
                </v-card-text>
              </v-card>
            </div> <!-- availability-section -->

            <!-- What is Child Dedication? -->
            <div class="mt-8">
              <h2 class="section-title fade-in" style="animation-delay: 200ms; font-family: 'Georgia', serif; font-style: italic;">
                {{ childDedicationData.sectionTitle }}
              </h2>
              
              <div class="info-cards">
                <v-card class="info-card fade-in-up" style="animation-delay: 300ms;" variant="flat" color="teal-lighten-5">
                  <v-card-title class="card-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                    {{ childDedicationData.biblicalFoundationTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                      {{ childDedicationData.biblicalFoundationText }}
                    </p>
                  </v-card-text>
                </v-card>

                <v-card class="info-card fade-in-up" style="animation-delay: 400ms;" variant="flat" color="teal-lighten-5">
                  <v-card-title class="card-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">
                    {{ childDedicationData.ourCommitmentTitle }}
                  </v-card-title>
                  <v-card-text>
                    <p style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7; color: #115e59;">
                      {{ childDedicationData.ourCommitmentText }}
                    </p>
                  </v-card-text>
                </v-card>
              </div>

              <v-card class="who-baptized-card fade-in" style="animation-delay: 500ms;" variant="flat" color="teal-lighten-5">
                <v-card-title class="who-title" style="font-family: 'Georgia', serif; font-style: italic; color: #0f766e;">{{ childDedicationData.whatWeOfferTitle }}</v-card-title>
                <v-card-text>
                  <ul class="baptized-list">
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ childDedicationData.offerPoint1 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ childDedicationData.offerPoint2 }}</span>
                    </li>
                    <li class="baptized-item">
                      <v-icon color="teal-darken-3" size="20" class="check-icon">mdi-check-circle</v-icon>
                      <span style="font-family: 'Georgia', serif; font-style: italic; color: #115e59;">{{ childDedicationData.offerPoint3 }}</span>
                    </li>
                  </ul>
                </v-card-text>
              </v-card>
              </div>
            </div>

            <!-- Right Column: Register for Child Dedication (Only for logged in users) -->
            <div class="right-column" id="register" v-if="userInfo.account && userInfo.account.acc_id">
              <h2 class="section-title fade-in" style="animation-delay: 700ms;">
                Request Child Dedication
              </h2>
              
              <!-- Inline Form for Member Users - Full Width Scrollable Form -->
              <v-card class="inline-form-card mt-4 fade-in-up" style="animation-delay: 900ms;">
                <v-card-title class="form-title">
                  Child Dedication Form
                </v-card-title>
                <v-card-subtitle class="mb-3">
                  Please fill out the form below to submit a child dedication request.
                </v-card-subtitle>
                <v-card-text>
                  <el-form
                    ref="inlineFormRef"
                    :model="inlineFormData"
                    :rules="inlineFormRules"
                    label-position="top"
                    v-loading="inlineFormLoading"
                  >
                    <!-- Requested By (Auto-filled, disabled for members) -->
                    <el-form-item label="Requested By">
                      <el-input
                        v-model="inlineRequesterDisplayName"
                        size="large"
                        disabled
                        placeholder="Your name will appear here"
                      />
                    </el-form-item>

                    <!-- Preferred Service Date & Time -->
                    <el-form-item label="Preferred Service Date & Time">
                      <el-date-picker
                        v-model="inlineFormData.preferred_dedication_date"
                        type="datetime"
                        placeholder="Select date and time"
                        format="MM/DD/YYYY hh:mm A"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        size="large"
                        style="width: 100%"
                        :disabled-date="disabledDates"
                      />
                      <div class="form-hint" style="font-size: 0.85rem; color: #666; margin-top: 4px;">
                        Please select an available date for the dedication ceremony.
                      </div>
                    </el-form-item>

                    <!-- Child's Information Section -->
                    <div class="form-section mb-4">
                      <div class="form-section-title">Child's Information</div>
                      <el-row :gutter="16">
                        <el-col :span="12">
                          <el-form-item prop="child_firstname" label="First Name" class="mb-3">
                            <el-input
                              v-model="inlineFormData.child_firstname"
                              placeholder="First name"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                        <el-col :span="12">
                          <el-form-item prop="child_lastname" label="Last Name" class="mb-3">
                            <el-input
                              v-model="inlineFormData.child_lastname"
                              placeholder="Last name"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="16">
                        <el-col :span="12">
                          <el-form-item prop="date_of_birth" label="Date of Birth" class="mb-3">
                            <el-date-picker
                              v-model="inlineFormData.date_of_birth"
                              type="date"
                              placeholder="Select date"
                              size="large"
                              format="YYYY-MM-DD"
                              value-format="YYYY-MM-DD"
                              style="width: 100%"
                              :disabled="inlineFormLoading"
                              :disabled-date="(date) => date > new Date()"
                            />
                          </el-form-item>
                        </el-col>
                        <el-col :span="12">
                          <el-form-item prop="place_of_birth" label="Place of Birth" class="mb-3">
                            <el-input
                              v-model="inlineFormData.place_of_birth"
                              placeholder="Place of birth"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-form-item prop="gender" label="Gender">
                        <el-radio-group v-model="inlineFormData.gender" size="large" :disabled="inlineFormLoading">
                          <el-radio label="M">Male</el-radio>
                          <el-radio label="F">Female</el-radio>
                        </el-radio-group>
                      </el-form-item>
                    </div>

                    <!-- Relationship Section -->
                    <div class="form-section mb-4">
                      <div class="form-section-title">Your Relationship to the Child</div>
                      <el-form-item prop="requester_relationship" label="Relationship">
                        <el-select
                          v-model="inlineFormData.requester_relationship"
                          placeholder="Select relationship"
                          size="large"
                          style="width: 100%"
                          :disabled="inlineFormLoading"
                          @change="onInlineRelationshipChange"
                        >
                          <el-option label="Father" value="father" />
                          <el-option label="Mother" value="mother" />
                          <el-option label="Grandparent" value="grandparent" />
                          <el-option label="Guardian" value="guardian" />
                          <el-option label="Other Family Member" value="other_family" />
                          <el-option label="Other" value="other" />
                        </el-select>
                      </el-form-item>
                    </div>

                    <!-- Parents Information Section -->
                    <div class="form-section mb-4">
                      <div class="form-section-title">Parents Information (Optional)</div>
                      <div class="text-subtitle-2 text-medium-emphasis mb-2">Father</div>
                      <el-row :gutter="16">
                        <el-col :span="12">
                          <el-form-item label="First Name">
                            <el-input
                              v-model="inlineFormData.father_firstname"
                              placeholder="First name"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                        <el-col :span="12">
                          <el-form-item label="Last Name">
                            <el-input
                              v-model="inlineFormData.father_lastname"
                              placeholder="Last name"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="16">
                        <el-col :span="12">
                          <el-form-item label="Phone">
                            <el-input
                              v-model="inlineFormData.father_phone_number"
                              placeholder="Phone"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                        <el-col :span="12">
                          <el-form-item label="Email">
                            <el-input
                              v-model="inlineFormData.father_email"
                              placeholder="Email"
                              size="large"
                              clearable
                              type="email"
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <div class="text-subtitle-2 text-medium-emphasis mb-2 mt-3">Mother</div>
                      <el-row :gutter="16">
                        <el-col :span="12">
                          <el-form-item label="First Name">
                            <el-input
                              v-model="inlineFormData.mother_firstname"
                              placeholder="First name"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                        <el-col :span="12">
                          <el-form-item label="Last Name">
                            <el-input
                              v-model="inlineFormData.mother_lastname"
                              placeholder="Last name"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="16">
                        <el-col :span="12">
                          <el-form-item label="Phone">
                            <el-input
                              v-model="inlineFormData.mother_phone_number"
                              placeholder="Phone"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                        <el-col :span="12">
                          <el-form-item label="Email">
                            <el-input
                              v-model="inlineFormData.mother_email"
                              placeholder="Email"
                              size="large"
                              clearable
                              type="email"
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                      </el-row>
                    </div>

                    <!-- Sponsors Section -->
                    <div class="form-section mb-4">
                      <div class="form-section-title">Sponsors (Optional)</div>
                      <el-form-item>
                        <div class="sponsors-table-wrapper">
                          <el-table
                            :data="inlineFormData.sponsors"
                            border
                            size="small"
                            class="sponsors-table"
                            max-height="200"
                          >
                            <el-table-column label="#" type="index" width="50" />
                            <el-table-column label="First Name" min-width="100">
                              <template #default="{ row }">
                                <el-input
                                  v-model="row.firstname"
                                  placeholder="First"
                                  size="small"
                                  clearable
                                  :disabled="inlineFormLoading"
                                />
                              </template>
                            </el-table-column>
                            <el-table-column label="Last Name" min-width="100">
                              <template #default="{ row }">
                                <el-input
                                  v-model="row.lastname"
                                  placeholder="Last"
                                  size="small"
                                  clearable
                                  :disabled="inlineFormLoading"
                                />
                              </template>
                            </el-table-column>
                            <el-table-column label="Phone" min-width="100">
                              <template #default="{ row }">
                                <el-input
                                  v-model="row.phone_number"
                                  placeholder="Phone"
                                  size="small"
                                  clearable
                                  :disabled="inlineFormLoading"
                                />
                              </template>
                            </el-table-column>
                            <el-table-column label="Actions" width="70" align="center">
                              <template #default="{ $index }">
                                <el-button
                                  v-if="inlineFormData.sponsors.length > 0"
                                  type="danger"
                                  circle
                                  text
                                  size="small"
                                  :disabled="inlineFormLoading"
                                  @click="removeInlineSponsor($index)"
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
                              :disabled="inlineFormLoading"
                              @click="addInlineSponsor"
                            >
                              + Add Sponsor
                            </el-button>
                          </div>
                        </div>
                      </el-form-item>
                    </div>

                    <!-- Contact Details Section -->
                    <div class="form-section mb-4">
                      <div class="form-section-title">Contact Details</div>
                      <el-row :gutter="16">
                        <el-col :span="12">
                          <el-form-item label="Phone">
                            <el-input
                              v-model="inlineFormData.contact_phone_number"
                              placeholder="Phone"
                              size="large"
                              clearable
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                        <el-col :span="12">
                          <el-form-item label="Email">
                            <el-input
                              v-model="inlineFormData.contact_email"
                              placeholder="Email"
                              size="large"
                              clearable
                              type="email"
                              :disabled="inlineFormLoading"
                            />
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-form-item label="Address">
                        <el-input
                          v-model="inlineFormData.contact_address"
                          type="textarea"
                          :rows="2"
                          placeholder="Address"
                          size="large"
                          clearable
                          :disabled="inlineFormLoading"
                        />
                      </el-form-item>
                    </div>

                    <div class="agreement-wrapper mb-6 text-left">
                      <div class="d-flex align-start">
                        <el-checkbox v-model="termsAgreed" class="terms-checkbox mr-3" size="large"></el-checkbox>
                        <div class="agreement-text" style="padding-top: 2px;">
                          <span class="text-body-2 text-grey-darken-3" style="line-height: 1.6; display: block;">
                            I agree to the 
                            <a href="#" class="agreement-link" @click.stop.prevent="openAgreement('terms')">Terms of Service</a> 
                            and 
                            <a href="#" class="agreement-link" @click.stop.prevent="openAgreement('privacy')">Privacy Policy</a>
                            to proceed with my request.
                          </span>
                        </div>
                      </div>
                      <v-expand-transition>
                        <div v-if="agreementError" class="text-caption text-error font-weight-bold mt-2 ml-10" style="color: #ef4444;">
                          <v-icon size="14" class="mr-1">mdi-alert-circle</v-icon>
                          {{ agreementError }}
                        </div>
                      </v-expand-transition>
                    </div>

                    <!-- Submit Button -->
                    <v-btn
                      color="teal"
                      size="large"
                      block
                      :loading="inlineFormLoading"
                      @click="handleInlineFormSubmit"
                      class="mt-4"
                    >
                      Submit Child Dedication Request
                    </v-btn>
                  </el-form>
                </v-card-text>
              </v-card>
            </div>

            <!-- Right Column: Login Prompt (For non-logged in users) -->
            <div class="right-column" id="register" v-else>
              <h2 class="section-title fade-in" style="animation-delay: 700ms;">
                Request Child Dedication
              </h2>
              
              <v-card class="registration-card fade-in-up" style="animation-delay: 800ms;">
                <v-card-title class="registration-title">
                  Child Dedication Request
                </v-card-title>
                <v-card-subtitle class="registration-subtitle">
                  Please log in to your account to request a child dedication.
                </v-card-subtitle>
                <v-card-text class="d-flex flex-column gap-4">
                  <v-alert
                    type="info"
                    variant="tonal"
                    class="login-alert"
                  >
                    <div class="alert-content">
                      <v-icon start>mdi-information</v-icon>
                      <div>
                        <strong>Login Required</strong>
                        <p class="alert-text">You need to be logged in as a member to request a child dedication. Please log in to continue.</p>
                      </div>
                    </div>
                  </v-alert>
                  <v-btn 
                    color="teal" 
                    size="large" 
                    block 
                    @click="openLoginDialog"
                  >
                    Go to Login
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-container>
      </section>
    </main>
    <LoginDialog
      :model-value="showLoginDialog"
      @update:model-value="showLoginDialog = $event"
      @close="showLoginDialog = false"
    />
    <ChildDedicationDialog
      ref="childDedicationDialogRef"
      :model-value="showChildDedicationDialog"
      @update:model-value="showChildDedicationDialog = $event"
      :dedication-data="selectedDedicationData"
      @submit="handleChildDedicationDialogSubmit"
      @switch-to-edit="handleSwitchToEdit"
    />

    <!-- Success Message Popup -->
    <v-dialog v-model="successDialog.show" max-width="500" persistent>
      <v-card class="text-center pa-6">
        <v-avatar color="success" size="80" class="mb-4">
          <v-icon size="48" color="white">mdi-check</v-icon>
        </v-avatar>
        <v-card-title class="text-h5 font-weight-bold">
          {{ successDialog.title }}
        </v-card-title>
        <v-card-text class="text-body-1">
          {{ successDialog.message }}
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="teal" variant="flat" @click="closeSuccessDialog">
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Agreement Modal -->
    <AgreementModal 
      v-model="showAgreementModal" 
      :initial-tab="agreementTab" 
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useChildDedicationStore } from '@/stores/ServicesRecords/childDedicationStore'
import ChildDedicationDialog from '@/components/Dialogs/ChildDedicationDialog.vue'
import LoginDialog from '@/components/Dialogs/LoginDialog.vue'
import axios from '@/api/axios'
import { useCms } from '@/composables/useCms'
import AgreementModal from '@/components/Common/AgreementModal.vue'

const childDedicationStore = useChildDedicationStore()
const showLoginDialog = ref(false)

// Available Dates state
const availableDates = ref([])
const loadingAvailableDates = ref(false)

// Fetch available dates for logged-in members
const fetchAvailableDates = async () => {
  loadingAvailableDates.value = true;
  try {
    const response = await axios.get('/services/child-dedications/available-slots', {
      params: { days: 60 } // Looking ahead 2 months for dedication
    })
    
    if (response.data.success) {
      const rawDates = response.data.data || []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      availableDates.value = rawDates
        .filter(group => {
          const d = new Date(group.date)
          d.setHours(0, 0, 0, 0)
          return d > today
        })
        .map(group => ({
          ...group,
          displayDate: new Date(group.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          requestCount: group.timeSlots.reduce((sum, slot) => sum + (slot.bookedCount || 0), 0),
          timeSlots: group.timeSlots.map(slot => ({
            ...slot,
            displayTime: slot.display || slot.time,
            requestCount: slot.bookedCount || 0,
            bookedMembers: slot.bookedMembers || []
          }))
        }))
    }
  } catch (error) {
    console.error('Error fetching available dates:', error)
  } finally {
    loadingAvailableDates.value = false
  }
}

// CMS Data
const childDedicationData = ref({
  heroImage: '/img/child-dedication.jpg',
  heroTitle: 'Child Dedication',
  heroDescription: 'Dedicate your child to the Lord and commit to raising them in a Christ-centered home. Our child dedication service is a meaningful celebration of your family\'s commitment to God.',
  sectionTitle: 'What is Child Dedication?',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText: 'Child dedication is a public commitment by parents to raise their child according to God\'s Word and in the ways of the Lord. It is a beautiful expression of faith and a promise to guide your child in their spiritual journey.',
  ourCommitmentTitle: 'Our Commitment',
  ourCommitmentText: 'We are committed to supporting families in their journey of raising children in the faith. Through our dedication services, we join with parents in prayer and commitment to nurture the next generation in Christ.',
  whatWeOfferTitle: 'What We Offer',
  offerPoint1: 'Meaningful dedication ceremonies and celebrations',
  offerPoint2: 'Pastoral support and guidance for parents',
  offerPoint3: 'Ongoing resources and community for Christian families'
})

const { loadPageData, loading } = useCms('childdedication')

// User info
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// Dialog state
const showChildDedicationDialog = ref(false)
const childDedicationDialogRef = ref(null)
const selectedDedicationData = ref(null)

// Inline form state for member users
const inlineFormRef = ref(null)
const inlineFormLoading = ref(false)

// Inline form data
const inlineFormData = reactive({
  requested_by: '',
  requester_relationship: '',
  preferred_dedication_date: null,
  child_firstname: '',
  child_lastname: '',
  child_middle_name: '',
  date_of_birth: '',
  place_of_birth: '',
  gender: '',
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
  sponsors: []
})

// Agreement State
const termsAgreed = ref(false)
const showAgreementModal = ref(false)
const agreementTab = ref('terms')
const agreementError = ref('')

const openAgreement = (tab) => {
  agreementTab.value = tab
  showAgreementModal.value = true
}

// Inline form validation rules
const inlineFormRules = {
  child_firstname: [
    { required: true, message: "Child's first name is required", trigger: 'blur' },
    { min: 1, max: 100, message: 'First name must be between 1 and 100 characters', trigger: 'blur' }
  ],
  child_lastname: [
    { required: true, message: "Child's last name is required", trigger: 'blur' },
    { min: 1, max: 100, message: 'Last name must be between 1 and 100 characters', trigger: 'blur' }
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
  requester_relationship: [
    {
      validator: (rule, value, callback) => {
        if (!value || !String(value).trim()) {
          callback(new Error('Relationship to the child is required'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

// Requester display name for inline form
const inlineRequesterDisplayName = computed(() => {
  if (userInfo.value?.member) {
      const m = userInfo.value.member
      return `${m.firstname || ''} ${m.middle_name ? m.middle_name + ' ' : ''}${m.lastname || ''}`.trim()
    }
    return ''
  })

  // Inline form sponsor helpers
  const addInlineSponsor = () => {
    inlineFormData.sponsors.push({
      firstname: '',
      lastname: '',
      middle_name: '',
      phone_number: '',
      address: ''
    })
    if (inlineFormRef.value) {
      inlineFormRef.value.validateField('sponsors')
    }
  }

  const removeInlineSponsor = (index) => {
    if (inlineFormData.sponsors.length > 0) {
      inlineFormData.sponsors.splice(index, 1)
      if (inlineFormRef.value) {
        inlineFormRef.value.validateField('sponsors')
      }
    }
  }

  // Handle relationship change for inline form
  const onInlineRelationshipChange = (relationship) => {
    const memberData = userInfo.value?.member
    
    // Clear all parent fields first
    inlineFormData.father_firstname = ''
    inlineFormData.father_lastname = ''
    inlineFormData.father_middle_name = ''
    inlineFormData.father_phone_number = ''
    inlineFormData.father_email = ''
    inlineFormData.father_address = ''
    
    inlineFormData.mother_firstname = ''
    inlineFormData.mother_lastname = ''
    inlineFormData.mother_middle_name = ''
    inlineFormData.mother_phone_number = ''
    inlineFormData.mother_email = ''
    inlineFormData.mother_address = ''
    
    // Clear contact fields if they were auto-populated from member data
    const memberPhone = memberData?.phone_number
    const memberEmail = userInfo.value?.account?.email || memberData?.email
    const memberAddress = memberData?.address
    
    if (inlineFormData.contact_phone_number === memberPhone) {
      inlineFormData.contact_phone_number = ''
    }
    if (inlineFormData.contact_email === memberEmail) {
      inlineFormData.contact_email = ''
    }
    if (inlineFormData.contact_address === memberAddress) {
      inlineFormData.contact_address = ''
    }
    
    // Auto-populate based on relationship
    if (relationship === 'father' && memberData) {
      inlineFormData.father_firstname = memberData.firstname || ''
      inlineFormData.father_lastname = memberData.lastname || ''
      inlineFormData.father_middle_name = memberData.middle_name || ''
      inlineFormData.father_phone_number = memberData.phone_number || ''
      inlineFormData.father_email = memberData.email || userInfo.value?.account?.email || ''
      inlineFormData.father_address = memberData.address || ''
    } else if (relationship === 'mother' && memberData) {
      inlineFormData.mother_firstname = memberData.firstname || ''
      inlineFormData.mother_lastname = memberData.lastname || ''
      inlineFormData.mother_middle_name = memberData.middle_name || ''
      inlineFormData.mother_phone_number = memberData.phone_number || ''
      inlineFormData.mother_email = memberData.email || userInfo.value?.account?.email || ''
      inlineFormData.mother_address = memberData.address || ''
    } else {
      if (memberData) {
        inlineFormData.contact_phone_number = memberData.phone_number || ''
        inlineFormData.contact_email = memberData.email || userInfo.value?.account?.email || ''
        inlineFormData.contact_address = memberData.address || ''
      }
    }
  }

  // Reset inline form
  const resetInlineForm = () => {
    inlineFormData.requested_by = ''
    inlineFormData.requester_relationship = ''
    inlineFormData.preferred_dedication_date = null
    inlineFormData.child_firstname = ''
    inlineFormData.child_lastname = ''
    inlineFormData.child_middle_name = ''
    inlineFormData.date_of_birth = ''
    inlineFormData.place_of_birth = ''
    inlineFormData.gender = ''
    inlineFormData.contact_phone_number = ''
    inlineFormData.contact_email = ''
    inlineFormData.contact_address = ''
    inlineFormData.father_firstname = ''
    inlineFormData.father_lastname = ''
    inlineFormData.father_middle_name = ''
    inlineFormData.father_phone_number = ''
    inlineFormData.father_email = ''
    inlineFormData.father_address = ''
    inlineFormData.mother_firstname = ''
    inlineFormData.mother_lastname = ''
    inlineFormData.mother_middle_name = ''
    inlineFormData.mother_phone_number = ''
    inlineFormData.mother_email = ''
    inlineFormData.mother_address = ''
    inlineFormData.sponsors = []
    
    if (inlineFormRef.value) {
      inlineFormRef.value.clearValidate()
    }
  }

  // Available dates analyzer - allows any future date
  const disabledDates = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Only allow future dates
    return date <= today
  }

  // Handle inline form submission
  const handleInlineFormSubmit = async () => {
    // Validate agreement first
    if (!termsAgreed.value) {
      agreementError.value = 'You must agree to the Terms of Service and Privacy Policy before submitting.'
      ElMessage.warning('Please agree to our Terms and Privacy Policy to continue.')
      return
    }
    agreementError.value = ''
    // Check if user is logged in
    if (!userInfo.value?.member?.member_id) {
      ElMessage.warning('Please log in to submit a child dedication request.')
      showLoginDialog.value = true
      return
    }
    
    if (!inlineFormRef.value) return
    
    try {
      console.log('Starting inline child dedication submission...')
      
      // Check for duplicates
      if (inlineFormData.requested_by && inlineFormData.child_firstname && inlineFormData.child_lastname && inlineFormData.date_of_birth) {
        try {
          const checkResponse = await axios.get('/church-records/child-dedications/check-duplicate', {
            params: {
              requested_by: inlineFormData.requested_by,
              child_firstname: inlineFormData.child_firstname.trim(),
              child_lastname: inlineFormData.child_lastname.trim(),
              date_of_birth: inlineFormData.date_of_birth
            }
          })
          
          if (checkResponse.data.success && checkResponse.data.data && checkResponse.data.data.exists) {
            ElMessage.error({
              message: `Duplicate Found: A child dedication request for "${inlineFormData.child_firstname} ${inlineFormData.child_lastname}" (DOB: ${inlineFormData.date_of_birth}) already exists. Process stopped.`,
              duration: 8000,
              showClose: true
            })
            return
          }
        } catch (checkError) {
          // Only show error if it's not a 404 or network error
          if (!checkError.response?.status?.toString().startsWith('4') && checkError.code !== 'ECONNABORTED') {
            if (checkError.response?.data?.message && checkError.response.data.message.includes('already exists')) {
              ElMessage.error({
                message: `Duplicate Error: ${checkError.response.data.message}`,
                duration: 8000,
                showClose: true
              })
              return
            }
          }
          // Silently continue if check fails (duplicate check is optional)
          console.warn('Duplicate check skipped:', checkError.message)
        }
      }
      
      // Form validation
      await inlineFormRef.value.validate()
      
      // User confirmation
      try {
        await ElMessageBox.confirm(
          'Are you sure you want to submit this child dedication request?',
          'Confirm Child Dedication Request',
          {
            confirmButtonText: 'Submit',
            cancelButtonText: 'Cancel',
            type: 'warning',
          }
        )
      } catch {
        return
      }
      
      // Submit form
      inlineFormLoading.value = true
      
      const submitData = {
        requested_by: inlineFormData.requested_by.trim(),
        requester_relationship: inlineFormData.requester_relationship,
        preferred_dedication_date: inlineFormData.preferred_dedication_date 
          ? inlineFormData.preferred_dedication_date.replace('T', ' ').substring(0, 19) 
          : null,
        child_firstname: inlineFormData.child_firstname.trim(),
        child_lastname: inlineFormData.child_lastname.trim(),
        child_middle_name: inlineFormData.child_middle_name ? inlineFormData.child_middle_name.trim() : null,
        date_of_birth: inlineFormData.date_of_birth,
        place_of_birth: inlineFormData.place_of_birth.trim(),
        gender: inlineFormData.gender,
        contact_phone_number: inlineFormData.contact_phone_number.trim(),
        contact_email: inlineFormData.contact_email ? inlineFormData.contact_email.trim() : null,
        contact_address: inlineFormData.contact_address.trim(),
        father_firstname: inlineFormData.father_firstname ? inlineFormData.father_firstname.trim() : null,
        father_lastname: inlineFormData.father_lastname ? inlineFormData.father_lastname.trim() : null,
        father_middle_name: inlineFormData.father_middle_name ? inlineFormData.father_middle_name.trim() : null,
        father_phone_number: inlineFormData.father_phone_number ? inlineFormData.father_phone_number.trim() : null,
        father_email: inlineFormData.father_email ? inlineFormData.father_email.trim() : null,
        father_address: inlineFormData.father_address ? inlineFormData.father_address.trim() : null,
        mother_firstname: inlineFormData.mother_firstname ? inlineFormData.mother_firstname.trim() : null,
        mother_lastname: inlineFormData.mother_lastname ? inlineFormData.mother_lastname.trim() : null,
        mother_middle_name: inlineFormData.mother_middle_name ? inlineFormData.mother_middle_name.trim() : null,
        mother_phone_number: inlineFormData.mother_phone_number ? inlineFormData.mother_phone_number.trim() : null,
        mother_email: inlineFormData.mother_email ? inlineFormData.mother_email.trim() : null,
        mother_address: inlineFormData.mother_address ? inlineFormData.mother_address.trim() : null,
        sponsors: inlineFormData.sponsors && inlineFormData.sponsors.length > 0
          ? inlineFormData.sponsors.map(s => ({
              firstname: s.firstname ? s.firstname.trim() : '',
              lastname: s.lastname ? s.lastname.trim() : '',
              middle_name: s.middle_name ? s.middle_name.trim() : '',
              phone_number: s.phone_number ? s.phone_number.trim() : '',
              address: s.address ? s.address.trim() : ''
            })).filter(s => s.firstname && s.lastname && s.phone_number && s.address)
          : []
      }
      
      // Submit using store
      const { success, error } = await childDedicationStore.createDedication(submitData)
      
      if (success) {
        showSuccessDialog('Success!', 'Child dedication request submitted successfully. Our pastoral team will contact you soon.')
        resetInlineForm()
        // Refresh available dates to show the newly booked date as possibly now having more requests
        await fetchAvailableDates()
      } else {
        ElMessage.error(error || 'Failed to submit child dedication request.')
      }
      
    } catch (error) {
      console.error('Error submitting inline form:', error)
      // Only show error if it's not a cancellation or network error
      if (error !== 'cancel' && !error.message?.includes('network') && !error.message?.includes('timeout')) {
        ElMessage.error('Submission failed. Please try again.')
      }
    } finally {
      inlineFormLoading.value = false
    }
  }

  // Success dialog state
  const successDialog = ref({
    show: false,
    title: '',
    message: ''
  })

  // Initialize on mount
  onMounted(async () => {
    try {
      // Load CMS data (includes images as base64 data URLs from /full endpoint)
      const loadedData = await loadPageData()
      if (loadedData) {
        Object.assign(childDedicationData.value, loadedData)
      }
    } catch (error) {
      console.error('Error loading CMS data:', error)
      // Continue even if CMS loading fails - use default data
    }

    try {
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      userInfo.value = storedUserInfo
      
      // Initialize inline form with logged-in member's ID
      if (userInfo.value?.member?.member_id) {
        inlineFormData.requested_by = userInfo.value.member.member_id
      }
      
      // Fetch available dates for logged-in members
      if (userInfo.value?.account?.acc_id) {
        await fetchAvailableDates()
      }
    } catch (error) {
      console.error('Error loading user info:', error)
      userInfo.value = {}
    }
  })

  const openLoginDialog = () => {
    showLoginDialog.value = true
  }

  // Show success dialog
  const showSuccessDialog = (title, message) => {
    successDialog.value = {
      show: true,
      title,
      message
    }
  }

  // Close success dialog
  const closeSuccessDialog = () => {
    successDialog.value.show = false
  }

  // Select time slot from available dates and populate form
  const selectDedicationTimeSlot = (date, time) => {
    // Create datetime string in format YYYY-MM-DD HH:mm:ss
    const dateTime = `${date} ${time}:00`
    inlineFormData.preferred_dedication_date = dateTime
    
    ElMessage.success(`Selected: ${date} at ${time}`)
    
    // Scroll to the form
    const registerSection = document.getElementById('register')
    if (registerSection) {
      registerSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleChildDedicationDialogSubmit = async (payload) => {
    if (!childDedicationDialogRef.value) return
    try {
      const { success, error } = await childDedicationStore.createDedication(payload)
      if (success) {
        showSuccessDialog('Success!', 'Child dedication request submitted successfully. Our pastoral team will contact you soon.')
        showChildDedicationDialog.value = false
        selectedDedicationData.value = null // Clear selected data after successful submission
        // Refresh unavailable time slots in case new slots are now blocked
        if (childDedicationDialogRef.value) {
          childDedicationDialogRef.value.fetchUnavailableTimeSlots()
        }
      } else {
        ElMessage.error(error || 'Failed to submit child dedication request.')
        showChildDedicationDialog.value = false
      }
    } catch (err) {
      ElMessage.error(err?.message || 'Failed to submit child dedication request.')
      showChildDedicationDialog.value = false
    } finally {
      childDedicationDialogRef.value?.resetLoading()
    }
  }

  // Handle switch to edit mode
  const handleSwitchToEdit = (dedication) => {
    selectedDedicationData.value = dedication
    showChildDedicationDialog.value = true
  }
  </script>

  <style scoped>
  .child-dedication-page {
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
      align-items: stretch;
    }
    .content-grid > .left-column,
    .content-grid > .right-column {
      display: flex;
      flex-direction: column;
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

  /* Available Dates Section Styles */
  .available-dates-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .dates-panel {
    background: transparent !important;
  }

  .dates-panel .v-expansion-panel {
    background: white !important;
    border: 1px solid #0d9488 !important;
  }

  .time-slots-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .time-slot-chip {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .time-slot-chip:hover {
    background: #14b8a6 !important;
    color: white !important;
    border-color: #14b8a6 !important;
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

  /* Schedule Card - System Branding */
  .schedule-card {
    border: 2px solid #0d9488;
    border-top: 4px solid #0d9488;
    background: #ffffff;
  }

  .schedule-card .v-card-title {
    color: #0d9488;
    border-bottom: 2px solid #0d9488;
    padding-bottom: 12px;
  }

  .date-panel {
    background: #f0fdfa !important;
    margin-bottom: 8px !important;
    border: 2px solid #0d9488 !important;
    box-shadow: none !important;
  }

  .date-panel::before {
    display: none !important;
  }

  .date-panel .v-expansion-panel-title {
    background: transparent !important;
  }

  .date-panel:hover {
    background: #ccfbf1 !important;
  }

  .time-slot-chip {
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .time-slot-chip:hover {
    background-color: #0d9488 !important;
    color: white !important;
    border-color: #0d9488 !important;
    transform: scale(1.05);
  }

  .time-slots-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  /* Login Alert */
  .login-alert {
    margin-bottom: 24px;
  }

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alert-text {
  margin: 0;
  font-size: 0.875rem;
}

/* Registration Card */
.registration-card {
  border: 1px solid #5eead4;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.registration-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
}

.registration-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Inline Form Card */
.inline-form-card {
  border: 1px solid #5eead4;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
  color: #14b8a6;
}

.form-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #14b8a6;
}

.inline-form-card :deep(.el-form-item) {
  margin-bottom: 16px;
}

.inline-form-card :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
  padding-bottom: 4px;
}

.inline-form-card :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.inline-form-card :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.inline-form-card :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.inline-form-card :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.inline-form-card :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.inline-form-card :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.inline-form-card :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.inline-form-card :deep(.el-date-editor.el-input) {
  width: 100%;
}

.inline-form-card :deep(.el-radio-group) {
  display: flex;
  gap: 24px;
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

@media (max-width: 640px) {
  .inline-form-card :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  .inline-form-card :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .inline-form-card :deep(.el-form-item__label) {
    font-size: 0.875rem;
    padding-bottom: 4px;
    line-height: 1.4;
  }

  .inline-form-card :deep(.el-input),
  .inline-form-card :deep(.el-select),
  .inline-form-card :deep(.el-date-editor) {
    width: 100%;
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
.agreement-link {
  color: #0d9488;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.2s ease;
  padding: 0 2px;
}

.agreement-link:hover {
  text-decoration: underline;
  background-color: #0d948811;
  border-radius: 4px;
}

.terms-checkbox :deep(.el-checkbox__label) {
  display: none;
}

/* Force Teal Color - Overriding EL-Checkbox Defaults */
.terms-checkbox :deep(.el-checkbox__inner) {
  width: 26px !important;
  height: 26px !important;
  border-color: #0d9488 !important;
  border-width: 2px !important;
  background-color: transparent !important;
}

.terms-checkbox :deep(.el-checkbox__inner::after) {
  width: 8px !important;
  height: 16px !important;
  left: 9px !important;
  top: 4px !important;
  border-width: 3.5px !important;
}

.terms-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #0d9488 !important;
  border-color: #0d9488 !important;
}

.terms-checkbox :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #0d9488 !important;
  border-color: #0d9488 !important;
}

.terms-checkbox :deep(.el-checkbox__input:hover .el-checkbox__inner) {
  border-color: #0d9488 !important;
}

.agreement-wrapper {
  transition: all 0.3s ease;
}
</style>

