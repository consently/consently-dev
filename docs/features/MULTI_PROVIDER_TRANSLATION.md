# Multi-Provider Translation System

## Overview

Consently now supports **22 Indian languages** (all Schedule 8 languages) using a smart multi-provider translation strategy:

- **Google Cloud Translation API**: 12 major Indian languages (high quality)
- **Bhashini API**: 10+ additional Schedule 8 languages (government service)

## Supported Languages

### Google Translate (12 languages)
These languages use Google Cloud Translation API for high-quality translations:

1. **Hindi (hi)** - हिंदी
2. **Bengali (bn)** - বাংলা
3. **Tamil (ta)** - தமிழ்
4. **Telugu (te)** - తెలుగు
5. **Marathi (mr)** - मराठी
6. **Gujarati (gu)** - ગુજરાતી
7. **Kannada (kn)** - ಕನ್ನಡ
8. **Malayalam (ml)** - മലയാളം
9. **Punjabi (pa)** - ਪੰਜਾਬੀ
10. **Odia (or)** - ଓଡ଼ିଆ
11. **Urdu (ur)** - اردو
12. **Assamese (as)** - অসমীয়া

### Bhashini (10+ languages)
These languages use Bhashini API, India's government multilingual translation platform:

13. **Nepali (ne)** - नेपाली
14. **Sanskrit (sa)** - संस्कृतम्
15. **Kashmiri (ks)** - कॉशुर
16. **Sindhi (sd)** - सिन्धी
17. **Maithili (mai)** - मैथिली
18. **Dogri (doi)** - डोगरी
19. **Konkani (kok)** - कोंकणी
20. **Manipuri/Meitei (mni)** - মৈতৈলোন্
21. **Bodo (brx)** - बड़ो
22. **Santhali (sat)** - ᱥᱟᱱᱛᱟᱲᱤ

Plus **English (en)** for source language.

## How It Works

### Intelligent Provider Selection

The system automatically selects the best translation provider:

```typescript
function getProviderForLanguage(targetLanguage: string): TranslationProvider {
  // Google Translate has better quality for these 12 languages
  if (isGoogleSupported(targetLanguage) && isGoogleConfigured()) {
    return 'google';
  }
  
  // Bhashini supports more Indian languages (including Schedule 8 languages)
  if (isBhashiniSupported(targetLanguage) && isBhashiniConfigured()) {
    return 'bhashini';
  }
  
  // Default to Google if available
  if (isGoogleConfigured()) {
    return 'google';
  }
  
  return 'bhashini';
}
```

### Fallback Mechanism

If the primary provider is not configured, the system automatically falls back to the secondary provider:

1. **For Hindi/Tamil/etc** (Google-supported languages):
   - Try Google Translate first
   - If not configured, fall back to Bhashini
   
2. **For Nepali/Sanskrit/etc** (Bhashini-only languages):
   - Try Bhashini first
   - If not configured, fall back to Google (will likely fail for these languages)

### Caching

All translations are cached in memory to improve performance:
- Cache size limit: 1000 entries (LRU)
- Cache key format: `{sourceLang}:{targetLang}:{text}`
- Cache applies to both providers

## Setup

### Google Cloud Translation API

1. Create a Google Cloud project
2. Enable Cloud Translation API
3. Create an API key
4. Set environment variable:
   ```bash
   GOOGLE_TRANSLATE_API_KEY=your_google_api_key_here
   ```

### Bhashini API

1. Register at [bhashini.gov.in](https://bhashini.gov.in/ulca/user/register)
2. Get your User ID and API Key
3. Set environment variables:
   ```bash
   BHASHINI_API_KEY=your_bhashini_api_key_here
   BHASHINI_USER_ID=your_bhashini_user_id_here
   BHASHINI_PIPELINE_ID=64392f96daac500b55c543cd  # Optional, uses default if not set
   ```

## API Usage

### Single Text Translation

```typescript
POST /api/translate
Content-Type: application/json

{
  "text": "We value your privacy",
  "target": "ne",  // Nepali (will use Bhashini)
  "source": "en"
}

Response:
{
  "success": true,
  "translatedText": "हामी तपाईंको गोपनीयताको मूल्य राख्छौं",
  "provider": "bhashini",
  "cached": false
}
```

### Batch Translation

```typescript
POST /api/translate
Content-Type: application/json

{
  "texts": [
    "Accept All",
    "Reject All",
    "Cookie Settings"
  ],
  "target": "sa",  // Sanskrit (will use Bhashini)
  "source": "en"
}

Response:
{
  "success": true,
  "translations": [
    "सर्वं स्वीकरोतु",
    "सर्वं निराकरोतु",
    "कुकी-सेटिंग्स्"
  ],
  "provider": "bhashini",
  "count": 3
}
```

### Check Translation Service Status

```typescript
GET /api/translate

Response:
{
  "success": true,
  "providers": {
    "google": {
      "configured": true,
      "languages": ["hi", "bn", "ta", ...],
      "count": 12
    },
    "bhashini": {
      "configured": true,
      "languages": ["ne", "sa", "ks", ...],
      "count": 6
    }
  },
  "cache": {
    "size": 42,
    "maxSize": 1000
  },
  "supported_languages": {
    "google_only": ["hi", "bn", "ta", ...],
    "bhashini_only": ["ne", "sa", "ks", ...],
    "all": ["en", "hi", "bn", ..., "sat"],
    "total_count": 19
  }
}
```

## Performance Improvements

### Batch Translation
The widget now uses batch translation instead of sequential API calls:

**Before:**
- 5 sequential API calls for banner (title, message, 3 buttons)
- 13 sequential API calls for modal (5 header + 8 categories)
- Total: **18 API calls** (~10-15 seconds)

**After:**
- 1 batch API call for banner (5 texts)
- 2 batch API calls for modal (5 header + 8 categories)
- Total: **3 API calls** (~1-2 seconds)

**Result: 6x faster translations! 🚀**

## Widget Integration

The cookie consent widget automatically detects available languages:

```javascript
// Widget configuration supports all 22 languages
const config = {
  supportedLanguages: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 
                       'pa', 'or', 'ur', 'as', 'ne', 'sa', 'ks', 'sd', 'mai', 
                       'doi', 'kok', 'mni', 'brx', 'sat']
};
```

The language selector in the widget will show all configured languages with their native names.

## Testing

### Manual Testing

To test Bhashini-only languages (e.g., Nepali, Sanskrit):

1. Configure Bhashini API credentials
2. Open cookie widget in browser
3. Click language selector (globe icon)
4. Select a Bhashini-supported language (e.g., नेपाली)
5. Verify banner translates correctly

### Expected Behavior

- **With Google configured only**: Only 12 major languages work
- **With Bhashini configured only**: All languages work (lower quality for major languages)
- **With both configured**: All 22 languages work with optimal quality

## Architecture

```
┌─────────────────┐
│  Widget/Frontend│
└────────┬────────┘
         │ POST /api/translate
         ▼
┌─────────────────────┐
│ Translation Service │
│  (lib/translation-  │
│   service.ts)       │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────────┐
│Google│  │ Bhashini │
│  API │  │   API    │
└──────┘  └──────────┘
   12        10+
languages  languages
```

## Error Handling

The system gracefully handles errors:

1. **Provider not configured**: Returns original English text with warning
2. **API error**: Falls back to alternate provider if available
3. **Network timeout**: Returns original text after 5-10 seconds
4. **Invalid language**: Returns error with list of supported languages

## Future Enhancements

- [ ] Database-backed translation cache (Redis)
- [ ] Pre-translated common phrases
- [ ] Support for more regional languages
- [ ] Translation quality feedback mechanism
- [ ] A/B testing for provider selection

## Related Files

- `lib/translation-service.ts` - Main translation orchestration
- `lib/google-translate.ts` - Google Cloud Translation API integration
- `lib/bhashini-translate.ts` - Bhashini API integration
- `app/api/translate/route.ts` - Translation API endpoint
- `public/widget.js` - Cookie consent widget with batch translation
- `lib/constants/indian-languages.ts` - All 22 Schedule 8 language definitions

## References

- [Google Cloud Translation API](https://cloud.google.com/translate/docs)
- [Bhashini Platform](https://bhashini.gov.in/)
- [Schedule 8 Languages (Constitution of India)](https://en.wikipedia.org/wiki/Eighth_Schedule_to_the_Constitution_of_India)

