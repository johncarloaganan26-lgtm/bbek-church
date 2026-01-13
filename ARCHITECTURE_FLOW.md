# Church Management System - Architecture & Flow Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Frontend (church-fe)](#frontend-church-fe)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
  - [API Connection Configuration](#api-connection-configuration)
  - [Authentication Flow](#authentication-flow)
  - [Route Protection](#route-protection)
- [Backend (church-be)](#backend-church-be)
  - [Technology Stack](#technology-stack-1)
  - [Project Structure](#project-structure-1)
  - [Server Initialization Flow](#server-initialization-flow)
  - [Database Connection](#database-connection)
  - [Authentication Middleware](#authentication-middleware)
  - [Audit Trail Middleware](#audit-trail-middleware)
  - [API Routes Structure](#api-routes-structure)
  - [Request Processing Flow](#request-processing-flow)
- [Data Flow Examples](#data-flow-examples)
  - [Example 1: User Login](#example-1-user-login)
  - [Example 2: Fetching Members List (Authenticated)](#example-2-fetching-members-list-authenticated)
  - [Example 3: Creating a Transaction](#example-3-creating-a-transaction)
- [Environment Variables](#environment-variables)
- [Public vs Protected Routes](#public-vs-protected-routes)
- [Error Handling](#error-handling)
- [Database Schema Overview](#database-schema-overview)
- [State Management (Pinia Stores)](#state-management-pinia-stores)
- [Security Considerations](#security-considerations)
- [Deployment Considerations](#deployment-considerations)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [API Response Format](#api-response-format)
- [Additional Resources](#additional-resources)

---

## Overview

This document describes the architecture, data flow, and connections between the **church-be** (Backend) and **church-fe** (Frontend) applications.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  church-fe (Vue 3)                       │  │
│  │  - Vue Router (Navigation)                               │  │
│  │  - Pinia Stores (State Management)                       │  │
│  │  - Axios Instance (HTTP Client)                          │  │
│  │  - Components (UI)                                       │  │
│  └─────────────────────┬────────────────────────────────────┘  │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │ (Bearer Token Authentication)
                         │
┌────────────────────────┼───────────────────────────────────────┐
│  ┌─────────────────────▼────────────────────────────────────┐  │
│  │              church-be (Express.js)                      │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  Middleware Layer                                │   │  │
│  │  │  - CORS                                          │   │  │
│  │  │  - Body Parser (500MB limit)                     │   │  │
│  │  │  - JWT Authentication                            │   │  │
│  │  └──────────────┬───────────────────────────────────┘   │  │
│  │                 │                                        │  │
│  │  ┌──────────────▼───────────────────────────────────┐   │  │
│  │  │  Routes Layer                                    │   │  │
│  │  │  - /api/church-records/*                         │   │  │
│  │  │  - /api/services/*                               │   │  │
│  │  │  - /api/transactions                             │   │  │
│  │  │  - /api/cms                                      │   │  │
│  │  │  - /api/dashboard                                │   │  │
│  │  │  - /api/announcements                            │   │  │
│  │  │  - /api/archives                                 │   │  │
│  │  │  - /api/forms                                    │   │  │
│  │  │  - /api/member-registration                      │   │  │
│  │  └──────────────┬───────────────────────────────────┘   │  │
│  │                 │                                        │  │
│  │  ┌──────────────▼───────────────────────────────────┐   │  │
│  │  │  DB Helpers Layer                                │   │  │
│  │  │  - Database Query Helpers                        │   │  │
│  │  │  - Business Logic                                │   │  │
│  │  │  - Data Transformation                           │   │  │
│  │  └──────────────┬───────────────────────────────────┘   │  │
│  └─────────────────┼───────────────────────────────────────┘  │
│                    │                                           │
│  ┌─────────────────▼───────────────────────────────────────┐  │
│  │         Database Connection Pool                        │  │
│  │  - mysql2/promise                                       │  │
│  │  - Connection Pool (2-10 connections)                   │  │
│  │  - Auto-retry on max_connection errors                  │  │
│  └─────────────────┬───────────────────────────────────────┘  │
└────────────────────┼──────────────────────────────────────────┘
                     │
                     │ MySQL Protocol
                     │
          ┌──────────▼──────────┐
          │   MySQL Database    │
          │   (bbekdb)          │
          └─────────────────────┘
```

---

## Frontend (church-fe)

### Technology Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Routing**: Vue Router 4
- **State Management**: Pinia
- **UI Libraries**: Vuetify 3, Element Plus
- **HTTP Client**: Axios
- **Port**: 5174 (Development)

### Project Structure

```
church-fe/
├── src/
│   ├── api/
│   │   └── axios.js                    # Axios instance with interceptors
│   ├── stores/                         # Pinia stores for state management
│   │   ├── ChurchRecords/              # Church record stores
│   │   │   ├── accountsStore.js
│   │   │   ├── memberRecordStore.js
│   │   │   ├── eventsRecordsStore.js
│   │   │   ├── ministriesStore.js
│   │   │   ├── departmentsStore.js
│   │   │   ├── tithesOfferingsStore.js
│   │   │   ├── transactionsStore.js
│   │   │   └── ...
│   │   ├── ServicesRecords/            # Service record stores
│   │   │   ├── waterBaptismStore.js
│   │   │   ├── marriageServiceStore.js
│   │   │   ├── burialServiceStore.js
│   │   │   └── ...
│   │   ├── cmsStore.js                 # CMS/Landing page content
│   │   ├── announcementStore.js
│   │   ├── auditTrailStore.js
│   │   └── ...
│   ├── components/                     # Vue components
│   │   ├── LandingPage/                # Public-facing pages
│   │   ├── Admin/                      # Admin dashboard components
│   │   └── Dialogs/                    # Reusable dialog components
│   ├── router/
│   │   └── index.js                    # Route definitions with guards
│   ├── utils/
│   │   └── tokenValidation.js          # JWT token validation
│   ├── App.vue                         # Root component
│   └── main.js                         # Application entry point
├── vite.config.js                      # Vite configuration with proxy
└── package.json
```

### API Connection Configuration

#### Development Mode

- **Base URL**: `/api` (proxied by Vite dev server)
- **Backend URL**: `http://localhost:5000` (default, or from `VITE_API_URL` env var)
- **Proxy Configuration**: Defined in `vite.config.js`

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false
  }
}
```

#### Production Mode

- **Base URL**: `${VITE_API_URL}/api`
- **Environment Variable**: `VITE_API_URL` must be set (e.g., `https://your-backend.vercel.app`)
- **No Proxy**: Direct API calls to backend URL

```javascript
// src/api/axios.js
const API_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_URL}/api` || ""
  : "/api";
```

### Authentication Flow

1. **Login Request**

   - Frontend sends POST to `/api/church-records/accounts/login`
   - Backend validates credentials and returns JWT token
   - Frontend stores token in `localStorage` as `accessToken`

2. **Authenticated Requests**

   - Axios interceptor adds `Authorization: Bearer <token>` header to all requests
   - Token is validated before each request
   - Expired/invalid tokens are cleared and user is redirected

3. **Token Storage**
   - `localStorage.getItem('accessToken')`
   - Fallback: `localStorage.getItem('auth_token')` or `localStorage.getItem('token')`
   - User info stored as JSON in `localStorage.getItem('userInfo')`

### Request Interceptor (axios.js)

```javascript
instance.interceptors.request.use((config) => {
  // Validate token before request
  const tokenValidation = checkAccessTokenValidity()
  if (!tokenValidation.success) {
    localStorage.removeItem('accessToken')
  }

  // Add Bearer token to header
  const token = localStorage.getItem('accessToken') || ...
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
```

### Response Interceptor (axios.js)

- **401 Unauthorized**: Clears tokens, redirects to landing page (except for public routes)
- **Error Handling**: Displays error messages using Element Plus `ElMessage`
- **Network Errors**: Shows connection refused message if backend is down

### Route Protection

- **Public Routes**: Landing page, services, events, ministries, about pages
- **Protected Routes**: Admin dashboard (`/admin/*`)
- **Admin-Only Routes**: Require `position === 'admin'` or `position === 'staff'`
- **Route Guard**: Implemented in `router/index.js` using `beforeEach` hook

---

## Backend (church-be)

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: MySQL (mysql2/promise)
- **Authentication**: JWT (jsonwebtoken)
- **Body Parser**: body-parser (10MB limit for large uploads)
- **Port**: 5000 (default)

### Project Structure

```
church-be/
├── index.js                           # Main server file
├── database/
│   └── db.js                          # Database connection pool
├── middleware/
│   └── authMiddleware.js              # JWT authentication
├── routes/                            # API route handlers
│   ├── church_records/                # Church record routes
│   │   ├── memberRoutes.js
│   │   ├── accountRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── ministryRoutes.js
│   │   └── ...
│   ├── services/                      # Service routes
│   │   ├── waterBaptismRoutes.js
│   │   ├── marriageServiceRoutes.js
│   │   └── ...
│   ├── transactionRoutes.js
│   ├── cmsRoutes.js
│   ├── dashboardRoutes.js
│   ├── announcementRoutes.js
│   └── ...
├── dbHelpers/                         # Database query helpers
│   ├── church_records/
│   │   ├── memberRecords.js
│   │   ├── accountRecords.js
│   │   └── ...
│   ├── services/
│   │   ├── waterBaptismRecords.js
│   │   └── ...
│   ├── transactionRecords.js
│   ├── cmsRecords.js
│   └── ...
└── package.json
```

### Server Initialization Flow

1. **Load Environment Variables** (`dotenv`)
2. **Configure CORS** (based on environment)
   - Development: `localhost:5173, localhost:5174, localhost:5175`
   - Production: `FRONTEND_URL1`, `FRONTEND_URL2` from env vars
3. **Configure Body Parser** (500MB limit)
4. **Apply Security Headers**
5. **Apply JWT Authentication Middleware** (except public routes)
6. **Register Routes**
7. **Start Server** (binds to `0.0.0.0:PORT`)

### Database Connection

- **Connection Pool**: mysql2/promise with connection pooling
- **Pool Size**:
  - Development: 10 connections
  - Production: 2 connections (to stay under cloud DB limits)
- **Connection Limit Override**: `DB_CONNECTION_LIMIT` env var
- **Auto-Retry**: Automatically retries on `max_connection` errors with exponential backoff
- **Pool Recreation**: Can recreate pool with reduced connection limit on errors

```javascript
// database/db.js
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "RootPassword123!",
  database: process.env.DB_NAME || "bbekdb",
  connectionLimit: IS_PRODUCTION ? 2 : 10,
  enableKeepAlive: true,
  ssl: process.env.DB_SSL === "true" ? {} : false,
};
```

### Authentication Middleware

**File**: `middleware/authMiddleware.js`

- **Public Routes**: Defined in `publicRoutes` array
  - `/api/health`
  - `/api/church-records/accounts/login`
  - `/api/member-registration/**`
  - `/api/cms/**` (GET routes for landing page)
  - And more...
- **Protected Routes**: Require `Authorization: Bearer <token>` header
- **Token Verification**: Uses `jsonwebtoken` with `JWT_SECRET` from env
- **User Info**: Attached to `req.user` after successful authentication

### API Routes Structure

All routes are prefixed with `/api`:

```
/api
├── /health                              # Health check (public)
├── /church-records/
│   ├── /members                        # Member management
│   ├── /accounts                       # Account/auth management
│   ├── /departments                    # Department management
│   ├── /ministries                     # Ministry management
│   ├── /events                         # Event management
│   ├── /tithes                         # Tithes/offerings
│   ├── /church-leaders                 # Church leaders
│   ├── /department-officers            # Department officers
│   ├── /approvals                      # Approval workflow
│   ├── /child-dedications              # Child dedication services
│   └── /burial-services                # Burial services
├── /services/
│   ├── /water-baptisms                 # Water baptism services
│   └── /marriage-services              # Marriage services
├── /transactions                       # Transaction management
├── /member-registration                # Public member registration
├── /archives                           # Archive management
├── /announcements                      # Announcements
├── /forms                              # Form submissions
├── /cms                                # Content Management (landing page)
└── /dashboard                          # Dashboard statistics
```

### Request Processing Flow

```
1. Request arrives
   ↓
2. CORS middleware (check origin)
   ↓
3. Body parser (parse JSON/form data)
   ↓
4. Security headers middleware
   ↓
5. Request logging (development only)
   ↓
6. JWT Authentication middleware
    ├─ Public route? → Skip auth
    └─ Protected route? → Verify token → Attach req.user
    ↓
7. Route handler
    ├─ Extract request data
    ├─ Call DB helper functions
    ├─ Execute database queries
    ├─ Transform/format response
    └─ Return JSON response
    ↓
8. Response sent to client
```

---

## Data Flow Examples

### Example 1: User Login

```
Frontend (LoginDialog.vue)
  ↓
accountsStore.login(email, password)
  ↓
axios.post('/api/church-records/accounts/login', { email, password })
  ↓
[Request Interceptor] → Adds Content-Type header
  ↓
[Proxy/Vite] → Forwards to http://localhost:5000/api/church-records/accounts/login
  ↓
Backend (church-be)
  ↓
CORS middleware → Checks origin
  ↓
Body parser → Parses JSON body
  ↓
Auth middleware → Route is public, skip token check
  ↓
accountRoutes.js → POST /login handler
  ↓
accountRecords.js → verifyCredentials(email, password)
  ↓
database/db.js → query('SELECT ... FROM tbl_accounts WHERE email=?', [email])
  ↓
Database → Returns account data
  ↓
accountRecords.js → Compare password hash (bcrypt)
  ↓
accountRecords.js → Generate JWT token
  ↓
Response: { success: true, data: { token, account, member } }
  ↓
[Response Interceptor] → Stores token in localStorage
  ↓
Frontend → Updates Pinia store, redirects to dashboard
```

### Example 2: Fetching Members List (Authenticated)

```
Frontend (MemberRecord.vue)
  ↓
memberRecordStore.fetchMembers({ page: 1, pageSize: 20 })
  ↓
axios.get('/api/church-records/members/getAllMembers?page=1&pageSize=20')
  ↓
[Request Interceptor] → Adds Authorization: Bearer <token>
  ↓
[Proxy/Vite] → Forwards to backend
  ↓
Backend (church-be)
  ↓
CORS middleware
  ↓
Body parser
  ↓
Auth middleware → Verifies JWT token → Attaches req.user
  ↓
Audit Trail middleware → Prepares logging
  ↓
memberRoutes.js → GET /getAllMembers handler
  ↓
memberRecords.js → getAllMembers(page, pageSize, filters)
  ↓
database/db.js → query('SELECT ... FROM tbl_members ... LIMIT ? OFFSET ?', [pageSize, offset])
  ↓
Database → Returns member records
  ↓
memberRecords.js → Formats response data
  ↓
Response: { success: true, data: { members: [...], pagination: {...} } }
  ↓
[Audit Trail] → Logs VIEW_LIST action (async)
  ↓
[Response Interceptor] → Returns response data
  ↓
Frontend → Updates Pinia store → Renders table
```

### Example 3: Creating a Transaction

```
Frontend (TransactionDialog.vue)
  ↓
User fills form and submits
  ↓
transactionsStore.createTransaction(transactionData)
  ↓
axios.post('/api/transactions/createTransaction', transactionData)
  ↓
[Request Interceptor] → Adds Authorization header
  ↓
Backend (church-be)
  ↓
Auth middleware → Verifies token
  ↓
transactionRoutes.js → POST /createTransaction handler
  ↓
transactionRecords.js → createTransaction(data, userId)
  ↓
database/db.js → query('INSERT INTO tbl_transactions ...', [values])
  ↓
Database → Inserts record, returns transaction_id
  ↓
transactionRecords.js → Returns created transaction
  ↓
Response: { success: true, data: { transaction: {...} } }
  ↓
[Audit Trail] → Logs CREATE action with entity_id = transaction_id
  ↓
Frontend → Updates store, shows success message, refreshes list
```

---

## Environment Variables

### Backend (church-be)

```env
# Server
NODE_ENV=development|production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=RootPassword123!
DB_NAME=bbekdb
DB_SSL=false                    # Set to 'true' for cloud databases requiring SSL
DB_CONNECTION_LIMIT=10          # Override default pool size

# JWT
JWT_SECRET=your-secret-key

# CORS
FRONTEND_URL1=https://your-frontend.vercel.app
FRONTEND_URL2=https://your-frontend-alt.vercel.app
# OR use CLIENT_ORIGIN (comma-separated)
CLIENT_ORIGIN=https://app1.com,https://app2.com

# Email (optional)
SENDGRID_API_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

### Frontend (church-fe)

```env
# API Connection (Production only)
VITE_API_URL=https://your-backend-api.vercel.app

# Note: In development, Vite proxy handles /api → localhost:5000
# No env vars needed for development
```

---

## Public vs Protected Routes

### Backend Public Routes

Routes that **do not require** JWT authentication:

- `/api/health` - Health check
- `/api/example` - Example endpoint
- `/api/church-records/accounts/login` - Login
- `/api/church-records/accounts/verifyCredentials` - Credential verification
- `/api/church-records/accounts/forgotPassword` - Password reset
- `/api/member-registration/**` - Public member registration
- `/api/church-records/ministries/getPublicMinistries` - Public ministries
- `/api/church-records/events/getAllEvents` - Public events
- `/api/cms/**` (GET routes) - Landing page content
- `/api/announcements/getActiveAnnouncementsForUser` - Public announcements
- `/api/forms/createForm` - Public form submission

All other routes require a valid JWT token.

### Frontend Public Routes

Routes accessible without authentication:

- `/` - Landing page
- `/new` - New visitor page
- `/plan-your-visit` - Plan your visit
- `/give` - Give/donations
- `/live` - Live stream
- `/events/**` - Events listing
- `/ministries/**` - Ministries
- `/services/**` - Services
- `/about/**` - About pages
- `/beoneofus/**` - Be one of us pages
- `/messages` - Messages
- `/change-password/**` - Password reset

Protected routes (require authentication):

- `/admin/**` - Admin dashboard (requires `admin` or `staff` position)

---

## Error Handling

### Frontend Error Handling

**Axios Response Interceptor** (`src/api/axios.js`):

- **401 Unauthorized**: Clears tokens, redirects to landing (except public routes)
- **400 Bad Request**: Shows error message from response
- **403 Forbidden**: Shows "Access Forbidden" message
- **404 Not Found**: Shows "Resource not found"
- **500 Internal Server Error**: Shows generic error message
- **502/503**: Shows "Service unavailable" message
- **Network Errors**: Shows "Cannot connect to backend" with helpful message

**Error Display**: Uses Element Plus `ElMessage.error()` for user-facing errors

### Backend Error Handling

**Error Middleware** (`index.js`):

- **CORS Errors**: Returns 403 with "Origin not allowed" message
- **Payload Too Large**: Returns 413 with max size information
- **JWT Errors**: Returns 401 with "Invalid or expired token"
- **Database Max Connections**: Returns 503 with retry suggestion
- **Generic Errors**: Returns 500 with sanitized message (detailed in development)

**Error Responses Format**:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message"
}
```

---

## Database Schema Overview

The system uses a MySQL database with the following main tables:

- `tbl_accounts` - User accounts and authentication
- `tbl_members` - Member information
- `tbl_departments` - Church departments
- `tbl_ministries` - Ministries
- `tbl_events` - Events
- `tbl_tithes` - Tithes and offerings
- `tbl_transactions` - Financial transactions
- `tbl_church_leaders` - Church leadership
- `tbl_department_officers` - Department officers
- `tbl_water_baptisms` - Water baptism records
- `tbl_marriage_services` - Marriage service records
- `tbl_burial_services` - Burial service records
- `tbl_child_dedications` - Child dedication records
- `tbl_approvals` - Approval workflow records
- `tbl_audit_trail` - Audit log
- `tbl_archives` - Archived records
- `tbl_announcements` - Announcements
- `tbl_forms` - Form submissions
- `tbl_cms_*` - CMS tables for landing page content

---

## State Management (Pinia Stores)

Each store manages state for a specific domain:

### Store Pattern

```javascript
// Example: memberRecordStore.js
export const useMemberRecordStore = defineStore("memberRecord", {
  state: () => ({
    members: [],
    currentMember: null,
    pagination: { page: 1, pageSize: 20, total: 0 },
    loading: false,
    filters: {},
  }),

  actions: {
    async fetchMembers(params) {
      this.loading = true;
      try {
        const response = await axios.get(
          "/api/church-records/members/getAllMembers",
          { params }
        );
        this.members = response.data.data.members;
        this.pagination = response.data.data.pagination;
      } catch (error) {
        // Error handled by axios interceptor
      } finally {
        this.loading = false;
      }
    },

    async createMember(data) {
      // ... create logic
    },
  },
});
```

### Store Organization

- **ChurchRecords/**: All church record stores (members, accounts, events, etc.)
- **ServicesRecords/**: Service record stores (baptisms, marriages, etc.)
- **Root stores**: `cmsStore`, `announcementStore`, `auditTrailStore`, etc.

---

## Security Considerations

### Authentication & Authorization

- JWT tokens expire (expiration set in token generation)
- Tokens validated on every request
- Admin routes require `position === 'admin'` or `position === 'staff'`

### CORS

- Whitelist of allowed origins
- Credentials enabled (`credentials: true`)
- Configurable for development vs production

### SQL Injection Prevention

- All queries use parameterized statements (`query('SELECT * FROM table WHERE id = ?', [id])`)
- No direct string concatenation in SQL queries

### XSS Protection

- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- Input sanitization in database helpers

### Payload Limits

- Body parser limit: 10MB (for large image/video uploads in CMS)
- Configured specifically for CMS routes

---

## Deployment Considerations

### Backend Deployment

1. **Environment Variables**: Set all required env vars
2. **Database**: Ensure database is accessible from deployment environment
3. **CORS**: Configure `FRONTEND_URL1` and `FRONTEND_URL2` or `CLIENT_ORIGIN`
4. **Connection Pool**: Adjust `DB_CONNECTION_LIMIT` based on database limits
5. **Port**: Use `PORT` env var (usually set by cloud platform)

### Frontend Deployment

1. **Environment Variables**: Set `VITE_API_URL` in production
2. **Build**: Run `npm run build` to create production bundle
3. **API URL**: Ensure `VITE_API_URL` points to deployed backend
4. **CORS**: Ensure backend allows frontend origin

### Health Checks

- Backend health endpoint: `GET /api/health`
- Frontend can check this endpoint to verify backend connectivity

---

## Troubleshooting Common Issues

### Frontend can't connect to backend

1. **Check backend is running**: `curl http://localhost:5000/api/health`
2. **Check CORS configuration**: Ensure frontend URL is in allowed origins
3. **Check VITE_API_URL**: In production, ensure it's set correctly
4. **Check proxy configuration**: In development, check `vite.config.js`

### Authentication failures

1. **Check token storage**: Verify token exists in `localStorage`
2. **Check token expiration**: Token may have expired
3. **Check JWT_SECRET**: Must match between token generation and verification
4. **Check Authorization header**: Should be `Bearer <token>`

### Database connection errors

1. **Check connection pool size**: Reduce if hitting max connections
2. **Check database credentials**: Verify env vars are correct
3. **Check database accessibility**: Ensure database is reachable
4. **Check SSL configuration**: Set `DB_SSL=true` for cloud databases requiring SSL

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "errors": ["Array of specific error messages (optional)"]
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## Additional Resources

- **Backend README**: See `church-be/README.md` (if exists)
- **Frontend README**: See `church-fe/README.md`
- **Connection Troubleshooting**: See `church-fe/CONNECTION_TROUBLESHOOTING.md`

---

## Last Updated

This document was generated based on the codebase structure as of the current date. For the most up-to-date information, refer to the actual code files.
