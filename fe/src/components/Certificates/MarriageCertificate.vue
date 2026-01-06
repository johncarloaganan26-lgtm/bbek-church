<template>
  <div class="certificate-container">
    <div class="certificate-wrapper" id="marriage-certificate-print">
      <!-- Ornate Gold Border -->
      <div class="certificate-border">
        <div class="border-corner top-left"></div>
        <div class="border-corner top-right"></div>
        <div class="border-corner bottom-left"></div>
        <div class="border-corner bottom-right"></div>
        <div class="border-top"></div>
        <div class="border-bottom"></div>
        <div class="border-left"></div>
        <div class="border-right"></div>
      </div>

      <!-- Certificate Content -->
      <div class="certificate-content">
        <!-- Header Section -->
        <div class="certificate-header">
          <div class="header-left">
            <div class="church-logo">
              <div class="logo-circle">
                <img v-if="churchLogo" :src="churchLogo" alt="Church Logo" class="logo-image" />
                <div v-else class="logo-inner">
                  <div class="bible-icon">📖</div>
                  <div class="bible-reference">1 Cor 5:15</div>
                  <div class="bible-version">KJV 1611</div>
                </div>
                <div v-if="!churchLogo" class="logo-ring-text">BAPTIST EKKLESIA OF KAWIT</div>
              </div>
            </div>
          </div>
          <div class="header-right">
            <h1 class="church-name">{{ churchName }}</h1>
            <h1 v-if="churchNameLarge" class="church-name-large">{{ churchNameLarge }}</h1>
          </div>
        </div>

        <!-- Certificate Title -->
        <div class="certificate-title-section">
          <h2 class="certificate-title">Certificate <span class="title-small">of</span> Marriage</h2>
          <p class="certificate-subtitle">THIS CERTIFICATE IS PRESENTED TO</p>
        </div>

        <!-- Couple Names -->
        <div class="couple-names-section">
          <div class="couple-names">
            {{ groomName || 'Groom' }} <span class="ampersand">&</span> {{ brideName || "Bride's name" }} <span class="here-text">here</span>
          </div>
        </div>

        <!-- Marriage Details -->
        <div class="marriage-details-section">
          <p class="marriage-statement">WERE JOINED IN MARRIAGE</p>
          <p class="marriage-date">
            On this <span class="date-day">{{ formattedDay }}</span> Day of <span class="date-month">{{ formattedMonth }}</span> in the year <span class="date-year">{{ formattedYear }}</span>
          </p>
          <p class="marriage-location">
            at <span class="underline">{{ marriageLocation || '123 Anywhere St., Any City' }}</span>
          </p>
        </div>

        <!-- Signatures Section -->
        <div class="signatures-section">
          <div class="signatures-left">
            <p class="signature-label">Sponsors & Principals</p>
            <div class="signature-lines">
              <div class="signature-columns">
                <div v-for="(sponsor, index) in leftColumnSponsors" :key="`sponsor-left-${index}`" class="signature-line-item">
                  <span class="signature-name">{{ sponsor || 'Name here' }}</span>
                  <div class="signature-underline"></div>
                </div>
              </div>
              <div class="signature-columns">
                <div v-for="(sponsor, index) in rightColumnSponsors" :key="`sponsor-right-${index}`" class="signature-line-item">
                  <span class="signature-name">{{ sponsor || 'Name here' }}</span>
                  <div class="signature-underline"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="signatures-right">
            <p class="signature-label">Minister/Pastor</p>
            <div class="signature-line-item">
              <span class="signature-name">{{ ministerName || 'Name here' }}</span>
              <div class="signature-underline"></div>
            </div>
          </div>
        </div>

        <!-- Print Footer -->
        <div class="print-footer">
          <p class="print-date">Date Printed: {{ printDate }}</p>
          <p class="print-by">Printed by: {{ printedBy }}</p>
        </div>
      </div>
    </div>

    <!-- Print Button (hidden when printing) -->
    <div class="certificate-actions no-print">
      <button @click="printCertificate" class="print-btn">
        Print Certificate
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from '@/api/axios'

const props = defineProps({
  groomName: {
    type: String,
    default: ''
  },
  brideName: {
    type: String,
    default: ''
  },
  marriageDate: {
    type: String,
    default: ''
  },
  marriageLocation: {
    type: String,
    default: ''
  },
  sponsors: {
    type: Array,
    default: () => ['', '', '']
  },
  ministerName: {
    type: String,
    default: ''
  },
  churchName: {
    type: String,
    default: ''
  },
  churchAddress: {
    type: String,
    default: ''
  }
})

const formattedDay = computed(() => {
  if (!props.marriageDate) return '15th'
  const date = new Date(props.marriageDate)
  const day = date.getDate()
  const suffix = getDaySuffix(day)
  return `${day}${suffix}`
})

const formattedMonth = computed(() => {
  if (!props.marriageDate) return 'August'
  const date = new Date(props.marriageDate)
  return date.toLocaleDateString('en-US', { month: 'long' })
})

const formattedYear = computed(() => {
  if (!props.marriageDate) return '2025'
  const date = new Date(props.marriageDate)
  return date.getFullYear()
})

const getDaySuffix = (day) => {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

const leftColumnSponsors = computed(() => {
  const sponsorList = props.sponsors || []
  const midPoint = Math.ceil(sponsorList.length / 2)
  return sponsorList.slice(0, midPoint)
})

const rightColumnSponsors = computed(() => {
  const sponsorList = props.sponsors || []
  const midPoint = Math.ceil(sponsorList.length / 2)
  return sponsorList.slice(midPoint)
})

// Dynamic header data
const churchLogo = ref('')
const churchName = ref('BIBLE BAPTIST EKKLESIA OF')
const churchNameLarge = ref('KAWIT')

// Print footer data
const printDate = ref('')
const printedBy = ref('')

// Get current user info for printed by
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username || user.email || 'Admin'
    }
    // Fallback to any stored name
    const adminName = localStorage.getItem('adminName')
    if (adminName) return adminName
    return 'Admin'
  } catch (e) {
    return 'Admin'
  }
}

// Set print footer data
const setPrintFooterData = () => {
  const now = new Date()
  printDate.value = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  printedBy.value = getCurrentUser()
}

// Fetch header data from CMS
const fetchHeaderData = async () => {
  try {
    const response = await axios.get('/cms/header/full')
    if (response.data.success && response.data.data) {
      const { page, images } = response.data.data
      const content = page?.content || {}
      
      // Get logo from images (base64 data URL)
      if (images?.logo) {
        churchLogo.value = images.logo
      }
      
      // Get church name from content and split if needed
      if (content.fullname) {
        const fullName = content.fullname.toUpperCase()
        // Try to split at "OF" if it exists
        const ofIndex = fullName.indexOf(' OF ')
        if (ofIndex > 0) {
          churchName.value = fullName.substring(0, ofIndex + 3) // Include "OF"
          churchNameLarge.value = fullName.substring(ofIndex + 4) // After "OF "
        } else {
          // If no "OF", try to split at last space
          const lastSpaceIndex = fullName.lastIndexOf(' ')
          if (lastSpaceIndex > 0) {
            churchName.value = fullName.substring(0, lastSpaceIndex)
            churchNameLarge.value = fullName.substring(lastSpaceIndex + 1)
          } else {
            churchName.value = fullName
            churchNameLarge.value = ''
          }
        }
      }
    }
  } catch (error) {
    // If 404 or error, use default values
    if (error.response?.status !== 404) {
      console.error('Error fetching header data from CMS:', error)
    }
  }
}

const printCertificate = () => {
  // Set print footer data before printing
  setPrintFooterData()
  
  // Force landscape orientation
  const style = document.createElement('style')
  style.innerHTML = `
    @media print {
      @page {
        size: landscape;
      }
    }
  `
  document.head.appendChild(style)
  setTimeout(() => {
    window.print()
    // Remove the style after printing
    setTimeout(() => {
      document.head.removeChild(style)
    }, 1000)
  }, 100)
}

onMounted(async () => {
  // Fetch header data from CMS
  await fetchHeaderData()
  
  // Auto-print when component is mounted (optional)
  // Uncomment the line below if you want auto-print on open
  // setTimeout(() => window.print(), 500)
})
</script>

<style scoped>
.certificate-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.certificate-wrapper {
  position: relative;
  width: 100%;
  max-width: 11in;
  min-height: 8.5in;
  background: white;
  margin: 0 auto;
  padding: 40px 50px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: auto;
  max-height: 8.5in;
}

/* Ornate Gold Border */
.certificate-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.border-corner {
  position: absolute;
  width: 80px;
  height: 80px;
  border: 3px solid #d4af37;
  border-radius: 0;
}

.border-corner.top-left {
  top: 15px;
  left: 15px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 12px;
}

.border-corner.top-right {
  top: 15px;
  right: 15px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 12px;
}

.border-corner.bottom-left {
  bottom: 15px;
  left: 15px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 12px;
}

.border-corner.bottom-right {
  bottom: 15px;
  right: 15px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 12px;
}

.border-top,
.border-bottom {
  position: absolute;
  left: 95px;
  right: 95px;
  height: 3px;
  background: linear-gradient(to right, transparent, #d4af37 20%, #d4af37 80%, transparent);
}

.border-top {
  top: 15px;
}

.border-bottom {
  bottom: 15px;
}

.border-left,
.border-right {
  position: absolute;
  top: 95px;
  bottom: 95px;
  width: 3px;
  background: linear-gradient(to bottom, transparent, #d4af37 20%, #d4af37 80%, transparent);
}

.border-left {
  left: 15px;
}

.border-right {
  right: 15px;
}

.certificate-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

/* Header Section */
.certificate-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 25px;
  gap: 25px;
}

.header-left {
  flex-shrink: 0;
}

.church-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-circle {
  position: relative;
  width: 100px;
  height: 100px;
  border: 4px solid #1e40af;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.logo-ring-text {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  font-weight: bold;
  color: white;
  background: #1e40af;
  padding: 2px 10px;
  white-space: nowrap;
  letter-spacing: 0.5px;
  border-radius: 10px;
}

.logo-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
}

.bible-icon {
  font-size: 20px;
  margin-bottom: 3px;
}

.bible-reference {
  font-size: 7px;
  font-weight: bold;
  color: #1e40af;
  margin-bottom: 1px;
}

.bible-version {
  font-size: 6px;
  color: #1e40af;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.header-right {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.church-name {
  font-size: 20px;
  font-weight: 900;
  color: #000;
  margin: 0;
  font-family: Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1.2;
}

.church-name-large {
  font-size: 28px;
  font-weight: 900;
  color: #000;
  margin: 3px 0 0 0;
  font-family: Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  line-height: 1;
}

/* Certificate Title Section */
.certificate-title-section {
  text-align: center;
  margin: 25px 0 15px 0;
}

.certificate-title {
  font-size: 56px;
  font-weight: 400;
  color: #000;
  margin: 0 0 15px 0;
  font-family: 'Brush Script MT', 'Lucida Handwriting', 'Edwardian Script ITC', cursive;
  font-style: italic;
  line-height: 1.2;
}

.title-small {
  font-size: 32px;
}

.certificate-subtitle {
  font-size: 12px;
  color: #000;
  margin: 0;
  font-family: Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
}

/* Couple Names Section */
.couple-names-section {
  text-align: center;
  margin: 20px 0;
}

.couple-names {
  font-size: 42px;
  font-weight: 400;
  color: #d4af37;
  font-family: 'Brush Script MT', 'Lucida Handwriting', 'Edwardian Script ITC', cursive;
  font-style: italic;
  line-height: 1.3;
}

.ampersand {
  margin: 0 8px;
}

.here-text {
  text-transform: lowercase;
}

/* Marriage Details Section */
.marriage-details-section {
  text-align: center;
  margin: 25px 0;
}

.marriage-statement {
  font-size: 14px;
  color: #000;
  margin: 0 0 15px 0;
  font-family: Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.marriage-date {
  font-size: 16px;
  color: #000;
  margin: 0 0 12px 0;
  font-family: 'Times New Roman', serif;
  line-height: 1.5;
}

.date-day,
.date-month,
.date-year {
  font-weight: 600;
}

.marriage-location {
  font-size: 16px;
  color: #000;
  margin: 0;
  font-family: 'Times New Roman', serif;
}

.underline {
  text-decoration: underline;
}

/* Signatures Section */
.signatures-section {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 30px;
  gap: 35px;
}

.signatures-left,
.signatures-right {
  flex: 1;
}

.signature-label {
  font-size: 13px;
  color: #000;
  margin: 0 0 25px 0;
  font-family: 'Times New Roman', serif;
  font-weight: 600;
  border-bottom: 2px solid #000;
  padding-bottom: 4px;
  display: inline-block;
  width: 100%;
}

.signature-lines {
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: space-between;
}

.signature-columns {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.signature-line-item {
  display: flex;
  flex-direction: column;
}

.signature-name {
  font-size: 13px;
  color: #000;
  margin-bottom: 6px;
  font-family: 'Times New Roman', serif;
  min-height: 18px;
}

.signature-underline {
  border-bottom: 1px solid #000;
  width: 100%;
  margin-top: 4px;
}

.signatures-right .signature-label {
  text-align: right;
}

.signatures-right .signature-underline {
  width: 100%;
}

/* Print Actions */
.certificate-actions {
  margin-top: 20px;
}

.print-btn {
  padding: 12px 24px;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.print-btn:hover {
  background: #1e3a8a;
}

/* Print Styles - LANDSCAPE */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
  }

  .certificate-container {
    padding: 0;
    background: white;
    min-height: auto;
  }

  .certificate-wrapper {
    box-shadow: none;
    margin: 0;
    padding: 12px 20px !important;
    page-break-after: avoid;
    page-break-inside: avoid;
    height: 8.5in;
    max-height: 8.5in;
    overflow: hidden;
    width: 11in;
    max-width: 11in;
  }

  .certificate-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0 !important;
    transform: scale(0.97);
    transform-origin: top center;
  }

  /* Reduce spacing for print */
  .certificate-header {
    margin-bottom: 8px !important;
    gap: 15px !important;
  }

  .logo-circle {
    width: 65px !important;
    height: 65px !important;
    margin-bottom: 5px !important;
  }

  .logo-ring-text {
    font-size: 6px !important;
    top: -8px !important;
    padding: 1px 6px !important;
  }

  .logo-inner {
    padding: 5px !important;
  }

  .bible-icon {
    font-size: 16px !important;
    margin-bottom: 2px !important;
  }

  .bible-reference {
    font-size: 6px !important;
    margin-bottom: 0 !important;
  }

  .bible-version {
    font-size: 5px !important;
  }

  .church-name {
    font-size: 14px !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  .church-name-large {
    font-size: 20px !important;
    margin: 2px 0 0 0 !important;
    line-height: 1 !important;
  }

  .certificate-title-section {
    margin: 10px 0 6px 0 !important;
  }

  .certificate-title {
    font-size: 38px !important;
    margin-bottom: 6px !important;
    line-height: 0.95 !important;
  }

  .title-small {
    font-size: 22px !important;
  }

  .certificate-subtitle {
    font-size: 10px !important;
    letter-spacing: 1.2px !important;
    line-height: 1.1 !important;
    margin: 0 !important;
  }

  .couple-names-section {
    margin: 8px 0 !important;
  }

  .couple-names {
    font-size: 30px !important;
    line-height: 1 !important;
  }

  .ampersand {
    margin: 0 5px !important;
  }

  .marriage-details-section {
    margin: 10px 0 !important;
  }

  .marriage-statement {
    font-size: 11px !important;
    margin: 0 0 8px 0 !important;
    line-height: 1.1 !important;
    letter-spacing: 0.5px !important;
  }

  .marriage-date {
    font-size: 12px !important;
    margin: 0 0 6px 0 !important;
    line-height: 1.3 !important;
  }

  .marriage-location {
    font-size: 12px !important;
    line-height: 1.3 !important;
    margin: 0 !important;
  }

  .signatures-section {
    padding-top: 12px !important;
    gap: 25px !important;
    margin-top: auto !important;
  }

  .signature-label {
    font-size: 10px !important;
    margin: 0 0 10px 0 !important;
    padding-bottom: 2px !important;
    border-bottom-width: 1.5px !important;
  }

  .signature-lines {
    gap: 12px !important;
    flex-direction: row !important;
  }

  .signature-columns {
    flex: 1 !important;
    gap: 10px !important;
  }

  .signature-name {
    font-size: 10px !important;
    margin-bottom: 4px !important;
    min-height: 12px !important;
    line-height: 1.1 !important;
  }

  .signature-underline {
    margin-top: 2px !important;
  }

  /* Adjust borders for print */
  .border-corner {
    width: 45px !important;
    height: 45px !important;
    border-width: 2px !important;
  }

  .border-corner.top-left,
  .border-corner.top-right {
    top: 10px !important;
  }

  .border-corner.bottom-left,
  .border-corner.bottom-right {
    bottom: 10px !important;
  }

  .border-corner.top-left,
  .border-corner.bottom-left {
    left: 10px !important;
  }

  .border-corner.top-right,
  .border-corner.bottom-right {
    right: 10px !important;
  }

  .border-top,
  .border-bottom {
    left: 55px !important;
    right: 55px !important;
    height: 2px !important;
    top: 10px !important;
  }

  .border-bottom {
    bottom: 10px !important;
    top: auto !important;
  }

  .border-left,
  .border-right {
    top: 55px !important;
    bottom: 55px !important;
    width: 2px !important;
  }

  .border-left {
    left: 10px !important;
  }

  .border-right {
    right: 10px !important;
  }

  .no-print {
    display: none !important;
  }

  .certificate-actions {
    display: none;
  }

  @page {
    size: letter landscape;
    margin: 0;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .certificate-wrapper {
    padding: 30px 40px;
  }

  .certificate-title {
    font-size: 44px;
  }

  .couple-names {
    font-size: 36px;
  }

  .signatures-section {
    flex-direction: column;
    gap: 30px;
  }
}
</style>

