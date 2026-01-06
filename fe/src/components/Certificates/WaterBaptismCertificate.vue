<template>
  <div class="certificate-container">
    <div class="certificate-wrapper" id="water-baptism-certificate-print">
      <!-- Outer Border -->
      <div class="outer-border">
        <div class="inner-border">
          <!-- Header Section -->
          <div class="header-section">
            <div class="church-header">
              <div class="church-logo-area">
                <div class="logo-emblem">
                  <img v-if="churchLogo" :src="churchLogo" alt="Church Logo" class="logo-image" />
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
          </div>

          <!-- Certificate Title -->
          <div class="title-section">
            <h2 class="main-title">CERTIFICATE</h2>
            <h3 class="subtitle">OF BAPTISM</h3>
          </div>

          <p class="baptism-statement">This is to certify that</p>

          <!-- Member Name -->
          <div class="member-name-section">
            <span class="member-name">{{ fullName }}</span>
          </div>

          <p class="baptism-detail">Has been baptized in the name of the Father, and of the Son, and of the Holy Ghost</p>

          <!-- Personal Information -->
          <div class="personal-info-section">
            <div class="info-row">
              <div class="info-field">
                <span class="label">Age:</span>
                <span class="value">{{ age || '_________________' }}</span>
              </div>
              <div class="info-field">
                <span class="label">Gender:</span>
                <span class="value">{{ formattedGender }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-field">
                <span class="label">Birthdate:</span>
                <span class="value">{{ formattedBirthdate }}</span>
              </div>
              <div class="info-field">
                <span class="label">Civil Status:</span>
                <span class="value">{{ civilStatus || '_________________' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-field info-full">
                <span class="label">Address:</span>
                <span class="value">{{ address || '_________________' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-field">
                <span class="label">Email:</span>
                <span class="value">{{ email || '_________________' }}</span>
              </div>
              <div class="info-field">
                <span class="label">Phone:</span>
                <span class="value">{{ phoneNumber || '_________________' }}</span>
              </div>
            </div>
            <div class="info-row" v-if="position">
              <div class="info-field info-full">
                <span class="label">Position:</span>
                <span class="value">{{ position }}</span>
              </div>
            </div>
          </div>

          <!-- Baptism Details -->
          <div class="baptism-details-section">
            <div class="baptism-row">
              <div class="field-group">
                <span class="field-label">Date of Baptism:</span>
                <span class="field-value">{{ formattedBaptismDate }}</span>
              </div>
            </div>
            <div class="baptism-row">
              <div class="field-group">
                <span class="field-label">Baptism Location:</span>
                <span class="field-value">{{ location || '_________________' }}</span>
              </div>
            </div>
            <div class="baptism-row">
              <div class="field-group">
                <span class="field-label">Minister:</span>
                <span class="field-value">{{ pastorName || '_________________' }}</span>
              </div>
            </div>
          </div>

          <!-- Guardian Information (if applicable) -->
          <div class="guardian-section" v-if="displayGuardianName">
            <div class="section-title">GUARDIAN INFORMATION</div>
            <div class="guardian-row">
              <div class="field-group">
                <span class="field-label">Guardian's Name:</span>
                <span class="field-value">{{ displayGuardianName }}</span>
              </div>
            </div>
            <div class="guardian-row">
              <div class="field-group">
                <span class="field-label">Contact Number:</span>
                <span class="field-value">{{ displayGuardianContact || '_________________' }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Relationship:</span>
                <span class="field-value">{{ formattedGuardianRelationship }}</span>
              </div>
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
            <p class="cert-number">Certificate No.: {{ baptismId || certificateNumber }}</p>
            <p class="issue-date">Issued on: {{ formattedIssueDate }}</p>
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
  civilStatus: { type: String, default: '' }, // civil_status from API mapped to camelCase
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
  if (!props.gender) return '_________________'
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
  if (!props.birthdate) return '_________________'
  try {
    const date = new Date(props.birthdate)
    if (isNaN(date.getTime())) return '_________________'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '_________________'
  }
})

// Format baptism date for display
const formattedBaptismDate = computed(() => {
  if (!props.baptismDate) return '_________________'
  try {
    const date = new Date(props.baptismDate)
    if (isNaN(date.getTime())) return '_________________'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '_________________'
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
  if (!relationship) return '_________________'
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
.certificate-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.certificate-wrapper {
  width: 100%;
  max-width: 8.5in;
  background: #fff;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.outer-border {
  border: 8px solid #1a365d;
  padding: 8px;
  margin: 8px;
}

.inner-border {
  border: 3px solid #d4af37;
  padding: 25px 35px;
  background: #fffef8;
}

/* Header Section */
.header-section {
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #d4af37;
  padding-bottom: 15px;
}

.church-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 25px;
}

.church-logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-emblem {
  width: 70px;
  height: 70px;
  background: #fff;
  border: 3px solid #1a365d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.emblem-cross {
  position: relative;
  width: 35px;
  height: 35px;
}

.cross-v {
  position: absolute;
  width: 6px;
  height: 32px;
  background: #1a365d;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 2px;
}

.cross-h {
  position: absolute;
  width: 28px;
  height: 6px;
  background: #1a365d;
  top: 50%;
  transform: translateY(-50%);
  left: 3.5px;
  border-radius: 2px;
}

.sec-text {
  font-size: 8px;
  font-weight: 600;
  color: #1a365d;
  margin-top: 4px;
  letter-spacing: 1px;
}

.church-info {
  text-align: left;
}

.church-name {
  font-size: 18px;
  font-weight: 800;
  color: #1a365d;
  margin: 0;
  letter-spacing: 2px;
  font-family: 'Georgia', serif;
}

.church-subtitle {
  font-size: 14px;
  font-weight: 700;
  color: #1a365d;
  margin: 0;
  letter-spacing: 4px;
  font-family: 'Georgia', serif;
}

.church-address {
  font-size: 11px;
  color: #333;
  margin: 6px 0 0 0;
  font-family: 'Arial', sans-serif;
}

/* Title Section */
.title-section {
  text-align: center;
  margin-bottom: 5px;
}

.main-title {
  font-size: 32px;
  font-weight: 800;
  color: #1a365d;
  margin: 0;
  letter-spacing: 6px;
  font-family: 'Georgia', serif;
}

.subtitle {
  font-size: 20px;
  font-weight: 600;
  color: #1a365d;
  margin: 0;
  letter-spacing: 4px;
  font-family: 'Georgia', serif;
}

.baptism-statement {
  text-align: center;
  font-size: 13px;
  color: #333;
  margin: 0 0 10px 0;
  font-family: 'Times New Roman', serif;
}

/* Member Name */
.member-name-section {
  text-align: center;
  margin-bottom: 10px;
}

.member-name {
  font-size: 28px;
  font-weight: 700;
  color: #1a365d;
  font-family: 'Georgia', serif;
  display: inline-block;
  padding: 5px 20px;
  border-bottom: 2px solid #d4af37;
}

.baptism-detail {
  text-align: center;
  font-size: 13px;
  color: #333;
  margin: 0 0 15px 0;
  font-family: 'Times New Roman', serif;
}

/* Personal Information */
.personal-info-section {
  margin-bottom: 15px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-field.info-full {
  flex: 1;
  width: 100%;
}

.info-field.info-full .value {
  flex: 1;
  min-width: 200px;
}

.info-field .label {
  font-size: 12px;
  color: #333;
  font-family: 'Times New Roman', serif;
  white-space: nowrap;
}

.info-field .value {
  font-size: 12px;
  font-weight: 600;
  color: #1a365d;
  font-family: 'Arial', sans-serif;
  min-width: 80px;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
}

/* Baptism Details */
.baptism-details-section {
  margin-bottom: 15px;
  padding: 12px;
  background: #f0f4f8;
  border-radius: 4px;
}

.baptism-row {
  margin-bottom: 10px;
}

.baptism-row:last-child {
  margin-bottom: 0;
}

.field-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field-label {
  font-size: 12px;
  color: #333;
  font-family: 'Times New Roman', serif;
  white-space: nowrap;
}

.field-value {
  font-size: 12px;
  font-weight: 600;
  color: #1a365d;
  font-family: 'Arial', sans-serif;
  flex: 1;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
}

/* Guardian Section */
.guardian-section {
  margin-bottom: 15px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 4px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #1a365d;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 10px;
  font-family: 'Arial', sans-serif;
}

.guardian-row {
  margin-bottom: 8px;
}

.guardian-row:last-child {
  margin-bottom: 0;
}

/* Minister Section */
.minister-section {
  text-align: right;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.minister-info {
  display: inline-block;
  text-align: center;
}

.minister-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a365d;
  margin: 0 0 8px 0;
  font-family: 'Georgia', serif;
}

.signature-line {
  width: 180px;
  height: 2px;
  background: #333;
  margin: 0 auto 5px auto;
}

.signature-label {
  font-size: 11px;
  color: #333;
  margin: 0;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
}

/* Footer Section */
.footer-section {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #d4af37;
}

.cert-number,
.issue-date {
  font-size: 10px;
  color: #666;
  margin: 0;
  font-family: 'Arial', sans-serif;
}

/* Print Button */
.certificate-actions {
  margin-top: 20px;
}

.print-btn {
  padding: 12px 24px;
  background: #1a365d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.print-btn:hover {
  background: #1e4a7a;
}

/* Print Styles */
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
  }

  .outer-border {
    border-width: 4px !important;
    padding: 4px !important;
    margin: 0 !important;
  }

  .inner-border {
    padding: 15px 20px !important;
    border-width: 2px !important;
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

/* Responsive */
@media (max-width: 768px) {
  .church-header {
    flex-direction: column;
    gap: 15px;
  }

  .church-info {
    text-align: center;
  }

  .info-row {
    flex-direction: column;
    gap: 10px;
  }

  .member-name {
    font-size: 22px;
  }
}
</style>
