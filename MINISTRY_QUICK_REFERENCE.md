# Ministry Access - Quick Reference

## What's Allowed for Each User Type

### 👤 Visitors (Not Logged In)
- ✅ View all ministries on the ministries page
- ✅ View ministry details ("Learn More" page)
- ✅ See all ministry information: name, description, schedule, leader, department
- ❌ Cannot join ministries
- ❌ Cannot access admin panel

### 👥 Registered Members (Logged In)
- ✅ View all ministries on the ministries page
- ✅ View ministry details ("Learn More" page)
- ✅ See all ministry information
- ✅ **Submit request to join ministries**
- ✅ View their join request status (Pending/Approved/Rejected)
- ❌ Cannot create/edit/delete ministries

### 👑 Admins/Church Leaders (Logged In)
- ✅ View all ministries
- ✅ View ministry details
- ✅ **Create new ministries**
- ✅ **Edit existing ministries**
- ✅ **Delete/Archive ministries**
- ✅ **Approve/Reject ministry join requests**
- ✅ Export ministries to Excel
- ✅ Print ministry reports

---

## User Journey

### For a Visitor:
```
Landing Page
    ↓
See "Our Departments" section (Adult, Ladies, Youth)
    ↓
Click "Learn More"
    ↓
See Ministry Details Page
    ↓
Click "Join Us" button
    ↓
See "Become a Member" button (instead of Join)
    ↓
Click "Become a Member"
    ↓
Redirected to Accept Jesus Christ / Membership page
```

### For a Member:
```
Landing Page
    ↓
See "Our Departments" section
    ↓
Click "Learn More"
    ↓
See Ministry Details Page
    ↓
Click "Join Us" button
    ↓
Submit Join Request
    ↓
Status: "Pending Request" (Waiting for admin approval)
    ↓
After approval: Status changes to "You Already Join"
```

### For an Admin:
```
Landing Page
    ↓
Click Admin Icon (Top Right)
    ↓
Navigate to Church Records → Ministries
    ↓
View all ministries with:
  - Create, Edit, Delete buttons
  - Filter, Search, Export options
  - Approval management
```

---

## API Endpoints Quick Lookup

### PUBLIC ENDPOINTS (No Login Required)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/church-records/ministries/getAllMinistries` | GET/POST | Get all active ministries |
| `/api/church-records/ministries/getMinistryById/:id` | GET | Get specific ministry details |
| `/api/church-records/ministries/getAllMinistriesForSelect` | GET | Get ministries for dropdowns |
| `/api/church-records/ministries/getPublicMinistries` | GET | Get public ministries |
| `/api/church-records/ministries/exportExcel` | GET | Download ministries as Excel |

### PROTECTED ENDPOINTS (Login Required)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/church-records/ministries/createMinistry` | POST | Create new ministry |
| `/api/church-records/ministries/updateMinistry/:id` | PUT | Update ministry |
| `/api/church-records/ministries/deleteMinistry/:id` | DELETE | Delete ministry |

---

## Frontend Pages

### Public Pages (No Login Required)
- `/ministries` - View all ministries
- `/ministries/learn-more/:id` - View ministry details

### Admin Pages (Login Required)
- `/admin/church-records/ministries` - Manage ministries (create/edit/delete)

---

## Join Ministry Flow

### Step 1: Click "Join Us" Button
**What Happens:**
- Frontend checks if user is logged in
- If yes → Show "Join Us" button (enabled)
- If no → Show "Become a Member" button (redirects to signup)

### Step 2: Submit Join Request
**What Happens:**
- Frontend sends approval request to backend
- Backend creates approval record with status="pending"
- Button changes to "Pending Request"
- Member sees message: "Your request will be reviewed by an admin"

### Step 3: Admin Reviews Request
**What Happens:**
- Admin goes to Approvals section
- Reviews ministry join request
- Clicks Approve or Reject
- Member gets notification
- If approved: Member becomes member of that ministry
- If rejected: Button returns to "Join Us" (can try again)

---

## Key Features

### For Visitors
- Browse all ministries without creating account
- Get full information about each ministry
- Encourage them to become members to join

### For Members
- Easy way to request to join ministries
- See current join request status
- Get notified when request is approved/rejected
- Participate in ministries once approved

### For Admins
- Full CRUD operations (Create, Read, Update, Delete)
- Manage ministry details, leaders, schedules
- Upload ministry images
- View all members in each ministry
- Export data to Excel
- Print ministry reports with watermark

---

## Common Issues & Solutions

### "I can see ministries but can't join"
→ **Solution:** You must be logged in to join. Click "Become a Member" to create an account first.

### "My join request shows 'Pending Request' for too long"
→ **Solution:** The admin hasn't reviewed it yet. They will notify you when decision is made.

### "I can't edit/create/delete ministries"
→ **Solution:** Only admins can do this. Ask your church administrator.

### "Ministry data is not showing up"
→ **Solution:** 
1. Check the status is set to "active" (not "not_active")
2. Admins can only see archived data in admin panel
3. Refresh the page

---

## Security Notes

✅ Ministry viewing is safe for everyone - no sensitive data exposed  
✅ Joining requires login - prevents anonymous spam  
✅ Admin operations are protected - only authorized users can manage  
✅ All data is encrypted in transit (HTTPS in production)  
✅ Database records are archived, not permanently deleted  

---

## Mobile Experience

All pages are fully responsive:
- ✅ Ministry list works on mobile
- ✅ Ministry details page optimized for mobile
- ✅ Join button clearly visible
- ✅ Admin panel accessible on tablet

---

**Last Updated:** January 18, 2026  
**Status:** ✅ Production Ready
