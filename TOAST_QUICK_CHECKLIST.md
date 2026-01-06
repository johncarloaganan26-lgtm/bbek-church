# Quick Reference: Toast Effects Implementation Checklist

## 🎯 Priority 1: Critical (Missing Core Feedback)

### Print Operations (6 locations)
```
[ ] WaterBaptism.vue - handlePrint (Line 455)
    Add: ElMessage.success('Print dialog opened...')
    
[ ] BurialService.vue - handlePrint (Line 490)
    Add: ElMessage.success('Print dialog opened...')
    
[ ] ChildDedication.vue - handlePrint (Line 499)
    Add: ElMessage.success('Print dialog opened...')
    
[ ] MarriageRecord.vue - handlePrint (Line 472)
    Add: ElMessage.success('Print dialog opened...')
    
[ ] EventsRecords.vue - handlePrint (Line 446)
    Add: ElMessage.success('Print dialog opened...')
    
[ ] Approvals.vue - handlePrint (Line 430)
    Add: ElMessage.success('Print dialog opened...')
```

### Authentication Operations
```
[ ] LoginDialog.vue - handleLogin (Line 191)
    Add: ElMessage.success('Welcome back, [User]!')
    
[ ] Navigation.vue - handleLogout (Line 527)
    Add: ElMessageBox.confirm() before logout
    Add: ElMessage.success('Logged out successfully')
```

### Delete Operations (Asymmetric Feedback)
```
[ ] Settings.vue - handleDelete (Line 479)
    Add: ElMessage.success('Announcement deleted successfully')
    
[ ] Home.vue - handleDeleteVideo (Line 828)
    Add: ElMessage.success('Video deleted successfully')
```

---

## 🎯 Priority 2: Important (Non-standard Implementation)

### Form Submissions (Replace v-alert with Toast)
```
[ ] PlanYourVisit.vue - handleSubmit (Line 318)
    Remove: v-alert component usage
    Replace with: ElMessage.success()
    
[ ] ScheduleChange.vue - handleSubmit (Line 501)
    Remove: v-alert component usage
    Replace with: ElMessage.success()
    
[ ] SendPrayer.vue - handleSubmit (Line 184)
    Remove: v-alert component usage
    Replace with: ElMessage.success()
```

### Incomplete Features
```
[ ] PasswordManagement.vue - requestNewLink (Line 390)
    Replace: TODO comment with actual implementation
    Add: ElMessageBox.prompt() for email
    Add: ElMessage.success() / error() feedback
```

---

## 🎯 Priority 3: Enhancement (Silent Success Acceptable)

### Service Data Loading
```
[ ] Transaction.vue - loadWaterBaptismServices (Line ~783)
    Current: Silent success (OK for initial load)
    Optional: Add toast for manual refresh only
    
[ ] Transaction.vue - loadMarriageServices (Line ~810)
    Current: Silent success (OK for initial load)
    Optional: Add toast for manual refresh only
    
[ ] Transaction.vue - loadBurialServices (Line ~841)
    Current: Silent success (OK for initial load)
    Optional: Add toast for manual refresh only
    
[ ] Transaction.vue - loadChildDedicationServices (Line ~866)
    Current: Silent success (OK for initial load)
    Optional: Add toast for manual refresh only
```

---

## 📋 Implementation Template

### Step 1: Add Import
```javascript
import { ElMessage, ElMessageBox } from 'element-plus'
```

### Step 2: Add Success Toast
```javascript
try {
  const result = await action()
  if (result.success) {
    ElMessage.success('Action completed successfully')  // ← ADD THIS
    // ... rest of success handling
  }
} catch (error) {
  ElMessage.error('Error message')
}
```

### Step 3: Add Error Toast (if missing)
```javascript
catch (error) {
  ElMessage.error('Failed to complete action')  // ← ADD IF MISSING
}
```

### Step 4: Test
- [ ] Success path shows toast
- [ ] Error path shows toast
- [ ] Toast auto-dismisses after 3-4 seconds
- [ ] No console-only error messages

---

## 🔧 Code Snippets for Copy-Paste

### Print Operation Success Toast
```javascript
try {
  const printWindow = window.open('', '', 'height=600,width=800')
  if (!printWindow) {
    ElMessage.error('Please allow popups to print documents')
    return
  }
  printWindow.document.write(`...`)
  printWindow.document.close()
  printWindow.print()
  ElMessage.success('Print dialog opened. Use your printer to complete printing.')
} catch (error) {
  ElMessage.error('Failed to open print dialog')
}
```

### Delete Operation Success Toast
```javascript
try {
  await ElMessageBox.confirm('Confirm deletion?', 'Delete', { type: 'warning' })
  const response = await axios.delete(`/api/resource/${id}`)
  if (response.data.success) {
    ElMessage.success('Item deleted successfully')
    setTimeout(() => refreshList(), 500)
  } else {
    ElMessage.error(response.data.message || 'Failed to delete')
  }
} catch (error) {
  if (error === 'cancel') return
  ElMessage.error('Error deleting item')
}
```

### Login Success Toast
```javascript
try {
  const response = await accountsStore.login(email, password)
  if (response.success) {
    ElMessage.success(`Welcome back, ${response.user?.firstname || 'User'}!`)
    setTimeout(() => { loginDialog.value = false }, 500)
  }
} catch (error) {
  ElMessage.error('Login failed. Please check your credentials.')
}
```

### Logout Success Toast
```javascript
try {
  await ElMessageBox.confirm('Logout?', 'Confirm', { type: 'warning' })
  await accountsStore.logout()
  ElMessage.success('Logged out successfully')
  router.push('/login')
} catch (error) {
  if (error === 'cancel') return
  ElMessage.error('Logout failed')
}
```

### Form Submission Success Toast
```javascript
try {
  const result = await formStore.submitForm(data)
  if (result.success) {
    ElMessage.success('Form submitted successfully!')
    setTimeout(() => form.reset(), 500)
  } else {
    ElMessage.error(result.error || 'Submission failed')
  }
} catch (error) {
  ElMessage.error('An error occurred. Please try again.')
}
```

---

## ✅ Verification Checklist

After implementing each fix, verify:

### Toast Display
- [ ] Toast appears immediately after action
- [ ] Toast is visible and readable
- [ ] Toast message is clear and helpful
- [ ] Toast auto-dismisses after timeout

### User Experience
- [ ] No error messages to console only
- [ ] User gets feedback for all actions
- [ ] Success and error both have feedback
- [ ] No confusing silent operations

### Code Quality
- [ ] No v-alert used for action feedback
- [ ] All async operations have try/catch
- [ ] ElMessage imported in component
- [ ] Consistent with other components

### Testing
- [ ] Success path tested (✓ toast shows)
- [ ] Error path tested (✓ toast shows)
- [ ] Edge cases tested (network error, validation error)
- [ ] Multiple rapid actions tested (no toast overlap issues)

---

## 📊 Progress Tracking

### Priority 1: Critical (8 items)
- [ ] WaterBaptism.vue print
- [ ] BurialService.vue print
- [ ] ChildDedication.vue print
- [ ] MarriageRecord.vue print
- [ ] EventsRecords.vue print
- [ ] Approvals.vue print
- [ ] LoginDialog.vue login
- [ ] Navigation.vue logout

**Subtotal P1: 8/8**

### Priority 2: Important (5 items)
- [ ] Settings.vue delete
- [ ] Home.vue delete
- [ ] PlanYourVisit.vue refactor
- [ ] ScheduleChange.vue refactor
- [ ] SendPrayer.vue refactor
- [ ] PasswordManagement.vue recovery

**Subtotal P2: 6/6**

### Priority 3: Enhancement (4 items)
- [ ] Transaction.vue water baptism (optional)
- [ ] Transaction.vue marriage (optional)
- [ ] Transaction.vue burial (optional)
- [ ] Transaction.vue child dedication (optional)

**Subtotal P3: 0-4 (Optional)**

---

## 📝 Notes & Special Cases

### Copy to Clipboard
While we didn't find explicit copy operations, if you add them:
```javascript
try {
  await navigator.clipboard.writeText(value)
  ElMessage.success('Copied to clipboard!')
} catch {
  ElMessage.error('Failed to copy to clipboard')
}
```

### Popup Blocked
Some browsers block popups. Handle gracefully:
```javascript
const printWindow = window.open('...', '', '...')
if (!printWindow || printWindow.closed) {
  ElMessage.error('Please allow popups to print')
}
```

### Silent Operations (OK without toast)
- Initial page load (data loading)
- Auto-saving in background
- Fetching data with loading spinner
- Navigation (unless specific action)

### Operations That NEED toast
- User-initiated actions (print, delete, save)
- Authentication (login, logout)
- Form submissions
- Manual refresh/reload
- Destructive operations (delete)

---

## 🎓 Learning Resources

### Element Plus Components
- **ElMessage:** Simple toast notification
  - `success()`, `error()`, `warning()`, `info()`
  - Auto-dismisses after duration
  - Close button option

- **ElMessageBox:** Confirmation dialogs
  - `confirm()` - Yes/No dialog
  - `alert()` - Simple alert
  - `prompt()` - Input dialog

### When to Use What
| Operation | Component | Example |
|-----------|-----------|---------|
| Confirm action | ElMessageBox.confirm() | "Delete item?" |
| Get input | ElMessageBox.prompt() | "Enter email for reset" |
| Simple success | ElMessage.success() | "Saved!" |
| Simple error | ElMessage.error() | "Failed to save" |
| Show warning | ElMessage.warning() | "This cannot be undone" |

---

## 🚀 Next Steps

1. **Start with Priority 1** - These are critical user feedback gaps
2. **Test each fix** - Verify toast appears correctly
3. **Move to Priority 2** - Standardize form feedback
4. **Consider Priority 3** - Nice-to-have enhancements
5. **Create coding standards** - Document toast requirements for future code

---

## 📞 Common Questions

**Q: Should initial data load show success toast?**
A: No. Only show toast for user-initiated actions. Page load is assumed to be automatic.

**Q: How long should toast stay visible?**
A: Success 2-3s, Error 3-4s, Info/Warning 3s. Use `duration` property if different.

**Q: What if action completes too fast?**
A: Toast will still show and auto-dismiss. It's fine if user barely sees it on very fast operations.

**Q: Should I show toast for every small action?**
A: No. Show for important operations (delete, save, login). Skip for toggles, filter changes.

**Q: Can I customize toast appearance?**
A: Yes, pass options object: `ElMessage.success({ message: '...', duration: 5000, showClose: true })`

---

**Last Updated:** January 6, 2026  
**Status:** Analysis Complete - Ready for Implementation  
**Priority:** 19 items requiring toast feedback fixes

