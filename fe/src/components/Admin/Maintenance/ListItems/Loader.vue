<template>
  <PageLoader
    :model-value="loading"
    viewport
    message="Processing Data..."
    subtitle="Please wait while we update church records"
  />
</template>

<script setup>
import { watch, nextTick, onBeforeUnmount } from 'vue'
import PageLoader from '@/components/Common/PageLoader.vue'

const props = defineProps({
  loading: {
    type: Boolean,
    required: true,
    default: false
  }
})

// Function to restore body overflow
const restoreBodyOverflow = () => {
  if (document.body) {
    // Directly clear overflow and paddingRight inline styles
    // Setting to empty string removes the property from inline style
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    // Also try removing via removeProperty as a backup
    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('padding-right')
  }
  if (document.documentElement) {
    document.documentElement.style.overflow = ''
    document.documentElement.style.removeProperty('overflow')
  }
}

// Watch for loading state changes and restore body overflow when dialog closes
watch(() => props.loading, async (newVal, oldVal) => {
  if (!newVal && oldVal) {
    // When loading changes from true to false, restore body overflow multiple times
    // to catch any delayed style changes from Element Plus
    restoreBodyOverflow()
    
    await nextTick()
    setTimeout(() => {
      restoreBodyOverflow()
    }, 100)
    
    setTimeout(() => {
      restoreBodyOverflow()
    }, 300)
    
    setTimeout(() => {
      restoreBodyOverflow()
    }, 500)
  }
})

// Ensure cleanup on component unmount
onBeforeUnmount(() => {
  restoreBodyOverflow()
})
</script>

<style scoped>
.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.loader-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.loader-text {
  margin: 0;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

:deep(.el-dialog__header) {
  display: none;
}

:deep(.el-dialog__body) {
  padding: 0;
}
</style>