# Page-Specific Purposes Analysis

## ✅ **YES, It's Possible - But with Significant Complexity**

You **CAN** change purposes/activities according to page-specific rules, but it requires more complex implementation than just changing notice content.

---

## 📊 Current System Architecture

### How It Works Now:
1. **Widget Config** → Has `selected_activities` (array of activity UUIDs)
2. **API** → Fetches ALL activities based on `selected_activities`
3. **Widget** → Displays ALL activities with ALL their purposes
4. **Consent** → Stored at **activity level** (not purpose level)

### Data Structure:
```
Widget Config
  └─ selected_activities: [activity_1, activity_2, activity_3]
       ↓
API Fetches All Activities
  └─ Activity 1
      └─ Purpose A
      └─ Purpose B
  └─ Activity 2
      └─ Purpose C
  └─ Activity 3
      └─ Purpose D
       ↓
Widget Shows ALL Activities & Purposes
       ↓
Consent Recorded: consented_activities: [activity_1, activity_2]
```

---

## 🎯 What You Want: Page-Specific Purposes

### Example Use Cases:
1. **Careers Page**: Show only "Recruitment" activity with "Job Application" purpose
2. **Contact Page**: Show only "Customer Support" activity with "Inquiry Response" purpose
3. **Newsletter Page**: Show only "Marketing" activity with "Email Marketing" purpose

### Two Approaches:

#### **Approach 1: Filter Activities Per Page** (Easier)
- Show different **activities** on different pages
- Example: Careers page shows Activity A, Contact page shows Activity B

#### **Approach 2: Filter Purposes Within Activities** (More Complex)
- Show same activities but different **purposes** on different pages
- Example: Activity A on Careers shows Purpose 1, on Contact shows Purpose 2

#### **Approach 3: Both** (Most Complex)
- Different activities AND different purposes per page

---

## ⚠️ **Complexities & Challenges**

### 1. **Consent Tracking Complexity** 🔴 HIGH

**Current System:**
- Consent stored at **activity level**: `consented_activities: [activity_1, activity_2]`
- No purpose-level consent tracking

**Problem:**
- If Careers page shows Activity 1 with Purpose A
- And Contact page shows Activity 1 with Purpose B
- User consents to Activity 1 on Careers → Does this cover Contact page too?
- **Answer: YES** (current system), but may not be what you want

**Solution Needed:**
- Track consent at **purpose level** OR
- Track which purposes were shown/consented per page OR
- Merge consents intelligently across pages

### 2. **API-Level Filtering** 🟡 MEDIUM

**Current:**
- API fetches ALL activities from `selected_activities`
- No filtering logic

**Needed:**
- Pass page context to API (URL, rule ID)
- Filter activities/purposes in API based on rule
- OR filter in widget after fetching

**Options:**
```typescript
// Option A: Filter in API (better performance)
GET /api/dpdpa/widget-public/[widgetId]?page=/careers
// API returns only relevant activities

// Option B: Filter in Widget (simpler)
// Widget receives all activities, filters based on rule
```

### 3. **Consent Validation Complexity** 🔴 HIGH

**Current:**
- Check if user consented to all activities in widget config
- Simple: `existingConsent.consentedActivities.includes(activityId)`

**With Page-Specific:**
- Check if user consented to activities shown on THIS page
- If user visited Careers (Activity 1) and Contact (Activity 2)
- On Careers page: Check if Activity 1 consented
- On Contact page: Check if Activity 2 consented
- **Need to track which page consent was given on**

### 4. **Consent Merging** 🔴 HIGH

**Scenario:**
1. User visits Careers → Consents to Activity 1
2. User visits Contact → Should show Activity 2
3. User visits Careers again → Should NOT show widget (already consented)

**Problem:**
- Need to track: "User consented to Activity 1 on Careers page"
- Need to check: "Is Activity 1 required on current page?"
- If yes → Don't show widget
- If no → Show widget for Activity 2

### 5. **Privacy Notice Generation** 🟡 MEDIUM

**Current:**
- Privacy notice shows ALL activities from widget config

**With Page-Specific:**
- Privacy notice should show only activities relevant to current page
- Need to regenerate notice HTML per page/rule

### 6. **Re-consent Logic** 🟡 MEDIUM

**Current:**
- If new activities added to widget config → Show widget for re-consent

**With Page-Specific:**
- If new activity added to Careers rule → Show widget on Careers page
- If new activity added to Contact rule → Show widget on Contact page
- Need to track which activities were shown on which page

---

## 🛠️ **Implementation Approaches**

### **Option 1: Activity-Level Filtering (Easier)** ⭐ Recommended First Step

**How It Works:**
- Each rule specifies which activities to show
- Widget filters activities based on matched rule
- Consent still tracked at activity level

**Rule Structure:**
```json
{
  "id": "careers_rule",
  "url_pattern": "/careers",
  "activities": ["activity_recruitment_id"],  // Only show this activity
  "notice_content": { ... }
}
```

**Complexity:** 🟡 **MEDIUM**
- ✅ Simpler consent tracking (still activity-level)
- ✅ Easier to implement
- ⚠️ Still need consent validation per page
- ⚠️ Need to merge consents across pages

**Implementation:**
1. Add `activities` array to each rule
2. Filter `config.activities` in widget based on matched rule
3. Update consent validation to check page-specific activities
4. Track which page consent was given on

### **Option 2: Purpose-Level Filtering (More Complex)**

**How It Works:**
- Each rule specifies which purposes to show within activities
- Widget filters purposes within activities based on matched rule
- Consent tracked at purpose level

**Rule Structure:**
```json
{
  "id": "careers_rule",
  "url_pattern": "/careers",
  "activity_purposes": {
    "activity_recruitment_id": ["purpose_job_application_id"]  // Only show this purpose
  },
  "notice_content": { ... }
}
```

**Complexity:** 🔴 **HIGH**
- ❌ Need purpose-level consent tracking
- ❌ More complex data structure
- ❌ Need to update consent records schema
- ❌ More complex consent validation

**Implementation:**
1. Update consent records to track purposes
2. Add `activity_purposes` mapping to rules
3. Filter purposes in widget
4. Update consent API to handle purpose-level consent

### **Option 3: Hybrid (Most Flexible, Most Complex)**

**How It Works:**
- Rules can specify both activities AND purposes
- Most flexible but most complex

**Complexity:** 🔴 **VERY HIGH**
- All complexities from both approaches
- Need sophisticated consent merging logic

---

## 📋 **Recommended Implementation Plan**

### **Phase 1: Activity-Level Filtering** (2-3 weeks)

**What to Add:**
1. Add `activities` field to display rules
2. Filter activities in widget based on matched rule
3. Update consent validation to check page-specific activities
4. Track consent context (which page/rule)

**Database Changes:**
```sql
-- Add activities to display_rules (already JSONB, so just update structure)
-- No schema changes needed!
```

**API Changes:**
- Option A: Filter in API (pass page context)
- Option B: Return all activities, filter in widget (simpler)

**Widget Changes:**
- Filter `config.activities` based on matched rule
- Update consent validation logic

**Consent Tracking:**
- Add `consent_context` field to track which rule/page consent was given on
- Update consent validation to check if activities for current page are consented

### **Phase 2: Purpose-Level Filtering** (3-4 weeks, if needed)

**What to Add:**
1. Purpose-level consent tracking
2. Purpose filtering in widget
3. Purpose-level consent validation

**Database Changes:**
```sql
-- Add purpose-level consent tracking
ALTER TABLE dpdpa_consent_records
ADD COLUMN consented_purposes JSONB DEFAULT '{}'::jsonb;
-- Structure: { "activity_id": ["purpose_id_1", "purpose_id_2"] }
```

---

## 🎯 **Summary**

### **Is It Possible?**
✅ **YES** - Both activity-level and purpose-level filtering are possible

### **Complexity Assessment:**

| Approach | Complexity | Time Estimate | Recommended? |
|----------|-----------|---------------|--------------|
| **Activity-Level Filtering** | 🟡 MEDIUM | 2-3 weeks | ✅ **YES - Start Here** |
| **Purpose-Level Filtering** | 🔴 HIGH | 3-4 weeks | ⚠️ Only if needed |
| **Hybrid** | 🔴 VERY HIGH | 5-6 weeks | ❌ Not recommended initially |

### **Key Challenges:**
1. 🔴 **Consent Tracking** - Need to track which activities/purposes consented per page
2. 🔴 **Consent Validation** - Check if current page's activities are consented
3. 🔴 **Consent Merging** - Merge consents across different pages
4. 🟡 **API Filtering** - Filter activities/purposes in API or widget
5. 🟡 **Privacy Notice** - Generate page-specific privacy notices

### **Recommendation:**
1. **Start with Activity-Level Filtering** - Easier to implement, covers most use cases
2. **Test thoroughly** - Ensure consent tracking works correctly
3. **Add Purpose-Level if needed** - Only if you really need purpose-level granularity

---

## 💡 **Quick Example: Activity-Level Implementation**

### Rule Structure:
```json
{
  "id": "careers_rule",
  "url_pattern": "/careers",
  "activities": ["recruitment_activity_id"],  // Only show this activity
  "notice_content": {
    "title": "Career Application Consent",
    "message": "..."
  }
}
```

### Widget Logic:
```javascript
function evaluateDisplayRules() {
  const rule = findMatchingRule();
  if (rule && rule.activities) {
    // Filter activities based on rule
    config.activities = config.activities.filter(a => 
      rule.activities.includes(a.id)
    );
  }
}
```

### Consent Validation:
```javascript
function checkConsentForCurrentPage() {
  const rule = findMatchingRule();
  const requiredActivities = rule.activities || config.selected_activities;
  
  // Check if user consented to activities required for this page
  const allConsented = requiredActivities.every(activityId =>
    existingConsent.consentedActivities.includes(activityId)
  );
  
  return allConsented;
}
```

---

## 📚 **Next Steps**

1. **Decide on approach** - Activity-level or purpose-level?
2. **Plan implementation** - Start with activity-level filtering
3. **Update database** - Add consent context tracking
4. **Update API** - Add filtering logic (optional)
5. **Update widget** - Filter activities based on rules
6. **Update consent tracking** - Track which page/rule consent was given on
7. **Test thoroughly** - Ensure consent validation works correctly

---

**Questions?** The activity-level approach is recommended as a first step - it's much simpler and covers most use cases!

