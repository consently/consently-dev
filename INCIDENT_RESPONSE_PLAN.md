# 🚨 Incident Response Plan

## Quick Reference

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| P0 - Critical | 15 minutes | Immediate |
| P1 - High | 1 hour | Within 2 hours |
| P2 - Medium | 4 hours | Within 8 hours |
| P3 - Low | 24 hours | Next business day |

---

## Incident Severity Definitions

### P0 - Critical (Site Down)
- Complete site outage
- Database unavailable
- Data breach detected
- Payment system failure
- Authentication system down

**Response**: Drop everything, all hands on deck

### P1 - High (Major Feature Broken)
- Widget not loading for customers
- Consent recording failing
- Dashboard inaccessible
- Critical API errors > 10%

**Response**: Immediate attention, dedicated team

### P2 - Medium (Degraded Performance)
- Slow response times (> 2s)
- Intermittent errors
- Non-critical feature broken
- High error rates (1-10%)

**Response**: Prioritize, fix within business hours

### P3 - Low (Minor Issues)
- UI glitches
- Typos
- Non-critical feature requests
- Performance improvements

**Response**: Schedule for next sprint

---

## 🔴 P0 - Critical Incident Response

### Step 1: Detect (0-5 minutes)

**Triggers:**
- Uptime monitor alerts
- Sentry error spike alerts
- Customer reports
- Health check failures

**Actions:**
1. Acknowledge alert immediately
2. Post in #incidents Slack channel
3. Create incident ticket
4. Start incident timeline

### Step 2: Assess (5-15 minutes)

**Check:**
```bash
# 1. Health check
curl https://www.consently.in/api/health

# 2. Vercel deployment status
vercel ls

# 3. Supabase status
# Check: https://status.supabase.com/

# 4. Recent deployments
# Vercel dashboard > Deployments

# 5. Error dashboard
# Sentry > Issues
```

**Determine:**
- What's broken?
- How many users affected?
- When did it start?
- What changed recently?

### Step 3: Communicate (15-20 minutes)

**Internal:**
- Update #incidents with findings
- Notify leadership
- Assign incident commander

**External:**
- Post on status page
- Email affected customers (if applicable)
- Update support team

**Template:**
```
🚨 INCIDENT DETECTED

Severity: P0
Impact: [Description]
Affected: [Number/percentage of users]
Started: [Time]
Status: Investigating

We're working on a fix. Updates every 30 minutes.
```

### Step 4: Mitigate (20-30 minutes)

**Quick Fixes:**

1. **Rollback Deployment**
```bash
vercel rollback
# Or via Vercel dashboard
```

2. **Database Issues**
- Check connection pool limits
- Review recent migrations
- Check for long-running queries
```sql
-- Find blocking queries
SELECT * FROM pg_stat_activity 
WHERE state = 'active' AND wait_event IS NOT NULL;

-- Kill if necessary
SELECT pg_terminate_backend(pid);
```

3. **API Errors**
- Check rate limits
- Verify environment variables
- Review recent code changes

4. **Widget Issues**
- Verify widget files served correctly
- Check CORS headers
- Test widget on known-good site

### Step 5: Fix (30 minutes - 4 hours)

**Root Cause Analysis:**
1. Review error logs
2. Check Sentry breadcrumbs
3. Reproduce in staging
4. Identify exact cause

**Implement Fix:**
1. Create hotfix branch
2. Fix and test locally
3. Deploy to preview
4. Verify fix works
5. Deploy to production

**Verify:**
```bash
# Test all critical flows
1. User signup/login
2. Widget installation
3. Consent recording
4. Payment processing
5. Dashboard access
```

### Step 6: Monitor (4-24 hours)

- [ ] Error rates back to normal
- [ ] Response times normal
- [ ] Customer reports resolved
- [ ] Health check consistently green

### Step 7: Post-Mortem (Within 48 hours)

Document:
1. What happened?
2. When was it detected?
3. What was the impact?
4. What was the root cause?
5. How was it fixed?
6. How can we prevent this?
7. What did we learn?

---

## 🟡 P1 - High Priority Response

### Widget Not Loading

**Diagnose:**
```bash
# Check widget file
curl https://www.consently.in/dpdpa-widget.js | head -20

# Check CORS headers
curl -I https://www.consently.in/dpdpa-widget.js

# Test from customer site
# Open browser console on customer site
# Check for CORS or 404 errors
```

**Fix:**
- Verify file deployment
- Check CDN caching
- Clear cache if needed
- Redeploy if corrupted

### Consent Recording Failing

**Diagnose:**
```bash
# Check API health
curl https://www.consently.in/api/dpdpa/consent-record

# Check database
curl https://www.consently.in/api/health

# Review recent errors
# Sentry > Filter by endpoint
```

**Common Issues:**
- Database connection pool exhausted
- Rate limit too aggressive
- Validation schema too strict
- Widget ID mismatch

### Dashboard Inaccessible

**Diagnose:**
- Authentication service down?
- Database query timeout?
- Frontend build issue?

**Fix:**
- Check Supabase auth status
- Review slow queries
- Rollback if needed

---

## 🟢 Common Issues & Quick Fixes

### Issue: Slow Response Times

**Quick Fix:**
```bash
# 1. Check database
curl https://www.consently.in/api/health
# Look for slow response times

# 2. Check connection pool
# Supabase Dashboard > Database > Pooler

# 3. Clear Redis cache
curl https://www.consently.in/api/cache/clear
```

### Issue: High Error Rate

**Quick Fix:**
```bash
# 1. Check Sentry for error patterns
# 2. Look for recent deployments
# 3. Rollback if deployment caused it
vercel rollback
```

### Issue: Payment Failures

**Quick Fix:**
```bash
# 1. Check Razorpay status
# https://status.razorpay.com/

# 2. Verify webhook secrets
# Ensure RAZORPAY_WEBHOOK_SECRET is correct

# 3. Check payment logs
# Razorpay Dashboard > Payments
```

### Issue: Email Not Sending

**Quick Fix:**
```bash
# 1. Check Resend status
# 2. Verify RESEND_API_KEY
# 3. Check email logs
curl https://www.consently.in/api/emails/logs
```

---

## 🛠️ Debugging Tools

### View Real-Time Logs

```bash
# Vercel CLI
vercel logs --follow

# Or in dashboard:
# Vercel > Project > Logs > Runtime Logs
```

### Database Queries

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, state, wait_event, query_start
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < NOW() - INTERVAL '5 seconds'
ORDER BY query_start;

-- Index usage
SELECT * FROM index_usage_stats
WHERE scans < 100;

-- Table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Check Service Status

- **Vercel**: https://www.vercel-status.com/
- **Supabase**: https://status.supabase.com/
- **Razorpay**: https://status.razorpay.com/
- **Resend**: https://resend.com/status

---

## 📞 Contact Information

### Internal Team

- **Tech Lead**: [Name] - [Phone] - [Email]
- **Backend Lead**: [Name] - [Phone] - [Email]
- **DevOps**: [Name] - [Phone] - [Email]
- **Database Admin**: [Name] - [Phone] - [Email]

### External Support

- **Vercel**: support@vercel.com
- **Supabase**: support@supabase.com
- **Razorpay**: support@razorpay.com
- **Sentry**: support@sentry.io

---

## 🔄 Incident Communication Template

### Status Page Update

```markdown
## [TIMESTAMP] - Investigating

We are currently investigating reports of [ISSUE DESCRIPTION].

Status: Investigating
Impact: [Percentage] of users
Started: [TIME]

Updates will be posted every 30 minutes.
```

### Customer Email Template

```markdown
Subject: Service Status Update - [Date]

Dear Consently Customer,

We're writing to inform you about a service issue affecting [FEATURE/SERVICE].

**What happened:**
[Brief description]

**Impact:**
[Who/what is affected]

**Status:**
[Current status - investigating/fixing/resolved]

**Expected Resolution:**
[Timeline or "working on it"]

We apologize for any inconvenience. Our team is working to resolve this as quickly as possible.

Updates: [Status page URL]

Best regards,
The Consently Team
```

---

## 📊 Incident Metrics to Track

- Time to detect (target: < 5 minutes)
- Time to acknowledge (target: < 15 minutes)
- Time to mitigate (target: < 1 hour for P0)
- Time to resolve (target: < 4 hours for P0)
- Customer impact (number of users)
- Revenue impact (if applicable)

---

## 🎓 Training

Ensure all team members:
- Know how to access monitoring dashboards
- Can read and interpret alerts
- Understand escalation procedures
- Know how to rollback deployments
- Can access production logs
- Have necessary credentials

---

**Last Updated**: January 9, 2026
**Review Frequency**: Monthly
**Owner**: Tech Lead
