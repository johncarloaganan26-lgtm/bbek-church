<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditMode ? 'Update Marriage Service' : 'Add Marriage Service'"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="marriage-service-dialog"
    @close="handleClose"
    v-loading="loading"
    element-loading-text="Processing..."
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
    >
      <!-- Groom Section -->
      <el-form-item label="Groom Member" prop="groom_member_id">
        <el-select
          v-model="formData.groom_member_id"
          placeholder="Select groom member (optional)"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading || isGroomDisabled"
        >
          <el-option
            v-for="option in memberOptions.filter(option => option.gender === 'M' && option.civil_status !== 'married')"
            :key="option.id"
            :label="option.name"
            :value="option.id"
          />
        </el-select>
      </el-form-item>

      <!-- Groom Name (if member not selected) -->
      <el-form-item 
        label="Groom Name" 
        prop="groom_name"
        v-if="!formData.groom_member_id"
      >
        <el-input
          v-model="formData.groom_name"
          placeholder="Enter groom name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Bride Section -->
      <el-form-item label="Bride Member" prop="bride_member_id">
        <el-select
          v-model="formData.bride_member_id"
          placeholder="Select bride member (optional)"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading || isBrideDisabled"
        >
          <el-option
            v-for="option in memberOptions.filter(option => option.gender === 'F' && option.civil_status !== 'married')"
            :key="option.id"
            :label="option.name"
            :value="option.id"
          />
        </el-select>
      </el-form-item>

      <!-- Bride Name (if member not selected) -->
      <el-form-item 
        label="Bride Name" 
        prop="bride_name"
        v-if="!formData.bride_member_id"
      >
        <el-input
          v-model="formData.bride_name"
          placeholder="Enter bride name"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Guardians (Table, same as Child Dedication) -->

      <el-form-item label="Guardians" prop="guardians">
        <div class="guardians-table-wrapper">
          <el-table
            :data="formData.guardians"
            border
            size="small"
            class="guardians-table"
            max-height="300"
          >
            <el-table-column
              label="#"
              type="index"
              width="50"
            />

            <el-table-column label="First Name" min-width="140">
              <template #default="{ row }">
                <el-input
                  v-model="row.firstname"
                  placeholder="First name"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onGuardiansChange"
                  @blur="onGuardiansChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Last Name" min-width="140">
              <template #default="{ row }">
                <el-input
                  v-model="row.lastname"
                  placeholder="Last name"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onGuardiansChange"
                  @blur="onGuardiansChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Middle Name" min-width="140">
              <template #default="{ row }">
                <el-input
                  v-model="row.middle_name"
                  placeholder="Middle name (optional)"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onGuardiansChange"
                  @blur="onGuardiansChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Phone Number" min-width="150">
              <template #default="{ row }">
                <el-input
                  v-model="row.phone_number"
                  placeholder="Phone number"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onGuardiansChange"
                  @blur="onGuardiansChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Address" min-width="200">
              <template #default="{ row }">
                <el-input
                  v-model="row.address"
                  placeholder="Address"
                  size="small"
                  clearable
                  :disabled="loading"
                  @change="onGuardiansChange"
                  @blur="onGuardiansChange"
                />
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="90" align="center" fixed="right">
              <template #default="{ $index }">
                <el-button
                  v-if="formData.guardians.length > 1"
                  type="danger"
                  circle
                  text
                  size="small"
                  :disabled="loading"
                  @click="removeGuardian($index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="guardian-add-row">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="loading"
              @click="addGuardian"
            >
              + Add Guardian
            </el-button>
          </div>
        </div>
      </el-form-item>

      <!-- Pastor -->
      <el-divider content-position="left">Service Details</el-divider>

      <el-form-item label="Pastor" prop="pastor_id" v-if="userInfo.account.position === 'admin' || userInfo.account.position === 'staff'">
        <el-select
          v-model="formData.pastor_id"
          placeholder="Select pastor"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading"
        >
          <el-option
            v-for="pastor in pastorOptions"
            :key="pastor.id"
            :label="pastor.name"
            :value="pastor.id"
          />
        </el-select>
      </el-form-item>

      <!-- Location -->
      <el-form-item label="Location" prop="location">
        <el-input
          v-model="formData.location"
          placeholder="Enter marriage location"
          size="large"
          clearable
          :disabled="loading"
        />
      </el-form-item>

      <!-- Marriage Date & Time -->
      <el-form-item label="Marriage Date & Time" prop="marriage_date" v-if="userInfo.account.position === 'admin' || userInfo.account.position === 'staff'">
        <el-date-picker
          v-model="formData.marriage_date"
          type="datetime"
          placeholder="Select marriage date and time (optional if not scheduled yet)"
          size="large"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="loading"
          clearable
        />
      </el-form-item>

      <!-- Status -->
      <el-form-item label="Status" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="Select status"
          size="large"
          style="width: 100%"
          clearable
          :disabled="loading || isMemberUser"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
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
          {{ isEditMode ? 'Update' : userInfo.account.position === 'admin' || userInfo.account.position === 'staff' ? 'Add' : 'Send' }} Record
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useMarriageServiceStore } from '@/stores/ServicesRecords/marriageServiceStore'
import { Delete } from '@element-plus/icons-vue'

const marriageServiceStore = useMarriageServiceStore()

const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  marriageServiceData: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'submit'])

// Refs
const formRef = ref(null)
const loading = ref(false)
const loadingInstanceRef = ref(null)

// Responsive dialog width
const dialogWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '95%'
  } else if (window.innerWidth <= 960) {
    return '90%'
  }
  return '900px'
})

// Responsive label width
const labelWidth = computed(() => {
  if (window.innerWidth <= 600) {
    return '100px'
  } else if (window.innerWidth <= 960) {
    return '140px'
  }
  return '170px'
})

// Responsive label position
const labelPosition = computed(() => {
  return window.innerWidth <= 600 ? 'top' : 'left'
})

// Check if in edit mode
const isEditMode = computed(() => !!props.marriageServiceData)

// Computed properties from store
const memberOptions = computed(() => marriageServiceStore.memberOptions)
const pastorOptions = computed(() => marriageServiceStore.pastorOptions)

// Check if user is a member and find their data in memberOptions
const isMemberUser = computed(() => {
  return userInfo.value?.account?.position === 'member'
})

const currentUserMember = computed(() => {
  if (!isMemberUser.value || !userInfo.value?.member?.member_id) return null
  const memberId = userInfo.value.member.member_id
  return memberOptions.value.find(m => m.id === memberId) || null
})

const isGroomDisabled = computed(() => {
  return isMemberUser.value && currentUserMember.value?.gender === 'M'
})

const isBrideDisabled = computed(() => {
  return isMemberUser.value && currentUserMember.value?.gender === 'F'
})

// Status options - standardized: pending, approved, disapproved, completed, cancelled
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Disapproved', value: 'disapproved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

// Fetch options on mount
onMounted(async () => {
  await Promise.all([
    marriageServiceStore.fetchMemberOptions(),
    marriageServiceStore.fetchPastorOptions()
  ])
})

// Form data
const formData = reactive({
  groom_member_id: '',
  groom_name: '',
  bride_member_id: '',
  bride_name: '',
  guardians: [
    {
      firstname: '',
      lastname: '',
      middle_name: '',
      phone_number: '',
      address: ''
    }
  ],
  pastor_id: null,
  location: '',
  marriage_date: '',
  status: 'pending'
})

// Validation rules
const rules = {
  groom_member_id: [
    {
      validator: (rule, value, callback) => {
        // At least one of groom_member_id or bride_member_id must be selected
        const groomSelected = !!value
        const brideSelected = !!formData.bride_member_id
        
        if (!groomSelected && !brideSelected) {
          callback(new Error('At least one member (groom or bride) must be selected'))
          return
        }
        
        // If groom_member_id is not selected, groom_name is required
        if (!groomSelected && (!formData.groom_name || !formData.groom_name.trim())) {
          callback(new Error('Groom name is required when groom member is not selected'))
          return
        }
        
        callback()
      },
      trigger: ['change', 'blur']
    }
  ],
  groom_name: [
    {
      validator: (rule, value, callback) => {
        // groom_name is required only if groom_member_id is not selected
        if (!formData.groom_member_id && (!value || !value.trim())) {
          callback(new Error('Groom name is required when groom member is not selected'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  bride_member_id: [
    {
      validator: (rule, value, callback) => {
        // At least one of groom_member_id or bride_member_id must be selected
        const groomSelected = !!formData.groom_member_id
        const brideSelected = !!value
        
        if (!groomSelected && !brideSelected) {
          callback(new Error('At least one member (groom or bride) must be selected'))
          return
        }
        
        // If bride_member_id is not selected, bride_name is required
        if (!brideSelected && (!formData.bride_name || !formData.bride_name.trim())) {
          callback(new Error('Bride name is required when bride member is not selected'))
          return
        }
        
        callback()
      },
      trigger: ['change', 'blur']
    }
  ],
  bride_name: [
    {
      validator: (rule, value, callback) => {
        // bride_name is required only if bride_member_id is not selected
        if (!formData.bride_member_id && (!value || !value.trim())) {
          callback(new Error('Bride name is required when bride member is not selected'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  guardians: [
    {
      validator: (rule, value, callback) => {
        if (!Array.isArray(value) || value.length === 0) {
          callback(new Error('At least one guardian is required'))
          return
        }

        for (let i = 0; i < value.length; i++) {
          const g = value[i] || {}
          if (
            !g.firstname || !g.firstname.trim() ||
            !g.lastname || !g.lastname.trim() ||
            !g.phone_number || !g.phone_number.trim() ||
            !g.address || !g.address.trim()
          ) {
            callback(new Error(`Guardian ${i + 1}: firstname, lastname, phone number, and address are required`))
            return
          }
        }

        callback()
      },
      trigger: 'change'
    }
  ],

  location: [
    { required: true, message: 'Location is required', trigger: 'blur' },
    { min: 3, max: 150, message: 'Location must be between 3 and 150 characters', trigger: 'blur' }
  ],
  marriage_date: [
    {
      validator: (rule, value, callback) => {
        // marriage_date is optional, but if provided, validate it
        if (!value || value === '') {
          callback() // Allow null/empty values
          return
        }
        const selected = new Date(value)
        const minDate = new Date()
        minDate.setFullYear(minDate.getFullYear() - 1) // not more than 1 year in the past
        const maxDate = new Date()
        maxDate.setFullYear(maxDate.getFullYear() + 2) // not more than 2 years in the future

        if (selected < minDate) {
          callback(new Error('Marriage date is too far in the past'))
          return
        }
        if (selected > maxDate) {
          callback(new Error('Marriage date is too far in the future'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  status: [
    { required: true, message: 'Status is required', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        // Atomic validation: approved/completed requires marriage_date
        if ((value === 'approved' || value === 'completed') && (!formData.marriage_date || formData.marriage_date === '')) {
          callback(new Error('Marriage date is required for approved/completed status'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

// Guardian helpers
const addGuardian = () => {
  formData.guardians.push({
    firstname: '',
    lastname: '',
    middle_name: '',
    phone_number: '',
    address: ''
  })

  if (formRef.value) {
    formRef.value.validateField('guardians')
  }
}

const removeGuardian = (index) => {
  if (formData.guardians.length > 1) {
    formData.guardians.splice(index, 1)

    if (formRef.value) {
      formRef.value.validateField('guardians')
    }
  }
}

const onGuardiansChange = () => {
  if (formRef.value) {
    formRef.value.validateField('guardians')
  }
}

// Watch for marriageServiceData changes to populate form in edit mode
watch(
  () => props.marriageServiceData,
  (newData) => {
    if (newData && props.modelValue) {
      formData.groom_member_id = newData.groom_member_id || ''
      formData.groom_name = newData.groom_name || ''
      formData.bride_member_id = newData.bride_member_id || ''
      formData.bride_name = newData.bride_name || ''
      formData.guardians = Array.isArray(newData.guardians) && newData.guardians.length > 0
        ? newData.guardians.map(g => ({
            firstname: g.firstname || '',
            lastname: g.lastname || '',
            middle_name: g.middle_name || '',
            phone_number: g.phone_number || '',
            address: g.address || ''
          }))
        : [
            {
              firstname: '',
              lastname: '',
              middle_name: '',
              phone_number: '',
              address: ''
            }
          ]
      formData.pastor_id = newData.pastor_id ?? null
      formData.location = newData.location || ''
      formData.marriage_date = newData.marriage_date || ''
      formData.status = newData.status || 'pending'
    }
  },
  { immediate: true }
)

// Watch memberOptions to auto-select current user when options are loaded
watch(
  () => [memberOptions.value, props.modelValue, isMemberUser.value],
  () => {
    // Only auto-select if dialog is open, not in edit mode, and user is a member
    if (props.modelValue && !props.marriageServiceData && isMemberUser.value && currentUserMember.value) {
      if (currentUserMember.value.gender === 'M' && !formData.groom_member_id) {
        formData.groom_member_id = currentUserMember.value.id
      } else if (currentUserMember.value.gender === 'F' && !formData.bride_member_id) {
        formData.bride_member_id = currentUserMember.value.id
      }
    }
  },
  { immediate: true }
)

// Watch groom_member_id - clear groom_name when member is selected
watch(
  () => formData.groom_member_id,
  (newValue) => {
    if (newValue) {
      formData.groom_name = ''
      if (formRef.value) {
        formRef.value.validateField('groom_name')
      }
    }
    if (formRef.value) {
      formRef.value.validateField('groom_member_id')
      formRef.value.validateField('bride_member_id')
    }
  }
)

// Watch bride_member_id - clear bride_name when member is selected
watch(
  () => formData.bride_member_id,
  (newValue) => {
    if (newValue) {
      formData.bride_name = ''
      if (formRef.value) {
        formRef.value.validateField('bride_name')
      }
    }
    if (formRef.value) {
      formRef.value.validateField('groom_member_id')
      formRef.value.validateField('bride_member_id')
    }
  }
)

// Watch dialog open/close to reset or populate form
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      resetForm()
      resetLoading() // Reset loading when dialog closes
    } else {
      // Refresh userInfo from localStorage
      const freshUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      userInfo.value = freshUserInfo
      
      // Fetch options when dialog opens
      await Promise.all([
        marriageServiceStore.fetchMemberOptions(),
        marriageServiceStore.fetchPastorOptions()
      ])
      
      if (props.marriageServiceData) {
        const data = props.marriageServiceData
        formData.groom_member_id = data.groom_member_id || ''
        formData.groom_name = data.groom_name || ''
        formData.bride_member_id = data.bride_member_id || ''
        formData.bride_name = data.bride_name || ''
        formData.guardians = Array.isArray(data.guardians) && data.guardians.length > 0
          ? data.guardians.map(g => ({
              firstname: g.firstname || '',
              lastname: g.lastname || '',
              middle_name: g.middle_name || '',
              phone_number: g.phone_number || '',
              address: g.address || ''
            }))
          : [
              {
                firstname: '',
                lastname: '',
                middle_name: '',
                phone_number: '',
                address: ''
              }
            ]
        formData.pastor_id = data.pastor_id ?? null
        formData.location = data.location || ''
        formData.marriage_date = data.marriage_date || ''
        formData.status = data.status || 'pending'
      } else {
        resetForm()
        
        // Auto-select current user if they are a member
        if (isMemberUser.value && currentUserMember.value) {
          if (currentUserMember.value.gender === 'M') {
            formData.groom_member_id = currentUserMember.value.id
          } else if (currentUserMember.value.gender === 'F') {
            formData.bride_member_id = currentUserMember.value.id
          }
        }
      }
    }
  }
)

// Reset form
const resetForm = () => {
  formData.groom_member_id = ''
  formData.groom_name = ''
  formData.bride_member_id = ''
  formData.bride_name = ''
  formData.guardians = [
    {
      firstname: '',
      lastname: '',
      middle_name: '',
      phone_number: '',
      address: ''
    }
  ]
  formData.pastor_id = null
  formData.location = ''
  formData.marriage_date = ''
  formData.status = 'pending'

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
    await formRef.value.validate()

    const actionText = isEditMode.value ? 'update' : 'create'
    const actionTitle = isEditMode.value ? 'Update' : 'Create'

    await ElMessageBox.confirm(
      `Are you sure you want to ${actionText} this marriage service?`,
      `Confirm ${actionTitle} Marriage Service`,
      {
        confirmButtonText: actionTitle,
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    loading.value = true
    loadingInstanceRef.value = ElLoading.service({
      target: '.marriage-service-dialog',
      text: 'Processing...',
      background: 'rgba(255, 255, 255, 0.8)',
    })

    const submitData = {
      groom_member_id: formData.groom_member_id ? formData.groom_member_id.trim() : null,
      groom_name: formData.groom_member_id ? null : (formData.groom_name ? formData.groom_name.trim() : null),
      bride_member_id: formData.bride_member_id ? formData.bride_member_id.trim() : null,
      bride_name: formData.bride_member_id ? null : (formData.bride_name ? formData.bride_name.trim() : null),
      guardians: formData.guardians.map(g => ({
        firstname: g.firstname.trim(),
        lastname: g.lastname.trim(),
        middle_name: g.middle_name ? g.middle_name.trim() : '',
        phone_number: g.phone_number.trim(),
        address: g.address.trim()
      })),
      pastor_id: formData.pastor_id,
      location: formData.location.trim(),
      marriage_date: formData.marriage_date,
      status: formData.status
    }

    emit('submit', submitData)
    
    // Safety timeout: reset loading after 30 seconds if still loading
    // This prevents loading state from getting stuck if parent component fails silently
    setTimeout(() => {
      if (loading.value) {
        resetLoading()
      }
    }, 30000)
  } catch (error) {
    // Reset loading state
    resetLoading()
    
    if (error !== 'cancel') {
      console.error('Validation failed or submission cancelled:', error)
      ElMessage.error('Please fill in all required fields correctly or operation cancelled.')
    }
  }
}

// Expose method to reset loading (can be called by parent component on API error)
const resetLoading = () => {
  loading.value = false
  // Close loading overlay if it exists
  if (loadingInstanceRef.value) {
    try {
      loadingInstanceRef.value.close()
    } catch (e) {
      // Ignore if already closed
    }
    loadingInstanceRef.value = null
  }
}

// Expose methods for parent component
defineExpose({
  resetLoading
})
</script>

<style scoped>
.marriage-service-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.marriage-service-dialog :deep(.el-form-item) {
  margin-bottom: 20px;
}

.marriage-service-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: #424242;
}

.marriage-service-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.marriage-service-dialog :deep(.el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.marriage-service-dialog :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.marriage-service-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.marriage-service-dialog :deep(.el-textarea__inner:hover) {
  border-color: #bdbdbd;
}

.marriage-service-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.marriage-service-dialog :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.marriage-service-dialog :deep(.el-date-editor.el-input) {
  width: 100%;
}

.guardians-table-wrapper {
  width: 100%;
}

.guardians-table {
  width: 100%;
}

.guardians-table :deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

.guardians-table :deep(.el-table__header-wrapper) {
  background-color: transparent;
}

.guardians-table :deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 500;
  color: #424242;
}

.guardians-table :deep(.el-table td) {
  padding: 8px 0;
}

.guardians-table :deep(.el-table .el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.guardians-table :deep(.el-table .el-input__wrapper:hover) {
  border-color: #bdbdbd;
}

.guardians-table :deep(.el-table .el-input.is-focus .el-input__wrapper) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 1px #14b8a6 inset;
}

.guardian-add-row {
  display: flex;
  justify-content: flex-end;
  padding: 8px 4px 0 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
  min-width: 100px;
}

.dialog-footer .el-button--primary {
  background-color: #14b8a6;
  border-color: #14b8a6;
}

.dialog-footer .el-button--primary:hover {
  background-color: #0d9488;
  border-color: #0d9488;
}

@media (max-width: 960px) {
  .marriage-service-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto !important;
    max-height: 90vh;
  }

  .marriage-service-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .marriage-service-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }

  .marriage-service-dialog :deep(.el-dialog__header) {
    padding: 16px;
  }

  .marriage-service-dialog :deep(.el-dialog__title) {
    font-size: 1rem;
  }

  .marriage-service-dialog :deep(.el-dialog__body) {
    padding: 12px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
  }

  .marriage-service-dialog :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .marriage-service-dialog :deep(.el-form-item__label) {
    font-size: 0.875rem;
    padding-bottom: 4px;
    line-height: 1.4;
  }

  .marriage-service-dialog :deep(.el-input),
  .marriage-service-dialog :deep(.el-select),
  .marriage-service-dialog :deep(.el-date-editor) {
    width: 100%;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
    padding: 12px 0;
  }

  .dialog-footer .el-button {
    width: 100%;
    min-width: auto;
    margin: 0;
  }

  .guardians-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .guardians-table :deep(.el-table) {
    font-size: 0.75rem;
    min-width: 600px;
  }

  .guardians-table :deep(.el-table th),
  .guardians-table :deep(.el-table td) {
    padding: 4px 2px;
    font-size: 0.75rem;
  }
}
</style>


