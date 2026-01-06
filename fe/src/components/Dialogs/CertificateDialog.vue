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
  // Find the certificate wrapper within the dialog content
  const certificateElement = document.querySelector('.certificate-dialog-content .certificate-wrapper')
  if (certificateElement) {
    // Get the outer HTML including the wrapper
    const content = certificateElement.outerHTML
    
    // Get all computed styles from the certificate element
    const computedStyles = getComputedStyle(certificateElement)
    
    // Create a temporary print window with the certificate content and all styles
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Certificate</title>
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 20px;
              background: white;
            }
            @page {
              size: letter portrait;
              margin: 0;
            }
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
            .dedication-statement,
            .baptism-statement {
              text-align: center;
              font-size: 13px;
              color: #333;
              margin: 0 0 15px 0;
              font-family: 'Times New Roman', serif;
            }
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
            .baptism-details-section,
            .guardian-section {
              margin-bottom: 15px;
              padding: 12px;
              background: #f0f4f8;
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
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
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

@media print {
  .certificate-dialog :deep(.el-dialog__footer),
  .certificate-dialog :deep(.el-dialog__header),
  .dialog-footer {
    display: none !important;
  }
}
</style>
