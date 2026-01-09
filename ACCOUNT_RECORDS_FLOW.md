# Account Records Flow - Admin Side

## Overview

This document describes the complete flow for account records management in the BBEK Church Management System's admin side.

---

## 1. Database Schema

### Table: `tbl_accounts`

| Column       | Type        | Constraints           | Description                       |
| ------------ | ----------- | --------------------- | --------------------------------- |
| acc_id       | INT         | PK, NN, AI            | Unique account ID                 |
| email        | VARCHAR(45) | NN                    | User email address (unique)       |
| password     | VARCHAR(45) | NN                    | Hashed password (bcrypt)          |
| position     | VARCHAR(45) | NN, default: 'member' | User role (admin, staff, member)  |
| status       | VARCHAR(45) | NN, default: 'active' | Account status (active, inactive) |
| date_created | DATETIME    | NN                    | Record creation timestamp         |

---

## 2. Backend API Endpoints

### Base URL: `/api/church-records/accounts`

| Method | Endpoint                    | Description                                | Auth Required     |
| ------ | --------------------------- | ------------------------------------------ | ----------------- |
| POST   | `/createAccount`            | Create new account                         | Yes (Admin/Staff) |
| GET    | `/getAllAccounts`           | Get all accounts (with filters/pagination) | Yes (Admin/Staff) |
| POST   | `/getAllAccounts`           | Get all accounts (body payload)            | Yes (Admin/Staff) |
| GET    | `/getAccountById/:id`       | Get account by ID                          | Yes (Admin/Staff) |
| GET    | `/getAccountByEmail/:email` | Get account by email                       | Yes (Admin/Staff) |
| PUT    | `/updateAccount/:id`        | Update account                             | Yes (Admin/Staff) |
| DELETE | `/deleteAccount/:id`        | Delete (archive) account                   | Yes (Admin)       |
| POST   | `/verifyCredentials`        | Verify login credentials                   | No                |
| POST   | `/login`                    | User login                                 | No                |
| POST   | `/forgotPassword`           | Request password reset                     | No                |
| GET    | `/me`                       | Get current user profile                   | Yes               |
| GET    | `/exportExcel`              | Export accounts to Excel                   | Yes (Admin/Staff) |
| POST   | `/exportExcel`              | Export accounts to Excel (body)            | Yes (Admin/Staff) |

---

## 3. Backend Data Flow

### 3.1 Create Account Flow

```
Frontend (Admin)
    ↓ POST /createAccount
    ↓ Body: { email, position, status }
Backend AccountRoutes
    ↓
Backend accountRecords.createAccount()
    ↓
Check duplicate email
    ↓
Hash password (bcrypt)
    ↓
INSERT INTO tbl_accounts
    ↓
Return created account
```

### 3.2 Get Accounts Flow

```
Frontend (Admin)
    ↓ GET /getAllAccounts?search=&position=&status=&sortBy=&page=&pageSize=
Backend AccountRoutes
    ↓
Backend accountRecords.getAllAccounts()
    ↓
Build WHERE clause based on filters
    ↓
Execute SELECT query with pagination
    ↓
Return paginated accounts array
```

### 3.3 Update Account Flow

```
Frontend (Admin)
    ↓ PUT /updateAccount/:id
    ↓ Body: { email, position, status, password? }
Backend AccountRoutes
    ↓
Backend accountRecords.updateAccount()
    ↓
Check account exists
    ↓
Validate email format (if provided)
    ↓
Check duplicate email (excluding current)
    ↓
Hash password if provided
    ↓
UPDATE tbl_accounts SET ...
    ↓
Return updated account
```

### 3.4 Delete Account Flow

```
Frontend (Admin)
    ↓ DELETE /deleteAccount/:id
Backend AccountRoutes
    ↓
Backend accountRecords.deleteAccount()
    ↓
Check account exists
    ↓
Archive record to tbl_archive
    ↓
DELETE FROM tbl_accounts
    ↓
Return success message
```

### 3.5 Login Flow

```
Frontend (User)
    ↓ POST /login
    ↓ Body: { email, password }
Backend AccountRoutes
    ↓
Backend accountRecords.getSpecificMemberByEmailAndPassword()
    ↓
SELECT * FROM tbl_accounts WHERE email = ? AND status = "active"
    ↓
Compare password with bcrypt
    ↓
Generate JWT token
    ↓
For members: Verify water baptism completed
    ↓
Return { account, member, accessToken }
```

---

## 4. Frontend Components

### 4.1 Main Components

| Component                | Path                                                 | Description                |
| ------------------------ | ---------------------------------------------------- | -------------------------- |
| Accounts.vue             | `fe/src/components/Admin/ChurchRecords/Accounts.vue` | Main accounts listing page |
| AccountDialog.vue        | `fe/src/components/Dialogs/AccountDialog.vue`        | Add/Edit account dialog    |
| PasswordManagement.vue   | `fe/src/components/PasswordManagement.vue`           | Password change/reset page |
| LoginDialog.vue          | `fe/src/components/Dialogs/LoginDialog.vue`          | Login dialog               |
| ForgotPasswordDialog.vue | `fe/src/components/Dialogs/ForgotPasswordDialog.vue` | Forgot password dialog     |

### 4.2 Router Configuration

```javascript
// Routes related to accounts
{
  path: '/admin/accounts',
  name: 'Accounts',
  component: () => import('@/components/Admin/ChurchRecords/Accounts.vue'),
  meta: { requiresAuth: true, roles: ['admin', 'staff'] }
}
```

---

## 5. State Management (Pinia Store)

### Store: `useAccountsStore`

**State:**

```javascript
{
  accounts: [],           // Array of account records
  loading: false,         // Loading state
  error: null,            // Error message
  searchQuery: '',        // Search filter
  filters: {              // Filter options
    status: 'All Statuses',
    position: 'All Positions',
    sortBy: 'Date Created (Newest)'
  },
  currentPage: 1,         // Current page number
  totalPages: 1,          // Total pages
  totalCount: 0,          // Total records
  itemsPerPage: 10,       // Page size
  pageSizeOptions: [5, 10, 15],
  emailOptions: []        // For member email selection
}
```

**Actions:**

- `fetchAccounts(options)` - Fetch accounts with filters
- `createAccount(data)` - Create new account
- `updateAccount(id, data)` - Update account
- `deleteAccount(id)` - Delete account
- `fetchAccountById(id)` - Get single account
- `fetchEmailOptions()` - Get member emails for dropdown
- `forgotPassword(email)` - Request password reset
- `exportAccountsToExcel(options)` - Export to Excel
- `setSearchQuery(query)` - Set search filter
- `setFilters(filters)` - Set filter options
- `setCurrentPage(page)` - Change page
- `setPageSize(pageSize)` - Change page size

---

## 6. User Flow Diagrams

### 6.1 View Accounts Flow

```
Admin User
    ↓
Navigate to /admin/accounts
    ↓
Accounts.vue onMounted
    ↓
accountsStore.fetchAccounts()
    ↓
GET /api/church-records/accounts/getAllAccounts
    ↓
Display accounts table
    ↓
Admin can:
    - Search accounts
    - Filter by status/position
    - Sort by various fields
    - Paginate
    - Export to Excel
```

### 6.2 Add Account Flow

```
Admin User
    ↓
Click "Add New Account" button
    ↓
AccountDialog.vue opens
    ↓
Fill form:
    - Email (select from members or enter manually)
    - Position (dropdown: admin, staff, member)
    - Status (dropdown: active, inactive)
    ↓
Click "Add Account"
    ↓
POST /api/church-records/accounts/createAccount
    ↓
Backend:
    - Check duplicate email
    - Hash default password
    - Insert record
    ↓
Refresh accounts list
    ↓
Show success message
```

### 6.3 Edit Account Flow

```
Admin User
    ↓
Click edit icon on account row
    ↓
AccountDialog.vue opens with account data
    ↓
Modify fields:
    - Email
    - Position
    - Status
    ↓
Click "Update Account"
    ↓
PUT /api/church-records/accounts/updateAccount/:id
    ↓
Backend:
    - Validate email format
    - Check duplicate email
    - Update record
    ↓
Refresh accounts list
    ↓
Show success message
```

### 6.4 Delete Account Flow

```
Admin User
    ↓
Click delete icon on account row
    ↓
Show confirmation dialog
    ↓
Click "Confirm"
    ↓
DELETE /api/church-records/accounts/deleteAccount/:id
    ↓
Backend:
    - Archive record
    - Delete from tbl_accounts
    ↓
Refresh accounts list
    ↓
Show success message
```

### 6.5 Password Management Flow

```
User (Admin/Staff/Member)
    ↓
Navigate to /password-management/:type/:acc_id
    ↓
PasswordManagement.vue loads
    ↓
For "change" type:
    - Enter current password
    - Enter new password
    - Confirm new password
    ↓
For "reset" type:
    - Enter new password
    - Confirm new password
    ↓
Click button
    ↓
PUT /api/church-records/accounts/updateAccount/:id
    ↓
Backend updates password (hashed)
    ↓
Show success message
```

### 6.6 Login Flow

```
User
    ↓
Click Login button
    ↓
LoginDialog.vue opens
    ↓
Enter email and password
    ↓
POST /api/church-records/accounts/login
    ↓
Backend:
    - Verify credentials
    - Check if account is active
    - For members: verify water baptism completed
    - Generate JWT token
    ↓
Store userInfo and accessToken in localStorage
    ↓
Redirect based on position:
    - admin/staff → /admin
    - member → /home
```

### 6.7 Forgot Password Flow

```
User
    ↓
Click "Forgot Password?" link
    ↓
ForgotPasswordDialog.vue opens
    ↓
Enter email address
    ↓
POST /api/church-records/accounts/forgotPassword
    ↓
Backend:
    - Find account by email
    - Send password reset email via SendGrid
    ↓
Show success message
```

---

## 7. Key Features

### 7.1 Filtering

- **Search**: Search by email or position
- **Status Filter**: All Statuses, Active, Inactive
- **Position Filter**: All Positions, Admin, Staff, Member
- **Sort By**: Date Created, Email, Position, Status

### 7.2 Pagination

- Configurable page size (5, 10, 15)
- Current page tracking
- Total pages and total count display

### 7.3 Export

- Export accounts to Excel (.xlsx)
- Includes all current filters
- Timestamp in filename

### 7.4 Email Integration

- Account creation triggers welcome email
- Password reset via SendGrid
- Email templates for different scenarios

### 7.5 Security

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Duplicate email validation

---

## 8. Related Files

### Backend

- `be/dbHelpers/church_records/accountRecords.js` - Account CRUD operations
- `be/routes/church_records/accountRoutes.js` - API routes
- `be/middleware/authMiddleware.js` - Authentication middleware

### Frontend

- `fe/src/stores/ChurchRecords/accountsStore.js` - Pinia store
- `fe/src/components/Admin/ChurchRecords/Accounts.vue` - Main view
- `fe/src/components/Dialogs/AccountDialog.vue` - Dialog component
- `fe/src/components/PasswordManagement.vue` - Password management
- `fe/src/components/Dialogs/LoginDialog.vue` - Login component
- `fe/src/components/Dialogs/ForgotPasswordDialog.vue` - Forgot password

---

## 9. Error Handling

### Common Errors

1. **Duplicate Email**: Return 400 with error message
2. **Invalid Account ID**: Return 400 for invalid ID
3. **Account Not Found**: Return 404
4. **Authentication Failed**: Return 401
5. **Authorization Failed**: Return 403 (handled by middleware)

### Frontend Error Handling

- Show error messages via ElMessage
- Disable form during loading
- Show confirmation dialogs for destructive actions
- Handle API errors gracefully

---

## 10. Integration Points

### Member Registration Integration

- Accounts are created when water baptism status changes to "completed"
- Email addresses are selected from existing members
- Member and account are linked via email

### Archive Integration

- Deleted accounts are archived to `tbl_archive`
- Maintains audit trail of deleted records

### Authentication Integration

- JWT tokens are generated on login
- Tokens expire after 1 hour
- Stored in localStorage for API authentication
