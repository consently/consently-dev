# Consently Documentation

## 📚 **Documentation Index**

### **🎯 Start Here**

If you're implementing DPDPA consent management for the first time:

**👉 [DPDPA Complete Implementation Guide](./DPDPA_COMPLETE_IMPLEMENTATION_GUIDE.md)**

This is your **complete, step-by-step guide** showing:
- How industry templates work
- How to create processing activities
- How activities become consent notices
- The complete integration flow
- Real-world examples
- Compliance checklist

---

### **📖 DPDPA Documentation**

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[DPDPA Complete Implementation Guide](./DPDPA_COMPLETE_IMPLEMENTATION_GUIDE.md)** | End-to-end setup guide | ⭐ **START HERE** - First time implementation |
| **[DPDPA Widget Implementation](./DPDPA_WIDGET_IMPLEMENTATION.md)** | Technical widget details | After setup, for customization |

---

### **🍪 Cookie Consent Documentation**

| Document | Purpose |
|----------|---------|
| **[Cookie Module Implementation](./COOKIE_MODULE_IMPLEMENTATION.md)** | Cookie consent features |
| **[Export and Banner Implementation](./EXPORT_AND_BANNER_IMPLEMENTATION.md)** | Banner customization |

---

### **📊 General Documentation**

| Document | Purpose |
|----------|---------|
| **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** | Platform overview |
| **[Production Implementation](./PRODUCTION_IMPLEMENTATION_SUMMARY.md)** | Production deployment |

---

## 🚀 **Quick Start**

### **For DPDPA Compliance:**

```bash
# 1. Create processing activities (or import from templates)
Dashboard > DPDPA > Processing Activities > Industry Templates

# 2. Configure widget
Dashboard > DPDPA > Widget > Select Activities

# 3. Get embed code
Dashboard > DPDPA > Integration > Copy Code

# 4. Deploy to website
Add script tag to your site before </body>
```

### **For Cookie Consent:**

```bash
# 1. Scan your website
Dashboard > Cookies > Scanner

# 2. Configure banner
Dashboard > Cookies > Widget

# 3. Get embed code
Dashboard > Cookies > Integration

# 4. Deploy
Add script tag to your site
```

---

## ❓ **Common Questions**

### **"How do processing activities become consent notices?"**

1. You create/import activities (what data you process)
2. You select activities in widget config
3. Widget displays them to users on your website
4. Users provide granular consent for each activity
5. Consent is recorded with unique IDs

**[Full explanation here →](./DPDPA_COMPLETE_IMPLEMENTATION_GUIDE.md#-how-activities-become-consent-notices)**

---

### **"Where do users see these activities?"**

Activities appear in the **consent widget modal** on your website. Each activity shows:
- Activity name (e.g., "Marketing Communications")
- Purpose (why you need this data)
- Data categories (what data you collect)
- Retention period (how long you keep it)
- Accept/Reject buttons

---

### **"How do I integrate industry templates?"**

Templates are **pre-configured activities** for your industry:

1. Click "Industry Templates" button
2. Select your industry (E-commerce, Healthcare, etc.)
3. Choose which activities to import
4. Activities are added to your database
5. Select them in widget configuration
6. They appear in the widget on your site

**[Detailed guide →](./DPDPA_COMPLETE_IMPLEMENTATION_GUIDE.md#step-1-choose-industry-templates--create-activities)**

---

### **"Can I generate privacy notices from activities?"**

Yes! Use the notice generator API:

```javascript
POST /api/dpdpa/notice-generator
{
  "activityIds": ["id1", "id2"],
  "format": "html"
}
```

Returns a complete DPDPA-compliant privacy notice you can:
- Add to your privacy policy page
- Share with users
- Use for documentation

**[Full API docs →](./DPDPA_COMPLETE_IMPLEMENTATION_GUIDE.md#step-3-generate-privacy-notice-optional-but-recommended)**

---

## 🔄 **Implementation Flow Diagram**

```
┌─────────────────────────────────────────────────────────┐
│  1. ADMIN: Choose Industry Template                     │
│     (E-commerce, Healthcare, Banking, etc.)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. SYSTEM: Import Processing Activities                │
│     - Customer Registration                             │
│     - Order Processing                                  │
│     - Marketing Communications                          │
│     (Saved to database)                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. ADMIN: Configure Consent Widget                     │
│     - Select which activities to show                   │
│     - Customize appearance                              │
│     - Get widget ID and embed code                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. ADMIN: Deploy Widget on Website                     │
│     <script src="widget.js"                             │
│             data-widget-id="xxx"></script>              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. USER: Sees Consent Notice                           │
│     Modal with all selected activities                  │
│     - Each activity has Accept/Reject button            │
│     - Shows purpose, data categories, retention         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. USER: Provides Consent                              │
│     - Accepts some activities                           │
│     - Rejects others                                    │
│     - Gets unique consent ID                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  7. SYSTEM: Records Consent                             │
│     - Stores with unique ID                             │
│     - Tracks which activities accepted/rejected         │
│     - Offers download receipt                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  8. ADMIN: Monitor Dashboard                            │
│     - View all consents                                 │
│     - Search by consent ID or email                     │
│     - Export compliance reports                         │
│     - Handle grievances                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 **Key Features Implemented**

### **DPDPA Consent Management**
- ✅ Industry-specific activity templates
- ✅ Custom activity creation
- ✅ Widget configuration with activity selection
- ✅ Live consent widget (modal/banner/slide-in)
- ✅ Granular per-activity consent
- ✅ Unique consent IDs
- ✅ Consent records with search
- ✅ Privacy notice generator
- ✅ Grievance management
- ✅ Compliance reports (JSON/CSV/PDF)
- ✅ Analytics dashboard

### **User Features**
- ✅ Accept/reject individual activities
- ✅ Withdraw/modify consent
- ✅ Raise grievances
- ✅ Download consent receipt
- ✅ Email consent copy
- ✅ View data rights information

### **Admin Features**
- ✅ Import bulk activities from templates
- ✅ Edit/customize activities
- ✅ Configure multiple widgets
- ✅ Preview widget appearance
- ✅ View consent records
- ✅ Search by consent ID or email
- ✅ Export reports
- ✅ Track grievances
- ✅ Activity-level analytics

---

## 📧 **Support**

Need help? Check:
1. **[Complete Implementation Guide](./DPDPA_COMPLETE_IMPLEMENTATION_GUIDE.md)** - Most questions answered here
2. API documentation in each guide
3. Code examples in `/public/test-widget.html`
4. Integration examples in Dashboard > DPDPA > Integration

---

## ✅ **Compliance Notes**

All documentation assumes compliance with:
- **DPDPA 2023** (India)
- **GDPR** (where applicable)
- **Best practices** for consent management

Remember:
- Respond to data rights requests within **72 hours**
- Maintain **audit trail** of all consents
- Allow **easy withdrawal** of consent
- Provide **clear information** about data processing
- Honor user preferences **immediately**

---

**Last Updated:** October 2024
