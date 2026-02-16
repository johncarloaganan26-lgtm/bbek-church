<template>
  <section class="info-section" :style="sectionStyle">
    <!-- Dark overlay for readability -->
    <div class="section-overlay"></div>
    
    <!-- Loading overlay -->
    <v-overlay :model-value="isLoadingInfo" contained class="align-center justify-center" style="z-index: 10;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <v-container>
      <!-- Three Column Layout -->
      <v-row justify="center">
        <!-- Column 1: Sunday Service -->
        <v-col cols="12" md="4">
          <div class="info-column text-center">
            <div class="icon-wrapper">
              <v-icon :icon="infoData.column1Icon || 'mdi-clock-outline'" size="32" :color="infoData.buttonColor || '#008080'"></v-icon>
            </div>
            <h3
              class="info-title font-weight-bold"
              :style="`font-family: 'Georgia', serif; font-style: italic; color: ${infoData.buttonColor || '#008080'}`"
            >
              {{ infoData.column1Title || 'SUNDAY SERVICE' }}
            </h3>
            <div
              class="info-text text-grey-darken-2"
              style="font-family: 'Georgia', serif; font-style: italic;"
              v-html="formatText(infoData.column1Text)"
            ></div>
          </div>
        </v-col>

        <!-- Column 2: Watch Online -->
        <v-col cols="12" md="4">
          <div class="info-column text-center">
            <div class="icon-wrapper">
              <v-icon :icon="infoData.column2Icon || 'mdi-laptop'" size="32" :color="infoData.buttonColor || '#008080'"></v-icon>
            </div>
            <h3
              class="info-title font-weight-bold"
              :style="`font-family: 'Georgia', serif; font-style: italic; color: ${infoData.buttonColor || '#008080'}`"
            >
              {{ infoData.column2Title || 'WATCH ONLINE' }}
            </h3>
            <div
              class="info-text text-grey-darken-2 mb-3"
              style="font-family: 'Georgia', serif; font-style: italic;"
              v-html="formatText(infoData.column2Text)"
            ></div>
            <v-btn
              variant="outlined"
              size="default"
              class="info-btn px-5"
              :style="`font-family: Poppins, sans-serif; font-weight: 600; border-color: ${infoData.buttonColor || '#008080'}`"
              @click="$router.push(infoData.watchLiveLink || '/live')"
            >
              {{ infoData.watchLiveButtonText || 'WATCH LIVE' }}
            </v-btn>
          </div>
        </v-col>

        <!-- Column 3: Give -->
        <v-col cols="12" md="4">
          <div class="info-column text-center">
            <div class="icon-wrapper">
              <v-icon :icon="infoData.column3Icon || 'mdi-cash'" size="32" :color="infoData.buttonColor || '#008080'"></v-icon>
            </div>
            <h3
              class="info-title font-weight-bold"
              :style="`font-family: 'Georgia', serif; font-style: italic; color: ${infoData.buttonColor || '#008080'}`"
            >
              {{ infoData.column3Title || 'GIVE' }}
            </h3>
            <div
              class="info-text text-grey-darken-2 mb-3"
              style="font-family: 'Georgia', serif; font-style: italic;"
              v-html="formatText(infoData.column3Text)"
            ></div>
            <v-btn
              variant="outlined"
              size="default"
              class="info-btn px-5"
              :style="`font-family: Poppins, sans-serif; font-weight: 600; border-color: ${infoData.buttonColor || '#008080'}`"
              @click="$router.push(infoData.giveLink || '/give')"
            >
              {{ infoData.giveButtonText || 'GIVE' }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from '@/api/axios'

// Default data structure
const infoData = ref({
  backgroundImage: '/img/abt.jpg',
  column1Icon: 'mdi-clock-outline',
  column1Title: 'SUNDAY SERVICE',
  column1Text: 'Bible Baptist Ekklesia of Kawit<br>Time: 10:00am<br>Location: 485 Acacia St., Villa Ramirez, Tabon 1, Kawit, Cavite',
  column2Icon: 'mdi-laptop',
  column2Title: 'WATCH ONLINE',
  column2Text: 'Sunday: 10:00am<br>Wednesday: 7:00pm',
  watchLiveButtonText: 'WATCH LIVE',
  watchLiveLink: '/live',
  column3Icon: 'mdi-cash',
  column3Title: 'GIVE',
  column3Text: 'Support the ministry and missions of our church.<br>Be a part of what God is doing.',
  giveButtonText: 'GIVE',
  giveLink: '/give',
  buttonColor: '#008080'
})

// Loading state for CMS data
const isLoadingInfo = ref(false)

// Format text - convert newlines to <br> if not already HTML
const formatText = (text) => {
  if (!text) return ''
  if (text.includes('<br>') || text.includes('<p>')) return text
  return text.replace(/\n/g, '<br>')
}

// Fetch info section data from CMS
const fetchInfoData = async () => {
  isLoadingInfo.value = true
  try {
    const response = await axios.get('/cms/info/full')
    if (response.data.success && response.data.data) {
      const { page } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Info:', content)
      
      // Update info data from content
      if (content.backgroundImage) infoData.value.backgroundImage = content.backgroundImage
      if (content.column1Icon) infoData.value.column1Icon = content.column1Icon
      if (content.column1Title) infoData.value.column1Title = content.column1Title
      if (content.column1Text) infoData.value.column1Text = content.column1Text
      if (content.column2Icon) infoData.value.column2Icon = content.column2Icon
      if (content.column2Title) infoData.value.column2Title = content.column2Title
      if (content.column2Text) infoData.value.column2Text = content.column2Text
      if (content.watchLiveButtonText) infoData.value.watchLiveButtonText = content.watchLiveButtonText
      if (content.watchLiveLink) infoData.value.watchLiveLink = content.watchLiveLink
      if (content.column3Icon) infoData.value.column3Icon = content.column3Icon
      if (content.column3Title) infoData.value.column3Title = content.column3Title
      if (content.column3Text) infoData.value.column3Text = content.column3Text
      if (content.giveButtonText) infoData.value.giveButtonText = content.giveButtonText
      if (content.giveLink) infoData.value.giveLink = content.giveLink
      if (content.buttonColor) infoData.value.buttonColor = content.buttonColor
      
      console.log('✅ Info CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Info, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching info data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  } finally {
    isLoadingInfo.value = false
  }
}

// Computed background style
const sectionStyle = computed(() => {
  const bgImage = infoData.value.backgroundImage || '/img/abt.jpg'
  const btnColor = infoData.value.buttonColor || '#008080'
  return {
    '--btn-color': btnColor,
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  }
})

onMounted(async () => {
  await fetchInfoData()
})
</script>

<style scoped>
.info-section {
  position: relative;
  min-height: 220px;
  display: flex;
  align-items: center;
  padding: 16px 0;
  --btn-color: #008080;
}

.section-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  z-index: 1;
}

.info-column {
  padding: 12px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 128, 128, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.info-title {
  font-size: clamp(1.05rem, 1.6vw, 1.25rem);
  line-height: 1.25;
  margin-bottom: 10px;
}

.info-text {
  font-size: 0.92rem;
  line-height: 1.5;
}

/* Info Button Styles */
.info-btn {
  position: relative;
  overflow: hidden;
  color: var(--btn-color) !important;
  font-size: 0.82rem;
  min-height: 36px;
  transition: color 0.3s ease;
  z-index: 1;
}

.info-btn::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0%;
  background: var(--btn-color);
  transition: height 0.3s ease;
  z-index: -1;
}

.info-btn:hover {
  color: white !important;
}

.info-btn:hover::before {
  height: 100%;
}

@media (max-width: 960px) {
  .info-section {
    min-height: auto;
    padding: 14px 0;
  }

  .info-column {
    padding: 10px 8px;
    margin-bottom: 12px;
  }

  .info-title {
    margin-bottom: 8px;
    font-size: 1rem;
  }

  .info-text {
    font-size: 0.9rem;
  }

  .info-column:last-child {
    margin-bottom: 0;
  }
}

@media (max-width: 600px) {
  .info-section {
    min-height: auto;
    padding: 10px 0;
  }

  .info-column {
    padding: 8px 6px;
    margin-bottom: 10px;
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
  }

  .info-title {
    margin-bottom: 6px;
    font-size: 0.95rem;
  }

  .info-text {
    font-size: 0.85rem;
    line-height: 1.45;
  }

  .info-btn {
    font-size: 0.78rem;
    min-height: 32px;
  }

  .icon-wrapper :deep(.v-icon) {
    font-size: 24px !important;
  }
}
</style>
