# BBEK Church - Frontend Application

A Vue 3 + Vite application for BBEK Church administration with a landing page and admin dashboard.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **Vuetify 3** - Material Design component framework
- **Element Plus** - Vue 3 component library
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management for Vue

## Project Setup

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5174`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Git & Environment

- `.gitignore` is configured to **exclude all `node_modules` directories** and common **environment files** such as `.env`, `.env.*`, and `*.env` from version control.
- Keep your **API keys, database credentials, and secrets** in env files (not committed) and document any required variables for collaborators separately (for example, in a secure doc or a sample `.env.example`).

## Project Structure

```
church-fe/
├── src/
│   ├── views/
│   │   ├── LandingPage.vue            # Landing page shell
│   │   ├── AdminDashboard.vue        # Admin layout (sidebar + content)
│   │   ├── CertificatePreview.vue     # Certificate preview page
│   │   └── Transaction.vue            # Member transaction view
│   ├── components/
│   │   ├── LandingPage/               # Public-facing sections & pages
│   │   │   ├── New.vue                # New visitors section
│   │   │   ├── PlanYourVisit.vue      # Plan your visit page
│   │   │   ├── Give.vue               # Donations/giving page
│   │   │   ├── Live.vue               # Live stream page
│   │   │   ├── Messages.vue           # Messages/announcements
│   │   │   ├── Navigation.vue         # Main navigation
│   │   │   ├── Footer.vue             # Footer component
│   │   │   ├── HeroSection.vue        # Hero section
│   │   │   ├── EventsSection.vue      # Events section
│   │   │   ├── ServicesSection.vue    # Services section
│   │   │   ├── VisionSection.vue      # Vision section
│   │   │   ├── BeOneOfUs/             # Accept Jesus, Send Prayer
│   │   │   ├── About/                 # About pages (Beliefs, Leadership, etc.)
│   │   │   ├── Events/                # Events listing and details
│   │   │   ├── Ministries/            # Ministries listing and details
│   │   │   └── Services/              # Services (Baptism, Marriage, etc.)
│   │   ├── Admin/
│   │   │   ├── DashboardView.vue      # Admin home dashboard
│   │   │   ├── ChurchRecords/         # Church records management
│   │   │   │   ├── MemberRecord.vue
│   │   │   │   ├── ChurchLeaders.vue
│   │   │   │   ├── DepartmentOfficers.vue
│   │   │   │   ├── Departments.vue
│   │   │   │   ├── EventsRecords.vue
│   │   │   │   ├── Ministries.vue
│   │   │   │   ├── TithesOfferings.vue
│   │   │   │   ├── Accounts.vue
│   │   │   │   ├── Approvals.vue
│   │   │   │   └── Transactions.vue
│   │   │   ├── ServicesRecords/       # Services records management
│   │   │   │   ├── WaterBaptism.vue
│   │   │   │   ├── ChildDedication.vue
│   │   │   │   ├── BurialService.vue
│   │   │   │   └── MarriageRecord.vue
│   │   │   ├── CommunicationRecords/  # Communication management
│   │   │   │   └── Messages.vue
│   │   │   └── Maintenance/           # Maintenance & settings
│   │   │       ├── ContentManagementPage.vue
│   │   │       ├── Archive.vue
│   │   │       ├── Settings.vue
│   │   │       └── ListItems/         # CMS list item components
│   │   ├── Dialogs/                   # Reusable dialog components
│   │   │   ├── LoginDialog.vue
│   │   │   ├── MemberDialog.vue
│   │   │   ├── EventRecordsDialog.vue
│   │   │   └── ... (many more)
│   │   ├── Certificates/             # Certificate components
│   │   │   ├── WaterBaptismCertificate.vue
│   │   │   ├── MarriageCertificate.vue
│   │   │   ├── ChildDedicationCertificate.vue
│   │   │   └── DeathCertificate.vue
│   │   ├── PasswordManagement.vue    # Password management
│   │   └── Transaction.vue           # Transaction component
│   ├── stores/                        # Pinia stores
│   │   ├── ChurchRecords/            # Church record stores
│   │   ├── ServicesRecords/          # Service record stores
│   │   ├── cmsStore.js               # CMS content store
│   │   ├── announcementStore.js      # Announcements store
│   │   ├── auditTrailStore.js       # Audit trail store
│   │   ├── archiveStore.js          # Archive store
│   │   ├── formsStore.js             # Forms store
│   │   └── memberRegistrationStore.js # Member registration store
│   ├── router/
│   │   └── index.js                  # Vue Router configuration
│   │   ├── plugins/
│   │   │   ├── vuetify.js            # Vuetify configuration
│   │   │   └── element-plus.js       # Element Plus configuration
│   ├── api/
│   │   └── axios.js                  # Axios configuration with interceptors
│   ├── utils/
│   │   ├── tokenValidation.js        # JWT token validation
│   │   └── cmsSequentialLoader.js    # CMS sequential loader
│   ├── composables/
│   │   └── useCms.js                 # CMS composable
│   ├── App.vue                       # Root component
│   ├── main.js                       # Application entry point
│   └── style.css                     # Global styles
├── index.html                        # HTML template
├── vite.config.js                    # Vite configuration
├── vercel.json                       # Vercel deployment configuration
└── package.json                       # Project dependencies
```

## Routes

### Public Routes
- `/` – Landing page shell with nested sections
- `/new` – New visitors section
- `/plan-your-visit` – Plan your visit page
- `/give` – Donations/giving page
- `/live` – Live stream page
- `/messages` – Messages/announcements
- `/schedule-change` – Schedule change notification
- `/events` – Events listing with nested routes:
  - `/events/all` – All events
  - `/events/my-events` – User's events (requires auth)
  - `/events/:id` – Event details
  - `/events/:id/learn-more` – Learn more about event
- `/ministries` – Ministries listing with nested routes:
  - `/ministries/all` – All ministries
  - `/ministries/my-ministry` – User's ministry (requires auth)
  - `/ministries/:id` – Ministry details
  - `/ministries/:id/learn-more` – Learn more about ministry
- `/about` – About routes:
  - `/about` – About us main page
  - `/about/vision` – Vision page
  - `/about/mission` – Mission page
  - `/about/beliefs` – Beliefs page
  - `/about/leadership` – Leadership page
  - `/about/leaders-and-officers` – Leaders and officers
  - `/about/officers` – Officers page
  - `/about/department-officers` – Department officers
- `/services` – Services wrapper
  - `/services/water-baptism` – Water baptism service
  - `/services/marriage` – Marriage service
  - `/services/child-dedication` – Child dedication service
  - `/services/burial` – Burial service
- `/beoneofus/accept-jesus` – Accept Jesus Christ
- `/beoneofus/send-prayer` – Send prayer request
- `/member-registration` – Public member registration
- `/certificate/:type/:id` – Certificate preview (requires auth)
- `/transaction` – Member transaction view (requires auth)
- `/password-management` – Password management (requires auth)

### Admin Routes (Protected)
- `/admin` – Admin dashboard layout
  - `/admin/dashboard` – Dashboard overview
  - `/admin/members` – Member records
  - `/admin/church-leaders` – Church leaders
  - `/admin/department-officers` – Department officers
  - `/admin/departments` – Departments
  - `/admin/events` – Events records
  - `/admin/ministries` – Ministries
  - `/admin/tithes-offerings` – Tithes & offerings
  - `/admin/accounts` – Accounts management
  - `/admin/approvals` – Approval workflow
  - `/admin/transactions` – Transactions
  - `/admin/water-baptism` – Water baptism records
  - `/admin/child-dedication` – Child dedication records
  - `/admin/burial-service` – Burial service records
  - `/admin/marriage-record` – Marriage records
  - `/admin/messages` – Messages from website
  - `/admin/content-management` – CMS content management
  - `/admin/audit-trail` – Audit trail
  - `/admin/archive` – Archive management
  - `/admin/settings` – Settings

## Features

### Landing Page
- Multiple public-facing sections (New, Plan Your Visit, Give, Live, Messages)
- About pages (who we are, beliefs, leadership, department officers)
- Events listing with detail views and “my events” for logged-in users (when wired to backend)
- Ministries overview with per-ministry details
- Services information (water baptism, burial service, etc.)

### Admin Dashboard & Features
- Sidebar navigation with expandable sections for **Church Records**, **Services**, and **Communication**
- Church Records: departments, members, church leaders, department officers, events, tithes & offerings, ministries
- Services Records: water baptism, child dedication, burial service, marriage records
- Communication: messages from the website
- Dashboard overview with summary cards and recent activities

## Deployment to Vercel

### Important: API URL Configuration

The app uses different API connection methods for development vs production:

- **Development**: Uses Vite proxy - requests to `/api` are forwarded to `http://localhost:5000`
- **Production (Vercel)**: Must set `VITE_API_URL` environment variable to your backend URL

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend API URL (e.g., `https://your-backend-api.vercel.app` or `https://api.yourdomain.com`)
   - **Environment**: Select **Production**, **Preview**, and **Development** as needed
4. **Redeploy** your application after adding the variable

### Example Backend URLs

```
# If backend is deployed separately:
VITE_API_URL=https://your-backend.vercel.app
VITE_API_URL=https://api.yourdomain.com

# If backend is on a VPS/server:
VITE_API_URL=https://your-server-ip:5000
```

**⚠️ Important**: Without setting `VITE_API_URL` in production, the app will try to connect to `/api` on your Vercel domain, which won't exist. This will cause all API calls to fail.

## API Connection

### Development Mode
- Frontend runs on `http://localhost:5174`
- Uses Vite proxy - requests to `/api` are forwarded to `http://localhost:5000`
- Backend must be running on port 5000 (default)

### Production Mode
- Set `VITE_API_URL` environment variable to your backend URL
- Example: `VITE_API_URL=https://your-backend-api.vercel.app`
- See [Deployment to Vercel](#deployment-to-vercel) section below

## Environment Variables

Create a `.env` file in the root directory (optional for development):

```env
# API URL (Production only - not needed for development)
VITE_API_URL=http://localhost:5000
```

**Note**: In development, the Vite proxy handles `/api` requests automatically. The `VITE_API_URL` is only needed in production.

## State Management

The application uses **Pinia** for state management. Stores are organized as follows:

### Church Records Stores (`stores/ChurchRecords/`)
- `memberRecordStore.js` - Member records
- `churchLeadersStore.js` - Church leaders
- `departmentOfficersStore.js` - Department officers
- `departmentsStore.js` - Departments
- `eventsRecordsStore.js` - Events
- `ministriesStore.js` - Ministries
- `tithesOfferingsStore.js` - Tithes & offerings
- `accountsStore.js` - Accounts
- `approvalsStore.js` - Approvals
- `transactionsStore.js` - Transactions
- `index.js` - Store exports

### Services Records Stores (`stores/ServicesRecords/`)
- `waterBaptismStore.js` - Water baptism records
- `marriageServiceStore.js` - Marriage service records
- `burialServiceStore.js` - Burial service records
- `childDedicationStore.js` - Child dedication records

### Other Stores
- `cmsStore.js` - CMS/Landing page content
- `announcementStore.js` - Announcements
- `auditTrailStore.js` - Audit trail
- `archiveStore.js` - Archive management
- `formsStore.js` - Form submissions
- `memberRegistrationStore.js` - Member registration

## Authentication

- JWT tokens are stored in `localStorage` as `accessToken`
- Token is automatically added to all API requests via Axios interceptor
- Tokens are validated before each request
- Expired tokens trigger automatic logout and redirect to landing page
- Protected routes require authentication (see Route Protection)

## Route Protection

- **Public Routes**: Landing page, events, ministries, services, about pages
- **Protected Routes**: Admin dashboard (`/admin/*`)
- **Admin-Only Routes**: Require user with `position === 'admin'` or `position === 'staff'`
- Route guards are implemented in `router/index.js`

## Key Features

### Landing Page Features
- Responsive navigation with CMS-driven content
- Hero section with dynamic content
- Public events listing and details
- Ministries overview and details
- Services information (water baptism, burial service, marriage, child dedication)
- About pages (beliefs, leadership, department officers, vision, mission)
- Member registration forms
- Give/donations page (online and in-person)
- Live stream page
- Messages/announcements
- "Be One Of Us" section (Accept Jesus, Send Prayer)
- Social media integration
- Schedule change notifications

### Admin Dashboard Features
- Dashboard with statistics and recent activities
- **Church Records Management:**
  - Members (with Excel export)
  - Church Leaders
  - Department Officers
  - Departments
  - Events (with user event tracking)
  - Ministries
  - Tithes & Offerings
  - Accounts (user management)
  - Approvals (workflow management)
  - Transactions
- **Services Records:**
  - Water Baptisms (with certificate generation)
  - Marriage Services (with certificate generation)
  - Burial Services (with certificate generation)
  - Child Dedications (with certificate generation)
- **Communication:**
  - Messages from website
- **Maintenance:**
  - Content Management (CMS) - Landing page content editing
  - Audit Trail - User action logging
  - Archives - Record archiving
  - Settings - System configuration

## Development Notes

- Both Vuetify 3 and Element Plus are configured and ready to use
- Icons are available from both Material Design Icons (MDI) and Element Plus icons
- Axios interceptors handle authentication, error messages, and token validation
- Components are organized by feature area (LandingPage, Admin, Dialogs, Certificates)
- Styling uses both Vuetify's Material Design and Element Plus components
- Token validation utility checks JWT expiration before requests
- CMS content is loaded sequentially to optimize performance
- Certificate generation and preview functionality for all service types
- Responsive design for mobile and desktop
- File uploads support both base64 and multipart/form-data

## Troubleshooting

### Backend Connection Issues

If you see "Cannot connect to backend server" errors:

1. Ensure backend is running: `cd church-be && npm run dev`
2. Check backend is on port 5000 (default)
3. Check console for proxy errors
4. See `CONNECTION_TROUBLESHOOTING.md` for detailed troubleshooting

### Build Issues

- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall if needed
- Check Node.js version (requires Node.js 16+)

## Project Dependencies

### Core Dependencies
- `vue@^3.4.21` - Vue 3 framework
- `vue-router@^4.3.0` - Routing
- `pinia@^2.1.7` - State management
- `axios@^1.13.2` - HTTP client
- `vuetify@^3.5.10` - Material Design component library
- `element-plus@^2.5.6` - Vue 3 component library
- `@element-plus/icons-vue@^2.3.1` - Element Plus icons
- `@mdi/font@^7.4.47` - Material Design Icons
- `jsonwebtoken@^9.0.3` - JWT token validation

### Development Dependencies
- `vite@^5.1.6` - Build tool
- `@vitejs/plugin-vue@^5.0.4` - Vue plugin for Vite
- `vite-plugin-vuetify@^2.0.2` - Vuetify plugin for Vite

## Additional Documentation

- See `ARCHITECTURE_FLOW.md` in project root for detailed architecture and data flow
- See `CONNECTION_TROUBLESHOOTING.md` for connection issue resolution

