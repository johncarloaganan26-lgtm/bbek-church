# Bible Baptist Ekklesia of Kawit - System Flow Diagram

```
                    ┌─────────────────┐
                    │   START: User   │
                    │   Interaction   │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Vue.js 3      │
                    │   Frontend      │
                    │                 │
                    │ • Vuetify UI    │
                    │ • Pinia Store   │
                    │ • Axios HTTP    │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │   HTTP Request  │────▶│ Authentication  │
                    │   (REST API)    │     │   Middleware    │
                    └─────────┬───────┘     └─────────┬───────┘
                              │                       │
                              ▼                       ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │   Express.js    │     │   JWT Token     │
                    │   Route Handler │     │   Validation    │
                    └─────────┬───────┘     └─────────┬───────┘
                              │                       │
                              └───────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │   Authorized?   │
                              └─────────┬───────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │                          │
                    ┌─────▼─────┐              ┌─────▼─────┐
                    │  Access   │              │  Access   │
                    │  Granted  │              │  Denied   │
                    └─────┬─────┘              └─────┬─────┘
                          │                          │
                          ▼                          ▼
                ┌─────────────────┐        ┌─────────────────┐
                │   Business      │        │   Error         │
                │   Logic Layer   │        │   Response      │
                │                 │        │   (401/403)     │
                │ • Data Validation│        └─────────┬───────┘
                │ • CRUD Operations│                  │
                │ • Audit Logging  │                  │
                └─────────┬───────┘                  │
                          │                          │
                          ▼                          │
                ┌─────────────────┐                  │
                │   Database      │                  │
                │   Operations    │                  │
                │                 │                  │
                │ • MySQL Queries │                  │
                │ • Connection Pool│                  │
                └─────────┬───────┘                  │
                          │                          │
                          ▼                          │
                ┌─────────────────┐                  │
                │   Query         │                  │
                │   Successful?   │                  │
                └─────────┬───────┘                  │
                          │                          │
                ┌─────────┴─────────┐                │
                │                   │                │
          ┌─────▼─────┐       ┌─────▼─────┐          │
          │  Success  │       │  Database │          │
          │           │       │  Error    │          │
          └─────┬─────┘       └─────┬─────┘          │
                │                   │                │
                ▼                   ▼                │
      ┌─────────────────┐ ┌─────────────────┐       │
      │   Process       │ │   Error         │       │
      │   Results       │ │   Response      │       │
      │                 │ │   (500)         │       │
      │ • Format JSON   │ └─────────┬───────┘       │
      │ • Pagination    │           │                │
      │ • File Export   │           └────────────────┘
      └─────────┬───────┘
                │
                ▼
      ┌─────────────────┐
      │   HTTP Response │
      │   (200/201)     │
      └─────────┬───────┘
                │
                ▼
      ┌─────────────────┐
      │   Vue.js UI     │
      │   Update        │
      │                 │
      │ • Re-render     │
      │ • State Update  │
      │ • Notifications │
      └─────────┬───────┘
                │
                ▼
      ┌─────────────────┐
      │     END: User   │
      │   Sees Results  │
      └─────────────────┘
```

## Key Flow Components Legend

### User Interface Layer

- **Vue Components**: Handle user interactions and display data
- **Pinia Stores**: Manage application state reactively
- **Axios**: HTTP client for API communication

### API Layer

- **Express Routes**: Handle HTTP requests and responses
- **Middleware**: Authentication, validation, error handling
- **Route Handlers**: Process specific business logic

### Data Layer

- **Database Helpers**: Encapsulate database operations
- **MySQL**: Relational database with connection pooling
- **Audit Trail**: Log all system activities

### Response Flow

- **Success Path**: Data processing → JSON response → UI update
- **Error Path**: Validation errors → Error responses → User feedback

## Decision Points

- **Authentication Check**: JWT token validation
- **Authorization Check**: Role-based access control
- **Query Success Check**: Database operation results

## Data Flow Directions

- **→**: Sequential processing
- **↓**: Layer transitions
- **↙ ↘**: Conditional branching
