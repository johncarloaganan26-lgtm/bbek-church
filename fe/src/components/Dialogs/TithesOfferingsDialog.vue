<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Donation' : 'Record New Donation'"
    width="750px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    class="tithes-offerings-dialog"
    @close="handleClose"
  >
    <!-- Loading Overlay -->
    <div v-if="loading" class="dialog-loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p class="loading-text">Processing...</p>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="160px"
      label-position="left"
      :disabled="loading"
      class="donation-form"
    >
      <!-- Donation Type Toggle -->
      <el-form-item label="Donation Type">
        <el-radio-group v-model="formData.donation_type" size="large" class="donation-type-toggle">
          <el-radio-button value="money">
            <el-icon><Money /></el-icon>
            Money
          </el-radio-button>
          <el-radio-button value="inkind">
            <el-icon><Box /></el-icon>
            In-Kind
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- Member Selection (Typeable) -->
      <el-form-item label="Donor" prop="member_id">
        <el-autocomplete
          v-model="formData.member_name"
          :fetch-suggestions="searchMembers"
          placeholder="Search member or type name..."
          size="large"
          style="width: 100%"
          clearable
          :trigger-on-focus="true"
          @select="handleMemberSelect"
          @clear="handleMemberClear"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
          <template #default="{ item }">
            <div class="member-option">
              <span class="member-name">{{ item.value }}</span>
              <span class="member-email">{{ item.email }}</span>
            </div>
          </template>
        </el-autocomplete>
        <div class="form-hint">
          <el-checkbox v-model="formData.is_anonymous">Record as anonymous</el-checkbox>
        </div>
      </el-form-item>

      <!-- Money Donation Fields -->
      <template v-if="formData.donation_type === 'money'">
        <!-- Amount -->
        <el-form-item label="Amount" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :min="0"
            :max="100000000"
            :step="100"
            :precision="2"
            size="large"
            style="width: 100%"
            placeholder="0.00"
          >
            <template #prefix>₱</template>
          </el-input-number>
        </el-form-item>

        <!-- Type -->
        <el-form-item label="Type" prop="type">
          <el-select
            v-model="formData.type"
            placeholder="Select type"
            size="large"
            style="width: 100%"
            clearable
          >
            <el-option label="Tithe" value="tithe">
              <span>Tithe</span>
              <span class="option-desc">- 10% of income</span>
            </el-option>
            <el-option label="Offering" value="offering">
              <span>Offering</span>
              <span class="option-desc">- General offering</span>
            </el-option>
            <el-option label="Missions" value="missions">
              <span>Missions</span>
              <span class="option-desc">- Mission work support</span>
            </el-option>
            <el-option label="Love Gift" value="love_gift">
              <span>Love Gift</span>
              <span class="option-desc">- Special occasions</span>
            </el-option>
            <el-option label="Building Fund" value="building_fund">
              <span>Building Fund</span>
              <span class="option-desc">- Church building</span>
            </el-option>
            <el-option label="Donation" value="donation">
              <span>Donation</span>
              <span class="option-desc">- General donation</span>
            </el-option>
            <el-option label="Other" value="other">Other</el-option>
          </el-select>
        </el-form-item>

        <!-- Payment Method -->
        <el-form-item label="Payment Method" prop="payment_method">
          <el-select
            v-model="formData.payment_method"
            placeholder="Select method"
            size="large"
            style="width: 100%"
            clearable
          >
            <el-option label="Cash" value="cash">
              <el-icon><Money /></el-icon>
              Cash
            </el-option>
            <el-option label="Check" value="check">
              <el-icon><Document /></el-icon>
              Check
            </el-option>
            <el-option label="GCash" value="gcash">
              <el-icon><Phone /></el-icon>
              GCash
            </el-option>
            <el-option label="Bank Transfer" value="bank">
              <el-icon><CreditCard /></el-icon>
              Bank Transfer
            </el-option>
            <el-option label="Other" value="other">Other</el-option>
          </el-select>
        </el-form-item>
      </template>

      <!-- In-Kind Donation Fields -->
      <template v-else>
        <!-- Donation Items -->
        <el-form-item label="Items Donated" prop="donation_items">
          <el-input
            v-model="formData.donation_items"
            type="textarea"
            :rows="3"
            placeholder="e.g., 5 cans of milk, 2 loaves of bread, vegetables..."
            size="large"
            maxlength="500"
            show-word-limit
          />
          <div class="form-hint">
            Describe the items, food, or goods being donated
          </div>
        </el-form-item>

        <!-- Donation Category -->
        <el-form-item label="Category" prop="type">
          <el-select
            v-model="formData.type"
            placeholder="Select category"
            size="large"
            style="width: 100%"
            clearable
          >
            <el-option label="Food Items" value="food">
              <el-icon><Food /></el-icon>
              Food Items
            </el-option>
            <el-option label="Clothing" value="clothing">
              <el-icon><ShoppingBag /></el-icon>
              Clothing
            </el-option>
            <el-option label="Medical Supplies" value="medical">
              <el-icon><FirstAidKit /></el-icon>
              Medical Supplies
            </el-option>
            <el-option label="School Supplies" value="school">
              <el-icon><Notebook /></el-icon>
              School Supplies
            </el-option>
            <el-option label="Furniture" value="furniture">
              <el-icon><House /></el-icon>
              Furniture
            </el-option>
            <el-option label="Electronics" value="electronics">
              <el-icon><Monitor /></el-icon>
              Electronics
            </el-option>
            <el-option label="Household Items" value="household">
              <el-icon><Household /></el-icon>
              Household Items
            </el-option>
            <el-option label="Other" value="other">Other</el-option>
          </el-select>
        </el-form-item>
      </template>

      <!-- Notes -->
      <el-form-item label="Notes" prop="notes">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="2"
          placeholder="Additional notes or comments (optional)"
          size="large"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large" :disabled="loading">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          size="large"
          :loading="loading"
          :disabled="loading"
        >
          <el-icon v-if="!loading"><Check /></el-icon>
          {{ isEditMode ? 'Update' : 'Record' }} Donation
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, Money, Box, Document, Phone, CreditCard,
  Food, ShoppingBag, FirstAidKit, Notebook, House,
  Monitor, Check
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  tithesData: {
    type: Object,
    default: null
  },
  tithesOfferingsData: {
    type: Object,
    default: null
  },
  memberOptions: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'submit'])

// Refs
const formRef = ref(null)
const loading = ref(false)
const allMembers = ref([])

// Check if in edit mode
const isEditMode = computed(() => !!(props.tithesData || props.tithesOfferingsData))

// Form data
const formData = reactive({
  member_id: null,
  member_name: '',
  is_anonymous: false,
  donation_type: 'money', // 'money' or 'inkind'
  amount: null,
  type: '',
  payment_method: '',
  donation_items: '',
  notes: ''
})

// Validation rules
const rules = {
  type: [
    { required: true, message: 'Type/Category is required', trigger: 'change' }
  ],
  donation_items: [
    {
      validator: (rule, value, callback) => {
        if (formData.donation_type === 'inkind' && (!value || value.trim() === '')) {
          callback(new Error('Please describe the items being donated'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  amount: [
    {
      validator: (rule, value, callback) => {
        if (formData.donation_type === 'money' && (value === null || value === undefined || value === '')) {
          callback(new Error('Amount is required for money donations'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  payment_method: [
    {
      validator: (rule, value, callback) => {
        if (formData.donation_type === 'money' && (!value || value.trim() === '')) {
          callback(new Error('Payment method is required'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  notes: [
    { max: 500, message: 'Notes must not exceed 500 characters', trigger: 'blur' }
  ]
}

// Get the data from either prop
const donationData = computed(() => props.tithesData || props.tithesOfferingsData)

// Search members for autocomplete
const searchMembers = (queryString, cb) => {
  if (!queryString && props.memberOptions.length > 0) {
    // Show all members if no search
    const results = props.memberOptions.map(m => ({
      value: m.name,
      id: m.id,
      email: m.email || ''
    }))
    cb(results)
    return
  }

  if (!queryString) {
    cb([])
    return
  }

  const results = props.memberOptions
    .filter(member => 
      member.name && member.name.toLowerCase().includes(queryString.toLowerCase())
    )
    .map(m => ({
      value: m.name,
      id: m.id,
      email: m.email || ''
    }))
  cb(results)
}

// Handle member selection from autocomplete
const handleMemberSelect = (item) => {
  formData.member_id = item.id
  formData.is_anonymous = false
}

// Handle member clear
const handleMemberClear = () => {
  formData.member_id = null
}

// Watch for donation data changes to populate form in edit mode
watch(
  () => donationData.value,
  (newData) => {
    if (newData && props.modelValue) {
      formData.member_id = newData.member_id ?? null
      formData.member_name = newData.fullname || newData.member_name || ''
      formData.is_anonymous = newData.is_anonymous || false
      formData.donation_type = newData.donation_type || 'money'
      formData.amount = typeof newData.amount === 'number' ? newData.amount : parseFloat(newData.amount) || null
      formData.type = newData.type || ''
      formData.payment_method = newData.payment_method || ''
      formData.donation_items = newData.donation_items || ''
      formData.notes = newData.notes || ''
    }
  },
  { immediate: true }
)

// Watch dialog open/close to reset or populate form
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
    } else if (donationData.value) {
      const data = donationData.value
      formData.member_id = data.member_id ?? null
      formData.member_name = data.fullname || data.member_name || ''
      formData.is_anonymous = data.is_anonymous || false
      formData.donation_type = data.donation_type || 'money'
      formData.amount = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || null
      formData.type = data.type || ''
      formData.payment_method = data.payment_method || ''
      formData.donation_items = data.donation_items || ''
      formData.notes = data.notes || ''
    } else {
      resetForm()
    }
  }
)

// Reset form
const resetForm = () => {
  formData.member_id = null
  formData.member_name = ''
  formData.is_anonymous = false
  formData.donation_type = 'money'
  formData.amount = null
  formData.type = ''
  formData.payment_method = ''
  formData.donation_items = ''
  formData.notes = ''

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// Handle close
const handleClose = () => {
  emit('update:modelValue', false)
}

// Handle submit
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // Validate form (but don't block if validation fails - allow submission)
    try {
      await formRef.value.validate()
    } catch (validationError) {
      // Continue anyway - backend will handle missing fields
    }
    
    // Show confirmation dialog before submitting
    const actionText = isEditMode.value ? 'update' : 'record'
    const actionTitle = isEditMode.value ? 'Update' : 'Record'
    const donationTypeText = formData.donation_type === 'money' 
      ? `₱${parseFloat(formData.amount || 0).toLocaleString()}`
      : (formData.donation_items ? formData.donation_items.substring(0, 50) + (formData.donation_items.length > 50 ? '...' : '') : 'In-Kind Donation')
    
    try {
      await ElMessageBox.confirm(
        `Are you sure you want to ${actionText} this ${formData.donation_type === 'money' ? 'money' : 'in-kind'} donation?`,
        `Confirm ${actionTitle} Donation`,
        {
          confirmButtonText: actionTitle,
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
      )
      
      // User confirmed, proceed with submission
      loading.value = true

      const submitData = {
        member_id: formData.is_anonymous ? null : formData.member_id,
        member_name: formData.is_anonymous ? 'Anonymous' : (formData.member_name || 'Guest'),
        is_anonymous: formData.is_anonymous,
        donation_type: formData.donation_type,
        amount: formData.donation_type === 'money' ? (formData.amount || 0) : 0,
        type: formData.type || 'donation',
        payment_method: formData.donation_type === 'money' ? (formData.payment_method || null) : null,
        donation_items: formData.donation_type === 'inkind' ? (formData.donation_items || '').trim() : null,
        notes: (formData.notes || '').trim()
      }

      emit('submit', submitData)
      
      // Safety timeout
      setTimeout(() => {
        if (loading.value) {
          loading.value = false
        }
      }, 30000)
      
    } catch (confirmError) {
      if (confirmError === 'cancel') {
        return
      }
      throw confirmError
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Validation failed:', error)
      ElMessage.error('Please fill in all required fields correctly')
    }
  } finally {
    loading.value = false
  }
}

// Expose method to reset loading
const resetLoading = () => {
  loading.value = false
}

// Expose methods for parent component
defineExpose({
  resetLoading
})
</script>

<style scoped>
.tithes-offerings-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.tithes-offerings-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.tithes-offerings-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.tithes-offerings-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tithes-offerings-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.tithes-offerings-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.tithes-offerings-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tithes-offerings-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.tithes-offerings-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.tithes-offerings-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.tithes-offerings-dialog :deep(.el-radio-group) {
  width: 100%;
}

.donation-type-toggle {
  width: 100%;
}

.donation-type-toggle .el-radio-button {
  width: 50%;
}

.donation-type-toggle .el-radio-button__inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.member-option {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.member-name {
  font-weight: 500;
  color: #303133;
}

.member-email {
  font-size: 12px;
  color: #909399;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.option-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
  min-width: 120px;
}

.dialog-footer .el-button--primary {
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.dialog-footer .el-button--primary:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

.dialog-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 4px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  position: relative;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #14b8a6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dialog-loading-overlay .loading-text {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

.tithes-offerings-dialog :deep(.el-dialog__body) {
  position: relative;
}
</style>
