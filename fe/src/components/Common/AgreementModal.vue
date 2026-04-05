<template>
  <v-dialog
    v-model="internalValue"
    max-width="700px"
    persistent
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card class="agreement-modal-card rounded-xl">
      <v-card-title class="d-flex align-center justify-space-between pa-6 bg-teal-darken-2 text-white">
        <div class="d-flex align-center">
          <v-icon color="white" class="mr-3">
            {{ activeTab === 'terms' ? 'mdi-file-document-outline' : 'mdi-shield-check-outline' }}
          </v-icon>
          <span class="text-h5 font-weight-bold" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy' }}
          </span>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="internalValue = false"></v-btn>
      </v-card-title>

      <v-tabs
        v-model="activeTab"
        bg-color="teal-lighten-5"
        color="teal-darken-2"
        grow
      >
        <v-tab value="terms">Terms of Service</v-tab>
        <v-tab value="privacy">Privacy Policy</v-tab>
      </v-tabs>

      <v-divider></v-divider>

      <v-card-text class="pa-8 bg-white text-grey-darken-3 agreement-content">
        <v-window v-model="activeTab">
          <v-window-item value="terms">
            <div class="content-section">
              <h3 class="text-h6 font-weight-bold mb-3">1. Welcome to Bible Baptist Ekklesia of Kawit</h3>
              <p class="mb-4">Welcome to Bible Baptist Ekklesia of Kawit. By using our services, you agree to comply with and be bound by the following terms of service.</p>
              
              <h3 class="text-h6 font-weight-bold mb-3">2. Service Description</h3>
              <p class="mb-4">Our services (Salvation, Burial, Child Dedication, Water Baptism, Bible Study) are provided for religious and community purposes. We reserve the right to modify or terminate these services at any time.</p>
              
              <h3 class="text-h6 font-weight-bold mb-3">3. User Responsibility</h3>
              <p class="mb-4">You are responsible for providing accurate and truthful information in all forms. Any misleading information may result in the rejection of your request.</p>
              
              <h3 class="text-h6 font-weight-bold mb-3">4. Confidentiality</h3>
              <p class="mb-4">While we take measures to protect your data, you acknowledge that information shared for religious purposes may be reviewed by authorized church pastoral staff.</p>
            </div>
          </v-window-item>

          <v-window-item value="privacy">
            <div class="content-section">
              <h3 class="text-h6 font-weight-bold mb-3">1. Information Collection</h3>
              <p class="mb-4">We collect personal information such as name, email, phone number, and address to process your requests for church services.</p>
              
              <h3 class="text-h6 font-weight-bold mb-3">2. Use of Information</h3>
              <p class="mb-4">The information collected is used solely for organizing church activities, coordinating with pastoral staff, and communicating with you regarding your requests.</p>
              
              <h3 class="text-h6 font-weight-bold mb-3">3. Data Protection</h3>
              <p class="mb-4">We implement security measures to maintain the safety of your personal information. We do not sell or trade your data to outside parties.</p>
              
              <h3 class="text-h6 font-weight-bold mb-3">4. Consent</h3>
              <p class="mb-4">By submitting our forms, you consent to our privacy policy and agree to be contacted by church representatives via the provided contact information.</p>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-6 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn
          color="teal-darken-2"
          variant="flat"
          size="large"
          class="px-8 rounded-pill font-weight-bold"
          @click="internalValue = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialTab: {
    type: String,
    default: 'terms'
  }
})

const emit = defineEmits(['update:modelValue'])

const activeTab = ref(props.initialTab)

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

watch(() => props.initialTab, (newTab) => {
  activeTab.value = newTab
})
</script>

<style scoped>
.agreement-modal-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.agreement-content {
  line-height: 1.8;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
}

.content-section h3 {
  color: #0f766e;
}

.agreement-modal-card :deep(.v-tab) {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>
