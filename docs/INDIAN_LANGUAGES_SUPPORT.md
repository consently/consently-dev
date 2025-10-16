# 🇮🇳 Indian Languages Support

Complete support for 5 major Indian languages (Schedule 8) with auto-generated consent banners.

## Supported Languages

✅ **Hindi** (हिन्दी) - `hi`  
✅ **Bengali** (বাংলা) - `bn`  
✅ **Tamil** (தமிழ்) - `ta`  
✅ **Telugu** (తెలుగు) - `te`  
✅ **Marathi** (मराठी) - `mr`

## Features

- 🌐 **Pre-translated Content**: Complete translations for all consent banner elements
- 📱 **Native Scripts**: Authentic translations in native scripts (Devanagari, Bengali, Tamil, Telugu)
- ⚡ **Auto-detection**: Automatic language detection and fallback
- 🎨 **RTL Support**: Right-to-left text support where needed
- 🔄 **Easy Integration**: Simple API to add or customize translations

## Implementation Details

### Files Created

1. **`lib/constants/indian-languages.ts`**
   - Constants for all 22 Schedule 8 languages
   - Language metadata (codes, names, scripts, regions)
   - Helper functions for language operations

2. **`lib/indian-language-translations.ts`**
   - Pre-configured translations for 5 major languages
   - Complete consent banner text in native languages
   - Type-safe translation interface

3. **`scripts/import-indian-languages.js`**
   - Bulk import script for translations
   - Generates JSON export file
   - Easy integration with database

4. **`indian-language-translations.json`**
   - JSON export of all translations
   - Can be imported directly into database

### Translation Structure

Each language includes translations for:

```typescript
{
  banner: {
    title: string;
    message: string;
    accept_button: string;
    reject_button: string;
    settings_button: string;
    privacy_policy_link: string;
  },
  settings_modal: {
    title: string;
    description: string;
    save_button: string;
    accept_all_button: string;
    reject_all_button: string;
    close_button: string;
  },
  categories: {
    necessary: { name, description },
    functional: { name, description },
    analytics: { name, description },
    advertising: { name, description }
  },
  messages: {
    consent_saved: string;
    consent_updated: string;
    error_message: string;
  }
}
```

## Usage

### Via API

#### Get Translation by Language Code

```bash
GET /api/cookies/translations?language=hi
```

Response:
```json
{
  "success": true,
  "data": {
    "language_code": "hi",
    "language_name": "हिन्दी",
    "is_rtl": false,
    "translations": { ... }
  },
  "is_default": true
}
```

#### Get All Supported Languages

```bash
GET /api/cookies/translations
```

Response includes `supported_languages` array with all available languages including Indian languages.

#### Import Translations (Bulk)

```bash
POST /api/cookies/translations
Content-Type: application/json

{
  "translations": [
    {
      "language_code": "hi",
      "language_name": "हिन्दी",
      "is_rtl": false,
      "translations": { ... }
    },
    ...
  ]
}
```

### Via Script

Run the import script to export JSON:

```bash
node scripts/import-indian-languages.js
```

This creates `indian-language-translations.json` which can be:
- Imported via the API
- Manually added to Supabase
- Used in your application

### In Code

```typescript
import { 
  INDIAN_LANGUAGE_TRANSLATIONS,
  getTranslationByCode,
  isLanguageSupported 
} from '@/lib/indian-language-translations';

// Get Hindi translation
const hindiTranslation = getTranslationByCode('hi');

// Check if language is supported
if (isLanguageSupported('ta')) {
  // Tamil is supported
}

// Get all translations
const allTranslations = INDIAN_LANGUAGE_TRANSLATIONS;
```

## Database Schema

The `widget_translations` table stores translations:

```sql
CREATE TABLE widget_translations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  widget_id UUID REFERENCES widget_configs(id),
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  accept_text TEXT,
  reject_text TEXT,
  settings_text TEXT,
  save_text TEXT,
  close_text TEXT,
  category_translations JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(widget_id, language_code)
);
```

## Testing

### Test API Endpoint

```bash
# Test Hindi translation
curl http://localhost:3000/api/cookies/translations?language=hi

# Test Bengali translation
curl http://localhost:3000/api/cookies/translations?language=bn

# Get all supported languages
curl http://localhost:3000/api/cookies/translations
```

### Test in Widget

```javascript
// Initialize widget with Hindi
ConsentlyWidget.init({
  language: 'hi',
  // ... other options
});

// Change language dynamically
ConsentlyWidget.setLanguage('ta');
```

## Example Translations

### Hindi (हिन्दी)

```
Title: "हम कुकीज़ का उपयोग करते हैं"
Message: "हम आपके ब्राउज़िंग अनुभव को बेहतर बनाने..."
Accept: "सभी स्वीकार करें"
Reject: "सभी अस्वीकार करें"
```

### Tamil (தமிழ்)

```
Title: "நாங்கள் குக்கீகளைப் பயன்படுத்துகிறோம்"
Message: "உங்கள் உலாவல் அனுபவத்தை மேம்படுத்தவும்..."
Accept: "அனைத்தையும் ஏற்கவும்"
Reject: "அனைத்தையும் நிராகரிக்கவும்"
```

### Bengali (বাংলা)

```
Title: "আমরা কুকিজ ব্যবহার করি"
Message: "আমরা আপনার ব্রাউজিং অভিজ্ঞতা উন্নত করতে..."
Accept: "সব গ্রহণ করুন"
Reject: "সব প্রত্যাখ্যান করুন"
```

## Customization

### Add Custom Translation

```typescript
// POST /api/cookies/translations
{
  "language_code": "hi",
  "language_name": "हिन्दी",
  "is_rtl": false,
  "translations": {
    "banner": {
      "title": "Your custom title",
      // ... other fields
    }
  }
}
```

### Update Existing Translation

```typescript
// PUT /api/cookies/translations
{
  "id": "translation-id",
  "translations": {
    "banner": {
      "title": "Updated title"
    }
  }
}
```

## Future Enhancements

### Phase 2 (Coming Soon)
- Add remaining 17 Schedule 8 languages
- AI-powered translation suggestions
- Regional dialect support
- Voice-over support for accessibility

### Planned Languages (Phase 2)
- Gujarati (ગુજરાતી)
- Kannada (ಕನ್ನಡ)
- Malayalam (മലയാളം)
- Odia (ଓଡ଼ିଆ)
- Punjabi (ਪੰਜਾਬੀ)
- Urdu (اردو)
- Assamese (অসমীয়া)
- And 10 more...

## Compliance

This implementation helps with:
- ✅ DPDPA 2023 compliance
- ✅ Regional language requirements
- ✅ Accessibility standards
- ✅ User preference management

## Support

For issues or feature requests:
- Email: support@consently.app
- GitHub: Create an issue
- Docs: Check full documentation

## License

© 2025 Consently. All rights reserved.
