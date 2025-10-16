/**
 * Schedule 8 Indian Languages Constants
 * 
 * All 22 officially recognized languages as per the Eighth Schedule 
 * of the Constitution of India.
 * 
 * Language codes follow ISO 639-1 (2-letter) where available,
 * with ISO 639-3 (3-letter) for languages without 2-letter codes.
 */

export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  script: string;
  region?: string;
}

/**
 * All 22 Schedule 8 Indian Languages
 */
export const INDIAN_LANGUAGES: IndianLanguage[] = [
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    rtl: false,
    script: 'Bengali-Assamese',
    region: 'Assam'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    rtl: false,
    script: 'Bengali',
    region: 'West Bengal, Tripura'
  },
  {
    code: 'brx',
    name: 'Bodo',
    nativeName: 'बड़ो',
    rtl: false,
    script: 'Devanagari',
    region: 'Assam, West Bengal'
  },
  {
    code: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    rtl: false,
    script: 'Devanagari',
    region: 'Jammu and Kashmir, Himachal Pradesh'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    rtl: false,
    script: 'Gujarati',
    region: 'Gujarat, Dadra and Nagar Haveli'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    rtl: false,
    script: 'Devanagari',
    region: 'Pan-India (Official Language)'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    rtl: false,
    script: 'Kannada',
    region: 'Karnataka'
  },
  {
    code: 'ks',
    name: 'Kashmiri',
    nativeName: 'कॉशुर / کٲشُر',
    rtl: false, // Uses both Devanagari and Perso-Arabic, but predominantly LTR in Devanagari
    script: 'Devanagari, Perso-Arabic',
    region: 'Jammu and Kashmir'
  },
  {
    code: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    rtl: false,
    script: 'Devanagari',
    region: 'Goa, Karnataka, Maharashtra'
  },
  {
    code: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    rtl: false,
    script: 'Devanagari',
    region: 'Bihar, Jharkhand'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    rtl: false,
    script: 'Malayalam',
    region: 'Kerala, Lakshadweep'
  },
  {
    code: 'mni',
    name: 'Manipuri (Meitei)',
    nativeName: 'মৈতৈলোন্',
    rtl: false,
    script: 'Meitei Mayek, Bengali',
    region: 'Manipur'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    rtl: false,
    script: 'Devanagari',
    region: 'Maharashtra, Goa'
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    rtl: false,
    script: 'Devanagari',
    region: 'Sikkim, West Bengal'
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    rtl: false,
    script: 'Odia',
    region: 'Odisha'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    rtl: false,
    script: 'Gurmukhi',
    region: 'Punjab, Haryana, Delhi'
  },
  {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    rtl: false,
    script: 'Devanagari',
    region: 'Pan-India (Classical Language)'
  },
  {
    code: 'sat',
    name: 'Santhali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    rtl: false,
    script: 'Ol Chiki, Devanagari, Bengali',
    region: 'Jharkhand, West Bengal, Odisha'
  },
  {
    code: 'sd',
    name: 'Sindhi',
    nativeName: 'सिन्धी / سنڌي',
    rtl: false, // Uses both Devanagari (LTR) and Perso-Arabic (RTL), but Devanagari is more common in India
    script: 'Devanagari, Perso-Arabic',
    region: 'Gujarat, Rajasthan'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    rtl: false,
    script: 'Tamil',
    region: 'Tamil Nadu, Puducherry'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    rtl: false,
    script: 'Telugu',
    region: 'Andhra Pradesh, Telangana'
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    rtl: true, // Urdu uses Perso-Arabic script which is RTL
    script: 'Perso-Arabic (Nastaliq)',
    region: 'Jammu and Kashmir, Telangana, Uttar Pradesh, Bihar'
  }
];

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): IndianLanguage | undefined {
  return INDIAN_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get all language codes
 */
export function getAllLanguageCodes(): string[] {
  return INDIAN_LANGUAGES.map(lang => lang.code);
}

/**
 * Check if a language code is a Schedule 8 language
 */
export function isSchedule8Language(code: string): boolean {
  return INDIAN_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get languages by script
 */
export function getLanguagesByScript(script: string): IndianLanguage[] {
  return INDIAN_LANGUAGES.filter(lang => 
    lang.script.toLowerCase().includes(script.toLowerCase())
  );
}

/**
 * Get RTL languages
 */
export function getRTLLanguages(): IndianLanguage[] {
  return INDIAN_LANGUAGES.filter(lang => lang.rtl);
}
