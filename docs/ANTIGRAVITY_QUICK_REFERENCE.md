# 🚀 ANTIGRAVITY QUICK REFERENCE
## API Endpoints Cheat Sheet & Quick Lookup

---

# 📍 BASE URL
```
{XANO_BASE_URL} = https://your-xano-instance.n7.xano.io/api:YOUR_GROUP_ID
```

---

# 🔍 QUICK API REFERENCE

## User & Filter Data (Load Page)

```bash
# Get all grades for dropdown
GET {XANO_BASE_URL}/get_all_grades
Response: [{ id, number, label }, ...]

# Get all schools for dropdown
GET {XANO_BASE_URL}/get_all_schools
Response: [{ id, name, location }, ...]

# Get all users (for validation)
GET {XANO_BASE_URL}/get_all_users
Response: [{ id, email, grade, school_id, subscription_type }, ...]
```

---

## User Count (Step 1)

```bash
# Count Premium users
GET {XANO_BASE_URL}/count-users?user_type=premium
Response: { count: 250 }

# Count Premium + Grade 6
GET {XANO_BASE_URL}/count-users?user_type=premium&grade_id=6
Response: { count: 45 }

# Count School type + School 1
GET {XANO_BASE_URL}/count-users?user_type=school&school_id=1
Response: { count: 150 }
```

---

## Asset Lists (Step 2)

```bash
# Get all courses
GET {XANO_BASE_URL}/get_all_courses
Response: [{ id, title, category, duration_minutes, thumbnail_url }, ...]

# Get all workshops
GET {XANO_BASE_URL}/get_all_workshops
Response: [{ id, title, category, description }, ...]

# Get all books
GET {XANO_BASE_URL}/get_all_books
Response: [{ id, title, author, category }, ...]

# Get all byte categories
GET {XANO_BASE_URL}/get_all_byte_categories
Response: [{ id, name, description }, ...]

# Get all categories
GET {XANO_BASE_URL}/get_all_categories
Response: [{ id, name, type }, ...]
```

---

## Mappings CRUD (Step 4 & View)

```bash
# Create new mapping
POST {XANO_BASE_URL}/mappings
Content-Type: application/json
Body: {
  content_type: "course", // or workshop, book, etc.
  content_id: 1,
  content_title: "Python Basics",
  grade_ids: [6, 7, 8], // array
  subscription_type: "premium",
  school_id: 0,
  is_active: true,
  assigned_by: 5,
  starts_at: null,
  expires_at: null,
  notes: "Optional notes"
}
Response: { id, ...same fields... }
Status: 201 Created

---

# Get all mappings (paginated)
GET {XANO_BASE_URL}/mappings?limit=25&offset=0
Response: {
  data: [{ id, content_type, content_id, ... }, ...],
  total: 125,
  page: 1,
  limit: 25
}
Status: 200 OK

---

# Get single mapping
GET {XANO_BASE_URL}/mappings/1
Response: { id, content_type, content_id, ... }
Status: 200 OK

---

# Update mapping
PATCH {XANO_BASE_URL}/mappings/1
Content-Type: application/json
Body: {
  notes: "Updated notes"
  // Only include fields to update
}
Response: { id, ...updated fields... }
Status: 200 OK

---

# Delete mapping
DELETE {XANO_BASE_URL}/mappings/1
Response: { success: true, message: "Deleted" }
Status: 200 OK
```

---

# 🎯 FRONTEND STATE QUICK REFERENCE

## Mapping Form State

```javascript
const formState = {
  // Step 1
  userType: "premium" | "ultra" | "basic" | "school",
  gradeIds: [6, 7, 8],
  schoolIds: [1, 2],
  affectedUsers: 250,
  
  // Step 2
  assetType: "course" | "workshop" | "book" | "byte" | "category",
  selectedAssets: [
    { id: 1, title: "Python Basics", category: "Programming" },
    { id: 2, title: "Web Dev", category: "Web" }
  ],
  
  // Step 3
  accessType: "immediate" | "scheduled" | "temporary",
  startDate: "2024-03-15", // ISO format
  expiryDate: "2024-06-15",
  assignmentMode: "add" | "replace" | "remove",
  notes: "Optional admin notes",
  
  // Step 4 (read-only)
  summary: {
    audience: "Premium Users, Grade 6-8",
    users: 250,
    assets: 2,
    accessType: "Immediate"
  }
};
```

## Mappings List State

```javascript
const listState = {
  data: [], // Array of mappings
  total: 0, // Total count
  page: 1,
  limit: 25,
  loading: false,
  error: null,
  
  filters: {
    search: "",
    assetType: "",
    status: "", // active, expired, scheduled
    dateFrom: null,
    dateTo: null
  }
};
```

---

# 🎨 UI COMPONENT QUICK REFERENCE

## Dropdown Values

```javascript
// User Type
["Premium", "Ultra", "Basic", "School", "All"]

// Access Type
["Immediate Access", "Scheduled Access", "Temporary Access"]

// Assignment Mode
["Add to Existing", "Replace Existing", "Remove Access"]

// Status (for display)
["Active", "Expired", "Scheduled"]

// Asset Type (tabs)
["Courses", "Workshops", "Books", "Bytes", "Categories"]
```

---

# 📱 Common Frontend Patterns

## Load Dropdown Data on Mount
```javascript
useEffect(() => {
  (async () => {
    const grades = await fetch('/get_all_grades').then(r => r.json());
    const schools = await fetch('/get_all_schools').then(r => r.json());
    const courses = await fetch('/get_all_courses').then(r => r.json());
    setGrades(grades);
    setSchools(schools);
    setCourses(courses);
  })();
}, []);
```

## Handle User Type Change
```javascript
const handleUserTypeChange = async (type) => {
  setUserType(type);
  const count = await fetch(`/count-users?user_type=${type}`).then(r => r.json());
  setAffectedUsers(count.count);
};
```

## Handle Asset Selection
```javascript
const handleSelectAsset = (asset) => {
  setSelectedAssets([...selectedAssets, asset]);
};

const handleRemoveAsset = (id) => {
  setSelectedAssets(selectedAssets.filter(a => a.id !== id));
};
```

## Submit Mapping
```javascript
const handleSubmit = async () => {
  const response = await fetch('/mappings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content_type: assetType,
      content_id: selectedAssets.map(a => a.id),
      content_title: selectedAssets.map(a => a.title).join(', '),
      grade_ids: gradeIds,
      subscription_type: userType,
      school_id: schoolIds[0] || 0,
      is_active: true,
      assigned_by: currentUser.id,
      starts_at: startDate || null,
      expires_at: expiryDate || null,
      notes: notes || null
    })
  });
  
  if (response.ok) {
    alert('✅ Mapping created successfully!');
    navigate('/admin/mappings/view');
  } else {
    alert('❌ Error creating mapping');
  }
};
```

## Fetch & Display Mappings
```javascript
const loadMappings = async (page = 1, filters = {}) => {
  setLoading(true);
  const params = new URLSearchParams({
    limit: 25,
    offset: (page - 1) * 25,
    ...filters
  });
  
  const response = await fetch(`/mappings?${params}`);
  const data = await response.json();
  setMappings(data.data);
  setTotal(data.total);
  setLoading(false);
};

// On component mount
useEffect(() => {
  loadMappings();
}, []);
```

## Delete Mapping
```javascript
const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return;
  
  const response = await fetch(`/mappings/${id}`, { method: 'DELETE' });
  if (response.ok) {
    alert('✅ Mapping deleted!');
    loadMappings(); // Refresh list
  }
};
```

---

# ⚠️ COMMON ERRORS & FIXES

## Error: "Cannot read property 'map' of undefined"
**Cause:** grade_ids is not an array
**Fix:** Ensure grade_ids = [6, 7, 8] not "6,7,8"

## Error: "Missing required field: content_id"
**Cause:** Sending empty content_id
**Fix:** Ensure at least one asset is selected

## Error: "Invalid subscription_type"
**Cause:** Sending invalid value
**Fix:** Use only: premium, ultra, basic, school

## Error: 404 Not Found
**Cause:** Wrong API endpoint URL
**Fix:** Check XANO_BASE_URL in .env

## Error: "CORS error"
**Cause:** Xano not allowing requests from your domain
**Fix:** Check Xano API group CORS settings

## Affected Users = 0
**Cause:** No users match the criteria
**Fix:** Check if users exist in database with those grades/schools

---

# 🔄 XANO ENTITLEMENT TABLE STRUCTURE

```javascript
entitlement: {
  id: 42,                           // Auto-generated
  content_type: "course",           // course, workshop, book, byte, category
  content_id: 1,                    // ID of the content
  content_title: "Python Basics",   // Display name
  grade_ids: [6, 7, 8],            // Array of grade numbers
  subscription_type: "premium",     // premium, ultra, basic, school
  school_id: 0,                     // 0 = all schools
  is_active: true,                  // Boolean
  assigned_by: 5,                   // User ID who created
  created_at: "2024-03-03T10:30:00Z",
  updated_at: "2024-03-03T10:30:00Z",
  starts_at: null,                  // Optional
  expires_at: null,                 // Optional
  notes: "Admin notes here"         // Optional
}
```

---

# 📊 SAMPLE DATA FOR TESTING

## Test Course
```json
{
  "id": 1,
  "title": "Python Basics",
  "category": "Programming",
  "duration_minutes": 120,
  "thumbnail_url": "https://example.com/thumb.jpg"
}
```

## Test User
```json
{
  "id": 16,
  "email": "student@school.com",
  "first_name": "John",
  "last_name": "Doe",
  "grade": 6,
  "school_id": 1,
  "subscription_type": "premium"
}
```

## Test School
```json
{
  "id": 1,
  "name": "Lincoln High School",
  "location": "New York, NY"
}
```

## Test Grade
```json
{
  "id": 6,
  "number": 6,
  "label": "Grade 6"
}
```

---

# 🧪 QUICK POSTMAN TESTS

## Test 1: Create Mapping
```
POST {XANO_BASE_URL}/mappings

{
  "content_type": "course",
  "content_id": 1,
  "content_title": "Python Basics",
  "grade_ids": [6, 7],
  "subscription_type": "premium",
  "school_id": 0,
  "is_active": true,
  "assigned_by": 1
}

Expected: 201 Created with mapping ID
```

## Test 2: List Mappings
```
GET {XANO_BASE_URL}/mappings?limit=25&offset=0

Expected: 200 OK with array of mappings
```

## Test 3: Count Users
```
GET {XANO_BASE_URL}/count-users?user_type=premium&grade_id=6

Expected: 200 OK with { count: X }
```

## Test 4: Delete Mapping
```
DELETE {XANO_BASE_URL}/mappings/42

Expected: 200 OK with { success: true }
```

---

# 🎯 DEBUGGING CHECKLIST

- [ ] Check console for JS errors
- [ ] Check Network tab in DevTools for failed requests
- [ ] Verify response status codes (200, 201, 404, 500)
- [ ] Check response body has expected fields
- [ ] Verify Xano table has correct data (query in Xano)
- [ ] Check .env file has correct XANO_BASE_URL
- [ ] Verify API endpoint path matches exactly
- [ ] Check request body JSON format is valid
- [ ] Verify authentication token (if required)
- [ ] Test with Postman first before debugging in frontend

---

# 📞 QUICK CONTACTS

**Backend Issues:** Check Xano workspace logs
**Frontend Issues:** Check browser console
**Database Issues:** Check Xano SQL or table data
**API 404:** Check endpoint path in Xano vs. what frontend is calling

---

**Print this page and keep it handy during development!**
