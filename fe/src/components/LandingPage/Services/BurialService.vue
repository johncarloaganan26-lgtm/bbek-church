<template>
  <div class="burial-service-page" style="position: relative;">
    <!-- Loading overlay -->
    <v-overlay :model-value="loading" contained class="align-center justify-center" style="z-index: 1000;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div
          class="hero-background"
          :style="{ backgroundImage: `url(${burialServiceData.heroImage || '/img/burial.jpg'})` }"
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
            {{ burialServiceData.heroTitle }}
          </h1>
          <p class="hero-subtitle fade-in-up-delay" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ burialServiceData.heroDescription }}
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
            <!-- Left Column: What is Burial Service -->
            <div class="left-column">
              <!-- Available Burial Dates Card (Visible to everyone) - MOVED TO TOP -->
              <h2 class="section-title fade-in" style="animation-delay: 100ms;">
                Select Available Dates
              </h2>
              
              <v-card 
                class="available-dates-card fade-in" 
                style="animation-delay: 200ms; margin-bottom: 20px;" 
                variant="flat" 
                color="teal-lighten-5"
              >
                <v-card-title class="card-title" style="font-size: 1.25rem; font-weight: 600; background-color: #0d9488; color: white; padding: 16px;">
                  <v-icon color="white" class="mr-2">mdi-calendar-clock</v-icon>
                  Available Dates
                </v-card-title>
                <v-card-text>
                  <!-- Loading state -->
                  <div v-if="loadingAvailableDates" class="text-center py-4">
                    <v-progress-circular indeterminate color="teal" size="24"></v-progress-circular>
                    <p class="mt-2 text-teal-darken-1" style="font-family: 'Georgia', serif;">Loading available dates...</p>
                  </div>
                  <!-- Has dates -->
                  <div v-else-if="availableBurialDates && availableBurialDates.length > 0">
                    <p class="text-body-2 text-teal-darken-2 mb-3" style="font-family: 'Georgia', serif; font-style: italic;">
                      <v-icon size="16" color="teal-darken-2">mdi-information</v-icon>
                      Select a date and time slot for your burial service
                    </p>
                    <v-expansion-panels variant="accordion" class="dates-panel">
                      <v-expansion-panel
                        v-for="(dateGroup, index) in availableBurialDates.slice(0, 4)" 
                        :key="dateGroup.date"
                        variant="flat"
                        class="mb-2 sunday-panel"
                        style="border-left: 4px solid #0d9488"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center justify-space-between w-100 pr-2">
                            <div class="d-flex align-center">
                              <v-icon 
                                :color="dateGroup.isFullyBooked ? 'grey' : 'teal-darken-2'" 
                                class="mr-2"
                              >
                                {{ dateGroup.isFullyBooked ? 'mdi-lock' : 'mdi-calendar' }}
                              </v-icon>
                              <span 
                                class="font-weight-medium"
                                :style="{ color: dateGroup.isFullyBooked ? '#999999' : '#115e59' }"
                              >
                                {{ formatDate(dateGroup.date) }}
                              </span>
                            </div>
                            <div class="d-flex gap-2 align-center">
                              <v-chip 
                                size="small" 
                                color="teal" 
                                variant="flat"
                                style="color: white !important;"
                              >
                                {{ dateGroup.bookedByCount }}/1 booked
                              </v-chip>
                            </div>
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div v-if="dateGroup.timeSlots && dateGroup.timeSlots.length > 0" class="time-slots-grid">
                            <v-chip
                              v-for="slot in dateGroup.timeSlots"
                              :key="slot.time"
                              size="small"
                              variant="outlined"
                              color="teal-darken-2"
                              class="ma-1 time-slot-chip"
                              style="cursor: pointer;"
                              @click="selectBurialTimeSlot(dateGroup.date, slot.time || slot.displayTime)"
                            >
                              {{ slot.displayTime || slot.time }}
                            </v-chip>
                          </div>
                          <p v-else style="font-family: 'Georgia', serif; color: #115e59;">
                            No time slots available for this date.
                          </p>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                    <p v-if="availableBurialDates.length > 4" class="text-caption text-grey mt-2" style="font-family: 'Georgia', serif;">
                      + {{ availableBurialDates.length - 4 }} more dates available
                    </p>
                  </div>
                  <!-- No dates available -->
                  <div v-else class="text-center py-4">
                    <v-icon color="teal" size="48" class="mb-2">mdi-calendar-check</v-icon>
                    <p style="font-family: 'Georgia', serif; color: #115e59;">
                      All dates are currently available!
                    </p>
                  </div>
                </v-card-text>
              </v-card>

            </div>

            <!-- Right Column: Register for Burial Service -->
            <div class="right-column" id="register">
              <h2 class="section-title fade-in" style="animation-delay: 700ms; font-family: 'Georgia', serif; font-style: italic;">
                Request Burial Service Support
              </h2>
              
              <!-- <v-alert
                v-if="isLoggedIn"
                type="info"
                variant="tonal"
                class="welcome-alert fade-in"
              >
                <div class="alert-content">
                  <v-icon start>mdi-account</v-icon>
                  <div>
                    <strong>Welcome back, {{ userInfo.firstname }}!</strong>
                    <p class="alert-text">Your information has been pre-filled from your member profile. Please review and update any details as needed.</p>
                  </div>
                </div>
              </v-alert> -->

              <v-card class="registration-card fade-in-up" style="animation-delay: 800ms;" v-if="!userInfo.member">
                <v-card-title class="registration-title">
                  Burial Service Request Form
                </v-card-title>
                <v-card-subtitle class="registration-subtitle">
                  Please fill out this form to request burial service support during this difficult time.
                </v-card-subtitle>
                <v-card-text>
                  <p class="info-note" style="background-color: #f0f9ff; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem;">
                    <strong>Note:</strong> Please provide your information as the requester/contact person for this burial service.
                  </p>
                  <form @submit.prevent="handleSubmit" class="registration-form">
                    <div class="form-row">
                      <div class="form-group">
                        <label for="first-name">
                          First Name <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="first-name"
                          v-model="firstname"
                          placeholder="Enter your first name"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="middle-name">Middle Name</label>
                        <v-text-field
                          id="middle-name"
                          v-model="middleName"
                          placeholder="Enter your middle name"
                          variant="outlined"
                          density="compact"
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="last-name">
                          Last Name <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="last-name"
                          v-model="lastname"
                          placeholder="Enter your last name"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="birthdate">
                          Birthdate <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="birthdate"
                          v-model="birthdate"
                          type="date"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="age">
                          Age <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="age"
                          v-model.number="age"
                          type="number"
                          placeholder="Enter your age"
                          variant="outlined"
                          density="compact"
                          required
                          readonly
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="gender">
                          Sex <span class="required-text">Required</span>
                        </label>
                        <el-select
                          v-model="gender"
                          placeholder="Select sex"
                          size="large"
                          style="width: 100%"
                          :disabled="burialServiceStore.loading"
                        >
                          <el-option label="Male" value="M" />
                          <el-option label="Female" value="F" />
                        </el-select>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="address">
                        Address <span class="required-text">Required</span>
                      </label>
                      <v-text-field
                        id="address"
                        v-model="address"
                        placeholder="Enter your address"
                        variant="outlined"
                        density="compact"
                        required
                        hide-details
                        :disabled="burialServiceStore.loading"
                      ></v-text-field>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="email">
                          Email <span class="required-text">Required</span>
                        </label>
                        <v-text-field
                          id="email"
                          v-model="email"
                          type="email"
                          placeholder="Enter your email"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="phone">
                          Phone Number <span class="required-text">Required</span>
                        </label>
                        <el-input
                        v-model="phoneNumber"
                        type="tel"
                        placeholder="9XXXXXXXXX"
                        size="large"
                        :maxlength="10"
                        :disabled="burialServiceStore.loading"
                      >
                        <template #prepend>+63</template>
                      </el-input>
                      </div>
                      <div class="form-group">
                        <label for="relationship">
                          Relationship to Deceased <span class="required-text">Required</span>
                        </label>
                        <el-select
                          v-model="relationship"
                          placeholder="Select relationship"
                          size="large"
                          style="width: 100%"
                          :disabled="burialServiceStore.loading"
                        >
                          <el-option
                            v-for="rel in relationshipOptions"
                            :key="rel"
                            :label="rel"
                            :value="rel"
                          />
                        </el-select>
                      </div>
                    </div>

                    <p class="section-note" style="background-color: #fef3c7; padding: 12px; border-radius: 8px; margin: 20px 0; font-size: 0.9rem;">
                      <strong>Deceased Information:</strong> Please provide accurate details about the deceased.
                    </p>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="deceased-name">
                          Deceased Name <span class="required-text">Required</span>
                        </label>
                        <p class="field-note">Full name of the deceased person</p>
                        <v-text-field
                          id="deceased-name"
                          v-model="deceasedName"
                          placeholder="Enter deceased person's full name"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="deceased-deathdate">
                          Date of Death <span class="required-text">Required</span>
                        </label>
                        <p class="field-note">When did the deceased pass away</p>
                        <v-text-field
                          id="deceased-deathdate"
                          v-model="deceasedDeathDate"
                          type="date"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                          :max="new Date().toISOString().split('T')[0]"
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="deceased-birthdate">
                          Deceased Birth Date <span class="required-text">Required</span>
                        </label>
                        <p class="field-note">When was the deceased born</p>
                        <v-text-field
                          id="deceased-birthdate"
                          v-model="deceasedBirthDate"
                          type="date"
                          variant="outlined"
                          density="compact"
                          required
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                      <div class="form-group">
                        <label for="deceased-age">
                          Deceased Age <span class="required-text">Required</span>
                        </label>
                        <p class="field-note">Auto-calculated from birth date</p>
                        <v-text-field
                          id="deceased-age"
                          v-model.number="deceasedAge"
                          type="number"
                          placeholder="Auto-calculated"
                          variant="outlined"
                          density="compact"
                          required
                          readonly
                          hide-details
                        :disabled="burialServiceStore.loading"
                        ></v-text-field>
                      </div>
                    </div>

                    <!-- Reason of Death -->
                    <div class="form-group">
                      <label for="reason-of-death">
                        Reason of Death <span class="required-text">Required</span>
                      </label>
                      <p class="field-note">Cause of death (if known)</p>
                      <v-text-field
                        id="reason-of-death"
                        v-model="reasonOfDeath"
                        placeholder="Enter cause of death"
                        variant="outlined"
                        density="compact"
                        required
                        hide-details
                        :disabled="burialServiceStore.loading"
                        maxlength="255"
                      ></v-text-field>
                    </div>

                    <!-- Preferred Service Date & Time (Night Service Default) -->
                    <div class="form-group">
                      <label for="preferred-service-date">
                        Preferred Service Date & Time <span class="required-text">Required</span>
                      </label>
                      <p class="field-note">Select a time slot from the available dates on the left</p>
                      <v-text-field
                        v-if="preferredServiceDate"
                        v-model="preferredServiceDate"
                        type="text"
                        placeholder="Select a time slot from the list on the left"
                        variant="outlined"
                        density="compact"
                        readonly
                        required
                        hide-details
                        :disabled="burialServiceStore.loading"
                        style="width: 100%"
                        prepend-inner-icon="mdi-calendar-clock"
                      />
                      <v-text-field
                        v-else
                        placeholder="Select a time slot from the list on the left"
                        variant="outlined"
                        density="compact"
                        readonly
                        disabled
                        hide-details
                        style="width: 100%"
                        prepend-inner-icon="mdi-calendar-clock"
                      />
                    </div>

                    <!-- Burial Location -->
                    <div class="form-group">
                      <label for="burial-location">
                        Burial Location <span class="required-text">Required</span>
                      </label>
                      <p class="field-note">Where will the burial service take place? (cemetery, memorial park, etc.)</p>
                      <v-text-field
                        id="burial-location"
                        v-model="burialLocation"
                        placeholder="Enter burial location"
                        variant="outlined"
                        density="compact"
                        required
                        hide-details
                        :disabled="burialServiceStore.loading"
                        maxlength="255"
                      ></v-text-field>
                    </div>

                    <div class="agreement-wrapper my-6">
                      <div class="d-flex align-start justify-center">
                        <el-checkbox v-model="termsAgreed" class="terms-checkbox large-checkbox mr-4" size="large"></el-checkbox>
                        <div class="agreement-text" style="padding-top: 6px;">
                          <span class="text-body-2 text-grey-darken-3 font-weight-medium" style="line-height: 1.6; font-size: 0.95rem;">
                            I agree to the 
                            <a href="#" class="agreement-link font-weight-bold" style="color: #0d9488; text-decoration: none;" @click.stop.prevent="openAgreement('terms')">Terms of Service</a> 
                            and 
                            <a href="#" class="agreement-link font-weight-bold" style="color: #0d9488; text-decoration: none;" @click.stop.prevent="openAgreement('privacy')">Privacy Policy</a>
                            to proceed with my request.
                          </span>
                        </div>
                      </div>
                      <v-expand-transition>
                        <div v-if="agreementError" class="text-caption text-error font-weight-bold mt-2 text-center" style="color: #ef4444;">
                          <v-icon size="14" class="mr-1">mdi-alert-circle</v-icon>
                          {{ agreementError }}
                        </div>
                      </v-expand-transition>
                    </div>

                    <v-btn
                      type="submit"
                      color="teal"
                      size="large"
                      block
                      class="submit-btn"
                      :loading="isSubmitting"
                      :disabled="isSubmitting"
                    >
                      {{ isSubmitting ? 'Submitting...' : 'Submit Service Request' }}
                    </v-btn>

                  </form>
                </v-card-text>
              </v-card>
              <v-card class="registration-card fade-in-up" style="animation-delay: 800ms;" v-else>
                <v-card-title class="registration-title">
                  Request Burial Service
                </v-card-title>
                <v-card-subtitle class="registration-subtitle">
                  Welcome back, <strong>{{ userInfo.member?.firstname }}!</strong> Please fill out the form below to request burial service support.
                </v-card-subtitle>
                <v-card-text>
                  <el-form :model="memberFormData" label-position="top" size="large">
                    <el-divider content-position="left">Requester Information</el-divider>

                    <el-form-item label="Requester Name" class="form-item-with-label">
                      <el-input
                        :model-value="`${userInfo.member?.firstname || ''} ${userInfo.member?.middle_name || ''} ${userInfo.member?.lastname || ''}`.replace(/\s+/g, ' ').trim()"
                        placeholder="Your full name"
                        disabled
                      />
                    </el-form-item>

                    <el-form-item label="Requester Email" class="form-item-with-label">
                      <el-input
                        :model-value="userInfo.account?.email || ''"
                        type="email"
                        placeholder="Your email address"
                        disabled
                      />
                    </el-form-item>

                    <el-form-item>
                      <template #label>
                        <span>Relationship <span class="required-text">Required</span></span>
                      </template>
                      <el-select
                        v-model="memberFormData.relationship"
                        placeholder="Select relationship"
                        style="width: 100%"
                        clearable
                      >
                        <el-option
                          v-for="rel in relationshipOptions"
                          :key="rel"
                          :label="rel"
                          :value="rel"
                        />
                      </el-select>
                    </el-form-item>

                    <!-- Preferred Service Date & Time (Night Service Default) -->
                    <el-form-item>
                      <template #label>
                        <span>Preferred Service Date & Time <span class="required-text">Required</span></span>
                      </template>
                      <el-input
                        :model-value="preferredServiceDate"
                        placeholder="Select a time slot from the list on the left"
                        disabled
                        readonly
                        prepend-icon="el-icon-date"
                      />
                      <div class="form-hint">
                        <span>Select a time slot from the available dates on the left panel</span>
                      </div>
                    </el-form-item>

                    <el-divider content-position="left">Deceased Information</el-divider>

                    <el-form-item>
                      <template #label>
                        <span>Deceased Name <span class="required-text">Required</span></span>
                      </template>
                      <el-input
                        v-model="memberFormData.deceased_name"
                        placeholder="Enter deceased full name"
                        clearable
                      />
                    </el-form-item>

                    <el-form-item>
                      <template #label>
                        <span>Burial Location <span class="required-text">Required</span></span>
                      </template>
                      <el-input
                        v-model="memberFormData.burial_location"
                        placeholder="Enter burial location (cemetery, memorial park, etc.)"
                        clearable
                      />
                      <div class="form-hint">
                        <span>Where will the burial service take place?</span>
                      </div>
                    </el-form-item>

                    <el-form-item>
                      <template #label>
                        <span>Deceased Birthdate <span class="required-text">Required</span></span>
                      </template>
                      <el-date-picker
                        v-model="memberFormData.deceased_birthdate"
                        type="date"
                        placeholder="Select birthdate"
                        format="YYYY-MM-DD"
                        style="width: 100%"
                      />
                    </el-form-item>

                    <el-form-item>
                      <template #label>
                        <span>Date of Death <span class="required-text">Required</span></span>
                      </template>
                      <el-date-picker
                        v-model="memberFormData.date_death"
                        type="datetime"
                        placeholder="Select date and time of death"
                        format="YYYY-MM-DD HH:mm"
                        style="width: 100%"
                        :disabled-date="disabledDate"
                      />
                    </el-form-item>

                    <el-form-item>
                      <template #label>
                        <span>Reason of Death <span class="required-text">Required</span></span>
                      </template>
                      <el-input
                        v-model="memberFormData.reason_of_death"
                        placeholder="Enter cause of death"
                        clearable
                        maxlength="255"
                      />
                    </el-form-item>

                    <div class="agreement-wrapper my-6 text-left">
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

                    <el-form-item>
                      <el-button
                        type="success"
                        size="large"
                        style="width: 100%; background-color: #0d9488; border-color: #0d9488;"
                        :loading="isSubmitting"
                        :disabled="isSubmitting"
                        @click="handleMemberSubmit"
                      >
                        {{ isSubmitting ? 'SUBITTING...' : 'SUBMIT SERVICE REQUEST' }}
                      </el-button>
                    </el-form-item>
                  </el-form>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-container>
      </section>
    </main>
    <BurialServiceDialog
      ref="burialDialogRef"
      :model-value="showBurialDialog"
      @update:model-value="showBurialDialog = $event"
      :burial-service-data="null"
      @submit="handleBurialDialogSubmit"
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
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBurialServiceStore } from '@/stores/ServicesRecords/burialServiceStore'
import BurialServiceDialog from '@/components/Dialogs/BurialServiceDialog.vue'
import AgreementModal from '@/components/Common/AgreementModal.vue'
import axios from '@/api/axios'
import { useCms } from '@/composables/useCms'

const router = useRouter()
const burialServiceStore = useBurialServiceStore()

// CMS Data
const burialServiceData = ref({
  heroImage: '/img/burial.jpg',
  heroTitle: 'Burial Service',
  heroDescription: 'During times of loss and grief, our burial services provide comfort and hope through sacred ceremonies that honor life and celebrate eternal life through Jesus Christ.',
  sectionTitle: 'What is Burial Service?',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText: 'Burial services honor the sacredness of life and provide comfort during times of loss. We believe in the resurrection and eternal life through Jesus Christ, offering hope and peace to those who mourn.',
  ourCommitmentTitle: 'Our Commitment',
  ourCommitmentText: 'We provide compassionate support, meaningful ceremonies, and spiritual guidance during difficult times. Our services reflect God\'s love and the promise of eternal life.',
  whatWeOfferTitle: 'What We Offer',
  offerPoint1: 'Compassionate pastoral care and counseling'
})

const { loadPageData, loading } = useCms('burialservice')

// User info
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const isLoggedIn = computed(() => {
  return userInfo.value.account && userInfo.value.account.account_id && userInfo.value.account.account_id.trim() !== ''
})

// Available burial dates (for logged-in members)
const availableBurialDates = ref([])
const loadingAvailableDates = ref(false)
const autoRefreshIntervalId = ref(null)

// Fetch available burial dates (for all users - logged in or not)
const fetchAvailableBurialDates = async () => {
  loadingAvailableDates.value = true
  try {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    
    const response = await axios.get('/church-records/burial-services/getAvailableBurialDates', {
      params: { daysAhead: 30 },
      headers
    })
    
    if (response.data && response.data.success) {
      // API returns { success: true, data: { availableDates: [...] } }
      const responseData = response.data.data || response.data
      availableBurialDates.value = responseData.availableDates || responseData.dates || response.data.dates || []
    } else {
      availableBurialDates.value = []
    }
  } catch (error) {
    console.error('Error fetching available burial dates:', error)
    availableBurialDates.value = []
  } finally {
    loadingAvailableDates.value = false
  }
}

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Form fields
const firstname = ref('')
const middleName = ref('')
const lastname = ref('')
const birthdate = ref('')
const address = ref('')
const email = ref('')
const phoneNumber = ref('')
const gender = ref('')
const age = ref(0)
const relationship = ref('')
const deceasedName = ref('')
const deceasedBirthDate = ref('')
const deceasedAge = ref(0)
const deceasedDeathDate = ref('')
const reasonOfDeath = ref('')
const civilStatus = ref('')
const burialLocation = ref('')

// Member form data (for inline member form)
const memberFormData = reactive({
  deceased_name: '',
  deceased_birthdate: '',
  date_death: '',
  relationship: '',
  burial_location: '',
  reason_of_death: '',
  preferred_service_date: null
})

// Preferred service date/time (default to tomorrow 6:00 PM)
const getDefaultNightTimeDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 1) // Tomorrow
  date.setHours(20, 0, 0, 0) // 8:00 PM
  return date
}

const preferredServiceDate = ref(getDefaultNightTimeDate())
const defaultNightTimeDate = computed(() => getDefaultNightTimeDate())

// Disable hours - only allow night hours (6 PM - 10 PM)
const disabledNightHours = () => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 23]
}

// Relationship options for dropdown
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

// Form state
const submitMessage = ref('')
const submitError = ref('')
const isSubmitting = ref(false)
const showBurialDialog = ref(false)
const burialDialogRef = ref(null)

// Agreement State
const termsAgreed = ref(false)
const showAgreementModal = ref(false)
const agreementTab = ref('terms')
const agreementError = ref('')

const openAgreement = (tab) => {
  agreementTab.value = tab
  showAgreementModal.value = true
}

// Success dialog state
const successDialog = ref({
  show: false,
  title: '',
  message: ''
})

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

// Initialize form with user info if logged in
onMounted(async () => {
  // Load CMS data (includes images as base64 data URLs from /full endpoint)
  const loadedData = await loadPageData()
  if (loadedData) {
    Object.assign(burialServiceData.value, loadedData)
  }

  const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  userInfo.value = storedUserInfo

  if (isLoggedIn.value) {
    firstname.value = userInfo.value.member.firstname || ''
    middleName.value = userInfo.value.member.middle_name || ''
    lastname.value = userInfo.value.member.lastname || ''
    birthdate.value = userInfo.value.member.birthdate || ''
    address.value = userInfo.value.member.address || ''
    email.value = userInfo.value.account.email || ''
    phoneNumber.value = userInfo.value.member.phone_number || ''
    gender.value = userInfo.value.member.gender || ''
    age.value = userInfo.value.member.age || 0
  }
  
  // Fetch available burial dates for all users (logged in or not)
  fetchAvailableBurialDates()
  
  // Auto-refresh available dates every 30 seconds to show real-time booking updates
  autoRefreshIntervalId.value = setInterval(() => {
    fetchAvailableBurialDates()
  }, 30000) // 30 seconds
})

// Cleanup interval on component unmount
onUnmounted(() => {
  if (autoRefreshIntervalId.value) {
    clearInterval(autoRefreshIntervalId.value)
  }
})

// Watch birthdate to calculate age
watch(birthdate, (newDate) => {
  if (!newDate) return

  const birth = new Date(newDate)
  const today = new Date()
  
  if (birth >= today) {
    alert('Invalid Dates.')
    birthdate.value = ''
    return
  }

  let calculatedAge = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    calculatedAge--
  }

  age.value = calculatedAge
})

// Watch deceased dates to calculate deceased age
watch([deceasedBirthDate, deceasedDeathDate], ([birthDate, deathDate]) => {
  if (!birthDate) return

  const birth = new Date(birthDate)
  const death = deathDate ? new Date(deathDate) : new Date()
  
  if (birth >= death) {
    alert('Deceased birth date cannot be after death date.')
    deceasedBirthDate.value = ''
    return
  }

  let calculatedAge = death.getFullYear() - birth.getFullYear()
  const monthDiff = death.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
    calculatedAge--
  }

  deceasedAge.value = calculatedAge
})

// Disable future dates for date pickers
const disabledDate = (time) => {
  return time.getTime() > Date.now() - 8.64e7
}

// Format phone number (remove non-digit characters)
const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

const handleSubmit = async (e) => {
  e.preventDefault()
  
  // Reset messages
  submitMessage.value = ''
  submitError.value = ''

  // Basic validation
  if (!firstname.value.trim() || !lastname.value.trim() || !birthdate.value || 
      !age.value || !gender.value || !address.value.trim() || !email.value.trim() ||
      !phoneNumber.value || !relationship.value || !deceasedName.value.trim() ||
      !deceasedBirthDate.value || !deceasedDeathDate.value || !reasonOfDeath.value.trim() ||
      !burialLocation.value.trim()) {
    submitError.value = 'Please fill in all required fields.'
    ElMessage.error('Please fill in all required fields.')
    return
  }

  // Age validation - Burial service requires 18+ years old
  if (age.value < 18) {
    submitError.value = 'You must be at least 18 years old to request burial service.'
    ElMessage.error('You must be at least 18 years old to request burial service.')
    return
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    submitError.value = 'Please enter a valid email address.'
    ElMessage.error('Please enter a valid email address.')
    return
  }

  // Agreement validation
  if (!termsAgreed.value) {
    agreementError.value = 'You must agree to the Terms of Service and Privacy Policy.'
    ElMessage.error('Please agree to the Terms of Service and Privacy Policy.')
    return
  }
  agreementError.value = ''

  try {
    // Show confirmation dialog
    const isMemberRequest = isLoggedIn.value && userInfo.value.member && userInfo.value.member.member_id
    const confirmMessage = isMemberRequest
      ? 'Are you sure you want to submit this burial service request?'
      : 'Are you sure you want to submit this burial service request? This will create a burial service record without creating a member account.'

    await ElMessageBox.confirm(
      confirmMessage,
      'Confirm Submission',
      {
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    )

    isSubmitting.value = true

    // Prepare payload matching backend burial service expectations
    const payload = {
      requester_name: `${firstname.value.trim()} ${middleName.value.trim() || ''} ${lastname.value.trim()}`.trim(),
      requester_email: email.value.trim().toLowerCase(),
      relationship: relationship.value,
      location: burialLocation.value.trim(),
      pastor_name: null,
      service_date: null,
      preferred_service_time: preferredServiceDate.value ? new Date(preferredServiceDate.value).toISOString() : null,
      status: 'pending',
      deceased_name: deceasedName.value.trim(),
      deceased_birthdate: deceasedBirthDate.value,
      date_death: deceasedDeathDate.value,
      reason_of_death: reasonOfDeath.value.trim() || null,
      // Use member_id if logged in and has member record, otherwise null for non-member requests
      member_id: (isLoggedIn.value && userInfo.value.member && userInfo.value.member.member_id) ? userInfo.value.member.member_id : null
    }

    const result = await burialServiceStore.createService(payload)
    
    if (result.success) {
      const isMemberRequest = isLoggedIn.value && userInfo.value.member && userInfo.value.member.member_id
      const successMessage = isMemberRequest
        ? 'Burial service request submitted successfully! Our pastoral team will support you during this time.'
        : 'Burial service request submitted successfully! Our pastoral team will support you during this time. No member account was created.'

      showSuccessDialog('Success!', successMessage)

      // Refresh available dates to show the newly booked date as unavailable
      await fetchAvailableBurialDates()

      // Clear form after successful submission
      resetForm()
    } else {
      submitError.value = result.error || 'An error occurred while submitting the request. Please try again.'
      ElMessage.error(submitError.value)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error submitting form:', error)
      submitError.value = 'An error occurred while submitting the request. Please try again.'
      ElMessage.error(submitError.value)
    }
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  firstname.value = ''
  middleName.value = ''
  lastname.value = ''
  birthdate.value = ''
  address.value = ''
  email.value = ''
  phoneNumber.value = ''
  gender.value = ''
  age.value = 0
  relationship.value = ''
  deceasedName.value = ''
  deceasedBirthDate.value = ''
  deceasedAge.value = 0
  deceasedDeathDate.value = ''
  reasonOfDeath.value = ''
  burialLocation.value = ''
  preferredServiceDate.value = getDefaultNightTimeDate()
  submitMessage.value = ''
  submitError.value = ''
}

// Handle member form submission
const handleMemberSubmit = async () => {
  // Reset messages
  submitMessage.value = ''
  submitError.value = ''

  if (!memberFormData.deceased_name.trim() || !memberFormData.deceased_birthdate || 
      !memberFormData.date_death || !memberFormData.relationship || !memberFormData.burial_location.trim() ||
      !memberFormData.reason_of_death.trim() || !preferredServiceDate.value) {
    submitError.value = 'Please fill in all required fields, including selecting a service time from the left panel.'
    ElMessage.error('Please select a burial service time slot from the available dates on the left.')
    return
  }

  // Agreement validation
  if (!termsAgreed.value) {
    agreementError.value = 'You must agree to the Terms of Service and Privacy Policy.'
    ElMessage.error('Please agree to the Terms of Service and Privacy Policy.')
    return
  }
  agreementError.value = ''

  try {
    isSubmitting.value = true

    // Prepare payload for member
    const payload = {
      requester_name: `${userInfo.value.member?.firstname || ''} ${userInfo.value.member?.middle_name || ''} ${userInfo.value.member?.lastname || ''}`.replace(/\s+/g, ' ').trim(),
      requester_email: userInfo.value.account?.email?.trim().toLowerCase() || '',
      relationship: memberFormData.relationship,
      location: memberFormData.burial_location.trim(),
      pastor_name: null,
      service_date: null,
      preferred_service_time: preferredServiceDate.value,
      status: 'pending',
      deceased_name: memberFormData.deceased_name.trim(),
      deceased_birthdate: memberFormData.deceased_birthdate ? new Date(memberFormData.deceased_birthdate).toISOString().split('T')[0] : '',
      date_death: memberFormData.date_death ? new Date(memberFormData.date_death).toISOString() : '',
      reason_of_death: memberFormData.reason_of_death.trim() || null,
      member_id: userInfo.value.member?.member_id || null
    }
    
    console.log('Member burial service payload:', JSON.stringify(payload, null, 2))
    console.log('preferred_service_time value:', payload.preferred_service_time)

    const result = await burialServiceStore.createService(payload)
    
    if (result.success) {
      showSuccessDialog('Success!', 'Burial service request submitted successfully! Our pastoral team will support you during this time.')
      
      // Refresh available dates to show the newly booked date as unavailable
      await fetchAvailableBurialDates()
      
      // Clear form after successful submission
      memberFormData.deceased_name = ''
      memberFormData.deceased_birthdate = ''
      memberFormData.date_death = ''
      memberFormData.relationship = ''
      memberFormData.burial_location = ''
      memberFormData.reason_of_death = ''
      memberFormData.reason_of_death = ''
      memberFormData.preferred_service_date = null
      preferredServiceDate.value = getDefaultNightTimeDate()
    } else {
      submitError.value = result.error || 'An error occurred while submitting the request. Please try again.'
      ElMessage.error(submitError.value)
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    submitError.value = 'An error occurred while submitting the request. Please try again.'
    ElMessage.error(submitError.value)
  } finally {
    isSubmitting.value = false
  }
}

const handleBurialDialogSubmit = async (payload) => {
  if (!burialDialogRef.value) return
  try {
    const { success, error } = await burialServiceStore.createService(payload)
    if (success) {
      showSuccessDialog('Success!', 'Burial service request submitted successfully! Our pastoral team will support you during this time.')
      showBurialDialog.value = false
      // Refresh available dates to show the newly booked date as unavailable
      await fetchAvailableBurialDates()
    } else {
      ElMessage.error(error || 'Failed to submit burial service request.')
    }
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to submit burial service request.')
  } finally {
    burialDialogRef.value?.resetLoading()
  }
}
const selectBurialTimeSlot = (date, time) => {
  // Ensure time format is HH:mm:ss
  let formattedTime = time
  if (time && !time.includes(':')) {
    // If time is just hour like "20", convert to "20:00:00"
    formattedTime = `${time}:00:00`
  } else if (time && time.split(':').length === 2) {
    // If time is "HH:mm", add seconds
    formattedTime = `${time}:00`
  }
  
  // Format: YYYY-MM-DD HH:mm:ss for the el-date-picker value-format
  const dateTime = `${date} ${formattedTime}`
  preferredServiceDate.value = dateTime
  memberFormData.preferred_service_date = dateTime
  ElMessage.success(`Selected: ${date} at ${time}`)
  const registerSection = document.getElementById('register')
  if (registerSection) {
    registerSection.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
.burial-service-page {
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

/* Available Dates Card Styles */
.available-dates-card {
  max-height: 600px;
  overflow-y: auto;
}

.dates-expansion-panels {
  max-height: 400px;
  overflow-y: auto;
}

.dates-expansion-panels .v-expansion-panel {
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid #0d9488 !important;
}

.dates-expansion-panels .v-expansion-panel-title {
  min-height: 48px;
  padding: 12px 16px;
}

.dates-expansion-panels .v-expansion-panel-text__wrapper {
  padding: 8px 16px 16px;
}

/* Make left column scrollable when logged in to match right column height */
@media (min-width: 1024px) {
  .left-column {
    max-height: 800px;
    overflow-y: auto;
    padding-right: 8px;
  }
  
  .left-column::-webkit-scrollbar {
    width: 6px;
  }
  
  .left-column::-webkit-scrollbar-track {
    background: rgba(13, 148, 136, 0.1);
    border-radius: 3px;
  }
  
  .left-column::-webkit-scrollbar-thumb {
    background: rgba(13, 148, 136, 0.3);
    border-radius: 3px;
  }
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

/* Welcome Alert */
.welcome-alert {
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

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-row-3 {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
  .form-row-3 {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.required {
  color: #ef4444;
}

.required-text {
  color: #ef4444;
  font-size: 0.75rem;
  margin-left: 4px;
}

.submit-btn {
  margin-top: 8px;
}

/* Form notes */
.info-note {
  background-color: #f0f9ff !important;
  color: #0c4a6e;
  border: 1px solid #bae6fd;
}

.section-note {
  background-color: #fef3c7 !important;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.field-note {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: -4px;
  margin-bottom: 8px;
  font-style: italic;
}

/* Large Checkbox Overrides */
.large-checkbox :deep(.el-checkbox__inner) {
  width: 32px !important;
  height: 32px !important;
  border-width: 2px !important;
  border-color: #0d9488 !important;
}

.large-checkbox :deep(.el-checkbox__inner::after) {
  height: 16px !important;
  width: 8px !important;
  left: 11px !important;
  top: 4px !important;
  border-width: 3px !important;
}

.large-checkbox.is-checked :deep(.el-checkbox__inner) {
  background-color: #0d9488 !important;
}

.large-checkbox :deep(.el-checkbox__label) {
  display: none !important; /* We use a custom div for text for better control */
}
</style>
