<template>
  <section class="beliefs-section pt-20 pb-10" :style="{ backgroundColor: beliefData.beliefsBgColor || '#ffffff' }">
    <v-container>
      <h2
        class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-center text-grey-darken-3 mb-16 fade-in-up"
        style="font-family: 'Georgia', serif; font-style: italic;"
      >
        {{ beliefData.doctrinalTitle || 'Doctrinal Statement' }}
      </h2>
      <v-card class="pa-12 mb-16" elevation="2">
        <p
          class="text-h6 text-grey-darken-1 text-center mb-8"
          style="font-family: 'Georgia', serif; font-style: italic;"
        >
          {{ beliefData.doctrinalText || 'We believe that doctrine matters — not because it divides, but because it anchors our faith in truth. While misunderstandings can create division, essential biblical teachings are non-negotiable for us. At the same time, we honor freedom in areas where Scripture allows for diversity. Above all, we strive to grow in love.' }}
        </p>
        <v-row>
          <v-col cols="12" md="4">
            <div class="text-center pa-4">
              <h3
                class="text-h6 font-weight-bold text-grey-darken-3 mb-2"
                style="font-family: 'Georgia', serif; font-style: italic;"
              >
                {{ beliefData.essentialsTitle || 'In essentials, unity.' }}
              </h3>
              <p
                class="text-body-2 text-grey-darken-1"
                style="font-family: 'Georgia', serif; font-style: italic;"
              >
                {{ beliefData.essentialsText || 'We hold tightly to core Christian truths.' }}
              </p>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-center pa-4">
              <h3
                class="text-h6 font-weight-bold text-grey-darken-3 mb-2"
                style="font-family: 'Georgia', serif; font-style: italic;"
              >
                {{ beliefData.libertyTitle || 'In non-essentials, liberty.' }}
              </h3>
              <p
                class="text-body-2 text-grey-darken-1"
                style="font-family: 'Georgia', serif; font-style: italic;"
              >
                {{ beliefData.libertyText || 'We give grace for secondary theological convictions.' }}
              </p>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-center pa-4">
              <h3
                class="text-h6 font-weight-bold text-grey-darken-3 mb-2"
                style="font-family: 'Georgia', serif; font-style: italic;"
              >
                {{ beliefData.loveTitle || 'In all things, love.' }}
              </h3>
              <p
                class="text-body-2 text-grey-darken-1"
                style="font-family: 'Georgia', serif; font-style: italic;"
              >
                {{ beliefData.loveText || 'Everything we believe and do is rooted in the love of Christ.' }}
              </p>
            </div>
          </v-col>
        </v-row>
      </v-card>
      <div class="text-center hero-buttons">
        <v-btn
          :variant="'flat'"
          :style="{
            '--button-color': beliefData.backButtonColor || '#14b8a6',
            color: 'white',
            backgroundColor: beliefData.backButtonColor || '#14b8a6',
            borderColor: beliefData.backButtonColor || '#14b8a6'
          }"
          :class="[
            'mr-4 mb-2 hero-btn hero-btn-custom-radius',
            'hero-btn-dynamic-filled'
          ]"
          size="large"
          rounded
          @click="$router.push('/about/beliefs')"
        >
          {{ beliefData.backButtonText || 'Our beliefs' }}
        </v-btn>
      </div>
    </v-container>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from '@/api/axios'
import { useCmsStore } from '@/stores/cmsStore'

const beliefData = ref({
  doctrinalTitle: 'Doctrinal Statement',
  doctrinalText: 'We believe that doctrine matters — not because it divides, but because it anchors our faith in truth. While misunderstandings can create division, essential biblical teachings are non-negotiable for us. At the same time, we honor freedom in areas where Scripture allows for diversity. Above all, we strive to grow in love.',
  essentialsTitle: 'In essentials, unity.',
  essentialsText: 'We hold tightly to core Christian truths.',
  libertyTitle: 'In non-essentials, liberty.',
  libertyText: 'We give grace for secondary theological convictions.',
  loveTitle: 'In all things, love.',
  loveText: 'Everything we believe and do is rooted in the love of Christ.',
  backButtonText: 'Our Beliefs',
  backButtonColor: '#14b8a6'
})

// Fetch belief data from CMS
const fetchBeliefData = async () => {
  try {
    const response = await axios.get('/cms/belief/full')
    if (response.data.success && response.data.data) {
      const { page } = response.data.data
      const content = page?.content || {}

      console.log('CMS Response - Belief Section:', content)

      // Update belief data from content
      if (content.doctrinalTitle) beliefData.value.doctrinalTitle = content.doctrinalTitle
      if (content.doctrinalText) beliefData.value.doctrinalText = content.doctrinalText
      if (content.essentialsTitle) beliefData.value.essentialsTitle = content.essentialsTitle
      if (content.essentialsText) beliefData.value.essentialsText = content.essentialsText
      if (content.libertyTitle) beliefData.value.libertyTitle = content.libertyTitle
      if (content.libertyText) beliefData.value.libertyText = content.libertyText
      if (content.loveTitle) beliefData.value.loveTitle = content.loveTitle
      if (content.loveText) beliefData.value.loveText = content.loveText
      if (content.backButtonText) beliefData.value.backButtonText = content.backButtonText
      if (content.backButtonColor) {
        beliefData.value.backButtonColor = content.backButtonColor
        console.log('Back button color from CMS:', content.backButtonColor)
      }

      console.log('✅ Belief section CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Belief section, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching belief data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

const cmsStore = useCmsStore()

// Event listener for CMS updates
const handleCmsUpdate = async (event) => {
  if (event.detail?.page === 'belief') {
    console.log('BeliefsSection: CMS update detected for belief page')
    setTimeout(async () => {
      await fetchBeliefData()
    }, 1500) // Wait for database commit
  }
}

onMounted(async () => {
  await fetchBeliefData()

  // Listen for CMS updates
  window.addEventListener('cms-page-updated', handleCmsUpdate)
})

onUnmounted(() => {
  window.removeEventListener('cms-page-updated', handleCmsUpdate)
})
</script>

<style scoped>
.beliefs-section {
  margin-top: 80px; /* Push down from hero section */
  margin-bottom: 40px;
}

.hero-buttons :deep(.hero-btn-dynamic-filled) {
  text-transform: none !important;
  border-radius: 5px !important;
}

.hero-buttons :deep(.hero-btn-dynamic-filled:hover) {
  border-color: white !important;
  color: white !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.belief-card,
.core-belief-card,
.matter-card {
  animation: fadeInUp 0.6s ease-out both;
  transition: all 0.3s ease;
}

.belief-card:hover,
.core-belief-card:hover,
.matter-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.belief-card-1 { animation-delay: 200ms; }
.belief-card-2 { animation-delay: 300ms; }
.belief-card-3 { animation-delay: 400ms; }

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
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

@media (max-width: 960px) {
  .beliefs-section :deep(.text-h3) {
    font-size: 1.75rem !important;
  }

  .beliefs-section :deep(.text-h6) {
    font-size: 1rem !important;
  }
}

@media (max-width: 640px) {
  .beliefs-section :deep(.text-h3) {
    font-size: 1.5rem !important;
  }
}
</style>