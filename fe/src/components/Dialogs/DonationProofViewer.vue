<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="dialogTitle"
    width="700px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    class="proof-viewer-dialog"
    @close="handleClose"
    destroy-on-close
  >
    <!-- Loading State -->
    <div v-if="loadingImage" class="loading-state">
      <div class="spinner"></div>
      <p>Loading proof image...</p>
    </div>

    <div v-else class="proof-viewer-content">
      <!-- Donation Info -->
      <div class="donation-info">
        <div class="info-row">
          <span class="info-label">Donor</span>
          <span class="info-value">
            <span v-if="donation?.is_anonymous" class="anonymous-tag">
              <v-icon size="small" class="mr-1">mdi-incognito</v-icon> Anonymous
            </span>
            <span v-else>{{ donation?.fullname || donation?.member_name || 'N/A' }}</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">{{ donation?.donor_email || donation?.email || 'N/A' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value amount">₱{{ parseFloat(donation?.amount || 0).toLocaleString() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type</span>
          <span class="info-value">{{ formatType(donation?.type) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value">{{ formatMethod(donation?.donation_method, donation?.donation_method_other) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Donation Date</span>
          <span class="info-value">{{ donation?.donation_date || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Submitted</span>
          <span class="info-value">{{ donation?.date_created || '-' }}</span>
        </div>
        <div v-if="donation?.notes" class="info-row">
          <span class="info-label">Notes</span>
          <span class="info-value">{{ donation?.notes }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">
            <el-tag :type="getStatusType(donation?.status)" size="small" effect="dark">
              {{ formatStatus(donation?.status) }}
            </el-tag>
          </span>
        </div>
        <div v-if="donation?.status === 'rejected' && donation?.rejection_reason" class="info-row">
          <span class="info-label">Rejection Reason</span>
          <span class="info-value rejection-text">{{ donation?.rejection_reason }}</span>
        </div>
      </div>

      <!-- Proof Image -->
      <div class="proof-image-section">
        <h4 class="section-title">Receipt Screenshot</h4>
        <div v-if="proofImage" class="proof-image-wrapper">
          <img :src="proofImage" alt="Donation Proof" class="proof-image" @click="openImageFullscreen" />
          <p class="image-hint">Click image to view fullscreen</p>
        </div>
        <div v-else class="no-proof">
          <v-icon size="48" color="grey">mdi-image-off</v-icon>
          <p>No proof image available</p>
        </div>
      </div>

      <!-- Rejection Reason Input (shown when rejecting) -->
      <div v-if="showRejectionInput" class="rejection-section">
        <el-form-item label="Reason for Rejection" required>
          <el-input
            v-model="rejectionReason"
            type="textarea"
            :rows="3"
            placeholder="Please provide a reason for rejecting this donation..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </div>

      <!-- Admin Verification Proof (shown when deciding, primarily for Confirm) -->
      <div v-if="!showRejectionInput && donation?.status === 'pending'" class="admin-proof-section mt-4">
        <h4 class="section-title">Admin Verification Proof (Optional)</h4>
        <p class="text-caption text-grey mb-2">Upload a screenshot (e.g. bank transaction) to prove receipt of funds.</p>
        
        <div class="admin-upload-container">
          <input
            type="file"
            ref="adminProofInput"
            accept="image/*"
            style="display: none"
            @change="handleAdminProofChange"
          />
          
          <div v-if="!adminProofParams.image" class="upload-placeholder" @click="$refs.adminProofInput.click()">
            <v-icon size="24" color="primary">mdi-cloud-upload</v-icon>
            <span>Click to upload proof</span>
          </div>
          
          <div v-else class="admin-proof-preview">
            <img :src="adminProofParams.image" alt="Admin Proof" class="preview-img" />
            <v-btn
              icon="mdi-close"
              size="x-small"
              color="error"
              class="remove-btn"
              @click="removeAdminProof"
            ></v-btn>
          </div>
        </div>
      </div>
      
      <!-- Display Existing Admin Proof if verified -->
      <div v-if="donation?.has_admin_proof_image" class="proof-image-section mt-4">
        <h4 class="section-title">Admin Verification Proof</h4>
        <div v-if="existingAdminProof" class="proof-image-wrapper">
          <img :src="existingAdminProof" alt="Admin Proof" class="proof-image" @click="openAdminImageFullscreen" />
        </div>
        <div v-else class="loading-state py-2">
           <span class="text-caption">Loading admin proof...</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <!-- Show Confirm/Reject buttons only for pending donations -->
        <template v-if="donation?.status === 'pending' && !showRejectionInput">
          <el-button @click="handleClose" size="large" :disabled="loading">Close</el-button>
          <el-button
            type="danger"
            @click="showRejectionInput = true"
            size="large"
            :disabled="loading"
            plain
          >
            <span>✕</span> Reject
          </el-button>
          <el-button
            type="success"
            @click="handleVerify('confirmed')"
            size="large"
            :loading="loading"
            :disabled="loading"
          >
            <span v-if="!loading">✓</span> Confirm Donation
          </el-button>
        </template>
        
        <!-- Show Confirm/Cancel for rejection input -->
        <template v-else-if="showRejectionInput">
          <el-button @click="showRejectionInput = false" size="large" :disabled="loading">Back</el-button>
          <el-button
            type="danger"
            @click="handleVerify('rejected')"
            size="large"
            :loading="loading"
            :disabled="loading || !rejectionReason.trim()"
          >
            <span v-if="!loading">✕</span> Confirm Rejection
          </el-button>
        </template>
        
        <!-- Already verified - just close -->
        <template v-else>
          <el-button @click="handleClose" size="large" type="primary">Close</el-button>
        </template>
      </div>
    </template>
  </el-dialog>

  <!-- Fullscreen Image Dialog -->
  <el-dialog
    v-model="showFullscreen"
    fullscreen
    class="fullscreen-image-dialog"
    :show-close="true"
  >
    <div class="fullscreen-image-wrapper" @click="showFullscreen = false">
      <img v-if="fullscreenImageSrc" :src="fullscreenImageSrc" alt="Donation Proof Fullscreen" class="fullscreen-image" />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '@/api/axios'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  donation: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'verified'])

// State
const loading = ref(false)
const loadingImage = ref(false)
const proofImage = ref(null)
const existingAdminProof = ref(null) // For viewing already verified proof
const showRejectionInput = ref(false)
const rejectionReason = ref('')
const showFullscreen = ref(false)
const fullscreenImageSrc = ref('')

// Admin Proof Upload State
const adminProofInput = ref(null)
const adminProofParams = ref({
  image: null,
  file: null
})

// Computed title
const dialogTitle = `Donation #${props.donation?.tithes_id || ''} - Proof Viewer`

// Format helpers
const formatType = (type) => {
  const typeMap = {
    'tithe': 'Tithe',
    'offering': 'Offering',
    'missions': 'Missions',
    'love_gift': 'Love Gift',
    'building_fund': 'Building Fund',
    'donation': 'Donation',
    'other': 'Other'
  }
  return typeMap[type] || type || 'N/A'
}

const formatMethod = (method, other) => {
  if (method === 'others') return other || 'Other'
  const methodMap = {
    'gcash': 'GCash',
    'maya': 'Maya',
    'cash': 'Cash',
    'check': 'Check',
    'bank': 'Bank Transfer'
  }
  return methodMap[method] || method || 'N/A'
}

const formatStatus = (status) => {
  const statusMap = {
    'pending': 'Pending Review',
    'confirmed': 'Confirmed',
    'rejected': 'Rejected'
  }
  return statusMap[status] || status || 'Unknown'
}

const getStatusType = (status) => {
  const statusTypes = {
    'pending': 'warning',
    'confirmed': 'success',
    'rejected': 'danger'
  }
  return statusTypes[status] || 'info'
}

// Open fullscreen image
const openImageFullscreen = () => {
  if (proofImage.value) {
    fullscreenImageSrc.value = proofImage.value
    showFullscreen.value = true
  }
}

const openAdminImageFullscreen = () => {
  if (existingAdminProof.value) {
    fullscreenImageSrc.value = existingAdminProof.value
    showFullscreen.value = true
  }
}

// Fetch proof image
const fetchProofImage = async () => {
  if (!props.donation?.tithes_id) return
  if (!props.donation?.has_proof_image) {
    proofImage.value = null
    return
  }

  loadingImage.value = true
  try {
    const response = await axios.get(`/church-records/tithes/getProofImage/${props.donation.tithes_id}`)
    if (response.data.success) {
      proofImage.value = response.data.data.image
    } else {
      proofImage.value = null
    }
  } catch (error) {
    console.error('Error fetching proof image:', error)
    proofImage.value = null
  } finally {
    loadingImage.value = false
  }
}

// Fetch existing admin proof image
const fetchAdminProofImage = async () => {
  if (!props.donation?.tithes_id) return
  if (!props.donation?.has_admin_proof_image) {
    existingAdminProof.value = null
    return
  }
  
  try {
    const response = await axios.get(`/church-records/tithes/getAdminProofImage/${props.donation.tithes_id}`)
    if (response.data.success) {
      existingAdminProof.value = response.data.data.image
    }
  } catch (error) {
    console.error('Error fetching admin proof:', error)
  }
}

// Handle Admin Proof Upload
const handleAdminProofChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('Image size must be less than 5MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    adminProofParams.value.image = e.target.result
    adminProofParams.value.file = file
  }
  reader.readAsDataURL(file)
}

const removeAdminProof = () => {
  adminProofParams.value.image = null
  adminProofParams.value.file = null
  if (adminProofInput.value) {
    adminProofInput.value.value = ''
  }
}

// Handle verify/reject
const handleVerify = async (action) => {
  try {
    if (action === 'confirmed') {
      await ElMessageBox.confirm(
        'Are you sure you want to confirm this donation?',
        'Confirm Donation',
        {
          confirmButtonText: 'Yes, Confirm',
          cancelButtonText: 'Cancel',
          type: 'success',
        }
      )
    }

    loading.value = true

    const payload = {
      action: action,
      rejection_reason: action === 'rejected' ? rejectionReason.value.trim() : null,
      admin_proof_image: action === 'confirmed' ? adminProofParams.value.image : null
    }

    const response = await axios.put(
      `/church-records/tithes/verifyDonation/${props.donation.tithes_id}`,
      payload
    )

    if (response.data.success) {
      ElMessage.success(`Donation ${action === 'confirmed' ? 'confirmed' : 'rejected'} successfully`)
      emit('verified', response.data.data)
      handleClose()
    }
  } catch (error) {
    if (error === 'cancel') return
    console.error('Error verifying donation:', error)
  } finally {
    loading.value = false
  }
}

// Handle close
const handleClose = () => {
  showRejectionInput.value = false
  rejectionReason.value = ''
  proofImage.value = null
  existingAdminProof.value = null
  removeAdminProof()
  emit('update:modelValue', false)
}

// Watch for dialog open
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.donation) {
      fetchProofImage()
      fetchAdminProofImage()
      showRejectionInput.value = false
      rejectionReason.value = ''
      removeAdminProof()
    }
  }
)
</script>

<style scoped>
.proof-viewer-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
  max-height: 75vh;
  overflow-y: auto;
}

.proof-viewer-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  padding: 16px 24px;
  margin: 0;
}

.proof-viewer-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.proof-viewer-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  margin-top: 12px;
  color: #6b7280;
}

/* Donation Info */
.donation-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  min-width: 130px;
}

.info-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  text-align: right;
}

.info-value.amount {
  font-size: 18px;
  font-weight: 700;
  color: #0d9488;
}

.info-value.rejection-text {
  color: #dc2626;
  font-style: italic;
  max-width: 300px;
  text-align: right;
}

.anonymous-tag {
  display: inline-flex;
  align-items: center;
  color: #9ca3af;
  font-style: italic;
}

/* Proof Image Section */
.proof-image-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.proof-image-wrapper {
  text-align: center;
}

.proof-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  object-fit: contain;
}

.proof-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.image-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

.no-proof {
  text-align: center;
  padding: 32px;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
}

.no-proof p {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 14px;
}

/* Rejection Section */
.rejection-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
}

/* Fullscreen Image */
.fullscreen-image-dialog :deep(.el-dialog__body) {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.95);
  height: 100vh;
}

.fullscreen-image-dialog :deep(.el-dialog__header) {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  background: transparent;
}

.fullscreen-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.fullscreen-image {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
}

/* Admin Upload styles */
.admin-upload-container {
  margin-top: 10px;
}

.upload-placeholder {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.upload-placeholder:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.admin-proof-preview {
  position: relative;
  display: inline-block;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px;
}

.preview-img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 4px;
  display: block;
}

.remove-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: white !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
