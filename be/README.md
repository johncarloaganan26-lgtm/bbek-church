v# BBEK Church - Backend API

Express.js REST API backend for BBEK Church Management System with MySQL database integration.

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js 5** - Web application framework
- **MySQL** - Database (via mysql2/promise)
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **dotenv** - Environment variable management

## Prerequisites

- Node.js (v16 or higher)
- MySQL database (5.7 or higher)
- npm or yarn package manager

## Project Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory (`church-be/.env`):

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bbekdb
DB_SSL=false
DB_CONNECTION_LIMIT=10

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration (Production)
FRONTEND_URL1=https://biblebaptistekklesiaofkawit.xyz
FRONTEND_URL2=https://your-frontend-alt.vercel.app
# OR use CLIENT_ORIGIN (comma-separated)
# CLIENT_ORIGIN=https://app1.com,https://app2.com

# Email Configuration (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

### 3. Database Setup

1. Create the MySQL database:

   ```sql
   CREATE DATABASE bbekdb;
   ```

2. Import the database schema (if available) or run setup scripts from `database/` directory:
   - See `database/ARCHIVE_SETUP.md`
   - See `database/AUDIT_TRAIL_SETUP.md`
   - See `database/CMS_SETUP.md`

3. Verify database connection:
   ```bash
   node test-db-connection.js
   ```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

### 5. Start Production Server

```bash
npm start
```

## API Base URL

- **Development**: `http://localhost:5000`
- **Production**: Your deployed backend URL (e.g., `https://your-backend-api.vercel.app`)

## API Endpoints

All endpoints are prefixed with `/api`.

### Authentication

- `POST /api/church-records/accounts/login` - User login (public)
- `POST /api/church-records/accounts/verifyCredentials` - Verify credentials (public)
- `POST /api/church-records/accounts/forgotPassword` - Password reset (public)

### Church Records

- `/api/church-records/members` - Member management
  - `POST /createMember` - Create new member
  - `GET|POST /getAllMembers` - Get all members (with pagination, filters)
  - `GET /getMemberById/:id` - Get member by ID
  - `PUT /updateMember/:id` - Update member
  - `DELETE /deleteMember/:id` - Delete member
  - `GET /getAllMembersForSelect` - Get members for dropdowns
  - `GET /exportMembersToExcel` - Export members to Excel
- `/api/church-records/accounts` - Account management
  - `POST /login` - User login (public)
  - `POST /verifyCredentials` - Verify credentials (public)
  - `POST /forgotPassword` - Password reset (public)
  - `GET|POST /getAllAccounts` - Get all accounts
  - `POST /createAccount` - Create new account
  - `PUT /updateAccount/:id` - Update account
  - `DELETE /deleteAccount/:id` - Delete account
- `/api/church-records/departments` - Department management
- `/api/church-records/ministries` - Ministry management
  - `POST /createMinistry` - Create ministry (supports image upload)
  - `GET|POST /getAllMinistries` - Get all ministries
  - `GET /getMinistryById/:id` - Get ministry by ID
  - `GET /getPublicMinistries` - Get public ministries (public route)
- `/api/church-records/events` - Event management
- `/api/church-records/tithes` - Tithes and offerings
- `/api/church-records/church-leaders` - Church leaders
- `/api/church-records/department-officers` - Department officers
- `/api/church-records/approvals` - Approval workflow
- `/api/church-records/child-dedications` - Child dedications
- `/api/church-records/burial-services` - Burial services

### Services

- `/api/services/water-baptisms` - Water baptism services
  - `POST /createWaterBaptism` - Create water baptism record
  - `GET|POST /getAllWaterBaptisms` - Get all records
  - `GET /getWaterBaptismById/:id` - Get by ID
  - `PUT /updateWaterBaptism/:id` - Update record
  - `DELETE /deleteWaterBaptism/:id` - Delete record
- `/api/services/marriage-services` - Marriage services
  - `POST /createMarriageService` - Create marriage record
  - `GET|POST /getAllMarriageServices` - Get all records
  - `GET /getMarriageServiceById/:id` - Get by ID
  - `PUT /updateMarriageService/:id` - Update record
  - `DELETE /deleteMarriageService/:id` - Delete record

### Other Features

- `/api/transactions` - Transaction management
  - `GET|POST /getAllTransactions` - Get all transactions
  - `POST /createTransaction` - Create transaction
  - `PUT /updateTransaction/:id` - Update transaction
  - `DELETE /deleteTransaction/:id` - Delete transaction
- `/api/member-registration` - Public member registration (public routes)
  - `POST /register` - Register new member (public)
  - `GET /getRegistrationStatus` - Get status (public)
- `/api/audit-trail` - Audit trail queries
  - `GET|POST /getAuditTrail` - Get audit trail logs
  - `GET /getAuditTrailByEntity` - Get by entity type
- `/api/archives` - Archive management
  - `POST /archive` - Archive a record
  - `GET|POST /getArchivedRecords` - Get archived records
  - `POST /restore` - Restore archived record
- `/api/announcements` - Announcements
  - `GET /getActiveAnnouncementsForUser` - Get active announcements (public)
  - `GET|POST /getAllAnnouncements` - Get all announcements
  - `POST /createAnnouncement` - Create announcement
  - `PUT /updateAnnouncement/:id` - Update announcement
  - `DELETE /deleteAnnouncement/:id` - Delete announcement
- `/api/forms` - Form submissions
  - `POST /createForm` - Submit form (public)
  - `GET|POST /getAllForms` - Get all form submissions
- `/api/cms` - Content Management System (landing page content)
  - `GET /getAllItems` - Get all CMS items (public for GET)
  - `GET /getItemById/:id` - Get CMS item by ID (public)
  - `POST /createItem` - Create CMS item
  - `PUT /updateItem/:id` - Update CMS item
  - `DELETE /deleteItem/:id` - Delete CMS item
  - Supports image and video uploads (base64 or multipart)
- `/api/dashboard` - Dashboard statistics
  - `GET /getStatistics` - Get dashboard statistics
  - `GET /getRecentActivities` - Get recent activities

### Health Check

- `GET /api/health` - Health check endpoint (public)

## Project Structure

```
church-be/
├── index.js                      # Main server file
├── package.json                  # Dependencies and scripts
├── .env                          # Environment variables (not committed)
├── database/
│   ├── db.js                     # Database connection pool
│   └── *.sql                     # Database setup scripts
├── middleware/
│   ├── authMiddleware.js         # JWT authentication middleware
│   └── auditTrailMiddleware.js   # Audit trail logging middleware
├── routes/
│   ├── church_records/           # Church record routes
│   │   ├── memberRoutes.js
│   │   ├── accountRoutes.js
│   │   ├── eventRoutes.js
│   │   └── ...
│   ├── services/                 # Service routes
│   │   ├── waterBaptismRoutes.js
│   │   ├── marriageServiceRoutes.js
│   │   └── ...
│   ├── transactionRoutes.js
│   ├── cmsRoutes.js
│   └── ...
└── dbHelpers/
    ├── church_records/           # Church record database helpers
    │   ├── memberRecords.js
    │   ├── accountRecords.js
    │   └── ...
    ├── services/                 # Service database helpers
    │   ├── waterBaptismRecords.js
    │   └── ...
    ├── transactionRecords.js
    ├── cmsRecords.js
    └── ...
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### How It Works

1. User logs in via `/api/church-records/accounts/login`
2. Server validates credentials and returns a JWT token
3. Client includes token in `Authorization` header: `Bearer <token>`
4. Protected routes verify the token via `authMiddleware.js`

### Public Routes

The following routes do NOT require authentication:

- `/api/health`
- `/api/church-records/accounts/login`
- `/api/church-records/accounts/verifyCredentials`
- `/api/church-records/accounts/forgotPassword`
- `/api/member-registration/**`
- `/api/cms/**` (GET routes for landing page content)
- `/api/announcements/getActiveAnnouncementsForUser`
- `/api/forms/createForm`

All other routes require a valid JWT token.

## Database Connection

### Connection Pool

The application uses MySQL connection pooling for efficient database access:

- **Development**: 10 connections (default)
- **Production**: 2 connections (to stay under cloud DB limits)
- **Override**: Set `DB_CONNECTION_LIMIT` in `.env`

### Features

- **Auto-retry**: Automatically retries queries on `max_connection` errors
- **Exponential backoff**: Retry delays increase exponentially
- **Pool recreation**: Can recreate pool with reduced limit on persistent errors
- **SSL Support**: Enable with `DB_SSL=true` in `.env` for cloud databases

### Database Helper Pattern

All database queries use parameterized statements to prevent SQL injection:

```javascript
const { query } = require("./database/db");
const [rows] = await query("SELECT * FROM tbl_members WHERE member_id = ?", [
  memberId,
]);
```

## Middleware

### Authentication Middleware

`middleware/authMiddleware.js`

- Validates JWT tokens
- Attaches user info to `req.user`
- Bypasses public routes

### Audit Trail Middleware

`middleware/auditTrailMiddleware.js`

- Automatically logs all authenticated requests
- Tracks user actions, entity types, and changes
- Non-blocking (logs asynchronously after response)

### CORS Middleware

Configured based on environment:

- **Development**: Allows `localhost:5173`, `localhost:5174`, `localhost:5175`
- **Production**: Uses `FRONTEND_URL1`, `FRONTEND_URL2`, or `CLIENT_ORIGIN` from `.env`

### Body Parser

- JSON payload limit: 500MB
- URL-encoded payload limit: 500MB
- Configured for handling large image/video uploads in CMS
- Additional 500MB limit specifically for `/api/cms` routes

## Request/Response Format

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

## Error Handling

The application includes comprehensive error handling:

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: CORS error or insufficient permissions
- **404 Not Found**: Resource not found
- **413 Payload Too Large**: Request body exceeds size limit
- **500 Internal Server Error**: Server-side errors
- **503 Service Unavailable**: Database connection limits reached

Error responses include detailed messages in development and sanitized messages in production.

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password storage
- **SQL Injection Prevention**: Parameterized queries only
- **CORS Protection**: Whitelist of allowed origins
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Payload Limits**: Prevents DoS attacks via large payloads

## Development

### Running in Development Mode

```bash
npm run dev
```

Uses `nodemon` for automatic server restarts on file changes.

### Environment

Set `NODE_ENV=development` for:

- Verbose logging
- Detailed error messages with stack traces
- More permissive CORS (localhost ports)

### Testing Database Connection

```bash
node test-db-connection.js
```

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:

- `NODE_ENV=production`
- `PORT` (usually set by hosting platform)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `DB_SSL=true` (if database requires SSL)
- `DB_CONNECTION_LIMIT=2` (for cloud databases)
- `JWT_SECRET` (strong, unique secret key)
- `FRONTEND_URL1`, `FRONTEND_URL2` (or `CLIENT_ORIGIN`)

### Database Considerations

Cloud databases often have connection limits:

- **Free tiers**: Usually 5 connections (max_connections and max_user_connections)
- **Recommendation**: Use `DB_CONNECTION_LIMIT=2` to stay safe
- **SSL**: Enable with `DB_SSL=true` for cloud databases

### Server Binding

The server binds to `0.0.0.0` to accept connections from all network interfaces, which is required for cloud deployments.

### Graceful Shutdown

The application handles shutdown signals (`SIGTERM`, `SIGINT`) gracefully:

- Closes HTTP server
- Closes database connection pool
- Exits cleanly

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (placeholder)

## Dependencies

### Core Dependencies

- `express@^5.1.0` - Web framework
- `mysql2@^3.15.3` - MySQL client with promises
- `jsonwebtoken@^9.0.3` - JWT implementation
- `bcrypt@^5.1.1` - Password hashing
- `dotenv@^17.2.3` - Environment variables
- `cors@^2.8.5` - CORS middleware
- `body-parser@^2.2.1` - Request body parsing

### Service Dependencies

- `@sendgrid/mail@^8.1.4` - SendGrid email service
- `nodemailer@^7.0.11` - Email sending
- `multer@^2.0.2` - File uploads
- `moment@^2.30.1` - Date manipulation
- `uuid@^13.0.0` - UUID generation
- `xlsx@^0.18.5` - Excel file processing
- `crypto@^1.0.1` - Cryptographic functionality

### Development Dependencies

- `nodemon@^3.1.11` - Auto-restart on file changes

## Troubleshooting

### Database Connection Errors

1. Verify database credentials in `.env`
2. Ensure database is running and accessible
3. Check firewall rules if connecting remotely
4. For cloud databases, ensure `DB_SSL=true` if required
5. Reduce `DB_CONNECTION_LIMIT` if hitting max connections

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

### CORS Errors

1. Check `FRONTEND_URL1`, `FRONTEND_URL2`, or `CLIENT_ORIGIN` in `.env`
2. Ensure frontend URL matches exactly (including protocol and port)
3. Check browser console for specific CORS error

### Authentication Failures

1. Verify `JWT_SECRET` matches between token generation and verification
2. Check token expiration (tokens expire after a set time)
3. Ensure `Authorization: Bearer <token>` header is sent correctly

## Additional Documentation

- See `ARCHITECTURE_FLOW.md` in project root for detailed architecture and data flow
- See `database/ARCHIVE_SETUP.md` for archive table setup
- See `database/AUDIT_TRAIL_SETUP.md` for audit trail setup
- See `database/CMS_SETUP.md` for CMS tables setup

## License

ISC
