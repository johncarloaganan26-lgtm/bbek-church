<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Department Details"
    width="600px"
    :close-on-click-modal="true"
    :show-close="true"
    class="view-department-dialog"
  >
    <el-descriptions :column="1" border v-if="departmentData">
      <el-descriptions-item label="Department ID">
        {{ departmentData.department_id || '-' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="Department Name">
        <el-tag type="primary" size="large">
          {{ departmentData.department_name || '-' }}
        </el-tag>
      </el-descriptions-item>
      
      <el-descriptions-item label="Status">
        <el-tag :type="departmentData.status === 'active' ? 'success' : 'info'" size="small">
          {{ departmentData.status === 'active' ? 'Active' : 'Not Active' }}
        </el-tag>
      </el-descriptions-item>
      
      <el-descriptions-item label="Date Created">
        {{ departmentData.date_created ? new Date(departmentData.date_created).toLocaleString() : '-' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="Department President">
        <div v-if="presidentInfo" class="member-info">
          <el-avatar :size="40" class="mr-2">
            {{ presidentInfo.initials }}
          </el-avatar>
          <div class="member-details">
            <div class="member-name">{{ presidentInfo.name }}</div>
            <div class="member-position">{{ presidentInfo.position }}</div>
          </div>
        </div>
        <span v-else class="text-grey">No President assigned</span>
      </el-descriptions-item>
      
      <el-descriptions-item label="Department Officers">
        <div v-if="officersList.length > 0" class="officers-grid">
          <div 
            v-for="officer in officersList" 
            :key="officer.id"
            class="officer-card"
          >
            <el-avatar :size="32" class="mr-2">
              {{ officer.initials }}
            </el-avatar>
            <div class="officer-details">
              <div class="officer-name">{{ officer.name }}</div>
              <div class="officer-position">{{ officer.position }}</div>
            </div>
          </div>
        </div>
        <span v-else class="text-grey">No Officers assigned</span>
      </el-descriptions-item>
    </el-descriptions>
    
    <div v-else class="text-center py-4">
      <el-empty description="No department data available" />
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)" size="large">
          Close
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useDepartmentsStore } from '@/stores/ChurchRecords/departmentsStore'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  departmentData: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Get member options from store for resolving names and positions
const departmentsStore = useDepartmentsStore()
const memberOptions = computed(() => departmentsStore.memberOptions)

// Get member info by ID
const getMemberInfo = (memberId) => {
  if (!memberId) return null
  const member = memberOptions.value.find(m => m.id === memberId || m.member_id === memberId)
  if (!member) return null
  
  const initials = getInitials(member.name)
  return {
    id: member.id || member.member_id,
    name: member.name,
    position: member.position || '-',
    initials
  }
}

// Get president info
const presidentInfo = computed(() => {
  if (!props.departmentData?.member_id) return null
  return getMemberInfo(props.departmentData.member_id)
})

// Parse and resolve officers from joined_members JSON string
const officersList = computed(() => {
  if (!props.departmentData?.joined_members) {
    return []
  }
  
  try {
    const parsed = typeof props.departmentData.joined_members === 'string'
      ? JSON.parse(props.departmentData.joined_members)
      : props.departmentData.joined_members
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .map(id => {
          const info = getMemberInfo(id)
          return info ? info : { id, name: id, position: '-', initials: '?' }
        })
    }
    return []
  } catch (e) {
    console.error('Error parsing joined_members:', e)
    return []
  }
})

// Get initials for avatar
const getInitials = (fullname) => {
  if (!fullname || fullname === '?') return '?'
  const parts = fullname.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return fullname.substring(0, 2).toUpperCase()
}
</script>

<style scoped>
.view-department-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.view-department-dialog :deep(.el-descriptions) {
  margin-top: 10px;
}

.view-department-dialog :deep(.el-descriptions-item__label) {
  width: 160px;
  font-weight: 600;
  color: #606266;
}

.member-info,
.officer-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-details,
.officer-details {
  display: flex;
  flex-direction: column;
}

.member-name,
.officer-name {
  font-weight: 500;
  color: #303133;
}

.member-position,
.officer-position {
  font-size: 12px;
  color: #909399;
}

.officers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
}

.text-grey {
  color: #909399;
}

.mr-2 {
  margin-right: 8px;
}

.text-center {
  text-align: center;
}

.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
  min-width: 100px;
}
</style>
