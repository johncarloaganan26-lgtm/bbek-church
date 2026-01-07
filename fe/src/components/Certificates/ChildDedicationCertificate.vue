<template>
  <div class="certificate-container">
    <div class="certificate-wrapper" id="child-dedication-certificate-print">
      <!-- Outer Gold Border -->
      <div class="outer-border">
        <!-- Inner Cream Background -->
        <div class="inner-border">
          <!-- Watermark Logo Background -->
          <div class="watermark-logo">
            <img :src="effectiveLogo" alt="Church Logo Watermark" class="watermark-image" />
          </div>

          <!-- Corner Ornaments -->
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
              <h3 class="subtitle">OF DEDICATION</h3>
            </div>
            <div class="title-decoration right"></div>
          </div>

          <p class="dedication-statement">This day we dedicate to the Lord Jesus Christ</p>

          <!-- Requested By -->
          <div class="requested-section">
            <span class="label">Requested By:</span>
            <span class="value">{{ requesterFullname || requesterName || '_________________' }}</span>
          </div>

          <!-- Child Information -->
          <div class="child-section">
            <div class="child-row">
              <div class="field-group">
                <span class="field-label">Child's First Name:</span>
                <span class="field-value">{{ childFirstName || '_________________' }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Child's Last Name:</span>
                <span class="field-value">{{ childLastName || '_________________' }}</span>
              </div>
            </div>
            <div class="child-row">
              <div class="field-group">
                <span class="field-label">Child's Middle Name:</span>
                <span class="field-value">{{ childMiddleName || '_________________' }}</span>
              </div>
            </div>
            <div class="child-row">
              <div class="field-group">
                <span class="field-label">Date of Birth:</span>
                <span class="field-value">{{ formattedBirthDate }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Place of Birth:</span>
                <span class="field-value">{{ placeOfBirth || '_________________' }}</span>
              </div>
            </div>
            <div class="child-row">
              <div class="field-group">
                <span class="field-label">Gender:</span>
                <span class="field-value">{{ formattedGender }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Preferred Dedication Date:</span>
                <span class="field-value">{{ formattedDedicationDate }}</span>
              </div>
            </div>
          </div>

          <!-- Father's Information -->
          <div class="parent-section" v-if="fatherFirstName || fatherLastName">
            <div class="section-title">Father's Information</div>
            <div class="parent-row">
              <div class="field-group">
                <span class="field-label">First Name:</span>
                <span class="field-value">{{ fatherFirstName || '_________________' }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Last Name:</span>
                <span class="field-value">{{ fatherLastName || '_________________' }}</span>
              </div>
            </div>
            <div class="parent-row">
              <div class="field-group">
                <span class="field-label">Middle Name:</span>
                <span class="field-value">{{ fatherMiddleName || '_________________' }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Phone:</span>
                <span class="field-value">{{ fatherPhoneNumber || '_________________' }}</span>
              </div>
            </div>
            <div class="parent-row">
              <div class="field-group">
                <span class="field-label">Email:</span>
                <span class="field-value">{{ fatherEmail || '_________________' }}</span>
              </div>
            </div>
            <div class="parent-row full">
              <span class="field-label">Address:</span>
              <span class="field-value">{{ fatherAddress || '_________________' }}</span>
            </div>
          </div>

          <!-- Mother's Information -->
          <div class="parent-section" v-if="motherFirstName || motherLastName">
            <div class="section-title">Mother's Information</div>
            <div class="parent-row">
              <div class="field-group">
                <span class="field-label">First Name:</span>
                <span class="field-value">{{ motherFirstName || '_________________' }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Last Name:</span>
                <span class="field-value">{{ motherLastName || '_________________' }}</span>
              </div>
            </div>
            <div class="parent-row">
              <div class="field-group">
                <span class="field-label">Middle Name:</span>
                <span class="field-value">{{ motherMiddleName || '_________________' }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Phone:</span>
                <span class="field-value">{{ motherPhoneNumber || '_________________' }}</span>
              </div>
            </div>
            <div class="parent-row">
              <div class="field-group">
                <span class="field-label">Email:</span>
                <span class="field-value">{{ motherEmail || '_________________' }}</span>
              </div>
            </div>
            <div class="parent-row full">
              <span class="field-label">Address:</span>
              <span class="field-value">{{ motherAddress || '_________________' }}</span>
            </div>
          </div>

          <!-- Sponsors Section -->
          <div class="sponsors-section" v-if="sponsors && sponsors.length > 0">
            <div class="section-title">SPONSORS</div>
            <div class="sponsors-grid">
              <div class="sponsor-column">
                <div v-for="(sponsor, index) in leftSponsors" :key="index" class="sponsor-item">
                  <span class="sponsor-name">{{ sponsor.firstname }} {{ sponsor.lastname }}</span>
                </div>
              </div>
              <div class="sponsor-column">
                <div v-for="(sponsor, index) in rightSponsors" :key="index" class="sponsor-item">
                  <span class="sponsor-name">{{ sponsor.firstname }} {{ sponsor.lastname }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Details -->
          <div class="contact-section">
            <div class="section-title">Contact Details</div>
            <div class="contact-row">
              <div class="field-group">
                <span class="field-label">Phone:</span>
                <span class="field-value">{{ contactPhoneNumber || '_________________' }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Email:</span>
                <span class="field-value">{{ contactEmail || '_________________' }}</span>
              </div>
            </div>
            <div class="contact-row full">
              <span class="field-label">Address:</span>
              <span class="field-value">{{ contactAddress || '_________________' }}</span>
            </div>
          </div>

          <!-- Pastor and Location -->
          <div class="admin-section">
            <div class="admin-row">
              <div class="field-group">
                <span class="field-label">Pastor:</span>
                <span class="field-value">{{ pastor || pastorName || '_________________' }}</span>
              </div>
              <div class="field-group">
                <span class="field-label">Location:</span>
                <span class="field-value">{{ location || dedicationLocation || '_________________' }}</span>
              </div>
            </div>
          </div>

          <!-- Minister Signature -->
          <div class="minister-section">
            <div class="minister-info">
              <p class="minister-name">{{ pastor || pastorName || 'Rev. Fresco Q. Sulapas' }}</p>
              <div class="signature-line"></div>
              <p class="signature-label">Church Pastor / Minister</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer-section">
            <div class="footer-left">
              <p class="cert-number">Certificate No.: {{ childId || certificateNumber }}</p>
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

// Props matching the API response from getAllChildDedications
const props = defineProps({
  // From tbl_childdedications
  childId: { type: String, default: '' },
  requestedBy: { type: [String, Number], default: '' },
  childFirstName: { type: String, default: '' },
  childMiddleName: { type: String, default: '' },
  childLastName: { type: String, default: '' },
  dateOfBirth: { type: [String, Date], default: '' },
  placeOfBirth: { type: String, default: '' },
  gender: { type: String, default: '' },
  preferredDedicationDate: { type: [String, Date], default: '' },
  contactPhoneNumber: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactAddress: { type: String, default: '' },
  fatherFirstName: { type: String, default: '' },
  fatherLastName: { type: String, default: '' },
  fatherMiddleName: { type: String, default: '' },
  fatherPhoneNumber: { type: String, default: '' },
  fatherEmail: { type: String, default: '' },
  fatherAddress: { type: String, default: '' },
  motherFirstName: { type: String, default: '' },
  motherLastName: { type: String, default: '' },
  motherMiddleName: { type: String, default: '' },
  motherPhoneNumber: { type: String, default: '' },
  motherEmail: { type: String, default: '' },
  motherAddress: { type: String, default: '' },
  sponsors: { type: Array, default: () => [] },
  pastor: { type: String, default: '' },
  location: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  dateCreated: { type: [String, Date], default: '' },
  
  // From tbl_members (joined via INNER JOIN as requester_*)
  requesterFirstname: { type: String, default: '' },
  requesterLastname: { type: String, default: '' },
  requesterMiddleName: { type: String, default: '' },
  requesterFullname: { type: String, default: '' },
  requesterGender: { type: String, default: '' },
  
  // Computed full name from API
  childFullname: { type: String, default: '' },
  fatherFullname: { type: String, default: '' },
  motherFullname: { type: String, default: '' },
  
  // For certificate display
  certificateNumber: { type: String, default: '' },
  churchLogo: { type: String, default: '' },
  pastorName: { type: String, default: '' },
  dedicationLocation: { type: String, default: '' }
})

const churchLogo = ref(props.churchLogo)

// Get effective logo (use public logo if CMS logo not available)
const effectiveLogo = computed(() => {
  return churchLogo.value || '/logobbek-watermark.jpg'
})

// Format birthdate for display
const formattedBirthDate = computed(() => {
  if (!props.dateOfBirth) return '_________________'
  try {
    const date = new Date(props.dateOfBirth)
    if (isNaN(date.getTime())) return '_________________'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '_________________'
  }
})

// Format dedication date for display
const formattedDedicationDate = computed(() => {
  if (!props.preferredDedicationDate) return '_________________'
  try {
    const date = new Date(props.preferredDedicationDate)
    if (isNaN(date.getTime())) return '_________________'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '_________________'
  }
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

// Requester name from API or individual fields
const requesterName = computed(() => {
  if (props.requesterFullname) return props.requesterFullname
  const parts = []
  if (props.requesterFirstname) parts.push(props.requesterFirstname)
  if (props.requesterMiddleName) parts.push(props.requesterMiddleName)
  if (props.requesterLastname) parts.push(props.requesterLastname)
  return parts.length > 0 ? parts.join(' ') : ''
})

// Issue date
const formattedIssueDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

// Split sponsors into two columns
const leftSponsors = computed(() => {
  const sponsors = props.sponsors || []
  const midpoint = Math.ceil(sponsors.length / 2)
  return sponsors.slice(0, midpoint)
})

const rightSponsors = computed(() => {
  const sponsors = props.sponsors || []
  const midpoint = Math.ceil(sponsors.length / 2)
  return sponsors.slice(midpoint)
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

.outer-border {
  border: 3px solid #8b7355;
  padding: 3px;
  background: #d4c4a8;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 0 20px rgba(139, 115, 87, 0.1);
}

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

.corner-design {
  position: absolute;
  z-index: 2;
  opacity: 0.8;
}

.corner-design.top-left { top: 5px; left: 5px; }
.corner-design.top-right { top: 5px; right: 5px; }
.corner-design.bottom-left { bottom: 5px; left: 5px; }
.corner-design.bottom-right { bottom: 5px; right: 5px; }

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

.church-info { text-align: center; }

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

.title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  position: relative;
  z-index: 3;
}

.title-content { text-align: center; padding: 0 15px; }

.title-decoration {
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, transparent, #8b7355);
  position: relative;
}

.title-decoration::after {
  content: '❖';
  position: absolute;
  top: -8px;
  font-size: 12px;
  color: #8b7355;
}

.title-decoration.left::after { right: 0; }
.title-decoration.right::after { left: 0; }

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

.dedication-statement {
  text-align: center;
  font-size: 11px;
  color: #4a3728;
  margin: 10px 0 15px 0;
  font-family: 'Times New Roman', serif;
  position: relative;
  z-index: 3;
  font-style: italic;
}

.requested-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #8b7355;
  position: relative;
  z-index: 3;
}

.requested-section .label {
  font-size: 11px;
  font-weight: 700;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
}

.requested-section .value {
  font-size: 14px;
  font-weight: 600;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
  border-bottom: 1px dotted #8b7355;
  padding-bottom: 2px;
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
}

.field-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-size: 11px;
  font-weight: 700;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
  white-space: nowrap;
}

.field-value {
  font-size: 11px;
  font-weight: 400;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
  min-width: 80px;
  border-bottom: 1px dotted #8b7355;
  padding-bottom: 2px;
}

.child-section {
  margin-bottom: 15px;
  position: relative;
  z-index: 3;
}

.child-row {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.child-row .field-group { flex: 1; }

.parent-section {
  margin-bottom: 15px;
  position: relative;
  z-index: 3;
}

.parent-row {
  display: flex;
  gap: 20px;
  margin-bottom: 6px;
}

.parent-row .field-group { flex: 1; }

.parent-row.full {
  flex-direction: column;
  gap: 4px;
}

.parent-row.full .field-label { min-width: auto; }
.parent-row.full .field-value { width: 100%; }

.sponsors-section {
  margin-bottom: 15px;
  position: relative;
  z-index: 3;
}

.sponsors-grid {
  display: flex;
  justify-content: flex-start;
  gap: 60px;
}

.sponsor-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sponsor-item { display: flex; align-items: center; }

.sponsor-name {
  font-size: 12px;
  color: #2c1810;
  font-family: 'Times New Roman', serif;
}

.contact-section {
  margin-bottom: 15px;
  position: relative;
  z-index: 3;
}

.contact-row {
  display: flex;
  gap: 20px;
  margin-bottom: 6px;
}

.contact-row .field-group { flex: 1; }

.contact-row.full {
  flex-direction: column;
  gap: 4px;
}

.contact-row.full .field-label { min-width: auto; }
.contact-row.full .field-value { width: 100%; }

.admin-section {
  margin-bottom: 15px;
  position: relative;
  z-index: 3;
}

.admin-row {
  display: flex;
  gap: 20px;
  margin-bottom: 6px;
}

.admin-row .field-group { flex: 1; }

.minister-section {
  text-align: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #8b7355;
  position: relative;
  z-index: 3;
}

.minister-info { display: inline-block; text-align: center; }

.minister-name {
  font-size: 14px;
  font-weight: 700;
  color: #2c1810;
  margin: 0 0 8px 0;
  font-family: 'Times New Roman', serif;
}

.signature-line {
  width: 180px;
  height: 1px;
  background: #4a3728;
  margin: 0 auto 5px auto;
}

.signature-label {
  font-size: 10px;
  color: #4a3728;
  margin: 0;
  font-family: 'Times New Roman', serif;
  text-transform: uppercase;
}

.footer-section {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #8b7355;
  position: relative;
  z-index: 3;
}

.footer-left, .footer-right { flex: 1; }
.footer-right { text-align: right; }

.cert-number,
.issue-date {
  font-size: 9px;
  color: #4a3728;
  margin: 0;
  font-family: 'Times New Roman', serif;
}

/* Print Styles - Compact for One Page */
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
    padding: 0.15in;
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
    border: 3px solid #8b7355 !important;
    padding: 3px !important;
    background: #d4c4a8 !important;
    height: calc(100% - 6px);
    box-sizing: border-box;
  }

  .inner-border {
    padding: 0.12in 0.2in !important;
    background-color: #f3e6c4 !important;
    background-image: none !important;
    box-shadow: none !important;
    border: 2px solid #8b7355 !important;
    height: calc(100% - 0.24in - 6px);
    box-sizing: border-box;
  }

  .watermark-logo {
    opacity: 0.08 !important;
    width: 70% !important;
    height: 70% !important;
  }

  .corner-design { opacity: 0.9 !important; }

  .corner-design svg {
    stroke: #8b7355 !important;
    width: 50px !important;
    height: 50px !important;
  }

  .corner-design svg circle { fill: #8b7355 !important; }

  .corner-design.top-left,
  .corner-design.top-right { top: 5px !important; }

  .corner-design.bottom-left,
  .corner-design.bottom-right { bottom: 5px !important; }

  .title-decoration {
    background: linear-gradient(to right, transparent, #8b7355) !important;
    width: 60px !important;
    height: 2px !important;
  }

  .title-decoration::after {
    color: #8b7355 !important;
    font-size: 16px !important;
    top: -12px !important;
  }

  .church-header {
    margin-bottom: 0.1in !important;
    border-bottom-width: 2px !important;
    padding-bottom: 0.06in !important;
    gap: 0.04in !important;
  }

  .logo-emblem {
    width: 55px !important;
    height: 55px !important;
    border-width: 2px !important;
  }

  .sec-text { font-size: 10px !important; margin-top: 2px !important; }

  .church-name { font-size: 20px !important; letter-spacing: 2px !important; }
  .church-subtitle { font-size: 13px !important; letter-spacing: 4px !important; }
  .church-address { font-size: 10px !important; margin-top: 4px !important; }

  .main-title { font-size: 26px !important; letter-spacing: 4px !important; }
  .subtitle { font-size: 16px !important; letter-spacing: 3px !important; }
  .title-content { padding: 0 0.15in !important; }

  .dedication-statement {
    font-size: 13px !important;
    margin: 0.06in 0 0.1in 0 !important;
  }

  .requested-section {
    margin-bottom: 0.1in !important;
    padding-bottom: 0.06in !important;
  }

  .requested-section .label { font-size: 11px !important; }
  .requested-section .value { font-size: 13px !important; }

  .section-title { font-size: 11px !important; margin-bottom: 0.05in !important; padding-bottom: 3px !important; border-bottom-width: 1px !important; }

  .field-label { font-size: 10px !important; }
  .field-value { font-size: 10px !important; min-width: 60px !important; border-bottom-width: 1px !important; padding-bottom: 1px !important; }

  .child-section { margin-bottom: 0.1in !important; }
  .child-row { margin-bottom: 0.05in !important; gap: 0.15in !important; }

  .parent-section { margin-bottom: 0.1in !important; }
  .parent-row { margin-bottom: 0.04in !important; gap: 0.15in !important; }

  .sponsors-section { margin-bottom: 0.1in !important; }
  .sponsors-grid { gap: 0.8in !important; }
  .sponsor-name { font-size: 11px !important; }

  .contact-section { margin-bottom: 0.08in !important; }
  .contact-row { margin-bottom: 0.04in !important; gap: 0.15in !important; }

  .admin-section { margin-bottom: 0.08in !important; }
  .admin-row { margin-bottom: 0.04in !important; gap: 0.15in !important; }

  .minister-section {
    margin-top: 0.15in !important;
    padding-top: 0.1in !important;
    border-top-width: 1px !important;
  }

  .minister-name { font-size: 14px !important; margin-bottom: 6px !important; }
  .signature-line { width: 150px !important; margin-bottom: 4px !important; }
  .signature-label { font-size: 10px !important; }

  .footer-section {
    margin-top: 0.15in !important;
    padding-top: 0.08in !important;
  }

  .cert-number, .issue-date { font-size: 9px !important; }

  .no-print, .certificate-actions { display: none !important; }

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
  .church-info { text-align: center; }
  .child-row, .parent-row, .contact-row, .admin-row {
    flex-direction: column;
    gap: 10px;
  }
  .sponsors-grid { flex-direction: column; gap: 15px; }
}
</style>
