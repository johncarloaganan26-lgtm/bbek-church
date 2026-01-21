# Bible Baptist Ekklesia of Kawit - System Architecture Flowchart

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                              │
│                          (Vue.js 3 Frontend)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Admin Dashboard with Vuetify UI Components                              │
│ • Data Tables for Church Records Management                               │
│ • Forms for Service Registrations (Baptism, Marriage, etc.)               │
│ • Pinia State Management for Reactive Data                                │
│ • Axios HTTP Client for API Communication                                 │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ HTTP Requests (REST API)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                  │
│                      (Express.js Backend Server)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Authentication Middleware (JWT Token Validation)                        │
│ • Route Handlers for Different Modules:                                   │
│   ├── Church Records (Members, Events, Departments)                       │
│   ├── Services (Water Baptism, Child Dedication, Marriage, Burial)        │
│   ├── Financial (Tithes, Offerings, Transactions)                         │
│   ├── Communication (Messages, Announcements)                             │
│   └── Administrative (Audit Trail, Archive, CMS)                          │
│ • Request Validation & Sanitization                                       │
│ • Error Handling & Logging                                                │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ Database Queries
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA ACCESS LAYER                                 │
│                          (MySQL Database)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Connection Pooling for Efficient Resource Management                    │
│ • Multiple Database Tables:                                               │
│   ├── members (Personal & Contact Information)                            │
│   ├── events (Church Activities & Schedules)                              │
│   ├── water_baptism, child_dedication, marriage_service, burial_service   │
│   ├── tithes_offerings, transactions (Financial Records)                  │
│   ├── departments, ministries, church_leaders (Organization)              │
│   ├── audit_trail (System Activity Logging)                               │
│   ├── archive (Deleted Records Storage)                                   │
│   └── announcements, messages (Communication)                             │
│ • Data Relationships & Foreign Key Constraints                            │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ Query Results
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                                │
│                      (Database Helper Modules)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Data Validation & Business Rules Enforcement                            │
│ • CRUD Operations for Each Module                                         │
│ • Bulk Import/Export Functionality (CSV/Excel)                            │
│ • Email Notifications (SendGrid Integration)                              │
│ • Audit Trail Recording for All Operations                                │
│ • Data Archiving & Restoration                                            │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ Processed Data
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RESPONSE PROCESSING                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ • JSON Response Formatting                                                │
│ • Error Response Handling                                                 │
│ • Pagination & Filtering Logic                                            │
│ • File Generation for Exports                                             │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ HTTP Responses
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE UPDATE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Vue Components Re-render with New Data                                  │
│ • UI State Updates (Loading, Success, Error States)                      │
│ • Data Tables Refresh with Latest Information                             │
│ • Toast Notifications for User Feedback                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key System Flows

### 1. Member Management Flow

```
User Action → Vue Component → Pinia Store → Axios → Express Route → DB Helper → MySQL → Response → UI Update
```

### 2. Service Registration Flow

```
Registration Form → Validation → API Call → Business Logic → Database → Email Notification → Confirmation UI
```

### 3. Administrative Operations Flow

```
Admin Action → Permission Check → Audit Log → Database Operation → Success/Error Response → UI Feedback
```

### 4. Data Import/Export Flow

```
File Upload → CSV/Excel Parsing → Data Validation → Bulk Insert → Progress Updates → Completion Notification
```

## System Characteristics

- **Frontend**: Single Page Application (SPA) with Client-side Routing
- **Backend**: RESTful API with Middleware Pipeline
- **Database**: Relational Database with Connection Pooling
- **Security**: JWT Authentication, Role-based Access Control
- **Monitoring**: Comprehensive Audit Trail and Error Logging
- **Scalability**: Modular Architecture with Separation of Concerns
- **Deployment**: Environment-specific Configuration (Dev/Prod)
