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
          <el-avatar :size="48" class="mr-3 officer-avatar">
            <img v-if="presidentInfo.image" :src="resolveImage(presidentInfo.image, '/img/officers/default.png')" :alt="presidentInfo.name" />
            <span v-else>{{ presidentInfo.initials }}</span>
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
            <el-avatar :size="40" class="mr-3 officer-avatar">
              <img v-if="officer.image" :src="resolveImage(officer.image, '/img/officers/default.png')" :alt="officer.name" />
              <span v-else>{{ officer.initials }}</span>
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

// Get all members assigned to this department
const departmentalMembers = computed(() => {
  if (!props.departmentData?.department_id) return []
  return memberOptions.value.filter(m => m.department_id === props.departmentData.department_id)
})

// Get president info
const presidentInfo = computed(() => {
  const president = departmentalMembers.value.find(m => m.position?.toLowerCase() === 'president')
  if (!president) return null
  
  return {
    id: president.member_id || president.id,
    name: president.name || `${president.firstname} ${president.lastname}`.trim(),
    position: (president.position || '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    image: president.profile_image || president.profileImage || president.image,
    initials: getInitials(president.name || `${president.firstname} ${president.lastname}`)
  }
})

// Get officers list (excluding president and regular members)
const officersList = computed(() => {
  const nonOfficerPositions = ['member', 'none', 'president']
  return departmentalMembers.value
    .filter(m => !nonOfficerPositions.includes(m.position?.toLowerCase()))
    .map(m => ({
      id: m.member_id || m.id,
      name: m.name || `${m.firstname} ${m.lastname}`.trim(),
      position: (m.position || '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      image: m.profile_image || m.profileImage || m.image,
      initials: getInitials(m.name || `${m.firstname} ${m.lastname}`)
    }))
})

// Get initials for avatar
const getInitials = (fullname) => {
  if (!fullname || fullname === '?') return '?'
  const parts = fullname.split(' ')
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (fullname[0] || '?').toUpperCase()
}

// Image helper from other components
const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return ''
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath
  
  const parts = imagePath.split('/')
  const filename = parts.pop()
  if (!filename) return imagePath
  const encodedFilename = encodeURIComponent(filename)
  return (parts.length > 0 ? parts.join('/') + '/' : '') + encodedFilename
}

// Image resolver
const resolveImage = (image, fallback) => {
  if (!image) return getImageUrl(fallback)
  
  if (typeof image === 'string') {
    if (image.startsWith('data:') || image.startsWith('http')) {
      return image
    }
    return getImageUrl(image)
  }
  
  // If it's a buffer object (from backend)
  if (typeof image === 'object' && image && image.type === 'Buffer' && Array.isArray(image.data)) {
    return `data:image/jpeg;base64,${btoa(String.fromCharCode.apply(null, image.data))}`
  }
  
  return getImageUrl(fallback)
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
