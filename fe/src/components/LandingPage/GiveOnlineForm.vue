<template>
  <div class="give-online-form">
    <v-row>
      <!-- GCash Card -->
      <v-col cols="12" md="6">
        <v-card class="payment-card" elevation="0" variant="flat">
          <div class="payment-content">
            <!-- GCash Logo -->
            <div class="logo-container">
              <img :src="gcashLogoSrc" alt="GCash Logo" class="logo-img" />
            </div>
            
            <!-- GCash Text -->
            <div class="payment-text gcash-text">{{ gcashText }}</div>
            
            <!-- Instruction Text -->
            <p class="instruction">
              {{ gcashInstruction }}
            </p>
            
            <!-- GCash QR Code -->
            <div class="qr-container">
              <img :src="gcashQrSrc" alt="GCash QR Code" class="qr-img" />
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Maya Card -->
      <v-col v-if="mayaQrSrc" cols="12" md="6">
        <v-card class="payment-card" elevation="0" variant="flat">
          <div class="payment-content">
            <!-- Maya Logo -->
            <div class="logo-container">
              <img :src="mayaLogoSrc" alt="Maya Logo" class="logo-img" />
            </div>
            
            <!-- Maya Text -->
            <div class="payment-text maya-text">{{ mayaText }}</div>
            
            <!-- Maya Instruction Text -->
            <p class="instruction">
              {{ mayaInstruction }}
            </p>
            
            <!-- Maya QR Code -->
            <div class="qr-container">
              <img :src="mayaQrSrc" alt="Maya QR Code" class="qr-img" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from '@/api/axios'

// Props to receive data from parent Give.vue
const props = defineProps({
  gcashLogoImage: {
    type: String,
    default: '/img/gcash.png'
  },
  gcashQrImage: {
    type: String,
    default: '/img/gcash-qr.png'
  },
  gcashInstructionText: {
    type: String,
    default: 'Send your donation to this GCash account'
  },
  mayaLogoImage: {
    type: String,
    default: ''
  },
  mayaQrImage: {
    type: String,
    default: ''
  },
  mayaInstructionText: {
    type: String,
    default: 'Send your donation to this Maya account'
  }
})

const gcashText = ref('GCash')
const gcashNumber = ref('09309224324')
const mayaText = ref('Maya')

// Computed properties for template
const gcashLogoSrc = computed(() => props.gcashLogoImage)
const gcashQrSrc = computed(() => props.gcashQrImage)
const gcashInstruction = computed(() => props.gcashInstructionText)
const mayaLogoSrc = computed(() => props.mayaLogoImage)
const mayaQrSrc = computed(() => props.mayaQrImage)
const mayaInstruction = computed(() => props.mayaInstructionText)

// Fetch give data from CMS
const fetchGiveData = async () => {
  try {
    const response = await axios.get('/cms/give/full')
    if (response.data.success && response.data.data) {
      const { page } = response.data.data
      const content = page?.content || {}
      
      // Update GCash data
      gcashText.value = content.gcashText || gcashText.value
      gcashNumber.value = content.gcashNumber || gcashNumber.value
      
      // Update Maya data
      mayaText.value = content.mayaText || mayaText.value
      // Note: mayaInstruction is a computed property from props, 
      // but we could also have it as a local ref if we wanted it to be independent.
      // For now, keeping it prop-driven is better for consistency with Give.vue.
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching give data from CMS:', error)
    }
  }
}

onMounted(async () => {
  await fetchGiveData()
})
</script>

<style scoped>
.give-online-form {
  padding: 0;
}

.payment-card {
  background: white;
  border-radius: 8px;
  padding: 24px 16px;
  height: 100%;
}

.payment-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.logo-container {
  margin-bottom: 12px;
}

.logo-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.payment-text {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
}

.gcash-text {
  color: #0070BA;
}

.maya-text {
  color: #E03C31;
}

.instruction {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
}

.qr-container {
  margin-top: 12px;
}

.qr-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 600px) {
  .payment-card {
    padding: 20px 12px;
  }
  
  .logo-img {
    width: 56px;
    height: 56px;
  }
  
  .payment-text {
    font-size: 18px;
  }
  
  .qr-img {
    width: 120px;
    height: 120px;
  }
}
</style>
