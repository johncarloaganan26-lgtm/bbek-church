<template>
  <div class="certificate-container">
    <div class="certificate-wrapper" id="child-dedication-certificate-print">
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
            <h3 class="subtitle">OF DEDICATION</h3>
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
                <span class="field-label">Phone Number:</span>
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
                <span class="field-label">Phone Number:</span>
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
                <span class="field-label">Phone Number:</span>
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
            <div class="admin-row">
              <div class="field-group">
                <span class="field-label">Status:</span>
                <span class="field-value status-badge">{{ status || '_________________' }}</span>
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
            <p class="cert-number">Certificate No.: {{ childId || certificateNumber }}</p>
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

.dedication-statement {
  text-align: center;
  font-size: 13px;
  color: #333;
  margin: 0 0 15px 0;
  font-family: 'Times New Roman', serif;
  font-style: italic;
}

/* Requested Section */
.requested-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.requested-section .label {
  font-size: 12px;
  color: #333;
  font-family: 'Times New Roman', serif;
}

.requested-section .value {
  font-size: 14px;
  font-weight: 600;
  color: #1a365d;
  font-family: 'Arial', sans-serif;
}

/* Field Styles */
.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #1a365d;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 10px;
  font-family: 'Arial', sans-serif;
}

.field-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-size: 11px;
  color: #333;
  font-family: 'Times New Roman', serif;
  white-space: nowrap;
}

.field-value {
  font-size: 12px;
  color: #1a365d;
  font-family: 'Arial', sans-serif;
  min-width: 100px;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
}

.status-badge {
  text-transform: capitalize;
  font-weight: 600;
}

/* Child Section */
.child-section {
  margin-bottom: 15px;
}

.child-row {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.child-row .field-group {
  flex: 1;
}

.child-row .field-label {
  min-width: auto;
}

.child-row .field-value {
  flex: 1;
}

/* Parent Section */
.parent-section {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f8f8;
  border-radius: 4px;
}

.parent-row {
  display: flex;
  gap: 20px;
  margin-bottom: 6px;
}

.parent-row .field-group {
  flex: 1;
}

.parent-row.full {
  flex-direction: column;
  gap: 4px;
}

.parent-row.full .field-label {
  min-width: auto;
}

.parent-row.full .field-value {
  width: 100%;
}

/* Sponsors Section */
.sponsors-section {
  margin-bottom: 15px;
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

.sponsor-item {
  display: flex;
  align-items: center;
}

.sponsor-name {
  font-size: 12px;
  color: #1a365d;
  font-family: 'Times New Roman', serif;
}

/* Contact Section */
.contact-section {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f8f8;
  border-radius: 4px;
}

.contact-row {
  display: flex;
  gap: 20px;
  margin-bottom: 6px;
}

.contact-row .field-group {
  flex: 1;
}

.contact-row.full {
  flex-direction: column;
  gap: 4px;
}

.contact-row.full .field-label {
  min-width: auto;
}

.contact-row.full .field-value {
  width: 100%;
}

/* Admin Section */
.admin-section {
  margin-bottom: 15px;
  padding: 10px;
  background: #f0f4f8;
  border-radius: 4px;
}

.admin-row {
  display: flex;
  gap: 20px;
  margin-bottom: 6px;
}

.admin-row .field-group {
  flex: 1;
}

.admin-row .field-label {
  min-width: auto;
}

.admin-row .field-value {
  flex: 1;
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

  .child-row,
  .parent-row,
  .contact-row,
  .admin-row {
    flex-direction: column;
    gap: 10px;
  }

  .sponsors-grid {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
