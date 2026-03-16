# BBEK App - Availability Management Architecture Summary

## Overview
This document provides a comprehensive analysis of how availability dates and slots are managed for the four main services: Water Baptism, Burial Service, Child Dedication, and Salvation Talk.

---

## 1. SERVICE-SPECIFIC AVAILABILITY STRUCTURES

### 1.1 WATER BAPTISM SERVICE

#### Database Schema (`tbl_waterbaptism`)
- **baptism_id** (VARCHAR(45), PK) - Auto-generated unique identifier
- **member_id** (VARCHAR(45), nullable) - Links to member
- **baptism_date** (DATETIME, nullable) - Actual ceremony date/time
- **preferred_baptism_time** (TIME, nullable) - Preferred time slot
- **status** (VARCHAR(45)) - pending, approved, disapproved, completed, cancelled
- **is_member** (TINYINT) - 1=member, 0=non-member
- Additional fields: firstname, lastname, email, phone, birthdate, age, gender, address, civil_status, profession, spouse_name, marriage_date, children (JSON), guardian info

#### Key Constraint
- **Sundays Only**: Water baptism can ONLY be scheduled on Sundays (day 0 in moment.js)
- Validated in `validateBaptismDate()` function in routes

#### Availability Tracking
- **Time Slot System**: Uses `preferred_baptism_time` field to track time preferences
- Granularity: Minute-based (extracts minutes from time for duplicate checking)
- Conflict Detection: `checkTimeSlotAvailability()` in [waterBaptismRecords.js](waterBaptismRecords.js)
  - Checks if same minute slot is already booked on same date
  - Only blocks if another baptism with "approved" status exists at same time

#### Admin Dialog
- **File**: [fe/src/components/Dialogs/WaterBaptismDialog.vue](fe/src/components/Dialogs/WaterBaptismDialog.vue)
- Fields:
  - Member selection (for existing members)
  - Personal information (name, birthdate, age, gender, civil status, profession, address, email, phone)
  - Desire ministry selection
  - Guardian information (name, contact, relationship)
  - Baptism date (restricted to Sundays)
  - Baptism time
  - Location (for admin/staff)
  - Status selection (admin/staff only)

#### Frontend Display
- **Landing Page Component**: [WaterBaptismRegistration.vue](fe/src/components/LandingPage/Services/WaterBaptismRegistration.vue)
  - Shows "Available Sunday Slots" in side panel
  - Displays available baptism times for each Sunday
  - Users can select preferred date and time

#### API Endpoints
- `POST /services/water-baptisms/createWaterBaptism` - Create new record
- `GET/POST /services/water-baptisms/getAllWaterBaptisms` - Retrieve with filters
- `PUT /services/water-baptisms/updateWaterBaptism/:id` - Update record
- Time slot conflict check is embedded in create/update logic

---

### 1.2 BURIAL SERVICE

#### Database Schema (`tbl_burialservice`)
- **burial_id** (VARCHAR(45), PK) - Auto-generated with zero-padding
- **member_id** (VARCHAR(45), FK) - Requesting member
- **relationship** (VARCHAR(45)) - Relationship to deceased
- **location** (VARCHAR(100)) - Burial service location
- **pastor_id** (VARCHAR(45), FK) - Assigned pastor (nullable)
- **service_date** (DATETIME) - Scheduled service date/time
- **preferred_service_time** (TIME, nullable) - Preferred time (NEW)
- **status** (VARCHAR(45)) - pending, approved, disapproved, completed, scheduled, cancelled
- Additional fields: deceased_name, deceased_birthdate, date_death, requester_name, requester_email, reason_of_death

#### Key Constraint
- **Night Hours Only (Evening)**: Burial services must be 6:00 PM - 10:00 PM
- Validated in `validateNightHours()` function in [burialServiceRecords.js](be/dbHelpers/services/burialServiceRecords.js)
- Default time offered is 6:00 PM

#### Availability Tracking
- **Time Slot System**: Uses `preferred_service_time` field (TIME format)
- Minute-based conflict checking via `checkTimeSlotAvailability()`
- Conflict Detection:
  - Checks if same minute slot is already booked on same date
  - Looks for min part of time (e.g., XX:15:XX) to match slots
  - Only blocks "approved" status services

#### Admin Dialog
- **File**: [fe/src/components/Dialogs/BurialServiceDialog.vue](fe/src/components/Dialogs/BurialServiceDialog.vue)
- Sections:
  - Member section (admin/staff can select)
  - Requester information (name, email)
  - Relationship selection
  - Deceased information (name, birthdate, date of death, reason of death)
  - Service details (pastor, service date/time, status, rejection reason if applicable)
- Time picker constraints: Only allows 6 PM - 10 PM range
- Default night time: 6:00 PM

#### API Endpoints
- `POST /church-records/burial-services/createBurialService`
- `GET/POST /church-records/burial-services/analyzeAvailability` - Analyzes available dates (NEW)
- `PUT /church-records/burial-services/updateBurialService/:id`
- Special endpoint: `/church-records/burial-services/analyzeAvailability` for availability checking

#### Availability Analysis
- **Function**: `analyzeBurialServiceAvailability()` in [burialServiceRecords.js](be/dbHelpers/services/burialServiceRecords.js)
- Parameters: daysAhead (default 30)
- Checks for pastor availability and location availability
- Returns available time slots (6 PM - 10 PM)
- Suggests alternative slots if conflicts exist

---

### 1.3 CHILD DEDICATION

#### Database Schema (`tbl_childdedications`)
- **child_id** (VARCHAR(45), PK) - Auto-generated with zero-padding
- **requested_by** (VARCHAR(45), FK) - Requester member ID
- **child_firstname, child_lastname, child_middle_name**
- **date_of_birth** (DATE)
- **place_of_birth** (VARCHAR(255))
- **gender** (VARCHAR(1)) - M or F
- **preferred_dedication_date** (DATE) - Admin-assigned dedication date
- **preferred_dedication_time** (TIME) - Admin-assigned dedication time (NEW)
- **date_completed** (DATE, nullable) - When actually completed
- **status** (VARCHAR(45)) - pending, approved, disapproved, completed, cancelled, scheduled
- **contact_phone_number, contact_email, contact_address**
- **Father information** (firstname, lastname, middle_name, phone, email, address)
- **Mother information** (firstname, lastname, middle_name, phone, email, address)
- **sponsors** (JSON array) - List of sponsors with details
- **pastor** (VARCHAR(255)) - Pastor conducting ceremony
- **location** (VARCHAR(255)) - Service location

#### Key Constraint
- **Sundays Only**: Child dedication can ONLY be scheduled on Sundays
- **Multiple Same-Day Services**: Multiple children CAN be dedicated on same Sunday
- **NO Same-Time Slot**: BUT only one service per time slot (e.g., multiple children CANNOT have 10:00 AM slot on same Sunday)

#### Availability Tracking
- **Dynamic Sunday Generation**: `getAvailableSundayDates(weeksAhead = 12)`
- Generates next 12 weeks of Sundays
- For each Sunday, provides time slot options
- **Time Slot System**: 
  - Standard church service hours (typically morning/afternoon)
  - Slots generated by `generateTimeSlots()` helper function
  - Each slot is 1 hour duration

#### Admin Dialog
- **File**: [fe/src/components/Dialogs/ChildDedicationDialog.vue](fe/src/components/Dialogs/ChildDedicationDialog.vue)
- Sections:
  - **Member Selection** (required for admin/staff, auto-filled for members)
  - **Child Information** (firstname, lastname, middle name, DOB, place of birth, gender)
  - **Father Information** (optional: firstname, lastname, middle name, phone, email, address)
  - **Mother Information** (optional: firstname, lastname, middle name, phone, email, address)
  - **Sponsors** (optional table: firstname, lastname, middle name, phone, address)
  - **Service Details** (pastor, location, status for admin/staff)
  - Parent/Guardian relationship field

#### Frontend Display
- **Landing Page**: [ChildDedication.vue](fe/src/components/LandingPage/Services/ChildDedication.vue)
  - Shows available Sundays (weeks ahead)
  - Each Sunday shows number of available slots
  - Slot selection interface
  - Displays available times for each Sunday

#### API Endpoints
- `POST /church-records/child-dedications/createChildDedication`
- `GET /church-records/child-dedications/getAvailableSundayDates?weeksAhead=12`
- `GET /church-records/child-dedications/check-time-slot` - Check if time slot is available
- `GET /church-records/child-dedications/check-duplicate` - Check for duplicate dedication
- `PUT /church-records/child-dedications/updateChildDedication/:id`

#### Availability Algorithm (`getAvailableSundayDates`)
```
1. Generate next N Sundays (default 12 weeks)
2. For each Sunday:
   - Generate standard time slots
   - Query for approved/completed/scheduled dedications on that date
   - Mark taken time slots
   - Return available slots
3. Frontend displays available Sundays with number of available slots
4. User selects preferred Sunday and time
```

#### Status Workflow
- **Member-initiated requests**: Start as pending, date/time = null (admin assigns later)
- **Admin-created records**: Preset with pastor, location, preferred_dedication_date/time
- **Approval**: Admin moves from pending → approved (sets scheduled date if not already set)
- **Completion**: Mark as completed with date_completed

---

### 1.4 SALVATION TALK (DISCIPLESHIP/SALVATION TRACK)

#### Database Schema (`tbl_salvation_availability`)
- **availability_id** (INT, PK, AUTO_INCREMENT)
- **available_date** (DATE)
- **available_time** (TIME)
- **max_slots** (INT, default 1) - Number of available slots for this time
- **status** (VARCHAR(45)) - 'Available', 'Booked', etc.
- **date_created** (DATETIME)

#### Availability Tracking
- **Admin-Managed Slots**: Admin manually creates slots in `tbl_salvation_availability` table
- **Simple Model**: Date + Time + Max available slots
- **Booking System**: When someone books a slot, system tracks which request booked it

#### Admin Interface
- **Routes** (from [salvationAvailabilityRoutes.js](be/routes/services/salvationAvailabilityRoutes.js)):
  - `GET /salvation-slots` - View all available slots
  - `POST /salvation-slots` - Create new availability slot
  - `DELETE /salvation-slots/:id` - Remove a slot
  - Requires admin/staff authentication

#### API Endpoints
- `GET /api/services/salvation-availability/salvation-slots` - Get all slots
- `POST /api/services/salvation-availability/salvation-slots` - Create slot
- `DELETE /api/services/salvation-availability/salvation-slots/:id` - Delete slot

#### Related Discipleship Tables
- **tbl_discipleship_requests**: Tracks discipleship/salvation talk requests with scheduled_date
- **tbl_biblestudy_requests**: Bible study requests with scheduled_date
- **tbl_promotion_visits**: Tracks home visits for promotion to active membership

---

## 2. ADMIN DIALOG COMPARISON

| Aspect | Water Baptism | Burial Service | Child Dedication | Salvation Talk |
|--------|---------------|-----------------|------------------|----------------|
| **Constraint** | Sundays only | 6-10 PM only | Sundays only | Admin-managed |
| **Date Picker** | Sunday-only dates | Date + time (restricted hours) | Sunday-only dates | Manual admin entry |
| **Time Picker** | Free selection | 6:00 - 10:00 PM range | Auto-generated slots | Manual admin entry |
| **Slot Level** | Per minute | Per minute | Per hour (typical) | Per custom time |
| **Conflict Check** | Minute-based | Minute-based | Time + date exact match | Admin creates boundaries |
| **Location Field** | Optional (admin only) | Required, tracked | Optional, tracked | Tracked in requests table |
| **Pastor Assignment** | Selectable dropdown | Selectable dropdown | Selectable dropdown | Assigned to request |
| **Approver Component** | Admin approval flow | Admin approval flow | Admin approval flow | Admin creates slots |
| **Status Options** | pending, approved, disapproved, completed, cancelled | pending, approved, disapproved, scheduled, ongoing, completed, cancelled | pending, approved, disapproved, completed, cancelled, scheduled | Linked to request status |

---

## 3. DATABASE RELATIONSHIPS

### Time Slot Storage Pattern

**Pattern 1: Direct DateTime (Water Baptism, Burial)**
```
baptism_date or service_date: DATETIME
preferred_baptism_time or preferred_service_time: TIME (separate)
```
- Reasoning: Allows flexible day/time selection
- Conflict check: By minute extraction from TIME field

**Pattern 2: Date + Time Separate (Child Dedication)**
```
preferred_dedication_date: DATE
preferred_dedication_time: TIME
```
- Reasoning: More strict separation between date (must be Sunday) and time
- Conflict check: Exact match on both DATE and TIME with status='approved'

**Pattern 3: Pre-defined Slots (Salvation Talk)**
```
tbl_salvation_availability: availability_date (DATE) + available_time (TIME) + max_slots (INT)
```
- Reasoning: Admin pre-creates available slots, system manages booking into those slots
- Most controlled approach

---

## 4. AVAILABILITY DISPLAY MECHANISMS

### Water Baptism
- **Display**: Side panel shows "Available Sunday Slots"
- **Data**: Likely fetches list of upcoming Sundays and their capacity
- **Selection**: User picks date and time from available options

### Burial Service
- **Display**: Service date/time picker with constraints
- **Data**: `/analyzeAvailability` endpoint returns available slots
- **Selection**: User picks from available evening slots (6-10 PM)

### Child Dedication
- **Display**: List of available Sundays with slot counts
- **Data**: `getAvailableSundayDates` generates 12 weeks of Sundays
- **Selection**: User selects Sunday, then available time slot
- **Algorithm**: Excludes already-booked approved/completed times

### Salvation Talk
- **Display**: Admin-managed calendar of available slots
- **Data**: Queries `tbl_salvation_availability` table
- **Selection**: Admin assigns request to available slot

---

## 5. CONFLICT DETECTION & VALIDATION

### Validation Points

#### 1. Input Validation (Create/Update)
- **Water Baptism**: Must be Sunday
- **Burial Service**: Must be 6-10 PM
- **Child Dedication**: Must be Sunday, must match exact time slot
- **Salvation Talk**: N/A (admin pre-defines)

#### 2. Duplicate Prevention
- **Water Baptism**: No duplicate check (same person can register multiple times)
- **Burial Service**: Prevents duplicate by checking member + deceased person combo
- **Child Dedication**: Prevents duplicate by checking requester + child name + DOB
- **Salvation Talk**: No built-in duplicate check

#### 3. Time Slot Conflict Detection
```javascript
// Common pattern:
async function checkTimeSlotAvailability(date, time, excludeId = null) {
  // Extract minute from time
  const minutes = time.split(':')[1];
  
  // Query existing approved services with same date + minute
  const query = `
    WHERE DATE(date_field) = ?
    AND TIME(time_field) LIKE CONCAT('%:', ?, ':%')
    AND status = 'approved'
  `;
  
  // If match found, slot is booked
  return { isBooked: rows.length > 0 };
}
```

---

## 6. STATUS WORKFLOWS

### Water Baptism
```
pending → approved → completed
       ↓
    disapproved (rejection_reason)
       ↓
    cancelled
```

### Burial Service
```
pending → approved → scheduled → ongoing → completed
       ↓                                ↓
    disapproved               rejected (rejection_reason)
       ↓
    cancelled
```

### Child Dedication
```
pending → approved → completed
       ↓
    disapproved (rejection_reason)
       ↓
    cancelled
```
- **Note**: Admin can set `preferred_dedication_date` and `preferred_dedication_time` when approving

### Salvation Talk
```
pending → scheduled → completed
       ↓
    rejected/cancelled
```

---

## 7. KEY IMPLEMENTATION FILES

### Database Helpers
- [waterBaptismRecords.js](be/dbHelpers/services/waterBaptismRecords.js) - Water baptism CRUD + time slot checks
- [burialServiceRecords.js](be/dbHelpers/services/burialServiceRecords.js) - Burial service + night hours validation + availability analysis
- [childDedicationRecords.js](be/dbHelpers/services/childDedicationRecords.js) - Child dedication + Sunday validation + getAvailableSundayDates()
- [salvationAvailabilityRoutes.js](be/routes/services/salvationAvailabilityRoutes.js) - Salvation slot management

### Routes/API
- [waterBaptismRoutes.js](be/routes/services/waterBaptismRoutes.js) - Endpoints for water baptism
- [burialServiceRoutes.js](be/routes/services/burialServiceRoutes.js) - Endpoints + /analyzeAvailability
- [childDedicationRoutes.js](be/routes/services/childDedicationRoutes.js) - Endpoints + /getAvailableSundayDates
- [salvationAvailabilityRoutes.js](be/routes/services/salvationAvailabilityRoutes.js) - Slot CRUD

### Admin Components (Vue)
- [WaterBaptismDialog.vue](fe/src/components/Dialogs/WaterBaptismDialog.vue) - Water baptism admin form
- [BurialServiceDialog.vue](fe/src/components/Dialogs/BurialServiceDialog.vue) - Burial service admin form
- [ChildDedicationDialog.vue](fe/src/components/Dialogs/ChildDedicationDialog.vue) - Child dedication admin form

### Frontend Components (Public)
- [WaterBaptismRegistration.vue](fe/src/components/LandingPage/Services/WaterBaptismRegistration.vue) - Public water baptism form
- [BurialService.vue](fe/src/components/LandingPage/Services/BurialService.vue) - Public burial service form
- [ChildDedication.vue](fe/src/components/LandingPage/Services/ChildDedication.vue) - Public child dedication form
- [Discipleship.vue](fe/src/components/LandingPage/BeOneOfUs/Discipleship.vue) - Public discipleship form

---

## 8. CURRENT LIMITATIONS & OBSERVATIONS

### Strengths
1. **Flexible Time Slot System**: Minute-based checking allows fine-grained control
2. **Sunday Constraint Enforcement**: Automated Sunday-only validation for baptism/dedication
3. **Night Hours Constraint**: Burial services properly restricted to evening
4. **Conflict Prevention**: Duplicate detection and time slot blocking implemented
5. **Email Notifications**: Automated alerts on create/update/complete

### Potential Issues/Gaps
1. **No Standing Slots Concept**: Current system assumes ad-hoc scheduling, not recurring weekly services
2. **Availability Display**: Water baptism and Burial don't have dedicated "available slots" display - info pulled from dialog validation
3. **Pastor Availability**: No separate pastor availability table - assumes all pastors available all times
4. **Location Capacity**: No tracking of location capacity limits
5. **Advance Booking Rules**: No rules for minimum advance booking (e.g., must book 2 weeks ahead)
6. **Cancellation/Rescheduling**: Can mark as cancelled but no automatic cascade to free up slots

---

## 9. RECOMMENDATIONS FOR ENHANCEMENT

If implementing new availability features, consider:

1. **Unified Availability Engine**: Create abstract slot model that all services use
2. **Pastor Availability Table**: Track pastor availability by week/day
3. **Location Capacity Model**: Define capacity per location per time slot
4. **Recurring Slots**: Support standing slots (e.g., "every Sunday 10 AM")
5. **Waitlist System**: Queue members if slots full
6. **Block Scheduling**: Admin can block times for special events
7. **Notification Triggers**: Automated reminders 1 day, 1 week before scheduled service
8. **Reschedule Workflow**: Allow members to request reschedule within constraints
