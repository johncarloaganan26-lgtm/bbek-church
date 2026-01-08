<template>
  <div class="certificate-container">
    <div class="certificate-wrapper" id="water-baptism-certificate-print">
      <!-- Outer Gold Border -->
      <div class="outer-border">
        <!-- Inner Cream Background -->
        <div class="inner-border">
          <!-- Watermark Logo Background -->
          <div class="watermark-logo">
            <img :src="effectiveLogo" alt="Church Logo Watermark" class="watermark-image" />
          </div>

          <!-- Corner Ornaments - Elaborate Design -->
          <div class="corner-design top-left">
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path d="M5 5 L25 5 L25 15 L15 15 L15 25 L5 25 Z" fill="none" stroke="#8b7355" stroke-width="2"/>
              <circle cx="8" cy="8" r="2" fill="#8b7355"/>
              <circle cx="17" cy="8" r="1.5" fill="#8b7355"/>
              <circle cx="8" cy="17" r="1.5" fill="#8b7355"/>
            </svg>
          </div>
          <div class="corner-design top-right">
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path d="M45 5 L25 5 L25 15 L35 15 L35 25 L45 25 Z" fill="none" stroke="#8b7355" stroke-width="2"/>
              <circle cx="42" cy="8" r="2" fill="#8b7355"/>
              <circle cx="33" cy="8" r="1.5" fill="#8b7355"/>
              <circle cx="42" cy="17" r="1.5" fill="#8b7355"/>
            </svg>
          </div>
          <div class="corner-design bottom-left">
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path d="M5 45 L25 45 L25 35 L15 35 L15 25 L5 25 Z" fill="none" stroke="#8b7355" stroke-width="2"/>
              <circle cx="8" cy="42" r="2" fill="#8b7355"/>
              <circle cx="17" cy="42" r="1.5" fill="#8b7355"/>
              <circle cx="8" cy="33" r="1.5" fill="#8b7355"/>
            </svg>
          </div>
          <div class="corner-design bottom-right">
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path d="M45 45 L25 45 L25 35 L35 35 L35 25 L45 25 Z" fill="none" stroke="#8b7355" stroke-width="2"/>
              <circle cx="42" cy="42" r="2" fill="#8b7355"/>
              <circle cx="33" cy="42" r="1.5" fill="#8b7355"/>
              <circle cx="42" cy="33" r="1.5" fill="#8b7355"/>
            </svg>
          </div>

          <!-- Church Header -->
          <div class="church-header">
            <div class="church-logo-area">
              <div class="logo-emblem">
                <img v-if="churchLogo || effectiveLogo" :src="churchLogo || effectiveLogo" alt="Church Logo" class="logo-image" />
                <div v-else class="emblem-cross">
                  <div class="cross-v"></div>
                  <div class="cross-h"></div>
                </div>
              </div>
              <div class="sec-text">S.E.C. REGISTERED</div>
            </div>
            <div class="church-info">
              <h1 class="church-name">BIBLE BAPTIST EKKLESIA</h1>
              <h2 class="church-subtitle">OF KAWIT</h2>
              <p class="church-address">485 Acacia St. Villa Ramirez, Tabon 1, Kawit Cavite</p>
            </div>
          </div>

          <!-- Certificate Title -->
          <div class="title-section">
            <div class="title-decoration left"></div>
            <div class="title-content">
              <h2 class="main-title">CERTIFICATE</h2>
              <h3 class="subtitle">OF BAPTISM</h3>
            </div>
            <div class="title-decoration right"></div>
          </div>

          <p class="baptism-statement">This is to certify that</p>

          <!-- Member Name -->
          <div class="member-name-section">
            <span class="member-name">{{ fullName }}</span>
          </div>

          <p class="baptism-detail">has been baptized in the name of the Father, and of the Son, and of the Holy Ghost</p>

          <!-- Personal Information - Two Column Layout -->
          <div class="personal-info-section">
            <div class="info-column left-column">
              <div class="info-field-row">
                <span class="label">Date of Baptism:</span>
                <span class="value">{{ formattedBaptismDate }}</span>
              </div>
              <div class="info-field-row">
                <span class="label">Baptism Location:</span>
                <span class="value">{{ location || '_________' }}</span>
              </div>
              <div class="info-field-row">
                <span class="label">Civil Status:</span>
                <span class="value">{{ civilStatus || '_______' }}</span>
              </div>
              <div class="info-field-row">
                <span class="label">Address:</span>
                <span class="value">{{ address || '________________________________' }}</span>
              </div>
              <div class="info-field-row">
                <span class="label">Phone:</span>
                <span class="value">{{ phoneNumber || '____________' }}</span>
              </div>
            </div>
            <div class="info-column right-column">
              <div class="info-field-row">
                <span class="label">Age:</span>
                <span class="value">{{ age || '__' }}</span>
              </div>
              <div class="info-field-row">
                <span class="label">Gender:</span>
                <span class="value">{{ formattedGender }}</span>
              </div>
              <div class="info-field-row">
                <span class="label">Birthdate:</span>
                <span class="value">{{ formattedBirthdate }}</span>
              </div>
           
              <div class="info-field-row">
                <span class="label">Email:</span>
                <span class="value">{{ email || '________________________' }}</span>
              </div>
              
            </div>
          </div>

          <!-- Guardian Information (if applicable) -->
          <div class="guardian-section" v-if="displayGuardianName">
            <div class="section-title">GUARDIAN INFORMATION</div>
            <div class="info-field-row">
              <span class="label">Guardian's Name:</span>
              <span class="value">{{ displayGuardianName }}</span>
            </div>
            <div class="info-field-row">
              <span class="label">Contact Number:</span>
              <span class="value">{{ displayGuardianContact || '_________________' }}</span>
            </div>
            <div class="info-field-row">
              <span class="label">Relationship:</span>
              <span class="value">{{ formattedGuardianRelationship }}</span>
            </div>
          </div>

          <!-- Minister Signature -->
          <div class="minister-section">
            <div class="minister-info">
              <p class="minister-name">{{ pastorName || 'Rev. Fresco Q. Sulapas' }}</p>
              <div class="signature-line"></div>
              <p class="signature-label">Church Pastor / Minister</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer-section">
            <div class="footer-left">
              <p class="cert-number">Certificate No.: {{ baptismId || certificateNumber }}</p>
            </div>
            <div class="footer-right">
              <p class="issue-date">Issued on: {{ formattedIssueDate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import axios from '@/api/axios'

// Props matching the API response from getAllWaterBaptisms
const props = defineProps({
  // From tbl_waterbaptism (wb.*)
  baptismId: { type: String, default: '' },
  memberId: { type: [String, Number], default: '' },
  baptismDate: { type: [String, Date], default: '' },
  location: { type: String, default: '' },
  pastorName: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  guardianName: { type: String, default: '' },
  guardianContact: { type: String, default: '' },
  guardianRelationship: { type: String, default: '' },
  dateCreated: { type: [String, Date], default: '' },
  
  // From tbl_members (joined via INNER JOIN)
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  middleName: { type: String, default: '' },
  fullname: { type: String, default: '' },
  birthdate: { type: [String, Date], default: '' },
  age: { type: [String, Number], default: '' },
  gender: { type: String, default: '' },
  address: { type: String, default: '' },
  email: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  civilStatus: { type: String, default: '' },
  position: { type: String, default: '' },
  
  // Member guardian fields (from tbl_members)
  memberGuardianName: { type: String, default: '' },
  memberGuardianContact: { type: String, default: '' },
  memberGuardianRelationship: { type: String, default: '' },
  
  // For certificate display
  certificateNumber: { type: String, default: '' },
  churchLogo: { type: String, default: '' }
})

const churchLogo = ref(props.churchLogo)

// Get effective logo (use public logo if CMS logo not available)
const effectiveLogo = computed(() => {
  return churchLogo.value || '/logobbek-watermark.jpg'
})

// Computed full name from API or individual fields
const fullName = computed(() => {
  if (props.fullname) return props.fullname
  const parts = []
  if (props.firstName) parts.push(props.firstName)
  if (props.middleName) parts.push(props.middleName)
  if (props.lastName) parts.push(props.lastName)
  return parts.length > 0 ? parts.join(' ') : '_________________'
})

// Format gender for display
const formattedGender = computed(() => {
  if (!props.gender) return '_________'
  const genderMap = {
    'M': 'Male',
    'm': 'Male',
    'F': 'Female',
    'f': 'Female',
    'Male': 'Male',
    'Female': 'Female'
  }
  return genderMap[props.gender] || props.gender
})

// Format birthdate for display
const formattedBirthdate = computed(() => {
  if (!props.birthdate) return '_________'
  try {
    const date = new Date(props.birthdate)
    if (isNaN(date.getTime())) return '_________'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '_________'
  }
})

// Format baptism date for display
const formattedBaptismDate = computed(() => {
  if (!props.baptismDate) return '_________'
  try {
    const date = new Date(props.baptismDate)
    if (isNaN(date.getTime())) return '_________'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '_________'
  }
})

// Issue date
const formattedIssueDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

// Guardian fields - fall back to member guardian data if baptism guardian fields are empty
const displayGuardianName = computed(() => {
  return props.guardianName || props.memberGuardianName || ''
})

const displayGuardianContact = computed(() => {
  return props.guardianContact || props.memberGuardianContact || ''
})

const displayGuardianRelationship = computed(() => {
  return props.guardianRelationship || props.memberGuardianRelationship || ''
})

// Format guardian relationship for display
const formattedGuardianRelationship = computed(() => {
  const relationship = displayGuardianRelationship.value
  if (!relationship) return '_________'
  const relationships = {
    'parent': 'Parent',
    'grandparent': 'Grandparent',
    'sibling': 'Sibling',
    'guardian': 'Guardian',
    'other': 'Other'
  }
  return relationships[relationship] || relationship
})

// Fetch header data from CMS
const fetchHeaderData = async () => {
  try {
    const response = await axios.get('/cms/header/full')
    if (response.data.success && response.data.data) {
      const { images } = response.data.data
      if (images?.logo) {
        churchLogo.value = images.logo
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching header data:', error)
    }
  }
}

onMounted(async () => {
  await fetchHeaderData()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Times+New+Roman:wght@400;600;700&display=swap');

.certificate-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #e8e0d0;
  padding: 20px;
}

.certificate-wrapper {
  width: 100%;
  max-width: 450px;
}

/* Outer Gold Border - Removed */
.outer-border {
  border: 3px solid #8b7355;
  padding: 3px;
  background: #d4c4a8;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 0 20px rgba(139, 119, 87, 0.1);
}

/* Inner Paper Background - Aged Paper Look */
.inner-border {
  background-color: #f3e6c4;
  background-image: 
    linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%),
    repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139, 115, 85, 0.02) 1px, rgba(139, 115, 85, 0.02) 2px),
    repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(139, 115, 85, 0.01) 1px, rgba(139, 115, 85, 0.01) 2px);
  padding: 20px 18px;
  border: 1px solid #8b7355;
  position: relative;
  box-shadow: 
    inset 0 0 30px rgba(139, 115, 85, 0.08),
    inset 0 0 60px rgba(139, 115, 85, 0.05);
}

/* Watermark Logo - Centered and Fitted */
.watermark-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 85%;
  height: 85%;
  opacity: 0.08;
  z-index: 0;
  pointer-events: none;
}

.watermark-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Corner Ornaments - Elaborate Design */
.corner-design {
  position: absolute;
  z-index: 2;
  opacity: 0.8;
}

.corner-design.top-left {
  top: 5px;
  left: 5px;
}

.corner-design.top-right {
  top: 5px;
  right: 5px;
}

.corner-design.bottom-left {
  bottom: 5px;
  left: 5px;
}

.corner-design.bottom-right {
  bottom: 5px;
  right: 5px;
}

/* Remove old corner-ornament styles */
.corner-ornament {
  display: none;
}

/* Decorative Stars */
.decor-star {
  display: none;
}

/* Header Section */
.church-header {
  text-align: center;
  margin-bottom: 12px;
  border-bottom: 2px solid #8b7355;
  padding-bottom: 10px;
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.church-logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-emblem {
  width: 50px;
  height: 50px;
  background: #fffef8;
  border: 2px solid #8b7355;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(139, 115, 85, 0.1);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.emblem-cross {
  position: relative;
  width: 25px;
  height: 25px;
}

.cross-v {
  position: absolute;
  width: 4px;
  height: 22px;
  background: #1a365d;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 2px;
}

.cross-h {
  position: absolute;
  width: 18px;
  height: 4px;
  background: #1a365d;
  top: 50%;
  transform: translateY(-50%);
  left: 3px;
  border-radius: 2px;
}

.sec-text {
  font-size: 7px;
  font-weight: 700;
  color: #8b7355;
  margin-top: 3px;
  letter-spacing: 1px;
  font-family: 'Times New Roman', serif;
}

.church-info {
  text-align: center;
}

.church-name {
  font-size: 15px;
  font-weight: 700;
  color: #2c1810;
  margin: 0;
  letter-spacing: 2px;
  font-family: 'Cinzel', serif;
}

.church-subtitle {
  font-size: 11px;
  font-weight: 600;
  color: #2c1810;
  margin: 0;
  letter-spacing: 4px;
  font-family: 'Cinzel', serif;
}

.church-address {
  font-size: 9px;
  color: #4a3728;
  margin: 4px 0 0 0;
  font-family: 'Times New Roman', serif;
}

/* Title Section */
.title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  position: relative;
  z-index: 3;
}

.title-content {
  text-align: center;
  padding: 0 15px;
}

.title-decoration {
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, transparent, #8b7355);
  position: relative;
}

.title-decoration.left {
  background: linear-gradient(to right, transparent, #8b7355);
}

.title-decoration.right {
  background: linear-gradient(to left, transparent, #8b7355);
}

.title-decoration::after {
  content: '❖';
  position: absolute;
  top: -8px;
  font-size: 12px;
  color: #8b7355;
}

.title-decoration.left::after {
  right: 0;
}

.title-decoration.right::after {
  left: 0;
}

.main-title {
  font-size: 22px;
  font-weight: 700;
  color: #2c1810;
  margin: 0;
  letter-spacing: 4px;
  font-family: 'Cinzel', serif;
}

.subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #2c1810;
  margin: 0;
  letter-spacing: 3px;
  font-family: 'Cinzel', serif;
}

.baptism-statement {
  text-align: center;
  font-size: 11px;
  color: #4a3728;
  margin: 10px 0 5px 0;
  font-family: 'Times New Roman', serif;
  position: relative;
  z-index: 3;
}

/* Member Name */
.member-name-section {
  text-align: center;
  margin-bottom: 6px;
  position: relative;
  z-index: 3;
}

.member-name {
  font-size: 18px;
  font-weight: 700;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
  display: inline-block;
  padding: 4px 20px;
  border-bottom: 2px solid #8b7355;
}

.baptism-detail {
  text-align: center;
  font-size: 11px;
  color: #4a3728;
  margin: 0 0 12px 0;
  font-family: 'Times New Roman', serif;
  position: relative;
  z-index: 3;
}

/* Personal Information - Two Column Layout */
.personal-info-section {
  margin-bottom: 10px;
  position: relative;
  z-index: 3;
  display: flex;
  gap: 20px;
}

.info-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.left-column {
  flex: 0 0 180px;
}

.right-column {
  flex: 1;
}

.info-column .info-field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.info-column .info-field-row:last-child {
  margin-bottom: 0;
}

.info-column .info-field-row .label {
  font-size: 11px;
  font-weight: 700;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
  white-space: nowrap;
}

.info-column .info-field-row .value {
  font-size: 11px;
  font-weight: 400;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
  text-align: left;
  flex: 1;
  border-bottom: 1px dotted #8b7355;
  min-width: 80px;
}

/* Guardian Section */
.guardian-section {
  margin-bottom: 10px;
  position: relative;
  z-index: 3;
}

.guardian-section .info-field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.guardian-section .info-field-row:last-child {
  margin-bottom: 0;
}

.guardian-section .info-field-row .label {
  font-size: 11px;
  font-weight: 700;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
  white-space: nowrap;
}

.guardian-section .info-field-row .value {
  font-size: 11px;
  font-weight: 400;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
  text-align: left;
  flex: 1;
  border-bottom: 1px dotted #8b7355;
  min-width: 80px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #2c1810;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  font-family: 'Times New Roman', serif;
  border-bottom: 1px solid #8b7355;
  padding-bottom: 4px;
  text-align: center;
}

/* Minister Section */
.minister-section {
  text-align: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #8b7355;
  position: relative;
  z-index: 3;
}

.minister-info {
  display: inline-block;
  text-align: center;
}

.minister-name {
  font-size: 12px;
  font-weight: 700;
  color: #2c1810;
  margin: 0 0 5px 0;
  font-family: 'Times New Roman', serif;
}

.signature-line {
  width: 140px;
  height: 1px;
  background: #4a3728;
  margin: 0 auto 3px auto;
}

.signature-label {
  font-size: 10px;
  color: #4a3728;
  margin: 0;
  font-family: 'Times New Roman', serif;
  text-transform: uppercase;
}

/* Footer Section */
.footer-section {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 8px;
  position: relative;
  z-index: 3;
}

.footer-left,
.footer-right {
  flex: 1;
}

.footer-right {
  text-align: right;
}

.cert-number,
.issue-date {
  font-size: 9px;
  color: #4a3728;
  margin: 0;
  font-family: 'Times New Roman', serif;
}

/* Print Styles - Full Page */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    background: white !important;
  }

  .certificate-container {
    width: 8.5in;
    min-height: 11in;
    padding: 0.25in;
    background: #e8e0d0 !important;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .certificate-wrapper {
    box-shadow: none;
    margin: 0;
    width: 100%;
    flex: 1;
  }

  .outer-border {
    border: 4px solid #8b7355 !important;
    padding: 4px !important;
    background: #d4c4a8 !important;
    height: calc(100% - 8px);
    box-sizing: border-box;
  }

  .inner-border {
    padding: 0.25in 0.35in !important;
    background-color: #f3e6c4 !important;
    background-image: none !important;
    box-shadow: none !important;
    border: 2px solid #8b7355 !important;
    height: calc(100% - 0.5in - 4px);
    box-sizing: border-box;
  }

  .watermark-logo {
    opacity: 0.08 !important;
    width: 70% !important;
    height: 70% !important;
  }

  .corner-design {
    opacity: 0.9 !important;
  }

  .corner-design svg {
    stroke: #8b7355 !important;
    width: 60px !important;
    height: 60px !important;
  }

  .corner-design svg circle {
    fill: #8b7355 !important;
  }

  .corner-design.top-left,
  .corner-design.top-right {
    top: 8px !important;
  }

  .corner-design.bottom-left,
  .corner-design.bottom-right {
    bottom: 8px !important;
  }

  .title-decoration {
    background: linear-gradient(to right, transparent, #8b7355) !important;
    width: 80px !important;
    height: 3px !important;
  }

  .title-decoration::after {
    color: #8b7355 !important;
    font-size: 18px !important;
    top: -14px !important;
  }

  .church-header {
    margin-bottom: 0.15in !important;
    border-bottom-width: 3px !important;
    padding-bottom: 0.1in !important;
    gap: 0.08in !important;
  }

  .logo-emblem {
    width: 80px !important;
    height: 80px !important;
    border-width: 3px !important;
  }

  .sec-text {
    font-size: 12px !important;
    margin-top: 4px !important;
  }

  .church-name {
    font-size: 28px !important;
    letter-spacing: 3px !important;
  }

  .church-subtitle {
    font-size: 18px !important;
    letter-spacing: 6px !important;
  }

  .church-address {
    font-size: 12px !important;
    margin-top: 6px !important;
  }

  .main-title {
    font-size: 36px !important;
    letter-spacing: 6px !important;
  }

  .subtitle {
    font-size: 22px !important;
    letter-spacing: 5px !important;
  }

  .title-content {
    padding: 0 0.3in !important;
  }

  .baptism-statement {
    font-size: 16px !important;
    margin: 0.1in 0 0.05in 0 !important;
  }

  .member-name {
    font-size: 32px !important;
    border-bottom-width: 3px !important;
    padding: 0.05in 0.3in !important;
  }

  .baptism-detail {
    font-size: 14px !important;
    margin: 0 0 0.15in 0 !important;
  }

  .personal-info-section {
    margin-bottom: 0.15in !important;
    gap: 0.3in !important;
  }

  .left-column {
    flex: 0 0 280px !important;
  }

  .info-field-row {
    margin-bottom: 0.08in !important;
    gap: 10px !important;
  }

  .info-field-row .label {
    font-size: 14px !important;
  }

  .info-field-row .value {
    font-size: 14px !important;
    min-width: 80px !important;
    border-bottom-width: 2px !important;
    padding-bottom: 2px !important;
  }

  .guardian-section {
    margin-bottom: 0.15in !important;
  }

  .section-title {
    font-size: 14px !important;
    margin-bottom: 0.08in !important;
    padding-bottom: 4px !important;
    border-bottom-width: 2px !important;
  }

  .minister-section {
    margin-top: 0.25in !important;
    padding-top: 0.15in !important;
    border-top-width: 2px !important;
  }

  .minister-name {
    font-size: 18px !important;
    margin-bottom: 8px !important;
  }

  .signature-line {
    width: 200px !important;
    margin-bottom: 6px !important;
  }

  .signature-label {
    font-size: 12px !important;
  }

  .footer-section {
    margin-top: 0.2in !important;
    padding-top: 0.1in !important;
  }

  .cert-number,
  .issue-date {
    font-size: 11px !important;
  }

  .no-print,
  .certificate-actions {
    display: none !important;
  }

  @page {
    size: letter portrait;
    margin: 0;
  }
}

/* Mobile Print - Force Grayscale */
@media print and (max-width: 768px) {
  .certificate-container {
    background: white !important;
    padding: 10px !important;
  }

  .outer-border {
    background: white !important;
    border: 2px solid black !important;
  }

  .inner-border {
    background-color: white !important;
    background-image: none !important;
    border: 1px solid black !important;
  }

  .watermark-logo {
    display: none !important;
  }

  .corner-design svg {
    stroke: black !important;
  }

  .corner-design svg circle {
    fill: black !important;
  }

  .title-decoration {
    background: linear-gradient(to right, transparent, black) !important;
  }

  .title-decoration::after {
    color: black !important;
  }

  .church-header {
    border-bottom-color: black !important;
  }

  .logo-emblem {
    border-color: black !important;
    background: white !important;
  }

  .sec-text {
    color: black !important;
  }

  .church-name, .church-subtitle, .church-address {
    color: black !important;
  }

  .main-title, .subtitle {
    color: black !important;
  }

  .baptism-statement, .baptism-detail {
    color: black !important;
  }

  .member-name {
    color: black !important;
    border-bottom-color: black !important;
  }

  .info-field-row .label {
    color: black !important;
  }

  .info-field-row .value {
    color: black !important;
    border-bottom-color: black !important;
  }

  .section-title {
    color: black !important;
    border-bottom-color: black !important;
  }

  .minister-section {
    border-top-color: black !important;
  }

  .minister-name {
    color: black !important;
  }

  .signature-line {
    background: black !important;
  }

  .signature-label {
    color: black !important;
  }

  .cert-number, .issue-date {
    color: black !important;
  }
}

/* Responsive */
@media (max-width: 480px) {
  .member-name {
    font-size: 16px;
  }

  .main-title {
    font-size: 18px;
  }

  .subtitle {
    font-size: 12px;
  }

  .personal-info-section {
    flex-direction: column;
    gap: 10px;
  }

  .info-column {
    width: 100%;
  }

  .left-column,
  .right-column {
    flex: 1;
  }

  .info-column .info-field-row {
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
  }

  .outer-border {
    border-width: 2px !important;
    padding: 2px !important;
  }

  .inner-border {
    padding: 15px !important;
  }
}
</style>
