# Language Selector Feature for Consent Widgets

## Overview

Language selector dropdowns have been added to both Cookie Consent and DPDPA Consent widget configuration pages, allowing admins to choose which language their consent widgets will display in.

## Features Added

### Cookie Consent Widget
**Location:** `/dashboard/cookies/widget`

Added language selector in the "General Configuration" section with:
- English (default)
- Hindi (हिन्दी)
- Bengali (বাংলা)
- Tamil (தமிழ்)
- Telugu (తెలుగు)
- Marathi (मराठी)

### DPDPA Consent Widget
**Location:** `/dashboard/dpdpa/widget`

Added language selector in the "Basic Settings" section with the same 6 languages.

## Implementation Details

### Files Modified

1. **`app/dashboard/cookies/widget/page.tsx`**
   - Added `language` field to `WidgetConfig` type
   - Imported `Select` component
   - Added language selector dropdown
   - Default language: `'en'`

2. **`app/dashboard/dpdpa/widget/page.tsx`**
   - Added `language` field to `WidgetConfig` interface
   - Imported `Select` component
   - Added language selector dropdown
   - Default language: `'en'`

### UI Components

Both widgets now display:
```tsx
<Select
  value={config.language}
  onChange={(e) => setConfig({ ...config, language: e.target.value })}
  options={[
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी (Hindi)' },
    { value: 'bn', label: 'বাংলা (Bengali)' },
    { value: 'ta', label: 'தமிழ் (Tamil)' },
    { value: 'te', label: 'తెலుగు (Telugu)' },
    { value: 'mr', label: 'मराठी (Marathi)' },
  ]}
/>
```

## How It Works

### Admin Configuration Flow

1. **Navigate** to widget configuration page
   - Cookie Widget: `/dashboard/cookies/widget`
   - DPDPA Widget: `/dashboard/dpdpa/widget`

2. **Select Language** from the dropdown in General/Basic Settings section

3. **Save Configuration** - Language preference is saved with widget config

4. **Widget Renders** - When embedded on a website, the widget will display in the selected language

### Language Integration

The language selector integrates with:
- **Translation API**: `/api/cookies/translations?language={code}`
- **Backend Translations**: `lib/indian-language-translations.ts`
- **Widget Rendering**: Widget fetches translations based on config language

## Supported Languages

| Code | Language | Native Name | Script |
|------|----------|-------------|--------|
| `en` | English | English | Latin |
| `hi` | Hindi | हिन्दी | Devanagari |
| `bn` | Bengali | বাংলা | Bengali |
| `ta` | Tamil | தமிழ் | Tamil |
| `te` | Telugu | తెలుగు | Telugu |
| `mr` | Marathi | मराठी | Devanagari |

## User Experience

### Before
- No language selection available
- All widgets displayed in English only
- No localization support

### After
- ✅ Admin can select from 6 languages
- ✅ Widget displays in chosen language
- ✅ Native script rendering
- ✅ Fully localized consent banners

## Example Usage

### Cookie Consent Widget

```typescript
// Configuration saved
{
  widgetId: 'cnsty_abc123',
  domain: 'example.com',
  language: 'hi', // Hindi selected
  categories: ['necessary', 'analytics'],
  // ... other settings
}
```

### DPDPA Widget

```typescript
// Configuration saved
{
  widgetId: 'dpdpa_xyz789',
  domain: 'example.com',
  language: 'ta', // Tamil selected
  title: 'Your Data Privacy Rights',
  // ... other settings
}
```

## Future Enhancements

### Phase 2
- Add remaining 16 Schedule 8 languages
- Auto-detect user's browser language
- Allow end-users to change language on widget
- Multi-language support (show multiple languages)
- Regional dialect support

### Phase 3
- AI-powered translation suggestions
- Custom translation overrides
- Translation quality validation
- A/B testing for language variants

## Technical Notes

### Database Schema

The `language` field is stored as:
```sql
-- Cookie Widget Config
widget_configs (
  ...
  language VARCHAR(10) DEFAULT 'en',
  ...
)

-- DPDPA Widget Config
dpdpa_widget_configs (
  ...
  language VARCHAR(10) DEFAULT 'en',
  ...
)
```

### API Integration

When widget loads, it fetches translations:
```javascript
// Widget initialization
const language = widgetConfig.language || 'en';
const translations = await fetch(`/api/cookies/translations?language=${language}`);
```

### Validation

- Language code must match available translations
- Falls back to English if translation not found
- Case-insensitive language code matching

## Testing

### Manual Testing Steps

1. **Cookie Widget:**
   ```
   1. Go to /dashboard/cookies/widget
   2. Select "हिन्दी (Hindi)" from language dropdown
   3. Click "Save Configuration"
   4. Verify language is saved
   5. Embed widget on test page
   6. Confirm banner displays in Hindi
   ```

2. **DPDPA Widget:**
   ```
   1. Go to /dashboard/dpdpa/widget
   2. Select "தமிழ் (Tamil)" from language dropdown
   3. Click "Save Configuration"
   4. Verify language is saved
   5. Embed widget on test page
   6. Confirm banner displays in Tamil
   ```

### Edge Cases

- ✅ Default language (English) if not specified
- ✅ Fallback to English if translation unavailable
- ✅ Handles invalid language codes gracefully
- ✅ RTL support for Urdu (future)

## Documentation

Related documentation:
- `docs/INDIAN_LANGUAGES_SUPPORT.md` - Translation system overview
- `lib/indian-language-translations.ts` - Translation data
- `lib/constants/indian-languages.ts` - Language constants

## Support

For issues or questions:
- Check translation API: `/api/cookies/translations`
- Verify language code in database
- Test widget embedding with language parameter

---

**Last Updated:** 2025-10-16  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
