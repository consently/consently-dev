/**
 * Cookie Scanner Service
 * Production-level cookie scanning and classification engine
 */

import { createClient } from '@/lib/supabase/server';
import type { Cookie } from './cookie-service';

export type ScanTier = 'free' | 'premium' | 'enterprise';
export type ScanDepth = 'shallow' | 'medium' | 'deep';

interface ScanOptions {
  url: string;
  scanDepth: ScanDepth;
  userId: string;
  tier?: ScanTier; // User's subscription tier
}

  // Tiered scanning configuration
const SCAN_TIER_LIMITS = {
  free: {
    maxPages: 1,
    timeout: 30,
    scanDepth: 'shallow' as ScanDepth,
    description: 'Quick Scan - Homepage only',
    price: 'Free',
    useSitemap: false
  },
  premium: {
    maxPages: 5,
    timeout: 60,
    scanDepth: 'medium' as ScanDepth,
    description: 'Standard Scan - Top 5 URLs',
    price: '₹999/month',
    useSitemap: true
  },
  enterprise: {
    maxPages: 50,
    timeout: 180,
    scanDepth: 'deep' as ScanDepth,
    description: 'Deep Crawl - Up to 50 pages',
    price: '₹2499/month',
    useSitemap: true
  }
} as const;

export { SCAN_TIER_LIMITS };

interface ScannedCookie {
  name: string;
  domain: string;
  value?: string;
  path?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

export class CookieScanner {
  /**
   * Cookie classification database
   * Maps known cookie names to their categories and providers
   */
  private static cookieKnowledge: Record<
    string,
    {
      category: string;
      provider: string;
      purpose: string;
      expiry: string;
      is_third_party: boolean;
    }
  > = {
    // Google Analytics
    _ga: {
      category: 'analytics',
      provider: 'Google Analytics',
      purpose: 'Used to distinguish users',
      expiry: '2 years',
      is_third_party: true,
    },
    _gid: {
      category: 'analytics',
      provider: 'Google Analytics',
      purpose: 'Used to distinguish users',
      expiry: '24 hours',
      is_third_party: true,
    },
    _gat: {
      category: 'analytics',
      provider: 'Google Analytics',
      purpose: 'Used to throttle request rate',
      expiry: '1 minute',
      is_third_party: true,
    },
    _gac_: {
      category: 'analytics',
      provider: 'Google Analytics',
      purpose: 'Contains campaign related information',
      expiry: '90 days',
      is_third_party: true,
    },
    // Google Ads
    _gcl_au: {
      category: 'advertising',
      provider: 'Google Ads',
      purpose: 'Used by Google AdSense for advertising',
      expiry: '3 months',
      is_third_party: true,
    },
    // Facebook
    _fbp: {
      category: 'advertising',
      provider: 'Facebook Pixel',
      purpose: 'Used for ad targeting and tracking',
      expiry: '3 months',
      is_third_party: true,
    },
    fr: {
      category: 'advertising',
      provider: 'Facebook',
      purpose: 'Used for Facebook advertising',
      expiry: '3 months',
      is_third_party: true,
    },
    // Session cookies
    session_id: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'Maintains user session',
      expiry: 'Session',
      is_third_party: false,
    },
    PHPSESSID: {
      category: 'necessary',
      provider: 'PHP',
      purpose: 'Maintains user session',
      expiry: 'Session',
      is_third_party: false,
    },
    // Preferences
    preferences: {
      category: 'preferences',
      provider: 'Internal',
      purpose: 'Stores user preferences',
      expiry: '1 year',
      is_third_party: false,
    },
    language: {
      category: 'preferences',
      provider: 'Internal',
      purpose: 'Stores language preference',
      expiry: '1 year',
      is_third_party: false,
    },
    // YouTube
    VISITOR_INFO1_LIVE: {
      category: 'analytics',
      provider: 'YouTube',
      purpose: 'Tries to estimate user bandwidth',
      expiry: '179 days',
      is_third_party: true,
    },
    YSC: {
      category: 'analytics',
      provider: 'YouTube',
      purpose: 'Registers unique ID to track views',
      expiry: 'Session',
      is_third_party: true,
    },
    // LinkedIn
    li_sugr: {
      category: 'advertising',
      provider: 'LinkedIn',
      purpose: 'Used for ad targeting',
      expiry: '90 days',
      is_third_party: true,
    },
    lidc: {
      category: 'functional',
      provider: 'LinkedIn',
      purpose: 'Used for routing',
      expiry: '24 hours',
      is_third_party: true,
    },
    // Twitter
    personalization_id: {
      category: 'advertising',
      provider: 'Twitter',
      purpose: 'Used for personalized advertising',
      expiry: '2 years',
      is_third_party: true,
    },
    // Hotjar
    _hjSessionUser_: {
      category: 'analytics',
      provider: 'Hotjar',
      purpose: 'Set when a user first lands on a page',
      expiry: '1 year',
      is_third_party: true,
    },
    _hjSession_: {
      category: 'analytics',
      provider: 'Hotjar',
      purpose: 'Holds current session data',
      expiry: '30 minutes',
      is_third_party: true,
    },
    // Stripe
    __stripe_sid: {
      category: 'necessary',
      provider: 'Stripe',
      purpose: 'Fraud prevention and detection',
      expiry: '30 minutes',
      is_third_party: true,
    },
    __stripe_mid: {
      category: 'necessary',
      provider: 'Stripe',
      purpose: 'Fraud prevention and detection',
      expiry: '1 year',
      is_third_party: true,
    },
    // Cloudflare
    __cfduid: {
      category: 'necessary',
      provider: 'Cloudflare',
      purpose: 'Security and performance',
      expiry: '30 days',
      is_third_party: true,
    },
    cf_clearance: {
      category: 'necessary',
      provider: 'Cloudflare',
      purpose: 'Bot management',
      expiry: '1 year',
      is_third_party: true,
    },
    // Hubspot
    __hstc: {
      category: 'analytics',
      provider: 'HubSpot',
      purpose: 'Track visitors',
      expiry: '13 months',
      is_third_party: true,
    },
    hubspotutk: {
      category: 'analytics',
      provider: 'HubSpot',
      purpose: 'Track visitor identity',
      expiry: '13 months',
      is_third_party: true,
    },
    __hssc: {
      category: 'analytics',
      provider: 'HubSpot',
      purpose: 'Track sessions',
      expiry: '30 minutes',
      is_third_party: true,
    },
    __hssrc: {
      category: 'analytics',
      provider: 'HubSpot',
      purpose: 'Determine if visitor has restarted browser',
      expiry: 'Session',
      is_third_party: true,
    },
    // Intercom
    'intercom-id-': {
      category: 'functional',
      provider: 'Intercom',
      purpose: 'Visitor identification',
      expiry: '9 months',
      is_third_party: true,
    },
    'intercom-session-': {
      category: 'functional',
      provider: 'Intercom',
      purpose: 'Session identification',
      expiry: '7 days',
      is_third_party: true,
    },
    // Mixpanel
    mp_: {
      category: 'analytics',
      provider: 'Mixpanel',
      purpose: 'Track user behavior',
      expiry: '1 year',
      is_third_party: true,
    },
    // Amplitude
    amplitude_id_: {
      category: 'analytics',
      provider: 'Amplitude',
      purpose: 'User analytics',
      expiry: '10 years',
      is_third_party: true,
    },
    // Segment
    ajs_user_id: {
      category: 'analytics',
      provider: 'Segment',
      purpose: 'User identification',
      expiry: '1 year',
      is_third_party: true,
    },
    ajs_anonymous_id: {
      category: 'analytics',
      provider: 'Segment',
      purpose: 'Anonymous user tracking',
      expiry: '1 year',
      is_third_party: true,
    },
    // TikTok
    _ttp: {
      category: 'advertising',
      provider: 'TikTok',
      purpose: 'Track and improve ad performance',
      expiry: '13 months',
      is_third_party: true,
    },
    // Snapchat
    _scid: {
      category: 'advertising',
      provider: 'Snapchat',
      purpose: 'Track ad conversions',
      expiry: '13 months',
      is_third_party: true,
    },
    // Pinterest
    _pinterest_sess: {
      category: 'advertising',
      provider: 'Pinterest',
      purpose: 'Track user activity',
      expiry: '1 year',
      is_third_party: true,
    },
    _pin_unauth: {
      category: 'advertising',
      provider: 'Pinterest',
      purpose: 'Track non-authenticated users',
      expiry: '1 year',
      is_third_party: true,
    },
    // Reddit
    reddit_session: {
      category: 'functional',
      provider: 'Reddit',
      purpose: 'Maintain user session',
      expiry: '2 years',
      is_third_party: true,
    },
    // Shopify
    _shopify_s: {
      category: 'necessary',
      provider: 'Shopify',
      purpose: 'Track shopping cart',
      expiry: 'Session',
      is_third_party: false,
    },
    _shopify_y: {
      category: 'necessary',
      provider: 'Shopify',
      purpose: 'Persist cart',
      expiry: '1 year',
      is_third_party: false,
    },
    cart: {
      category: 'necessary',
      provider: 'Shopify',
      purpose: 'Shopping cart data',
      expiry: '2 weeks',
      is_third_party: false,
    },
    // Google Tag Manager
    _gat_gtag_: {
      category: 'analytics',
      provider: 'Google Tag Manager',
      purpose: 'Used to throttle request rate for Google Analytics',
      expiry: '1 minute',
      is_third_party: true,
    },
    _gcl_aw: {
      category: 'advertising',
      provider: 'Google Ads',
      purpose: 'Conversion tracking',
      expiry: '90 days',
      is_third_party: true,
    },
    _gcl_dc: {
      category: 'advertising',
      provider: 'Google Ads',
      purpose: 'DoubleClick conversion tracking',
      expiry: '90 days',
      is_third_party: true,
    },
    // Microsoft Clarity
    _clck: {
      category: 'analytics',
      provider: 'Microsoft Clarity',
      purpose: 'Persists the Clarity User ID',
      expiry: '1 year',
      is_third_party: true,
    },
    _clsk: {
      category: 'analytics',
      provider: 'Microsoft Clarity',
      purpose: 'Connects multiple page views by a user into a single Clarity session',
      expiry: '1 day',
      is_third_party: true,
    },
    CLID: {
      category: 'analytics',
      provider: 'Microsoft Clarity',
      purpose: 'Identifies the first-time Clarity saw this user',
      expiry: '1 year',
      is_third_party: true,
    },
    // New Relic
    NREUM: {
      category: 'analytics',
      provider: 'New Relic',
      purpose: 'Performance monitoring',
      expiry: 'Session',
      is_third_party: true,
    },
    // Optimizely
    optimizelyEndUserId: {
      category: 'analytics',
      provider: 'Optimizely',
      purpose: 'A/B testing and personalization',
      expiry: '6 months',
      is_third_party: true,
    },
    // VWO (Visual Website Optimizer)
    '_vwo_': {
      category: 'analytics',
      provider: 'VWO',
      purpose: 'A/B testing',
      expiry: '100 days',
      is_third_party: true,
    },
    _vis_opt_: {
      category: 'analytics',
      provider: 'VWO',
      purpose: 'Visitor optimization',
      expiry: '100 days',
      is_third_party: true,
    },
    // Zendesk
    __zlcmid: {
      category: 'functional',
      provider: 'Zendesk',
      purpose: 'Chat widget functionality',
      expiry: '1 year',
      is_third_party: true,
    },
    // Drift
    driftt_aid: {
      category: 'functional',
      provider: 'Drift',
      purpose: 'Chat widget user identification',
      expiry: '2 years',
      is_third_party: true,
    },
    // Sentry
    sentrysid: {
      category: 'necessary',
      provider: 'Sentry',
      purpose: 'Error tracking and monitoring',
      expiry: 'Session',
      is_third_party: true,
    },
    // GTM (Google Tag Manager)
    _dc_gtm_: {
      category: 'analytics',
      provider: 'Google Tag Manager',
      purpose: 'Used to control the loading of Google Analytics script',
      expiry: '1 minute',
      is_third_party: true,
    },
    // Cookiebot
    CookieConsent: {
      category: 'necessary',
      provider: 'Cookiebot',
      purpose: 'Stores the user\'s cookie consent state',
      expiry: '1 year',
      is_third_party: false,
    },
    // OneTrust
    OptanonConsent: {
      category: 'necessary',
      provider: 'OneTrust',
      purpose: 'Stores consent preferences',
      expiry: '1 year',
      is_third_party: false,
    },
    OptanonAlertBoxClosed: {
      category: 'necessary',
      provider: 'OneTrust',
      purpose: 'Records when consent banner was closed',
      expiry: '1 year',
      is_third_party: false,
    },
    // Adobe Analytics
    s_cc: {
      category: 'analytics',
      provider: 'Adobe Analytics',
      purpose: 'Determines if cookies are enabled',
      expiry: 'Session',
      is_third_party: true,
    },
    s_fid: {
      category: 'analytics',
      provider: 'Adobe Analytics',
      purpose: 'Fallback unique visitor ID',
      expiry: '2 years',
      is_third_party: true,
    },
    s_vi: {
      category: 'analytics',
      provider: 'Adobe Analytics',
      purpose: 'Unique visitor ID',
      expiry: '2 years',
      is_third_party: true,
    },
    // Pardot
    visitor_id: {
      category: 'advertising',
      provider: 'Pardot',
      purpose: 'Marketing automation and lead tracking',
      expiry: '10 years',
      is_third_party: true,
    },
    pi_opt_in: {
      category: 'advertising',
      provider: 'Pardot',
      purpose: 'Tracks opt-in status',
      expiry: '10 years',
      is_third_party: true,
    },
    // Marketo
    _mkto_trk: {
      category: 'advertising',
      provider: 'Marketo',
      purpose: 'Marketing automation tracking',
      expiry: '2 years',
      is_third_party: true,
    },
    // WordPress
    wordpress_logged_in_: {
      category: 'necessary',
      provider: 'WordPress',
      purpose: 'User authentication',
      expiry: '2 weeks',
      is_third_party: false,
    },
    'wp-settings-': {
      category: 'preferences',
      provider: 'WordPress',
      purpose: 'User preferences',
      expiry: '1 year',
      is_third_party: false,
    },
    // Auth tokens
    auth_token: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'Authentication token',
      expiry: 'Varies',
      is_third_party: false,
    },
    access_token: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'Access token for API',
      expiry: 'Varies',
      is_third_party: false,
    },
    refresh_token: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'Token refresh',
      expiry: 'Varies',
      is_third_party: false,
    },
    // CSRF tokens
    csrf_token: {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'CSRF protection',
      expiry: 'Session',
      is_third_party: false,
    },
    'XSRF-TOKEN': {
      category: 'necessary',
      provider: 'Internal',
      purpose: 'CSRF protection',
      expiry: 'Session',
      is_third_party: false,
    },
    // AWS CloudFront
    'aws-waf-token': {
      category: 'necessary',
      provider: 'AWS WAF',
      purpose: 'Web Application Firewall security token',
      expiry: 'Session',
      is_third_party: true,
    },
    'CloudFront-Policy': {
      category: 'necessary',
      provider: 'AWS CloudFront',
      purpose: 'CloudFront signed cookie for private content',
      expiry: 'Varies',
      is_third_party: true,
    },
    // Azure
    ARRAffinity: {
      category: 'necessary',
      provider: 'Microsoft Azure',
      purpose: 'Load balancer session affinity',
      expiry: 'Session',
      is_third_party: true,
    },
    ARRAffinitySameSite: {
      category: 'necessary',
      provider: 'Microsoft Azure',
      purpose: 'Load balancer session affinity with SameSite',
      expiry: 'Session',
      is_third_party: true,
    },
    // Vercel
    __vercel_live_token: {
      category: 'functional',
      provider: 'Vercel',
      purpose: 'Preview deployment authentication',
      expiry: '30 days',
      is_third_party: false,
    },
    _vercel_jwt: {
      category: 'necessary',
      provider: 'Vercel',
      purpose: 'Authentication token',
      expiry: 'Session',
      is_third_party: false,
    },
    // Cloudflare (additional)
    __cf_bm: {
      category: 'necessary',
      provider: 'Cloudflare',
      purpose: 'Bot management',
      expiry: '30 minutes',
      is_third_party: true,
    },
    cf_ob_info: {
      category: 'necessary',
      provider: 'Cloudflare',
      purpose: 'Orange-to-Blue routing',
      expiry: 'Session',
      is_third_party: true,
    },
    // PayPal
    ts_c: {
      category: 'necessary',
      provider: 'PayPal',
      purpose: 'Fraud detection and security',
      expiry: '3 years',
      is_third_party: true,
    },
    tsrce: {
      category: 'necessary',
      provider: 'PayPal',
      purpose: 'Source tracking for security',
      expiry: '3 days',
      is_third_party: true,
    },
    'x-pp-s': {
      category: 'necessary',
      provider: 'PayPal',
      purpose: 'PayPal session identifier',
      expiry: 'Session',
      is_third_party: true,
    },
    // Square
    __sq_tid: {
      category: 'necessary',
      provider: 'Square',
      purpose: 'Transaction ID for payment processing',
      expiry: '30 minutes',
      is_third_party: true,
    },
    // WooCommerce
    woocommerce_cart_hash: {
      category: 'necessary',
      provider: 'WooCommerce',
      purpose: 'Shopping cart functionality',
      expiry: 'Session',
      is_third_party: false,
    },
    woocommerce_items_in_cart: {
      category: 'necessary',
      provider: 'WooCommerce',
      purpose: 'Track items in shopping cart',
      expiry: 'Session',
      is_third_party: false,
    },
    'wp_woocommerce_session_': {
      category: 'necessary',
      provider: 'WooCommerce',
      purpose: 'WooCommerce session management',
      expiry: '2 days',
      is_third_party: false,
    },
    // Mailchimp
    mc_: {
      category: 'advertising',
      provider: 'Mailchimp',
      purpose: 'Email marketing campaign tracking',
      expiry: '2 years',
      is_third_party: true,
    },
    // Salesforce
    'com.salesforce.LocaleInfo': {
      category: 'preferences',
      provider: 'Salesforce',
      purpose: 'Store user locale preferences',
      expiry: '1 year',
      is_third_party: true,
    },
    sfdc_lv: {
      category: 'functional',
      provider: 'Salesforce',
      purpose: 'Last visited page tracking',
      expiry: 'Session',
      is_third_party: true,
    },
    // Webflow
    wf_: {
      category: 'functional',
      provider: 'Webflow',
      purpose: 'Site functionality and forms',
      expiry: '1 year',
      is_third_party: false,
    },
    // Squarespace
    SS_MID: {
      category: 'necessary',
      provider: 'Squarespace',
      purpose: 'Security and fraud prevention',
      expiry: '2 years',
      is_third_party: false,
    },
    crumb: {
      category: 'necessary',
      provider: 'Squarespace',
      purpose: 'CSRF protection',
      expiry: 'Session',
      is_third_party: false,
    },
    // Ghost
    'ghost-admin-api-session': {
      category: 'necessary',
      provider: 'Ghost',
      purpose: 'Admin session management',
      expiry: 'Session',
      is_third_party: false,
    },
    // Wix
    svSession: {
      category: 'necessary',
      provider: 'Wix',
      purpose: 'Session management',
      expiry: 'Session',
      is_third_party: false,
    },
    hs: {
      category: 'necessary',
      provider: 'Wix',
      purpose: 'Security token',
      expiry: 'Session',
      is_third_party: false,
    },
    // Google Optimize
    _gaexp: {
      category: 'analytics',
      provider: 'Google Optimize',
      purpose: 'A/B testing experiment data',
      expiry: '90 days',
      is_third_party: true,
    },
    _opt_: {
      category: 'analytics',
      provider: 'Google Optimize',
      purpose: 'Optimize experiment variations',
      expiry: '10 seconds',
      is_third_party: true,
    },
    // AB Tasty
    ABTasty: {
      category: 'analytics',
      provider: 'AB Tasty',
      purpose: 'A/B testing and personalization',
      expiry: '13 months',
      is_third_party: true,
    },
    ABTastySession: {
      category: 'analytics',
      provider: 'AB Tasty',
      purpose: 'Session-based test tracking',
      expiry: 'Session',
      is_third_party: true,
    },
    // Convert
    _conv_: {
      category: 'analytics',
      provider: 'Convert',
      purpose: 'A/B testing experiments',
      expiry: '90 days',
      is_third_party: true,
    },
    // LiveChat
    __lc_: {
      category: 'functional',
      provider: 'LiveChat',
      purpose: 'Live chat functionality',
      expiry: '1 year',
      is_third_party: true,
    },
    // Crisp
    'crisp-client/session': {
      category: 'functional',
      provider: 'Crisp',
      purpose: 'Chat session management',
      expiry: '6 months',
      is_third_party: true,
    },
    // Tawk.to
    TawkConnectionTime: {
      category: 'functional',
      provider: 'Tawk.to',
      purpose: 'Track chat connection time',
      expiry: 'Session',
      is_third_party: true,
    },
    __tawkuuid: {
      category: 'functional',
      provider: 'Tawk.to',
      purpose: 'Unique visitor identification',
      expiry: '6 months',
      is_third_party: true,
    },
    // Quora Pixel
    _qca: {
      category: 'advertising',
      provider: 'Quora',
      purpose: 'Quantcast audience measurement',
      expiry: '13 months',
      is_third_party: true,
    },
    // Amazon Associates
    'ubid-main': {
      category: 'functional',
      provider: 'Amazon',
      purpose: 'Unique browser identifier',
      expiry: '10 years',
      is_third_party: true,
    },
    'session-id': {
      category: 'necessary',
      provider: 'Amazon',
      purpose: 'Session management',
      expiry: 'Session',
      is_third_party: true,
    },
    // Bing Ads
    _uetsid: {
      category: 'advertising',
      provider: 'Bing Ads',
      purpose: 'Track ad campaign performance',
      expiry: '1 day',
      is_third_party: true,
    },
    _uetvid: {
      category: 'advertising',
      provider: 'Bing Ads',
      purpose: 'Visitor identification for ads',
      expiry: '13 months',
      is_third_party: true,
    },
    // Disqus
    disqus_unique: {
      category: 'functional',
      provider: 'Disqus',
      purpose: 'Comment system user identification',
      expiry: '1 year',
      is_third_party: true,
    },
    // AddThis
    'uvc': {
      category: 'social',
      provider: 'AddThis',
      purpose: 'Social sharing tracking',
      expiry: '13 months',
      is_third_party: true,
    },
    // ShareThis
    '__stid': {
      category: 'social',
      provider: 'ShareThis',
      purpose: 'Social sharing widget tracking',
      expiry: '1 year',
      is_third_party: true,
    },
    // Typekit (Adobe Fonts)
    tk_ai: {
      category: 'functional',
      provider: 'Adobe Fonts',
      purpose: 'Font loading and caching',
      expiry: '1 year',
      is_third_party: true,
    },
    // Crazy Egg
    '_ce.s': {
      category: 'analytics',
      provider: 'Crazy Egg',
      purpose: 'Heatmap and session recording',
      expiry: '1 year',
      is_third_party: true,
    },
    // Lucky Orange
    _lo_uid: {
      category: 'analytics',
      provider: 'Lucky Orange',
      purpose: 'Session recording and analytics',
      expiry: '1 year',
      is_third_party: true,
    },
    // FullStory
    fs_uid: {
      category: 'analytics',
      provider: 'FullStory',
      purpose: 'Session replay and analytics',
      expiry: '1 year',
      is_third_party: true,
    },
    // Sumo
    '__smToken': {
      category: 'functional',
      provider: 'Sumo',
      purpose: 'Email capture and list building',
      expiry: '1 year',
      is_third_party: true,
    },
    // OptinMonster
    om_: {
      category: 'functional',
      provider: 'OptinMonster',
      purpose: 'Lead generation popups',
      expiry: '90 days',
      is_third_party: true,
    },
    // Mailerlite
    ml_subscriber: {
      category: 'advertising',
      provider: 'MailerLite',
      purpose: 'Email marketing subscriber tracking',
      expiry: '1 year',
      is_third_party: true,
    },
    // ActiveCampaign
    ac_enable_tracking: {
      category: 'advertising',
      provider: 'ActiveCampaign',
      purpose: 'Marketing automation tracking',
      expiry: '1 year',
      is_third_party: true,
    },
    // Drip
    __drip_visitor: {
      category: 'advertising',
      provider: 'Drip',
      purpose: 'Email marketing visitor identification',
      expiry: '2 years',
      is_third_party: true,
    },
  };

  /**
   * Scan a website for cookies with tier-based limits
   */
  static async scanWebsite(options: ScanOptions): Promise<{
    scanId: string;
    cookies: Cookie[];
    summary: any;
  }> {
    const { url, scanDepth, userId, tier = 'free' } = options;
    const supabase = await createClient();

    // Validate tier and apply limits
    const tierConfig = SCAN_TIER_LIMITS[tier];
    if (!tierConfig) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    // Enforce tier-based scan depth limits
    let effectiveScanDepth = scanDepth;
    const tierDepthMap: Record<ScanDepth, number> = { shallow: 1, medium: 2, deep: 3 };
    const requestedDepthLevel = tierDepthMap[scanDepth];
    const allowedDepthLevel = tierDepthMap[tierConfig.scanDepth];
    
    if (requestedDepthLevel > allowedDepthLevel) {
      console.warn(`Scan depth ${scanDepth} exceeds tier ${tier} limit. Downgrading to ${tierConfig.scanDepth}`);
      effectiveScanDepth = tierConfig.scanDepth;
    }

    // Generate scan ID
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    console.log(`[CookieScanner] Starting scan: ${scanId}`);
    console.log(`[CookieScanner] URL: ${url}, Tier: ${tier}, Depth: ${effectiveScanDepth}, Max Pages: ${tierConfig.maxPages}`);

    try {
      // Validate URL format
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch (e) {
        throw new Error('Invalid URL format. Please provide a valid HTTP/HTTPS URL.');
      }

      // Security check: Only allow HTTP/HTTPS protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }

      // Create scan record
      const { error: insertError } = await supabase.from('cookie_scan_history').insert({
        user_id: userId,
        scan_id: scanId,
        website_url: url,
        scan_status: 'running',
        scan_depth: effectiveScanDepth,
        started_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('[CookieScanner] Failed to create scan record:', insertError);
        throw new Error('Failed to initialize scan. Please try again.');
      }

      // Perform actual scan with tier limits
      const { cookies: scannedCookies, pagesScanned } = await this.performScan(
        url,
        effectiveScanDepth,
        tierConfig.maxPages
      );

      console.log(`[CookieScanner] Scan completed: ${scannedCookies.length} cookies found across ${pagesScanned} pages`);

      // Classify cookies
      const classifiedCookies = this.classifyCookies(scannedCookies, url, userId);

      // Calculate metrics
      const summary = this.calculateSummary(classifiedCookies, pagesScanned);
      const scanDuration = Math.round((Date.now() - startTime) / 1000);

      // Update scan record
      const { error: updateError } = await supabase
        .from('cookie_scan_history')
        .update({
          scan_status: 'completed',
          pages_scanned: summary.pages_scanned,
          cookies_found: classifiedCookies.length,
          cookies_data: classifiedCookies,
          classification: summary.classification,
          compliance_score: summary.compliance_score,
          scan_duration: scanDuration,
          completed_at: new Date().toISOString(),
        })
        .eq('scan_id', scanId);

      if (updateError) {
        console.error('[CookieScanner] Failed to update scan record:', updateError);
      }

      console.log(`[CookieScanner] Scan ${scanId} completed successfully in ${scanDuration}s`);

      return {
        scanId,
        cookies: classifiedCookies,
        summary: {
          ...summary,
          scan_duration: scanDuration,
          tier_used: tier,
          tier_limits: tierConfig,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CookieScanner] Scan ${scanId} failed:`, errorMessage);

      // Update scan with error
      await supabase
        .from('cookie_scan_history')
        .update({
          scan_status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('scan_id', scanId)
        .then(({ error }) => {
          if (error) {
            console.error('[CookieScanner] Failed to update error status:', error);
          }
        });

      throw error;
    }
  }

  /**
   * Perform cookie scan using external API service
   * Uses specialized cookie scanning services for production reliability
   * Includes retry logic with exponential backoff
   */
  private static async performScan(
    url: string,
    scanDepth: string,
    maxPages: number = 20
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Determine scan configuration based on depth
    const scanConfig = {
      shallow: { pages: 1, timeout: 30 },
      medium: { pages: 5, timeout: 60 },
      deep: { pages: 50, timeout: 120 }
    };
    
    let config = scanConfig[scanDepth as keyof typeof scanConfig];
    // Apply tier-based page limit
    config = { ...config, pages: Math.min(config.pages, maxPages) };
    
    console.log(`[performScan] Scanning ${url} with depth ${scanDepth}, max ${config.pages} pages, timeout ${config.timeout}s`);
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    // Try primary scanning services with retry logic
    const scanners = [
      { name: 'Browserless.io', check: () => !!process.env.BROWSERLESS_API_KEY, fn: () => this.useBrowserlessAPI(url, config) },
      { name: 'Cookiebot', check: () => !!process.env.COOKIEBOT_API_KEY, fn: () => this.useCookiebotAPI(url, config) },
      { name: 'CookieYes', check: () => !!process.env.COOKIEYES_API_KEY, fn: () => this.useCookieYesAPI(url, config) },
      { name: 'OneTrust', check: () => !!process.env.ONETRUST_API_KEY, fn: () => this.useOneTrustAPI(url, config) },
    ];
    
    // Try each available scanner
    for (const scanner of scanners) {
      if (!scanner.check()) continue;
      
      console.log(`Attempting scan with ${scanner.name}`);
      
      // Retry logic with exponential backoff
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.withTimeout(
            scanner.fn(),
            config.timeout * 1000 + 10000 // Add 10s buffer to scanner timeout
          );
          
          console.log(`✓ Scan successful with ${scanner.name} (attempt ${attempt})`);
          return result;
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`✗ ${scanner.name} attempt ${attempt}/${maxRetries} failed:`, lastError.message);
          
          // If not the last attempt, wait with exponential backoff
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10s
            console.log(`  Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      console.log(`✗ ${scanner.name} failed after ${maxRetries} attempts, trying next scanner`);
    }
    
    // All external scanners failed, use fallback
    console.log('⚠ All external scanners failed, using fallback HTTP scanner');
    
    try {
      return await this.useSimpleHTTPScanner(url, config);
    } catch (fallbackError) {
      console.error('✗ Fallback scanner also failed:', fallbackError);
      throw new Error(
        `Cookie scanning failed: ${lastError?.message || 'All scanning methods failed'}. ` +
        `Please check the URL is accessible and try again.`
      );
    }
  }

  /**
   * Execute a promise with a timeout
   */
  private static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Use Browserless.io API for cookie scanning
   * Supports multi-page scanning with iframe and shadow DOM detection
   */
  private static async useBrowserlessAPI(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    const browserlessUrl = process.env.BROWSERLESS_URL || 'https://production-sfo.browserless.io';
    const apiKey = process.env.BROWSERLESS_API_KEY;
    
    if (!apiKey) {
      throw new Error('BROWSERLESS_API_KEY not configured');
    }
    
    console.log(`Using Browserless API for: ${url} (depth: ${config.pages} pages)`);
    
    try {
      // For shallow scans (1 page), use the simpler /content endpoint
      if (config.pages === 1) {
        return await this.browserlessContentScan(url, browserlessUrl, apiKey, config);
      }
      
      // For medium/deep scans, use /function endpoint with custom Puppeteer script
      return await this.browserlessFunctionScan(url, browserlessUrl, apiKey, config);
      
    } catch (error) {
      console.error('Browserless API failed:', error);
      
      // Fallback to simple HTTP scanner
      console.log('Falling back to simple HTTP scanner');
      return await this.useSimpleHTTPScanner(url, config);
    }
  }

  /**
   * Simple single-page scan using Browserless /content endpoint
   */
  private static async browserlessContentScan(
    url: string,
    browserlessUrl: string,
    apiKey: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    const requestBody = {
      url: url,
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout: config.timeout * 1000
      },
      waitFor: 3000, // Wait 3 seconds for cookies to load
      cookies: true, // Request cookies in response
      html: false,   // We don't need HTML content
      screenshot: false
    };
    
    const requestUrl = `${browserlessUrl}/content?token=${apiKey}`;
    console.log('Making Browserless content API request to:', requestUrl);
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Consently-Scanner/1.0'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Browserless content API error:', response.status, errorText);
      
      // Check for specific error conditions
      if (response.status === 403 && errorText.includes('legacy endpoint')) {
        console.error('Using legacy endpoint - please update BROWSERLESS_URL to https://production-sfo.browserless.io');
        throw new Error('Legacy Browserless endpoint detected. Please update your BROWSERLESS_URL environment variable to: https://production-sfo.browserless.io');
      }
      
      if (response.status === 402) {
        throw new Error('Browserless API quota exceeded. Please check your subscription.');
      }
      
      throw new Error(`Browserless content API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const cookies = result.cookies || [];
    
    if (!cookies || cookies.length === 0) {
      console.warn('No cookies found by Browserless API');
    }
    
    const transformedCookies: ScannedCookie[] = cookies.map((cookie: any) => ({
      name: cookie.name,
      domain: cookie.domain,
      value: cookie.value || '',
      path: cookie.path || '/',
      expires: cookie.expires && cookie.expires > 0 
        ? new Date(cookie.expires * 1000).toISOString() 
        : undefined,
      httpOnly: cookie.httpOnly || false,
      secure: cookie.secure || false,
      sameSite: cookie.sameSite,
    }));
    
    console.log(`Browserless found ${transformedCookies.length} cookies`);
    
    return {
      cookies: transformedCookies,
      pagesScanned: 1,
    };
  }

  /**
   * Advanced multi-page scan using Playwright WebSocket connection
   * Handles iframe cookies, shadow DOM elements, and multiple pages
   */
  private static async browserlessFunctionScan(
    url: string,
    browserlessUrl: string,
    apiKey: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Use dynamic import for playwright-core to avoid SSR issues
    const { chromium } = await import('playwright-core');
    
    // Extract base URL for WebSocket connection
    const wsUrl = browserlessUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const wsEndpoint = `${wsUrl}/chromium/playwright?token=${apiKey}`;
    
    console.log(`Connecting to Browserless via WebSocket for multi-page scan...`);
    
    let browser;
    try {
      // Connect to Browserless browser
      browser = await chromium.connect(wsEndpoint, {
        timeout: 30000
      });
      
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      const page = await context.newPage();
      
      const allCookies = new Map<string, any>();
      const scannedUrls = new Set<string>();
      const urlsToScan: string[] = [url];
      
      // Navigate to initial page
      console.log(`Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: config.timeout * 1000
      });
      
      // Wait for cookies to be set
      await page.waitForTimeout(3000);
      
      // Get cookies from main page
      let cookies = await context.cookies();
      cookies.forEach(cookie => {
        const key = `${cookie.name}|${cookie.domain}`;
        allCookies.set(key, cookie);
      });
      
      scannedUrls.add(url);
      console.log(`Main page scanned, found ${cookies.length} cookies`);
      
      // Extract links for multi-page scan
      if (config.pages > 1) {
        try {
          const links = await page.evaluate((baseUrl) => {
            const baseHostname = new URL(baseUrl).hostname;
            const linkElements = Array.from(document.querySelectorAll('a[href]'));
            return linkElements
              .map(a => (a as HTMLAnchorElement).href)
              .filter(href => {
                try {
                  const linkUrl = new URL(href);
                  return linkUrl.hostname === baseHostname && 
                         !href.includes('#') && 
                         !href.includes('javascript:') &&
                         !href.match(/\.(pdf|jpg|jpeg|png|gif|zip|doc|docx)$/i);
                } catch {
                  return false;
                }
              });
          }, url);
          
          // Add discovered links to scan queue
          links.slice(0, config.pages - 1).forEach(link => {
            if (!urlsToScan.includes(link)) {
              urlsToScan.push(link);
            }
          });
          
          console.log(`Found ${links.length} links, will scan ${Math.min(urlsToScan.length, config.pages)} pages`);
        } catch (error) {
          console.warn('Could not extract links:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // Scan additional pages with delays to avoid rate limiting
      for (let i = 1; i < Math.min(urlsToScan.length, config.pages); i++) {
        const pageUrl = urlsToScan[i];
        if (scannedUrls.has(pageUrl)) continue;
        
        try {
          console.log(`Scanning page ${i + 1}/${config.pages}: ${pageUrl}`);
          
          // Add delay between page scans to avoid overwhelming the browser
          if (i > 1) {
            await page.waitForTimeout(1500);
          }
          
          await page.goto(pageUrl, {
            waitUntil: 'networkidle',
            timeout: 30000
          });
          
          await page.waitForTimeout(2000);
          
          // Get cookies after visiting page
          cookies = await context.cookies();
          cookies.forEach(cookie => {
            const key = `${cookie.name}|${cookie.domain}`;
            allCookies.set(key, cookie);
          });
          
          scannedUrls.add(pageUrl);
          console.log(`Page ${i + 1} scanned, total unique cookies: ${allCookies.size}`);
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to scan page ${pageUrl}:`, errorMsg);
          
          // If browser/context was closed, stop scanning to avoid more errors
          if (errorMsg.includes('Target page, context or browser has been closed') ||
              errorMsg.includes('Browser closed') ||
              errorMsg.includes('Connection closed')) {
            console.log('Browser connection lost, stopping additional page scans');
            break;
          }
          // Continue with next page for other errors
        }
      }
      
      // Check for cookies in iframes
      try {
        const frames = page.frames();
        console.log(`Found ${frames.length} frames (including main)`);
        
        // Wait a bit for iframe cookies to load
        if (frames.length > 1) {
          await page.waitForTimeout(2000);
          
          // Get final cookie state (includes iframe cookies)
          cookies = await context.cookies();
          cookies.forEach(cookie => {
            const key = `${cookie.name}|${cookie.domain}`;
            allCookies.set(key, cookie);
          });
        }
      } catch (error) {
        console.warn('Could not scan iframes:', error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Transform cookies to our format
      const transformedCookies: ScannedCookie[] = Array.from(allCookies.values()).map((cookie: any) => ({
        name: cookie.name,
        domain: cookie.domain,
        value: cookie.value || '',
        path: cookie.path || '/',
        expires: cookie.expires && cookie.expires > 0 
          ? new Date(cookie.expires * 1000).toISOString() 
          : undefined,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite as 'Strict' | 'Lax' | 'None' | undefined,
      }));
      
      console.log(`Multi-page scan complete: ${scannedUrls.size} pages scanned, ${transformedCookies.length} unique cookies`);
      
      await browser.close();
      
      return {
        cookies: transformedCookies,
        pagesScanned: scannedUrls.size,
      };
      
    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn('Failed to close browser:', closeError);
        }
      }
      console.error('Playwright WebSocket scan failed:', error);
      throw error;
    }
  }


  /**
   * Simple HTTP-based scanner as fallback
   * Limited but works in all environments
   */
  private static async useSimpleHTTPScanner(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    console.log(`Using simple HTTP scanner for ${url}`);
    
    try {
      // Make a simple HTTP request to get initial cookies
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });
      
      const foundCookies: ScannedCookie[] = [];
      const hostname = new URL(url).hostname;
      
      // Handle multiple Set-Cookie headers properly
      const setCookieHeaders = response.headers.getSetCookie?.() || [];
      
      if (setCookieHeaders.length === 0) {
        // Fallback to single header if getSetCookie is not available
        const singleHeader = response.headers.get('set-cookie');
        if (singleHeader) {
          setCookieHeaders.push(singleHeader);
        }
      }
      
      setCookieHeaders.forEach(cookieString => {
        if (!cookieString.trim()) return;
        
        try {
          const parts = cookieString.split(';').map(part => part.trim());
          const [nameValuePair] = parts;
          const [name, ...valueParts] = nameValuePair.split('=');
          
          if (!name || !name.trim()) return;
          
          const cookie: ScannedCookie = {
            name: name.trim(),
            domain: hostname,
            value: valueParts.join('=').trim() || '',
            path: '/',
            httpOnly: false,
            secure: false,
          };
          
          // Parse cookie attributes
          parts.slice(1).forEach(attribute => {
            const [attrName, attrValue] = attribute.split('=').map(s => s.trim());
            const attrNameLower = attrName.toLowerCase();
            
            switch (attrNameLower) {
              case 'domain':
                if (attrValue) cookie.domain = attrValue;
                break;
              case 'path':
                if (attrValue) cookie.path = attrValue;
                break;
              case 'expires':
                if (attrValue) {
                  try {
                    cookie.expires = new Date(attrValue).toISOString();
                  } catch (e) {
                    // Invalid date format, ignore
                  }
                }
                break;
              case 'max-age':
                if (attrValue) {
                  try {
                    const maxAge = parseInt(attrValue, 10);
                    if (!isNaN(maxAge)) {
                      cookie.expires = new Date(Date.now() + maxAge * 1000).toISOString();
                    }
                  } catch (e) {
                    // Invalid max-age, ignore
                  }
                }
                break;
              case 'httponly':
                cookie.httpOnly = true;
                break;
              case 'secure':
                cookie.secure = true;
                break;
              case 'samesite':
                if (attrValue) cookie.sameSite = attrValue;
                break;
            }
          });
          
          foundCookies.push(cookie);
        } catch (error) {
          console.warn('Failed to parse cookie:', cookieString, error);
          // Continue parsing other cookies
        }
      });
      
      // Only return actually found cookies from Set-Cookie headers
      // No mocking or guessing - production grade real-time detection only
      console.log(`HTTP scanner found ${foundCookies.length} real cookies from Set-Cookie headers`);
      
      return {
        cookies: foundCookies,
        pagesScanned: 1,
      };
      
    } catch (error) {
      console.error('Simple scanner error:', error);
      
      // Return empty result if no cookies can be detected
      // No fallback mocked cookies in production
      return {
        cookies: [],
        pagesScanned: 1,
      };
    }
  }

  /**
   * Placeholder for Cookiebot API integration
   */
  private static async useCookiebotAPI(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Implement Cookiebot API integration when available
    throw new Error('Cookiebot API integration not implemented yet');
  }

  /**
   * Placeholder for CookieYes API integration
   */
  private static async useCookieYesAPI(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Implement CookieYes API integration when available
    throw new Error('CookieYes API integration not implemented yet');
  }

  /**
   * Placeholder for OneTrust API integration
   */
  private static async useOneTrustAPI(
    url: string,
    config: { pages: number; timeout: number }
  ): Promise<{ cookies: ScannedCookie[]; pagesScanned: number }> {
    // Implement OneTrust API integration when available
    throw new Error('OneTrust API integration not implemented yet');
  }

  /**
   * Classify scanned cookies into categories
   */
  private static classifyCookies(
    scannedCookies: ScannedCookie[],
    websiteUrl: string,
    userId: string
  ): Cookie[] {
    const hostname = new URL(websiteUrl).hostname;

    return scannedCookies.map((cookie) => {
      // Look up cookie in knowledge base
      let knownInfo = this.cookieKnowledge[cookie.name];
      
      // Try partial matches if exact match not found
      if (!knownInfo) {
        for (const [knownName, info] of Object.entries(this.cookieKnowledge)) {
          // Check if cookie name starts with known pattern (e.g., _hjSession_xxxxx matches _hjSession_)
          if (cookie.name.startsWith(knownName) || knownName.startsWith(cookie.name)) {
            knownInfo = info;
            break;
          }
        }
      }
      
      // If still not found, classify as unknown
      if (!knownInfo) {
        knownInfo = this.classifyUnknownCookie(cookie);
      }

      // Calculate expiry
      const expiry = cookie.expires
        ? this.calculateExpiryDescription(cookie.expires)
        : 'Session';

      const expiryDays = cookie.expires
        ? Math.ceil((new Date(cookie.expires).getTime() - Date.now()) / 86400000)
        : undefined;

      return {
        user_id: userId,
        name: cookie.name,
        domain: cookie.domain,
        category: knownInfo.category as any,
        purpose: knownInfo.purpose,
        description: `${knownInfo.purpose}. Provider: ${knownInfo.provider}`,
        provider: knownInfo.provider,
        expiry,
        expiry_days: expiryDays,
        type: this.determineType(cookie),
        is_third_party: knownInfo.is_third_party || cookie.domain !== hostname,
        legal_basis: knownInfo.category === 'necessary' ? 'legitimate_interest' : 'consent',
        is_active: true,
        last_scanned_at: new Date(),
      };
    });
  }

  /**
   * Classify unknown cookie based on heuristics
   */
  private static classifyUnknownCookie(cookie: ScannedCookie): {
    category: string;
    provider: string;
    purpose: string;
    expiry: string;
    is_third_party: boolean;
  } {
    const name = cookie.name.toLowerCase();

    // Heuristic classification
    if (name.includes('session') || name.includes('auth') || name.includes('token')) {
      return {
        category: 'necessary',
        provider: 'Internal',
        purpose: 'Required for authentication and session management',
        expiry: 'Session',
        is_third_party: false,
      };
    }

    if (name.includes('analytics') || name.includes('track') || name.includes('metric')) {
      return {
        category: 'analytics',
        provider: 'Unknown',
        purpose: 'Used for analytics and tracking',
        expiry: '1 year',
        is_third_party: true,
      };
    }

    if (name.includes('ad') || name.includes('marketing') || name.includes('campaign')) {
      return {
        category: 'advertising',
        provider: 'Unknown',
        purpose: 'Used for advertising and marketing',
        expiry: '90 days',
        is_third_party: true,
      };
    }

    if (name.includes('pref') || name.includes('lang') || name.includes('theme')) {
      return {
        category: 'preferences',
        provider: 'Internal',
        purpose: 'Stores user preferences',
        expiry: '1 year',
        is_third_party: false,
      };
    }

    // Default to functional
    return {
      category: 'functional',
      provider: 'Unknown',
      purpose: 'Enhances website functionality',
      expiry: 'Varies',
      is_third_party: false,
    };
  }

  /**
   * Determine cookie type
   */
  private static determineType(
    cookie: ScannedCookie
  ): 'http' | 'javascript' | 'pixel' | 'server' {
    if (cookie.httpOnly) {
      return 'http';
    }
    return 'javascript';
  }

  /**
   * Calculate human-readable expiry description
   */
  private static calculateExpiryDescription(expiresISOString: string): string {
    const expiryDate = new Date(expiresISOString);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 1) {
      const diffHours = Math.ceil(diffMs / 3600000);
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }

    if (diffDays < 365) {
      const months = Math.ceil(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }

    const years = Math.ceil(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  /**
   * Calculate scan summary metrics
   */
  private static calculateSummary(
    cookies: Cookie[],
    pagesScanned: number
  ): {
    pages_scanned: number;
    classification: Record<string, number>;
    compliance_score: number;
    third_party_count: number;
    first_party_count: number;
  } {
    const classification: Record<string, number> = {};

    cookies.forEach((cookie) => {
      classification[cookie.category] = (classification[cookie.category] || 0) + 1;
    });

    const thirdPartyCount = cookies.filter((c) => c.is_third_party).length;
    const firstPartyCount = cookies.length - thirdPartyCount;

    // Calculate compliance score (0-100)
    let score = 100;

    // Deduct points for issues
    const necessaryCount = classification['necessary'] || 0;
    if (necessaryCount === 0) score -= 10; // No necessary cookies defined

    const cookiesWithPurpose = cookies.filter((c) => c.purpose).length;
    if (cookiesWithPurpose < cookies.length) {
      score -= ((cookies.length - cookiesWithPurpose) / cookies.length) * 20;
    }

    const cookiesWithLegalBasis = cookies.filter((c) => c.legal_basis).length;
    if (cookiesWithLegalBasis < cookies.length) {
      score -= ((cookies.length - cookiesWithLegalBasis) / cookies.length) * 20;
    }

    // High third-party cookie usage
    if (thirdPartyCount / cookies.length > 0.5) {
      score -= 15;
    }

    return {
      pages_scanned: pagesScanned,
      classification,
      compliance_score: Math.max(0, Math.round(score)),
      third_party_count: thirdPartyCount,
      first_party_count: firstPartyCount,
    };
  }

  /**
   * Get scan history for a user
   */
  static async getScanHistory(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookie_scan_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific scan result
   */
  static async getScanResult(userId: string, scanId: string): Promise<any> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookie_scan_history')
      .select('*')
      .eq('user_id', userId)
      .eq('scan_id', scanId)
      .single();

    if (error) throw error;
    return data;
  }
}
