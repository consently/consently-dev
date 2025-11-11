# Purposes System Documentation

## Overview

The Consently DPDPA system uses a unified purposes architecture where both **predefined** and **custom** purposes follow the exact same structure and behavior. The only difference is the `is_predefined` flag.

## Database Structure

### purposes Table

```sql
CREATE TABLE purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose_name VARCHAR(255) NOT NULL UNIQUE,      -- Unique identifier
  name VARCHAR(255),                               -- Display name  
  description TEXT,                                 -- Purpose description
  data_category VARCHAR(255),                       -- Optional metadata
  retention_period VARCHAR(255),                    -- Optional metadata
  is_predefined BOOLEAN DEFAULT false,              -- TRUE for predefined, FALSE for custom
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Key Fields

- **purpose_name**: Unique identifier (enforced by database constraint)
- **is_predefined**: 
  - `true` → Predefined purpose (created by system/migrations)
  - `false` → Custom purpose (created by users)
- **name**: Display name shown in UI
- **description**: Detailed explanation of the purpose

## API Endpoints

### GET /api/dpdpa/purposes

Fetches all purposes (both predefined and custom).

**Query Parameters:**
- `predefined=true` - Returns only predefined purposes

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "purpose_name": "Account Management",
      "name": "Account Management",
      "description": "Managing user accounts and authentication",
      "is_predefined": true,
      "created_at": "2025-01-05T...",
      "updated_at": "2025-01-05T..."
    },
    {
      "id": "uuid",
      "purpose_name": "Marketing Analytics",
      "name": "Marketing Analytics",
      "description": "Track marketing performance",
      "is_predefined": false,
      "created_at": "2025-01-05T...",
      "updated_at": "2025-01-05T..."
    }
  ]
}
```

### POST /api/dpdpa/purposes

Creates a new custom purpose.

**Request Body:**
```json
{
  "purposeName": "Marketing Analytics",
  "description": "Track marketing campaign performance",
  "dataSources": ["Website", "Mobile App"],
  "dataRecipients": ["Analytics Team"]
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "purpose_name": "Marketing Analytics",
    "name": "Marketing Analytics",
    "description": "Track marketing campaign performance",
    "is_predefined": false,
    "created_at": "2025-01-05T...",
    "updated_at": "2025-01-05T..."
  }
}
```

**Conflict Response (409):**
```json
{
  "error": "A purpose with this name already exists",
  "existingPurpose": {
    "id": "uuid",
    "purposeName": "Marketing Analytics",
    "isPredefined": false
  }
}
```

## Usage in Activities

Both predefined and custom purposes are used identically when creating/editing processing activities:

```typescript
// Creating an activity with purposes
const activity = {
  activityName: "User Registration",
  industry: "e-commerce",
  purposes: [
    {
      purposeId: "uuid-of-predefined-purpose",  // Could be predefined
      purposeName: "Account Management",
      legalBasis: "consent",
      customDescription: "Optional context",
      dataCategories: [
        { categoryName: "Email", retentionPeriod: "3 years" },
        { categoryName: "Name", retentionPeriod: "3 years" }
      ]
    },
    {
      purposeId: "uuid-of-custom-purpose",      // Could be custom
      purposeName: "Marketing Analytics",
      legalBasis: "consent",
      dataCategories: [
        { categoryName: "Behavior Data", retentionPeriod: "1 year" }
      ]
    }
  ],
  dataSources: ["Website Registration Form"],
  dataRecipients: ["Internal Teams"]
};
```

## Frontend Components

### PurposeManager Component

The `PurposeManager` component (`components/ui/purpose-manager.tsx`) handles both types of purposes:

**Features:**
- Displays predefined and custom purposes in separate optgroups
- Creates new custom purposes on-the-fly
- Handles duplicate purpose names gracefully
- Both types work identically when selected

**UI Flow:**
1. User clicks "Add Purpose" → New purpose card appears
2. User selects from dropdown (shows both predefined and custom)
3. User can click "Create Custom Purpose" to add new one
4. If custom purpose name exists, it's automatically added to the activity

## How They Work Together

### Creating Activities

1. **With Predefined Purpose:**
   - Select "Account Management" from dropdown
   - Add data categories (Email, Name, etc.)
   - Save activity → Works perfectly ✅

2. **With Custom Purpose:**
   - Click "Create Custom Purpose"
   - Enter "Customer Analytics"
   - Purpose is created with `is_predefined=false`
   - Select it from dropdown (appears in "Custom Purposes" section)
   - Add data categories
   - Save activity → Works identically to predefined ✅

### Database Relationships

```
processing_activities
  ↓
activity_purposes (references purposes.id)
  ↓
purpose_data_categories
```

The `activity_purposes` table doesn't care if a purpose is predefined or custom - it just stores the reference via `purpose_id`.

## Key Principles

### 1. **Structural Equality**
Both types have identical database schema and fields.

### 2. **Functional Equality**
Both types work the same way in activities, widgets, and reports.

### 3. **Single Distinguisher**
Only `is_predefined` boolean differentiates them.

### 4. **Case-Insensitive Uniqueness**
Purpose names are unique (case-insensitive) across both types.

### 5. **User Flexibility**
Users can create custom purposes anytime, anywhere they can use predefined ones.

## Row Level Security (RLS)

```sql
-- All authenticated users can read ALL purposes (predefined + custom)
CREATE POLICY "Allow authenticated users to read purposes"
  ON purposes FOR SELECT
  TO authenticated
  USING (true);

-- Users can only create custom purposes (is_predefined = false)
CREATE POLICY "Allow authenticated users to create custom purposes"
  ON purposes FOR INSERT
  TO authenticated
  WITH CHECK (is_predefined = false);
```

## Predefined Purposes List

The system comes with 10 predefined purposes:

1. **Marketing and Advertising** - Promotional campaigns and targeted advertising
2. **Analytics and Research** - User behavior analysis
3. **Customer Support** - Technical support and service
4. **Transaction Processing** - Payment and financial transactions
5. **Account Management** - User accounts and authentication
6. **Legal Compliance** - Meeting legal obligations
7. **Security and Fraud Prevention** - System protection
8. **Product Improvement** - Enhancing services
9. **Communication** - Notifications and updates
10. **Personalization** - Customizing user experience

## Testing Custom Purposes

### Manual Test:

1. Go to Processing Activities page
2. Click "Add Activity" or edit existing
3. In purposes section, click "Create Custom Purpose"
4. Enter:
   - Purpose Name: "Custom Analytics"
   - Description: "Track custom metrics"
5. Click "Create Purpose"
6. Purpose appears in dropdown under "Custom Purposes"
7. Select it and add data categories
8. Save activity
9. ✅ Activity saved successfully with custom purpose

### Verification:

```sql
-- Check the purpose was created correctly
SELECT id, purpose_name, is_predefined, created_at
FROM purposes
WHERE purpose_name = 'Custom Analytics';

-- Verify it's used in activity
SELECT ap.id, ap.activity_id, p.purpose_name, p.is_predefined
FROM activity_purposes ap
JOIN purposes p ON ap.purpose_id = p.id
WHERE p.purpose_name = 'Custom Analytics';
```

## Common Issues & Solutions

### Issue: "Purpose not found" error
**Solution:** Ensure the purposeId exists in the purposes table

### Issue: Custom purpose not appearing in dropdown
**Solution:** Check RLS policies allow reading all purposes

### Issue: Duplicate purpose name error (409)
**Solution:** This is expected - the UI handles it by using the existing purpose

### Issue: Custom purpose behaves differently than predefined
**Solution:** This shouldn't happen - both use identical code paths. Check the is_predefined flag is set correctly.

## Migration Path

If you have old activities using legacy structure, migrate them using:

```typescript
// Old structure
{
  activity_name: "Registration",
  purpose: "Account creation and management",
  data_attributes: ["Email", "Name"]
}

// New structure  
{
  activityName: "Registration",
  purposes: [{
    purposeId: "<Account Management UUID>",
    purposeName: "Account Management",
    legalBasis: "consent",
    dataCategories: [
      { categoryName: "Email", retentionPeriod: "3 years" },
      { categoryName: "Name", retentionPeriod: "3 years" }
    ]
  }]
}
```

## Best Practices

1. **Use Predefined When Possible:** They're well-defined and standardized
2. **Create Custom for Specific Needs:** When your use case isn't covered
3. **Clear Naming:** Make custom purpose names descriptive and unique
4. **Add Descriptions:** Help future you understand what the purpose is for
5. **Consistent Legal Basis:** Match the legal basis to the actual justification

## Conclusion

The purposes system provides maximum flexibility while maintaining consistency. Users can seamlessly mix predefined and custom purposes in any activity, knowing they'll work identically. The only difference is origin - system-provided vs. user-created.
