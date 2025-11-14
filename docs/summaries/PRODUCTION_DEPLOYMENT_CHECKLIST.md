# Production Deployment Checklist - Consently
## Domain: https://www.consently.in/

---

## ✅ Completed Items

### 1. Domain Configuration
- [x] Updated `.env.local.example` with production URL
- [x] Updated `sitemap.ts` with production domain (www.consently.in)
- [x] Updated `robots.txt` with correct sitemap URL
- [x] Added all public pages to sitemap (about, contact, privacy, terms)

### 2. SEO Optimization
- [x] Enhanced root layout with comprehensive metadata
  - Open Graph tags
  - Twitter Card metadata
  - Canonical URLs
  - Google Search Console verification placeholder
- [x] Added JSON-LD structured data to homepage
- [x] Created `llm.txt` for AI crawler optimization
- [x] Optimized robots.txt for search engines

### 3. Widget URLs
- [x] Updated DPDPA widget URLs (dpdpa-widget.js)
- [x] Updated cookie consent widget URLs (widget.js)
- [x] Updated dashboard widget preview URLs
- [x] Updated email service example URLs
- [x] Updated payment/subscription contact URLs

### 4. Security Headers
- [x] Content Security Policy (CSP) configured
- [x] HSTS with preload enabled
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: SAMEORIGIN
- [x] Referrer-Policy configured
- [x] Permissions-Policy configured

---

## 🚀 Pre-Deployment Tasks

### Environment Variables
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://www.consently.in` in Vercel production environment
- [ ] Verify all Supabase credentials are set
- [ ] Verify Google OAuth credentials
- [ ] Verify Razorpay API keys (production)
- [ ] Verify Google Translate API key
- [ ] Verify Browserless API key
- [ ] Set AWS S3 credentials (if using file uploads)

### Vercel Configuration
- [ ] Set custom domain: www.consently.in
- [ ] Configure DNS records:
  - A record: `@` → Vercel IP
  - CNAME: `www` → cname.vercel-dns.com
- [ ] Enable automatic HTTPS
- [ ] Configure Mumbai region (bom1) - already in vercel.json
- [ ] Set environment variables in Vercel dashboard

### Supabase Configuration
- [ ] Update Supabase Auth redirect URLs:
  - Add: `https://www.consently.in/auth/callback`
  - Add: `https://www.consently.in/dashboard`
- [ ] Configure Google OAuth redirect URI in Google Cloud Console:
  - Add: `https://www.consently.in/auth/callback`
- [ ] Update CORS settings in Supabase (if needed)
- [ ] Verify Row Level Security (RLS) policies are enabled

### Database Setup
- [ ] Run all migrations in production Supabase
- [ ] Verify all tables are created
- [ ] Set up database backups
- [ ] Create demo user (optional) using migration script

---

## 📊 SEO & Analytics Setup

### Search Engine Optimization
- [ ] Submit sitemap to Google Search Console
  - URL: https://www.consently.in/sitemap.xml
- [ ] Add site to Google Search Console
- [ ] Get verification code and update `app/layout.tsx` (line 80)
- [ ] Submit to Bing Webmaster Tools (optional)
- [ ] Create and submit robots.txt

### Social Media Optimization
- [ ] Create Open Graph image (1200x630px)
  - Save as: `public/og-image.png`
- [ ] Update Twitter handle in metadata (if applicable)
- [ ] Test Open Graph tags: https://developers.facebook.com/tools/debug/
- [ ] Test Twitter Cards: https://cards-dev.twitter.com/validator

### Analytics & Monitoring
- [ ] Set up Google Analytics 4 (GA4)
- [ ] Configure Vercel Analytics
- [ ] Set up error monitoring (Sentry/LogRocket)
- [ ] Configure uptime monitoring (UptimeRobot/Pingdom)
- [ ] Set up performance monitoring

---

## 🔐 Security Hardening

### Authentication & Authorization
- [ ] Review and test all auth flows in production
- [ ] Verify email verification works
- [ ] Test password reset functionality
- [ ] Review session timeout settings
- [ ] Enable rate limiting for auth endpoints

### API Security
- [ ] Review all API route handlers
- [ ] Verify authentication checks on protected routes
- [ ] Test CORS configuration
- [ ] Review and validate all user inputs
- [ ] Enable API rate limiting (Vercel/Upstash)

### Data Protection
- [ ] Verify HTTPS is enforced
- [ ] Review data encryption at rest (Supabase)
- [ ] Test GDPR/DPDPA data export functionality
- [ ] Test user data deletion functionality
- [ ] Review audit logging

---

## 🧪 Testing Checklist

### Functionality Testing
- [ ] Test user registration flow
- [ ] Test login/logout
- [ ] Test cookie scanner (all 3 modes: Quick, Standard, Deep)
- [ ] Test DPDPA widget creation and deployment
- [ ] Test consent recording
- [ ] Test multi-language support (22 languages)
- [ ] Test payment flow (Razorpay)
- [ ] Test subscription management
- [ ] Test email notifications
- [ ] Test data export/reports (CSV, JSON, PDF)

### Widget Testing
- [ ] Test cookie consent widget on external site
- [ ] Test DPDPA widget on external site
- [ ] Test widget in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test widget on mobile devices
- [ ] Test widget translations
- [ ] Verify widget loads from CDN

### Performance Testing
- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Test page load times
- [ ] Test API response times
- [ ] Test database query performance
- [ ] Optimize images (if needed)

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 📧 Email Configuration

### Email Service Setup
- [ ] Choose email provider (SendGrid, AWS SES, Postmark)
- [ ] Configure SMTP/API credentials
- [ ] Update `lib/email.ts` with production integration
- [ ] Set sender domain: `noreply@consently.in`
- [ ] Configure SPF, DKIM, DMARC records
- [ ] Test all email templates:
  - Welcome email
  - Password reset
  - Subscription confirmation
  - Consent receipt

### Email Templates
- [ ] Review all email template content
- [ ] Test email rendering in major clients
- [ ] Add unsubscribe links (if applicable)
- [ ] Verify email deliverability

---

## 💳 Payment Integration

### Razorpay Production Setup
- [ ] Switch to Razorpay production keys
- [ ] Test payment flow end-to-end
- [ ] Configure webhooks:
  - URL: `https://www.consently.in/api/payments/webhook`
- [ ] Test subscription renewal
- [ ] Test payment failure handling
- [ ] Configure invoice settings
- [ ] Set up payment failure notifications

---

## 📱 Mobile & Responsive

- [ ] Test responsive design on all breakpoints
- [ ] Test mobile navigation
- [ ] Test forms on mobile
- [ ] Test widgets on mobile devices
- [ ] Verify touch interactions
- [ ] Test landscape/portrait modes

---

## 🌐 Internationalization

- [ ] Verify all 22 Indian languages work
- [ ] Test language selector
- [ ] Test RTL languages (Urdu)
- [ ] Verify translations accuracy
- [ ] Test fallback to English

---

## 📖 Documentation

- [ ] Update README.md with production info
- [ ] Create API documentation
- [ ] Create widget integration guide
- [ ] Update developer documentation
- [ ] Create troubleshooting guide
- [ ] Document environment variables

---

## 🎯 Go-Live Checklist

### Final Pre-Launch
- [ ] Complete full QA testing cycle
- [ ] Backup production database
- [ ] Verify all environment variables
- [ ] Test rollback procedure
- [ ] Prepare incident response plan
- [ ] Set up status page (optional)

### Launch Day
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test critical paths (signup, login, widget creation)
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Check analytics tracking
- [ ] Announce launch (if applicable)

### Post-Launch (First 24 Hours)
- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Review user feedback
- [ ] Monitor payment processing
- [ ] Check email delivery rates
- [ ] Review analytics data

### Post-Launch (First Week)
- [ ] Review conversion funnel
- [ ] Analyze user behavior
- [ ] Check for bugs/issues
- [ ] Optimize slow queries
- [ ] Review security logs
- [ ] Collect user feedback

---

## 🔄 Ongoing Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check uptime status
- [ ] Review critical alerts

### Weekly
- [ ] Review analytics reports
- [ ] Check payment reconciliation
- [ ] Review user feedback
- [ ] Update content (if needed)

### Monthly
- [ ] Database backup verification
- [ ] Security audit
- [ ] Performance review
- [ ] Dependency updates
- [ ] SEO performance review

### Quarterly
- [ ] Comprehensive security audit
- [ ] User experience review
- [ ] Feature usage analysis
- [ ] Cost optimization review
- [ ] Disaster recovery test

---

## 🆘 Emergency Contacts & Resources

### Critical Services
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Razorpay Support**: https://razorpay.com/support/
- **Domain Registrar**: [Your DNS Provider]

### Monitoring Dashboards
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Google Search Console**: https://search.google.com/search-console
- **Google Analytics**: https://analytics.google.com

### Documentation
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **DPDPA 2023 Act**: [Official Government Link]

---

## 📋 Environment Variables Reference

### Production Environment Variables (.env.production)
```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.consently.in

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Payment Gateway (Razorpay - Production)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_production_razorpay_key
RAZORPAY_KEY_SECRET=your_production_razorpay_secret

# Google Services
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key

# Cookie Scanning
BROWSERLESS_API_KEY=your_browserless_key
BROWSERLESS_URL=https://production-sfo.browserless.io

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket_name

# Email Service (Configure based on provider)
# SENDGRID_API_KEY=your_sendgrid_key
# AWS_SES_REGION=ap-south-1
```

---

## 🎨 Design Assets Needed

- [ ] Logo (SVG format)
- [ ] Favicon (ICO, 32x32)
- [ ] Apple Touch Icon (PNG, 180x180)
- [ ] Open Graph Image (PNG, 1200x630)
- [ ] Twitter Card Image (PNG, 1200x600)
- [ ] Android Icon (PNG, 192x192, 512x512)

---

## ✨ Future Enhancements

### Phase 2
- [ ] Multi-user team support
- [ ] Advanced analytics dashboard
- [ ] A/B testing for consent banners
- [ ] Custom CSS editor for widgets
- [ ] Webhook notifications
- [ ] API for developers
- [ ] Mobile app (iOS/Android)

### Phase 3
- [ ] AI-powered compliance suggestions
- [ ] Integration marketplace
- [ ] White-label solution
- [ ] Advanced automation rules
- [ ] Custom domain for widgets

---

**Last Updated**: October 29, 2025
**Version**: 1.0
**Status**: Ready for Production Deployment
