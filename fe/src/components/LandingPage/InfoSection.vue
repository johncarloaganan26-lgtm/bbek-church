<template>
  <section class="info-section" :style="sectionStyle">
    <!-- Dark overlay for readability -->
    <div class="section-overlay"></div>
    
    <!-- Loading overlay -->
    <v-overlay :model-value="isLoadingInfo" contained class="align-center justify-center" style="z-index: 10;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <v-container class="info-content-container">
      <!-- Three Column Layout -->
      <v-row justify="center" class="info-row">
        <!-- Column 1: Sunday Service -->
        <v-col cols="12" md="4">
          <div class="info-column text-center">
            <div class="icon-wrapper">
              <v-icon :icon="infoData.column1Icon || 'mdi-clock-outline'" size="32" :color="accentColor"></v-icon>
            </div>
            <h3
              class="info-title font-weight-bold"
              style="font-family: 'Georgia', serif; font-style: italic;"
            >
              {{ infoData.column1Title || 'SUNDAY SERVICE' }}
            </h3>
            <div
              class="info-text"
              style="font-family: 'Georgia', serif; font-style: italic;"
              v-html="formatText(infoData.column1Text)"
            ></div>
          </div>
        </v-col>

        <!-- Column 2: Watch Online -->
        <v-col cols="12" md="4">
          <div class="info-column text-center">
            <div class="icon-wrapper">
              <v-icon :icon="infoData.column2Icon || 'mdi-laptop'" size="32" :color="accentColor"></v-icon>
            </div>
            <h3
              class="info-title font-weight-bold"
              style="font-family: 'Georgia', serif; font-style: italic;"
            >
              {{ infoData.column2Title || 'WATCH ONLINE' }}
            </h3>
            <div
              class="info-text mb-3"
              style="font-family: 'Georgia', serif; font-style: italic;"
              v-html="formatText(infoData.column2Text)"
            ></div>
            <v-btn
              variant="outlined"
              size="default"
              class="info-btn px-5"
              :style="`font-family: Poppins, sans-serif; font-weight: 600; border-color: ${accentColor}`"
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
              <v-icon :icon="infoData.column3Icon || 'mdi-cash'" size="32" :color="accentColor"></v-icon>
            </div>
            <h3
              class="info-title font-weight-bold"
              style="font-family: 'Georgia', serif; font-style: italic;"
            >
              {{ infoData.column3Title || 'GIVE' }}
            </h3>
            <div
              class="info-text mb-3"
              style="font-family: 'Georgia', serif; font-style: italic;"
              v-html="formatText(infoData.column3Text)"
            ></div>
            <v-btn
              variant="outlined"
              size="default"
              class="info-btn px-5"
              :style="`font-family: Poppins, sans-serif; font-weight: 600; border-color: ${accentColor}`"
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
import { ref, onMounted, computed, watch } from 'vue'
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
const isBackgroundDark = ref(false)

const DEFAULT_BUTTON_COLOR = '#008080'
const HEX_COLOR_REGEX = /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/

const hexToRgb = (hex) => {
  if (!HEX_COLOR_REGEX.test(hex || '')) return null
  const clean = hex.slice(1)
  const normalized = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  }
}

const getLuminance = ({ r, g, b }) => {
  const normalize = (channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }

  const rr = normalize(r)
  const gg = normalize(g)
  const bb = normalize(b)
  return (0.2126 * rr) + (0.7152 * gg) + (0.0722 * bb)
}

const getContrastRatio = (lumA, lumB) => {
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

const getReadableAccentColor = (preferredColor) => {
  const fallbackColor = '#0f766e'
  const safePreferred = HEX_COLOR_REGEX.test(preferredColor || '')
    ? preferredColor
    : DEFAULT_BUTTON_COLOR
  const rgb = hexToRgb(safePreferred)

  if (!rgb) {
    return fallbackColor
  }

  const preferredLuminance = getLuminance(rgb)
  const referenceBackgroundLuminance = 0.9
  const contrast = getContrastRatio(preferredLuminance, referenceBackgroundLuminance)

  return contrast >= 2.7 ? safePreferred : fallbackColor
}

const accentColor = computed(() => getReadableAccentColor(infoData.value.buttonColor))

const detectBackgroundTone = async (imageUrl) => {
  if (!imageUrl) {
    isBackgroundDark.value = false
    return
  }

  try {
    const isDark = await new Promise((resolve) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'

      image.onload = () => {
        try {
          const sampleSize = 24
          const canvas = document.createElement('canvas')
          canvas.width = sampleSize
          canvas.height = sampleSize
          const context = canvas.getContext('2d', { willReadFrequently: true })

          if (!context) {
            resolve(false)
            return
          }

          context.drawImage(image, 0, 0, sampleSize, sampleSize)
          const imageData = context.getImageData(0, 0, sampleSize, sampleSize).data

          let luminanceSum = 0
          let pixelCount = 0

          for (let i = 0; i < imageData.length; i += 4) {
            const alpha = imageData[i + 3]
            if (alpha < 40) continue

            const r = imageData[i]
            const g = imageData[i + 1]
            const b = imageData[i + 2]
            const luminance = ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255
            luminanceSum += luminance
            pixelCount += 1
          }

          const averageLuminance = pixelCount > 0 ? luminanceSum / pixelCount : 0.5
          resolve(averageLuminance < 0.5)
        } catch (error) {
          resolve(false)
        }
      }

      image.onerror = () => resolve(false)
      image.src = imageUrl
    })

    isBackgroundDark.value = isDark
  } catch (error) {
    isBackgroundDark.value = false
  }
}

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
  const overlayBackground = isBackgroundDark.value
    ? 'linear-gradient(180deg, rgba(2, 6, 23, 0.22) 0%, rgba(2, 6, 23, 0.34) 100%)'
    : 'linear-gradient(180deg, rgba(15, 23, 42, 0.12) 0%, rgba(15, 23, 42, 0.22) 100%)'

  const textColor = isBackgroundDark.value ? '#f8fafc' : '#1f2937'
  const textShadowColor = isBackgroundDark.value
    ? 'rgba(2, 6, 23, 0.64)'
    : 'rgba(255, 255, 255, 0.38)'

  const iconBackground = isBackgroundDark.value
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(255, 255, 255, 0.22)'

  const floatChipBg = isBackgroundDark.value
    ? 'rgba(255, 255, 255, 0.13)'
    : 'rgba(255, 255, 255, 0.19)'

  const floatChipBgSoft = isBackgroundDark.value
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.15)'

  const floatChipBorder = isBackgroundDark.value
    ? 'rgba(255, 255, 255, 0.28)'
    : 'rgba(255, 255, 255, 0.36)'

  const floatChipShadow = isBackgroundDark.value
    ? '0 10px 22px rgba(2, 6, 23, 0.38)'
    : '0 8px 18px rgba(15, 23, 42, 0.2)'

  return {
    '--btn-color': accentColor.value,
    '--title-color': accentColor.value,
    '--text-color': textColor,
    '--overlay-bg': overlayBackground,
    '--icon-bg': iconBackground,
    '--text-shadow-color': textShadowColor,
    '--float-chip-bg': floatChipBg,
    '--float-chip-bg-soft': floatChipBgSoft,
    '--float-chip-border': floatChipBorder,
    '--float-chip-shadow': floatChipShadow,
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'scroll'
  }
})

watch(
  () => infoData.value.backgroundImage,
  async (newImage) => {
    await detectBackgroundTone(newImage)
  },
  { immediate: true }
)

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
  padding: 0;
  --btn-color: #008080;
  --title-color: #008080;
  --text-color: #1f2937;
  --overlay-bg: linear-gradient(180deg, rgba(15, 23, 42, 0.12) 0%, rgba(15, 23, 42, 0.22) 100%);
  --icon-bg: rgba(255, 255, 255, 0.22);
  --text-shadow-color: rgba(255, 255, 255, 0.38);
  --float-chip-bg: rgba(255, 255, 255, 0.19);
  --float-chip-bg-soft: rgba(255, 255, 255, 0.15);
  --float-chip-border: rgba(255, 255, 255, 0.36);
  --float-chip-shadow: 0 8px 18px rgba(15, 23, 42, 0.2);
}

.section-overlay {
  position: absolute;
  inset: 0;
  background: var(--overlay-bg);
  transition: background-color 0.25s ease;
  z-index: 1;
}

.info-content-container {
  position: relative;
  z-index: 2;
  padding-top: 26px;
  padding-bottom: 26px;
}

.info-row {
  row-gap: 14px;
}

.info-column {
  padding: 14px 12px;
  margin: 10px 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  border-radius: 14px;
  transform: translateY(-2px);
}

.info-column::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -10px;
  height: 14px;
  background: radial-gradient(ellipse at center, rgba(2, 6, 23, 0.34) 0%, rgba(2, 6, 23, 0) 72%);
  pointer-events: none;
  z-index: -1;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--icon-bg);
  border: 1px solid var(--float-chip-border);
  box-shadow: var(--float-chip-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.info-title {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--float-chip-bg);
  border: 1px solid var(--float-chip-border);
  box-shadow: var(--float-chip-shadow);
  font-size: clamp(1.05rem, 1.6vw, 1.25rem);
  line-height: 1.25;
  margin-bottom: 10px;
  color: var(--title-color);
  text-shadow: 0 1px 2px var(--text-shadow-color);
}

.info-text {
  display: inline-block;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--float-chip-border);
  background: var(--float-chip-bg-soft);
  box-shadow: var(--float-chip-shadow);
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--text-color);
  text-shadow: 0 1px 1px var(--text-shadow-color);
}

/* Info Button Styles */
.info-btn {
  position: relative;
  overflow: hidden;
  background: var(--float-chip-bg-soft) !important;
  border-width: 1px !important;
  box-shadow: var(--float-chip-shadow);
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
    padding: 0;
  }

  .info-content-container {
    padding-top: 18px;
    padding-bottom: 18px;
  }

  .info-column {
    padding: 10px 8px;
    margin: 8px 0;
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
    padding: 0;
  }

  .info-content-container {
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .info-column {
    padding: 8px 6px;
    margin: 6px 0;
    transform: none;
  }

  .info-column::after {
    left: 10px;
    right: 10px;
    bottom: -8px;
    height: 12px;
    background: radial-gradient(ellipse at center, rgba(2, 6, 23, 0.24) 0%, rgba(2, 6, 23, 0) 72%);
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
