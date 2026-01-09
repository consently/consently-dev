# 🚀 Production Deployment Checklist

Use this checklist before deploying to production or showing to customers.

---

## ✅ Pre-Deployment (Complete Before Launch)

### 🔐 Security

- [x] TypeScript type checking enabled in builds
- [x] ESLint enabled in builds
- [x] Security headers configured (HSTS, CSP, etc.)
- [x] Rate limiting implemented on all public endpoints
- [x] Input validation with Zod schemas
- [x] Email tokenization/hashing for PII protection
- [x] Row-Level Security (RLS) enabled on database
- [ ] Sentry error monitoring installed and configured
- [ ] CORS origins validated (currently allows all for widgets)
- [ ] Secrets rotated (database, API keys, etc.)
- [ ] SSL/TLS certificates valid
- [ ] Security audit completed

### 🧪 Testing

- [ ] Unit tests created and passing
- [ ] Integration tests for critical flows
- [ ] E2E tests for user journeys
- [ ] Load testing performed
- [ ] Security testing (penetration test)
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Widget tested on external sites

### 📊 Monitoring

- [x] Health check endpoint created (`/api/health`)
- [ ] Sentry installed and tested
- [ ] Uptime monitoring configured (e.g., UptimeRobot)
- [ ] Performance monitoring (APM)
- [ ] Log aggregation setup
- [ ] Alert rules configured
- [ ] On-call rotation established
- [ ] Incident response plan documented

### 🗄️ Database

- [x] Performance indexes created (migration 99)
- [ ] Performance indexes applied to production database
- [ ] Database backups automated
- [ ] Backup restoration tested
- [ ] Connection pooling configured
- [ ] Query performance reviewed
- [ ] Data retention policies defined
- [ ] Migration rollback plan documented

### 🔧 Infrastructure

- [x] Environment variables validated
- [ ] All required env vars set in Vercel
- [ ] Production domain configured
- [ ] DNS records validated
- [ ] CDN caching configured
- [ ] Database connection limits appropriate
- [ ] Redis configured for production workload
- [ ] File storage limits appropriate

### 📝 Documentation

- [x] Production readiness audit completed
- [x] Critical fixes documented
- [x] API documentation available
- [ ] User guides updated
- [ ] Admin documentation complete
- [ ] Runbooks for common issues
- [ ] Contact information for support
- [ ] Change log maintained

### ⚖️ Legal & Compliance

- [ ] Terms of Service finalized
- [ ] Privacy Policy reviewed by legal
- [ ] Cookie Policy accurate
- [ ] DPDPA compliance verified
- [ ] Data processing agreements signed
- [ ] DPO contact information added
- [ ] Consent widgets legally reviewed
- [ ] Data retention policies documented

---

## 🚀 Deployment Steps

### 1. Pre-Deployment Testing

```bash
# Run all checks locally
npm run type-check
npm run lint
npm run build

# Test health check
curl http://localhost:3000/api/health

# Test critical flows
# - User signup
# - Cookie scanning
# - DPDPA widget integration
# - Payment flow
```

### 2. Database Migration

```bash
# Apply performance indexes
# In Supabase Dashboard > SQL Editor:
# Run: supabase/migrations/99_performance_indexes.sql

# Verify indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename IN (
  'dpdpa_consent_records',
  'visitor_consent_preferences',
  'processing_activities'
) AND indexname LIKE 'idx_%';
```

### 3. Environment Variables

Ensure these are set in Vercel:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.consently.in

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Payment
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=
FROM_EMAIL=

# Optional
GOOGLE_TRANSLATE_API_KEY=
BROWSERLESS_API_KEY=
NEXT_PUBLIC_GA_ID=
```

### 4. Deploy to Vercel

```bash
# Option 1: Automatic (via GitHub)
git push origin main

# Option 2: Manual
vercel --prod

# Option 3: Vercel Dashboard
# Push to main branch, Vercel auto-deploys
```

### 5. Post-Deployment Verification

```bash
# 1. Check health
curl https://www.consently.in/api/health

# 2. Test widget loading
curl https://www.consently.in/dpdpa-widget.js

# 3. Verify database connection
# (health check should show database: healthy)

# 4. Test user signup
# Visit https://www.consently.in/signup

# 5. Check Sentry dashboard
# Visit https://sentry.io/organizations/your-org/issues/

# 6. Monitor logs
# Check Vercel > Logs for any errors
```

---

## 🔍 Post-Launch Monitoring (First 24 Hours)

### Hour 1
- [ ] Check health endpoint every 5 minutes
- [ ] Monitor error rates in Sentry
- [ ] Verify widget loads on test sites
- [ ] Check API response times

### Hour 6
- [ ] Review all errors in Sentry
- [ ] Check user signup success rate
- [ ] Verify payment processing works
- [ ] Monitor database performance

### Hour 24
- [ ] Analyze first day metrics
- [ ] Review all customer feedback
- [ ] Check for any security alerts
- [ ] Verify all critical flows working

---

## 🚨 Rollback Plan

If issues are discovered:

### Quick Rollback (< 5 minutes)

```bash
# Vercel: Revert to previous deployment
vercel rollback

# Or via dashboard:
# Vercel > Deployments > Previous > Promote to Production
```

### Database Rollback (if needed)

```bash
# Supabase doesn't support automatic rollback
# Use point-in-time recovery:
# 1. Go to Supabase Dashboard > Database > Backups
# 2. Select backup before deployment
# 3. Restore (creates new project)
# 4. Update NEXT_PUBLIC_SUPABASE_URL to new project
# 5. Redeploy application
```

### Emergency Contact

- **On-call Engineer**: [Your phone/email]
- **Database Admin**: [DBA contact]
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.com

---

## 📊 Success Metrics

Track these metrics post-launch:

### Technical
- [ ] API response time < 200ms (p95)
- [ ] Error rate < 0.1%
- [ ] Uptime > 99.9%
- [ ] Database query time < 100ms (p95)

### Business
- [ ] User signup success rate > 95%
- [ ] Widget installation success rate > 90%
- [ ] Customer satisfaction score
- [ ] Support ticket volume

### Security
- [ ] No security incidents
- [ ] No data breaches
- [ ] All audit logs captured
- [ ] No unauthorized access attempts

---

## 🎯 Launch Phases

### Soft Launch (Week 1)
- 10-20 beta customers
- Daily monitoring
- Quick iteration on feedback
- Close support monitoring

### Beta Launch (Week 2-4)
- 50-100 customers
- Weekly reviews
- Feature refinement
- Support documentation

### Public Launch (Week 5+)
- Open to all
- Marketing push
- Full support coverage
- Monitoring at scale

---

## ✅ Final Checklist

Before launching:

- [ ] All critical issues from audit addressed
- [ ] Build passes without errors
- [ ] Health check returns 200
- [ ] Sentry receiving events
- [ ] Database indexes applied
- [ ] Environment variables set
- [ ] Domain DNS configured
- [ ] SSL certificate valid
- [ ] Team trained on monitoring
- [ ] Runbooks created
- [ ] Support process defined
- [ ] Marketing materials ready
- [ ] Legal documents finalized
- [ ] Pricing confirmed
- [ ] Payment gateway tested

---

**Last Updated**: January 9, 2026
**Status**: Ready for deployment after completing pending items
**Confidence**: High (critical fixes applied)
