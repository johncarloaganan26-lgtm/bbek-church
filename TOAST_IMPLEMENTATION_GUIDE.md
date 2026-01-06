# Toast Effects Implementation Guide - Detailed Code Examples

## Quick Reference: Standard Toast Pattern

```javascript
// IMPORT at top of component
import { ElMessage } from 'element-plus'

// SUCCESS - Basic
ElMessage.success('Action completed successfully')

// SUCCESS - With details
ElMessage.success({
  message: 'Password reset link sent',
  duration: 3000,  // Optional: auto-close after 3 seconds
  showClose: true
})

// ERROR - Basic
ElMessage.error('Operation failed')

// ERROR - With details
ElMessage.error({
  message: 'Failed to save data. Please try again.',
  duration: 4000,
  showClose: true
})

// WARNING
ElMessage.warning('Please confirm this action')

// INFO
ElMessage.info('Processing your request...')
```

---

## Problem 1: Print Operations (6 Locations)

### ❌ CURRENT CODE (Missing Toast)

```javascript
// WaterBaptism.vue, BurialService.vue, etc.
const handlePrint = () => {
  const printWindow = window.open('', '', 'height=600,width=800')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Document</title>
    </head>
    <body>
      <!-- table data -->
    </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
  // ❌ NO FEEDBACK - User doesn't know if print succeeded
}
```

### ✅ FIXED CODE (With Toast)

```javascript
import { ElMessage } from 'element-plus'

const handlePrint = () => {
  try {
    const printWindow = window.open('', '', 'height=600,width=800')
    
    if (!printWindow) {
      // Popup blocked
      ElMessage.error('Please allow popups to print documents')
      return
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Document</title>
      </head>
      <body>
        <!-- table data -->
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    
    // ✓ ADD SUCCESS TOAST
    ElMessage.success('Print dialog opened. Use your printer to complete printing.')
    
  } catch (error) {
    console.error('Print error:', error)
    // ✓ ADD ERROR TOAST
    ElMessage.error('Failed to open print dialog. Please try again.')
  }
}
```

### 📍 Files Requiring This Fix
- `WaterBaptism.vue` (Line 455)
- `BurialService.vue` (Line 490)
- `ChildDedication.vue` (Line 499)
- `MarriageRecord.vue` (Line 472)
- `EventsRecords.vue` (Line 446)
- `Approvals.vue` (Line 430)

---

## Problem 2: Login Operation

### ❌ CURRENT CODE (Missing Success Toast)

```javascript
// LoginDialog.vue
const handleLogin = async () => {
  try {
    await accountsStore.login(loginForm.email, loginForm.password)
    
    // ❌ NO SUCCESS TOAST - Just closes silently
    loginDialog.value = false
    
  } catch (error) {
    console.error('Login error:', error)
    // Only shows error, no success feedback
  }
}
```

### ✅ FIXED CODE (With Toast)

```javascript
import { ElMessage } from 'element-plus'

const handleLogin = async () => {
  try {
    const response = await accountsStore.login(
      loginForm.email, 
      loginForm.password
    )
    
    if (response.success || response) {
      // ✓ ADD SUCCESS TOAST
      ElMessage.success({
        message: `Welcome back, ${response.user?.firstname || 'User'}!`,
        duration: 2000
      })
      
      // Small delay so user sees toast before closing
      setTimeout(() => {
        loginDialog.value = false
      }, 500)
    }
    
  } catch (error) {
    console.error('Login error:', error)
    // Error toast already shown by axios interceptor
  }
}
```

### 📍 File
- `LoginDialog.vue` (Line 191)

---

## Problem 3: Logout Operations (Inconsistent)

### ❌ CURRENT CODE - Navigation.vue (Missing Toast)

```javascript
// Navigation.vue
const handleLogout = async () => {
  try {
    await accountsStore.logout()
    
    // ❌ NO CONFIRMATION, NO TOAST
    // User logs out silently
    
  } catch (error) {
    console.error('Logout error:', error)
    ElMessage.error('Failed to logout')
  }
}
```

### ✅ FIXED CODE (With Confirmation & Toast)

```javascript
import { ElMessage, ElMessageBox } from 'element-plus'

const handleLogout = async () => {
  try {
    // ✓ ADD CONFIRMATION DIALOG
    await ElMessageBox.confirm(
      'Are you sure you want to logout?',
      'Confirm Logout',
      {
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    // User confirmed, proceed with logout
    await accountsStore.logout()
    
    // ✓ ADD SUCCESS TOAST
    ElMessage.success('You have been logged out successfully')
    
    // Navigate to login
    router.push('/login')
    
  } catch (error) {
    if (error === 'cancel') {
      // User clicked Cancel - no message needed
      return
    }
    
    console.error('Logout error:', error)
    // ✓ ADD ERROR TOAST
    ElMessage.error('Failed to logout. Please try again.')
  }
}
```

### 📍 Files Requiring This Fix
- `Navigation.vue` (Line 527)
- AdminDashboard.vue already has this implemented correctly (Line 330)

---

## Problem 4: Delete Operations (Asymmetric Feedback)

### ❌ CURRENT CODE - Settings.vue (Missing Success Toast)

```javascript
// Settings.vue
const handleDelete = async (announcement) => {
  try {
    await ElMessageBox.confirm(
      `Delete announcement "${announcement.title}"?`,
      'Confirm Delete',
      { type: 'warning' }
    )
    
    const response = await axios.delete(
      `/announcements/deleteAnnouncement/${announcement.announcement_id}`
    )
    
    if (response.data.success) {
      // ❌ NO SUCCESS TOAST - Silent deletion
      fetchAnnouncements()
      
    } else {
      // ✓ HAS ERROR TOAST (Inconsistent)
      ElMessage.error(response.data.message || 'Failed to delete')
    }
    
  } catch (error) {
    // ✓ HAS ERROR TOAST
    ElMessage.error('Error deleting announcement')
  }
}
```

### ✅ FIXED CODE (Symmetric Feedback)

```javascript
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const handleDelete = async (announcement) => {
  try {
    await ElMessageBox.confirm(
      `Delete announcement "${announcement.title}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    const response = await axios.delete(
      `/announcements/deleteAnnouncement/${announcement.announcement_id}`
    )
    
    if (response.data.success) {
      // ✓ ADD SUCCESS TOAST
      ElMessage.success({
        message: 'Announcement deleted successfully',
        duration: 2000
      })
      
      // Small delay so user sees toast before refresh
      setTimeout(() => {
        fetchAnnouncements()
      }, 500)
      
    } else {
      // ✓ ERROR TOAST (already present)
      ElMessage.error(response.data.message || 'Failed to delete')
    }
    
  } catch (error) {
    if (error === 'cancel') {
      // User clicked Cancel - no message needed
      return
    }
    
    console.error('Delete error:', error)
    // ✓ ERROR TOAST (already present)
    ElMessage.error('Error deleting announcement')
  }
}
```

### 📍 Files Requiring This Fix (Same Pattern)
- `Settings.vue` - handleDelete (Line 479)
- `Home.vue` - handleDeleteVideo (Line 828)

---

## Problem 5: Refactor v-alert to Toast (Form Submissions)

### ❌ CURRENT CODE - PlanYourVisit.vue (Non-standard v-alert)

```vue
<!-- Template -->
<el-alert
  v-if="alertMessage.show"
  :title="alertMessage.title"
  :type="alertMessage.type"
  :description="alertMessage.description"
  closable
></el-alert>

<script setup>
// Script
const alertMessage = ref({
  show: false,
  type: 'success',
  title: '',
  description: ''
})

const handleSubmit = async () => {
  // ... validation ...
  
  await formsStore.createForm(payload)
  
  // ⚠️ NON-STANDARD - Using v-alert instead of ElMessage
  alertMessage.value = {
    show: true,
    type: 'success',
    title: 'Success!',
    description: 'Message sent successfully!'
  }
  
  setTimeout(() => {
    alertMessage.value.show = false
  }, 5000)
}
</script>
```

### ✅ FIXED CODE (Standard Toast)

```vue
<!-- REMOVE the v-alert component -->
<!-- No longer needed -->

<script setup>
import { ElMessage } from 'element-plus'
import { useFormsStore } from '@/stores/formsStore'

const formsStore = useFormsStore()

const handleSubmit = async () => {
  try {
    // ... validation ...
    
    const result = await formsStore.createForm(payload)
    
    if (result.success) {
      // ✓ STANDARD TOAST
      ElMessage.success({
        message: 'Message sent successfully! We will get back to you soon.',
        duration: 3000
      })
      
      // Reset form after brief delay
      setTimeout(() => {
        formData.value = { /* reset */ }
      }, 500)
    } else {
      // ✓ ERROR TOAST
      ElMessage.error(result.error || 'Failed to send message')
    }
    
  } catch (error) {
    console.error('Submission error:', error)
    // ✓ ERROR TOAST
    ElMessage.error('An error occurred. Please try again.')
  }
}
</script>
```

### 📍 Files Requiring This Refactor
- `PlanYourVisit.vue` (Line 353-377)
- `ScheduleChange.vue` (Line 501-564)
- `SendPrayer.vue` (Line 184-241)

---

## Problem 6: Silent Service Data Loading

### ❌ CURRENT CODE - Transaction.vue (No Success Toast)

```javascript
// Load water baptism services
const loadWaterBaptismServices = async () => {
  try {
    const response = await axios.get(
      `/services/water-baptism/getWaterBaptismServicesByMemberId/${memberId.value}`
    )
    
    if (response.data.success) {
      // ❌ NO TOAST - Silent success
      waterBaptismServices.value = response.data.data || []
    } else {
      // ✓ Has error handling
      waterBaptismServices.value = []
    }
    
  } catch (error) {
    console.error('Error fetching water baptism services:', error)
    waterBaptismServices.value = []
  }
}

// Same pattern for marriage, burial, child dedication services...
```

### ✅ FIXED CODE (With Optional Toast)

```javascript
import { ElMessage } from 'element-plus'

// For initial load - silent is okay
const loadWaterBaptismServices = async () => {
  try {
    const response = await axios.get(
      `/services/water-baptism/getWaterBaptismServicesByMemberId/${memberId.value}`
    )
    
    if (response.data.success) {
      waterBaptismServices.value = response.data.data || []
      // For initial load: no toast (data loads with page)
    } else {
      waterBaptismServices.value = []
    }
    
  } catch (error) {
    console.error('Error fetching water baptism services:', error)
    waterBaptismServices.value = []
    // Only show error for failures
    ElMessage.error('Failed to load water baptism services')
  }
}

// For manual refresh - show success
const refreshWaterBaptismServices = async () => {
  try {
    const response = await axios.get(
      `/services/water-baptism/getWaterBaptismServicesByMemberId/${memberId.value}`
    )
    
    if (response.data.success) {
      waterBaptismServices.value = response.data.data || []
      // ✓ Show success for manual refresh
      ElMessage.success('Services loaded successfully')
    } else {
      waterBaptismServices.value = []
    }
    
  } catch (error) {
    console.error('Error fetching water baptism services:', error)
    waterBaptismServices.value = []
    // ✓ Show error
    ElMessage.error('Failed to load services')
  }
}
```

### 📍 File
- `Transaction.vue` (Multiple locations)

---

## Problem 7: Incomplete Password Recovery

### ❌ CURRENT CODE - PasswordManagement.vue (TODO Only)

```javascript
// Line 390
const requestNewLink = () => {
  // TODO: Navigate to forgot password request page or show dialog
}
```

### ✅ FIXED CODE (Complete Implementation)

```javascript
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

const requestNewLink = async () => {
  try {
    // Show confirmation dialog
    const { value: email } = await ElMessageBox.prompt(
      'Please enter your email address to receive a new password reset link:',
      'Request New Password Link',
      {
        confirmButtonText: 'Send Link',
        cancelButtonText: 'Cancel',
        inputType: 'email',
        inputPlaceholder: 'your.email@example.com'
      }
    )
    
    if (!email) return
    
    // Send request
    const result = await accountsStore.forgotPassword(email)
    
    if (result.success) {
      // ✓ SUCCESS TOAST
      ElMessage.success({
        message: 'Password reset link has been sent to your email',
        duration: 3000
      })
      
      // Close the password management component/navigate
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      // ✓ ERROR TOAST
      ElMessage.error(result.error || 'Failed to send reset link')
    }
    
  } catch (error) {
    if (error === 'cancel') {
      // User clicked Cancel - no message
      return
    }
    
    console.error('Request new link error:', error)
    // ✓ ERROR TOAST
    ElMessage.error('An error occurred. Please try again.')
  }
}
```

### 📍 File
- `PasswordManagement.vue` (Line 390)

---

## Best Practices Summary

### ✅ DO
1. Show success toast for user-initiated actions
2. Show error toast with descriptive message
3. Import ElMessage at component top
4. Use try/catch for async operations
5. Provide feedback immediately after action
6. Use consistent toast library (ElMessage)
7. Handle edge cases (popup blocked, network errors)

### ❌ DON'T
1. Log to console instead of showing toast
2. Use v-alert for action feedback
3. Show silent failures
4. Mix different toast libraries
5. Forget error handling
6. Make users guess if action succeeded
7. Show success/error on same operation

### Toast Duration Guidelines
- Success: 2-3 seconds (short, positive action)
- Error: 3-4 seconds (user needs to read error)
- Warning: 3-4 seconds (needs attention)
- Info: 2-3 seconds (supplementary information)

---

## Testing Each Fix

```javascript
// Test success path
handleAction(successData)  // Should show success toast

// Test error path
handleAction(invalidData)  // Should show error toast

// Test async operations
async handleSubmit() {
  try {
    const result = await apiCall()
    if (result.success) {
      ElMessage.success('✓ Success!')  // Verify this displays
    }
  } catch (error) {
    ElMessage.error('✗ Error!')  // Verify this displays
  }
}

// Test user experience
// - User should see immediate feedback
// - Toast should disappear after timeout
// - Toast should be readable and clear
// - No console-only messages
```

---

## Checklist for Implementation

- [ ] Import ElMessage in component
- [ ] Add success toast to success paths
- [ ] Add error toast to error paths
- [ ] Remove v-alert feedback components
- [ ] Test success scenario
- [ ] Test error scenario
- [ ] Test edge cases (network error, validation error)
- [ ] Verify toast appears/disappears correctly
- [ ] Check toast message clarity
- [ ] Verify component works with other feedback systems

---

## Related Elements Library Docs
- **ElMessage:** https://element-plus.org/en-US/component/message.html
- **ElMessageBox:** https://element-plus.org/en-US/component/message-box.html
- **ElNotification:** https://element-plus.org/en-US/component/notification.html (alternative)

