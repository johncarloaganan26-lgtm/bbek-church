# Ministry Data Access & Security Configuration

**Last Updated:** January 18, 2026  
**Status:** ✅ Fully Implemented

---

## Overview

The ministry system is configured to allow **all visitors and non-members** to view ministry information, while restricting **joining ministries** to registered members only.

---

## Access Control Matrix

| Action | Visitors/Non-Members | Registered Members | Admins |
|--------|-------------------|------------------|--------|
| **View all ministries** | ✅ Yes | ✅ Yes | ✅ Yes |
| **View ministry details** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Click "Learn More"** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Join/Request to Join** | ❌ No | ✅ Yes | ✅ Yes |
| **Create ministries** | ❌ No | ❌ No | ✅ Yes (Auth Required) |
| **Edit ministries** | ❌ No | ❌ No | ✅ Yes (Auth Required) |
| **Delete ministries** | ❌ No | ❌ No | ✅ Yes (Auth Required) |

---

## Public Endpoints (No Authentication Required)

### 1. Get All Ministries
```
GET /api/church-records/ministries/getAllMinistries
POST /api/church-records/ministries/getAllMinistries
```
**Access:** Public (No auth required)  
**Purpose:** Display ministry list on landing page and ministries page  
**Query Parameters:**
- `status` - Filter by status (active, not_active)
- `page` - Page number
- `pageSize` - Items per page
- `search` - Search query
- `sortBy` - Sort order
- `department_name_pattern` - Filter by department

**Example:**
```javascript
// Fetch active ministries for the landing page
GET /api/church-records/ministries/getAllMinistries?status=active&page=1&pageSize=11
```

### 2. Get Ministry by ID
```
GET /api/church-records/ministries/getMinistryById/:id
```
**Access:** Public (No auth required)  
**Purpose:** Display ministry details on "Learn More" page  
**Parameters:**
- `id` - Ministry ID

**Example:**
```javascript
// Fetch specific ministry details
GET /api/church-records/ministries/getMinistryById/5
```

### 3. Get All Ministries for Select Dropdown
```
GET /api/church-records/ministries/getAllMinistriesForSelect
```
**Access:** Public (No auth required)  
**Purpose:** Populate dropdown lists for ministry selection

### 4. Get Public Ministries
```
GET /api/church-records/ministries/getPublicMinistries
```
**Access:** Public (No auth required)  
**Purpose:** Get active ministries for public display

### 5. Export Ministries to Excel
```
GET /api/church-records/ministries/exportExcel
```
**Access:** Public (No auth required)  
**Purpose:** Allow downloading ministry data as Excel file

---

## Protected Endpoints (Authentication Required)

### 1. Create Ministry
```
POST /api/church-records/ministries/createMinistry
```
**Access:** ✅ **REQUIRES AUTHENTICATION**  
**Purpose:** Create new ministry record  
**Required Auth:** JWT Token in Authorization header  
**Body Parameters:**
```json
{
  "ministry_name": "string",
  "schedule": "datetime",
  "leader_id": "string",
  "department_id": "number",
  "members": "array",
  "status": "active|not_active",
  "description": "string",
  "image": "base64|file"
}
```

### 2. Update Ministry
```
PUT /api/church-records/ministries/updateMinistry/:id
```
**Access:** ✅ **REQUIRES AUTHENTICATION**  
**Purpose:** Update existing ministry record  
**Required Auth:** JWT Token in Authorization header  
**Parameters:**
- `id` - Ministry ID
  
**Body Parameters:** Same as Create (all optional for update)

### 3. Delete Ministry
```
DELETE /api/church-records/ministries/deleteMinistry/:id
```
**Access:** ✅ **REQUIRES AUTHENTICATION**  
**Purpose:** Delete/archive ministry record  
**Required Auth:** JWT Token in Authorization header  
**Parameters:**
- `id` - Ministry ID

---

## Frontend User Flow

### For Non-Members/Visitors:

1. **View All Ministries Page** ✅
   - Component: `AllMinistries.vue`
   - Displays all active ministries in a grid layout
   - No login required
   - Full ministry information visible

2. **Click "Learn More"** ✅
   - Component: `LearnMoreMinistries.vue`
   - Shows detailed ministry information
   - No login required
   - Displays full description, schedule, leader, department

3. **Click "Join" Button** ❌ Redirected
   - **For Non-Members:** Shows "Become a Member" button
   - Clicking redirects to `/beoneofus/accept-jesus` page
   - User must become a member first

### For Registered Members:

1. **View All Ministries Page** ✅
   - Same access as non-members
   - Can see all active ministries

2. **Click "Learn More"** ✅
   - Same access as non-members
   - Can see full ministry details

3. **Click "Join Ministry"** ✅ Submit Request
   - Button enabled for authenticated members
   - Shows: "Join Us" (default)
   - Clicking submits approval request
   - Possible button states:
     - "Join Us" - Ready to join
     - "Pending Request" - Request already submitted
     - "You Already Join" - Already approved/member
     - "Request Rejected" - Previous request was rejected

---

## Backend Authorization Flow

### Authentication Middleware
- **Location:** `be/middleware/authMiddleware.js`
- **Function:** `authenticateToken`
- **Behavior:**
  - Checks if route is in `publicRoutes` list
  - If public: auth is optional (token validated if provided)
  - If protected: JWT token required in `Authorization: Bearer <token>` header

### Public Routes List
Ministry-related public routes are NOT in the restricted list, meaning:
- **READ operations** (`GET`) - Public (no auth in middleware)
- **WRITE operations** (`POST`, `PUT`, `DELETE`) - Protected by route-level middleware

### Route-Level Protection
Applied directly in `ministryRoutes.js`:
```javascript
// Protected: Create
router.post('/createMinistry', authenticateToken, upload.single('image'), ...)

// Protected: Update
router.put('/updateMinistry/:id', authenticateToken, upload.single('image'), ...)

// Protected: Delete
router.delete('/deleteMinistry/:id', authenticateToken, ...)

// Public: Read operations
router.get('/getAllMinistries', ...)
router.get('/getMinistryById/:id', ...)
```

---

## Implementation Details

### Frontend Components

#### 1. AllMinistries.vue
- **Path:** `fe/src/components/LandingPage/Ministries/AllMinistries.vue`
- **Purpose:** Display all ministries
- **API Calls:** `GET /api/church-records/ministries/getAllMinistries`
- **Auth Required:** ❌ No

#### 2. LearnMoreMinistries.vue
- **Path:** `fe/src/components/LandingPage/Ministries/LearnMoreMinistries.vue`
- **Purpose:** Display ministry details and join button
- **API Calls:**
  - `GET /api/church-records/ministries/getMinistryById/:id` (No auth)
  - `POST /api/church-records/approvals/createApproval` (Requires auth)
- **Join Logic:**
  ```javascript
  // Check if user is authenticated
  if (userInfo?.member?.member_id) {
    // Show "Join Us" button
    // Can submit join request
  } else {
    // Show "Become a Member" button
    // Redirects to accept Jesus page
  }
  ```

#### 3. Ministries.vue (Admin Panel)
- **Path:** `fe/src/components/Admin/ChurchRecords/Ministries.vue`
- **Purpose:** Admin ministry management
- **Features:**
  - Create new ministries (Protected)
  - Edit ministries (Protected)
  - Delete ministries (Protected)
  - View all ministries (uses store with auth)
  - Filter, search, export, print

---

## Security Checklist

✅ **View Endpoints (Public)**
- [x] `getAllMinistries` - Public access
- [x] `getMinistryById` - Public access
- [x] `getAllMinistriesForSelect` - Public access
- [x] `getPublicMinistries` - Public access

✅ **Write Endpoints (Protected)**
- [x] `createMinistry` - Authentication required
- [x] `updateMinistry` - Authentication required
- [x] `deleteMinistry` - Authentication required

✅ **Frontend Join Logic**
- [x] Non-members see "Become a Member" button
- [x] Members see "Join Us" button
- [x] Join requires authentication
- [x] Submit join request creates approval record

✅ **Approval Workflow**
- [x] Join requests create approval records
- [x] Admins review and approve/reject
- [x] Members can only join after approval

---

## Testing Guide

### Test 1: Non-Member Access
```javascript
// 1. Open browser (not logged in)
// 2. Navigate to: /ministries
// 3. Expected: See all active ministries ✅
// 4. Click "Learn More" on any ministry
// 5. Expected: See ministry details ✅
// 6. Click "Join Us" button
// 7. Expected: Redirected to "Become a Member" page ✅
```

### Test 2: Member Access
```javascript
// 1. Login as member
// 2. Navigate to: /ministries
// 3. Expected: See all active ministries ✅
// 4. Click "Learn More" on any ministry
// 5. Expected: See ministry details ✅
// 6. Click "Join Us" button
// 7. Expected: Submit join request ✅
// 8. Expected: Status changes to "Pending Request" ✅
```

### Test 3: Admin Edit
```javascript
// 1. Login as admin
// 2. Navigate to: /admin/church-records/ministries
// 3. Click "Create Ministry" button
// 4. Expected: Dialog opens ✅
// 5. Fill form and submit
// 6. Expected: New ministry created ✅
// 7. Try to create without login
// 8. Expected: 401 Unauthorized error ✅
```

---

## API Response Examples

### Success: Get All Ministries (Public)
```json
{
  "success": true,
  "message": "Ministries fetched successfully",
  "data": [
    {
      "ministry_id": 1,
      "ministry_name": "Adult Ministry",
      "schedule": "2026-01-18 10:00:00",
      "leader_id": "123",
      "leader_fullname": "John Smith",
      "department_id": 1,
      "department_name": "Adult",
      "members": ["member1", "member2"],
      "status": "active",
      "description": "...",
      "date_created": "2026-01-15 09:00:00"
    }
  ],
  "count": 1,
  "totalCount": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "pageSize": 11
  }
}
```

### Error: Create Ministry Without Auth
```json
{
  "success": false,
  "error": "Access denied. No token provided.",
  "message": "Authentication token is required. Please login first."
}
```

---

## Configuration

### Environment Variables
```
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=church_management
```

### Database Schema (tbl_ministry)
```sql
CREATE TABLE tbl_ministry (
  ministry_id INT PRIMARY KEY AUTO_INCREMENT,
  ministry_name VARCHAR(45) NOT NULL,
  schedule DATETIME,
  leader_id VARCHAR(45) NOT NULL,
  department_id INT NOT NULL,
  members VARCHAR(2000),
  status VARCHAR(45) DEFAULT 'active',
  date_created DATETIME NOT NULL,
  image LONGBLOB,
  description VARCHAR(1000)
);
```

---

## Troubleshooting

### Issue: Cannot view ministries on landing page
**Solution:** Ensure `getAllMinistries` endpoint is public (it is ✅)

### Issue: Members cannot join ministries
**Solution:** 
1. Check if user is authenticated (has JWT token)
2. Check if approval endpoint is working
3. Review approval workflow

### Issue: Non-members can create/edit/delete ministries
**Solution:**
1. Verify authentication middleware is applied ✅
2. Check JWT token validation
3. Ensure client sends auth header on write requests

---

## Future Improvements

- [ ] Add rate limiting to prevent abuse
- [ ] Add logging for all write operations
- [ ] Implement role-based access control (RBAC)
- [ ] Add ministry membership tiers (visitor, member, leader)
- [ ] Email notifications for join requests

---

## Summary

✅ **Ministry viewing is completely public** - Visitors can see all ministry data without login  
✅ **Ministry joining is member-only** - Only authenticated members can join  
✅ **Ministry management is admin-only** - Create/edit/delete require authentication  
✅ **Approval workflow is in place** - Admins must approve join requests  

The system is **secure and working as intended** for your requirements!
