# DPDPA Complete Implementation Guide
## From Industry Templates to Live Consent Notices

This guide explains the **complete flow** of how industry templates become user-facing consent notices on your website.

---

## 🎯 **The Complete Flow**

```
Industry Templates 
    ↓
Processing Activities (Your Database)
    ↓
Widget Configuration (Select Activities)
    ↓
Generate Privacy Notice (Optional)
    ↓
Widget Code (Embed on Website)
    ↓
Live Consent Notice (Users See & Interact)
    ↓
Consent Records (Stored with Unique IDs)
```

---

## 📋 **Step-by-Step Implementation**

### **Step 1: Choose Industry Templates & Create Activities**

**Location:** Dashboard > DPDPA > Processing Activities

**What it does:** Import pre-configured processing activities for your industry

**How to use:**
1. Click "Industry Templates" button
2. Browse available templates:
   - E-commerce (6 activities)
   - Banking & Financial Services (6 activities)
   - Healthcare (6 activities)
   - Education (6 activities)
   - Real Estate (6 activities)
   - Travel & Hospitality (6 activities)
   - Telecommunications (6 activities)
   - Other Industries (3 generic activities)

3. Click "View & Select Activities" on your industry
4. Select the activities relevant to your business (bulk select supported)
5. Click "Add X Activities"

**Result:** Activities are saved to your database and ready to use

**Example Activities Created:**
- Customer Registration
- Order Processing
- Payment Processing
- Marketing Communications
- Customer Support
- Product Reviews & Ratings

**Can I edit them?**
Yes! Click the edit icon on any activity to customize:
- Activity name
- Purpose description
- Data categories collected
- Retention period
- Data sources
- Legal basis

---

### **Step 2: Configure Your Consent Widget**

**Location:** Dashboard > DPDPA > Widget

**What it does:** Creates a consent widget that displays your activities to users

**How to use:**
1. Fill in basic settings:
   - Widget Name (internal reference)
   - Domain (where it will be deployed)
   - Title (what users see: "Your Data Privacy Rights")
   - Message (explanation text)
   - Language preference

2. Customize appearance (optional):
   - Theme colors
   - Button text
   - Position and layout

3. **Select Processing Activities:**
   - Check the activities you want to include in the consent notice
   - These are the activities users will see and provide consent for
   - Each activity appears as a separate consent option

4. Configure behavior:
   - Auto-show on page load
   - Show delay (milliseconds)
   - Consent duration (days)
   - Respect Do Not Track
   - Show data subject rights

5. Click "Save Configuration"

**Result:** Widget is created with a unique Widget ID

---

### **Step 3: Generate Privacy Notice (Optional but Recommended)**

**Location:** Dashboard > DPDPA > Activities (or use API)

**What it does:** Generates a complete privacy notice based on your selected activities

**How to use:**

**Option A: Via API**
```javascript
const response = await fetch('/api/dpdpa/notice-generator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    activityIds: ['activity-id-1', 'activity-id-2'],
    format: 'html' // or 'text'
  })
});

const { notice } = await response.json();
// notice.html contains full HTML privacy notice
// notice.plainText contains text version
```

**Option B: Manual Creation**
Use the generated notice as a template for your privacy policy page

**Result:** Complete, DPDPA-compliant privacy notice you can:
- Add to your website's privacy policy page
- Share with users
- Include in consent emails
- Use as documentation

**What's included:**
- All selected processing activities
- Purpose and data categories for each
- Retention periods
- Data sources
- Your rights under DPDPA 2023
- Contact information
- Compliance statement

---

### **Step 4: Get Integration Code**

**Location:** Dashboard > DPDPA > Integration

**What it does:** Provides embed code to add the widget to your website

**How to use:**
1. Copy the embed code:

```html
<!-- Consently DPDPA Widget -->
<script src="https://your-domain.com/dpdpa-widget.js" 
        data-dpdpa-widget-id="dpdpa_xxxxx_yyyyy"
        data-dpdpa-email="{{user_email}}"><!-- optional -->
</script>
```

2. Add to your website before `</body>` tag

**Framework-specific examples provided for:**
- React
- Next.js
- WordPress
- Plain HTML

---

### **Step 5: Deploy Widget on Your Website**

**What happens:** When users visit your website:

1. **Widget Loads**
   - Fetches configuration from your server
   - Loads selected processing activities
   - Checks for existing consent

2. **Widget Displays** (if no consent exists)
   - Shows consent notice modal/banner
   - Lists all processing activities you selected
   - Shows purpose, data categories, retention for each
   - Displays "Your Data Rights" section

3. **User Interactions:**
   - **Accept All:** Grants consent for all activities
   - **Reject All:** Denies consent for all activities
   - **Individual Accept/Reject:** Granular consent per activity
   - **Withdraw/Modify:** Opens widget to change preferences
   - **Raise Grievance:** Submit data rights request

4. **Consent Recorded:**
   - Unique consent ID generated
   - Timestamp recorded
   - Activity-level consent stored
   - IP, device, browser info captured
   - Email (if provided) associated

5. **Receipt Offered:**
   - Download consent receipt (JSON)
   - Email copy (if email provided)
   - Auto-dismisses after 10 seconds

---

## 🔄 **How Activities Become Consent Notices**

### **For Admins (You):**

1. **Create/Import Activities**
   - Use templates or create custom
   - Define what data you process and why

2. **Select Activities in Widget**
   - Choose which activities to show users
   - Customize widget appearance

3. **Deploy Widget Code**
   - Add script tag to your website
   - Widget automatically shows selected activities

### **For Users (Your Visitors):**

1. **See Consent Notice**
   - Modal appears with your selected activities
   - Each activity shows:
     - Name (e.g., "Customer Registration")
     - Purpose (detailed explanation)
     - Data categories (Email, Name, Phone, etc.)
     - Retention period (how long data is kept)
     - Industry badge

2. **Provide Consent**
   - Accept or reject each activity individually
   - OR accept/reject all at once

3. **Manage Consent Later**
   - Widget provides "Withdraw/Modify" button
   - Can change preferences anytime
   - Can raise grievance for data rights

---

## 📊 **Admin Dashboard Features**

### **Processing Activities Page**
- View all activities
- Edit/delete activities
- Import from templates
- Filter by industry
- Export to JSON

### **Widget Configuration Page**
- Create/edit widgets
- Preview widget appearance
- Select activities to display
- Customize theme and text
- Get embed code

### **Consent Records Page**
- View all consents with unique IDs
- Search by email or consent ID
- Filter by status (accepted/rejected/partial)
- Export to CSV
- Track consent history

### **Analytics Page**
- Total consents
- Acceptance rate per activity
- Consent trends over time
- Device/browser breakdown
- Geographic distribution

### **Grievances Page**
- View user data rights requests
- Categorized by type (access, deletion, etc.)
- Track status (open, in-progress, resolved)
- Add admin notes
- Mark as resolved

---

## 🎯 **Real-World Example**

### **Scenario: E-commerce Store**

#### **Step 1: Import E-commerce Template**
Imports these activities:
- Customer Registration
- Order Processing
- Payment Processing
- Marketing Communications
- Customer Support
- Product Reviews & Ratings

#### **Step 2: Customize Activities**
Edit "Marketing Communications":
- Add specific newsletter tool used
- Update retention period to match policy
- Add specific data categories

#### **Step 3: Configure Widget**
- Select 4 activities to show users:
  1. Customer Registration (mandatory)
  2. Order Processing (mandatory)
  3. Marketing Communications (optional)
  4. Product Reviews (optional)

- Set title: "Help Us Personalize Your Shopping"
- Set message: "We'd love to customize your experience..."

#### **Step 4: Deploy**
Add widget script to Shopify theme's footer

#### **Step 5: User Experience**
When customers visit:
1. See modal with 4 activities
2. Register account = auto-accept Registration + Order Processing
3. Choose to opt-in to marketing newsletter
4. Widget shows confirmation
5. Offers download receipt

#### **Step 6: Admin Monitoring**
Dashboard shows:
- 1,234 consents collected
- 87% acceptance rate for marketing
- 45 grievances submitted (mostly withdrawals)
- Export report for compliance audit

---

## ✅ **Compliance Checklist**

- [ ] **Activities Created:** Import or create all processing activities
- [ ] **Purposes Defined:** Each activity has clear purpose statement
- [ ] **Data Categories Listed:** All data types specified
- [ ] **Retention Periods Set:** How long data is kept
- [ ] **Legal Basis Defined:** Consent, contract, legitimate interest, etc.
- [ ] **Widget Configured:** Widget created with selected activities
- [ ] **Widget Deployed:** Embed code added to website
- [ ] **Privacy Notice Generated:** Full notice available to users
- [ ] **Testing Complete:** Widget tested across devices
- [ ] **Records Accessible:** Can view and search consents
- [ ] **Grievance Process:** Users can raise concerns
- [ ] **Reports Available:** Can export compliance reports

---

## 🚀 **Quick Start Commands**

### **For Developers:**

```javascript
// Initialize widget with user email
window.consentlyDPDPA.setUserEmail('user@example.com');

// Show widget manually
window.consentlyDPDPA.show();

// Get current consent
const consent = window.consentlyDPDPA.getConsent();

// Listen for consent events
window.addEventListener('consentlyDPDPAConsent', (event) => {
  console.log('Consent status:', event.detail.status);
  console.log('Accepted activities:', event.detail.acceptedActivities);
  
  // Enable features based on consent
  if (event.detail.acceptedActivities.includes('marketing-activity-id')) {
    initializeMarketing();
  }
});

// Clear consent (for testing)
window.consentlyDPDPA.clearConsent();

// Download receipt
window.consentlyDPDPA.downloadReceipt();
```

---

## 📝 **API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dpdpa/activities` | GET/POST/PUT/DELETE | Manage processing activities |
| `/api/dpdpa/widget-config` | GET/POST/PUT/DELETE | Manage widget configurations |
| `/api/dpdpa/widget-public/[widgetId]` | GET | Public widget config (no auth) |
| `/api/dpdpa/consent-record` | GET/POST | Consent records management |
| `/api/dpdpa/notice-generator` | POST | Generate privacy notices |
| `/api/dpdpa/analytics` | GET | Widget analytics |
| `/api/dpdpa/compliance-report` | GET | Export compliance reports |
| `/api/dpdpa/grievances` | GET/POST | Manage user grievances |

---

## 🎨 **Customization Options**

### **Widget Appearance:**
- Primary color
- Background color
- Text color
- Font family
- Border radius
- Position (modal, banner, slide-in)

### **Widget Behavior:**
- Auto-show delay
- Consent duration
- Respect DNT
- Require explicit consent
- Show data subject rights
- Show branding

### **Activity Display:**
- Activity name
- Industry badge
- Purpose description
- Data categories (with "show more")
- Retention period
- Accept/Reject buttons per activity

---

## 🔒 **Security & Privacy**

- ✅ Consent IDs are unique and cryptographically random
- ✅ Email addresses can be hashed (SHA-256)
- ✅ IP addresses stored for audit trail
- ✅ No authentication required for public widget endpoints
- ✅ RLS policies ensure users only see their own data
- ✅ CORS enabled for cross-origin widget embedding
- ✅ Consent storage respects specified duration
- ✅ Withdrawal immediately recorded

---

## 📞 **Support & Next Steps**

**Need Help?**
- Check examples in `/docs/DPDPA_WIDGET_IMPLEMENTATION.md`
- Review API documentation
- Test widget with `/test-widget.html`

**Ready to Deploy?**
1. Complete all steps above
2. Test thoroughly on staging
3. Add widget code to production
4. Monitor consent dashboard
5. Respond to grievances within 72 hours

**Compliance Reminder:**
Under DPDPA 2023, you must:
- Respond to data rights requests within 72 hours
- Maintain audit trail of all consents
- Allow users to withdraw consent easily
- Provide clear information about data processing
- Honor user preferences immediately

---

**Your implementation is now complete! 🎉**

Users can see your processing activities, provide granular consent, and exercise their data rights—all through an integrated, compliant consent management system.
