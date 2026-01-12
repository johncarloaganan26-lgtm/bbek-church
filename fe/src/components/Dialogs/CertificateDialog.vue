<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="`${getCertificateTitle()} Certificate`"
    width="90%"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    :show-close="true"
    class="certificate-dialog"
    @close="handleClose"
    fullscreen
  >
    <div class="certificate-dialog-content">
      <!-- Marriage Certificate -->
      <MarriageCertificate
        v-if="certificateType === 'marriage' && certificateData"
        :groom-name="getGroomDisplayName(certificateData.service)"
        :bride-name="getBrideDisplayName(certificateData.service)"
        :marriage-date="certificateData.service?.marriage_date || ''"
        :marriage-location="certificateData.service?.location || ''"
        :sponsors="marriageSponsors"
        :minister-name="certificateData.service?.pastor_fullname || 'Rev. Fresco Q. Sulapas'"
      />

      <!-- Death Certificate -->
      <DeathCertificate
        v-else-if="certificateType === 'burial' && certificateData"
        :deceased-name="certificateData.service?.deceased_name || ''"
        :birth-date="certificateData.service?.deceased_birthdate || ''"
        :death-date="certificateData.service?.date_death || ''"
        :age-at-death="String(calculateAge(certificateData.service?.deceased_birthdate, certificateData.service?.date_death))"
        :place-of-death="certificateData.service?.location || ''"
        :address="certificateData.service?.member_address || ''"
        :burial-date="certificateData.service?.service_date || ''"
        :burial-location="certificateData.service?.location || ''"
        :next-of-kin="certificateData.service?.member_fullname || ''"
        :relationship="certificateData.service?.relationship || ''"
        :witness-name="certificateData.service?.member_fullname || ''"
        :minister-name="certificateData.service?.pastor_fullname || 'Rev. Fresco Q. Sulapas'"
      />

      <!-- Child Dedication Certificate -->
      <ChildDedicationCertificate
        v-else-if="certificateType === 'child_dedication' && certificateData"
        :child-id="certificateData.service?.child_id || ''"
        :requested-by="certificateData.service?.requested_by || ''"
        :requester-fullname="certificateData.service?.requester_fullname || ''"
        :requester-firstname="certificateData.service?.requester_firstname || ''"
        :requester-lastname="certificateData.service?.requester_lastname || ''"
        :requester-middle-name="certificateData.service?.requester_middle_name || ''"
        :child-first-name="certificateData.service?.child_firstname || ''"
        :child-middle-name="certificateData.service?.child_middle_name || ''"
        :child-last-name="certificateData.service?.child_lastname || ''"
        :date-of-birth="certificateData.service?.date_of_birth || ''"
        :place-of-birth="certificateData.service?.place_of_birth || ''"
        :gender="certificateData.service?.gender || ''"
        :preferred-dedication-date="certificateData.service?.preferred_dedication_date || ''"
        :preferred-dedication-time="certificateData.service?.preferred_dedication_time || ''"
        :contact-phone-number="certificateData.service?.contact_phone_number || ''"
        :contact-email="certificateData.service?.contact_email || ''"
        :contact-address="certificateData.service?.contact_address || ''"
        :father-first-name="certificateData.service?.father_firstname || ''"
        :father-last-name="certificateData.service?.father_lastname || ''"
        :father-middle-name="certificateData.service?.father_middle_name || ''"
        :father-phone-number="certificateData.service?.father_phone_number || ''"
        :father-email="certificateData.service?.father_email || ''"
        :father-address="certificateData.service?.father_address || ''"
        :mother-first-name="certificateData.service?.mother_firstname || ''"
        :mother-last-name="certificateData.service?.mother_lastname || ''"
        :mother-middle-name="certificateData.service?.mother_middle_name || ''"
        :mother-phone-number="certificateData.service?.mother_phone_number || ''"
        :mother-email="certificateData.service?.mother_email || ''"
        :mother-address="certificateData.service?.mother_address || ''"
        :sponsors="certificateData.service?.sponsors || []"
        :pastor="certificateData.service?.pastor || ''"
        :location="certificateData.service?.location || ''"
        :status="certificateData.service?.status || ''"
        :date-created="certificateData.service?.date_created || ''"
        :child-fullname="certificateData.service?.child_fullname || ''"
        :father-fullname="certificateData.service?.father_fullname || ''"
        :mother-fullname="certificateData.service?.mother_fullname || ''"
        :certificate-number="certificateData.service?.child_id || ''"
      />

      <!-- Water Baptism Certificate -->
      <WaterBaptismCertificate
        v-else-if="certificateType === 'water_baptism' && certificateData"
        :baptism-id="certificateData.service?.baptism_id || ''"
        :member-id="certificateData.service?.member_id || ''"
        :baptism-date="certificateData.service?.baptism_date || ''"
        :baptism-time="certificateData.service?.preferred_baptism_time || ''"
        :location="certificateData.service?.location || ''"
        :pastor-name="certificateData.service?.pastor_name || ''"
        :status="certificateData.service?.status || ''"
        :guardian-name="certificateData.service?.guardian_name || ''"
        :guardian-contact="certificateData.service?.guardian_contact || ''"
        :guardian-relationship="certificateData.service?.guardian_relationship || ''"
        :date-created="certificateData.service?.date_created || ''"
        :first-name="certificateData.service?.firstname || ''"
        :last-name="certificateData.service?.lastname || ''"
        :middle-name="certificateData.service?.middle_name || ''"
        :fullname="certificateData.service?.fullname || ''"
        :birthdate="certificateData.service?.birthdate || ''"
        :age="certificateData.service?.age || ''"
        :gender="certificateData.service?.gender || ''"
        :address="certificateData.service?.address || ''"
        :email="certificateData.service?.email || ''"
        :phone-number="certificateData.service?.phone_number || ''"
        :civil-status="certificateData.service?.civil_status || ''"
        :position="certificateData.service?.position || ''"
        :profession="certificateData.service?.profession || ''"
        :spouse-name="certificateData.service?.spouse_name || ''"
        :marriage-date="certificateData.service?.marriage_date || ''"
        :children="certificateData.service?.children || []"
        :desire-ministry="certificateData.service?.desire_ministry || ''"
        :member-guardian-name="certificateData.service?.guardian_name || certificateData.service?.member_guardian_name || ''"
        :member-guardian-contact="certificateData.service?.guardian_contact || certificateData.service?.member_guardian_contact || ''"
        :member-guardian-relationship="certificateData.service?.guardian_relationship || certificateData.service?.member_guardian_relationship || ''"
        :certificate-number="certificateData.service?.baptism_id || ''"
      />

      <!-- No certificate data -->
      <div v-else class="no-certificate">
        <p>Certificate data not available</p>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer" v-if="certificateData">
        <el-button @click="handleClose" size="large">Close</el-button>
        <el-button type="primary" @click="printCertificate" size="large">
          Print Certificate
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import MarriageCertificate from '@/components/Certificates/MarriageCertificate.vue'
import DeathCertificate from '@/components/Certificates/DeathCertificate.vue'
import ChildDedicationCertificate from '@/components/Certificates/ChildDedicationCertificate.vue'
import WaterBaptismCertificate from '@/components/Certificates/WaterBaptismCertificate.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  certificateData: {
    type: Object,
    default: null
  },
  certificateType: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue' ,'print'])

const getCertificateTitle = () => {
  const typeMap = {
    'marriage': 'Marriage',
    'burial': 'Death',
    'child_dedication': 'Child Dedication',
    'water_baptism': 'Water Baptism'
  }
  return typeMap[props.certificateType] || 'Certificate'
}

const calculateAge = (birthDate, deathDate) => {
  if (!birthDate || !deathDate) return ''
  const birth = new Date(birthDate)
  const death = new Date(deathDate)
  const age = death.getFullYear() - birth.getFullYear()
  const monthDiff = death.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
    return age - 1
  }
  return age
}

// Helper functions to get display names for groom and bride
const getGroomDisplayName = (service) => {
  if (!service) return ''
  return service.groom_name || ''
}

const getBrideDisplayName = (service) => {
  if (!service) return ''
  return service.bride_name || ''
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('print', false)
}

const printCertificate = () => {
  const certificateElement = document.querySelector('.certificate-wrapper')
  if (certificateElement) {
    // Clone the element
    const clonedElement = certificateElement.cloneNode(true)
    
    // Get the inner HTML of the certificate
    const content = clonedElement.innerHTML
    
    // Create print window
    const printWindow = window.open('', '_blank')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Certificate</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Times+New+Roman:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @page {
              size: letter portrait;
              margin: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: 'Times New Roman', serif;
            }
            
            .certificate-container {
              width: 8.5in;
              min-height: 11in;
              background: #e8e0d0;
              display: flex;
              justify-content: center;
              padding: 0.25in;
              box-sizing: border-box;
            }
            
            .certificate-wrapper {
              width: 8.5in;
            }
            
            .outer-border {
              border: 4px solid #8b7355;
              padding: 4px;
              background: #d4c4a8;
            }
            
            .inner-border {
              background-color: #f3e6c4;
              padding: 0.25in 0.35in;
              border: 2px solid #8b7355;
              position: relative;
            }
            
            .watermark-logo {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 50%;
              height: 50%;
              opacity: 0.15;
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
            }
            
            .corner-design svg {
              width: 60px;
              height: 60px;
            }
            
            .corner-design.top-left { top: 8px; left: 8px; }
            .corner-design.top-right { top: 8px; right: 8px; }
            .corner-design.bottom-left { bottom: 8px; left: 8px; }
            .corner-design.bottom-right { bottom: 8px; right: 8px; }
            
            .corner-design svg * {
              stroke: #8b7355 !important;
              fill: #8b7355 !important;
            }
            
            .church-header {
              text-align: center;
              margin-bottom: 0.15in;
              border-bottom: 3px solid #8b7355;
              padding-bottom: 0.1in;
              position: relative;
              z-index: 3;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.08in;
            }
            
            .church-logo-area {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            .logo-emblem {
              width: 80px;
              height: 80px;
              background: #fffef8;
              border: 3px solid #8b7355;
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
            
            .sec-text {
              font-size: 12px;
              font-weight: 700;
              color: #8b7355;
              margin-top: 4px;
              letter-spacing: 2px;
              font-family: 'Times New Roman', serif;
            }
            
            .church-info {
              text-align: center;
            }
            
            .church-name {
              font-size: 28px;
              font-weight: 700;
              color: #2c1810;
              margin: 0;
              letter-spacing: 3px;
              font-family: 'Cinzel', serif;
            }
            
            .church-subtitle {
              font-size: 18px;
              font-weight: 600;
              color: #2c1810;
              margin: 0;
              letter-spacing: 6px;
              font-family: 'Cinzel', serif;
            }
            
            .church-address {
              font-size: 12px;
              color: #4a3728;
              margin: 6px 0 0 0;
              font-family: 'Times New Roman', serif;
            }
            
            .title-section {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 0.15in;
              position: relative;
              z-index: 3;
            }
            
            .title-content {
              text-align: center;
              padding: 0 0.3in;
            }
            
            .title-decoration {
              width: 80px;
              height: 3px;
              background: linear-gradient(to right, transparent, #8b7355);
              position: relative;
            }
            
            .title-decoration::after {
              content: '❖';
              position: absolute;
              top: -14px;
              font-size: 18px;
              color: #8b7355;
            }
            
            .title-decoration.left::after { right: 0; }
            .title-decoration.right::after { left: 0; }
            
            .main-title {
              font-size: 36px;
              font-weight: 700;
              color: #2c1810;
              margin: 0;
              letter-spacing: 6px;
              font-family: 'Cinzel', serif;
            }
            
            .subtitle {
              font-size: 22px;
              font-weight: 600;
              color: #2c1810;
              margin: 0;
              letter-spacing: 5px;
              font-family: 'Cinzel', serif;
            }
            
            .baptism-statement,
            .dedication-statement {
              text-align: center;
              font-size: 16px;
              color: #4a3728;
              margin: 0.1in 0 0.05in 0;
              font-family: 'Times New Roman', serif;
              position: relative;
              z-index: 3;
            }
            
            .member-name-section {
              text-align: center;
              margin-bottom: 0.08in;
              position: relative;
              z-index: 3;
            }
            
            .member-name {
              font-size: 32px;
              font-weight: 700;
              color: #2c1810;
              font-family: 'Times New Roman', serif;
              display: inline-block;
              padding: 0.05in 0.3in;
              border-bottom: 3px solid #8b7355;
            }
            
            .child-name-section {
              text-align: center;
              margin-bottom: 0.08in;
              position: relative;
              z-index: 3;
            }
            
            .child-fullname {
              font-size: 32px;
              font-weight: 700;
              color: #2c1810;
              font-family: 'Times New Roman', serif;
              display: inline-block;
              padding: 0.05in 0.3in;
              border-bottom: 3px solid #8b7355;
              background: linear-gradient(to bottom, rgba(139, 115, 85, 0.05), transparent);
            }
            
            .baptism-detail {
              text-align: center;
              font-size: 14px;
              color: #4a3728;
              margin: 0 0 0.15in 0;
              font-family: 'Times New Roman', serif;
              position: relative;
              z-index: 3;
            }
            
            .personal-info-section,
            .child-section,
            .parent-section,
            .sponsors-section,
            .contact-section,
            .admin-section {
              margin-bottom: 0.15in;
              position: relative;
              z-index: 3;
            }
            
            .personal-info-section {
              display: flex;
              gap: 0.3in;
            }
            
            .info-column {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            
            .left-column {
              flex: 0 0 280px;
            }
            
            .info-field-row,
            .child-row,
            .parent-row,
            .contact-row,
            .admin-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.08in;
              gap: 10px;
            }
            
            .info-field-row:last-child,
            .child-row:last-child,
            .parent-row:last-child,
            .contact-row:last-child,
            .admin-row:last-child {
              margin-bottom: 0;
            }
            
            .field-group {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .field-label,
            .label {
              font-size: 14px;
              font-weight: 700;
              color: #2c1810;
              font-family: 'Times New Roman', serif;
              white-space: nowrap;
            }
            
            .field-value,
            .value {
              font-size: 14px;
              font-weight: 400;
              color: #2c1810;
              font-family: 'Times New Roman', serif;
              text-align: left;
              flex: 1;
              border-bottom: 2px dotted #8b7355;
              min-width: 80px;
              padding-bottom: 2px;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: 700;
              color: #2c1810;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 0.08in;
              font-family: 'Times New Roman', serif;
              border-bottom: 2px solid #8b7355;
              padding-bottom: 4px;
              text-align: center;
            }
            
            .requested-section {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 0.15in;
              padding-bottom: 0.1in;
              border-bottom: 2px solid #8b7355;
              position: relative;
              z-index: 3;
            }
            
            .requested-section .label {
              font-size: 14px;
            }
            
            .requested-section .value {
              font-size: 16px;
              border-bottom: 2px dotted #8b7355;
              padding-bottom: 2px;
            }
            
            .sponsors-grid {
              display: flex;
              justify-content: flex-start;
              gap: 1in;
            }
            
            .sponsor-column {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            
            .sponsor-name {
              font-size: 14px;
              color: #2c1810;
              font-family: 'Times New Roman', serif;
            }
            
            .minister-section {
              text-align: center;
              margin-top: 0.25in;
              padding-top: 0.15in;
              border-top: 2px solid #8b7355;
              position: relative;
              z-index: 3;
            }
            
            .minister-info {
              display: inline-block;
              text-align: center;
            }
            
            .minister-name {
              font-size: 18px;
              font-weight: 700;
              color: #2c1810;
              margin: 0 0 8px 0;
              font-family: 'Times New Roman', serif;
            }
            
            .signature-line {
              width: 200px;
              height: 2px;
              background: #4a3728;
              margin: 0 auto 6px auto;
            }
            
            .signature-label {
              font-size: 12px;
              color: #4a3728;
              margin: 0;
              font-family: 'Times New Roman', serif;
              text-transform: uppercase;
            }
            
            .footer-section {
              display: flex;
              justify-content: space-between;
              margin-top: 0.2in;
              padding-top: 0.1in;
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
              font-size: 11px;
              color: #4a3728;
              margin: 0;
              font-family: 'Times New Roman', serif;
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="certificate-wrapper">
              <div class="outer-border">
                <div class="inner-border">
                  ${content}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  } else {
    ElMessage.error('Certificate content not found')
  }
}
</script>

<style scoped>
.certificate-dialog :deep(.el-dialog__body) {
  padding: 0;
  overflow: auto;
}

.certificate-dialog-content {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.no-certificate {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 18px;
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0;
}
</style>
