# 🚀 ANTIGRAVITY IMPLEMENTATION PROMPT
## Complete Mapping Admin System with Xano Backend
**Status:** Comprehensive, Production-Ready  
**Task Owner:** Antigravity  
**Tech Stack:** Antigravity Frontend + Xano Backend Database  
**Database:** Xano  
**Goal:** Build complete admin mapping interface without Strapi dependency

---

# 📋 PROJECT OVERVIEW

## What You're Building

A **standalone admin mapping system** that allows content managers to:
1. ✅ Map courses/assets to user groups (by grades, schools, subscriptions)
2. ✅ View all mapped assets in a dashboard
3. ✅ Create, edit, delete, and update mappings
4. ✅ All data persists in **Xano database** (entitlement table)
5. ✅ No Strapi dependency required
6. ✅ Full CRUD operations on mappings

## Architecture

```
┌─────────────────────────────────────────┐
│   ANTIGRAVITY ADMIN INTERFACE            │
│   (HTML/CSS/JS + Your Framework)         │
│                                          │
│   Page 1: Mapping Control               │
│   - Select Audience (User Groups)       │
│   - Select Assets (Courses, Workshops)  │
│   - Set Assignment Rules                │
│   - Confirm & Save                      │
│                                          │
│   Page 2: View Mapped Assets Dashboard  │
│   - Table of all mappings               │
│   - Filter, Search, Edit, Delete        │
│   - Real-time updates from Xano         │
└────────────┬────────────────────────────┘
             │
             ▼ (HTTP REST API Calls)
┌─────────────────────────────────────────┐
│   XANO BACKEND DATABASE                  │
│                                          │
│   Tables:                                │
│   - entitlement (all mappings stored)   │
│   - users (user groups)                 │
│   - courses (assets)                    │
│   - grades                              │
│   - schools                             │
│   - user_groups (subscriptions)         │
│                                          │
│   Endpoints:                             │
│   - GET /mappings (fetch all)           │
│   - POST /mappings (create)             │
│   - PATCH /mappings/:id (update)        │
│   - DELETE /mappings/:id (delete)       │
│   - GET /users (for audience selection) │
│   - GET /courses (for asset selection)  │
│   - GET /grades (for filters)           │
│   - GET /schools (for filters)          │
└─────────────────────────────────────────┘
```

---

# 🛠️ DETAILED REQUIREMENTS

## Page 1: Mapping Control (Create/Edit Mappings)

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  LifeMonk Admin - Mapping Control Center                          │
│  [← Back]                                                [User ▼] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 1: Select Audience (User Group)                            │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ User Type: [Dropdown: Premium / Ultra / School / All]        ││
│  │ Select Grade: [Dropdown: 1-12 or empty for all]             ││
│  │ Select School: [Dropdown: List of schools or All]           ││
│  │                                                              ││
│  │ Affected Users: 250 users match this criteria               ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Step 2: Select Assets (Content to Assign)                       │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Asset Type: [Tabs]                                           ││
│  │ [ Courses ] [ Workshops ] [ Books ] [ Bytes ] [ Categories ] ││
│  │                                                              ││
│  │ Available Assets:                                            ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ □ Course A                                              │ ││
│  │ │ □ Course B                                              │ ││
│  │ │ □ Course C                                              │ ││
│  │ │ □ Course D                                              │ ││
│  │ │                                                          │ ││
│  │ │ [Search assets...]                                      │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  │                                                              ││
│  │ Selected Assets: 3 items                                    ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ ✓ Course A  [×]                                         │ ││
│  │ │ ✓ Course B  [×]                                         │ ││
│  │ │ ✓ Course D  [×]                                         │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Step 3: Assignment Rules (Advanced Options)                     │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Access Type: [Immediate Access ▼]                           ││
│  │ Expiry Date: [Date Picker - Optional]                       ││
│  │ Assignment Mode: [Add to Existing ▼]                        ││
│  │                                                              ││
│  │ Notes: [Text Area - Optional]                               ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Step 4: Preview & Confirm                                       │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Summary:                                                     ││
│  │ ├─ Audience: Premium Users, Grade 9-10                     ││
│  │ ├─ Total Users Affected: 250                                ││
│  │ ├─ Assets to Assign: 3 courses                              ││
│  │ ├─ Access Type: Immediate                                   ││
│  │ └─ Status: Ready to assign                                  ││
│  │                                                              ││
│  │ [  Cancel  ] [ Confirm Assignment ]                         ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Step 1: Select Audience (User Group)

**Fields:**
1. **User Type** (Dropdown - Required)
   - Options: "Premium", "Ultra", "Basic", "School", "All"
   - On change: Update "Affected Users" count via API

2. **Select Grade** (Dropdown - Optional)
   - Options: Fetched from Xano `GET /get_all_grades`
   - Format: Grade 1, Grade 2, ..., Grade 12
   - Multi-select or single select
   - Only show if "School" type selected

3. **Select School** (Dropdown - Optional)
   - Options: Fetched from Xano `GET /get_all_schools`
   - Multi-select allowed
   - Only show if "School" type selected

4. **Affected Users Count** (Display - Read-only)
   - Call API: `GET /api/count-users?user_type={type}&grade={grade}&school={school}`
   - Show: "250 users match this criteria"
   - Update in real-time as user changes filters

**Xano Endpoint Needed:**
```
GET /count-users
Query Params: user_type, grade_id, school_id
Response: { count: number }
```

---

### Step 2: Select Assets (Content)

**Features:**
1. **Asset Type Tabs** (Switch between different asset types)
   - Tab 1: "Courses" - Shows available courses
   - Tab 2: "Workshops" - Shows available workshops
   - Tab 3: "Books" - Shows available books
   - Tab 4: "Bytes" - Shows available byte categories
   - Tab 5: "Categories" - Shows categories (Motivation, Current Affairs, etc.)

2. **Asset List** (Checkbox list with search)
   - Fetch from Xano: `GET /get_all_courses` (or workshops, books, etc.)
   - Display: Checkbox + Asset name + Optional icon
   - Search/filter field to find specific assets
   - Infinite scroll or pagination if > 100 items

3. **Selected Assets Display**
   - Show chips/badges of selected items
   - Allow removal by clicking [×]
   - Show count: "Selected Assets: 3 items"
   - Clear all button

**Xano Endpoints Needed:**
```
GET /get_all_courses
Response: [{ id, title, category, duration_minutes, thumbnail_url }, ...]

GET /get_all_workshops
Response: [{ id, title, category }, ...]

GET /get_all_books
Response: [{ id, title, author, category }, ...]

GET /get_all_byte_categories
Response: [{ id, name }, ...]
```

---

### Step 3: Assignment Rules (Advanced)

**Fields:**
1. **Access Type** (Dropdown)
   - Options: "Immediate Access", "Scheduled Access", "Temporary Access"
   - If "Scheduled": Show date picker for start date
   - If "Temporary": Show expiry date picker

2. **Expiry Date** (Date Picker - Optional)
   - Only show if applicable
   - Format: YYYY-MM-DD
   - Optional field

3. **Assignment Mode** (Dropdown)
   - Options: "Add to Existing", "Replace Existing", "Remove Access"
   - Default: "Add to Existing"

4. **Notes** (Text Area - Optional)
   - Max 500 characters
   - For admin notes/comments about why this mapping was created

---

### Step 4: Preview & Confirm

**Display:**
- Read-only summary of all selections
- Show:
  - Selected audience
  - Number of affected users
  - List of assets to assign
  - Access type and dates
  - Status message

**Actions:**
- [Cancel] - Go back to step 1 (clear form)
- [Confirm Assignment] - Save to Xano and show success message

**On Confirm:**
```javascript
// Call Xano endpoint to create mapping
POST /upsert_entitlement
Body: {
  content_type: "course", // or workshop, book, etc.
  content_id: [array of ids],
  content_title: "Asset name(s)",
  grade_ids: [array of grade numbers],
  subscription_type: "premium", // or ultra, basic, school
  school_id: 0, // or specific school id
  is_active: true,
  assigned_by: current_user_id,
  starts_at: optional_date,
  expires_at: optional_date,
  notes: optional_notes
}

// After success:
- Show: "✅ Assignment successful! 250 users now have access to 3 assets"
- Clear form
- Navigate to "View Mapped Assets" page
```

---

## Page 2: View Mapped Assets Dashboard

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  LifeMonk Admin - View Mapped Assets                              │
│  [← Back]              [+ New Mapping]                [User ▼] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Filters & Search:                                               │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Search: [Search by asset or user group...]                  ││
│  │                                                              ││
│  │ Filters: [Asset Type ▼] [Status ▼] [Date Range ▼] [Clear] ││
│  │                                                              ││
│  │ Showing: 45 of 125 mappings                                 ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Mappings Table:                                                 │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Asset      │ Asset Type │ Audience      │ Users │ Status │  ││
│  │────────────┼────────────┼───────────────┼───────┼────────┼──││
│  │ Course A   │ Course     │ Premium, G9   │ 120   │ Active │E ││
│  │ Course B   │ Course     │ School Type   │ 250   │ Active │E ││
│  │ Workshop 1 │ Workshop   │ Ultra, All G  │  50   │ Active │E ││
│  │ Book X     │ Book       │ Premium, G10  │ 100   │ Active │E ││
│  │ Byte Cat 1 │ Byte       │ All Users     │1500   │ Active │E ││
│  │            │            │               │       │        │   ││
│  │ [Previous] [1][2][3]... [Next]                             ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Column Guide:                                                   │
│  - Asset: Name of course/workshop/book                           │
│  - Asset Type: Course, Workshop, Book, Byte, Category           │
│  - Audience: User group it's assigned to                        │
│  - Users: Count of users affected                               │
│  - Status: Active / Inactive / Expired                          │
│  - Actions: Edit [E] Delete [D] button                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Features

1. **Search & Filter**
   - Search: Full-text search (asset name, audience type)
   - Filter by Asset Type (Courses, Workshops, Books, Bytes, Categories)
   - Filter by Status (Active, Inactive, Expired)
   - Filter by Date Range (Created, Modified)
   - "Clear Filters" button to reset

2. **Table Columns**
   - Asset: Name of the content
   - Asset Type: Type badge (course, workshop, book, byte, category)
   - Audience: Description of user group (e.g., "Premium, Grade 9-10")
   - Users: Count of affected users
   - Status: Active/Inactive/Expired (with color coding)
   - Actions: Edit [E] Delete [D] buttons

3. **Pagination**
   - Show X of Y mappings
   - Pagination buttons: Previous [1][2][3]... Next
   - Items per page: 25 (configurable)

4. **Row Actions**
   - **Edit [E]** - Opens mapping in edit mode (load Step 1-4 form)
   - **Delete [D]** - Confirm delete and remove from Xano

5. **View Mapping Details (Modal/Drawer)**
   - Click on row to view full details
   - Show all fields: asset, audience, users, dates, notes
   - Edit/Delete buttons in modal

---

### Detailed Table Example

```
┌───────────────────┬──────────────┬─────────────────────┬─────────┬────────────┬──────┐
│ Asset             │ Type         │ Audience            │ Users   │ Status     │ Act  │
├───────────────────┼──────────────┼─────────────────────┼─────────┼────────────┼──────┤
│ Python Basics     │ Course       │ Premium, G6-8       │ 120     │ Active ✅  │ E D  │
│ Web Development   │ Course       │ Ultra, All Grades   │ 250     │ Active ✅  │ E D  │
│ Design Workshop   │ Workshop     │ School, G9-12       │ 80      │ Active ✅  │ E D  │
│ Python Advanced   │ Course       │ Premium, G10-12     │ 45      │ Expiring⚠️ │ E D  │
│ Data Science 101  │ Course       │ Ultra, G11-12       │ 30      │ Active ✅  │ E D  │
│ Math Basics       │ Course       │ School, G6          │ 150     │ Expired ❌ │ E D  │
│ Book: Learn JS    │ Book         │ All Users           │ 1500    │ Active ✅  │ E D  │
│ Motivation: Life  │ Category     │ Premium             │ 200     │ Active ✅  │ E D  │
└───────────────────┴──────────────┴─────────────────────┴─────────┴────────────┴──────┘
```

---

# 🔌 XANO API ENDPOINTS REQUIRED

## 1. Authentication (If needed)

```
POST /auth/login
Body: { email, password }
Response: { user, token }
```

## 2. User Groups & Filters

```
GET /get_all_users
Response: [{ id, email, first_name, grade, school_id, subscription_type }, ...]

GET /get_all_grades
Response: [{ id, number, label }, ...]

GET /get_all_schools
Response: [{ id, name, location }, ...]

GET /count-users
Query: ?user_type={type}&grade_id={id}&school_id={id}
Response: { count: number }
```

## 3. Assets (Content)

```
GET /get_all_courses
Response: [{ id, title, category, duration_minutes, thumbnail_url }, ...]

GET /get_all_workshops
Response: [{ id, title, category, description }, ...]

GET /get_all_books
Response: [{ id, title, author, category }, ...]

GET /get_all_byte_categories
Response: [{ id, name, description }, ...]

GET /get_all_categories
Response: [{ id, name, type }, ...]
```

## 4. Mappings (CRUD Operations)

```
GET /mappings
Query: ?filter={}&search={}&limit=25&offset=0
Response: [
  {
    id,
    content_type,
    content_id,
    content_title,
    grade_ids,
    subscription_type,
    school_id,
    is_active,
    user_count,
    assigned_by,
    assigned_at,
    starts_at,
    expires_at,
    notes
  },
  ...
]

GET /mappings/:id
Response: { full mapping object }

POST /mappings (Create new mapping)
Body: {
  content_type,
  content_id,
  content_title,
  grade_ids,
  subscription_type,
  school_id,
  is_active,
  assigned_by,
  starts_at,
  expires_at,
  notes
}
Response: { id, ...rest of mapping object }

PATCH /mappings/:id (Update mapping)
Body: { ...fields to update }
Response: { updated mapping object }

DELETE /mappings/:id
Response: { success: true, message: "Mapping deleted" }
```

---

# 📱 FRONTEND IMPLEMENTATION DETAILS

## Page Navigation

```
URL Structure:
├── /admin/mappings (or /admin/mapping-control)
│   ├── /create (Create new mapping - all 4 steps)
│   ├── /edit/:id (Edit mapping - all 4 steps)
│   └── /view (List all mappings)
│
Buttons:
├── [+ New Mapping] → Navigate to /create
├── [Edit] → Navigate to /edit/:id
├── [Delete] → Show confirm modal → DELETE API call
└── [← Back] → Go to /view
```

## State Management

```javascript
// Mapping Form State
const [formData, setFormData] = {
  // Step 1
  userType: "premium",
  gradeIds: [6, 7, 8],
  schoolIds: [1],
  affectedUsersCount: 0,
  
  // Step 2
  assetType: "course", // course, workshop, book, byte, category
  selectedAssets: [
    { id: 1, title: "Python Basics" },
    { id: 2, title: "Web Dev" }
  ],
  
  // Step 3
  accessType: "immediate", // immediate, scheduled, temporary
  startDate: null,
  expiryDate: null,
  assignmentMode: "add", // add, replace, remove
  notes: "",
  
  // Step 4 (calculated)
  summary: {
    audience: "Premium Users, Grade 6-8",
    users: 250,
    assets: 2,
    accessType: "Immediate",
  }
};

// Mappings List State
const [mappings, setMappings] = {
  data: [],
  total: 0,
  page: 1,
  limit: 25,
  filters: {
    search: "",
    assetType: "",
    status: "",
    dateFrom: null,
    dateTo: null
  },
  loading: false,
  error: null
};
```

## API Call Examples

```javascript
// Fetch affected users count
async function fetchUserCount() {
  const response = await fetch(
    `/api/count-users?user_type=${userType}&grade_id=${gradeIds}&school_id=${schoolIds}`
  );
  const data = await response.json();
  setAffectedUsersCount(data.count);
}

// Fetch courses
async function fetchCourses() {
  const response = await fetch('/get_all_courses');
  return await response.json();
}

// Create mapping
async function createMapping(formData) {
  const response = await fetch('/mappings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content_type: formData.assetType,
      content_id: formData.selectedAssets.map(a => a.id),
      content_title: formData.selectedAssets.map(a => a.title).join(', '),
      grade_ids: formData.gradeIds,
      subscription_type: formData.userType,
      school_id: formData.schoolIds[0] || 0,
      is_active: true,
      assigned_by: currentUser.id,
      starts_at: formData.startDate,
      expires_at: formData.expiryDate,
      notes: formData.notes
    })
  });
  return await response.json();
}

// Fetch all mappings
async function fetchMappings(page, filters) {
  const params = new URLSearchParams({
    limit: 25,
    offset: (page - 1) * 25,
    search: filters.search,
    assetType: filters.assetType,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  });
  
  const response = await fetch(`/mappings?${params}`);
  return await response.json();
}

// Delete mapping
async function deleteMapping(id) {
  const confirmed = confirm('Are you sure you want to delete this mapping?');
  if (!confirmed) return;
  
  const response = await fetch(`/mappings/${id}`, {
    method: 'DELETE'
  });
  return await response.json();
}
```

---

# 🗄️ XANO DATABASE STRUCTURE

## entitlement table (Main Mapping Storage)

```sql
-- Table: entitlement
CREATE TABLE entitlement (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  content_type       ENUM('course', 'workshop', 'book', 'byte', 'category'),
  content_id         INT NOT NULL,
  content_title      VARCHAR(255),
  grade_ids          JSON, -- Array: [6, 7, 8]
  subscription_type  ENUM('premium', 'ultra', 'basic', 'school'),
  school_id          INT DEFAULT 0, -- 0 = all schools
  is_active          BOOLEAN DEFAULT true,
  assigned_by        INT, -- User ID who created mapping
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  starts_at          DATETIME, -- When access begins (optional)
  expires_at         DATETIME, -- When access ends (optional)
  notes              TEXT, -- Admin notes
  
  -- Indexes
  INDEX idx_active (is_active),
  INDEX idx_content (content_type, content_id),
  INDEX idx_subscription (subscription_type),
  INDEX idx_school (school_id),
  INDEX idx_created (created_at)
);
```

## Related tables

```sql
-- users table
CREATE TABLE users (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  email              VARCHAR(255) UNIQUE NOT NULL,
  first_name         VARCHAR(100),
  last_name          VARCHAR(100),
  grade              INT, -- 1-12
  school_id          INT,
  subscription_type  VARCHAR(50), -- premium, ultra, basic, school
  is_active          BOOLEAN DEFAULT true,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- courses table
CREATE TABLE courses (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  title              VARCHAR(255) NOT NULL,
  description        TEXT,
  category           VARCHAR(100),
  duration_minutes   INT,
  thumbnail_url      VARCHAR(500),
  is_published       BOOLEAN DEFAULT false,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- grades table
CREATE TABLE grades (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  number             INT (1-12) UNIQUE,
  label              VARCHAR(50), -- "Grade 1", "10th Grade"
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- schools table
CREATE TABLE schools (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  name               VARCHAR(255) UNIQUE NOT NULL,
  location           VARCHAR(255),
  subscription_type  VARCHAR(50),
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- workshops, books, byte_categories tables (similar structure to courses)
```

---

# ✅ IMPLEMENTATION CHECKLIST

## Frontend (Antigravity)

- [ ] Create `/admin/mappings` page with routing
- [ ] Implement Step 1: Select Audience
  - [ ] User Type dropdown
  - [ ] Grade multi-select dropdown
  - [ ] School multi-select dropdown
  - [ ] Real-time affected users count
  
- [ ] Implement Step 2: Select Assets
  - [ ] Asset Type tabs
  - [ ] Checkbox list for each asset type
  - [ ] Search/filter functionality
  - [ ] Selected assets display with remove option
  
- [ ] Implement Step 3: Assignment Rules
  - [ ] Access Type dropdown
  - [ ] Date pickers (start, expiry)
  - [ ] Assignment Mode dropdown
  - [ ] Notes text area
  
- [ ] Implement Step 4: Preview & Confirm
  - [ ] Display summary
  - [ ] Cancel button (clear form)
  - [ ] Confirm button (API call + success message)
  
- [ ] Create `/admin/mappings/view` page
  - [ ] Table displaying all mappings
  - [ ] Search input
  - [ ] Filter dropdowns
  - [ ] Pagination controls
  - [ ] Edit/Delete action buttons
  - [ ] View details modal
  
- [ ] Implement CRUD operations
  - [ ] Create mapping (POST)
  - [ ] Read mappings (GET with pagination)
  - [ ] Update mapping (PATCH)
  - [ ] Delete mapping (DELETE)
  
- [ ] Error handling
  - [ ] Validation for required fields
  - [ ] Error messages for API failures
  - [ ] Success notifications
  - [ ] Loading states
  
- [ ] UI/UX Polish
  - [ ] Responsive design
  - [ ] Color coding for status (Active, Expired, etc.)
  - [ ] Loading spinners
  - [ ] Proper spacing and typography
  - [ ] Accessibility (ARIA labels, keyboard nav)

## Backend (Xano)

- [ ] Create entitlement table with proper schema
- [ ] Create indexes on frequently queried fields
- [ ] Implement `/get_all_users` endpoint
- [ ] Implement `/get_all_grades` endpoint
- [ ] Implement `/get_all_schools` endpoint
- [ ] Implement `/count-users` endpoint
- [ ] Implement `/get_all_courses` endpoint
- [ ] Implement `/get_all_workshops` endpoint
- [ ] Implement `/get_all_books` endpoint
- [ ] Implement `/get_all_byte_categories` endpoint
- [ ] Implement `GET /mappings` endpoint (with pagination, filters, search)
- [ ] Implement `GET /mappings/:id` endpoint
- [ ] Implement `POST /mappings` endpoint (create)
- [ ] Implement `PATCH /mappings/:id` endpoint (update)
- [ ] Implement `DELETE /mappings/:id` endpoint
- [ ] Add proper error handling (400, 404, 500)
- [ ] Add data validation
- [ ] Add CORS headers if needed

---

# 🧪 TESTING REQUIREMENTS

## Unit Tests

```javascript
// Test dropdown populations
✓ GET /get_all_grades returns array of grades
✓ GET /get_all_schools returns array of schools
✓ GET /get_all_courses returns array of courses

// Test user count calculation
✓ GET /count-users?user_type=premium returns correct count
✓ GET /count-users?user_type=school&grade_id=6 returns correct count

// Test CRUD operations
✓ POST /mappings creates new mapping with correct data
✓ GET /mappings returns paginated list
✓ PATCH /mappings/:id updates mapping
✓ DELETE /mappings/:id removes mapping
```

## Integration Tests

```javascript
// Complete workflow
✓ User selects Premium + Grade 6-8
✓ System shows 250 affected users
✓ User selects 3 courses
✓ User clicks Confirm
✓ API creates 3 mapping records in entitlement table
✓ User navigates to View Mappings
✓ All 3 mappings appear in the table
✓ User can edit one mapping
✓ Update is reflected in table
✓ User can delete a mapping
✓ Mapping is removed from table
```

## Manual Testing Checklist

```
Test Scenario 1: Create Mapping
- [ ] Load Mapping Control page
- [ ] Select "Premium" user type
- [ ] Verify affected users count updates
- [ ] Select Grade 9-10
- [ ] Count updates again
- [ ] Select 2 courses
- [ ] See courses in selected list
- [ ] Remove one course
- [ ] Click Confirm
- [ ] See success message
- [ ] Navigate to View Mappings
- [ ] Verify new mapping appears in table

Test Scenario 2: Edit Mapping
- [ ] Click Edit on a mapping
- [ ] Change grade selection
- [ ] Add another asset
- [ ] Click Confirm
- [ ] See update success message
- [ ] Verify table shows updated data

Test Scenario 3: Delete Mapping
- [ ] Click Delete on a mapping
- [ ] Confirm deletion dialog
- [ ] Mapping disappears from table
- [ ] Verify database was updated

Test Scenario 4: Filter & Search
- [ ] Search for "Python"
- [ ] Table shows only Python-related mappings
- [ ] Filter by "Course"
- [ ] Filter by "Active"
- [ ] Results update correctly
- [ ] Clear filters
- [ ] All mappings show again

Test Scenario 5: Edge Cases
- [ ] Select no assets → show error
- [ ] Select no user type → show error
- [ ] Create mapping with same data twice → should update existing
- [ ] Create mapping with future start date → shows "Scheduled"
- [ ] Create mapping with past expiry → shows "Expired"
```

---

# 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│  Admin User loads /admin/mappings/create                │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Fetch Initial Data         │
        │  - GET /get_all_grades      │
        │  - GET /get_all_schools     │
        │  - GET /get_all_courses     │
        │  - GET /get_all_workshops   │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ Step 1: Select Audience     │
        │ - User selects dropdown     │
        │ - On change: GET /count-... │
        │ - Show affected users       │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ Step 2: Select Assets       │
        │ - Show checkboxes           │
        │ - User selects assets       │
        │ - Show selected items       │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ Step 3: Assignment Rules    │
        │ - User fills optional fields│
        │ - Set expiry dates if needed│
        │ - Add notes                 │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ Step 4: Preview & Confirm   │
        │ - Show summary              │
        │ - User clicks Confirm       │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ POST /mappings              │
        │ Create mapping in Xano      │
        │ Return { id, ... }          │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ Success Message             │
        │ "Assignment created for     │
        │  250 users"                 │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ Navigate to /view           │
        │ GET /mappings?limit=25      │
        │ Display table               │
        └─────────────────────────────┘


Edit Flow:
GET /mappings/:id → Load form with existing data → Allow edits → 
PATCH /mappings/:id → Success → Navigate to /view

Delete Flow:
Click Delete → Confirm dialog → DELETE /mappings/:id → 
Remove from table → Success message
```

---

# 🎯 KEY REQUIREMENTS SUMMARY

## Must-Have Features
1. ✅ Create new mappings with 4-step wizard
2. ✅ View all mappings in filterable table
3. ✅ Edit existing mappings
4. ✅ Delete mappings
5. ✅ Search and filter mappings
6. ✅ Real-time affected users count
7. ✅ All data persisted in Xano entitlement table
8. ✅ Support multiple asset types (courses, workshops, books, bytes, categories)
9. ✅ Support multiple user group types (premium, ultra, basic, school)
10. ✅ Optional: Expiry dates and start dates for scheduled access

## Nice-to-Have Features
1. 🟡 Bulk import mappings (CSV)
2. 🟡 Export mappings to CSV
3. 🟡 Mapping history/audit log
4. 🟡 Clone existing mapping
5. 🟡 Mapping templates
6. 🟡 Analytics dashboard (most mapped courses, etc.)
7. 🟡 Notifications when mappings expire

## Non-Requirements
- ❌ No Strapi dependency
- ❌ No Strapi UI integration
- ❌ No mobile app admin (desktop only)

---

# 🚀 DEPLOYMENT INSTRUCTIONS

1. **Setup Xano:**
   - Create all required tables
   - Create all required endpoints
   - Test endpoints with Postman

2. **Setup Antigravity:**
   - Create new Antigravity project
   - Configure environment variables (Xano API URLs)
   - Build UI pages (create, view, edit)
   - Implement API integrations

3. **Environment Variables:**
```
XANO_BASE_URL=https://your-xano-instance.n7.xano.io/api:YOUR_API_GROUP_ID
XANO_MEMBERS_BASE_URL=https://your-xano-instance.n7.xano.io/api:YOUR_MEMBERS_GROUP_ID
XANO_COURSES_BASE_URL=https://your-xano-instance.n7.xano.io/api:YOUR_COURSES_GROUP_ID
ADMIN_API_URL=https://your-antigravity-url.com/api
```

4. **Testing:**
   - Run all manual tests from checklist
   - Verify data in Xano tables
   - Test with 1000+ mappings to check performance
   - Verify pagination works correctly

5. **Launch:**
   - Deploy Xano endpoints
   - Deploy Antigravity pages
   - Train admin users
   - Monitor logs for errors

---

# 📞 SUPPORT & QUESTIONS

If Antigravity has questions:
1. Check the "Data Flow Diagram" section
2. Review the "API Endpoints" section for exact request/response formats
3. Check "Implementation Checklist" to verify all steps
4. Test with Postman using provided endpoint documentation

---

**This prompt is comprehensive and production-ready. Antigravity should be able to execute this without additional requirements.**

**Total Effort Estimate:** 40-60 hours for complete implementation
**Timeline:** 2-3 weeks with 1-2 developers
