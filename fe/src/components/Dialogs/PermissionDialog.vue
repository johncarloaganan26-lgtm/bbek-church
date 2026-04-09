<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="`Manage Permissions: ${account?.email || ''}`"
    width="600px"
    class="permission-dialog"
    destroy-on-close
  >
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <div class="mt-2">Saving permissions...</div>
    </div>

    <div v-else>
      <p class="text-body-2 text-grey-darken-1 mb-4">
        Select the modules this staff member is authorized to access. 
        Admin accounts always have full access.
      </p>

      <v-divider class="mb-4"></v-divider>

      <div class="permissions-list">
        <v-row>
          <v-col v-for="category in permissionGroups" :key="category.title" cols="12">
            <h3 class="text-subtitle-1 font-weight-bold mb-2 text-primary">{{ category.title }}</h3>
            <v-card variant="outlined" class="pa-3">
              <div v-for="module in category.items" :key="module.key" class="module-permission-item mb-4">
                <!-- Main Module Checkbox -->
                <div class="d-flex align-center">
                  <v-checkbox
                    v-model="selectedPermissions"
                    :label="module.label"
                    :value="module.key"
                    density="compact"
                    hide-details
                    color="primary"
                    class="font-weight-bold"
                  ></v-checkbox>
                </div>
                
                <!-- Action Sub-permissions (Only visible if module is checked) -->
                <div v-if="selectedPermissions.includes(module.key) && module.actions" class="pl-8 pb-2 d-flex flex-wrap gap-2 mt-1">
                  <v-checkbox
                    v-for="action in module.actions"
                    :key="`${module.key}:${action.key}`"
                    v-model="selectedPermissions"
                    :label="action.label"
                    :value="`${module.key}:${action.key}`"
                    density="compact"
                    hide-details
                    color="secondary"
                    class="action-checkbox"
                  ></v-checkbox>
                </div>
                <v-divider v-if="category.items.indexOf(module) < category.items.length - 1" class="mt-2"></v-divider>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">Cancel</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          Save Permissions
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  account: Object
})

const emit = defineEmits(['update:modelValue', 'save'])

const loading = ref(false)
const selectedPermissions = ref([])

const permissionGroups = [
  {
    title: 'Overview',
    items: [
      { 
        key: 'Dashboard', 
        label: 'Dashboard Overview',
        actions: [
          { key: 'ViewAllStats', label: 'View All Statistics' },
          { key: 'ViewRecentActivity', label: 'View Recent Activity' },
          { key: 'QuickActions', label: 'Use Quick Actions' }
        ]
      }
    ]
  },
  {
    title: 'Church Records',
    items: [
      { 
        key: 'MemberRecord', 
        label: 'Member Records',
        actions: [
          { key: 'Create', label: 'Add' },
          { key: 'Edit', label: 'Edit' },
          { key: 'Delete', label: 'Archive' },
          { key: 'Export', label: 'Export/Print' }
        ]
      },
      { 
        key: 'EventsRecords', 
        label: 'Events Records',
        actions: [
          { key: 'Create', label: 'Add' },
          { key: 'Edit', label: 'Edit' },
          { key: 'Delete', label: 'Delete' }
        ]
      },
      { 
        key: 'Ministries', 
        label: 'Ministries',
        actions: [
          { key: 'Create', label: 'Add' },
          { key: 'Edit', label: 'Edit' },
          { key: 'Delete', label: 'Delete' }
        ]
      },
      { 
        key: 'TithesOfferings', 
        label: 'Tithes & Offerings',
        actions: [
          { key: 'Create', label: 'Record' },
          { key: 'Edit', label: 'Edit' },
          { key: 'Delete', label: 'Delete' },
          { key: 'Export', label: 'Export Report' }
        ]
      },
      { 
        key: 'Departments', 
        label: 'Departments',
        actions: [
          { key: 'Create', label: 'Add' },
          { key: 'Edit', label: 'Edit' },
          { key: 'Delete', label: 'Delete' }
        ]
      }
    ]
  },
  {
    title: 'Services',
    items: [
      { 
        key: 'ServicesGroup', 
        label: 'Services Management',
        actions: [
          { key: 'Create', label: 'Add New Record' },
          { key: 'Edit', label: 'Edit Details' },
          { key: 'Process', label: 'Approve/Schedule/Complete' },
          { key: 'Promote', label: 'Promote/Graduate' },
          { key: 'Delete', label: 'Delete/Archive' },
          { key: 'Export', label: 'Export/Certificates' },
          { key: 'Settings', label: 'Manual Completion Override' },
          { key: 'ManageAvailability', label: 'Manage Available Slots' }
        ]
      }
    ]
  },
  {
    title: 'Communication',
    items: [
      { 
        key: 'Messages', 
        label: 'Messages',
        actions: [
          { key: 'Delete', label: 'Delete' },
          { key: 'Reply', label: 'Reply' }
        ]
      }
    ]
  },
  {
    title: 'Maintenance',
    items: [
      { 
        key: 'Announcement', 
        label: 'Announcements',
        actions: [
          { key: 'Create', label: 'Create' },
          { key: 'Edit', label: 'Edit' },
          { key: 'Delete', label: 'Delete' }
        ]
      },
      { 
        key: 'Archive', 
        label: 'Archives',
        actions: [
          { key: 'Restore', label: 'Restore Records' },
          { key: 'DeletePermanently', label: 'Permanent Delete' },
          { key: 'Export', label: 'Export List' }
        ]
      },
      { 
        key: 'AuditTrail', 
        label: 'Audit Trail',
        actions: [
          { key: 'Export', label: 'Export Logs' }
        ]
      },
      { 
        key: 'ContentManagement', 
        label: 'Content Management (CMS)',
        actions: [
          { key: 'EditContent', label: 'Update Website' }
        ]
      }
    ]
  }
]

// Initialize permissions when account is passed
watch(() => props.account, (newAccount) => {
  if (newAccount) {
    if (newAccount.permissions) {
      try {
        const perms = typeof newAccount.permissions === 'string' 
          ? JSON.parse(newAccount.permissions) 
          : newAccount.permissions
        selectedPermissions.value = Array.isArray(perms) ? perms : []
      } catch (e) {
        console.error('Failed to parse permissions:', e)
        selectedPermissions.value = []
      }
    } else {
      selectedPermissions.value = []
    }
  }
}, { immediate: true })

const handleSave = async () => {
  loading.value = true
  try {
    emit('save', {
      acc_id: props.account.acc_id || props.account.id,
      permissions: selectedPermissions.value
    })
  } catch (error) {
    console.error('Error in handleSave:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.permission-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  max-height: 60vh;
  overflow-y: auto;
}

.permissions-list {
  padding: 4px;
}

.module-permission-item {
  border-radius: 4px;
}

.action-checkbox {
  min-width: 120px;
}

:deep(.action-checkbox .v-label) {
  font-size: 0.85rem !important;
  color: #666;
}

.gap-2 {
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
